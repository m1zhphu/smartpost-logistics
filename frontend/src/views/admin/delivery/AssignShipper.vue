<template>
  <div class="modern-assign-page">
    <div class="page-container">

      <!-- Header Section -->
      <header class="page-header animate-fade-in">
        <div class="header-content">
          <div class="title-wrapper">
            <div class="icon-box primary">
              <el-icon><Bicycle /></el-icon>
            </div>
            <div>
              <h2 class="page-title">Phân công Shipper</h2>
              <p class="page-subtitle">Giao đơn hàng cho từng shipper đi giao tuyến cuối</p>
            </div>
          </div>
        </div>
        <div class="header-actions">
          <button 
            class="btn-primary" 
            @click="submitAssignments" 
            :disabled="assignments.length === 0 || submitting"
          >
            <el-icon class="is-loading mr-2" v-if="submitting"><Loading /></el-icon>
            <el-icon v-else><Check /></el-icon>
            <span>Xác nhận Phân công ({{ assignments.length }} đơn)</span>
          </button>
        </div>
      </header>

      <!-- Main Layout: 2 Columns -->
      <el-row :gutter="24" class="form-row-container animate-fade-in-up">
        
        <!-- COLUMN 1: Pending Waybills (60%) -->
        <el-col :span="14" class="column-layout">
          <div class="content-card compact-card list-card flex-fill">
            
            <div class="section-header flex-between mb-4">
              <div class="flex-center gap-2">
                <el-icon class="text-warning"><List /></el-icon>
                <span>Vận đơn chờ phân công</span>
              </div>
              
              <div class="search-wrapper">
                <el-input 
                  v-model="search" 
                  placeholder="Tìm mã, tên, SĐT..." 
                  class="modern-input-small"
                  clearable 
                >
                  <template #prefix><el-icon><Search /></el-icon></template>
                </el-input>
              </div>
            </div>

            <el-table
              :data="filteredWaybills"
              v-loading="loading"
              @selection-change="handleSelection"
              class="modern-table compact-table borderless"
              height="600px"
              ref="tableRef"
            >
              <el-table-column type="selection" width="50" align="center" />
              
              <el-table-column prop="waybill_code" label="Mã Vận Đơn" width="140">
                <template #default="{ row }">
                  <span class="code-badge default">{{ row.waybill_code }}</span>
                </template>
              </el-table-column>
              
              <el-table-column label="Thông tin Nhận" min-width="180" show-overflow-tooltip>
                <template #default="{ row }">
                  <div class="recipient-info">
                    <span class="fw-bold text-dark">{{ row.receiver_name }}</span>
                    <span class="text-xs text-muted"><el-icon class="mr-1"><Phone /></el-icon>{{ row.receiver_phone }}</span>
                  </div>
                </template>
              </el-table-column>
              
              <el-table-column prop="receiver_address" label="Địa chỉ" min-width="160" show-overflow-tooltip>
                <template #default="{ row }">
                  <span class="address-text">
                    <el-icon class="mr-1"><Location /></el-icon>{{ row.receiver_address }}
                  </span>
                </template>
              </el-table-column>
              
              <el-table-column label="Thu hộ (COD)" width="120" align="right">
                <template #default="{ row }">
                  <span class="fw-bold text-danger">
                    {{ row.cod_amount ? row.cod_amount.toLocaleString() + ' đ' : '0 đ' }}
                  </span>
                </template>
              </el-table-column>
              
              <template #empty>
                <el-empty description="Không có đơn nào chờ phân công" :image-size="80" />
              </template>
            </el-table>

          </div>
        </el-col>

        <!-- COLUMN 2: Shipper Selection & Assignment List (40%) -->
        <el-col :span="10" class="column-layout">
          
          <!-- Shipper Selection Block -->
          <div class="content-card compact-card assign-card mb-20">
            <div class="section-header text-primary mb-3">
              <el-icon><UserFilled /></el-icon><span>Chọn Shipper Phụ trách</span>
            </div>
            
            <el-select 
              v-model="selectedShipperId" 
              placeholder="Tìm kiếm và chọn Shipper..." 
              filterable 
              class="w-full modern-select mb-3"
            >
              <template #prefix><el-icon><User /></el-icon></template>
              <el-option
                v-for="s in shippers"
                :key="s.user_id"
                :label="`${s.full_name} - ${s.primary_hub?.hub_name || 'Bưu cục'}`"
                :value="s.user_id"
              >
                <div class="shipper-option">
                  <span class="fw-bold">{{ s.full_name }}</span>
                  <span class="text-xs text-muted">{{ s.primary_hub?.hub_name || 'Bưu cục' }}</span>
                </div>
              </el-option>
            </el-select>
            
            <button
              class="btn-primary w-full justify-center"
              :disabled="!selectedShipperId || selectedRows.length === 0"
              @click="addToAssignment"
            >
              <el-icon><Right /></el-icon> 
              <span>Gán {{ selectedRows.length }} đơn đang chọn cho Shipper này</span>
            </button>
          </div>

          <!-- Active Assignment List Block -->
          <div class="content-card compact-card flex-fill assignment-list-card">
            <div class="section-header text-success mb-4 flex-between">
               <div class="flex-center gap-2">
                 <el-icon><Notebook /></el-icon><span>Danh sách Tạm phân công</span>
               </div>
               <el-tag type="success" effect="light" round class="fw-bold px-3">{{ assignments.length }} đơn</el-tag>
            </div>
            
            <div class="assignment-scroll-area">
              <el-empty v-if="assignments.length === 0" :image-size="80" description="Chưa có đơn nào được phân công" />

              <div v-for="(group, shipperId) in groupedAssignments" :key="shipperId" class="shipper-group-box mb-3">
                <div class="shipper-group-header">
                  <div class="shipper-name">
                    <div class="avatar-sm"><el-icon><User /></el-icon></div>
                    <span>{{ group.shipperName }}</span>
                  </div>
                  <div class="modern-tag tag-primary">
                    <span class="dot"></span> {{ group.waybills.length }} đơn
                  </div>
                </div>
                
                <div class="chips-container">
                  <div v-for="w in group.waybills" :key="w.waybill_code" class="waybill-chip">
                    <span class="code">{{ w.waybill_code }}</span>
                    <button class="chip-remove" @click="removeAssignment(w.waybill_code)">
                      <el-icon><Close /></el-icon>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </el-col>
      </el-row>

    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { 
  Check, User, Plus, Close, Search, Bicycle, List, 
  Phone, Location, UserFilled, Right, Notebook, Loading 
} from '@element-plus/icons-vue';
import api from '@/api/axios';
import { ElMessage, ElMessageBox } from 'element-plus';

