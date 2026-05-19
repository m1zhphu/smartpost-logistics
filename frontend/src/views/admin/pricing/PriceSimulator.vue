<template>
  <div class="price-simulator-page animate-fade-in">
    <div class="page-header flex-between mb-24">
      <div class="header-left flex-center gap-12">
        <div class="header-icon">
          <el-icon><Money /></el-icon>
        </div>
        <div>
          <h2 class="page-title">Công cụ Tính cước & Mô phỏng giá</h2>
          <p class="page-subtitle">Tính toán cước chính xác bao gồm phụ phí thể tích, vùng sâu vùng xa & VAT 8%</p>
        </div>
      </div>
      <div class="header-right">
        <el-button type="primary" plain :icon="Refresh" @click="resetForm">
          Đặt lại form
        </el-button>
      </div>
    </div>

    <el-row :gutter="24" class="simulator-layout">
      <!-- Cột Trái: Nhập thông tin cước (60%) -->
      <el-col :xs="24" :lg="14" class="form-column">
        <el-card shadow="never" class="modern-card">
          <div class="card-header-custom mb-20">
            <el-icon><Guide /></el-icon>
            <span>Thông số mô phỏng cước</span>
          </div>

          <el-form :model="simForm" label-position="top" class="modern-simulator-form">
            <!-- Tuyến đường gửi / nhận -->
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="Bưu cục gửi (Origin Hub)">
                  <el-select 
                    v-model="selectedOriginHubId" 
                    placeholder="Chọn bưu cục gửi..." 
                    class="w-full custom-select" 
                    filterable 
                    @change="onOriginChange"
                  >
                    <template #prefix><el-icon><LocationInformation /></el-icon></template>
                    <el-option 
                      v-for="hub in hubs" 
                      :key="hub.hub_id" 
                      :label="`${hub.hub_code} - ${hub.hub_name}`" 
                      :value="hub.hub_id" 
                    />
                  </el-select>
                  <transition name="el-fade-in-linear">
                    <div v-if="originHub" class="helper-text-info mt-4">
                      <el-tag size="small" type="primary" effect="plain">Mã tỉnh: {{ originHub.province_id }}</el-tag>
                    </div>
                  </transition>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="Bưu cục nhận (Destination Hub)">
                  <el-select 
                    v-model="selectedDestHubId" 
                    placeholder="Chọn bưu cục nhận..." 
                    class="w-full custom-select" 
                    filterable 
                    @change="onDestChange"
                  >
                    <template #prefix><el-icon><Location /></el-icon></template>
                    <el-option 
                      v-for="hub in hubs" 
                      :key="hub.hub_id" 
                      :label="`${hub.hub_code} - ${hub.hub_name}`" 
                      :value="hub.hub_id" 
                    />
                  </el-select>
                  <transition name="el-fade-in-linear">
                    <div v-if="destHub" class="helper-text-info mt-4">
                      <el-tag size="small" type="primary" effect="plain">Mã tỉnh: {{ destHub.province_id }}</el-tag>
                    </div>
                  </transition>
                </el-form-item>
              </el-col>
            </el-row>

            <el-divider class="custom-divider" />

            <!-- Thông số trọng lượng & kích thước -->
            <div class="sub-section-title mb-16">📦 Khối lượng & Kích thước kiện hàng</div>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="Trọng lượng thực tế (kg)">
                  <el-input-number 
                    v-model="simForm.weight" 
                    class="w-full large-number-input" 
                    :min="0.1" 
                    :step="0.1" 
                    :precision="2"
                  />
                  <div class="helper-text">Trọng lượng bưu tá cân thực tế tại shop.</div>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="Thu hộ COD (VNĐ)">
                  <el-input-number 
                    v-model="simForm.cod_amount" 
                    class="w-full large-number-input color-success" 
                    :min="0" 
                    :step="50000" 
                    :controls="false"
                    placeholder="Nhập số tiền COD nếu có..."
                  />
                  <div class="helper-text">COD dùng để tính phụ phí Khai giá % tương ứng.</div>
                </el-form-item>
              </el-col>
            </el-row>

            <!-- Kích thước quy đổi thể tích -->
            <el-row :gutter="15" class="mt-8">
              <el-col :span="8">
                <el-form-item label="Dài (cm)">
                  <el-input-number v-model="simForm.length" class="w-full" :min="0" :step="1" :controls="false" placeholder="Chiều dài" />
                </el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item label="Rộng (cm)">
                  <el-input-number v-model="simForm.width" class="w-full" :min="0" :step="1" :controls="false" placeholder="Chiều rộng" />
                </el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item label="Cao (cm)">
                  <el-input-number v-model="simForm.height" class="w-full" :min="0" :step="1" :controls="false" placeholder="Chiều cao" />
                </el-form-item>
              </el-col>
            </el-row>
            <div class="info-alert mb-20 mt-4">
              <el-icon class="mr-6"><Warning /></el-icon>
              <span>Công thức quy đổi hàng cồng kềnh: <strong class="text-primary">(Dài x Rộng x Cao) / 5000</strong>. Trọng lượng tính cước sẽ tự động lấy giá trị lớn nhất.</span>
            </div>

            <el-divider class="custom-divider" />

            <!-- Dịch vụ & Tiện ích cộng thêm -->
            <div class="sub-section-title mb-16">🚚 Dịch vụ vận chuyển & Dịch vụ Gia tăng</div>
            <el-form-item label="Dịch vụ vận tải chính" class="mb-20">
              <el-radio-group v-model="simForm.service_type" class="w-full service-radio-group">
                <el-radio-button label="STANDARD" class="flex-1">
                  <div class="flex-col-center">
                    <span class="service-name">Tiêu chuẩn (STANDARD)</span>
                    <span class="service-desc">SLA: 24h - 48h</span>
                  </div>
                </el-radio-button>
                <el-radio-button label="EXPRESS" class="flex-1">
                  <div class="flex-col-center">
                    <span class="service-name">Hỏa tốc (EXPRESS)</span>
                    <span class="service-desc">SLA: 4h - 8h khẩn cấp</span>
                  </div>
                </el-radio-button>
              </el-radio-group>
            </el-form-item>

            <el-form-item label="Dịch vụ tiện ích gia tăng (Checkboxes)">
              <div v-loading="loadingServices" class="services-checkbox-container w-full">
                <el-checkbox-group v-model="simForm.extra_services" class="checkbox-grid">
                  <div 
                    v-for="srv in activeServices" 
                    :key="srv.service_code"
                    class="checkbox-card"
                    :class="{ active: simForm.extra_services.includes(srv.service_code) }"
                  >
                    <el-checkbox :label="srv.service_code">
                      <div class="checkbox-content">
                        <span class="srv-title">{{ srv.service_name }}</span>
                        <span class="srv-price">
                          Phí: <strong>{{ srv.fee_value.toLocaleString() }}</strong> 
                          {{ srv.fee_type === 'FIXED' ? 'đ' : '% COD' }}
                        </span>
                      </div>
                    </el-checkbox>
                  </div>
                </el-checkbox-group>
                <el-empty 
                  v-if="!loadingServices && activeServices.length === 0" 
                  description="Không tìm thấy cấu hình dịch vụ tiện ích nào" 
                  :image-size="60" 
                />
              </div>
            </el-form-item>

            <div class="action-row mt-24">
              <el-button 
                type="primary" 
                class="btn-simulate-submit w-full" 
                @click="calculatePrice" 
                :loading="simulating"
                :disabled="!simForm.origin_province_id || !simForm.dest_province_id"
              >
                <el-icon class="mr-8" v-if="!simulating"><Money /></el-icon>
                <span>Tính toán và xuất hóa đơn tạm tính</span>
              </el-button>
            </div>
          </el-form>
        </el-card>
      </el-col>

      <!-- Cột Phải: Hóa đơn tính cước chi tiết (40%) -->
      <el-col :xs="24" :lg="10" class="result-column">
        <div class="invoice-wrapper sticky-top">
          <!-- Bìa hóa đơn -->
          <div class="invoice-card" :class="{ 'has-result': result }">
            <div class="invoice-header">
              <div class="logo-text">SMARTPOST LOGISTICS</div>
              <div class="invoice-title">HÓA ĐƠN TẠM TÍNH CƯỚC</div>
              <span class="invoice-status" :class="{ success: result }">
                {{ result ? 'ĐÃ TÍNH TOÀN TRÌNH' : 'ĐANG CHỜ THÔNG TIN' }}
              </span>
            </div>

            <div class="invoice-body">
              <div v-if="!result" class="invoice-empty">
                <el-icon class="empty-icon"><ScaleToOriginal /></el-icon>
                <p class="empty-title">Chưa có kết quả báo giá</p>
                <p class="empty-desc">Vui lòng điền đầy đủ tuyến đường, trọng lượng bên trái và bấm nút "Tính toán"</p>
              </div>

              <div v-else class="invoice-content animate-fade-in-up">
                <!-- Thông tin hành trình -->
                <div class="invoice-section">
                  <div class="section-title">Hành trình vận chuyển</div>
                  <div class="flex-between font-sm mb-6">
                    <span class="text-muted">Từ bưu cục:</span>
                    <span class="text-dark font-bold">{{ originHub?.hub_name }}</span>
                  </div>
                  <div class="flex-between font-sm mb-6">
                    <span class="text-muted">Đến bưu cục:</span>
                    <span class="text-dark font-bold">{{ destHub?.hub_name }}</span>
                  </div>
                  <div class="flex-between font-sm">
                    <span class="text-muted">Gói dịch vụ:</span>
                    <el-tag size="small" :type="simForm.service_type === 'EXPRESS' ? 'danger' : 'primary'">
                      {{ simForm.service_type === 'EXPRESS' ? 'HỎA TỐC (EXPRESS)' : 'TIÊU CHUẨN (STANDARD)' }}
                    </el-tag>
                  </div>
                </div>

                <el-divider class="invoice-dashed" />

                <!-- Trọng lượng tính toán -->
                <div class="invoice-section">
                  <div class="section-title">Kiểm soát trọng lượng</div>
                  <div class="flex-between font-sm mb-6">
                    <span class="text-muted">Cân nặng thực tế:</span>
                    <span class="text-dark font-bold">{{ simForm.weight }} kg</span>
                  </div>
                  <div class="flex-between font-sm mb-6">
                    <span class="text-muted">Kích thước (DxRxC):</span>
                    <span class="text-dark">
                      {{ simForm.length || 0 }} x {{ simForm.width || 0 }} x {{ simForm.height || 0 }} cm
                    </span>
                  </div>
                  <div class="flex-between font-sm highlight-row">
                    <span class="text-muted font-bold">Cân nặng tính cước:</span>
                    <span class="text-primary font-bold text-lg">{{ result.charge_weight }} kg</span>
                  </div>
                  <div class="info-note mt-6" v-if="result.charge_weight > simForm.weight">
                    * Áp dụng cân nặng quy đổi thể tích hàng cồng kềnh.
                  </div>
                </div>

                <el-divider class="invoice-dashed" />

                <!-- Chi tiết cước phí -->
                <div class="invoice-section">
                  <div class="section-title">Chi tiết cấu phần giá</div>
                  
                  <div class="flex-between font-sm mb-10">
                    <span class="text-muted">Cước chính (Base Price):</span>
                    <span class="price-val font-bold">{{ formatCurrency(result.main_fee) }}</span>
                  </div>
                  
                  <div class="flex-between font-sm mb-10" v-if="result.extra_fee > 0">
                    <span class="text-muted">Phí dịch vụ gia tăng (Surcharges):</span>
                    <span class="price-val font-bold">{{ formatCurrency(result.extra_fee) }}</span>
                  </div>

                  <div class="flex-between font-sm mb-10" v-if="result.remote_fee > 0">
                    <span class="text-muted">Phụ phí vùng sâu vùng xa:</span>
                    <span class="price-val font-bold text-warning">{{ formatCurrency(result.remote_fee) }}</span>
                  </div>

                  <div class="flex-between font-sm mb-10">
                    <span class="text-muted">Thuế VAT (8%):</span>
                    <span class="price-val font-bold">{{ formatCurrency(result.vat_8) }}</span>
                  </div>
                </div>

                <el-divider class="invoice-dashed" />

                <!-- Tổng thành tiền -->
                <div class="invoice-total-section">
                  <div class="flex-between items-center mb-6">
                    <span class="total-label text-dark font-bold">TỔNG CỘNG THÀNH TIỀN:</span>
                    <span class="total-value text-red-600">{{ formatCurrency(result.grand_total) }}</span>
                  </div>
                  <div class="text-xs text-muted text-right italic">* Đã bao gồm toàn bộ thuế và phụ phí tuyến.</div>
                </div>

                <!-- Thao tác hóa đơn -->
                <div class="invoice-actions mt-20 flex gap-12">
                  <el-button type="success" class="flex-1" :icon="Printer" @click="printReceipt">
                    In báo giá nhanh
                  </el-button>
                  <el-button type="primary" plain class="flex-1" :icon="CopyDocument" @click="copyReceiptInfo">
                    Sao chép kết quả
                  </el-button>
                </div>
              </div>
            </div>

            <!-- Răng cưa chân hóa đơn -->
            <div class="invoice-footer-jagged"></div>
          </div>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue';
