# File: schemas/delivery.py
from pydantic import BaseModel, Field
from typing import List, Optional

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