# Đặc tả API - Đăng ký khách hàng OTP và quản lý khách hàng

## 1. Mục tiêu nghiệp vụ

Phần này phục vụ 2 nhóm chức năng:

1. Khách hàng mới tự đăng ký tài khoản bằng OTP email để sử dụng hệ thống.
2. Admin/CSKH quản lý hồ sơ khách hàng: xem danh sách, tạo, chỉnh sửa, xóa mềm.

Quyết định thiết kế hiện tại:

- `customers` là bảng hồ sơ khách hàng chính.
- `users` là bảng tài khoản đăng nhập.
- Khi khách hàng tự đăng ký, backend tạo cả:
  - bản ghi trong `customers`;
  - bản ghi trong `users`;
  - liên kết `users.customer_id -> customers.customer_id`.
- Trang Khách hàng đọc từ `customers`.
- Trang Nhân viên đọc từ `users`, nhưng backend lọc bỏ role `CUSTOMER`.

## 2. Phân loại khách hàng

### 2.1. Khách hàng tự đăng ký

Khách hàng tự đăng ký từ frontend/mobile.

Backend lưu:

```text
customers.customer_type = REGISTERED
```

Thông tin ban đầu:

```text
customer_code: backend tự sinh REGyyyyMMddxxxx
transaction_name: full_name
representative_name: full_name
email
phone_number
address_detail
province_id
district_id
ward_id
status = ACTIVE
```

### 2.2. Khách hàng do admin/CSKH tạo

Admin/CSKH tạo trong trang quản lý khách hàng.

Có thể có thêm:

```text
customer_code
customer_type
company_name
transaction_name
representative_name
tax_code
email
phone_number
address_detail
bank_name
bank_number
bank_owner
status
```

Nhóm này dùng cho nghiệp vụ bảng giá, tính cước, công nợ, bảng kê kế toán.

## 3. API gửi OTP đăng ký

### Endpoint

```http
POST /api/auth/register/request-otp
```

### Mục đích

Gửi OTP về email để xác minh email trước khi tạo khách hàng và tài khoản đăng nhập.

### Frontend gửi

```json
{
  "email": "customer@example.com"
}
```

### Backend xử lý

1. Chuẩn hóa email về lowercase.
2. Kiểm tra email chưa tồn tại trong `users.email` với `is_deleted = false`.
3. Kiểm tra email chưa tồn tại trong `customers.email` với `status != 'DELETED'`.
4. Kiểm tra cooldown gửi lại OTP 60 giây.
5. Hủy các OTP đăng ký cũ chưa dùng.
6. Sinh OTP 6 số.
7. Hash OTP bằng bcrypt.
8. Lưu OTP vào `auth_otp_codes`.
9. Gửi OTP qua SMTP Gmail.

### Backend trả thành công

```json
{
  "message": "OTP đăng ký đã được gửi tới email",
  "email": "customer@example.com",
  "expires_in_seconds": 600,
  "email_sent": true
}
```

### Lỗi thường gặp

Email đã tồn tại trong tài khoản đăng nhập:

```json
{
  "detail": "Email đã tồn tại trong tài khoản đăng nhập"
}
```

Email đã tồn tại trong hồ sơ khách hàng:

```json
{
  "detail": "Email đã tồn tại trong hồ sơ khách hàng"
}
```

Gửi lại OTP quá nhanh:

```json
{
  "detail": "Vui lòng đợi trước khi yêu cầu gửi lại OTP"
}
```

## 4. API xác thực OTP và tạo khách hàng

### Endpoint

```http
POST /api/auth/register/verify
```

### Mục đích

Xác thực OTP, sau đó tạo hồ sơ khách hàng trong `customers` và tài khoản đăng nhập trong `users`.

### Frontend gửi

```json
{
  "username": "phu123",
  "password": "123456",
  "full_name": "Nguyễn Minh Phú",
  "email": "customer@example.com",
  "otp": "603750",
  "phone_number": "0900000000",
  "address": "123 ABC",
  "province_id": 1,
  "district_id": 1,
  "ward_id": 1
}
```

### Field bắt buộc

```text
username: 3-50 ký tự
password: 6-128 ký tự
full_name: 2-100 ký tự
email: đúng định dạng email
otp: đúng 6 ký tự
```

### Field nên có

```text
phone_number
address
province_id
district_id
ward_id
```

### Backend xử lý

1. Chuẩn hóa email.
2. Kiểm tra username chưa tồn tại trong `users`.
3. Kiểm tra email chưa tồn tại trong `users`.
4. Kiểm tra email chưa tồn tại trong `customers`.
5. Lấy OTP mới nhất theo email và purpose `REGISTER`.
6. Kiểm tra OTP:
   - tồn tại;
   - chưa hết hạn;
   - chưa vượt quá 5 lần thử;
   - chưa bị dùng;
   - đúng mã OTP.
