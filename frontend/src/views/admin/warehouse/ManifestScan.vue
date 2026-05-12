<template>
  <div class="modern-manifest-page">
    <div class="page-container">

      <!-- Header Section -->
      <header class="page-header animate-fade-in">
        <div class="header-content">
          <div class="title-wrapper">
            <div class="icon-box primary">
              <el-icon><Van /></el-icon>
            </div>
            <div>
              <h2 class="page-title">Lập Manifest (Chuyến xe)</h2>
              <p class="page-subtitle">Gắn các túi hàng lên xe trung chuyển hoặc dỡ xuống kho đích</p>
            </div>
          </div>
        </div>
      </header>

      <!-- Main Layout: 3 Columns -->
      <el-row :gutter="24" class="form-row-container animate-fade-in-up">
        
        <!-- COLUMN 1: Manifest Configuration (25%) -->
        <el-col :span="6" class="column-layout">
          <div class="content-card compact-card config-card" :class="{'is-locked': isLocked}">
            <div class="section-header">
              <el-icon><Setting /></el-icon><span>Cấu hình Chuyến xe</span>
            </div>
            
            <el-form label-position="top" class="modern-form">
              <el-form-item label="Loại thao tác">
                <el-radio-group v-model="scanType" class="custom-radio-group w-full" :disabled="isLocked" @change="handleTypeChange">
                  <el-radio-button value="LOAD">
                    <div class="radio-content"><el-icon><Top /></el-icon> <span>Bốc lên xe</span></div>
                  </el-radio-button>
                  <el-radio-button value="UNLOAD">
                    <div class="radio-content"><el-icon><Bottom /></el-icon> <span>Dỡ xuống kho</span></div>
                  </el-radio-button>
                </el-radio-group>
              </el-form-item>

              <div class="divider-dashed my-3"></div>

              <el-form-item label="Mã chuyến xe / Manifest" required>
                <el-input 
                  v-model="manifestCode" 
                  :placeholder="scanType === 'LOAD' ? 'Hệ thống tự tạo' : 'Chọn xe từ danh sách...'" 
                  :disabled="isLocked || scanType === 'UNLOAD'"
                  class="code-input"
                >
                  <template #prefix><el-icon><Key /></el-icon></template>
                  <template #append v-if="scanType === 'LOAD'">
                     <button class="btn-input-append" @click="generateManifestCode" :disabled="isLocked" title="Tạo mã tự động">
                       <el-icon><RefreshRight /></el-icon>
                     </button>
                  </template>
                </el-input>
              </el-form-item>

              <transition name="el-zoom-in-top">
                <div v-if="scanType === 'LOAD'">
                  <el-form-item label="Biển số xe tải" required>
                    <el-input v-model="vehicleNumber" placeholder="VD: 29C-123.45" :disabled="isLocked">
                      <template #prefix><el-icon><Van /></el-icon></template>
                    </el-input>
                  </el-form-item>

                  <el-form-item label="Bưu cục đích đến (To Hub)" required>
                    <el-select v-model="toHubId" placeholder="Chọn bưu cục xe sẽ chạy tới..." class="w-full modern-select" filterable :disabled="isLocked">
                      <template #prefix><el-icon><Location /></el-icon></template>
                      <el-option v-for="hub in hubs" :key="hub.hub_id" :label="`${hub.hub_code} - ${hub.hub_name}`" :value="hub.hub_id" />
                    </el-select>
                  </el-form-item>
                </div>
              </transition>

              <div class="action-area mt-4">
                <button v-if="!isLocked" class="btn-primary w-full justify-center lg-btn lock-btn" @click="lockManifest" :disabled="scanType === 'UNLOAD' && !manifestCode">
                  <el-icon><Lock /></el-icon> <span>BẮT ĐẦU {{ scanType === 'LOAD' ? 'BỐC LÊN XE' : 'KIỂM ĐẾM' }}</span>
                </button>
                <button v-else class="btn-warning-outline w-full justify-center" @click="unlockForm">
                  <el-icon><Unlock /></el-icon> <span>Mở khóa / Đổi chuyến</span>
                </button>
              </div>
            </el-form>
          </div>

          <!-- Summary Card -->
          <div class="content-card compact-card summary-card flex-fill">
            <div class="section-header">
              <el-icon><DataLine /></el-icon><span>Tiến độ thực tế</span>
            </div>
            <div class="stat-container">
              <div class="stat-box">
                <span class="stat-label">Tổng số túi đã quét</span>
                <div class="stat-value-group">
                  <span class="stat-value" :class="bags.length > 0 ? 'text-primary' : 'text-dark'">{{ bags.length }}</span>
                  <span v-if="scanType === 'UNLOAD'" class="stat-total text-muted">/ {{ expectedBags.length }}</span>
                  <span class="stat-unit ml-1">Túi</span>
                </div>
              </div>
            </div>
          </div>
        </el-col>

        <!-- COLUMN 2: Dynamic Lists (35%) -->
        <el-col :span="8" class="column-layout">
          
          <!-- MODE: LOAD (Bốc lên xe) -->
          <div v-if="scanType === 'LOAD'" class="content-card compact-card list-card flex-fill">
             <div class="section-header flex-between mb-4">
                <div class="flex-center gap-2">
                  <el-icon class="text-warning"><List /></el-icon><span>Túi chờ xuất kho</span>
                </div>
                <button class="icon-btn secondary small" @click="fetchPendingBags" :disabled="loadingList" title="Làm mới danh sách">
                  <el-icon :class="{'is-loading': loadingList}"><Refresh /></el-icon>
                </button>
             </div>
             
             <el-table 
                :data="pendingBags" 
                v-loading="loadingList" 
                class="modern-table compact-table borderless"
                height="550px"
             >
                <el-table-column prop="bag_code" label="Mã Túi" width="120">
                   <template #default="{ row }">
                     <span class="code-badge default">{{ row.bag_code }}</span>
                   </template>
                </el-table-column>
                
                <el-table-column label="BC Đích của túi" min-width="120" show-overflow-tooltip>
                   <template #default="{ row }">
                     <div class="dest-info" :class="{'text-danger fw-bold': isLocked && row.dest_hub_name !== selectedHubName && row.dest_hub_name !== 'Không rõ'}">
                       <el-icon class="mr-1"><LocationInformation /></el-icon>
                       {{ row.dest_hub_name }}
                     </div>
                   </template>
                </el-table-column>
                
                <el-table-column label="Lên xe" width="70" align="center" fixed="right">
                   <template #default="{ row }">
                      <button class="icon-btn warning small" @click="addBagFromList(row)" :disabled="!isLocked" title="Bốc túi này lên xe">
                        <el-icon><Top /></el-icon>
                      </button>
                   </template>
                </el-table-column>
                
                <template #empty>
                  <el-empty description="Kho không còn túi nào chờ xuất" :image-size="60" />
                </template>
             </el-table>
          </div>

          <!-- MODE: UNLOAD (Dỡ hàng xuống) -->
          <div v-else class="flex-fill flex-column">
            
            <!-- Chưa khóa: Danh sách xe đang tới -->
            <div v-if="!isLocked" class="content-card compact-card list-card flex-fill">
               <div class="section-header flex-between mb-4">
                  <div class="flex-center gap-2">
                    <el-icon class="text-primary"><Van /></el-icon><span>Xe đang tới bưu cục</span>
                  </div>
                  <button class="icon-btn secondary small" @click="fetchIncomingManifests" :disabled="loadingIncoming">
                    <el-icon :class="{'is-loading': loadingIncoming}"><Refresh /></el-icon>
                  </button>
               </div>
               
               <el-table 
                  :data="incomingManifests" 
                  v-loading="loadingIncoming" 
                  class="modern-table compact-table borderless"
                  height="550px"
               >
                  <el-table-column label="Chuyến xe / Biển số" min-width="150">
                     <template #default="{ row }">
                       <div class="manifest-info">
                         <span class="code-badge primary mb-1">{{ row.manifest_code }}</span>
                         <span class="vehicle-tag"><el-icon><Van /></el-icon> {{ row.vehicle_number || 'N/A' }}</span>
                       </div>
                     </template>
                  </el-table-column>
                  
                  <el-table-column prop="from_hub_name" label="Xuất phát từ" min-width="120" show-overflow-tooltip>
                     <template #default="{ row }">
                       <span class="fw-bold text-dark">{{ row.from_hub_name }}</span>
                     </template>
                  </el-table-column>
                  
                  <el-table-column label="Dỡ hàng" width="90" align="center" fixed="right">
                     <template #default="{ row }">
                        <button class="btn-action-small" @click="selectIncomingManifest(row)">Chọn xe</button>
                     </template>
                  </el-table-column>
                  
                  <template #empty>
                    <el-empty description="Hiện tại không có chuyến xe nào đang tới" :image-size="60" />
                  </template>
               </el-table>
            </div>

            <!-- Đã khóa: Danh sách đối chiếu -->
            <div v-else class="content-card compact-card list-card flex-fill">
               <div class="section-header flex-between mb-4">
                  <div class="flex-center gap-2">
                    <el-icon class="text-primary"><DocumentChecked /></el-icon><span>Đối chiếu trên xe</span>
                  </div>
                  <div class="modern-tag" :class="missingBagsCount === 0 ? 'tag-success' : 'tag-danger'">
                    <span class="dot"></span>
                    {{ missingBagsCount === 0 ? 'ĐÃ ĐỦ TÚI' : `THIẾU ${missingBagsCount} TÚI` }}
                  </div>
               </div>
               
               <el-table 
                  :data="expectedBags" 
                  v-loading="loadingExpected" 
                  class="modern-table compact-table borderless"
                  height="550px"
               >
                  <el-table-column label="Trạng thái" width="100" align="center">
                     <template #default="{ row }">
                        <div v-if="row.is_scanned" class="status-badge success"><el-icon><Check /></el-icon> Đã nhận</div>
                        <div v-else class="status-badge default">Chờ quét</div>
                     </template>
                  </el-table-column>
                  
                  <el-table-column prop="bag_code" label="Mã Túi (Theo Manifest)">
                     <template #default="{ row }">
                       <span class="code-badge" :class="row.is_scanned ? 'success' : 'default'">{{ row.bag_code }}</span>
                     </template>
                  </el-table-column>
               </el-table>
            </div>
          </div>
        </el-col>

        <!-- COLUMN 3: Scanner & Result Bags (40%) -->
        <el-col :span="10" class="column-layout">
          
          <!-- Scanner Input -->
          <div class="content-card compact-card scanner-container">
             <el-input 
                v-model="barcode" 
                placeholder="QUÉT MÃ TÚI (BAG) VÀO ĐÂY..." 
                ref="barcodeRef"
                :disabled="!isLocked || loading"
                @keyup.enter="handleScan(barcode)"
                class="modern-scanner-input"
             >
                <template #prefix><el-icon class="scanner-icon"><Aim /></el-icon></template>
                <template #append>
                   <button class="btn-scan" @click="handleScan(barcode)" :disabled="!isLocked || loading">
                     <span>QUÉT</span>
                   </button>
                </template>
             </el-input>
             
             <!-- Overlay for un-locked state -->
             <div v-if="!isLocked" class="lock-overlay">
                <el-icon class="lock-icon"><Lock /></el-icon>
                <span>BẠN PHẢI CHỐT THÔNG TIN CHUYẾN XE TRƯỚC KHI QUÉT!</span>
             </div>
          </div>

          <!-- Items Processed -->
          <div class="content-card compact-card list-card flex-fill bag-content-card">
             <div class="section-header text-success mb-4 flex-between">
                <div class="flex-center gap-2">
                  <el-icon><CircleCheckFilled /></el-icon>
                  <span>Đã {{ scanType === 'LOAD' ? 'bốc lên xe' : 'dỡ xuống kho' }}</span>
                </div>
                <el-tag type="success" effect="light" round class="fw-bold px-3">{{ bags.length }} túi</el-tag>
             </div>
             
             <el-table 
                :data="bags" 
                class="modern-table compact-table highlight-table"
                height="400px"
             >
                <el-table-column type="index" width="50" align="center" label="#" />
                
                <el-table-column prop="bag_code" label="Mã Túi (Bag)" min-width="160">
                   <template #default="{ row }">
                      <span class="code-badge success">{{ row.bag_code }}</span>
                   </template>
                </el-table-column>
                
                <el-table-column prop="scanned_at" label="Thời gian" width="120" align="center">
                   <template #default="{ row }">
                     <span class="time-text"><el-icon class="mr-1"><Clock /></el-icon>{{ row.scanned_at }}</span>
                   </template>
                </el-table-column>
                
                <el-table-column label="Bỏ" width="70" align="center" fixed="right">
                  <template #default="{ row, $index }">
                    <button class="icon-btn delete small mx-auto" @click="removeBag($index, row)" title="Hủy thao tác">
                      <el-icon><Delete /></el-icon>
                    </button>
                  </template>
                </el-table-column>
                
                <template #empty>
                  <el-empty description="Chưa quét túi nào" :image-size="80" />
                </template>
             </el-table>

             <div class="mt-4 pt-3 border-top">
                <button 
                  class="btn-primary w-full justify-center lg-btn" 
                  :disabled="bags.length === 0 || submitting"
                  @click="submitManifest"
                >
                  <el-icon class="is-loading mr-2" v-if="submitting"><Loading /></el-icon>
                  <el-icon v-else><Check /></el-icon>
                  <span>XÁC NHẬN CHUYẾN XE</span>
                </button>
             </div>
          </div>

        </el-col>
      </el-row>

      <!-- Audio Elements -->
      <audio ref="beepOk" src="https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3"></audio>
      <audio ref="beepError" src="https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3"></audio>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick, computed } from 'vue';
