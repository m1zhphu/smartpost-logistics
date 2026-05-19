<template>
  <div class="modern-waybill-create">
    <div class="page-container">
      
      <!-- Header Section -->
      <header class="page-header animate-fade-in">
        <div class="header-content">
          <button class="btn-icon-back" @click="$router.back()" title="Quay lại">
            <el-icon><ArrowLeft /></el-icon>
          </button>
          <div class="title-wrapper">
            <h2 class="page-title">Lập phiếu gửi hàng mới</h2>
            <p class="page-subtitle">Nhập thông tin người nhận và hàng hóa để tạo mã vận đơn</p>
          </div>
        </div>
        <div class="header-actions">
          <button class="btn-secondary" @click="saveWaybill(false)" :disabled="loading">
            <el-icon><DocumentAdd /></el-icon>
            <span>Tạm lưu (F8)</span>
          </button>
          <button class="btn-primary" @click="saveWaybill(true)" :disabled="loading">
            <el-icon class="is-loading mr-2" v-if="loading"><Loading /></el-icon>
            <el-icon v-else><Printer /></el-icon>
            <span>{{ loading ? 'Đang xử lý...' : 'Cất & In Tem (F9)' }}</span>
          </button>
        </div>
      </header>

      <!-- Main Form Area (2-Column Layout) -->
      <el-form :model="waybillForm" :rules="rules" ref="formRef" label-position="top" class="modern-form animate-fade-in-up">
        <el-row :gutter="24" class="form-row-container">
          
          <!-- LEFT COLUMN (60%): Routing & Contact Info -->
          <el-col :span="14" class="column-layout">
            
            <!-- Block 1: Routing & Sender -->
            <div class="content-card compact-card">
              <div class="section-header">
                <el-icon><Guide /></el-icon><span>Tuyến đường & Người gửi</span>
              </div>
              
              <el-row :gutter="16">
                <el-col :span="14">
                  <el-form-item label="Khách hàng gửi (Shop)" prop="customer_id" class="mb-12">
                    <el-select v-model="waybillForm.customer_id" placeholder="Tìm tên shop hoặc mã KH..." filterable class="w-full" @change="handleCustomerChange">
                      <template #prefix><el-icon><Shop /></el-icon></template>
                      <el-option v-for="shop in customers" :key="shop.customer_id || shop.id" :label="shop.company_name || shop.name" :value="shop.customer_id || shop.id" />
                    </el-select>
                  </el-form-item>
                </el-col>
                <el-col :span="10">
                  <el-form-item label="Dịch vụ vận chuyển" prop="service_type" class="mb-12">
                    <el-radio-group v-model="waybillForm.service_type" class="custom-radio-group w-full">
                      <el-radio-button value="EXPRESS">Hoả tốc</el-radio-button>
                      <el-radio-button value="STANDARD">Tiêu chuẩn</el-radio-button>
                    </el-radio-group>
                  </el-form-item>
                </el-col>
              </el-row>
              <el-row :gutter="16">
                <el-col :span="10">
                  <el-form-item label="SĐT người gửi" prop="sender_phone" class="mb-12">
                    <el-input v-model="waybillForm.sender_phone" placeholder="VD: 09xxxxxxx" clearable>
                      <template #prefix><el-icon><Phone /></el-icon></template>
                    </el-input>
                  </el-form-item>
                </el-col>
                <el-col :span="14">
                  <el-form-item label="Tên người gửi" prop="sender_name" class="mb-12">
                    <el-input v-model="waybillForm.sender_name" placeholder="Họ và tên..." clearable>
                      <template #prefix><el-icon><User /></el-icon></template>
                    </el-input>
                  </el-form-item>
                </el-col>
              </el-row>

              <el-form-item label="Địa chỉ gửi hàng" prop="sender_address" class="mb-12">
                <el-input 
                  v-model="waybillForm.sender_address" 
                  type="textarea" 
                  :rows="2" 
                  placeholder="Địa chỉ gửi..." 
                  resize="none"
                />
              </el-form-item>

              <el-row :gutter="16">
                <el-col :span="12">
                  <el-form-item label="Bưu cục gửi (Origin)" prop="origin_hub_id" class="mb-0">
                    <el-select v-model="waybillForm.origin_hub_id" placeholder="Chọn bưu cục gửi..." filterable class="w-full" :disabled="auth.user?.role_id !== 1">
                      <template #prefix><el-icon><LocationInformation /></el-icon></template>
                      <el-option v-for="hub in hubs" :key="hub.hub_id" :label="hub.hub_code + ' - ' + hub.hub_name" :value="hub.hub_id" />
                    </el-select>
                    <div v-if="auth.user?.role_id !== 1" class="helper-text mt-1 text-primary">Cố định tại bưu cục của bạn.</div>
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="Bưu cục nhận (Destination)" prop="dest_hub_id" class="mb-0">
                    <el-select v-model="waybillForm.dest_hub_id" placeholder="Chọn bưu cục đích..." filterable class="w-full">
                      <template #prefix><el-icon><Location /></el-icon></template>
                      <el-option v-for="hub in hubs" :key="hub.hub_id" :label="hub.hub_code + ' - ' + hub.hub_name" :value="hub.hub_id" />
                    </el-select>
                  </el-form-item>
                </el-col>
              </el-row>
            </div>

            <!-- Block 2: Receiver Info -->
            <div class="content-card compact-card flex-fill">
              <div class="section-header">
                <el-icon><Avatar /></el-icon><span>Thông tin Người nhận</span>
              </div>
              
              <el-row :gutter="16">
                <el-col :span="10">
                  <el-form-item label="Số điện thoại nhận" prop="receiver_phone" class="mb-12">
                    <el-input ref="phoneInputRef" v-model="waybillForm.receiver_phone" placeholder="VD: 09xxxxxxx" clearable @blur="handleReceiverPhoneBlur">
                      <template #prefix><el-icon><Phone /></el-icon></template>
                    </el-input>
                  </el-form-item>
                </el-col>
                <el-col :span="14">
                  <el-form-item label="Họ tên người nhận" prop="receiver_name" class="mb-12">
                    <el-input v-model="waybillForm.receiver_name" placeholder="Họ và tên đầy đủ..." clearable>
                      <template #prefix><el-icon><User /></el-icon></template>
                    </el-input>
                  </el-form-item>
                </el-col>
              </el-row>
              
              <el-form-item label="Địa chỉ giao hàng chi tiết" prop="receiver_address" class="mb-0">
                <el-input 
                  v-model="waybillForm.receiver_address" 
                  type="textarea" 
                  :rows="3" 
                  placeholder="Số nhà, tên đường, Phường/Xã, Quận/Huyện, Tỉnh/Thành phố..." 
                  resize="none"
                />
              </el-form-item>
            </div>
          </el-col>

          <!-- RIGHT COLUMN (40%): Package, Finance & Summary -->
          <el-col :span="10" class="column-layout">
            
            <!-- Block 3: Package & COD -->
            <div class="content-card compact-card">
              <div class="section-header">
                <el-icon><Box /></el-icon><span>Hàng hóa & Thanh toán</span>
              </div>
              
              <el-row :gutter="16">
                <el-col :span="10">
                  <el-form-item label="Khối lượng (kg)" prop="actual_weight" class="mb-12">
                    <el-input-number v-model="waybillForm.actual_weight" :min="0.1" :step="0.1" class="w-full modern-input-number fw-bold" />
                  </el-form-item>
                </el-col>
                <el-col :span="14">
                  <el-form-item label="Tiền thu hộ (COD)" prop="cod_amount" class="mb-12">
                    <el-input-number 
                      v-model="waybillForm.cod_amount" 
                      :min="0" :step="1000" 
                      class="w-full modern-price-input" 
                      :controls="false"
                      :formatter="(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')"
                      :parser="(value) => value.replace(/\$\s?|(\.*)/g, '')"
                    />
                  </el-form-item>
                </el-col>
              </el-row>

              <el-row :gutter="16">
                <el-col :span="8">
                  <el-form-item label="Dài (cm)" prop="length" class="mb-12">
                    <el-input-number v-model="waybillForm.length" :min="0" :step="1" :controls="false" class="w-full modern-input-number" />
                  </el-form-item>
                </el-col>
                <el-col :span="8">
                  <el-form-item label="Rộng (cm)" prop="width" class="mb-12">
                    <el-input-number v-model="waybillForm.width" :min="0" :step="1" :controls="false" class="w-full modern-input-number" />
                  </el-form-item>
                </el-col>
                <el-col :span="8">
                  <el-form-item label="Cao (cm)" prop="height" class="mb-12">
                    <el-input-number v-model="waybillForm.height" :min="0" :step="1" :controls="false" class="w-full modern-input-number" />
                  </el-form-item>
                </el-col>
              </el-row>

              <el-row :gutter="16">
                <el-col :span="14">
                  <el-form-item label="Tên sản phẩm" prop="product_name" class="mb-12">
                    <el-input v-model="waybillForm.product_name" placeholder="Quần áo, điện tử..." clearable />
                  </el-form-item>
                </el-col>
                <el-col :span="10">
                  <el-form-item label="Người trả phí" prop="payment_method" class="mb-12">
                    <el-select v-model="waybillForm.payment_method" class="w-full">
                      <el-option label="Người gửi trả" value="SENDER_PAY" />
                      <el-option label="Người nhận trả" value="RECEIVER_PAY" />
                    </el-select>
                  </el-form-item>
                </el-col>
              </el-row>

              <el-form-item label="Ghi chú đơn hàng" class="mb-0">
                <el-input v-model="waybillForm.note" placeholder="Cho xem hàng, không thử; giao giờ hành chính..." clearable />
              </el-form-item>
            </div>

            <!-- Block 4: Summary & Extra Services -->
            <div class="content-card compact-card flex-fill summary-section" v-loading="feeLoading">
              <div class="section-header flex-between mb-8">
                <div class="flex-center gap-2">
                  <el-icon><Money /></el-icon><span>Tổng cước phí</span>
                </div>
                <el-tag v-if="pricingSource && pricingSource !== 'chưa có bảng giá'" size="small" type="success" effect="plain" round class="fw-bold">
                  Hợp lệ
                </el-tag>
              </div>

              <!-- Extra Services inline -->
              <div class="inline-services" v-loading="servicesLoading">
                <span class="service-label">Dịch vụ thêm:</span>
                <el-checkbox-group v-model="waybillForm.extra_services" class="compact-service-group">
                  <el-checkbox v-for="srv in availableServices" :key="srv.service_code" :value="srv.service_code" class="compact-checkbox">
                    {{ srv.service_name }}
                  </el-checkbox>
                </el-checkbox-group>
              </div>

              <div class="pricing-status-box mb-12">
                <div v-if="pricingSource === 'chưa có bảng giá'" class="error-box">
                  <el-icon><Warning /></el-icon> Chưa có bảng giá cho tuyến này
                </div>
                <div v-else-if="pricingSource" class="success-box text-truncate">
                  <el-icon><CircleCheckFilled /></el-icon> Áp dụng: <strong>{{ pricingSource }}</strong>
                </div>
              </div>

              <div class="summary-details">
                <div class="summary-line" v-if="chargeWeight > 0 && chargeWeight > waybillForm.actual_weight">
                  <span class="label text-primary">Tính cước theo (Thể tích):</span>
                  <span class="value text-primary">{{ chargeWeight }} kg</span>
                </div>
                <div class="summary-line">
                  <span class="label">Cước chính:</span>
                  <span class="value">{{ (estimatedFees.main_fee || 0).toLocaleString() }} đ</span>
                </div>
                <div class="summary-line" v-if="estimatedFees.extra_fee > 0">
                  <span class="label text-primary">Phí Dịch vụ:</span>
                  <span class="value text-primary">{{ (estimatedFees.extra_fee || 0).toLocaleString() }} đ</span>
                </div>
                <div class="summary-line">
                  <span class="label">P.phí Vùng sâu/xa:</span>
                  <span class="value">{{ (estimatedFees.remote_fee || 0).toLocaleString() }} đ</span>
                </div>
                <div class="summary-line">
                  <span class="label">Thuế VAT:</span>
                  <span class="value">{{ (estimatedFees.vat || 0).toLocaleString() }} đ</span>
                </div>
                
                <div class="divider-dashed"></div>
                
                <div class="summary-line total-line">
                  <span class="label">TỔNG CỘNG:</span>
                  <span class="value total-amount">{{ totalFee.toLocaleString() }} đ</span>
                </div>
              </div>
            </div>

          </el-col>
        </el-row>
      </el-form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch, nextTick } from 'vue';
