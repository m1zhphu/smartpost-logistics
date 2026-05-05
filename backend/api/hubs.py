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
    """API tạo bưu cục mới"""
    # --- CHỐT CHẶN: CHỈ ADMIN ĐƯỢC TẠO BƯU CỤC MỚI ---
    if current_user.get("role_id") != 1:
        raise HTTPException(status_code=403, detail="Chỉ Super Admin mới được quyền tạo bưu cục mới.")
    
    existing_hub = crud_hubs.get_hub_by_code(db, data.hub_code)
    if existing_hub:
        raise HTTPException(status_code=400, detail="Mã bưu cục đã tồn tại.")

    new_hub = crud_hubs.create_hub_record(db, data.model_dump())
    db.commit()
    db.refresh(new_hub)

    result = schema_hubs.HubResponse.model_validate(new_hub).model_dump()
    commit_idempotency(idem_key, result)
    return new_hub

@router.get("", response_model=List[schema_hubs.HubResponse])
def get_all_hubs(db: Session = Depends(get_db)):
    """API lấy danh sách bưu cục (Ai cũng xem được để phục vụ tạo vận đơn)"""
    return crud_hubs.get_all_hubs(db)

@router.put("/{hub_id}", response_model=schema_hubs.HubResponse, dependencies=[Depends(PermissionChecker("hub_manage"))])
def update_hub(
    hub_id: int,
    data: schema_hubs.HubCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """API cập nhật bưu cục"""
    # --- CHỐT CHẶN: MANAGER CHỈ ĐƯỢC SỬA BƯU CỤC CỦA MÌNH ---
    if current_user.get("role_id") != 1 and hub_id != current_user.get("primary_hub_id"):
        raise HTTPException(status_code=403, detail="Bạn chỉ được phép cập nhật thông tin bưu cục của chính mình.")

    updated_hub = crud_hubs.update_hub_record(db, hub_id, data.model_dump())
    if not updated_hub:
        raise HTTPException(status_code=404, detail="Không tìm thấy bưu cục")
    db.commit()
    return updated_hub

@router.delete("/{hub_id}", dependencies=[Depends(PermissionChecker("hub_manage"))])
def delete_hub(
    hub_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """API xóa bưu cục"""
    # --- CHỐT CHẶN: KHÔNG CHO MANAGER XÓA BƯU CỤC ---
    if current_user.get("role_id") != 1:
        raise HTTPException(status_code=403, detail="Chỉ Super Admin mới được quyền xóa bưu cục.")

    deleted = crud_hubs.delete_hub_record(db, hub_id)
    if not deleted:
         raise HTTPException(status_code=404, detail="Không tìm thấy bưu cục")
    db.commit()
    return {"message": "Đã xóa bưu cục"}

@router.patch("/{hub_id}/status", dependencies=[Depends(PermissionChecker("hub_manage"))])
def patch_hub_status(
    hub_id: int,
    data: dict,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """API thay đổi trạng thái bưu cục"""
    # --- CHỐT CHẶN: KHÔNG CHO MANAGER TỰ KHÓA BƯU CỤC ---
    if current_user.get("role_id") != 1:
        raise HTTPException(status_code=403, detail="Chỉ Super Admin mới được quyền đóng/mở cửa bưu cục.")

    # Kiểm tra xem request có truyền status lên không
    if "status" not in data:
         raise HTTPException(status_code=400, detail="Thiếu trường 'status' trong yêu cầu.")

    # Giao việc cập nhật Data cho CRUD
    hub = crud_hubs.patch_hub_status_record(db, hub_id, data["status"])
    
    if not hub:
        raise HTTPException(status_code=404, detail="Không tìm thấy bưu cục")
    
    db.commit()
    return {"message": "Cập nhật trạng thái thành công", "status": hub.status}