<template>
  <div class="modern-bagging-page">
    <div class="page-container">

      <!-- Header Section -->
      <header class="page-header animate-fade-in">
        <div class="header-content">
          <div class="title-wrapper">
            <div class="icon-box primary">
              <el-icon><Suitcase /></el-icon>
            </div>
            <div>
              <h2 class="page-title">Đóng túi (Bagging)</h2>
              <p class="page-subtitle">Gom nhiều vận đơn vào một túi để vận chuyển liên tỉnh</p>
            </div>
          </div>
        </div>
        <div class="header-actions">
          <button class="btn-secondary" @click="resetSession" :disabled="loading">
            <el-icon><RefreshLeft /></el-icon>
            <span>Hủy & Đóng lại</span>
          </button>
          <button class="btn-primary" @click="confirmBagging" :disabled="loading || itemsInBag.length === 0">
            <el-icon class="is-loading mr-2" v-if="loading"><Loading /></el-icon>
            <el-icon v-else><Check /></el-icon>
            <span>Hoàn tất Đóng túi</span>
          </button>
        </div>
      </header>

      <!-- Main Layout: 3 Columns -->
      <el-row :gutter="24" class="form-row-container animate-fade-in-up">
        
        <!-- COLUMN 1: Bag Configuration (25%) -->
        <el-col :span="6" class="column-layout">
          <div class="content-card compact-card config-card" :class="{'is-locked': isBagLocked}">
            <div class="section-header">
              <el-icon><Setting /></el-icon><span>Cấu hình Túi</span>
            </div>
            
            <el-form label-position="top" class="modern-form">
              <el-form-item label="Mã số Túi (Tuỳ chọn)">
                 <el-input 
                    v-model="bagCode" 
                    placeholder="Hệ thống tự tạo nếu để trống" 
                    :disabled="isBagLocked"
                    class="code-input"
                 >
                   <template #prefix><el-icon><Key /></el-icon></template>
                 </el-input>
              </el-form-item>
              
              <el-form-item label="Bưu cục Đích đến (Bắt buộc)">
                 <el-select 
                    v-model="destHubId" 
                    placeholder="Chọn Bưu cục đích..." 
                    class="w-full modern-select" 
                    :disabled="isBagLocked" 
                    filterable
                 >
                    <template #prefix><el-icon><Location /></el-icon></template>
                    <el-option v-for="hub in hubs" :key="hub.hub_id" :label="`${hub.hub_code} - ${hub.hub_name}`" :value="hub.hub_id" />
                 </el-select>
              </el-form-item>

              <div class="action-area mt-4">
                <button v-if="!isBagLocked" class="btn-primary w-full justify-center lg-btn lock-btn" @click="lockBag" :disabled="!destHubId">
                  <el-icon><Lock /></el-icon> <span>BẮT ĐẦU ĐÓNG TÚI</span>
                </button>
                <button v-else class="btn-warning-outline w-full justify-center" @click="isBagLocked = false">
                  <el-icon><Unlock /></el-icon> <span>Mở khóa sửa thông tin</span>
                </button>
              </div>
            </el-form>
          </div>

          <!-- Summary Card -->
          <div class="content-card compact-card summary-card flex-fill">
            <div class="section-header">
              <el-icon><DataLine /></el-icon><span>Tổng quan túi</span>
            </div>
            <div class="stat-container">
              <div class="stat-box">
                <span class="stat-label">Tổng số đơn</span>
                <div class="stat-value-group">
                  <span class="stat-value text-primary">{{ itemsInBag.length }}</span>
                  <span class="stat-unit">Đơn</span>
                </div>
              </div>
              <div class="stat-divider"></div>
              <div class="stat-box">
                <span class="stat-label">Ước tính khối lượng</span>
                <div class="stat-value-group">
                  <span class="stat-value">{{ totalWeight.toFixed(2) }}</span>
                  <span class="stat-unit">Kg</span>
                </div>
              </div>
            </div>
          </div>
        </el-col>

        <!-- COLUMN 2: Available Waybills (35%) -->
        <el-col :span="8" class="column-layout">
          <div class="content-card compact-card list-card flex-fill">
            <div class="section-header flex-between mb-4">
              <div class="flex-center gap-2">
                <el-icon><List /></el-icon><span>Đơn chờ tại kho</span>
              </div>
              <button class="icon-btn secondary small" @click="fetchAvailableWaybills" :disabled="loadingList" title="Làm mới danh sách">
                <el-icon :class="{'is-loading': loadingList}"><Refresh /></el-icon>
              </button>
            </div>
            
            <el-table 
              :data="availableWaybills" 
              v-loading="loadingList" 
              class="modern-table compact-table borderless"
              height="550px"
            >
              <el-table-column prop="waybill_code" label="Mã Vận đơn" width="150">
                 <template #default="{ row }">
                   <div style="display: flex; flex-direction: column; gap: 4px;">
                     <span class="code-badge default">{{ row.waybill_code }}</span>
                     <span v-if="row.verify_status === 'VERIFIED'" class="verify-badge verified"><el-icon><CircleCheckFilled /></el-icon> Verified</span>
                     <span v-else-if="row.verify_status === 'MISMATCH'" class="verify-badge mismatch"><el-icon><WarningFilled /></el-icon> Mismatch</span>
                     <span v-else class="verify-badge pending"><el-icon><Clock /></el-icon> Pending</span>
                   </div>
                 </template>
              </el-table-column>
              
              <el-table-column label="BC Đích đến" min-width="140" show-overflow-tooltip>
                 <template #default="{ row }">
                   <div class="dest-info" :class="{'text-danger fw-bold': isBagLocked && row.dest_hub_id !== destHubId}">
                     <el-icon class="mr-1"><LocationInformation /></el-icon>
                     {{ row.dest_hub?.hub_name || 'Không rõ' }}
                   </div>
                 </template>
              </el-table-column>
              
              <el-table-column label="Thêm" width="70" align="center">
                 <template #default="{ row }">
                    <button class="icon-btn primary small" @click="handleAddWaybill(row, true)" :disabled="!isBagLocked" title="Thêm vào túi">
                      <el-icon><Plus /></el-icon>
                    </button>
                 </template>
              </el-table-column>
              
              <template #empty>
                <el-empty description="Không có đơn nào chờ đóng túi" :image-size="60" />
              </template>
            </el-table>
          </div>
        </el-col>

        <!-- COLUMN 3: Scanner & Bag Contents (40%) -->
        <el-col :span="10" class="column-layout">
          
          <!-- Scanner Input -->
          <div class="content-card compact-card scanner-container">
             <el-input 
                v-model="barcode" 
                placeholder="QUÉT MÃ VẬN ĐƠN VÀO ĐÂY..." 
                ref="barcodeRef"
                :disabled="!isBagLocked || loading"
                @keyup.enter="handleScan"
                class="modern-scanner-input"
             >
                <template #prefix><el-icon class="scanner-icon"><Scan /></el-icon></template>
                <template #append>
                   <button class="btn-scan" @click="handleScan" :disabled="!isBagLocked || loading">
                     <span>QUÉT</span>
                   </button>
                </template>
             </el-input>
             
             <!-- Overlay for un-locked state -->
             <div v-if="!isBagLocked" class="lock-overlay">
                <el-icon class="lock-icon"><Lock /></el-icon>
                <span>Vui lòng chọn Đích đến & Bắt đầu đóng túi trước khi quét</span>
             </div>
          </div>

          <!-- Items in Bag -->
          <div class="content-card compact-card list-card flex-fill bag-content-card">
             <div class="section-header text-success mb-4 flex-between">
                <div class="flex-center gap-2">
                  <el-icon><Box /></el-icon><span>Đơn đã cho vào túi</span>
                </div>
                <el-tag type="success" effect="light" round class="fw-bold">{{ itemsInBag.length }} đơn</el-tag>
             </div>
             
             <el-table 
                :data="itemsInBag" 
                class="modern-table compact-table highlight-table"
                height="450px"
             >
                <el-table-column type="index" width="50" align="center" label="#" />
                
                <el-table-column prop="barcode" label="Mã Vận đơn" min-width="140">
                  <template #default="{ row }">
                    <span class="code-badge success">{{ row.barcode }}</span>
                  </template>
                </el-table-column>
                
                <el-table-column prop="weight" label="Cân nặng" width="100" align="center">
                   <template #default="{ row }">
                     <span class="fw-bold text-dark">{{ row.weight }} kg</span>
                   </template>
                </el-table-column>
                
                <el-table-column label="Bỏ" width="70" align="center">
                   <template #default="{ row, $index }">
                      <button class="icon-btn delete small mx-auto" @click="removeItem($index, row)" title="Lấy ra khỏi túi">
                        <el-icon><Delete /></el-icon>
                      </button>
                   </template>
                </el-table-column>
                
                <template #empty>
                  <el-empty description="Túi đang trống" :image-size="80" />
                </template>
             </el-table>
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
import { ref, computed, onMounted, nextTick } from 'vue';
import { 
  Suitcase, Check, Delete, List, Plus, Refresh, Unlock, Box, 
  Lock, Location, Key, DataLine, LocationInformation, Loading,
  RefreshLeft
} from '@element-plus/icons-vue';
// Use Aim or Camera instead of Scan as we know Scan might be missing
import { Aim as Scan, CircleCheckFilled, WarningFilled, Clock } from '@element-plus/icons-vue';
import api from '@/api/axios';
import { ElMessage, ElMessageBox } from 'element-plus';

