from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from datetime import datetime
from typing import List, Optional
from app.db.connection import get_db_connection

router = APIRouter()


# Pydantic schemas
class StationBase(BaseModel):
    name: str
    latitude: float
    longitude: float


class StationOut(StationBase):
    id: int


class PriceOut(BaseModel):
    price: float
    recorded_at: datetime


class StationWithPriceOut(StationBase):
    id: int
    latest_price: Optional[float]
    recorded_at: Optional[datetime]
    prices: List[PriceOut]


class PriceBase(BaseModel):
    price: float


class PriceOut(PriceBase):
    id: int
    station_id: int
    recorded_at: datetime


# Create a station
@router.post("/", response_model=StationOut, status_code=201)
def create_station(s: StationBase):
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute(
        """
        INSERT INTO stations (name, latitude, longitude)
        VALUES (%s, %s, %s)
        RETURNING id, name, latitude, longitude
        """,
        (s.name, s.latitude, s.longitude),
    )
    row = cur.fetchone()
    conn.commit()
    cur.close()
    conn.close()
    return StationOut(id=row[0], name=row[1], latitude=row[2], longitude=row[3])


# List all stations with their most recent price (if any)
@router.get("/", response_model=List[StationWithPriceOut])
def list_stations():
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute(
        """
        SELECT
            s.id,
            s.name,
            s.latitude,
            s.longitude,
            -- latest single price
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
            -- full price history as JSON array
            COALESCE(
              (
                SELECT JSON_AGG(
                  JSON_BUILD_OBJECT(
                    'price', p.price,
                    'recorded_at', p.recorded_at
                  )
                  ORDER BY p.recorded_at DESC
                )
                FROM prices p
                WHERE p.station_id = s.id
              ),
              '[]'
            ) AS prices
        FROM stations s
        ORDER BY s.id;
    """
    )
    rows = cur.fetchall()
    # build a list of column names in order
    columns = [col[0] for col in cur.description]
    result = []
    for row in rows:
        # zip together names and values into a dict
        row_dict = dict(zip(columns, row))
        result.append(
            {
                "id": row_dict["id"],
                "name": row_dict["name"],
                "latitude": row_dict["latitude"],
                "longitude": row_dict["longitude"],
                "latest_price": row_dict["latest_price"],
                "recorded_at": row_dict["recorded_at"],
                "prices": row_dict["prices"],
            }
        )
    return result


# Add a price record to a station
@router.post("/{station_id}/prices", response_model=PriceOut, status_code=201)
def add_price(station_id: int, p: PriceBase):
    conn = get_db_connection()
    cur = conn.cursor()
    # ensure station exists
    cur.execute("SELECT 1 FROM stations WHERE id = %s", (station_id,))
    if cur.fetchone() is None:
        cur.close()
        conn.close()
        raise HTTPException(status_code=404, detail="Station not found")

    cur.execute(
        """
        INSERT INTO prices (station_id, price)
        VALUES (%s, %s)
        RETURNING id, station_id, price, recorded_at
        """,
        (station_id, p.price),
    )
    row = cur.fetchone()
    conn.commit()
    cur.close()
    conn.close()
    return PriceOut(
        id=row[0],
        station_id=row[1],
        price=row[2],
        recorded_at=row[3],
    )