import { Money, Refresh, Guide, Location, LocationInformation, Warning, ScaleToOriginal, Printer, CopyDocument } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import api from '@/api/axios';

const hubs = ref([]);
const activeServices = ref([]);
const loadingServices = ref(false);
const simulating = ref(false);
const result = ref(null);

const selectedOriginHubId = ref(null);
const selectedDestHubId = ref(null);

const simForm = reactive({
  origin_province_id: null,
  dest_province_id: null,
  weight: 0.5,
  length: 0,
  width: 0,
  height: 0,
  service_type: 'STANDARD',
  cod_amount: 0,
  extra_services: []
});

const originHub = computed(() => hubs.value.find(h => h.hub_id === selectedOriginHubId.value) || null);
const destHub = computed(() => hubs.value.find(h => h.hub_id === selectedDestHubId.value) || null);

// Nạp danh sách bưu cục
const fetchHubs = async () => {
  try {
    const res = await api.get('/api/hubs');
    hubs.value = res.data || [];
  } catch (error) {
    ElMessage.error('Lỗi khi tải danh sách bưu cục');
  }
};

// Nạp cấu hình dịch vụ tiện ích cộng thêm
const fetchServices = async () => {
  loadingServices.value = true;
  try {
    const res = await api.get('/api/pricing/extra-services');
    // Chỉ lấy dịch vụ đang kích hoạt (is_active == true)
    activeServices.value = (res.data || []).filter(s => s.is_active);
  } catch (error) {
    ElMessage.error('Lỗi khi tải danh sách cấu hình dịch vụ tiện ích');
  } finally {
    loadingServices.value = false;
  }
};

