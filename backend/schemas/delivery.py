# File: schemas/delivery.py
from pydantic import BaseModel, Field, field_validator
from typing import List, Optional
from datetime import datetime
from core.product_types import normalize_product_type

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
    product_type: str = "PARCEL"
    est_weight: Optional[float] = None
    est_quantity: Optional[int] = None
    is_vehicle_required: Optional[bool] = False
    priority: str = Field(default="NORMAL", description="NORMAL, URGENT, VIP, HT")
    sla_deadline: Optional[datetime] = None
    notes: Optional[str] = None

    @field_validator("product_type", mode="before")
    @classmethod
    def validate_product_type(cls, value):
        return normalize_product_type(value)

class BookingRequestAssignRequest(BaseModel):
    shipper_id: int
    note: Optional[str] = None

class OnlinePickupConfirmHubRequest(BaseModel):
    request_ids: List[int] = Field(min_length=1)
    hub_id: int
    note: Optional[str] = None

class OnlinePickupDispatchHubRequest(BaseModel):
    request_ids: List[int] = Field(min_length=1)
    hub_id: int
    note: Optional[str] = None

class HubDispatchDecisionRequest(BaseModel):
    note: Optional[str] = None

class HubDispatchRejectRequest(BaseModel):
    note: str = Field(min_length=1)

class PickupPickedRequest(BaseModel):
    pickup_image_url: Optional[str] = None
    note: Optional[str] = None

class ShipperAvailabilityRequest(BaseModel):
    is_online: bool
    note: Optional[str] = None

class ShipperAvailabilityResponse(BaseModel):
    status: str
    shipper_id: int
    is_online: bool
    online_status_updated_at: datetime
    last_seen_at: Optional[datetime] = None

class MobileShipperLocationRequest(BaseModel):
    latitude: float = Field(..., description="Vĩ độ")
    longitude: float = Field(..., description="Kinh độ")
    timestamp: Optional[datetime] = Field(default_factory=datetime.utcnow)
    accuracy: Optional[float] = Field(None, description="Độ chính xác GPS theo mét")
    note: Optional[str] = None

class MobilePickupTaskResponse(BaseModel):
    request_id: int
    request_code: str
    waybill_id: Optional[int] = None
    waybill_code: Optional[str] = None
    bill_code: Optional[str] = None
    pickup_status: Optional[str] = None
    waybill_status: Optional[str] = None
    shop_order_code: Optional[str] = None
    customer_id: Optional[int] = None
    customer_code: Optional[str] = None
    customer_name: Optional[str] = None
    sender_name: Optional[str] = None
    sender_phone: Optional[str] = None
    pickup_address: Optional[str] = None
    receiver_name: Optional[str] = None
    receiver_phone: Optional[str] = None
    receiver_address: Optional[str] = None
    target_hub_id: Optional[int] = None
    target_hub_name: Optional[str] = None
    assigned_shipper_id: Optional[int] = None
    assigned_shipper_name: Optional[str] = None
    product_type: Optional[str] = None
    product_name: Optional[str] = None
    est_weight: Optional[float] = None
    est_quantity: Optional[int] = None
    cod_amount: float = 0
    payment_method: Optional[str] = None
    service_type: Optional[str] = None
    note: Optional[str] = None
    pickup_image_url: Optional[str] = None
    price_status: Optional[str] = None
    estimated_shipping_fee: float = 0
    estimated_total_amount: float = 0
    final_shipping_fee: Optional[float] = None
    final_total_amount: Optional[float] = None
    requested_pickup_time: Optional[datetime] = None
    pickup_assigned_at: Optional[datetime] = None
    created_at: Optional[datetime] = None

class BookingRequestLogResponse(BaseModel):
    log_id: int
    user_id: Optional[int]
    action: str
    note: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


# --- NEW: REASSIGN & LOCATION SCHEMAS ---

class ReassignWaybillRequest(BaseModel):
    """Schema cho API điều chuyển vận đơn"""
    waybill_id: int
    new_hub_id: Optional[int] = Field(None, description="Hub đích mới (nếu điều chuyển sang hub khác)")
    new_shipper_id: Optional[int] = Field(None, description="Shipper mới (nếu giao lại cho shipper khác)")
    reason: str = Field(..., description="Lý do điều chuyển (e.g., 'address_error', 'customer_request', 'overload')")
    note: Optional[str] = Field(None, description="Ghi chú thêm về điều chuyển")


class ShipperLocationRequest(BaseModel):
    """Schema cho API lưu vị trí GPS của Shipper"""
    shipper_id: int
    latitude: float = Field(..., description="Vĩ độ")
    longitude: float = Field(..., description="Kinh độ")
    timestamp: Optional[datetime] = Field(default_factory=datetime.utcnow, description="Thời gian ghi nhận vị trí")
    accuracy: Optional[float] = Field(None, description="Độ chính xác của GPS (mét)")
    note: Optional[str] = Field(None, description="Ghi chú (e.g., 'at_customer', 'on_route')")


class ReassignWaybillResponse(BaseModel):
    """Response cho API điều chuyển"""
    status: str  # "SUCCESS", "FAILED"
    waybill_code: str
    message: str
    new_holder: Optional[str] = None  # Tên kho/shipper mới
    
    class Config:
        from_attributes = True


class ShipperLocationResponse(BaseModel):
    """Response cho API lưu vị trí"""
    status: str  # "SUCCESS", "FAILED"
    shipper_id: int
    message: str
    timestamp: datetime

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
    dispatched_by_user_id: Optional[int] = None
    dispatched_at: Optional[datetime] = None
    dispatch_note: Optional[str] = None
    rejected_by_user_id: Optional[int] = None
    rejected_at: Optional[datetime] = None
    rejection_note: Optional[str] = None
    bag_code: Optional[str] = None
    bag_item_count: Optional[int] = None
    total_estimated_weight: Optional[float] = None
    latest_request_at: Optional[datetime] = None

    class Config:
        from_attributes = True
