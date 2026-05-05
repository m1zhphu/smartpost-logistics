<template>
  <div class="modern-user-management">
    <div class="page-container">
      
      <!-- Header Section -->
      <header class="page-header animate-fade-in">
        <div class="header-content">
          <div class="title-wrapper">
            <div class="icon-box primary">
              <el-icon><UserFilled /></el-icon>
            </div>
            <div>
              <h2 class="page-title">Quản lý Nhân sự (Staff)</h2>
              <p class="page-subtitle">Hệ thống phân quyền 5 cấp: Admin, Quản lý, Kho, Shipper, Kế toán</p>
            </div>
          </div>
        </div>
        <div class="header-actions">
          <button class="btn-primary" @click="openDialog(null)">
            <el-icon><Plus /></el-icon>
            <span>Thêm Nhân viên</span>
          </button>
        </div>
      </header>

      <!-- Advanced Filter Section (Frontend Reactive) -->
      <div class="content-card filter-card animate-fade-in mb-24">
        <el-row :gutter="20" class="filter-row">
          <el-col :xs="24" :sm="12" :lg="6" class="filter-col">
            <div class="filter-label">Tìm kiếm trực tiếp</div>
            <el-input 
              v-model="filter.query" 
              placeholder="Tên, SĐT, Username..." 
              clearable 
              class="modern-input"
            >
              <template #prefix><el-icon><Search /></el-icon></template>
            </el-input>
          </el-col>
          
          <el-col :xs="24" :sm="12" :lg="6" class="filter-col">
            <div class="filter-label">Chức vụ</div>
            <el-select v-model="filter.role_id" placeholder="Tất cả chức vụ" clearable class="w-full modern-select">
              <el-option label="Quản trị hệ thống" :value="1" />
              <el-option label="Quản lý bưu cục" :value="2" />
              <el-option label="Nhân viên kho" :value="3" />
              <el-option label="Tài xế (Shipper)" :value="4" />
              <el-option label="Kế toán" :value="5" />
            </el-select>
          </el-col>
          
          <el-col :xs="24" :sm="12" :lg="6" class="filter-col">
            <div class="filter-label">Bưu cục trực thuộc</div>
            <el-select v-model="filter.hub_id" placeholder="Tất cả bưu cục" clearable class="w-full modern-select">
              <el-option v-for="hub in hubs" :key="hub.hub_id" :label="hub.hub_name" :value="hub.hub_id" />
            </el-select>
          </el-col>
          
          <el-col :xs="24" :sm="12" :lg="6" class="filter-action-col">
             <button class="btn-secondary w-full" @click="resetFilters">
               <el-icon><RefreshRight /></el-icon> Xóa bộ lọc
             </button>
             <button class="btn-primary w-full" @click="fetchData">
               <el-icon><Refresh /></el-icon> Làm mới dữ liệu
             </button>
          </el-col>
        </el-row>
      </div>

      <!-- Main Table Card -->
      <div class="content-card table-wrapper animate-fade-in-up">
        <!-- ĐỔI :data="users" THÀNH :data="filteredUsers" -->
        <el-table 
          :data="filteredUsers" 
          v-loading="loading" 
          class="modern-table"
          row-class-name="modern-row"
          style="width: 100%"
        >
          <!-- Thông tin nhân sự -->
          <el-table-column label="Thông tin nhân viên" min-width="250" fixed="left">
            <template #default="{ row }">
              <div class="user-profile">
                <div class="avatar-circle" :class="getRoleTypeClass(getRoleType(row.role_id))">
                  {{ getInitials(row.full_name) }}
                </div>
                <div class="user-details">
                  <span class="fw-bold text-dark">{{ row.full_name }}</span>
                  <span class="text-xs text-muted">
                    <el-icon class="mr-1"><Message /></el-icon>{{ row.email || 'Chưa cập nhật email' }}
                  </span>
                </div>
              </div>
            </template>
          </el-table-column>

          <!-- Tên đăng nhập -->
          <el-table-column prop="username" label="Tên đăng nhập" min-width="140">
            <template #default="{ row }">
              <span class="username-badge">@{{ row.username }}</span>
            </template>
          </el-table-column>

          <!-- Chức vụ -->
          <el-table-column label="Chức vụ" min-width="160">
            <template #default="{ row }">
              <div class="modern-tag" :class="'tag-' + getRoleType(row.role_id)">
                <span class="dot"></span>
                {{ getRoleName(row.role_id) }}
              </div>
            </template>
          </el-table-column>

          <!-- Điện thoại -->
          <el-table-column prop="phone_number" label="Điện thoại" min-width="130">
            <template #default="{ row }">
              <span class="contact-text">
                <el-icon class="mr-1"><Phone /></el-icon>{{ row.phone_number }}
              </span>
            </template>
          </el-table-column>
          
          <!-- Nơi làm việc / Phương tiện -->
          <el-table-column label="Nơi làm việc / Xe" min-width="200">
             <template #default="{ row }">
                <div class="work-info">
                  <span class="hub-name">
                    <el-icon class="mr-1"><OfficeBuilding /></el-icon>
                    {{ row.primary_hub?.hub_name || 'Hệ thống Trung tâm' }}
                  </span>
                  <div v-if="row.role_id === 4 && row.vehicle_plate" class="vehicle-plate">
                     <el-icon class="mr-1"><Van /></el-icon> {{ row.vehicle_plate }}
                  </div>
                </div>
             </template>
          </el-table-column>

          <!-- Trạng thái -->
          <el-table-column label="Trạng thái" min-width="120" align="center">
             <template #default="{ row }">
                <div class="status-pill" :class="row.is_active ? 'active' : 'locked'">
                   {{ row.is_active ? 'Hoạt động' : 'Tạm khóa' }}
                </div>
             </template>
          </el-table-column>

          <!-- Thao tác -->
          <el-table-column label="Thao tác" width="140" fixed="right" align="center">
            <template #default="{ row }">
              <div class="action-buttons">
                <button class="icon-btn edit" @click="openDialog(row)" title="Chỉnh sửa">
                  <el-icon><Edit /></el-icon>
                </button>
                
                <button v-if="!row.is_active" class="icon-btn success" @click="toggleStatus(row, true)" title="Mở khóa">
                  <el-icon><Unlock /></el-icon>
                </button>
                <button v-else class="icon-btn warning" @click="toggleStatus(row, false)" title="Khóa tài khoản">
                  <el-icon><Lock /></el-icon>
                </button>

                <button class="icon-btn delete" @click="handleDelete(row)" title="Xóa nhân viên">
                  <el-icon><Delete /></el-icon>
                </button>
              </div>
            </template>
          </el-table-column>

          <template #empty>
            <el-empty description="Không tìm thấy nhân viên nào phù hợp" :image-size="100" />
          </template>
        </el-table>
      </div>

      <!-- Modern Dialog Form (Giữ nguyên) -->
      <el-dialog 
        v-model="dialogVisible" 
        :title="userForm.user_id ? 'Hiệu chỉnh nhân sự' : 'Đăng ký nhân viên mới'" 
        width="700px"
        class="modern-dialog"
        destroy-on-close
      >
        <el-form :model="userForm" :rules="rules" ref="formRef" label-position="top" class="modern-form">
          <div class="form-section-title">Thông tin tài khoản</div>
          <el-row :gutter="24">
            <el-col :span="12">
              <el-form-item label="Tên đăng nhập" prop="username">
                <el-input v-model="userForm.username" placeholder="vd: tung_shipper" :disabled="!!userForm.user_id">
                  <template #prefix><el-icon><User /></el-icon></template>
                </el-input>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="Mật khẩu" :prop="userForm.user_id ? '' : 'password'">
                <el-input 
                  v-model="userForm.password" 
                  type="password" 
                  :placeholder="userForm.user_id ? 'Bỏ trống nếu giữ nguyên' : 'Tối thiểu 6 ký tự'" 
                  show-password 
                >
                  <template #prefix><el-icon><Key /></el-icon></template>
                </el-input>
              </el-form-item>
            </el-col>
          </el-row>

          <div class="form-section-title mt-4">Thông tin cá nhân</div>
          <el-row :gutter="24">
            <el-col :span="12">
              <el-form-item label="Họ và tên nhân viên" prop="full_name">
                <el-input v-model="userForm.full_name" placeholder="Nguyễn Văn A" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="Số điện thoại liên hệ" prop="phone_number">
                <el-input v-model="userForm.phone_number" placeholder="09xxxxxxx">
                  <template #prefix><el-icon><Phone /></el-icon></template>
                </el-input>
              </el-form-item>
            </el-col>
          </el-row>

          <el-form-item label="Email công việc (Dùng để nhận thông báo)" prop="email">
             <el-input v-model="userForm.email" placeholder="nv.a@smartpost.vn">
                <template #prefix><el-icon><Message /></el-icon></template>
             </el-input>
          </el-form-item>

          <div class="form-section-title mt-4">Thông tin công tác</div>
          <el-row :gutter="24">
            <el-col :span="12">
              <el-form-item label="Vai trò / Chức vụ" prop="role_id">
                <el-select v-model="userForm.role_id" class="w-full" placeholder="Chọn vị trí công tác">
                  <el-option label="Quản trị hệ thống" :value="1" />
                  <el-option label="Quản lý bưu cục" :value="2" />
                  <el-option label="Nhân viên kho" :value="3" />
                  <el-option label="Tài xế (Shipper)" :value="4" />
                  <el-option label="Kế toán bưu cục" :value="5" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="Bưu cục trực thuộc" prop="primary_hub_id">
                <el-select v-model="userForm.primary_hub_id" class="w-full" placeholder="Chọn kho làm việc">
                  <el-option v-for="hub in hubs" :key="hub.hub_id" :label="hub.hub_name" :value="hub.hub_id" />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
          
          <el-collapse-transition>
            <el-form-item v-if="userForm.role_id === 4" label="Biển số xe công tác" prop="vehicle_plate">
               <el-input v-model="userForm.vehicle_plate" placeholder="VD: 29A-888.88">
                 <template #prefix><el-icon><Van /></el-icon></template>
               </el-input>
            </el-form-item>
          </el-collapse-transition>
        </el-form>

        <template #footer>
          <div class="dialog-footer-actions">
            <button class="btn-secondary" @click="dialogVisible = false">Hủy bỏ</button>
            <button class="btn-primary" @click="handleSave" :disabled="saveLoading">
              <el-icon class="is-loading mr-2" v-if="saveLoading"><Loading /></el-icon>
              <span>{{ saveLoading ? 'Đang lưu...' : 'Lưu thông tin' }}</span>
            </button>
          </div>
        </template>
      </el-dialog>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { 
  Plus, Edit, Delete, Search, Unlock, Lock, Van, 
  UserFilled, RefreshRight, Refresh, Message, Phone, OfficeBuilding, User, Key, Loading 
} from '@element-plus/icons-vue';
import api from '@/api/axios';
import { ElMessage, ElMessageBox } from 'element-plus';

