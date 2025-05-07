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
