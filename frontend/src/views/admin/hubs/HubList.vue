<template>
  <div class="modern-hub-management">
    <div class="page-container">
      
      <!-- Header Section -->
      <header class="page-header animate-fade-in">
        <div class="header-content">
          <div class="title-wrapper">
            <div class="icon-box primary">
              <el-icon><Box /></el-icon>
            </div>
            <div>
              <h2 class="page-title">Quản lý Bưu cục</h2>
              <p class="page-subtitle">Định nghĩa và giám sát mạng lưới vận hành của hệ thống</p>
            </div>
          </div>
        </div>
        <div class="header-actions">
          <button class="btn-primary" @click="openDialog(null)">
            <el-icon><Plus /></el-icon>
            <span>Thêm Bưu cục mới</span>
          </button>
        </div>
      </header>

      <!-- Main Table Card -->
      <div class="content-card table-wrapper animate-fade-in-up">
        <el-table 
          :data="hubs" 
          v-loading="loading" 
          class="modern-table"
          row-class-name="modern-row"
          style="width: 100%"
        >
          <!-- Mã Bưu cục -->
          <el-table-column prop="hub_code" label="Mã BC" min-width="120" fixed="left">
            <template #default="{ row }">
              <span class="code-text">{{ row.hub_code }}</span>
            </template>
          </el-table-column>
          
          <!-- Tên Bưu cục -->
          <el-table-column prop="hub_name" label="Tên Bưu cục" min-width="200">
            <template #default="{ row }">
              <span class="fw-bold text-dark">{{ row.hub_name }}</span>
            </template>
          </el-table-column>
          
          <!-- Loại hình -->
          <el-table-column prop="hub_type" label="Phân cấp" min-width="140">
            <template #default="{ row }">
              <div class="modern-tag" :class="getHubTypeClass(row.hub_type)">
                <span class="dot"></span>
                {{ getHubTypeName(row.hub_type) }}
              </div>
            </template>
          </el-table-column>
          
          <!-- ID Tỉnh Thành -->
          <el-table-column prop="province_id" label="Tỉnh/Thành ID" min-width="130" align="center">
            <template #default="{ row }">
              <div class="id-badge">{{ row.province_id }}</div>
            </template>
          </el-table-column>
          
          <!-- Địa chỉ -->
          <el-table-column prop="address_detail" label="Địa chỉ chi tiết" min-width="250">
            <template #default="{ row }">
              <span class="text-muted text-truncate" :title="row.address_detail">
                <el-icon class="mr-1"><Location /></el-icon>
                {{ row.address_detail }}
              </span>
            </template>
          </el-table-column>
          
          <!-- Trưởng bưu cục -->
          <el-table-column label="Trưởng bưu cục" min-width="180">
            <template #default="{ row }">
              <div class="manager-info">
                <div class="avatar-sm">
                  <el-icon><UserFilled /></el-icon>
                </div>
                <span>{{ getManagerName(row.manager_id) }}</span>
              </div>
            </template>
          </el-table-column>
          
          <!-- Trạng thái -->
          <el-table-column prop="status" label="Hoạt động" min-width="120" align="center">
            <template #default="{ row }">
              <el-switch 
                v-model="row.status" 
                @change="toggleStatus(row)" 
                style="--el-switch-on-color: #05CD99; --el-switch-off-color: #E2E8F0" 
              />
            </template>
          </el-table-column>
          
          <!-- Thao tác -->
          <el-table-column label="Thao tác" width="120" fixed="right" align="center">
            <template #default="{ row }">
              <div class="action-buttons">
                <button class="icon-btn edit" @click="openDialog(row)" title="Chỉnh sửa">
                  <el-icon><Edit /></el-icon>
                </button>
                <button class="icon-btn delete" @click="handleDelete(row)" title="Xóa">
                  <el-icon><Delete /></el-icon>
                </button>
              </div>
            </template>
          </el-table-column>
          
          <!-- Empty State -->
          <template #empty>
            <el-empty description="Chưa có dữ liệu bưu cục" :image-size="100" />
          </template>
        </el-table>
      </div>

      <!-- Modern Dialog Form -->
      <el-dialog 
        v-model="dialogVisible" 
        :title="hubForm.hub_id ? 'Cập nhật Bưu cục' : 'Thêm Bưu cục mới'" 
        width="550px"
        class="modern-dialog"
        destroy-on-close
      >
        <el-form :model="hubForm" :rules="rules" ref="formRef" label-position="top" class="modern-form">
          <el-row :gutter="24">
            <el-col :span="12">
              <el-form-item label="Mã bưu cục" prop="hub_code">
                <el-input v-model="hubForm.hub_code" placeholder="VD: BC-HCM-01" :disabled="!!hubForm.hub_id">
                  <template #prefix><el-icon><Key /></el-icon></template>
                </el-input>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="Phân cấp" prop="hub_type">
                <el-select v-model="hubForm.hub_type" class="w-full" placeholder="Chọn phân cấp">
                  <el-option label="Trung tâm (Center)" value="CENTER">
                    <span style="color: #FFB547; font-weight: bold;">Trung tâm (Center)</span>
                  </el-option>
                  <el-option label="Bưu cục (Hub)" value="HUB">
                    <span style="color: #4318FF; font-weight: bold;">Bưu cục (Hub)</span>
                  </el-option>
                  <el-option label="Điểm nhận (Station)" value="STATION">
                    <span style="color: #05CD99; font-weight: bold;">Điểm nhận (Station)</span>
                  </el-option>
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
          
          <el-form-item label="Tên bưu cục" prop="hub_name">
            <el-input v-model="hubForm.hub_name" placeholder="VD: Bưu cục Tân Bình">
              <template #prefix><el-icon><OfficeBuilding /></el-icon></template>
            </el-input>
          </el-form-item>
          
          <el-form-item label="Mã định danh Tỉnh/Thành" prop="province_id">
             <el-input-number v-model="hubForm.province_id" :min="1" class="w-full modern-input-number" />
          </el-form-item>

          <el-form-item label="Địa chỉ chi tiết" prop="address_detail">
            <el-input 
              v-model="hubForm.address_detail" 
              type="textarea" 
              :rows="3"
              placeholder="VD: Số 10, Lý Thường Kiệt..." 
              resize="none"
            />
          </el-form-item>

          <el-form-item label="Người quản lý (Trưởng bưu cục)" prop="manager_id">
             <el-select v-model="hubForm.manager_id" placeholder="Tìm kiếm & chọn nhân viên quản lý" class="w-full" filterable>
                <el-option v-for="user in admins" :key="user.user_id" :label="user.full_name || user.username" :value="user.user_id">
                  <div class="select-user-option">
                    <el-icon><User /></el-icon>
                    <span>{{ user.full_name || user.username }}</span>
                  </div>
                </el-option>
             </el-select>
          </el-form-item>
        </el-form>
        
        <template #footer>
          <div class="dialog-footer-actions">
            <button class="btn-secondary" @click="dialogVisible = false">Hủy bỏ</button>
            <button class="btn-primary" @click="handleSave" :disabled="saveLoading">
              <el-icon class="is-loading mr-2" v-if="saveLoading"><Loading /></el-icon>
              <span>{{ saveLoading ? 'Đang lưu...' : 'Xác nhận lưu' }}</span>
            </button>
          </div>
        </template>
      </el-dialog>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { 
  Plus, Edit, Delete, Box, Location, UserFilled, User, Key, OfficeBuilding, Loading
} from '@element-plus/icons-vue';
import api from '@/api/axios';
import { ElMessage, ElMessageBox } from 'element-plus';

