from pydantic import BaseModel, Field, field_validator, model_validator
from typing import List, Optional
from datetime import datetime
from core.product_types import get_product_type_definition, normalize_product_type

class WaybillCreate(BaseModel):
    waybill_code: Optional[str] = Field(default=None, description="Mã vận đơn do Frontend/OCR truyền lên, nếu không có sẽ tự sinh")
    bag_code: Optional[str] = Field(default=None, description="Mã túi thư chứa vận đơn (nếu có)")
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
    product_group: str = Field(default="PARCEL")
    declared_value: float = Field(default=0, ge=0)
    payment_method: Optional[str] = "SENDER_PAY"
    note: Optional[str] = None
    extra_services: Optional[List[str]] = []
    
    # ĐÃ BỔ SUNG: Trường này bắt buộc phải có để Backend nhận tiền từ Frontend gửi xuống
    shipping_fee: float = Field(default=0.0, description="Phí vận chuyển tính từ Frontend")
    old_province: Optional[str] = None
    is_internal: Optional[bool] = Field(default=False, description="Đơn nội bộ")

    # Bổ sung phục vụ Tạo Bill thông minh
    sender_name: Optional[str] = Field(default=None, description="Tên người gửi thực tế")
    sender_phone: Optional[str] = Field(default=None, description="SĐT người gửi")
    sender_address: Optional[str] = Field(default=None, description="Địa chỉ gửi")
    length: Optional[float] = Field(default=None, description="Chiều dài (cm)")
    width: Optional[float] = Field(default=None, description="Chiều rộng (cm)")
    height: Optional[float] = Field(default=None, description="Chiều cao (cm)")
    # Tên tỉnh/phường người nhận từ hệ thống địa chỉ 2 cấp tĩnh
    receiver_province_name: Optional[str] = Field(default=None, description="Tên tỉnh/thành người nhận")
    receiver_ward_name: Optional[str] = Field(default=None, description="Tên phường/xã người nhận")
    # Tên tỉnh/phường người gửi từ hệ thống địa chỉ 2 cấp tĩnh
    sender_province_name: Optional[str] = Field(default=None, description="Tên tỉnh/thành người gửi")
    sender_ward_name: Optional[str] = Field(default=None, description="Tên phường/xã người gửi")
    # IDs của tỉnh thành
    sender_province_id: Optional[int] = Field(default=None, description="ID tỉnh thành người gửi")
    receiver_province_id: Optional[int] = Field(default=None, description="ID tỉnh thành người nhận")

    @field_validator("product_group", mode="before")
    @classmethod
    def validate_product_group(cls, value):
        return normalize_product_type(value)

    @model_validator(mode="after")
    def validate_product_business_rules(self):
        definition = get_product_type_definition(self.product_group)
        if definition["requires_declared_value"] and not float(self.declared_value or 0):
            raise ValueError("Hàng giá trị cao bắt buộc phải có giá trị khai báo lớn hơn 0")
        return self


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
    old_province: Optional[str] = None


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

    @field_validator("product_group", mode="before")
    @classmethod
    def validate_product_group(cls, value):
        return normalize_product_type(value)

    @model_validator(mode="after")
    def validate_product_business_rules(self):
        definition = get_product_type_definition(self.product_group)
        if definition["requires_declared_value"] and not float(self.declared_value or 0):
            raise ValueError("Hàng giá trị cao bắt buộc phải có giá trị khai báo lớn hơn 0")
        return self


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
    packing_type: Optional[str] = None
    delivery_note_option: Optional[str] = None
    note: Optional[str] = None
    payment_method: str = Field(default="SENDER_DEBT")
    pickup_method: str = Field(default="OUR_STAFF_PICKUP")
    delivery_method: str = Field(default="OUR_STAFF_DELIVERY")
    save_as_draft: bool = False
    customer_department_id: Optional[int] = None



class AdminPickupCreate(CustomerPickupCreate):
    customer_id: int
    target_hub_id: Optional[int] = None
    assigned_shipper_id: Optional[int] = None
    source: str = Field(default="HOTLINE", description="PORTAL, HOTLINE, CSKH, ADMIN")


