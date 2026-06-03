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

<style scoped src="@/styles/admin/delivery/AssignShipper.css"></style>