import { ENDPOINTS } from '../constants/data';

export const loginUser = async (username, password, userType = 'employee') => {
    try {
        const loginUrl = userType === 'customer' ? ENDPOINTS.CUSTOMER_LOGIN : ENDPOINTS.EMPLOYEE_LOGIN;
        const response = await fetch(loginUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password }),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error('Tài khoản hoặc mật khẩu không đúng.');
        }
        return { success: true, data };
    } catch (error) {
        if (error.message === 'Tài khoản hoặc mật khẩu không đúng.') {
            throw error;
        }

        throw new Error('Lỗi không xác định. Vui lòng thử lại.');
    }
};

export const requestRegisterOTP = async (email) => {
    try {
        const response = await fetch(ENDPOINTS.REGISTER_OTP, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email }),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.detail || 'Lỗi gửi OTP');
        }

        return { success: true, data };
    } catch (error) {
        throw error;
    }
};

export const verifyRegisterOTP = async (payload) => {
    try {
        const response = await fetch(ENDPOINTS.REGISTER_VERIFY, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.detail || 'Lỗi xác thực OTP');
        }

        return { success: true, data };
    } catch (error) {
        throw error;
    }
};
export const registerUser = async (username, password) => {
    try {
        const response = await fetch(ENDPOINTS.REGISTER, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password }),
        });

        const data = await response.json();

        if (!response.ok) {
            let serverMessage = data.detail || '';

            if (serverMessage.toLowerCase().includes('already exists')) {
                throw new Error('Tên tài khoản đã tồn tại. Vui lòng chọn tên khác.');
            }

            throw new Error(data.detail || 'Đăng ký thất bại. Tên tài khoản có thể đã tồn tại.');
        }

        return { success: true, data };
    } catch (error) {
        if (error.message === 'Tên tài khoản đã tồn tại. Vui lòng chọn tên khác.' ||
            error.message === 'Đăng ký thất bại. Vui lòng thử lại.') {
            throw error;
        }

        throw new Error('Lỗi không xác định. Vui lòng thử lại.');
    }
};