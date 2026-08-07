# File: reset_data.py
from sqlalchemy import text
from core.database import SessionLocal

def clear_operational_data():
    """Xóa tất cả các đơn hàng, túi hàng, nhật ký giao hàng thử nghiệm"""
    db = SessionLocal()
    try:
        print("⏳ Đang tiến hành dọn dẹp dữ liệu đơn hàng thử nghiệm...")
        tables_to_clear = [
            "tracking_logs",
            "tracking_logs_current",
            "delivery_results",
            "pods",
            "manifest_details",
            "manifests",
            "outbound_dispatch_items",
            "outbound_dispatch_slips",
            "bag_items",
            "bags",
            "waybill_items",
            "waybill_documents",
            "waybill_extra_services",
            "waybills",
            "booking_request_logs",
            "booking_requests",
            "bulk_mail_draft_items"
        ]
        
        for table in tables_to_clear:
            try:
                db.execute(text(f"DELETE FROM {table};"))
                print(f"  ✓ Đã xóa dữ liệu bảng: {table}")
            except Exception as ex:
                db.rollback()
                print(f"  ⚠️ Bỏ qua bảng {table}: {ex}")
        
        db.commit()
        print("🎉 ĐÃ XÓA DỮ LIỆU ĐƠN HÀNG THỬ NGHIỆM THÀNH CÔNG! (Giữ nguyên Khách hàng, Bưu cục, Bưu tá & Bảng giá)")
    except Exception as e:
        db.rollback()
        print(f"❌ Lỗi khi xóa dữ liệu: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    clear_operational_data()
