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
            <h2 class="page-title">Gửi thư nội bộ</h2>
            <p class="page-subtitle">Lập phiếu gửi thư/bưu phẩm nội bộ không qua điều phối</p>
          </div>
        </div>
        <div class="header-actions">
          <button class="btn-primary" @click="saveWaybill" :disabled="loading">
            <el-icon class="is-loading mr-2" v-if="loading"><Loading /></el-icon>
            <el-icon v-else><DocumentAdd /></el-icon>
            <span>Tạo phiếu gửi</span>
          </button>
        </div>
      </header>

      <!-- Main Form Area (2-Column Layout) -->
      <el-form :model="waybillForm" :rules="rules" ref="formRef" label-position="top" class="modern-form animate-fade-in-up">
        <el-row :gutter="24" class="form-row-container">
          
          <!-- LEFT COLUMN (60%): Sender & Receiver Info -->
          <el-col :span="14" class="column-layout">
            
            <!-- Block 1: Sender Info -->
            <div class="content-card compact-card form-section-card sender-card">
              <div class="section-header">
                <el-icon><Shop /></el-icon><span>Thông tin Người gửi (Nhập tay)</span>
              </div>
              
              <el-row :gutter="16">
                <el-col :span="14">
                  <el-form-item label="Họ tên người gửi" prop="sender_name" class="mb-12">
                    <el-input v-model="waybillForm.sender_name" placeholder="Tên đơn vị, cá nhân gửi nội bộ..." clearable>
                      <template #prefix><el-icon><User /></el-icon></template>
                    </el-input>
                  </el-form-item>
                </el-col>
                <el-col :span="10">
                  <el-form-item label="Số điện thoại gửi" prop="sender_phone" class="mb-12">
                    <el-input v-model="waybillForm.sender_phone" placeholder="SĐT liên hệ..." clearable>
                      <template #prefix><el-icon><Phone /></el-icon></template>
                    </el-input>
                  </el-form-item>
                </el-col>
              </el-row>

              <el-row :gutter="16">
                <el-col :span="12">
                  <el-form-item label="Tỉnh / Thành phố (Mới)" prop="senderProvinceName" class="mb-12">
                    <el-select v-model="waybillForm.senderProvinceName" placeholder="Chọn tỉnh/thành phố gửi..." filterable class="w-full" @change="handleSenderProvinceChange">
                      <el-option v-for="p in provinces" :key="p.Code" :label="p.FullName" :value="p.FullName" />
                    </el-select>
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="Phường / Xã (Mới)" prop="senderWardCode" class="mb-12">
                    <el-select v-model="selectedSenderWardCode" placeholder="Chọn phường/xã gửi..." :disabled="!waybillForm.senderProvinceName" filterable class="w-full" @change="handleSenderWardChange">
                      <el-option v-for="w in senderWards" :key="w.Code" :label="w.FullName" :value="w.Code" />
                    </el-select>
                  </el-form-item>
                </el-col>
              </el-row>

              <el-form-item label="Số nhà, đường gửi" prop="senderStreet" class="mb-12">
                <el-input 
                  v-model="waybillForm.senderStreet" 
                  placeholder="VD: 12 Nguyễn Huệ" 
                  clearable
                />
              </el-form-item>

              <!-- Box thông tin địa chỉ người gửi sẽ lưu -->
              <div v-if="waybillForm.senderProvinceName || waybillForm.senderWard" class="address-preview-container animate-fade-in" style="border: 2px solid #2b6cb0; border-radius: 12px; padding: 16px; background-color: #f7fafc; margin-bottom: 20px;">
                <div style="display: flex; align-items: center; margin-bottom: 12px; color: #2b6cb0; font-weight: bold; font-size: 14px;">
                  <el-icon style="margin-right: 6px;"><LocationInformation /></el-icon>
                  <span>Địa chỉ gửi lưu trữ</span>
                </div>
                <div style="display: flex; align-items: baseline; gap: 8px; margin-bottom: 8px;">
                  <span style="font-size: 12px; color: #888; white-space: nowrap; min-width: 130px;">Địa chỉ sau sáp nhập:</span>
                  <span style="font-size: 14px; font-weight: 600; color: #2d3748;">{{ compiledSenderAddress || '—' }}</span>
                </div>
                <div style="display: flex; align-items: baseline; gap: 8px;">
                  <span style="font-size: 12px; color: #888; white-space: nowrap; min-width: 130px;">Tỉnh cũ trước sáp nhập:</span>
                  <span v-if="senderLegacyLoading" style="font-size: 13px; color: #999; font-style: italic;">Đang tra cứu...</span>
                  <span v-else style="font-size: 14px; font-weight: 600; color: #2b6cb0;">{{ senderOldProvinceName || '—' }}</span>
                </div>
              </div>

              <el-row :gutter="16">
                <el-col :span="24">
                  <el-form-item label="Bưu cục nhận bàn giao thư (Hub gốc)" prop="origin_hub_id" class="mb-0">
                    <el-select v-model="waybillForm.origin_hub_id" placeholder="Hệ thống tự động map..." filterable class="w-full" :disabled="auth.user?.role_id !== 1">
                      <template #prefix><el-icon><LocationInformation /></el-icon></template>
                      <el-option v-for="hub in hubs" :key="hub.hub_id" :label="hub.hub_code + ' - ' + hub.hub_name" :value="hub.hub_id" />
                    </el-select>
                  </el-form-item>
                </el-col>
              </el-row>
            </div>

            <!-- Block 2: Receiver Info -->
            <div class="content-card compact-card form-section-card receiver-card">
              <div class="section-header">
                <el-icon><Avatar /></el-icon><span>Thông tin Người nhận</span>
              </div>
              
              <el-row :gutter="16">
                <el-col :span="10">
                  <el-form-item label="Số điện thoại nhận" prop="receiver_phone" class="mb-12">
                    <el-input v-model="waybillForm.receiver_phone" placeholder="SĐT người nhận..." clearable>
                      <template #prefix><el-icon><Phone /></el-icon></template>
                    </el-input>
                  </el-form-item>
                </el-col>
                <el-col :span="14">
                  <el-form-item label="Họ tên người nhận" prop="receiver_name" class="mb-12">
                    <el-input v-model="waybillForm.receiver_name" placeholder="Họ và tên người nhận..." clearable>
                      <template #prefix><el-icon><User /></el-icon></template>
                    </el-input>
                  </el-form-item>
                </el-col>
              </el-row>

              <el-row :gutter="16">
                <el-col :span="12">
                  <el-form-item label="Tỉnh / Thành phố (Mới)" prop="receiverProvinceName" class="mb-12">
                    <el-select v-model="waybillForm.receiverProvinceName" placeholder="Chọn tỉnh/thành phố nhận..." filterable class="w-full" @change="handleReceiverProvinceChange">
                      <el-option v-for="p in provinces" :key="p.Code" :label="p.FullName" :value="p.FullName" />
                    </el-select>
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="Phường / Xã (Mới)" prop="receiverWardCode" class="mb-12">
                    <el-select v-model="selectedReceiverWardCode" placeholder="Chọn phường/xã nhận..." :disabled="!waybillForm.receiverProvinceName" filterable class="w-full" @change="handleReceiverWardChange">
                      <el-option v-for="w in receiverWards" :key="w.Code" :label="w.FullName" :value="w.Code" />
                    </el-select>
                  </el-form-item>
                </el-col>
              </el-row>
              
              <el-form-item label="Số nhà, đường nhận" prop="receiverStreet" class="mb-12">
                <el-input 
                  v-model="waybillForm.receiverStreet" 
                  placeholder="VD: 15 Lê Lợi" 
                  clearable
                />
              </el-form-item>

              <!-- Box thông tin địa chỉ người nhận sẽ lưu -->
              <div v-if="waybillForm.receiverProvinceName || waybillForm.receiverWard" class="address-preview-container animate-fade-in" style="border: 2px solid #2ec17e; border-radius: 12px; padding: 16px; background-color: #f4fbf7; margin-bottom: 20px;">
                <div style="display: flex; align-items: center; margin-bottom: 12px; color: #2ec17e; font-weight: bold; font-size: 14px;">
                  <el-icon style="margin-right: 6px;"><Location /></el-icon>
                  <span>Địa chỉ nhận lưu trữ</span>
                </div>
                <div style="display: flex; align-items: baseline; gap: 8px; margin-bottom: 8px;">
                  <span style="font-size: 12px; color: #888; white-space: nowrap; min-width: 130px;">Địa chỉ sau sáp nhập:</span>
                  <span style="font-size: 14px; font-weight: 600; color: #2e7d32;">{{ compiledReceiverAddress || '—' }}</span>
                </div>
                <div style="display: flex; align-items: baseline; gap: 8px;">
                  <span style="font-size: 12px; color: #888; white-space: nowrap; min-width: 130px;">Tỉnh cũ trước sáp nhập:</span>
                  <span v-if="receiverLegacyLoading" style="font-size: 13px; color: #999; font-style: italic;">Đang tra cứu...</span>
                  <span v-else style="font-size: 14px; font-weight: 600; color: #2b6cb0;">{{ receiverOldProvinceName || '—' }}</span>
                </div>
              </div>

              <el-row :gutter="16">
                <el-col :span="24">
                  <el-form-item label="Bưu cục phát thư (Hub đích)" prop="dest_hub_id" class="mb-0">
                    <el-select v-model="waybillForm.dest_hub_id" placeholder="Hệ thống tự động map..." filterable class="w-full">
                      <template #prefix><el-icon><Location /></el-icon></template>
                      <el-option v-for="hub in hubs" :key="hub.hub_id" :label="hub.hub_code + ' - ' + hub.hub_name" :value="hub.hub_id" />
                    </el-select>
                  </el-form-item>
                </el-col>
              </el-row>
            </div>
          </el-col>

          <!-- RIGHT COLUMN (40%): Items, Finance & Summary -->
          <el-col :span="10" class="column-layout">
            
            <!-- Block 3: Items Details List -->
            <div class="content-card compact-card form-section-card items-card">
              <div class="section-header flex-between mb-8">
                <div class="flex-center gap-2">
                  <el-icon><Box /></el-icon><span>Thông tin Hàng hóa</span>
                </div>
              </div>

              <div class="items-list-container">
                <div class="item-input-row" style="border: none; padding: 0; margin: 0;">
                  <el-row :gutter="12">
                    <el-col :span="12">
                      <el-form-item label="Tên sản phẩm/thư" required class="mb-8">
                        <el-input v-model="waybillForm.items[0].product_name" placeholder="Tên thư từ, tài liệu..." size="small" />
                      </el-form-item>
                    </el-col>
                    <el-col :span="12">
                      <el-form-item label="Loại hàng" required class="mb-8">
                        <el-select v-model="waybillForm.items[0].product_group" placeholder="Chọn..." size="small" class="w-full">
                          <el-option v-for="pt in productTypes" :key="pt.code" :label="pt.label" :value="pt.code" />
                        </el-select>
                      </el-form-item>
                    </el-col>
                  </el-row>

                  <el-row :gutter="12">
                    <el-col :span="12">
                      <el-form-item label="K.lượng (kg)" required class="mb-8">
                        <el-input-number v-model="waybillForm.items[0].weight" :min="0.01" :step="0.1" size="small" controls-position="right" class="w-full" />
                      </el-form-item>
                    </el-col>
                    <el-col :span="12">
                      <el-form-item label="Số lượng" required class="mb-8">
                        <el-input-number v-model="waybillForm.items[0].quantity" :min="1" size="small" controls-position="right" class="w-full" />
                      </el-form-item>
                    </el-col>
                  </el-row>
                </div>
              </div>
            </div>

            <!-- Block 4: Shipping Configs & Payments -->
            <div class="content-card compact-card form-section-card settings-card">
              <div class="section-header">
                <el-icon><Setting /></el-icon><span>Cấu hình cước phí & ghi chú</span>
              </div>

              <el-row :gutter="16">
                <el-col :span="24">
                  <el-form-item label="Thu phí gửi nội bộ" class="mb-12">
                    <el-switch v-model="isChargingEnabled" active-text="Có thu phí" inactive-text="Không thu phí (Mặc định)" />
                  </el-form-item>
                </el-col>
              </el-row>

              <el-row :gutter="16" v-if="isChargingEnabled">
                <el-col :span="24">
                  <el-form-item label="Cước phí nội bộ (VNĐ)" prop="custom_shipping_fee" class="mb-12">
                    <el-input-number 
                      v-model="waybillForm.custom_shipping_fee" 
                      :min="0" :step="1000" 
                      class="w-full modern-price-input" 
                      :controls="false"
                    />
                  </el-form-item>
                </el-col>
              </el-row>

              <el-row :gutter="16">
                <el-col :span="12">
                  <el-form-item label="Dịch vụ vận chuyển" prop="service_type" class="mb-12">
                    <el-select v-model="waybillForm.service_type" placeholder="Dịch vụ..." class="w-full">
                      <el-option label="Chuyển phát nhanh" value="CPN" />
                      <el-option label="Tiết kiệm" value="TK" />
                      <el-option label="Hỏa tốc" value="HT" />
                    </el-select>
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="Người trả phí" prop="payment_method" class="mb-12">
                    <el-select v-model="waybillForm.payment_method" class="w-full">
                      <el-option label="Shop trả cước cuối tháng" value="SENDER_DEBT" />
                      <el-option label="Shop trả cước ngay khi gửi" value="SENDER_PAY" />
                      <el-option label="Người nhận thanh toán cước" value="RECEIVER_PAY" />
                    </el-select>
                  </el-form-item>
                </el-col>
              </el-row>

              <el-row :gutter="16">
                <el-col :span="24">
                  <el-form-item label="Ghi chú thêm" class="mb-0">
                    <el-input v-model="waybillForm.note" placeholder="Thông tin nội bộ cần lưu ý..." clearable />
                  </el-form-item>
                </el-col>
              </el-row>
            </div>

            <!-- Block 5: Summary -->
            <div class="content-card compact-card form-section-card extra-services-card summary-section">
              <div class="section-header flex-between mb-8">
                <div class="flex-center gap-2">
                  <el-icon><Money /></el-icon><span>Tổng cước phí lưu trữ</span>
                </div>
              </div>

              <div class="summary-details">
                <div class="summary-line total-line">
                  <span class="label">TỔNG CỘNG:</span>
                  <span class="value total-amount" style="color: #2ec17e;">
                    {{ (isChargingEnabled ? waybillForm.custom_shipping_fee : 0).toLocaleString() }} đ
                  </span>
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
import { ref, reactive, computed, onMounted } from 'vue';
import { 
  ArrowLeft, User, Box, DocumentAdd, Money, Shop,
  LocationInformation, Location, Avatar, Phone, Setting
} from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import api from '@/api/axios';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth'; 
import localProvincesData from '../../../../assets/data/vietnam_provinces.json';

