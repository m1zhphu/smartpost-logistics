// src/services/customer.js
import { apiClient } from '../context/UserContext';
import { ENDPOINTS } from '../constants/data';

export const customerService = {
    // Gọi hàm GET_CUSTOMERS từ ENDPOINTS và truyền 3 tham số vào
    getCustomers: async (skip = 0, limit = 100, search = '') => {
        try {
            const response = await apiClient.get(ENDPOINTS.GET_CUSTOMERS(skip, limit, search));
            return response;
        } catch (error) {
            throw error;
        }
    },
};