const loading = ref(false);
const submitting = ref(false);
const search = ref('');
const waybills = ref([]);
const shippers = ref([]);
const selectedShipperId = ref(null);
const selectedRows = ref([]);
const assignments = ref([]);
const tableRef = ref(null);

const filteredWaybills = computed(() => {
  const q = search.value.toLowerCase();
  return waybills.value.filter(w =>
    !assignments.value.find(a => a.waybill_code === w.waybill_code) &&
    (w.waybill_code?.toLowerCase().includes(q) || w.receiver_phone?.includes(q) || w.receiver_name?.toLowerCase().includes(q))
  );
});

const groupedAssignments = computed(() => {
  const groups = {};
  for (const a of assignments.value) {
    if (!groups[a.shipper_id]) {
      groups[a.shipper_id] = { shipperName: a.shipper_name, waybills: [] };
    }
    groups[a.shipper_id].waybills.push(a);
  }
  return groups;
});

const handleSelection = (rows) => {
  selectedRows.value = rows;
};

const addToAssignment = () => {
  if (!selectedShipperId.value) return;
  
  const shipper = shippers.value.find(s => s.user_id === selectedShipperId.value);
  
  selectedRows.value.forEach(row => {
    if (!assignments.value.find(a => a.waybill_code === row.waybill_code)) {
      assignments.value.push({
        waybill_code: row.waybill_code,
        shipper_id: selectedShipperId.value,
        shipper_name: shipper?.full_name || 'N/A'
      });
    }
  });
  
  tableRef.value?.clearSelection();
  ElMessage.success(`Đã tạm gán đơn cho ${shipper?.full_name}`);
};