const loading = ref(false);
const saveLoading = ref(false);
const dialogVisible = ref(false);
const formRef = ref(null);
const hubs = ref([]);
const admins = ref([]);

const hubForm = reactive({
  hub_id: null,
  hub_code: '',
  hub_name: '',
  hub_type: 'HUB',
  province_id: 1,
  address_detail: '',
  manager_id: null,
  status: true
});

const rules = {
  hub_code: [{ required: true, message: 'Vui lòng nhập mã bưu cục', trigger: 'blur' }],
  hub_name: [{ required: true, message: 'Vui lòng nhập tên bưu cục', trigger: 'blur' }],
  hub_type: [{ required: true, message: 'Vui lòng chọn phân cấp', trigger: 'change' }]
};

// Hàm UI Helper
const getHubTypeName = (type) => {
  const types = { 'CENTER': 'Trung tâm', 'HUB': 'Bưu cục', 'STATION': 'Điểm nhận' };
  return types[type] || type;
};

const getHubTypeClass = (type) => {
  const classes = { 'CENTER': 'tag-warning', 'HUB': 'tag-primary', 'STATION': 'tag-success' };
  return classes[type] || 'tag-default';
};

// Hàm nghiệp vụ (Giữ nguyên gốc)
const getManagerName = (managerId) => {
  if (!managerId) return 'Chưa phân công';
  const manager = admins.value.find(u => u.user_id === managerId);
  return manager ? (manager.full_name || manager.username) : `ID: ${managerId}`;
};

