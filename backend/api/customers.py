from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from core.database import get_db
from core.security import get_current_user
import crud.customers as crud_customers
import crud.pricing as crud_pricing
from schemas.customers import CustomerAssignStaff, CustomerCreate, CustomerSelfUpdate
import models

router = APIRouter(prefix="/api/customers", tags=["Customers"])

def _require_customer_view_role(current_user: dict):
    if current_user.get("role_id") not in [1, 2, 5, 7]:
        raise HTTPException(status_code=403, detail="Không có quyền xem khách hàng")

def _require_customer_manage_role(current_user: dict):
    if current_user.get("role_id") not in [1, 2, 7]:
        raise HTTPException(status_code=403, detail="Không có quyền quản lý khách hàng")

def _validate_staff_in_charge(db: Session, staff_id: int):
    staff = db.query(models.Users).filter(
        models.Users.user_id == staff_id,
        models.Users.is_active == True,
        models.Users.role_id != 6
    ).first()
    if not staff:
        raise HTTPException(status_code=400, detail="Nhân viên quản lý khách hàng không hợp lệ")
    return staff

def _validate_pricing_policy(db: Session, policy_id: int | None):
    if not policy_id:
        return None
    policy = crud_pricing.get_policy_by_id(db, policy_id)
    if not policy or not policy.is_active:
        raise HTTPException(status_code=400, detail="Bảng giá không hợp lệ")
    return policy

def _customer_policy_payload(customer):
    mapping = customer.customer_price_mapping[0] if customer.customer_price_mapping else None
    policy = mapping.policy if mapping else None
    return {
        "policy_id": mapping.policy_id if mapping else None,
        "policy_name": policy.policy_name if policy else None,
        "policy_assigned": bool(mapping),
    }

def _customer_account_payload(customer):
    account = customer.user_accounts[0] if customer.user_accounts else None
    return {
        "account_user_id": account.user_id if account else None,
        "username": account.username if account else None,
        "account_username": account.username if account else None,
        "account_is_active": account.is_active if account else None,
    }

def _customer_response_payload(customer):
    bank = None
    if customer.bank_accounts:
        bank = customer.bank_accounts[0] if isinstance(customer.bank_accounts, list) else customer.bank_accounts

    return {
        "id": customer.customer_id,
        "customer_id": customer.customer_id,
        "customer_code": customer.customer_code,
        "name": customer.company_name or customer.transaction_name or customer.customer_code,
        "company_name": customer.company_name,
        "transaction_name": customer.transaction_name,
        "email": customer.email,
        "phone": customer.phone_number,
        "phone_number": customer.phone_number,
        "customer_type": customer.customer_type,
        "status": customer.status,
        "address": customer.address_detail,
        "address_detail": customer.address_detail,
        "country": customer.country,
        "province": customer.province_name,
        "province_name": customer.province_name,
        "ward": customer.ward_name,
        "ward_name": customer.ward_name,
        "street_address": customer.street_address,
        "representative_name": customer.representative_name,
        "tax_code": customer.tax_code,
        "staff_in_charge_id": customer.staff_in_charge_id,
        "staff_in_charge_name": customer.staff_in_charge.full_name if customer.staff_in_charge else None,
        "province_id": customer.province_id,
        "district_id": customer.district_id,
        "ward_id": customer.ward_id,
        "bank_name": bank.bank_name if bank else None,
        "bank_number": bank.account_number if bank else None,
        "bank_owner": bank.account_name if bank else None,
        "account_number": bank.account_number if bank else None,
        "account_name": bank.account_name if bank else None,
        **_customer_policy_payload(customer),
        **_customer_account_payload(customer),
    }

def _require_customer_self(current_user: dict):
    if current_user.get("role_id") != 6 or not current_user.get("customer_id"):
        raise HTTPException(status_code=403, detail="Chỉ tài khoản khách hàng mới được cập nhật hồ sơ này")

def _get_current_customer(db: Session, current_user: dict):
    _require_customer_self(current_user)
    customer = crud_customers.get_customer_by_id(db, current_user["customer_id"])
    if not customer:
        raise HTTPException(status_code=404, detail="Không tìm thấy hồ sơ khách hàng")
    if customer.status != "ACTIVE":
        raise HTTPException(status_code=403, detail="Hồ sơ khách hàng không còn hoạt động")
    return customer

