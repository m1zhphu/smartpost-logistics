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

        // React Native must generate the multipart boundary automatically.
        const response = await apiClient.post(ADMIN_ENDPOINTS.UPLOAD_PICKUP_IMAGE, formData);

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

// Internal admin pickup flow APIs
export const getOnlinePickupRequests = async (status) => {
    try {
        const response = await apiClient.get(ADMIN_ENDPOINTS.GET_ONLINE_PICKUP_REQUESTS, {
            params: { status }
        });
        return { success: true, data: response.data };
    } catch (error) {
        return { success: false, message: getErrorMessage(error) };
    }
};

/**
 * Luồng chính (web frontend đang dùng):
 * Admin chọn nhiều đơn PENDING_CONFIRMATION -> gọi dispatch-hub -> đơn thành DISPATCHED_TO_HUB
 * Sau đó hub sẽ accept/reject.
 */
export const dispatchOnlinePickupRequests = async (requestIds, hubId, note) => {
    try {
        const response = await apiClient.post(ADMIN_ENDPOINTS.DISPATCH_HUB, {
            request_ids: requestIds,
            hub_id: hubId,
            note: note || ''
        }, {
            headers: buildIdempotencyHeaders('mobile-dispatch-hub')
        });
        return { success: true, data: response.data };
    } catch (error) {
        return { success: false, message: getErrorMessage(error) };
    }
};

/**
 * Luồng rút gọn (không qua bước hub accept/reject):
 * Admin xác nhận văn phòng nhận trực tiếp PENDING_CONFIRMATION -> RECEIVED.
 * Dùng khi muốn bỏ qua bước hub xác nhận.
 */
export const confirmHubDirect = async (requestIds, hubId, note) => {
    try {
        const response = await apiClient.post(ADMIN_ENDPOINTS.CONFIRM_HUB, {
            request_ids: requestIds,
            hub_id: hubId,
            note: note || ''
        }, {
            headers: buildIdempotencyHeaders('mobile-confirm-hub')
        });
        return { success: true, data: response.data };
    } catch (error) {
        return { success: false, message: getErrorMessage(error) };
    }
};

export const getHubDispatchRequests = async (status = 'DISPATCHED_TO_HUB', hubId) => {
    try {
        const response = await apiClient.get(ADMIN_ENDPOINTS.GET_HUB_DISPATCH_REQUESTS, {
            params: {
                status,
                ...(hubId ? { hub_id: hubId } : {})
            }
        });
        return { success: true, data: response.data };
    } catch (error) {
        return { success: false, message: getErrorMessage(error) };
    }
};

export const acceptHubDispatchRequest = async (requestCode, note) => {
    try {
        const response = await apiClient.post(ADMIN_ENDPOINTS.ACCEPT_HUB_DISPATCH(requestCode), {
            note: note || ''
        }, {
            headers: buildIdempotencyHeaders('mobile-accept-hub-dispatch')
        });
        return { success: true, data: response.data };
    } catch (error) {
        return { success: false, message: getErrorMessage(error) };
    }
};

export const rejectHubDispatchRequest = async (requestCode, note) => {
    try {
        const response = await apiClient.post(ADMIN_ENDPOINTS.REJECT_HUB_DISPATCH(requestCode), {
            note: note || ''
        }, {
            headers: buildIdempotencyHeaders('mobile-reject-hub-dispatch')
        });
        return { success: true, data: response.data };
    } catch (error) {
        return { success: false, message: getErrorMessage(error) };
    }
};

export const getHubPickupRequests = async (status = 'RECEIVED', hubId) => {
    try {
        const response = await apiClient.get(ADMIN_ENDPOINTS.GET_HUB_PICKUP_REQUESTS, {
            params: {
                status,
                ...(hubId ? { hub_id: hubId } : {})
            }
        });
        return { success: true, data: response.data };
    } catch (error) {
        return { success: false, message: getErrorMessage(error) };
    }
};

export const getActiveHubs = async () => {
    try {
        const response = await apiClient.get(ADMIN_ENDPOINTS.GET_HUBS);
        const activeHubs = Array.isArray(response.data)
            ? response.data.filter((hub) => hub.status !== false)
            : [];
        return { success: true, data: activeHubs };
    } catch (error) {
        return { success: false, message: getErrorMessage(error) };
    }
};

export const getAssignableShippers = async ({ hubId, isOnline = true, managedByCurrentCskh = false } = {}) => {
    try {
        const response = await apiClient.get(ADMIN_ENDPOINTS.GET_SHIPPERS, {
            params: {
                ...(hubId ? { hub_id: hubId } : {}),
                ...(typeof isOnline === 'boolean' ? { is_online: isOnline } : {}),
                ...(managedByCurrentCskh ? { managed_by_current_cskh: true } : {})
            }
        });
        return { success: true, data: response.data };
    } catch (error) {
        return { success: false, message: getErrorMessage(error) };
    }
};

export const assignPickupShipper = async (requestCode, shipperId, note) => {
    try {
        const response = await apiClient.post(ADMIN_ENDPOINTS.ASSIGN_PICKUP_SHIPPER(requestCode), {
            shipper_id: shipperId,
            note: note || ''
        }, {
            headers: buildIdempotencyHeaders('mobile-assign-pickup-shipper')
        });
        return { success: true, data: response.data };
    } catch (error) {
        return { success: false, message: getErrorMessage(error) };
    }
};

/**
 * Luồng 2: Admin/CSKH/Hotline tạo pickup thay khách hàng.
 * POST /api/waybills/admin/pickups
 * Nếu có target_hub_id -> pickup_status = RECEIVED (đã xác nhận văn phòng).
 * Nếu không có target_hub_id -> pickup_status = PENDING_CONFIRMATION.
 */
export const createAdminPickup = async (data) => {
    try {
        const response = await apiClient.post(ADMIN_ENDPOINTS.ADMIN_CREATE_PICKUP, data, {
            headers: buildIdempotencyHeaders('mobile-admin-pickup')
        });
        return { success: true, data: response.data };
    } catch (error) {
        return { success: false, message: getErrorMessage(error) };
    }
};