const auth = useAuthStore(); 
const router = useRouter();
const formRef = ref(null);
const loading = ref(false);

const PROVINCES_API_V2 = 'https://provinces.open-api.vn/api/v2';

const provinces = ref([]);
const senderWards = ref([]);
const receiverWards = ref([]);

const selectedSenderWardCode = ref(null);
const selectedReceiverWardCode = ref(null);

const senderOldProvinceName = ref('');
const senderLegacyLoading = ref(false);
const receiverOldProvinceName = ref('');
const receiverLegacyLoading = ref(false);

const isChargingEnabled = ref(false);

const productTypes = ref([
  { code: 'DOCUMENT', label: 'Thư từ/Tài liệu' },
  { code: 'PARCEL', label: 'Bưu phẩm, bưu kiện' },
  { code: 'GENERAL', label: 'Hàng hóa thông thường' }
]);

const hubs = ref([]);

const waybillForm = reactive({
  origin_hub_id: null,
  dest_hub_id: null,
  sender_name: '',
  sender_phone: '',
  senderProvinceName: '',
  senderWard: '',
  senderStreet: '',
  receiver_name: '',
  receiver_phone: '',
  receiverProvinceName: '',
  receiverWard: '',
  receiverStreet: '',
  items: [
    {
      product_group: 'DOCUMENT',
      product_name: 'Thư nội bộ',
      weight: 0.1,
      length: 0,
      width: 0,
      height: 0,
      quantity: 1,
      declared_value: 0
    }
  ],
  service_type: 'CPN',
  payment_method: 'SENDER_PAY',
  note: '',
  custom_shipping_fee: 0
});

