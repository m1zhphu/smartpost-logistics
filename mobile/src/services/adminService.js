import { ENDPOINTS } from '../constants/data';
import { createAuthHeaders, requestJson } from './apiClient';

export const adminService = {
    getAuditLogs: async (token) => {
        return requestJson(
            ENDPOINTS.ADMIN_AUDIT_LOGS,
            {
                method: 'GET',
                headers: createAuthHeaders(token, { 'Content-Type': 'application/json' }),
            },
            'Khong the tai nhat ky he thong.'
        );
    },

    overrideWaybillStatus: async (token, payload) => {
        return requestJson(
            ENDPOINTS.ADMIN_OVERRIDE_WAYBILL_STATUS,
            {
                method: 'POST',
                headers: createAuthHeaders(token, { 'Content-Type': 'application/json' }),
                body: JSON.stringify(payload),
            },
            'Khong the ghi de trang thai van don.'
        );
    },

    scanOverdue: async (token) => {
        return requestJson(
            ENDPOINTS.ADMIN_SCAN_OVERDUE,
            {
                method: 'POST',
                headers: createAuthHeaders(token, { 'Content-Type': 'application/json' }),
            },
            'Khong the quet don qua han.'
        );
    },
};