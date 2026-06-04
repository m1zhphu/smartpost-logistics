# Đặc tả luồng Pickup - CSKH - Điều phối - Tạo vận đơn - Tính cước

Tài liệu này rà soát dự án `smartpost-logistics` hiện tại và đặc tả phần cần hoàn thiện cho web backend/frontend, bỏ qua mobile app. Trọng tâm là 4 bước:

1. Khách hàng tạo yêu cầu pickup.
2. CSKH nhìn thấy yêu cầu khách tạo.
3. Điều phối shipper khu vực đi lấy hàng và tạo mã đơn/vận đơn.
4. Tính cước, nếu khách hàng chưa có bảng giá riêng thì tạo/cấu hình bảng giá trước khi chốt đơn.

## 1. Kết luận rà soát nhanh hiện trạng

### Backend đã có

- Có model `BookingRequests` và `BookingRequestLogs` trong `backend/models.py` để lưu yêu cầu pickup.
- Có API pickup trong `backend/api/delivery.py`:
  - `POST /api/delivery/pickup-requests`
  - `GET /api/delivery/pickup-requests`
  - `GET /api/delivery/pickup-requests/{code}`
  - `POST /api/delivery/pickup-requests/{code}/assign`
- Có API điều phối giao hàng cuối tuyến:
  - `GET /api/delivery/pending-assign`
  - `POST /api/delivery/assign-shipper`
- Có API quản lý shipper:
  - `GET /api/users/shippers`
- Có API tạo vận đơn:
  - `POST /api/waybills`
- Có API tính cước:
  - `POST /api/pricing/calculate`
  - `POST /api/pricing/simulate`
- Có API bảng giá:
  - `GET /api/pricing/rules`
  - `POST /api/pricing/rules`
  - `PUT /api/pricing/rules/{rule_id}`
  - `DELETE /api/pricing/rules/{rule_id}`
- Có mapping khách hàng - policy giá trong backend qua `CustomerPriceMapping`, nhưng chưa thấy API riêng để tạo/sửa mapping này.

### Backend còn thiếu hoặc chưa đủ cho yêu cầu mới

- Chưa có API public/portal đúng nghĩa để khách hàng tự tạo pickup. API hiện tại yêu cầu đăng nhập và chỉ cho role `1,2,3`; chưa cho customer role hoặc portal token.
- `BookingRequestCreate` chưa có tọa độ pickup (`pickup_lat`, `pickup_lng`), chưa có người liên hệ lấy hàng, khung giờ pickup, ảnh/hàng mẫu, địa chỉ chuẩn hóa province/district/ward.
- Chưa có bảng/API `shipper_locations`, chưa có luồng shipper cập nhật GPS, chưa có API đề xuất shipper gần điểm pickup.
- API assign pickup hiện chỉ gán thủ công `shipper_id`; chưa kiểm tra shipper cùng khu vực/hub, chưa trả danh sách shipper gần nhất.
- Chưa có API chuyển trạng thái pickup sau khi shipper nhận/đã lấy hàng/thất bại.
- Chưa có API tạo vận đơn trực tiếp từ pickup request. Hiện `Waybills` có `request_id`, nhưng API `POST /api/waybills` chưa thể hiện contract `request_id` rõ ràng cho luồng này.
- Chưa có API kiểm tra khách hàng đã có bảng giá riêng hay chưa, và chưa có API tạo policy + gán policy cho khách hàng trong một bước.

### Frontend đã có

- Có màn hình điều phối shipper ở `frontend/src/views/admin/delivery/AssignShipper.vue`, nhưng màn hình này đang điều phối vận đơn chờ giao cuối tuyến, không phải điều phối pickup.
- Có màn hình tạo vận đơn `frontend/src/views/admin/waybills/CreateWaybill.vue`.
- Có màn hình quản lý bảng giá `frontend/src/views/admin/accounting/PricingRules.vue`.
- Có màn hình mô phỏng giá `frontend/src/views/admin/pricing/PriceSimulator.vue`.
- Có route CSKH kiểm duyệt bill `frontend/src/views/admin/cskh/BillVerification.vue`.

### Frontend còn thiếu

- Chưa có màn hình khách hàng tạo pickup trên web.
- Chưa có màn hình CSKH xem danh sách pickup request riêng.
- Chưa có màn hình điều phối pickup riêng với danh sách shipper khu vực/gợi ý gần nhất.
- Chưa có workflow từ pickup request sang tạo vận đơn.
- Chưa có UI xử lý trường hợp “khách chưa có bảng giá”: cảnh báo, mở form tạo bảng giá, hoặc gửi yêu cầu cấu hình giá.