// Map mã tỉnh cũ (trước 2025) -> tên tỉnh cũ
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

const rules = {
  sender_name: [{ required: true, message: 'Nhập họ tên người gửi', trigger: 'blur' }],
  sender_phone: [
    { required: true, message: 'Nhập SĐT người gửi', trigger: 'blur' },
    { pattern: /^[0-9]{10}$/, message: 'SĐT gồm 10 chữ số', trigger: 'blur' }
  ],
  receiver_name: [{ required: true, message: 'Nhập họ tên người nhận', trigger: 'blur' }],
  receiver_phone: [
    { required: true, message: 'Nhập SĐT người nhận', trigger: 'blur' },
    { pattern: /^[0-9]{10}$/, message: 'SĐT gồm 10 chữ số', trigger: 'blur' }
  ],
  senderProvinceName: [{ required: true, message: 'Chọn tỉnh gửi', trigger: 'change' }],
  receiverProvinceName: [{ required: true, message: 'Chọn tỉnh nhận', trigger: 'change' }],
  senderStreet: [{ required: true, message: 'Nhập số nhà, đường gửi', trigger: 'blur' }],
  receiverStreet: [{ required: true, message: 'Nhập số nhà, đường nhận', trigger: 'blur' }]
};

const compiledSenderAddress = computed(() => {
  return [
    waybillForm.senderStreet,
    waybillForm.senderWard,
    waybillForm.senderProvinceName,
    'Việt Nam'
  ].filter(Boolean).join(', ');
});

