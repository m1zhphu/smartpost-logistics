<template>
  <div class="manifest-page">
    <div class="page-header flex-between mb-4">
      <div>
        <h2 class="misa-title m-0">Lập Manifest (Chuyến xe)</h2>
        <p class="text-muted m-0 mt-1">Gắn các túi hàng (Bag) lên xe trung chuyển hoặc dỡ xuống kho đích</p>
      </div>
    </div>

    <el-row :gutter="20">
      
      <el-col :span="6">
        <el-card class="manifest-config-card mb-4" shadow="hover">
          <template #header>
            <div class="card-header"><el-icon><Van /></el-icon> THÔNG TIN CHUYẾN XE</div>
          </template>
          
          <el-form label-position="top">
            <el-form-item label="Loại thao tác">
              <el-radio-group v-model="scanType" class="w-full custom-radio" :disabled="isLocked" @change="handleTypeChange">
                <el-radio-button value="LOAD">
                  <el-icon class="mr-1"><Top /></el-icon> Bốc lên xe
                </el-radio-button>
                <el-radio-button value="UNLOAD">
                  <el-icon class="mr-1"><Bottom /></el-icon> Dỡ xuống kho
                </el-radio-button>
              </el-radio-group>
            </el-form-item>

            <div class="divider-line my-3"></div>

            <el-form-item label="Mã chuyến xe / Manifest" required>
              <el-input 
                v-model="manifestCode" 
                :placeholder="scanType === 'LOAD' ? 'Để trống để tự tạo' : 'Chọn xe từ danh sách bên phải...'" 
                size="large" 
                :disabled="isLocked || scanType === 'UNLOAD'"
                class="uppercase-input font-bold text-primary"
              >
                <template #append v-if="scanType === 'LOAD'">
                   <el-button :icon="RefreshRight" @click="generateManifestCode" :disabled="isLocked" title="Tạo mã tự động" />
                </template>
              </el-input>
            </el-form-item>

            <transition name="el-zoom-in-top">
              <div v-if="scanType === 'LOAD'">
                <el-form-item label="Biển số xe tải" required>
                  <el-input v-model="vehicleNumber" placeholder="VD: 29C-123.45" :disabled="isLocked" size="large" />
                </el-form-item>

                <el-form-item label="Bưu cục đích đến (To Hub)" required>
                  <el-select v-model="toHubId" placeholder="Chọn bưu cục xe sẽ chạy tới" class="w-full" filterable size="large" :disabled="isLocked">
                    <el-option v-for="hub in hubs" :key="hub.hub_id" :label="`${hub.hub_code} - ${hub.hub_name}`" :value="hub.hub_id" />
                  </el-select>
                </el-form-item>
              </div>
            </transition>

            <div class="action-buttons mt-4">
              <el-button v-if="!isLocked" type="primary" class="w-full lock-btn font-bold" size="large" @click="lockManifest" :disabled="scanType === 'UNLOAD' && !manifestCode">
                BẮT ĐẦU {{ scanType === 'LOAD' ? 'BỐC LÊN XE' : 'KIỂM ĐẾM DỠ HÀNG' }}
              </el-button>
              
              <el-button v-else type="warning" plain class="w-full" @click="unlockForm">
                <el-icon class="mr-1"><Unlock /></el-icon> Mở khóa / Đổi chuyến
              </el-button>
            </div>
          </el-form>
        </el-card>

        <el-card shadow="never" class="summary-card">
          <div class="stat-row">
            <span class="text-muted">Tổng số túi đã quét:</span>
            <span class="stat-val" :class="{'text-primary': bags.length > 0}">
              {{ bags.length }} <span v-if="scanType === 'UNLOAD'" class="text-sm">/ {{ expectedBags.length }}</span>
            </span>
          </div>
        </el-card>
      </el-col>

      <el-col :span="9">
        <el-card v-if="scanType === 'LOAD'" class="list-card border-dashed" shadow="never">
           <template #header>
              <div class="card-header flex-between text-warning">
                 <span><el-icon><List /></el-icon> Các túi đang chờ xuất kho</span>
                 <el-button size="small" circle :icon="Refresh" @click="fetchPendingBags" :loading="loadingList"></el-button>
              </div>
           </template>
           
           <el-table :data="pendingBags" v-loading="loadingList" stripe empty-text="Kho không còn túi nào chờ xuất" height="520px" size="small">
              <el-table-column prop="bag_code" label="Mã Túi" width="110">
                 <template #default="{ row }"><span class="font-bold">{{ row.bag_code }}</span></template>
              </el-table-column>
              <el-table-column label="BC Đích của túi" min-width="120" show-overflow-tooltip>
                 <template #default="{ row }">
                   <span :class="{'text-danger font-bold': isLocked && row.dest_hub_name !== selectedHubName && row.dest_hub_name !== 'Không rõ'}">
                     {{ row.dest_hub_name }}
                   </span>
                 </template>
              </el-table-column>
              <el-table-column label="Lên xe" width="70" align="center">
                 <template #default="{ row }">
                    <el-button type="warning" plain size="small" circle :icon="Top" @click="addBagFromList(row)" :disabled="!isLocked"></el-button>
                 </template>
              </el-table-column>
           </el-table>
        </el-card>

        <div v-else>
          <el-card v-if="!isLocked" class="list-card border-dashed" shadow="never">
             <template #header>
                <div class="card-header flex-between text-primary">
                   <span><el-icon><LocationInformation /></el-icon> Xe đang tới bưu cục của bạn</span>
                   <el-button size="small" circle :icon="Refresh" @click="fetchIncomingManifests" :loading="loadingIncoming"></el-button>
                </div>
             </template>
             
             <el-table :data="incomingManifests" v-loading="loadingIncoming" stripe empty-text="Hiện tại không có chuyến xe nào đang tới" height="520px" size="small">
                <el-table-column label="Mã Chuyến xe" min-width="150">
                   <template #default="{ row }">
                     <div class="font-bold text-primary">{{ row.manifest_code }}</div>
                     <div class="text-xs text-muted">Biển số: {{ row.vehicle_number || 'N/A' }}</div>
                   </template>
                </el-table-column>
                <el-table-column prop="from_hub_name" label="Xuất phát từ" min-width="120" show-overflow-tooltip />
                <el-table-column label="Dỡ hàng" width="90" align="center">
                   <template #default="{ row }">
                      <el-button type="primary" size="small" @click="selectIncomingManifest(row)">Chọn xe</el-button>
                   </template>
                </el-table-column>
             </el-table>
          </el-card>

          <el-card v-else class="list-card border-dashed" shadow="never">
             <template #header>
                <div class="card-header flex-between text-primary">
                   <span><el-icon><DocumentChecked /></el-icon> Đối chiếu danh sách túi trên xe</span>
                   <el-tag :type="missingBagsCount === 0 ? 'success' : 'danger'">
                     {{ missingBagsCount === 0 ? 'ĐÃ ĐỦ TÚI' : `CÒN THIẾU ${missingBagsCount} TÚI` }}
                   </el-tag>
                </div>
             </template>
             
             <el-table :data="expectedBags" v-loading="loadingExpected" stripe height="520px" size="small">
                <el-table-column label="Trạng thái" width="90" align="center">
                   <template #default="{ row }">
                      <el-tag v-if="row.is_scanned" type="success" effect="dark" size="small"><el-icon><Check /></el-icon> Đã nhận</el-tag>
                      <el-tag v-else type="info" effect="plain" size="small">Chờ quét</el-tag>
                   </template>
                </el-table-column>
                <el-table-column prop="bag_code" label="Mã Túi (Theo Manifest)">
                   <template #default="{ row }">
                     <span class="font-bold" :class="row.is_scanned ? 'text-success' : 'text-muted'">{{ row.bag_code }}</span>
                   </template>
                </el-table-column>
             </el-table>
          </el-card>
        </div>
      </el-col>

      <el-col :span="9">
        <el-card class="scan-area mb-4" shadow="hover" :body-style="{ padding: '15px' }">
          <el-input
            v-model="barcode"
            ref="barcodeRef"
            placeholder="QUÉT MÃ TÚI (BAG) VÀO ĐÂY..."
            size="large"
            class="scan-input"
            :disabled="!isLocked"
            @keyup.enter="handleScan(barcode)"
          >
            <template #append>
              <el-button type="success" @click="handleScan(barcode)" :disabled="!isLocked" class="font-bold">
                QUÉT
              </el-button>
            </template>
          </el-input>
          
          <div v-if="!isLocked" class="lock-overlay text-danger font-bold">
             BẠN PHẢI CHỐT THÔNG TIN XE TRƯỚC KHI QUÉT!
          </div>
        </el-card>

        <el-card shadow="never" class="table-card bg-success-light">
          <template #header>
            <div class="card-header text-success flex-between">
              <span><el-icon><CircleCheckFilled /></el-icon> Đã {{ scanType === 'LOAD' ? 'bốc lên xe' : 'dỡ xuống kho' }} ({{ bags.length }})</span>
            </div>
          </template>

          <el-table :data="bags" empty-text="Chưa quét túi nào" height="370px" size="small">
            <el-table-column type="index" width="50" align="center" />
            <el-table-column prop="bag_code" label="Mã Túi (Bag)">
               <template #default="{ row }">
                  <span class="font-bold text-primary">{{ row.bag_code }}</span>
               </template>
            </el-table-column>
            <el-table-column prop="scanned_at" label="Thời gian" width="100" align="center">
               <template #default="{ row }">
                 <span class="text-muted text-xs">{{ row.scanned_at }}</span>
               </template>
            </el-table-column>
            <el-table-column label="Bỏ" width="60" align="center">
              <template #default="{ row, $index }">
                <el-button type="danger" text @click="removeBag($index, row)" circle>
                  <el-icon><Delete /></el-icon>
                </el-button>
              </template>
            </el-table-column>
          </el-table>

          <div class="mt-3 flex-end pt-3">
            <el-button
              type="primary" 
              class="submit-btn w-full"
              size="large"
              :disabled="bags.length === 0"
              :loading="submitting"
              @click="submitManifest"
            >
              <el-icon class="mr-1"><Check /></el-icon> XÁC NHẬN CHUYẾN XE
            </el-button>
          </div>
        </el-card>
      </el-col>

    </el-row>

    <audio ref="beepOk" src="https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3"></audio>
    <audio ref="beepError" src="https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3"></audio>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick, computed } from 'vue';
