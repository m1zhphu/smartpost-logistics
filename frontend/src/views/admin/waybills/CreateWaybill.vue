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
            <h2 class="page-title">Lập phiếu gửi hàng (Admin)</h2>
            <p class="page-subtitle">Quản lý nhập thông tin gửi/nhận và cước phí tối ưu</p>
          </div>
        </div>
        <div class="header-actions">
          <el-dropdown trigger="click" style="margin-right: 12px;">
            <el-button type="success" plain style="border-radius: 12px; padding: 12px 20px; font-weight: 700; height: 100%;">
              <el-icon class="mr-1"><DocumentAdd /></el-icon>Excel <el-icon class="el-icon--right"><ArrowDown /></el-icon>
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item @click="triggerExcelImport">
                  <el-icon><DocumentAdd /></el-icon>Nhập từ Excel
                </el-dropdown-item>
                <el-dropdown-item @click="downloadTemplate">
                  <el-icon><Download /></el-icon>Tải mẫu Excel
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>

          <button class="btn-primary" @click="saveWaybill" :disabled="loading">
            <el-icon class="is-loading mr-2" v-if="loading"><Loading /></el-icon>
            <el-icon v-else><DocumentAdd /></el-icon>
            <span>Tạo vận đơn</span>
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
                <el-icon><Shop /></el-icon><span>Thông tin Người gửi</span>
              </div>

              <el-form-item label="Khách hàng đã đăng ký (Shop)" prop="customer_id" class="mb-12">
                <el-select 
                  v-model="waybillForm.customer_id" 
                  placeholder="Tìm tên shop hoặc mã KH (Không bắt buộc)..." 
                  filterable 
                  clearable
                  class="w-full" 
                  @change="handleCustomerChange"
                >
                  <template #prefix><el-icon><Shop /></el-icon></template>
                  <el-option v-for="shop in customers" :key="shop.customer_id" :label="shop.company_name || shop.transaction_name || shop.name" :value="shop.customer_id" />
                </el-select>
              </el-form-item>
              
              <el-row :gutter="16">
                <el-col :span="14">
                  <el-form-item label="Họ tên người gửi" prop="sender_name" class="mb-12">
                    <el-input v-model="waybillForm.sender_name" placeholder="Tên shop hoặc cá nhân người gửi..." clearable>
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
                <el-col :span="8">
                  <el-form-item label="Tỉnh/Thành gửi" prop="sender_province_id" class="mb-12">
                    <el-select v-model="waybillForm.sender.province_id" placeholder="Chọn tỉnh..." filterable class="w-full" @change="handleSenderProvinceChange">
                      <el-option v-for="p in provinces" :key="p.id" :label="p.name" :value="p.id" />
                    </el-select>
                  </el-form-item>
                </el-col>
                <el-col :span="8">
                  <el-form-item label="Quận/Huyện gửi" prop="sender_district_id" class="mb-12">
                    <el-select v-model="waybillForm.sender.district_id" placeholder="Chọn huyện..." :disabled="!waybillForm.sender.province_id" filterable class="w-full" @change="handleSenderDistrictChange">
                      <el-option v-for="d in senderDistricts" :key="d.id" :label="d.name" :value="d.id" />
                    </el-select>
                  </el-form-item>
                </el-col>
                <el-col :span="8">
                  <el-form-item label="Phường/Xã gửi" prop="sender_ward_id" class="mb-12">
                    <el-select v-model="waybillForm.sender.ward_id" placeholder="Chọn xã..." :disabled="!waybillForm.sender.district_id" filterable class="w-full">
                      <el-option v-for="w in senderWards" :key="w.id" :label="w.name" :value="w.id" />
                    </el-select>
                  </el-form-item>
                </el-col>
              </el-row>

              <el-form-item label="Địa chỉ gửi chi tiết (Số nhà, đường...)" prop="sender_address_detail" class="mb-12">
                <el-input 
                  v-model="waybillForm.sender.address_detail" 
                  type="textarea" 
                  :rows="2" 
                  placeholder="Số nhà, ngõ ngách, tên đường..." 
                  resize="none"
                />
              </el-form-item>

              <el-row :gutter="16">
                <el-col :span="12">
                  <el-form-item label="Bưu cục gửi (Origin Hub)" prop="origin_hub_id" class="mb-0">
                    <el-select v-model="waybillForm.origin_hub_id" placeholder="Hệ thống tự động map..." filterable class="w-full" :disabled="auth.user?.role_id !== 1">
                      <template #prefix><el-icon><LocationInformation /></el-icon></template>
                      <el-option v-for="hub in hubs" :key="hub.hub_id" :label="hub.hub_code + ' - ' + hub.hub_name" :value="hub.hub_id" />
                    </el-select>
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="Bưu cục nhận (Dest Hub)" prop="dest_hub_id" class="mb-0">
                    <el-select v-model="waybillForm.dest_hub_id" placeholder="Hệ thống tự động map..." filterable class="w-full">
                      <template #prefix><el-icon><Location /></el-icon></template>
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

              <el-row :gutter="16">
                <el-col :span="8">
                  <el-form-item label="Tỉnh/Thành nhận" prop="receiver_province_id" class="mb-12">
                    <el-select v-model="waybillForm.receiver.province_id" placeholder="Chọn tỉnh..." filterable class="w-full" @change="handleReceiverProvinceChange">
                      <el-option v-for="p in provinces" :key="p.id" :label="p.name" :value="p.id" />
                    </el-select>
                  </el-form-item>
                </el-col>
                <el-col :span="8">
                  <el-form-item label="Quận/Huyện nhận" prop="receiver_district_id" class="mb-12">
                    <el-select v-model="waybillForm.receiver.district_id" placeholder="Chọn huyện..." :disabled="!waybillForm.receiver.province_id" filterable class="w-full" @change="handleReceiverDistrictChange">
                      <el-option v-for="d in receiverDistricts" :key="d.id" :label="d.name" :value="d.id" />
                    </el-select>
                  </el-form-item>
                </el-col>
                <el-col :span="8">
                  <el-form-item label="Phường/Xã nhận" prop="receiver_ward_id" class="mb-12">
                    <el-select v-model="waybillForm.receiver.ward_id" placeholder="Chọn xã..." :disabled="!waybillForm.receiver.district_id" filterable class="w-full">
                      <el-option v-for="w in receiverWards" :key="w.id" :label="w.name" :value="w.id" />
                    </el-select>
                  </el-form-item>
                </el-col>
              </el-row>
              
              <el-form-item label="Địa chỉ giao hàng chi tiết" prop="receiver_address_detail" class="mb-0">
                <el-input 
                  v-model="waybillForm.receiver.address_detail" 
                  type="textarea" 
                  :rows="2" 
                  placeholder="Số nhà, tên đường..." 
                  resize="none"
                />
              </el-form-item>
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
                <el-button type="primary" size="small" plain @click="addItemRow">+ Thêm mặt hàng</el-button>
              </div>

              <div class="items-list-container">
                <div v-for="(item, index) in waybillForm.items" :key="index" class="item-input-row">
                  <div class="flex-between mb-8">
                    <strong>Mặt hàng {{ index + 1 }}</strong>
                    <el-button v-if="waybillForm.items.length > 1" size="small" type="danger" text @click="removeItemRow(index)">Xóa</el-button>
                  </div>
                  
                  <el-row :gutter="12">
                    <el-col :span="12">
                      <el-form-item label="Tên sản phẩm" required class="mb-8">
                        <el-input v-model="item.product_name" placeholder="Tên sản phẩm..." size="small" />
                      </el-form-item>
                    </el-col>
                    <el-col :span="12">
                      <el-form-item label="Loại hàng" required class="mb-8">
                        <el-select v-model="item.product_group" placeholder="Chọn..." size="small" class="w-full">
                          <el-option v-for="pt in productTypes" :key="pt.code" :label="pt.label" :value="pt.code" />
                        </el-select>
                      </el-form-item>
                    </el-col>
                  </el-row>

                  <el-row :gutter="12">
                    <el-col :span="8">
                      <el-form-item label="K.lượng (kg)" required class="mb-8">
                        <el-input-number v-model="item.weight" :min="0.01" :step="0.1" size="small" controls-position="right" class="w-full" />
                      </el-form-item>
                    </el-col>
                    <el-col :span="8">
                      <el-form-item label="Số lượng" required class="mb-8">
                        <el-input-number v-model="item.quantity" :min="1" size="small" controls-position="right" class="w-full" />
                      </el-form-item>
                    </el-col>
                    <el-col :span="8">
                      <el-form-item label="Khai giá (đ)" class="mb-8">
                        <el-input-number v-model="item.declared_value" :min="0" :step="1000" size="small" :controls="false" class="w-full" />
                      </el-form-item>
                    </el-col>
                  </el-row>

                  <el-row :gutter="12">
                    <el-col :span="24">
                      <el-form-item label="Kích thước (Dài x Rộng x Cao cm)" class="mb-0">
                        <div class="dimension-inputs">
                          <el-input-number v-model="item.length" :min="0" placeholder="Dài" size="small" :controls="false" />
                          <span>×</span>
                          <el-input-number v-model="item.width" :min="0" placeholder="Rộng" size="small" :controls="false" />
                          <span>×</span>
                          <el-input-number v-model="item.height" :min="0" placeholder="Cao" size="small" :controls="false" />
                        </div>
                      </el-form-item>
                    </el-col>
                  </el-row>
                </div>
              </div>
            </div>

            <!-- Block 4: Shipping Configs & Payments -->
            <div class="content-card compact-card form-section-card settings-card">
              <div class="section-header">
                <el-icon><Setting /></el-icon><span>Cấu hình Vận chuyển & Thanh toán</span>
              </div>

              <el-row :gutter="16">
                <el-col :span="12">
                  <el-form-item label="Dịch vụ vận chuyển" prop="service_type" class="mb-12">
                    <el-select v-model="waybillForm.service_type" placeholder="Dịch vụ..." class="w-full">
                      <el-option label="Chuyển phát nhanh (CPN)" value="CPN" />
                      <el-option label="Tiết kiệm (TK)" value="TK" />
                      <el-option label="Hỏa tốc (HT)" value="HT" />
                    </el-select>
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="Người trả phí" prop="payment_method" class="mb-12">
                    <el-select v-model="waybillForm.payment_method" class="w-full">
                      <el-option label="Shop trả cước cuối tháng (SENDER_DEBT)" value="SENDER_DEBT" />
                      <el-option label="Shop trả cước ngay khi gửi (SENDER_PAY)" value="SENDER_PAY" />
                      <el-option label="Người nhận thanh toán cước (RECEIVER_PAY)" value="RECEIVER_PAY" />
                    </el-select>
                  </el-form-item>
                </el-col>
              </el-row>

              <el-row :gutter="16">
                <el-col :span="12">
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
                <el-col :span="12">
                  <el-form-item label="Đóng kiện" class="mb-12">
                    <el-select v-model="waybillForm.packing_type" class="w-full" placeholder="Không đóng kiện">
                      <el-option :value="null" label="Không đóng kiện" />
                      <el-option value="WOOD" label="Đóng kiện gỗ" />
                      <el-option value="FOAM" label="Đóng kiện xốp" />
                    </el-select>
                  </el-form-item>
                </el-col>
              </el-row>

              <el-row :gutter="16">
                <el-col :span="12">
                  <el-form-item label="Ghi chú giao" class="mb-12">
                    <el-select v-model="waybillForm.delivery_note_option" class="w-full">
                      <el-option label="Cho xem hàng, không thử (CHO_XEM_HANG)" value="CHO_XEM_HANG" />
                      <el-option label="Cho thử hàng (CHO_THU_HANG)" value="CHO_THU_HANG" />
                      <el-option label="Không cho xem hàng (KHONG_CHO_XEM_HANG)" value="KHONG_CHO_XEM_HANG" />
                    </el-select>
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="Ghi chú thêm" class="mb-12">
                    <el-input v-model="waybillForm.note" placeholder="Bưu tá chú ý..." clearable />
                  </el-form-item>
                </el-col>
              </el-row>
            </div>

            <!-- Block 5: Summary & Extra Services -->
            <div class="content-card compact-card form-section-card extra-services-card summary-section" v-loading="feeLoading">
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
                <div class="summary-line" v-if="chargeWeight > 0 && chargeWeight > totalWeightCalc">
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
      <input type="file" ref="excelInput" style="display: none;" accept=".xlsx, .xls" @change="handleExcelUpload" />
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch, nextTick } from 'vue';
import { 
  ArrowLeft, User, Box, DocumentAdd, Printer, 
  CircleCheckFilled, Money, Service, Shop, Guide,
  LocationInformation, Location, Avatar, Phone, Warning, Loading, Setting,
  Download, ArrowDown
} from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import api from '@/api/axios';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth'; 
import * as XLSX from 'xlsx';

