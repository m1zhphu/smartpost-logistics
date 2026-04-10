# File: update_admin.py
from core.database import SessionLocal
from sqlalchemy import text

def assign_hub_to_admin():
    db = SessionLocal()
    try:
        # Gán primary_hub_id = 1 (Bưu cục Hà Nội) cho tài khoản admin
        db.execute(text("UPDATE users SET primary_hub_id = 1 WHERE username = 'admin';"))
        db.commit()
        print("✅ Đã gán tài khoản Admin vào Bưu cục ID: 1")
    except Exception as e:
        db.rollback()
        print(f"⚠️ Lỗi cập nhật: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    assign_hub_to_admin()