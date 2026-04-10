<template>
  <div class="create-waybill-page">
    <div class="page-header flex-between mb-4">
      <div class="header-left flex-center gap-2">
        <el-button @click="$router.back()" circle plain class="back-btn"><el-icon><ArrowLeft /></el-icon></el-button>
        <div>
          <h2 class="misa-title m-0">Lập phiếu gửi hàng mới</h2>
          <p class="text-muted m-0 mt-1">Nhập thông tin người nhận và hàng hóa để tạo mã vận đơn</p>
        </div>
      </div>
      <div class="header-right flex-center gap-2">
        <el-button @click="saveWaybill(false)" :loading="loading" class="action-btn">
          <el-icon class="mr-1"><DocumentAdd /></el-icon> Tạm lưu (F8)
        </el-button>
        <el-button type="primary" @click="saveWaybill(true)" :loading="loading" class="action-btn action-btn-primary">
          <el-icon class="mr-1"><Printer /></el-icon> Cất & In Tem (F9)
        </el-button>
      </div>
    </div>

    <el-row :gutter="24">
      <el-col :span="17">
        <el-form :model="waybillForm" :rules="rules" ref="formRef" label-position="top" class="waybill-form">
          
          <el-card class="form-block mb-4" shadow="hover">
            <template #header>
              <div class="block-title"><el-icon><User /></el-icon> <span>THÔNG TIN GỬI & NHẬN</span></div>
            </template>
            
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="Khách hàng gửi (Shop)" prop="customer_id">
                   <el-select v-model="waybillForm.customer_id" placeholder="Tìm tên shop hoặc mã KH" filterable class="w-full">
                     <el-option v-for="shop in customers" :key="shop.customer_id || shop.id" :label="shop.company_name || shop.name" :value="shop.customer_id || shop.id" />
                   </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="Dịch vụ vận chuyển" prop="service_type">
                  <el-radio-group v-model="waybillForm.service_type" class="w-full custom-radio">
                    <el-radio-button value="EXPRESS">Hoả tốc</el-radio-button>
                    <el-radio-button value="STANDARD">Tiêu chuẩn</el-radio-button>
                    <el-radio-button value="ECONOMY">Tiết kiệm</el-radio-button>
                  </el-radio-group>
                </el-form-item>
              </el-col>
            </el-row>

            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="Bưu cục gửi hàng" prop="origin_hub_id">
                   <el-select 
                    v-model="waybillForm.origin_hub_id" 
                    placeholder="Chọn kho/bưu cục gửi" 
                    filterable 
                    class="w-full"
                    :disabled="auth.user?.role_id !== 1"
                   >
                     <el-option v-for="hub in hubs" :key="hub.hub_id" :label="hub.hub_code + ' - ' + hub.hub_name" :value="hub.hub_id" />
                   </el-select>
                   <div v-if="auth.user?.role_id !== 1" class="helper-text mt-1">Cố định tại bưu cục của bạn.</div>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="Bưu cục nhận hàng" prop="dest_hub_id">
                   <el-select v-model="waybillForm.dest_hub_id" placeholder="Chọn kho/bưu cục đích" filterable class="w-full">
                     <el-option v-for="hub in hubs" :key="hub.hub_id" :label="hub.hub_code + ' - ' + hub.hub_name" :value="hub.hub_id" />
                   </el-select>
                </el-form-item>
              </el-col>
            </el-row>
            
            <div class="divider-text mt-2 mb-3">CHI TIẾT NGƯỜI NHẬN</div>
            
            <el-row :gutter="20">
              <el-col :span="8">
                <el-form-item label="Điện thoại nhận" prop="receiver_phone">
                  <el-input ref="phoneInputRef" v-model="waybillForm.receiver_phone" placeholder="SĐT khách hàng" clearable />
                </el-form-item>
              </el-col>
              <el-col :span="16">
                <el-form-item label="Họ tên người nhận" prop="receiver_name">
                  <el-input v-model="waybillForm.receiver_name" placeholder="Họ và tên đầy đủ" clearable />
                </el-form-item>
              </el-col>
            </el-row>
            
            <el-form-item label="Địa chỉ giao hàng chi tiết" prop="receiver_address" class="m-0">
              <el-input 
                v-model="waybillForm.receiver_address" 
                type="textarea" 
                :rows="2" 
                placeholder="Số nhà, tên đường, Phường/Xã, Quận/Huyện, Tỉnh/Thành phố..." 
              />
            </el-form-item>
          </el-card>

          <el-card class="form-block" shadow="hover">
            <template #header>
              <div class="block-title"><el-icon><Box /></el-icon> <span>NỘI DUNG HÀNG HÓA & THANH TOÁN</span></div>
            </template>
            
            <el-row :gutter="20">
              <el-col :span="8">
                <el-form-item label="Khối lượng (kg)" prop="actual_weight">
                   <el-input-number v-model="waybillForm.actual_weight" :min="0.1" :step="0.1" class="w-full font-bold" />
                </el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item label="Tên sản phẩm" prop="product_name">
                  <el-input v-model="waybillForm.product_name" placeholder="Quần áo, điện tử..." clearable />
                </el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item label="Phương thức thanh toán" prop="payment_method">
                  <el-select v-model="waybillForm.payment_method" class="w-full">
                    <el-option label="Người gửi trả (SENDER)" value="SENDER_PAY" />
                    <el-option label="Người nhận trả (RECEIVER)" value="RECEIVER_PAY" />
                  </el-select>
                </el-form-item>
              </el-col>
            </el-row>
            
            <el-row :gutter="20">
              <el-col :span="8">
                <el-form-item label="Tiền thu hộ (COD)" prop="cod_amount">
                  <el-input-number 
                    v-model="waybillForm.cod_amount" 
                    :min="0" :step="1000" 
                    class="w-full highlight-input" 
                    :controls="false"
                    :formatter="(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')"
                    :parser="(value) => value.replace(/\$\s?|(\.*)/g, '')"
                  />
                  <div class="helper-text mt-1 text-right">Đơn vị: VNĐ</div>
                </el-form-item>
              </el-col>
              <el-col :span="16">
                 <el-form-item label="Ghi chú đơn hàng" class="m-0">
                    <el-input v-model="waybillForm.note" placeholder="Cho xem hàng, không thử; giao giờ hành chính..." clearable />
                 </el-form-item>
              </el-col>
            </el-row>
          </el-card>
        </el-form>
      </el-col>

      <el-col :span="7">
        <el-card class="cost-summary-card mb-4" shadow="hover" v-loading="feeLoading">
          <template #header>
            <div class="flex-between">
              <span class="block-title"><el-icon><Money /></el-icon> TẠM TÍNH CHI PHÍ</span>
              <el-tag v-if="pricingSource && pricingSource !== 'chưa có bảng giá'" size="small" type="success" effect="light" round>Hợp lệ</el-tag>
            </div>
          </template>

          <div class="pricing-status mb-4">
             <el-alert
              v-if="pricingSource === 'chưa có bảng giá'"
              title="Chưa có bảng giá cho tuyến này"
              type="error"
              :closable="false"
              show-icon
            />
            <div v-else-if="pricingSource" class="matched-rule">
               <el-icon class="mr-1 text-success"><CircleCheckFilled /></el-icon>
               Áp dụng: <strong>{{ pricingSource }}</strong>
            </div>
          </div>

          <div class="summary-details">
            <div class="summary-line">
              <span class="label">Cước chính:</span>
              <span class="value">{{ (estimatedFees.main_fee || 0).toLocaleString() }} đ</span>
            </div>
            <div class="summary-line" v-if="estimatedFees.extra_fee > 0">
              <span class="label">Phí Dịch vụ:</span>
              <span class="value">{{ (estimatedFees.extra_fee || 0).toLocaleString() }} đ</span>
            </div>
            <div class="summary-line">
              <span class="label">P.phí nhiên liệu:</span>
              <span class="value">{{ (estimatedFees.fuel_fee || 0).toLocaleString() }} đ</span>
            </div>
            <div class="summary-line">
              <span class="label">Thuế VAT:</span>
              <span class="value">{{ (estimatedFees.vat || 0).toLocaleString() }} đ</span>
            </div>
            
            <div class="divider-line my-3"></div>
            
            <div class="summary-line total">
              <span class="label">TỔNG CỘNG:</span>
              <span class="value total-amount">{{ totalFee.toLocaleString() }} đ</span>
            </div>
          </div>
        </el-card>

        <el-card class="extra-services-card" shadow="hover">
          <template #header><span class="block-title"><el-icon><Service /></el-icon> DỊCH VỤ TIỆN ÍCH</span></template>
          <div class="extra-services-wrapper" v-loading="servicesLoading">
            <el-checkbox-group v-model="waybillForm.extra_services" class="service-group">
              <el-checkbox 
                v-for="srv in availableServices" 
                :key="srv.service_code" 
                :value="srv.service_code" 
                class="service-item"
              >
                {{ srv.service_name }}
              </el-checkbox>
            </el-checkbox-group>
            <div v-if="availableServices.length === 0 && !servicesLoading" class="helper-text text-center mt-2">
              Chưa có dịch vụ tiện ích nào được cấu hình.
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch, nextTick } from 'vue';
import { 
  ArrowLeft, User, Box, DocumentAdd, Printer, 
  CircleCheckFilled, Money, Service
} from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import api from '@/api/axios';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth'; 

