# File: crud/hubs.py
from sqlalchemy.orm import Session
import models

def get_hub_by_code(db: Session, hub_code: str):
    """Tìm bưu cục theo mã duy nhất [cite: 5]"""
    return db.query(models.Hubs).filter(models.Hubs.hub_code == hub_code).first()

def get_all_hubs(db: Session):
    """Lấy danh sách toàn bộ bưu cục"""
    return db.query(models.Hubs).filter(models.Hubs.status == True).all()

def create_hub_record(db: Session, hub_data: dict):
    """Lưu bưu cục mới vào Database"""
    new_hub = models.Hubs(**hub_data)
    db.add(new_hub)
    db.flush()
    return new_hub