## 2. Luồng nghiệp vụ chuẩn đề xuất

### Trạng thái pickup request

Đề xuất chuẩn hóa enum:

| Status | Ý nghĩa | Người thao tác |
| --- | --- | --- |
| `PENDING` | Khách vừa tạo, chờ CSKH/điều phối kiểm tra | Customer/CSKH |
| `CONFIRMED` | CSKH xác nhận thông tin pickup hợp lệ | CSKH |
| `ASSIGNED_PICKUP` | Đã gán shipper đi lấy | CSKH/Điều phối |
| `SHIPPER_ACCEPTED` | Shipper xác nhận nhận nhiệm vụ | Shipper |
| `PICKED_UP` | Shipper đã lấy hàng thành công | Shipper/Điều phối |
| `PICKUP_FAILED` | Lấy hàng thất bại | Shipper/CSKH |
| `CONVERTED_TO_WAYBILL` | Đã tạo vận đơn từ pickup | CSKH/Điều phối |
| `CANCELLED` | Hủy yêu cầu | Customer/CSKH |

Hiện backend đang tạo `WAIT_PICKUP`, sau assign chuyển `ASSIGNED_PICKUP`. Nên đổi hoặc map lại về bộ trạng thái trên để frontend dễ lọc và hiển thị.

### Luồng chính

1. Customer tạo pickup request từ portal.
2. Backend lưu request status `PENDING`, sinh `request_code`.
3. CSKH xem danh sách `PENDING`, kiểm tra thông tin khách, địa chỉ, số lượng, SLA, ghi chú.
4. CSKH xác nhận request sang `CONFIRMED`.
5. Điều phối mở request, xem shipper cùng hub/khu vực và gợi ý shipper gần nhất.
6. Điều phối gán shipper, request sang `ASSIGNED_PICKUP`.
7. Shipper đi lấy hàng. Sau khi lấy thành công, request sang `PICKED_UP`.
8. CSKH/điều phối tạo vận đơn từ request. Backend tính cước:
   - Nếu khách có policy giá: tính theo policy đó.
   - Nếu chưa có policy riêng: dùng policy mặc định hoặc yêu cầu tạo bảng giá riêng tùy cấu hình.
9. Sau khi tạo vận đơn thành công, request sang `CONVERTED_TO_WAYBILL` và lưu liên kết `waybills.request_id`.

## 3. Backend cần bổ sung

### 3.1. Bổ sung database cho pickup request

Hiện bảng `booking_requests` nên bổ sung các cột:

```sql
ALTER TABLE booking_requests
ADD COLUMN contact_name VARCHAR(100),
ADD COLUMN contact_phone VARCHAR(20),
ADD COLUMN pickup_province_id INTEGER,
ADD COLUMN pickup_district_id INTEGER,
ADD COLUMN pickup_ward_id INTEGER,
ADD COLUMN pickup_lat NUMERIC(10, 7),
ADD COLUMN pickup_lng NUMERIC(10, 7),
ADD COLUMN pickup_time_from TIMESTAMP,
ADD COLUMN pickup_time_to TIMESTAMP,
ADD COLUMN created_by_user_id INTEGER,
ADD COLUMN assigned_by_user_id INTEGER,
ADD COLUMN assigned_at TIMESTAMP,
ADD COLUMN picked_up_at TIMESTAMP,
ADD COLUMN failure_reason VARCHAR(100),
ADD COLUMN failure_note TEXT;
```

Nếu muốn giữ tối thiểu MVP, bắt buộc có: `contact_name`, `contact_phone`, `pickup_lat`, `pickup_lng`, `pickup_time_from`, `pickup_time_to`, `assigned_by_user_id`, `assigned_at`.

### 3.2. Thêm bảng shipper location

MVP dưới 500 shipper online có thể dùng PostgreSQL thường + Haversine trong FastAPI.

```sql
CREATE TABLE shipper_locations (
  shipper_id INTEGER PRIMARY KEY REFERENCES users(user_id),
  latitude NUMERIC(10, 7) NOT NULL,
  longitude NUMERIC(10, 7) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'AVAILABLE',
  accuracy_meters NUMERIC(10, 2),
  heading NUMERIC(10, 2),
  speed NUMERIC(10, 2),
  updated_at TIMESTAMP NOT NULL DEFAULT now()
);
```

