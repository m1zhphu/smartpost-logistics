// ============================================================
// PHÂN QUYỀN THEO VAI TRÒ (RBAC) - SpeedlightApp_fn
// Khớp với cấu hình phân quyền Backend (core/security.py)
// Role 1: SUPER_ADMIN  | Role 2: HUB_MANAGER
// Role 3: WAREHOUSE_STAFF | Role 4: SHIPPER | Role 5: ACCOUNTANT
// ============================================================

export const roleRouteGroups = {
  // ROLE 1 — Quản trị viên: Toàn quyền truy cập mọi chức năng
  admin: [
    "Home",
    "Profile",
    "CreateWaybill",
    "Success",
    "OrderDetail",
    "ProcessedList",
    "ScanBagging",
    "ScanInHub",
    "ScanManifestLoad",
    "ScanManifestUnload",
    "ScanTask",
    "HubManagement",
    "ShopStatement",
    "AdminOperations",
    "StaffManagement",
    "UpdateStatus",
    "WaybillList",
    "PricingRules",
    "AssignShipper",
    "CashConfirm",
    "AccountingDashboard",
    "WarehouseDashboard",
    "WarehouseMenu",
    "AccountantMenu",
    "CameraPOD",
    "TaskList",
    "TaskDetail",
  ],

  // ROLE 2 — Quản lý kho (HUB_MANAGER):
  // Quản lý cửa hàng được chỉ định (lọc theo primary_hub_id),
  // điều phối kho, phân công shipper, xem báo cáo bưu cục
  hub_manager: [
    "Home",
    "Profile",
    "WaybillList",
    "ProcessedList",
    "CreateWaybill",
    "Success",
    "OrderDetail",
    "ScanInHub",
    "ScanBagging",
    "ScanManifestLoad",
    "ScanManifestUnload",
    "AssignShipper",
    "WarehouseDashboard",
    "WarehouseMenu",
    "HubManagement",
    "ShopStatement",
    "CameraPOD",
  ],

  // ROLE 3 — Kho hàng (WAREHOUSE_STAFF):
  // Chỉ thực hiện nhiệm vụ trong kho: quét nhập kho, đóng gói, tải/gỡ manifest
  warehouse: [
    "Home",
    "Profile",
    "ProcessedList",
    "CreateWaybill",
    "Success",
    "ScanInHub",
    "ScanBagging",
    "ScanManifestLoad",
    "ScanManifestUnload",
    "WaybillList",
    "WarehouseDashboard",
    "WarehouseMenu",
    "CameraPOD",
  ],

  // ROLE 4 — Người giao hàng (SHIPPER):
  // Nhận đơn, giao hàng, chụp POD, thu tiền COD và nộp tổng COD trong ngày
  shipper: [
    "Home",
    "Profile",
    "ProcessedList",
    "CreateWaybill",
    "Success",
    "ScanTask",
    "TaskList",
    "TaskDetail",
    "UpdateStatus",
    "CameraPOD",
  ],

  // ROLE 5 — Kế toán (ACCOUNTANT):
  // Thu tiền từ shipper, chốt ca, đóng quỹ, đối soát sổ cái, xem báo cáo tài chính
  accountant: [
    "Home",
    "Profile",
    "ProcessedList",
    "CreateWaybill",
    "Success",
    "ShopStatement",
    "CashConfirm",
    "AccountingDashboard",
    "AccountantMenu",
    "WaybillList",
    "CameraPOD",
  ],

  // ROLE 6 — Kinh doanh (SALES): Xem báo cáo, tra cứu đơn hàng
  sales: [
    "Home",
    "Profile",
    "ProcessedList",
    "CreateWaybill",
    "Success",
    "ShopStatement",
    "WaybillList",
    "CameraPOD",
  ],

  // Mặc định: Người dùng chưa xác định vai trò
  default: [
    "Home",
    "Profile",
    "ProcessedList",
    "CreateWaybill",
    "Success",
    "CameraPOD",
  ],
};