class BulkMailDraftItemCreate(BaseModel):
    sequence_no: int = Field(ge=1)
    customer_reference_code: Optional[str] = None
    receiver_name: Optional[str] = None
    receiver_phone: Optional[str] = None
    receiver_address: Optional[str] = None
    note: Optional[str] = None


class BulkMailPickupCreate(BaseModel):
    product_type: str
    service_type: str = Field(default="STANDARD")
    estimated_quantity: int = Field(ge=1, le=10000)
    sender: CustomerPickupAddress
    receiver: Optional[CustomerPickupAddress] = None
    draft_items: List[BulkMailDraftItemCreate] = Field(default_factory=list)
    pickup_time: Optional[datetime] = None
    target_hub_id: Optional[int] = None
    customer_id: Optional[int] = None
    assigned_shipper_id: Optional[int] = None
    source: str = Field(default="PORTAL", description="PORTAL, HOTLINE, CSKH, ADMIN")
    payment_method: str = Field(default="SENDER_DEBT")
    note: Optional[str] = None
    customer_department_id: Optional[int] = None


    @field_validator("product_type", mode="before")
    @classmethod
    def validate_bulk_product_type(cls, value):
        product_type = normalize_product_type(value)
        if product_type not in {"DOCUMENT", "PARCEL"}:
            return "PARCEL"
        return product_type

    @model_validator(mode="after")
    def validate_draft_items(self):
        if len(self.draft_items) > self.estimated_quantity:
            raise ValueError("Số dòng thông tin thư không được lớn hơn số lượng dự kiến")
        sequence_numbers = [item.sequence_no for item in self.draft_items]
        if len(sequence_numbers) != len(set(sequence_numbers)):
            raise ValueError("Số thứ tự thư không được trùng nhau")
        return self


class BulkMailPickupResponse(BaseModel):
    request_id: int
    request_code: str
    bag_id: Optional[int] = None
    bag_code: Optional[str] = None
    waybill_id: Optional[int] = None
    waybill_code: Optional[str] = None
    customer_id: int
    customer_code: str
    product_type: str
    product_type_label: str
    service_type: Optional[str] = None
    estimated_quantity: int
    actual_quantity: int = 0
    pickup_status: str
    bag_status: Optional[str] = None
    materialization_status: str
    created_at: Optional[datetime] = None
    waybills: List[dict] = Field(default_factory=list)
    customer_department_id: Optional[int] = None
    customer_department_name: Optional[str] = None



class MobileOcrWaybillUpdate(BaseModel):
    receiver_name: Optional[str] = None
    receiver_phone: Optional[str] = None
    receiver_address: Optional[str] = None
    receiver_province_id: Optional[int] = None
    receiver_district_id: Optional[int] = None
    receiver_ward_id: Optional[int] = None
    receiver_province_name: Optional[str] = None
    receiver_district_name: Optional[str] = None
    receiver_ward_name: Optional[str] = None
    actual_weight: Optional[float] = Field(default=None, ge=0)
    length: Optional[float] = Field(default=None, ge=0)
    width: Optional[float] = Field(default=None, ge=0)
    height: Optional[float] = Field(default=None, ge=0)
    cod_amount: Optional[float] = Field(default=None, ge=0)
    service_type: Optional[str] = None
    product_name: Optional[str] = None
    product_group: Optional[str] = None
    declared_value: Optional[float] = Field(default=None, ge=0)
    bill_image_url: Optional[str] = None
    note: Optional[str] = None
    ocr_raw_text: Optional[str] = None