const onOriginChange = (hubId) => {
  const hub = hubs.value.find(h => h.hub_id === hubId);
  simForm.origin_province_id = hub ? hub.province_id : null;
};

const onDestChange = (hubId) => {
  const hub = hubs.value.find(h => h.hub_id === hubId);
  simForm.dest_province_id = hub ? hub.province_id : null;
};

// Gọi API tính cước /simulate
const calculatePrice = async () => {
  if (!simForm.origin_province_id || !simForm.dest_province_id) {
    ElMessage.warning('Vui lòng chọn đầy đủ bưu cục gửi và bưu cục nhận.');
    return;
  }
  
  simulating.value = true;
  result.value = null;
  try {
    const res = await api.post('/api/pricing/simulate', simForm);
    result.value = res.data;
    ElMessage.success('Đã tính toán cước toàn trình thành công!');
  } catch (error) {
    const errorMsg = error.response?.data?.detail || 'Không tìm thấy bảng giá tương thích cho tuyến đường này.';
    ElMessage.error(errorMsg);
  } finally {
    simulating.value = false;
  }
};

// Định dạng tiền tệ
const formatCurrency = (val) => {
  if (val === null || val === undefined) return '0 đ';
  return Number(val).toLocaleString('vi-VN') + ' đ';
};

// In báo giá nhanh
const printReceipt = () => {
  window.print();
};

