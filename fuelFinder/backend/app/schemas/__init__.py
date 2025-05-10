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


class StationWithPriceOut(BaseModel):
    id: int
    name: str
    latitude: float
    longitude: float
    latest_price: Optional[float]
    recorded_at: Optional[datetime]
    prices: List[dict]

class PriceBase(BaseModel):
    price: float


class PriceCreatedOut(PriceBase):
    id: int
    station_id: int
    recorded_at: datetime


class LocationIn(BaseModel):
    latitude: float
    longitude: float
