# Đặc tả frontend - Đăng ký khách hàng mới bằng OTP email

## Mục tiêu

Khách hàng mới tự đăng ký tài khoản để sử dụng hệ thống SmartPost.

Khi đăng ký thành công, backend tạo đồng thời:

- hồ sơ khách hàng trong bảng `customers`;
- tài khoản đăng nhập trong bảng `users`;
- liên kết `users.customer_id -> customers.customer_id`.

Trang danh sách khách hàng phải đọc từ bảng `customers`, nên khách tự đăng ký sẽ xuất hiện ở trang Khách hàng.

Trang quản lý nhân viên `/admin/users` không hiển thị user role `CUSTOMER`.

## Phân loại khách hàng

### Khách hàng mới tự đăng ký

```text
customers.customer_type = REGISTERED
```

Dùng cho khách tạo tài khoản qua app/web.

Thông tin ban đầu gồm:

- họ tên;
- email;
- số điện thoại;
- địa chỉ;
- tỉnh/thành;
- quận/huyện;
- phường/xã.

### Khách hàng do admin/CSKH tạo

Vẫn dùng API quản lý khách hàng hiện có.

Có thể lưu thêm:

- mã khách hàng;
- loại khách hàng;
- công ty;
- tên giao dịch;
- mã số thuế;
- người đại diện;
- ngân hàng;
- bảng giá;
- công nợ.

## API 1 - Gửi OTP đăng ký

```http
POST /api/auth/register/request-otp
```

### Request JSON

```json
{
  "email": "customer@example.com"
}
```

### Response 200

```json
{
  "message": "OTP đăng ký đã được gửi tới email",
  "email": "customer@example.com",
  "expires_in_seconds": 600,
  "email_sent": true
}
```

### Lỗi thường gặp

```json
{
  "detail": "Email đã được sử dụng"
}
```

```json
{
  "detail": "Vui lòng đợi trước khi yêu cầu gửi lại OTP"
}
```

## API 2 - Xác thực OTP và tạo khách hàng

```http
POST /api/auth/register/verify
```

### Request JSON

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
username
password
full_name
email
otp
```

### Field nên có để tạo hồ sơ khách hàng đầy đủ

```text
phone_number
address
province_id
district_id
ward_id
```

### Field không gửi ở màn đăng ký

```text
company_name
tax_code
bank_name
bank_number
bank_owner
pricing_policy
```

Các thông tin này do admin/CSKH cập nhật sau nếu khách hàng trở thành khách thân quen/hợp đồng.

### Response 200

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

## Frontend cần lưu gì

Sau khi đăng ký thành công, frontend lưu:

```text
access_token
token_type
user_id
customer_id
role_id
full_name
```

Các API sau đó gửi header:

```http
Authorization: Bearer <access_token>
```

## Quy tắc hiển thị

### Trang khách hàng

Gọi:

```http
GET /api/customers
```

Khách tự đăng ký phải xuất hiện trong danh sách này với:

```text
customer_type = REGISTERED
```

### Trang nhân viên

Gọi:

```http
GET /api/users
```

Backend đã lọc bỏ role `CUSTOMER`, nên user khách hàng không xuất hiện ở trang nhân viên.

## Điều kiện hoàn thành frontend

1. Gửi được OTP qua email.
2. Verify OTP tạo được khách hàng và user đăng nhập.
3. Response có `customer_id` khác `null`.
4. Khách mới xuất hiện ở trang Khách hàng.
5. Khách mới không xuất hiện ở trang Nhân viên.
6. Token đăng ký dùng được cho các API tạo pickup/tracking.
