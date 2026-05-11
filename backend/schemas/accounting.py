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
    statement_id: int # Đồng bộ với model StatementCOD
    customer_id: int
    total_amount: decimal.Decimal
    status: str
    created_at: datetime
    created_by: int

    model_config = ConfigDict(from_attributes=True)

class StatementDebtBase(BaseModel):
    statement_code: str
    customer_id: Optional[int] = None
    total_main_fee: Optional[decimal.Decimal] = decimal.Decimal('0')
    total_extra_fee: Optional[decimal.Decimal] = decimal.Decimal('0')
    total_vat: Optional[decimal.Decimal] = decimal.Decimal('0')
    grand_total: Optional[decimal.Decimal] = decimal.Decimal('0')
    status: str = "DRAFT"

class StatementDebtCreate(StatementDebtBase):
    waybill_ids: List[int] = Field(default_factory=list)

class StatementDebtResponse(StatementDebtBase):
    statement_id: int
    created_at: datetime
    created_by: Optional[int] = None

    class Config:
        from_attributes = True

class StatementStatusUpdate(BaseModel):
    status: str = Field(..., pattern="^(DRAFT|CALCULATED|CONFIRMED|EXPORTED|PAID)$")

class WaybillPriceOverride(BaseModel):
    waybill_id: int
    new_shipping_fee: Optional[decimal.Decimal] = None
    new_extra_fee: Optional[decimal.Decimal] = None
    reason: str

class StatementAdjustmentCreate(BaseModel):
    statement_id: int
    statement_type: str = Field(..., pattern="^(DEBT|COD)$")
    waybill_id: int
    amount: decimal.Decimal # Dùng Decimal để tránh sai số
    reason: str