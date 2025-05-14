from fastapi import APIRouter, HTTPException, Request, Query
from typing import List
from app.db.connection import get_db_connection
import math
import requests
import os
import openai
from typing import List
from app.db.connection import get_db_connection
from app.schemas import (
    StationBase,
    StationOut,
    StationWithPriceOut,
    PriceBase,
    PriceCreatedOut,
    RoutePlanRequest,
    RoutePlanResponse,
    FeedbackRequest
)

router = APIRouter()


# Create a station
from psycopg2 import IntegrityError


@router.post("/", response_model=StationOut, status_code=201)
def create_station(s: StationBase):
    conn = get_db_connection()
    cur = conn.cursor()
    try:
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
        return StationOut(id=row[0], name=row[1], latitude=row[2], longitude=row[3])
    except IntegrityError:
        conn.rollback()
        raise HTTPException(
            status_code=400,
            detail="A station with the same latitude and longitude already exists.",
        )
    finally:
        cur.close()
        conn.close()


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
@router.post("/{station_id}/prices", response_model=PriceCreatedOut, status_code=201)
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
    return PriceCreatedOut(
        id=row[0],
        station_id=row[1],
        price=row[2],
        recorded_at=row[3],
    )


# Kalelo


def haversine(lat1, lon1, lat2, lon2):
    R = 6371
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (
        math.sin(dlat / 2) ** 2
        + math.cos(math.radians(lat1))
        * math.cos(math.radians(lat2))
        * math.sin(dlon / 2) ** 2
    )
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c


# --- Utility: Haversine formula ---
def haversine(lat1, lon1, lat2, lon2):
    R = 6371
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (
        math.sin(dlat / 2) ** 2
        + math.cos(math.radians(lat1))
        * math.cos(math.radians(lat2))
        * math.sin(dlon / 2) ** 2
    )
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c


