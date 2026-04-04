# File: seed.py
from core.database import SessionLocal
from core.security import get_password_hash
import models

def seed_data():
    db = SessionLocal()
    try:
        # 1. Tạo các Vai trò (Roles) - Có kiểm tra tồn tại
        admin_role = db.query(models.Roles).filter_by(role_name="ADMIN").first()
        if not admin_role:
            admin_role = models.Roles(role_name="ADMIN", permissions={"all": True})
            db.add(admin_role)
            db.flush()

        shipper_role = db.query(models.Roles).filter_by(role_name="SHIPPER").first()
        if not shipper_role:
            shipper_role = models.Roles(role_name="SHIPPER", permissions={"delivery_manage": True})
            db.add(shipper_role)

        accountant_role = db.query(models.Roles).filter_by(role_name="ACCOUNTANT").first()
        if not accountant_role:
            accountant_role = models.Roles(role_name="ACCOUNTANT", permissions={"accounting_manage": True, "report_view": True})
            db.add(accountant_role)
            
        db.commit()

        # 2. Tạo Bưu cục mẫu (Hubs) - Có kiểm tra tồn tại
        hn_hub = db.query(models.Hubs).filter_by(hub_code="HN01").first()
        if not hn_hub:
            hn_hub = models.Hubs(hub_code="HN01", hub_name="Bưu cục Hà Nội", hub_type="SENDER", status=True)
            db.add(hn_hub)

        sg_hub = db.query(models.Hubs).filter_by(hub_code="SG01").first()
        if not sg_hub:
            sg_hub = models.Hubs(hub_code="SG01", hub_name="Bưu cục Sài Gòn", hub_type="RECEIVER", status=True)
            db.add(sg_hub)
            
        db.commit()

        # 3. Tạo tài khoản Admin tối cao - Có kiểm tra tồn tại
        super_admin = db.query(models.Users).filter_by(username="admin").first()
        if not super_admin:
            # Lưu ý: Chắc chắn admin_role và hn_hub đã được query hoặc tạo ở trên
            super_admin = models.Users(
                username="admin",
                full_name="Quản trị viên hệ thống",
                password_hash=get_password_hash("admin123"),
                role_id=admin_role.role_id if admin_role else 1,
                primary_hub_id=hn_hub.hub_id if hn_hub else 1,
                is_active=True,
                is_deleted=False
            )
            db.add(super_admin)
            db.commit()
        
        print("--- Đã khởi tạo/kiểm tra dữ liệu mẫu thành công! ---")
        print("Tài khoản: admin / Mật khẩu: admin123")
    except Exception as e:
        db.rollback()
        print(f"Lỗi khi seeding: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_data()