import { createAuthHeadersAsync } from "./apiClient";
import { ENDPOINTS } from "../constants/data";

async function fetchJson(url, options = {}) {
  try {
    const res = await fetch(url, options);
    const text = await res.text();
    const data = text ? JSON.parse(text) : null;
    if (!res.ok) {
      const err = new Error(
        (data && (data.message || data.error)) || `HTTP ${res.status}`,
      );
      err.status = res.status;
      err.data = data;
      throw err;
    }
    return data;
  } catch (e) {
    throw e;
  }
}

export const createWaybillService = {
  /**
   * Tìm kiếm khách hàng theo query
   * @param {string} token - Bearer token
   * @param {string} q - Query string tìm kiếm
   * @returns {Promise<Array>} Danh sách khách hàng
   */
  searchCustomers: async (token, q) => {
    try {
      const headers = token
        ? {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          }
        : await createAuthHeadersAsync({ "Content-Type": "application/json" });
      const url = `${ENDPOINTS.GET_CUSTOMERS}/search?q=${encodeURIComponent(q || "")}`;
      const data = await fetchJson(url, { method: "GET", headers });
      return Array.isArray(data) ? data : (data && data.items) || [];
    } catch (e) {
      console.warn(
        "[createWaybillService] searchCustomers error",
        e.message || e,
      );
      return [];
    }
  },

  /**
   * Tính toán cước phí vận đơn
   * @param {string} token - Bearer token
   * @param {Object} payload - Dữ liệu tính cước
   * @returns {Promise<Object>} Chi tiết phí
   */
  calculatePricing: async (token, payload) => {
    try {
      const headers = token
        ? {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          }
        : await createAuthHeadersAsync({ "Content-Type": "application/json" });
      const url = ENDPOINTS.CALCULATE_PRICING;
      const data = await fetchJson(url, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });
      return data || {};
    } catch (e) {
      console.warn(
        "[createWaybillService] calculatePricing error",
        e.message || e,
      );
      throw e;
    }
  },

  /**
   * Lấy danh sách hub
   * @param {string} token - Bearer token
   * @returns {Promise<Array>} Danh sách hub
   */
  getHubs: async (token) => {
    try {
      const headers = token
        ? {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          }
        : await createAuthHeadersAsync({ "Content-Type": "application/json" });
      const url = ENDPOINTS.GET_HUBS;
      const data = await fetchJson(url, { method: "GET", headers });
      return Array.isArray(data) ? data : (data && data.items) || [];
    } catch (e) {
      console.warn("[createWaybillService] getHubs error", e.message || e);
      return [];
    }
  },

  /**
   * Lấy danh sách khách hàng
   * @param {string} token - Bearer token
   * @returns {Promise<Array>} Danh sách khách hàng
   */
  getCustomers: async (token) => {
    try {
      const headers = token
        ? {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          }
        : await createAuthHeadersAsync({ "Content-Type": "application/json" });
      const url = ENDPOINTS.GET_CUSTOMERS;
      const data = await fetchJson(url, { method: "GET", headers });
      return Array.isArray(data) ? data : (data && data.items) || [];
    } catch (e) {
      console.warn("[createWaybillService] getCustomers error", e.message || e);
      return [];
    }
  },

  /**
   * Lấy lịch sử người nhận theo số điện thoại
   * @param {string} token - Bearer token
   * @param {string} phone - Số điện thoại
   * @returns {Promise<Array>} Danh sách người nhận trước đó
   */
  getRecipientHistory: async (token, phone) => {
    try {
      const headers = token
        ? {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          }
        : await createAuthHeadersAsync({ "Content-Type": "application/json" });
      const url = ENDPOINTS.GET_RECIPIENT_HISTORY(phone);
      const data = await fetchJson(url, { method: "GET", headers });
      return Array.isArray(data) ? data : (data && data.items) || [];
    } catch (e) {
      console.warn(
        "[createWaybillService] getRecipientHistory error",
        e.message || e,
      );
      return [];
    }
  },

  /**
   * Tạo vận đơn mới
   * @param {string} token - Bearer token
   * @param {Object} waybillData - Dữ liệu vận đơn
   * @returns {Promise<Object>} Vận đơn vừa tạo
   */
  createWaybill: async (token, waybillData) => {
    try {
      const headers = token
        ? {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          }
        : await createAuthHeadersAsync({ "Content-Type": "application/json" });
      const url = ENDPOINTS.CREATE_WAYBILL;
      const data = await fetchJson(url, {
        method: "POST",
        headers,
        body: JSON.stringify(waybillData),
      });
      return data || {};
    } catch (e) {
      console.warn(
        "[createWaybillService] createWaybill error",
        e.message || e,
      );
      throw e;
    }
  },

  /**
   * Tạo khách hàng mới
   * @param {string} token - Bearer token
   * @param {Object} customerData - Dữ liệu khách hàng
   * @returns {Promise<Object>} Khách hàng vừa tạo
   */
  createCustomer: async (token, customerData) => {
    try {
      const headers = token
        ? {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          }
        : await createAuthHeadersAsync({ "Content-Type": "application/json" });
      const url = ENDPOINTS.CREATE_CUSTOMER;
      const data = await fetchJson(url, {
        method: "POST",
        headers,
        body: JSON.stringify(customerData),
      });
      return data || {};
    } catch (e) {
      console.warn(
        "[createWaybillService] createCustomer error",
        e.message || e,
      );
      throw e;
    }
  },

  /**
   * Lấy dịch vụ bổ sung có sẵn
   * @param {string} token - Bearer token
   * @returns {Promise<Array>} Danh sách dịch vụ
   */
  getExtraServices: async (token) => {
    try {
      const headers = token
        ? {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          }
        : await createAuthHeadersAsync({ "Content-Type": "application/json" });
      const url = ENDPOINTS.GET_EXTRA_SERVICES;
      const data = await fetchJson(url, { method: "GET", headers });
      return Array.isArray(data) ? data : (data && data.items) || [];
    } catch (e) {
      console.warn(
        "[createWaybillService] getExtraServices error",
        e.message || e,
      );
      return [];
    }
  },
};

export default createWaybillService;
