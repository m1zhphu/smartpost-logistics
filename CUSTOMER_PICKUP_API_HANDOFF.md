# Bàn giao API khách hàng tự tạo pickup

Ngày thực hiện: 07/06/2026

## 1. Mục tiêu chức năng

Chức năng này phục vụ trang thành viên khách hàng: khách hàng tự tạo yêu cầu lấy hàng/pickup và đồng thời tạo vận đơn để có mã tra cứu ngay.

Mã vận đơn và mã bill là một: `waybill_code`.

Sau khi tạo thành công, backend lưu:

- `booking_requests`: yêu cầu lấy hàng để quản trị viên/CSKH tiếp nhận sau.
- `waybills`: vận đơn chính để khách hàng tra cứu.
- `waybill_items`: danh sách kiện hàng.
- `waybill_extra_services`: dịch vụ cộng thêm.
- `waybill_documents`: chứng từ kèm theo nếu có.
- `tracking_logs`: log khởi tạo vận đơn.

## 2. API đã có cho frontend

Endpoint:

```http
POST /api/waybills/customer/pickups
```

File backend:

- `backend/api/waybills.py`
- `backend/schemas/waybills.py`
- `backend/crud/waybills.py`
- `backend/models.py`
- `backend/alembic/versions/e4f6a8b0c2d4_add_customer_pickup_waybill_details.py`

Quyền gọi API:

- Chỉ tài khoản khách hàng `role_id = 6`.
- Backend tự lấy `customer_id` từ token đăng nhập.
- Frontend không được truyền `customer_id`.
- Nếu tài khoản không phải khách hàng hoặc hồ sơ khách hàng không còn `ACTIVE`, backend trả `403`.

Header cần gửi:

```http
Authorization: Bearer <access_token>
Content-Type: application/json
```

## 3. Payload frontend gửi lên

Ví dụ payload đầy đủ:

```json
{
  "order_type": "DOMESTIC",
  "shop_order_code": "SHOP-ORDER-001",
  "pickup_time": "2026-06-07T09:00:00",
  "sender": {
    "name": "ITVINA",
    "phone": "0123456789",
    "address": "346 Bến Vân Đồn, Phường 1, Quận 4, Hồ Chí Minh",
    "province_id": 79,
    "district_id": 760,
    "ward_id": 26734,
    "province_name": "Thành phố Hồ Chí Minh",
    "district_name": "Quận 4",
    "ward_name": "Phường 1"
  },
  "receiver": {
    "name": "Nguyễn Văn A",
    "phone": "0987654321",
    "address": "1 Đường số 17A, Hồ Chí Minh",
    "province_id": 79,
    "district_id": 761,
    "ward_id": 26740,
    "province_name": "Thành phố Hồ Chí Minh",
    "district_name": "Quận 7",
    "ward_name": "Phường Tân Thuận Đông"
  },
  "items": [
    {
      "product_group": "PARCEL",
      "product_name": "Bưu phẩm bưu kiện",
      "description": "Hàng mẫu",
      "weight": 15,
      "length": 30,
      "width": 20,
      "height": 10,
      "quantity": 1,
      "declared_value": 500000
    }
  ],
  "documents": [
    {
      "document_code": "HD001",
      "document_name": "Hóa đơn bán hàng",
      "quantity": 1,
      "note": "Kèm theo hàng"
    }
  ],
  "cod_amount": 120000,
  "cod_receiver_pays_fee": false,
  "cod_fee_payment_method": "DEBT",
  "service_type": "STANDARD",
  "extra_services": [
    {
      "service_code": "INSURANCE",
      "service_name": "Bảo hiểm hàng hóa",
      "service_fee": 0
    }
  ],
  "delivery_note_option": "CHO_XEM_HANG",
  "note": "Giao giờ hành chính",
  "payment_method": "SENDER_DEBT",
  "pickup_method": "OUR_STAFF_PICKUP",
  "delivery_method": "OUR_STAFF_DELIVERY",
  "save_as_draft": false
}
```

## 4. Ý nghĩa các field frontend cần dùng

`order_type`: loại đơn. Hiện mặc định dùng `DOMESTIC` cho nội địa.

`shop_order_code`: mã đơn hàng của shop, có thể để trống.

`pickup_time`: thời gian khách mong muốn lấy hàng, có thể để trống.

`sender`: thông tin người gửi/địa chỉ lấy hàng. Nếu thiếu một số thông tin người gửi, backend có thể fallback từ hồ sơ khách hàng.

