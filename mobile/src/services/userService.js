import { ENDPOINTS } from '../constants/data';
import { createAuthHeaders, requestJson } from './apiClient';

export const userService = {
    getUsers: async (token) => {
        return requestJson(
            ENDPOINTS.GET_USERS,
            {
                method: 'GET',
                headers: createAuthHeaders(token, { 'Content-Type': 'application/json' }),
            },
            'Không thể tải danh sách người dùng.'
        );
    },

    createUser: async (token, payload) => {
        return requestJson(
            ENDPOINTS.CREATE_USER,
            {
                method: 'POST',
                headers: createAuthHeaders(token, { 'Content-Type': 'application/json' }),
                body: JSON.stringify(payload),
            },
            'Không thể tạo người dùng mới.'
        );
    },

    toggleUserStatus: async (token, userId, isActive) => {
        return requestJson(
            ENDPOINTS.TOGGLE_USER_STATUS(userId),
            {
                method: 'PATCH',
                headers: createAuthHeaders(token, { 'Content-Type': 'application/json' }),
                body: JSON.stringify({ is_active: isActive }),
            },
            'Không thể cập nhật trạng thái người dùng.'
        );
    },
};