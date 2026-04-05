# File: crud/customers.py
from sqlalchemy.orm import Session
import models

def create_customer_record(db: Session, customer_data: dict):
    # Nếu không có mã khách hàng, tự sinh mã dựa trên timestamp
    if not customer_data.get("customer_code"):
        from datetime import datetime
        customer_data["customer_code"] = f"CUST{int(datetime.utcnow().timestamp())}"
    
    new_cust = models.Customers(**customer_data)
    db.add(new_cust)
    db.commit()
    db.refresh(new_cust)
    return new_cust

def get_all_customers(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Customers).offset(skip).limit(limit).all()

def get_customer_by_code(db: Session, code: str):
    return db.query(models.Customers).filter(models.Customers.customer_code == code).first()