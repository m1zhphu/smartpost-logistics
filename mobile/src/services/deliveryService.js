import { ENDPOINTS } from '../constants/data';
import { createAuthHeaders, requestJson } from './apiClient';

export const deliveryService = {
    getMyTasks: async (token) => {
        const data = await requestJson(
            ENDPOINTS.GET_MY_TASKS,
            {
                method: 'GET',
                headers: createAuthHeaders(token, { 'Content-Type': 'application/json' }),
            },
            'Khong the tai danh sach nhiem vu.'
        );

        return data && data.items ? data.items : [];
    },

    confirmSuccess: async (token, payload) => {
        return requestJson(
            ENDPOINTS.CONFIRM_SUCCESS,
            {
                method: 'POST',
                headers: createAuthHeaders(token, { 'Content-Type': 'application/json' }),
                body: JSON.stringify(payload),
            },
            'Khong the xac nhan giao thanh cong.'
        );
    },

    reportFailure: async (token, payload) => {
        return requestJson(
            ENDPOINTS.REPORT_FAILURE,
            {
                method: 'POST',
                headers: createAuthHeaders(token, { 'Content-Type': 'application/json' }),
                body: JSON.stringify(payload),
            },
            'Khong the bao cao giao that bai.'
        );
    },

    getShippers: async (token) => {
        return requestJson(
            ENDPOINTS.GET_SHIPPERS,
            {
                method: 'GET',
                headers: createAuthHeaders(token, { 'Content-Type': 'application/json' }),
            },
            'Khong the tai danh sach shipper.'
        );
    },

    assignShipper: async (token, payload) => {
        return requestJson(
            ENDPOINTS.ASSIGN_SHIPPER,
            {
                method: 'POST',
                headers: createAuthHeaders(token, { 'Content-Type': 'application/json' }),
                body: JSON.stringify(payload),
            },
            'Khong the phan cong shipper.'
        );
    },

    getPendingCOD: async (token) => {
        return requestJson(
            ENDPOINTS.GET_PENDING_COD,
            {
                method: 'GET',
                headers: createAuthHeaders(token, { 'Content-Type': 'application/json' }),
            },
            'Khong the tai thong tin COD dang cho.'
        );
    },
};
