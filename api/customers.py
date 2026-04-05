# File: api/customers.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from core.database import get_db
import crud.customers as crud_customers

router = APIRouter(prefix="/api/customers", tags=["Customers"])

@router.post("")
def create_customer(data: dict, db: Session = Depends(get_db)):
    """API tạo khách hàng mới phục vụ Master Data"""
    # Kiểm tra trùng mã
    if data.get("customer_code"):
        existing = crud_customers.get_customer_by_code(db, data["customer_code"])
        if existing:
            raise HTTPException(status_code=400, detail="Mã khách hàng đã tồn tại")
            
    return crud_customers.create_customer_record(db, data)

@router.get("", response_model=List[dict])
def list_customers(db: Session = Depends(get_db)):
    """API lấy danh sách khách hàng (Shop)"""
    customers = crud_customers.get_all_customers(db)
    # Trả về các trường thực tế có trong Model Customers của bạn
    return [
        {
            "customer_id": c.customer_id, 
            "customer_code": c.customer_code,
            "company_name": c.company_name, 
            "email": c.email,
            "customer_type": c.customer_type,
            "status": c.status
        } 
        for c in customers
    ]