const auth = useAuthStore(); 
const router = useRouter();
const route = useRoute();
const formRef = ref(null);
const phoneInputRef = ref(null); 
const excelInput = ref(null);
const loading = ref(false);
const ocrSourceWaybillCode = ref('');
const ocrPrefillLoading = ref(false);
const isOcrFinalizeMode = computed(() => route.query.source === 'ocr' && !!ocrSourceWaybillCode.value);

const ADDR_API = 'https://provinces.open-api.vn/api';
const provinces = ref([]);
const senderDistricts = ref([]);
const senderWards = ref([]);
const receiverDistricts = ref([]);
const receiverWards = ref([]);

const productTypes = ref([
  { code: 'DOCUMENT', label: 'Thư từ/Tài liệu' },
  { code: 'PARCEL', label: 'Bưu phẩm, bưu kiện' },
  { code: 'GENERAL', label: 'Hàng hóa thông thường' },
  { code: 'LIQUID', label: 'Chất lỏng' },
  { code: 'ELECTRONIC', label: 'Điện tử' },
  { code: 'FOOD', label: 'Thực phẩm' },
  { code: 'HIGH_VALUE', label: 'Giá trị cao' }
]);

const customers = ref([]);
const hubs = ref([]);
const availableServices = ref([]); 
const servicesLoading = ref(false);
const feeLoading = ref(false);
const pricingSource = ref('');
const chargeWeight = ref(0);
const estimatedFees = reactive({ main_fee: 0, extra_fee: 0, remote_fee: 0, vat: 0 });