const auth = useAuthStore(); 
const router = useRouter();
const formRef = ref(null);
const phoneInputRef = ref(null); // Ref để auto-focus
const loading = ref(false);

const customers = ref([]);
const hubs = ref([]);
const availableServices = ref([]); 
const servicesLoading = ref(false);

// Dùng chung cấu hình reset để đảm bảo không rác dữ liệu
const initialFormState = {
  service_type: 'STANDARD',
  receiver_name: '',
  receiver_phone: '',
  receiver_address: '',
  actual_weight: 0.5,
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
const estimatedFees = reactive({ main_fee: 0, extra_fee: 0, fuel_fee: 0, vat: 0 });

const totalFee = computed(() => (estimatedFees.main_fee || 0) + (estimatedFees.extra_fee || 0) + (estimatedFees.fuel_fee || 0) + (estimatedFees.vat || 0));

let feeTimer = null;
const fetchFee = () => {
  clearTimeout(feeTimer);
  feeTimer = setTimeout(async () => {
    if (!waybillForm.actual_weight || waybillForm.actual_weight <= 0
        || !waybillForm.origin_hub_id || !waybillForm.dest_hub_id) {
      Object.assign(estimatedFees, { main_fee: 0, extra_fee: 0, fuel_fee: 0, vat: 0 }); 
      pricingSource.value = '';
      return;
    }

    feeLoading.value = true;
    try {
      const res = await api.post('/api/pricing/calculate', {
        origin_hub_id: waybillForm.origin_hub_id,
        dest_hub_id: waybillForm.dest_hub_id,
        weight: waybillForm.actual_weight,
        service_type: waybillForm.service_type,
        extra_services: waybillForm.extra_services,
        cod_amount: waybillForm.cod_amount
      });

      const fee = res.data;
      estimatedFees.main_fee = fee.main_fee;
      estimatedFees.extra_fee = fee.extra_fee || 0; 
      estimatedFees.fuel_fee = fee.fuel_fee;
      estimatedFees.vat = fee.vat;
      pricingSource.value = fee.matched_rule;
    } catch (err) {
      if (err.response?.status === 404) {
        Object.assign(estimatedFees, { main_fee: 0, extra_fee: 0, fuel_fee: 0, vat: 0 });
        pricingSource.value = 'chưa có bảng giá';
      }
    } finally {
      feeLoading.value = false;
    }
  }, 400); // Giảm delay xuống 400ms cho mượt hơn
};

watch(() => [
    waybillForm.actual_weight, 
    waybillForm.service_type, 
    waybillForm.origin_hub_id, 
    waybillForm.dest_hub_id,
    waybillForm.extra_services,
    waybillForm.cod_amount
], fetchFee, { deep: true });

// Hàm lưu (Gọn nhẹ, mượt mà, không block UI)
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
      
      // 1. Tắt Loading của nút bấm NGAY LẬP TỨC
      loading.value = false;

      // 2. Báo thành công
      ElMessage({
        message: `Đã tạo vận đơn: ${waybill.waybill_code}`,
        type: 'success',
        duration: 3000
      });

      // 3. Reset form (Giữ lại thông tin Shop và Bưu cục)
      Object.assign(waybillForm, {
        ...initialFormState,
        customer_id: waybillForm.customer_id,
        origin_hub_id: waybillForm.origin_hub_id,
        dest_hub_id: waybillForm.dest_hub_id
      });
      formRef.value.clearValidate();

      // 4. Ép Vue phải chờ đến khi vẽ lại UI xong xuôi, xóa mọi bóng mờ loading
      await nextTick();

      // 5. MỞ TAB IN BẰNG THẺ <a> ẢO (Giải pháp chống treo màn hình)
      if (andPrint) {
        setTimeout(() => {
          const link = document.createElement('a');
          // SỬA Ở ĐÂY: Sử dụng biến môi trường thay vì localhost
          const baseUrl = import.meta.env.VITE_API_URL || '';
          link.href = `${baseUrl}/api/print/${waybill.waybill_code}`;
          link.target = '_blank';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }, 150);
      }

      // 6. Tự động trỏ chuột về ô SĐT để nhập đơn tiếp theo
      if (phoneInputRef.value) {
        setTimeout(() => phoneInputRef.value.focus(), 200);
      }

    } catch (err) {
      loading.value = false; // Luôn tắt loading nếu có lỗi
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
.create-waybill-page { width: 100%; }

/* Utilities */
.flex-between { display: flex; justify-content: space-between; align-items: center; }
.flex-center { display: flex; align-items: center; }
.gap-2 { gap: 12px; }
.w-full { width: 100%; }
.m-0 { margin: 0; }
.mt-1 { margin-top: 4px; }
.mt-2 { margin-top: 8px; }
.mb-3 { margin-bottom: 12px; }
.mb-4 { margin-bottom: 16px; }
.mr-1 { margin-right: 4px; }
.text-muted { color: #6b7280; font-size: 13px; }
.text-success { color: #67c23a; }
.text-right { text-align: right; }
.font-bold { font-weight: bold; }

/* Header & Buttons */
.back-btn { border-color: #e5e7eb; color: #4b5563; }
.back-btn:hover { background: #f3f4f6; color: #111827; }
.action-btn { padding: 10px 20px; font-weight: 600; border-radius: 6px; transition: all 0.2s; }
.action-btn-primary { box-shadow: 0 4px 6px -1px rgba(64, 158, 255, 0.2); }

/* Forms & Blocks */
.form-block, .cost-summary-card, .extra-services-card { 
  border-radius: 8px; 
  border: 1px solid #ebeef5;
}
.cost-summary-card{ 
  border-radius: 8px; 
  border: 1px solid #ebeef5;
  position: relative;
  overflow: hidden;
}
.block-title { 
  font-size: 14px; 
  font-weight: 700; 
  color: #1f2937; 
  display: flex; 
  align-items: center; 
  gap: 8px; 
}
.divider-text { 
  font-size: 12px; 
  font-weight: 700; 
  color: #6b7280; 
  border-bottom: 1px solid #f3f4f6; 
  padding-bottom: 8px; 
  text-transform: uppercase;
}
.helper-text { font-size: 12px; color: #9ca3af; }

/* Custom Inputs */
.waybill-form :deep(.el-form-item__label) { 
  font-weight: 600; 
  color: #4b5563; 
  padding-bottom: 4px; 
  font-size: 13px; 
}
.custom-radio { display: flex; width: 100%; }
.custom-radio :deep(.el-radio-button) { flex: 1; }
.custom-radio :deep(.el-radio-button__inner) { width: 100%; padding: 8px 0; }
.highlight-input :deep(.el-input__inner) { font-weight: 800; color: #dc2626; font-size: 16px; }

/* Summary Details */
.matched-rule {
  background: #f0fdf4;
  border: 1px solid #dcfce7;
  color: #166534;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 13px;
  display: flex;
  align-items: center;
}
.summary-details { display: flex; flex-direction: column; gap: 12px; }
.summary-line { display: flex; justify-content: space-between; font-size: 14px; color: #4b5563; }
.summary-line.total { align-items: baseline; }
.summary-line.total .label { font-weight: 800; color: #111827; }
.total-amount { font-size: 22px; font-weight: 800; color: #409EFF; }
.divider-line { height: 1px; background: #e5e7eb; }

/* Extra Services */
.service-group { display: flex; flex-direction: column; gap: 8px; }
.service-item { margin-right: 0 !important; }
.service-item :deep(.el-checkbox__label) { font-size: 13px; color: #4b5563; }
</style>