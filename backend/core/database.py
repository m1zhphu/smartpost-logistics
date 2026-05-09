import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase

# Ưu tiên lấy chuỗi kết nối từ biến môi trường của Render
SQLALCHEMY_DATABASE_URL = os.environ.get("DATABASE_URL")

# Nếu không có biến môi trường (khi chạy ở máy cá nhân), dùng localhost làm phao cứu sinh
if not SQLALCHEMY_DATABASE_URL:
    SQLALCHEMY_DATABASE_URL = "postgresql://admin:secret@localhost:5433/smartpost_db"

# Tạo engine kết nối
engine = create_engine(SQLALCHEMY_DATABASE_URL)

# Tạo SessionLocal dùng để tương tác với DB trong mỗi API
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

class Base(DeclarativeBase):
    pass
# ---------------------

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()