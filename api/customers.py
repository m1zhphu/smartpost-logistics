# File: api/customers.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from core.database import get_db
from core.security import get_current_user
import models
import schemas.auth as schema_auth # Giả định bạn dùng chung schema hoặc tạo mới schemas/customers.py

router = APIRouter(prefix="/api/customers", tags=["Master Data - Customers"])

@router.get("", response_model=List[dict])
def get_all_customers(db: Session = Depends(get_db)):
    """API lấy danh sách khách hàng gửi hàng """
    customers = db.query(models.Customers).all()
    return [
        {"customer_id": c.customer_id, "name": c.full_name, "phone": c.phone} 
        for c in customers
    ]

@router.post("")
def create_customer(data: dict, db: Session = Depends(get_db)):
    """API tạo khách hàng mới phục vụ Master Data """
    # Bạn có thể bổ sung logic CRUD tại đây
    new_cust = models.Customers(**data)
    db.add(new_cust)
    db.commit()
    return {"message": "Thành công"}