`receiver`: thông tin người nhận/địa chỉ giao hàng. `receiver.province_id` cần có để backend xác định bưu cục phát và tính cước.

`items`: danh sách kiện hàng, bắt buộc có ít nhất 1 kiện.

`documents`: danh sách chứng từ kèm theo, có thể rỗng.

`cod_amount`: tiền thu hộ COD, mặc định `0`.

`cod_receiver_pays_fee`: người nhận trả phí thu hộ hay không.

`cod_fee_payment_method`: hình thức thanh toán phí thu hộ COD. Ví dụ `PAY_NOW`, `DEBT`.

`service_type`: dịch vụ vận chuyển. Ví dụ `STANDARD`, `FAST`, `EXPRESS`, `CPN`, `HT`, `ECONOMY`.

`extra_services`: dịch vụ cộng thêm. Backend hiện nhận `service_fee` từ frontend để lưu vào vận đơn; khi frontend có API cấu hình dịch vụ thì nên map theo danh sách dịch vụ cấu hình.

`delivery_note_option`: ghi chú xem hàng, ví dụ `CHO_XEM_HANG`, `KHONG_CHO_XEM_HANG`, hoặc mã theo UI frontend quy ước.

`note`: ghi chú đơn hàng.

`payment_method`: hình thức thanh toán cước. Các giá trị nên dùng:

- `SENDER_DEBT`: người gửi ghi nợ.
- `SENDER_PAY`: người gửi trả ngay.
- `RECEIVER_PAY`: người nhận trả.

`pickup_method`: hình thức lấy hàng. Nên dùng `OUR_STAFF_PICKUP` khi nhân viên đến lấy hàng, `CUSTOMER_DELIVER_AT_AGENCY` khi khách gửi tại văn phòng.

`delivery_method`: hình thức giao hàng. Nên dùng `OUR_STAFF_DELIVERY` khi giao tận nơi, `CUSTOMER_GET_AT_AGENCY` khi người nhận tại văn phòng.

`save_as_draft`: nếu `true`, đơn lưu nháp. Nếu `false`, đơn chính thức chờ lấy hàng.

## 5. Response backend trả về

Ví dụ response:

```json
{
  "waybill_id": 123,
  "waybill_code": "SP260607093012123A7K9Q",
  "bill_code": "SP260607093012123A7K9Q",
  "request_id": 45,
  "request_code": "SP260607093012456B8L2M",
  "status": "CREATED",
  "pickup_status": "WAIT_PICKUP",
  "shipping_fee": 35000,
  "extra_services_fee": 0,
  "vat_amount": 2800,
  "total_amount_to_collect": 120000
}
```

Ý nghĩa response:

- `waybill_code`: mã vận đơn/mã bill để khách hàng tra cứu.
- `bill_code`: bằng `waybill_code`, frontend có thể hiển thị là mã bill.
- `request_code`: mã yêu cầu pickup nội bộ để admin/CSKH xử lý lấy hàng.
- `status`: trạng thái vận đơn. Nếu tạo chính thức là `CREATED`; nếu lưu nháp là `DRAFT`.
- `pickup_status`: trạng thái yêu cầu lấy hàng. Nếu tạo chính thức là `WAIT_PICKUP`; nếu lưu nháp là `DRAFT`.
- `shipping_fee`: cước vận chuyển backend tính theo bảng giá.
- `extra_services_fee`: tổng phí dịch vụ cộng thêm.
- `vat_amount`: VAT 8%.
- `total_amount_to_collect`: số tiền cần thu theo logic thanh toán và COD.

## 6. Các lỗi frontend cần hiển thị

`403`: tài khoản không phải khách hàng, tài khoản bị khóa/xóa, hoặc hồ sơ khách hàng không còn hoạt động.

`400`: thiếu dữ liệu quan trọng hoặc không xác định được bưu cục lấy/phát theo tỉnh thành.

`500`: lỗi hệ thống khi lưu DB.

Các thông báo lỗi thường gặp:

```json
{ "detail": "Chi tai khoan khach hang moi duoc tao pickup tu trang thanh vien" }
```

```json
{ "detail": "Ho so khach hang khong con hoat dong" }
```

```json
{ "detail": "Khong xac dinh duoc buu cuc lay hang" }
```

```json
{ "detail": "Khong xac dinh duoc buu cuc phat hang theo tinh/thanh nguoi nhan" }
```

