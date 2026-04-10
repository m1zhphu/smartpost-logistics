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