Status đề xuất:

- `AVAILABLE`: sẵn sàng nhận pickup.
- `BUSY`: đang có nhiệm vụ.
- `OFFLINE`: không online.
- `BREAK`: tạm nghỉ.

Khi production lớn hơn 1000 shipper online, nâng cấp PostGIS:

```sql
ALTER TABLE shipper_locations
ADD COLUMN location geography(Point, 4326);

CREATE INDEX idx_shipper_locations_location
ON shipper_locations
USING GIST(location);
```

### 3.3. API customer tạo pickup

#### `POST /api/customer/pickup-requests`

Dành cho khách hàng/portal. Nếu chưa làm portal auth riêng, có thể tạm dùng token user customer hoặc endpoint nội bộ `POST /api/delivery/pickup-requests` nhưng phải mở quyền đúng.

Request:

```json
{
  "customer_id": 12,
  "source": "PORTAL",
  "shop_order_code": "SHOP-10001",
  "contact_name": "Nguyen Van A",
  "contact_phone": "0909123456",
  "pickup_address": "123 Nguyen Trai, Phuong X, Quan Y, TP HCM",
  "pickup_province_id": 79,
  "pickup_district_id": 760,
  "pickup_ward_id": 26734,
  "pickup_lat": 10.8235,
  "pickup_lng": 106.6299,
  "pickup_time_from": "2026-05-27T09:00:00+07:00",
  "pickup_time_to": "2026-05-27T12:00:00+07:00",
  "product_type": "FASHION",
  "est_weight": 3.5,
  "est_quantity": 4,
  "is_vehicle_required": false,
  "priority": "NORMAL",
  "notes": "Gọi trước 15 phút"
}
```

Response:

```json
{
  "request_id": 101,
  "request_code": "PKR-20260527-1234",
  "status": "PENDING",
  "customer_id": 12,
  "customer_code": "CUS001",
  "customer_name": "Shop ABC",
  "pickup_address": "123 Nguyen Trai, Phuong X, Quan Y, TP HCM",
  "pickup_lat": 10.8235,
  "pickup_lng": 106.6299,
  "pickup_time_from": "2026-05-27T09:00:00+07:00",
  "pickup_time_to": "2026-05-27T12:00:00+07:00",
  "created_at": "2026-05-27T08:10:00+07:00"
}
```

Validate:

- `customer_id` tồn tại và active.
- `contact_phone` hợp lệ.
- `pickup_address` không rỗng.
- Nếu có `pickup_lat/lng`, phải nằm trong range hợp lệ.
- Nếu không có `target_hub_id`, backend tự chọn hub theo `pickup_province_id/district_id` hoặc theo customer profile.

### 3.4. API CSKH xem pickup

#### `GET /api/delivery/pickup-requests`

Hiện đã có, nhưng cần bổ sung filter/pagination/sort.

Query:

```text
status=PENDING
customer_id=12
target_hub_id=1
assigned_shipper_id=20
date_from=2026-05-27
date_to=2026-05-27
keyword=PKR-20260527
page=1
size=20
```

Response:

```json
{
  "items": [
    {
      "request_id": 101,
      "request_code": "PKR-20260527-1234",
      "status": "PENDING",
      "source": "PORTAL",
      "customer_id": 12,
      "customer_code": "CUS001",
      "customer_name": "Shop ABC",
      "contact_name": "Nguyen Van A",
      "contact_phone": "0909123456",
      "pickup_address": "123 Nguyen Trai, TP HCM",
      "pickup_lat": 10.8235,
      "pickup_lng": 106.6299,
      "pickup_time_from": "2026-05-27T09:00:00+07:00",
      "pickup_time_to": "2026-05-27T12:00:00+07:00",
      "target_hub_id": 1,
      "target_hub_name": "Hub HCM",
      "est_weight": 3.5,
      "est_quantity": 4,
      "priority": "NORMAL",
      "assigned_shipper_id": null,
      "assigned_shipper_name": null,
      "created_at": "2026-05-27T08:10:00+07:00"
    }
  ],
  "total": 1,
  "page": 1,
  "size": 20
}
```

### 3.5. API CSKH xác nhận pickup

#### `POST /api/delivery/pickup-requests/{code}/confirm`

