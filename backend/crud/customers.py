from sqlalchemy import or_
from sqlalchemy.orm import Session, joinedload
import models
from core.security import get_password_hash

def build_address_detail(data_dict: dict):
    parts = [
        data_dict.get("street_address"),
        data_dict.get("ward"),
        data_dict.get("province"),
        data_dict.get("country"),
    ]
    structured_address = ", ".join(str(part).strip() for part in parts if part)
    return structured_address or data_dict.get("address") or data_dict.get("address_detail")

def generate_customer_code(db: Session, prefix: str = "KH", width: int = 6):
    existing_codes = db.query(models.Customers.customer_code).filter(
        models.Customers.customer_code.ilike(f"{prefix}%")
    ).all()
    max_number = 0
    for (code,) in existing_codes:
        suffix = str(code or "")[len(prefix):]
        if suffix.isdigit():
            max_number = max(max_number, int(suffix))

    next_number = max_number + 1
    while True:
        candidate = f"{prefix}{next_number:0{width}d}"
        exists = db.query(models.Customers).filter(
            models.Customers.customer_code == candidate
        ).first()
        if not exists:
            return candidate
        next_number += 1

def get_primary_customer_user(customer):
    accounts = getattr(customer, "user_accounts", None) or []
    return accounts[0] if accounts else None

def generate_customer_username(db: Session, customer_code: str):
    base = "".join(ch.lower() for ch in str(customer_code or "customer") if ch.isalnum()) or "customer"
    username = base
    suffix = 1
    while db.query(models.Users).filter(models.Users.username == username).first():
        suffix += 1
        username = f"{base}{suffix}"
    return username

def upsert_customer_user_account(db: Session, customer: models.Customers, data_dict: dict):
    username = (data_dict.get("username") or "").strip()
    password = data_dict.get("password")
    user = get_primary_customer_user(customer)

    if user:
        if username and username != user.username:
            existing = db.query(models.Users).filter(
                models.Users.username == username,
                models.Users.user_id != user.user_id
            ).first()
            if existing:
                raise ValueError("Tên đăng nhập khách hàng đã tồn tại")
            user.username = username
        if password:
            user.password_hash = get_password_hash(password)
        user.full_name = customer.transaction_name or customer.company_name or user.full_name
        user.phone_number = customer.phone_number
        user.email = customer.email
        user.role_id = 6
        user.status = customer.status != "DELETED"
        user.is_active = customer.status == "ACTIVE"
        user.is_deleted = customer.status == "DELETED"
        return user

    account_username = username or generate_customer_username(db, customer.customer_code)
    if db.query(models.Users).filter(models.Users.username == account_username).first():
        raise ValueError("Tên đăng nhập khách hàng đã tồn tại")
    account_password = password or str(customer.phone_number or customer.customer_code)
    user = models.Users(
        username=account_username,
        password_hash=get_password_hash(account_password),
        full_name=customer.transaction_name or customer.company_name or customer.customer_code,
        phone_number=customer.phone_number,
        email=customer.email,
        role_id=6,
        customer_id=customer.customer_id,
        status=True,
        is_active=customer.status == "ACTIVE",
        is_deleted=False,
    )
    db.add(user)
    db.flush()
    return user

def sync_customer_user_status(db: Session, customer: models.Customers):
    is_active = customer.status == "ACTIVE"
    is_deleted = customer.status == "DELETED"
    users = db.query(models.Users).filter(models.Users.customer_id == customer.customer_id).all()
    for user in users:
        user.status = is_active
        user.is_active = is_active
        user.is_deleted = is_deleted
    db.flush()
    return users

def customer_has_business_data(db: Session, customer_id: int) -> bool:
    checks = [
        db.query(models.Waybills.waybill_id).filter(models.Waybills.customer_id == customer_id).first(),
        db.query(models.BookingRequests.request_id).filter(models.BookingRequests.customer_id == customer_id).first(),
        db.query(models.Bags.bag_id).filter(models.Bags.customer_id == customer_id).first(),
        db.query(models.StatementCOD.statement_id).filter(models.StatementCOD.customer_id == customer_id).first(),
        db.query(models.StatementDebt.statement_id).filter(models.StatementDebt.customer_id == customer_id).first(),
        db.query(models.SupportTickets.id).filter(models.SupportTickets.customer_id == customer_id).first(),
    ]
    return any(checks)

def search_customers(db: Session, query: str, limit: int = 50):
    """Tìm kiếm khách hàng theo mã, tên, hoặc số điện thoại"""
    if not query:
        return []

    keyword = f"%{query.strip()}%"
    return (
        db.query(models.Customers)
        .options(
            joinedload(models.Customers.bank_accounts),
            joinedload(models.Customers.customer_price_mapping).joinedload(models.CustomerPriceMapping.policy),
        )
        .filter(
            models.Customers.status == "ACTIVE",
            or_(
                models.Customers.customer_code.ilike(keyword),
                models.Customers.company_name.ilike(keyword),
                models.Customers.transaction_name.ilike(keyword),
                models.Customers.phone_number.ilike(keyword),
            )
        )
        .limit(limit)
        .all()
    )