const compiledReceiverAddress = computed(() => {
  return [
    waybillForm.receiverStreet,
    waybillForm.receiverWard,
    waybillForm.receiverProvinceName,
    'Việt Nam'
  ].filter(Boolean).join(', ');
});

const fetchProvinces = async () => {
  provinces.value = localProvincesData;
};

const handleSenderProvinceChange = () => {
  selectedSenderWardCode.value = null;
  waybillForm.senderWard = '';
  senderOldProvinceName.value = '';
  
  const provinceObj = provinces.value.find(p => p.FullName === waybillForm.senderProvinceName);
  if (provinceObj) {
    senderWards.value = provinceObj.Wards || [];
    matchHubAndSet('origin', provinceObj.Code);
  } else {
    senderWards.value = [];
  }
};

const handleSenderWardChange = async (wardCode) => {
  if (!wardCode) {
    waybillForm.senderWard = '';
    senderOldProvinceName.value = '';
    return;
  }
  
  const wardObj = senderWards.value.find(w => w.Code === wardCode);
  waybillForm.senderWard = wardObj ? wardObj.FullName : '';
  
  senderLegacyLoading.value = true;
  try {
    const res = await fetch(`${PROVINCES_API_V2}/w/${wardCode}/to-legacies/`);
    if (!res.ok) throw new Error();
    const legacies = await res.json();
    if (Array.isArray(legacies) && legacies.length > 0) {
      const code = legacies[0].province_code;
      senderOldProvinceName.value = OLD_PROVINCE_CODE_MAP[code] || waybillForm.senderProvinceName;
    } else {
      senderOldProvinceName.value = waybillForm.senderProvinceName;
    }
  } catch (err) {
    senderOldProvinceName.value = waybillForm.senderProvinceName;
  } finally {
    senderLegacyLoading.value = false;
  }
};