7. Tạo role `CUSTOMER` nếu chưa có.
8. Tạo bản ghi `customers`:

```text
customer_code = REGyyyyMMddxxxx
customer_type = REGISTERED
transaction_name = full_name
representative_name = full_name
email = email
phone_number = phone_number
address_detail = address
province_id = province_id
district_id = district_id
ward_id = ward_id
status = ACTIVE
```

9. Tạo bản ghi `users`:

```text
username = username
password_hash = bcrypt(password)
full_name = full_name
email = email
phone_number = phone_number
role_id = CUSTOMER
customer_id = customers.customer_id
is_active = true
is_deleted = false
```

10. Đánh dấu OTP đã dùng.
11. Trả JWT có claim `customer_id`.

### Backend trả thành công

```json
{
  "message": "Đăng ký tài khoản khách hàng mới thành công",
  "access_token": "jwt...",
  "token_type": "bearer",
  "user_id": 32,
  "customer_id": 12,
  "role_id": 6,
  "full_name": "Nguyễn Minh Phú"
}
```

### Frontend cần lưu

```text
access_token
token_type
user_id
customer_id
role_id
full_name
```

Các request sau đăng nhập gửi:

```http
Authorization: Bearer <access_token>
```

## 5. API danh sách khách hàng

### Endpoint

```http
GET /api/customers
```

### Mục đích

Frontend lấy danh sách khách hàng để hiển thị ở trang Khách hàng.

Khách tự đăng ký cũng xuất hiện ở danh sách này vì đã lưu trong `customers`.

### Query params

```text
skip: mặc định 0
limit: mặc định 200
include_deleted: mặc định false
```

### Ví dụ

```http
GET /api/customers?skip=0&limit=200
```

Xem cả khách đã xóa mềm:

```http
GET /api/customers?include_deleted=true
```

### Backend trả

```json
[
  {
    "id": 12,
    "customer_id": 12,
    "customer_code": "REG202606030001",
    "name": "Nguyễn Minh Phú",
    "company_name": null,
    "transaction_name": "Nguyễn Minh Phú",
    "email": "customer@example.com",
    "phone": "0900000000",
    "customer_type": "REGISTERED",
    "status": "ACTIVE",
    "address": "123 ABC",
    "representative_name": "Nguyễn Minh Phú",
    "bank_name": null,
    "account_number": null,
    "account_name": null
  }
]
```

## 6. API tra cứu khách hàng theo mã

### Endpoint

```http
GET /api/customers/code/{customer_code}
```

### Mục đích

Dùng để tra cứu nhanh khách hàng theo mã khách hàng, phục vụ autofill thông tin khách khi tạo vận đơn/tính cước.

### Backend trả

```json
{
  "id": 12,
  "customer_id": 12,
  "customer_code": "REG202606030001",
  "name": "Nguyễn Minh Phú",
  "company_name": null,
  "transaction_name": "Nguyễn Minh Phú",
  "email": "customer@example.com",
  "phone": "0900000000",
  "customer_type": "REGISTERED",
  "status": "ACTIVE",
  "address": "123 ABC",
  "representative_name": "Nguyễn Minh Phú",
  "province_id": 1,
  "district_id": 1,
  "ward_id": 1,
  "bank_name": null,
  "account_number": null,
  "account_name": null
}
```

## 7. API tạo khách hàng bởi admin/CSKH

### Endpoint

```http
POST /api/customers
```

### Mục đích

Admin/CSKH tạo khách hàng thân quen/hợp đồng trong hệ thống.

### Frontend gửi

```json
{
  "customer_code": "KH001",
  "customer_type": "SHOP",
  "name": "Shop ABC",
  "company_name": "Công ty ABC",
  "representative_name": "Nguyễn Văn A",
  "tax_code": "0312345678",
  "phone": "0900000000",
  "email": "shopabc@gmail.com",
  "address": "123 ABC",
  "bank_name": "VCB",
  "bank_number": "123456789",
  "bank_owner": "NGUYEN VAN A",
  "status": "ACTIVE"
}
```

### Backend xử lý

1. Kiểm tra `customer_code` chưa tồn tại nếu frontend gửi mã.
2. Nếu không có `customer_code`, backend tự sinh `CUST...`.
3. Tạo bản ghi trong `customers`.
4. Nếu có thông tin ngân hàng, tạo/cập nhật `bank_accounts`.

### Backend trả

```json
{
  "message": "Tạo khách hàng thành công",
  "id": 12
}
```

## 8. API chỉnh sửa khách hàng

