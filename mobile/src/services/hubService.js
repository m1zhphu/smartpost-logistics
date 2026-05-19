import { ENDPOINTS } from '../constants/data';
import { createAuthHeaders, requestJson } from './apiClient';

export const hubService = {
    getHubs: async (token) => {
        const data = await requestJson(
            ENDPOINTS.GET_HUBS,
            {
                method: 'GET',
                headers: createAuthHeaders(token, { 'Content-Type': 'application/json' }),
            },
            'Khong the tai danh sach hub.'
        );

        return data && data.items ? data.items : data || [];
    },

    createHub: async (token, payload) => {
        return requestJson(
            ENDPOINTS.CREATE_HUB,
            {
                method: 'POST',
                headers: createAuthHeaders(token, { 'Content-Type': 'application/json' }),
                body: JSON.stringify(payload),
            },
            'Khong the tao buu cuc.'
        );
    },

    updateHubStatus: async (token, hubId, status) => {
        return requestJson(
            ENDPOINTS.UPDATE_HUB_STATUS(hubId),
            {
                method: 'PATCH',
                headers: createAuthHeaders(token, { 'Content-Type': 'application/json' }),
                body: JSON.stringify({ status }),
            },
            'Khong the cap nhat trang thai hub.'
        );
    },
};