const waybillForm = reactive({
  customer_id: null,
  origin_hub_id: null,
  dest_hub_id: null,
  sender_name: '',
  sender_phone: '',
  sender: {
    province_id: null,
    district_id: null,
    ward_id: null,
    address_detail: ''
  },
  receiver_name: '',
  receiver_phone: '',
  receiver: {
    province_id: null,
    district_id: null,
    ward_id: null,
    address_detail: ''
  },
  items: [
    {
      product_group: 'PARCEL',
      product_name: '',
      weight: 0.5,
      length: 0,
      width: 0,
      height: 0,
      quantity: 1,
      declared_value: 0
    }
  ],
  service_type: 'CPN',
  packing_type: null,
  cod_amount: 0,
  payment_method: 'SENDER_PAY',
  delivery_note_option: 'CHO_XEM_HANG',
  note: '',
  extra_services: []
});

const rules = {
  receiver_name: [{ required: true, message: 'Nhập người nhận', trigger: 'blur' }],
  receiver_phone: [
    { required: true, message: 'Nhập SĐT', trigger: 'blur' },
    { pattern: /^[0-9]{10}$/, message: 'SĐT gồm 10 chữ số', trigger: 'blur' }
  ]
};

const totalWeightCalc = computed(() => {
  return waybillForm.items.reduce((sum, item) => sum + (Number(item.weight || 0) * Number(item.quantity || 1)), 0);
});

const totalDeclaredValueCalc = computed(() => {
  return waybillForm.items.reduce((sum, item) => sum + (Number(item.declared_value || 0) * Number(item.quantity || 1)), 0);
});

const totalFee = computed(() => (estimatedFees.main_fee || 0) + (estimatedFees.extra_fee || 0) + (estimatedFees.remote_fee || 0) + (estimatedFees.vat || 0));

const fetchProvinces = async () => {
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
  try {
    const res = await fetch(`${ADDR_API}/p/${Number(provinceId)}?depth=2`);
    const data = await res.json();
    return (data.districts || []).map(d => ({ id: d.code, name: d.name }));
  } catch (err) {
    console.error('Không thể tải danh sách quận/huyện', err);
    return [];
  }
};

const fetchWardsForDistrict = async (districtId) => {
  if (!districtId) return [];
  try {
    const res = await fetch(`${ADDR_API}/d/${Number(districtId)}?depth=2`);
    const data = await res.json();
    return (data.wards || []).map(w => ({ id: w.code, name: w.name }));
  } catch (err) {
    console.error('Không thể tải danh sách phường/xã', err);
    return [];
  }
};

const handleSenderProvinceChange = async () => {
  waybillForm.sender.district_id = null;
  waybillForm.sender.ward_id = null;
  senderWards.value = [];
  if (waybillForm.sender.province_id) {
    senderDistricts.value = await fetchDistrictsForProvince(waybillForm.sender.province_id);
    matchHubAndSet('origin', waybillForm.sender.province_id);
  } else {
    senderDistricts.value = [];
  }
};

