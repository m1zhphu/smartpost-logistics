# Bàn giao API luồng 2: Admin/CSKH tạo pickup thay khách

## 1. Mục tiêu nghiệp vụ

Luồng 2 dùng khi khách hàng gọi tổng đài/CSKH và nhân viên hệ thống tạo pickup thay khách.

Về bản chất, sau khi tạo xong thì đơn đi tiếp cùng pipeline với luồng khách tự tạo:

```text
Tạo pickup -> xác định/xác nhận văn phòng -> gán bưu tá -> bưu tá lấy hàng -> nhập kho -> cân lại -> chốt cước thật -> khách xem trạng thái/cước
```

Điểm khác chính nằm ở bước tạo đơn:

```text
Luồng 1: khách hàng tự tạo từ trang thành viên/app khách hàng.
Luồng 2: admin/CSKH tạo thay khách từ web quản trị/tổng đài.
```

## 2. Những phần giống luồng khách hàng tự tạo

Luồng 2 dùng chung các nghiệp vụ sau với luồng 1:

```text
1. Tạo booking_requests để điều phối pickup.
2. Tạo waybills để vận hành vận đơn.
3. Tự sinh request_code.
4. Tự sinh waybill_code.
5. bill_code = waybill_code.
6. Lưu đầy đủ sender/receiver/items/documents/extra_services.
7. Tính cước dự kiến và lưu estimated_*.
8. price_status ban đầu = ESTIMATED.
9. Sau khi có văn phòng, vẫn gán bưu tá như cũ.
10. Bưu tá mobile vẫn nhận đơn, upload ảnh, xác nhận lấy hàng như cũ.
11. Kho vẫn nhập kho bằng waybill_code.
12. Kho vẫn cân lại và chốt cước thật.
13. Khách hàng vẫn xem được đơn bằng API customer pickup.
```

Các API dùng tiếp sau bước tạo vẫn giống luồng 1:

```http
POST /api/delivery/pickup-requests/{request_code}/assign-shipper
GET  /api/delivery/mobile/shipper/pickup-requests?status=ASSIGNED_PICKUP
GET  /api/delivery/mobile/shipper/pickup-requests/{request_code}
POST /api/upload/bill?is_pickup=true
POST /api/delivery/pickup-requests/{request_code}/picked
POST /api/scans/in-hub
PATCH /api/scans/{waybill_code}/weigh
GET  /api/waybills/customer/pickups/{waybill_code}
```

## 3. Những phần khác so với khách hàng tự tạo

### 3.1. Người tạo đơn

Luồng 1:

```text
Người tạo là khách hàng.
Token phải là role_id = 6.
Backend lấy customer_id từ token.
```

Luồng 2:

```text
Người tạo là admin/manager/kho/CSKH.
Role được phép: 1, 2, 3, 7.
Frontend phải truyền customer_id của khách cần tạo đơn.
```

### 3.2. API tạo đơn

Luồng 1 dùng:

```http
POST /api/waybills/customer/pickups
```

Luồng 2 dùng:

```http
POST /api/waybills/admin/pickups
```

### 3.3. Nguồn tạo đơn

Luồng 1:

```text
source = PORTAL
```

Luồng 2:

```text
source = HOTLINE | CSKH | ADMIN
```

Frontend web quản trị nên dùng:

```text
HOTLINE: khách gọi tổng đài.
CSKH: CSKH chủ động tạo thay khách.
ADMIN: quản trị viên tạo thủ công.
```

### 3.4. Trạng thái sau khi tạo

Luồng 1 khách tự tạo:

```text
booking_requests.status = PENDING_CONFIRMATION
target_hub_id = null
office_status = CHUA_XAC_NHAN_VAN_PHONG
```

Luồng 2 admin tạo có 2 trường hợp:

Trường hợp có chọn văn phòng ngay lúc tạo:

```text
Frontend truyền target_hub_id.
booking_requests.status = RECEIVED.
booking_requests.target_hub_id = target_hub_id.
waybills.origin_hub_id = target_hub_id.
waybills.holding_hub_id = target_hub_id.
office_status = tên văn phòng.
Đơn đi thẳng sang bước gán bưu tá.
```

Trường hợp chưa chọn văn phòng:

```text
Frontend không truyền target_hub_id.
booking_requests.status = PENDING_CONFIRMATION.
target_hub_id = null.
office_status = CHUA_XAC_NHAN_VAN_PHONG.
Đơn vẫn nằm ở tab chờ xác nhận văn phòng.
```

## 4. API admin/CSKH tạo pickup thay khách

```http
POST /api/waybills/admin/pickups
```

Quyền:

```text
role_id = 1, 2, 3, 7
```

Body mẫu:

