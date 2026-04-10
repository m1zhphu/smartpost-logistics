# File: schemas/users.py
from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime

class RoleSchema(BaseModel):
    role_id: int
    role_name: str
    class Config:
        from_attributes = True

class HubSchemaSmall(BaseModel):
    hub_id: int
    hub_name: str
    class Config:
        from_attributes = True

class DepartmentSchema(BaseModel):
    department_id: int
    department_code: str
    department_name: str
    class Config:
        from_attributes = True

class UserBase(BaseModel):
    username: str
    full_name: str
    email: Optional[EmailStr] = None
    phone_number: Optional[str] = None
    role_id: int
    primary_hub_id: Optional[int] = None
    department_id: Optional[int] = None
    vehicle_plate: Optional[str] = None

class UserCreate(UserBase):
    password: str = Field(min_length=6, description="Mật khẩu tối thiểu 6 ký tự")

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone_number: Optional[str] = None
    role_id: Optional[int] = None
    primary_hub_id: Optional[int] = None
    department_id: Optional[int] = None
    vehicle_plate: Optional[str] = None
    is_active: Optional[bool] = None

class UserResponse(UserBase):
    user_id: int
    is_active: Optional[bool] = True
    created_at: Optional[datetime] = None
    
    # Nested objects for display
    role: Optional[RoleSchema] = None
    primary_hub: Optional[HubSchemaSmall] = None
    department: Optional[DepartmentSchema] = None

    class Config:
        from_attributes = True