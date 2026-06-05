from pydantic import BaseModel
from typing import Optional

class CustomerCreate(BaseModel):
    customer_code: Optional[str] = None
    customer_type: str = "PERSONAL"
    name: str
    company_name: Optional[str] = None
    representative_name: Optional[str] = None
    tax_code: Optional[str] = None
    staff_in_charge_id: int
    policy_id: Optional[int] = None
    phone: str
    email: Optional[str] = None
    address: Optional[str] = None
    country: Optional[str] = None
    province: Optional[str] = None
    ward: Optional[str] = None
    street_address: Optional[str] = None
    # Thông tin ngân hàng
    bank_name: Optional[str] = None
    bank_number: Optional[str] = None
    bank_owner: Optional[str] = None
    username: Optional[str] = None
    password: Optional[str] = None
    status: str = "ACTIVE"

class CustomerAssignStaff(BaseModel):
    staff_in_charge_id: int
