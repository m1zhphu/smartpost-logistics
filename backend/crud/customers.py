# File: crud/customers.py
from sqlalchemy.orm import Session, joinedload
from datetime import datetime
import models

def get_all_customers_with_bank(db: Session, skip: int = 0, limit: int = 200):
    """Lấy danh sách khách hàng kèm thông tin ngân hàng"""
    return db.query(models.Customers).options(
        joinedload(models.Customers.bank_accounts)
    ).offset(skip).limit(limit).all()

def get_customer_by_code(db: Session, code: str):
    return db.query(models.Customers).filter(models.Customers.customer_code == code).first()

def get_customer_by_id(db: Session, customer_id: int):
    return db.query(models.Customers).filter(models.Customers.customer_id == customer_id).first()

def create_customer_record(db: Session, data_dict: dict):
    # 1. Map dữ liệu
    mapped = {
        "customer_code":       data_dict.get("customer_code", ""),
        "customer_type":       data_dict.get("customer_type", "SHOP"),
        "company_name":        data_dict.get("name") or data_dict.get("company_name"),
        "transaction_name":    data_dict.get("name") or data_dict.get("transaction_name"),
        "representative_name": data_dict.get("representative_name"),
        "email":               data_dict.get("email"),
        "phone_number":        data_dict.get("phone") or data_dict.get("phone_number"),
        "address_detail":      data_dict.get("address") or data_dict.get("address_detail"),
        "status":              data_dict.get("status", "ACTIVE"),
    }

    # Nếu không có mã khách hàng, tự sinh mã
    if not mapped.get("customer_code"):
        mapped["customer_code"] = f"CUST{int(datetime.utcnow().timestamp())}"
    
    # Lọc bỏ các trường không tồn tại trong model
    valid_cols = models.Customers.__table__.columns.keys()
    filtered_data = {k: v for k, v in mapped.items() if k in valid_cols}
    
    # Tạo Customer
    new_cust = models.Customers(**filtered_data)
    db.add(new_cust)
    db.commit()
    db.refresh(new_cust)

    # 2. Tạo BankAccount nếu có dữ liệu ngân hàng
    if data_dict.get("bank_name") or data_dict.get("bank_number"):
        bank = models.BankAccounts(
            customer_id=new_cust.customer_id,
            bank_name=data_dict.get("bank_name", ""),
            account_number=data_dict.get("bank_number", ""),
            account_name=data_dict.get("bank_owner", ""),
        )
        db.add(bank)
        db.commit()

    return new_cust

def update_customer_record(db: Session, customer: models.Customers, data_dict: dict):
    # Cập nhật thông tin chính
    customer.customer_type = data_dict.get("customer_type") or customer.customer_type
    customer.company_name = data_dict.get("company_name") or customer.company_name
    customer.transaction_name = data_dict.get("name") or customer.transaction_name
    customer.representative_name = data_dict.get("representative_name") or customer.representative_name
    customer.tax_code = data_dict.get("tax_code") or customer.tax_code
    customer.email = data_dict.get("email") or customer.email
    customer.phone_number = data_dict.get("phone") or customer.phone_number
    customer.address_detail = data_dict.get("address") or customer.address_detail
    
    if "status" in data_dict:
        customer.status = data_dict["status"]
        
    # Cập nhật ngân hàng
    if data_dict.get("bank_name") or data_dict.get("bank_number"):
        bank = db.query(models.BankAccounts).filter(models.BankAccounts.customer_id == customer.customer_id).first()
        if not bank:
            bank = models.BankAccounts(customer_id=customer.customer_id)
            db.add(bank)
        bank.bank_name = data_dict.get("bank_name", bank.bank_name)
        bank.account_number = data_dict.get("bank_number", bank.account_number)
        bank.account_name = data_dict.get("bank_owner", bank.account_name)

    db.commit()
    return customer

def delete_customer_record(db: Session, customer: models.Customers):
    db.delete(customer)
    db.commit()