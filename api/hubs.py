# File: api/hubs.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from core.database import get_db
from core.idempotency import validate_idempotency, commit_idempotency
from core.security import get_current_user
import crud.hubs as crud_hubs
import schemas.hubs as schema_hubs
from core.permissions import PermissionChecker

router = APIRouter(prefix="/api/hubs", tags=["Master Data - Hubs"])

@router.post("", response_model=schema_hubs.HubResponse, dependencies=[Depends(PermissionChecker("hub_manage"))])
async def create_hub(
    data: schema_hubs.HubCreate, 
    db: Session = Depends(get_db),
    idem_key: str = Depends(validate_idempotency),
    current_user: dict = Depends(get_current_user)
):
    """API tạo bưu cục mới (Chỉ dành cho Admin)"""
    # 1. Kiểm tra mã bưu cục đã tồn tại chưa [cite: 5]
    existing_hub = crud_hubs.get_hub_by_code(db, data.hub_code)
    if existing_hub:
        raise HTTPException(status_code=400, detail="Mã bưu cục đã tồn tại.")

    # 2. Gọi tầng CRUD để thực thi lưu trữ
    new_hub = crud_hubs.create_hub_record(db, data.model_dump())
    db.commit()
    db.refresh(new_hub)

    # 3. Ghi nhận Idempotency
    result = schema_hubs.HubResponse.model_validate(new_hub).model_dump()
    commit_idempotency(idem_key, result)
    
    return new_hub

@router.get("", response_model=List[schema_hubs.HubResponse])
def get_all_hubs(db: Session = Depends(get_db)):
    """API lấy danh sách bưu cục"""
    return crud_hubs.get_all_hubs(db)