const fetchData = async () => {
  loading.value = true;
  try {
    const [hubsRes, usersRes] = await Promise.all([
      api.get('/api/hubs'),
      api.get('/api/users')
    ]);
    
    hubs.value = hubsRes.data;
    admins.value = Array.isArray(usersRes.data) ? usersRes.data : (usersRes.data.items || usersRes.data.data || []);
  } catch (err) {
    ElMessage.error('Không thể lấy danh sách bưu cục hoặc nhân sự');
  } finally {
    loading.value = false;
  }
};

const openDialog = (row) => {
  if (row) {
    Object.assign(hubForm, row);
  } else {
    Object.assign(hubForm, {
      hub_id: null,
      hub_code: '',
      hub_name: '',
      hub_type: 'HUB',
      province_id: 1,
      address_detail: '',
      manager_id: null,
      status: true
    });
  }
  dialogVisible.value = true;
};

const handleSave = async () => {
  if (!formRef.value) return;
  await formRef.value.validate(async (valid) => {
    if (valid) {
      saveLoading.value = true;
      try {
        if (hubForm.hub_id) {
          await api.put(`/api/hubs/${hubForm.hub_id}`, hubForm);
          ElMessage.success('Cập nhật bưu cục thành công!');
        } else {
          await api.post('/api/hubs', hubForm, {
            headers: {
              'Idempotency-Key': `hub-create-${Date.now()}`
            }
          });
          ElMessage.success('Thêm bưu cục mới thành công!');
        }
        dialogVisible.value = false;
        fetchData();
      } catch (err) {
        ElMessage.error(err.response?.data?.detail || 'Lỗi khi lưu bưu cục. Vui lòng kiểm tra lại.');
      } finally {
        saveLoading.value = false;
      }
    }
  });
};

const handleDelete = (row) => {
  ElMessageBox.confirm(
    `Bạn có chắc chắn muốn xóa bưu cục <strong>${row.hub_name}</strong>? Dữ liệu không thể khôi phục sau khi xóa.`, 
    'Xác nhận xóa', 
    {
      confirmButtonText: 'Xóa bưu cục',
      cancelButtonText: 'Hủy bỏ',
      type: 'error',
      dangerouslyUseHTMLString: true,
      customClass: 'modern-message-box'
    }
  ).then(async () => {
    try {
      await api.delete(`/api/hubs/${row.hub_id}`);
      ElMessage.success('Đã xóa bưu cục thành công!');
      fetchData();
    } catch (err) {
      ElMessage.error('Xóa không thành công.');
    }
  }).catch(() => {});
};

const toggleStatus = async (row) => {
  try {
    await api.patch(`/api/hubs/${row.hub_id}/status`, { status: row.status });
    ElMessage.success(`Đã cập nhật trạng thái hoạt động.`);
  } catch (error) {
    const errorMsg = error.response?.data?.detail || 'Lỗi hệ thống khi cập nhật trạng thái';
    ElMessage.error(errorMsg);
    row.status = !row.status;
  }
};

onMounted(fetchData);
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

/* Base Layout */
.modern-hub-management {
  min-height: calc(100vh - 64px);
  background-color: #F4F7FE; /* Light SaaS background */
  font-family: 'Plus Jakarta Sans', sans-serif;
  color: #2B3674;
  padding: 32px 24px;
}

.page-container {
  max-width: 1400px;
  margin: 0 auto;
}

/* Header Styles */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
  flex-wrap: wrap;
  gap: 20px;
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
.icon-box.primary {
  background: rgba(67, 24, 255, 0.1);
  color: #4318FF;
}

.page-title {
  font-size: 28px;
  font-weight: 800;
  color: #2B3674;
  margin: 0 0 4px 0;
  letter-spacing: -0.5px;
}

.page-subtitle {
  color: #A3AED0;
  font-size: 14px;
  margin: 0;
  font-weight: 500;
}

/* Buttons */
.btn-primary {
  background: #4318FF;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 12px;
  font-weight: 700;
  font-family: inherit;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(67, 24, 255, 0.25);
}

.btn-primary:hover:not(:disabled) {
  background: #3311DB;
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(67, 24, 255, 0.35);
}

