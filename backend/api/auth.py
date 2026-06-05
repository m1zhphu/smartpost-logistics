from datetime import datetime, timedelta
import secrets

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

import crud.auth as crud_auth
import crud.customers as crud_customers
import models
import schemas.auth as schema_auth
from core.database import get_db
from core.security import create_access_token, get_current_user, get_password_hash, verify_password
from services.email_service import send_otp_email


router = APIRouter(prefix="/api", tags=["Authentication"])

REGISTER_OTP_EXPIRE_MINUTES = 10
REGISTER_OTP_RESEND_COOLDOWN_SECONDS = 180
REGISTER_OTP_MAX_ATTEMPTS = 5


def _normalize_email(email: str) -> str:
    return email.strip().lower()


def _ensure_customer_role(db: Session):
    role = crud_auth.get_role_by_name(db, "CUSTOMER")
    if role:
        return role

    return crud_auth.create_role(
        db,
        "CUSTOMER",
        {
            "customer_portal": True,
            "pickup_create": True,
            "tracking_view": True,
        },
    )


def _generate_registered_customer_code(db: Session) -> str:
    return crud_customers.generate_customer_code(db)


def _ensure_login_allowed(user: models.Users):
    if user.is_deleted:
        raise HTTPException(status_code=403, detail="Tài khoản đã bị xóa mềm, vui lòng liên hệ quản trị viên")
    if user.is_active is False or user.status is False:
        raise HTTPException(status_code=403, detail="Tài khoản đang bị khóa, vui lòng liên hệ quản trị viên")

    if user.role_id == 6 and user.customer_id:
        customer = user.customer_account or None
        if not customer:
            raise HTTPException(status_code=403, detail="H\u1ed3 s\u01a1 kh\u00e1ch h\u00e0ng kh\u00f4ng t\u1ed3n t\u1ea1i, vui l\u00f2ng li\u00ean h\u1ec7 qu\u1ea3n tr\u1ecb vi\u00ean")
        if customer.status == "DELETED":
            raise HTTPException(status_code=403, detail="H\u1ed3 s\u01a1 kh\u00e1ch h\u00e0ng \u0111\u00e3 b\u1ecb x\u00f3a, vui l\u00f2ng li\u00ean h\u1ec7 qu\u1ea3n tr\u1ecb vi\u00ean")
        if customer.status != "ACTIVE":
            raise HTTPException(status_code=403, detail="H\u1ed3 s\u01a1 kh\u00e1ch h\u00e0ng \u0111\u00e3 ng\u1eebng h\u1ee3p t\u00e1c, vui l\u00f2ng li\u00ean h\u1ec7 qu\u1ea3n tr\u1ecb vi\u00ean")

@router.post("/setup-admin")
def setup_first_admin(db: Session = Depends(get_db)):
    existing_super_admin = db.query(models.Users).filter(
        models.Users.role_id == 1,
        models.Users.is_deleted == False,
    ).first()
    if existing_super_admin:
        return {"message": "Super Admin đã tồn tại"}

    admin_role = crud_auth.get_role_by_id(db, 1)
    if not admin_role:
        admin_role = models.Roles(role_id=1, role_name="SUPER_ADMIN", permissions={"all": True})
        db.add(admin_role)
        db.commit()

    existing_user = crud_auth.get_user_by_username(db, "admin")
    if existing_user:
        return {"message": "Admin đã tồn tại!"}

    user_data = {
        "username": "admin",
        "password_hash": get_password_hash("123456"),
        "full_name": "Quản trị viên Hệ thống",
        "role_id": 1,
        "status": True,
        "is_active": True,
        "is_deleted": False,
    }
    crud_auth.create_user(db, user_data)
    db.commit()
    return {"message": "Tạo tài khoản Admin thành công!"}


@router.post("/auth/login")
def login(data: schema_auth.LoginSchema, db: Session = Depends(get_db)):
    user = crud_auth.get_user_by_username(db, data.username)

    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Tài khoản hoặc mật khẩu không chính xác")

    _ensure_login_allowed(user)
    role = crud_auth.get_role_by_id(db, user.role_id)
    permissions = role.permissions if role else {}

    access_token = create_access_token(
        data={
            "sub": user.username,
            "user_id": user.user_id,
            "role_id": user.role_id,
            "customer_id": user.customer_id,
            "primary_hub_id": user.primary_hub_id,
            "permissions": permissions,
        }
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "full_name": user.full_name,
    }


