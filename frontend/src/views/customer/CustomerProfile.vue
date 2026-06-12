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
              <h3>{{ authStore.user?.full_name }}</h3>
              <p>{{ customerInfo.email }}</p>
              <p>{{ customerInfo.phone_number }}</p>
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
          <el-col :xs="24" :sm="8">
            <el-form-item label="Tỉnh / Thành phố">
              <el-select v-model="editForm.province_id" placeholder="Chọn tỉnh/thành" @change="handleProvinceChange" class="w-full">
                <el-option v-for="p in provinces" :key="p.id" :label="p.name" :value="p.id" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="8">
            <el-form-item label="Quận / Huyện">
              <el-select v-model="editForm.district_id" placeholder="Chọn quận/huyện" @change="handleDistrictChange" class="w-full" :disabled="!editForm.province_id">
                <el-option v-for="d in availableDistricts" :key="d.id" :label="d.name" :value="d.id" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="8">
            <el-form-item label="Phường / Xã">
              <el-select v-model="editForm.ward_id" placeholder="Chọn phường/xã" class="w-full" :disabled="!editForm.district_id">
                <el-option v-for="w in availableWards" :key="w.id" :label="w.name" :value="w.id" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="Địa chỉ chi tiết (Số nhà, tên đường...)">
          <el-input v-model="editForm.address_detail" type="textarea" :rows="2" placeholder="Địa chỉ chi tiết nơi gửi hàng" />
        </el-form-item>
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

// ---- Dynamic Address API (provinces.open-api.vn) ----
const ADDR_API = 'https://provinces.open-api.vn/api';
const provinces = ref([]);
const districtsCache = {};
const wardsCache = {};

const senderDistricts = ref([]);
const senderWards = ref([]);
const receiverDistricts = ref([]);
const receiverWards = ref([]);
const editDistricts = ref([]);
const editWards = ref([]);

const availableDistricts = computed(() => editDistricts.value);
const availableWards = computed(() => editWards.value);

const fetchProvinces = async () => {
  if (provinces.value.length) return;
  try {
    const res = await fetch(`${ADDR_API}/`);
    const data = await res.json();
    provinces.value = data.map(p => ({ id: p.code, name: p.name }));
  } catch (err) {
    console.error('Không thể tải danh sách tỉnh/thành phố', err);
  }
};

const fetchDistrictsForProvince = async (provinceId) => {
  if (!provinceId) return [];
  const pId = Number(provinceId);
  if (districtsCache[pId]) return districtsCache[pId];
  try {
    const res = await fetch(`${ADDR_API}/p/${pId}?depth=2`);
    const data = await res.json();
    const list = (data.districts || []).map(d => ({ id: d.code, name: d.name }));
    districtsCache[pId] = list;
    return list;
  } catch (err) {
    console.error('Không thể tải danh sách quận/huyện', err);
    return [];
  }
};

const fetchWardsForDistrict = async (districtId) => {
  if (!districtId) return [];
  const dId = Number(districtId);
  if (wardsCache[dId]) return wardsCache[dId];
  try {
    const res = await fetch(`${ADDR_API}/d/${dId}?depth=2`);
    const data = await res.json();
    const list = (data.wards || []).map(w => ({ id: w.code, name: w.name }));
    wardsCache[dId] = list;
    return list;
  } catch (err) {
    console.error('Không thể tải danh sách phường/xã', err);
    return [];
  }
};

const authStore = useAuthStore();
const router = useRouter();
const route = useRoute();

const activeTab = computed(() => route.query.tab || 'dashboard');

const customerInfo = ref({
  customer_code: '',
  phone_number: '',
  email: authStore.user?.email || '',
  address_detail: '',
  province_id: null,
  district_id: null,
  ward_id: null,
  address_detail_custom: ''
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
    province_id: null,
    district_id: null,
    ward_id: null,
    address_detail: ''
  },
  receiver: {
    name: '',
    phone: '',
    province_id: null,
    district_id: null,
    ward_id: null,
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
  province_id: null,
  district_id: null,
  ward_id: null,
  address_detail: ''
});

const changePasswordForm = reactive({
  current_password: '',
  new_password: '',
  confirm_password: ''
});

const getProvinceName = (id) => provinces.value.find(p => Number(p.id) === Number(id))?.name || '';
const getDistrictName = (provId, distId) => {
  if (!provId || !distId) return '';
  const cached = districtsCache[Number(provId)];
  if (cached) {
    return cached.find(d => Number(d.id) === Number(distId))?.name || '';
  }
  const activeLists = [senderDistricts.value, receiverDistricts.value, editDistricts.value];
  for (const list of activeLists) {
    const found = list.find(d => Number(d.id) === Number(distId));
    if (found) return found.name;
  }
  return '';
};
const getWardName = (distId, wardId) => {
  if (!distId || !wardId) return '';
  const cached = wardsCache[Number(distId)];
  if (cached) {
    return cached.find(w => Number(w.id) === Number(wardId))?.name || '';
  }
  const activeLists = [senderWards.value, receiverWards.value, editWards.value];
  for (const list of activeLists) {
    const found = list.find(w => Number(w.id) === Number(wardId));
    if (found) return found.name;
  }
  return '';
};

