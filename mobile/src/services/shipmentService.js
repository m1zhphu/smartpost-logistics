import { ENDPOINTS } from '../constants/data';

export const submitShipment = async (payload) => {
    try {

        const response = await fetch(ENDPOINTS.SUBMIT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });


        const data = await response.json();

        if (response.status === 409) {
            return {
                success: false,
                isDuplicate: true,
                message: data.message || 'Mã vận đơn đã tồn tại'
            };
        }

        if (!response.ok) {
            if (data.detail) {
                const errorMsg = Array.isArray(data.detail)
                    ? data.detail.map(e => e.msg).join(', ')
                    : data.detail;
                throw new Error(errorMsg);
            }
            throw new Error('Lỗi khi lưu đơn hàng');
        }

        return { success: true, data };
    } catch (error) {
        if (error.message && error.message !== 'Network request failed') {
            throw error;
        }

        throw new Error('Lỗi không xác định. Vui lòng thử lại.');
    }
};

export const getShipment = async (trackingNumber) => {
    try {
        const url = ENDPOINTS.GET_SHIPMENT(trackingNumber);
        const response = await fetch(url, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
        });

        if (response.status === 404) {
            throw new Error('Không tìm thấy vận đơn này.');
        }

        const json = await response.json();

        if (json.status === 'success' && json.data) {
            return { success: true, data: json.data };
        } else {
            throw new Error('Cấu trúc dữ liệu không hợp lệ');
        }

    } catch (error) {
        if (error.message === 'Không tìm thấy vận đơn này.' || error.message === 'Cấu trúc dữ liệu không hợp lệ') {
            throw error;
        }
        // throw new Error('Lỗi không xác định. Vui lòng thử lại.');
    }
};