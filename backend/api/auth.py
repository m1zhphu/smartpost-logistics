from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from core.database import get_db
from core.security import verify_password, get_password_hash, create_access_token
import crud.auth as crud_auth
import schemas.auth as schema_auth 

router = APIRouter(prefix="/api", tags=["Authentication"])

@router.post("/setup-admin")
def setup_first_admin(db: Session = Depends(get_db)):
    """Thiết lập tài khoản Admin đầu tiên"""
    # 1. Kiểm tra/Tạo Role ADMIN
    admin_role = crud_auth.get_role_by_name(db, "ADMIN")
    if not admin_role:
        admin_role = crud_auth.create_role(db, "ADMIN", {"all": True})
        db.commit()

    # 2. Kiểm tra/Tạo User admin
    existing_user = crud_auth.get_user_by_username(db, "admin")
    if existing_user:
        return {"message": "Admin đã tồn tại!"}

    user_data = {
        "username": "admin",
        "password_hash": get_password_hash("123456"),
        "full_name": "Quản trị viên Hệ thống",
        "role_id": admin_role.role_id,
        "status": True
    }
    crud_auth.create_user(db, user_data)
    db.commit()
    return {"message": "Tạo tài khoản Admin thành công!"}

@router.post("/auth/login")
def login(data: schema_auth.LoginSchema, db: Session = Depends(get_db)):
    """Xử lý đăng nhập và nạp quyền vào Token"""
    
    # 1. Sử dụng CRUD để lấy User
    user = crud_auth.get_user_by_username(db, data.username)
    
    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Tài khoản hoặc mật khẩu không chính xác")
    
    # 2. Sử dụng CRUD để lấy Quyền
    role = crud_auth.get_role_by_id(db, user.role_id)
    permissions = role.permissions if role else {}

    # 3. Tạo Token mang theo "thẻ bài" quyền hạn
    access_token = create_access_token(
        data={
            "sub": user.username, 
            "user_id": user.user_id, 
            "role_id": user.role_id,
            "primary_hub_id": user.primary_hub_id,
            "permissions": permissions 
        }
    )
    
    return {
        "access_token": access_token, 
        "token_type": "bearer", 
        "full_name": user.full_name
    }

@router.post("/setup-roles-v2")
def setup_roles_v2(db: Session = Depends(get_db)):
    """Xóa cũ, tạo mới toàn bộ danh sách vai trò hệ thống"""
    try:
        # 1. Định nghĩa danh sách vai trò (Data)
        roles_data = [
            {"role_id": 1, "role_name": "SUPER_ADMIN", "permissions": {"all": True}},
            {"role_id": 2, "role_name": "HUB_MANAGER", "permissions": {
                "hub_manage": True, "assign_shipper": True, "warehouse_ops": True, "view_report": True
            }},
            {"role_id": 3, "role_name": "WAREHOUSE_STAFF", "permissions": {
                "warehouse_ops": True, "scan_in": True, "bagging": True, "manifest_ops": True
            }},
            {"role_id": 4, "role_name": "SHIPPER", "permissions": {
                "delivery_ops": True, "view_tasks": True, "update_pod": True
            }},
            {"role_id": 5, "role_name": "ACCOUNTANT", "permissions": {
                "accounting_ops": True, "settle_cod": True, "view_finance": True
            }},
        ]

        # 2. Gọi hàm CRUD để xử lý Database
        crud_auth.upsert_roles_bulk(db, roles_data)
        
        # 3. Commit giao dịch tại API Layer
        db.commit()
        return {"message": "Đã cấu hình lại toàn bộ hệ thống phân quyền 5 cấp thành công!"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))