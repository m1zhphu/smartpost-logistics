export const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'https://speedlight.minhhien.click';

export const ADMIN_ENDPOINTS = {
  // Authentication uses the same backend login API as Customer but for internal roles
  ADMIN_LOGIN: `${API_BASE_URL}/api/auth/login`,
  GET_PROFILE_ADMIN: `${API_BASE_URL}/api/auth/me`,
  
  // Shipper Mobile Endpoints
  GET_ASSIGNED_PICKUPS: `${API_BASE_URL}/api/delivery/mobile/shipper/pickup-requests?status=ASSIGNED_PICKUP`,
  GET_PICKUP_DETAIL: (requestCode) => `${API_BASE_URL}/api/delivery/mobile/shipper/pickup-requests/${requestCode}`,
  CONFIRM_PICKED: (requestCode) => `${API_BASE_URL}/api/delivery/pickup-requests/${requestCode}/picked`,
  SEND_GPS_LOCATION: `${API_BASE_URL}/api/delivery/mobile/shipper/location`,
  UPLOAD_PICKUP_IMAGE: `${API_BASE_URL}/api/upload/bill?is_pickup=true`,
  ADMIN_REGISTER_PUSH_TOKEN_URL: `${API_BASE_URL}/api/users/register-push-token`,
  
  // New API endpoints for Shipper OCR and Mock functions
  EXTRACT: process.env.EXPO_PUBLIC_EXTRACT_API_URL || 'https://speedlight.minhhien.click/extract',
  GET_AVAILABLE_PICKUPS: `${API_BASE_URL}/api/delivery/mobile/shipper/available-pickups`, // MOCK
  SELF_ASSIGN_PICKUP: `${API_BASE_URL}/api/delivery/mobile/shipper/self-assign`, // MOCK
  CREATE_BILL: `${API_BASE_URL}/api/delivery/mobile/shipper/create-bill`, // MOCK
  
  // Real APIs for Delivery
  GET_DELIVERY_TASKS: `${API_BASE_URL}/api/delivery/my-tasks`,
  CONFIRM_DELIVERY: `${API_BASE_URL}/api/delivery/confirm-success`,
  REPORT_FAILURE: `${API_BASE_URL}/api/delivery/report-failure`,
  TRACKING_TIMELINE: (code) => `${API_BASE_URL}/api/waybills/${code}/timeline`,
};
