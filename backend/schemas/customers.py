from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class CustomerDepartmentBase(BaseModel):
    name: str

class CustomerDepartmentCreate(CustomerDepartmentBase):
    pass

class CustomerDepartmentUpdate(CustomerDepartmentBase):
    pass

class CustomerDepartmentResponse(CustomerDepartmentBase):
    id: int
    customer_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


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
    old_province: Optional[str] = None
    # Thông tin ngân hàng
    bank_name: Optional[str] = None
    bank_number: Optional[str] = None
    bank_owner: Optional[str] = None
    username: Optional[str] = None
    password: Optional[str] = None
    status: str = "ACTIVE"

class CustomerAssignStaff(BaseModel):
    staff_in_charge_id: int


class CustomerSelfUpdate(BaseModel):
    full_name: Optional[str] = None
    name: Optional[str] = None
    company_name: Optional[str] = None
    representative_name: Optional[str] = None
    tax_code: Optional[str] = None
    phone: Optional[str] = None
    phone_number: Optional[str] = None
    email: Optional[str] = None
    country: Optional[str] = None
    province: Optional[str] = None
    province_name: Optional[str] = None
    province_id: Optional[int] = None
    district: Optional[str] = None
    district_name: Optional[str] = None
    district_id: Optional[int] = None
    ward: Optional[str] = None
    ward_name: Optional[str] = None
    ward_id: Optional[int] = None
    street_address: Optional[str] = None
    address: Optional[str] = None
    address_detail: Optional[str] = None
    # Old province name before 2025 merger - used for vehicle sorting/bagging
    old_province: Optional[str] = None
    bank_name: Optional[str] = None
    bank_number: Optional[str] = None
    bank_owner: Optional[str] = None
