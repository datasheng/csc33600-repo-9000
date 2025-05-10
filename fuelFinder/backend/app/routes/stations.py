from fastapi import APIRouter, HTTPException, Query
from typing import List
import os
import requests
from app.db.connection import get_db_connection

from app.schemas import (
    StationBase,
    StationOut,
    StationWithPriceOut,
    PriceBase,
    PriceCreatedOut,
    LocationIn,              # <— added import
)

router = APIRouter()

# Google Places API config
GOOGLE_PLACES_URL = "https://maps.googleapis.com/maps/api/place/nearbysearch/json"
API_KEY = os.getenv("GOOGLE_MAPS_API_KEY")
_places = os.getenv("GOOGLE_MAPS_API_KEY")


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
    columns = [col[0] for col in cur.description]
    result: List[StationWithPriceOut] = []

    for row in rows:
        row_dict = dict(zip(columns, row))
        result.append(
            StationWithPriceOut(
                id=row_dict["id"],
                name=row_dict["name"],
                latitude=row_dict["latitude"],
                longitude=row_dict["longitude"],
                latest_price=row_dict["latest_price"],
                recorded_at=row_dict["recorded_at"],
                prices=row_dict["prices"],         # <— include the JSON prices array
            )
        )

    cur.close()
    conn.close()
    return result


# Add a price record to a station
@router.post("/{station_id}/prices", response_model=PriceCreatedOut, status_code=201)
def add_price(station_id: int, p: PriceBase):
    conn = get_db_connection()
    cur = conn.cursor()
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
    return PriceCreatedOut(
        id=row[0],
        station_id=row[1],
        price=row[2],
        recorded_at=row[3],
    )


# Populate DB on demand from Google Places, per-user freshness
@router.post("/populate-nearby", response_model=List[StationOut])
def populate_nearby(loc: LocationIn):
    """Fetch nearby gas stations from Google, insert any new ones, and return all."""
    conn = get_db_connection()
    cur = conn.cursor()

    # call Google Places API
    resp = requests.get(
        GOOGLE_PLACES_URL,
        params={
            "key": API_KEY,
            "location": f"{loc.latitude},{loc.longitude}",
            "radius": 5000,
            "type": "gas_station",
        },
    )
    places = resp.json().get("results", [])

    inserted: List[StationOut] = []
    for p in places:
        name = p["name"]
        lat = p["geometry"]["location"]["lat"]
        lng = p["geometry"]["location"]["lng"]
        try:
            cur.execute(
                """
                INSERT INTO stations (name, latitude, longitude)
                VALUES (%s, %s, %s)
                RETURNING id, name, latitude, longitude
                """,
                (name, lat, lng),
            )
            row = cur.fetchone()
        except Exception:
            # likely a duplicate, roll back and select existing
            conn.rollback()
            cur.execute(
                "SELECT id, name, latitude, longitude FROM stations WHERE latitude = %s AND longitude = %s",
                (lat, lng),
            )
            row = cur.fetchone()

        if row:
            inserted.append(
                StationOut(id=row[0], name=row[1], latitude=row[2], longitude=row[3])
            )

    conn.commit()
    cur.close()
    conn.close()
    return inserted
