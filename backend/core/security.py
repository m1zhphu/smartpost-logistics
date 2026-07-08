# File: core/security.py
from datetime import datetime, timedelta

import bcrypt
import jwt
from fastapi import Depends, HTTPException, Request
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

import models
from core.database import get_db

SECRET_KEY = "smartpost_super_secret_key_mvp_2026"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 1440


def get_password_hash(password: str) -> str:
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode("utf-8"), salt)
    return hashed.decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))


def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


security = HTTPBearer()
AUTH_INVALID_HEADERS = {"X-Auth-Invalid": "1"}


def _get_permissions_from_role(user):
    return user.role.permissions if user.role and user.role.permissions else {}


def get_current_user(
    request: Request,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
):
    token = credentials.credentials
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("user_id")
        username = payload.get("sub")
    except Exception:
        raise HTTPException(status_code=401, detail="Phiên đăng nhập đã hết hạn hoặc không hợp lệ", headers=AUTH_INVALID_HEADERS)

    user = db.query(models.Users).filter(
        models.Users.user_id == user_id,
        models.Users.username == username,
    ).first()
    if not user:
        raise HTTPException(status_code=401, detail="Tài khoản không tồn tại", headers=AUTH_INVALID_HEADERS)
    if user.is_deleted:
        raise HTTPException(status_code=403, detail="Tài khoản đã bị xóa mềm, vui lòng liên hệ quản trị viên", headers=AUTH_INVALID_HEADERS)
    if user.is_active is False or user.status is False:
        raise HTTPException(status_code=403, detail="Tài khoản đang bị khóa, vui lòng liên hệ quản trị viên", headers=AUTH_INVALID_HEADERS)
    if user.role_id == 6 and user.customer_id:
        customer = db.query(models.Customers).filter(
            models.Customers.customer_id == user.customer_id
        ).first()
        if not customer or customer.status == "DELETED":
            raise HTTPException(status_code=403, detail="Hồ sơ khách hàng đã bị xóa, vui lòng liên hệ quản trị viên", headers=AUTH_INVALID_HEADERS)
        if customer.status != "ACTIVE":
            raise HTTPException(status_code=403, detail="Hồ sơ khách hàng đã ngừng hợp tác, vui lòng liên hệ quản trị viên", headers=AUTH_INVALID_HEADERS)

    # Đọc thông tin bưu cục được admin chọn từ header
    primary_hub_id = user.primary_hub_id
    role_id = user.role_id
    is_hub_admin = user.role_id == 2
    
    selected_hub_id = request.headers.get("X-Selected-Hub-Id")
    if user.role_id == 1 and selected_hub_id:
        try:
            primary_hub_id = int(selected_hub_id)
            # Khi Admin chuyển đổi sang bưu cục cụ thể, cho phép hoạt động với quyền hạn như Hub Admin của bưu cục đó
            role_id = 2
            is_hub_admin = True
        except ValueError:
            pass

    permissions = _get_permissions_from_role(user) or payload.get("permissions", {})
    return {
        "user_id": user.user_id,
        "username": user.username,
        "role_id": role_id,
        "customer_id": user.customer_id,
        "primary_hub_id": primary_hub_id,
        "permissions": permissions,
        "is_super_admin": permissions.get("all") is True,
        "is_hub_admin": is_hub_admin,
        "is_shipper": user.role_id == 4,
    }
