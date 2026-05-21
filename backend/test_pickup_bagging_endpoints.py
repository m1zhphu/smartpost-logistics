import sys
import os
import io
sys.stdout = io.TextIOWrapper(sys.stdout.detach(), encoding='utf-8')
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from fastapi.testclient import TestClient
from main import app
from core.database import SessionLocal
import models
from core.security import create_access_token
from core.state_machine import WaybillStatus
from datetime import datetime

def run_test():
    db = SessionLocal()
    client = TestClient(app)
    
    try:
        print("--- SETUP TEST DATA ---")
        
        # 1. Tìm hoặc tạo Hub mẫu
        hub = db.query(models.Hubs).filter_by(hub_code="HN01").first()
        if not hub:
            hub = models.Hubs(hub_code="HN01", hub_name="Tổng kho Hà Nội", hub_type="SENDER", status=True)
            db.add(hub)
            db.flush()
            
        # 2. Lấy Roles từ DB (các vai trò đã được seed sẵn)
        role_objs = db.query(models.Roles).all()
        roles = {r.role_name.upper(): r for r in role_objs}
        print("Existing roles in DB:", list(roles.keys()))
        
        # Nếu thiếu vai trò nào trong DB, gán bằng vai trò đầu tiên có sẵn để tránh crash và tránh INSERT lỗi sequence
        for r_name in ["ADMIN", "MANAGER", "WAREHOUSE", "SHIPPER"]:
            if r_name not in roles:
                if roles:
                    # Dùng tạm vai trò đầu tiên có sẵn
                    roles[r_name] = list(roles.values())[0]
                else:
                    raise Exception("Không tìm thấy bất kỳ vai trò (Role) nào trong database!")
            
        # 3. Tìm hoặc tạo Users (Admin, Kho, Shipper)
        admin_user = db.query(models.Users).filter_by(username="admin_test").first()
        if not admin_user:
            admin_user = models.Users(
                username="admin_test",
                full_name="Admin Test",
                password_hash="test",
                role_id=roles["ADMIN"].role_id,
                primary_hub_id=hub.hub_id,
                is_active=True
            )
            db.add(admin_user)
            
        warehouse_user = db.query(models.Users).filter_by(username="kho_test").first()
        if not warehouse_user:
            warehouse_user = models.Users(
                username="kho_test",
                full_name="Kho Test",
                password_hash="test",
                role_id=roles["WAREHOUSE"].role_id,
                primary_hub_id=hub.hub_id,
                is_active=True
            )
            db.add(warehouse_user)
            
        shipper_user = db.query(models.Users).filter_by(username="shipper_test").first()
        if not shipper_user:
            shipper_user = models.Users(
                username="shipper_test",
                full_name="Shipper Test",
                password_hash="test",
                role_id=roles["SHIPPER"].role_id,
                primary_hub_id=hub.hub_id,
                is_active=True
            )
            db.add(shipper_user)
            
        db.flush()
        
        # 4. Tìm hoặc tạo Khách hàng mẫu
        customer = db.query(models.Customers).filter_by(customer_code="SHOP_TEST").first()
        if not customer:
            customer = models.Customers(
                customer_code="SHOP_TEST",
                customer_type="SHOP",
                company_name="Shop Thời Trang Test",
                representative_name="Nguyễn Văn Test",
                phone_number="0987654321",
                address_detail="123 Đường Test, Hà Nội",
                status="ACTIVE"
            )
            db.add(customer)
            db.flush()
            
        # 5. Tạo 2 vận đơn cho khách hàng này ở trạng thái CREATED (Chờ lấy hàng)
        wb1 = db.query(models.Waybills).filter_by(waybill_code="SP_BAG_TEST_01").first()
        if not wb1:
            wb1 = models.Waybills(
                waybill_code="SP_BAG_TEST_01",
                customer_id=customer.customer_id,
                receiver_name="Người nhận 1",
                receiver_phone="0912345678",
                receiver_address="456 Đường ABC, HCM",
                origin_hub_id=hub.hub_id,
                dest_hub_id=hub.hub_id,
                service_type="STANDARD",
                actual_weight=0.5,
                cod_amount=100000,
                status=WaybillStatus.CREATED,
                ocr_status="SUCCESS",
                verify_status="VERIFIED"
            )
            db.add(wb1)
            
        wb2 = db.query(models.Waybills).filter_by(waybill_code="SP_BAG_TEST_02").first()
        if not wb2:
            wb2 = models.Waybills(
                waybill_code="SP_BAG_TEST_02",
                customer_id=customer.customer_id,
                receiver_name="Người nhận 2",
                receiver_phone="0987654321",
                receiver_address="789 Đường XYZ, Đà Nẵng",
                origin_hub_id=hub.hub_id,
                dest_hub_id=hub.hub_id,
                service_type="STANDARD",
                actual_weight=1.0,
                cod_amount=200000,
                status=WaybillStatus.CREATED,
                ocr_status="SUCCESS",
                verify_status="VERIFIED"
            )
            db.add(wb2)
            
        db.commit()
        print("✅ Setup Test Data hoàn tất.")
        
        # 6. Sinh JWT token cho các user
        admin_token = create_access_token({
            "user_id": admin_user.user_id,
            "sub": admin_user.username,
            "role_id": admin_user.role_id,
            "primary_hub_id": admin_user.primary_hub_id,
            "permissions": {"all": True}
        })
        
        shipper_token = create_access_token({
            "user_id": shipper_user.user_id,
            "sub": shipper_user.username,
            "role_id": shipper_user.role_id,
            "primary_hub_id": shipper_user.primary_hub_id,
            "permissions": {"personal_task": True, "warehouse_scan": True}
        })
        
        warehouse_token = create_access_token({
            "user_id": warehouse_user.user_id,
            "sub": warehouse_user.username,
            "role_id": warehouse_user.role_id,
            "primary_hub_id": warehouse_user.primary_hub_id,
            "permissions": {"warehouse_scan": True}
        })
        
        # --- BẮT ĐẦU CHẠY CÁC TEST CASES QUA ENDPOINT ---
        
        # TEST CASE 1: Tạo túi lấy hàng (PICKUP Bag) bằng quyền Admin
        print("\n--- TEST 1: Tạo túi lấy hàng ---")
        headers = {"Authorization": f"Bearer {admin_token}"}
        bag_data = {
            "customer_id": customer.customer_id,
            "est_quantity": 2,
            "note": "Túi lấy hàng test shop quần áo"
        }
        res = client.post("/api/scans/pickup-bags", json=bag_data, headers=headers)
        assert res.status_code == 200, f"Lỗi tạo túi: {res.text}"
        bag_res = res.json()
        bag_code = bag_res["bag_code"]
        print(f"✅ Đã tạo túi thành công: {bag_code}, Status: {bag_res['status']}, Bag Type: {bag_res['bag_type']}")
        
        # TEST CASE 2: Bưu tá quét gom hàng và xác nhận lấy (PICKED)
        print("\n--- TEST 2: Bưu tá quét lấy hàng (PICK) ---")
        headers = {"Authorization": f"Bearer {shipper_token}"}
        pick_data = {
            "waybill_codes": ["SP_BAG_TEST_01", "SP_BAG_TEST_02"]
        }
        res = client.post(f"/api/scans/pickup-bags/{bag_code}/pick", json=pick_data, headers=headers)
        assert res.status_code == 200, f"Lỗi bưu tá pick hàng: {res.text}"
        print(f"✅ Bưu tá chốt túi thành công: {res.json()}")
        
        # Kiểm tra trạng thái đơn hàng sau khi pick
        db.refresh(wb1)
        db.refresh(wb2)
        print(f"Trạng thái Vận đơn 1: {wb1.status} (Expected: PICKED_PENDING_VERIFY)")
        print(f"Trạng thái Vận đơn 2: {wb2.status} (Expected: PICKED_PENDING_VERIFY)")
        assert wb1.status == WaybillStatus.PICKED_PENDING_VERIFY
        assert wb2.status == WaybillStatus.PICKED_PENDING_VERIFY

        # TEST CASE 3: Túi hàng về đến kho (INBOUND)
        print("\n--- TEST 3: Túi hàng về đến kho (INBOUND) ---")
        headers = {"Authorization": f"Bearer {warehouse_token}"}
        res = client.post(f"/api/scans/pickup-bags/{bag_code}/inbound", headers=headers)
        assert res.status_code == 200, f"Lỗi inbound: {res.text}"
        print(f"✅ Kho quét Inbound thành công: {res.json()}")
        
        # TEST CASE 4: Kho mở túi (OPENED)
        print("\n--- TEST 4: Kho mở túi (OPENED) ---")
        res = client.post(f"/api/scans/pickup-bags/{bag_code}/open", headers=headers)
        assert res.status_code == 200, f"Lỗi open: {res.text}"
        print(f"✅ Kho mở túi thành công: {res.json()}")
        
        # TEST CASE 5: Kho quét verify các đơn hàng
        print("\n--- TEST 5: Kho quét verify các đơn hàng ---")
        verify_data = {
            "waybill_codes": ["SP_BAG_TEST_01", "SP_BAG_TEST_02"]
        }
        res = client.post(f"/api/scans/pickup-bags/{bag_code}/verify", json=verify_data, headers=headers)
        assert res.status_code == 200, f"Lỗi verify: {res.text}"
        verify_res = res.json()
        print(f"✅ Kết quả Verify: Status túi={verify_res['status']}")
        print(f"Chi tiết chênh lệch: {verify_res['discrepancy']}")
        
        # Kiểm tra trạng thái đơn hàng sau verify
        db.refresh(wb1)
        db.refresh(wb2)
        print(f"Trạng thái Vận đơn 1 sau verify: {wb1.status} (Expected: IN_HUB)")
        print(f"Trạng thái Vận đơn 2 sau verify: {wb2.status} (Expected: IN_HUB)")
        assert wb1.status == WaybillStatus.IN_HUB
        assert wb2.status == WaybillStatus.IN_HUB
        
        # TEST CASE 6: Close túi hàng (CLOSED)
        print("\n--- TEST 6: Đóng túi hàng (CLOSE) ---")
        res = client.post(f"/api/scans/pickup-bags/{bag_code}/close", headers=headers)
        assert res.status_code == 200, f"Lỗi close: {res.text}"
        print(f"✅ Đã chốt hoàn tất túi: {res.json()}")
        
        # TEST CASE 7: Lấy danh sách túi lấy hàng
        print("\n--- TEST 7: Lấy danh sách túi lấy hàng ---")
        res = client.get("/api/scans/pickup-bags", headers=headers)
        assert res.status_code == 200, f"Lỗi list: {res.text}"
        print(f"✅ Số lượng túi lấy hàng hiển thị: {len(res.json())}")
        
        # TEST CASE 8: Lấy chi tiết túi lấy hàng
        print("\n--- TEST 8: Lấy chi tiết túi lấy hàng ---")
        res = client.get(f"/api/scans/pickup-bags/{bag_code}", headers=headers)
        assert res.status_code == 200, f"Lỗi chi tiết: {res.text}"
        detail_res = res.json()
        print(f"✅ Chi tiết túi: {detail_res['bag_code']}, Status: {detail_res['status']}, Est Qty: {detail_res['est_quantity']}, Actual Qty: {detail_res['actual_quantity']}")
        
        print("\n=> TẤT CẢ ENDPOINT TEST CASES ĐÃ PASS THÀNH CÔNG!")
        
    except Exception as e:
        print(f"Test lỗi: {e}")
        import traceback
        traceback.print_exc()
    finally:
        # CLEANUP dữ liệu test
        print("\n--- CLEANUP TEST DATA ---")
        try:
            # Xóa bag items
            bag = db.query(models.Bags).filter(models.Bags.bag_code.like("BAG-HN01-%")).first()
            if bag:
                db.query(models.BagItems).filter_by(bag_id=bag.bag_id).delete()
                # Xóa tracking logs
                db.query(models.TrackingLogs).filter(models.TrackingLogs.note.like(f"%{bag.bag_code}%")).delete()
                db.query(models.Bags).filter_by(bag_id=bag.bag_id).delete()
            
            db.query(models.TrackingLogs).filter(models.TrackingLogs.waybill_id.in_([wb1.waybill_id, wb2.waybill_id])).delete()
            db.query(models.Waybills).filter(models.Waybills.waybill_id.in_([wb1.waybill_id, wb2.waybill_id])).delete()
            
            # Xóa test users
            db.query(models.Users).filter(models.Users.username.in_(["admin_test", "kho_test", "shipper_test"])).delete()
            
            # Xóa shop test
            db.query(models.Customers).filter_by(customer_code="SHOP_TEST").delete()
            
            db.commit()
            print("✅ Dọn dẹp dữ liệu hoàn tất.")
        except Exception as cleanup_err:
            db.rollback()
            print(f"Lỗi dọn dẹp: {cleanup_err}")
        db.close()

if __name__ == "__main__":
    run_test()
