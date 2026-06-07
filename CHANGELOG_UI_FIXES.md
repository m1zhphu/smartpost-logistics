# Báo cáo Cập nhật Giao diện (UI/UX) & Responsive

Dưới đây là bảng tổng hợp toàn bộ các thay đổi mã nguồn đã được thực hiện nhằm khắc phục các lỗi giao diện, hiển thị trên các kích thước màn hình và sửa lỗi không tải trang.

## 📋 Bảng Chi tiết Chỉnh sửa Code

| Tên File | Thành phần | Mô tả lỗi ban đầu | Thay đổi / Cập nhật đã thực hiện |
| :--- | :--- | :--- | :--- |
| **`MainLayout.vue`** | `<router-view>`<br>Line 95-102 | Bấm menu Kế toán không đổi nội dung, phải bấm F5 mới nhận. | Bổ sung `:key="route.fullPath"` vào thẻ `<component>`. Ép Vue js render lại trang mới hoàn toàn mỗi khi chuyển link. |
| **`MainLayout.css`** | CSS Responsive<br>Line 398-447 | Menu chính bị đưa xuống dưới đáy màn hình do hiểu nhầm ý. | Đã hủy bỏ Bottom Navigation. Menu chính giờ được ghim dọc, thu gọn (icon) và nằm cố định ở mép trái màn hình giống máy tính. |
| **`CustomerList.vue`**<br>**`HubList.vue`**<br>**`UserList.vue`** | Giao diện Bảng (Table) | Bảng dữ liệu tràn viền, khó thao tác trên điện thoại. | Tạo cấu trúc HTML `mobile-only` dạng Thẻ (Card). Ẩn Table trên điện thoại (`desktop-only`). |
| **`CustomerList.css`**<br>**`HubList.css`**<br>**`UserList.css`** | CSS Responsive | Chưa hỗ trợ chia grid / flex cho dạng thẻ mobile. | Thêm CSS định dạng dạng thẻ, ẩn/hiện theo `@media (max-width: 640px)`. Canh chỉnh layout nằm ngang cho bộ lọc. |
| **`PricingRules.vue`**<br>**`PricingRules.css`** | CSS Responsive<br>Line 105-650<br>Line 1120 | Bảng dữ liệu bị bóp méo do thiếu `min-width`, màn hình Drawer nhỏ, chữ cột bị đè. | Xóa thuộc tính `fixed`, đổi `width` thành `min-width` ở 3 bảng dữ liệu. Bổ sung `<style>` ở cuối file để mở rộng Drawer thành `100%` trên mobile. |
| **`DebtStatement.vue`** | Thẻ `<el-col>`<br>Line 24-40 | Bộ lọc (Input) bị bóp méo, nằm chen chúc trên màn hình nhỏ. | Thay đổi `<el-col :span="12">` thành `<el-col :xs="24" :sm="12" :md="8" :lg="10">`. Giúp bộ lọc tự động xuống dòng linh hoạt. |
| **`DebtStatement.css`** | `.content-side`<br>Line 45-50 | Bảng đối soát nhiều cột làm bể layout, văng nút bấm ra ngoài. | Thêm `min-width: 0;` để chống lỗi grid blowout. Thêm `@media (max-width: 1200px)` bẻ layout 2 cột thành 1 cột dọc. |
| **`CODTable.vue`** | `calculateSummaries()`<br>Line 577-580 | Chữ "TỔNG CỘNG" bị ép thành hàng dọc ở cột Checkbox (55px). | Đổi vị trí hiển thị chữ "TỔNG CỘNG" từ `index 0` (ô Checkbox) sang `index 1` (Mã vận đơn) rộng 150px. |
| **`CODTable.vue`** | `el-table-column`<br>Line 148-210 | Cột Mã vận đơn và Thao tác bị ghim chết 2 bên, vướng víu khi kéo ngang. | Gỡ bỏ hoàn toàn thuộc tính `fixed="left"` và `fixed="right"`. Bảng giờ có thể cuộn ngang tự do. |
| **`CODTable.css`** | `:deep(.modern-table)`<br>Line 135-140 | Khi kéo thanh cuộn, nền cột ghim trong suốt làm chữ đè nát lên nhau. | Khai báo biến `--el-table-bg-color: var(--sp-surface)` và `--el-table-tr-bg-color` để nền không bị trong suốt. |
| **`ConfirmCash.vue`** | `el-table-column`<br>Line 111 | Cột Thao tác bị ghim cứng tương tự bảng COD. | Xóa thuộc tính `fixed="right"`. |
| **`ConfirmCash.css`** | `:deep(.modern-table)`<br>Line 105-115 | Lỗi nền trong suốt đè chữ, chưa responsive cột trên mobile. | Khai báo biến `--el-table-bg-color`. Thêm `@media (max-width: 640px)` tạo thanh cuộn ngang an toàn (`overflow-x: auto`). |
| **`BillVerification.vue`**| `el-table-column`<br>Line 18-65 | Các cột ở giữa (Gửi/Nhận) bị bóp nghẹt khiến chữ xếp thành hàng dọc. | Đổi tất cả `width` thành `min-width`, đồng thời cấp `min-width` (150px - 280px) cho các cột bị bỏ sót để ép trình duyệt sinh ra thanh cuộn ngang. |

---
> [!TIP]
> Tất cả các chỉnh sửa này **tuyệt đối không làm thay đổi logic xử lý dữ liệu** của ứng dụng. Chúng chỉ tác động đến lớp hiển thị (View) và các quy tắc định dạng (CSS) để mang lại trải nghiệm tối ưu nhất cho người dùng trên mọi loại màn hình.