import { 
  ArrowLeft, User, Box, DocumentAdd, Printer, 
  CircleCheckFilled, Money, Service, Shop, Guide,
  LocationInformation, Location, Avatar, Phone, Warning, Loading
} from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import api from '@/api/axios';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth'; 

const auth = useAuthStore(); 
const router = useRouter();
const formRef = ref(null);
const phoneInputRef = ref(null); 
const loading = ref(false);

const customers = ref([]);
const hubs = ref([]);
const availableServices = ref([]); 
const servicesLoading = ref(false);

const initialFormState = {
  service_type: 'STANDARD',
  sender_name: '',
  sender_phone: '',
  sender_address: '',
  receiver_name: '',
  receiver_phone: '',
  receiver_address: '',
  actual_weight: 0.5,
  length: 0,
  width: 0,
  height: 0,
  product_name: '',
  payment_method: 'SENDER_PAY',
  cod_amount: 0,
  note: '',
  extra_services: []
};

const waybillForm = reactive({
  customer_id: null,
  origin_hub_id: null,
  dest_hub_id: null,
  ...initialFormState
});

const rules = {
  customer_id: [{ required: true, message: 'Vui lòng chọn khách hàng', trigger: 'change' }],
  origin_hub_id: [{ required: true, message: 'Chọn bưu cục gửi', trigger: 'change' }],
  dest_hub_id: [{ required: true, message: 'Chọn bưu cục nhận', trigger: 'change' }],
  receiver_name: [{ required: true, message: 'Nhập người nhận', trigger: 'blur' }],
  receiver_phone: [
    { required: true, message: 'Nhập SĐT', trigger: 'blur' },
    { pattern: /^[0-9]{10}$/, message: 'SĐT gồm 10 chữ số', trigger: 'blur' }
  ],
  receiver_address: [{ required: true, message: 'Nhập địa chỉ', trigger: 'blur' }],
  actual_weight: [{ required: true, message: 'Nhập khối lượng', trigger: 'blur' }]
};

