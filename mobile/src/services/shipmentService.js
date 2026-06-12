import { CUSTOMER_ENDPOINTS } from '../constants/customerEndpoints';
import { apiClient } from '../context/UserContext';

export const submitShipment = async (payload) => {
    try {
        // Updated to use the new OCR Upsert endpoint for Shipper
        const response = await apiClient.post('/api/waybills/ocr-pickup', payload);
        return { success: true, data: response.data };
    } catch (error) {
        if (error.response?.status === 409) {
            return {
                success: false,
                isDuplicate: true,
                message: error.response.data?.message || 'Mã vận đơn đã tồn tại'
            };
        }

        if (error.response?.data?.detail) {
            const detail = error.response.data.detail;
            const errorMsg = Array.isArray(detail)
                ? detail.map(e => e.msg).join(', ')
                : detail;
            throw new Error(errorMsg);
        }
        
        throw new Error('Lỗi khi lưu đơn hàng');
    }
};

export const getShipment = async (trackingNumber) => {
    try {
        const url = CUSTOMER_ENDPOINTS.GET_SHIPMENT(trackingNumber);
        const response = await apiClient.get(url);

        const data = response.data;

        if (data.status === 'success' && data.data) {
            return { success: true, data: data.data };
        } else {
            throw new Error('Cấu trúc dữ liệu không hợp lệ');
        }

    } catch (error) {
        if (error.response?.status === 404) {
            throw new Error('Không tìm thấy vận đơn này.');
        }
        if (error.message === 'Cấu trúc dữ liệu không hợp lệ') {
            throw error;
        }
        // throw new Error('Lỗi không xác định. Vui lòng thử lại.');
    }
};