const handleReceiverProvinceChange = () => {
  selectedReceiverWardCode.value = null;
  waybillForm.receiverWard = '';
  receiverOldProvinceName.value = '';
  
  const provinceObj = provinces.value.find(p => p.FullName === waybillForm.receiverProvinceName);
  if (provinceObj) {
    receiverWards.value = provinceObj.Wards || [];
    matchHubAndSet('dest', provinceObj.Code);
  } else {
    receiverWards.value = [];
  }
};

const handleReceiverWardChange = async (wardCode) => {
  if (!wardCode) {
    waybillForm.receiverWard = '';
    receiverOldProvinceName.value = '';
    return;
  }
  
  const wardObj = receiverWards.value.find(w => w.Code === wardCode);
  waybillForm.receiverWard = wardObj ? wardObj.FullName : '';
  
  receiverLegacyLoading.value = true;
  try {
    const res = await fetch(`${PROVINCES_API_V2}/w/${wardCode}/to-legacies/`);
    if (!res.ok) throw new Error();
    const legacies = await res.json();
    if (Array.isArray(legacies) && legacies.length > 0) {
      const code = legacies[0].province_code;
      receiverOldProvinceName.value = OLD_PROVINCE_CODE_MAP[code] || waybillForm.receiverProvinceName;
    } else {
      receiverOldProvinceName.value = waybillForm.receiverProvinceName;
    }
  } catch (err) {
    receiverOldProvinceName.value = waybillForm.receiverProvinceName;
  } finally {
    receiverLegacyLoading.value = false;
  }
};

const normalizeText = (value = '') => value
  .toString()
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/đ/g, 'd')
  .replace(/Đ/g, 'D')
  .toLowerCase()
  .trim();