// Ánh xạ thông tin người dùng sang khóa vai trò nội bộ.
// Ưu tiên role_id (số) để khớp chính xác với Backend.
export const getRoleKey = (user) => {
  const roleId = Number(user?.role_id ?? user?.roleId ?? 0);
  if (roleId === 1) return "admin";
  if (roleId === 2) return "hub_manager";
  if (roleId === 3) return "warehouse";
  if (roleId === 4) return "shipper";
  if (roleId === 5) return "accountant";

  // Fallback theo name nếu không có ID
  const normalizedRole = String(
    user?.role_name || user?.role || "",
  ).toUpperCase();
  if (normalizedRole === "SUPER_ADMIN") return "admin";
  if (normalizedRole === "HUB_MANAGER") return "hub_manager";
  if (normalizedRole === "WAREHOUSE_STAFF") return "warehouse";
  if (normalizedRole === "SHIPPER") return "shipper";
  if (normalizedRole === "ACCOUNTANT") return "accountant";

  return "default";
};

// Trả về nhãn vai trò hiển thị tiếng Việt
export const getRoleLabel = (user) => {
  const roleKey = getRoleKey(user);
  if (roleKey === "admin") return "Quản trị viên hệ thống";
  if (roleKey === "hub_manager") return "Quản lý kho vận";
  if (roleKey === "warehouse") return "Nhân viên kho";
  if (roleKey === "shipper") return "Người giao hàng";
  if (roleKey === "accountant") return "Kế toán";
  if (roleKey === "sales") return "Nhân viên kinh doanh";
  return "Người dùng chưa xác định";
};

// Danh sách toàn bộ mục menu của ứng dụng.
// Mỗi mục được lọc theo quyền hạn vai trò khi hiển thị.
const allMenuItems = [
  {
    route: "Profile",
    label: "Hồ sơ cá nhân",
    icon: "person-circle-outline",
    showInHome: false,
  },
  {
    route: "CreateWaybill",
    label: "Tạo vận đơn",
    icon: "document-text-outline",
  },
  {
    route: "ProcessedList",
    label: "Danh sách đã xử lý",
    icon: "list-outline",
    showInHome: false,
  },
  // --- NGHIỆP VỤ KHO ---
  { route: "ScanInHub", label: "Quét nhập kho", icon: "cube-outline" },
  { route: "ScanBagging", label: "Đóng túi hàng", icon: "archive-outline" },
  {
    route: "ScanManifestLoad",
    label: "Bốc hàng lên xe",
    icon: "cloud-upload-outline",
  },
  {
    route: "ScanManifestUnload",
    label: "Dỡ hàng khỏi xe",
    icon: "cloud-download-outline",
  },
  {
    route: "WarehouseDashboard",
    label: "Tổng quan kho",
    icon: "speedometer-outline",
  },
  {
    route: "WarehouseMenu",
    label: "Nghiệp vụ kho",
    icon: "grid-outline",
    showInHome: false,
  },
  // --- NGHIỆP VỤ GIAO HÀNG ---
  {
    route: "ScanTask",
    label: "Quét mã nhiệm vụ",
    icon: "qr-code-outline",
    showInHome: false,
  },
  {
    route: "TaskList",
    label: "Danh sách nhiệm vụ",
    icon: "list-circle-outline",
    showInHome: false,
  },
  {
    route: "UpdateStatus",
    label: "Cập nhật trạng thái đơn",
    icon: "refresh-circle-outline",
    showInHome: false,
  },
  {
    route: "CameraPOD",
    label: "Chụp ảnh xác nhận (POD)",
    icon: "camera-outline",
    showInHome: false,
  },
  // --- QUẢN LÝ BƯU CỤC ---
  {
    route: "AssignShipper",
    label: "Phân công người giao hàng",
    icon: "person-add-outline",
  },
  {
    route: "HubManagement",
    label: "Quản lý bưu cục",
    icon: "business-outline",
  },
  { route: "ShopStatement", label: "Đối soát cửa hàng", icon: "cash-outline" },
  {
    route: "WaybillList",
    label: "Danh sách vận đơn",
    icon: "clipboard-outline",
  },
  // --- KẾ TOÁN ---
  {
    route: "CashConfirm",
    label: "Chốt ca / Thu tiền COD",
    icon: "wallet-outline",
  },
  {
    route: "AccountingDashboard",
    label: "Tổng quan tài chính",
    icon: "stats-chart-outline",
    showInHome: false,
  },
  {
    route: "AccountantMenu",
    label: "Nghiệp vụ kế toán",
    icon: "pie-chart-outline",
    showInHome: false,
  },
  // --- QUẢN TRỊ VIÊN ---
  {
    route: "PricingRules",
    label: "Bảng giá vận chuyển",
    icon: "calculator-outline",
  },
  {
    route: "StaffManagement",
    label: "Quản lý nhân sự",
    icon: "people-circle-outline",
  },
  {
    route: "AdminOperations",
    label: "Quản trị hệ thống",
    icon: "build-outline",
  },
];

