import { ENDPOINTS } from "../constants/data";
import { createAuthHeaders, requestJson } from "./apiClient";

export const bagService = {
  createBag: async (token) => {
    throw new Error(
      "Tạo túi trong mobile đã được chuyển sang luồng ScanBagging truyền thống.",
    );
  },

  scanBagIn: async (token, bagCode, destinationHubId, waybillCode) => {
    return requestJson(
      ENDPOINTS.SCAN_BAGGING,
      {
        method: "POST",
        headers: createAuthHeaders(token, {
          "Content-Type": "application/json",
        }),
        body: JSON.stringify({
          bag_code: bagCode,
          destination_hub_id: Number(destinationHubId),
          waybill_codes: [waybillCode],
          note: "Đóng túi chuẩn bị trung chuyển",
        }),
      },
      "Không thể quét vận đơn vào túi.",
    );
  },
};
