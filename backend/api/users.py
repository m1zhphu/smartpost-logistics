from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from core.database import get_db
from core.security import get_current_user
from core.permissions import PermissionChecker
import crud.users as crud_users
import schemas.users as schema_users

router = APIRouter(prefix="/api/users", tags=["Staff Management"])
SUPER_ADMIN_ROLE_ID = 1

def _is_super_admin_user(user):
    return user and user.role_id == SUPER_ADMIN_ROLE_ID

def _prevent_extra_super_admin(db: Session, role_id: int | None, target_user_id: int | None = None):
    if role_id == SUPER_ADMIN_ROLE_ID and crud_users.has_super_admin_user(db, exclude_user_id=target_user_id):
        raise HTTPException(status_code=400, detail="Hệ thống chỉ được phép có 1 tài khoản Super Admin")

def _prevent_create_super_admin(role_id: int | None):
    if role_id == SUPER_ADMIN_ROLE_ID:
        raise HTTPException(status_code=403, detail="Không được tạo nhân sự với quyền Quản trị hệ thống")

def _prevent_super_admin_deactivation(user, next_is_active: bool | None = None):
    if _is_super_admin_user(user) and next_is_active is False:
        raise HTTPException(status_code=403, detail="Không được khóa tài khoản Super Admin cao nhất")

def _prevent_super_admin_delete(user):
    if _is_super_admin_user(user):
        raise HTTPException(status_code=403, detail="Không được xóa tài khoản Super Admin cao nhất")

def _prevent_super_admin_role_demotion(user, next_role_id: int | None):
    if _is_super_admin_user(user) and next_role_id != SUPER_ADMIN_ROLE_ID:
        raise HTTPException(status_code=403, detail="Không được hạ quyền tài khoản Super Admin cao nhất")

def _prevent_self_destructive_action(current_user: dict, target_user_id: int):
    if current_user.get("user_id") == target_user_id:
        raise HTTPException(status_code=403, detail="Không được tự khóa hoặc xóa tài khoản đang đăng nhập")

def _validate_shipper_cskh_manager(db: Session, user_data: dict):
    if user_data.get("role_id") != 4:
        user_data["managed_by_cskh_id"] = None
        return

    cskh_id = user_data.get("managed_by_cskh_id")
    if not cskh_id:
        return

    cskh_user = crud_users.get_user_by_id(db, cskh_id)
    if not cskh_user or cskh_user.role_id != 7 or not cskh_user.is_active:
        raise HTTPException(status_code=400, detail="CSKH quản lý bưu tá không hợp lệ")

def _normalize_accessible_hubs(user_data: dict):
    if "primary_hub_id" not in user_data and "accessible_hub_ids" not in user_data:
        return
    primary_hub_id = user_data.get("primary_hub_id")
    accessible_hub_ids = user_data.get("accessible_hub_ids") or []
    if primary_hub_id and primary_hub_id not in accessible_hub_ids:
        accessible_hub_ids.insert(0, primary_hub_id)
    user_data["accessible_hub_ids"] = accessible_hub_ids

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
            user_data["accessible_hub_ids"] = [current_user.get("primary_hub_id")]
            # 2. Không cho phép Manager tạo ra Admin (1) hoặc Manager (2) khác
            if user_data["role_id"] in [1, 2]:
                raise HTTPException(status_code=403, detail="Bạn không có quyền tạo tài khoản cấp Quản lý hoặc Admin.")

        _prevent_create_super_admin(user_data.get("role_id"))
        _prevent_extra_super_admin(db, user_data.get("role_id"))
        _validate_shipper_cskh_manager(db, user_data)
        _normalize_accessible_hubs(user_data)

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
            data.accessible_hub_ids = [current_user.get("primary_hub_id")]
            # 3. Cấm nâng quyền
            if data.role_id in [1, 2]:
                raise HTTPException(status_code=403, detail="Không được phép cấp quyền Quản lý hoặc Admin cho nhân viên.")

        user_data = data.model_dump(exclude_unset=True)
        if "role_id" not in user_data:
            user_data["role_id"] = target_user.role_id
        _prevent_super_admin_role_demotion(target_user, user_data.get("role_id"))
        _prevent_extra_super_admin(db, user_data.get("role_id"), target_user_id=user_id)
        if user_data.get("is_active") is False:
            _prevent_self_destructive_action(current_user, user_id)
        _prevent_super_admin_deactivation(target_user, user_data.get("is_active"))
        _validate_shipper_cskh_manager(db, user_data)
        _normalize_accessible_hubs(user_data)
        updated = crud_users.update_user_record(db, user_id, user_data)
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
        if not user:
            raise HTTPException(status_code=404, detail="Không tìm thấy nhân viên")

        # --- CHỐT CHẶN BẢO MẬT ---
        if current_user.get("role_id") != 1 and user.primary_hub_id != current_user.get("primary_hub_id"):
            raise HTTPException(status_code=403, detail="Bạn không có quyền thao tác trên nhân viên của bưu cục khác.")

        # Gọi CRUD thực hiện đổi trạng thái
        new_status = data.get("is_active", not user.is_active)
        if new_status is False:
            _prevent_self_destructive_action(current_user, user_id)
        _prevent_super_admin_deactivation(user, new_status)
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

        if not user:
            raise HTTPException(status_code=404, detail="Không tìm thấy nhân viên")
        _prevent_self_destructive_action(current_user, user_id)
        _prevent_super_admin_delete(user)
        success = crud_users.soft_delete_user_record(db, user_id)
        if not success:
            raise HTTPException(status_code=404, detail="Không tìm thấy nhân viên")
        return {"message": "Đã vô hiệu hóa tài khoản thành công"}
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/my-shippers", response_model=List[schema_users.UserResponse])
def get_my_shippers(
    is_online: bool = None,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    if current_user.get("role_id") != 7:
        raise HTTPException(status_code=403, detail="Chỉ CSKH mới được xem danh sách bưu tá mình quản lý")
    return crud_users.get_shippers_by_cskh(db, current_user.get("user_id"), is_online=is_online)

@router.get("/shippers")
def get_shippers_by_hub(
    hub_id: int = None, 
    is_online: bool = None,
    managed_by_current_cskh: bool = False,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Lấy danh sách Shipper để phân công"""
    user_role = current_user.get("role_id")
    target_hub = hub_id if user_role == 1 else current_user.get("primary_hub_id")
    managed_by_cskh_id = current_user.get("user_id") if managed_by_current_cskh and user_role == 7 else None
    return crud_users.get_active_shippers_by_hub(
        db,
        target_hub,
        is_online=is_online,
        managed_by_cskh_id=managed_by_cskh_id,
    )

@router.post("/register-push-token")
def register_push_token(
    data: dict,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """API đăng ký và cập nhật Expo Push Token từ Mobile App"""
    token = data.get("push_token")
    if not token:
        raise HTTPException(status_code=400, detail="Thiếu Push Token")
    
    import models
    user_id = current_user.get("user_id")
    user = db.query(models.Users).filter(models.Users.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Không tìm thấy tài khoản")
    
    user.push_token = token
    try:
        db.commit()
        return {"message": "Đăng ký Push Token thành công", "push_token": token}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Lỗi khi đăng ký token: {str(e)}")