```json
{
  "customer_id": 23,
  "target_hub_id": 5,
  "source": "HOTLINE",
  "order_type": "DOMESTIC",
  "shop_order_code": "HOTLINE-TEST-001",
  "pickup_time": "2026-06-08T09:00:00",
  "sender": {
    "name": "Shop Test Tổng Đài",
    "phone": "0849081205",
    "address": "346 Bến Vân Đồn, Quận 4, Hồ Chí Minh",
    "province_id": 79,
    "district_id": 760,
    "ward_id": 26734,
    "province_name": "Thành phố Hồ Chí Minh",
    "district_name": "Quận 4",
    "ward_name": "Phường 1"
  },
  "receiver": {
    "name": "Nguyễn Văn B",
    "phone": "0987654322",
    "address": "1 Đường số 17A, Quận 7, Hồ Chí Minh",
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
      "description": "Hàng tổng đài tạo",
      "weight": 1.5,
      "length": 30,
      "width": 20,
      "height": 10,
      "quantity": 1,
      "declared_value": 500000
    }
  ],
  "documents": [],
  "cod_amount": 120000,
  "cod_receiver_pays_fee": false,
  "cod_fee_payment_method": null,
  "service_type": "STANDARD",
  "extra_services": [],
  "delivery_note_option": "CHO_XEM_HANG",
  "note": "CSKH tạo pickup thay khách gọi tổng đài",
  "payment_method": "SENDER_DEBT",
  "pickup_method": "OUR_STAFF_PICKUP",
  "delivery_method": "OUR_STAFF_DELIVERY",
  "save_as_draft": false
}
```

Response khi có `target_hub_id`:

```json
{
  "waybill_id": 64,
  "waybill_code": "SP260608090000ABCDE",
  "bill_code": "SP260608090000ABCDE",
  "request_id": 4,
  "request_code": "SP260608090000FGHIJ",
  "status": "CREATED",
  "pickup_status": "RECEIVED",
  "office_status": "Bưu cục Hồ Chí Minh",
  "price_status": "ESTIMATED",
  "shipping_fee": 22500,
  "extra_services_fee": 0,
  "vat_amount": 1800,
  "total_amount_to_collect": 120000,
  "estimated_shipping_fee": 22500,
  "estimated_vat_amount": 1800,
  "estimated_total_amount": 24300
}
```

Response khi không truyền `target_hub_id`:

```json
{
  "status": "CREATED",
  "pickup_status": "PENDING_CONFIRMATION",
  "office_status": "CHUA_XAC_NHAN_VAN_PHONG",
  "price_status": "ESTIMATED"
}
```

## 5. Frontend web quản trị cần làm

### 5.1. Màn tạo pickup thay khách

Web quản trị cần có form tạo pickup cho CSKH/tổng đài.

Form cần có:

```text
1. Chọn khách hàng customer_id.
2. Chọn source: HOTLINE, CSKH, ADMIN.
3. Nhập thông tin người gửi.
4. Nhập thông tin người nhận.
5. Nhập thông tin hàng hóa/kiện.
6. Nhập COD nếu có.
7. Chọn dịch vụ vận chuyển.
8. Chọn dịch vụ cộng thêm nếu có.
9. Nhập ghi chú.
10. Chọn văn phòng nhận target_hub_id nếu đã xác định được.
```

Khi submit:

```text
Gọi POST /api/waybills/admin/pickups.
```

Nếu response `pickup_status = RECEIVED`:

```text
Thông báo tạo thành công.
Chuyển đơn sang tab “Vừa tiếp nhận/Chờ gán bưu tá”.
Cho phép gán bưu tá.
```

Nếu response `pickup_status = PENDING_CONFIRMATION`:

```text
Thông báo tạo thành công nhưng chưa xác nhận văn phòng.
Chuyển đơn sang tab “Chờ xác nhận văn phòng”.
```

### 5.2. Tab chờ xác nhận văn phòng

API:

```http
GET /api/delivery/online-pickup-requests?status=PENDING_CONFIRMATION
```

Tab này giờ sẽ có cả:

```text
PORTAL: khách tự tạo.
HOTLINE/CSKH/ADMIN: nhân viên tạo nhưng chưa chọn văn phòng.
```

Frontend nên hiển thị thêm cột:

```text
Nguồn tạo: source
```

### 5.3. Tab vừa tiếp nhận/chờ gán bưu tá

API:

```http
GET /api/delivery/hub-pickup-requests?status=RECEIVED&hub_id=5
```

Tab này giờ sẽ có cả:

```text
Đơn khách tự tạo đã được xác nhận văn phòng.
Đơn tổng đài/CSKH tạo và đã chọn văn phòng ngay lúc tạo.
```

Gán bưu tá vẫn dùng:

```http
POST /api/delivery/pickup-requests/{request_code}/assign-shipper
```

Body:

