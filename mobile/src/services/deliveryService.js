import { ENDPOINTS } from "../constants/data";
import { createAuthHeaders, requestJson } from "./apiClient";

export const deliveryService = {
  getMyTasks: async (token) => {
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

  confirmSuccess: async (token, payload) => {
    return requestJson(
      ENDPOINTS.CONFIRM_SUCCESS,
      {
        method: "POST",
        headers: createAuthHeaders(token, {
          "Content-Type": "application/json",
        }),
        body: JSON.stringify(payload),
      },
      "Không thể xác nhận giao thành công.",
    );
  },

  reportFailure: async (token, payload) => {
    return requestJson(
      ENDPOINTS.REPORT_FAILURE,
      {
        method: "POST",
        headers: createAuthHeaders(token, {
          "Content-Type": "application/json",
        }),
        body: JSON.stringify(payload),
      },
      "Không thể báo cáo giao thất bại.",
    );
  },

  getShippers: async (token) => {
    return requestJson(
      ENDPOINTS.GET_SHIPPERS,
      {
        method: "GET",
        headers: createAuthHeaders(token, {
          "Content-Type": "application/json",
        }),
      },
      "Không thể tải danh sách shipper.",
    );
  },

  getPendingPickups: async (token) => {
    return requestJson(
      ENDPOINTS.GET_PENDING_PICKUPS,
      {
        method: "GET",
        headers: createAuthHeaders(token, {
          "Content-Type": "application/json",
        }),
      },
      "Không thể tải danh sách pickup đang chờ.",
    );
  },

  assignPickup: async (token, payload) => {
    return requestJson(
      ENDPOINTS.ASSIGN_PICKUP,
      {
        method: "POST",
        headers: createAuthHeaders(token, {
          "Content-Type": "application/json",
        }),
        body: JSON.stringify(payload),
      },
      "Không thể phân công pickup.",
    );
  },

  assignShipper: async (token, payload) => {
    return requestJson(
      ENDPOINTS.ASSIGN_SHIPPER,
      {
        method: "POST",
        headers: createAuthHeaders(token, {
          "Content-Type": "application/json",
        }),
        body: JSON.stringify(payload),
      },
      "Không thể phân công shipper.",
    );
  },

  reassignWaybill: async (token, payload) => {
    return requestJson(
      ENDPOINTS.REASSIGN_WAYBILL,
      {
        method: "POST",
        headers: createAuthHeaders(token, {
          "Content-Type": "application/json",
        }),
        body: JSON.stringify(payload),
      },
      "Không thể điều chuyển vận đơn.",
    );
  },

  getPendingCOD: async (token) => {
    return requestJson(
      ENDPOINTS.GET_PENDING_COD,
      {
        method: "GET",
        headers: createAuthHeaders(token, {
          "Content-Type": "application/json",
        }),
      },
      "Không thể tải thông tin COD đang chờ.",
    );
  },
};
