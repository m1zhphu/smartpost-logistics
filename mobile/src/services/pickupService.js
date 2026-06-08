import { apiClient } from '../context/UserContext';
import { CUSTOMER_ENDPOINTS } from '../constants/customerEndpoints';
import { ADMIN_ENDPOINTS } from '../constants/adminEndpoints';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Customer APIs
export const createCustomerPickup = async (data) => {
    try {
        const response = await apiClient.post(CUSTOMER_ENDPOINTS.CREATE_PICKUP, data);
        return { success: true, data: response.data };
    } catch (error) {
        return { success: false, message: error.response?.data?.detail || error.message };
    }
};

export const getCustomerPickups = async () => {
    try {
        const response = await apiClient.get(CUSTOMER_ENDPOINTS.GET_PICKUPS);
        return { success: true, data: response.data };
    } catch (error) {
        return { success: false, message: error.response?.data?.detail || error.message };
    }
};

export const getCustomerPickupDetail = async (waybillCode) => {
    try {
        const response = await apiClient.get(CUSTOMER_ENDPOINTS.GET_PICKUP_DETAIL(waybillCode));
        return { success: true, data: response.data };
    } catch (error) {
        return { success: false, message: error.response?.data?.detail || error.message };
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

// Shipper APIs
export const getShipperAssignedPickups = async () => {
    try {
        const response = await apiClient.get(ADMIN_ENDPOINTS.GET_ASSIGNED_PICKUPS);
        return { success: true, data: response.data };
    } catch (error) {
        return { success: false, message: error.response?.data?.detail || error.message };
    }
};

export const getShipperPickupDetail = async (requestCode) => {
    try {
        const response = await apiClient.get(ADMIN_ENDPOINTS.GET_PICKUP_DETAIL(requestCode));
        return { success: true, data: response.data };
    } catch (error) {
        return { success: false, message: error.response?.data?.detail || error.message };
    }
};

export const confirmPickup = async (requestCode, imageUrl, note) => {
    try {
        const response = await apiClient.post(ADMIN_ENDPOINTS.CONFIRM_PICKED(requestCode), {
            pickup_image_url: imageUrl,
            note: note || ''
        });
        return { success: true, data: response.data };
    } catch (error) {
        return { success: false, message: error.response?.data?.detail || error.message };
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
        return { success: false, message: error.response?.data?.detail || error.message };
    }
};
