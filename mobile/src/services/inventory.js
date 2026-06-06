// src/services/inventory.js
import { apiClient } from '../context/UserContext';
import { WAREHOUSE_ENDPOINTS } from '../constants/warehouseEndpoints';

export const inventoryService = {
    // ==========================================
    // 1. NHÓM API LẤY DANH SÁCH HÀNG CÓ SẴN (Đổ vào Modal Kho)
    // ==========================================
    getVipAvailableExportNew: async (maKhoSpl = '') => {
        return await apiClient.get(WAREHOUSE_WAREHOUSE_ENDPOINTS.GET_VIP_AVAILABLE_EXPORT_NEW(maKhoSpl));
    },

    getVipAvailableImportOld: async () => {
        return await apiClient.get(WAREHOUSE_WAREHOUSE_ENDPOINTS.GET_VIP_AVAILABLE_IMPORT_OLD());
    },

    getVipAvailableExportOld: async (maKhoSpl = '') => {
        return await apiClient.get(WAREHOUSE_WAREHOUSE_ENDPOINTS.GET_VIP_AVAILABLE_EXPORT_OLD(maKhoSpl));
    },

    getRegularAvailableExport: async (customerId, maKho = '') => {
        return await apiClient.get(WAREHOUSE_WAREHOUSE_ENDPOINTS.GET_THUONG_AVAILABLE(customerId, maKho));
    },

    getRetailAvailableExport: async (customerId, maKho = '') => {
        return await apiClient.get(WAREHOUSE_WAREHOUSE_ENDPOINTS.GET_LE_AVAILABLE(customerId, maKho));
    },

    // ==========================================
    // 2. NHÓM API XỬ LÝ (Submit Form)
    // ==========================================

    // --- VIP ---
    importNewVip: async (payload) => {
        return await apiClient.post(WAREHOUSE_WAREHOUSE_ENDPOINTS.VIP_IMPORT_NEW, payload);
    },

    exportNewVip: async (payload) => {
        return await apiClient.post(WAREHOUSE_WAREHOUSE_ENDPOINTS.VIP_EXPORT_NEW, payload);
    },

    importOldVip: async (payload) => {
        return await apiClient.post(WAREHOUSE_WAREHOUSE_ENDPOINTS.VIP_IMPORT_OLD, payload);
    },

    exportOldVip: async (payload) => {
        return await apiClient.post(WAREHOUSE_WAREHOUSE_ENDPOINTS.VIP_EXPORT_OLD, payload);
    },

    // --- THƯỜNG ---
    importRegular: async (payload) => {
        return await apiClient.post(WAREHOUSE_WAREHOUSE_ENDPOINTS.THUONG_IMPORT, payload);
    },

    exportRegular: async (payload) => {
        return await apiClient.post(WAREHOUSE_WAREHOUSE_ENDPOINTS.THUONG_EXPORT, payload);
    },

    // --- LẺ ---
    importRetail: async (payload) => {
        return await apiClient.post(WAREHOUSE_WAREHOUSE_ENDPOINTS.LE_IMPORT, payload);
    },

    exportRetail: async (payload) => {
        return await apiClient.post(WAREHOUSE_WAREHOUSE_ENDPOINTS.LE_EXPORT, payload);
    },

    createNoiBoExport: async (payload) => {
        return await apiClient.post('https://warehouse.speedlight.com.vn/api/warehouse/noi-bo/export', payload);
    },

    scanVipSerial: (serial) => apiClient.get(`https://warehouse.speedlight.com.vn/api/warehouse/vip/scan?serial=${serial}`),

    getPendingNoiBo: () => apiClient.get('https://warehouse.speedlight.com.vn/api/warehouse/noi-bo/pending'),
    actionNoiBo: (id, payload) => apiClient.post(`https://warehouse.speedlight.com.vn/api/warehouse/noi-bo/${id}/action`, payload),
};