const loading = ref(false);
const saveLoading = ref(false);
const dialogVisible = ref(false);
const formRef = ref(null);

// CHÚ Ý: Biến allUsers lưu toàn bộ dữ liệu gốc kéo từ server
const allUsers = ref([]);
const hubs = ref([]);

const filter = reactive({
  query: '',
  role_id: null,
  hub_id: null
});

// LOGIC MỚI: Xử lý lọc dữ liệu trực tiếp ở Frontend
const filteredUsers = computed(() => {
  return allUsers.value.filter(user => {
    // 1. Kiểm tra text (tên, username, số điện thoại)
    let matchQuery = true;
    if (filter.query) {
      const q = filter.query.toLowerCase();
      const username = (user.username || '').toLowerCase();
      const fullName = (user.full_name || '').toLowerCase();
      const phone = user.phone_number || '';
      
      matchQuery = username.includes(q) || fullName.includes(q) || phone.includes(q);
    }
    
    // 2. Kiểm tra Role
    let matchRole = true;
    if (filter.role_id) {
      matchRole = user.role_id === filter.role_id;
    }
    
    // 3. Kiểm tra Bưu cục
    let matchHub = true;
    if (filter.hub_id) {
      // Đề phòng API trả về primary_hub_id trực tiếp hoặc lồng trong object
      const userHubId = user.primary_hub_id || user.primary_hub?.hub_id;
      matchHub = userHubId === filter.hub_id;
    }
    
    return matchQuery && matchRole && matchHub;
  });
});