# --- Route: Plan route with gas stops ---
@router.post("/plan-route", response_model=RoutePlanResponse)
def plan_route(request: RoutePlanRequest):
    api_key = os.getenv("GOOGLE_MAPS_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="Missing Google Maps API key")

    conn = get_db_connection()
    cur = conn.cursor()

    # Step 1: Fetch all stations with latest price
    cur.execute(
        """
        SELECT
            s.id, s.name, s.latitude, s.longitude,
            (
              SELECT price FROM prices
              WHERE station_id = s.id
              ORDER BY recorded_at DESC LIMIT 1
            ) AS latest_price
        FROM stations s
        WHERE (
            SELECT price FROM prices WHERE station_id = s.id ORDER BY recorded_at DESC LIMIT 1
        ) IS NOT NULL;
    """
    )
    rows = cur.fetchall()
    columns = [col[0] for col in cur.description]
    stations = [dict(zip(columns, row)) for row in rows]
    cur.close()
    conn.close()

    current = (request.current_lat, request.current_lon)
    dest = (request.destination_lat, request.destination_lon)
    direct_distance = haversine(*current, *dest)

    # Step 2: Filter stations by detour
    valid = []
    for s in stations:
        station_loc = (s["latitude"], s["longitude"])
        to_station = haversine(*current, *station_loc)
        from_station = haversine(*station_loc, *dest)
        detour = to_station + from_station - direct_distance

        if detour <= request.max_detour_km:
            valid.append(
                {
                    "id": s["id"],
                    "name": s["name"],
                    "latitude": s["latitude"],
                    "longitude": s["longitude"],
                    "latest_price": s["latest_price"],
                    "detour_km": round(detour, 2),
                    "prices": [],
                    "recorded_at": None,
                }
            )

    # Step 3: Pick up to N cheapest stations
    best_stops = sorted(valid, key=lambda x: x["latest_price"])[: request.num_stations]

    # Step 4: Build Directions API call
    waypoints_str = "|".join([f"{s['latitude']},{s['longitude']}" for s in best_stops])
    params = {
        "origin": f"{request.current_lat},{request.current_lon}",
        "destination": f"{request.destination_lat},{request.destination_lon}",
        "waypoints": waypoints_str,
        "key": api_key,
    }

    url = "https://maps.googleapis.com/maps/api/directions/json"
    resp = requests.get(url, params=params).json()

    if resp["status"] != "OK":
        raise HTTPException(status_code=500, detail="Google Directions API failed")

    route = resp["routes"][0]
    total_distance = sum(leg["distance"]["value"] for leg in route["legs"]) / 1000
    total_duration = sum(leg["duration"]["value"] for leg in route["legs"]) / 60
    polyline = route["overview_polyline"]["points"]

    return RoutePlanResponse(
        route_polyline=polyline,
        total_distance_km=round(total_distance, 2),
        total_duration_min=round(total_duration, 1),
        waypoints=best_stops,
    )


# This will be changed lated should we want to add a populate nearby to
# add gas stations to the database.
@router.post("/populate-nearby")
async def populate_nearby(request: Request):
    """
    Dummy route that accepts user coordinates and always returns success.
    """
    body = await request.json()
    print("Received /populate-nearby request:", body)
    return {"status": "ok"}



# get info on a single station
@router.get("/{station_id}", response_model=StationWithPriceOut)
def get_station_by_id(station_id: int):
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
              SELECT price FROM prices WHERE station_id = s.id ORDER BY recorded_at DESC LIMIT 1
            ) AS latest_price,
            (
              SELECT recorded_at FROM prices WHERE station_id = s.id ORDER BY recorded_at DESC LIMIT 1
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
        WHERE s.id = %s
        """,
        (station_id,)
    )
    row = cur.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Station not found")

    columns = [col[0] for col in cur.description]
    row_dict = dict(zip(columns, row))
    cur.close()
    conn.close()

    return {
        "id": row_dict["id"],
        "name": row_dict["name"],
        "latitude": row_dict["latitude"],
        "longitude": row_dict["longitude"],
        "latest_price": row_dict["latest_price"],
        "recorded_at": row_dict["recorded_at"],
        "prices": row_dict["prices"],
    }




@router.post("/station-sentiment")
def get_sentiment(data: FeedbackRequest):
    # Step 1: Get place ID from Google Maps Place Search
    gmaps_key = os.getenv("GOOGLE_MAPS_API_KEY")
    openai_key = os.getenv("OPENAI_API_KEY")
    if not gmaps_key or not openai_key:
        raise HTTPException(status_code=500, detail="Missing API keys.")

    place_search_url = (
        f"https://maps.googleapis.com/maps/api/place/nearbysearch/json"
        f"?location={data.latitude},{data.longitude}&radius=50"
        f"&keyword={data.name}&key={gmaps_key}"
    )
    res = requests.get(place_search_url).json()
    place_id = res["results"][0]["place_id"] if res["results"] else None
    if not place_id:
        raise HTTPException(status_code=404, detail="Place not found.")

    # Step 2: Get latest reviews
    details_url = (
        f"https://maps.googleapis.com/maps/api/place/details/json"
        f"?place_id={place_id}&fields=review&key={gmaps_key}"
    )
    reviews_res = requests.get(details_url).json()
    reviews = reviews_res.get("result", {}).get("reviews", [])

    if not reviews:
        return {"summary": "No reviews found."}

    review_texts = [r["text"] for r in reviews[:10]]
    prompt = (
        "Analyze the sentiment of the following customer reviews for a gas station. "
        "Summarize the overall tone and any common praise or complaints:\n\n" +
        "\n\n".join(review_texts)
    )

    openai.api_key = openai_key
    try:
        response = openai.chat.completions.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": "You are a sentiment analysis assistant."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
        )
        summary = response.choices[0].message.content.strip()
        return {"summary": summary}
    except Exception as e:
        print("OpenAI Error:", str(e))
        raise HTTPException(status_code=500, detail="Sentiment analysis failed.")
