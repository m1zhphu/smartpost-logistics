// src/services/shipper.js
import { apiClient } from '../context/UserContext';
import { WAREHOUSE_ENDPOINTS } from '../constants/warehouseEndpoints';

export const shipperService = {
    getShippers: async () => {
        try {
            const response = await apiClient.get(WAREHOUSE_WAREHOUSE_ENDPOINTS.GET_SHIPPERS);
            return response;
        } catch (error) {
            throw error;
        }
    },
    getAvailability: async () => {
        try {
            const { ADMIN_ENDPOINTS } = require('../constants/adminEndpoints');
            const response = await apiClient.get(ADMIN_ENDPOINTS.TOGGLE_AVAILABILITY);
            return response.data;
        } catch (error) {
            throw error;
        }
    },
    toggleAvailability: async (isOnline, note = "") => {
        try {
            const { ADMIN_ENDPOINTS } = require('../constants/adminEndpoints');
            const response = await apiClient.post(ADMIN_ENDPOINTS.TOGGLE_AVAILABILITY, {
                is_online: isOnline,
                note: note
            });
            return response.data;
        } catch (error) {
            throw error;
        }
    }
};