def get_all_customers_with_bank(
    db: Session,
    skip: int = 0,
    limit: int = 200,
    include_deleted: bool = False,
    staff_in_charge_id: int | None = None,
    query_text: str | None = None,
    unassigned_only: bool = False,
    status_filter: str | None = None,
):
    """Lấy danh sách khách hàng kèm thông tin ngân hàng (Eager Loading)"""
    query = db.query(models.Customers).options(
        joinedload(models.Customers.bank_accounts),
        joinedload(models.Customers.staff_in_charge),
        joinedload(models.Customers.user_accounts),
        joinedload(models.Customers.customer_price_mapping).joinedload(models.CustomerPriceMapping.policy)
    )
    if status_filter:
        query = query.filter(models.Customers.status == status_filter)
    elif not include_deleted:
        query = query.filter(models.Customers.status != "DELETED")
    if unassigned_only:
        query = query.filter(models.Customers.staff_in_charge_id.is_(None))
    if staff_in_charge_id:
        query = query.filter(models.Customers.staff_in_charge_id == staff_in_charge_id)
    if query_text:
        keyword = f"%{query_text.strip()}%"
        query = query.filter(
            or_(
                models.Customers.customer_code.ilike(keyword),
                models.Customers.company_name.ilike(keyword),
                models.Customers.transaction_name.ilike(keyword),
                models.Customers.phone_number.ilike(keyword),
                models.Customers.email.ilike(keyword),
            )
        )
    return query.offset(skip).limit(limit).all()

def get_customer_by_code(db: Session, code: str, include_deleted: bool = False):
    """Tìm khách hàng theo mã Code"""
    query = db.query(models.Customers).options(
        joinedload(models.Customers.user_accounts),
        joinedload(models.Customers.customer_price_mapping).joinedload(models.CustomerPriceMapping.policy)
    ).filter(models.Customers.customer_code == code)
    if not include_deleted:
        query = query.filter(models.Customers.status != "DELETED")
    return query.first()

def get_customer_by_id(db: Session, customer_id: int, include_deleted: bool = False):
    """Tìm khách hàng theo ID"""
    query = db.query(models.Customers).options(
        joinedload(models.Customers.user_accounts),
        joinedload(models.Customers.customer_price_mapping).joinedload(models.CustomerPriceMapping.policy)
    ).filter(models.Customers.customer_id == customer_id)
    if not include_deleted:
        query = query.filter(models.Customers.status != "DELETED")
    return query.first()

def create_customer_record(db: Session, data_dict: dict):
    """Tạo mới khách hàng và tài khoản ngân hàng liên đới"""
    # 1. Map dữ liệu cơ bản
    mapped = {
        "customer_code":       data_dict.get("customer_code", ""),
        "customer_type":       data_dict.get("customer_type", "SHOP"),
        "company_name":        data_dict.get("company_name") or data_dict.get("name"),
        "transaction_name":    data_dict.get("name") or data_dict.get("transaction_name"),
        "representative_name": data_dict.get("representative_name"),
        "staff_in_charge_id":  data_dict.get("staff_in_charge_id"),
        "tax_code":            data_dict.get("tax_code"),
        "email":               data_dict.get("email"),
        "phone_number":        data_dict.get("phone") or data_dict.get("phone_number"),
        "country":             data_dict.get("country"),
        "province_name":       data_dict.get("province") or data_dict.get("province_name"),
        "ward_name":           data_dict.get("ward") or data_dict.get("ward_name"),
        "street_address":      data_dict.get("street_address"),
        "address_detail":      build_address_detail(data_dict),
        "status":              data_dict.get("status", "ACTIVE"),
    }

    # Nếu không có mã khách hàng, tự sinh mã theo Timestamp
    if not mapped.get("customer_code"):
        mapped["customer_code"] = generate_customer_code(db)
    
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

    upsert_customer_user_account(db, new_cust, data_dict)
    db.commit()
    db.refresh(new_cust)

    return new_cust

def update_customer_record(db: Session, customer: models.Customers, data_dict: dict):
    """Cập nhật thông tin khách hàng và tài khoản ngân hàng"""
    # 1. Cập nhật thông tin chính
    customer.customer_type = data_dict.get("customer_type") or customer.customer_type
    customer.company_name = data_dict.get("company_name") or customer.company_name
    customer.transaction_name = data_dict.get("name") or customer.transaction_name
    customer.representative_name = data_dict.get("representative_name") or customer.representative_name
    customer.staff_in_charge_id = data_dict.get("staff_in_charge_id") or customer.staff_in_charge_id
    customer.tax_code = data_dict.get("tax_code") or customer.tax_code
    customer.email = data_dict.get("email") or customer.email
    customer.phone_number = data_dict.get("phone") or customer.phone_number
    customer.country = data_dict.get("country") or customer.country
    customer.province_name = data_dict.get("province") or data_dict.get("province_name") or customer.province_name
    customer.ward_name = data_dict.get("ward") or data_dict.get("ward_name") or customer.ward_name
    customer.street_address = data_dict.get("street_address") or customer.street_address
    customer.address_detail = build_address_detail(data_dict) or customer.address_detail
    
    if "status" in data_dict:
        customer.status = data_dict["status"]
        
    # 2. Cập nhật thông tin ngân hàng
    if data_dict.get("bank_name") or data_dict.get("bank_number"):
        bank = db.query(models.BankAccounts).filter(models.BankAccounts.customer_id == customer.customer_id).first()
        if not bank:
            bank = models.BankAccounts(customer_id=customer.customer_id)
            db.add(bank)
            
        bank.bank_name = data_dict.get("bank_name", bank.bank_name)
        bank.account_number = data_dict.get("bank_number", bank.account_number)
        bank.account_name = data_dict.get("bank_owner", bank.account_name)

    upsert_customer_user_account(db, customer, data_dict)
    sync_customer_user_status(db, customer)
    db.commit()
    return customer

def delete_customer_record(db: Session, customer: models.Customers):
    """Xoa khach hang neu chua co phat sinh, nguoc lai chuyen ngung hop tac."""
    if customer_has_business_data(db, customer.customer_id):
        customer.status = "INACTIVE"
        result = "INACTIVE"
    else:
        customer.status = "DELETED"
        result = "DELETED"
    sync_customer_user_status(db, customer)
    db.commit()
    return customer, result