Request:

```json
{
  "target_hub_id": 1,
  "pickup_time_from": "2026-05-27T09:00:00+07:00",
  "pickup_time_to": "2026-05-27T12:00:00+07:00",
  "priority": "NORMAL",
  "note": "Đã gọi xác nhận với khách"
}
```

Response:

```json
{
  "request_code": "PKR-20260527-1234",
  "status": "CONFIRMED"
}
```

Rule:

- Chỉ xác nhận từ `PENDING`.
- CSKH/điều phối/admin được thao tác.
- Ghi `booking_request_logs`.

### 3.6. API shipper cập nhật GPS

#### `PUT /api/shippers/me/location`

Request:

```json
{
  "latitude": 10.8231,
  "longitude": 106.6301,
  "status": "AVAILABLE",
  "accuracy_meters": 15.5,
  "heading": 120,
  "speed": 0
}
```

Response:

```json
{
  "shipper_id": 20,
  "status": "AVAILABLE",
  "updated_at": "2026-05-27T08:15:00+07:00"
}
```

Rule:

- Chỉ role shipper.
- Mỗi lần cập nhật ghi đè record theo `shipper_id`.
- Location quá 2 phút được xem là offline/stale khi tìm gần nhất.

### 3.7. API gợi ý shipper gần pickup

#### `GET /api/delivery/pickup-requests/{code}/nearest-shippers`

Query:

```text
radius_km=3
limit=5
```

Response:

```json
{
  "request_code": "PKR-20260527-1234",
  "pickup_location": {
    "lat": 10.8235,
    "lng": 106.6299
  },
  "items": [
    {
      "shipper_id": 20,
      "full_name": "Tran Van B",
      "phone_number": "0911222333",
      "primary_hub_id": 1,
      "primary_hub_name": "Hub HCM",
      "status": "AVAILABLE",
      "distance_km": 0.32,
      "last_location_at": "2026-05-27T08:14:30+07:00",
      "active_pickup_count": 1,
      "active_delivery_count": 3
    }
  ]
}
```

MVP query:

1. Lấy shipper role `4`, active, cùng `target_hub_id` nếu có.
2. Join `shipper_locations`.
3. Lọc `status = AVAILABLE`.
4. Lọc `updated_at > now() - interval '2 minutes'`.
5. Tính Haversine trong Python.
6. Sort theo `distance_km`, lấy `limit`.

Điểm cần tránh: không chỉ chọn shipper gần nhất tuyệt đối. Nên hiển thị 5 người gần nhất kèm tải công việc để điều phối quyết định.

### 3.8. API assign shipper pickup

Hiện có `POST /api/delivery/pickup-requests/{code}/assign`; cần mở rộng contract.

Request:

```json
{
  "shipper_id": 20,
  "assignment_note": "Ưu tiên lấy trước 10h",
  "expected_pickup_at": "2026-05-27T10:00:00+07:00"
}
```

Response:

```json
{
  "request_code": "PKR-20260527-1234",
  "status": "ASSIGNED_PICKUP",
  "assigned_shipper_id": 20,
  "assigned_shipper_name": "Tran Van B",
  "assigned_at": "2026-05-27T08:20:00+07:00"
}
```

Rule:

- Cho phép từ `CONFIRMED` hoặc `PENDING` nếu nghiệp vụ muốn assign nhanh.
- Kiểm tra shipper active, role `4`.
- Nếu user không phải admin, shipper phải cùng hub/khu vực.
- Ghi log.
- Gửi push nếu có token.

### 3.9. API cập nhật kết quả pickup

#### `POST /api/delivery/pickup-requests/{code}/pickup-success`

Request:

```json
{
  "actual_quantity": 4,
  "actual_weight": 3.8,
  "pickup_image_url": "/uploads/pickup/PKR-20260527-1234.jpg",
  "note": "Đã nhận đủ hàng"
}
```

Response:

```json
{
  "request_code": "PKR-20260527-1234",
  "status": "PICKED_UP",
  "picked_up_at": "2026-05-27T10:05:00+07:00"
}
```

#### `POST /api/delivery/pickup-requests/{code}/pickup-failure`

Request:

```json
{
  "reason_code": "CUSTOMER_NOT_AVAILABLE",
  "note": "Gọi không nghe máy"
}
```

Response:

```json
{
  "request_code": "PKR-20260527-1234",
  "status": "PICKUP_FAILED"
}
```

