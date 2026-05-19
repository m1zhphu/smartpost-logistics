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
        <el-table-column prop="waybill_code" label="Mã Vận Đơn" width="150" font-weight="bold" />
        <el-table-column prop="origin_hub.hub_name" label="Bưu cục tạo" />
        <el-table-column label="Thông tin gửi/nhận">
          <template #default="scope">
            <div class="text-xs">
              <div><strong>Gửi:</strong> {{ scope.row.origin_hub?.hub_name }}</div>
              <div><strong>Nhận:</strong> {{ scope.row.receiver_name }} ({{ scope.row.receiver_phone }})</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="Tem Bill (Gốc)" width="130" align="center">
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
        <el-table-column label="Ảnh Tem Bill" width="120" align="center">
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
        <el-table-column label="Hành động" width="200" align="center">
          <template #default="scope">
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

    <!-- Drawer Tra cứu giá (Simulator) -->
    <el-drawer v-model="showSimulator" title="Công cụ Tra cứu giá nhanh" size="450px">
      <el-form label-position="top" class="p-4 modern-simulator-form">
        <el-row :gutter="15">
          <el-col :span="24">
            <el-form-item label="Bưu cục gửi (Origin Hub)">
              <el-select v-model="selectedOriginHubId" placeholder="Chọn bưu cục gửi..." class="w-full" filterable @change="onOriginChange">
                <el-option v-for="hub in hubs" :key="hub.hub_id" :label="`${hub.hub_code} - ${hub.hub_name}`" :value="hub.hub_id" />
              </el-select>
              <div v-if="originHub" class="text-xs text-blue-500 mt-1">ID Tỉnh: {{ originHub.province_id }}</div>
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="Bưu cục nhận (Destination Hub)">
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
import { Refresh, Money, Printer } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import api from '@/api/axios';

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

// URL helper for images
const getMediaUrl = (path) => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
  return `${baseUrl}${path}`;
};

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

<style scoped>
.text-primary { color: #4318FF; }
.w-full { width: 100%; }
.result-card {
  margin: 16px;
  padding: 20px;
  background: #f8fafc;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
}
.result-header {
  font-weight: 700;
  text-align: center;
  margin-bottom: 16px;
  color: #1e293b;
  border-bottom: 2px solid #e2e8f0;
  padding-bottom: 10px;
}
.divider {
  border-top: 1px dashed #cbd5e1;
  margin: 12px 0;
}
</style>
