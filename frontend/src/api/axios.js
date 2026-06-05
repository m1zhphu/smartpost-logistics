import axios from 'axios';
import { useAuthStore } from '../stores/auth';
import { ElMessage } from 'element-plus';

let authInvalidHandled = false;

const api = axios.create({
  // Tự động lấy URL từ file .env, nếu không có thì để trống (cho proxy)
  baseURL: import.meta.env.VITE_API_URL || '', 
  timeout: 30000,
});

// Request Interceptor: Attach JWT and Idempotency-Key
api.interceptors.request.use(
  (config) => {
    const authStore = useAuthStore();
    if (authStore.token) {
      config.headers.Authorization = `Bearer ${authStore.token}`;
    }
    
    // Thêm Idempotency-Key cho các request POST để chống trùng lặp (Backend yêu cầu)
    if (config.method?.toLowerCase() === 'post') {
      if (!config.headers['Idempotency-Key']) {
        config.headers['Idempotency-Key'] = `idem-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      }
    }
    
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const isAuthInvalid = error.response?.headers?.['x-auth-invalid'] === '1';
    const requestUrl = error.config?.url || '';
    const isLoginRequest = requestUrl.includes('/api/auth/login');
    if (!isLoginRequest && (status === 401 || isAuthInvalid) && !authInvalidHandled) {
      authInvalidHandled = true;
      const authStore = useAuthStore();
      const message = error.response?.data?.detail || 'Phiên đăng nhập đã hết hạn hoặc tài khoản không còn được phép truy cập';
      ElMessage.error(message);
      authStore.logout();
      setTimeout(() => {
        authInvalidHandled = false;
      }, 1000);
    }
    return Promise.reject(error);
  }
);

export default api;
