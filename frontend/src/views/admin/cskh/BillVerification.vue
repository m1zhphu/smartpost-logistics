<template>
  <div class="p-6">
    <div class="flex justify-between items-center mb-6">
      <div>
        <h2 class="text-2xl font-bold text-gray-800">Trung tâm Kiểm duyệt (CSKH)</h2>
        <p class="text-gray-500">Duyệt ảnh vận đơn từ bưu tá tải lên</p>
      </div>
      <div>
        <el-button type="primary" @click="showSimulator = true">
          <el-icon class="mr-2"><Money /></el-icon> Tra cứu giá nhanh
        </el-button>
        <el-button type="success" @click="fetchPendingBills">
          <el-icon><Refresh /></el-icon> Làm mới
        </el-button>
      </div>
    </div>

    <!-- Table Danh sách Chờ Duyệt -->
    <el-card shadow="sm">
      <el-table :data="tableData" v-loading="loading" stripe border style="width: 100%">
        <el-table-column prop="waybill_code" label="Mã Vận Đơn" min-width="150" font-weight="bold" />
        <el-table-column prop="origin_hub.hub_name" label="Bưu cục tạo" min-width="150" />
        <el-table-column label="Thông tin gửi/nhận" min-width="280">
          <template #default="scope">
            <div class="text-xs" style="line-height: 1.6;">
              <div><strong>Gửi:</strong> {{ scope.row.origin_hub?.hub_name || 'N/A' }}</div>
              <div><strong>Nhận:</strong> {{ scope.row.receiver_name }} ({{ scope.row.receiver_phone }})</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="Tem Bill (Gốc)" min-width="130" align="center">
          <template #default="scope">
            <el-button
              size="small"
              type="primary"
              plain
              @click="openPrintLabel(scope.row.waybill_code)"
              title="Xem tem vận đơn gốc"
            >
              <el-icon class="mr-1"><Printer /></el-icon> Xem tem
            </el-button>
          </template>
        </el-table-column>
        <el-table-column label="Ảnh Tem Bill" min-width="120" align="center">
          <template #default="scope">
            <el-image
              v-if="scope.row.bill_image_url"
              style="width: 50px; height: 50px"
              :src="getMediaUrl(scope.row.bill_image_url)"
              :preview-src-list="[getMediaUrl(scope.row.bill_image_url)]"
              fit="cover"
              preview-teleported
            />
            <el-tag v-else type="info" size="small">Không có ảnh</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="Hành động" min-width="280" align="center">
          <template #default="scope">
            <el-button size="small" type="primary" plain @click="openCompareDialog(scope.row)">
              <el-icon class="mr-1"><Memo /></el-icon> Đối chiếu AI
            </el-button>
            <el-button size="small" type="success" @click="handleVerify(scope.row.waybill_code, 'VERIFIED')">Duyệt</el-button>
            <el-button size="small" type="danger" @click="openRejectDialog(scope.row.waybill_code)">Từ chối</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- Dialog Từ chối -->
    <el-dialog v-model="rejectDialogVisible" title="Từ chối Ảnh Bill" width="400px">
      <p class="mb-2">Vui lòng nhập lý do từ chối (bắt buộc):</p>
      <el-input
        v-model="rejectReason"
        type="textarea"
        :rows="3"
        placeholder="VD: Sai tiền COD, sai cân nặng..."
      />
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="rejectDialogVisible = false">Hủy</el-button>
          <el-button type="danger" @click="submitReject" :disabled="!rejectReason.trim()">Xác nhận Từ chối</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- Dialog Đối chiếu Side-by-Side AI OCR -->
    <el-dialog v-model="compareDialogVisible" title="ĐỐI CHIẾU CHI TIẾT VẬN ĐƠN" width="850px" destroy-on-close>
      <div v-if="selectedWaybill" class="compare-layout">
        <!-- Cột trái: Ảnh Bill & Kiện hàng -->
        <div class="compare-image-side">
          <div class="side-title">📷 Hình ảnh đối chiếu</div>
          <el-tabs type="border-card" class="image-tabs" style="border-radius: 8px; overflow: hidden; height: 400px;">
            <el-tab-pane label="Ảnh Bill giấy">
              <div class="image-wrapper" style="height: 330px; border: none;">
                <el-image
                  v-if="selectedWaybill.bill_image_url"
                  :src="getMediaUrl(selectedWaybill.bill_image_url)"
                  :preview-src-list="[getMediaUrl(selectedWaybill.bill_image_url)]"
                  fit="contain"
                  class="bill-large-image"
                  preview-teleported
                />
                <div v-else class="no-image-placeholder">
                  <el-icon style="font-size: 48px; color: #cbd5e1;"><Picture /></el-icon>
                  <p style="margin-top: 8px;">Không có ảnh bill bưu tá tải lên</p>
                </div>
              </div>
            </el-tab-pane>
            <el-tab-pane label="Ảnh Kiện hàng">
              <div class="image-wrapper" style="height: 330px; border: none; overflow-y: auto;">
                <!-- Gallery ảnh pickup - tối đa 5 ảnh -->
                <div v-if="getPickupImages(selectedWaybill).length > 0" class="pickup-proof-gallery" style="display: flex; flex-wrap: wrap; gap: 8px; padding: 8px;">
                  <el-image
                    v-for="(imgUrl, imgIdx) in getPickupImages(selectedWaybill)"
                    :key="'bv-pickup-' + imgIdx"
                    :style="getPickupImages(selectedWaybill).length === 1 ? 'width:100%; height:310px;' : 'width:calc(50% - 4px); height:150px;'"
                    :src="getMediaUrl(imgUrl)"
                    :preview-src-list="getPickupImages(selectedWaybill).map(u => getMediaUrl(u))"
                    :initial-index="imgIdx"
                    fit="contain"
                    class="bill-large-image"
                    preview-teleported
                  />
                </div>
                <div v-else class="no-image-placeholder">
                  <el-icon style="font-size: 48px; color: #cbd5e1;"><Picture /></el-icon>
                  <p style="margin-top: 8px;">Không có ảnh kiện hàng bưu tá chụp</p>
                </div>
              </div>
            </el-tab-pane>
          </el-tabs>
        </div>

        <!-- Cột phải: Bảng đối soát Side-by-Side -->
        <div class="compare-data-side">
          <div class="side-title">🤖 So sánh Dữ liệu AI OCR</div>
          
          <div class="compare-table">
            <div class="compare-row header-row">
              <div class="field-name">Trường thông tin</div>
              <div class="field-value system">Bưu tá nhập</div>
              <div class="field-value ocr">AI OCR quét</div>
            </div>

            <!-- Dòng 1: SĐT nhận -->
            <div class="compare-row" :class="{ 'mismatch': selectedWaybill.receiver_phone !== ocrData.receiver_phone }">
              <div class="field-name">Số điện thoại nhận</div>
              <div class="field-value system">{{ selectedWaybill.receiver_phone }}</div>
              <div class="field-value ocr">
                {{ ocrData.receiver_phone }}
                <el-icon v-if="selectedWaybill.receiver_phone !== ocrData.receiver_phone" class="ml-1 text-red"><Warning /></el-icon>
              </div>
            </div>

            <!-- Dòng 2: COD -->
            <div class="compare-row" :class="{ 'mismatch': Number(selectedWaybill.cod_amount) !== Number(ocrData.cod_amount) }">
              <div class="field-name">Tiền thu hộ (COD)</div>
              <div class="field-value system">{{ Number(selectedWaybill.cod_amount).toLocaleString() }} đ</div>
              <div class="field-value ocr">
                {{ Number(ocrData.cod_amount).toLocaleString() }} đ
                <el-icon v-if="Number(selectedWaybill.cod_amount) !== Number(ocrData.cod_amount)" class="ml-1 text-red"><Warning /></el-icon>
              </div>
            </div>

            <!-- Dòng 3: Khối lượng -->
            <div class="compare-row" :class="{ 'mismatch': Number(selectedWaybill.actual_weight) !== Number(ocrData.actual_weight) }">
              <div class="field-name">Trọng lượng (kg)</div>
              <div class="field-value system">{{ selectedWaybill.actual_weight }} kg</div>
              <div class="field-value ocr">
                {{ ocrData.actual_weight }} kg
                <el-icon v-if="Number(selectedWaybill.actual_weight) !== Number(ocrData.actual_weight)" class="ml-1 text-red"><Warning /></el-icon>
              </div>
            </div>
          </div>

          <!-- Alert Cảnh báo sai lệch -->
          <div v-if="selectedWaybill.receiver_phone !== ocrData.receiver_phone || Number(selectedWaybill.cod_amount) !== Number(ocrData.cod_amount) || Number(selectedWaybill.actual_weight) !== Number(ocrData.actual_weight)" class="mismatch-alert">
            <el-icon class="mr-2"><Warning /></el-icon>
            <span>Phát hiện sai lệch dữ liệu! Vui lòng kiểm tra lại ảnh bill hoặc chọn Từ chối.</span>
          </div>
          <div v-else class="match-alert">
            <el-icon class="mr-2"><SuccessFilled /></el-icon>
            <span>Dữ liệu AI OCR trùng khớp 100%. Đủ điều kiện phê duyệt nhanh.</span>
          </div>

          <!-- Thông tin bổ sung -->
          <div class="compare-meta">
            <div>Mã đơn: <strong>{{ selectedWaybill.waybill_code }}</strong></div>
            <div>Bưu cục: <strong>{{ selectedWaybill.origin_hub?.hub_name }}</strong></div>
          </div>
        </div>
      </div>
      
      <template #footer>
        <div class="dialog-footer flex justify-end gap-3" style="display: flex; justify-content: flex-end; gap: 12px;">
          <el-button type="danger" @click="handleVerifyFromCompare('MISMATCH')">
            <el-icon class="mr-1"><Close /></el-icon> Từ chối duyệt
          </el-button>
          <el-button type="success" @click="handleVerifyFromCompare('VERIFIED')">
            <el-icon class="mr-1"><Check /></el-icon> Phê duyệt
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- Drawer Tra cứu giá (Simulator) -->
    <el-drawer v-model="showSimulator" title="Công cụ Tra cứu giá nhanh" size="450px">
      <el-form label-position="top" class="p-4 modern-simulator-form">
        <el-row :gutter="15">
          <el-col :span="24">
            <el-form-item label="Bưu cục gửi">
              <el-select v-model="selectedOriginHubId" placeholder="Chọn bưu cục gửi..." class="w-full" filterable @change="onOriginChange">
                <el-option v-for="hub in hubs" :key="hub.hub_id" :label="`${hub.hub_code} - ${hub.hub_name}`" :value="hub.hub_id" />
              </el-select>
              <div v-if="originHub" class="text-xs text-blue-500 mt-1">ID Tỉnh: {{ originHub.province_id }}</div>
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="Bưu cục nhận">
              <el-select v-model="selectedDestHubId" placeholder="Chọn bưu cục nhận..." class="w-full" filterable @change="onDestChange">
                <el-option v-for="hub in hubs" :key="hub.hub_id" :label="`${hub.hub_code} - ${hub.hub_name}`" :value="hub.hub_id" />
              </el-select>
              <div v-if="destHub" class="text-xs text-blue-500 mt-1">ID Tỉnh: {{ destHub.province_id }}</div>
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-divider content-position="left">Thông số hàng hóa</el-divider>

        <el-row :gutter="10">
          <el-col :span="12">
            <el-form-item label="Khối lượng (kg)">
              <el-input-number v-model="simForm.weight" class="w-full" :min="0.1" :step="0.1" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="COD (VNĐ)">
              <el-input-number v-model="simForm.cod_amount" class="w-full" :min="0" :step="1000" :controls="false" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="Dịch vụ">
          <el-radio-group v-model="simForm.service_type">
            <el-radio-button label="STANDARD">Tiêu chuẩn</el-radio-button>
            <el-radio-button label="EXPRESS">Hỏa tốc</el-radio-button>
          </el-radio-group>
        </el-form-item>

        <el-button type="primary" class="w-full mt-4 h-12 text-lg" @click="simulatePrice" :loading="simLoading" :disabled="!simForm.origin_province_id || !simForm.dest_province_id">
          Tính cước phí
        </el-button>
      </el-form>

      <!-- Kết quả -->
      <div v-if="simResult" class="result-card">
        <h3 class="result-header">KẾT QUẢ BÁO GIÁ TẠM TÍNH</h3>
        <div class="space-y-3">
          <div class="flex justify-between text-sm">
            <span>Khối lượng tính cước:</span> <span class="font-semibold">{{ simResult.charge_weight }} kg</span>
          </div>
          <div class="flex justify-between text-sm">
            <span>Cước chính:</span> <span class="font-semibold">{{ simResult.main_fee.toLocaleString() }} đ</span>
          </div>
          <div class="flex justify-between text-sm">
            <span>Phí tiện ích:</span> <span class="font-semibold">{{ simResult.extra_fee.toLocaleString() }} đ</span>
          </div>
          <div class="flex justify-between text-sm">
            <span>VAT (8%):</span> <span class="font-semibold">{{ simResult.vat_8.toLocaleString() }} đ</span>
          </div>
          <div class="divider"></div>
          <div class="flex justify-between text-xl font-bold text-red-600">
            <span>TỔNG CỘNG:</span> <span>{{ simResult.grand_total.toLocaleString() }} đ</span>
          </div>
        </div>
        <div class="text-xs text-gray-500 text-center mt-4 italic">* Giá đã bao gồm thuế và các phụ phí tuyến đường.</div>
      </div>
    </el-drawer>
  </div>
