from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Chuỗi kết nối tới Database của bạn
SQLALCHEMY_DATABASE_URL = "postgresql://admin:secret@localhost:5433/smartpost_db"

# Tạo engine kết nối
engine = create_engine(SQLALCHEMY_DATABASE_URL)

# Tạo SessionLocal dùng để tương tác với DB trong mỗi API
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Hàm lấy DB session (sẽ dùng làm Dependency trong FastAPI)
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()