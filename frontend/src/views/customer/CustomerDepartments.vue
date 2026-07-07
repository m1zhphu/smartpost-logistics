<template>
  <div class="customer-portal">
    <div class="portal-container">
      <el-row :gutter="24" class="portal-content">
        <el-col :span="24">
          <div class="page-header">
            <h2 class="section-title text-primary">Quản lý Phòng Ban Hoạt Động</h2>
            <p class="section-subtitle">Tạo và theo dõi sản lượng, chi phí gửi thư/vận đơn theo từng phòng ban trong công ty</p>
          </div>

          <!-- Section 1 & 2: Department List & Statistics -->
          <el-row :gutter="24" class="cards-row">
            <el-col :xs="24" :sm="10" class="flex-col">
              <el-card class="info-card animate-fade-in equal-height-card" shadow="hover">
                <template #header>
                  <div class="flex-between">
                    <span class="card-header-title text-primary">
                      <el-icon class="mr-2"><Collection /></el-icon>Danh sách phòng ban
                    </span>
                    <el-button type="primary" size="small" @click="openAddDialog">
                      <el-icon class="mr-1"><Plus /></el-icon>Thêm mới
                    </el-button>
                  </div>
                </template>

                <div class="card-body-content">
                  <el-table :data="departmentsList" stripe style="width: 100%" size="small">
                    <el-table-column prop="name" label="Tên phòng ban" min-width="180">
                      <template #default="{ row }">
                        <strong class="text-dark">{{ row.name }}</strong>
                      </template>
                    </el-table-column>
                    <el-table-column label="Thao tác" width="140" align="center">
                      <template #default="{ row }">
                        <el-button type="primary" size="small" link @click="openEditDialog(row)">Sửa</el-button>
                        <el-button type="danger" size="small" link @click="deleteDepartment(row.id)">Xóa</el-button>
                      </template>
                    </el-table-column>
                  </el-table>
                </div>
              </el-card>
            </el-col>

            <!-- Section 2: Statistics & Monthly calculation -->
            <el-col :xs="24" :sm="14" class="flex-col">
              <el-card class="info-card animate-fade-in equal-height-card" shadow="hover">
                <template #header>
                  <div class="flex-between flex-wrap gap-2">
                    <span class="card-header-title text-success">
                      <el-icon class="mr-2"><TrendCharts /></el-icon>Thống kê chi phí & sản lượng
                    </span>
                    <div class="flex-center gap-2">
                      <el-date-picker
                        v-model="selectedMonth"
                        type="month"
                        placeholder="Chọn tháng thống kê"
                        format="MM/YYYY"
                        value-format="YYYY-MM"
                        size="small"
                        clearable
                        @change="calculateStats"
                        style="width: 160px;"
                      />
                      <el-button size="small" type="primary" plain @click="fetchPickupsList">
                        <el-icon class="mr-1"><Refresh /></el-icon>Làm mới
                      </el-button>
                    </div>
                  </div>
                </template>

                <div v-loading="listLoading" class="card-body-content">
                  <el-row :gutter="12" class="stats-grid">
                    <el-col :span="8">
                      <div class="stat-mini-card bg-primary-light">
                        <div class="stat-label">Tổng thư gửi</div>
                        <div class="stat-value text-primary">{{ totalMonthLetters }}</div>
                      </div>
                    </el-col>
                    <el-col :span="8">
                      <div class="stat-mini-card bg-success-light">
                        <div class="stat-label">Tổng cước phí</div>
                        <div class="stat-value text-success">{{ totalMonthCost.toLocaleString() }}đ</div>
                      </div>
                    </el-col>
                    <el-col :span="8">
                      <div class="stat-mini-card bg-warning-light">
                        <div class="stat-label">Yêu cầu pickup</div>
                        <div class="stat-value text-warning">{{ totalMonthPickups }}</div>
                      </div>
                    </el-col>
                  </el-row>

                  <el-table :data="statsData" stripe style="width: 100%" size="small">
                    <el-table-column prop="deptName" label="Phòng ban">
                      <template #default="{ row }">
                        <span :class="{'text-muted italic': row.isUnassigned}">{{ row.deptName }}</span>
                      </template>
                    </el-table-column>
                    <el-table-column prop="pickupCount" label="Yêu cầu" width="100" align="center" />
                    <el-table-column prop="letterCount" label="Số lượng thư" width="110" align="center" />
                    <el-table-column prop="totalCost" label="Tổng cước (đ)" width="150" align="right">
                      <template #default="{ row }">
                        <strong class="text-success">{{ row.totalCost.toLocaleString() }} đ</strong>
                      </template>
                    </el-table-column>
                  </el-table>
                </div>
              </el-card>
            </el-col>
          </el-row>

          <!-- Section 3: Detailed Lookup by Department -->
          <el-card class="recent-waybills-card animate-fade-in" shadow="hover">
            <template #header>
              <div class="flex-between flex-wrap gap-2">
                <span class="card-header-title text-warning" style="color: #eab308;">
                  <el-icon class="mr-2"><Search /></el-icon>Tra cứu lịch sử yêu cầu theo phòng ban
                </span>
                <el-select v-model="filterDeptName" placeholder="Chọn phòng ban" size="small" clearable style="width: 220px;">
                  <el-option
                    v-for="dept in departmentsList"
                    :key="dept.id"
                    :label="dept.name"
                    :value="dept.name"
                  />
                  <el-option label="Không gán phòng ban" value="_UNASSIGNED_" />
                </el-select>
              </div>
            </template>

            <el-table :data="filteredPickups" v-loading="listLoading" stripe class="modern-table" style="width: 100%">
              <el-table-column prop="request_code" label="Mã Yêu Cầu" width="140">
                <template #default="{ row }">
                  <span class="code-badge warning">{{ row.request_code }}</span>
                </template>
              </el-table-column>
              <el-table-column prop="waybill_code" label="Mã Vận Đơn" width="140">
                <template #default="{ row }">
                  <span class="code-badge success">{{ row.waybill_code || '---' }}</span>
                </template>
              </el-table-column>
              <el-table-column label="Ngày tạo" width="150">
                <template #default="{ row }">
                  <span class="text-xs">{{ formatDate(row.created_at) }}</span>
                </template>
              </el-table-column>
              <el-table-column label="Phòng ban" width="140">
                <template #default="{ row }">
                  <el-tag size="small" :type="row.parsedDept ? 'primary' : 'info'">
                    {{ row.parsedDept || 'Chưa gán' }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column label="Người nhận" min-width="160" show-overflow-tooltip>
                <template #default="{ row }">
                  <div v-if="row.pickup_mode === 'BULK_MAIL'" class="text-xs text-muted">
                    Hàng loạt ({{ row.actual_quantity || row.est_quantity || 0 }} thư)
                  </div>
                  <div v-else>
                    <div class="fw-bold text-xs">{{ row.receiver_name || '---' }}</div>
                    <div class="text-xs text-muted">{{ row.receiver_phone || '---' }}</div>
                  </div>
                </template>
              </el-table-column>
              <el-table-column label="Trạng thái" width="140" align="center">
                <template #default="{ row }">
                  <el-tag :type="getPickupStatusType(row.pickup_status)" size="small">
                    {{ getPickupStatusLabel(row.pickup_status) }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column label="Cước phí" width="140" align="right">
                <template #default="{ row }">
                  <div v-if="row.price_status === 'FINALIZED' || row.price_status === 'ADJUSTED'">
                    <strong class="text-success">{{ (row.final_total_amount || 0).toLocaleString() }}đ</strong>
                  </div>
                  <div v-else>
                    <span class="text-primary">{{ (row.estimated_total_amount || 0).toLocaleString() }}đ</span>
                  </div>
                </template>
              </el-table-column>
            </el-table>
          </el-card>

        </el-col>
      </el-row>
    </div>

    <!-- Dialog: Add Department -->
    <el-dialog v-model="addDialogVisible" title="Thêm phòng ban mới" width="400px" destroy-on-close>
      <el-form :model="addForm" ref="addFormRef" label-position="top">
        <el-form-item label="Tên phòng ban" required>
          <el-input v-model="addForm.name" placeholder="Ví dụ: Phòng Kế toán, Phòng HR..." />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="addDialogVisible = false">Hủy</el-button>
        <el-button type="primary" @click="saveNewDepartment">Thêm mới</el-button>
      </template>
    </el-dialog>

    <!-- Dialog: Edit Department -->
    <el-dialog v-model="editDialogVisible" title="Cập nhật phòng ban" width="400px" destroy-on-close>
      <el-form :model="editForm" ref="editFormRef" label-position="top">
        <el-form-item label="Tên phòng ban" required>
          <el-input v-model="editForm.name" placeholder="Ví dụ: Phòng Kế toán, Phòng HR..." />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editDialogVisible = false">Hủy</el-button>
        <el-button type="primary" @click="saveEditDepartment">Cập nhật</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { Collection, Plus, TrendCharts, Refresh, Search } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { useAuthStore } from '@/stores/auth';
import api from '@/api/axios';
import moment from 'moment';

const authStore = useAuthStore();

// Department list
const departmentsList = ref([]);
const localStorageKey = computed(() => `customer_departments_${authStore.user?.username || 'global'}`);

// Dialog states
const addDialogVisible = ref(false);
const addForm = reactive({ name: '' });

const editDialogVisible = ref(false);
const editForm = reactive({ id: '', name: '' });

// Fetching lists
const pickupsList = ref([]);
const listLoading = ref(false);

// Month selection for statistics
const selectedMonth = ref(moment().format('YYYY-MM'));
const statsData = ref([]);
const filterDeptName = ref('');

// Total summary for selected month
const totalMonthLetters = ref(0);
const totalMonthCost = ref(0);
const totalMonthPickups = ref(0);

// Load departments from backend API
const loadDepartments = async () => {
  try {
    const res = await api.get('/api/customers/me/departments');
    departmentsList.value = res.data || [];
  } catch (err) {
    console.error('Lỗi khi tải danh sách phòng ban:', err);
    ElMessage.error('Không thể tải danh sách phòng ban từ hệ thống');
  }
};

// Add
const openAddDialog = () => {
  addForm.name = '';
  addDialogVisible.value = true;
};

const saveNewDepartment = async () => {
  if (!addForm.name.trim()) {
    ElMessage.warning('Vui lòng nhập tên phòng ban');
    return;
  }
  try {
    const res = await api.post('/api/customers/me/departments', { name: addForm.name.trim() });
    departmentsList.value.push(res.data);
    ElMessage.success('Đã thêm phòng ban mới thành công');
    addDialogVisible.value = false;
    calculateStats();
  } catch (err) {
    const errMsg = err.response?.data?.detail || 'Lỗi khi thêm phòng ban';
    ElMessage.error(errMsg);
  }
};

// Edit
const openEditDialog = (row) => {
  editForm.id = row.id;
  editForm.name = row.name;
  editDialogVisible.value = true;
};

const saveEditDepartment = async () => {
  if (!editForm.name.trim()) {
    ElMessage.warning('Vui lòng nhập tên phòng ban');
    return;
  }
  try {
    const res = await api.put(`/api/customers/me/departments/${editForm.id}`, { name: editForm.name.trim() });
    const idx = departmentsList.value.findIndex(d => d.id === editForm.id);
    if (idx !== -1) {
      departmentsList.value[idx] = res.data;
    }
    ElMessage.success('Đã cập nhật phòng ban thành công');
    editDialogVisible.value = false;
    calculateStats();
  } catch (err) {
    const errMsg = err.response?.data?.detail || 'Lỗi khi cập nhật phòng ban';
    ElMessage.error(errMsg);
  }
};

// Delete
const deleteDepartment = (id) => {
  ElMessageBox.confirm(
    'Bạn có chắc chắn muốn xóa phòng ban này không? Các thống kê trong quá khứ vẫn sẽ được ghi nhận.',
    'Xác nhận xóa',
    {
      confirmButtonText: 'Xóa',
      cancelButtonText: 'Hủy',
      type: 'warning'
    }
  ).then(async () => {
    try {
      await api.delete(`/api/customers/me/departments/${id}`);
      departmentsList.value = departmentsList.value.filter(d => d.id !== id);
      ElMessage.success('Đã xóa phòng ban');
      calculateStats();
    } catch (err) {
      const errMsg = err.response?.data?.detail || 'Lỗi khi xóa phòng ban';
      ElMessage.error(errMsg);
    }
  }).catch(() => {});
};

// Parse department name from notes
const parseDeptFromNote = (note) => {
  if (!note) return null;
  const match = note.match(/\[Phòng ban:\s*([^\]]+)\]/);
  return match ? match[1].trim() : null;
};

// Fetch pickups list
const fetchPickupsList = async () => {
  listLoading.value = true;
  try {
    const res = await api.get('/api/waybills/customer/pickups');
    pickupsList.value = (res.data || []).map(row => {
      const parsedDept = row.customer_department_name || parseDeptFromNote(row.notes);
      return {
        ...row,
        parsedDept
      };
    });
    calculateStats();
  } catch (err) {
    console.error('Lỗi khi tải danh sách bưu gửi:', err);
    ElMessage.error('Không thể tải danh sách bưu gửi.');
  } finally {
    listLoading.value = false;
  }
};

// Calculate stats for selected month
const calculateStats = () => {
  if (!selectedMonth.value) {
    statsData.value = [];
    totalMonthLetters.value = 0;
    totalMonthCost.value = 0;
    totalMonthPickups.value = 0;
    return;
  }

  const [year, month] = selectedMonth.value.split('-');
  
  // Filter pickups in target month/year
  const monthPickups = pickupsList.value.filter(row => {
    if (!row.created_at) return false;
    const date = new Date(row.created_at);
    return date.getFullYear() === Number(year) && (date.getMonth() + 1) === Number(month);
  });

  totalMonthPickups.value = monthPickups.length;

  // Initialize stats dictionary
  const statsDict = {};
  departmentsList.value.forEach(dept => {
    statsDict[dept.name] = {
      deptName: dept.name,
      pickupCount: 0,
      letterCount: 0,
      totalCost: 0,
      isUnassigned: false
    };
  });

  const unassignedKey = 'Không xác định';
  statsDict[unassignedKey] = {
    deptName: unassignedKey,
    pickupCount: 0,
    letterCount: 0,
    totalCost: 0,
    isUnassigned: true
  };

  let mLetters = 0;
  let mCost = 0;

  monthPickups.forEach(row => {
    const dept = row.parsedDept;
    const cost = row.price_status === 'FINALIZED' || row.price_status === 'ADJUSTED'
      ? (row.final_total_amount || 0)
      : (row.estimated_total_amount || 0);

    const qty = row.pickup_mode === 'BULK_MAIL'
      ? (row.actual_quantity || row.est_quantity || 1)
      : 1;

    mLetters += qty;
    mCost += cost;

    const key = (dept && statsDict[dept]) ? dept : unassignedKey;
    statsDict[key].pickupCount += 1;
    statsDict[key].letterCount += qty;
    statsDict[key].totalCost += cost;
  });

  totalMonthLetters.value = mLetters;
  totalMonthCost.value = mCost;

  // Convert to array, sorting by totalCost descending
  const statsArray = Object.values(statsDict).filter(s => s.pickupCount > 0 || !s.isUnassigned);
  statsArray.sort((a, b) => b.totalCost - a.totalCost);

  statsData.value = statsArray;
};

// Filtered pickups list for Section 3
const filteredPickups = computed(() => {
  if (!filterDeptName.value) return pickupsList.value;
  return pickupsList.value.filter(row => {
    if (filterDeptName.value === '_UNASSIGNED_') {
      return !row.parsedDept;
    }
    return row.parsedDept === filterDeptName.value;
  });
});

// Format dates
const formatDate = (val) => {
  if (!val) return '---';
  return moment(val).format('DD/MM/YYYY HH:mm');
};

const getPickupStatusType = (status) => {
  if (!status) return 'info';
  const s = status.toUpperCase();
  if (['PICKED', 'COMPLETED', 'RECEIVED'].includes(s)) return 'success';
  if (['ASSIGNED', 'DISPATCHED', 'CONFIRMED'].includes(s)) return 'warning';
  if (['PENDING', 'SUBMITTED'].includes(s)) return 'primary';
  if (['REJECTED', 'CANCELLED', 'FAILED'].includes(s)) return 'danger';
  return 'info';
};

const getPickupStatusLabel = (status) => {
  if (!status) return 'Chờ xử lý';
  const s = status.toUpperCase();
  const map = {
    PENDING: 'Chờ xác nhận',
    CONFIRMED: 'Đã xác nhận',
    DISPATCHED: 'Chờ bưu cục nhận',
    RECEIVED: 'Chờ gán bưu tá',
    ASSIGNED: 'Đang đi lấy',
    PICKED: 'Đã lấy hàng',
    COMPLETED: 'Hoàn thành',
    REJECTED: 'Từ chối lấy',
    CANCELLED: 'Đã hủy'
  };
  return map[s] || status;
};

onMounted(() => {
  loadDepartments();
  fetchPickupsList();
});
</script>

<style scoped>
.customer-portal {
  padding: 24px 40px;
  min-height: 100vh;
  box-sizing: border-box;
}
@media (max-width: 768px) {
  .customer-portal {
    padding: 16px;
  }
}
.page-header {
  margin-top: 10px;
  margin-bottom: 24px;
}
.section-title {
  font-size: 22px;
  font-weight: 700;
  margin: 0 0 6px 0;
  letter-spacing: -0.5px;
}
.section-subtitle {
  font-size: 14px;
  color: #718096;
  margin: 0;
}
.cards-row {
  margin-bottom: 28px;
}
.flex-col {
  display: flex;
  flex-direction: column;
}
.equal-height-card {
  height: 100%;
  display: flex;
  flex-direction: column;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.equal-height-card:hover {
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.05);
}
.equal-height-card :deep(.el-card__header) {
  padding: 16px 20px;
  border-bottom: 1px solid #edf2f7;
  background-color: #fafafa;
}
.equal-height-card :deep(.el-card__body) {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 20px;
}
.card-body-content {
  flex: 1;
  display: flex;
  flex-direction: column;
}
.recent-waybills-card {
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  margin-top: 8px;
}
.recent-waybills-card:hover {
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.05);
}
.recent-waybills-card :deep(.el-card__header) {
  padding: 16px 20px;
  border-bottom: 1px solid #edf2f7;
  background-color: #fafafa;
}
.recent-waybills-card :deep(.el-card__body) {
  padding: 20px;
}
.flex-between {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.flex-center {
  display: flex;
  align-items: center;
}
.gap-2 {
  gap: 10px;
}
.stats-grid {
  margin-bottom: 24px;
}
.stat-mini-card {
  padding: 16px 18px;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  border: 1px solid transparent;
  transition: all 0.3s ease;
}
.stat-mini-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.04);
}
.bg-primary-light {
  background-color: #ebf8ff;
  border-color: #bee3f8;
}
.bg-success-light {
  background-color: #f0fff4;
  border-color: #c6f6d5;
}
.bg-warning-light {
  background-color: #fffaf0;
  border-color: #feebc8;
}
.stat-label {
  font-size: 11px;
  color: #718096;
  text-transform: uppercase;
  font-weight: 600;
  letter-spacing: 0.5px;
}
.stat-value {
  font-size: 20px;
  font-weight: 700;
  margin-top: 6px;
}
.code-badge {
  font-family: monospace;
  font-weight: bold;
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 12px;
  display: inline-block;
}
.code-badge.warning {
  background-color: #fffbeb;
  color: #d97706;
  border: 1px solid #fde68a;
}
.code-badge.success {
  background-color: #f0fdf4;
  color: #16a34a;
  border: 1px solid #bbf7d0;
}
.card-header-title {
  font-size: 15px;
  font-weight: 600;
  display: flex;
  align-items: center;
}
.text-success {
  color: #16a34a;
}
.text-primary {
  color: #2b6cb0;
}
.text-warning {
  color: #dd6b20;
}
.italic {
  font-style: italic;
}
</style>
