from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from core.database import get_db
from core.security import get_current_user
from core.permissions import PermissionChecker
import crud.users as crud_users
import schemas.users as schema_users

router = APIRouter(prefix="/api/users", tags=["Staff Management"])

@router.post("", 
             response_model=schema_users.UserResponse, 
             dependencies=[Depends(PermissionChecker("user_manage"))])
def create_staff(
    data: schema_users.UserCreate, 
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Tạo tài khoản nhân viên mới"""
    try:
        # Đổ dữ liệu ra dạng Dictionary để dễ bề thao tác
        user_data = data.model_dump()

        # --- CHỐT CHẶN BẢO MẬT CHO MANAGER ---
        if current_user.get("role_id") != 1:
            # 1. Ép nhân viên mới phải thuộc bưu cục của Manager này
            user_data["primary_hub_id"] = current_user.get("primary_hub_id")
            # 2. Không cho phép Manager tạo ra Admin (1) hoặc Manager (2) khác
            if user_data["role_id"] in [1, 2]:
                raise HTTPException(status_code=403, detail="Bạn không có quyền tạo tài khoản cấp Quản lý hoặc Admin.")

        existing_user = crud_users.get_user_by_username(db, user_data["username"])
        if existing_user:
            raise HTTPException(status_code=400, detail="Tên đăng nhập đã tồn tại")
        
        new_user = crud_users.create_user_record(db, user_data)
        db.commit()
        db.refresh(new_user)
        return new_user
    except HTTPException as he:
        raise he
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    
@router.get("", response_model=List[schema_users.UserResponse])
def list_staff(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Xem danh sách nhân viên (Lọc theo Hub nếu không phải Super Admin)"""
    try:
        if current_user.get("role_id") == 1:
            return crud_users.get_all_users(db)
        
        hub_id = current_user.get("primary_hub_id")
        return crud_users.get_users_by_hub(db, hub_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/{user_id}", 
            response_model=schema_users.UserResponse,
            dependencies=[Depends(PermissionChecker("user_manage"))])
def update_staff(
    user_id: int, 
    data: schema_users.UserUpdate, 
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Cập nhật thông tin nhân viên"""
    try:
        # Kiểm tra người bị sửa qua CRUD
        target_user = crud_users.get_user_by_id(db, user_id)
        if not target_user:
            raise HTTPException(status_code=404, detail="Không tìm thấy nhân viên")

        # --- CHỐT CHẶN BẢO MẬT CHO MANAGER ---
        if current_user.get("role_id") != 1:
            # 1. Cấm sửa người của bưu cục khác
            if target_user.primary_hub_id != current_user.get("primary_hub_id"):
                raise HTTPException(status_code=403, detail="Chỉ được phép sửa thông tin nhân viên thuộc bưu cục của mình.")
            # 2. Ép giữ nguyên bưu cục (cấm chuyển nhân viên sang nhà khác)
            data.primary_hub_id = current_user.get("primary_hub_id")
            # 3. Cấm nâng quyền
            if data.role_id in [1, 2]:
                raise HTTPException(status_code=403, detail="Không được phép cấp quyền Quản lý hoặc Admin cho nhân viên.")

        updated = crud_users.update_user_record(db, user_id, data.model_dump(exclude_none=True))
        db.commit()
        db.refresh(updated)
        return updated
    except HTTPException as he:
        raise he
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.patch("/{user_id}/status", dependencies=[Depends(PermissionChecker("user_manage"))])
def toggle_user_status(
    user_id: int, 
    data: dict, 
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Kích hoạt hoặc tạm khóa tài khoản nhân viên"""
    try:
        user = crud_users.get_user_by_id(db, user_id)
        if not user:
            raise HTTPException(status_code=404, detail="Không tìm thấy nhân viên")

        # --- CHỐT CHẶN BẢO MẬT ---
        if current_user.get("role_id") != 1 and user.primary_hub_id != current_user.get("primary_hub_id"):
            raise HTTPException(status_code=403, detail="Bạn không có quyền thao tác trên nhân viên của bưu cục khác.")

        # Gọi CRUD thực hiện đổi trạng thái
        new_status = data.get("is_active", not user.is_active)
        crud_users.toggle_user_status_record(db, user, new_status)
        
        db.commit()
        return {"message": "Cập nhật trạng thái thành công", "is_active": new_status}
    except HTTPException as he:
        raise he
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{user_id}", dependencies=[Depends(PermissionChecker("user_manage"))])
def delete_staff(
    user_id: int, 
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Xóa mềm tài khoản nhân viên"""
    try:
        # Khóa nếu Manager xóa nhân viên bưu cục khác
        user = crud_users.get_user_by_id(db, user_id)
        if current_user.get("role_id") != 1 and user and user.primary_hub_id != current_user.get("primary_hub_id"):
             raise HTTPException(status_code=403, detail="Bạn không có quyền xóa nhân viên của bưu cục khác.")

        success = crud_users.soft_delete_user_record(db, user_id)
        if not success:
            raise HTTPException(status_code=404, detail="Không tìm thấy nhân viên")
        return {"message": "Đã vô hiệu hóa tài khoản thành công"}
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/shippers")
def get_shippers_by_hub(
    hub_id: int = None, 
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Lấy danh sách Shipper để phân công"""
    user_role = current_user.get("role_id")
    target_hub = hub_id if user_role == 1 else current_user.get("primary_hub_id")

    return crud_users.get_active_shippers_by_hub(db, target_hub)