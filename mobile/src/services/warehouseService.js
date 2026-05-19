import { ENDPOINTS } from '../constants/data';
import { createAuthHeaders, requestJson } from './apiClient';

export const warehouseService = {
    scanInHub: async (token, waybillCode, note) => {
        return requestJson(
            ENDPOINTS.SCAN_IN_HUB,
            {
                method: 'POST',
                headers: createAuthHeaders(token, { 'Content-Type': 'application/json' }),
                body: JSON.stringify({
                    waybill_code: waybillCode,
                    note: note || '',
                }),
            },
            'Khong the quet nhap kho.'
        );
    },

    updateWeight: async (token, waybillCode, actualWeight, note) => {
        return requestJson(
            ENDPOINTS.UPDATE_SCAN_WEIGHT(waybillCode),
            {
                method: 'PATCH',
                headers: createAuthHeaders(token, { 'Content-Type': 'application/json' }),
                body: JSON.stringify({
                    actual_weight: actualWeight,
                    note: note || '',
                }),
            },
            'Khong the cap nhat can nang.'
        );
    },

    scanBagging: async (token, payload) => {
        return requestJson(
            ENDPOINTS.SCAN_BAGGING,
            {
                method: 'POST',
                headers: createAuthHeaders(token, { 'Content-Type': 'application/json' }),
                body: JSON.stringify(payload),
            },
            'Khong the dong tui hang.'
        );
    },

    manifestLoad: async (token, payload) => {
        return requestJson(
            ENDPOINTS.MANIFEST_LOAD,
            {
                method: 'POST',
                headers: createAuthHeaders(token, { 'Content-Type': 'application/json' }),
                body: JSON.stringify(payload),
            },
            'Khong the boc len xe.'
        );
    },

    manifestUnload: async (token, payload) => {
        return requestJson(
            ENDPOINTS.MANIFEST_UNLOAD,
            {
                method: 'POST',
                headers: createAuthHeaders(token, { 'Content-Type': 'application/json' }),
                body: JSON.stringify(payload),
            },
            'Khong the go xuong xe.'
        );
    },

    getIncomingManifests: async (token) => {
        const data = await requestJson(
            ENDPOINTS.GET_INCOMING_MANIFESTS,
            {
                method: 'GET',
                headers: createAuthHeaders(token, { 'Content-Type': 'application/json' }),
            },
            'Khong the tai danh sach manifest dang den.'
        );

        return data && data.items ? data.items : [];
    },

    getManifestBags: async (token, manifestCode) => {
        const data = await requestJson(
            ENDPOINTS.GET_MANIFEST_BAGS(manifestCode),
            {
                method: 'GET',
                headers: createAuthHeaders(token, { 'Content-Type': 'application/json' }),
            },
            'Khong the tai danh sach tui hang.'
        );

        return data && data.items ? data.items : [];
    },
};
