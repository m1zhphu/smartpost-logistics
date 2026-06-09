# Báo cáo sửa lỗi và cập nhật Điều phối lấy hàng (Pickup Management)

Tài liệu này tổng hợp toàn bộ các thay đổi và sửa lỗi ở lớp Frontend (Giao diện Vue.js) nhằm đảm bảo quy trình **Điều phối lấy hàng (Pickup Management)** hoạt động ổn định, chính xác. 

> **CAM KẾT QUAN TRỌNG:** Toàn bộ các thay đổi này **CHỈ can thiệp vào mã nguồn Frontend (Vue.js)**. Lớp Backend (Python/FastAPI) và Cơ sở dữ liệu hoàn toàn không bị đụng chạm hay sửa đổi, giữ nguyên tính toàn vẹn của logic hệ thống hiện tại.

---

## 1. Các file đã can thiệp & Nội dung thay đổi

### 1.1. `frontend/src/views/admin/delivery/PickupManagement.vue`

Đây là màn hình chính của chức năng điều phối lấy hàng, được cập nhật các điểm sau:

- **Fix lỗi cảnh báo ảo "Không có bưu cục":** 
  - Cập nhật hàm `normalizeProvinceName` (thêm chuẩn hóa Unicode `.normalize('NFC')`). 
  - Xử lý dứt điểm tình trạng tiếng Việt có dấu bị nhận dạng sai khiến hệ thống nhầm tưởng tỉnh/thành phố đó (ví dụ: Tỉnh Long An, TP Hồ Chí Minh) không có bưu cục nào hoạt động.
  
- **Bổ sung bộ lọc Bưu cục cho Super Admin:** 
  - Admin (Quản trị viên) hiện đã có thể xem được toàn cảnh hệ thống nhờ chức năng lọc đơn hàng theo từng bưu cục.
  - Thêm tùy chọn **"Tất cả bưu cục"** (chọn làm mặc định). Giúp Admin không bị lỗi "bảng trống" khi vừa vào trang.
  
- **Tối ưu tự động hóa sau khi tạo đơn:**
  - Cập nhật logic: Sau khi Admin tạo thành công một yêu cầu lấy hàng và chỉ định rõ "Văn phòng tiếp nhận", hệ thống sẽ **tự động chuyển bộ lọc** sang bưu cục vừa được chỉ định. Đơn hàng sẽ hiển thị ngay lập tức trên bảng mà không cần tải lại trang.
  
- **Khắc phục API để hiển thị toàn bộ đơn cho Admin:**
  - Sửa đổi hàm `fetchTabRequests`: Chuyển từ việc gọi endpoint `/hub-pickup-requests` (vốn bắt buộc phải truyền mã bưu cục) sang endpoint `/pickup-requests` dành riêng cho Super Admin. Việc này giúp Admin truy xuất được tất cả các đơn hàng thuộc mọi bưu cục.
  
- **Chỉnh sửa giao diện Responsive:** 
  - Cân đối lại kích thước các cột (chuyển sang dùng `min-width` ở một số cột quan trọng như "Địa chỉ lấy hàng").
  - Đảm bảo trên các màn hình kích thước nhỏ (như laptop 13-14 inch), chữ không bị đè lên nhau và hiển thị gọn gàng. Theo yêu cầu, nút "Xem chi tiết" đã được ẩn đi.

### 1.2. `frontend/src/router/index.js`

- **Việt hóa đường dẫn (Breadcrumb):**
  - Cập nhật `meta: { title: 'Điều phối lấy hàng (Pickup)' }` cho route `PickupManagement`.
  - Fix lỗi giao diện hiển thị tên kỹ thuật "PickupManagement" ở trên cùng của trang (phần điều hướng đường dẫn).

---

## 2. Kết quả kiểm thử (Verification)

1. **Test luồng tạo đơn có chỉ định bưu cục:** Đơn nhảy chính xác vào tab **"Chờ gán bưu tá"** và hiển thị đúng tên Văn phòng nhận.
2. **Test luồng tạo đơn tự do (không chỉ định):** Đơn nhảy chính xác vào tab **"Chờ xác nhận văn phòng"**, sẵn sàng để người quản lý tick chọn và gán bưu cục hàng loạt.
3. **Test quyền Admin:** Mặc định xem được toàn bộ đơn. Khi dùng Dropdown để chọn (ví dụ: BC Đà Nẵng), bảng lập tức lọc và chỉ hiển thị đơn của Đà Nẵng.
4. **Test UI/UX:** Các cảnh báo màu vàng/đỏ chỉ xuất hiện đúng lúc khi thực sự không có bưu cục tại Tỉnh đó (ví dụ: Lai Châu). Layout bảng gọn gàng, không vỡ khung.
