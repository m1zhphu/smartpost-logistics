<template>
  <div class="customer-portal">
    <div class="portal-container">
      <el-row :gutter="24" class="portal-content">
        <el-col :span="12" :offset="6">
          <el-card class="profile-card info-card animate-fade-in" style="margin-bottom: 20px;">
            <template #header>
              <div class="card-header-title">
                <el-icon><User /></el-icon><span>Thông tin cá nhân</span>
              </div>
            </template>
            <div class="profile-details text-center">
              <el-avatar :size="90" class="portal-avatar mx-auto mb-3">{{ authStore.user?.full_name?.charAt(0) || 'C' }}</el-avatar>
              <h3 class="mb-3">{{ authStore.user?.full_name }}</h3>
              
              <div class="details-list text-left mt-3 mb-4 w-full mx-auto" style="max-width: 450px; text-align: left;">
                <div class="detail-item">
                  <span class="label">Mã khách hàng:</span>
                  <span class="value">{{ customerInfo.customer_code || 'REG-PENDING' }}</span>
                </div>
                <div class="detail-item">
                  <span class="label">Số điện thoại:</span>
                  <span class="value">{{ customerInfo.phone_number || 'Chưa cập nhật' }}</span>
                </div>
                <div class="detail-item">
                  <span class="label">Email liên hệ:</span>
                  <span class="value">{{ customerInfo.email }}</span>
                </div>
                <div class="detail-item">
                  <span class="label">Địa chỉ lấy hàng mặc định:</span>
                  <span class="value" style="line-height: 1.4;">{{ formattedAddress }}</span>
                </div>
              </div>
              
              <div style="margin-top: 15px;">
                <el-button type="primary" @click="openEditDialog">Cập nhật thông tin</el-button>
                <el-button @click="openChangePasswordDialog">Đổi mật khẩu</el-button>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    <!-- Dialog cập nhật thông tin khách hàng -->
    <el-dialog
      v-model="editDialogVisible"
      title="Cập nhật hồ sơ khách hàng"
      width="600px"
      destroy-on-close
    >
      <el-form :model="editForm" label-position="top">
        <el-form-item label="Họ tên đại diện Shop" required>
          <el-input v-model="editForm.full_name" placeholder="Tên hiển thị shop" />
        </el-form-item>
        
        <el-form-item label="Số điện thoại liên hệ" required>
          <el-input v-model="editForm.phone_number" placeholder="Số điện thoại liên hệ" />
        </el-form-item>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="Tỉnh / Thành phố (Mới)">
              <el-select
                v-model="selectedProvinceCode"
                filterable
                clearable
                class="w-full"
                placeholder="Chọn tỉnh / thành phố mới"
                @change="handleProvinceChange"
              >
                <template #prefix><el-icon><Location /></el-icon></template>
                <el-option
                  v-for="p in provinces"
                  :key="p.Code"
                  :label="p.FullName"
                  :value="p.Code"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="Phường / Xã (Mới)">
              <el-select
                v-model="selectedWardCode"
                filterable
                clearable
                class="w-full"
                placeholder="Chọn phường / xã mới"
                :disabled="!selectedProvinceCode"
                :loading="editLegacyLoading"
                @change="handleWardChange"
              >
                <template #prefix><el-icon><Location /></el-icon></template>
                <el-option
                  v-for="w in availableWards"
                  :key="w.Code"
                  :label="w.FullName"
                  :value="w.Code"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="Số nhà, tên đường">
          <el-input v-model="editForm.street_address" placeholder="VD: 12 Nguyễn Huệ" />
        </el-form-item>

        <!-- Box hiển thị tỉnh cũ gửi của hồ sơ khách hàng -->
        <div v-if="editForm.province || editForm.ward" class="address-preview-container animate-fade-in" style="border: 2px solid #2ec17e; border-radius: 12px; padding: 16px; background-color: #f4fbf7; margin-bottom: 20px;">
          <div style="display: flex; align-items: center; margin-bottom: 12px; color: #2ec17e; font-weight: bold; font-size: 14px;">
            <el-icon style="margin-right: 6px;"><Location /></el-icon>
            <span>Thông tin địa chỉ lưu trữ</span>
          </div>
          <div style="display: flex; align-items: baseline; gap: 8px; margin-bottom: 8px;">
            <span style="font-size: 12px; color: #888; white-space: nowrap; min-width: 130px;">Địa chỉ sau sáp nhập:</span>
            <span style="font-size: 14px; font-weight: 600; color: #2e7d32;">{{ newAddressPreview || '—' }}</span>
          </div>
          <div style="display: flex; align-items: baseline; gap: 8px;">
            <span style="font-size: 12px; color: #888; white-space: nowrap; min-width: 130px;">Tỉnh cũ gửi trước sáp nhập:</span>
            <span v-if="editLegacyLoading" style="font-size: 13px; color: #999; font-style: italic;">Đang tra cứu...</span>
            <span v-else style="font-size: 14px; font-weight: 600; color: #2b6cb0;">{{ editOldProvinceName || '—' }}</span>
          </div>
        </div>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="editDialogVisible = false">Hủy</el-button>
          <el-button type="primary" @click="handleSaveProfile">Lưu thay đổi</el-button>
        </span>
      </template>
    </el-dialog>
    <el-dialog v-model="changePasswordVisible" title="Đổi mật khẩu" width="460px" destroy-on-close>
      <el-form :model="changePasswordForm" label-position="top">
        <el-form-item label="Mật khẩu hiện tại">
          <el-input v-model="changePasswordForm.current_password" type="password" show-password />
        </el-form-item>
        <el-form-item label="Mật khẩu mới">
          <el-input v-model="changePasswordForm.new_password" type="password" show-password />
        </el-form-item>
        <el-form-item label="Nhập lại mật khẩu mới">
          <el-input v-model="changePasswordForm.confirm_password" type="password" show-password />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="changePasswordVisible = false">Hủy</el-button>
          <el-button type="primary" :loading="changePasswordLoading" @click="changePassword">Lưu mật khẩu</el-button>
        </span>
      </template>
    </el-dialog>
    </div>
  </div>