```json
{
  "shipper_id": 12,
  "note": "Gán bưu tá đi lấy hàng ca sáng"
}
```

## 6. Mobile app bưu tá cần làm

Mobile bưu tá không cần phân biệt đơn do khách tạo hay CSKH tạo. Sau khi đã được gán, app dùng cùng API:

```http
GET /api/delivery/mobile/shipper/pickup-requests?status=ASSIGNED_PICKUP
```

Response có `source` gián tiếp ở request API quản trị, còn app bưu tá chỉ cần quan tâm:

```text
request_code
waybill_code
sender_name
sender_phone
pickup_address
receiver_name
receiver_phone
receiver_address
est_weight
est_quantity
cod_amount
note
requested_pickup_time
```

Chi tiết:

```http
GET /api/delivery/mobile/shipper/pickup-requests/{request_code}
```

Upload ảnh pickup:

```http
POST /api/upload/bill?is_pickup=true
```

Xác nhận đã lấy:

```http
POST /api/delivery/pickup-requests/{request_code}/picked
```

Body:

```json
{
  "pickup_image_url": "/uploads/bills/xxx.jpg",
  "note": "Đã lấy 1 kiện từ khách hàng"
}
```

## 7. Web kho cần làm

Không thay đổi so với luồng khách tự tạo.

Nhập kho:

```http
POST /api/scans/in-hub
```

Body:

```json
{
  "waybill_code": "SP260608090000ABCDE",
  "note": "Nhập kho sau khi bưu tá mang hàng về",
  "actual_weight": 2.1
}
```

Cân lại:

```http
PATCH /api/scans/{waybill_code}/weigh
```

Body:

```json
{
  "waybill_code": "SP260608090000ABCDE",
  "actual_weight": 2.1,
  "note": "Cân lại tại bưu cục sau khi bưu tá mang hàng về"
}
```

## 8. Web/mobile khách hàng cần làm

Khách hàng vẫn xem được đơn do tổng đài/CSKH tạo thay mình.

Danh sách:

```http
GET /api/waybills/customer/pickups
```

Chi tiết:

```http
GET /api/waybills/customer/pickups/{waybill_code}
```

Frontend khách hàng không cần biết đơn do ai tạo, nhưng có thể hiển thị nếu backend sau này bổ sung `source` vào response.

Hiện tại cần hiển thị:

```text
Mã vận đơn
Trạng thái pickup
Trạng thái vận đơn
Văn phòng nhận
Bưu tá
Cước dự kiến
Cước thật nếu đã cân
```

## 9. Thứ tự test Swagger cho luồng 2

### Trường hợp admin tạo và chọn văn phòng ngay

```text
1. Đăng nhập admin/CSKH.
2. POST /api/waybills/admin/pickups, có target_hub_id.
3. Kiểm tra response pickup_status = RECEIVED.
4. POST /api/delivery/pickup-requests/{request_code}/assign-shipper.
5. Đăng nhập mobile bưu tá.
6. GET /api/delivery/mobile/shipper/pickup-requests?status=ASSIGNED_PICKUP.
7. POST /api/upload/bill?is_pickup=true.
8. POST /api/delivery/pickup-requests/{request_code}/picked.
9. Đăng nhập kho.
10. POST /api/scans/in-hub với waybill_code.
11. PATCH /api/scans/{waybill_code}/weigh.
12. Đăng nhập khách hàng.
13. GET /api/waybills/customer/pickups/{waybill_code}.
```

### Trường hợp admin tạo nhưng chưa chọn văn phòng

```text
1. Đăng nhập admin/CSKH.
2. POST /api/waybills/admin/pickups, không truyền target_hub_id.
3. Kiểm tra response pickup_status = PENDING_CONFIRMATION.
4. GET /api/delivery/online-pickup-requests?status=PENDING_CONFIRMATION.
5. POST /api/delivery/online-pickup-requests/confirm-hub.
6. Đi tiếp các bước gán bưu tá, lấy hàng, nhập kho, cân lại như trên.
```

## 10. Kết luận cho frontend/mobile

Frontend web quản trị cần thêm màn/form tạo pickup thay khách bằng API:

```http
POST /api/waybills/admin/pickups
```

Các màn còn lại có thể dùng lại luồng đã làm:

```text
Chờ xác nhận
Vừa tiếp nhận
Gán bưu tá
Mobile bưu tá nhận đơn
Kho nhập kho
Kho cân lại
Khách xem trạng thái
```

Điểm cần nhớ:

```text
Nếu admin chọn văn phòng ngay lúc tạo, bỏ qua bước xác nhận văn phòng.
Nếu admin chưa chọn văn phòng, đơn đi vào tab chờ xác nhận như khách tự tạo.
Bưu tá và kho không cần biết đơn do khách hay admin tạo, chỉ cần xử lý theo request_code/waybill_code.
```
