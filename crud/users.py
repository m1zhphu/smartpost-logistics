# File: crud/users.py
from sqlalchemy.orm import Session
import models
from core.security import get_password_hash
from datetime import datetime

def get_user_by_id(db: Session, user_id: int):
    return db.query(models.Users).filter(models.Users.user_id == user_id, models.Users.is_deleted == False).first()

def get_all_users(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Users).filter(models.Users.is_deleted == False).offset(skip).limit(limit).all()

def create_user_record(db: Session, user_data: dict):
    """Tạo nhân viên mới và băm mật khẩu"""
    # Băm mật khẩu trước khi lưu
    hashed_pwd = get_password_hash(user_data['password'])
    del user_data['password']
    
    new_user = models.Users(
        **user_data,
        password_hash=hashed_pwd,
        is_active=True,
        is_deleted=False,
        created_at=datetime.utcnow()
    )
    db.add(new_user)
    db.flush()
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