const removeAssignment = (code) => {
  assignments.value = assignments.value.filter(a => a.waybill_code !== code);
};

const submitAssignments = async () => {
  try {
    await ElMessageBox.confirm(
      `Xác nhận chuyển <strong>${assignments.value.length}</strong> đơn hàng cho các Shipper đã chọn đi giao?`,
      'Xác nhận phân công',
      { 
        type: 'warning', 
        confirmButtonText: 'Đồng ý',
        cancelButtonText: 'Hủy bỏ',
        dangerouslyUseHTMLString: true,
        customClass: 'modern-message-box'
      }
    );

    submitting.value = true;
    const byShipper = {};
    assignments.value.forEach(a => {
      if (!byShipper[a.shipper_id]) byShipper[a.shipper_id] = [];
      byShipper[a.shipper_id].push(a.waybill_code);
    });
    
    const promises = Object.entries(byShipper).map(([shipperId, codes]) => 
      api.post('/api/delivery/assign-shipper', {
        shipper_id: parseInt(shipperId),
        waybill_codes: codes
      })
    );

    await Promise.all(promises);
    
    ElMessage.success('Phân công thành công. Trạng thái các đơn đã chuyển sang [Đang đi giao]');
    assignments.value = [];
    fetchData(); 
  } catch (err) {
    if (err !== 'cancel') {
      ElMessage.error(err.response?.data?.detail || 'Lỗi khi kết nối máy chủ');
    }
  } finally {
    submitting.value = false;
  }
};

const fetchData = async () => {
  loading.value = true;
  try {
    const wRes = await api.get('/api/delivery/pending-assign');
    waybills.value = wRes.data.items || wRes.data || [];

    const sRes = await api.get('/api/users/shippers');
    shippers.value = Array.isArray(sRes.data) ? sRes.data : [];
  } catch (err) {
    ElMessage.error('Không thể tải danh sách vận đơn chờ phân công');
  } finally {
    loading.value = false;
  }
};

onMounted(fetchData);
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

/* Base Layout */
.modern-assign-page {
  min-height: calc(100vh - 64px);
  background-color: #F4F7FE; /* Light SaaS background */
  font-family: 'Plus Jakarta Sans', sans-serif;
  color: #2B3674;
  padding: 24px;
}