import { 
  Van, Top, Bottom, Grid, Delete, Check, Lock, Unlock, 
  WarningFilled, Clock, List, Refresh, RefreshRight, CircleCheckFilled, LocationInformation, DocumentChecked
} from '@element-plus/icons-vue';
import api from '@/api/axios';
import { ElMessage, ElMessageBox } from 'element-plus';
import moment from 'moment';

// --- STATE ---
const scanType = ref('LOAD');
const manifestCode = ref('');
const vehicleNumber = ref('');
const toHubId = ref(null);
const hubs = ref([]);
const isLocked = ref(false);
const barcode = ref('');
const barcodeRef = ref(null);
const bags = ref([]); // Danh sách đã quét thực tế

// State Load
const pendingBags = ref([]);
const loadingList = ref(false);

// State Unload (Xe đang tới & Kiểm đếm)
const incomingManifests = ref([]);
const loadingIncoming = ref(false);
const expectedBags = ref([]); // Danh sách túi LÝ THUYẾT phải có trên chuyến xe
const loadingExpected = ref(false);

const submitting = ref(false);
const beepOk = ref(null);
const beepError = ref(null);

const selectedHubName = computed(() => {
  if (!toHubId.value) return '';
  const hub = hubs.value.find(h => h.hub_id === toHubId.value);
  return hub ? hub.hub_name : '';
});

