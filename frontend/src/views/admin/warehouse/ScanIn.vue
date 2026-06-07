<template>
  <div class="modern-scan-in">
    <div class="page-container">

      <!-- Header Section -->
      <header class="page-header animate-fade-in">
        <div class="header-content">
          <div class="title-wrapper">
            <div class="icon-box primary">
              <el-icon><Grid /></el-icon>
            </div>
            <div>
              <h2 class="page-title">Quét Nhập kho & Cân hàng</h2>
              <p class="page-subtitle">Xác nhận đơn hàng vào bưu cục và cập nhật khối lượng thực tế</p>
            </div>
          </div>
        </div>
      </header>

      <el-tabs v-model="activeTab" class="modern-tabs animate-fade-in-up">
        
        <!-- TAB 1: SCAN IN -->
        <el-tab-pane name="scan">
          <template #label>
            <div class="tab-label"><el-icon><FullScreen /></el-icon> <span>Quét Nhập Kho</span></div>
          </template>
          
          <!-- Scanner Input Section -->
          <div class="content-card scanner-card mb-24">
            <div class="scanner-wrapper">
              <el-input
                v-model="barcode"
                placeholder="Quét mã Vận đơn hoặc gõ tay và nhấn Enter..."
                class="modern-scanner-input"
                ref="barcodeRef"
                @keyup.enter="handleScan(barcode)"
                :disabled="loading"
              >
                <template #prefix><el-icon class="scanner-icon"><Grid /></el-icon></template>
                <template #append>
                  <button class="btn-scan" @click="handleScan(barcode)" :disabled="loading">
                    <el-icon class="is-loading mr-2" v-if="loading"><Loading /></el-icon>
                    <span>{{ loading ? 'ĐANG QUÉT' : 'QUÉT (ENTER)' }}</span>
                  </button>
                </template>
              </el-input>
            </div>
          </div>

          <!-- Split Layout: Pending vs Success -->
          <el-row :gutter="24" class="split-layout">
            
            <!-- LEFT COLUMN: Pending Items -->
            <el-col :span="10">
              <div class="content-card list-card border-top-warning">
                <div class="card-header-inner flex-between mb-4">
                  <div class="flex-center gap-2 text-warning fw-bold">
                    <el-icon><Timer /></el-icon> <span>Chờ nhập kho</span>
                  </div>
                  <button class="icon-btn secondary" @click="fetchPendingBills" title="Làm mới">
                    <el-icon><Refresh /></el-icon>
                  </button>
                </div>

                <el-table 
                  :data="pendingItems" 
                  v-loading="pendingLoading" 
                  class="modern-table compact-table"
                  height="400px"
                >
                  <el-table-column prop="waybill_code" label="Mã VĐ" width="120">
                    <template #default="{ row }">
                      <div style="display: flex; flex-direction: column; gap: 4px;">
                        <span class="code-badge warning">{{ row.waybill_code }}</span>
                        <span v-if="row.verify_status === 'VERIFIED'" class="verify-badge verified"><el-icon><CircleCheckFilled /></el-icon> Verified</span>
                        <span v-else-if="row.verify_status === 'MISMATCH'" class="verify-badge mismatch"><el-icon><WarningFilled /></el-icon> Mismatch</span>
                        <span v-else class="verify-badge pending"><el-icon><Clock /></el-icon> Pending</span>
                      </div>
                    </template>
                  </el-table-column>
                  <el-table-column prop="receiver_name" label="Người nhận" min-width="120" show-overflow-tooltip>
                    <template #default="{ row }">
                      <span class="text-dark fw-bold">{{ row.receiver_name }}</span>
                    </template>
                  </el-table-column>
                  <el-table-column label="Thao tác" width="90" align="center">
                    <template #default="{ row }">
                      <button class="btn-action-small" @click="handleScan(row.waybill_code)">
                        Nhập
                      </button>
                    </template>
                  </el-table-column>
                  <template #empty>
                    <el-empty description="Không có đơn chờ nhập" :image-size="60" />
                  </template>
                </el-table>
              </div>
            </el-col>

            <!-- RIGHT COLUMN: Successfully Scanned Items -->
            <el-col :span="14">
              <div class="content-card list-card border-top-success">
                <div class="card-header-inner flex-between mb-4">
                  <div class="flex-center gap-2 text-success fw-bold">
                    <el-icon><CircleCheckFilled /></el-icon> <span>Vừa nhập thành công</span>
                  </div>
                  <el-tag type="success" effect="light" round class="fw-bold px-3">{{ scannedItems.length }} đơn</el-tag>
                </div>

                <el-table 
                  :data="scannedItems" 
                  class="modern-table compact-table highlight-table"
                  height="400px"
                >
                  <el-table-column prop="barcode" label="Mã Vận đơn" width="130">
                    <template #default="{ row }">
                      <span class="code-badge success">{{ row.barcode }}</span>
                    </template>
                  </el-table-column>
                  
                  <el-table-column label="KL Shop" width="80" align="center">
                    <template #default="{ row }">
                      <span class="text-muted text-xs">{{ row.declared_weight || '0' }}kg</span>
                    </template>
                  </el-table-column>
                  
                  <el-table-column label="Cân lại (Thực tế)" width="150" align="center">
                    <template #default="{ row, $index }">
                      <el-input-number 
                        v-model="row.actual_weight" 
                        :precision="2" 
                        :step="0.1" 
                        :min="0.1"
                        :ref="(el) => weightInputsRef[$index] = el"
                        @change="updateWeight(row)"
                        @keyup.enter="handleWeightEnter"
                        class="w-full modern-input-small weight-input"
                        :controls="false"
                      />
                    </template>
                  </el-table-column>

                  <el-table-column prop="receiver_name" label="Người nhận" min-width="120" show-overflow-tooltip>
                    <template #default="{ row }">
                      <span class="text-dark fw-bold">{{ row.receiver_name }}</span>
                    </template>
                  </el-table-column>
                  
                  <el-table-column label="Bỏ" width="60" align="center">
                    <template #default="{ $index }">
                      <button class="icon-btn delete small" @click="removeItem($index)">
                        <el-icon><Close /></el-icon>
                      </button>
                    </template>
                  </el-table-column>
                  <template #empty>
                    <el-empty description="Chưa quét đơn nào" :image-size="60" />
                  </template>
                </el-table>
              </div>
            </el-col>
          </el-row>
        </el-tab-pane>

        <!-- TAB 2: HISTORY -->
        <el-tab-pane name="history">
          <template #label>
            <div class="tab-label"><el-icon><List /></el-icon> <span>Nhật ký thao tác</span></div>
          </template>
          
          <div class="content-card filter-card mb-24">
            <el-row :gutter="20" class="filter-row" align="middle">
              <el-col :xs="24" :sm="12" :lg="8" class="filter-col">
                <div class="filter-label">Chọn ngày quét</div>
                <el-date-picker 
                  v-model="historyDate" 
                  type="date" 
                  format="DD/MM/YYYY" 
                  value-format="YYYY-MM-DD" 
                  :disabled-date="(d) => d > new Date()" 
                  @change="loadHistory" 
                  class="w-full modern-date-picker"
                />
              </el-col>
              <el-col :xs="24" :sm="12" :lg="16" class="filter-action-col flex-end">
                <el-tag type="primary" effect="light" round class="fw-bold px-4 mr-3" size="large">
                  Tổng đơn đã quét: {{ historyTotal }}
                </el-tag>
                <button class="btn-primary" @click="loadHistory" :disabled="historyLoading">
                  <el-icon class="is-loading mr-2" v-if="historyLoading"><Loading /></el-icon>
                  <el-icon v-else><Search /></el-icon>
                  <span>Tải dữ liệu</span>
                </button>
              </el-col>
            </el-row>
          </div>

          <div class="content-card table-wrapper">
            <el-table 
              :data="historyItems" 
              v-loading="historyLoading" 
              class="modern-table"
              style="width:100%"
            >
              <el-table-column type="index" width="60" label="STT" align="center" />
              <el-table-column prop="waybill_code" label="Mã Vận đơn" width="160">
                <template #default="{ row }">
                  <span class="code-badge primary">{{ row.waybill_code }}</span>
                </template>
              </el-table-column>
              
              <el-table-column prop="receiver_name" label="Người nhận" min-width="160">
                <template #default="{ row }">
                  <span class="fw-bold text-dark">{{ row.receiver_name }}</span>
                </template>
              </el-table-column>
              
              <el-table-column label="So sánh Khối lượng" width="200" align="center">
                <template #default="{ row }">
                  <div class="weight-compare">
                    <span class="text-muted">{{ row.declared_weight || '---' }} kg</span>
                    <el-icon class="arrow-right"><Right /></el-icon>
                    <span class="text-success fw-bold">{{ row.actual_weight || '---' }} kg</span>
                  </div>
                </template>
              </el-table-column>
              
              <el-table-column label="Thời gian" width="180">
                <template #default="{ row }">
                  <span class="time-badge">
                    <el-icon class="mr-1"><Clock /></el-icon>
                    {{ formatTime(row.scan_time || row.system_time) }}
                  </span>
                </template>
              </el-table-column>
              
              <el-table-column prop="user_name" label="Người thao tác" min-width="180">
                <template #default="{ row }">
                  <div class="user-info">
                    <el-icon><User /></el-icon>
                    <span>{{ row.user_name || 'Hệ thống' }}</span>
                  </div>
                </template>
              </el-table-column>
              
              <el-table-column label="Thao tác" width="140" align="center">
                <template #default>
                  <div class="modern-tag tag-info">
                    <span class="dot"></span> IN_HUB
                  </div>
                </template>
              </el-table-column>
              <template #empty>
                <el-empty description="Không có dữ liệu nhật ký" :image-size="80" />
              </template>
            </el-table>
            
            <div class="pagination-wrapper mt-24 flex-end">
              <el-pagination 
                v-model:current-page="historyPage" 
                :page-size="historySize" 
                layout="total, prev, pager, next" 
                :total="historyTotal" 
                @current-change="loadHistory" 
                background
                class="modern-pagination"
              />
            </div>
          </div>
        </el-tab-pane>

      </el-tabs>

      <!-- Audio Elements -->
      <audio ref="beepOk" src="https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3"></audio>
      <audio ref="beepError" src="https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3"></audio>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick, computed } from 'vue';
