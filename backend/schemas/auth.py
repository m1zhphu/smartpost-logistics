# File: schemas/auth.py
from pydantic import BaseModel
from pydantic import EmailStr, Field
from typing import Optional

class LoginSchema(BaseModel):
    username: str
    password: str

class RegisterOtpRequest(BaseModel):
    email: EmailStr

class CustomerRegisterVerifyRequest(BaseModel):
    username: str = Field(min_length=3, max_length=50)
    password: str = Field(min_length=6, max_length=128)
    full_name: str = Field(min_length=2, max_length=100)
    email: EmailStr
    otp: str = Field(min_length=6, max_length=6)
    phone_number: Optional[str] = Field(default=None, max_length=20)
    address: Optional[str] = Field(default=None, max_length=255)
    province_id: Optional[int] = None
    district_id: Optional[int] = None
    ward_id: Optional[int] = None

class RegisterOtpResponse(BaseModel):
    message: str
    email: EmailStr
    expires_in_seconds: int
    email_sent: bool

class RegisterVerifyResponse(BaseModel):
    message: str
    access_token: str
    token_type: str = "bearer"
    user_id: int
    customer_id: int
    role_id: int
    full_name: str

class ChangePasswordRequest(BaseModel):
    current_password: str = Field(min_length=1, max_length=128)
    new_password: str = Field(min_length=6, max_length=128)

class ForgotPasswordOtpRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    email: EmailStr
    otp: str = Field(min_length=6, max_length=6)
    new_password: str = Field(min_length=6, max_length=128)

class PasswordOtpResponse(BaseModel):
    message: str
    email: EmailStr
    expires_in_seconds: int
    email_sent: bool

class UserResponse(BaseModel):
    user_id: int
    username: str
    full_name: str
    role_id: int

    class Config:
        from_attributes = True
