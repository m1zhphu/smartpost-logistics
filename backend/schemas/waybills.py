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

    # NEW ADVANCED FILTERS
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
