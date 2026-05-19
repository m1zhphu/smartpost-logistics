# ERRORS.md - Nhật ký theo dõi lỗi và bài học kinh nghiệm

## [2026-05-18 14:09] - Lỗi NameError: name 'Optional' is not defined trong api/waybills.py

- **Type**: Syntax
- **Severity**: High
- **File**: `backend/api/waybills.py:412`
- **Agent**: Watson (Antigravity Orchestrator)
- **Root Cause**: Bổ sung API endpoint điều chuyển `/transfer` mới sử dụng kiểu `Optional[str]` cho biến `note` nhưng ở phần đầu file import của `typing` chỉ import `List` mà thiếu `Optional`.
- **Error Message**: 
  ```
  File "D:\Thực Tập\Dự án 2 - Log\Logistic\smartpost-logistics\backend\api\waybills.py", line 412, in <module>
    note: Optional[str] = None,
          ^^^^^^^^
  NameError: name 'Optional' is not defined
  ```
- **Fix Applied**: Bổ sung `Optional` vào dòng import: `from typing import List, Optional` trong tệp `backend/api/waybills.py`.
- **Prevention**: Luôn kiểm tra kỹ các kiểu dữ liệu của Pydantic/typing được sử dụng trong file và đảm bảo tất cả đã được import đầy đủ từ thư viện `typing` trước khi lưu.
- **Status**: Fixed

---

## [2026-05-18 14:11] - Lỗi NameError: name 'models' is not defined trong api/waybills.py

- **Type**: Syntax
- **Severity**: High
- **File**: `backend/api/waybills.py:448`
- **Agent**: Watson (Antigravity Orchestrator)
- **Root Cause**: Bổ sung API thống kê `/sla/dashboard` mới sử dụng `models.Waybills` để truy vấn nhưng ở phần đầu file thiếu dòng `import models`.
- **Error Message**: 
  ```
  Could not find name `models`
  ```
- **Fix Applied**: Bổ sung `import models` vào phần import của tệp `backend/api/waybills.py`.
- **Prevention**: Đảm bảo tất cả các file API sử dụng models của SQLAlchemy đều có khai báo `import models` đầy đủ.
- **Status**: Fixed

## [2026-05-18 14:55] - Lỗi Thiết kế Hệ thống: Viết trực tiếp mã SQL migrations thô vào main.py

- **Type**: Agent (Execution Error)
- **Severity**: High
- **File**: `backend/main.py`
- **Agent**: Watson (Antigravity Orchestrator)
- **Root Cause**: Thay vì sử dụng thư viện quản lý migrations chính thức của dự án (Alembic), Agent đã trực tiếp viết các lệnh SQL thay đổi schema `ALTER TABLE` vào `backend/main.py`. Điều này làm phá vỡ tính clean code, vi phạm cấu trúc kiến trúc hệ thống và cản trở việc quản lý các phiên bản database migrations tập trung thông qua Alembic.
- **Fix Applied**: 
  1. Loại bỏ hoàn toàn tất cả các câu lệnh SQL migrations thô ra khỏi tệp `backend/main.py`, khôi phục nó về trạng thái sạch sẽ ban đầu.
  2. Tạo thủ công tệp script migration chính thức của Alembic: `backend/alembic/versions/f8458ba16c32_add_sla_and_waybill_dimensions.py` chứa đầy đủ các khai báo upgrade/downgrade cho toàn bộ các cột mới.
  3. Khắc phục lỗi rẽ nhánh Alembic (`Multiple head revisions`): Qua rà soát đồ thị liên kết di trú của Alembic, phát hiện chuỗi di trú chính kéo dài liên tục đến `5fe7766fb92b`. Tôi đã cập nhật `down_revision` của tệp di trú mới từ `f8458ba16c31` thành `5fe7766fb92b` để nối tiếp vào cuối chuỗi di trú hiện có một cách thẳng tắp và tránh lỗi phân nhánh.
  4. Giải quyết lỗi trùng cột (`DuplicateColumn: column already exists`): Do DB thực tế đã có sẵn một số cột từ lần chạy thô trước đó, tôi đã viết thêm logic tự động kiểm tra cấu trúc bảng thực tế bằng Reflection (`sa.inspect(conn)`) bên trong hàm `upgrade()`. Lọc và chỉ tiến hành thêm (`op.add_column` / `op.create_foreign_key`) đối với những cột và ràng buộc nào thực sự chưa có trong bảng `waybills`, tránh gây crash database và bảo toàn dữ liệu hiện tại 100%.
- **Prevention**: Luôn tôn trọng kiến trúc hiện có của codebase. Nếu hệ thống đã cấu hình Alembic cho database migrations, tuyệt đối không được viết code DDL/SQL thay đổi cấu trúc bảng trực tiếp trong code ứng dụng (`main.py`), thay vào đó luôn tạo revision script thông qua Alembic. Đồng thời, khi tạo tệp di trú thủ công, cần kiểm tra đồ thị lịch sử di trú để trỏ đúng `down_revision` vào HEAD thực sự hiện tại của dự án và sử dụng reflection kiểm tra cột tồn tại nếu DB thực tế đã bị thay đổi trực tiếp trước đó.
- **Status**: Fixed