</template>
<script setup>
import { computed, ref, reactive, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { ElMessage, ElMessageBox } from 'element-plus';
import api from '@/api/axios';
import { formatVietnamDateTime } from '@/utils/dateTime';
import { 
  User, Service, Phone, Message, Close, 
  Search, DocumentAdd, Location, List, Edit, Lock,
  Box, Setting, CircleCheck, InfoFilled, FolderOpened, Upload, ArrowLeft, Refresh, Warning
} from '@element-plus/icons-vue';

import localProvincesData from '../../../assets/data/vietnam_provinces.json';

const provinces = ref(localProvincesData);
const availableWards = ref([]);

const selectedProvinceCode = ref(null);
const selectedWardCode = ref(null);

const authStore = useAuthStore();
const router = useRouter();
const route = useRoute();

const activeTab = computed(() => route.query.tab || 'dashboard');

const customerInfo = ref({
  customer_code: '',
  phone_number: '',
  email: authStore.user?.email || '',
  address_detail: '',
  province: '',
  ward: '',
  street_address: '',
  old_province: ''
});

// Portal View States
const showCreateForm = ref(false);
const listLoading = ref(false);
const submitLoading = ref(false);
const simulateLoading = ref(false);
const pickupsList = ref([]);
const draftsList = ref([]);
const savedDraftsList = ref([]);

// Available Extra Services List
const availableServices = ref([]);

// Form model
const form = reactive({
  sender: {
    name: '',
    phone: '',
    province: '',
    ward: '',
    street_address: '',
    address_detail: ''
  },
  receiver: {
    name: '',
    phone: '',
    province: '',
    ward: '',
    street_address: '',
    address_detail: ''
  },
  items: [
    {
      product_name: '',
      weight: 0.5,
      length: 0,
      width: 0,
      height: 0,
      quantity: 1,
      declared_value: 0
    }
  ],
  cod_amount: 0,
  cod_receiver_pays_fee: false,
  service_type: 'STANDARD',
  extra_services: [],
  delivery_note_option: 'CHO_XEM_HANG',
  note: '',
  payment_method: 'SENDER_DEBT',
  target_hub_id: null
});

const hubsList = ref([]);

// Simulation price result
const simulateResult = ref(null);
const simulateError = ref('');

// Details Dialog variables
const detailDialogVisible = ref(false);
const selectedPickup = ref(null);
const activeDetailTab = ref('general');
const pickupTimeline = ref([]);
const timelineLoading = ref(false);

const editDialogVisible = ref(false);
const changePasswordVisible = ref(false);
const changePasswordLoading = ref(false);
const editForm = reactive({
  full_name: '',
  phone_number: '',
  province: '',
  ward: '',
  street_address: '',
  address_detail: ''
});

const changePasswordForm = reactive({
  current_password: '',
  new_password: '',
  confirm_password: ''
});

const handleProvinceChange = (code) => {
  const found = provinces.value.find(p => p.Code === code);
  editForm.province = found ? found.FullName : '';
  editForm.ward = '';
  selectedWardCode.value = null;
  availableWards.value = found ? found.Wards : [];
  editOldProvinceName.value = '';
};
const formattedAddress = computed(() => {
  const c = customerInfo.value;
  if (!c) return 'Chưa cập nhật';
  return c.address_detail || [c.street_address, c.ward, c.province].filter(Boolean).join(', ') || 'Chưa cập nhật';
});

const editOldProvinceName = ref('');
const editLegacyLoading = ref(false);

const OLD_PROVINCE_CODE_MAP = {
  1: 'Thành phố Hà Nội', 2: 'Tỉnh Hà Giang', 4: 'Tỉnh Cao Bằng',
  6: 'Tỉnh Bắc Kạn', 8: 'Tỉnh Tuyên Quang', 10: 'Tỉnh Lào Cai',
  11: 'Tỉnh Điện Biên', 12: 'Tỉnh Lai Châu', 14: 'Tỉnh Sơn La',
  15: 'Tỉnh Yên Bái', 17: 'Tỉnh Hòa Bình', 19: 'Tỉnh Thái Nguyên',
  20: 'Tỉnh Lạng Sơn', 22: 'Tỉnh Quảng Ninh', 24: 'Tỉnh Bắc Giang',
  25: 'Tỉnh Phú Thọ', 26: 'Tỉnh Vĩnh Phúc', 27: 'Tỉnh Bắc Ninh',
  30: 'Tỉnh Hải Dương', 31: 'Thành phố Hải Phòng', 33: 'Tỉnh Hưng Yên',
  34: 'Tỉnh Thái Bình', 35: 'Tỉnh Hà Nam', 36: 'Tỉnh Nam Định',
  37: 'Tỉnh Ninh Bình', 38: 'Tỉnh Thanh Hóa', 40: 'Tỉnh Nghệ An',
  42: 'Tỉnh Hà Tĩnh', 44: 'Tỉnh Quảng Bình', 45: 'Tỉnh Quảng Trị',
  46: 'Tỉnh Thừa Thiên Huế', 48: 'Thành phố Đà Nẵng', 49: 'Tỉnh Quảng Nam',
  51: 'Tỉnh Quảng Ngãi', 52: 'Tỉnh Bình Định', 54: 'Tỉnh Phú Yên',
  56: 'Tỉnh Khánh Hòa', 58: 'Tỉnh Ninh Thuận', 60: 'Tỉnh Bình Thuận',
  62: 'Tỉnh Kon Tum', 64: 'Tỉnh Gia Lai', 66: 'Tỉnh Đắk Lắk',
  67: 'Tỉnh Đắk Nông', 68: 'Tỉnh Lâm Đồng', 70: 'Tỉnh Bình Phước',
  72: 'Tỉnh Tây Ninh', 74: 'Tỉnh Bình Dương', 75: 'Tỉnh Đồng Nai',
  77: 'Tỉnh Bà Rịa - Vũng Tàu', 79: 'Thành phố Hồ Chí Minh', 80: 'Tỉnh Long An',
  82: 'Tỉnh Tiền Giang', 83: 'Tỉnh Bến Tre', 84: 'Tỉnh Trà Vinh',
  86: 'Tỉnh Vĩnh Long', 87: 'Tỉnh Đồng Tháp', 89: 'Tỉnh An Giang',
  91: 'Tỉnh Kiên Giang', 92: 'Thành phố Cần Thơ', 93: 'Tỉnh Hậu Giang',
  94: 'Tỉnh Sóc Trăng', 95: 'Tỉnh Bạc Liêu', 96: 'Tỉnh Cà Mau'
};

const handleWardChange = async (wardCode) => {
  if (!wardCode) {
    editForm.ward = '';
    editOldProvinceName.value = '';
    return;
  }

  const wardObj = availableWards.value.find(w => w.Code === wardCode);
  editForm.ward = wardObj ? wardObj.FullName : '';

  editLegacyLoading.value = true;
  editOldProvinceName.value = '';
  try {
    const res = await fetch(`https://provinces.open-api.vn/api/v2/w/${wardCode}/to-legacies/`);
    if (!res.ok) throw new Error();
    const legacies = await res.json();
    if (Array.isArray(legacies) && legacies.length > 0) {
      const code = legacies[0].province_code;
      editOldProvinceName.value = OLD_PROVINCE_CODE_MAP[code] || editForm.province;
    } else {
      editOldProvinceName.value = editForm.province;
    }
  } catch (err) {
    editOldProvinceName.value = editForm.province;
  } finally {
    editLegacyLoading.value = false;
  }
};

const newAddressPreview = computed(() => {
  return [
    editForm.street_address,
    editForm.ward,
    editForm.province,
    'Việt Nam'
  ].filter(Boolean).join(', ');
});

// SIMULATE ESTIMATED SHIPPING FEE
let simulateTimeout = null;
const debouncedSimulate = () => {
  if (simulateTimeout) clearTimeout(simulateTimeout);
  simulateTimeout = setTimeout(triggerSimulation, 400);
};

const triggerSimulation = async () => {
  if (!form.sender.province_id || !form.receiver.province_id) {
    simulateResult.value = null;
    return;
  }
  
  const mainItem = form.items[0];
  if (!mainItem || !mainItem.weight) {
    simulateResult.value = null;
    simulateError.value = '';
    return;
  }
  
  simulateLoading.value = true;
  simulateError.value = '';
  try {
    const payload = {
      origin_province_id: Number(form.sender.province_id),
      dest_province_id: Number(form.receiver.province_id),
      weight: Number(mainItem.weight),
      length: Number(mainItem.length || 0),
      width: Number(mainItem.width || 0),
      height: Number(mainItem.height || 0),
      service_type: form.service_type,
      cod_amount: Number(form.cod_amount || 0),
      extra_services: form.extra_services
    };
    
    const res = await api.post('/api/pricing/simulate', payload);
    if (res.data && res.data.status === 'SUCCESS') {
      simulateResult.value = res.data;
    } else {
      simulateResult.value = null;
      simulateError.value = 'Không thể tính phí tự động.';
    }
  } catch (err) {
    console.error('Error simulating price:', err);
    simulateResult.value = null;
    simulateError.value = err.response?.data?.detail || 'Tuyến đường này chưa được cấu hình giá cước.';
  } finally {
    simulateLoading.value = false;
  }
};

const fetchAvailableServices = async () => {
  try {
    const res = await api.get('/api/pricing/extra-services');
    availableServices.value = res.data || [];
  } catch (err) {
    console.error('Error fetching extra services:', err);
  }
};

const fetchHubs = async () => {
  try {
    const res = await api.get('/api/hubs');
    hubsList.value = Array.isArray(res.data) ? res.data : (res.data.items || res.data.data || []);
  } catch (err) {
    console.error('Error fetching hubs:', err);
  }
};

const startCreatePickup = async () => {
  if (!customerInfo.value || !customerInfo.value.province_id || !customerInfo.value.district_id) {
    ElMessageBox.confirm(
      'Tài khoản của bạn chưa cập nhật đầy đủ thông tin địa chỉ lấy hàng (Tỉnh/Thành, Quận/Huyện). Vui lòng cập nhật đầy đủ thông tin để tiếp tục tạo đơn.',
      'Cập nhật địa chỉ lấy hàng',
      {
        confirmButtonText: 'Cập nhật ngay',
        cancelButtonText: 'Đóng',
        type: 'warning'
      }
    ).then(() => {
      openEditDialog();
    }).catch(() => {});
    return;
  }

  // Pre-fill sender information from user profile
  form.sender.name = authStore.user?.full_name || '';
  form.sender.phone = customerInfo.value.phone_number || '';
  form.sender.province_id = customerInfo.value.province_id || null;
  form.sender.district_id = customerInfo.value.district_id || null;
  form.sender.ward_id = customerInfo.value.ward_id || null;
  form.sender.address_detail = customerInfo.value.address_detail || '';

  // Preload sender districts and wards
  if (form.sender.province_id) {
    senderDistricts.value = await fetchDistrictsForProvince(form.sender.province_id);
    matchHubAndSet(form.sender.province_id);
  } else {
    senderDistricts.value = [];
  }
  if (form.sender.district_id) {
    senderWards.value = await fetchWardsForDistrict(form.sender.district_id);
  } else {
    senderWards.value = [];
  }

  // Reset receiver and items
  form.receiver.name = '';
  form.receiver.phone = '';
  form.receiver.province_id = null;
  form.receiver.district_id = null;
  form.receiver.ward_id = null;
  form.receiver.address_detail = '';
  receiverDistricts.value = [];
  receiverWards.value = [];

  form.items = [{ product_name: '', weight: 0.5, length: 0, width: 0, height: 0, quantity: 1, declared_value: 0 }];
  form.cod_amount = 0;
  form.extra_services = [];
  form.service_type = 'STANDARD';
  form.delivery_note_option = 'CHO_XEM_HANG';
  form.note = '';
  form.payment_method = 'SENDER_DEBT';
  form.target_hub_id = null;
  simulateResult.value = null;

  showCreateForm.value = true;
  router.push({ query: { tab: 'create' } });
};

const resumeSavedDraft = async (draft) => {
  Object.assign(form, JSON.parse(JSON.stringify(draft)));
  
  if (form.sender.province_id) senderDistricts.value = await fetchDistrictsForProvince(form.sender.province_id);
  if (form.sender.district_id) senderWards.value = await fetchWardsForDistrict(form.sender.district_id);
  if (form.receiver.province_id) receiverDistricts.value = await fetchDistrictsForProvince(form.receiver.province_id);
  if (form.receiver.district_id) receiverWards.value = await fetchWardsForDistrict(form.receiver.district_id);
  
  debouncedSimulate();
  showCreateForm.value = true;
};

const deleteSavedDraft = (draftId) => {
  savedDraftsList.value = savedDraftsList.value.filter(d => d.draft_id !== draftId);
  localStorage.setItem('customer_pickup_drafts', JSON.stringify(savedDraftsList.value));
  ElMessage.success('Đã xóa bản nháp');
};

const resumeDraft = async (draft) => {
  Object.assign(form, JSON.parse(JSON.stringify(draft)));
  
  // Load districts and wards
  if (form.sender.province_id) senderDistricts.value = await fetchDistrictsForProvince(form.sender.province_id);
  if (form.sender.district_id) senderWards.value = await fetchWardsForDistrict(form.sender.district_id);
  if (form.receiver.province_id) receiverDistricts.value = await fetchDistrictsForProvince(form.receiver.province_id);
  if (form.receiver.district_id) receiverWards.value = await fetchWardsForDistrict(form.receiver.district_id);
  
  debouncedSimulate();
  showCreateForm.value = true;
};

const deleteDraft = (draftId) => {
  draftsList.value = draftsList.value.filter(d => d.draft_id !== draftId);
  localStorage.setItem('customer_pickup_queue', JSON.stringify(draftsList.value));
  ElMessage.success('Đã xóa đơn khỏi hàng chờ');
};

const saveDraft = () => {
  if (savedDraftsList.value.length >= 20) {
    ElMessage.warning('Chỉ lưu tối đa 20 bản nháp! Vui lòng xóa bớt.');
    return;
  }
  
  const newDraft = {
    ...JSON.parse(JSON.stringify(form)),
    draft_id: Date.now().toString(),
    created_at: new Date().toISOString()
  };

  savedDraftsList.value.push(newDraft);
  localStorage.setItem('customer_pickup_drafts', JSON.stringify(savedDraftsList.value));
  ElMessage.success('Đã lưu bản nháp thành công!');
};

const addToQueue = () => {
  if (draftsList.value.length >= 10) {
    ElMessage.warning('Hàng chờ chỉ lưu tối đa 10 đơn! Vui lòng xóa bớt hoặc gửi yêu cầu.');
    return;
  }
  
  if (!form.sender.name || !form.receiver.name || !form.items[0].product_name || !form.receiver.province_id) {
    ElMessage.warning('Vui lòng điền đủ thông tin cơ bản trước khi đưa vào hàng chờ.');
    return;
  }

  const newDraft = {
    ...JSON.parse(JSON.stringify(form)),
    draft_id: Date.now().toString(),
    created_at: new Date().toISOString()
  };

  draftsList.value.push(newDraft);
  localStorage.setItem('customer_pickup_queue', JSON.stringify(draftsList.value));
  localStorage.removeItem('customer_pickup_draft'); // Clear single draft if any
  
  ElMessage.success(`Đã đưa vào hàng chờ đơn thứ ${draftsList.value.length}. Bạn có thể tiếp tục tạo đơn mới.`);
  
  // Clear receiver and items to allow quick entry of next draft
  form.receiver.name = '';
  form.receiver.phone = '';
  form.receiver.province_id = null;
  form.receiver.district_id = null;
  form.receiver.ward_id = null;
  form.receiver.address_detail = '';
  receiverDistricts.value = [];
  receiverWards.value = [];

  form.items = [{ product_name: '', weight: 0.5, length: 0, width: 0, height: 0, quantity: 1, declared_value: 0 }];
  form.cod_amount = 0;
  form.note = '';
};

const cancelCreate = () => {
  showCreateForm.value = false;
  router.push({ query: { tab: 'dashboard' } });
};

// SUBMIT REQUEST TO BACKEND
const submitPickupRequest = async () => {
  if (!form.sender.name || !form.sender.phone || !form.sender.province_id) {
    ElMessage.warning('Vui lòng điền đầy đủ thông tin người gửi');
    return;
  }
  if (!form.receiver.name || !form.receiver.phone || !form.receiver.province_id || !form.receiver.district_id) {
    ElMessage.warning('Vui lòng điền đầy đủ thông tin người nhận (bao gồm Tỉnh/Huyện)');
    return;
  }
  if (!form.items[0].product_name) {
    ElMessage.warning('Vui lòng nhập tên sản phẩm');
    return;
  }

  submitLoading.value = true;
  try {
    const sName = getProvinceName(form.sender.province_id);
    const sDist = getDistrictName(form.sender.province_id, form.sender.district_id);
    const sWrd = getWardName(form.sender.district_id, form.sender.ward_id);

    const rName = getProvinceName(form.receiver.province_id);
    const rDist = getDistrictName(form.receiver.province_id, form.receiver.district_id);
    const rWrd = getWardName(form.receiver.district_id, form.receiver.ward_id);

    const mappedExtra = form.extra_services.map(code => {
      const srv = availableServices.value.find(s => s.service_code === code);
      return {
        service_code: code,
        service_name: srv ? srv.service_name : '',
        service_fee: srv ? (srv.fee_type === 'FIXED' ? srv.fee_value : 0) : 0
      };
    });

    const payload = {
      order_type: 'DOMESTIC',
      sender: {
        name: form.sender.name,
        phone: form.sender.phone,
        address: [form.sender.address_detail, sWrd, sDist, sName].filter(Boolean).join(', '),
        province_id: Number(form.sender.province_id),
        district_id: Number(form.sender.district_id),
        ward_id: Number(form.sender.ward_id),
        province_name: sName,
        district_name: sDist,
        ward_name: sWrd
      },
      receiver: {
        name: form.receiver.name,
        phone: form.receiver.phone,
        address: [form.receiver.address_detail, rWrd, rDist, rName].filter(Boolean).join(', '),
        province_id: Number(form.receiver.province_id),
        district_id: Number(form.receiver.district_id),
        ward_id: Number(form.receiver.ward_id),
        province_name: rName,
        district_name: rDist,
        ward_name: rWrd
      },
      items: form.items.map(i => ({
        product_group: 'PARCEL',
        product_name: i.product_name,
        weight: Number(i.weight),
        length: Number(i.length || 0),
        width: Number(i.width || 0),
        height: Number(i.height || 0),
        quantity: Number(i.quantity || 1),
        declared_value: Number(i.declared_value || 0)
      })),
      cod_amount: Number(form.cod_amount || 0),
      cod_receiver_pays_fee: form.cod_receiver_pays_fee,
      service_type: form.service_type,
      extra_services: mappedExtra,
      delivery_note_option: form.delivery_note_option,
      note: form.note,
      payment_method: form.payment_method,
      pickup_method: 'OUR_STAFF_PICKUP',
      delivery_method: 'OUR_STAFF_DELIVERY',
      target_hub_id: form.target_hub_id || null,
      save_as_draft: false
    };

    const res = await api.post('/api/waybills/customer/pickups', payload);
    
    ElMessage.success(`Tạo yêu cầu thành công! Mã vận đơn: ${res.data.waybill_code}`);
    showCreateForm.value = false;
    fetchPickupsList();
  } catch (err) {
    ElMessage.error(err.response?.data?.detail || 'Có lỗi xảy ra khi tạo yêu cầu lấy hàng');
  } finally {
    submitLoading.value = false;
  }
};

const submitAllDrafts = async () => {
  if (draftsList.value.length === 0) return;

  submitLoading.value = true;
  let successCount = 0;
  const failedDrafts = [];

  for (const draft of draftsList.value) {
    try {
      const sName = getProvinceName(draft.sender.province_id);
      const sDist = getDistrictName(draft.sender.province_id, draft.sender.district_id);
      const sWrd = getWardName(draft.sender.district_id, draft.sender.ward_id);

      const rName = getProvinceName(draft.receiver.province_id);
      const rDist = getDistrictName(draft.receiver.province_id, draft.receiver.district_id);
      const rWrd = getWardName(draft.receiver.district_id, draft.receiver.ward_id);

      const mappedExtra = draft.extra_services.map(code => {
        const srv = availableServices.value.find(s => s.service_code === code);
        return {
          service_code: code,
          service_name: srv ? srv.service_name : '',
          service_fee: srv ? (srv.fee_type === 'FIXED' ? srv.fee_value : 0) : 0
        };
      });

      const payload = {
        order_type: 'DOMESTIC',
        sender: {
          name: draft.sender.name,
          phone: draft.sender.phone,
          address: [draft.sender.address_detail, sWrd, sDist, sName].filter(Boolean).join(', '),
          province_id: Number(draft.sender.province_id),
          district_id: Number(draft.sender.district_id),
          ward_id: Number(draft.sender.ward_id),
          province_name: sName,
          district_name: sDist,
          ward_name: sWrd
        },
        receiver: {
          name: draft.receiver.name,
          phone: draft.receiver.phone,
          address: [draft.receiver.address_detail, rWrd, rDist, rName].filter(Boolean).join(', '),
          province_id: Number(draft.receiver.province_id),
          district_id: Number(draft.receiver.district_id),
          ward_id: Number(draft.receiver.ward_id),
          province_name: rName,
          district_name: rDist,
          ward_name: rWrd
        },
        items: draft.items.map(i => ({
          product_group: 'PARCEL',
          product_name: i.product_name,
          weight: Number(i.weight),
          length: Number(i.length || 0),
          width: Number(i.width || 0),
          height: Number(i.height || 0),
          quantity: Number(i.quantity || 1),
          declared_value: Number(i.declared_value || 0)
        })),
        cod_amount: Number(draft.cod_amount || 0),
        cod_receiver_pays_fee: draft.cod_receiver_pays_fee,
        service_type: draft.service_type,
        extra_services: mappedExtra,
        delivery_note_option: draft.delivery_note_option,
        note: draft.note,
        payment_method: draft.payment_method,
        pickup_method: 'OUR_STAFF_PICKUP',
        delivery_method: 'OUR_STAFF_DELIVERY',
        target_hub_id: draft.target_hub_id || null,
        save_as_draft: false
      };

      await api.post('/api/waybills/customer/pickups', payload);
      successCount++;
    } catch (err) {
      console.error('Lỗi khi gửi đơn nháp:', err);
      failedDrafts.push(draft);
    }
  }

  submitLoading.value = false;
  draftsList.value = failedDrafts;
  localStorage.setItem('customer_pickup_queue', JSON.stringify(failedDrafts));

  if (successCount > 0) {
    if (failedDrafts.length === 0) {
      ElMessage.success(`Tạo thành công ${successCount} đơn hàng! Vui lòng gom chung vào túi thư để bưu tá lấy.`);
    } else {
      ElMessage.warning(`Tạo thành công ${successCount} đơn. ${failedDrafts.length} đơn lỗi vẫn nằm trong hàng chờ.`);
    }
    fetchPickupsList();
  } else {
    ElMessage.error('Không thể tạo đơn hàng từ hàng chờ. Vui lòng kiểm tra lại thông tin.');
  }
};

// LOAD PICKUPS LIST
const fetchPickupsList = async () => {
  listLoading.value = true;
  try {
    const res = await api.get('/api/waybills/customer/pickups');
    pickupsList.value = res.data || [];
  } catch (err) {
    console.error('Error loading pickups list:', err);
  } finally {
    listLoading.value = false;
  }
};

// DETAIL & TIMELINE DIALOG
const openDetail = async (row) => {
  activeDetailTab.value = 'general';
  detailDialogVisible.value = true;
  
  if (row.waybill_code) {
    timelineLoading.value = true;
    pickupTimeline.value = [];
    try {
      const detailRes = await api.get(`/api/waybills/customer/pickups/${row.waybill_code}`);
      selectedPickup.value = detailRes.data;
      
      const idx = pickupsList.value.findIndex(item => item.waybill_code === row.waybill_code);
      if (idx !== -1) {
        pickupsList.value[idx] = detailRes.data;
      }
    } catch (err) {
      console.error('Error fetching pickup detail:', err);
      selectedPickup.value = row;
    }

    try {
      const res = await api.get(`/api/waybills/${row.waybill_code}/timeline`);
      pickupTimeline.value = res.data?.timeline || [];
    } catch (err) {
      console.error('Error fetching timeline:', err);
    } finally {
      timelineLoading.value = false;
    }
  } else {
    selectedPickup.value = row;
    pickupTimeline.value = [];
  }
};

const getDiffMessage = (row) => {
  const diff = (row.final_total_amount || 0) - (row.estimated_total_amount || 0);
  if (diff > 0) {
    return `Tổng cước sau cân đo tăng thêm ${diff.toLocaleString()}đ so với tạm tính ban đầu do chênh lệch trọng lượng thực tế.`;
  } else if (diff < 0) {
    return `Tổng cước sau cân đo giảm đi ${Math.abs(diff).toLocaleString()}đ so với tạm tính ban đầu do chênh lệch trọng lượng thực tế.`;
  }
  return 'Tổng cước sau cân đo không đổi.';
};

const getDiffAlertType = (row) => {
  const diff = (row.final_total_amount || 0) - (row.estimated_total_amount || 0);
  return diff > 0 ? 'warning' : 'success';
};

const formatDate = (val) => {
  return formatVietnamDateTime(val);
};

const getPickupStatusLabel = (status) => {
  switch (status) {
    case 'PENDING_CONFIRMATION': return 'Chờ điều phối';
    case 'HUB_REJECTED': return 'Chờ điều phối (Bị từ chối)';
    case 'DISPATCHED_TO_HUB': return 'Chưa xác nhận văn phòng';
    case 'RECEIVED': return 'Văn phòng đã tiếp nhận';
    case 'ASSIGNED_PICKUP': return 'Đã gán bưu tá';
    case 'PICKED': return 'Bưu tá đã lấy hàng';
    default: return status || 'Chờ xử lý';
  }
};

const getPickupStatusType = (status) => {
  switch (status) {
    case 'PENDING_CONFIRMATION': return 'warning';
    case 'HUB_REJECTED': return 'danger';
    case 'DISPATCHED_TO_HUB': return 'info';
    case 'RECEIVED': return 'primary';
    case 'ASSIGNED_PICKUP': return 'warning';
    case 'PICKED': return 'success';
    default: return 'info';
  }
};

const getWaybillStatusLabel = (status) => {
  switch (status) {
    case 'CREATED': return 'Vừa tạo';
    case 'PICKED_PENDING_VERIFY': return 'Chờ nhập kho';
    case 'IN_HUB': return 'Đã nhập kho';
    case 'PENDING_CONFIRMATION': return 'Chờ duyệt';
    case 'PENDING_PICKUP': return 'Chờ lấy hàng';
    case 'IN_TRANSIT': return 'Đang luân chuyển';
    case 'DELIVERING': return 'Đang giao hàng';
    case 'DELIVERED': return 'Giao thành công';
    case 'RETURNED': return 'Đã chuyển hoàn';
    default: return status || 'Chờ xử lý';
  }
};

const getWaybillStatusType = (status) => {
  switch (status) {
    case 'CREATED': return 'info';
    case 'PICKED_PENDING_VERIFY': return 'warning';
    case 'IN_HUB': return 'success';
    case 'PENDING_CONFIRMATION': return 'warning';
    case 'PENDING_PICKUP': return 'info';
    case 'DELIVERING': return 'primary';
    case 'DELIVERED': return 'success';
    case 'RETURNED': return 'danger';
    default: return 'info';
  }
};

const openChangePasswordDialog = () => {
  changePasswordForm.current_password = '';
  changePasswordForm.new_password = '';
  changePasswordForm.confirm_password = '';
  changePasswordVisible.value = true;
};

const changePassword = async () => {
  if (!changePasswordForm.current_password) {
    ElMessage.warning('Vui lòng nhập mật khẩu hiện tại');
    return;
  }
  if (!changePasswordForm.new_password || changePasswordForm.new_password.length < 6) {
    ElMessage.warning('Mật khẩu mới phải có ít nhất 6 ký tự');
    return;
  }
  if (changePasswordForm.new_password !== changePasswordForm.confirm_password) {
    ElMessage.warning('Mật khẩu nhập lại không khớp');
    return;
  }

  changePasswordLoading.value = true;
  try {
    const res = await api.post('/api/auth/change-password', {
      current_password: changePasswordForm.current_password,
      new_password: changePasswordForm.new_password
    });
    ElMessage.success(res.data?.message || 'Đổi mật khẩu thành công');
    changePasswordVisible.value = false;
  } catch (err) {
    ElMessage.error(err.response?.data?.detail || 'Không thể đổi mật khẩu');
  } finally {
    changePasswordLoading.value = false;
  }
};

const handleLogout = () => {
  authStore.logout();
  ElMessage.success('Đã đăng xuất tài khoản!');
  router.push('/login');
};

const goToTracking = () => {
  router.push('/tracking');
};

const openEditDialog = async () => {
  editForm.full_name = authStore.user?.full_name || customerInfo.value.transaction_name || '';
  editForm.phone_number = customerInfo.value.phone_number || '';
  editForm.province = customerInfo.value.province || '';
  editForm.ward = customerInfo.value.ward || '';
  editForm.street_address = customerInfo.value.street_address || '';
  editForm.address_detail = customerInfo.value.address_detail || '';
  editOldProvinceName.value = customerInfo.value.old_province || '';

  selectedProvinceCode.value = null;
  selectedWardCode.value = null;
  availableWards.value = [];

  const searchProvinceName = editForm.province || '';
  const searchWardName = editForm.ward || '';

  const cleanProv = searchProvinceName.replace(/^(Tỉnh|Thành phố|TP\.)\s+/i, '').trim().toLowerCase();
  const prov = provinces.value.find(p => {
    const pName = p.FullName.replace(/^(Tỉnh|Thành phố|TP\.)\s+/i, '').trim().toLowerCase();
    return pName === cleanProv;
  });

  if (prov) {
    selectedProvinceCode.value = prov.Code;
    availableWards.value = prov.Wards || [];

    const cleanWard = searchWardName.replace(/^(Phường|Xã|Thị trấn)\s+/i, '').trim().toLowerCase();
    const wardObj = availableWards.value.find(w => {
      const wName = w.FullName.replace(/^(Phường|Xã|Thị trấn)\s+/i, '').trim().toLowerCase();
      return wName === cleanWard;
    });

    if (wardObj) {
      selectedWardCode.value = wardObj.Code;
      if (!editOldProvinceName.value) {
        await handleWardChange(wardObj.Code);
      }
    }
  }

  editDialogVisible.value = true;
};

const handleSaveProfile = async () => {
  if (!editForm.full_name.trim()) {
    ElMessage.warning('Vui lòng điền tên đại diện Shop');
    return;
  }
  if (!editForm.phone_number.trim()) {
    ElMessage.warning('Vui lòng điền số điện thoại liên hệ');
    return;
  }
  if (!editForm.province) {
    ElMessage.warning('Vui lòng chọn Tỉnh / Thành phố mới');
    return;
  }
  if (!editForm.ward) {
    ElMessage.warning('Vui lòng chọn Phường / Xã mới');
    return;
  }

  const fullAddr = [
    editForm.street_address,
    editForm.ward,
    editForm.province,
    'Việt Nam'
  ].filter(Boolean).join(', ');

  try {
    const res = await api.patch('/api/customers/me', {
      full_name: editForm.full_name,
      phone_number: editForm.phone_number,
      province: editForm.province,
      ward: editForm.ward,
      street_address: editForm.street_address,
      address_detail: fullAddr,
      old_province: editOldProvinceName.value || editForm.province
    });

    const updated = res.data?.customer || {};
    customerInfo.value = {
      ...customerInfo.value,
      ...updated,
      phone_number: updated.phone_number || updated.phone || editForm.phone_number,
      province: updated.province || editForm.province,
      ward: updated.ward || editForm.ward,
      street_address: updated.street_address || editForm.street_address,
      address_detail: updated.address_detail || fullAddr,
      old_province: updated.old_province || editOldProvinceName.value || editForm.province
    };

    if (authStore.user) {
      authStore.user.full_name = editForm.full_name;
      authStore.user.phone_number = editForm.phone_number;
      localStorage.setItem('user', JSON.stringify(authStore.user));
    }

    ElMessage.success(res.data?.message || 'Cập nhật thông tin cá nhân thành công!');
    editDialogVisible.value = false;
  } catch (err) {
    ElMessage.error(err.response?.data?.detail || 'Không thể cập nhật hồ sơ khách hàng');
  }
};

const loadDrafts = () => {
  try {
    const storedQueue = localStorage.getItem('customer_pickup_queue');
    if (storedQueue) {
      draftsList.value = JSON.parse(storedQueue);
    }
  } catch (e) {
    console.error('Lỗi khi tải hàng chờ', e);
  }
  
  try {
    const storedDrafts = localStorage.getItem('customer_pickup_drafts');
    if (storedDrafts) {
      savedDraftsList.value = JSON.parse(storedDrafts);
    }
  } catch (e) {
    console.error('Lỗi khi tải bản nháp', e);
  }
};

onMounted(async () => {
  if (!authStore.user) return;

  loadDrafts();

  let activeUser = authStore.user;
  try {
    const meRes = await api.get('/api/auth/me');
    if (meRes.data) {
      activeUser = {
        ...authStore.user,
        ...meRes.data
      };
      authStore.user = activeUser;
      localStorage.setItem('user', JSON.stringify(activeUser));
    }
  } catch (err) {
    console.error('Không thể gọi API /api/auth/me', err);
  }

  try {
    const res = await api.get('/api/customers/me');
    customerInfo.value = {
      ...customerInfo.value,
      ...res.data,
      phone_number: res.data.phone_number || res.data.phone || activeUser.phone_number || '',
      email: res.data.email || activeUser.email || ''
    };
  } catch (err) {
    console.error('Không thể tải thông tin hồ sơ khách hàng', err);
    customerInfo.value = {
      customer_code: 'REG-PENDING',
      phone_number: activeUser.phone_number || 'Chưa cập nhật',
      email: activeUser.email || '',
      address_detail: '',
      province: '',
      ward: '',
      street_address: '',
      old_province: ''
    };
  }

  fetchPickupsList();
  fetchAvailableServices();
  fetchHubs();
});
</script>
<style scoped src="./CustomerPortal.css"></style>