@router.get("/auth/me")
def get_auth_me(current_user: dict = Depends(get_current_user)):
    return current_user


@router.post("/auth/register/request-otp", response_model=schema_auth.RegisterOtpResponse)
def request_register_otp(data: schema_auth.RegisterOtpRequest, db: Session = Depends(get_db)):
    """Send OTP to a new customer's email."""
    email = _normalize_email(data.email)

    existing_user = db.query(models.Users).filter(
        models.Users.email == email,
        models.Users.is_deleted == False,
    ).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email đã tồn tại trong tài khoản đăng nhập")

    existing_customer = db.query(models.Customers).filter(
        models.Customers.email == email,
        models.Customers.status != "DELETED",
    ).first()
    if existing_customer:
        raise HTTPException(status_code=400, detail="Email đã tồn tại trong hồ sơ khách hàng")

    cooldown_from = datetime.utcnow() - timedelta(seconds=REGISTER_OTP_RESEND_COOLDOWN_SECONDS)
    recent_otp = db.query(models.AuthOtpCodes).filter(
        models.AuthOtpCodes.email == email,
        models.AuthOtpCodes.purpose == "REGISTER",
        models.AuthOtpCodes.consumed_at.is_(None),
        models.AuthOtpCodes.created_at >= cooldown_from,
    ).order_by(models.AuthOtpCodes.id.desc()).first()
    if recent_otp:
        raise HTTPException(status_code=429, detail="Vui l\u00f2ng \u0111\u1ee3i 3 ph\u00fat tr\u01b0\u1edbc khi y\u00eau c\u1ea7u g\u1eedi l\u1ea1i OTP")

    db.query(models.AuthOtpCodes).filter(
        models.AuthOtpCodes.email == email,
        models.AuthOtpCodes.purpose == "REGISTER",
        models.AuthOtpCodes.consumed_at.is_(None),
    ).update({"consumed_at": datetime.utcnow()})

    otp = f"{secrets.randbelow(1000000):06d}"
    db.add(models.AuthOtpCodes(
        email=email,
        purpose="REGISTER",
        otp_hash=get_password_hash(otp),
        expires_at=datetime.utcnow() + timedelta(minutes=REGISTER_OTP_EXPIRE_MINUTES),
        attempts=0,
    ))

    try:
        email_sent = send_otp_email(email, otp, REGISTER_OTP_EXPIRE_MINUTES)
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Không thể gửi OTP qua email: {str(e)}")

    return {
        "message": "OTP đăng ký đã được gửi tới email",
        "email": email,
        "expires_in_seconds": REGISTER_OTP_EXPIRE_MINUTES * 60,
        "email_sent": email_sent,
    }


