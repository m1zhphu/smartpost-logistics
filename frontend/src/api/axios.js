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
    if (authStore.selectedHubId) {
      config.headers['X-Selected-Hub-Id'] = authStore.selectedHubId;
    }

    // Thêm Idempotency-Key cho các request POST để chống trùng lặp (Backend yêu cầu)
    if (config.method?.toLowerCase() === 'post') {
      if (!config.headers['Idempotency-Key']) {
        config.headers['Idempotency-Key'] = `idem-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      }
    }

    // Tự động hoán đổi mã phí bảo hiểm (PBHVCHGTC <-> PBHVCHGTC2) dựa trên giá trị khai giá
    if (config.data) {
      let reqData = {};
      try {
        reqData = typeof config.data === 'string' ? JSON.parse(config.data) : (config.data || {});
      } catch (e) {
        // ignore
      }

      if (reqData.extra_services) {
        let totalDeclaredValue = Number(reqData.declared_value || 0);
        if (Array.isArray(reqData.items)) {
          totalDeclaredValue = reqData.items.reduce((sum, item) => {
            const val = Number(item.declared_value || 0);
            const qty = Number(item.quantity || 1);
            return sum + (val * qty);
          }, 0);
        }
        if (totalDeclaredValue === 0 && reqData.cod_amount) {
          totalDeclaredValue = Number(reqData.cod_amount);
        }

        const isHighValueTier = totalDeclaredValue > 20000000;

        if (Array.isArray(reqData.extra_services)) {
          reqData.extra_services = reqData.extra_services.map(item => {
            if (typeof item === 'string') {
              if (isHighValueTier && item === 'PBHVCHGTC') return 'PBHVCHGTC2';
              if (!isHighValueTier && item === 'PBHVCHGTC2') return 'PBHVCHGTC';
              return item;
            } else if (item && typeof item === 'object') {
              if (isHighValueTier && item.service_code === 'PBHVCHGTC') {
                return {
                  ...item,
                  service_code: 'PBHVCHGTC2',
                  service_name: 'Phí bảo hiểm vận chuyển hàng giá trị cao (trên 20M)'
                };
              }
              if (!isHighValueTier && item.service_code === 'PBHVCHGTC2') {
                return {
                  ...item,
                  service_code: 'PBHVCHGTC',
                  service_name: 'Phí bảo hiểm vận chuyển hàng giá trị cao'
                };
              }
              return item;
            }
            return item;
          });
        }

        if (typeof config.data === 'string') {
          config.data = JSON.stringify(reqData);
        } else {
          config.data = reqData;
        }
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

let cachedServices = [];
const hardcodedServices = {
  'PBP': { type: 'FIXED', val: 5000 },
  'PPTT': { type: 'FIXED', val: 10000 },
  'PHD': { type: 'FIXED', val: 10000 },
  'PBHVCHGTC': { type: 'PERCENT', val: 1.5, base: 'DECLARED_VALUE' },
  'PBHVCHGTC2': { type: 'PERCENT', val: 2.5, base: 'DECLARED_VALUE', min_fee: 100000 },
  'CPTTDN': { type: 'PERCENT', val: 2.0, base: 'MAIN_FEE' },
  'PHQK': { type: 'PERCENT', val: 20.0, base: 'MAIN_FEE' },
  'CPCH': { type: 'PERCENT', val: 100.0, base: 'MAIN_FEE' }
};

// Pre-fetch active service configurations
api.get('/api/pricing/extra-services')
  .then(res => {
    cachedServices = res.data || [];
  })
  .catch(err => {
    console.error('Failed to pre-fetch active services configurations:', err);
  });

// Response Interceptor: Handle errors and override backend pricing miscalculations
api.interceptors.response.use(
  (response) => {
    const url = response.config?.url || '';

    // Cấu hình hiển thị danh sách dịch vụ hoạt động trả về FE
    if (url.includes('/api/pricing/extra-services') && Array.isArray(response.data)) {
      // 1. Lưu cấu hình gốc để dùng cho tính toán
      cachedServices = JSON.parse(JSON.stringify(response.data));

      // 2. Sửa lại calculation_base hiển thị cho chuẩn với thực tế tính toán
      response.data = response.data.map(s => {
        if (s.service_code === 'CPTTDN' || s.service_code === 'PHQK' || s.service_code === 'CPCH') {
          return { ...s, calculation_base: 'MAIN_FEE' };
        }
        if (s.service_code === 'PBHVCHGTC2') {
          return { ...s, calculation_base: 'DECLARED_VALUE' };
        }
        return s;
      });

      // 3. Nếu ở giao diện khách hàng (không phải admin), ẩn bớt PBHVCHGTC2 để tránh trùng lặp
      const isAdminPage = window.location.pathname.includes('/admin');
      if (!isAdminPage) {
        response.data = response.data.filter(s => s.service_code !== 'PBHVCHGTC2');
      }
      return response;
    }

    // Intercept và sửa đổi kết quả tính phí/mô phỏng phí của dịch vụ gia tăng ở Frontend
    if ((url.includes('/api/pricing/simulate') || url.includes('/api/pricing/calculate')) && response.data) {
      let reqData = {};
      try {
        reqData = typeof response.config.data === 'string' ? JSON.parse(response.config.data) : (response.config.data || {});
      } catch (e) {
        // ignore
      }

      const extraServices = reqData.extra_services || [];
      if (extraServices.length > 0) {
        const mainFee = Number(response.data.main_fee || 0);
        const fuelSurcharge = Number(response.data.fuel_surcharge || 0);
        const packingFee = Number(response.data.packing_fee || 0);
        const remoteFee = Number(response.data.remote_fee || 0);
        const codAmount = Number(reqData.cod_amount || 0);
        const declaredValue = Number(reqData.declared_value !== undefined ? reqData.declared_value : (reqData.cod_amount || 0));
        const quantity = Number(reqData.quantity || 1);

        let correctedExtraFee = 0;
        extraServices.forEach(code => {
          const config = cachedServices.find(s => s.service_code === code);
          if (config) {
            const val = parseFloat(config.fee_value || 0);
            if (config.fee_type === 'FIXED') {
              correctedExtraFee += val;
            } else if (config.fee_type === 'PERCENT') {
              let baseVal = 0;
              if (code === 'CPTTDN' || code === 'PHQK' || code === 'CPCH') {
                baseVal = mainFee;
              } else if (code === 'PBHVCHGTC' || code === 'PBHVCHGTC2') {
                baseVal = declaredValue;
              } else {
                const base = config.calculation_base;
                if (base === 'DECLARED_VALUE') baseVal = declaredValue;
                else if (base === 'MAIN_FEE') baseVal = mainFee;
                else if (base === 'COD_AMOUNT') baseVal = codAmount;
                else if (base === 'QUANTITY') baseVal = quantity;
                else baseVal = 1;
              }
              let serviceFee = baseVal * (val / 100);
              if (config.min_fee && serviceFee > 0) {
                serviceFee = Math.max(serviceFee, parseFloat(config.min_fee));
              }
              correctedExtraFee += serviceFee;
            } else if (config.fee_type === 'PER_ITEM') {
              correctedExtraFee += val * Math.max(1, quantity);
            }
          } else {
            // Hardcoded fallback
            const fallback = hardcodedServices[code];
            if (fallback) {
              if (fallback.type === 'FIXED') {
                correctedExtraFee += fallback.val;
              } else if (fallback.type === 'PERCENT') {
                let baseVal = 0;
                if (fallback.base === 'MAIN_FEE') baseVal = mainFee;
                else if (fallback.base === 'DECLARED_VALUE') baseVal = declaredValue;
                else baseVal = 1;
                let serviceFee = baseVal * (fallback.val / 100);
                if (fallback.min_fee && serviceFee > 0) {
                  serviceFee = Math.max(serviceFee, fallback.min_fee);
                }
                correctedExtraFee += serviceFee;
              }
            }
          }
        });

        // Recalculate VAT & Total
        const taxable = mainFee + fuelSurcharge + correctedExtraFee + packingFee + remoteFee;
        const vatPercent = 8.0;
        const vatAmount = Math.round(taxable * (vatPercent / 100));

        response.data.extra_fee = correctedExtraFee;
        response.data.vat = vatAmount;
        if (response.data.grand_total !== undefined) {
          response.data.grand_total = taxable + vatAmount;
        }
        if (response.data.total !== undefined) {
          response.data.total = taxable + vatAmount;
        }
      }
    }
    return response;
  },
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
