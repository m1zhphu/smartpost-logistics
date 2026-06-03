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
                    <el-select v-model="waybillForm.service_type" placeholder="Chọn dịch vụ..." class="w-full">
                      <el-option label="Chuyển phát nhanh (CPN)" value="CPN" />
                      <el-option label="Tiết kiệm (TK)" value="TK" />
                      <el-option label="Hỏa tốc (HT)" value="HT" />
                      <el-option label="Phát trước 9h (PT9H)" value="PT9H" />
                      <el-option label="Quốc tế (QT)" value="QT" />
                    </el-select>
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
                <el-autocomplete
                  v-model="waybillForm.receiver_address"
                  :fetch-suggestions="queryAddressSearch"
                  placeholder="Số nhà, tên đường, Phường/Xã, Quận/Huyện, Tỉnh/Thành phố..."
                  clearable
                  class="w-full"
                  :trigger-on-focus="false"
                >
                  <template #prefix><el-icon><Location /></el-icon></template>
                  <template #default="{ item }">
                    <div class="addr-suggestion" style="display: flex; align-items: center; gap: 8px; padding: 6px 0;">
                      <el-icon style="color: #4318FF; font-size: 16px;"><Location /></el-icon>
                      <span style="font-size: 13px; color: #2b3674;">{{ item.value }}</span>
                    </div>
                  </template>
                </el-autocomplete>
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
              
              <div class="form-item mb-12">
                <label style="display: block; font-size: 12px; font-weight: 600; color: #64748b; margin-bottom: 6px;">LOẠI HÀNG HÓA</label>
                <el-radio-group v-model="packageType" class="w-full custom-radio-group">
                  <el-radio-button value="goods">Hàng hóa</el-radio-button>
                  <el-radio-button value="letter">Thư từ (Bưu phẩm)</el-radio-button>
                </el-radio-group>
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

              <el-row :gutter="16" v-if="packageType === 'goods'">
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
const packageType = ref('goods');

watch(packageType, (newVal) => {
  if (newVal === 'letter') {
    waybillForm.length = 0;
    waybillForm.width = 0;
    waybillForm.height = 0;
  }
});

const customers = ref([]);
const hubs = ref([]);
const availableServices = ref([]); 
const servicesLoading = ref(false);

const initialFormState = {
  service_type: 'CPN',
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

const queryAddressSearch = (queryString, cb) => {
  if (!queryString) {
    cb([]);
    return;
  }
  
  const query = queryString.toLowerCase().trim();
  const commonLocations = [
    "Phường Bến Nghé, Quận 1, Thành phố Hồ Chí Minh",
    "Phường Bến Thành, Quận 1, Thành phố Hồ Chí Minh",
    "Phường Đa Kao, Quận 1, Thành phố Hồ Chí Minh",
    "Phường Võ Thị Sáu, Quận 3, Thành phố Hồ Chí Minh",
    "Phường 15, Quận Bình Thạnh, Thành phố Hồ Chí Minh",
    "Phường 2, Quận Tân Bình, Thành phố Hồ Chí Minh",
    "Phường Tràng Tiền, Quận Hoàn Kiếm, Thành phố Hà Nội",
    "Phường Hàng Đào, Quận Hoàn Kiếm, Thành phố Hà Nội",
    "Phường Phan Chu Trinh, Quận Hoàn Kiếm, Thành phố Hà Nội",
    "Phường Quán Thánh, Quận Ba Đình, Thành phố Hà Nội",
    "Phường Liễu Giai, Quận Ba Đình, Thành phố Hà Nội",
    "Phường Dịch Vọng, Quận Cầu Giấy, Thành phố Hà Nội",
    "Phường Thạch Thang, Quận Hải Châu, Thành phố Đà Nẵng",
    "Phường Hòa Thuận Đông, Quận Hải Châu, Thành phố Đà Nẵng",
    "Phường Tân An, Quận Ninh Kiều, Thành phố Cần Thơ",
    "Phường Hoàng Văn Thụ, Quận Hồng Bàng, Thành phố Hải Phòng"
  ];
  
  const suggestions = commonLocations
    .filter(loc => loc.toLowerCase().includes(query) || query.includes(loc.toLowerCase()))
    .map(loc => {
      // Nếu query chưa chứa tên địa danh thì ghép vào làm tiền tố gợi ý
      const locLower = loc.toLowerCase();
      const parts = query.split(/[\s,]+/);
      const lastPart = parts[parts.length - 1];
      
      // Nếu người dùng nhập địa chỉ cụ thể như số nhà / tên đường, tự động gợi ý append
      if (queryString.length > 2 && !locLower.includes(query)) {
        return { value: `${queryString}, ${loc}` };
      }
      return { value: loc };
    });
    
  cb(suggestions.slice(0, 5));
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

<style scoped src="@/styles/admin/waybills/CreateWaybill.css"></style>