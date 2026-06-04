export const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'https://speedlight.minhhien.click';
export const WAREHOUSE_API_URL = process.env.EXPO_PUBLIC_WAREHOUSE_API_URL || 'https://warehouse.speedlight.com.vn';

export const ENDPOINTS = {
  // Authentication Login endpoints
  EMPLOYEE_LOGIN: `${WAREHOUSE_API_URL}/api/auth/login`,
  CUSTOMER_LOGIN: `${API_BASE_URL}/api/auth/login`,

  // Authentication Register endpoints
  REGISTER_OTP: `${API_BASE_URL}/api/auth/register/request-otp`,
  REGISTER_VERIFY: `${API_BASE_URL}/api/auth/register/verify`,
  REGISTER: `${API_BASE_URL}/register`,

  // Để tạm GET_PROFILE cũ để không lỗi các chỗ gọi mặc định,
  // nhưng tốt nhất là gọi theo Base URL tương ứng của User
  // Profile endpoints
  GET_PROFILE: `${WAREHOUSE_API_URL}/api/users/me`,
  GET_PROFILE_EMPLOYEE: `${WAREHOUSE_API_URL}/api/users/me`,
  GET_PROFILE_CUSTOMER: `${API_BASE_URL}/api/users/me`,

  // Legacy
  EXTRACT: `${API_BASE_URL}/extract`,
  SUBMIT: `${API_BASE_URL}/submit`,
  GET_SHIPMENT: (tracking_number) =>
    `${API_BASE_URL}/shipment/${tracking_number}`,

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

  THUONG_IMPORT: `${WAREHOUSE_API_URL}/api/warehouse/thuong/import`,
  THUONG_EXPORT: `${WAREHOUSE_API_URL}/api/warehouse/thuong/export`,
  GET_THUONG_AVAILABLE: (customerId, maKho) =>
    `${WAREHOUSE_API_URL}/api/warehouse/thuong/available?customer_id=${customerId}&ma_kho_spl=${maKho || ""}`,

  LE_IMPORT: `${WAREHOUSE_API_URL}/api/warehouse/le/import`,
  LE_EXPORT: `${WAREHOUSE_API_URL}/api/warehouse/le/export`,
  GET_LE_AVAILABLE: (customerId, maKho) =>
    `${WAREHOUSE_API_URL}/api/warehouse/le/available?customer_id=${customerId}&ma_kho_spl=${maKho || ""}`,

  GET_CUSTOMERS: (skip = 0, limit = 100, search = "") =>
    `${WAREHOUSE_API_URL}/api/customers?skip=${skip}&limit=${limit}&search=${encodeURIComponent(search)}`,
  GET_SHIPPERS: `${WAREHOUSE_API_URL}/api/shippers`,
  GET_LOCATIONS: `${WAREHOUSE_API_URL}/api/vi-tri-kho`,

  GET_MA_MAY: (maSanPham) =>
    `${WAREHOUSE_API_URL}/api/products/by-code/${maSanPham}`,

  GET_VEHICLES: `${WAREHOUSE_API_URL}/api/vehicles`,
  FLEET_ASSIGN: `${WAREHOUSE_API_URL}/api/fleet/assign`,
  // --- ENDPOINTS CỦA KHO (KHÔNG SỬA ĐỔI) ---
  UPDATE_PUSH_TOKEN: (token) =>
    apiClient.put(`${WAREHOUSE_API_URL}/api/users/update-push-token`, {
      token,
    }),
  GET_UNREAD_NOTIFICATIONS: `${WAREHOUSE_API_URL}/api/notifications/unread`,

  // --- ENDPOINTS BỔ SUNG CỦA FASTAPI BACKEND (KHÁCH HÀNG) ---
  CUSTOMER_REGISTER_PUSH_TOKEN: (token) =>
    apiClient.post(`${API_BASE_URL}/api/users/register-push-token`, {
      push_token: token,
    }),

  CREATE_NOI_BO_EXPORT: async (payload) =>
    apiClient.post(`${WAREHOUSE_API_URL}/api/warehouse/noi-bo/export`, payload),

  SCAN_VIP_SERIAL: (serial) =>
    apiClient.get(
      `${WAREHOUSE_API_URL}/api/warehouse/vip/scan?serial=${serial}`,
    ),

  GET_PENDING_NOI_BO: () =>
    apiClient.get(`${WAREHOUSE_API_URL}/api/warehouse/noi-bo/pending`),
  ACTION_NOI_BO: (id, payload) =>
    apiClient.post(
      `${WAREHOUSE_API_URL}/api/warehouse/noi-bo/${id}/action`,
      payload,
    ),
};
