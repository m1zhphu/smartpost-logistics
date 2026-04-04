# File: schemas/auth.py
from pydantic import BaseModel

class LoginSchema(BaseModel):
    username: str
    password: str

class UserResponse(BaseModel):
    user_id: int
    username: str
    full_name: str
    role_id: int

    class Config:
        from_attributes = True