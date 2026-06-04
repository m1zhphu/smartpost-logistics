# Đặc tả backend - Đăng ký khách hàng mới bằng OTP email

## Quyết định nghiệp vụ

Khách hàng là một thực thể nghiệp vụ chung và luôn được lưu trong bảng `customers`.

Bảng `users` chỉ lưu tài khoản đăng nhập.

Khi khách hàng tự đăng ký qua app/web, backend tạo:

- `customers`: hồ sơ khách hàng mới;
- `users`: tài khoản đăng nhập role `CUSTOMER`;
- liên kết `users.customer_id -> customers.customer_id`.

Như vậy:

- trang Khách hàng đọc từ `customers` sẽ thấy khách tự đăng ký;
- trang Nhân viên đọc từ `users` nhưng backend lọc bỏ role `CUSTOMER`;
- khách tự đăng ký không bị lẫn vào danh sách nhân viên hệ thống.

## Phân loại customer

### Khách tự đăng ký

```text
customers.customer_type = REGISTERED
```

Thông tin ban đầu:

- `customer_code`: backend tự sinh dạng `REGyyyyMMddxxxx`;
- `transaction_name`: họ tên khách;
- `representative_name`: họ tên khách;
- `email`;
- `phone_number`;
- `address_detail`;
- `province_id`;
- `district_id`;
- `ward_id`;
- `status = ACTIVE`.

### Khách do admin/CSKH tạo

Vẫn dùng API `/api/customers`.

Có thể có thêm:

- `customer_type = SHOP`, `COMPANY`, hoặc loại khác;
- `company_name`;
- `tax_code`;
- thông tin ngân hàng;
- cấu hình bảng giá;
- công nợ/kế toán.

## API gửi OTP

```http
POST /api/auth/register/request-otp
```

### Request

```json
{
  "email": "customer@example.com"
}
```

### Response

```json
{
  "message": "OTP đăng ký đã được gửi tới email",
  "email": "customer@example.com",
  "expires_in_seconds": 600,
  "email_sent": true
}
```

### Rule

- Email không được trùng `users.email`.
- Email không được trùng `customers.email` của customer chưa bị xóa mềm.
- OTP hiệu lực 10 phút.
- Không gửi lại OTP trong 60 giây.
- OTP lưu dạng bcrypt hash.

## API verify OTP và tạo khách hàng

```http
POST /api/auth/register/verify
```

### Request

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

### Response

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

## Backend xử lý

1. Kiểm tra username/email chưa tồn tại.
2. Kiểm tra OTP hợp lệ.
3. Tạo customer:
   - `customer_type = REGISTERED`;
   - mã khách `REG...`;
   - tên, email, SĐT, địa chỉ.
4. Tạo role `CUSTOMER` nếu chưa có.
5. Tạo user:
   - username;
   - password hash;
   - role `CUSTOMER`;
   - `customer_id` của customer vừa tạo.
6. Mark OTP đã dùng.
7. Trả JWT có `customer_id`.

## API liên quan

Danh sách khách hàng:

```http
GET /api/customers
```

Danh sách nhân viên:

```http
GET /api/users
```

Backend đã lọc role `CUSTOMER`, nên khách tự đăng ký không xuất hiện trong `/api/users`.
