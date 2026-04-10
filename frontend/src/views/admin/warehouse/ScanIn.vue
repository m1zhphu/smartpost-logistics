<template>
  <div class="scan-in-page">
    <el-tabs v-model="activeTab" class="scan-tabs">
      
      <el-tab-pane label="📷 Quét Nhập Kho" name="scan">
        
        <el-card class="scan-card mb-4 text-center">
          <div class="scanner-section">
            <h2 class="misa-title mb-4">Quét Nhập kho & Cân hàng thực tế</h2>
            <el-input
              v-model="barcode"
              placeholder="Quét mã Vận đơn bằng máy quét, hoặc gõ tay và nhấn Enter..."
              class="barcode-input"
              ref="barcodeRef"
              @keyup.enter="handleScan(barcode)"
              :disabled="loading"
              size="large"
              prefix-icon="Grid"
            >
              <template #append>
                <el-button @click="handleScan(barcode)" type="primary" :loading="loading">QUÉT (ENTER)</el-button>
              </template>
            </el-input>
          </div>
        </el-card>

        <el-row :gutter="20">
          
          <el-col :span="10">
            <el-card class="list-card pending-card">
              <template #header>
                <div class="flex-between">
                  <span class="font-bold text-warning"><el-icon><Timer /></el-icon> Đơn bưu cục nhà chờ nhập kho</span>
                  <el-button size="small" circle :icon="Refresh" @click="fetchPendingBills" />
                </div>
              </template>
              <el-table :data="pendingItems" v-loading="pendingLoading" stripe height="450px">
                <el-table-column prop="waybill_code" label="Mã Vận đơn" width="140">
                  <template #default="{ row }">
                    <span class="font-mono text-xs">{{ row.waybill_code }}</span>
                  </template>
                </el-table-column>
                <el-table-column prop="receiver_name" label="Người nhận" min-width="120" show-overflow-tooltip />
                <el-table-column label="Thao tác" width="100" align="center" fixed="right">
                  <template #default="{ row }">
                    <el-button type="primary" size="small" @click="handleScan(row.waybill_code)" plain>
                      Nhập vào
                    </el-button>
                  </template>
                </el-table-column>
              </el-table>
            </el-card>
          </el-col>

          <el-col :span="14">
            <el-card class="list-card success-card">
              <template #header>
                <div class="flex-between">
                  <span class="font-bold text-success"><el-icon><CircleCheck /></el-icon> Đơn vừa nhập thành công</span>
                  <el-tag type="success">{{ scannedItems.length }} đơn</el-tag>
                </div>
              </template>
              <el-table :data="scannedItems" stripe height="450px" border>
                <el-table-column prop="barcode" label="Mã Vận đơn" width="140">
                  <template #default="{ row }">
                    <span class="text-primary font-bold font-mono text-xs">{{ row.barcode }}</span>
                  </template>
                </el-table-column>
                
                <el-table-column label="Khối lượng (Shop)" width="90" align="center">
                  <template #default="{ row }">
                    <span class="text-muted text-xs">{{ row.declared_weight || '0' }}kg</span>
                  </template>
                </el-table-column>
                
                <el-table-column label="Cân lại (Thực tế) 🖊️" width="160">
                  <template #default="{ row, $index }">
                    <el-input-number 
                      v-model="row.actual_weight" 
                      :precision="2" 
                      :step="0.1" 
                      :min="0.1"
                      :ref="(el) => weightInputsRef[$index] = el"
                      @change="updateWeight(row)"
                      @keyup.enter="handleWeightEnter"
                      size="small"
                      class="w-full"
                    />
                  </template>
                </el-table-column>

                <el-table-column prop="receiver_name" label="Người nhận" min-width="120" show-overflow-tooltip />
                
                <el-table-column label="Bỏ" width="60" align="center">
                  <template #default="{ $index }">
                    <el-button type="danger" text @click="removeItem($index)"><el-icon><Delete /></el-icon></el-button>
                  </template>
                </el-table-column>
              </el-table>
            </el-card>
          </el-col>
        </el-row>
      </el-tab-pane>

      <el-tab-pane name="history">
        <template #label><span>📋 Nhật ký thao tác Nhập Kho</span></template>
        <el-card class="mb-4">
          <el-row :gutter="20" align="middle">
            <el-col :span="8">
              <span class="mr-2">Chọn ngày:</span>
              <el-date-picker v-model="historyDate" type="date" format="DD/MM/YYYY" value-format="YYYY-MM-DD" :disabled-date="(d) => d > new Date()" @change="loadHistory" />
            </el-col>
            <el-col :span="16" class="flex-end">
              <el-button type="primary" :icon="Search" @click="loadHistory" :loading="historyLoading">Tải dữ liệu</el-button>
              <el-tag type="info" class="ml-4" size="large">Tổng đơn đã quét: <strong>{{ historyTotal }}</strong></el-tag>
            </el-col>
          </el-row>
        </el-card>

        <el-card v-loading="historyLoading">
          <el-table :data="historyItems" stripe border style="width:100%">
            <el-table-column type="index" width="55" label="STT" />
            <el-table-column prop="waybill_code" label="Mã Vận đơn" width="180">
              <template #default="{ row }"><span class="text-primary font-bold">{{ row.waybill_code }}</span></template>
            </el-table-column>
            <el-table-column prop="receiver_name" label="Người nhận" min-width="160" />
            <el-table-column label="KL Shop nhập" width="130">
                <template #default="{ row }"><span class="text-muted">{{ row.declared_weight || '---' }} kg</span></template>
            </el-table-column>
            <el-table-column label="KL Thực tế (kg)" width="130">
                <template #default="{ row }"><b class="text-success">{{ row.actual_weight || '---' }} kg</b></template>
            </el-table-column>
            
            <el-table-column label="Giờ thao tác" width="160">
              <template #default="{ row }"><span>{{ formatTime(row.scan_time || row.system_time) }}</span></template>
            </el-table-column>
            
            <el-table-column prop="user_name" label="Người nhập kho" min-width="160">
              <template #default="{ row }">
                <span class="font-bold" style="color: #4b5563;">
                  <el-icon class="mr-1"><User /></el-icon> {{ row.user_name || 'Hệ thống' }}
                </span>
              </template>
            </el-table-column>
            
            <el-table-column label="Thao tác" width="120">
              <template #default><el-tag type="info" effect="plain">Lưu vết IN_HUB</el-tag></template>
            </el-table-column>
          </el-table>
          <div class="flex-end mt-4">
            <el-pagination v-model:current-page="historyPage" :page-size="historySize" layout="total, prev, pager, next" :total="historyTotal" @current-change="loadHistory" />
          </div>
        </el-card>
      </el-tab-pane>

    </el-tabs>

    <audio ref="beepOk" src="https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3"></audio>
    <audio ref="beepError" src="https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3"></audio>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick, computed } from 'vue';