const userForm = reactive({
  user_id: null,
  username: '',
  password: '',
  full_name: '',
  email: '',
  phone_number: '',
  role_id: 3, 
  primary_hub_id: null,
  vehicle_plate: '',
  is_active: true
});

const rules = {
  username: [{ required: true, message: 'Nhập tên đăng nhập', trigger: 'blur' }],
  full_name: [{ required: true, message: 'Nhập họ tên nhân viên', trigger: 'blur' }],
  password: [{ required: true, message: 'Nhập mật khẩu', trigger: 'blur', min: 6 }], 
  role_id: [{ required: true, message: 'Chọn chức vụ', trigger: 'change' }],
  primary_hub_id: [{ required: true, message: 'Chọn bưu cục làm việc', trigger: 'change' }]
};

// Khởi tạo Avatar Chữ cái đầu
const getInitials = (name) => {
  if (!name) return 'U';
  const parts = name.trim().split(' ');
  return parts[parts.length - 1].charAt(0).toUpperCase();
};

const getRoleTypeClass = (type) => {
  const map = {
    'danger': 'bg-danger',
    'primary': 'bg-primary',
    'info': 'bg-info',
    'warning': 'bg-warning',
    'success': 'bg-success'
  };
  return map[type] || 'bg-info';
};

const fetchData = async () => {
  loading.value = true;
  try {
    const [usersRes, hubsRes] = await Promise.all([
      // LOẠI BỎ params: filter ở đây để kéo toàn bộ dữ liệu về một lần
      api.get('/api/users'),
      api.get('/api/hubs')
    ]);
    
    allUsers.value = Array.isArray(usersRes.data) ? usersRes.data : (usersRes.data.items || usersRes.data.data || []);
    hubs.value = Array.isArray(hubsRes.data) ? hubsRes.data : (hubsRes.data.items || hubsRes.data.data || []);
  } catch (err) {
    ElMessage.error('Không thể kết nối máy chủ để lấy dữ liệu nhân sự');
  } finally {
    loading.value = false;
  }
};

