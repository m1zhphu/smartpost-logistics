I. KIỂM SOÁT VẬN ĐƠN TRƯỚC KHI XUẤT KHO – KẾT HỢP CHỤP BILL AI OCR
TÀI LIỆU BÀN GIAO TÍCH HỢP FRONTEND - LUỒNG XÁC THỰC OCR BILL
PHẦN 1: TÓM TẮT BACKEND ĐÃ NÂNG CẤP NHỮNG GÌ?
Hệ thống Backend đã thay đổi quy trình để "Chặn xuất kho nếu bill chưa được xác thực":
1.	Thêm dữ liệu mới cho Vận đơn (Waybills): Trả về thêm 5 field mới: bill_image_url, pickup_image_url, ocr_status, verify_status, verify_error_msg.
2.	Thêm trạng thái vận đơn (Status) mới:
•	PICKED_PENDING_VERIFY: Vừa lấy hàng xong, chờ CSKH xác thực.
•	VERIFY_ERROR: Dữ liệu bị sai (Mismatch), CSKH từ chối.
•	READY_WAREHOUSE: Đã xác thực thành công, sẵn sàng cho nhập/xuất kho.
3.	Logic chặn Xuất Kho (Bagging): Nếu đơn hàng chưa đạt trạng thái verify_status = "VERIFIED" hoặc thiếu ảnh bill, Backend sẽ quăng lỗi HTTP 400 và chặn không cho đóng túi/xuất đi.
PHẦN 2: CÁC YÊU CẦU FRONTEND CẦN THỰC HIỆN
2.1. Dành cho Mobile App (App Bưu Tá / Shipper)
•	Luồng Lấy Hàng (Pickup): Sau khi bưu tá lấy hàng thành công, bắt buộc phải có màn hình/nút bật Camera để chụp Ảnh Bill (và Ảnh Hàng Hóa nếu có).
•	Gọi API: Upload ảnh lên Server -> Lấy link URL ảnh trả về -> Gọi API cập nhật link ảnh đó vào vận đơn hiện tại. Lúc này đơn sẽ tự nhảy sang trạng thái chờ duyệt.
2.2. Dành cho Web Admin (App CSKH)
•	Tạo màn hình mới: "Bill Verification Center" (Trung tâm kiểm duyệt):
•	Hiển thị danh sách các đơn hàng đang có trạng thái PICKED_PENDING_VERIFY.
•	Hiển thị Cột/Nút để Click vào xem phóng to Ảnh Bill.
•	Có 2 nút Action cho CSKH:
•	[ Xanh - Verified ]: Xác nhận ảnh bill đúng với dữ liệu hệ thống.
•	[ Đỏ - Mismatch ]: Xác nhận dữ liệu bị sai lệch, yêu cầu nhập lý do lỗi (Ví dụ: "Sai số tiền COD", "Sai tên người nhận").
2.3. Dành cho Web Warehouse (App Kho)
•	Cập nhật danh sách kho: Thêm cột hiển thị trạng thái Verify (🟢 Verified, 🟠 Pending, 🔴 Mismatch).
•	Bắt lỗi UI: Tại màn hình quét mã vạch (Scan) để Đóng túi/Xuất xe, cần bắt mã lỗi HTTP 400 từ API trả về và hiển thị Pop-up đỏ to rõ: "Lỗi: Đơn hàng chưa được xác thực (VERIFY). Không thể xuất kho!".
PHẦN 3: DANH SÁCH API ENDPOINT CHI TIẾT (CHO FRONTEND)
Dưới đây là 3 API Frontend cần ghép nối để hoàn thiện luồng:
API 1: Upload ảnh Bill (Dành cho App Bưu tá)
•	Endpoint: POST /api/uploads/bill
•	Mô tả: Upload file ảnh (JPG, PNG) lên server.
•	Request (FormData):
•	file: File ảnh.
•	type: String (Gửi "bill" hoặc "pickup").
•	Response (200 OK):
json
{
  "file_url": "/uploads/bills/BILL_123456789.jpg"
}
API 2: Gán ảnh vào Vận đơn & Kích hoạt OCR (Dành cho App Bưu tá)
•	Endpoint: PATCH /api/waybills/{waybill_code}/bill-images
•	Mô tả: Sau khi upload ảnh thành công, gọi API này để lưu link ảnh vào đơn. Backend sẽ tự động đổi trạng thái đơn thành PICKED_PENDING_VERIFY.
•	Request (JSON):
json
{
  "bill_image_url": "/uploads/bills/BILL_123456789.jpg",
  "pickup_image_url": "/uploads/bills/PICKUP_123456789.jpg" // (Không bắt buộc)
}
•	Response (200 OK): Trả về Object Waybill đã được cập nhật trạng thái.
API 3: Xác thực Bill (Dành cho Web CSKH)
•	Endpoint: PATCH /api/waybills/{waybill_code}/verify
•	Mô tả: CSKH xem ảnh và quyết định duyệt hay từ chối.
•	Request (JSON): Trường hợp 1: Duyệt thành công (Match)
json
{
  "action": "VERIFIED",
  "error_msg": null
}
Trường hợp 2: Sai dữ liệu (Mismatch)
json
{
  "action": "MISMATCH",
  "error_msg": "Sai số tiền COD trên bill gốc"
}
•	Response (200 OK):
•	Nếu VERIFIED, trạng thái đơn sẽ thành READY_WAREHOUSE.
•	Nếu MISMATCH, trạng thái đơn sẽ bị kẹt ở VERIFY_ERROR.
Nhắc nhở cho Frontend khi gọi API Đóng túi hiện tại (POST /api/warehouse/bagging):
Backend không thêm API đóng túi mới, nhưng đã cài thêm cắm chốt chặn ở API cũ. Khi FE gọi API Bagging, nếu JSON trả về HTTP 400 kèm detail như: "Đơn hàng SP... chưa được xác thực (VERIFY). Không thể xuất kho!", FE phải chặn và báo Toast đỏ hoặc Beep lỗi trên súng bắn mã vạch.
 
