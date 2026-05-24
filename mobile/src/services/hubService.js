import { ENDPOINTS } from "../constants/data";
import { createAuthHeaders, requestJson } from "./apiClient";

export const hubService = {
  getHubs: async (token) => {
    const data = await requestJson(
      ENDPOINTS.GET_HUBS,
      {
        method: "GET",
        headers: createAuthHeaders(token, {
          "Content-Type": "application/json",
        }),
      },
      "Không thể tải danh sách hub.",
    );

    return data && data.items ? data.items : data || [];
  },

  createHub: async (token, payload) => {
    return requestJson(
      ENDPOINTS.CREATE_HUB,
      {
        method: "POST",
        headers: createAuthHeaders(token, {
          "Content-Type": "application/json",
        }),
        body: JSON.stringify(payload),
      },
      "Không thể tạo bưu cục.",
    );
  },

  updateHubStatus: async (token, hubId, status) => {
    return requestJson(
      ENDPOINTS.UPDATE_HUB_STATUS(hubId),
      {
        method: "PATCH",
        headers: createAuthHeaders(token, {
          "Content-Type": "application/json",
        }),
        body: JSON.stringify({ status }),
      },
      "Không thể cập nhật trạng thái hub.",
    );
  },
};