const missingBagsCount = computed(() => {
  return expectedBags.value.filter(b => !b.is_scanned).length;
});

// --- HÀM XỬ LÝ CHUNG ---

const handleTypeChange = () => {
  manifestCode.value = '';
  vehicleNumber.value = '';
  toHubId.value = null;
  bags.value = [];
  expectedBags.value = [];
  isLocked.value = false;
  
  if (scanType.value === 'LOAD') {
    generateManifestCode();
    fetchPendingBags();
  } else {
    fetchIncomingManifests();
  }
};

const unlockForm = () => {
  isLocked.value = false;
  bags.value = []; 
  expectedBags.value = [];
};

// --- HÀM XỬ LÝ LOAD (BỐC LÊN XE) ---

const generateManifestCode = () => {
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  manifestCode.value = `MFL-${moment().format('YYMMDD')}-${randomNum}`;
};

const fetchPendingBags = async () => {
  if (scanType.value !== 'LOAD') return;
  loadingList.value = true;
  try {
    const res = await api.get('/api/scans/bags/pending');
    const scannedCodes = bags.value.map(b => b.bag_code);
    pendingBags.value = (res.data.items || []).filter(b => !scannedCodes.includes(b.bag_code));
  } catch (e) {
    ElMessage.error('Lỗi khi tải danh sách túi chờ xuất');
  } finally {
    loadingList.value = false;
  }
};