// Reset form
const resetForm = () => {
  selectedOriginHubId.value = null;
  selectedDestHubId.value = null;
  Object.assign(simForm, {
    origin_province_id: null,
    dest_province_id: null,
    weight: 0.5,
    length: 0,
    width: 0,
    height: 0,
    service_type: 'STANDARD',
    cod_amount: 0,
    extra_services: []
  });
  result.value = null;
  ElMessage.info('Đã đặt lại form mô phỏng cước.');
};

// Sao chép kết quả cước
const copyReceiptInfo = () => {
  if (!result.value) return;
  
  const srvNames = simForm.extra_services
    .map(code => activeServices.value.find(s => s.service_code === code)?.service_name)
    .filter(Boolean)
    .join(', ');

  const textToCopy = `--- SMARTPOST LOGISTICS - BÁO GIÁ CƯỚC ---
Tuyến đường: ${originHub.value?.hub_name} -> ${destHub.value?.hub_name}
Dịch vụ chính: ${simForm.service_type === 'EXPRESS' ? 'Hỏa tốc' : 'Tiêu chuẩn'}
Cân nặng thực tế: ${simForm.weight} kg
Cân nặng tính cước: ${result.value.charge_weight} kg
Kích thước: ${simForm.length}x${simForm.width}x${simForm.height} cm
Dịch vụ cộng thêm: ${srvNames || 'Không có'}
------------------------------------------
- Cước chính: ${formatCurrency(result.value.main_fee)}
- Phí dịch vụ: ${formatCurrency(result.value.extra_fee)}
- VAT (8%): ${formatCurrency(result.value.vat_8)}
------------------------------------------
TỔNG THÀNH TIỀN: ${formatCurrency(result.value.grand_total)}`;

  navigator.clipboard.writeText(textToCopy)
    .then(() => ElMessage.success('Đã sao chép báo giá vào bộ nhớ tạm!'))
    .catch(() => ElMessage.error('Không thể sao chép văn bản.'));
};

