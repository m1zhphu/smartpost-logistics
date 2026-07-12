# BÁO CÁO TỔNG HỢP CÁC CHỈNH SỬA HỆ THỐNG SMARTPOST LOGISTICS
*Thời gian thực hiện: Ngày 11/07/2026 và 12/07/2026*

Báo cáo này liệt kê đầy đủ chi tiết các thay đổi trong mã nguồn (Backend & Frontend) để đáp ứng các yêu cầu nâng cấp nghiệp vụ bao gồm:
1. Thêm vai trò mới **Phó Quản trị viên (Sub-admin)** và cơ chế chuyển đổi bưu cục hoạt động.
2. Hiển thị cảnh báo trực quan bằng **Màu đỏ Neon phát sáng** cho đơn hàng Hỏa Tốc (`🔥 HỎA TỐC`) và Trễ hạn (`⚠️ TRỄ HẠN`).
3. Chặn quyền xem chéo khách hàng đối với nhân viên **CSKH** (chỉ hiển thị những khách hàng được phân công gán trực tiếp).
4. Phân trang thông minh 10 khách hàng/trang tại màn hình quản lý để tối ưu hiệu năng và giao diện.
5. Thêm cột hiển thị **Dịch vụ chuyển** chi tiết trên danh sách đơn.
6. Sửa lỗi thiếu trường dịch vụ khi tạo đơn từ Admin và sửa thuật toán cảnh báo SLA "Sắp trễ" cho dịch vụ nhanh.

---

## I. THAY ĐỔI CHI TIẾT PHÂN HỆ BACKEND (BE)

