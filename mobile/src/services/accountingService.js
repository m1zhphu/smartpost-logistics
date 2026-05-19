import { ENDPOINTS } from '../constants/data';
import { createAuthHeaders, requestJson } from './apiClient';

export const accountingService = {
    getCashConfirmationList: async (token) => {
        return requestJson(
            ENDPOINTS.GET_CASH_CONFIRMATION_LIST,
            {
                method: 'GET',
                headers: createAuthHeaders(token, { 'Content-Type': 'application/json' }),
            },
            'Khong the tai danh sach doi soat COD.'
        );
    },

    confirmShipperCash: async (token, waybillCodes, note) => {
        return requestJson(
            ENDPOINTS.CONFIRM_SHIPPER_CASH,
            {
                method: 'POST',
                headers: createAuthHeaders(token, { 'Content-Type': 'application/json' }),
                body: JSON.stringify({
                    waybill_codes: waybillCodes,
                    note: note || 'Xac nhan thu tien mat',
                }),
            },
            'Khong the xac nhan thu tien shipper.'
        );
    },

    createShopStatement: async (token, customerId) => {
        return requestJson(
            ENDPOINTS.CREATE_SHOP_STATEMENT(customerId),
            {
                method: 'POST',
                headers: createAuthHeaders(token, { 'Content-Type': 'application/json' }),
            },
            'Khong the tao bang ke doi soat cho shop.'
        );
    },

    getExportStatementUrl: (statementId, token) => {
        return ENDPOINTS.EXPORT_STATEMENT(statementId, token);
    },
};