onMounted(() => {
  fetchHubs();
  fetchServices();
});
</script>

<style scoped>
.price-simulator-page {
  padding: 30px;
  background-color: #f4f7fe;
  min-height: calc(100vh - 80px);
}

.page-title {
  font-size: 24px;
  font-weight: 800;
  color: #1b2559;
  margin: 0;
  letter-spacing: -0.5px;
}

.page-subtitle {
  font-size: 13px;
  color: #a3aed0;
  margin: 4px 0 0;
}

.header-icon {
  width: 46px;
  height: 46px;
  background: #ffffff;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #4318ff;
  font-size: 24px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
}

.modern-card {
  border-radius: 20px;
  border: 1px solid #e9edf7;
  background: #ffffff;
  padding: 8px;
}

.card-header-custom {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 16px;
  font-weight: 800;
  color: #1b2559;
  border-bottom: 1px solid #f4f7fe;
  padding-bottom: 15px;
}

.card-header-custom .el-icon {
  color: #4318ff;
  font-size: 20px;
}

.custom-divider {
  margin: 24px 0;
  border-color: #f4f7fe;
}

.sub-section-title {
  font-size: 14px;
  font-weight: 700;
  color: #2b3674;
}

.helper-text {
  font-size: 11px;
  color: #a3aed0;
  margin-top: 4px;
  line-height: 1.4;
}

.helper-text-info {
  font-size: 12px;
  color: #4318ff;
}

.info-alert {
  background: #eef2ff;
  border-radius: 10px;
  padding: 10px 14px;
  display: flex;
  align-items: center;
  font-size: 12px;
  color: #4318ff;
  line-height: 1.5;
}