const resetFilters = () => {
  filter.query = '';
  filter.role_id = null;
  filter.hub_id = null;
  // Bỏ fetchData() ở đây vì filteredUsers sẽ tự phản ứng tức thời
};

const openDialog = (row) => {
  if (row) {
    Object.assign(userForm, {
      user_id: row.user_id,
      username: row.username,
      password: '', 
      full_name: row.full_name,
      email: row.email,
      phone_number: row.phone_number,
      role_id: row.role_id,
      primary_hub_id: row.primary_hub_id || row.primary_hub?.hub_id, // Lấy cẩn thận ID
      vehicle_plate: row.vehicle_plate || '',
      is_active: row.is_active
    });
    rules.password[0].required = false; 
  } else {
    Object.assign(userForm, {
      user_id: null,
      username: '',
      password: '',
      full_name: '',
      email: '',
      phone_number: '',
      role_id: 3,
      primary_hub_id: null,
      vehicle_plate: '',
      is_active: true
    });
    rules.password[0].required = true;
  }
  dialogVisible.value = true;
};

const handleSave = async () => {
  if (!formRef.value) return;
  await formRef.value.validate(async (valid) => {
    if (valid) {
      saveLoading.value = true;
      try {
        const payload = { ...userForm };
        
        if (payload.user_id && !payload.password) delete payload.password;
        delete payload.user_id; 

        if (userForm.user_id) {
          await api.put(`/api/users/${userForm.user_id}`, payload);
          ElMessage.success('Đã cập nhật thông tin nhân viên');
        } else {
          await api.post('/api/users', payload);
          ElMessage.success('Đã tạo tài khoản nhân viên mới');
        }
        
        dialogVisible.value = false;
        fetchData(); // Lưu thành công thì tải lại DB mới nhất
      } catch (err) {
        let errorMessage = 'Lỗi khi lưu dữ liệu';
        
        if (err.response?.status === 422) {
          const details = err.response.data.detail;
          if (Array.isArray(details) && details.length > 0) {
            const fieldName = details[0].loc[details[0].loc.length - 1] || 'Dữ liệu';
            errorMessage = `Lỗi ô "${fieldName}": ${details[0].msg}`;
          }
        } else {
          errorMessage = err.response?.data?.detail || errorMessage;
        }

        ElMessage.error(errorMessage);
      } finally {
        saveLoading.value = false;
      }
    }
  });
};