import { Grid, Delete, Search, Refresh, Timer, CircleCheck, User } from '@element-plus/icons-vue';
import moment from 'moment';
import api from '@/api/axios';
import { ElMessage, ElNotification } from 'element-plus';
import { useAuthStore } from '@/stores/auth'; // ĐÃ THÊM: Import Store

const auth = useAuthStore(); // Sử dụng authStore để quản lý quyền

const activeTab = ref('scan');

const barcode = ref('');
const barcodeRef = ref(null);
const loading = ref(false);
const scannedItems = ref([]);
const beepOk = ref(null);
const beepError = ref(null);
const weightInputsRef = ref([]);

const pendingItems = ref([]);
const pendingLoading = ref(false);

// ĐÃ SỬA: Lấy currentHubId trực tiếp từ Store một cách an toàn
const currentHubId = computed(() => auth.user?.primary_hub_id);

const fetchPendingBills = async () => {
  pendingLoading.value = true;
  try {
    const payload = {
      status: 'CREATED', 
      page: 1,
      size: 100 
    };

    // NẾU LÀ ADMIN (Role 1): Không bắt buộc lọc theo Hub, trừ khi Admin chủ động chọn
    if (auth.user?.role_id === 1) {
       // Nếu Admin có chọn một Hub cụ thể trên giao diện (ví dụ qua một dropdown chọn bến)
       // thì payload.origin_hub_id = ... 
       // Còn mặc định, Admin sẽ thấy TẤT CẢ đơn CREATED trên toàn hệ thống.
    } else {
       // NẾU LÀ NHÂN VIÊN: Bắt buộc chỉ thấy đơn của bưu cục mình
       if (currentHubId.value) {
         payload.origin_hub_id = currentHubId.value;
       } else {
         pendingItems.value = [];
         return;
       }
    }

    const res = await api.post('/api/waybills/search', payload);
    pendingItems.value = res.data.items || [];
  } catch (err) {
    ElMessage.error('Không tải được danh sách chờ nhập kho');
  } finally {
    pendingLoading.value = false;
  }
};

const focusWeightInput = () => {
  nextTick(() => {
    if (weightInputsRef.value[0]) {
      weightInputsRef.value[0].focus();
    }
  });
};