import { 
  Grid, Delete, Search, Refresh, Timer, User, List, Right, 
  CircleCheckFilled, Close, Clock, FullScreen, Loading, WarningFilled 
} from '@element-plus/icons-vue';
import moment from 'moment';
import api from '@/api/axios';
import { ElMessage, ElNotification, ElMessageBox } from 'element-plus';
import { useAuthStore } from '@/stores/auth'; 

const auth = useAuthStore(); 

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

const currentHubId = computed(() => auth.user?.primary_hub_id);

const fetchPendingBills = async () => {
  pendingLoading.value = true;
  try {
    const payload = {
      status: 'CREATED', 
      page: 1,
      size: 100 
    };

    if (auth.user?.role_id === 1) {
       // Logic for Admin (omitted)
    } else {
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
  
  console.log(`[SCAN IN] Bắt đầu quét mã: ${code}`);
  console.log(`[SCAN IN] currentHubId từ Store: ${currentHubId.value}`);
  
  const payload = { 
      waybill_code: code,
      hub_id: currentHubId.value || null, 
      note: "Quét từ Web"
  };
  
  const config = {
      headers: { 'Idempotency-Key': new Date().getTime().toString() }
  };

  console.log(`[SCAN IN] Payload chuẩn bị gửi:`, payload);
  console.log(`[SCAN IN] URL gọi: /api/scans/in-hub`);

  try {
    const res = await api.post('/api/scans/in-hub', payload, config);
    
    console.log(`[SCAN IN] Thành công! Dữ liệu trả về:`, res.data);

    // FIXED: Play correct success sound instead of error sound
    if (beepOk.value) {
        beepOk.value.play().catch(e => console.warn("Lỗi phát âm thanh (Bỏ qua)"));
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
    
    if (err.response?.status === 400 && (errorMsg.includes('xác thực') || errorMsg.includes('VERIFY'))) {
        ElMessageBox.alert(
          `<div style="text-align: center;">
             <span style="font-size: 48px; color: #EE5D50; margin-bottom: 12px; display: inline-block;">⚠️</span><br>
             <b style="font-size: 18px; color: #EE5D50;">Lỗi: Đơn hàng chưa được xác thực (VERIFY). Không thể nhập kho/xuất kho!</b><br>
             <span style="font-size: 14px; color: #4B5563; margin-top: 8px; display: inline-block;">${errorMsg}</span>
           </div>`, 
          'LỖI XÁC THỰC', 
          { dangerouslyUseHTMLString: true, type: 'error', customClass: 'modern-message-box' }
        );
    } else {
        ElMessage.error(`Lỗi: ${code} - ${errorMsg}`);
    }
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
      title: 'Thành công',
      message: `Đã lưu cân nặng thực tế ${row.actual_weight}kg cho đơn ${row.barcode}`,
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

<style scoped src="@/styles/admin/warehouse/ScanIn.css"></style>