# ⚡ Speedlight Logistics — Mobile App

> Ứng dụng di động quản lý vận hành giao nhận vận chuyển cho hệ thống **Speedlight Logistics**.  
> Xây dựng trên nền tảng **React Native + Expo SDK 54**, kết nối Backend **FastAPI** qua REST API.

---

## 📋 Mục lục

- [Giới thiệu](#-giới-thiệu)
- [Tính năng chính](#-tính-năng-chính)
- [Yêu cầu hệ thống](#-yêu-cầu-hệ-thống)
- [Hướng dẫn cài đặt](#-hướng-dẫn-cài-đặt)
- [Hướng dẫn chạy dự án](#-hướng-dẫn-chạy-dự-án)
- [Kiến trúc hệ thống](#-kiến-trúc-hệ-thống)
- [Phân quyền vai trò (RBAC)](#-phân-quyền-vai-trò-rbac)
- [Cấu trúc thư mục](#-cấu-trúc-thư-mục)
- [Luồng dữ liệu](#-luồng-dữ-liệu)
- [Lưu ý quan trọng](#-lưu-ý-quan-trọng)
- [Tính năng đang phát triển (WIP)](#-tính-năng-đang-phát-triển-wip)

---

## 🚀 Giới thiệu

**Speedlight Logistics App** là ứng dụng mobile dành cho nhân viên vận hành hệ thống giao nhận. Ứng dụng hỗ trợ toàn bộ luồng nghiệp vụ:

- 📷 **Quét vận đơn** bằng Camera (OCR + Barcode/QR)
- 📦 **Quản lý kho**: Nhập kho, đóng túi, bốc/dỡ hàng manifest
- 🚚 **Giao hàng**: Nhận nhiệm vụ, cập nhật trạng thái, chụp ảnh POD
- 💰 **Kế toán**: Thu tiền COD, chốt ca, đối soát cửa hàng
- 🛠️ **Quản trị**: Quản lý nhân sự, bảng giá, bưu cục, audit log
- 📍 **GPS Tracking**: Theo dõi vị trí nhân viên real-time (foreground + background)

---

## ✨ Tính năng chính

### Nghiệp vụ cốt lõi
| Tính năng | Mô tả |
|---|---|
| Tạo vận đơn (Waybill) | Quét ảnh OCR hoặc nhập tay, tự động tính phí |
| Quản lý vận đơn | Tìm kiếm, sửa, huỷ, xuất Excel, in vận đơn |
| Quét nhập kho (Scan In-Hub) | Quét barcode nhập hàng vào kho, cập nhật cân nặng |
| Đóng túi hàng (Bagging) | Gom nhiều vận đơn vào 1 túi vận chuyển |
| Manifest Load/Unload | Bốc hàng lên xe / dỡ hàng khỏi xe theo manifest |
| Danh sách nhiệm vụ giao | Shipper xem và nhận nhiệm vụ giao hàng |
| Cập nhật trạng thái đơn | Giao thành công / thất bại, kèm lý do |
| Chụp ảnh POD | Bằng chứng giao hàng (Proof of Delivery) |
| Thu tiền COD | Xác nhận tiền mặt thu được từ shipper |
| Đối soát cửa hàng | Tạo bảng kê, xuất file đối soát |
| Bảng giá vận chuyển | CRUD quy tắc giá + phụ phí dịch vụ |

### Tính năng kỹ thuật
| Tính năng | Mô tả |
|---|---|
| RBAC (Role-Based Access Control) | 6 vai trò với quyền truy cập khác nhau |
| GPS Background Tracking | Theo dõi vị trí mỗi 15s cả khi app ở nền |
| LocationGuard | Gate chặn UI nếu GPS tắt hoặc chưa cấp quyền |
| JWT Authentication | Đăng nhập JWT + persist session qua AsyncStorage |
| Universal Scanner | Component quét QR/Barcode tái sử dụng |
| Offline Detection | Kiểm tra kết nối mạng trước khi gọi API |
| Export Excel | Xuất danh sách vận đơn ra file .xlsx |

---

## 📦 Yêu cầu hệ thống

| Công cụ | Phiên bản tối thiểu |
|---|---|
| Node.js | >= 18.x |
| npm | >= 9.x |
| Expo CLI | (cài qua `npx expo`) |
| Android Studio | (cho build APK/AAB) |
| Xcode | >= 15 (cho iOS, macOS only) |
| Backend FastAPI | Đang chạy và accessible |

---

## 🔧 Hướng dẫn cài đặt

### 1. Clone repository

```bash
git clone https://github.com/Hi3nNguy3n/SpeedlightApp_fn.git
cd SpeedlightApp_fn
```

### 2. Cài đặt thư viện

```bash
npm install
```

### 3. Cấu hình biến môi trường

Sao chép file mẫu và điền giá trị thực tế:

```bash
cp .env.example .env
```

Mở file `.env` và cập nhật:

```env
# URL Backend API (FastAPI server)
EXPO_PUBLIC_API_BASE_URL=http://<server-ip>:<port>

# URL dịch vụ theo dõi vị trí GPS
EXPO_PUBLIC_LOCATION_URL=https://<your-location-tracking-url>

# URL dịch vụ OCR quét vận đơn
EXPO_PUBLIC_OCR_URL=https://<your-ocr-service-url>
```

> ⚠️ **KHÔNG commit file `.env` lên Git!** File này đã được thêm vào `.gitignore`.

### 4. Build native (nếu cần background location/camera)

```bash
npx expo prebuild
npx expo run:android    # Hoặc
npx expo run:ios
```

> **Lưu ý:** Background location tracking và một số native features **không hoạt động** trên Expo Go. Cần build development client.

---

## ▶️ Hướng dẫn chạy dự án

### Chạy trên Expo Go (development)

```bash
npx expo start
```

Sau đó quét QR code bằng Expo Go app trên điện thoại.

### Chạy trên Android emulator

```bash
npx expo run:android
```

### Chạy trên iOS simulator (macOS)

```bash
npx expo run:ios
```

### Build APK/AAB (production)

```bash
eas build --platform android --profile production
```

---

## 🏗️ Kiến trúc hệ thống

### Technology Stack

| Layer | Công nghệ |
|---|---|
| UI Framework | React Native 0.81.5 |
| Build Tool | Expo SDK ~54 |
| Navigation | @react-navigation/stack v7 |
| State Management | React Context API |
| Auth | JWT (jwt-decode) + AsyncStorage |
| HTTP Client | fetch API (custom apiClient wrapper) |
| Camera | expo-camera (CameraView) |
| Location | expo-location + expo-task-manager |
| Styling | React Native StyleSheet (tách riêng per screen) |

### Luồng dữ liệu chính

```
┌──────────────┐    ┌────────────────────┐    ┌──────────────────┐
│  Screen UI   │───►│  Service Layer     │───►│  FastAPI Backend │
│ (30 screens) │    │  (15 services)     │    │  (REST API)      │
└──────┬───────┘    └────────────────────┘    └──────────────────┘
       │                                              │
       ▼                                              │
┌──────────────┐                                      │
│  Context     │◄─────────────────────────────────────┘
│  (UserCtx,   │   JWT token, user data response
│   QueueCtx)  │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ AsyncStorage │  Persist user session locally
└──────────────┘
```

**Luồng Auth đăng nhập:**
1. `LoginScreen` → `authService.loginUser(username, password)`
2. Backend trả JWT access_token + user info
3. `UserContext.login(payload)` → decode JWT → normalize → persist → set state
4. `App.js` đọc `user.isAuthenticated` → `getRoleKey(user)` → chọn `initialRoute` + filter routes

**Luồng Camera OCR:**
1. `HomeScreen` mở camera → chụp ảnh → crop vùng scan frame
2. `QueueContext.addToQueue(uri)` → gửi ảnh đến OCR service
3. OCR trả về data (sender, receiver, tracking) → Navigate `CreateWaybillScreen`

**Luồng GPS Tracking:**
1. `LocationGuard` kiểm tra GPS + permissions khi app khởi động
2. Foreground: polling `getCurrentPositionAsync()` mỗi 15 giây
3. Background: `expo-task-manager` task gửi coords mỗi 15s/15m
4. Data gửi lên `EXPO_PUBLIC_LOCATION_URL` kèm user info + JWT token

---

## 🔐 Phân quyền vai trò (RBAC)

Hệ thống sử dụng **Role-Based Access Control** với 6 nhóm vai trò, khớp với Backend:

| Role ID | Key | Tên | Màn hình khởi đầu | Quyền truy cập |
|---|---|---|---|---|
| 1 | `admin` | Quản trị viên hệ thống | Home | **Toàn quyền** — tất cả 26 routes |
| 2 | `hub_manager` | Quản lý kho vận | WarehouseMenu | Vận đơn, kho, phân công shipper, đối soát, bưu cục |
| 3 | `warehouse` | Nhân viên kho | WarehouseMenu | Scan nhập kho, đóng túi, manifest, dashboard kho |
| 4 | `shipper` | Người giao hàng | TaskList | Nhiệm vụ giao, scan task, cập nhật trạng thái, chụp POD |
| 5 | `accountant` | Kế toán | AccountantMenu | Thu tiền COD, chốt ca, đối soát, dashboard tài chính |
| — | `sales` | Kinh doanh | Home | Xem đơn hàng, đối soát, báo cáo (hạn chế) |

Mỗi route trong navigator được **guard** bởi `allowedRoutes.includes('RouteName')`, đảm bảo người dùng không thể truy cập màn hình ngoài phạm vi vai trò.

---

## 📂 Cấu trúc thư mục

```
src/
├── components/                 # Shared reusable components
│   ├── LocationGuard.js        #   Gate GPS permissions + foreground polling
│   └── UniversalScanner.js     #   Camera QR/Barcode scanner
│
├── constants/                  # App-wide constants
│   ├── colors.js               #   Centralized color palette (40+ tokens)
│   └── data.js                 #   API endpoints & configuration
│
├── context/                    # React Context state management
│   ├── UserContext.js           #   Auth state, JWT, persist, RBAC
│   └── QueueContext.js          #   OCR image processing queue
│
├── screens/                    # 30 screen components
│   ├── LoginScreen.js           #   Đăng nhập
│   ├── HomeScreen.js            #   Trang chủ + Camera OCR
│   ├── CreateWaybillScreen.js   #   Tạo vận đơn (form đầy đủ)
│   ├── WaybillListScreen.js     #   Danh sách & tìm kiếm vận đơn
│   ├── ScanInHubScreen.js       #   Quét nhập kho
│   ├── ScanBaggingScreen.js     #   Đóng túi hàng
│   ├── TaskListScreen.js        #   Danh sách nhiệm vụ giao hàng
│   ├── CashConfirmScreen.js     #   Thu tiền COD / chốt ca
│   ├── AdminOperationsScreen.js #   Quản trị hệ thống
│   └── ... (21 screens khác)
│
├── services/                   # API service layer
│   ├── apiClient.js             #   HTTP client (fetch wrapper)
│   ├── authService.js           #   Đăng nhập / Đăng ký
│   ├── waybillService.js        #   CRUD vận đơn
│   ├── warehouseService.js      #   Nghiệp vụ kho
│   ├── deliveryService.js       #   Nghiệp vụ giao hàng
│   ├── accountingService.js     #   Kế toán / COD
│   ├── pricingService.js        #   Bảng giá vận chuyển
│   ├── locationService.js       #   GPS tracking (background task)
│   └── ... (7 services khác)
│
├── styles/                     # StyleSheet files (1:1 với screens)
│   ├── HomeStyles.js
│   ├── LoginStyles.js
│   └── ... (28 files khác)
│
└── utils/                      # Utility functions
    ├── roleUtils.js             #   RBAC engine (roles, menus, guards)
    └── networkUtils.js          #   Network connectivity check
```

---

## 🔄 Luồng dữ liệu

### Authentication Flow

```
User nhập username/password
        │
        ▼
LoginScreen ──► authService.loginUser()
                    │
                    ▼
              POST /api/auth/login
                    │
                    ▼
           Backend trả JWT token + user info
                    │
                    ▼
         UserContext.login(payload)
          ├── normalizeUser() — decode JWT, map fields
          ├── setUserState() — cập nhật React state
          └── persistUser() — lưu AsyncStorage
                    │
                    ▼
          App.js re-render
          ├── getRoleKey(user) → xác định vai trò
          ├── initialRoute → chuyển hướng theo vai trò
          └── Route guards → lọc màn hình cho phép
```

### Warehouse Scan Flow

```
WarehouseMenu → ScanInHub → UniversalScanner
                                │
                                ▼ (quét barcode)
                    warehouseService.scanInHub(token, code)
                                │
                                ▼
                    POST /api/scans/in-hub
                                │
                                ▼
                    Cập nhật weight (nếu cần)
                                │
                                ▼
                    ProcessedList (danh sách đã xử lý)
```

---

## ⚠️ Lưu ý quan trọng

### Bắt buộc khi chạy dự án

1. **Backend FastAPI phải đang chạy** và URL được cấu hình đúng trong `.env`
2. **Không dùng Expo Go** cho tính năng GPS background tracking — cần build development client (`npx expo run:android`)
3. **Cấp quyền vị trí "Luôn luôn" (Always)** — ứng dụng sẽ chặn UI nếu không cấp
4. **Cấp quyền Camera** — cần cho quét barcode/QR và chụp ảnh OCR/POD

### Biến môi trường

| Biến | Bắt buộc | Mô tả |
|---|---|---|
| `EXPO_PUBLIC_API_BASE_URL` | ✅ | URL Backend FastAPI (ví dụ: `http://192.168.1.100:8000`) |
| `EXPO_PUBLIC_LOCATION_URL` | ✅ | URL dịch vụ GPS tracking |
| `EXPO_PUBLIC_OCR_URL` | ⬚ | URL dịch vụ OCR (không bắt buộc, fallback `/upload/pod`) |

### Rủi ro đã biết

| # | Mức độ | Vấn đề |
|---|---|---|
| 1 | ⚠️ | Dependencies thừa: `i` và `npm` trong `package.json` có thể là lỗi cài nhầm |
| 2 | ⚠️ | `shipmentService.js` gọi `submitShipment(payload)` không truyền token — lỗi auth tiềm ẩn |
| 3 | ℹ️ | 4 endpoint aliases tạm (`REGISTER`, `EXTRACT`, `SUBMIT`, `GET_SHIPMENT`) sẽ được xóa sau migration |
| 4 | ℹ️ | `exportExcelService` phụ thuộc `buffer` package nhưng chưa khai báo trong `package.json` |

---

## 🔨 Tính năng đang phát triển (WIP)

| Tính năng | Trạng thái | Ghi chú |
|---|---|---|
| `CreateOrderScreen.js` | 🔴 Chưa kết nối | File tồn tại nhưng không được route trong `App.js`. Có thể là phiên bản cũ |
| Role `sales` (ID 6?) | 🟡 Chưa hoàn thiện | Có route group nhưng thiếu mapping `role_id` trong `getRoleKey()` |
| Migration endpoint aliases | 🟡 Đang chờ | 4 aliases trong `data.js` đánh dấu "will be removed" |
| `shipmentService.js` | 🟡 Legacy | Service cũ, cần chuyển sang dùng `waybillService` |

---

## 📄 License

Private — Speedlight Logistics © 2026
