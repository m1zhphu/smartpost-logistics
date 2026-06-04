// src/services/notification.js
import { apiClient } from '../context/UserContext';

export const notificationService = {
    // Lấy danh sách thông báo chưa đọc
    getUnread: () => apiClient.get('https://warehouse.speedlight.com.vn/api/notifications/unread'),

    // Đánh dấu 1 thông báo là đã đọc
    markAsRead: (id) => apiClient.put(`https://warehouse.speedlight.com.vn/api/notifications/${id}/read`),
};