import axios from 'axios';
import uuid from 'react-native-uuid';
import { useAuthStore } from '../store/authStore';

const BASE_URL = process.env.EXPO_PUBLIC_BASE_URL + "/api"; 

const axiosClient = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

axiosClient.interceptors.request.use(
  async (config) => {
    // 1. Gắn Token nếu có
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (config.url && config.url.includes('/waybills/export')) {
  config.responseType = 'arraybuffer';
}

    // 2. Gắn Idempotency-Key bắt buộc cho POST và PUT (Yêu cầu của MVP)
    if (config.method === 'post' || config.method === 'put') {
      if (!config.headers['Idempotency-Key']) {
        config.headers['Idempotency-Key'] = uuid.v4();
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

export default axiosClient;