const feeLoading = ref(false);
const pricingSource = ref('');
const chargeWeight = ref(0);
const estimatedFees = reactive({ main_fee: 0, extra_fee: 0, remote_fee: 0, vat: 0 });

const totalFee = computed(() => (estimatedFees.main_fee || 0) + (estimatedFees.extra_fee || 0) + (estimatedFees.remote_fee || 0) + (estimatedFees.vat || 0));

let feeTimer = null;
const fetchFee = () => {
  clearTimeout(feeTimer);
  feeTimer = setTimeout(async () => {
    if (!waybillForm.actual_weight || waybillForm.actual_weight <= 0
        || !waybillForm.origin_hub_id || !waybillForm.dest_hub_id) {
      Object.assign(estimatedFees, { main_fee: 0, extra_fee: 0, remote_fee: 0, vat: 0 }); 
      pricingSource.value = '';
      chargeWeight.value = 0;
      return;
    }

    feeLoading.value = true;
    try {
      const res = await api.post('/api/pricing/calculate', {
        origin_hub_id: waybillForm.origin_hub_id,
        dest_hub_id: waybillForm.dest_hub_id,
        weight: waybillForm.actual_weight,
        length: waybillForm.length,
        width: waybillForm.width,
        height: waybillForm.height,
        service_type: waybillForm.service_type,
        extra_services: waybillForm.extra_services,
        cod_amount: waybillForm.cod_amount
      });

      const fee = res.data;
      estimatedFees.main_fee = fee.main_fee;
      estimatedFees.extra_fee = fee.extra_fee || 0; 
      estimatedFees.remote_fee = fee.remote_fee || 0;
      estimatedFees.vat = fee.vat;
      pricingSource.value = fee.matched_rule;
      chargeWeight.value = fee.charge_weight || 0;
    } catch (err) {
      if (err.response?.status === 404) {
        Object.assign(estimatedFees, { main_fee: 0, extra_fee: 0, remote_fee: 0, vat: 0 });
        pricingSource.value = 'chưa có bảng giá';
      }
    } finally {
      feeLoading.value = false;
    }
  }, 400); 
};

