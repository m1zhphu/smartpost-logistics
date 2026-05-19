import { ENDPOINTS } from '../constants/data';
import { createAuthHeaders, requestJson } from './apiClient';

export const printService = {
    printWaybill: async (token, waybillCode) => {
        return requestJson(
            ENDPOINTS.PRINT_WAYBILL(waybillCode),
            {
                method: 'GET',
                headers: createAuthHeaders(token, { 'Content-Type': 'application/json' }),
            },
            'Khong the in van don.'
        );
    },
};