const matchHubAndSet = (type, provinceCode) => {
  if (!provinceCode) return;
  const pCodeStr = provinceCode.toString().padStart(2, '0');
  let match = hubs.value.find(h => h.province_id === Number(pCodeStr));
  if (!match) {
    const pName = normalizeText(provinces.value.find(p => p.Code === pCodeStr)?.FullName);
    if (pName) {
      match = hubs.value.find(h => {
        const hubText = normalizeText(`${h.hub_name || ''} ${h.address_detail || ''}`);
        return hubText.includes(pName) || pName.includes(hubText);
      });
    }
  }
  
  if (match) {
    if (type === 'origin') waybillForm.origin_hub_id = match.hub_id;
    if (type === 'dest') waybillForm.dest_hub_id = match.hub_id;
  }
};

const saveWaybill = async () => {
  if (!formRef.value) return;
  
  await formRef.value.validate(async (valid) => {
    if (!valid) {
      ElMessage.warning('Vui lòng kiểm tra lại các thông tin bắt buộc');
      return;
    }

    if (!waybillForm.senderProvinceName || !waybillForm.receiverProvinceName) {
      ElMessage.warning('Vui lòng điền đầy đủ tỉnh/thành gửi và nhận');
      return;
    }

    if (!waybillForm.origin_hub_id || !waybillForm.dest_hub_id) {
      ElMessage.warning('Bưu cục chưa được map. Vui lòng chọn tỉnh hợp lệ');
      return;
    }
    
    loading.value = true;
    try {
      const payload = {
        origin_hub_id: waybillForm.origin_hub_id,
        dest_hub_id: waybillForm.dest_hub_id,
        sender_name: waybillForm.sender_name,
        sender_phone: waybillForm.sender_phone,
        sender_address: compiledSenderAddress.value,
        receiver_name: waybillForm.receiver_name,
        receiver_phone: waybillForm.receiver_phone,
        receiver_address: compiledReceiverAddress.value,
        actual_weight: waybillForm.items[0].weight,
        length: 0,
        width: 0,
        height: 0,
        product_name: waybillForm.items[0].product_name,
        product_group: waybillForm.items[0].product_group,
        declared_value: 0,
        payment_method: waybillForm.payment_method,
        cod_amount: 0,
        note: waybillForm.note,
        extra_services: [],
        shipping_fee: isChargingEnabled.value ? waybillForm.custom_shipping_fee : 0,
        is_internal: true,
        // Lưu tỉnh đích cũ để phân loại
        old_province: receiverOldProvinceName.value || waybillForm.receiverProvinceName
      };

      const response = await api.post('/api/waybills', payload, {
         headers: { 'Idempotency-Key': `wb-internal-create-${Date.now()}` }
      });

      ElMessage({ message: `Đã tạo phiếu gửi nội bộ thành công: ${response.data.waybill_code}`, type: 'success' });
      
      // Reset form
      waybillForm.receiver_name = '';
      waybillForm.receiver_phone = '';
      waybillForm.receiverProvinceName = '';
      waybillForm.receiverWard = '';
      waybillForm.receiverStreet = '';
      selectedReceiverWardCode.value = null;
      waybillForm.note = '';
      receiverOldProvinceName.value = '';
      formRef.value.clearValidate();

    } catch (err) {
      ElMessage.error(err.response?.data?.detail || 'Lỗi hệ thống khi lưu đơn hàng');
    } finally {
      loading.value = false;
    }
  });
};

onMounted(async () => {
  await fetchProvinces();
  try {
    const resHubs = await api.get('/api/hubs').catch(()=>({data:[]}));
    hubs.value = resHubs.data.items || resHubs.data || [];

    if (auth.user?.role_id !== 1 && auth.user?.primary_hub_id) {
      waybillForm.origin_hub_id = auth.user.primary_hub_id;
      const myHub = hubs.value.find(h => h.hub_id === auth.user.primary_hub_id);
      if (myHub && myHub.province_id) {
        // Tự động chọn tỉnh gửi dựa trên Hub của User đăng nhập
        const provCodeStr = myHub.province_id.toString().padStart(2, '0');
        const foundProv = provinces.value.find(p => p.Code === provCodeStr);
        if (foundProv) {
          waybillForm.senderProvinceName = foundProv.FullName;
          handleSenderProvinceChange();
        }
      }
    }
  } catch (e) {
    ElMessage.error('Không thể tải danh sách bưu cục');
  }
});
</script>

<style scoped src="@/styles/admin/waybills/CreateWaybill.css"></style>