const handleSenderDistrictChange = async () => {
  waybillForm.sender.ward_id = null;
  if (waybillForm.sender.district_id) {
    senderWards.value = await fetchWardsForDistrict(waybillForm.sender.district_id);
  } else {
    senderWards.value = [];
  }
};

const handleReceiverProvinceChange = async () => {
  waybillForm.receiver.district_id = null;
  waybillForm.receiver.ward_id = null;
  receiverWards.value = [];
  if (waybillForm.receiver.province_id) {
    receiverDistricts.value = await fetchDistrictsForProvince(waybillForm.receiver.province_id);
    matchHubAndSet('dest', waybillForm.receiver.province_id);
  } else {
    receiverDistricts.value = [];
  }
};

const handleReceiverDistrictChange = async () => {
  waybillForm.receiver.ward_id = null;
  if (waybillForm.receiver.district_id) {
    receiverWards.value = await fetchWardsForDistrict(waybillForm.receiver.district_id);
  } else {
    receiverWards.value = [];
  }
};

const getProvinceName = (id) => provinces.value.find(p => Number(p.id) === Number(id))?.name || '';
const getDistrictName = (list, id) => list.find(d => Number(d.id) === Number(id))?.name || '';
const getWardName = (list, id) => list.find(w => Number(w.id) === Number(id))?.name || '';

const normalizeText = (value = '') => value
  .toString()
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/đ/g, 'd')
  .replace(/Đ/g, 'D')
  .toLowerCase()
  .trim();

const matchHubAndSet = (type, provinceId) => {
  if (!provinceId) return;
  const pId = Number(provinceId);
  const pName = normalizeText(getProvinceName(pId));
  
  let match = hubs.value.find(h => Number(h.province_id) === pId);
  if (!match && pName) {
    match = hubs.value.find(h => {
      const hubText = normalizeText(`${h.hub_name || ''} ${h.address_detail || ''}`);
      return hubText.includes(pName) || pName.includes(hubText);
    });
  }
  
  if (match) {
    if (type === 'origin') waybillForm.origin_hub_id = match.hub_id;
    if (type === 'dest') waybillForm.dest_hub_id = match.hub_id;
  }
};

const addItemRow = () => {
  waybillForm.items.push({
    product_group: 'PARCEL',
    product_name: '',
    weight: 0.5,
    length: 0,
    width: 0,
    height: 0,
    quantity: 1,
    declared_value: 0
  });
};

const removeItemRow = (idx) => {
  waybillForm.items.splice(idx, 1);
};

const handleCustomerChange = async (customerId) => {
  if (!customerId) {
    waybillForm.sender_name = '';
    waybillForm.sender_phone = '';
    waybillForm.sender.province_id = null;
    waybillForm.sender.district_id = null;
    waybillForm.sender.ward_id = null;
    waybillForm.sender.address_detail = '';
    return;
  }
  
  const customer = customers.value.find(c => c.customer_id === customerId);
  if (!customer) return;
  
  waybillForm.sender_name = customer.company_name || customer.transaction_name || customer.name || '';
  waybillForm.sender_phone = customer.phone_number || customer.phone || '';
  waybillForm.sender.address_detail = customer.address_detail || customer.street_address || customer.address || '';
  
  let targetCustomer = customer;
  if (customer.customer_code) {
    try {
      const res = await api.get(`/api/customers/code/${customer.customer_code}`);
      if (res.data) {
        targetCustomer = res.data;
      }
    } catch (err) {
      console.error('Lỗi khi fetch chi tiết khách hàng:', err);
    }
  }
  
  if (targetCustomer.province_id) {
    const provId = Number(targetCustomer.province_id);
    waybillForm.sender.province_id = provId;
    senderDistricts.value = await fetchDistrictsForProvince(provId);
    matchHubAndSet('origin', provId);
    
    if (targetCustomer.district_id) {
      const distId = Number(targetCustomer.district_id);
      waybillForm.sender.district_id = distId;
      senderWards.value = await fetchWardsForDistrict(distId);
      
      if (targetCustomer.ward_id) {
        waybillForm.sender.ward_id = Number(targetCustomer.ward_id);
      }
    }
  }
};

const handleReceiverPhoneBlur = async () => {
  const phone = waybillForm.receiver_phone;
  if (!phone || phone.length < 10) return;
  
  try {
    const res = await api.get('/api/waybills/recipient-history', { params: { phone } });
    if (res.data) {
      waybillForm.receiver_name = res.data.receiver_name || waybillForm.receiver_name;
      waybillForm.receiver.address_detail = res.data.receiver_address || waybillForm.receiver.address_detail;
      ElMessage.success('Đã tự động điền thông tin người nhận cũ!');
    }
  } catch (err) {
  }
};

