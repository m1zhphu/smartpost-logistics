// src/services/vi_tri_kho.js
import { apiClient } from '../context/UserContext';
import { ENDPOINTS } from '../constants/data';

export const viTriKhoService = {
    getViTriKho: async () => {
        try {
            const response = await apiClient.get(ENDPOINTS.GET_LOCATIONS);
            return response;
        } catch (error) {
            throw error;
        }
    },
};