def _ensure_customer_self_email_available(db: Session, email: str | None, customer_id: int, user_id: int):
    if not email:
        return
    existing_customer = db.query(models.Customers).filter(
        models.Customers.email == email,
        models.Customers.customer_id != customer_id,
        models.Customers.status != "DELETED",
    ).first()
    if existing_customer:
        raise HTTPException(status_code=400, detail="Email đã tồn tại trong hồ sơ khách hàng khác")

    existing_user = db.query(models.Users).filter(
        models.Users.email == email,
        models.Users.user_id != user_id,
        models.Users.is_deleted == False,
    ).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email đã tồn tại trong tài khoản khác")

def _ensure_customer_scope(customer, current_user: dict):
    if current_user.get("role_id") == 7 and customer.staff_in_charge_id != current_user.get("user_id"):
        raise HTTPException(status_code=403, detail="Bạn không có quyền thao tác khách hàng này")

def _ensure_customer_assign_scope(current_user: dict, staff_id: int):
    if current_user.get("role_id") == 7 and staff_id != current_user.get("user_id"):
        raise HTTPException(status_code=403, detail="CSKH chi co the gan khach hang cho chinh minh")

@router.get("/me")
def get_my_customer_profile(db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    customer = _get_current_customer(db, current_user)
    return _customer_response_payload(customer)

@router.patch("/me")
def update_my_customer_profile(
    data: CustomerSelfUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    customer = _get_current_customer(db, current_user)
    data_dict = data.dict(exclude_unset=True)

    email = data_dict.get("email")
    if email is not None:
        data_dict["email"] = email.strip().lower()
    _ensure_customer_self_email_available(
        db,
        data_dict.get("email"),
        customer.customer_id,
        current_user["user_id"],
    )

    try:
        customer = crud_customers.update_customer_self_profile(db, customer, data_dict)
    except ValueError as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))

    return {
        "message": "Cập nhật hồ sơ khách hàng thành công",
        "customer": _customer_response_payload(customer),
    }