watch(() => [
    waybillForm.actual_weight, 
    waybillForm.length,
    waybillForm.width,
    waybillForm.height,
    waybillForm.service_type, 
    waybillForm.origin_hub_id, 
    waybillForm.dest_hub_id,
    waybillForm.extra_services,
    waybillForm.cod_amount
], fetchFee, { deep: true });

const handleCustomerChange = (customerId) => {
  const customer = customers.value.find(c => c.customer_id === customerId || c.id === customerId);
  if (!customer) return;
  
  waybillForm.sender_name = customer.company_name || customer.name || '';
  waybillForm.sender_phone = customer.phone || '';
  waybillForm.sender_address = customer.address || '';
};

const handleReceiverPhoneBlur = async () => {
  const phone = waybillForm.receiver_phone;
  if (!phone || phone.length < 10) return;
  
  try {
    const res = await api.get('/api/waybills/recipient-history', { params: { phone } });
    if (res.data) {
      waybillForm.receiver_name = res.data.receiver_name || waybillForm.receiver_name;
      waybillForm.receiver_address = res.data.receiver_address || waybillForm.receiver_address;
      ElMessage.success('Đã tự động điền thông tin người nhận cũ!');
    }
  } catch (err) {
  }
};

const saveWaybill = async (andPrint) => {
  if (!formRef.value) return;
  
  await formRef.value.validate(async (valid) => {
    if (!valid) {
      ElMessage.warning('Vui lòng kiểm tra lại các thông tin bắt buộc');
      return;
    }

    if (!waybillForm.origin_hub_id) return ElMessage.warning('Vui lòng chọn bưu cục gửi hàng');
    if (totalFee.value <= 0) return ElMessage.error('Tuyến đường này chưa được cấu hình giá cước');
    
    loading.value = true;
    try {
      const response = await api.post('/api/waybills', {
        ...waybillForm,
        shipping_fee: totalFee.value
      }, {
         headers: { 'Idempotency-Key': `wb-create-${Date.now()}` }
      });

      const waybill = response.data;
      
      loading.value = false;

      ElMessage({ message: `Đã tạo vận đơn: ${waybill.waybill_code}`, type: 'success', duration: 3000 });

      Object.assign(waybillForm, {
        ...initialFormState,
        customer_id: waybillForm.customer_id,
        origin_hub_id: waybillForm.origin_hub_id,
        dest_hub_id: waybillForm.dest_hub_id
      });
      formRef.value.clearValidate();

      await nextTick();

      if (andPrint) {
        setTimeout(() => {
          const link = document.createElement('a');
          const baseUrl = import.meta.env.VITE_API_URL || '';
          link.href = `${baseUrl}/api/print/${waybill.waybill_code}`;
          link.target = '_blank';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }, 150);
      }

      if (phoneInputRef.value) {
        setTimeout(() => phoneInputRef.value.focus(), 200);
      }

    } catch (err) {
      loading.value = false; 
      ElMessage.error(err.response?.data?.detail || 'Lỗi hệ thống khi lưu đơn hàng');
    }
  });
};