/* Service Radio Buttons */
.service-radio-group :deep(.el-radio-button__inner) {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px !important;
  border: 1px solid #e2e8f0 !important;
  margin-right: 12px;
  background: #ffffff;
  box-shadow: none !important;
  transition: all 0.3s;
}

.service-radio-group :deep(.el-radio-button:last-child .el-radio-button__inner) {
  margin-right: 0;
}

.service-radio-group :deep(.el-radio-button.is-active .el-radio-button__inner) {
  background: rgba(67, 24, 255, 0.05) !important;
  border-color: #4318ff !important;
  color: #4318ff !important;
}

.flex-col-center {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.service-name {
  font-weight: 700;
  font-size: 14px;
}

.service-desc {
  font-size: 11px;
  opacity: 0.8;
}

/* Extra Services Checkboxes */
.checkbox-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.checkbox-card {
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 14px;
  background: #ffffff;
  transition: all 0.3s ease;
  cursor: pointer;
}

.checkbox-card:hover {
  border-color: #cbd5e1;
  background: #f8fafc;
}

.checkbox-card.active {
  border-color: #4318ff;
  background: rgba(67, 24, 255, 0.02);
}

.checkbox-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-left: 8px;
}

.srv-title {
  font-weight: 700;
  color: #1b2559;
  font-size: 13px;
  white-space: normal;
  word-break: break-word;
}

.srv-price {
  font-size: 11px;
  color: #71717a;
}

.srv-price strong {
  color: #10b981;
}

:deep(.checkbox-card .el-checkbox) {
  height: auto;
  align-items: flex-start;
  display: flex;
}

/* Large Inputs */
:deep(.large-number-input .el-input__wrapper) {
  padding: 8px 12px;
  border-radius: 12px;
}

:deep(.large-number-input .el-input__inner) {
  font-size: 16px;
  font-weight: 700;
  color: #1b2559;
}

:deep(.color-success .el-input__inner) {
  color: #10b981;
}

.btn-simulate-submit {
  height: 52px;
  border-radius: 14px;
  font-size: 16px;
  font-weight: 700;
  background: linear-gradient(135deg, #4318ff 0%, #868cff 100%);
  border: none;
  box-shadow: 0 4px 15px rgba(67, 24, 255, 0.3);
  transition: all 0.3s;
}

.btn-simulate-submit:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(67, 24, 255, 0.4);
}

/* INVOICE CARD STYLE (RIGHT COLUMN) */
.sticky-top {
  position: sticky;
  top: 30px;
}

.invoice-card {
  background: #ffffff;
  border-radius: 24px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.04);
  border: 1px solid #e9edf7;
  overflow: hidden;
  position: relative;
  transition: all 0.4s ease;
}

.invoice-card.has-result {
  border-color: rgba(67, 24, 255, 0.2);
  box-shadow: 0 15px 40px rgba(67, 24, 255, 0.08);
}

