# File: schemas/users.py
from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime

class UserBase(BaseModel):
    username: str
    full_name: str
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    role_id: int
    primary_hub_id: Optional[int] = None

class UserCreate(UserBase):
    password: str = Field(min_length=6, description="Mật khẩu tối thiểu 6 ký tự")

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    role_id: Optional[int] = None
    primary_hub_id: Optional[int] = None
    is_active: Optional[bool] = None

class UserResponse(UserBase):
    user_id: int
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True