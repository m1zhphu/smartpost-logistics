// src/services/shipper.js
import { apiClient } from '../context/UserContext';
import { ENDPOINTS } from '../constants/data';

export const shipperService = {
    getShippers: async () => {
        try {
            const response = await apiClient.get(ENDPOINTS.GET_SHIPPERS);
            return response;
        } catch (error) {
            throw error;
        }
    },
};