.invoice-header {
  background: linear-gradient(135deg, #1b2559 0%, #111827 100%);
  padding: 30px 24px;
  text-align: center;
  color: white;
}

.logo-text {
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 2px;
  color: #868cff;
  margin-bottom: 6px;
}

.invoice-title {
  font-size: 20px;
  font-weight: 800;
  letter-spacing: -0.5px;
  margin-bottom: 12px;
}

.invoice-status {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 30px;
  font-size: 10px;
  font-weight: 800;
  background: rgba(255, 255, 255, 0.1);
  color: #cbd5e1;
  letter-spacing: 0.5px;
}

.invoice-status.success {
  background: #e6fffa;
  color: #029875;
}

.invoice-body {
  padding: 30px 24px;
  min-height: 250px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.invoice-empty {
  text-align: center;
  padding: 40px 0;
}

.empty-icon {
  font-size: 48px;
  color: #cbd5e1;
  margin-bottom: 14px;
}

.empty-title {
  font-size: 15px;
  font-weight: 700;
  color: #1b2559;
  margin: 0 0 6px;
}

.empty-desc {
  font-size: 12px;
  color: #a3aed0;
  max-width: 250px;
  margin: 0 auto;
  line-height: 1.5;
}

/* Invoice details */
.invoice-section {
  display: flex;
  flex-direction: column;
}

.invoice-section .section-title {
  font-size: 11px;
  font-weight: 800;
  color: #a3aed0;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 12px;
}

.invoice-dashed {
  border-top: 1px dashed #e2e8f0;
  margin: 18px 0;
}

.highlight-row {
  background: #f8fafc;
  padding: 8px 12px;
  border-radius: 8px;
  margin-top: 4px;
}

.info-note {
  font-size: 11px;
  color: #4318ff;
  font-weight: 500;
}

.price-val {
  color: #1e293b;
}

/* Invoice Total */
.invoice-total-section {
  background: #f4f7fe;
  border-radius: 16px;
  padding: 20px;
  border: 1px solid #e9edf7;
}

.total-label {
  font-size: 14px;
  color: #2b3674;
}

.total-value {
  font-size: 26px;
  font-weight: 800;
  letter-spacing: -1px;
}

/* Jagged footer effect */
.invoice-footer-jagged {
  height: 12px;
  background-image: linear-gradient(-45deg, transparent 6px, #ffffff 6px), 
                    linear-gradient(45deg, transparent 6px, #ffffff 6px);
  background-size: 12px 12px;
  background-position: left bottom;
  background-repeat: repeat-x;
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  filter: drop-shadow(0 -4px 5px rgba(0, 0, 0, 0.02));
  transform: translateY(1px);
}


/* Utilities */
.w-full { width: 100%; }
.flex { display: flex; }
.flex-1 { flex: 1; }
.gap-12 { gap: 12px; }
.flex-between { display: flex; justify-content: space-between; align-items: center; }
.flex-center { display: flex; align-items: center; }
.items-center { align-items: center; }
.mb-6 { margin-bottom: 6px; }
.mb-10 { margin-bottom: 10px; }
.mb-16 { margin-bottom: 16px; }
.mb-20 { margin-bottom: 20px; }
.mb-24 { margin-bottom: 24px; }
.mt-4 { margin-top: 4px; }
.mt-8 { margin-top: 8px; }
.mt-20 { margin-top: 20px; }
.mt-24 { margin-top: 24px; }
.font-sm { font-size: 13px; }
.font-bold { font-weight: 700; }
.font-bold-800 { font-weight: 800; }
.text-lg { font-size: 15px; }
.text-primary { color: #4318ff; }
.text-warning { color: #d97706; }
.text-dark { color: #1b2559; }
.text-muted { color: #a3aed0; }
.text-red-600 { color: #dc2626; }
.mr-6 { margin-right: 6px; }
.mr-8 { margin-right: 8px; }
</style>

<style>
/* Global print styles to cleanly isolate the invoice card */
@media print {
  html, body {
    background: #ffffff !important;
    margin: 0 !important;
    padding: 0 !important;
    height: auto !important;
  }

  /* Hide sidebar, panel, headers, breadcrumbs, forms and buttons */
  .primary-sidebar,
  .secondary-panel,
  .modern-header,
  .page-header,
  .form-column,
  .invoice-actions,
  .card-header-custom,
  .custom-divider {
    display: none !important;
  }

  /* Reset layout constraints and display full-width content */
  .modern-layout-container,
  .main-wrapper,
  .el-main,
  .price-simulator-page,
  .simulator-layout,
  .result-column {
    display: block !important;
    width: 100% !important;
    margin: 0 !important;
    padding: 0 !important;
    box-shadow: none !important;
    border: none !important;
    background: transparent !important;
  }

  /* Center the invoice card on the page */
  .invoice-wrapper {
    position: relative !important;
    top: 0 !important;
    width: 100% !important;
    max-width: 650px !important;
    margin: 0 auto !important;
    padding: 10px !important;
    box-shadow: none !important;
  }

  .invoice-card {
    border: 1px solid #e2e8f0 !important;
    box-shadow: none !important;
    background: #ffffff !important;
    width: 100% !important;
    border-radius: 16px !important;
  }
}
</style>