// --- TRẠNG THÁI (STATE) ---
const barcode = ref('');
const bagCode = ref('');
const destHubId = ref(null);
const isBagLocked = ref(false);
const loading = ref(false);
const loadingList = ref(false);
const itemsInBag = ref([]);
const availableWaybills = ref([]);
const hubs = ref([]);

const barcodeRef = ref(null);
const beepOk = ref(null);
const beepError = ref(null);

const currentHubId = computed(() => {
  try {
    const token = localStorage.getItem('token');
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.primary_hub_id || null;
  } catch { return null; }
});

const totalWeight = computed(() => {
  return itemsInBag.value.reduce((sum, item) => sum + (item.weight || 0), 0);
});

// --- HÀM XỬ LÝ LÕI ---

const fetchAvailableWaybills = async () => {
  loadingList.value = true;
  try {
    const myHubId = Number(currentHubId.value); 

    const res = await api.post('/api/waybills/search', {
      status: 'IN_HUB',
      origin_hub_id: myHubId, 
      page: 1, 
      size: 200 
    });
    
    const inBagCodes = itemsInBag.value.map(i => i.barcode);
    
    availableWaybills.value = (res.data.items || []).filter(w => {
      const isNotInBag = !inBagCodes.includes(w.waybill_code);
      const isAtMyHub = Number(w.origin_hub_id) === myHubId;
      const isNotDestinedForHere = Number(w.dest_hub_id) !== myHubId;
      return isNotInBag && isAtMyHub && isNotDestinedForHere;
    });

  } catch (err) {
    ElMessage.error('Không tải được danh sách đơn hàng chờ');
  } finally {
    loadingList.value = false;
  }
};

