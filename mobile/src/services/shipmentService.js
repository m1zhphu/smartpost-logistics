import { CUSTOMER_ENDPOINTS } from '../constants/customerEndpoints';
import { apiClient } from '../context/UserContext';

export const submitShipment = async (payload) => {
    console.log('[OCR Pickup] Bắt đầu gửi xác nhận', {
        apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL,
        waybillCode: payload?.waybill_code,
        bagCode: payload?.bag_code,
        customerId: payload?.customer_id,
        receiverName: payload?.receiver_name,
        actualWeight: payload?.actual_weight,
    });
    try {
        // Updated to use the new OCR Upsert endpoint for Shipper
        const response = await apiClient.post('/api/waybills/ocr-pickup', payload);
        console.log('[OCR Pickup] Backend đã lưu thành công', {
            waybillCode: response.data?.waybill_code,
            status: response.data?.status,
            ocrStatus: response.data?.ocr_status,
            missingFields: response.data?.missing_fields || [],
        });
        return { success: true, data: response.data };
    } catch (error) {
        console.error('[OCR Pickup] Backend lưu thất bại', {
            waybillCode: payload?.waybill_code,
            status: error.response?.status,
            response: error.response?.data,
            message: error.message,
        });
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
        } else if (data.waybill_code || data.id) {
            // Backend trả thẳng object không bọc trong {status, data}
            return { success: true, data: data };
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
        throw new Error(error.message || 'Lỗi không xác định. Vui lòng thử lại.');
    }
};

