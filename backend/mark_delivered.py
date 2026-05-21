import sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.detach(), encoding='utf-8')

from sqlalchemy import create_engine, text
from core.database import SQLALCHEMY_DATABASE_URL

if len(sys.argv) < 2:
    print("Vui lòng cung cấp mã vận đơn để chuyển sang DELIVERED. Ví dụ:")
    print("python mark_delivered.py SP1779243665 SP1779146222")
    sys.exit(1)

waybill_codes = sys.argv[1:]

engine = create_engine(SQLALCHEMY_DATABASE_URL)
with engine.connect() as conn:
    trans = conn.begin()
    try:
        for code in waybill_codes:
            code = code.strip()
            # Cập nhật trạng thái trong bảng waybills
            result = conn.execute(
                text("UPDATE waybills SET status = 'DELIVERED' WHERE waybill_code = :code"),
                {"code": code}
            )
            if result.rowcount > 0:
                print(f"✅ Đã chuyển thành công trạng thái đơn {code} sang DELIVERED!")
            else:
                print(f"❌ Không tìm thấy mã vận đơn {code} trong cơ sở dữ liệu!")
        trans.commit()
    except Exception as e:
        trans.rollback()
        print(f"💥 Lỗi xảy ra: {str(e)}")