onMounted(async () => {
  try {
    const [resCustomers, resHubs] = await Promise.all([
      api.get('/api/customers').catch(()=>({data:[]})),
      api.get('/api/hubs').catch(()=>({data:[]}))
    ]);
    
    customers.value = resCustomers.data.items || resCustomers.data || [];
    const loadedHubs = resHubs.data.items || resHubs.data || [];
    hubs.value = loadedHubs;

    if (auth.user?.role_id !== 1) {
      if (auth.user?.primary_hub_id) {
        waybillForm.origin_hub_id = auth.user.primary_hub_id;
      } else {
        ElMessage.warning('Tài khoản của bạn chưa được phân bổ về bưu cục nào!');
      }
    } else {
      if (loadedHubs.length > 0 && !waybillForm.origin_hub_id) {
        waybillForm.origin_hub_id = loadedHubs[0].hub_id;
      }
    }
  } catch (e) {
    ElMessage.error('Không thể tải dữ liệu danh mục');
  }

  servicesLoading.value = true;
  try {
    const resSrv = await api.get('/api/pricing/extra-services');
    availableServices.value = (resSrv.data || []).filter(srv => srv.is_active);
  } catch (e) {
    // Silent fail
  } finally {
    servicesLoading.value = false;
  }
});
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

/* Base Layout */
.modern-waybill-create {
  min-height: calc(100vh - 64px);
  background-color: #F4F7FE;
  font-family: 'Plus Jakarta Sans', sans-serif;
  color: #2B3674;
  padding: 24px; /* Reduced padding to save space */
}