class OcrFinalizeRequest(BaseModel):
    customer_id: Optional[int] = None
    origin_hub_id: Optional[int] = None
    dest_hub_id: Optional[int] = None
    sender_name: Optional[str] = None
    sender_phone: Optional[str] = None
    sender_address: Optional[str] = None
    receiver_name: str
    receiver_phone: str
    receiver_address: str
    actual_weight: float = Field(gt=0)
    length: Optional[float] = Field(default=None, ge=0)
    width: Optional[float] = Field(default=None, ge=0)
    height: Optional[float] = Field(default=None, ge=0)
    cod_amount: Optional[float] = Field(default=0, ge=0)
    service_type: Optional[str] = None
    product_name: Optional[str] = None
    product_group: Optional[str] = None
    declared_value: Optional[float] = Field(default=0, ge=0)
    payment_method: Optional[str] = None
    note: Optional[str] = None
    extra_services: Optional[List[str]] = Field(default_factory=list)
    shipping_fee: Optional[float] = Field(default=0, ge=0)
    
    # 2-level static address fields for OCR finalize
    sender_province_name: Optional[str] = None
    sender_ward_name: Optional[str] = None
    sender_province_id: Optional[int] = None
    receiver_province_name: Optional[str] = None
    receiver_ward_name: Optional[str] = None
    receiver_province_id: Optional[int] = None

    @field_validator("product_group", mode="before")
    @classmethod
    def validate_finalize_product_group(cls, value):
        return normalize_product_type(value) if value else value


class MobileOcrExtraWaybillCreate(BaseModel):
    count: int = Field(default=1, ge=1, le=1000)
    note: Optional[str] = None


class CustomerPickupCreateResponse(BaseModel):
    waybill_id: int
    waybill_code: str
    bill_code: str
    bag_code: Optional[str] = None
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
    estimated_fuel_surcharge: Optional[float] = None
    estimated_extra_services_fee: Optional[float] = None
    estimated_packing_fee: Optional[float] = None
    estimated_vat_amount: Optional[float] = None
    estimated_total_amount: Optional[float] = None
    product_type: str = "PARCEL"
    product_type_label: Optional[str] = None


class CustomerPickupSummaryItem(BaseModel):
    product_name: Optional[str] = None
    quantity: int = 1
    weight: float = 0
    declared_value: Optional[float] = 0


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
    assigned_shipper_name: Optional[str] = None
    price_status: Optional[str] = None
    estimated_shipping_fee: float = 0
    estimated_total_amount: float = 0
    final_shipping_fee: Optional[float] = None
    final_total_amount: Optional[float] = None
    created_at: Optional[datetime] = None
    product_type: str = "PARCEL"
    product_type_label: Optional[str] = None
    customer_department_id: Optional[int] = None
    customer_department_name: Optional[str] = None


    # Sender & Receiver Info
    sender_name: Optional[str] = None
    sender_phone: Optional[str] = None
    sender_address: Optional[str] = None
    sender_province_name: Optional[str] = None
    sender_district_name: Optional[str] = None
    sender_ward_name: Optional[str] = None
    receiver_name: Optional[str] = None
    receiver_phone: Optional[str] = None
    receiver_address: Optional[str] = None
    receiver_province_name: Optional[str] = None
    receiver_district_name: Optional[str] = None
    receiver_ward_name: Optional[str] = None

    # Service & Payment Options
    service_type: Optional[str] = None
    payment_method: Optional[str] = None
    cod_amount: float = 0
    note: Optional[str] = None
    shop_order_code: Optional[str] = None

    # Additional Fees
    estimated_extra_services_fee: Optional[float] = None
    estimated_vat_amount: Optional[float] = None
    final_extra_services_fee: Optional[float] = None
    final_vat_amount: Optional[float] = None

    # Weights
    estimated_weight: Optional[float] = None
    actual_weight: Optional[float] = None
    ocr_status: Optional[str] = None
    bill_image_url: Optional[str] = None
    pickup_image_url: Optional[str] = None
    pickup_image_urls: List[str] = Field(default_factory=list)

    # Items list
    items: List[CustomerPickupSummaryItem] = []


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
    bill_image_url: Optional[str] = None
    pickup_image_url: Optional[str] = None
    pickup_image_urls: List[str] = Field(default_factory=list)
    pod_image_url: Optional[str] = None
    pod_image_urls: List[str] = Field(default_factory=list)
    
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

class WaybillExportSelectedRequest(BaseModel):
    waybill_codes: List[str]