let feeTimer = null;
const fetchFee = () => {
  clearTimeout(feeTimer);
  feeTimer = setTimeout(async () => {
    if (!totalWeightCalc.value || totalWeightCalc.value <= 0
        || !waybillForm.sender.province_id || !waybillForm.receiver.province_id) {
      Object.assign(estimatedFees, { main_fee: 0, extra_fee: 0, remote_fee: 0, vat: 0 }); 
      pricingSource.value = '';
      chargeWeight.value = 0;
      return;
    }

    feeLoading.value = true;
    try {
      const actualWeight = totalWeightCalc.value;
      const convertedWeight = waybillForm.items.reduce((total, item) => {
        if (!item.length || !item.width || !item.height) return total;
        return total + ((Number(item.length) * Number(item.width) * Number(item.height)) / 5000) * Number(item.quantity || 1);
      }, 0);
      const computedChargeWeight = Math.max(actualWeight, convertedWeight, 0.1);

      const res = await api.post('/api/pricing/simulate', {
        origin_province_id: Number(waybillForm.sender.province_id),
        dest_province_id: Number(waybillForm.receiver.province_id),
        weight: Number(computedChargeWeight.toFixed(2)),
        length: 0,
        width: 0,
        height: 0,
        service_type: waybillForm.service_type,
        cod_amount: Number(waybillForm.cod_amount || 0),
        declared_value: totalDeclaredValueCalc.value,
        quantity: waybillForm.items.reduce((sum, item) => sum + Number(item.quantity || 1), 0),
        packing_type: waybillForm.packing_type || null,
        extra_services: waybillForm.extra_services
      });

      if (res.data && res.data.status === 'SUCCESS') {
        const fee = res.data;
        estimatedFees.main_fee = fee.main_fee;
        estimatedFees.extra_fee = (fee.extra_fee || 0) + (fee.packing_fee || 0) + (fee.fuel_surcharge || 0); 
        estimatedFees.remote_fee = fee.remote_fee || 0;
        estimatedFees.vat = fee.vat || fee.vat_8 || 0;
        pricingSource.value = fee.matched_rule || 'Mặc định';
        chargeWeight.value = computedChargeWeight;
      }
    } catch (err) {
      Object.assign(estimatedFees, { main_fee: 0, extra_fee: 0, remote_fee: 0, vat: 0 });
      pricingSource.value = 'chưa có bảng giá';
    } finally {
      feeLoading.value = false;
    }
  }, 400); 
};

watch(() => [
    waybillForm.sender.province_id,
    waybillForm.receiver.province_id,
    waybillForm.items,
    waybillForm.service_type, 
    waybillForm.extra_services,
    waybillForm.cod_amount,
    waybillForm.packing_type
], fetchFee, { deep: true });

const loadOcrPrefill = async () => {
  if (!ocrSourceWaybillCode.value) return;
  ocrPrefillLoading.value = true;
  try {
    const res = await api.get(`/api/waybills/ocr-reviewed/${ocrSourceWaybillCode.value}`);
    const data = res.data || {};
    waybillForm.customer_id = data.customer_id || waybillForm.customer_id;
    waybillForm.origin_hub_id = data.origin_hub_id || waybillForm.origin_hub_id;
    waybillForm.dest_hub_id = data.dest_hub_id || waybillForm.dest_hub_id;
    waybillForm.sender_name = data.sender_name || waybillForm.sender_name;
    waybillForm.sender_phone = data.sender_phone || waybillForm.sender_phone;
    waybillForm.sender.address_detail = data.sender_address || waybillForm.sender.address_detail;
    waybillForm.receiver_name = data.receiver_name || '';
    waybillForm.receiver_phone = data.receiver_phone || '';
    waybillForm.receiver.address_detail = data.receiver_address || '';
    waybillForm.receiver.province_id = data.receiver_province_id || null;
    waybillForm.receiver.district_id = data.receiver_district_id || null;
    waybillForm.receiver.ward_id = data.receiver_ward_id || null;
    if (waybillForm.receiver.province_id) {
      receiverDistricts.value = await fetchDistrictsForProvince(waybillForm.receiver.province_id);
    }
    if (waybillForm.receiver.district_id) {
      receiverWards.value = await fetchWardsForDistrict(waybillForm.receiver.district_id);
    }
    waybillForm.items = [{
      product_group: data.product_group || 'PARCEL',
      product_name: data.product_name || '',
      weight: Number(data.actual_weight || 0.5),
      length: Number(data.length || 0),
      width: Number(data.width || 0),
      height: Number(data.height || 0),
      quantity: 1,
      declared_value: Number(data.declared_value || 0),
    }];
    waybillForm.service_type = data.service_type || waybillForm.service_type || 'CPN';
    waybillForm.payment_method = data.payment_method || waybillForm.payment_method;
    waybillForm.cod_amount = Number(data.cod_amount || 0);
    waybillForm.note = data.note || '';
    ElMessage.success(`Đã tải dữ liệu OCR cho ${data.waybill_code}`);
  } catch (error) {
    ElMessage.error(error.response?.data?.detail || 'Không tải được dữ liệu OCR');
  } finally {
    ocrPrefillLoading.value = false;
  }
};

