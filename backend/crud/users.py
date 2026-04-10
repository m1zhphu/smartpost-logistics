from sqlalchemy.orm import Session, joinedload
import models
from core.security import get_password_hash
from datetime import datetime

def get_user_by_id(db: Session, user_id: int):
    return db.query(models.Users).options(
        joinedload(models.Users.role),
        joinedload(models.Users.primary_hub),
        joinedload(models.Users.department)
    ).filter(models.Users.user_id == user_id, models.Users.is_deleted == False).first()

def get_all_users(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Users).options(
        joinedload(models.Users.role),
        joinedload(models.Users.primary_hub),
        joinedload(models.Users.department)
    ).filter(models.Users.is_deleted == False).offset(skip).limit(limit).all()

def create_user_record(db: Session, user_data: dict):
    """Tạo nhân viên mới và băm mật khẩu"""
    # 1. Băm mật khẩu
    hashed_pwd = get_password_hash(user_data['password'])
    del user_data['password']
    
    # 2. ĐỔI TÊN TRƯỜNG: Chuyển 'phone' (từ API) thành 'phone_number' (trong DB)
    if 'phone' in user_data:
        user_data['phone_number'] = user_data.pop('phone')
    
    # 3. Tạo Object
    new_user = models.Users(
        **user_data,
        password_hash=hashed_pwd,
        # Lưu ý: Trong Model bạn có cả 'status' và 'is_active'. 
        is_active=True,
        is_deleted=False,
        created_at=datetime.utcnow()
    )
    db.add(new_user)
    db.flush() # Để lấy user_id
    return new_user

def soft_delete_user_record(db: Session, user_id: int):
    """Vô hiệu hóa tài khoản thay vì xóa vật lý"""
    user = db.query(models.Users).filter(models.Users.user_id == user_id).first()
    if user:
        user.is_deleted = True
        user.is_active = False
        db.commit()
    return user

def get_user_by_username(db: Session, username: str):
    """Tìm kiếm user theo tên đăng nhập"""
    return db.query(models.Users).filter(
        models.Users.username == username,
        models.Users.is_deleted == False
    ).first()

def update_user_record(db, user_id: int, data: dict):
    # Những cột được phép cập nhật
    ALLOWED = {'full_name', 'email', 'phone_number', 'role_id', 'primary_hub_id', 'department_id', 'vehicle_plate', 'is_active'}
    user = db.query(models.Users).filter(models.Users.user_id == user_id, models.Users.is_deleted == False).first()
    if not user:
        return None
    for key, val in data.items():
        if key in ALLOWED and val is not None:
            setattr(user, key, val)
    db.flush()
    return db.query(models.Users).options(
        joinedload(models.Users.role), 
        joinedload(models.Users.primary_hub),
        joinedload(models.Users.department)
    ).filter(models.Users.user_id == user_id).first()