## 7. Lưu ý cho frontend khi làm giao diện

Frontend không cần nhập mã vận đơn. Backend tự sinh.

Frontend không gửi `customer_id`, `shipping_fee`, `waybill_code`, `request_code`.

Frontend cần bắt buộc nhập:

- Số điện thoại người nhận.
- Tên người nhận.
- Địa chỉ người nhận.
- Tỉnh/thành người nhận để backend xác định bưu cục phát.
- Ít nhất 1 kiện hàng.
- Khối lượng mỗi kiện lớn hơn 0.

Frontend nên tự động fill thông tin người gửi từ API hồ sơ khách hàng hiện có, sau đó cho phép khách sửa lại địa chỉ lấy hàng nếu cần.

Sau khi tạo thành công, frontend nên hiển thị:

- Mã vận đơn/mã bill.
- Trạng thái đơn.
- Cước dự kiến.
- Nút tra cứu vận đơn.

## 8. Migration cần chạy

API này có thêm cột và bảng mới. Trước khi test thật cần chạy migration:

```bash
alembic upgrade head
```

Migration mới:

```text
backend/alembic/versions/e4f6a8b0c2d4_add_customer_pickup_waybill_details.py
backend/alembic/versions/f6a8b0c2d4e6_add_pickup_form_options.py
backend/alembic/versions/a1b2c3d4e5f6_add_online_pickup_flow_fields.py
```

## 9. API mới cho luồng tiếp nhận pickup online

Khách hàng xem đơn đã tạo:

```http
GET /api/waybills/customer/pickups
GET /api/waybills/customer/pickups/{waybill_code}
```

Quản trị viên xem đơn online chờ xác nhận:

```http
GET /api/delivery/online-pickup-requests?status=PENDING_CONFIRMATION
```

Quản trị viên xác nhận văn phòng nhận:

```http
POST /api/delivery/online-pickup-requests/confirm-hub
```

Payload:

```json
{
  "request_ids": [1, 2, 3],
  "hub_id": 5,
  "note": "Xác nhận văn phòng nhận hàng"
}
```

Văn phòng nhận xem đơn được giao:

```http
GET /api/delivery/hub-pickup-requests?status=RECEIVED
```

Gán bưu tá đi lấy:

```http
POST /api/delivery/pickup-requests/{request_code}/assign-shipper
```

Payload:

```json
{
  "shipper_id": 12,
  "note": "Gán bưu tá lấy hàng ca sáng"
}
```

Bưu tá xác nhận đã lấy hàng:

```http
POST /api/delivery/pickup-requests/{request_code}/picked
```

Payload:

```json
{
  "pickup_image_url": "https://example.com/pickup.jpg",
  "note": "Đã lấy 1 kiện"
}
```

Cân lại và chốt cước thật:

```http
PATCH /api/scans/{waybill_code}/weigh
```

Response có thêm:

```json
{
  "price_status": "ADJUSTED",
  "estimated_shipping_fee": 22500,
  "final_shipping_fee": 30000,
  "estimated_total_amount": 24300,
  "final_total_amount": 32400
}
```

## 10. Yêu cầu frontend cần đáp ứng

Trang khách hàng:

- Lưu nháp bằng `localStorage`, không gọi backend.
- Khi tạo đơn chính thức, gọi `POST /api/waybills/customer/pickups`.
- Hiển thị `Chưa xác nhận văn phòng` khi API trả `office_status = CHUA_XAC_NHAN_VAN_PHONG` hoặc chưa có `hub_id`.
- Hiển thị `Cước dự kiến` khi `price_status = ESTIMATED`.
- Sau khi cân lại, hiển thị `Cước thật` từ `final_*` và chênh lệch so với `estimated_*`.

Trang quản trị:

- Tab chờ xác nhận dùng `GET /api/delivery/online-pickup-requests?status=PENDING_CONFIRMATION`.
- Cho chọn nhiều đơn và chọn văn phòng, gọi `confirm-hub`.
- Tab vừa tiếp nhận/chờ gán bưu tá dùng `GET /api/delivery/hub-pickup-requests?status=RECEIVED`.
- Gán bưu tá bằng `assign-shipper`.
- Sau khi bưu tá lấy hàng, dùng API `picked` để chuyển trạng thái sang `PICKED` và vận đơn sang `PICKED_PENDING_VERIFY`.
