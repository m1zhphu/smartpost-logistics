# File: schemas/delivery.py
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

class AssignShipperRequest(BaseModel):
    waybill_codes: List[str]
    shipper_id: int

class DeliverySuccessRequest(BaseModel):
    waybill_code: str
    actual_cod_collected: float = Field(ge=0)
    pod_image_url: Optional[str] = None
    note: str = "Giao hàng thành công"

class DeliveryFailureRequest(BaseModel):
    waybill_code: str
    reason_code: str # Phải thuộc danh sách chuẩn hóa ở trên
    note: Optional[str] = None

# --- PICKUP REQUEST (BOOKING REQUEST) SCHEMAS ---

class BookingRequestCreate(BaseModel):
    customer_id: int
    source: str = Field(default="CSKH", description="CSKH, PORTAL, HOTLINE, ZALO, API")
    shop_order_code: Optional[str] = None
    sender_phone: Optional[str] = None
    pickup_address: Optional[str] = None
    target_hub_id: Optional[int] = None
    product_type: Optional[str] = None
    est_weight: Optional[float] = None
    est_quantity: Optional[int] = None
    is_vehicle_required: Optional[bool] = False
    priority: str = Field(default="NORMAL", description="NORMAL, URGENT, VIP, HT")
    sla_deadline: Optional[datetime] = None
    notes: Optional[str] = None

class BookingRequestAssignRequest(BaseModel):
    shipper_id: int

class BookingRequestLogResponse(BaseModel):
    log_id: int
    user_id: Optional[int]
    action: str
    note: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True

class BookingRequestResponse(BaseModel):
    request_id: int
    request_code: str
    source: Optional[str]
    shop_order_code: Optional[str]
    customer_id: Optional[int]
    customer_code: Optional[str] = None
    customer_name: Optional[str] = None
    sender_phone: Optional[str]
    pickup_address: Optional[str]
    target_hub_id: Optional[int]
    product_type: Optional[str]
    est_weight: Optional[float]
    est_quantity: Optional[int]
    is_vehicle_required: Optional[bool]
    status: Optional[str]
    assigned_shipper_id: Optional[int]
    assigned_shipper_name: Optional[str] = None
    priority: Optional[str]
    sla_deadline: Optional[datetime]
    notes: Optional[str]
    logs: List[BookingRequestLogResponse] = []

    class Config:
        from_attributes = True