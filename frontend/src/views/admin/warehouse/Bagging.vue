<template>
  <div class="bagging-page">
    <div class="page-header flex-between mb-4">
      <div class="title-section">
        <h2 class="misa-title">Đóng túi (Bagging)</h2>
        <p class="text-muted">Gom nhiều vận đơn vào một túi để vận chuyển liên tỉnh</p>
      </div>
      <div class="actions">
        <el-button type="primary" :icon="Check" @click="confirmBagging" :loading="loading" size="large">Hoàn tất Đóng túi</el-button>
        <el-button @click="resetSession" size="large">Hủy & Đóng lại</el-button>
      </div>
    </div>

    <el-row :gutter="20">
      
      <el-col :span="6">
        <el-card class="bag-config mb-4" shadow="hover">
           <template #header><div class="card-header"><el-icon><Suitcase /></el-icon> Thông tin Túi</div></template>
           <el-form label-position="top">
              <el-form-item label="Mã số Túi (Để trống nếu muốn tự tạo)" required>
                 <el-input 
                    v-model="bagCode" 
                    placeholder="Để trống để hệ thống tự tạo" 
                    prefix-icon="Message"
                    size="large"
                    :disabled="isBagLocked"
                 />
              </el-form-item>
              
              <el-form-item label="Bưu cục Đích (Điểm đến)" required>
                 <el-select v-model="destHubId" placeholder="Chọn BC đích" class="w-full" size="large" :disabled="isBagLocked" filterable>
                    <el-option v-for="hub in hubs" :key="hub.hub_id" :label="`${hub.hub_code} - ${hub.hub_name}`" :value="hub.hub_id" />
                 </el-select>
              </el-form-item>

              <el-button v-if="!isBagLocked" type="primary" class="w-full font-bold" size="large" @click="lockBag" :disabled="!destHubId">
                BẮT ĐẦU ĐÓNG TÚI
              </el-button>
              <el-button v-else type="warning" plain class="w-full" @click="isBagLocked = false">
                <el-icon class="mr-2"><Unlock /></el-icon> Mở khóa để sửa thông tin
              </el-button>
           </el-form>
        </el-card>

        <el-card class="summary-card" shadow="never">
           <div class="stat-row">
              <span>Tổng số đơn:</span>
              <span class="value font-bold text-primary">{{ itemsInBag.length }}</span>
           </div>
           <el-divider class="my-2" />
           <div class="stat-row total">
              <span>Ước tính (kg):</span>
              <span class="value">{{ totalWeight.toFixed(2) }} kg</span>
           </div>
        </el-card>
      </el-col>
      
      <el-col :span="9">
        <el-card class="list-card border-dashed" shadow="never">
           <template #header>
              <div class="card-header flex-between">
                 <span><el-icon><List /></el-icon> Đơn đang chờ tại kho</span>
                 <el-button size="small" circle :icon="Refresh" @click="fetchAvailableWaybills" :loading="loadingList"></el-button>
              </div>
           </template>
           
           <el-table :data="availableWaybills" v-loading="loadingList" stripe empty-text="Không có đơn nào chờ đóng túi" height="520px" size="small">
              <el-table-column prop="waybill_code" label="Mã Vận đơn" width="130">
                 <template #default="{ row }">
                   <span class="font-bold">{{ row.waybill_code }}</span>
                 </template>
              </el-table-column>
              <el-table-column label="BC Đích" min-width="120" show-overflow-tooltip>
                 <template #default="{ row }">
                   <span :class="{'text-danger font-bold': isBagLocked && row.dest_hub_id !== destHubId}">
                     {{ row.dest_hub?.hub_name || 'Không rõ' }}
                   </span>
                 </template>
              </el-table-column>
              <el-table-column label="Thêm" width="70" align="center">
                 <template #default="{ row }">
                    <el-button type="primary" plain size="small" circle :icon="Plus" @click="handleAddWaybill(row, true)" :disabled="!isBagLocked"></el-button>
                 </template>
              </el-table-column>
           </el-table>
        </el-card>
      </el-col>

      <el-col :span="9">
        <el-card class="scan-area mb-4" shadow="hover" :body-style="{ padding: '15px' }">
           <el-input 
              v-model="barcode" 
              placeholder="QUÉT MÃ VẬN ĐƠN VÀO ĐÂY..." 
              ref="barcodeRef"
              :disabled="!isBagLocked || loading"
              @keyup.enter="handleScan"
              size="large"
              class="scan-input"
           >
              <template #append>
                 <el-button @click="handleScan" type="success" :icon="Select" class="font-bold">QUÉT</el-button>
              </template>
           </el-input>
           <div v-if="!isBagLocked" class="lock-overlay text-danger font-bold">
              VUI LÒNG CHỌN ĐÍCH ĐẾN & KHÓA TÚI TRƯỚC KHI QUÉT
           </div>
        </el-card>

        <el-card class="list-card bg-success-light" shadow="never">
           <template #header>
              <div class="card-header text-success">
                <el-icon><Box /></el-icon> Đã cho vào túi ({{ itemsInBag.length }})
              </div>
           </template>
           <el-table :data="itemsInBag" empty-text="Túi đang trống" height="400px" size="small">
              <el-table-column type="index" width="50" align="center" />
              <el-table-column prop="barcode" label="Mã Vận đơn" min-width="140" class-name="font-bold text-primary" />
              <el-table-column prop="weight" label="Cân nặng" width="90" align="center">
                 <template #default="{ row }">{{ row.weight }}kg</template>
              </el-table-column>
              <el-table-column label="Bỏ" width="60" align="center">
                 <template #default="{ row, $index }">
                    <el-button type="danger" text @click="removeItem($index, row)" circle><el-icon><Delete /></el-icon></el-button>
                 </template>
              </el-table-column>
           </el-table>
        </el-card>
      </el-col>

    </el-row>

    <audio ref="beepOk" src="https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3"></audio>
    <audio ref="beepError" src="https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3"></audio>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue';
