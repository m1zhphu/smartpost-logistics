export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL || "https://speedlight.minhhien.click";

export const CUSTOMER_ENDPOINTS = {
  // Authentication
  CUSTOMER_LOGIN: `${API_BASE_URL}/api/auth/login`,
  REGISTER_OTP: `${API_BASE_URL}/api/auth/register/request-otp`,
  REGISTER_VERIFY: `${API_BASE_URL}/api/auth/register/verify`,
  REGISTER: `${API_BASE_URL}/register`,
  GET_PROFILE_CUSTOMER: `${API_BASE_URL}/api/customers/me`, // Updated to use the new customer profile endpoint
  CHANGE_PASSWORD: `${API_BASE_URL}/api/auth/change-password`,
  FORGOT_PASSWORD_OTP: `${API_BASE_URL}/api/auth/forgot-password/request-otp`,
  FORGOT_PASSWORD_RESET: `${API_BASE_URL}/api/auth/forgot-password/reset`,

  // Profile Update (New)
  UPDATE_PROFILE: `${API_BASE_URL}/api/customers/me`, // Placeholder for backend implementation

  // Pickup (Online)
  CREATE_PICKUP: `${API_BASE_URL}/api/waybills/customer/pickups`,
  GET_PICKUPS: `${API_BASE_URL}/api/waybills/customer/pickups`,
  GET_PICKUP_DETAIL: (waybillCode) =>
    `${API_BASE_URL}/api/waybills/customer/pickups/${waybillCode}`,

  // Pricing
  GET_EXTRA_SERVICES: `${API_BASE_URL}/api/pricing/extra-services`,
  SIMULATE_PRICE: `${API_BASE_URL}/api/pricing/simulate`,

  // Legacy / Others
  EXTRACT: `${API_BASE_URL}/extract`,
  SUBMIT: `${API_BASE_URL}/submit`,
  GET_SHIPMENT: (tracking_number) =>
    `${API_BASE_URL}/shipment/${tracking_number}`,

  CUSTOMER_REGISTER_PUSH_TOKEN_URL: `${API_BASE_URL}/api/users/register-push-token`,
};
