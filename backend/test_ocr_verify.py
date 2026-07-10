import sys
import os
import io
sys.stdout = io.TextIOWrapper(sys.stdout.detach(), encoding='utf-8')
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy.orm import Session
from core.database import SessionLocal
import models
from crud.waybills import update_waybill_images_and_trigger_ocr
from core.state_machine import WaybillStatus

def run_test():
    db = SessionLocal()
    try:
        # Lấy một đơn hàng nháp để test
        waybill = db.query(models.Waybills).filter(models.Waybills.is_deleted == False).first()
        if not waybill:
            print("Không tìm thấy vận đơn nào để test!")
            return
            
        print(f"--- ĐƠN HÀNG TRƯỚC TEST ---")
        print(f"Mã: {waybill.waybill_code}")
        print(f"SĐT nhận: {waybill.receiver_phone}")
        print(f"COD: {waybill.cod_amount}")
        print(f"Người nhận: {waybill.receiver_name}")
        print(f"Status: {waybill.status}")
        print(f"Verify Status: {waybill.verify_status}")
        print(f"Verify Error: {waybill.verify_error_msg}")
        
        # Test Case 1: Đối soát thành công (Khớp 100%)
        # ocr_service mô phỏng sẽ khớp nếu chúng ta gửi đúng dữ liệu thật của waybill
        print("\n--- TEST CASE 1: ĐỐI SOÁT THÀNH CÔNG (MATCH 100%) ---")
        bill_url = "/uploads/bills/test_bill_match.jpg"
        
        # Gọi cập nhật và OCR trigger
        updated_wb = update_waybill_images_and_trigger_ocr(
            db=db,
            code=waybill.waybill_code,
            bill_url=bill_url,
            pickup_url="/uploads/pod/test_pickup.jpg",
            user_id=1,
            hub_id=waybill.origin_hub_id
        )
        
        print(f"Status sau test 1: {updated_wb.status}")
        print(f"Verify Status sau test 1: {updated_wb.verify_status}")
        print(f"Verify Error sau test 1: {updated_wb.verify_error_msg}")
        
        assert updated_wb.ocr_status == "SUCCESS"
        
        # Test Case 2: Đối soát thất bại (Mismatch) do thay đổi thông tin trên DB để so lệch với Simulation
        print("\n--- TEST CASE 2: ĐỐI SOÁT THẤT BẠI (MISMATCH) ---")
        original_phone = waybill.receiver_phone
        waybill.receiver_phone = "0900000000"
        db.flush()
        
        updated_wb2 = update_waybill_images_and_trigger_ocr(
            db=db,
            code=waybill.waybill_code,
            bill_url="/uploads/bills/test_bill_mismatch.jpg",
            pickup_url="/uploads/pod/test_pickup.jpg",
            user_id=1,
            hub_id=waybill.origin_hub_id
        )
        
        print(f"Status sau test 2: {updated_wb2.status}")
        print(f"Verify Status sau test 2: {updated_wb2.verify_status}")
        print(f"Verify Error sau test 2: {updated_wb2.verify_error_msg}")
        
        assert updated_wb2.verify_status == "MISMATCH"
        assert updated_wb2.status == WaybillStatus.VERIFY_ERROR
        assert "SĐT không khớp" in updated_wb2.verify_error_msg
        
        # Khôi phục dữ liệu ban đầu
        waybill.receiver_phone = original_phone
        db.commit()
        print("\n=> TẤT CẢ TEST CASES ĐÃ PASS THÀNH CÔNG!")
        
    except Exception as e:
        db.rollback()
        print(f"Test lỗi: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    run_test()
