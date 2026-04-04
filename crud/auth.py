# File: crud/auth.py
from sqlalchemy.orm import Session
import models

def get_role_by_name(db: Session, role_name: str):
    """Tìm quyền theo tên"""
    return db.query(models.Roles).filter(models.Roles.role_name == role_name).first()

def create_role(db: Session, role_name: str, permissions: dict):
    """Tạo quyền mới"""
    new_role = models.Roles(role_name=role_name, permissions=permissions)
    db.add(new_role)
    db.flush()
    return new_role

def get_user_by_username(db: Session, username: str):
    """Tìm người dùng theo tên đăng nhập [cite: 10]"""
    return db.query(models.Users).filter(models.Users.username == username).first()

def create_user(db: Session, user_data: dict):
    """Tạo người dùng mới [cite: 10]"""
    new_user = models.Users(**user_data)
    db.add(new_user)
    return new_user

def get_all_users(db: Session):
    """Lấy danh sách tất cả người dùng [cite: 11]"""
    return db.query(models.Users).all()

def get_role_by_id(db: Session, role_id: int):
    """Tìm thông tin quyền hạn dựa trên ID"""
    return db.query(models.Roles).filter(models.Roles.role_id == role_id).first()