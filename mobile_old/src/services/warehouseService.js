import { ENDPOINTS } from "../constants/data";
import { createAuthHeaders, requestJson } from "./apiClient";

export const warehouseService = {
  scanInHub: async (token, waybillCode, note) => {
    return requestJson(
      ENDPOINTS.SCAN_IN_HUB,
      {
        method: "POST",
        headers: createAuthHeaders(token, {
          "Content-Type": "application/json",
        }),
        body: JSON.stringify({
          waybill_code: waybillCode,
          note: note || "",
        }),
      },
      "Không thể quét nhập kho.",
    );
  },

  updateWeight: async (token, waybillCode, actualWeight, note) => {
    return requestJson(
      ENDPOINTS.UPDATE_SCAN_WEIGHT(waybillCode),
      {
        method: "PATCH",
        headers: createAuthHeaders(token, {
          "Content-Type": "application/json",
        }),
        body: JSON.stringify({
          actual_weight: actualWeight,
          note: note || "",
        }),
      },
      "Không thể cập nhật cân nặng.",
    );
  },

  scanBagging: async (token, payload) => {
    return requestJson(
      ENDPOINTS.SCAN_BAGGING,
      {
        method: "POST",
        headers: createAuthHeaders(token, {
          "Content-Type": "application/json",
        }),
        body: JSON.stringify(payload),
      },
      "Không thể đóng túi hàng.",
    );
  },

  manifestLoad: async (token, payload) => {
    return requestJson(
      ENDPOINTS.MANIFEST_LOAD,
      {
        method: "POST",
        headers: createAuthHeaders(token, {
          "Content-Type": "application/json",
        }),
        body: JSON.stringify(payload),
      },
      "Không thể bốc lên xe.",
    );
  },

  manifestUnload: async (token, payload) => {
    return requestJson(
      ENDPOINTS.MANIFEST_UNLOAD,
      {
        method: "POST",
        headers: createAuthHeaders(token, {
          "Content-Type": "application/json",
        }),
        body: JSON.stringify(payload),
      },
      "Không thể gỡ xuống xe.",
    );
  },

  getIncomingManifests: async (token) => {
    const data = await requestJson(
      ENDPOINTS.GET_INCOMING_MANIFESTS,
      {
        method: "GET",
        headers: createAuthHeaders(token, {
          "Content-Type": "application/json",
        }),
      },
      "Không thể tải danh sách manifest đang đến.",
    );

    return data && data.items ? data.items : [];
  },

  getManifestBags: async (token, manifestCode) => {
    const data = await requestJson(
      ENDPOINTS.GET_MANIFEST_BAGS(manifestCode),
      {
        method: "GET",
        headers: createAuthHeaders(token, {
          "Content-Type": "application/json",
        }),
      },
      "Không thể tải danh sách túi hàng.",
    );

    return data && data.items ? data.items : [];
  },
};
