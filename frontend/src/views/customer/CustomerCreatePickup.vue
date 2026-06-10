<template>
  <div class="customer-portal">
    <div class="portal-container">
      <el-row :gutter="24" class="portal-content">
        <el-col :span="24">
          <div  class="create-pickup-form-wrapper animate-fade-in-up">
            <div class="form-header mb-4">
              <div class="flex-center gap-3">
                <el-button circle @click="cancelCreate">
                  <el-icon><ArrowLeft /></el-icon>
                </el-button>
                <div>
                  <h2 class="section-title">Tạo yêu cầu gửi hàng mới</h2>
                  <p class="section-subtitle">Nhập thông tin người gửi, người nhận và gói hàng để tạo vận đơn</p>
                </div>
              </div>
              <div class="form-header-actions">
                <el-button @click="triggerExcelImport" type="success" plain>
                  <el-icon class="mr-1"><DocumentAdd /></el-icon>Nhập từ Excel
                </el-button>
                <el-button @click="saveDraft" type="info" plain>
                  <el-icon class="mr-1"><EditPen /></el-icon>Lưu nháp
                </el-button>
                <el-button @click="addToQueue" type="warning" plain>
                  <el-icon class="mr-1"><FolderAdd /></el-icon>Đưa vào hàng chờ
                </el-button>
                <el-button type="primary" @click="submitPickupRequest" :loading="submitLoading">
                  <el-icon class="mr-1"><Upload /></el-icon>Gửi yêu cầu ngay
                </el-button>
              </div>
            </div>

            <el-row :gutter="24">
              <!-- Left side of form: Input fields -->
              <el-col :xs="24" :sm="24" :md="16">
                <el-form :model="form" label-position="top">
                  
                  <!-- SENDER & RECEIVER INFO -->
                  <el-row :gutter="20">
                    <!-- SENDER CARD -->
                    <el-col :xs="24" :sm="12">
                      <el-card class="form-section-card sender-card mb-4" shadow="never">
                        <template #header>
                          <div class="form-card-title text-primary">
                            <el-icon><User /></el-icon><span>Thông tin Người gửi</span>
                          </div>
                        </template>
                        <el-form-item label="Họ tên người gửi" required>
                          <el-input v-model="form.sender.name" placeholder="Tên người gửi hoặc Tên shop" />
                        </el-form-item>
                        <el-form-item label="Số điện thoại" required>
                          <el-input v-model="form.sender.phone" placeholder="Số điện thoại liên hệ" />
                        </el-form-item>
                        <el-form-item label="Tỉnh/Thành">
                          <el-select v-model="form.sender.province_id" placeholder="Chọn tỉnh" @change="handleSenderProvinceChange" filterable style="width: 100%;">
                            <el-option v-for="p in provinces" :key="p.id" :label="p.name" :value="p.id" />
                          </el-select>
                        </el-form-item>
                        <el-form-item label="Quận/Huyện">
                          <el-select v-model="form.sender.district_id" placeholder="Chọn huyện" @change="handleSenderDistrictChange" :disabled="!form.sender.province_id" filterable style="width: 100%;">
                            <el-option v-for="d in senderDistricts" :key="d.id" :label="d.name" :value="d.id" />
                          </el-select>
                        </el-form-item>
                        <el-form-item label="Phường/Xã">
                          <el-select v-model="form.sender.ward_id" placeholder="Chọn xã" :disabled="!form.sender.district_id" filterable style="width: 100%;">
                            <el-option v-for="w in senderWards" :key="w.id" :label="w.name" :value="w.id" />
                          </el-select>
                        </el-form-item>
                        <el-form-item label="Địa chỉ chi tiết (Số nhà, đường...)">
                          <el-input v-model="form.sender.address_detail" type="textarea" :rows="2" placeholder="Địa chỉ lấy hàng chi tiết" />
                        </el-form-item>
                      </el-card>
                    </el-col>

                    <!-- RECEIVER CARD -->
                    <el-col :xs="24" :sm="12">
                      <el-card class="form-section-card receiver-card mb-4" shadow="never">
                        <template #header>
                          <div class="form-card-title text-success">
                            <el-icon><User /></el-icon><span>Thông tin Người nhận</span>
                          </div>
                        </template>
                        <el-form-item label="Họ tên người nhận" required>
                          <el-input v-model="form.receiver.name" placeholder="Tên người nhận hàng" />
                        </el-form-item>
                        <el-form-item label="Số điện thoại" required>
                          <el-input v-model="form.receiver.phone" placeholder="Số điện thoại liên hệ" />
                        </el-form-item>
                        <el-form-item label="Tỉnh/Thành" required>
                          <el-select v-model="form.receiver.province_id" placeholder="Chọn tỉnh" @change="handleReceiverProvinceChange" filterable style="width: 100%;">
                            <el-option v-for="p in provinces" :key="p.id" :label="p.name" :value="p.id" />
                          </el-select>
                        </el-form-item>
                        <el-form-item label="Quận/Huyện" required>
                          <el-select v-model="form.receiver.district_id" placeholder="Chọn huyện" @change="handleReceiverDistrictChange" :disabled="!form.receiver.province_id" filterable style="width: 100%;">
                            <el-option v-for="d in receiverDistricts" :key="d.id" :label="d.name" :value="d.id" />
                          </el-select>
                        </el-form-item>
                        <el-form-item label="Phường/Xã">
                          <el-select v-model="form.receiver.ward_id" placeholder="Chọn xã" :disabled="!form.receiver.district_id" filterable clearable style="width: 100%;">
                            <el-option v-for="w in receiverWards" :key="w.id" :label="w.name" :value="w.id" />
                          </el-select>
                        </el-form-item>
                        <el-form-item label="Địa chỉ chi tiết (Số nhà, đường...)">
                          <el-input v-model="form.receiver.address_detail" type="textarea" :rows="2" placeholder="Địa chỉ giao hàng chi tiết" />
                        </el-form-item>
                      </el-card>
                    </el-col>
                  </el-row>

                  <!-- ITEMS DETAILS -->
                  <el-card class="form-section-card items-card mb-4" shadow="never">
                    <template #header>
                      <div class="form-card-title text-warning">
                        <el-icon><Box /></el-icon><span>Thông tin Hàng hóa</span>
                      </div>
                    </template>
                    <div v-for="(item, index) in form.items" :key="index" class="item-input-row">
                      <el-row :gutter="16">
                        <el-col :xs="24" :sm="10">
                          <el-form-item label="Tên sản phẩm" required>
                            <el-input v-model="item.product_name" placeholder="Ví dụ: Quần áo, mỹ phẩm..." @input="debouncedSimulate" />
                          </el-form-item>
                        </el-col>
                        <el-col :xs="12" :sm="7">
                          <el-form-item label="Khối lượng (kg)">
                            <el-input v-model.number="item.weight" type="number" step="0.01" min="0.01" placeholder="0.05" class="w-full" @input="debouncedSimulate">
                              <template #append>kg</template>
                            </el-input>
                          </el-form-item>
                        </el-col>
                        <el-col :xs="12" :sm="7">
                          <el-form-item label="Số lượng">
                            <el-input v-model.number="item.quantity" type="number" min="1" placeholder="1" class="w-full" @input="debouncedSimulate">
                              <template #append>cái</template>
                            </el-input>
                          </el-form-item>
                        </el-col>
                      </el-row>
                      
                      <el-row :gutter="16" style="margin-top: 12px;">
                        <el-col :xs="24" :sm="14">
                          <el-form-item label="Kích thước cm (Dài x Rộng x Cao)">
                            <div class="dimension-inputs">
                              <el-input v-model.number="item.length" type="number" min="0" placeholder="Dài" @input="debouncedSimulate">
                                <template #append>cm</template>
                              </el-input>
                              <span class="dimension-sep">×</span>
                              <el-input v-model.number="item.width" type="number" min="0" placeholder="Rộng" @input="debouncedSimulate">
                                <template #append>cm</template>
                              </el-input>
                              <span class="dimension-sep">×</span>
                              <el-input v-model.number="item.height" type="number" min="0" placeholder="Cao" @input="debouncedSimulate">
                                <template #append>cm</template>
                              </el-input>
                            </div>
                          </el-form-item>
                        </el-col>
                        <el-col :xs="24" :sm="10">
                          <el-form-item label="Khai giá (đ)">
                            <el-input v-model.number="item.declared_value" type="number" min="0" placeholder="0" class="w-full" @input="debouncedSimulate">
                              <template #append>đ</template>
                            </el-input>
                          </el-form-item>
                        </el-col>
                      </el-row>
                    </div>
                  </el-card>

                  <!-- SETTINGS & EXTRA SERVICES -->
                  <el-row :gutter="20">
                    <el-col :xs="24" :sm="12">
                      <el-card class="form-section-card settings-card mb-4" shadow="never">
                        <template #header>
                          <div class="form-card-title text-info">
                            <el-icon><Setting /></el-icon><span>Cấu hình Vận chuyển</span>
                          </div>
                        </template>
                        <el-form-item label="Bưu cục xử lý (Không bắt buộc)">
                          <el-select v-model="form.target_hub_id" class="w-full" filterable clearable placeholder="Chọn bưu cục (nếu có)" @change="debouncedSimulate">
                            <el-option v-for="hub in hubsList" :key="hub.hub_id" :label="hub.hub_name" :value="hub.hub_id" />
                          </el-select>
                        </el-form-item>
                        <el-form-item label="Dịch vụ vận chuyển" required>
                          <el-radio-group v-model="form.service_type" @change="debouncedSimulate">
                            <el-radio-button label="TK">Tiết kiệm (TK)</el-radio-button>
                            <el-radio-button label="CPN">Chuyển phát nhanh (CPN)</el-radio-button>
                            <el-radio-button label="HT">Hỏa tốc (HT)</el-radio-button>
                          </el-radio-group>
                        </el-form-item>
                        <el-form-item label="Số tiền thu hộ (COD)">
                          <el-input-number v-model="form.cod_amount" :min="0" :step="10000" class="w-full" @change="debouncedSimulate" />
                        </el-form-item>
                        <el-form-item label="Phương thức thanh toán">
                          <el-select v-model="form.payment_method" class="w-full">
                            <el-option label="Shop trả cước cuối tháng (SENDER_DEBT)" value="SENDER_DEBT" />
                            <el-option label="Shop trả cước ngay khi gửi (SENDER_PAY)" value="SENDER_PAY" />
                            <el-option label="Người nhận thanh toán cước (RECEIVER_PAY)" value="RECEIVER_PAY" />
                          </el-select>
                        </el-form-item>
                        <el-form-item label="Ghi chú khi giao">
                          <el-select v-model="form.delivery_note_option" class="w-full">
                            <el-option label="Cho xem hàng, không thử (CHO_XEM_HANG)" value="CHO_XEM_HANG" />
                            <el-option label="Cho thử hàng (CHO_THU_HANG)" value="CHO_THU_HANG" />
                            <el-option label="Không cho xem hàng (KHONG_CHO_XEM_HANG)" value="KHONG_CHO_XEM_HANG" />
                          </el-select>
                        </el-form-item>
                        <el-form-item label="Ghi chú thêm">
                          <el-input v-model="form.note" type="textarea" :rows="2" placeholder="Ghi chú thêm cho bưu tá..." />
                        </el-form-item>
                      </el-card>
                    </el-col>

                    <el-col :xs="24" :sm="12">
                      <el-card class="form-section-card extra-services-card mb-4" shadow="never">
                        <template #header>
                          <div class="form-card-title text-primary">
                            <el-icon><CircleCheck /></el-icon><span>Dịch vụ gia tăng</span>
                          </div>
                        </template>
                        <el-checkbox-group v-model="form.extra_services" @change="debouncedSimulate" class="extra-services-checkboxes">
                          <el-checkbox 
                            v-for="srv in availableServices" 
                            :key="srv.service_code" 
                            :label="srv.service_code"
                          >
                            <span class="fw-bold">{{ srv.service_name }}</span>
                            <span class="text-xs text-muted block">
                              Phí: {{ srv.fee_type === 'FIXED' ? srv.fee_value.toLocaleString() + 'đ' : srv.fee_value + '%' }}
                            </span>
                          </el-checkbox>
                        </el-checkbox-group>
                      </el-card>
                    </el-col>
                  </el-row>

                </el-form>
              </el-col>

              <!-- Right side: Real-time estimated billing details -->
              <el-col :xs="24" :sm="24" :md="8">
                <el-card class="billing-summary-card mb-4 sticky-card" v-loading="simulateLoading">
                  <template #header>
                    <div class="billing-header text-primary fw-bold text-center">
                      ƯỚC TÍNH CƯỚC PHÍ
                    </div>
                  </template>
                  <div class="billing-details" v-if="simulateResult">
                    <div class="billing-line">
                      <span>Cước chính:</span>
                      <span class="price-val">{{ (simulateResult.main_fee || 0).toLocaleString() }} đ</span>
                    </div>
                    <div class="billing-line">
                      <span>Phí dịch vụ gia tăng:</span>
                      <span class="price-val">{{ (simulateResult.extra_fee || 0).toLocaleString() }} đ</span>
                    </div>
                    <div class="billing-line">
                      <span>Thuế VAT (8%):</span>
                      <span class="price-val">{{ (simulateResult.vat || simulateResult.vat_8 || 0).toLocaleString() }} đ</span>
                    </div>
                    <el-divider class="my-3" />
                    <div class="billing-line total">
                      <span>TỔNG CỘNG TẠM TÍNH:</span>
                      <span class="price-val text-success">{{ (simulateResult.grand_total || 0).toLocaleString() }} đ</span>
                    </div>
                    <div class="text-xs text-muted mt-3 text-center">
                      * Cước phí thực tế sẽ được cập nhật sau khi bưu cục cân đo hàng hóa.
                    </div>
                  </div>
                  <div class="billing-error text-center text-warning" style="padding: 20px 10px;" v-else-if="simulateError">
                    <el-icon class="large-icon mb-2" style="font-size: 28px; color: #e6a23c;"><Warning /></el-icon>
                    <p style="font-size: 13px; font-weight: 500; color: #e6a23c;">{{ simulateError }}</p>
                    <p style="font-size: 11px; color: #909399; margin-top: 8px;">Vui lòng chọn Tỉnh đi / Tỉnh đến khác (ví dụ: Hà Nội $\leftrightarrow$ TP. Hồ Chí Minh) đã được cấu hình giá cước trong hệ thống.</p>
                  </div>
                  <div class="billing-placeholder text-center text-muted" v-else>
                    <el-icon class="large-icon mb-2"><InfoFilled /></el-icon>
                    <p>Vui lòng điền địa chỉ người gửi, người nhận và khối lượng hàng hóa để xem cước phí dự kiến.</p>
                  </div>
                </el-card>
              </el-col>
            </el-row>
          </div>

        </el-col>
      </el-row>
      <input type="file" ref="excelInput" style="display: none;" accept=".xlsx, .xls" @change="handleExcelUpload" />
    </div>
  </div>
