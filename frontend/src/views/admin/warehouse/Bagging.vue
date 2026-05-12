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
              
              <el-table-column label="Thêm" width="70" align="center" fixed="right">
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
                
                <el-table-column label="Bỏ" width="70" align="center" fixed="right">
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

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

/* Base Layout */
.modern-bagging-page {
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
.gap-2 { gap: 8px; }
.w-full { width: 100%; }
.mb-4 { margin-bottom: 16px; }
.mb-8 { margin-bottom: 8px; }
.mb-12 { margin-bottom: 12px; }
.mt-4 { margin-top: 16px; }
.mr-1 { margin-right: 4px; }
.mr-2 { margin-right: 8px; }
.fw-bold { font-weight: 700; }
.text-dark { color: #1B2559; }
.text-danger { color: #EE5D50; }
.text-success { color: #05CD99; }
.text-primary { color: #4318FF; }

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

.header-actions { display: flex; gap: 12px; }

/* Buttons */
.btn-primary { background: #4318FF; color: white; border: none; padding: 12px 24px; border-radius: 10px; font-weight: 700; font-size: 14px; display: inline-flex; align-items: center; gap: 8px; cursor: pointer; transition: all 0.3s ease; box-shadow: 0 4px 15px rgba(67, 24, 255, 0.25); }
.btn-primary:hover:not(:disabled) { background: #3311DB; transform: translateY(-2px); }
.btn-secondary { background: #FFFFFF; color: #2B3674; border: 1px solid #E2E8F0; padding: 12px 24px; border-radius: 10px; font-weight: 700; font-size: 14px; display: inline-flex; align-items: center; gap: 8px; cursor: pointer; transition: all 0.3s ease; }
.btn-secondary:hover:not(:disabled) { background: #F8FAFC; border-color: #A3AED0; }
.btn-warning-outline { background: transparent; color: #FFB547; border: 1px solid #FFB547; padding: 10px 20px; border-radius: 10px; font-weight: 700; font-size: 14px; display: inline-flex; align-items: center; gap: 8px; cursor: pointer; transition: 0.3s; }
.btn-warning-outline:hover { background: rgba(255, 181, 71, 0.1); }
button:disabled { opacity: 0.7; cursor: not-allowed; }

.lg-btn { padding: 14px 20px; font-size: 15px; }

.icon-btn { width: 32px; height: 32px; border-radius: 8px; border: none; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s; font-size: 16px; }
.icon-btn.small { width: 28px; height: 28px; font-size: 14px; }
.icon-btn.primary { background: rgba(67, 24, 255, 0.1); color: #4318FF; }
.icon-btn.primary:hover:not(:disabled) { background: #4318FF; color: white; }
.icon-btn.secondary { background: #F4F7FE; color: #8F9BBA; }
.icon-btn.secondary:hover:not(:disabled) { background: #4318FF; color: white; }
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
.section-header .el-icon { color: #4318FF; font-size: 18px; }
.section-header.text-success { color: #05CD99; }
.section-header.text-success .el-icon { color: #05CD99; }

/* Config Card */
.config-card.is-locked { border: 2px solid #05CD99; background: #F0FDF4; }

:deep(.modern-form .el-form-item__label) { font-weight: 700; color: #2B3674; margin-bottom: 8px; font-size: 13px; }
:deep(.modern-form .el-input__wrapper),
:deep(.modern-select .el-input__wrapper) { background: #F8FAFC; box-shadow: 0 0 0 1px #E2E8F0 inset !important; border-radius: 10px; padding: 10px 12px; transition: all 0.3s; }
:deep(.modern-form .el-input__wrapper:hover),
:deep(.modern-select .el-input__wrapper:hover) { box-shadow: 0 0 0 1px #4318FF inset !important; }
:deep(.modern-form .el-input__wrapper.is-focus),
:deep(.modern-select .el-input__wrapper.is-focus) { box-shadow: 0 0 0 2px rgba(67, 24, 255, 0.2) inset !important; background: #FFFFFF; }
:deep(.modern-form .el-input.is-disabled .el-input__wrapper) { background: #E9EDF7; box-shadow: none !important; }

/* Code Input specific */
:deep(.code-input .el-input__inner) { font-family: monospace; font-size: 15px; font-weight: 700; letter-spacing: 1px; color: #4318FF; }

/* Summary Stats */
.summary-card { background: #F8FAFC; border: none; }
.stat-container { display: flex; flex-direction: column; gap: 12px; }
.stat-box { display: flex; justify-content: space-between; align-items: center; }
.stat-label { font-size: 14px; font-weight: 600; color: #8F9BBA; }
.stat-value-group { display: flex; align-items: baseline; gap: 4px; }
.stat-value { font-size: 24px; font-weight: 800; color: #1B2559; }
.stat-unit { font-size: 13px; font-weight: 700; color: #A3AED0; }
.stat-divider { height: 1px; background-image: linear-gradient(to right, #E2E8F0 50%, transparent 50%); background-size: 8px 1px; background-repeat: repeat-x; margin: 4px 0; }

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

/* Highlight newly added row */
:deep(.highlight-table .el-table__row:first-child) { background-color: rgba(5, 205, 153, 0.05) !important; }

.code-badge { font-family: monospace; font-weight: 800; padding: 4px 8px; border-radius: 6px; font-size: 13px; display: inline-block; }
.code-badge.default { background: #F4F7FE; color: #4318FF; }
.code-badge.success { background: rgba(5, 205, 153, 0.1); color: #05CD99; font-size: 14px; }

.verify-badge { font-size: 10px; font-weight: 800; text-transform: uppercase; padding: 2px 6px; border-radius: 4px; display: inline-flex; align-items: center; gap: 2px; width: fit-content; }
.verify-badge.verified { background: rgba(5, 205, 153, 0.1); color: #05CD99; }
.verify-badge.mismatch { background: rgba(238, 93, 80, 0.1); color: #EE5D50; }
.verify-badge.pending { background: rgba(255, 181, 71, 0.1); color: #FFB547; }

.dest-info { display: flex; align-items: center; font-size: 13px; color: #4B5563; }

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
  height: 50px; font-size: 20px; text-align: center; font-weight: 800; color: #4318FF; font-family: monospace; letter-spacing: 2px;
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