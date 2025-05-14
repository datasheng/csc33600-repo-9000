from pydantic import BaseModel
from datetime import datetime
from typing import List, Optional


# Pydantic schemas
class StationBase(BaseModel):
    name: str
    latitude: float
    longitude: float


class StationOut(StationBase):
    id: int


class PriceHistoryItem(BaseModel):
    price: float
    recorded_at: datetime


class StationWithPriceOut(StationBase):
    id: int
    latest_price: Optional[float]
    recorded_at: Optional[datetime]
    prices: List[PriceHistoryItem]


class PriceBase(BaseModel):
    price: float


class PriceCreatedOut(PriceBase):
    id: int
    station_id: int
    recorded_at: datetime


class PitStopRequest(BaseModel):
    current_lat: float
    current_lon: float
    destination_lat: float
    destination_lon: float
    max_detour_km: float = 20  # Optional with default


class RoutePlanRequest(BaseModel):
    current_lat: float
    current_lon: float
    destination_lat: float
    destination_lon: float
    max_detour_km: float = 20
    num_stations: int = 3


class RoutePlanResponse(BaseModel):
    route_polyline: str
    total_distance_km: float
    total_duration_min: float
    waypoints: List[StationWithPriceOut]


class TrafficLog(BaseModel):
    latitude: float
    longitude: float
