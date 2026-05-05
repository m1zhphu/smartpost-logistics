# File: seed.py
from core.database import SessionLocal
from core.security import get_password_hash
import models

def seed_data():
    db = SessionLocal()
    try:
        # 1. ĐỊNH NGHĨA 5 VAI TRÒ (ROLES) VÀ PERMISSIONS
        roles_data = [
            {
                "name": "ADMIN",
                "perms": {"all": True, "user_manage": True, "hub_manage": True, "warehouse_scan": True, "delivery_manage": True, "accounting_manage": True, "report_view": True}
            },
            {
                "name": "MANAGER",
                "perms": {"hub_manage": True, "warehouse_scan": True, "delivery_manage": True, "report_view": True, "accounting_manage": False}
            },
            {
                "name": "WAREHOUSE",
                "perms": {"warehouse_scan": True, "inventory_view": True, "delivery_manage": False, "report_view": False}
            },
            {
                "name": "SHIPPER",
                "perms": {"delivery_manage": True, "warehouse_scan": True, "personal_task": True}
            },
            {
                "name": "ACCOUNTANT",
                "perms": {"accounting_manage": True, "report_view": True, "pricing_manage": True}
            }
        ]

        role_objects = {}
        for r in roles_data:
            role = db.query(models.Roles).filter_by(role_name=r["name"]).first()
            if not role:
                role = models.Roles(role_name=r["name"], permissions=r["perms"])
                db.add(role)
                db.flush() # Để lấy role_id ngay lập tức
            else:
                role.permissions = r["perms"] # Cập nhật lại quyền nếu có thay đổi
            role_objects[r["name"]] = role

        db.commit()
        print("✅ Đã khởi tạo 5 nhóm quyền: ADMIN, MANAGER, WAREHOUSE, SHIPPER, ACCOUNTANT.")

        # 2. TẠO BƯU CỤC MẪU (HUBS)
        hubs_data = [
            {"code": "HN01", "name": "Tổng kho Hà Nội", "type": "SENDER"},
            {"code": "SG01", "name": "Tổng kho Sài Gòn", "type": "RECEIVER"}
        ]

        hub_objects = {}
        for h in hubs_data:
            hub = db.query(models.Hubs).filter_by(hub_code=h["code"]).first()
            if not hub:
                hub = models.Hubs(hub_code=h["code"], hub_name=h["name"], hub_type=h["type"], status=True)
                db.add(hub)
                db.flush()
            hub_objects[h["code"]] = hub
        
        db.commit()
        print(f"✅ Đã khởi tạo {len(hubs_data)} bưu cục mẫu.")

        # 3. TẠO TÀI KHOẢN ADMIN TỐI CAO
        admin_user = db.query(models.Users).filter_by(username="admin").first()
        if not admin_user:
            admin_user = models.Users(
                username="admin",
                full_name="Quản trị viên hệ thống",
                password_hash=get_password_hash("admin123"),
                role_id=role_objects["ADMIN"].role_id,
                primary_hub_id=hub_objects["HN01"].hub_id,
                is_active=True,
                is_deleted=False
            )
            db.add(admin_user)
            db.commit()
            print("✅ Đã tạo tài khoản Admin: admin / admin123")
        else:
            print("ℹ️ Tài khoản admin đã tồn tại, bỏ qua.")

        print("\n--- HOÀN TẤT KHỞI TẠO DỮ LIỆU HỆ THỐNG ---")

    except Exception as e:
        db.rollback()
        print(f"❌ Lỗi khi seeding: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_data()