const lockBag = () => {
  if (!destHubId.value) return ElMessage.warning('Vui lòng chọn bưu cục đích');
  isBagLocked.value = true;
  nextTick(() => barcodeRef.value?.focus());
};

const handleAddWaybill = async (waybill, isFromList = false) => {
  if (!isBagLocked.value) {
    if (!isFromList) barcode.value = '';
    return ElMessage.warning('Vui lòng KHÓA TÚI ở cột bên trái trước khi thêm đơn!');
  }

  const code = waybill.waybill_code;

  if (itemsInBag.value.some(i => i.barcode === code)) {
    playError();
    if (!isFromList) barcode.value = '';
    return ElMessage.warning('Đơn này đã có trong túi!');
  }

  if (waybill.status !== 'IN_HUB') {
    playError();
    if (!isFromList) barcode.value = '';
    return ElMessage.error(`Đơn ${code} đang ở trạng thái ${waybill.status}, không thể đóng túi!`);
  }

  // --- CHẶN VERIFY: Đơn phải được CSKH xác thực trước khi đóng túi ---
  if (!waybill.verify_status || waybill.verify_status !== 'VERIFIED') {
    playError();
    if (!isFromList) barcode.value = '';
    ElMessageBox.alert(
      `<div style="text-align: center;">
         <span style="font-size: 48px; color: #EE5D50; margin-bottom: 12px; display: inline-block;">⚠️</span><br>
         <b style="font-size: 18px; color: #EE5D50;">Lỗi: Đơn hàng chưa được xác thực (VERIFY). Không thể xuất kho!</b><br>
         <span style="font-size: 14px; color: #4B5563; margin-top: 8px; display: inline-block;">
           Trạng thái xác thực hiện tại của đơn <b>${code}</b>: 
           <b style="color: #EE5D50;">${waybill.verify_status || 'CHƯA CÓ'}</b><br>
           Vui lòng yêu cầu bộ phận CSKH xác thực ảnh bill trước khi đóng túi.
         </span>
       </div>`,
      'LỖI XÁC THỰC BILL',
      { dangerouslyUseHTMLString: true, type: 'error', customClass: 'modern-message-box' }
    );
    return;
  }
  // --- KẾT THÚC CHẶN VERIFY ---

  const packageLocationId = waybill.current_hub_id || waybill.origin_hub_id;
  if (currentHubId.value && packageLocationId && packageLocationId !== currentHubId.value) {
    playError();
    if (!isFromList) barcode.value = '';
    return ElMessage.error(`CẢNH BÁO: Đơn ${code} không có mặt tại bưu cục của bạn!`);
  }

  if (waybill.dest_hub_id !== destHubId.value) {
    playError(); 
    try {
      const targetHubName = waybill.dest_hub?.hub_name || `Bưu cục #${waybill.dest_hub_id}`;
      await ElMessageBox.confirm(
        `Đơn hàng <b>${code}</b> có đích đến là <b>${targetHubName}</b>, KHÁC với bưu cục đích của túi hiện tại.<br><br>Bạn có chắc chắn muốn cho vào túi này không?`,
        'CẢNH BÁO LỆCH TUYẾN',
        { 
          confirmButtonText: 'Vẫn thêm vào túi', 
          cancelButtonText: 'Hủy, không thêm', 
          type: 'warning', 
          dangerouslyUseHTMLString: true,
          customClass: 'modern-message-box'
        }
      );
    } catch {
      if (!isFromList) {
        barcode.value = '';
        nextTick(() => barcodeRef.value?.focus());
      }
      return; 
    }
  }

  playOk();
  itemsInBag.value.unshift({
    barcode: code,
    receiver_name: waybill.receiver_name,
    weight: waybill.actual_weight || 0.5
  });
  
  availableWaybills.value = availableWaybills.value.filter(w => w.waybill_code !== code);
  
  if (!isFromList) {
    barcode.value = '';
    nextTick(() => barcodeRef.value?.focus());
  }
};

