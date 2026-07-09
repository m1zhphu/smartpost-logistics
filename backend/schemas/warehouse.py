# File: schemas/warehouse.py
from pydantic import BaseModel
from typing import List, Optional

class ScanRequest(BaseModel):
    waybill_code: str
    note: str = "Nhập kho thành công"
    actual_weight: Optional[float] = None  # Nếu khai báo khối lượng khi nhập kho

class WeighRequest(BaseModel):
    waybill_code: str
    actual_weight: float  # Khối lượng thực cân tại kho
    note: Optional[str] = "Cân lại thực tế tại kho"

class BaggingRequest(BaseModel):
    bag_code: str
    destination_hub_id: int
    waybill_codes: List[str]
    note: str = "Đóng túi chuẩn bị trung chuyển"

class ManifestLoadRequest(BaseModel):
    manifest_code: str
    vehicle_number: str
    to_hub_id: int
    bag_codes: List[str]

class ManifestUnloadRequest(BaseModel):
    manifest_code: str
    bag_codes: List[str]    

# --- PICKUP BAG SCHEMAS ---
from datetime import datetime

class PickupBagCreate(BaseModel):
    customer_id: int
    shipper_id: Optional[int] = None
    bag_code: Optional[str] = None
    est_quantity: Optional[int] = 0
    note: Optional[str] = None
    waybill_codes: Optional[List[str]] = None
    seal_bag: bool = True

class PickupBagAssignShipper(BaseModel):
    shipper_id: int

class PickupBagResponse(BaseModel):
    bag_id: int
    bag_code: str
    customer_id: Optional[int]
    customer_code: Optional[str] = None
    customer_name: Optional[str] = None
    created_by: Optional[int]
    shipper_name: Optional[str] = None
    est_quantity: Optional[int]
    actual_quantity: Optional[int] = 0
    missing_quantity: Optional[int] = 0
    status: Optional[str]
    bag_type: Optional[str]
    pickup_time: Optional[datetime] = None

    class Config:
        from_attributes = True

class PickupBagDetailResponse(PickupBagResponse):
    discrepancy: Optional[dict] = None
    chain_of_custody: Optional[List[dict]] = None

class PickupBagVerifyRequest(BaseModel):
    waybill_codes: List[str]