.btn-primary:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.btn-secondary {
  background: #F4F7FE;
  color: #2B3674;
  border: none;
  padding: 12px 24px;
  border-radius: 12px;
  font-weight: 700;
  font-family: inherit;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-secondary:hover {
  background: #E9EDF7;
}

/* Content Card & Table */
.content-card {
  background: #FFFFFF;
  border-radius: 20px;
  padding: 24px;
  box-shadow: 0px 4px 20px rgba(0, 0, 0, 0.02);
}

:deep(.modern-table) {
  --el-table-border-color: transparent;
  --el-table-header-bg-color: #F4F7FE;
  --el-table-header-text-color: #A3AED0;
  --el-table-text-color: #2B3674;
}

:deep(.modern-table th.el-table__cell) {
  font-weight: 700;
  font-size: 13px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding: 16px 0;
  border-bottom: 2px solid #E9EDF7 !important;
}

:deep(.modern-table td.el-table__cell) {
  padding: 16px 0;
  border-bottom: 1px solid #F4F7FE !important;
}

:deep(.modern-table .el-table__row:hover > td) {
  background-color: #F8FAFC !important;
}

/* Table Cell Content Styles */
.fw-bold { font-weight: 700; }
.text-dark { color: #1B2559; }
.text-muted { color: #A3AED0; }
.mr-1 { margin-right: 4px; }
.mr-2 { margin-right: 8px; }

.code-text {
  font-family: 'Courier New', Courier, monospace;
  font-weight: 700;
  background: #F4F7FE;
  color: #4318FF;
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 13px;
}

.id-badge {
  display: inline-block;
  background: #F4F7FE;
  color: #2B3674;
  font-weight: 700;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 13px;
}

.text-truncate {
  display: block;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 220px;
  font-size: 13px;
}

.manager-info {
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 600;
  color: #2B3674;
}

.avatar-sm {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #E9EDF7;
  color: #4318FF;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Tags */
.modern-tag {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 700;
}

.modern-tag .dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}

.tag-warning { background: rgba(255, 181, 71, 0.1); color: #FFB547; }
.tag-warning .dot { background: #FFB547; box-shadow: 0 0 0 2px rgba(255,181,71,0.2); }

.tag-primary { background: rgba(67, 24, 255, 0.1); color: #4318FF; }
.tag-primary .dot { background: #4318FF; box-shadow: 0 0 0 2px rgba(67,24,255,0.2); }

.tag-success { background: rgba(5, 205, 153, 0.1); color: #05CD99; }
.tag-success .dot { background: #05CD99; box-shadow: 0 0 0 2px rgba(5,205,153,0.2); }

/* Action Buttons */
.action-buttons {
  display: flex;
  gap: 8px;
  justify-content: center;
}

.icon-btn {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 16px;
}

.icon-btn.edit { background: #F4F7FE; color: #4318FF; }
.icon-btn.edit:hover { background: #4318FF; color: white; }

.icon-btn.delete { background: #FFF0F0; color: #EE5D50; }
.icon-btn.delete:hover { background: #EE5D50; color: white; }

/* Dialog & Forms Customization */
.w-full { width: 100%; }

:deep(.modern-dialog) {
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 20px 40px rgba(0,0,0,0.1);
}

:deep(.modern-dialog .el-dialog__header) {
  margin: 0;
  padding: 24px;
  border-bottom: 1px solid #E9EDF7;
}

:deep(.modern-dialog .el-dialog__title) {
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-weight: 800;
  color: #2B3674;
  font-size: 18px;
}

:deep(.modern-dialog .el-dialog__body) {
  padding: 24px;
}

:deep(.modern-dialog .el-dialog__footer) {
  padding: 16px 24px 24px;
  border-top: 1px solid #E9EDF7;
}

.dialog-footer-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

:deep(.modern-form .el-form-item__label) {
  font-weight: 700;
  color: #2B3674;
  margin-bottom: 8px;
}

:deep(.modern-form .el-input__wrapper),
:deep(.modern-form .el-textarea__inner) {
  background: #F8FAFC;
  box-shadow: 0 0 0 1px #E2E8F0 inset;
  border-radius: 10px;
  padding: 8px 12px;
  transition: all 0.3s ease;
}

:deep(.modern-form .el-input__wrapper:hover),
:deep(.modern-form .el-textarea__inner:hover) {
  box-shadow: 0 0 0 1px #4318FF inset;
}

:deep(.modern-form .el-input__wrapper.is-focus),
:deep(.modern-form .el-textarea__inner:focus) {
  box-shadow: 0 0 0 2px rgba(67, 24, 255, 0.2) inset !important;
  background: #FFFFFF;
}

.select-user-option {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 500;
}

/* Utilities & Animations */
.animate-fade-in { animation: fadeIn 0.6s ease-out; }
.animate-fade-in-up { animation: fadeInUp 0.6s ease-out; }

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Responsive */
@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    align-items: flex-start;
  }
  .header-actions {
    width: 100%;
  }
  .header-actions .btn-primary {
    width: 100%;
    justify-content: center;
  }
  .content-card {
    padding: 16px;
  }
}
</style>