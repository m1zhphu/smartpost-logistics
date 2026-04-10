# File: core/security.py
import jwt
from datetime import datetime, timedelta
from passlib.context import CryptContext
from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

# Cấu hình băm mật khẩu bằng thuật toán bcrypt
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Khóa bí mật để ký JWT Token (Thực tế sau này sẽ giấu vào file .env)
SECRET_KEY = "smartpost_super_secret_key_mvp_2026"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 1440  # Token sống trong 24 giờ (1 ngày)

def get_password_hash(password: str) -> str:
    """Băm mật khẩu trước khi lưu vào DB"""
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Kiểm tra mật khẩu người dùng nhập có khớp với DB không"""
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict, expires_delta: timedelta = None):
    """Tạo vé thông hành (JWT Token) cho User"""
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

# --- THÊM ĐOẠN NÀY XUỐNG DƯỚI CÙNG FILE ---
security = HTTPBearer()

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        
        # Tạo một object "Hồ sơ" để dễ dùng ở các API sau
        user_info = {
            "user_id": payload.get("user_id"),
            "username": payload.get("sub"),
            "role_id": payload.get("role_id"),
            "primary_hub_id": payload.get("primary_hub_id"),
            "permissions": payload.get("permissions", {}),
            # Xác định cấp độ truy cập ngay từ đầu
            "is_super_admin": payload.get("permissions", {}).get("all") is True,
            "is_hub_admin": payload.get("role_id") == 2, # Giả định 2 là Admin Bưu Cục
            "is_shipper": payload.get("role_id") == 3    # Giả định 3 là Shipper
        }
        return user_info
    except Exception:
        raise HTTPException(status_code=401, detail="Phiên bản hết hạn hoặc không hợp lệ")