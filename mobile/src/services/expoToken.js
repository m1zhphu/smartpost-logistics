// src/services/shipper.js
import { apiClient } from '../context/UserContext';
import { ENDPOINTS } from '../constants/data';

export const expoTokenService = {
    updatePushToken: async (token) => {
        try {
            const response = await apiClient.put(ENDPOINTS.UPDATE_PUSH_TOKEN(token));
            return response;
        } catch (error) {
            throw error;
        }
    },
};