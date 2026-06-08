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
};
