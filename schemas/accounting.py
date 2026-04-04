# File: schemas/accounting.py
from pydantic import BaseModel, Field, ConfigDict # Thêm ConfigDict vào đây
from typing import List, Optional
from datetime import datetime
import decimal

class CashCollectionRequest(BaseModel):
    shipper_id: int
    amount_collected: float = Field(gt=0)
    note: Optional[str] = "Xác nhận thu tiền mặt từ Shipper"

# THÊM CLASS NÀY: Để sửa lỗi AttributeError ở api/accounting.py
class StatementCreate(BaseModel):
    customer_id: int

class StatementResponse(BaseModel):
    id: int # Đổi từ statement_id thành id để khớp với model StatementCOD
    customer_id: int
    total_amount: decimal.Decimal
    status: str
    created_at: datetime
    created_by: int # Thêm để khớp với model

    # Sử dụng model_config thay cho class Config (chuẩn Pydantic v2)
    model_config = ConfigDict(from_attributes=True)