const formattedAddress = computed(() => {
  const c = customerInfo.value;
  if (!c) return 'Chưa cập nhật';
  if (c.address_detail_custom) return c.address_detail_custom;
  
  const pName = getProvinceName(c.province_id);
  const dName = getDistrictName(c.province_id, c.district_id);
  const wName = getWardName(c.district_id, c.ward_id);
  
  const parts = [c.address_detail, wName, dName, pName].filter(Boolean);
  return parts.length > 0 ? parts.join(', ') : 'Chưa cập nhật';
});

const handleProvinceChange = async () => {
  editForm.district_id = null;
  editForm.ward_id = null;
  editWards.value = [];
  if (editForm.province_id) {
    editDistricts.value = await fetchDistrictsForProvince(editForm.province_id);
  } else {
    editDistricts.value = [];
  }
};

const handleDistrictChange = async () => {
  editForm.ward_id = null;
  if (editForm.district_id) {
    editWards.value = await fetchWardsForDistrict(editForm.district_id);
  } else {
    editWards.value = [];
  }
};

const handleSenderProvinceChange = async () => {
  form.sender.district_id = null;
  form.sender.ward_id = null;
  senderWards.value = [];
  if (form.sender.province_id) {
    senderDistricts.value = await fetchDistrictsForProvince(form.sender.province_id);
  } else {
    senderDistricts.value = [];
  }
  debouncedSimulate();
};

const handleSenderDistrictChange = async () => {
  form.sender.ward_id = null;
  if (form.sender.district_id) {
    senderWards.value = await fetchWardsForDistrict(form.sender.district_id);
  } else {
    senderWards.value = [];
  }
};

const handleReceiverProvinceChange = async () => {
  form.receiver.district_id = null;
  form.receiver.ward_id = null;
  receiverWards.value = [];
  if (form.receiver.province_id) {
    receiverDistricts.value = await fetchDistrictsForProvince(form.receiver.province_id);
  } else {
    receiverDistricts.value = [];
  }
  debouncedSimulate();
};

const handleReceiverDistrictChange = async () => {
  form.receiver.ward_id = null;
  if (form.receiver.district_id) {
    receiverWards.value = await fetchWardsForDistrict(form.receiver.district_id);
  } else {
    receiverWards.value = [];
  }
};

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
  editForm.province_id = customerInfo.value.province_id || null;
  editForm.district_id = customerInfo.value.district_id || null;
  editForm.ward_id = customerInfo.value.ward_id || null;
  editForm.address_detail = customerInfo.value.address_detail || '';

  // Preload editDistricts and editWards
  if (editForm.province_id) {
    editDistricts.value = await fetchDistrictsForProvince(editForm.province_id);
  } else {
    editDistricts.value = [];
  }
  if (editForm.district_id) {
    editWards.value = await fetchWardsForDistrict(editForm.district_id);
  } else {
    editWards.value = [];
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

  const pName = getProvinceName(editForm.province_id);
  const dName = getDistrictName(editForm.province_id, editForm.district_id);
  const wName = getWardName(editForm.district_id, editForm.ward_id);

  try {
    const res = await api.patch('/api/customers/me', {
      full_name: editForm.full_name,
      phone_number: editForm.phone_number,
      province_id: editForm.province_id,
      district_id: editForm.district_id,
      ward_id: editForm.ward_id,
      province: pName,
      ward: wName,
      address_detail: editForm.address_detail
    });

    const updated = res.data?.customer || {};
    customerInfo.value = {
      ...customerInfo.value,
      ...updated,
      phone_number: updated.phone_number || updated.phone || editForm.phone_number,
      province_id: updated.province_id || editForm.province_id,
      district_id: updated.district_id || editForm.district_id,
      ward_id: updated.ward_id || editForm.ward_id,
      address_detail: updated.address_detail || editForm.address_detail,
      address_detail_custom: [editForm.address_detail, wName, dName, pName].filter(Boolean).join(', ')
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

  // 1. Fetch provinces first
  await fetchProvinces();

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

    // 2. Preload districts and wards for the customer's registered address
    if (customerInfo.value.province_id) {
      const dists = await fetchDistrictsForProvince(customerInfo.value.province_id);
      senderDistricts.value = dists;
      editDistricts.value = dists;
    }
    if (customerInfo.value.district_id) {
      const wrds = await fetchWardsForDistrict(customerInfo.value.district_id);
      senderWards.value = wrds;
      editWards.value = wrds;
    }
  } catch (err) {
    console.error('Không thể tải thông tin hồ sơ khách hàng', err);
    customerInfo.value = {
      customer_code: 'REG-PENDING',
      phone_number: activeUser.phone_number || 'Chưa cập nhật',
      email: activeUser.email || '',
      address_detail: '',
      province_id: null,
      district_id: null,
      ward_id: null
    };
  }

  fetchPickupsList();
  fetchAvailableServices();
  fetchHubs();
});
</script>
<style scoped src="./CustomerPortal.css"></style>
