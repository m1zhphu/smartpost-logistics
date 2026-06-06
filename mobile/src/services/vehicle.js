import { apiClient } from '../context/UserContext';
import { WAREHOUSE_ENDPOINTS } from '../constants/warehouseEndpoints';

export const vehicleService = {
    getVehicles: async (search = '', status = '') => {
        return await apiClient.get(`${WAREHOUSE_WAREHOUSE_ENDPOINTS.GET_VEHICLES}?search=${encodeURIComponent(search)}&status=${status}`);
    },
    assignVehicle: async (bienSoXe, shipperUsername = null) => {
        return await apiClient.post(WAREHOUSE_WAREHOUSE_ENDPOINTS.FLEET_ASSIGN, {
            bien_so_xe: bienSoXe,
            username_tai_xe: shipperUsername
        });
    },
    returnVehicle: async () => {
        return await apiClient.post(WAREHOUSE_WAREHOUSE_ENDPOINTS.FLEET_RETURN);
    }
};