.page-container {
  max-width: 1500px;
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
.mb-3 { margin-bottom: 12px; }
.mb-20 { margin-bottom: 20px; }
.mr-1 { margin-right: 4px; }
.mr-2 { margin-right: 8px; }
.px-3 { padding-left: 12px; padding-right: 12px; }
.fw-bold { font-weight: 700; }
.text-dark { color: #1B2559; }
.text-muted { color: #A3AED0; }
.text-danger { color: #EE5D50; }
.text-warning { color: #FFB547; }
.text-success { color: #05CD99; }
.text-primary { color: #4318FF; }
.text-xs { font-size: 12px; }

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
button:disabled { opacity: 0.7; cursor: not-allowed; }

/* Layout Columns */
.form-row-container { display: flex; align-items: stretch; }
.column-layout { display: flex; flex-direction: column; }
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
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.section-header .el-icon { font-size: 18px; }
.section-header.text-primary { color: #4318FF; }
.section-header.text-warning { color: #FFB547; }
.section-header.text-success { color: #05CD99; }

/* Search Input inside Card */
.search-wrapper { width: 250px; }
:deep(.modern-input-small .el-input__wrapper) { background: #F8FAFC; box-shadow: none !important; border: 1px solid #E2E8F0; border-radius: 8px; padding: 4px 10px; transition: all 0.3s; }
:deep(.modern-input-small .el-input__wrapper:hover),
:deep(.modern-input-small .el-input__wrapper.is-focus) { border-color: #4318FF; background: #FFFFFF; }

/* Shipper Select */
:deep(.modern-select .el-input__wrapper) { background: #F8FAFC; box-shadow: 0 0 0 1px #E2E8F0 inset !important; border-radius: 10px; padding: 10px 12px; transition: all 0.3s; }
:deep(.modern-select .el-input__wrapper:hover),
:deep(.modern-select .el-input__wrapper.is-focus) { box-shadow: 0 0 0 1px #4318FF inset !important; }
.shipper-option { display: flex; justify-content: space-between; align-items: center; width: 100%; }

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

/* Checkbox styling in table */
:deep(.el-checkbox__inner) { border-radius: 4px; border-color: #A3AED0; }
:deep(.el-checkbox__input.is-checked .el-checkbox__inner) { background-color: #4318FF; border-color: #4318FF; }

.code-badge { font-family: monospace; font-weight: 800; padding: 4px 8px; border-radius: 6px; font-size: 13px; display: inline-block; }
.code-badge.default { background: #F4F7FE; color: #4318FF; }

.recipient-info { display: flex; flex-direction: column; gap: 2px; }
.address-text { font-size: 12px; color: #A3AED0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; display: flex; align-items: center; }

/* Assignment List Area */
.assignment-list-card { background: #F8FAFC; border: none; }
.assignment-scroll-area { height: 440px; overflow-y: auto; padding-right: 10px; margin-right: -10px; }
.assignment-scroll-area::-webkit-scrollbar { width: 6px; }
.assignment-scroll-area::-webkit-scrollbar-thumb { background-color: #E2E8F0; border-radius: 10px; }

.shipper-group-box {
  background: #FFFFFF; border: 1px solid #E9EDF7; border-radius: 12px; padding: 16px; box-shadow: 0 2px 10px rgba(0,0,0,0.02);
}

.shipper-group-header {
  display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px dashed #E2E8F0;
}
.shipper-name { display: flex; align-items: center; gap: 8px; font-weight: 800; color: #1B2559; font-size: 14px; }
.avatar-sm { width: 28px; height: 28px; background: rgba(67, 24, 255, 0.1); color: #4318FF; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 14px; }

.modern-tag { display: inline-flex; align-items: center; gap: 6px; padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: 800; }
.modern-tag .dot { width: 6px; height: 6px; border-radius: 50%; }
.tag-primary { background: rgba(67, 24, 255, 0.1); color: #4318FF; }
.tag-primary .dot { background: #4318FF; }

/* Chips */
.chips-container { display: flex; flex-wrap: wrap; gap: 8px; }
.waybill-chip {
  display: inline-flex; align-items: center; gap: 6px; background: #F4F7FE; border: 1px solid #E9EDF7; padding: 4px 4px 4px 10px; border-radius: 20px; font-size: 12px;
}
.waybill-chip .code { font-family: monospace; font-weight: 800; color: #2B3674; letter-spacing: 0.5px; }
.chip-remove { width: 22px; height: 22px; border-radius: 50%; background: #FFFFFF; border: 1px solid #E2E8F0; color: #EE5D50; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: 0.2s; font-size: 12px; }
.chip-remove:hover { background: #EE5D50; color: white; border-color: #EE5D50; }

/* Animations */
.animate-fade-in { animation: fadeIn 0.5s ease-out; }
.animate-fade-in-up { animation: fadeInUp 0.5s ease-out; }
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes fadeInUp { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }

/* Responsive */
@media (max-width: 1200px) {
  .form-row-container { flex-direction: column; gap: 20px; }
  .column-layout { width: 100%; max-width: 100%; }
  .assignment-list-card { min-height: 400px; }
}
</style>