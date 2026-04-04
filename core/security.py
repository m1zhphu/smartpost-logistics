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
    """Bác bảo vệ đứng ở cửa các API: Đọc và giải mã JWT Token"""
    token = credentials.credentials
    try:
        # Giải mã vé xem có phải hàng giả không
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload # Trả về {"sub": "admin", "role_id": 1...}
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Phiên bản đã hết hạn! Vui lòng đăng nhập lại.")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Phiên bản giả mạo hoặc không hợp lệ!")