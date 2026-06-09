import { apiClient } from '../context/UserContext';
import { ADMIN_ENDPOINTS } from '../constants/adminEndpoints';

const buildIdempotencyHeaders = (prefix) => ({
    'Idempotency-Key': `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
});

const getErrorMessage = (error) => {
    const detail = error.response?.data?.detail;
    if (detail) {
        if (Array.isArray(detail)) return detail.map(e => e.msg || JSON.stringify(e)).join(', ');
        if (typeof detail === 'object') return JSON.stringify(detail);
        return String(detail);
    }
    return error.message;
};

// --- API Giao hàng (Delivery) ---

export const getDeliveryTasks = async () => {
    try {
        const response = await apiClient.get(ADMIN_ENDPOINTS.GET_DELIVERY_TASKS);
        return { success: true, data: response.data.items || response.data };
    } catch (error) {
        return { success: false, message: getErrorMessage(error) };
    }
};

export const confirmDelivery = async (waybillCode, actualCodCollected, note, podImageUrl = null) => {
    try {
        const payload = {
            waybill_code: waybillCode,
            actual_cod_collected: actualCodCollected,
            note: note || '',
            pod_image_url: podImageUrl
        };
        const response = await apiClient.post(ADMIN_ENDPOINTS.CONFIRM_DELIVERY, payload, {
            headers: buildIdempotencyHeaders('mobile-shipper-delivery-success')
        });
        return { success: true, data: response.data };
    } catch (error) {
        return { success: false, message: getErrorMessage(error) };
    }
};

export const reportDeliveryFailure = async (waybillCode, reasonCode, note) => {
    try {
        const payload = {
            waybill_code: waybillCode,
            reason_code: reasonCode,
            note: note || ''
        };
        const response = await apiClient.post(ADMIN_ENDPOINTS.REPORT_FAILURE, payload, {
            headers: buildIdempotencyHeaders('mobile-shipper-delivery-fail')
        });
        return { success: true, data: response.data };
    } catch (error) {
        return { success: false, message: getErrorMessage(error) };
    }
};

// --- API Tracking ---
export const getWaybillTimeline = async (waybillCode) => {
    try {
        const response = await apiClient.get(ADMIN_ENDPOINTS.TRACKING_TIMELINE(waybillCode));
        return { success: true, data: response.data };
    } catch (error) {
        return { success: false, message: getErrorMessage(error) };
    }
};
