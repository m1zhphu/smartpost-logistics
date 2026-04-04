# File: schemas/waybills.py
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

class WaybillCreate(BaseModel):
    customer_id: Optional[int] = Field(default=None, description="ID của khách hàng/người gửi")
    receiver_name: str
    receiver_phone: str
    receiver_address: str
    origin_hub_id: int
    dest_hub_id: int
    actual_weight: float = Field(gt=0, description="Khối lượng thực tế phải > 0")
    cod_amount: float = Field(default=0.0)
    service_type: str = Field(default="STANDARD")

class TrackingLogResponse(BaseModel):
    status_id: str
    hub_id: Optional[int]
    note: Optional[str]
    system_time: datetime

    class Config:
        from_attributes = True

class WaybillTrackingResponse(BaseModel):
    waybill_info: dict
    history: List[TrackingLogResponse]

class PublicWaybillInfo(BaseModel):
    waybill_code: str
    status: str
    origin_hub_name: Optional[str]
    dest_hub_name: Optional[str]
    created_at: datetime

class PublicTrackingResponse(BaseModel):
    waybill_info: PublicWaybillInfo
    history: List[TrackingLogResponse] # Dùng lại log đã có

class WaybillFilter(BaseModel):
    waybill_code: Optional[str] = None
    status: Optional[str] = None
    origin_hub_id: Optional[int] = None
    dest_hub_id: Optional[int] = None
    customer_id: Optional[int] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    page: int = 1
    size: int = 20