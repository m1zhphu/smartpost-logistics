import { apiClient } from '../context/UserContext';
import { CUSTOMER_ENDPOINTS } from '../constants/customerEndpoints';
import { ADMIN_ENDPOINTS } from '../constants/adminEndpoints';
import { WAREHOUSE_ENDPOINTS } from '../constants/warehouseEndpoints';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

// Customer APIs
export const createCustomerPickup = async (data) => {
    try {
        const response = await apiClient.post(CUSTOMER_ENDPOINTS.CREATE_PICKUP, data, {
            headers: buildIdempotencyHeaders('mobile-customer-pickup')
        });
        return { success: true, data: response.data };
    } catch (error) {
        return { success: false, message: getErrorMessage(error) };
    }
};

export const getCustomerPickups = async () => {
    try {
        const response = await apiClient.get(CUSTOMER_ENDPOINTS.GET_PICKUPS);
        return { success: true, data: response.data };
    } catch (error) {
        return { success: false, message: getErrorMessage(error) };
    }
};

export const getCustomerPickupDetail = async (waybillCode) => {
    try {
        const response = await apiClient.get(CUSTOMER_ENDPOINTS.GET_PICKUP_DETAIL(waybillCode));
        return { success: true, data: response.data };
    } catch (error) {
        return { success: false, message: getErrorMessage(error) };
    }
};

// Drafts
export const savePickupDraft = async (data) => {
    try {
        await AsyncStorage.setItem('customer_pickup_draft', JSON.stringify(data));
        return { success: true };
    } catch (error) {
        return { success: false, message: 'Không thể lưu nháp' };
    }
};

export const getPickupDraft = async () => {
    try {
        const draft = await AsyncStorage.getItem('customer_pickup_draft');
        return draft ? JSON.parse(draft) : null;
    } catch (error) {
        return null;
    }
};

export const clearPickupDraft = async () => {
    await AsyncStorage.removeItem('customer_pickup_draft');
};

const PICKUP_DRAFT_LIST_KEY = 'customer_pickup_drafts';

export const getPickupDrafts = async () => {
    try {
        const drafts = await AsyncStorage.getItem(PICKUP_DRAFT_LIST_KEY);
        return drafts ? JSON.parse(drafts) : [];
    } catch (error) {
        return [];
    }
};

export const savePickupDrafts = async (drafts) => {
    try {
        await AsyncStorage.setItem(PICKUP_DRAFT_LIST_KEY, JSON.stringify(drafts || []));
        return { success: true };
    } catch (error) {
        return { success: false, message: 'Không thể lưu danh sách nháp' };
    }
};

export const upsertPickupDraft = async (draft) => {
    const drafts = await getPickupDrafts();
    const draftId = draft.draft_id || Date.now().toString();
    const nextDraft = { ...draft, draft_id: draftId, updated_at: new Date().toISOString() };
    const index = drafts.findIndex(item => item.draft_id === draftId);
    if (index >= 0) {
        drafts[index] = nextDraft;
    } else {
        drafts.unshift(nextDraft);
    }
    await savePickupDrafts(drafts);
    return nextDraft;
};

export const removePickupDraft = async (draftId) => {
    const drafts = await getPickupDrafts();
    const nextDrafts = drafts.filter(item => item.draft_id !== draftId);
    await savePickupDrafts(nextDrafts);
    return nextDrafts;
};

export const clearPickupDrafts = async () => {
    await AsyncStorage.removeItem(PICKUP_DRAFT_LIST_KEY);
};

export const createPickupBag = async (payload) => {
    try {
        const response = await apiClient.post(WAREHOUSE_ENDPOINTS.CREATE_PICKUP_BAG, payload, {
            headers: buildIdempotencyHeaders('mobile-pickup-bag')
        });
        return { success: true, data: response.data };
    } catch (error) {
        return { success: false, message: getErrorMessage(error) };
    }
};

export const closePickupBag = async (bagCode) => {
    try {
        const response = await apiClient.post(WAREHOUSE_ENDPOINTS.CLOSE_PICKUP_BAG(bagCode));
        return { success: true, data: response.data };
    } catch (error) {
        return { success: false, message: getErrorMessage(error) };
    }
};

// Shipper APIs
export const getShipperAssignedPickups = async () => {
    try {
        const response = await apiClient.get(ADMIN_ENDPOINTS.GET_ASSIGNED_PICKUPS);
        return { success: true, data: response.data };
    } catch (error) {
        return { success: false, message: getErrorMessage(error) };
    }
};

export const getShipperPickupDetail = async (requestCode) => {
    try {
        const response = await apiClient.get(ADMIN_ENDPOINTS.GET_PICKUP_DETAIL(requestCode));
        return { success: true, data: response.data };
    } catch (error) {
        return { success: false, message: getErrorMessage(error) };
    }
};

export const confirmPickup = async (requestCode, imageUrl, note) => {
    try {
        const response = await apiClient.post(ADMIN_ENDPOINTS.CONFIRM_PICKED(requestCode), {
            pickup_image_url: imageUrl,
            note: note || ''
        }, {
            headers: buildIdempotencyHeaders('mobile-shipper-picked')
        });
        return { success: true, data: response.data };
    } catch (error) {
        return { success: false, message: getErrorMessage(error) };
    }
};

export const uploadPickupImage = async (file) => {
    try {
        const formData = new FormData();
        formData.append('file', {
            uri: file.uri,
            name: file.name || `pickup-${Date.now()}.jpg`,
            type: file.type || 'image/jpeg'
        });

        const response = await apiClient.post(ADMIN_ENDPOINTS.UPLOAD_PICKUP_IMAGE, formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });

        return { success: true, data: response.data };
    } catch (error) {
        return { success: false, message: getErrorMessage(error) };
    }
};

export const sendGpsLocation = async (latitude, longitude, accuracy, note) => {
    try {
        const response = await apiClient.post(ADMIN_ENDPOINTS.SEND_GPS_LOCATION, {
            latitude,
            longitude,
            accuracy,
            note
        });
        return { success: true, data: response.data };
    } catch (error) {
        return { success: false, message: getErrorMessage(error) };
    }
};

// Pricing APIs
export const fetchExtraServices = async () => {
    try {
        const response = await apiClient.get(CUSTOMER_ENDPOINTS.GET_EXTRA_SERVICES);
        return { success: true, data: response.data };
    } catch (error) {
        return { success: false, message: error.message };
    }
};

export const simulatePrice = async (payload) => {
    try {
        const response = await apiClient.post(CUSTOMER_ENDPOINTS.SIMULATE_PRICE, payload);
        return { success: true, data: response.data };
    } catch (error) {
        return { success: false, message: getErrorMessage(error) };
    }
};
