<template>
  <div class="assign-page">
    <div class="page-header flex-between mb-4">
      <div>
        <h2 class="misa-title">Phân công Shipper</h2>
        <p class="text-muted">Giao đơn hàng cho từng shipper đi giao cuối ngày</p>
      </div>
      <el-button 
        type="success" 
        :icon="Check" 
        @click="submitAssignments" 
        :loading="submitting" 
        :disabled="assignments.length === 0"
      >
        Xác nhận Phân công ({{ assignments.length }})
      </el-button>
    </div>

    <el-row :gutter="20">
      <el-col :span="14">
        <el-card>
          <template #header>
            <div class="flex-between">
              <span class="font-bold">Vận đơn chờ phân công</span>
              <el-input v-model="search" placeholder="Tìm mã/SĐT..." style="width:220px" prefix-icon="Search" clearable />
            </div>
          </template>
          
          <el-table
            :data="filteredWaybills"
            v-loading="loading"
            @selection-change="handleSelection"
            stripe border
            height="calc(100vh - 280px)"
            ref="tableRef"
          >
            <el-table-column type="selection" width="50" />
            <el-table-column prop="waybill_code" label="Mã VĐ" width="150" />
            <el-table-column label="Người nhận" width="180">
              <template #default="{ row }">
                <p class="font-bold mb-0">{{ row.receiver_name }}</p>
                <p class="text-muted text-xs mb-0">{{ row.receiver_phone }}</p>
              </template>
            </el-table-column>
            <el-table-column prop="receiver_address" label="Địa chỉ" show-overflow-tooltip />
            <el-table-column label="COD" width="110">
              <template #default="{ row }">
                <span class="text-danger font-bold">
                  {{ row.cod_amount ? row.cod_amount.toLocaleString() + ' đ' : '0 đ' }}
                </span>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>

      <el-col :span="10">
        <el-card class="mb-4">
          <template #header>
            <div class="card-header"><el-icon><User /></el-icon> Chọn Shipper</div>
          </template>
          
          <el-select 
            v-model="selectedShipperId" 
            placeholder="Chọn shipper giao hàng" 
            filterable 
            class="w-full mb-3"
          >
            <el-option
              v-for="s in shippers"
              :key="s.user_id"
              :label="`${s.full_name} - ${s.primary_hub?.hub_name || 'Bưu cục'}`"
              :value="s.user_id"
            />
          </el-select>
          
          <el-button
            type="primary" 
            class="w-full"
            :disabled="!selectedShipperId || selectedRows.length === 0"
            @click="addToAssignment"
          >
            <el-icon class="mr-1"><Plus /></el-icon> Thêm {{ selectedRows.length }} đơn vào danh sách
          </el-button>
        </el-card>

        <el-card class="assignment-list-card">
          <template #header><span class="font-bold">Danh sách đang phân công</span></template>
          
          <div v-if="assignments.length === 0" class="empty-state">
            <el-empty :image-size="60" description="Chưa có đơn nào được chọn" />
          </div>

          <div v-for="(group, shipperId) in groupedAssignments" :key="shipperId" class="assignment-group mb-3">
            <p class="shipper-info-header">
              <span class="name"><el-icon><User /></el-icon> {{ group.shipperName }}</span>
              <el-tag size="small" effect="dark">{{ group.waybills.length }} đơn</el-tag>
            </p>
            <div class="chips-container">
              <div v-for="w in group.waybills" :key="w.waybill_code" class="waybill-chip">
                <span class="code">{{ w.waybill_code }}</span>
                <el-button circle size="small" type="danger" :icon="Close" @click="removeAssignment(w.waybill_code)" />
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { Check, User, Plus, Close, Search } from '@element-plus/icons-vue';
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

// Lọc vận đơn: chỉ hiện những đơn chưa nằm trong danh sách phân công tạm thời
const filteredWaybills = computed(() => {
  const q = search.value.toLowerCase();
  return waybills.value.filter(w =>
    !assignments.value.find(a => a.waybill_code === w.waybill_code) &&
    (w.waybill_code?.toLowerCase().includes(q) || w.receiver_phone?.includes(q))
  );
});

// Nhóm các đơn hàng theo Shipper để hiển thị ở cột bên phải
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

// Thêm các đơn đã chọn vào danh sách phân công tạm thời
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

// Gửi dữ liệu chính thức về Backend
const submitAssignments = async () => {
  try {
    await ElMessageBox.confirm(
      `Xác nhận phân công ${assignments.value.length} đơn hàng cho các Shipper?`,
      'Xác nhận',
      { type: 'warning' }
    );

    submitting.value = true;
    const byShipper = {};
    assignments.value.forEach(a => {
      if (!byShipper[a.shipper_id]) byShipper[a.shipper_id] = [];
      byShipper[a.shipper_id].push(a.waybill_code);
    });
    
    // Gửi từng request theo Shipper
    const promises = Object.entries(byShipper).map(([shipperId, codes]) => 
      api.post('/api/delivery/assign-shipper', {
        shipper_id: parseInt(shipperId),
        waybill_codes: codes
      })
    );

    await Promise.all(promises);
    
    ElMessage.success('Phân công thành công. Trạng thái đơn đã chuyển sang [Đang đi giao]');
    assignments.value = [];
    fetchData(); // Reset dữ liệu
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
    // THAY ĐỔI: Gọi API chuyên dụng để lấy đơn chờ giao (đã bao gồm ARRIVED + IN_HUB)
    const wRes = await api.get('/api/delivery/pending-assign');
    
    // API này Backend đã lọc theo Hub của người dùng nên Frontend chỉ việc nhận
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
.w-full { width: 100%; }
.mb-0 { margin-bottom: 0; }
.mb-3 { margin-bottom: 0.75rem; }
.mb-4 { margin-bottom: 1rem; }
.mr-1 { margin-right: 4px; }
.font-bold { font-weight: 700; }

.assign-page {
  padding: 5px;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 700;
  color: #409EFF;
}

.assignment-list-card {
  height: calc(100vh - 430px);
  overflow-y: auto;
}

.assignment-group {
  border: 1px solid #EBEEF5;
  border-radius: 8px;
  padding: 12px;
  background: #FAFAFA;
}

.shipper-info-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  border-bottom: 1px solid #eee;
  padding-bottom: 5px;
}

.shipper-info-header .name {
  font-weight: 700;
  color: #409EFF;
  display: flex;
  align-items: center;
  gap: 5px;
}

.chips-container {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.waybill-chip {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #fff;
  border: 1px solid #DCDFE6;
  padding: 2px 2px 2px 10px;
  border-radius: 20px;
  font-size: 12px;
}

.waybill-chip .code {
  font-weight: 600;
}

.empty-state {
  padding: 20px 0;
}
</style>