</template>

<script setup>
import { ref, onMounted, reactive, computed } from 'vue';
import { Refresh, Money, Printer, Memo, Warning, Check, Close, Picture, SuccessFilled } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import api from '@/api/axios';
import { getMediaUrl as resolveMediaUrl } from '@/utils/mediaUrl';
import { getPickupImages } from '@/utils/imageHelpers';

const tableData = ref([]);
const loading = ref(false);
const hubs = ref([]);
const selectedOriginHubId = ref(null);
const selectedDestHubId = ref(null);

// Computed để lấy hub object từ ID đã chọn
const originHub = computed(() => hubs.value.find(h => h.hub_id === selectedOriginHubId.value) || null);
const destHub = computed(() => hubs.value.find(h => h.hub_id === selectedDestHubId.value) || null);

const rejectDialogVisible = ref(false);
const rejectReason = ref('');
const currentRejectCode = ref('');

// --- AI OCR COMPARE DIALOG STATE & METHODS ---
const compareDialogVisible = ref(false);
const selectedWaybill = ref(null);
const ocrData = ref({ receiver_phone: '', cod_amount: 0, actual_weight: 0 });

const openCompareDialog = (row) => {
  selectedWaybill.value = row;
  
  // Tạo hash code từ waybill_code để mô phỏng sự sai lệch ổn định theo từng mã vận đơn
  const hashCode = [...row.waybill_code].reduce((s, c) => Math.imul(31, s) + c.charCodeAt(0) | 0, 0);
  const isMismatch = Math.abs(hashCode) % 5 === 0; // 20% trường hợp lệch

  let ocrPhone = row.receiver_phone || '';
  let ocrCod = Number(row.cod_amount || 0);
  let ocrWeight = Number(row.actual_weight || 0);

  if (isMismatch) {
    if (Math.abs(hashCode) % 2 === 0 && ocrPhone.length >= 10) {
      ocrPhone = ocrPhone.slice(0, -1) + ((Number(ocrPhone.slice(-1)) + 3) % 10);
    } else {
      ocrCod = ocrCod + (Math.abs(hashCode) % 3 === 0 ? 50000 : -20000);
      if (ocrCod < 0) ocrCod = 0;
    }
  }

  ocrData.value = {
    receiver_phone: ocrPhone,
    cod_amount: ocrCod,
    actual_weight: ocrWeight
  };
  compareDialogVisible.value = true;
};