const handleScan = async (codeToScan) => {
  const code = (codeToScan || barcode.value).trim();
  if (!code) return;

  loading.value = true;
  
  // --- IN LOG TRƯỚC KHI GỬI ---
  console.log(`[SCAN IN] Bắt đầu quét mã: ${code}`);
  console.log(`[SCAN IN] currentHubId từ Store: ${currentHubId.value}`);
  
  // 1. Chuẩn bị Payload
  // Thử gửi kèm cả hub_id xem Backend có bắt buộc không (tùy thuộc vào schema_wh.ScanRequest của bạn)
  const payload = { 
      waybill_code: code,
      // Gửi kèm hub_id hoặc ghi chú nếu Backend yêu cầu trong Schema
      hub_id: currentHubId.value || null, 
      note: "Quét từ Web"
  };
  
  // 2. Chuẩn bị Config
  const config = {
      headers: { 'Idempotency-Key': new Date().getTime().toString() }
  };

  console.log(`[SCAN IN] Payload chuẩn bị gửi:`, payload);
  console.log(`[SCAN IN] URL gọi: /api/scans/in-hub`);

  try {
    const res = await api.post('/api/scans/in-hub', payload, config);
    
    console.log(`[SCAN IN] Thành công! Dữ liệu trả về:`, res.data);

    if (beepError.value) {
        beepError.value.play().catch(e => console.warn("Lỗi phát âm thanh (Bỏ qua)"));
    }

    const newItem = {
      barcode: code,
      receiver_name: res.data.receiver_name || 'Khách hàng',
      time: moment().format('HH:mm:ss'),
      actual_weight: res.data.actual_weight || 0.5,
      declared_weight: res.data.declared_weight,
      error: false
    };

    const idx = scannedItems.value.findIndex(item => item.barcode === code);
    if (idx !== -1) scannedItems.value.splice(idx, 1);
    scannedItems.value.unshift(newItem);

    pendingItems.value = pendingItems.value.filter(item => item.waybill_code !== code);

    ElMessage.success(`Nhập kho thành công: ${code}`);
    loadHistory(); 
    focusWeightInput();

  } catch (err) {
    console.error(`[SCAN IN] ❌ Lỗi từ Backend:`, err);
    
    // --- IN LOG LỖI CHI TIẾT ---
    if (err.response) {
        console.error(`[SCAN IN] Status Code:`, err.response.status);
        console.error(`[SCAN IN] Data lỗi:`, err.response.data);
        console.error(`[SCAN IN] Headers:`, err.response.headers);
    } else if (err.request) {
        console.error(`[SCAN IN] Request đã gửi nhưng không nhận được phản hồi:`, err.request);
    } else {
        console.error(`[SCAN IN] Lỗi setup request:`, err.message);
    }

    try {
        if (beepError.value) beepError.value.play();
    } catch (e) {}

    const errorDetail = err.response?.data?.detail;
    const errorMsg = Array.isArray(errorDetail) ? errorDetail[0].msg : (errorDetail || 'Lỗi không xác định');
    
    ElMessage.error(`Lỗi: ${code} - ${errorMsg}`);
    nextTick(() => barcodeRef.value?.focus());
  } finally {
    barcode.value = '';
    loading.value = false;
  }
};

const updateWeight = async (row) => {
  try {
    await api.patch(`/api/waybills/${row.barcode}/weight`, {
      actual_weight: row.actual_weight
    });
    ElNotification({
      title: 'Hệ thống',
      message: `Đã lưu cân nặng ${row.actual_weight}kg cho đơn ${row.barcode}`,
      type: 'success',
      position: 'bottom-right'
    });
    loadHistory(); 
  } catch (err) {
    ElMessage.error('Lỗi khi cập nhật cân nặng');
  }
};

const handleWeightEnter = () => {
  nextTick(() => {
    if (barcodeRef.value) barcodeRef.value.focus();
  });
};

const removeItem = (idx) => scannedItems.value.splice(idx, 1);

const historyDate = ref(moment().format('YYYY-MM-DD'));
const historyItems = ref([]);
const historyTotal = ref(0);
const historyPage = ref(1);
const historySize = 20;
const historyLoading = ref(false);

const loadHistory = async () => {
  historyLoading.value = true;
  try {
    const res = await api.get('/api/scans/history', {
      params: {
        scan_date: historyDate.value,
        page: historyPage.value,
        size: historySize,
        hub_id: currentHubId.value
      }
    });
    historyItems.value = res.data.items || [];
    historyTotal.value = res.data.total || 0;
  } catch (err) {
    console.log('Chưa có lịch sử hoặc lỗi API lịch sử');
  } finally {
    historyLoading.value = false;
  }
};

const formatTime = (t) => t ? moment(t).format('DD/MM/YYYY HH:mm:ss') : '';

onMounted(() => {
  nextTick(() => barcodeRef.value?.focus());
  fetchPendingBills(); 
  loadHistory();
});
</script>

<style scoped>
.scan-card { border-top: 4px solid #409EFF; }
.barcode-input :deep(.el-input__inner) { 
    height: 60px; font-size: 1.8rem; text-align: center; font-weight: bold; color: #409EFF;
}
.flex-between { display: flex; justify-content: space-between; align-items: center; }
.flex-end { display: flex; justify-content: flex-end; gap: 10px; }
.w-full { width: 100%; }
.font-mono { font-family: monospace; }
.text-xs { font-size: 0.85rem; }
.text-warning { color: #e6a23c; }
.text-success { color: #67c23a; }
.pending-card { border-top: 3px solid #e6a23c; }
.success-card { border-top: 3px solid #67c23a; }
</style>