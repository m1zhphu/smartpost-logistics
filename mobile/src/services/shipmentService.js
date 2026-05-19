import { ENDPOINTS } from '../constants/data';
import { createAuthHeaders, requestJson } from './apiClient';

export const submitShipment = async (token, payload) => {
    try {
        const data = await requestJson(
            ENDPOINTS.SUBMIT,
            {
                method: 'POST',
                headers: createAuthHeaders(token, { 'Content-Type': 'application/json' }),
                body: JSON.stringify(payload),
            },
            'Lỗi khi lưu đơn hàng.'
        );

        return { success: true, data };
    } catch (error) {
        throw error;
    }
};

export const getShipment = async (token, trackingNumber) => {
    const data = await requestJson(
        ENDPOINTS.GET_SHIPMENT(trackingNumber),
        {
            method: 'GET',
            headers: createAuthHeaders(token, { 'Content-Type': 'application/json' }),
        },
        'Không tìm thấy vận đơn này.'
    );

    return { success: true, data };
};