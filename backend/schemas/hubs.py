# File: schemas/hubs.py
from pydantic import BaseModel
from typing import Optional, List

class HubBase(BaseModel):
    hub_code: str
    hub_name: str
    hub_type: Optional[str] = None
    province_id: Optional[int] = None
    address_detail: Optional[str] = None
    manager_id: Optional[int] = None
    status: Optional[bool] = True

class HubCreate(HubBase):
    pass # Dùng để nhận dữ liệu khi tạo mới

class HubResponse(HubBase):
    hub_id: int

    class Config:
        from_attributes = True # Cho phép chuyển đổi từ SQLAlchemy model sang Pydantic