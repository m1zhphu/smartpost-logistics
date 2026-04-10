from pydantic import BaseModel
from typing import Optional

class CustomerCreate(BaseModel):
    customer_code: Optional[str] = None
    customer_type: str = "SHOP"
    name: str
    company_name: Optional[str] = None
    representative_name: Optional[str] = None
    tax_code: Optional[str] = None
    phone: str
    email: Optional[str] = None
    address: Optional[str] = None
    # Thông tin ngân hàng
    bank_name: Optional[str] = None
    bank_number: Optional[str] = None
    bank_owner: Optional[str] = None
    status: str = "ACTIVE"