### 3.10. API kiểm tra chính sách giá của khách

#### `GET /api/pricing/customers/{customer_id}/policy`

Response khi đã có policy riêng:

```json
{
  "customer_id": 12,
  "has_custom_policy": true,
  "policy_id": 5,
  "policy_code": "CUS001_2026",
  "policy_name": "Bảng giá Shop ABC 2026",
  "is_active": true,
  "is_approved": true
}
```

Response khi chưa có:

```json
{
  "customer_id": 12,
  "has_custom_policy": false,
  "fallback_policy_id": 1,
  "fallback_policy_name": "Bảng giá mặc định"
}
```

### 3.11. API tạo policy giá và gán cho khách

#### `POST /api/pricing/customers/{customer_id}/policy`

Request:

```json
{
  "policy_code": "CUS001_2026",
  "policy_name": "Bảng giá Shop ABC 2026",
  "valid_from": "2026-05-27T00:00:00+07:00",
  "valid_to": null,
  "copy_from_policy_id": 1,
  "is_approved": false
}
```

Response:

```json
{
  "customer_id": 12,
  "policy_id": 5,
  "policy_code": "CUS001_2026",
  "mapping_created": true
}
```

Sau đó FE dùng `POST /api/pricing/rules` để thêm từng rule, hoặc backend bổ sung batch API:

#### `POST /api/pricing/policies/{policy_id}/rules/bulk`

Request:

```json
{
  "rules": [
    {
      "origin_hub_id": 1,
      "dest_hub_id": 2,
      "service_type": "STANDARD",
      "min_weight": 0,
      "max_weight": 1,
      "price": 18000,
      "is_active": true
    },
    {
      "origin_hub_id": 1,
      "dest_hub_id": 2,
      "service_type": "STANDARD",
      "min_weight": 1,
      "max_weight": 3,
      "price": 25000,
      "is_active": true
    }
  ]
}
```

### 3.12. API tính cước cho pickup trước khi tạo vận đơn

Hiện có `POST /api/pricing/calculate`, dùng được. Cần quy định rõ frontend gọi trước khi submit tạo vận đơn.

Request:

```json
{
  "origin_hub_id": 1,
  "dest_hub_id": 2,
  "customer_id": 12,
  "weight": 3.8,
  "length": 20,
  "width": 15,
  "height": 10,
  "service_type": "STANDARD",
  "extra_services": ["INSURANCE"],
  "cod_amount": 500000,
  "dest_district_id": 760,
  "dest_ward_id": 26734
}
```

Response:

```json
{
  "main_fee": 25000,
  "extra_fee": 10000,
  "remote_fee": 0,
  "vat": 2800,
  "total": 37800,
  "rule_id": 88,
  "charge_weight": 3.8,
  "matched_rule": "1-3kg @ 25,000d"
}
```

Nếu chưa có rule:

```json
{
  "detail": "Chưa có bảng giá cho tuyến 79→1 (STANDARD)."
}
```

Frontend phải chặn tạo vận đơn khi API tính cước trả `404`, đồng thời hiển thị hành động “Tạo bảng giá cho khách/tuyến này”.

### 3.13. API tạo vận đơn từ pickup request

Đề xuất thêm endpoint riêng để tránh FE phải tự ghép quá nhiều dữ liệu.

#### `POST /api/delivery/pickup-requests/{code}/create-waybill`

Request:

```json
{
  "service_type": "STANDARD",
  "payment_method": "SENDER_PAY",
  "sender_name": "Shop ABC",
  "sender_phone": "0909123456",
  "sender_address": "123 Nguyen Trai, TP HCM",
  "receiver_name": "Le Thi C",
  "receiver_phone": "0988999000",
  "receiver_address": "456 Tran Hung Dao, Ha Noi",
  "dest_hub_id": 2,
  "dest_district_id": 1,
  "dest_ward_id": 10,
  "actual_weight": 3.8,
  "length": 20,
  "width": 15,
  "height": 10,
  "product_name": "Quan ao",
  "cod_amount": 500000,
  "extra_services": ["INSURANCE"],
  "note": "Tạo từ pickup request",
  "pricing": {
    "rule_id": 88,
    "shipping_fee": 37800
  }
}
```

Response:

```json
{
  "request_code": "PKR-20260527-1234",
  "request_status": "CONVERTED_TO_WAYBILL",
  "waybill_id": 501,
  "waybill_code": "SPX202605270001",
  "shipping_fee": 37800,
  "status": "CREATED"
}
```

