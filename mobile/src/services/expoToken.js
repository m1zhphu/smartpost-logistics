// src/services/shipper.js
import { apiClient } from '../context/UserContext';
import { WAREHOUSE_ENDPOINTS } from '../constants/warehouseEndpoints';

export const expoTokenService = {
    updatePushToken: async (token) => {
        try {
            const response = await apiClient.put(WAREHOUSE_ENDPOINTS.UPDATE_PUSH_TOKEN_URL, { token });
            return response;
        } catch (error) {
            throw error;
        }
    },
};