// --- HÀM XỬ LÝ UNLOAD (DỠ XUỐNG KHO & KIỂM ĐẾM) ---

const fetchIncomingManifests = async () => {
  if (scanType.value !== 'UNLOAD') return;
  loadingIncoming.value = true;
  try {
    const res = await api.get('/api/scans/manifests/incoming');
    incomingManifests.value = res.data.items || [];
  } catch (e) {
    ElMessage.error('Lỗi khi tải danh sách xe đang tới');
  } finally {
    loadingIncoming.value = false;
  }
};

const fetchExpectedBags = async (code) => {
  loadingExpected.value = true;
  try {
    const res = await api.get(`/api/scans/manifests/${code}/bags`);
    // Gắn thêm cờ is_scanned = false cho danh sách kiểm đếm
    expectedBags.value = (res.data.items || []).map(b => ({ ...b, is_scanned: false }));
  } catch (e) {
    ElMessage.error('Lỗi tải danh sách đối chiếu túi hàng');
  } finally {
    loadingExpected.value = false;
  }
};

const selectIncomingManifest = async (manifest) => {
  manifestCode.value = manifest.manifest_code;
  await fetchExpectedBags(manifest.manifest_code);
  lockManifest();
};

// --- QUÉT MÃ ---

const lockManifest = () => {
  if (scanType.value === 'UNLOAD' && !manifestCode.value) return ElMessage.warning("Vui lòng chọn xe từ danh sách bên phải!");
  
  if (scanType.value === 'LOAD') {
    if (!manifestCode.value) generateManifestCode(); 
    if (!vehicleNumber.value) return ElMessage.warning("Vui lòng nhập Biển số xe");
    if (!toHubId.value) return ElMessage.warning("Vui lòng chọn Bưu cục đích");
  }

  isLocked.value = true;
  nextTick(() => barcodeRef.value?.focus());
};

