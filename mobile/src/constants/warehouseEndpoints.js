export const WAREHOUSE_API_URL = process.env.EXPO_PUBLIC_WAREHOUSE_API_URL || 'https://warehouse.speedlight.com.vn';
export const LOGISTICS_API_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'https://speedlight.minhhien.click';

export const WAREHOUSE_ENDPOINTS = {
  // Authentication
  EMPLOYEE_LOGIN: `${WAREHOUSE_API_URL}/api/auth/login`,
  GET_PROFILE_EMPLOYEE: `${WAREHOUSE_API_URL}/api/users/me`,
  CHANGE_PASSWORD: `${WAREHOUSE_API_URL}/api/auth/change-password`,

  // VIP
  VIP_IMPORT_NEW: `${WAREHOUSE_API_URL}/api/warehouse/vip/import-new`,
  VIP_EXPORT_NEW: `${WAREHOUSE_API_URL}/api/warehouse/vip/export-new`,
  VIP_IMPORT_OLD: `${WAREHOUSE_API_URL}/api/warehouse/vip/import-old`,
  VIP_EXPORT_OLD: `${WAREHOUSE_API_URL}/api/warehouse/vip/export-old`,
  GET_VIP_AVAILABLE_EXPORT_NEW: (maKho) =>
    `${WAREHOUSE_API_URL}/api/warehouse/vip/available-export-new?ma_kho_spl=${maKho}`,
  GET_VIP_AVAILABLE_IMPORT_OLD: () =>
    `${WAREHOUSE_API_URL}/api/warehouse/vip/available-import-old`,
  GET_VIP_AVAILABLE_EXPORT_OLD: (maKho) =>
    `${WAREHOUSE_API_URL}/api/warehouse/vip/available-export-old?ma_kho_spl=${maKho}`,

  // THUONG
  THUONG_IMPORT: `${WAREHOUSE_API_URL}/api/warehouse/thuong/import`,
  THUONG_EXPORT: `${WAREHOUSE_API_URL}/api/warehouse/thuong/export`,
  GET_THUONG_AVAILABLE: (customerId, maKho) =>
    `${WAREHOUSE_API_URL}/api/warehouse/thuong/available?customer_id=${customerId}&ma_kho_spl=${maKho || ""}`,

  // LE
  LE_IMPORT: `${WAREHOUSE_API_URL}/api/warehouse/le/import`,
  LE_EXPORT: `${WAREHOUSE_API_URL}/api/warehouse/le/export`,
  GET_LE_AVAILABLE: (customerId, maKho) =>
    `${WAREHOUSE_API_URL}/api/warehouse/le/available?customer_id=${customerId}&ma_kho_spl=${maKho || ""}`,

  // Others
  GET_CUSTOMERS: (skip = 0, limit = 100, search = "") =>
    `${WAREHOUSE_API_URL}/api/customers?skip=${skip}&limit=${limit}&search=${encodeURIComponent(search)}`,
  GET_SHIPPERS: `${WAREHOUSE_API_URL}/api/shippers`,
  CREATE_PICKUP_BAG: `${WAREHOUSE_API_URL}/api/scans/pickup-bags`,
  GET_PICKUP_BAGS: `${WAREHOUSE_API_URL}/api/scans/pickup-bags`,
  GET_PICKUP_BAG_DETAIL: (bagCode) => `${WAREHOUSE_API_URL}/api/scans/pickup-bags/${bagCode}`,
  CLOSE_PICKUP_BAG: (bagCode) => `${WAREHOUSE_API_URL}/api/scans/pickup-bags/${bagCode}/close`,
  GET_LOCATIONS: `${WAREHOUSE_API_URL}/api/vi-tri-kho`,
  GET_MA_MAY: (maSanPham) =>
    `${WAREHOUSE_API_URL}/api/products/by-code/${maSanPham}`,
  GET_VEHICLES: `${WAREHOUSE_API_URL}/api/vehicles`,
  FLEET_ASSIGN: `${WAREHOUSE_API_URL}/api/fleet/assign`,
  FLEET_RETURN: `${WAREHOUSE_API_URL}/api/fleet/return`,
  
  // URL only, moving apiClient call to caller
  UPDATE_PUSH_TOKEN_URL: `${WAREHOUSE_API_URL}/api/users/update-push-token`,
  GET_UNREAD_NOTIFICATIONS: `${WAREHOUSE_API_URL}/api/notifications/unread`,
  
  CREATE_NOI_BO_EXPORT_URL: `${WAREHOUSE_API_URL}/api/warehouse/noi-bo/export`,
  SCAN_VIP_SERIAL_URL: (serial) => `${WAREHOUSE_API_URL}/api/warehouse/vip/scan?serial=${serial}`,
  GET_PENDING_NOI_BO_URL: `${WAREHOUSE_API_URL}/api/warehouse/noi-bo/pending`,
  ACTION_NOI_BO_URL: (id) => `${WAREHOUSE_API_URL}/api/warehouse/noi-bo/${id}/action`,

  // Mobile OCR on logistics backend
  OCR_CUSTOMERS: `${LOGISTICS_API_URL}/api/waybills/mobile/ocr/customers`,
  OCR_CUSTOMER_PICKUPS: (customerId) => `${LOGISTICS_API_URL}/api/waybills/mobile/ocr/customers/${customerId}/pickups`,
  OCR_BAG_WAYBILLS: (bagCode) => `${LOGISTICS_API_URL}/api/waybills/mobile/ocr/bags/${bagCode}/waybills`,
  OCR_UPDATE_WAYBILL: (waybillCode) => `${LOGISTICS_API_URL}/api/waybills/mobile/ocr/waybills/${waybillCode}`,
  OCR_EXTRA_WAYBILLS: (bagCode) => `${LOGISTICS_API_URL}/api/waybills/mobile/ocr/bags/${bagCode}/extra-waybills`,
};
