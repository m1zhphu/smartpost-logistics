# File: schemas/admin.py
from pydantic import BaseModel

class AdminOverrideStatus(BaseModel):
    waybill_code: str
    new_status: str
    reason: str  # Bắt buộc phải có lý do theo đặc tả