export const getHomeMenuItems = (user) => {
  const roleKey = getRoleKey(user);
  const allowedRoutes = roleRouteGroups[roleKey] || roleRouteGroups.default;
  return allMenuItems.filter(
    (item) => allowedRoutes.includes(item.route) && item.showInHome !== false,
  );
};

const bottomTabItemsByRole = {
  admin: [
    { route: "WaybillList", label: "Vận đơn", icon: "clipboard-outline" },
    { route: "PricingRules", label: "Bảng giá", icon: "calculator-outline" },
    { route: "AdminOperations", label: "Quản trị", icon: "build-outline" },
  ],
  hub_manager: [
    { route: "WaybillList", label: "Vận đơn", icon: "clipboard-outline" },
    { route: "AssignShipper", label: "Phân công", icon: "person-add-outline" },
    { route: "WarehouseDashboard", label: "Kho", icon: "speedometer-outline" },
  ],
  warehouse: [
    { route: "ScanInHub", label: "Nhập kho", icon: "cube-outline" },
    { route: "ScanBagging", label: "Đóng gói", icon: "archive-outline" },
    { route: "WarehouseDashboard", label: "Kho", icon: "speedometer-outline" },
  ],
  shipper: [
    { route: "TaskList", label: "Nhiệm vụ", icon: "list-circle-outline" },
    {
      route: "UpdateStatus",
      label: "Cập nhật",
      icon: "refresh-circle-outline",
    },
    { route: "CameraPOD", label: "Camera", icon: "camera-outline" },
  ],
  accountant: [
    {
      route: "AccountingDashboard",
      label: "Tài chính",
      icon: "stats-chart-outline",
    },
    { route: "CashConfirm", label: "COD", icon: "wallet-outline" },
    { route: "ShopStatement", label: "Đối soát", icon: "cash-outline" },
  ],
  sales: [
    { route: "WaybillList", label: "Vận đơn", icon: "clipboard-outline" },
    { route: "ShopStatement", label: "Đối soát", icon: "cash-outline" },
    { route: "CreateWaybill", label: "Tạo đơn", icon: "document-text-outline" },
  ],
  default: [
    { route: "CreateWaybill", label: "Tạo đơn", icon: "document-text-outline" },
    { route: "CameraPOD", label: "Camera", icon: "camera-outline" },
    { route: "Profile", label: "Tài khoản", icon: "person-circle-outline" },
  ],
};

export const getBottomTabItems = (user) => {
  const roleKey = getRoleKey(user);
  const allowedRoutes = roleRouteGroups[roleKey] || roleRouteGroups.default;
  const baseTabs = [
    { route: "Home", label: "Trang chủ", icon: "home-outline" },
  ];
  const candidateRoutes =
    bottomTabItemsByRole[roleKey] || bottomTabItemsByRole.default;
  const filtered = candidateRoutes.filter((item) =>
    allowedRoutes.includes(item.route),
  );
  const tabs = [...baseTabs, ...filtered];
  if (
    !tabs.some((item) => item.route === "Profile") &&
    allowedRoutes.includes("Profile")
  ) {
    tabs.push({
      route: "Profile",
      label: "Tài khoản",
      icon: "person-circle-outline",
    });
  }
  return tabs.slice(0, 4);
};

export const isRouteAllowed = (user, route) => {
  const roleKey = getRoleKey(user);
  const allowedRoutes = roleRouteGroups[roleKey] || roleRouteGroups.default;
  return allowedRoutes.includes(route);
};
