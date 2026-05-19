import { ENDPOINTS } from '../constants/data';
import { createAuthHeaders, requestJson } from './apiClient';

export const pricingService = {
    getRules: async (token) => {
        return requestJson(
            ENDPOINTS.GET_PRICING_RULES,
            {
                method: 'GET',
                headers: createAuthHeaders(token, { 'Content-Type': 'application/json' }),
            },
            'Không thể tải bảng giá.'
        );
    },

    createRule: async (token, payload) => {
        return requestJson(
            ENDPOINTS.CREATE_PRICING_RULE,
            {
                method: 'POST',
                headers: createAuthHeaders(token, { 'Content-Type': 'application/json' }),
                body: JSON.stringify(payload),
            },
            'Không thể tạo quy tắc giá.'
        );
    },

    updateRule: async (token, ruleId, payload) => {
        return requestJson(
            ENDPOINTS.UPDATE_PRICING_RULE(ruleId),
            {
                method: 'PUT',
                headers: createAuthHeaders(token, { 'Content-Type': 'application/json' }),
                body: JSON.stringify(payload),
            },
            'Không thể cập nhật quy tắc giá.'
        );
    },

    deleteRule: async (token, ruleId) => {
        return requestJson(
            ENDPOINTS.DELETE_PRICING_RULE(ruleId),
            {
                method: 'DELETE',
                headers: createAuthHeaders(token, { 'Content-Type': 'application/json' }),
            },
            'Không thể xóa quy tắc giá.'
        );
    },

    calculateFee: async (token, payload) => {
        return requestJson(
            ENDPOINTS.CALCULATE_PRICING,
            {
                method: 'POST',
                headers: createAuthHeaders(token, { 'Content-Type': 'application/json' }),
                body: JSON.stringify(payload),
            },
            'Không thể tính cước phí.'
        );
    },

    getExtraServices: async (token) => {
        return requestJson(
            ENDPOINTS.GET_EXTRA_SERVICES,
            {
                method: 'GET',
                headers: createAuthHeaders(token, { 'Content-Type': 'application/json' }),
            },
            'Không thể tải danh sách phụ phí.'
        );
    },

    createExtraService: async (token, payload) => {
        return requestJson(
            ENDPOINTS.CREATE_EXTRA_SERVICE,
            {
                method: 'POST',
                headers: createAuthHeaders(token, { 'Content-Type': 'application/json' }),
                body: JSON.stringify(payload),
            },
            'Không thể tạo phụ phí.'
        );
    },

    updateExtraService: async (token, serviceId, payload) => {
        return requestJson(
            ENDPOINTS.UPDATE_EXTRA_SERVICE(serviceId),
            {
                method: 'PUT',
                headers: createAuthHeaders(token, { 'Content-Type': 'application/json' }),
                body: JSON.stringify(payload),
            },
            'Không thể cập nhật phụ phí.'
        );
    },
};
