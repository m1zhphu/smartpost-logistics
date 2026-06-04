import { ENDPOINTS } from "../constants/data";
import { createAuthHeaders, requestJson } from "./apiClient";

export const adminService = {
  getAuditLogs: async (token) => {
    return requestJson(
      ENDPOINTS.ADMIN_AUDIT_LOGS,
      {
        method: "GET",
        headers: createAuthHeaders(token, {
          "Content-Type": "application/json",
        }),
      },
      "Không thể tải nhật ký hệ thống.",
    );
  },

  overrideWaybillStatus: async (token, payload) => {
    return requestJson(
      ENDPOINTS.ADMIN_OVERRIDE_WAYBILL_STATUS,
      {
        method: "POST",
        headers: createAuthHeaders(token, {
          "Content-Type": "application/json",
        }),
        body: JSON.stringify(payload),
      },
      "Không thể ghi đè trạng thái vận đơn.",
    );
  },

  scanOverdue: async (token) => {
    return requestJson(
      ENDPOINTS.ADMIN_SCAN_OVERDUE,
      {
        method: "POST",
        headers: createAuthHeaders(token, {
          "Content-Type": "application/json",
        }),
      },
      "Không thể quét đơn quá hạn.",
    );
  },
};
