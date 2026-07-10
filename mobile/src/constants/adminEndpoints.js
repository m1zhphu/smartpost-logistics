export const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'https://speedlight.minhhien.click';

export const ADMIN_ENDPOINTS = {
  // Authentication uses the same backend login API as Customer but for internal roles
  ADMIN_LOGIN: `${API_BASE_URL}/api/auth/login`,
  GET_PROFILE_ADMIN: `${API_BASE_URL}/api/auth/me`,
  GET_HUBS: `${API_BASE_URL}/api/hubs`,
  GET_SHIPPERS: `${API_BASE_URL}/api/users/shippers`,
  
  // Shipper Mobile Endpoints
  GET_ASSIGNED_PICKUPS: `${API_BASE_URL}/api/delivery/mobile/shipper/pickup-requests?status=ASSIGNED_PICKUP`,
  GET_PICKED_PICKUPS: `${API_BASE_URL}/api/delivery/mobile/shipper/pickup-requests?status=PICKED`,
  GET_PICKUP_DETAIL: (requestCode) => `${API_BASE_URL}/api/delivery/mobile/shipper/pickup-requests/${requestCode}`,
  CONFIRM_PICKED: (requestCode) => `${API_BASE_URL}/api/delivery/pickup-requests/${requestCode}/picked`,
  SEND_GPS_LOCATION: `${API_BASE_URL}/api/delivery/mobile/shipper/location`,
  UPLOAD_PICKUP_IMAGE: `${API_BASE_URL}/api/upload/bill?is_pickup=true`,
  UPLOAD_PICKUP_IMAGE_BATCH: `${API_BASE_URL}/api/upload/bill/batch?is_pickup=true`,
  UPLOAD_BILL_IMAGE: `${API_BASE_URL}/api/upload/bill`,
  UPLOAD_POD_IMAGE: `${API_BASE_URL}/api/upload/pod`,
  UPLOAD_POD_IMAGE_BATCH: `${API_BASE_URL}/api/upload/pod/batch`,
  ADMIN_REGISTER_PUSH_TOKEN_URL: `${API_BASE_URL}/api/users/register-push-token`,
  TOGGLE_AVAILABILITY: `${API_BASE_URL}/api/delivery/mobile/shipper/availability`,
  
  // New API endpoints for Shipper OCR and Mock functions
  EXTRACT: process.env.EXPO_PUBLIC_EXTRACT_API_URL || 'https://speedlight.minhhien.click/extract',
  OCR_CUSTOMERS: `${API_BASE_URL}/api/waybills/mobile/ocr/customers`,
  OCR_CUSTOMER_PICKUPS: (customerId) => `${API_BASE_URL}/api/waybills/mobile/ocr/customers/${customerId}/pickups`,
  OCR_BAG_WAYBILLS: (bagCode) => `${API_BASE_URL}/api/waybills/mobile/ocr/bags/${bagCode}/waybills`,
  OCR_UPDATE_WAYBILL: (waybillCode) => `${API_BASE_URL}/api/waybills/mobile/ocr/waybills/${waybillCode}`,
  OCR_VERIFY_WAYBILL: (waybillCode) => `${API_BASE_URL}/api/waybills/${waybillCode}/verify`,
  OCR_EXTRA_WAYBILLS: (bagCode) => `${API_BASE_URL}/api/waybills/mobile/ocr/bags/${bagCode}/extra-waybills`,
  GET_AVAILABLE_PICKUPS: `${API_BASE_URL}/api/delivery/mobile/shipper/available-pickups`, // MOCK
  SELF_ASSIGN_PICKUP: `${API_BASE_URL}/api/delivery/mobile/shipper/self-assign`, // MOCK
  CREATE_BILL: `${API_BASE_URL}/api/delivery/mobile/shipper/create-bill`, // MOCK
  
  // Real APIs for Delivery
  GET_DELIVERY_TASKS: `${API_BASE_URL}/api/delivery/my-tasks`,
  CONFIRM_DELIVERY: `${API_BASE_URL}/api/delivery/confirm-success`,
  REPORT_FAILURE: `${API_BASE_URL}/api/delivery/report-failure`,
  RETRY_DELIVERY: `${API_BASE_URL}/api/delivery/retry-delivery`,  // Giao lại đơn thất bại
  TRACKING_TIMELINE: (code) => `${API_BASE_URL}/api/waybills/${code}/timeline`,

  // Internal pickup flow
  // Luồng mới online: PENDING_CONFIRMATION -> confirm-hub -> RECEIVED -> assign-shipper -> ASSIGNED_PICKUP -> picked -> PICKED
  GET_ONLINE_PICKUP_REQUESTS: `${API_BASE_URL}/api/delivery/online-pickup-requests`,
  CONFIRM_HUB: `${API_BASE_URL}/api/delivery/online-pickup-requests/confirm-hub`,        // Xác nhận văn phòng nhận (PENDING_CONFIRMATION → RECEIVED)
  GET_HUB_PICKUP_REQUESTS: `${API_BASE_URL}/api/delivery/hub-pickup-requests`,            // Lấy đơn RECEIVED tại hub để gán bưu tá
  ASSIGN_PICKUP_SHIPPER: (requestCode) => `${API_BASE_URL}/api/delivery/pickup-requests/${requestCode}/assign-shipper`, // Gán bưu tá (RECEIVED → ASSIGNED_PICKUP)

  // Luồng cũ offline (vẫn còn trên backend): PENDING_CONFIRMATION -> dispatch-hub -> DISPATCHED_TO_HUB -> hub accept/reject
  DISPATCH_HUB: `${API_BASE_URL}/api/delivery/online-pickup-requests/dispatch-hub`,
  GET_HUB_DISPATCH_REQUESTS: `${API_BASE_URL}/api/delivery/hub-dispatch-requests`,
  ACCEPT_HUB_DISPATCH: (requestCode) => `${API_BASE_URL}/api/delivery/hub-dispatch-requests/${requestCode}/accept`,
  REJECT_HUB_DISPATCH: (requestCode) => `${API_BASE_URL}/api/delivery/hub-dispatch-requests/${requestCode}/reject`,

  // Admin tạo pickup thay khách (Luồng 2 - HOTLINE/CSKH/ADMIN)
  ADMIN_CREATE_PICKUP: `${API_BASE_URL}/api/waybills/admin/pickups`,
};
