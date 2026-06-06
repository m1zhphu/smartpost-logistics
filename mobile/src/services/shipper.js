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
};