</template>
<script setup>
import { computed, ref, reactive, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { ElMessage, ElMessageBox } from 'element-plus';
import api from '@/api/axios';
import moment from 'moment';
import * as XLSX from 'xlsx';
import { 
  User, Service, Phone, Message, Close, 
  Search, DocumentAdd, Location, List, Edit, Lock,
  Box, Setting, CircleCheck, InfoFilled, FolderOpened, Upload, ArrowLeft, Refresh, Warning
} from '@element-plus/icons-vue';

// ---- Dynamic Address API (provinces.open-api.vn) ----
const ADDR_API = 'https://provinces.open-api.vn/api';
const provinces = ref([]);
const excelInput = ref(null);
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
  service_type: 'CPN',
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

const mapStandardProvinceToHubProvince = (standardId, targetHubId = null) => {
  const id = Number(standardId);
  return {
    province_id: id || null,
    province_name: getProvinceName(id)
  };
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
  
  const validItems = form.items.filter(item => Number(item.weight || 0) > 0);
  if (!validItems.length) {
    simulateResult.value = null;
    simulateError.value = '';
    return;
  }
  
  simulateLoading.value = true;
  simulateError.value = '';
  try {
    const mappedSender = mapStandardProvinceToHubProvince(form.sender.province_id, form.target_hub_id);
    const mappedReceiver = mapStandardProvinceToHubProvince(form.receiver.province_id);

    const actualWeight = validItems.reduce((total, item) => {
      return total + (Number(item.weight || 0) * Number(item.quantity || 1));
    }, 0);
    const convertedWeight = validItems.reduce((total, item) => {
      if (!item.length || !item.width || !item.height) return total;
      return total + ((Number(item.length) * Number(item.width) * Number(item.height)) / 5000) * Number(item.quantity || 1);
    }, 0);
    const chargeWeight = Math.max(actualWeight, convertedWeight, 0.01);
    const declaredValue = validItems.reduce((total, item) => {
      return total + (Number(item.declared_value || 0) * Number(item.quantity || 1));
    }, 0);
    const totalQuantity = validItems.reduce((total, item) => total + Number(item.quantity || 1), 0);

    const payload = {
      origin_province_id: Number(mappedSender.province_id),
      dest_province_id: Number(mappedReceiver.province_id),
      weight: Number(chargeWeight.toFixed(2)),
      length: 0,
      width: 0,
      height: 0,
      service_type: form.service_type,
      cod_amount: Number(form.cod_amount || 0),
      declared_value: declaredValue,
      quantity: totalQuantity,
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

// START CREATE REQUEST & CHECK DRAFT
const startCreatePickup = async () => {
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
  form.service_type = 'CPN';
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
  if (!form.sender.name || !form.sender.phone || !form.sender.address_detail || !form.sender.province_id) {
    ElMessage.warning('Vui lòng điền đầy đủ thông tin người gửi');
    return;
  }
  if (!form.receiver.name || !form.receiver.phone || !form.receiver.address_detail || !form.receiver.province_id || !form.receiver.district_id) {
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

    const mappedSender = mapStandardProvinceToHubProvince(form.sender.province_id, form.target_hub_id);
    const mappedReceiver = mapStandardProvinceToHubProvince(form.receiver.province_id);

    const payload = {
      order_type: 'DOMESTIC',
      sender: {
        name: form.sender.name,
        phone: form.sender.phone,
        address: [form.sender.address_detail, sWrd, sDist, sName].filter(Boolean).join(', '),
        province_id: Number(mappedSender.province_id),
        district_id: Number(form.sender.district_id),
        ward_id: Number(form.sender.ward_id),
        province_name: mappedSender.province_name,
        district_name: sDist,
        ward_name: sWrd
      },
      receiver: {
        name: form.receiver.name,
        phone: form.receiver.phone,
        address: [form.receiver.address_detail, rWrd, rDist, rName].filter(Boolean).join(', '),
        province_id: Number(mappedReceiver.province_id),
        district_id: Number(form.receiver.district_id),
        ward_id: Number(form.receiver.ward_id),
        province_name: mappedReceiver.province_name,
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

      const mappedSender = mapStandardProvinceToHubProvince(draft.sender.province_id, draft.target_hub_id);
      const mappedReceiver = mapStandardProvinceToHubProvince(draft.receiver.province_id);

      const payload = {
        order_type: 'DOMESTIC',
        sender: {
          name: draft.sender.name,
          phone: draft.sender.phone,
          address: [draft.sender.address_detail, sWrd, sDist, sName].filter(Boolean).join(', '),
          province_id: Number(mappedSender.province_id),
          district_id: Number(draft.sender.district_id),
          ward_id: Number(draft.sender.ward_id),
          province_name: mappedSender.province_name,
          district_name: sDist,
          ward_name: sWrd
        },
        receiver: {
          name: draft.receiver.name,
          phone: draft.receiver.phone,
          address: [draft.receiver.address_detail, rWrd, rDist, rName].filter(Boolean).join(', '),
          province_id: Number(mappedReceiver.province_id),
          district_id: Number(draft.receiver.district_id),
          ward_id: Number(draft.receiver.ward_id),
          province_name: mappedReceiver.province_name,
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
  return val ? moment(val).format('HH:mm DD/MM/YYYY') : '---';
};

const getPickupStatusLabel = (status) => {
  switch (status) {
    case 'PENDING_CONFIRMATION': return 'Chờ bưu cục xác nhận';
    case 'RECEIVED': return 'Bưu cục đã tiếp nhận';
    case 'ASSIGNED_PICKUP': return 'Đã gán bưu tá lấy hàng';
    case 'PICKED': return 'Bưu tá đã lấy hàng';
    default: return status || 'Chờ xử lý';
  }
};

const getPickupStatusType = (status) => {
  switch (status) {
    case 'PENDING_CONFIRMATION': return 'warning';
    case 'RECEIVED': return 'info';
    case 'ASSIGNED_PICKUP': return 'primary';
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

const COLUMN_MAPPING = {
  shop_order_code: ['ma don hang shop', 'mã đơn hàng shop', 'ma don hang', 'mã đơn hàng'],
  sender_name: ['ten nguoi gui', 'tên người gửi', 'nguoi gui', 'người gửi'],
  sender_phone: ['so dien thoai nguoi gui', 'số điện thoại người gửi', 'sdt nguoi gui', 'sđt người gửi'],
  sender_address: ['dia chi nguoi gui', 'địa chỉ người gửi'],
  sender_province: ['tinh gui', 'tỉnh gửi'],
  service_type: ['dich vu', 'dịch vụ'],
  extra_services: ['dich vu cong them', 'dịch vụ cộng thêm', 'dvct'],
  receiver_name: ['ho ten nguoi nhan', 'họ tên người nhận', 'ten nguoi nhan', 'tên người nhận', 'nguoi nhan', 'người nhận'],
  receiver_phone: ['so dien thoai nguoi nhan', 'số điện thoại người nhận', 'sdt nguoi nhan', 'sđt người nhận'],
  receiver_address: ['dia chi giao hang', 'địa chỉ giao hàng', 'dia chi nguoi nhan', 'địa chỉ người nhận'],
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
  excelInput.value.click();
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

      ElMessage.info(`Đang phân tích ${rawRows.length} dòng dữ liệu...`);

      // Ensure provinces are loaded
      if (provinces.value.length === 0) {
        await fetchProvinces();
      }

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
        if (!val) return 'CPN';
        const s = val.toString().trim().toLowerCase();
        if (s.includes('tiet kiem') || s.includes('tiết kiệm') || s.includes('standard') || s.includes('economy') || s.includes('tk')) return 'TK';
        if (s.includes('hoa toc') || s.includes('hỏa tốc') || s.includes('express') || s.includes('ht')) return 'HT';
        if (s.includes('nhanh') || s.includes('fast') || s.includes('cpn')) return 'CPN';
        return 'CPN';
      };

      const parseExtraServices = (val) => {
        if (!val) return [];
        return val.toString().split(',').map(s => s.trim()).filter(Boolean);
      };

      const mapPaymentMethod = (val) => {
        if (!val) return 'SENDER_DEBT';
        const s = val.toString().trim().toLowerCase();
        if (s.includes('gui') || s.includes('người gửi') || s.includes('pay')) return 'SENDER_PAY';
        if (s.includes('nhan') || s.includes('người nhận') || s.includes('thu')) return 'RECEIVER_PAY';
        return 'SENDER_DEBT';
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
          service_type: getValueByMapping(row, 'service_type') || '',
          extra_services: getValueByMapping(row, 'extra_services') || ''
        });
      }

      // Preload districts and wards in batch
      const uniqueProvinceIds = [
        ...new Set([
          ...parsedRows.map(r => r.senderProvinceId),
          ...parsedRows.map(r => r.receiverProvinceId)
        ].filter(Boolean))
      ];

      for (const pId of uniqueProvinceIds) {
        districtsCache[pId] = await fetchDistrictsForProvince(pId);
      }

      for (const row of parsedRows) {
        if (row.senderProvinceId && row.sender_district_name) {
          const dists = districtsCache[row.senderProvinceId] || [];
          const match = dists.find(d => norm(d.name) === norm(row.sender_district_name));
          if (match) row.senderDistrictId = match.id;
        }
        if (row.receiverProvinceId && row.receiver_district_name) {
          const dists = districtsCache[row.receiverProvinceId] || [];
          const match = dists.find(d => norm(d.name) === norm(row.receiver_district_name));
          if (match) row.receiverDistrictId = match.id;
        }
      }

      const uniqueDistrictIds = [
        ...new Set([
          ...parsedRows.map(r => r.senderDistrictId),
          ...parsedRows.map(r => r.receiverDistrictId)
        ].filter(Boolean))
      ];

      for (const dId of uniqueDistrictIds) {
        wardsCache[dId] = await fetchWardsForDistrict(dId);
      }

      for (const row of parsedRows) {
        if (row.senderDistrictId && row.sender_ward_name) {
          const wrds = wardsCache[row.senderDistrictId] || [];
          const match = wrds.find(w => norm(w.name) === norm(row.sender_ward_name));
          if (match) row.senderWardId = match.id;
        }
        if (row.receiverDistrictId && row.receiver_ward_name) {
          const wrds = wardsCache[row.receiverDistrictId] || [];
          const match = wrds.find(w => norm(w.name) === norm(row.receiver_ward_name));
          if (match) row.receiverWardId = match.id;
        }
      }

      // Build drafts
      const importedDrafts = parsedRows.map((row, index) => {
        return {
          sender: {
            name: row.sender_name || form.sender?.name || authStore.user?.full_name || customerInfo.value?.transaction_name || '',
            phone: row.sender_phone || form.sender?.phone || customerInfo.value?.phone_number || '',
            province_id: row.senderProvinceId || form.sender?.province_id || customerInfo.value?.province_id || null,
            district_id: row.senderDistrictId || form.sender?.district_id || customerInfo.value?.district_id || null,
            ward_id: row.senderWardId || form.sender?.ward_id || customerInfo.value?.ward_id || null,
            address_detail: row.sender_address_detail || form.sender?.address_detail || customerInfo.value?.address_detail || ''
          },
          receiver: {
            name: row.receiver_name || '',
            phone: row.receiver_phone || '',
            province_id: row.receiverProvinceId || null,
            district_id: row.receiverDistrictId || null,
            ward_id: row.receiverWardId || null,
            address_detail: row.receiver_address_detail || ''
          },
          items: [
            {
              product_group: row.product_group || 'PARCEL',
              product_name: row.product_name || 'Hàng hóa',
              weight: Number(row.weight || 0.5),
              length: Number(row.length || 0),
              width: Number(row.width || 0),
              height: Number(row.height || 0),
              quantity: Number(row.quantity || 1),
              declared_value: Number(row.declared_value || 0)
            }
          ],
          cod_amount: Number(row.cod_amount || 0),
          cod_receiver_pays_fee: false,
          service_type: mapServiceType(row.service_type),
          extra_services: parseExtraServices(row.extra_services),
          delivery_note_option: 'CHO_XEM_HANG',
          note: '',
          payment_method: mapPaymentMethod(row.payment_method),
          target_hub_id: form.target_hub_id || null,
          draft_id: (Date.now() + index).toString(),
          created_at: new Date().toISOString()
        };
      });

      draftsList.value.push(...importedDrafts);
      localStorage.setItem('customer_pickup_queue', JSON.stringify(draftsList.value));

      ElMessage.success(`Nhập thành công ${importedDrafts.length} đơn vào hàng chờ.`);
      event.target.value = '';

      // Redirect to drafts page to view imports
      router.push('/customer/drafts');
    } catch (err) {
      console.error(err);
      ElMessage.error('Có lỗi xảy ra khi đọc file Excel. Vui lòng kiểm tra lại cấu trúc file.');
    }
  };
  reader.readAsArrayBuffer(file);
};

onMounted(async () => {
  if (!authStore.user) return;

  loadDrafts();

  // 1. Fetch provinces first
  await fetchProvinces();

  // Check if resuming a draft via query param
  const resumeDraftId = route.query.resume_draft_id;
  if (resumeDraftId) {
    const storedQueue = localStorage.getItem('customer_pickup_queue');
    const storedDrafts = localStorage.getItem('customer_pickup_drafts');
    let found = null;
    if (storedQueue) {
      const parsed = JSON.parse(storedQueue);
      found = parsed.find(d => d.draft_id === resumeDraftId);
    }
    if (!found && storedDrafts) {
      const parsed = JSON.parse(storedDrafts);
      found = parsed.find(d => d.draft_id === resumeDraftId);
    }
    if (found) {
      Object.assign(form, JSON.parse(JSON.stringify(found)));
      if (form.sender.province_id) senderDistricts.value = await fetchDistrictsForProvince(form.sender.province_id);
      if (form.sender.district_id) senderWards.value = await fetchWardsForDistrict(form.sender.district_id);
      if (form.receiver.province_id) receiverDistricts.value = await fetchDistrictsForProvince(form.receiver.province_id);
      if (form.receiver.district_id) receiverWards.value = await fetchWardsForDistrict(form.receiver.district_id);
      debouncedSimulate();
      showCreateForm.value = true;

      fetchPickupsList();
      fetchAvailableServices();
      fetchHubs();
      return;
    }
  }

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

    // Tự động điền thông tin người gửi từ hồ sơ đăng ký của khách hàng
    form.sender.name = activeUser.full_name || customerInfo.value.transaction_name || '';
    form.sender.phone = customerInfo.value.phone_number || '';
    form.sender.province_id = customerInfo.value.province_id || null;
    form.sender.district_id = customerInfo.value.district_id || null;
    form.sender.ward_id = customerInfo.value.ward_id || null;
    form.sender.address_detail = customerInfo.value.address_detail || '';
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
