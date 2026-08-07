# File: reset_data.py
"""
Script hỗ trợ xóa dữ liệu thử nghiệm trong hệ thống SmartPost Logistics.
- Chế độ 1 (Mặc định): Chỉ xóa dữ liệu vận hành (Vận đơn, Yêu cầu lấy hàng, Túi hàng, Bảng kê, Nhật ký log). Giữ nguyên Người dùng, Bưu cục, Bảng giá, Khách hàng.
- Chế độ 2 (--all): Xóa toàn bộ CSDL và khởi tạo lại cấu trúc ban đầu + Seed Roles/Data mẫu.
"""
import sys
import os
from sqlalchemy import text
from core.database import engine, SessionLocal
import models
from seed import seed_data

def clear_operational_data():
    """Xóa tất cả các đơn hàng, túi hàng, nhật ký giao hàng thử nghiệm"""
    db = SessionLocal()
    try:
        print("⏳ Đang tiến hành dọn dẹp dữ liệu vận hành thử nghiệm...")
        # Tắt kiểm tra khóa ngoại tạm thời nếu sử dụng Postgres
        tables_to_clear = [
            "tracking_logs",
            "delivery_results",
            "manifest_items",
            "manifests",
            "bag_items",
            "bags",
            "waybills",
            "booking_request_logs",
            "booking_requests",
            "customer_debt_statements",
            "shipper_locations",
            "cash_handover_records"
        ]
        
        for table in tables_to_clear:
            try:
                db.execute(text(f"TRUNCATE TABLE {table} RESTART IDENTITY CASCADE;"))
                print(f"  ✓ Đã xóa dữ liệu bảng: {table}")
            except Exception as ex:
                db.rollback()
                # Thử dùng DELETE FROM nếu TRUNCATE gặp hạn chế
                db.execute(text(f"DELETE FROM {table};"))
                print(f"  ✓ Đã xóa (DELETE) dữ liệu bảng: {table}")
        
        db.commit()
        print("🎉 XÓA DỮ LIỆU THỬ NGHIỆM THÀNH CÔNG! Giữ nguyên Người dùng, Bưu cục & Bảng giá.")
    except Exception as e:
        db.rollback()
        print(f"❌ Lỗi khi xóa dữ liệu: {e}")
    finally:
        db.close()

def reset_all_database():
    """Xóa hoàn toàn bảng CSDL và tạo lại từ đầu"""
    print("⚠️ ĐANG XÓA TOÀN BỘ CSDL VÀ TẠO LẠI BẢNG MỚI...")
    models.Base.metadata.drop_all(bind=engine)
    models.Base.metadata.create_all(bind=engine)
    print("✅ Đã tạo lại toàn bộ cấu trúc bảng CSDL.")
    print("⏳ Đang nạp dữ liệu mẫu cơ bản (Roles & Accounts)...")
    seed_data()
    print("🎉 KHÔI PHỤC CSDL VỀ TRẠNG THÁI BAN ĐẦU THÀNH CÔNG!")

if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "--all":
        reset_all_database()
    else:
        clear_operational_data()