@router.delete("/me")
def delete_my_customer_account(db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    """Soft delete the currently authenticated customer account."""
    customer = _get_current_customer(db, current_user)
    customer, result = crud_customers.delete_customer_record(db, customer)
    if result == "INACTIVE":
        return {
            "message": "Tai khoan da co phat sinh nghiep vu nen he thong da chuyen sang trang thai ngung hoat dong.",
            "id": customer.customer_id,
            "customer_id": customer.customer_id,
            "status": customer.status,
            "action": "INACTIVATED",
        }
    return {
        "message": "Da xoa mem tai khoan khach hang",
        "id": customer.customer_id,
        "customer_id": customer.customer_id,
        "status": customer.status,
        "action": "DELETED",
    }

@router.post("")
def create_customer(data: CustomerCreate, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    """API tạo khách hàng mới phục vụ Master Data"""
    _require_customer_manage_role(current_user)
    try:
        data_dict = data.dict() 
        
        # 1. Kiểm tra mã khách hàng trùng lặp qua CRUD
        if data_dict.get("customer_code"):
            existing = crud_customers.get_customer_by_code(db, data_dict["customer_code"])
            if existing:
                raise HTTPException(status_code=400, detail="Mã khách hàng đã tồn tại")
        
        # 2. Bắn toàn bộ payload sang cho CRUD xử lý Database
        if current_user.get("role_id") == 7:
            data_dict["staff_in_charge_id"] = current_user.get("user_id")

        _validate_staff_in_charge(db, data_dict.get("staff_in_charge_id"))
        _validate_pricing_policy(db, data_dict.get("policy_id"))
        try:
            new_customer = crud_customers.create_customer_record(db, data_dict)
            if data_dict.get("policy_id"):
                crud_pricing.set_customer_policy(db, new_customer.customer_id, data_dict["policy_id"])
            db.commit()
        except ValueError as e:
            db.rollback()
            raise HTTPException(status_code=400, detail=str(e))

        return {"message": "Tạo khách hàng thành công", "id": new_customer.customer_id}
    except HTTPException as e:
        raise e
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/code/{customer_code}")
def get_customer_by_code(customer_code: str, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    """API tra cứu nhanh chi tiết thông tin khách hàng theo Mã Khách Hàng (autofill)"""
    _require_customer_view_role(current_user)
    customer = crud_customers.get_customer_by_code(db, customer_code)
    if not customer:
        raise HTTPException(status_code=404, detail="Không tìm thấy khách hàng với mã này")
    if customer.status != "ACTIVE":
        raise HTTPException(status_code=400, detail="Hồ sơ khách hàng không còn hoạt động")
    
    _ensure_customer_scope(customer, current_user)

    bank = None
    if customer.bank_accounts:
        bank = customer.bank_accounts[0] if isinstance(customer.bank_accounts, list) else customer.bank_accounts

    policy_payload = _customer_policy_payload(customer)
    return {
        "id": customer.customer_id,
        "customer_id": customer.customer_id,
        "customer_code": customer.customer_code,
        "name": customer.company_name or customer.transaction_name or customer.customer_code,
        "company_name": customer.company_name,
        "transaction_name": customer.transaction_name,
        "email": customer.email,
        "phone": customer.phone_number,
        "customer_type": customer.customer_type,
        "status": customer.status,
        "address": customer.address_detail,
        "country": customer.country,
        "province": customer.province_name,
        "province_name": customer.province_name,
        "ward": customer.ward_name,
        "ward_name": customer.ward_name,
        "street_address": customer.street_address,
        "representative_name": customer.representative_name,
        "tax_code": customer.tax_code,
        **policy_payload,
        "staff_in_charge_id": customer.staff_in_charge_id,
        "staff_in_charge_name": customer.staff_in_charge.full_name if customer.staff_in_charge else None,
        "province_id": customer.province_id,
        "district_id": customer.district_id,
        "ward_id": customer.ward_id,
        "bank_name": bank.bank_name if bank else None,
        "bank_number": bank.account_number if bank else None,
        "bank_owner": bank.account_name if bank else None,
        "account_number": bank.account_number if bank else None,
        "account_name": bank.account_name if bank else None,
        **_customer_account_payload(customer),
    }

@router.get("", response_model=List[dict])
def list_customers(
    skip: int = 0,
    limit: int = 200,
    include_deleted: bool = False,
    q: str = "",
    mine: bool = False,
    staff_in_charge_id: int | None = None,
    unassigned: bool = False,
    status: str | None = None,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """API lấy danh sách khách hàng (Shop) với đầy đủ thông tin để hiển thị FE"""
    _require_customer_view_role(current_user)
    # 1. Lấy dữ liệu thô từ CRUD
    effective_staff_id = current_user.get("user_id") if mine else staff_in_charge_id

    customers = crud_customers.get_all_customers_with_bank(
        db,
        skip=skip,
        limit=limit,
        include_deleted=include_deleted,
        staff_in_charge_id=effective_staff_id,
        query_text=q,
        unassigned_only=unassigned,
        status_filter=status or ("ACTIVE" if not include_deleted else None),
    )
    
    # 2. Format lại dữ liệu cho Frontend (Mapping)
    result = []
    for c in customers:
        # Xử lý an toàn: Lấy tài khoản ngân hàng đầu tiên (Phòng trường hợp bank_accounts là một List)
        bank = None
        if c.bank_accounts:
            bank = c.bank_accounts[0] if isinstance(c.bank_accounts, list) else c.bank_accounts

        policy_payload = _customer_policy_payload(c)
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
            "country": c.country,
            "province": c.province_name,
            "province_name": c.province_name,
            "ward": c.ward_name,
            "ward_name": c.ward_name,
            "street_address": c.street_address,
            "representative_name": c.representative_name,
            "tax_code": c.tax_code,
            **policy_payload,
            "staff_in_charge_id": c.staff_in_charge_id,
            "staff_in_charge_name": c.staff_in_charge.full_name if c.staff_in_charge else None,
            
            # Đồng bộ tên biến giống hệt Database để Frontend đọc phát ăn ngay
            "bank_name": bank.bank_name if bank else None,
            "bank_number": bank.account_number if bank else None,
            "bank_owner": bank.account_name if bank else None,
            "account_number": bank.account_number if bank else None,
            "account_name": bank.account_name if bank else None,
            **_customer_account_payload(c),
        })
    return result

@router.patch("/{customer_id}/staff-in-charge")
def assign_customer_staff(
    customer_id: int,
    data: CustomerAssignStaff,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Gán nhân viên quản lý cho khách hàng."""
    _require_customer_manage_role(current_user)
    customer = crud_customers.get_customer_by_id(db, customer_id)
    if not customer:
        raise HTTPException(status_code=404, detail="Không tìm thấy khách hàng")

    _validate_staff_in_charge(db, data.staff_in_charge_id)
    _ensure_customer_assign_scope(current_user, data.staff_in_charge_id)

    customer.staff_in_charge_id = data.staff_in_charge_id
    db.commit()
    return {"message": "Gán nhân viên quản lý thành công", "id": customer.customer_id}

@router.get("/search", response_model=List[dict])
def search_customers(q: str = "", limit: int = 50, db: Session = Depends(get_db)):
    """API tìm kiếm khách hàng theo mã, tên hoặc số điện thoại"""
    if not q:
        return []

    customers = crud_customers.search_customers(db, q, limit=limit)
    result = []
    for c in customers:
        bank = None
        if c.bank_accounts:
            bank = c.bank_accounts[0] if isinstance(c.bank_accounts, list) else c.bank_accounts

        policy_payload = _customer_policy_payload(c)
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
            "country": c.country,
            "province": c.province_name,
            "province_name": c.province_name,
            "ward": c.ward_name,
            "ward_name": c.ward_name,
            "street_address": c.street_address,
            "representative_name": c.representative_name,
            "tax_code": c.tax_code,
            **policy_payload,
            "staff_in_charge_id": c.staff_in_charge_id,
            "staff_in_charge_name": c.staff_in_charge.full_name if c.staff_in_charge else None,
            "bank_name": bank.bank_name if bank else None,
            "bank_number": bank.account_number if bank else None,
            "bank_owner": bank.account_name if bank else None,
            "account_number": bank.account_number if bank else None,
            "account_name": bank.account_name if bank else None,
            **_customer_account_payload(c),
        })
    return result

@router.put("/{customer_id}")
def update_customer(customer_id: int, data: CustomerCreate, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    """API cập nhật thông tin khách hàng"""
    _require_customer_manage_role(current_user)
    # 1. Tìm khách hàng qua CRUD
    customer = crud_customers.get_customer_by_id(db, customer_id)
    if not customer:
        raise HTTPException(status_code=404, detail="Không tìm thấy khách hàng")
    
    # 2. Nhờ CRUD lưu vào Database
    _ensure_customer_scope(customer, current_user)
    data_dict = data.dict()
    if current_user.get("role_id") == 7:
        data_dict["staff_in_charge_id"] = current_user.get("user_id")
    _validate_staff_in_charge(db, data_dict.get("staff_in_charge_id"))
    _validate_pricing_policy(db, data_dict.get("policy_id"))
    try:
        crud_customers.update_customer_record(db, customer, data_dict)
        if data_dict.get("policy_id"):
            crud_pricing.set_customer_policy(db, customer.customer_id, data_dict["policy_id"])
        else:
            crud_pricing.clear_customer_policy(db, customer.customer_id)
        db.commit()
    except ValueError as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    
    return {"message": "Cập nhật thành công"}

@router.delete("/{customer_id}")
def delete_customer(customer_id: int, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    """Xoa mem khach hang hoac chuyen ngung hop tac neu da co phat sinh."""
    _require_customer_manage_role(current_user)
    customer = crud_customers.get_customer_by_id(db, customer_id)
    if not customer:
        raise HTTPException(status_code=404, detail="Kh\u00f4ng t\u00ecm th\u1ea5y kh\u00e1ch h\u00e0ng")

    _ensure_customer_scope(customer, current_user)
    customer, result = crud_customers.delete_customer_record(db, customer)
    if result == "INACTIVE":
        return {
            "message": "Kh\u00e1ch h\u00e0ng \u0111\u00e3 c\u00f3 ph\u00e1t sinh nghi\u1ec7p v\u1ee5 n\u00ean kh\u00f4ng th\u1ec3 x\u00f3a. H\u1ec7 th\u1ed1ng \u0111\u00e3 chuy\u1ec3n sang tr\u1ea1ng th\u00e1i ng\u1eebng h\u1ee3p t\u00e1c.",
            "id": customer.customer_id,
            "status": customer.status,
            "action": "INACTIVATED",
        }
    return {"message": "\u0110\u00e3 x\u00f3a m\u1ec1m kh\u00e1ch h\u00e0ng", "id": customer.customer_id, "status": customer.status, "action": "DELETED"}
