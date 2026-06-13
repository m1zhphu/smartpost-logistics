// src/services/product.js
import { WAREHOUSE_ENDPOINTS } from '../constants/warehouseEndpoints';

export const productService = async (maSanPham) => {
    try {
        const url = WAREHOUSE_ENDPOINTS.GET_MA_MAY(maSanPham);
        const response = await fetch(url, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
        });

        // Nếu API trả về 404
        if (response.status === 404) {
            // Ném ra một object lỗi chứa mã status để bên ngoài dễ nhận diện
            throw { status: 404, message: 'Không tìm thấy mã sản phẩm này' };
        }

        // Nếu API lỗi khác (500...)
        if (!response.ok) {
            throw { status: response.status, message: 'Lỗi server' };
        }

        // FastAPI trả về thẳng object (ProductOut), không có bọc trong 'data'
        const productData = await response.json();

        // Trả về thẳng object đó
        return productData;

    } catch (error) {

        // Ném lỗi ra cho Screen hứng
        throw error;
    }
};