const handleScan = async (codeToCheck, bagObj = null) => {
  if (!isLocked.value) return;

  const code = codeToCheck.trim().toUpperCase();
  if (!code) return;
  
  if (bags.value.some(b => b.bag_code === code)) {
    playError();
    barcode.value = '';
    return ElMessage.warning('Túi này đã được quét!');
  }

  // --- CẢNH BÁO LỆCH TUYẾN KHI BỐC LÊN XE ---
  if (scanType.value === 'LOAD') {
    const targetBag = bagObj || pendingBags.value.find(b => b.bag_code === code);
    
    if (targetBag && targetBag.dest_hub_name !== selectedHubName.value && targetBag.dest_hub_name !== 'Không rõ') {
      playError();
      try {
        await ElMessageBox.confirm(
          `Túi hàng <b>${code}</b> có đích đến là <b>${targetBag.dest_hub_name}</b>, KHÁC với tuyến đường của xe này (đi <b>${selectedHubName.value}</b>).<br><br>Bạn có chắc chắn muốn bốc nhầm lên xe không?`,
          'CẢNH BÁO LỆCH TUYẾN',
          { confirmButtonText: 'Vẫn bốc lên', cancelButtonText: 'Hủy, để lại', type: 'warning', dangerouslyUseHTMLString: true }
        );
      } catch {
        barcode.value = '';
        nextTick(() => barcodeRef.value?.focus());
        return; 
      }
    }
  }

  // --- KIỂM ĐẾM LẠC LOÀI KHI DỠ XUỐNG KHO ---
  if (scanType.value === 'UNLOAD') {
    const expectedBag = expectedBags.value.find(b => b.bag_code === code);
    if (!expectedBag) {
      playError();
      barcode.value = '';
      return ElMessage.error(`CẢNH BÁO: Túi ${code} KHÔNG THUỘC CHUYẾN XE NÀY! Vui lòng kiểm tra lại.`);
    }
    // Nếu quét đúng túi thuộc chuyến xe, đánh dấu nó màu xanh
    expectedBag.is_scanned = true;
  }

  playOk();
  bags.value.unshift({
    bag_code: code,
    scanned_at: moment().format('HH:mm:ss')
  });
  
  if (scanType.value === 'LOAD') {
     pendingBags.value = pendingBags.value.filter(b => b.bag_code !== code);
  }
  
  barcode.value = '';
  nextTick(() => barcodeRef.value?.focus());
};

const addBagFromList = (bag) => {
  if (!isLocked.value) return ElMessage.warning('Vui lòng BẮT ĐẦU BỐC LÊN XE trước!');
  handleScan(bag.bag_code, bag);
};

const removeBag = (idx, row) => {
  bags.value.splice(idx, 1);
  if (scanType.value === 'LOAD') fetchPendingBags();
  
  // Hủy đánh dấu màu xanh nếu đang Dỡ hàng
  if (scanType.value === 'UNLOAD') {
    const expectedBag = expectedBags.value.find(b => b.bag_code === row.bag_code);
    if (expectedBag) expectedBag.is_scanned = false;
  }
  
  nextTick(() => barcodeRef.value?.focus());
};

const playOk = () => { beepOk.value?.play().catch(() => {}) };
const playError = () => { beepError.value?.play().catch(() => {}) };

const submitManifest = async () => {
  try {
    // Nếu DỠ HÀNG mà quét thiếu túi -> Cảnh báo gắt gao
    if (scanType.value === 'UNLOAD' && missingBagsCount.value > 0) {
      await ElMessageBox.confirm(
        `Chuyến xe này khai báo ${expectedBags.value.length} túi, nhưng bạn <b>chỉ mới quét ${bags.value.length} túi</b> (Đang THIẾU ${missingBagsCount.value} túi).<br><br>Bạn có chắc chắn muốn kết thúc dỡ hàng và chốt số lượng này không?`,
        'CẢNH BÁO THIẾU HÀNG', 
        { type: 'error', confirmButtonText: 'Chốt số lượng thực tế', cancelButtonText: 'Tiếp tục quét', dangerouslyUseHTMLString: true }
      );
    } else {
      await ElMessageBox.confirm(
        `Xác nhận ${scanType.value === 'LOAD' ? 'BỐC LÊN XE' : 'DỠ XUỐNG KHO'} đối với ${bags.value.length} túi này?`,
        'Xác nhận hệ thống', { type: 'warning', confirmButtonText: 'Đồng ý', cancelButtonText: 'Hủy' }
      );
    }

    submitting.value = true;
    
    let payload = {
      manifest_code: manifestCode.value.toUpperCase(),
      bag_codes: bags.value.map(b => b.bag_code)
    };

    if (scanType.value === 'LOAD') {
      payload.vehicle_number = vehicleNumber.value;
      payload.to_hub_id = Number(toHubId.value);
    }

    const endpoint = scanType.value === 'LOAD' ? '/api/scans/manifest-load' : '/api/scans/manifest-unload';
    
    const res = await api.post(endpoint, payload);
    const realManifestCode = res.data.manifest_code; 
    
    ElMessageBox.alert(
      `<div style="text-align: center; font-size: 16px;">
         Thao tác <b>${scanType.value === 'LOAD' ? 'BỐC XE' : 'DỠ HÀNG'}</b> thành công!<br>Mã chuyến xe là:<br>
         <b style="font-size: 26px; color: #67C23A; display: block; margin-top: 10px; letter-spacing: 1px;">${realManifestCode}</b>
       </div>`, 
      'Hoàn tất', 
      { dangerouslyUseHTMLString: true, type: 'success' }
    );
    
    // Reset lại màn hình
    handleTypeChange();
  } catch (err) {
    if (err !== 'cancel') {
        const detail = err.response?.data?.detail;
        ElMessage.error(detail || 'Lỗi hệ thống khi thao tác');
    }
  } finally {
    submitting.value = false;
  }
};

