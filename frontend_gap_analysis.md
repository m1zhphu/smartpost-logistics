# Báo cáo Phân tích Lỗ hổng Frontend (Gap Analysis)
*Dựa trên tài liệu yêu cầu (`2.txt`) và hiện trạng mã nguồn Backend.*

---

## 🎯 TÓM TẮT CHUNG
Sau khi đối chiếu mã nguồn Frontend với tài liệu yêu cầu và mã nguồn Backend, có thể khẳng định: **Backend đã triển khai đầy đủ 100% các API**, nhưng **Frontend đã bỏ sót và chưa tích hợp** một số tính năng quan trọng, đặc biệt là các UX/UI nâng cao và tính năng giám sát SLA.

Dưới đây là danh sách chi tiết các hạng mục Frontend cần bổ sung:

---

## 🛠️ CHI TIẾT CÁC HẠNG MỤC CÒN THIẾU

### 1. Màn hình Tạo Vận Đơn (`CreateWaybill.vue`)

#### 1.1. Thiếu thông tin & Tự động điền (Autofill) Người Gửi
- **Yêu cầu (2.txt):** Tự động điền thông tin gửi hàng (Tên shop, SĐT, Địa chỉ) khi chọn Mã Khách Hàng.
- **Backend đã có:** API `GET /api/customers/code/{customer_code}` trả về chi tiết thông tin khách hàng.
- **Frontend thiếu:** 
  - Giao diện form hoàn toàn thiếu các ô nhập liệu cho Người gửi (`sender_name`, `sender_phone`, `sender_address`).
  - Chưa có sự kiện (event) khi Dropdown thay đổi để tự động gọi API và điền dữ liệu.

#### 1.2. Tự động điền (Autofill) Người Nhận
- **Yêu cầu (2.txt):** Lắng nghe sự kiện khi nhập SĐT nhận, tự động điền Họ tên và Địa chỉ từ lịch sử kiện hàng cũ.
- **Backend đã có:** API `GET /api/waybills/recipient-history?phone=...` trả về `receiver_name` và `receiver_address`.
- **Frontend thiếu:** Ô nhập SĐT chưa bắt sự kiện `@blur` hoặc bắt độ dài chuỗi (>= 10 ký tự) để tự động gọi API.

---

### 2. Màn hình Quản lý & Giám sát SLA Vận Đơn (`WaybillList.vue`)

#### 2.1. Thiếu Widget Thống kê SLA (Dashboard)
- **Yêu cầu (2.txt):** Thiết kế 4 thẻ Card (Tổng số đơn, Đúng hạn, Sắp trễ, Quá hạn) ở ngay đầu trang `WaybillList`.
- **Backend đã có:** API `GET /api/waybills/sla/dashboard` trả về `total`, `on_time`, `warning`, `overdue`.
- **Frontend thiếu:** Hoàn toàn chưa dựng component cho 4 thẻ Card này và chưa gọi API hiển thị.

#### 2.2. Thiếu thông tin quan trọng trong Bảng (`el-table`)
- **Yêu cầu (2.txt):** Cần hiển thị Đơn vị giữ kiện hàng và Trạng thái SLA.
- **Backend đã có:** API `POST /api/waybills/search` đã trả về sẵn trường `sla_status` (ON_TIME, WARNING, OVERDUE), `holding_hub` (Kho giữ), `holding_shipper` (Bưu tá giữ).
- **Frontend thiếu:** Chưa bổ sung 2 cột thông tin quan trọng này vào bảng hiển thị. Chưa thiết kế Badge màu động cho Trạng thái SLA.

#### 2.3. Thiếu Rule bôi nền cảnh báo SLA
- **Yêu cầu (2.txt):** Tô nền màu đỏ nhạt (`#FFF1F2`) cho toàn bộ dòng có SLA bị quá hạn (`OVERDUE`).
- **Frontend thiếu:** Chưa sử dụng thuộc tính `row-class-name` của Element Plus để kiểm tra điều kiện `sla_status === 'OVERDUE'` và apply class CSS màu đỏ.

#### 2.4. Thiếu Modal Điều Chuyển Vận Đơn (Transfer)
- **Yêu cầu (2.txt):** Thêm tính năng điều chuyển quyền giữ bưu kiện sang Kho hoặc Shipper khác.
- **Backend đã có:** API `POST /api/waybills/{code}/transfer` nhận payload `target_type` (HUB/SHIPPER), `target_id`, và `reason`.
- **Frontend thiếu:** 
  - Chưa bổ sung nút "Điều chuyển" vào menu Action của từng dòng trong bảng.
  - Chưa dựng Modal / Cửa sổ Pop-up Form cho phép nhập lý do và chọn người/kho nhận để gọi API.

---

### 3. Màn hình Kiểm duyệt CSKH (`BillVerification.vue`)

#### 3.1. Hiển thị sai trường dữ liệu ảnh
- **Yêu cầu (2.txt):** Yêu cầu hiển thị Ảnh Tem Bill gốc do bưu tá chụp.
- **Backend đã có:** Dữ liệu trả về đầy đủ cả `bill_image_url` (Ảnh tem bill) và `pickup_image_url` (Ảnh hàng hóa).
- **Frontend thiếu (Sai sót logic):** Component bảng đang map và hiển thị cứng trường `pickup_image_url` (Ảnh hàng hóa) thay vì trường `bill_image_url`. Điều này khiến CSKH không thể đối chiếu mã đơn, giá trị COD, và thông tin ghi chú trên tờ tem gửi hàng thực tế.

---

## 🚀 ĐỀ XUẤT KẾ HOẠCH KHẮC PHỤC
1. **Ưu tiên 1:** Cập nhật lại UI `BillVerification.vue` hiển thị đúng ảnh bill. Rất nhanh, chỉ cần sửa tên field.
2. **Ưu tiên 2:** Sửa giao diện `CreateWaybill.vue` bổ sung Input Sender và logic Autofill gọi API để tăng UX thao tác cho nhân viên lên đơn.
3. **Ưu tiên 3:** Bổ sung các cột SLA, Badge màu và CSS Row-Highlighting cho `WaybillList.vue`.
4. **Ưu tiên 4:** Xây dựng Widget SLA Dashboard và Form Modal Điều chuyển đơn hàng trong `WaybillList.vue`.