const saveWaybill = async () => {
  if (!formRef.value) return;
  
  await formRef.value.validate(async (valid) => {
    if (!valid) {
      ElMessage.warning('Vui lòng kiểm tra lại các thông tin bắt buộc');
      return;
    }

    if (!waybillForm.sender.province_id || !waybillForm.receiver.province_id) {
      ElMessage.warning('Vui lòng điền đầy đủ tỉnh/thành gửi và nhận');
      return;
    }

    if (!waybillForm.origin_hub_id || !waybillForm.dest_hub_id) {
      ElMessage.warning('Bưu cục chưa được map. Vui lòng chọn tỉnh hợp lệ');
      return;
    }

    if (!isOcrFinalizeMode.value && totalFee.value <= 0) {
      ElMessage.error('Tuyến đường này chưa được cấu hình giá cước');
      return;
    }
    
    loading.value = true;
    try {
      const senderProv = getProvinceName(waybillForm.sender.province_id);
      const senderDist = getDistrictName(senderDistricts.value, waybillForm.sender.district_id);
      const senderWard = getWardName(senderWards.value, waybillForm.sender.ward_id);
      const compiledSenderAddr = `${waybillForm.sender.address_detail}, ${senderWard}, ${senderDist}, ${senderProv}`.replace(/^[,\s]+|[,\s]+$/g, '');

      const receiverProv = getProvinceName(waybillForm.receiver.province_id);
      const receiverDist = getDistrictName(receiverDistricts.value, waybillForm.receiver.district_id);
      const receiverWard = getWardName(receiverWards.value, waybillForm.receiver.ward_id);
      const compiledReceiverAddr = `${waybillForm.receiver.address_detail}, ${receiverWard}, ${receiverDist}, ${receiverProv}`.replace(/^[,\s]+|[,\s]+$/g, '');

      const combinedNames = waybillForm.items.map(i => `${i.product_name} (x${i.quantity})`).join(', ');
      
      const payload = {
        customer_id: waybillForm.customer_id,
        origin_hub_id: waybillForm.origin_hub_id,
        dest_hub_id: waybillForm.dest_hub_id,
        sender_name: waybillForm.sender_name,
        sender_phone: waybillForm.sender_phone,
        sender_address: compiledSenderAddr,
        receiver_name: waybillForm.receiver_name,
        receiver_phone: waybillForm.receiver_phone,
        receiver_address: compiledReceiverAddr,
        actual_weight: totalWeightCalc.value,
        length: waybillForm.items[0]?.length || 0,
        width: waybillForm.items[0]?.width || 0,
        height: waybillForm.items[0]?.height || 0,
        product_name: combinedNames,
        product_group: waybillForm.items[0]?.product_group || 'PARCEL',
        declared_value: totalDeclaredValueCalc.value,
        payment_method: waybillForm.payment_method,
        cod_amount: waybillForm.cod_amount,
        note: waybillForm.note ? `${waybillForm.delivery_note_option} - ${waybillForm.note}` : waybillForm.delivery_note_option,
        extra_services: waybillForm.extra_services,
        shipping_fee: totalFee.value
      };

      const response = isOcrFinalizeMode.value
        ? await api.post(`/api/waybills/${ocrSourceWaybillCode.value}/finalize-from-ocr`, payload)
        : await api.post('/api/waybills', payload, {
           headers: { 'Idempotency-Key': `wb-create-${Date.now()}` }
        });

      ElMessage({ message: `Đã tạo vận đơn thành công: ${response.data.waybill_code}`, type: 'success' });
      
      if (isOcrFinalizeMode.value) {
        router.push('/admin/waybills/ocr-reviewed');
        return;
      }

      // Reset form receiver and items
      waybillForm.receiver_name = '';
      waybillForm.receiver_phone = '';
      waybillForm.receiver.province_id = null;
      waybillForm.receiver.district_id = null;
      waybillForm.receiver.ward_id = null;
      waybillForm.receiver.address_detail = '';
      waybillForm.cod_amount = 0;
      waybillForm.note = '';
      waybillForm.items = [
        {
          product_group: 'PARCEL',
          product_name: '',
          weight: 0.5,
          length: 0,
          width: 0,
          height: 0,
          quantity: 1,
          declared_value: 0
        }
      ];
      waybillForm.extra_services = [];
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
    const [resCustomers, resHubs] = await Promise.all([
      api.get('/api/customers').catch(()=>({data:[]})),
      api.get('/api/hubs').catch(()=>({data:[]}))
    ]);
    
    customers.value = resCustomers.data.items || resCustomers.data || [];
    hubs.value = resHubs.data.items || resHubs.data || [];

    if (auth.user?.role_id !== 1 && auth.user?.primary_hub_id) {
      waybillForm.origin_hub_id = auth.user.primary_hub_id;
      // Auto fill origin province if any
      const myHub = hubs.value.find(h => h.hub_id === auth.user.primary_hub_id);
      if (myHub && myHub.province_id) {
        waybillForm.sender.province_id = myHub.province_id;
        senderDistricts.value = await fetchDistrictsForProvince(myHub.province_id);
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
  } finally {
    servicesLoading.value = false;
  }

  if (route.query.source === 'ocr' && route.query.waybill_code) {
    ocrSourceWaybillCode.value = String(route.query.waybill_code);
    await loadOcrPrefill();
  }
});

const COLUMN_MAPPING = {
  customer_code: ['ma khach hang', 'mã khách hàng', 'ma kh', 'mã kh', 'ma shop', 'mã shop'],
  shop_order_code: ['ma don hang rieng', 'mã đơn hàng riêng', 'ma don hang', 'mã đơn hàng', 'ma bill shop', 'mã bill shop'],
  sender_name: ['ten nguoi gui', 'tên người gửi', 'nguoi gui', 'người gửi', 'ten shop', 'tên shop'],
  sender_phone: ['sdt nguoi gui', 'sđt người gửi', 'sdt gui', 'sđt gửi', 'dien thoai nguoi gui', 'điện thoại người gửi'],
  sender_address: ['dia chi gui', 'địa chỉ gửi', 'dia chi lay hang', 'địa chỉ lấy hàng', 'dia chi shop', 'địa chỉ shop'],
  sender_province: ['tinh gui', 'tỉnh gửi', 'tinh lay', 'tỉnh lấy'],
  receiver_name: ['ten nguoi nhan', 'tên người nhận', 'nguoi nhan', 'người nhận', 'ho ten nguoi nhan', 'họ tên người nhận'],
  receiver_phone: ['sdt nguoi nhan', 'sđt người nhận', 'sdt nhan', 'sđt nhận', 'dien thoai nguoi nhan', 'điện thoại người nhận'],
  receiver_address: ['dia chi nhan', 'địa chỉ nhận', 'dia chi giao hang', 'địa chỉ giao hàng', 'dia chi nguoi nhan', 'địa chỉ người nhận'],
  receiver_province: ['tinh den', 'tỉnh đến', 'tinh nhan', 'tỉnh nhận'],
  product_group: ['nhom hang hoa', 'nhóm hàng hóa'],
  product_name: ['ten hang hoa', 'tên hàng hóa', 'ten san pham', 'tên sản phẩm'],
  declared_value: ['gia tri hang hoa', 'giá trị hàng hóa', 'gía trị hàng hóa', 'khai gia', 'khai giá'],
  weight: ['khoi luong [kg]', 'khối lượng [kg]', 'khoi luong', 'khối lượng'],
  length: ['dai [cm]', 'dài [cm]', 'dai', 'dài'],
  width: ['rong [cm]', 'rộng [cm]', 'rong', 'rộng'],
  height: ['cao [cm]', 'cao [cm]', 'cao', 'cao'],
  quantity: ['so luong', 'số lượng'],
  payment_method: ['hinh thuc thanh toan', 'hình thức thanh toán'],
  cod_amount: ['tien thu ho cod', 'tiền thu hộ cod', 'thu ho cod', 'thu hộ cod', 'cod']
};

const triggerExcelImport = () => {
  if (excelInput.value) {
    excelInput.value.click();
  }
};

const downloadTemplate = () => {
  const link = document.createElement('a');
  link.href = '/template-import.xlsx';
  link.download = 'template-import.xlsx';
  link.click();
};

const mapStandardProvinceToHubProvince = (provinceId) => {
  const pId = Number(provinceId);
  if (pId === 79) return 59;
  if (pId === 1) return 29;
  if (pId === 48) return 15;
  return pId;
};

const parseVietnameseAddress = (addressStr, fallbackProvinceName) => {
  let provinceName = '';
  let districtName = '';
  let wardName = '';
  let addressDetail = addressStr || '';

  if (addressStr) {
    const parts = addressStr.split(',').map(p => p.trim());
    if (parts.length >= 4) {
      provinceName = parts[parts.length - 1];
      districtName = parts[parts.length - 2];
      wardName = parts[parts.length - 3];
      addressDetail = parts.slice(0, parts.length - 3).join(', ');
    } else if (parts.length === 3) {
      provinceName = parts[parts.length - 1];
      districtName = parts[parts.length - 2];
      addressDetail = parts.slice(0, parts.length - 2).join(', ');
    } else if (parts.length === 2) {
      provinceName = parts[parts.length - 1];
      addressDetail = parts[0];
    }
  }

  if (!provinceName && fallbackProvinceName) {
    provinceName = fallbackProvinceName;
  }

  return {
    province_name: provinceName,
    district_name: districtName,
    ward_name: wardName,
    address_detail: addressDetail
  };
};

const handleExcelUpload = async (event) => {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = async (e) => {
    try {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const rawRows = XLSX.utils.sheet_to_json(worksheet);

      if (rawRows.length === 0) {
        ElMessage.warning('File Excel không có dữ liệu.');
        return;
      }

      ElMessage.info(`Đang phân tích và nhập ${rawRows.length} dòng dữ liệu...`);

      const getValueByMapping = (rowObj, fieldKey) => {
        const possibleHeaders = COLUMN_MAPPING[fieldKey] || [];
        const rowKeys = Object.keys(rowObj);
        for (const key of rowKeys) {
          const normalizedKey = key.trim().toLowerCase()
            .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
            .replace(/\s+/g, ' ');
          for (const header of possibleHeaders) {
            const normalizedHeader = header.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
              .replace(/\s+/g, ' ');
            if (normalizedKey === normalizedHeader) {
              return rowObj[key];
            }
          }
        }
        return null;
      };

      const norm = (str) => {
        if (!str) return '';
        return str.toString()
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/^(tinh|thanh pho|tp\.|tp|huyen|quan|phuong|xa)\s+/i, '')
          .replace(/\s+/g, ' ')
          .trim();
      };

      const findProvinceId = (name) => {
        if (!name) return null;
        const nName = norm(name);
        const found = provinces.value.find(p => norm(p.name) === nName);
        return found ? found.id : null;
      };

      const mapServiceType = (val) => {
        if (!val) return 'STANDARD';
        const s = val.toString().trim().toLowerCase();
        if (s.includes('nhanh') || s.includes('fast') || s.includes('cpn')) return 'CPN';
        if (s.includes('hoa toc') || s.includes('hỏa tốc') || s.includes('express')) return 'HT';
        return 'TK';
      };

      const mapPaymentMethod = (val) => {
        if (!val) return 'SENDER_DEBT';
        const s = val.toString().trim().toLowerCase();
        if (s.includes('gui') || s.includes('người gửi') || s.includes('pay')) return 'SENDER_PAY';
        if (s.includes('nhan') || s.includes('người nhận') || s.includes('thu')) return 'RECEIVER_PAY';
        return 'SENDER_DEBT';
      };

      const findCustomerId = (code, phone) => {
        if (!code && !phone) return null;
        let match = null;
        if (code) {
          match = customers.value.find(c => c.customer_code?.toString().toLowerCase() === code.toString().toLowerCase());
        }
        if (!match && phone) {
          const normPhone = phone.toString().replace(/\D/g, '');
          match = customers.value.find(c => c.phone_number?.toString().replace(/\D/g, '') === normPhone);
        }
        return match ? match.customer_id : null;
      };

      const parsedRows = [];
      for (const row of rawRows) {
        const senderAddrRaw = getValueByMapping(row, 'sender_address');
        const senderProvRaw = getValueByMapping(row, 'sender_province');
        const parsedSender = parseVietnameseAddress(senderAddrRaw, senderProvRaw);

        const receiverAddrRaw = getValueByMapping(row, 'receiver_address');
        const receiverProvRaw = getValueByMapping(row, 'receiver_province');
        const parsedReceiver = parseVietnameseAddress(receiverAddrRaw, receiverProvRaw);

        parsedRows.push({
          customer_code: getValueByMapping(row, 'customer_code') || '',
          shop_order_code: getValueByMapping(row, 'shop_order_code') || '',
          sender_name: getValueByMapping(row, 'sender_name') || '',
          sender_phone: getValueByMapping(row, 'sender_phone') || '',
          sender_address_detail: parsedSender.address_detail,
          sender_province_name: parsedSender.province_name,
          sender_district_name: parsedSender.district_name,
          sender_ward_name: parsedSender.ward_name,
          senderProvinceId: findProvinceId(parsedSender.province_name),
          senderDistrictId: null,
          senderWardId: null,

          receiver_name: getValueByMapping(row, 'receiver_name') || '',
          receiver_phone: getValueByMapping(row, 'receiver_phone') || '',
          receiver_address_detail: parsedReceiver.address_detail,
          receiver_province_name: parsedReceiver.province_name,
          receiver_district_name: parsedReceiver.district_name,
          receiver_ward_name: parsedReceiver.ward_name,
          receiverProvinceId: findProvinceId(parsedReceiver.province_name),
          receiverDistrictId: null,
          receiverWardId: null,

          product_group: getValueByMapping(row, 'product_group') || 'PARCEL',
          product_name: getValueByMapping(row, 'product_name') || 'Hàng hóa',
          declared_value: Number(getValueByMapping(row, 'declared_value') || 0),
          weight: Number(getValueByMapping(row, 'weight') || 0.5),
          length: Number(getValueByMapping(row, 'length') || 0),
          width: Number(getValueByMapping(row, 'width') || 0),
          height: Number(getValueByMapping(row, 'height') || 0),
          quantity: Number(getValueByMapping(row, 'quantity') || 1),
          payment_method: getValueByMapping(row, 'payment_method') || '',
          cod_amount: Number(getValueByMapping(row, 'cod_amount') || 0),
          service_type: getValueByMapping(row, 'service_type') || ''
        });
      }

      for (const row of parsedRows) {
        if (row.senderProvinceId && row.sender_district_name) {
          const dists = await fetchDistrictsForProvince(row.senderProvinceId);
          const match = dists.find(d => norm(d.name) === norm(row.sender_district_name));
          if (match) row.senderDistrictId = match.id;
        }
        if (row.receiverProvinceId && row.receiver_district_name) {
          const dists = await fetchDistrictsForProvince(row.receiverProvinceId);
          const match = dists.find(d => norm(d.name) === norm(row.receiver_district_name));
          if (match) row.receiverDistrictId = match.id;
        }
        if (row.senderDistrictId && row.sender_ward_name) {
          const wrds = await fetchWardsForDistrict(row.senderDistrictId);
          const match = wrds.find(w => norm(w.name) === norm(row.sender_ward_name));
          if (match) row.senderWardId = match.id;
        }
        if (row.receiverDistrictId && row.receiver_ward_name) {
          const wrds = await fetchWardsForDistrict(row.receiverDistrictId);
          const match = wrds.find(w => norm(w.name) === norm(row.receiver_ward_name));
          if (match) row.receiverWardId = match.id;
        }
      }

      let successCount = 0;
      let errorCount = 0;
      for (let i = 0; i < parsedRows.length; i++) {
        const row = parsedRows[i];
        const custId = findCustomerId(row.customer_code, row.sender_phone) || customers.value[0]?.customer_id;

        const payload = {
          customer_id: custId,
          target_hub_id: null,
          source: 'HOTLINE',
          order_type: "DOMESTIC",
          shop_order_code: row.shop_order_code || `HL-${Date.now()}-${i}`,
          sender: {
            name: row.sender_name || (customers.value.find(c => c.customer_id === custId)?.transaction_name || 'Khách gửi'),
            phone: row.sender_phone || (customers.value.find(c => c.customer_id === custId)?.phone_number || ''),
            address: `${row.sender_address_detail || 'Địa chỉ'}, ${row.sender_ward_name || ''}, ${row.sender_district_name || ''}, ${row.sender_province_name || ''}`,
            province_id: Number(row.senderProvinceId),
            district_id: Number(row.senderDistrictId),
            ward_id: Number(row.senderWardId),
            province_name: row.sender_province_name || '',
            district_name: row.sender_district_name || '',
            ward_name: row.sender_ward_name || ''
          },
          receiver: {
            name: row.receiver_name || 'Khách nhận',
            phone: row.receiver_phone || '',
            address: `${row.receiver_address_detail || 'Địa chỉ'}, ${row.receiver_ward_name || ''}, ${row.receiver_district_name || ''}, ${row.receiver_province_name || ''}`,
            province_id: Number(row.receiverProvinceId),
            district_id: Number(row.receiverDistrictId),
            ward_id: Number(row.receiverWardId),
            province_name: row.receiver_province_name || '',
            district_name: row.receiver_district_name || '',
            ward_name: row.receiver_ward_name || ''
          },
          items: [
            {
              product_group: row.product_group || "PARCEL",
              product_name: row.product_name || "Bưu phẩm bưu kiện",
              description: "",
              weight: Number(row.weight || 0.5),
              length: Number(row.length || 0),
              width: Number(row.width || 0),
              height: Number(row.height || 0),
              quantity: Number(row.quantity || 1),
              declared_value: Number(row.declared_value || 0),
            }
          ],
          documents: [],
          cod_amount: Number(row.cod_amount || 0),
          cod_receiver_pays_fee: false,
          service_type: mapServiceType(row.service_type),
          extra_services: [],
          delivery_note_option: "CHO_XEM_HANG",
          note: "",
          payment_method: mapPaymentMethod(row.payment_method),
          save_as_draft: false
        };

        payload.sender.province_id = mapStandardProvinceToHubProvince(payload.sender.province_id);
        payload.receiver.province_id = mapStandardProvinceToHubProvince(payload.receiver.province_id);

        try {
          await api.post('/api/waybills/admin/pickups', payload);
          successCount++;
        } catch (err) {
          console.error(`Lỗi tạo đơn dòng ${i + 1}:`, err);
          errorCount++;
        }
      }

      ElMessage.success(`Nhập thành công ${successCount} đơn hàng! Thất bại: ${errorCount}`);
      event.target.value = '';
    } catch (err) {
      console.error(err);
      ElMessage.error('Có lỗi xảy ra khi đọc file Excel. Vui lòng kiểm tra lại cấu trúc file.');
    }
  };
  reader.readAsArrayBuffer(file);
};
</script>

<style scoped src="@/styles/admin/waybills/CreateWaybill.css"></style>