@router.post("/auth/register/verify", response_model=schema_auth.RegisterVerifyResponse)
def verify_register_otp(data: schema_auth.CustomerRegisterVerifyRequest, db: Session = Depends(get_db)):
    """Verify OTP and create a new registered customer plus login user."""
    email = _normalize_email(data.email)
    username = data.username.strip()

    existing_username = db.query(models.Users).filter(
        models.Users.username == username,
        models.Users.is_deleted == False,
    ).first()
    if existing_username:
        raise HTTPException(status_code=400, detail="Tên đăng nhập đã được sử dụng")

    existing_user_email = db.query(models.Users).filter(
        models.Users.email == email,
        models.Users.is_deleted == False,
    ).first()
    if existing_user_email:
        raise HTTPException(status_code=400, detail="Email đã tồn tại trong tài khoản đăng nhập")

    existing_customer = db.query(models.Customers).filter(
        models.Customers.email == email,
        models.Customers.status != "DELETED",
    ).first()
    if existing_customer:
        raise HTTPException(status_code=400, detail="Email đã tồn tại trong hồ sơ khách hàng")

    otp_record = db.query(models.AuthOtpCodes).filter(
        models.AuthOtpCodes.email == email,
        models.AuthOtpCodes.purpose == "REGISTER",
        models.AuthOtpCodes.consumed_at.is_(None),
    ).order_by(models.AuthOtpCodes.id.desc()).first()

    if not otp_record:
        raise HTTPException(status_code=400, detail="OTP không tồn tại hoặc đã được sử dụng")

    if otp_record.expires_at < datetime.utcnow():
        otp_record.consumed_at = datetime.utcnow()
        db.commit()
        raise HTTPException(status_code=400, detail="OTP đã hết hạn")

    if otp_record.attempts >= REGISTER_OTP_MAX_ATTEMPTS:
        otp_record.consumed_at = datetime.utcnow()
        db.commit()
        raise HTTPException(status_code=400, detail="OTP đã vượt quá số lần thử")

    if not verify_password(data.otp, otp_record.otp_hash):
        otp_record.attempts += 1
        db.commit()
        raise HTTPException(status_code=400, detail="OTP không chính xác")

    try:
        customer_role = _ensure_customer_role(db)
        db.flush()

        customer = models.Customers(
            customer_code=_generate_registered_customer_code(db),
            customer_type="REGISTERED",
            company_name=None,
            transaction_name=data.full_name,
            representative_name=data.full_name,
            email=email,
            phone_number=data.phone_number,
            province_id=data.province_id,
            district_id=data.district_id,
            ward_id=data.ward_id,
            address_detail=data.address,
            status="ACTIVE",
        )
        db.add(customer)
        db.flush()

        user = models.Users(
            username=username,
            password_hash=get_password_hash(data.password),
            full_name=data.full_name,
            phone_number=data.phone_number,
            email=email,
            role_id=customer_role.role_id,
            customer_id=customer.customer_id,
            status=True,
            is_active=True,
            is_deleted=False,
        )
        db.add(user)
        otp_record.consumed_at = datetime.utcnow()
        db.flush()

        permissions = customer_role.permissions or {}
        access_token = create_access_token(
            data={
                "sub": user.username,
                "user_id": user.user_id,
                "role_id": user.role_id,
                "customer_id": customer.customer_id,
                "primary_hub_id": user.primary_hub_id,
                "permissions": permissions,
            }
        )
        db.commit()

        return {
            "message": "Đăng ký tài khoản khách hàng mới thành công",
            "access_token": access_token,
            "token_type": "bearer",
            "user_id": user.user_id,
            "customer_id": customer.customer_id,
            "role_id": user.role_id,
            "full_name": user.full_name,
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Không thể tạo tài khoản: {str(e)}")


@router.post("/setup-roles-v2")
def setup_roles_v2(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    if current_user.get("role_id") != 1:
        raise HTTPException(status_code=403, detail="Chỉ Super Admin mới được cấu hình lại vai trò hệ thống")
    try:
        roles_data = [
            {"role_id": 1, "role_name": "SUPER_ADMIN", "permissions": {"all": True}},
            {"role_id": 2, "role_name": "HUB_MANAGER", "permissions": {
                "hub_manage": True, "assign_shipper": True, "warehouse_ops": True, "view_report": True, "report_view": True,
            }},
            {"role_id": 3, "role_name": "WAREHOUSE_STAFF", "permissions": {
                "warehouse_ops": True, "scan_in": True, "bagging": True, "manifest_ops": True,
            }},
            {"role_id": 4, "role_name": "SHIPPER", "permissions": {
                "delivery_ops": True, "view_tasks": True, "update_pod": True,
            }},
            {"role_id": 5, "role_name": "ACCOUNTANT", "permissions": {
                "accounting_ops": True, "settle_cod": True, "view_finance": True,
            }},
            {"role_id": 6, "role_name": "CUSTOMER", "permissions": {
                "customer_portal": True,
                "pickup_create": True,
                "tracking_view": True,
                "notification_view": True,
            }},
            {"role_id": 7, "role_name": "CSKH", "permissions": {
                "pickup_create": True,
                "pickup_view_queue": True,
                "pickup_assign_shipper": True,
                "customer_view": True,
                "customer_create": True,
                "customer_update": True,
                "customer_delete": True,
                "pricing_quote": True,
                "notification_view": True,
                "report_view": True,
            }},
        ]

        crud_auth.upsert_roles_bulk(db, roles_data)
        db.commit()
        return {"message": "Đã cấu hình lại toàn bộ hệ thống phân quyền 5 cấp thành công!"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
