export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL || "http://localhost:8000";
export const API_PREFIX = `${API_BASE_URL}/api`;

export const ENDPOINTS = {
  LOGIN: `${API_PREFIX}/auth/login`,

  GET_MY_TASKS: `${API_PREFIX}/delivery/my-tasks`,
  CONFIRM_SUCCESS: `${API_PREFIX}/delivery/confirm-success`,
  REPORT_FAILURE: `${API_PREFIX}/delivery/report-failure`,
  GET_SHIPPERS: `${API_PREFIX}/users/shippers`,
  ASSIGN_SHIPPER: `${API_PREFIX}/delivery/assign-shipper`,
  GET_PENDING_COD: `${API_PREFIX}/delivery/my-pending-cod`,

  SCAN_IN_HUB: `${API_PREFIX}/scans/in-hub`,
  UPDATE_SCAN_WEIGHT: (waybillCode) =>
    `${API_PREFIX}/scans/${waybillCode}/weigh`,
  SCAN_BAGGING: `${API_PREFIX}/scans/bagging`,
  CREATE_BAG: `${API_PREFIX}/bags/create`,
  BAG_SCAN_IN: (bagCode) => `${API_PREFIX}/bags/${bagCode}/scan-in`,
  MANIFEST_LOAD: `${API_PREFIX}/scans/manifest-load`,
  MANIFEST_UNLOAD: `${API_PREFIX}/scans/manifest-unload`,
  GET_INCOMING_MANIFESTS: `${API_PREFIX}/scans/manifests/incoming`,
  GET_MANIFEST_BAGS: (manifestCode) =>
    `${API_PREFIX}/scans/manifests/${manifestCode}/bags`,

  GET_TRACKING: (code) => `${API_PREFIX}/waybills/${code}/tracking`,
  CREATE_WAYBILL: `${API_PREFIX}/waybills`,
  SEARCH_WAYBILLS: `${API_PREFIX}/waybills/search`,
  EXPORT_WAYBILLS: `${API_PREFIX}/waybills/export`,
  UPDATE_WAYBILL_WEIGHT: (code) => `${API_PREFIX}/waybills/${code}/weight`,
  UPDATE_WAYBILL_INFO: (code) => `${API_PREFIX}/waybills/${code}`,
  DELETE_WAYBILL: (code) => `${API_PREFIX}/waybills/${code}`,
  DASHBOARD_SUMMARY: `${API_PREFIX}/waybills/dashboard-summary`,

  GET_HUBS: `${API_PREFIX}/hubs`,
  CREATE_HUB: `${API_PREFIX}/hubs`,
  UPDATE_HUB_STATUS: (hubId) => `${API_PREFIX}/hubs/${hubId}/status`,

  GET_CUSTOMERS: `${API_PREFIX}/customers`,
  CREATE_CUSTOMER: `${API_PREFIX}/customers`,

  GET_PRICING_RULES: `${API_PREFIX}/pricing/rules`,
  CREATE_PRICING_RULE: `${API_PREFIX}/pricing/rules`,
  UPDATE_PRICING_RULE: (ruleId) => `${API_PREFIX}/pricing/rules/${ruleId}`,
  DELETE_PRICING_RULE: (ruleId) => `${API_PREFIX}/pricing/rules/${ruleId}`,
  CALCULATE_PRICING: `${API_PREFIX}/pricing/calculate`,
  GET_EXTRA_SERVICES: `${API_PREFIX}/pricing/extra-services`,
  CREATE_EXTRA_SERVICE: `${API_PREFIX}/pricing/extra-services`,
  UPDATE_EXTRA_SERVICE: (serviceId) =>
    `${API_PREFIX}/pricing/extra-services/${serviceId}`,

  PRINT_WAYBILL: (waybillCode) => `${API_PREFIX}/print/${waybillCode}`,
  UPLOAD_POD: `${API_PREFIX}/upload/pod`,
  UPLOAD_BILL_IMAGE: `${API_PREFIX}/upload/bill`,
  UPDATE_BILL_IMAGES: (code) => `${API_PREFIX}/waybills/${code}/bill-images`,

  GET_CASH_CONFIRMATION_LIST: `${API_PREFIX}/accounting/cash-confirmation`,
  CONFIRM_SHIPPER_CASH: `${API_PREFIX}/accounting/confirm-shipper-cash`,
  CREATE_SHOP_STATEMENT: (customerId) =>
    `${API_PREFIX}/accounting/create-shop-statement?customer_id=${customerId}`,
  EXPORT_STATEMENT: (statementId, token) =>
    `${API_PREFIX}/accounting/cod/${statementId}/export?token=${token}`,

  GET_USERS: `${API_PREFIX}/users`,
  CREATE_USER: `${API_PREFIX}/users`,
  TOGGLE_USER_STATUS: (userId) => `${API_PREFIX}/users/${userId}/status`,

  ADMIN_AUDIT_LOGS: `${API_PREFIX}/admin/audit-logs`,
  ADMIN_OVERRIDE_WAYBILL_STATUS: `${API_PREFIX}/admin/override-waybill-status`,
  ADMIN_SCAN_OVERDUE: `${API_PREFIX}/admin/scan-overdue`,

  // Temporary aliases for existing Source 1 callers. These will be removed
  // after services/screens are migrated to the new FastAPI flow.
  REGISTER: `${API_PREFIX}/auth/register`,
  EXTRACT: process.env.EXPO_PUBLIC_OCR_URL || `${API_PREFIX}/upload/pod`,
  SUBMIT: `${API_PREFIX}/waybills`,
  GET_SHIPMENT: (code) => `${API_PREFIX}/waybills/${code}/tracking`,
};