.page-container {
  max-width: 1500px;
  margin: 0 auto;
  height: 100%;
  display: flex;
  flex-direction: column;
}

/* Utilities */
.flex-between { display: flex; justify-content: space-between; align-items: center; }
.flex-center { display: flex; align-items: center; }
.gap-2 { gap: 8px; }
.w-full { width: 100%; }
.mb-0 { margin-bottom: 0 !important; }
.mb-8 { margin-bottom: 8px; }
.mb-12 { margin-bottom: 12px !important; }
.mt-1 { margin-top: 4px; }
.mr-2 { margin-right: 8px; }
.fw-bold { font-weight: 700; }
.text-dark { color: #1B2559; }
.text-primary { color: #4318FF; }
.text-truncate { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

/* Header */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px; /* Reduced to save space */
}

.header-content { display: flex; align-items: center; gap: 16px; }

.btn-icon-back {
  width: 44px; height: 44px; border-radius: 12px;
  background: #FFFFFF; border: 1px solid #E2E8F0; color: #2B3674;
  display: flex; align-items: center; justify-content: center; font-size: 20px;
  cursor: pointer; transition: all 0.2s;
}
.btn-icon-back:hover { background: #F8FAFC; border-color: #4318FF; color: #4318FF; }

.title-wrapper { display: flex; flex-direction: column; }
.page-title { font-size: 24px; font-weight: 800; color: #2B3674; margin: 0 0 4px 0; letter-spacing: -0.5px; }
.page-subtitle { color: #A3AED0; font-size: 13px; margin: 0; font-weight: 500; }

.header-actions { display: flex; gap: 12px; }

/* Buttons */
.btn-primary { background: #4318FF; color: white; border: none; padding: 10px 20px; border-radius: 10px; font-weight: 700; font-size: 14px; display: inline-flex; align-items: center; gap: 8px; cursor: pointer; transition: all 0.3s ease; box-shadow: 0 4px 15px rgba(67, 24, 255, 0.25); }
.btn-primary:hover:not(:disabled) { background: #3311DB; transform: translateY(-2px); }
.btn-secondary { background: #FFFFFF; color: #2B3674; border: 1px solid #E2E8F0; padding: 10px 20px; border-radius: 10px; font-weight: 700; font-size: 14px; display: inline-flex; align-items: center; gap: 8px; cursor: pointer; transition: all 0.3s ease; }
.btn-secondary:hover:not(:disabled) { background: #F8FAFC; border-color: #A3AED0; }
button:disabled { opacity: 0.7; cursor: not-allowed; }

/* Form Layout for "No Scroll" */
.form-row-container {
  display: flex;
  align-items: stretch;
}

.column-layout {
  display: flex;
  flex-direction: column;
  gap: 16px; /* Space between cards */
}

.flex-fill {
  flex: 1; /* Pushes card to fill available vertical space */
  display: flex;
  flex-direction: column;
}

.content-card {
  background: #FFFFFF;
  border-radius: 16px;
  box-shadow: 0px 4px 15px rgba(0, 0, 0, 0.02);
  border: 1px solid #E9EDF7;
}

.compact-card {
  padding: 16px 20px; /* Reduced padding */
}

.section-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 800;
  color: #1B2559;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px dashed #E2E8F0;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.section-header .el-icon { color: #4318FF; font-size: 16px; }

/* Form Controls Customization */
:deep(.modern-form .el-form-item__label) { font-weight: 700; color: #2B3674; margin-bottom: 4px; font-size: 13px; line-height: 1.2; }

:deep(.modern-form .el-input__wrapper),
:deep(.modern-form .el-select__wrapper),
:deep(.modern-form .el-textarea__inner) { background: #F8FAFC; box-shadow: 0 0 0 1px #E2E8F0 inset; border-radius: 8px; padding: 6px 12px; transition: all 0.3s ease; }
:deep(.modern-form .el-textarea__inner) { padding: 8px 12px; }

:deep(.modern-form .el-input__wrapper:hover),
:deep(.modern-form .el-select__wrapper:hover),
:deep(.modern-form .el-textarea__inner:hover) { box-shadow: 0 0 0 1px #4318FF inset; }
:deep(.modern-form .el-input__wrapper.is-focus),
:deep(.modern-form .el-select__wrapper.is-focus),
:deep(.modern-form .el-textarea__inner:focus) { box-shadow: 0 0 0 2px rgba(67, 24, 255, 0.2) inset !important; background: #FFFFFF; }

:deep(.modern-price-input .el-input__inner) { font-size: 16px !important; font-weight: 800 !important; color: #EE5D50 !important; }

/* Radio Group */
:deep(.custom-radio-group) { display: flex; gap: 8px; width: 100%; }
:deep(.custom-radio-group .el-radio-button) { flex: 1; }
:deep(.custom-radio-group .el-radio-button__inner) { width: 100%; border: 1px solid #E2E8F0 !important; background: #F8FAFC; color: #A3AED0; font-weight: 700; border-radius: 8px !important; padding: 8px; box-shadow: none !important; font-size: 13px; }
:deep(.custom-radio-group .el-radio-button.is-active .el-radio-button__inner) { background: #4318FF; border-color: #4318FF !important; color: white; }

.helper-text { font-size: 11px; font-weight: 600; }

/* Inline Services */
.inline-services {
  background: #F8FAFC;
  border-radius: 8px;
  padding: 10px 12px;
  margin-bottom: 12px;
  display: flex;
  align-items: flex-start;
  gap: 12px;
}
.service-label { font-size: 12px; font-weight: 800; color: #2B3674; white-space: nowrap; margin-top: 2px; }
.compact-service-group { display: flex; flex-wrap: wrap; gap: 8px 16px; }
:deep(.compact-checkbox .el-checkbox__label) { font-size: 12px; font-weight: 600; color: #4B5563; padding-left: 6px; }

/* Pricing Status Box */
.pricing-status-box { font-size: 13px; font-weight: 700; }
.error-box { background: rgba(238, 93, 80, 0.1); color: #EE5D50; padding: 8px 12px; border-radius: 8px; display: flex; align-items: center; gap: 6px; }
.success-box { background: rgba(5, 205, 153, 0.1); color: #05CD99; padding: 8px 12px; border-radius: 8px; display: flex; align-items: center; gap: 6px; }

/* Summary Details */
.summary-section { justify-content: space-between; }
.summary-details { display: flex; flex-direction: column; gap: 8px; }
.summary-line { display: flex; justify-content: space-between; font-size: 13px; color: #8F9BBA; font-weight: 600; }
.summary-line .value { color: #2B3674; font-weight: 700; }
.divider-dashed { height: 1px; background-image: linear-gradient(to right, #E2E8F0 50%, transparent 50%); background-size: 8px 1px; background-repeat: repeat-x; margin: 4px 0; }
.total-line { align-items: center; margin-top: 4px; }
.total-line .label { font-size: 14px; font-weight: 800; color: #1B2559; }
.total-amount { font-size: 24px !important; font-weight: 800 !important; color: #4318FF !important; }

/* Animations */
.animate-fade-in { animation: fadeIn 0.5s ease-out; }
.animate-fade-in-up { animation: fadeInUp 0.5s ease-out; }
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes fadeInUp { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }

/* Responsive adjustments */
@media (max-width: 992px) {
  .form-row-container { flex-direction: column; }
  .column-layout { width: 100%; max-width: 100%; flex: none; }
}
</style>