onMounted(async () => {
  handleTypeChange(); 
  try {
    const res = await api.get('/api/hubs');
    hubs.value = res.data.items || res.data || [];
  } catch (e) {
    ElMessage.error('Không tải được danh sách bưu cục');
  }
});
</script>

<style scoped>
/* Utilities */
.flex-between { display: flex; justify-content: space-between; align-items: center; }
.w-full { width: 100%; }
.m-0 { margin: 0; }
.mt-1 { margin-top: 4px; }
.mt-2 { margin-top: 8px; }
.mt-3 { margin-top: 12px; }
.mt-4 { margin-top: 16px; }
.mb-3 { margin-bottom: 12px; }
.mb-4 { margin-bottom: 16px; }
.my-3 { margin: 12px 0; }
.mr-1 { margin-right: 4px; }
.pt-3 { padding-top: 12px; }
.text-muted { color: #6b7280; }
.text-xs { font-size: 12px; }
.font-bold { font-weight: bold; }
.text-primary { color: #409EFF; }
.text-danger { color: #F56C6C; }
.text-warning { color: #E6A23C; }
.text-success { color: #67C23A; }
.flex-end { display: flex; justify-content: flex-end; gap: 12px; }
.text-center { text-align: center; }
.opacity-50 { opacity: 0.5; }
.bg-gray-50 { background-color: #f9fafb; }
.bg-success-light { background-color: #f0fdf4; border-color: #bbf7d0; }
.border-dashed { border: 1px dashed #dcdfe6; }

/* Cards & Headers */
.manifest-config-card, .summary-card, .scan-area, .table-card, .list-card {
  border-radius: 8px;
}
.card-header {
  font-size: 14px;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 8px;
}

/* Inputs & Forms */
.manifest-config-card :deep(.el-form-item__label) {
  font-weight: 600;
  color: #4b5563;
  padding-bottom: 4px;
}
.uppercase-input :deep(.el-input__inner) { text-transform: uppercase; font-weight: 800; font-size: 16px; letter-spacing: 1px; }
.divider-line { height: 1px; background-color: #f3f4f6; }

/* Custom Radio */
.custom-radio { display: flex; width: 100%; }
.custom-radio :deep(.el-radio-button) { flex: 1; }
.custom-radio :deep(.el-radio-button__inner) { width: 100%; padding: 12px 0; font-weight: 600; }

/* Buttons */
.lock-btn { padding: 12px; font-weight: bold; font-size: 14px; }
.submit-btn { font-weight: 800; font-size: 15px; letter-spacing: 0.5px; }

/* Scanner Input */
.scan-area { position: relative; }
.scan-input :deep(.el-input__inner) {
  font-size: 1.3rem; height: 50px; text-align: center; letter-spacing: 1px; font-weight: 800; color: #67C23A;
}
.lock-overlay {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(2px);
  display: flex; align-items: center; justify-content: center;
  z-index: 10; border-radius: 8px; font-size: 15px;
}

/* Summary stats */
.stat-row { display: flex; justify-content: space-between; align-items: center; }
.stat-val { font-size: 24px; font-weight: 900; }

:deep(.el-table) { border-radius: 6px; }
</style>