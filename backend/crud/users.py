from sqlalchemy.orm import Session, joinedload
import models
from core.security import get_password_hash
from datetime import datetime

SUPER_ADMIN_ROLE_ID = 1

def sync_user_accessible_hubs(db: Session, user_id: int, hub_ids: list[int]):
    unique_hub_ids = []
    for hub_id in hub_ids or []:
        if hub_id and hub_id not in unique_hub_ids:
            unique_hub_ids.append(hub_id)

    db.query(models.UserDataAccess).filter(
        models.UserDataAccess.user_id == user_id
    ).delete()

    for hub_id in unique_hub_ids:
        db.add(models.UserDataAccess(user_id=user_id, accessible_hub_id=hub_id))
    db.flush()

def get_user_by_id(db: Session, user_id: int):
    return db.query(models.Users).options(
        joinedload(models.Users.role),
        joinedload(models.Users.primary_hub),
        joinedload(models.Users.managed_by_cskh),
        joinedload(models.Users.department),
        joinedload(models.Users.user_data_access).joinedload(models.UserDataAccess.accessible_hub)
    ).filter(models.Users.user_id == user_id, models.Users.is_deleted == False).first()

def count_super_admin_users(db: Session, exclude_user_id: int | None = None):
    query = db.query(models.Users).filter(
        models.Users.role_id == SUPER_ADMIN_ROLE_ID,
        models.Users.is_deleted == False
    )
    if exclude_user_id:
        query = query.filter(models.Users.user_id != exclude_user_id)
    return query.count()

def has_super_admin_user(db: Session, exclude_user_id: int | None = None):
    return count_super_admin_users(db, exclude_user_id=exclude_user_id) > 0

def get_all_users(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Users).options(
        joinedload(models.Users.role),
        joinedload(models.Users.primary_hub),
        joinedload(models.Users.managed_by_cskh),
        joinedload(models.Users.department),
        joinedload(models.Users.user_data_access).joinedload(models.UserDataAccess.accessible_hub)
    ).filter(
        models.Users.is_deleted == False,
        models.Users.role.has(models.Roles.role_name != "CUSTOMER")
    ).offset(skip).limit(limit).all()

def create_user_record(db: Session, user_data: dict):
    """Tạo nhân viên mới và băm mật khẩu"""
    # 1. Băm mật khẩu
    hashed_pwd = get_password_hash(user_data['password'])
    del user_data['password']
    
    # 2. ĐỔI TÊN TRƯỜNG: Chuyển 'phone' (từ API) thành 'phone_number' (trong DB)
    if 'phone' in user_data:
        user_data['phone_number'] = user_data.pop('phone')
    
    # 3. Tạo Object
    accessible_hub_ids = user_data.pop('accessible_hub_ids', None) or []

    new_user = models.Users(
        **user_data,
        password_hash=hashed_pwd,
        status=True,
        is_active=True,
        is_deleted=False,
        created_at=datetime.utcnow()
    )
    db.add(new_user)
    db.flush() # Để lấy user_id
    sync_user_accessible_hubs(db, new_user.user_id, accessible_hub_ids)
    return new_user

def soft_delete_user_record(db: Session, user_id: int):
    """Vô hiệu hóa tài khoản thay vì xóa vật lý"""
    user = db.query(models.Users).filter(models.Users.user_id == user_id).first()
    if user:
        user.is_deleted = True
        user.is_active = False
        user.status = False
        db.commit()
    return user

def get_user_by_username(db: Session, username: str):
    """Tìm kiếm user theo tên đăng nhập"""
    return db.query(models.Users).filter(
        models.Users.username == username
    ).first()

def update_user_record(db, user_id: int, data: dict):
    # Những cột được phép cập nhật
    ALLOWED = {'full_name', 'email', 'phone_number', 'role_id', 'primary_hub_id', 'managed_by_cskh_id', 'department_id', 'vehicle_plate', 'is_active'}
    user = db.query(models.Users).filter(models.Users.user_id == user_id, models.Users.is_deleted == False).first()
    if not user:
        return None
    accessible_hub_ids = data.pop('accessible_hub_ids', None)
    for key, val in data.items():
        if key in ALLOWED and (val is not None or key == 'managed_by_cskh_id'):
            setattr(user, key, val)
    if accessible_hub_ids is not None:
        sync_user_accessible_hubs(db, user_id, accessible_hub_ids)
    db.flush()
    return db.query(models.Users).options(
        joinedload(models.Users.role), 
        joinedload(models.Users.primary_hub),
        joinedload(models.Users.managed_by_cskh),
        joinedload(models.Users.department),
        joinedload(models.Users.user_data_access).joinedload(models.UserDataAccess.accessible_hub)
    ).filter(models.Users.user_id == user_id).first()

# ==========================================
# CÁC HÀM TRUY VẤN MỚI CHUYỂN TỪ API SANG
# ==========================================

def get_users_by_hub(db: Session, hub_id: int):
    """Lấy danh sách nhân viên thuộc một bưu cục cụ thể"""
    return db.query(models.Users).options(
        joinedload(models.Users.role),
        joinedload(models.Users.primary_hub),
        joinedload(models.Users.managed_by_cskh),
        joinedload(models.Users.department),
        joinedload(models.Users.user_data_access).joinedload(models.UserDataAccess.accessible_hub)
    ).filter(
        (
            (models.Users.primary_hub_id == hub_id) |
            (models.Users.user_data_access.any(models.UserDataAccess.accessible_hub_id == hub_id))
        ),
        models.Users.is_deleted == False,
        models.Users.role.has(models.Roles.role_name != "CUSTOMER")
    ).all()

def toggle_user_status_record(db: Session, user: models.Users, is_active: bool):
    """Chuyển đổi trạng thái hoạt động của nhân viên"""
    user.is_active = is_active
    db.flush()
    return user

def get_active_shippers_by_hub(db: Session, hub_id: int = None, is_online: bool | None = None, managed_by_cskh_id: int | None = None):
    """Lấy danh sách các Shipper đang hoạt động để phân công đơn"""
    query = db.query(models.Users).filter(
        models.Users.role_id == 4,
        models.Users.is_active == True,
        models.Users.is_deleted == False
    )
    if hub_id:
        query = query.filter(
            (models.Users.primary_hub_id == hub_id) |
            (models.Users.user_data_access.any(models.UserDataAccess.accessible_hub_id == hub_id))
        )
    # if is_online is not None:
    #     query = query.filter(models.Users.is_online == is_online)
    if managed_by_cskh_id:
        query = query.filter(models.Users.managed_by_cskh_id == managed_by_cskh_id)
        
    return query.all()

def get_shippers_by_cskh(db: Session, cskh_id: int, is_online: bool | None = None):
    query = db.query(models.Users).options(
        joinedload(models.Users.role),
        joinedload(models.Users.primary_hub),
        joinedload(models.Users.managed_by_cskh),
        joinedload(models.Users.user_data_access).joinedload(models.UserDataAccess.accessible_hub)
    ).filter(
        models.Users.role_id == 4,
        models.Users.managed_by_cskh_id == cskh_id,
        models.Users.is_deleted == False
    )
    # if is_online is not None:
    #     query = query.filter(models.Users.is_online == is_online)
    return query.all()
