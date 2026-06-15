# Nhật ký thay đổi giao diện (UI Scroll & Column Fixes)

Tài liệu này ghi lại toàn bộ các thay đổi giao diện đã thực hiện để khắc phục lỗi co nén và cắt chữ trên các cột mã vận đơn, hành trình, và thao tác trong hệ thống admin.

---

## 1. Xác nhận Tính Toàn vẹn của Hệ thống
*   **Có đụng vào Backend (BE) không?** **KHÔNG.** Toàn bộ code backend FastAPI (`/backend`) và các logic xử lý API không bị thay đổi.
*   **Có làm lệch/không khớp với Database (DB) không?** **KHÔNG.** Các trường dữ liệu, cấu trúc data binding của Vue, và kiểu dữ liệu gửi nhận không thay đổi, đảm bảo hệ thống đồng bộ 100% với DB.

---

## 2. Chi tiết các tệp và dòng code đã chỉnh sửa

### 1. `WaybillList.vue`
*   **Đường dẫn:** `frontend/src/views/admin/waybills/WaybillList.vue`
*   **Chi tiết thay đổi:**
    *   **Dòng 2 - 3:** Thêm thuộc tính `style="min-width: 0; width: 100%;"` cho `.modern-waybill-management` và `.page-container` nhằm giới hạn kích thước container cha, ngăn chặn việc bảng phình to làm vỡ layout trang.
    *   **Dòng 177:** Thêm style tương tự và `overflow: hidden;` cho `.table-wrapper`.
    *   **Dòng 192:** Tăng `min-width` cột **Mã vận đơn** từ `230` lên `270` để hiển thị đủ 22 ký tự kèm badge OCR.

### 2. `WaybillList.css`
*   **Đường dẫn:** `frontend/src/styles/admin/waybills/WaybillList.css`
*   **Chi tiết thay đổi:**
    *   **Dòng 100 - 104:** Thêm thuộc tính `white-space: nowrap;` vào lớp `.code-link` để ngăn mã vận đơn bị ngắt xuống dòng.

### 3. `OcrReviewedList.vue`
*   **Đường dẫn:** `frontend/src/views/admin/waybills/OcrReviewedList.vue`
*   **Chi tiết thay đổi:**
    *   **Dòng 46:** Đổi `min-width` của cột **Mã vận đơn** từ `160` lên `240` để nhãn tag hiển thị trọn vẹn.

### 4. `PickupManagement.vue`
*   **Đường dẫn:** `frontend/src/views/admin/delivery/PickupManagement.vue`
*   **Chi tiết thay đổi:**
    *   **Dòng 96, 277, 467:** Thay đổi cột hiển thị mã vận đơn từ cố định `width="140"` thành `min-width="210"` để hiển thị mã liên kết đầy đủ.
    *   **Dòng 368:** Tăng chiều rộng cột **Thao tác chung** từ `width="260"` lên `min-width="310"` để tránh việc các nút hành động "Tiếp nhận tất cả" và "Từ chối tất cả" bị xuống dòng hay che mất chữ.

### 5. `CODTable.vue`
*   **Đường dẫn:** `frontend/src/views/admin/accounting/CODTable.vue`
*   **Chi tiết thay đổi:**
    *   **Dòng 2 - 3:** Áp dụng `style="min-width: 0; width: 100%;"` cho các div bao ngoài `.modern-cod-page` và `.page-container`.
    *   **Dòng 131:** Thêm `overflow: hidden; style="min-width: 0; width: 100%;"` cho `.table-wrapper`.
    *   **Dòng 137:** Bọc toàn bộ thẻ `<el-table>` bằng `<div class="cod-table-scroll">` và cấu hình table có `min-width: 1400px; max-width: none;` để tạo thanh cuộn ngang độc lập khi giao diện thu hẹp.
    *   **Dòng 151, 204, 214:** Tăng `min-width` của cột **Mã vận đơn** thành `220`, cột **Trạng thái** thành `160`, và cột **Thao tác** thành `140` nhằm đảm bảo toàn bộ nội dung text của tag/nút hiển thị đầy đủ, không bị cắt bớt chữ.

### 6. `CODTable.css`
*   **Đường dẫn:** `frontend/src/styles/admin/accounting/CODTable.css`
*   **Chi tiết thay đổi:**
    *   **Dòng 195 - 208:** Thêm các CSS rules định nghĩa cho lớp `.cod-table-scroll` để hỗ trợ hiển thị scrollbar ngang ở đáy.

### 7. `DebtStatement.vue`
*   **Đường dẫn:** `frontend/src/views/admin/accounting/DebtStatement.vue`
*   **Chi tiết thay đổi:**
    *   **Dòng 63:** Bọc bảng `<el-table>` bằng `<div class="debt-table-scroll">` và thiết lập `min-width: 800px; max-width: none;` trên bảng.
    *   **Dòng 66:** Thay thế `width="150"` của cột **MÃ VẬN ĐƠN** thành `min-width="200"` để không bị cắt xén ký tự.

### 8. `DebtStatement.css`
*   **Đường dẫn:** `frontend/src/styles/admin/accounting/DebtStatement.css`
*   **Chi tiết thay đổi:**
    *   **Dòng 287 - 300:** Thêm định nghĩa lớp `.debt-table-scroll` hỗ trợ cuộn ngang.

### 9. `ConfirmCash.vue`
*   **Đường dẫn:** `frontend/src/views/admin/accounting/ConfirmCash.vue`
*   **Chi tiết thay đổi:**
    *   **Dòng 42:** Bọc bảng bằng `<div class="confirm-cash-table-scroll">` và cấu hình bảng có `min-width: 810px; max-width: none;` nhằm bảo vệ cột nộp tiền và nút "CHỐT CA" hiển thị đầy đủ.

### 10. `ConfirmCash.css`
*   **Đường dẫn:** `frontend/src/styles/admin/accounting/ConfirmCash.css`
*   **Chi tiết thay đổi:**
    *   **Dòng 191 - 204:** Thêm lớp `.confirm-cash-table-scroll` cho phép cuộn ngang ở đáy.
