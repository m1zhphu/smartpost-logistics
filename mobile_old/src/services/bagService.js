import { ENDPOINTS } from "../constants/data";
import { createAuthHeaders, requestJson } from "./apiClient";

export const bagService = {
  createBag: async (token, payload) => {
    return requestJson(
      ENDPOINTS.CREATE_BAG,
      {
        method: "POST",
        headers: createAuthHeaders(token, {
          "Content-Type": "application/json",
        }),
        body: JSON.stringify(payload),
      },
      "Không thể tạo túi.",
    );
  },

  addBillsToBag: async (token, bagCode, waybillIds) => {
    return requestJson(
      ENDPOINTS.ADD_BILLS_TO_BAG(bagCode),
      {
        method: "POST",
        headers: createAuthHeaders(token, {
          "Content-Type": "application/json",
        }),
        body: JSON.stringify({ waybill_ids: waybillIds }),
      },
      "Không thể thêm vận đơn vào túi.",
    );
  },

  verifyBag: async (token, bagCode) => {
    return requestJson(
      ENDPOINTS.VERIFY_BAG(bagCode),
      {
        method: "GET",
        headers: createAuthHeaders(token, {
          "Content-Type": "application/json",
        }),
      },
      "Không thể lấy danh sách vận đơn dự kiến cho túi.",
    );
  },

  submitVerification: async (token, bagCode, scannedIds) => {
    return requestJson(
      ENDPOINTS.SUBMIT_VERIFICATION(bagCode),
      {
        method: "POST",
        headers: createAuthHeaders(token, {
          "Content-Type": "application/json",
        }),
        body: JSON.stringify({ scanned_ids: scannedIds }),
      },
      "Không thể gửi xác thực túi.",
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