import { Suitcase, Check, Delete, Message, List, Plus, Refresh, Unlock, Box, Select } from '@element-plus/icons-vue';
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
    const myHubId = Number(currentHubId.value); // Lấy ID bưu cục của tài khoản đang đăng nhập

    // Gọi API tìm kiếm
    const res = await api.post('/api/waybills/search', {
      status: 'IN_HUB',
      origin_hub_id: myHubId, // Ép Backend ưu tiên tìm đơn xuất phát từ đây
      page: 1, 
      size: 200 
    });
    
    // Danh sách mã đơn đã nằm trong túi
    const inBagCodes = itemsInBag.value.map(i => i.barcode);
    
    // --- BỘ LỌC KÉP FRONTEND (Khắc phục triệt để hiển thị sai) ---
    availableWaybills.value = (res.data.items || []).filter(w => {
      const isNotInBag = !inBagCodes.includes(w.waybill_code);
      
      // Điều kiện 1: Đơn hàng phải XUẤT PHÁT từ bưu cục hiện tại
      const isAtMyHub = Number(w.origin_hub_id) === myHubId;
      
      // Điều kiện 2: Đích đến PHẢI KHÁC bưu cục hiện tại (Để tránh đem đơn nội tỉnh ra đóng túi)
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

// Hàm xử lý gộp chung cho cả "Bấm nút Thêm" và "Quét Súng"
const handleAddWaybill = async (waybill, isFromList = false) => {
  if (!isBagLocked.value) {
    if (!isFromList) barcode.value = '';
    return ElMessage.warning('Vui lòng KHÓA TÚI ở cột bên trái trước khi thêm đơn!');
  }

  const code = waybill.waybill_code;

  // 1. Kiểm tra trùng lặp
  if (itemsInBag.value.some(i => i.barcode === code)) {
    playError();
    if (!isFromList) barcode.value = '';
    return ElMessage.warning('Đơn này đã có trong túi!');
  }

  // 2. Kiểm tra trạng thái IN_HUB
  if (waybill.status !== 'IN_HUB') {
    playError();
    if (!isFromList) barcode.value = '';
    return ElMessage.error(`Đơn ${code} đang ở trạng thái ${waybill.status}, không thể đóng túi!`);
  }

  // 3. Kiểm tra bảo mật (Phải nằm đúng bưu cục hiện tại)
  const packageLocationId = waybill.current_hub_id || waybill.origin_hub_id; 
  if (currentHubId.value && packageLocationId && packageLocationId !== currentHubId.value) {
    playError();
    if (!isFromList) barcode.value = '';
    return ElMessage.error(`CẢNH BÁO: Đơn ${code} không có mặt tại bưu cục của bạn!`);
  }

  // 4. KIỂM TRA LỆCH TUYẾN (Cảnh báo nhầm bưu cục đích)
  if (waybill.dest_hub_id !== destHubId.value) {
    playError(); // Phát tiếng bíp lỗi để gây sự chú ý
    try {
      const targetHubName = waybill.dest_hub?.hub_name || `Bưu cục #${waybill.dest_hub_id}`;
      await ElMessageBox.confirm(
        `Đơn hàng <b>${code}</b> có đích đến là <b>${targetHubName}</b>, KHÁC với bưu cục đích của túi hiện tại.<br><br>Bạn có chắc chắn muốn cho vào túi này không?`,
        'CẢNH BÁO LỆCH TUYẾN',
        { 
          confirmButtonText: 'Vẫn thêm vào túi', 
          cancelButtonText: 'Hủy, không thêm', 
          type: 'warning', 
          dangerouslyUseHTMLString: true 
        }
      );
    } catch {
      // Người dùng chọn Hủy
      if (!isFromList) {
        barcode.value = '';
        nextTick(() => barcodeRef.value?.focus());
      }
      return; // Dừng lại, không thêm vào túi
    }
  }

  // 5. Nếu thỏa mãn mọi thứ (Hoặc đã đồng ý cảnh báo) -> Thêm vào túi
  playOk();
  itemsInBag.value.unshift({
    barcode: code,
    receiver_name: waybill.receiver_name,
    weight: waybill.actual_weight || 0.5
  });
  
  // Xóa khỏi danh sách chờ
  availableWaybills.value = availableWaybills.value.filter(w => w.waybill_code !== code);
  
  if (!isFromList) {
    barcode.value = '';
    nextTick(() => barcodeRef.value?.focus());
  }
};

// Xử lý riêng cho trường hợp quét mã vạch
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
  fetchAvailableWaybills(); // Tải lại danh sách để hiện đơn hàng đó trở lại
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
    
    const realBagCode = res.data.bag_code; // Mã thật do Backend tạo ra
    
    // Popup mã túi to, trực quan
    ElMessageBox.alert(
      `<div style="text-align: center; font-size: 16px;">
         Đóng túi thành công!<br>Mã túi của bạn là:<br>
         <b style="font-size: 26px; color: #409EFF; display: block; margin-top: 10px; letter-spacing: 1px;">${realBagCode}</b>
       </div>`, 
      'Hoàn tất', 
      { dangerouslyUseHTMLString: true, type: 'success' }
    );

    resetSession();
    fetchAvailableWaybills(); 
  } catch (err) {
    const errorDetail = err.response?.data?.detail;
    if (Array.isArray(errorDetail)) {
        ElMessage.error(`Lỗi dữ liệu: ${errorDetail[0].msg}`);
    } else {
        ElMessage.error(errorDetail || 'Lỗi khi đóng túi.');
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
.flex-between { display: flex; justify-content: space-between; align-items: center; }
.w-full { width: 100%; }
.mb-4 { margin-bottom: 1rem; }
.my-2 { margin: 0.5rem 0; }
.font-bold { font-weight: 700; }
.text-danger { color: #F56C6C; }
.text-success { color: #67C23A; }
.text-primary { color: #409EFF; }
.mr-2 { margin-right: 8px; }

/* Cards & Headers */
.card-header { display: flex; align-items: center; gap: 8px; font-weight: 700; color: #374151; font-size: 15px; }
.border-dashed { border: 1px dashed #dcdfe6; }
.bg-success-light { background-color: #f0fdf4; border-color: #bbf7d0; }

/* Tùy chỉnh input quét mã */
.scan-area { position: relative; }
.scan-input :deep(.el-input__inner) { 
  font-size: 1.3rem; height: 50px; letter-spacing: 1px; text-align: center; font-weight: 800; color: #409EFF; 
}
.lock-overlay {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(2px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
  border-radius: 8px;
}

/* Thống kê */
.stat-row { display: flex; justify-content: space-between; font-size: 1rem; color: #4B5563; }
.stat-row.total { font-weight: 800; color: #111827; font-size: 1.15rem; }

/* Bảng Table */
:deep(.el-table) { border-radius: 6px; }
</style>