Rule:

- Chỉ tạo từ request `PICKED_UP`, hoặc cho phép từ `ASSIGNED_PICKUP` nếu CSKH tạo trước khi shipper hoàn tất.
- Backend tự set `request_id` vào waybill.
- Backend tính lại cước lần cuối để tránh FE gửi sai `shipping_fee`.
- Nếu giá FE gửi khác giá backend tính lại, trả `409 PRICE_CHANGED`.

## 4. Frontend cần làm

### 4.1. Màn hình khách hàng tạo pickup

Route đề xuất:

- `/customer/pickup/create` nếu có customer portal.
- Hoặc `/admin/pickup/create` cho CSKH tạo hộ khách.

Form cần có:

- Chọn/hiển thị khách hàng: `customer_id`, `customer_code`, `customer_name`.
- Người liên hệ: `contact_name`, `contact_phone`.
- Địa chỉ lấy hàng: `pickup_address`, `pickup_province_id`, `pickup_district_id`, `pickup_ward_id`.
- Tọa độ lấy hàng: `pickup_lat`, `pickup_lng`; có thể tự geocode hoặc nhập từ bản đồ sau.
- Khung giờ lấy: `pickup_time_from`, `pickup_time_to`.
- Thông tin hàng: `product_type`, `est_weight`, `est_quantity`, `is_vehicle_required`.
- Độ ưu tiên: `NORMAL`, `URGENT`, `VIP`, `HT`.
- Ghi chú.

Frontend gửi:

```json
{
  "customer_id": 12,
  "source": "PORTAL",
  "shop_order_code": "SHOP-10001",
  "contact_name": "Nguyen Van A",
  "contact_phone": "0909123456",
  "pickup_address": "123 Nguyen Trai, TP HCM",
  "pickup_province_id": 79,
  "pickup_district_id": 760,
  "pickup_ward_id": 26734,
  "pickup_lat": 10.8235,
  "pickup_lng": 106.6299,
  "pickup_time_from": "2026-05-27T09:00:00+07:00",
  "pickup_time_to": "2026-05-27T12:00:00+07:00",
  "product_type": "FASHION",
  "est_weight": 3.5,
  "est_quantity": 4,
  "is_vehicle_required": false,
  "priority": "NORMAL",
  "notes": "Gọi trước 15 phút"
}
```

Frontend nhận:

- `request_code` để hiển thị mã yêu cầu.
- `status` để hiển thị trạng thái.
- `created_at`.

### 4.2. Màn hình CSKH xem pickup request

Route đề xuất:

- `/admin/cskh/pickup-requests`

UI cần có:

- Tabs theo status: `PENDING`, `CONFIRMED`, `ASSIGNED_PICKUP`, `PICKED_UP`, `PICKUP_FAILED`, `CONVERTED_TO_WAYBILL`, `CANCELLED`.
- Bộ lọc: ngày tạo, khách hàng, hub, shipper, keyword.
- Bảng danh sách:
  - `request_code`
  - `status`
  - `customer_code/customer_name`
  - `contact_phone`
  - `pickup_address`
  - `pickup_time_from/to`
  - `est_quantity`
  - `est_weight`
  - `priority`
  - `assigned_shipper_name`
  - SLA/cảnh báo trễ nếu có.
- Drawer/detail:
  - Toàn bộ thông tin request.
  - Log xử lý.
  - Nút `Xác nhận`, `Điều phối`, `Hủy`, `Tạo vận đơn`.

API gọi:

- `GET /api/delivery/pickup-requests?...`
- `GET /api/delivery/pickup-requests/{code}`
- `POST /api/delivery/pickup-requests/{code}/confirm`

### 4.3. Màn hình điều phối shipper pickup

Route đề xuất:

- `/admin/delivery/pickup-dispatch`

Không nên dùng chung `AssignShipper.vue` hiện tại, vì màn hình đó là giao hàng cuối tuyến. Nên tạo màn hình mới, ví dụ:

- `frontend/src/views/admin/delivery/PickupDispatch.vue`

UI cần có 3 vùng:

1. Danh sách pickup đã xác nhận/chờ điều phối.
2. Chi tiết pickup đang chọn, hiển thị địa chỉ và tọa độ.
3. Danh sách shipper:
   - Tab `Gợi ý gần nhất`.
   - Tab `Tất cả shipper trong hub`.
   - Hiển thị khoảng cách, trạng thái online, lần cập nhật GPS, số task đang giữ.