### Endpoint

```http
PUT /api/customers/{customer_id}
```

### Mục đích

Cập nhật hồ sơ khách hàng.

Dùng cho:

- cập nhật khách tự đăng ký thành khách thân quen;
- bổ sung công ty;
- bổ sung mã số thuế;
- cập nhật địa chỉ;
- cập nhật ngân hàng;
- cập nhật trạng thái.

### Frontend gửi

```json
{
  "customer_code": "KH001",
  "customer_type": "SHOP",
  "name": "Shop ABC",
  "company_name": "Công ty ABC",
  "representative_name": "Nguyễn Văn A",
  "tax_code": "0312345678",
  "phone": "0900000000",
  "email": "shopabc@gmail.com",
  "address": "123 ABC",
  "bank_name": "VCB",
  "bank_number": "123456789",
  "bank_owner": "NGUYEN VAN A",
  "status": "ACTIVE"
}
```

### Backend trả

```json
{
  "message": "Cập nhật thành công"
}
```

## 9. API xóa mềm khách hàng

### Endpoint

```http
DELETE /api/customers/{customer_id}
```

### Mục đích

Xóa mềm khách hàng khỏi danh sách hiển thị mặc định.

Backend không xóa cứng dữ liệu.

### Backend xử lý

```text
customers.status = DELETED
```

### Backend trả

```json
{
  "message": "Đã xóa mềm khách hàng",
  "id": 12,
  "status": "DELETED"
}
```

Sau khi xóa mềm:

- `GET /api/customers` không trả khách này.
- `GET /api/customers?include_deleted=true` vẫn trả khách này.

## 10. API danh sách nhân viên

### Endpoint

```http
GET /api/users
```

### Mục đích

Hiển thị danh sách nhân viên hệ thống ở trang `/admin/users`.

Backend đã lọc bỏ role `CUSTOMER`, nên khách tự đăng ký không xuất hiện ở trang nhân viên.

## 11. Role CSKH

Backend bổ sung role:

```text
role_id = 7
role_name = CSKH
```

Quyền mặc định:

```json
{
  "pickup_create": true,
  "pickup_view_queue": true,
  "pickup_assign_shipper": true,
  "customer_view": true,
  "customer_create": true,
  "customer_update": true,
  "customer_delete": true,
  "pricing_quote": true,
  "notification_view": true
}
```

CSKH được phép:

- tạo yêu cầu pickup cho khách hàng;
- xem queue pickup;
- xem chi tiết pickup;
- điều phối bưu tá lấy hàng;
- xem danh sách khách hàng;
- tạo khách hàng;
- chỉnh sửa khách hàng;
- xóa mềm khách hàng;
- tra cứu/mô phỏng giá nhanh.

Role tham gia các API pickup:

```text
SUPER_ADMIN: role_id = 1
HUB_MANAGER: role_id = 2
WAREHOUSE_STAFF: role_id = 3
SHIPPER: role_id = 4
CUSTOMER: role_id = 6
CSKH: role_id = 7
```

Quy tắc:

- `CUSTOMER` chỉ tạo/xem pickup thuộc `customer_id` của chính mình.
- `CSKH` được xem queue và điều phối pickup.
- `SHIPPER` chỉ xem pickup được gán cho mình.
- `WAREHOUSE_STAFF` đang còn được phép thao tác một số pickup theo hệ thống hiện tại, nhưng về nghiệp vụ nên giảm dần trách nhiệm CSKH khỏi role kho.

## 12. SMTP

Backend gửi OTP qua Gmail SMTP.

Biến môi trường:

```env
MAIL_SERVER=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=your_email@gmail.com
MAIL_PASSWORD=your_gmail_app_password
MAIL_FROM=your_email@gmail.com
MAIL_FROM_NAME=SmartPost Logistics
SMTP_USE_TLS=true
SMTP_USE_SSL=false
```

`MAIL_PASSWORD` là Gmail App Password, không phải mật khẩu Gmail thường.

## 13. Điều kiện hoàn thành

Backend/frontend được xem là đúng khi:

1. Gửi OTP được qua email.
2. Verify OTP tạo được customer và user.
3. Response đăng ký có `customer_id` khác null.
4. Khách tự đăng ký xuất hiện trong `GET /api/customers`.
5. Khách tự đăng ký không xuất hiện trong `GET /api/users`.
6. Admin/CSKH tạo được khách hàng thủ công.
7. Admin/CSKH sửa được hồ sơ khách hàng.
8. Admin/CSKH xóa mềm được khách hàng.
9. Khách đã xóa mềm không hiển thị mặc định ở danh sách khách hàng.
10. Token trả về sau đăng ký dùng được cho các API pickup/tracking sau này.
