🚚 SmartPost Logistics MVP - Backend System
SmartPost là hệ thống quản lý vận hành Logistics chuyên nghiệp được xây dựng trên kiến trúc FastAPI, tập trung vào tính toàn vẹn dữ liệu, quy trình vận hành nghiêm ngặt và đối soát tài chính minh bạch.

✨ Tính năng cốt lõi (Core Features)
Hệ thống được thiết kế dựa trên 4 trụ cột chính của ngành vận tải:

⚙️ 1. Quản trị Vận hành (Operations)
State Machine Management: Kiểm soát chặt chẽ luồng trạng thái vận đơn, ngăn chặn lỗi thao tác người dùng.

Warehouse Management: Hỗ trợ quét mã nhập kho (In-hub), đóng túi (Bagging) và lập bảng kê trung chuyển (Manifest).

Optimistic Locking: Sử dụng cơ chế Versioning để chống tranh chấp dữ liệu khi nhiều người cùng thao tác trên một vận đơn.

💰 2. Đối soát Tài chính (Accounting)
Double-entry Ledger: Hệ thống sổ cái ghi chép bút toán kép (Debit/Credit) đảm bảo tính minh bạch giữa Shipper - Bưu cục - Khách hàng.

Automated Settlement: Tự động gom các giao dịch đã đối soát để lập bảng kê thanh toán (Statement) cho Shop.

Excel Export: Hỗ trợ xuất dữ liệu đối soát ra file Excel chuyên nghiệp phục vụ kế toán.

📝 3. Tiện ích & Giám sát (Utility & SLA)
Label Printing: Tích hợp API render mẫu in vận đơn kèm Barcode (Code128) và QR Code chuẩn công nghiệp.

SLA Monitoring: Tự động quét và cảnh báo các đơn hàng "ngâm" quá 24 giờ thông qua Background Tasks.

Proof of Delivery (POD): Hỗ trợ upload ảnh bằng chứng giao hàng trực tiếp từ thiết bị di động.

🔐 4. Bảo mật & Hiệu năng
RBAC (Role-Based Access Control): Phân quyền chi tiết (Admin, Điều phối, Kế toán, Shipper).

Idempotency: Chống trùng lặp dữ liệu cho các tác vụ quan trọng (Thanh toán, Giao hàng).

🛠️ Công nghệ sử dụng (Tech Stack)
Framework: FastAPI (Python 3.13+)

ORM: SQLAlchemy 2.0 (Mapped Types)

Database: PostgreSQL

Validation: Pydantic v2

Printing: Jinja2, xhtml2pdf, python-barcode, qrcode

Analytics: Pandas (Excel Processing)

🚀 Hướng dẫn cài đặt (Installation)
Clone dự án:

Bash
git clone https://github.com/m1zhphu/smartpost-backend.git
cd smartpost-backend
Thiết lập môi trường ảo:

Bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
Cài đặt thư viện:

Bash
pip install -r requirements.txt
Cấu hình Database:
Tạo file .env và cấu hình chuỗi kết nối PostgreSQL:

Đoạn mã
DATABASE_URL=postgresql://user:password@localhost:5432/smartpost_db
SECRET_KEY=your_super_secret_key
Khởi chạy ứng dụng:

Bash
uvicorn main:app --reload
📂 Cấu trúc thư mục (Project Structure)
Plaintext
├── api/             # Các Route endpoints (Auth, Waybills, Delivery, Accounting...)
├── core/            # Cấu hình lõi (Database, Security, Idempotency, State Machine)
├── crud/            # Logic truy vấn và xử lý nghiệp vụ (Create, Read, Update, Delete)
├── schemas/         # Pydantic models (Data validation)
├── models.py        # SQLAlchemy models (Database Schema)
├── main.py          # Entry point của ứng dụng & Background Tasks
└── uploads/         # Thư mục lưu trữ ảnh POD
📝 Tài liệu API (API Documentation)
Sau khi khởi chạy, bạn có thể truy cập tài liệu API tương tác tại:

Swagger UI: http://127.0.0.1:8000/docs

ReDoc: http://127.0.0.1:8000/redoc

👤 Tác giả
Minh Phú - Backend Developer (Internship Project)