import { ENDPOINTS } from "../constants/data";
import { createAuthHeaders, requestJson } from "./apiClient";

export const bagService = {
  createBag: async (token) => {
    return requestJson(
      ENDPOINTS.CREATE_BAG,
      {
        method: "POST",
        headers: createAuthHeaders(token, {
          "Content-Type": "application/json",
        }),
      },
      "Không thể tạo túi mới.",
    );
  },

  scanBagIn: async (token, bagCode, payload) => {
    return requestJson(
      ENDPOINTS.BAG_SCAN_IN(bagCode),
      {
        method: "POST",
        headers: createAuthHeaders(token, {
          "Content-Type": "application/json",
        }),
        body: JSON.stringify(payload),
      },
      "Không thể quét vận đơn vào túi.",
    );
  },
};
