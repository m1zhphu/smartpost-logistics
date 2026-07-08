import psycopg2
import sys

def test_connection():
    dsn = "postgresql://admin:admin%40123@125.234.102.243:5432/DB_SPL_LOG"
    print("Đang kiểm tra kết nối tới Database Server tại 125.234.102.243:5432...")
    try:
        conn = psycopg2.connect(dsn, connect_timeout=5)
        print("🎉 KẾT NỐI THÀNH CÔNG! IP này được phép truy cập DB.")
        conn.close()
    except Exception as e:
        print("❌ KẾT NỐI THẤT BẠI!")
        print(f"Chi tiết lỗi:\n{e}")

if __name__ == "__main__":
    test_connection()
