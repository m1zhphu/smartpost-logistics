from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from core.database import get_db
import crud.customers as crud_customers
from schemas.customers import CustomerCreate

router = APIRouter(prefix="/api/customers", tags=["Customers"])

@router.post("")
def create_customer(data: CustomerCreate, db: Session = Depends(get_db)):
    """API tạo khách hàng mới phục vụ Master Data"""
    try:
        data_dict = data.dict() 
        
        # 1. Kiểm tra mã khách hàng trùng lặp qua CRUD
        if data_dict.get("customer_code"):
            existing = crud_customers.get_customer_by_code(db, data_dict["customer_code"])
            if existing:
                raise HTTPException(status_code=400, detail="Mã khách hàng đã tồn tại")
        
        # 2. Bắn toàn bộ payload sang cho CRUD xử lý Database
        new_customer = crud_customers.create_customer_record(db, data_dict)

        return {"message": "Tạo khách hàng thành công", "id": new_customer.customer_id}
    except HTTPException as e:
        raise e
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("", response_model=List[dict])
def list_customers(skip: int = 0, limit: int = 200, db: Session = Depends(get_db)):
    """API lấy danh sách khách hàng (Shop) với đầy đủ thông tin để hiển thị FE"""
    # 1. Lấy dữ liệu thô từ CRUD
    customers = crud_customers.get_all_customers_with_bank(db, skip=skip, limit=limit)
    
    # 2. Format lại dữ liệu cho Frontend (Mapping)
    result = []
    for c in customers:
        # Xử lý an toàn: Lấy tài khoản ngân hàng đầu tiên (Phòng trường hợp bank_accounts là một List)
        bank = None
        if c.bank_accounts:
            bank = c.bank_accounts[0] if isinstance(c.bank_accounts, list) else c.bank_accounts

        result.append({
            "id": c.customer_id,
            "customer_id": c.customer_id,
            "customer_code": c.customer_code,
            "name": c.company_name or c.transaction_name or c.customer_code,
            "company_name": c.company_name,
            "transaction_name": c.transaction_name,
            "email": c.email,
            "phone": c.phone_number,
            "customer_type": c.customer_type,
            "status": c.status,
            "address": c.address_detail,
            "representative_name": c.representative_name,
            
            # Đồng bộ tên biến giống hệt Database để Frontend đọc phát ăn ngay
            "bank_name": bank.bank_name if bank else None,
            "account_number": bank.account_number if bank else None,
            "account_name": bank.account_name if bank else None,
        })
    return result

@router.put("/{customer_id}")
def update_customer(customer_id: int, data: CustomerCreate, db: Session = Depends(get_db)):
    """API cập nhật thông tin khách hàng"""
    # 1. Tìm khách hàng qua CRUD
    customer = crud_customers.get_customer_by_id(db, customer_id)
    if not customer:
        raise HTTPException(status_code=404, detail="Không tìm thấy khách hàng")
    
    # 2. Nhờ CRUD lưu vào Database
    data_dict = data.dict()
    crud_customers.update_customer_record(db, customer, data_dict)
    
    return {"message": "Cập nhật thành công"}

@router.delete("/{customer_id}")
def delete_customer(customer_id: int, db: Session = Depends(get_db)):
    """Xóa mềm khách hàng"""
    # 1. Tìm khách hàng qua CRUD
    customer = crud_customers.get_customer_by_id(db, customer_id)
    if not customer:
        raise HTTPException(status_code=404, detail="Không tìm thấy khách hàng")
    
    # 2. Nhờ CRUD xóa khỏi Database
    crud_customers.delete_customer_record(db, customer)
    return {"message": "Đã xóa khách hàng"}