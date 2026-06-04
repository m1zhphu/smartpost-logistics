import { apiClient } from '../context/UserContext';
import { ENDPOINTS } from '../constants/data';

export const vehicleService = {
    getVehicles: async (search = '', status = '') => {
        return await apiClient.get(`${ENDPOINTS.GET_VEHICLES}?search=${encodeURIComponent(search)}&status=${status}`);
    },
    assignVehicle: async (bienSoXe, shipperUsername = null) => {
        return await apiClient.post(ENDPOINTS.FLEET_ASSIGN, {
            bien_so_xe: bienSoXe,
            username_tai_xe: shipperUsername
        });
    },
    returnVehicle: async () => {
        return await apiClient.post(ENDPOINTS.FLEET_RETURN);
    }
};