II. TÍNH CƯỚC CHỐT BẢNG KÊ KẾ TOÁN
📘 TÀI LIỆU BÀN GIAO TÍCH HỢP FRONTEND - RATING ENGINE & ACCOUNTING
Trạng thái Backend: Hoàn thiện 100% logic nghiệp vụ theo Đặc tả.
🏗️ PHẦN 1: TÓM TẮT CÔNG VIỆC BACKEND ĐÃ THỰC HIỆN
1. Nâng cấp Bộ máy tính cước (Rating Engine)
•	Trọng lượng quy đổi (Mục 1): Tự động so sánh Cân thực tế và Cân quy đổi (Dài x Rộng x Cao / 5000) để lấy giá trị lớn nhất tính cước.
•	Phụ phí Vùng sâu vùng xa (Mục 2): Tự động nhận diện xã/huyện khó khăn để cộng thêm phụ phí cố định.
•	Phân vùng thông minh (Zone Engine - Mục 5 & 6): Triển khai tra cứu 3 lớp (Tỉnh cụ thể -> Theo Vùng miền -> Giá mặc định).
•	VAT 8% (Mục 10): Tự động áp thuế trên tổng phí dịch vụ.
•	Bộ mô phỏng giá (Price Simulator - Mục 20): API tra cứu giá nhanh cho CSKH mà không cần mã khách hàng.
2. Nghiệp vụ Kế toán & Đối soát (Accounting)
•	Bảng kê Đa năng (Mục 15): Đã hoàn thiện cả Bảng kê cước (Debt) và Bảng kê thu hộ (COD).
•	Logic Chốt giá (Locking - Mục 16): Khi Bảng kê ở trạng thái CONFIRMED, giá vận đơn bị khóa cứng để chống sửa đổi trái phép.
•	Phiếu điều chỉnh (Adjustments - Mục 18): Cho phép kế toán sửa giá sau khi đã chốt bảng kê bằng cách tự động tạo phiếu điều chỉnh (Lưu vết audit).
•	Xuất bản dữ liệu (Reporting - Mục 17): Hỗ trợ xuất file Excel Premium (Định dạng sẵn) và CSV (Dành cho phần mềm kế toán).
💻 PHẦN 2: YÊU CẦU ĐỐI VỚI FRONTEND
2.1. Màn hình Tạo vận đơn (Waybill Creation)
•	Giao diện: Thêm 3 trường nhập Kích thước: Dài (cm), Rộng (cm), Cao (cm).
•	Hành động: Khi người dùng nhập xong kích thước/khối lượng, gọi API /api/pricing/calculate để hiển thị cước phí tạm tính thời gian thực.
2.2. Màn hình Quản lý Kế toán (Web Admin)
•	Màn hình Tạo bảng kê: Cho phép chọn danh sách vận đơn và gom vào bảng kê (Debt hoặc COD).
•	Luồng Sửa giá:
•	Hiển thị Pop-up yêu cầu nhập Lý do điều chỉnh khi bấm sửa giá.
•	Nếu Bảng kê đang ở DRAFT: Sửa trực tiếp giá vận đơn.
•	Nếu Bảng kê đang ở CONFIRMED: Backend sẽ tự động tạo phiếu điều chỉnh (Adjustment) - Frontend cần hiển thị thông báo "Đã tạo phiếu điều chỉnh".
•	Luồng Chốt bảng kê: Nút "Xác nhận bảng kê" để chuyển trạng thái sang CONFIRMED.
•	Công cụ tra cứu giá nhanh: Một màn hình riêng để CSKH sử dụng bộ Simulator.
🧪 PHẦN 3: KỊCH BẢN KIỂM THỬ API TRÊN SWAGGER
Kịch bản 1: Kiểm tra tính cước thông minh
1.	Truy cập: POST /api/pricing/calculate
2.	Input: Nhập cân nặng 1kg nhưng kích thước 50x50x50 (Quy đổi ~25kg).
3.	Kết quả mong đợi: charge_weight phải trả về 25kg và giá tính trên 25kg.
Kịch bản 2: Tra cứu giá nhanh (Simulator)
1.	Truy cập: POST /api/pricing/simulate
2.	Input: Tỉnh đi (1), Tỉnh đến (2), Cân nặng (2kg), extra_services: ["CO_CHECK"].
3.	Kết quả mong đợi: Trả về đầy đủ Cước chính, Phụ phí dịch vụ, VAT và Tổng tiền mà không cần Login/Customer ID.
Kịch bản 3: Luồng Chốt bảng kê & Điều chỉnh (Adjustment)
1.	Bước 1: Tạo bảng kê bằng POST /api/accounting/statements. (Lưu lại statement_id).
2.	Bước 2: Chốt bảng kê bằng PATCH /api/accounting/statements/{id}/status với status = CONFIRMED.
3.	Bước 3: Thử sửa giá vận đơn đó bằng POST /api/accounting/override-price.
4.	Kết quả mong đợi: Backend trả về status ADJUSTED, mã adjustment_id và số tiền chênh lệch. Kiểm tra bảng kê thấy grand_total đã tự cập nhật.
Kịch bản 4: Xuất báo cáo đa định dạng
1.	Truy cập: GET /api/accounting/statements/{id}/export (Excel) hoặc /api/accounting/statements/{id}/export-csv (CSV).
2.	Kết quả mong đợi: Tải xuống file. Kiểm tra file Excel có dòng "TỔNG CỘNG" in đậm và được kẻ khung chuyên nghiệp.
________________________________________
📡 PHẦN 4: DANH SÁCH API TRỌNG YẾU
Tính năng	Phương thức	Endpoint
Tính cước đơn hàng	POST	/api/pricing/calculate
Tra cứu giá nhanh	POST	/api/pricing/simulate
Tạo bảng kê cước	POST	/api/accounting/statements
Tạo bảng kê COD	POST	/api/accounting/statements/cod
Sửa giá/Điều chỉnh	POST	/api/accounting/override-price
Xuất Excel	GET	/api/accounting/statements/{id}/export
Xuất CSV	GET	/api/accounting/statements/{id}/export-csv
Quản lý Phân vùng	GET/POST	/api/pricing/zones
________________________________________
IMPORTANT
Lưu ý đặc biệt cho Frontend: Khi gọi API xuất Excel/CSV, hãy sử dụng cơ chế tải xuống file qua Blob để đảm bảo định dạng file không bị lỗi khi stream từ Server.