const toggleStatus = async (row, status) => {
  try {
     await api.patch(`/api/users/${row.user_id}/status`, { is_active: status });
     row.is_active = status;
     ElMessage.success(status ? 'Đã mở khóa tài khoản' : 'Đã tạm dừng tài khoản');
     
     // Cập nhật ngầm trong mảng gốc để data table không bị chớp
     const index = allUsers.value.findIndex(u => u.user_id === row.user_id);
     if (index !== -1) allUsers.value[index].is_active = status;

  } catch (err) {
     ElMessage.error('Thao tác trạng thái thất bại');
  }
};

const handleDelete = (row) => {
  ElMessageBox.confirm(
    `Vô hiệu hóa hoàn toàn nhân sự <strong>${row.full_name}</strong> khỏi hệ thống?`, 
    'Xác nhận vô hiệu hóa', 
    {
      confirmButtonText: 'Đồng ý',
      cancelButtonText: 'Hủy',
      type: 'error',
      dangerouslyUseHTMLString: true,
      customClass: 'modern-message-box'
    }
  ).then(async () => {
    try {
      await api.delete(`/api/users/${row.user_id}`);
      ElMessage.success('Đã xóa nhân viên khỏi danh sách hoạt động');
      fetchData();
    } catch (err) {
      ElMessage.error('Không thể xóa nhân viên này');
    }
  }).catch(() => {});
};

const getRoleType = (id) => {
  const map = {
    1: 'danger',  // Admin
    2: 'primary', // Manager
    3: 'info',    // Warehouse
    4: 'warning', // Shipper
    5: 'success'  // Accountant
  };
  return map[id] || 'info';
};

const getRoleName = (id) => {
  const map = {
    1: 'SUPER_ADMIN',
    2: 'HUB_MANAGER',
    3: 'WAREHOUSE_STAFF',
    4: 'SHIPPER',
    5: 'ACCOUNTANT'
  };
  return map[id] || 'N/A';
};

onMounted(fetchData);
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

