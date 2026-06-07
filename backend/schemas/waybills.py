from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

class WaybillCreate(BaseModel):
    customer_id: Optional[int] = Field(default=None, description="ID của khách hàng/người gửi")
    receiver_name: str
    receiver_phone: str
    receiver_address: str
    origin_hub_id: Optional[int] = None
    dest_hub_id: Optional[int] = None
    actual_weight: float = Field(gt=0, description="Khối lượng khai báo khi tạo đơn - hiện trên hóa đơn in ra")
    cod_amount: float = Field(default=0.0)
    service_type: str = Field(default="STANDARD")
    
    # Bổ sung các trường từ UI 
    product_name: Optional[str] = None
    payment_method: Optional[str] = "SENDER_PAY"
    note: Optional[str] = None
    extra_services: Optional[List[str]] = []
    
    # ĐÃ BỔ SUNG: Trường này bắt buộc phải có để Backend nhận tiền từ Frontend gửi xuống
    shipping_fee: float = Field(default=0.0, description="Phí vận chuyển tính từ Frontend")

    # Bổ sung phục vụ Tạo Bill thông minh
    sender_name: Optional[str] = Field(default=None, description="Tên người gửi thực tế")
    sender_phone: Optional[str] = Field(default=None, description="SĐT người gửi")
    sender_address: Optional[str] = Field(default=None, description="Địa chỉ gửi")
    length: Optional[float] = Field(default=None, description="Chiều dài (cm)")
    width: Optional[float] = Field(default=None, description="Chiều rộng (cm)")
    height: Optional[float] = Field(default=None, description="Chiều cao (cm)")

class CustomerPickupAddress(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    address: str
    province_id: Optional[int] = None
    district_id: Optional[int] = None
    ward_id: Optional[int] = None
    province_name: Optional[str] = None
    district_name: Optional[str] = None
    ward_name: Optional[str] = None


class CustomerPickupItem(BaseModel):
    product_group: str = Field(default="PARCEL")
    product_name: Optional[str] = None
    description: Optional[str] = None
    weight: float = Field(gt=0)
    length: Optional[float] = Field(default=None, ge=0)
    width: Optional[float] = Field(default=None, ge=0)
    height: Optional[float] = Field(default=None, ge=0)
    quantity: int = Field(default=1, ge=1)
    declared_value: Optional[float] = Field(default=None, ge=0)


class CustomerPickupDocument(BaseModel):
    document_code: Optional[str] = None
    document_name: str
    quantity: int = Field(default=1, ge=1)
    note: Optional[str] = None


class CustomerPickupExtraService(BaseModel):
    service_code: str
    service_name: Optional[str] = None
    service_fee: float = Field(default=0, ge=0)


class CustomerPickupCreate(BaseModel):
    order_type: str = Field(default="DOMESTIC")
    shop_order_code: Optional[str] = None
    pickup_time: Optional[datetime] = None
    sender: CustomerPickupAddress
    receiver: CustomerPickupAddress
    items: List[CustomerPickupItem] = Field(min_length=1)
    documents: Optional[List[CustomerPickupDocument]] = Field(default_factory=list)
    cod_amount: float = Field(default=0, ge=0)
    cod_receiver_pays_fee: bool = False
    cod_fee_payment_method: Optional[str] = None
    service_type: str = Field(default="STANDARD")
    extra_services: Optional[List[CustomerPickupExtraService]] = Field(default_factory=list)
    delivery_note_option: Optional[str] = None
    note: Optional[str] = None
    payment_method: str = Field(default="SENDER_DEBT")
    pickup_method: str = Field(default="OUR_STAFF_PICKUP")
    delivery_method: str = Field(default="OUR_STAFF_DELIVERY")
    save_as_draft: bool = False


class CustomerPickupCreateResponse(BaseModel):
    waybill_id: int
    waybill_code: str
    bill_code: str
    request_id: int
    request_code: str
    status: str
    pickup_status: str
    office_status: Optional[str] = None
    price_status: Optional[str] = None
    shipping_fee: float
    extra_services_fee: float
    vat_amount: float
    total_amount_to_collect: float
    estimated_shipping_fee: Optional[float] = None
    estimated_vat_amount: Optional[float] = None
    estimated_total_amount: Optional[float] = None


class CustomerPickupSummary(BaseModel):
    request_id: int
    request_code: str
    waybill_id: int
    waybill_code: str
    bill_code: str
    pickup_status: Optional[str]
    waybill_status: Optional[str]
    office_status: str
    hub_id: Optional[int] = None
    hub_name: Optional[str] = None
    assigned_shipper_id: Optional[int] = None
    assigned_shipper_name: Optional[str] = None
    price_status: Optional[str]
    estimated_shipping_fee: float = 0
    estimated_total_amount: float = 0
    final_shipping_fee: Optional[float] = None
    final_total_amount: Optional[float] = None
    created_at: Optional[datetime] = None


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


# === NEW: WAYBILL RESPONSE SCHEMAS WITH SLA INFO ===

class WaybillResponse(BaseModel):
    """Schema trả về chi tiết vận đơn với các trường SLA"""
    waybill_id: int
    waybill_code: str
    status: str
    receiver_name: Optional[str]
    receiver_phone: Optional[str]
    receiver_address: Optional[str]
    cod_amount: float
    shipping_fee: float
    actual_weight: float
    service_type: Optional[str]
    product_name: Optional[str]
    note: Optional[str]
    
    # Hub and Shipper Info
    origin_hub_id: Optional[int]
    origin_hub_name: Optional[str]
    dest_hub_id: Optional[int]
    dest_hub_name: Optional[str]
    holding_hub_id: Optional[int]
    holding_hub_name: Optional[str]
    holding_shipper_id: Optional[int]
    holding_shipper_name: Optional[str]
    
    # SLA Fields
    sla_deadline: Optional[datetime]
    sla_status: str  # ON_TIME, WARNING, OVERDUE
    sla_remaining_hours: Optional[float]  # Số giờ còn lại
    current_holder: Optional[str]  # Tên kho hoặc tên shipper đang giữ
    action_by: Optional[str]  # Hành động cuối cùng bởi ai
    
    class Config:
        from_attributes = True


class WaybillTimelineItem(BaseModel):
    """Mỗi item trong timeline lịch sử vận đơn"""
    time: str  # Format: "08:00 22/05"
    action: str  # Hành động (Tạo đơn, Nhập kho, Phân công, v.v.)
    actor: str  # Người thực hiện
    location: str  # Địa điểm (tên kho, tên shipper, Hệ thống)
    note: Optional[str] = None


class WaybillTimelineResponse(BaseModel):
    """Response cho endpoint timeline"""
    waybill_code: str
    status: str
    created_at: datetime
    timeline: List[WaybillTimelineItem]
    
    class Config:
        from_attributes = True

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

    # NEW ADVANCED FILTERS
    search_term: Optional[str] = None
    keyword: Optional[str] = None
    service_type: Optional[str] = None
    holding_hub_id: Optional[int] = None
    holding_shipper_id: Optional[int] = None
    sla_status: Optional[str] = None
    cod_status: Optional[str] = None


# --- NEW: SCHEMAS FOR VERIFY & OCR ---

class WaybillBillImagesUpdate(BaseModel):
    bill_image_url: str = Field(..., description="Link ảnh bill gốc")
    pickup_image_url: Optional[str] = Field(None, description="Link ảnh chụp lúc lấy hàng")

class WaybillVerifyRequest(BaseModel):
    action: str = Field(..., description="VERIFIED hoặc MISMATCH")
    error_msg: Optional[str] = Field(None, description="Lý do lỗi nếu mismatch")