const handleScan = async () => {
  const code = barcode.value.trim();
  if (!code) return;

  loading.value = true;
  try {
    const res = await api.post('/api/waybills/search', {
      waybill_code: code,
      page: 1, size: 1
    });

    const waybill = res.data.items && res.data.items.length > 0 ? res.data.items[0] : null;

    if (waybill) {
      await handleAddWaybill(waybill, false);
    } else {
      playError();
      ElMessage.error('Không tìm thấy mã vận đơn.');
      barcode.value = '';
      nextTick(() => barcodeRef.value?.focus());
    }
  } catch (err) {
    playError();
    ElMessage.error('Lỗi khi truy vấn vận đơn.');
    barcode.value = '';
  } finally {
    loading.value = false;
  }
};

const removeItem = (idx, row) => {
  itemsInBag.value.splice(idx, 1);
  fetchAvailableWaybills(); 
};

const playOk = () => { beepOk.value?.play().catch(() => {}) };
const playError = () => { beepError.value?.play().catch(() => {}) };

const confirmBagging = async () => {
  if (itemsInBag.value.length === 0) return ElMessage.warning('Hãy quét ít nhất 1 đơn.');
  
  loading.value = true;
  try {
    const payload = {
      bag_code: String(bagCode.value).trim(),
      destination_hub_id: Number(destHubId.value), 
      waybill_codes: itemsInBag.value.map(i => i.barcode)
    };

    const res = await api.post('/api/scans/bagging', payload);
    const realBagCode = res.data.bag_code; 
    
    ElMessageBox.alert(
      `<div style="text-align: center;">
         <span style="font-size: 14px; color: #4B5563;">Đóng túi thành công!<br>Mã túi của bạn là:</span><br>
         <b style="font-size: 28px; color: #4318FF; display: block; margin-top: 12px; letter-spacing: 2px; font-family: monospace; background: #F4F7FE; padding: 12px; border-radius: 12px;">${realBagCode}</b>
       </div>`, 
      'Hoàn tất', 
      { dangerouslyUseHTMLString: true, type: 'success', customClass: 'modern-message-box' }
    );

    resetSession();
    fetchAvailableWaybills(); 
  } catch (err) {
    const errorDetail = err.response?.data?.detail;
    const errorStr = Array.isArray(errorDetail) ? errorDetail[0].msg : (errorDetail || 'Lỗi khi đóng túi.');
    if (err.response?.status === 400 && (errorStr.includes('xác thực') || errorStr.includes('VERIFY'))) {
        playError();
        ElMessageBox.alert(
          `<div style="text-align: center;">
             <span style="font-size: 48px; color: #EE5D50; margin-bottom: 12px; display: inline-block;">⚠️</span><br>
             <b style="font-size: 18px; color: #EE5D50;">Lỗi: Đơn hàng chưa được xác thực (VERIFY). Không thể xuất kho!</b><br>
             <span style="font-size: 14px; color: #4B5563; margin-top: 8px; display: inline-block;">${errorStr}</span>
           </div>`, 
          'LỖI XÁC THỰC', 
          { dangerouslyUseHTMLString: true, type: 'error', customClass: 'modern-message-box' }
        );
    } else {
        playError();
        ElMessage.error(errorStr);
    }
  } finally {
    loading.value = false;
  }
};

const resetSession = () => {
  bagCode.value = '';
  destHubId.value = null;
  itemsInBag.value = [];
  isBagLocked.value = false;
};

// --- KHỞI TẠO (MOUNT) ---
onMounted(async () => {
  fetchAvailableWaybills(); 
  
  try {
    const res = await api.get('/api/hubs');
    hubs.value = res.data.items || res.data || [];
  } catch (err) {
    console.error('Không nạp được danh sách bưu cục');
  }
});
</script>

<style scoped src="@/styles/admin/warehouse/Bagging.css"></style>