/* Base Layout */
.modern-user-management {
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

.mb-24 { margin-bottom: 24px; }
.w-full { width: 100%; }
.mt-4 { margin-top: 16px; }

/* Header */
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
.icon-box.primary { background: rgba(67, 24, 255, 0.1); color: #4318FF; }

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

/* Filters Card */
.content-card {
  background: #FFFFFF;
  border-radius: 20px;
  padding: 24px;
  box-shadow: 0px 4px 20px rgba(0, 0, 0, 0.02);
}

.filter-card {
  padding: 20px 24px;
}

.filter-row {
  align-items: flex-end;
}

.filter-label {
  font-size: 13px;
  font-weight: 700;
  color: #2B3674;
  margin-bottom: 8px;
}

.filter-action-col {
  display: flex;
  gap: 12px;
}

:deep(.modern-input .el-input__wrapper),
:deep(.modern-select .el-input__wrapper) {
  background: #F8FAFC;
  box-shadow: none !important;
  border: 1px solid #E2E8F0;
  border-radius: 10px;
  padding: 6px 12px;
  transition: all 0.3s;
}

:deep(.modern-input .el-input__wrapper:hover),
:deep(.modern-select .el-input__wrapper:hover),
:deep(.modern-input .el-input__wrapper.is-focus),
:deep(.modern-select .el-input__wrapper.is-focus) {
  border-color: #4318FF;
  background: #FFFFFF;
}

/* Table Styles */
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

/* User Profile Column */
.user-profile {
  display: flex;
  align-items: center;
  gap: 12px;
}

.avatar-circle {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 16px;
  color: white;
}
.bg-danger { background: #EE5D50; }
.bg-primary { background: #4318FF; }
.bg-info { background: #8F9BBA; }
.bg-warning { background: #FFB547; }
.bg-success { background: #05CD99; }

.user-details {
  display: flex;
  flex-direction: column;
}

.fw-bold { font-weight: 700; }
.text-dark { color: #1B2559; }
.text-xs { font-size: 12px; }
.text-muted { color: #A3AED0; display: flex; align-items: center; margin-top: 4px; }

/* Username & Contact */
.username-badge {
  font-family: 'Courier New', Courier, monospace;
  font-weight: 700;
  color: #4318FF;
  background: #F4F7FE;
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 13px;
}

.contact-text {
  display: flex;
  align-items: center;
  font-weight: 600;
  color: #2B3674;
}

/* Work Info */
.work-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.hub-name {
  display: flex;
  align-items: center;
  font-size: 13px;
  color: #2B3674;
  font-weight: 600;
}

.vehicle-plate {
  display: inline-flex;
  align-items: center;
  background: rgba(255, 181, 71, 0.1);
  color: #FFB547;
  font-size: 12px;
  font-weight: 800;
  padding: 2px 8px;
  border-radius: 6px;
  width: fit-content;
}

/* Tags & Pills */
.modern-tag {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 800;
}

.modern-tag .dot { width: 6px; height: 6px; border-radius: 50%; }

.tag-danger { background: rgba(238, 93, 80, 0.1); color: #EE5D50; }
.tag-danger .dot { background: #EE5D50; box-shadow: 0 0 0 2px rgba(238,93,80,0.2); }

.tag-primary { background: rgba(67, 24, 255, 0.1); color: #4318FF; }
.tag-primary .dot { background: #4318FF; box-shadow: 0 0 0 2px rgba(67,24,255,0.2); }

.tag-info { background: rgba(143, 155, 186, 0.1); color: #8F9BBA; }
.tag-info .dot { background: #8F9BBA; box-shadow: 0 0 0 2px rgba(143,155,186,0.2); }

.tag-warning { background: rgba(255, 181, 71, 0.1); color: #FFB547; }
.tag-warning .dot { background: #FFB547; box-shadow: 0 0 0 2px rgba(255,181,71,0.2); }

.tag-success { background: rgba(5, 205, 153, 0.1); color: #05CD99; }
.tag-success .dot { background: #05CD99; box-shadow: 0 0 0 2px rgba(5,205,153,0.2); }

.status-pill {
  display: inline-block;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 700;
}
.status-pill.active { background: #05CD99; color: white; }
.status-pill.locked { background: #E9EDF7; color: #8F9BBA; }

/* Buttons */
.btn-primary {
  background: #4318FF;
  color: white;
  border: none;
  padding: 12px 20px;
  border-radius: 12px;
  font-weight: 700;
  font-family: inherit;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
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

.btn-secondary {
  background: #F4F7FE;
  color: #2B3674;
  border: none;
  padding: 12px 20px;
  border-radius: 12px;
  font-weight: 700;
  font-family: inherit;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-secondary:hover { background: #E9EDF7; }

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

.icon-btn.success { background: #F0FDF4; color: #05CD99; }
.icon-btn.success:hover { background: #05CD99; color: white; }

.icon-btn.warning { background: #FFF9F0; color: #FFB547; }
.icon-btn.warning:hover { background: #FFB547; color: white; }

.icon-btn.delete { background: #FFF0F0; color: #EE5D50; }
.icon-btn.delete:hover { background: #EE5D50; color: white; }

/* Dialog Customization */
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

.form-section-title {
  font-size: 14px;
  font-weight: 800;
  color: #1B2559;
  margin-bottom: 16px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

:deep(.modern-form .el-form-item__label) {
  font-weight: 700;
  color: #2B3674;
  margin-bottom: 8px;
}

:deep(.modern-form .el-input__wrapper),
:deep(.modern-form .el-select__wrapper) {
  background: #F8FAFC;
  box-shadow: 0 0 0 1px #E2E8F0 inset;
  border-radius: 10px;
  padding: 8px 12px;
  transition: all 0.3s ease;
}

:deep(.modern-form .el-input__wrapper:hover),
:deep(.modern-form .el-select__wrapper:hover) {
  box-shadow: 0 0 0 1px #4318FF inset;
}

:deep(.modern-form .el-input__wrapper.is-focus),
:deep(.modern-form .el-select__wrapper.is-focus) {
  box-shadow: 0 0 0 2px rgba(67, 24, 255, 0.2) inset !important;
  background: #FFFFFF;
}

/* Animations */
.animate-fade-in { animation: fadeIn 0.6s ease-out; }
.animate-fade-in-up { animation: fadeInUp 0.6s ease-out; }

@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }

/* Responsive */
@media (max-width: 992px) {
  .filter-col { margin-bottom: 16px; }
}

@media (max-width: 768px) {
  .page-header { flex-direction: column; align-items: flex-start; }
  .header-actions, .filter-action-col { width: 100%; flex-direction: column; }
  .filter-action-col .btn-primary, .filter-action-col .btn-secondary { width: 100%; margin: 0; }
}
</style>