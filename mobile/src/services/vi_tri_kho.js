// src/services/vi_tri_kho.js
import { apiClient } from '../context/UserContext';
import { WAREHOUSE_ENDPOINTS } from '../constants/warehouseEndpoints';

export const viTriKhoService = {
    getViTriKho: async () => {
        try {
            const response = await apiClient.get(WAREHOUSE_WAREHOUSE_ENDPOINTS.GET_LOCATIONS);
            return response;
        } catch (error) {
            throw error;
        }
    },
};