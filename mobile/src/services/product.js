// src/services/product.js
import { apiClient } from '../context/UserContext';
import { WAREHOUSE_ENDPOINTS } from '../constants/warehouseEndpoints';

export const productService = async (maSanPham) => {
    try {
        const url = WAREHOUSE_ENDPOINTS.GET_MA_MAY(maSanPham);
        const response = await apiClient.get(url);
        
        return response.data;
    } catch (error) {
        if (error.response?.status === 404) {
            throw { status: 404, message: 'Không tìm thấy mã sản phẩm này' };
        }
        
        throw { status: error.response?.status || 500, message: error.response?.data?.detail || 'Lỗi server' };
    }
};
