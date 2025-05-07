from fastapi import APIRouter, Depends, HTTPException
from typing import List
from app.db.connection import get_db_connection
from app.routes.auth import get_current_user_id
from app.schemas import (
    StationWithPriceOut,
    PriceHistoryItem,
)

router = APIRouter()


@router.post("/{station_id}")
async def add_favorite(
    station_id: int,
    user_id: int = Depends(get_current_user_id),
):
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        cur.execute(
            """
            INSERT INTO favorites (user_id, station_id)
            VALUES (%s, %s)
            ON CONFLICT DO NOTHING
            """,
            (user_id, station_id),
        )
        conn.commit()
    except Exception:
        conn.rollback()
        raise HTTPException(500, "Could not save favorite")
    finally:
        cur.close()
        conn.close()

    return {"ok": True, "station_id": station_id}


@router.delete("/{station_id}")
async def remove_favorite(
    station_id: int,
    user_id: int = Depends(get_current_user_id),
):
    """
    Remove a station from the current user’s favorites.
    """
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        cur.execute(
            """
            DELETE FROM favorites
             WHERE user_id = %s
               AND station_id = %s
            """,
            (user_id, station_id),
        )
        if cur.rowcount == 0:
            # nothing to delete
            raise HTTPException(404, "Favorite not found")
        conn.commit()
    except HTTPException:
        conn.rollback()
        raise
    except Exception:
        conn.rollback()
        raise HTTPException(500, "Could not remove favorite")
    finally:
        cur.close()
        conn.close()
    return {"ok": True, "station_id": station_id}


@router.get("/", response_model=List[StationWithPriceOut])
async def list_favorites(
    user_id: int = Depends(get_current_user_id),
):
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        cur.execute(
            """
            SELECT
              s.id,
              s.name,
              s.latitude,
              s.longitude,
              (
                SELECT price
                FROM prices
                WHERE station_id = s.id
                ORDER BY recorded_at DESC
                LIMIT 1
              ) AS latest_price,
              (
                SELECT recorded_at
                FROM prices
                WHERE station_id = s.id
                ORDER BY recorded_at DESC
                LIMIT 1
              ) AS recorded_at,
              COALESCE(
                (
                  SELECT JSON_AGG(
                           JSON_BUILD_OBJECT(
                             'price',       p.price,
                             'recorded_at', p.recorded_at
                           )
                           ORDER BY p.recorded_at DESC
                         )
                  FROM prices p
                  WHERE p.station_id = s.id
                ),
                '[]'::json
              ) AS prices
            FROM stations s
            JOIN favorites f
              ON f.station_id = s.id
            WHERE f.user_id = %s
            ORDER BY s.id;
            """,
            (user_id,),
        )
        rows = cur.fetchall()
    except Exception as e:
        conn.rollback()
        raise HTTPException(500, f"DB error: {e}")
    finally:
        cur.close()
        conn.close()

    result: List[StationWithPriceOut] = []
    for id_, name, lat, lng, latest, rec_at, prices_json in rows:
        result.append(
            StationWithPriceOut(
                id=id_,
                name=name,
                latitude=lat,
                longitude=lng,
                latest_price=float(latest) if latest is not None else None,
                recorded_at=rec_at,
                prices=[PriceHistoryItem(**p) for p in prices_json],
            )
        )

    return result