---

## [2026-05-19 11:00] - Lỗi NameError: name 'target_hub' is not defined trong api/users.py

- **Type**: Agent (Execution Error)
- **Severity**: High
- **File**: `backend/api/users.py:157`
- **Agent**: Friday
- **Root Cause**: Trong lúc thay thế mã để bổ sung API `/register-push-token` ở cuối tệp, Agent đã vô tình xóa nhầm 2 dòng tính toán biến `target_hub` bên trong hàm `get_shippers_by_hub` dẫn đến lỗi `NameError` khi gọi API.
- **Fix Applied**: Khôi phục lại logic tính toán `target_hub` dựa trên vai trò người dùng trong hàm `get_shippers_by_hub` của tệp `backend/api/users.py`.
- **Prevention**: Khi thực hiện chỉnh sửa file bằng cách thay thế khối nội dung (replace_file_content), cần đối chiếu kỹ lưỡng vùng ranh giới (StartLine/EndLine) để không xóa nhầm các biến quan trọng của các hàm liền kề.
- **Status**: Fixed

---

## [2026-05-19 13:42] - Lỗi SyntaxError: [vue/compiler-sfc] Expecting Unicode escape sequence \uXXXX trong DebtStatement.vue

- **Type**: Syntax
- **Severity**: High
- **File**: `frontend/src/views/admin/accounting/DebtStatement.vue:660`
- **Agent**: Friday
- **Root Cause**: Trong template literal in bảng kê, việc đặt trực tiếp thẻ đóng `</script>` làm trình phân tích SFC Vue compiler hiểu nhầm đó là thẻ kết thúc của chính phần code Vue `<script setup>`. Đồng thời các ký tự backtick bị escape bằng dấu backslash `\`` làm parser báo lỗi.
- **Fix Applied**: 
  1. Loại bỏ các dấu backslash thoát dấu backtick \` và các tham số ${} không cần thiết.
  2. Thoát dấu gạch chéo trong thẻ đóng script bên trong template literal: `<\/script>` để tránh bộ phân tích SFC Vue compiler nhận diện nhầm.
- **Prevention**: Khi viết các đoạn code HTML/JS mẫu bên trong template literal của Vue SFC (Single File Component), luôn thoát thẻ đóng script dưới dạng `<\/script>` để bộ compiler không biên dịch nhầm, và tránh escape backtick thừa thãi.
- **Status**: Fixed

---

## [2026-05-19 14:00] - Thiếu sót Giao diện: Thiếu nút Sửa cước và Tạo phiếu điều chỉnh trực tiếp trên màn hình Kế toán

- **Type**: Agent (Execution Error)
- **Severity**: High
- **File**: `frontend/src/views/admin/accounting/DebtStatement.vue`, `frontend/src/views/admin/accounting/CODTable.vue`
- **Agent**: Friday
- **Root Cause**: Giao diện đối soát và tạo bảng kê kế toán (cước phí và COD) ban đầu không có nút chỉnh sửa giá cước vận đơn hay hộp thoại nhập lý do tạo adjustment trực tiếp. Điều này ép kế toán phải rời màn hình đối soát để di chuyển sang màn hình tra cứu vận đơn, làm giảm mạnh trải nghiệm người dùng, mặc dù phía Backend API đã hỗ trợ đầy đủ.
- **Fix Applied**: 
  1. Tích hợp cột hành động "Thao tác" và nút "Sửa giá" trực tiếp vào bảng danh sách vận đơn của cả hai màn hình `DebtStatement.vue` và `CODTable.vue`.
  2. Bổ sung `el-dialog` cho phép Kế toán nhập cước mới, phụ phí mới, và bắt buộc nhập lý do điều chỉnh.
  3. Gửi payload lên API `/api/accounting/override-price`. Nếu bảng kê đã chốt (`CONFIRMED`), backend tự động sinh và phản hồi thông tin phiếu điều chỉnh cước (`statement_adjustments`). UI hiển thị cảnh báo đẹp mắt chứa thông tin chênh lệch và ID phiếu điều chỉnh cho kế toán.
  4. Tự động tải lại bảng dữ liệu sau khi sửa thành công để đồng bộ tổng số tiền cước đối soát trên UI.
- **Prevention**: Khi thiết kế các phân hệ nghiệp vụ phức tạp (như Kế toán đối soát), luôn đặt mình vào vị trí người dùng cuối để phát hiện các "điểm nghẽn" tương tác. Đảm bảo các chức năng nghiệp vụ trọng yếu (như điều chỉnh giá cước) được tích hợp trực quan ngay tại nơi người dùng làm việc thường xuyên nhất.
- **Status**: Fixed

---