API gọi:

- `GET /api/delivery/pickup-requests?status=CONFIRMED`
- `GET /api/delivery/pickup-requests/{code}/nearest-shippers?radius_km=3&limit=5`
- `GET /api/users/shippers?hub_id=1`
- `POST /api/delivery/pickup-requests/{code}/assign`

Payload assign:

```json
{
  "shipper_id": 20,
  "assignment_note": "Ưu tiên lấy trước 10h",
  "expected_pickup_at": "2026-05-27T10:00:00+07:00"
}
```

Điều kiện UI:

- Nếu request chưa có tọa độ, vẫn cho assign thủ công nhưng ẩn tab “gợi ý gần nhất” hoặc báo “Chưa có tọa độ”.
- Nếu không có shipper online trong 3km, cho mở rộng bán kính 5km/10km.
- Nếu shipper đang `BUSY`, vẫn có thể hiển thị nhưng cần cảnh báo tải công việc.

### 4.4. Màn hình tạo vận đơn từ pickup

Có thể mở từ detail pickup request bằng nút `Tạo vận đơn`.

Frontend cần prefill:

- Sender từ customer/pickup:
  - `sender_name`
  - `sender_phone`
  - `sender_address`
- Receiver do CSKH nhập.
- Weight từ `actual_weight` nếu shipper đã cập nhật, fallback `est_weight`.
- `request_code` chỉ hiển thị.
- `request_id` gửi backend nếu dùng `POST /api/waybills`, hoặc không cần nếu dùng endpoint riêng `create-waybill`.

Flow UI bắt buộc:

1. Nhập thông tin người nhận và hàng hóa.
2. Gọi `GET /api/pricing/customers/{customer_id}/policy`.
3. Nếu chưa có policy riêng:
   - Hiển thị cảnh báo: “Khách chưa có bảng giá riêng, hệ thống sẽ dùng bảng giá mặc định” hoặc “Cần tạo bảng giá trước khi tạo vận đơn” tùy cấu hình.
   - Cho nút `Tạo bảng giá`.
4. Gọi `POST /api/pricing/calculate`.
5. Hiển thị breakdown cước.
6. Chỉ cho bấm `Tạo vận đơn` khi có `shipping_fee > 0`.
7. Gọi `POST /api/delivery/pickup-requests/{code}/create-waybill`.

### 4.5. UI tạo bảng giá khi khách chưa có

Có 2 hướng:

#### Hướng MVP

- Nếu khách chưa có bảng giá riêng, dùng policy mặc định `policy_id = 1`.
- Khi `POST /api/pricing/calculate` trả 404 thì chặn tạo vận đơn và yêu cầu kế toán/admin cấu hình rule.

#### Hướng đầy đủ

Frontend mở modal “Tạo bảng giá cho khách”:

- `policy_code`
- `policy_name`
- `copy_from_policy_id`
- `valid_from`
- `valid_to`
- `is_approved`

Sau khi tạo policy, cho thêm rule hoặc copy rule từ policy mặc định.

API gọi:

- `GET /api/pricing/customers/{customer_id}/policy`
- `POST /api/pricing/customers/{customer_id}/policy`
- `POST /api/pricing/policies/{policy_id}/rules/bulk`

## 5. Điều chỉnh API hiện có để tránh lệch nghiệp vụ

### `POST /api/delivery/pickup-requests`

Hiện quyền chỉ cho role `1,2,3`. Cần quyết định:

- Nếu dùng cho CSKH tạo hộ: giữ role `1,2,3`, đổi default `source = CSKH`, status nên là `PENDING` hoặc `CONFIRMED`.
- Nếu dùng cho customer portal: thêm quyền customer hoặc tạo endpoint riêng `/api/customer/pickup-requests`.

### `GET /api/delivery/pickup-requests`

Hiện trả list trực tiếp, chưa pagination. Nên đổi sang:

```json
{
  "items": [],
  "total": 0,
  "page": 1,
  "size": 20
}
```

Nếu sợ ảnh hưởng frontend cũ, có thể tạo endpoint mới:

- `GET /api/delivery/pickup-requests/search`

### `POST /api/delivery/pickup-requests/{code}/assign`

Hiện schema chỉ có `shipper_id`. Nên thêm:

- `assignment_note`
- `expected_pickup_at`

Và validate hub/khu vực.

### `POST /api/pricing/calculate`

Hiện đã đủ lõi tính giá, nhưng cần response lỗi có code rõ hơn:

```json
{
  "error_code": "PRICING_RULE_NOT_FOUND",
  "message": "Chưa có bảng giá cho tuyến 79→1 (STANDARD).",
  "origin_province_id": 79,
  "dest_province_id": 1,
  "service_type": "STANDARD",
  "customer_id": 12,
  "policy_id": 5
}
```

Frontend sẽ dựa vào `error_code` để mở modal tạo bảng giá.

## 6. Checklist triển khai theo thứ tự ưu tiên

### Phase 1 - Hoàn thiện pickup cơ bản

- Backend: bổ sung field còn thiếu cho `booking_requests`.
- Backend: đổi trạng thái mặc định từ `WAIT_PICKUP` sang `PENDING` hoặc map thống nhất.
- Backend: thêm API confirm pickup.
- Backend: thêm pagination/filter cho pickup list.
- Frontend: tạo màn hình `PickupRequestList.vue` cho CSKH.
- Frontend: tạo form `PickupCreate.vue` cho CSKH/customer.

### Phase 2 - Điều phối pickup

- Backend: thêm bảng `shipper_locations`.
- Backend: thêm API shipper update location.
- Backend: thêm API nearest shippers.
- Backend: mở rộng assign pickup.
- Frontend: tạo `PickupDispatch.vue`.
- Frontend: hiển thị gợi ý shipper gần nhất, khoảng cách, trạng thái online.

### Phase 3 - Tạo vận đơn từ pickup và tính cước

- Backend: thêm API check/create customer policy.
- Backend: thêm API tạo waybill từ pickup request.
- Backend: đảm bảo `request_id` được lưu vào `waybills`.
- Frontend: mở workflow tạo vận đơn từ detail pickup.
- Frontend: gọi tính cước trước khi tạo vận đơn.
- Frontend: xử lý case chưa có bảng giá/rule.

### Phase 4 - Tối ưu production

- Backend: cân nhắc PostGIS nếu số lượng shipper online lớn.
- Backend: thêm thống kê tải shipper theo pickup/delivery đang active.
- Frontend: bản đồ pickup và shipper.
- Frontend: cảnh báo SLA pickup trễ.

## 7. Mapping file cần tác động

Backend:

- `backend/models.py`
- `backend/schemas/delivery.py`
- `backend/crud/delivery.py`
- `backend/api/delivery.py`
- `backend/schemas/pricing.py`
- `backend/crud/pricing.py`
- `backend/api/pricing.py`
- Thêm migration Alembic trong `backend/alembic/versions`

Frontend:

- `frontend/src/router/index.js`
- Thêm `frontend/src/views/admin/pickup/PickupCreate.vue`
- Thêm `frontend/src/views/admin/cskh/PickupRequestList.vue`
- Thêm `frontend/src/views/admin/delivery/PickupDispatch.vue`
- Cập nhật `frontend/src/views/admin/waybills/CreateWaybill.vue` để nhận `request_code/request_id` và prefill từ pickup.
- Cập nhật menu trong `frontend/src/layouts/MainLayout.vue` nếu menu đang khai báo tại đó.

## 8. Ghi chú về thuật toán shipper gần nhất

Theo phân tích hiện tại, MVP chưa cần PostGIS/Redis GEO. Với dưới 500 shipper online:

1. Shipper gửi GPS định kỳ.
2. Backend lưu vào `shipper_locations`.
3. Khi điều phối pickup, backend lấy shipper `AVAILABLE`, location còn mới trong 2 phút.
4. Dùng Haversine tính khoảng cách.
5. Trả 5 shipper gần nhất trong bán kính 3km.

Pseudo logic:

```python
available = query_shipper_locations(
    status="AVAILABLE",
    updated_after=now - timedelta(minutes=2),
    hub_id=request.target_hub_id,
)

nearest = sorted(
    available,
    key=lambda s: haversine(
        request.pickup_lat,
        request.pickup_lng,
        s.latitude,
        s.longitude,
    )
)[:5]
```

Khi hệ thống có 1000+ shipper online hoặc tần suất đơn cao, chuyển sang PostGIS với spatial index và query `ST_DWithin`/`ORDER BY location <-> customer_location`.