import { 
  Van, Top, Bottom, Grid, Delete, Check, Lock, Unlock, 
  WarningFilled, Clock, List, Refresh, RefreshRight, 
  CircleCheckFilled, LocationInformation, DocumentChecked,
  Setting, Key, Location, Aim, DataLine, Box, Right, Loading
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
const bags = ref([]);

// State Load
const pendingBags = ref([]);
const loadingList = ref(false);

// State Unload
const incomingManifests = ref([]);
const loadingIncoming = ref(false);
const expectedBags = ref([]); 
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

  const code = (typeof codeToCheck === 'string' ? codeToCheck : barcode.value).trim().toUpperCase();
  if (!code) return;
  
  if (bags.value.some(b => b.bag_code === code)) {
    playError();
    barcode.value = '';
    return ElMessage.warning('Túi này đã được quét!');
  }

  if (scanType.value === 'LOAD') {
    const targetBag = bagObj || pendingBags.value.find(b => b.bag_code === code);
    
    if (targetBag && targetBag.dest_hub_name !== selectedHubName.value && targetBag.dest_hub_name !== 'Không rõ') {
      playError();
      try {
        await ElMessageBox.confirm(
          `Túi hàng <b>${code}</b> có đích đến là <b>${targetBag.dest_hub_name}</b>, KHÁC với tuyến đường của xe này (đi <b>${selectedHubName.value}</b>).<br><br>Bạn có chắc chắn muốn bốc nhầm lên xe không?`,
          'CẢNH BÁO LỆCH TUYẾN',
          { confirmButtonText: 'Vẫn bốc lên', cancelButtonText: 'Hủy, để lại', type: 'warning', dangerouslyUseHTMLString: true, customClass: 'modern-message-box' }
        );
      } catch {
        barcode.value = '';
        nextTick(() => barcodeRef.value?.focus());
        return; 
      }
    }
  }

  if (scanType.value === 'UNLOAD') {
    const expectedBag = expectedBags.value.find(b => b.bag_code === code);
    if (!expectedBag) {
      playError();
      barcode.value = '';
      return ElMessage.error(`CẢNH BÁO: Túi ${code} KHÔNG THUỘC CHUYẾN XE NÀY! Vui lòng kiểm tra lại.`);
    }
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
    if (scanType.value === 'UNLOAD' && missingBagsCount.value > 0) {
      await ElMessageBox.confirm(
        `Chuyến xe này khai báo ${expectedBags.value.length} túi, nhưng bạn <b>chỉ mới quét ${bags.value.length} túi</b> (Đang THIẾU ${missingBagsCount.value} túi).<br><br>Bạn có chắc chắn muốn kết thúc dỡ hàng và chốt số lượng này không?`,
        'CẢNH BÁO THIẾU HÀNG', 
        { type: 'error', confirmButtonText: 'Chốt số lượng thực tế', cancelButtonText: 'Tiếp tục quét', dangerouslyUseHTMLString: true, customClass: 'modern-message-box' }
      );
    } else {
      await ElMessageBox.confirm(
        `Xác nhận ${scanType.value === 'LOAD' ? 'BỐC LÊN XE' : 'DỠ XUỐNG KHO'} đối với <strong>${bags.value.length}</strong> túi này?`,
        'Xác nhận hệ thống', 
        { type: 'warning', confirmButtonText: 'Đồng ý', cancelButtonText: 'Hủy', dangerouslyUseHTMLString: true, customClass: 'modern-message-box' }
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
      `<div style="text-align: center;">
         <span style="font-size: 14px; color: #4B5563;">Thao tác <b>${scanType.value === 'LOAD' ? 'BỐC XE' : 'DỠ HÀNG'}</b> thành công!<br>Mã chuyến xe là:</span><br>
         <b style="font-size: 28px; color: #05CD99; display: block; margin-top: 12px; letter-spacing: 2px; font-family: monospace; background: #F0FDF4; padding: 12px; border-radius: 12px; border: 1px dashed #05CD99;">${realManifestCode}</b>
       </div>`, 
      'Hoàn tất', 
      { dangerouslyUseHTMLString: true, type: 'success', customClass: 'modern-message-box' }
    );
    
    handleTypeChange();
  } catch (err) {
    if (err !== 'cancel') {
        const detail = err.response?.data?.detail;
        const errorStr = Array.isArray(detail) ? detail[0].msg : (detail || 'Lỗi hệ thống khi thao tác');
        if (err.response?.status === 400 && (errorStr.includes('xác thực') || errorStr.includes('VERIFY'))) {
            playError();
            ElMessageBox.alert(
              `<div style="text-align: center;">
                 <span style="font-size: 48px; color: #EE5D50; margin-bottom: 12px; display: inline-block;">⚠️</span><br>
                 <b style="font-size: 18px; color: #EE5D50;">Lỗi: Đơn hàng trong túi chưa được xác thực (VERIFY). Không thể xuất kho!</b><br>
                 <span style="font-size: 14px; color: #4B5563; margin-top: 8px; display: inline-block;">${errorStr}</span>
               </div>`, 
              'LỖI XÁC THỰC', 
              { dangerouslyUseHTMLString: true, type: 'error', customClass: 'modern-message-box' }
            );
        } else {
            playError();
            ElMessage.error(errorStr);
        }
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
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

/* Base Layout */
.modern-manifest-page {
  min-height: calc(100vh - 64px);
  background-color: #F4F7FE; /* Light SaaS background */
  font-family: 'Plus Jakarta Sans', sans-serif;
  color: #2B3674;
  padding: 24px;
}

.page-container {
  max-width: 1600px;
  margin: 0 auto;
  height: 100%;
  display: flex;
  flex-direction: column;
}

/* Utilities */
.flex-between { display: flex; justify-content: space-between; align-items: center; }
.flex-center { display: flex; align-items: center; }
.justify-center { justify-content: center; }
.flex-column { display: flex; flex-direction: column; gap: 20px; }
.gap-2 { gap: 8px; }
.w-full { width: 100%; }
.mb-4 { margin-bottom: 16px; }
.mb-1 { margin-bottom: 4px; }
.mt-4 { margin-top: 16px; }
.my-3 { margin: 12px 0; }
.mr-1 { margin-right: 4px; }
.mr-2 { margin-right: 8px; }
.ml-1 { margin-left: 4px; }
.pt-3 { padding-top: 12px; }
.px-3 { padding-left: 12px; padding-right: 12px; }
.fw-bold { font-weight: 700; }
.text-dark { color: #1B2559; }
.text-muted { color: #A3AED0; }
.text-danger { color: #EE5D50; }
.text-warning { color: #FFB547; }
.text-success { color: #05CD99; }
.text-primary { color: #4318FF; }
.text-xs { font-size: 12px; }
.text-truncate { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

/* Header */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.header-content .title-wrapper {
  display: flex;
  align-items: center;
  gap: 16px;
}

.icon-box {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
}
.icon-box.primary { background: rgba(67, 24, 255, 0.1); color: #4318FF; }

.page-title { font-size: 28px; font-weight: 800; color: #2B3674; margin: 0 0 4px 0; letter-spacing: -0.5px; }
.page-subtitle { color: #A3AED0; font-size: 14px; margin: 0; font-weight: 500; }

/* Buttons */
.btn-primary { background: #4318FF; color: white; border: none; padding: 12px 24px; border-radius: 10px; font-weight: 700; font-size: 14px; display: inline-flex; align-items: center; gap: 8px; cursor: pointer; transition: all 0.3s ease; box-shadow: 0 4px 15px rgba(67, 24, 255, 0.25); }
.btn-primary:hover:not(:disabled) { background: #3311DB; transform: translateY(-2px); }
.btn-warning-outline { background: transparent; color: #FFB547; border: 1px solid #FFB547; padding: 10px 20px; border-radius: 10px; font-weight: 700; font-size: 14px; display: inline-flex; align-items: center; gap: 8px; cursor: pointer; transition: 0.3s; }
.btn-warning-outline:hover { background: rgba(255, 181, 71, 0.1); }
.btn-action-small { background: rgba(67, 24, 255, 0.1); color: #4318FF; border: none; padding: 6px 12px; border-radius: 8px; font-weight: 800; font-size: 12px; cursor: pointer; transition: 0.2s; }
.btn-action-small:hover { background: #4318FF; color: white; }
button:disabled { opacity: 0.7; cursor: not-allowed; }
.lg-btn { padding: 14px 20px; font-size: 15px; }

.icon-btn { width: 32px; height: 32px; border-radius: 8px; border: none; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s; font-size: 16px; }
.icon-btn.small { width: 28px; height: 28px; font-size: 14px; }
.icon-btn.secondary { background: #F4F7FE; color: #8F9BBA; }
.icon-btn.secondary:hover:not(:disabled) { background: #4318FF; color: white; }
.icon-btn.warning { background: rgba(255, 181, 71, 0.1); color: #FFB547; }
.icon-btn.warning:hover:not(:disabled) { background: #FFB547; color: white; }
.icon-btn.delete { background: #FFF0F0; color: #EE5D50; }
.icon-btn.delete:hover { background: #EE5D50; color: white; }
.icon-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.mx-auto { margin-left: auto; margin-right: auto; }

/* Layout Columns */
.form-row-container { display: flex; align-items: stretch; }
.column-layout { display: flex; flex-direction: column; gap: 20px; }
.flex-fill { flex: 1; display: flex; flex-direction: column; }

/* Cards */
.content-card {
  background: #FFFFFF;
  border-radius: 16px;
  box-shadow: 0px 4px 15px rgba(0, 0, 0, 0.02);
  border: 1px solid #E9EDF7;
  overflow: hidden;
}
.compact-card { padding: 20px; }

.section-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 800;
  color: #1B2559;
  margin-bottom: 16px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.section-header .el-icon { font-size: 18px; }

/* Config Card */
.config-card.is-locked { border: 2px solid #05CD99; background: #F0FDF4; }

:deep(.modern-form .el-form-item__label) { font-weight: 700; color: #2B3674; margin-bottom: 8px; font-size: 13px; }
:deep(.modern-form .el-input__wrapper),
:deep(.modern-select .el-input__wrapper) { background: #F8FAFC; box-shadow: 0 0 0 1px #E2E8F0 inset !important; border-radius: 10px; padding: 8px 12px; transition: all 0.3s; }
:deep(.modern-form .el-input__wrapper:hover),
:deep(.modern-select .el-input__wrapper:hover) { box-shadow: 0 0 0 1px #4318FF inset !important; }
:deep(.modern-form .el-input__wrapper.is-focus),
:deep(.modern-select .el-input__wrapper.is-focus) { box-shadow: 0 0 0 2px rgba(67, 24, 255, 0.2) inset !important; background: #FFFFFF; }
:deep(.modern-form .el-input.is-disabled .el-input__wrapper) { background: #E9EDF7; box-shadow: none !important; }

/* Code Input & Append Button */
:deep(.code-input .el-input__inner) { font-family: monospace; font-size: 16px; font-weight: 800; letter-spacing: 1px; color: #4318FF; text-transform: uppercase; }
:deep(.code-input .el-input-group__append) { background-color: #F8FAFC; border: 1px solid #E2E8F0; border-left: none; padding: 0; overflow: hidden; border-radius: 0 10px 10px 0; }
.btn-input-append { background: transparent; border: none; height: 100%; padding: 0 16px; color: #4318FF; font-size: 18px; cursor: pointer; transition: 0.2s; }
.btn-input-append:hover:not(:disabled) { background: #4318FF; color: white; }

.divider-dashed { height: 1px; background-image: linear-gradient(to right, #E2E8F0 50%, transparent 50%); background-size: 8px 1px; background-repeat: repeat-x; }

/* Radio Group */
:deep(.custom-radio-group) { display: flex; gap: 12px; width: 100%; }
:deep(.custom-radio-group .el-radio-button) { flex: 1; }
:deep(.custom-radio-group .el-radio-button__inner) { width: 100%; border: 1px solid #E2E8F0 !important; background: #F8FAFC; color: #A3AED0; font-weight: 700; border-radius: 10px !important; padding: 12px 0; box-shadow: none !important; font-size: 14px; }
:deep(.custom-radio-group .el-radio-button.is-active .el-radio-button__inner) { background: #4318FF; border-color: #4318FF !important; color: white; }
.radio-content { display: flex; align-items: center; justify-content: center; gap: 8px; }

/* Summary Stats */
.summary-card { background: #F8FAFC; border: none; }
.stat-container { display: flex; flex-direction: column; gap: 12px; }
.stat-box { display: flex; justify-content: space-between; align-items: center; }
.stat-label { font-size: 14px; font-weight: 600; color: #8F9BBA; }
.stat-value-group { display: flex; align-items: baseline; }
.stat-value { font-size: 28px; font-weight: 800; line-height: 1; }
.stat-total { font-size: 16px; font-weight: 700; margin-left: 4px; }
.stat-unit { font-size: 13px; font-weight: 700; color: #A3AED0; }

/* Tables */
:deep(.modern-table) {
  --el-table-border-color: transparent;
  --el-table-header-bg-color: #F8FAFC;
  --el-table-header-text-color: #A3AED0;
  --el-table-text-color: #2B3674;
}
:deep(.modern-table th.el-table__cell) { font-weight: 700; font-size: 12px; text-transform: uppercase; padding: 12px 0; border-bottom: 2px solid #E9EDF7 !important; }
:deep(.modern-table td.el-table__cell) { padding: 12px 0; border-bottom: 1px solid #F4F7FE !important; }
:deep(.compact-table .el-table__cell) { padding: 8px 0 !important; }
:deep(.highlight-table .el-table__row:first-child) { background-color: rgba(5, 205, 153, 0.05) !important; }

/* Table Cell Contents */
.code-badge { font-family: monospace; font-weight: 800; padding: 4px 8px; border-radius: 6px; font-size: 13px; display: inline-block; }
.code-badge.default { background: #F4F7FE; color: #4318FF; }
.code-badge.success { background: rgba(5, 205, 153, 0.1); color: #05CD99; font-size: 14px; }
.code-badge.primary { background: rgba(67, 24, 255, 0.1); color: #4318FF; font-size: 14px; }

.dest-info { display: flex; align-items: center; font-size: 13px; color: #4B5563; }
.manifest-info { display: flex; flex-direction: column; align-items: flex-start; }
.vehicle-tag { font-size: 11px; font-weight: 700; color: #8F9BBA; background: #E9EDF7; padding: 2px 8px; border-radius: 4px; display: inline-flex; align-items: center; gap: 4px; }
.time-text { display: flex; align-items: center; font-size: 13px; color: #A3AED0; font-weight: 600; }

.status-badge { font-size: 11px; font-weight: 800; text-transform: uppercase; padding: 4px 10px; border-radius: 6px; display: inline-flex; align-items: center; gap: 4px; }
.status-badge.success { background: #05CD99; color: white; }
.status-badge.default { background: #E9EDF7; color: #8F9BBA; }

/* Tags */
.modern-tag { display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px; border-radius: 20px; font-size: 12px; font-weight: 800; }
.modern-tag .dot { width: 6px; height: 6px; border-radius: 50%; }
.tag-success { background: rgba(5, 205, 153, 0.1); color: #05CD99; }
.tag-success .dot { background: #05CD99; }
.tag-danger { background: rgba(238, 93, 80, 0.1); color: #EE5D50; }
.tag-danger .dot { background: #EE5D50; }

/* Scanner Area */
.scanner-container { position: relative; padding: 24px; background: linear-gradient(to right, #ffffff, #f8fafc); border-color: #4318FF; box-shadow: 0 4px 20px rgba(67, 24, 255, 0.08); }

:deep(.modern-scanner-input .el-input__wrapper) {
  background: #FFFFFF; box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05) !important; 
  border-radius: 12px 0 0 12px; padding: 10px 16px; border: 2px solid transparent; transition: all 0.3s;
}
:deep(.modern-scanner-input .el-input__wrapper.is-focus) {
  border-color: #4318FF; box-shadow: 0 8px 25px rgba(67, 24, 255, 0.15) !important;
}
:deep(.modern-scanner-input .el-input__inner) {
  height: 50px; font-size: 20px; text-align: center; font-weight: 800; color: #05CD99; font-family: monospace; letter-spacing: 2px;
}
.scanner-icon { font-size: 24px; color: #A3AED0; margin-right: 8px; }

:deep(.modern-scanner-input .el-input-group__append) {
  background-color: #05CD99; border-color: #05CD99; color: white; border-radius: 0 12px 12px 0; overflow: hidden; padding: 0; box-shadow: 0 4px 15px rgba(5, 205, 153, 0.2);
}
.btn-scan {
  background: transparent; color: white; border: none; height: 100%; padding: 0 24px; font-weight: 800; font-size: 15px; font-family: inherit; cursor: pointer; transition: 0.3s; display: flex; align-items: center; justify-content: center;
}
.btn-scan:hover:not(:disabled) { background-color: #04b083; }

/* Overlay */
.lock-overlay {
  position: absolute; top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(255, 255, 255, 0.9); backdrop-filter: blur(4px);
  display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px;
  z-index: 10; border-radius: 16px; color: #EE5D50; font-weight: 700; font-size: 14px; text-align: center; padding: 20px;
}
.lock-icon { font-size: 32px; margin-bottom: 4px; }

.border-top { border-top: 1px dashed #E2E8F0; }

/* Animations */
.animate-fade-in { animation: fadeIn 0.5s ease-out; }
.animate-fade-in-up { animation: fadeInUp 0.5s ease-out; }
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes fadeInUp { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }

/* Responsive */
@media (max-width: 1200px) {
  .form-row-container { flex-direction: column; }
  .column-layout { width: 100%; max-width: 100%; margin-bottom: 20px; }
  .bag-content-card { min-height: 400px; }
}
</style>