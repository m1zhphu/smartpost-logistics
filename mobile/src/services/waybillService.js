import { ENDPOINTS } from "../constants/data";
import {
  createAuthHeaders,
  requestArrayBuffer,
  requestJson,
} from "./apiClient";

export const waybillService = {
  getTasks: async (token) => {
    const data = await requestJson(
      ENDPOINTS.GET_MY_TASKS,
      {
        method: "GET",
        headers: createAuthHeaders(token, {
          "Content-Type": "application/json",
        }),
      },
      "Không thể tải danh sách nhiệm vụ.",
    );

    return data && data.items ? data.items : [];
  },

  getTracking: async (token, code) => {
    const data = await requestJson(
      ENDPOINTS.GET_TRACKING(code),
      {
        method: "GET",
        headers: createAuthHeaders(token, {
          "Content-Type": "application/json",
        }),
      },
      "Không thể tải hành trình vận đơn.",
    );

    return data && data.history ? data.history : data;
  },

  createWaybill: async (token, payload) => {
    return requestJson(
      ENDPOINTS.CREATE_WAYBILL,
      {
        method: "POST",
        headers: createAuthHeaders(token, {
          "Content-Type": "application/json",
        }),
        body: JSON.stringify(payload),
      },
      "Không thể tạo vận đơn.",
    );
  },

  searchWaybills: async (token, filters) => {
    return requestJson(
      ENDPOINTS.SEARCH_WAYBILLS,
      {
        method: "POST",
        headers: createAuthHeaders(token, {
          "Content-Type": "application/json",
        }),
        body: JSON.stringify(filters || {}),
      },
      "Không thể tìm kiếm vận đơn.",
    );
  },

  exportWaybills: async (token, filters) => {
    return requestArrayBuffer(
      ENDPOINTS.EXPORT_WAYBILLS,
      {
        method: "POST",
        headers: createAuthHeaders(token, {
          "Content-Type": "application/json",
        }),
        body: JSON.stringify(filters || {}),
      },
      "Không thể xuất danh sách vận đơn.",
    );
  },

  getHubs: async (token) => {
    const data = await requestJson(
      ENDPOINTS.GET_HUBS,
      {
        method: "GET",
        headers: createAuthHeaders(token, {
          "Content-Type": "application/json",
        }),
      },
      "Không thể tải danh sách bưu cục (Hub).",
    );

    return data && data.items ? data.items : data || [];
  },

  getCustomers: async (token) => {
    const data = await requestJson(
      ENDPOINTS.GET_CUSTOMERS,
      {
        method: "GET",
        headers: createAuthHeaders(token, {
          "Content-Type": "application/json",
        }),
      },
      "Không thể tải danh sách khách hàng.",
    );

    return data && data.items ? data.items : data || [];
  },

  updateWeight: async (token, code, weight) => {
    return requestJson(
      ENDPOINTS.UPDATE_WAYBILL_WEIGHT(code),
      {
        method: "PATCH",
        headers: createAuthHeaders(token, {
          "Content-Type": "application/json",
        }),
        body: JSON.stringify({ actual_weight: weight }),
      },
      "Không thể cập nhật cân nặng vận đơn.",
    );
  },

  updateWaybillInfo: async (token, code, payload) => {
    return requestJson(
      ENDPOINTS.UPDATE_WAYBILL_INFO(code),
      {
        method: "PUT",
        headers: createAuthHeaders(token, {
          "Content-Type": "application/json",
        }),
        body: JSON.stringify(payload),
      },
      "Không thể cập nhật thông tin vận đơn.",
    );
  },

  cancelWaybill: async (token, code) => {
    return requestJson(
      ENDPOINTS.DELETE_WAYBILL(code),
      {
        method: "DELETE",
        headers: createAuthHeaders(token, {
          "Content-Type": "application/json",
        }),
      },
      "Không thể hủy vận đơn.",
    );
  },

  getDashboardSummary: async (token) => {
    return requestJson(
      ENDPOINTS.DASHBOARD_SUMMARY,
      {
        method: "GET",
        headers: createAuthHeaders(token, {
          "Content-Type": "application/json",
        }),
      },
      "Không thể tải dữ liệu dashboard SLA.",
    );
  },

  createCustomer: async (token, payload) => {
    return requestJson(
      ENDPOINTS.CREATE_CUSTOMER,
      {
        method: "POST",
        headers: createAuthHeaders(token, {
          "Content-Type": "application/json",
        }),
        body: JSON.stringify(payload),
      },
      "Không thể tạo khách hàng.",
    );
  },

  updateBillImages: async (token, code, billImageUrl, pickupImageUrl) => {
    return requestJson(
      ENDPOINTS.UPDATE_BILL_IMAGES(code),
      {
        method: "PATCH",
        headers: createAuthHeaders(token, {
          "Content-Type": "application/json",
        }),
        body: JSON.stringify({
          bill_image_url: billImageUrl,
          pickup_image_url: pickupImageUrl,
        }),
      },
      "Không thể cập nhật ảnh bill.",
    );
  },
};