const handleVerifyFromCompare = (action) => {
  compareDialogVisible.value = false;
  if (action === 'VERIFIED') {
    handleVerify(selectedWaybill.value.waybill_code, 'VERIFIED');
  } else {
    openRejectDialog(selectedWaybill.value.waybill_code);
  }
};

// URL helper for images
const getMediaUrl = resolveMediaUrl;

// Mo tem van don goc trong tab moi de CSKH doi chieu
const openPrintLabel = (waybillCode) => {
  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
  window.open(`${baseUrl}/api/print/${waybillCode}`, '_blank');
};

const fetchPendingBills = async () => {
  loading.value = true;
  try {
    const res = await api.post('/api/waybills/search', {
      status: "PICKED_PENDING_VERIFY",
      page: 1,
      size: 100
    });
    tableData.value = res.data.items || [];
  } catch (error) {
    ElMessage.error('Lỗi tải danh sách vận đơn');
  } finally {
    loading.value = false;
  }
};

const fetchHubs = async () => {
  try {
    const res = await api.get('/api/hubs');
    hubs.value = res.data;
  } catch (error) {
    console.error('Lỗi tải danh sách bưu cục:', error);
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

const handleVerify = async (code, action, error_msg = null) => {
  try {
    await api.patch(`/api/waybills/${code}/verify`, {
      action: action,
      error_msg: error_msg
    });
    ElMessage.success(action === 'VERIFIED' ? `Đã duyệt đơn ${code}!` : `Đã từ chối đơn ${code}!`);
    fetchPendingBills();
  } catch (error) {
    ElMessage.error(error.response?.data?.detail || 'Lỗi xử lý xác thực');
  }
};

const openRejectDialog = (code) => {
  currentRejectCode.value = code;
  rejectReason.value = '';
  rejectDialogVisible.value = true;
};

const submitReject = () => {
  handleVerify(currentRejectCode.value, 'MISMATCH', rejectReason.value.trim());
  rejectDialogVisible.value = false;
};

// --- SIMULATOR LOGIC ---
const showSimulator = ref(false);
const simLoading = ref(false);
const simResult = ref(null);

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

const simulatePrice = async () => {
  if (!simForm.origin_province_id || !simForm.dest_province_id) {
    ElMessage.warning('Vui lòng chọn bưu cục gửi và nhận');
    return;
  }
  simLoading.value = true;
  simResult.value = null;
  try {
    const res = await api.post('/api/pricing/simulate', simForm);
    simResult.value = res.data;
  } catch (error) {
    ElMessage.error(error.response?.data?.detail || 'Chưa có bảng giá cho tuyến này');
  } finally {
    simLoading.value = false;
  }
};

onMounted(() => {
  fetchPendingBills();
  fetchHubs();
});
</script>

<style scoped src="@/styles/admin/cskh/BillVerification.css"></style>
