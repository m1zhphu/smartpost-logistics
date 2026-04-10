# File: crud/hubs.py
from sqlalchemy.orm import Session
import models

def get_hub_by_id(db: Session, hub_id: int):
    """Tìm bưu cục theo ID"""
    return db.query(models.Hubs).filter(models.Hubs.hub_id == hub_id).first()

def get_hub_by_code(db: Session, hub_code: str):
    """Tìm bưu cục theo mã duy nhất [cite: 5]"""
    return db.query(models.Hubs).filter(models.Hubs.hub_code == hub_code).first()

def get_all_hubs(db: Session):
    """Lấy danh sách toàn bộ bưu cục"""
    return db.query(models.Hubs).all()

def create_hub_record(db: Session, hub_data: dict):
    """Lưu bưu cục mới vào Database"""
    new_hub = models.Hubs(**hub_data)
    db.add(new_hub)
    db.flush()
    return new_hub

def update_hub_record(db: Session, hub_id: int, hub_data: dict):
    """Cập nhật thông tin bưu cục"""
    hub = get_hub_by_id(db, hub_id)
    if hub:
        for key, value in hub_data.items():
            if key != "hub_id": # Không cập nhật PK
                setattr(hub, key, value)
        db.flush()
    return hub

def delete_hub_record(db: Session, hub_id: int):
    """Xóa bưu cục"""
    hub = get_hub_by_id(db, hub_id)
    if hub:
        db.delete(hub)
        db.flush()
    return hub