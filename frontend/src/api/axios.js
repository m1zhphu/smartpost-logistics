import axios from 'axios';
import { useAuthStore } from '../stores/auth';

const api = axios.create({
  baseURL: '', // Dùng Vite proxy - không cần hardcode localhost:8000
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
    if (error.response?.status === 401) {
      const authStore = useAuthStore();
      authStore.logout();
    }
    return Promise.reject(error);
  }
);

export default api;