### 1. Phân quyền & Khởi tạo vai trò mới (Sub-admin)
*   **File sửa đổi**: [backend/api/auth.py](file:///d:/smartpost-logistics/backend/api/auth.py) và [backend/seed.py](file:///d:/smartpost-logistics/backend/seed.py)
*   **Chi tiết thay đổi**: 
    *   Định nghĩa và đăng ký vai trò mới **`SUB_ADMIN`** (Mã vai trò `9`) trong CSDL.
    *   Phân quyền cho Sub-admin được phép thao tác toàn quyền vận hành kho, điều phối, quản lý vận đơn và đối soát cước phí (tương tự Trưởng phòng bưu cục/Manager).
    *   Tuyệt đối **không cấp quyền** quản lý cấu hình bảng giá (`pricing_manage`) và quản lý thông tin khách hàng (`customer_manage`).

### 2. Cơ chế lưu vết và Hoán đổi Bưu cục tạm thời
*   **File sửa đổi**: [backend/core/security.py](file:///d:/smartpost-logistics/backend/core/security.py)
*   **Chi tiết thay đổi**:
    *   Cấu hình cho phép cả Admin tối cao (role 1) và Sub-admin (role 9) được phép gửi header `X-Selected-Hub-Id` để chuyển đổi bưu cục hoạt động tạm thời (giả lập vai trò role 2 để thao tác cục bộ trên bưu cục đó).
    *   Đính kèm trường **`actual_role_id`** (lưu lại vai trò gốc thực tế trước khi giả lập) vào payload token bảo mật.

### 3. Chốt chặn API Bảo mật ghi dữ liệu
*   **File sửa đổi**: [backend/api/pricing.py](file:///d:/smartpost-logistics/backend/api/pricing.py) và [backend/api/customers.py](file:///d:/smartpost-logistics/backend/api/customers.py)
*   **Chi tiết thay đổi**:
    *   Tại `pricing.py`: Thêm hàm chặn cứng, nếu `actual_role_id == 9` (Sub-admin), hệ thống sẽ trả về lỗi **`403 Forbidden`** kèm thông báo: *"Chỉ Admin và Kế toán mới có quyền thiết lập Bảng giá."* khi cố tình ghi/sửa dữ liệu bảng giá.
    *   Tại `customers.py`: Chặn cứng Sub-admin ghi/sửa/xóa thông tin khách hàng (Shop), báo lỗi **`403 Forbidden`** kèm thông báo: *"Bạn không có quyền quản lý khách hàng."*.

### 4. Chốt chặn phân quyền dữ liệu cho CSKH (Role 7)
*   **File sửa đổi**: [backend/api/customers.py](file:///d:/smartpost-logistics/backend/api/customers.py)
*   **Chi tiết thay đổi**:
    *   Tại API lấy danh sách khách hàng, tự động ép thêm bộ lọc SQL cứng: Chỉ lấy các khách hàng có `staff_in_charge_id` trùng khớp với ID của tài khoản CSKH đang đăng nhập. Ngăn chặn triệt để hành vi gọi trực tiếp API để xem trộm khách hàng của người khác.

### 5. Sửa thuật toán Cảnh báo SLA "Sắp trễ"
*   **File sửa đổi**: [backend/core/pricing.py](file:///d:/smartpost-logistics/backend/core/pricing.py)
*   **Chi tiết thay đổi**:
    *   Sửa lỗi logic khiến đơn Hỏa tốc vừa tạo xong đã báo màu cam "Sắp trễ" (do SLA chỉ có 4 tiếng mà ngưỡng cảnh báo cũ fix cứng là 4 tiếng).
    *   Điều chỉnh ngưỡng cảnh báo thông minh theo dịch vụ:
        *   Dịch vụ **Hỏa tốc (HT)**: Chỉ hiện cảnh báo sắp trễ khi thời gian xử lý còn **dưới 1 tiếng**.
        *   Dịch vụ **Nhanh (CPN)**: Cảnh báo khi thời gian còn **dưới 3 tiếng**.
        *   Dịch vụ **Tiết kiệm (TK)**: Cảnh báo khi còn **dưới 4 tiếng**.

---

## II. THAY ĐỔI CHI TIẾT PHÂN HỆ FRONTEND (FE)

### 1. Bật tính năng Chuyển bưu cục & Giao diện Sub-admin
*   **File sửa đổi**: [frontend/src/layouts/MainLayout.vue](file:///d:/smartpost-logistics/frontend/src/layouts/MainLayout.vue)
*   **Chi tiết thay đổi**:
    *   Cho phép người dùng có vai trò Sub-admin hiển thị dropdown chọn bưu cục trên thanh header để thực hiện chuyển đổi bưu cục làm việc.
    *   Thiết lập hiển thị tên vai trò trên Profile là **"Phó Quản trị viên"** thay vì các tên mặc định khác.
    *   Mở đầy đủ quyền truy cập các menu điều phối, kho hàng, đối soát cho Sub-admin.

### 2. Phân trang 10 Khách hàng/Trang tại màn hình Vận đơn
*   **File sửa đổi**: [frontend/src/views/admin/waybills/WaybillList.vue](file:///d:/smartpost-logistics/frontend/src/views/admin/waybills/WaybillList.vue)
*   **Chi tiết thay đổi**:
    *   Thiết kế bộ phân trang Client-side cho danh sách Khách hàng gom nhóm. Mặc định hiển thị đúng **10 khách hàng/trang**, tự động chuyển về trang 1 khi lọc hoặc tìm kiếm. Tránh lỗi danh sách quá dài gây chậm trình duyệt.

### 3. Thêm cột "Dịch vụ chuyển" & Sửa lỗi form tạo vận đơn
*   **File sửa đổi**: [frontend/src/views/admin/waybills/WaybillList.vue](file:///d:/smartpost-logistics/frontend/src/views/admin/waybills/WaybillList.vue) và [frontend/src/views/admin/waybills/CreateWaybill.vue](file:///d:/smartpost-logistics/frontend/src/views/admin/waybills/CreateWaybill.vue)
*   **Chi tiết thay đổi**:
    *   Tại `WaybillList.vue`: Bổ sung thêm một cột **"Dịch vụ"** riêng biệt để hiển thị rõ ràng đơn hàng là Hỏa tốc, Nhanh hay Tiết kiệm kèm icon tương ứng.
    *   Tại `CreateWaybill.vue`: Sửa lỗi thiếu trường `service_type` trong gói tin gửi lên Backend. Giúp đơn hàng sau khi tạo lưu đúng loại dịch vụ đã chọn (không bị tự động đổi thành CPN).

### 4. Hệ thống Cảnh báo Đỏ Neon & Xử lý lỗi 403 thân thiện
*   **File sửa đổi**: [frontend/src/views/admin/waybills/WaybillList.vue](file:///d:/smartpost-logistics/frontend/src/views/admin/waybills/WaybillList.vue), [frontend/src/views/customer/CustomerOrders.vue](file:///d:/smartpost-logistics/frontend/src/views/customer/CustomerOrders.vue) và [frontend/src/api/axios.js](file:///d:/smartpost-logistics/frontend/src/api/axios.js)
*   **Chi tiết thay đổi**:
    *   Cấu hình hiển thị tag **`🔥 HỎA TỐC`** (Màu đỏ neon phát sáng rực rỡ có hiệu ứng đổ bóng) và **`⚠️ TRỄ HẠN`** (Màu đỏ nhấp nháy liên tục) cho cả bảng admin và bảng của Khách hàng.
    *   Tại `axios.js`: Đăng ký bộ đón lỗi (error interceptor) cho mã lỗi 403. Chuyển đổi các thông báo lỗi phân quyền thô kệch thành các hộp thoại **Warning (Cảnh báo vàng cam) thân thiện** với người dùng.

### 5. Thay đổi Thuật ngữ Vận hành
*   **File sửa đổi**: [frontend/src/views/admin/waybills/WaybillList.vue](file:///d:/smartpost-logistics/frontend/src/views/admin/waybills/WaybillList.vue) and [frontend/src/views/admin/warehouse/ManifestScan.vue](file:///d:/smartpost-logistics/frontend/src/views/admin/warehouse/ManifestScan.vue)
*   **Chi tiết thay đổi**:
    *   Đổi toàn bộ từ khóa liên quan đến **"quét"**, **"quét mã"** thành **"nhập"**, **"nhập mã"** theo thói quen vận hành thực tế tại kho.

---
*Báo cáo được khởi tạo tự động dựa trên các thay đổi thực tế trong mã nguồn dự án.*
