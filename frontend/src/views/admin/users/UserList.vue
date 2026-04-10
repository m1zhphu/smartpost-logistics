<template>
  <div class="user-management-page">
    <div class="page-header flex-between mb-4">
      <div class="title-section">
        <h2 class="misa-title">Quản lý Nhân sự (Staff)</h2>
        <p class="text-muted">Hệ thống phân quyền 5 cấp: Admin, Quản lý, Kho, Shipper, Kế toán</p>
      </div>
      <div class="actions">
        <el-button type="primary" :icon="Plus" @click="openDialog(null)">Thêm Nhân viên</el-button>
      </div>
    </div>

    <el-card class="mb-4 shadow-sm">
      <el-row :gutter="15">
        <el-col :span="6">
          <el-input v-model="filter.query" placeholder="Tìm tên, SĐT, Username" prefix-icon="Search" clearable @keyup.enter="fetchData" />
        </el-col>
        <el-col :span="6">
          <el-select v-model="filter.role_id" placeholder="Lọc theo chức vụ" clearable class="w-full">
            <el-option label="Quản trị hệ thống" :value="1" />
            <el-option label="Quản lý bưu cục" :value="2" />
            <el-option label="Nhân viên kho" :value="3" />
            <el-option label="Tài xế (Shipper)" :value="4" />
            <el-option label="Kế toán" :value="5" />
          </el-select>
        </el-col>
        <el-col :span="6">
          <el-select v-model="filter.hub_id" placeholder="Lọc theo bưu cục" clearable class="w-full">
            <el-option v-for="hub in hubs" :key="hub.hub_id" :label="hub.hub_name" :value="hub.hub_id" />
          </el-select>
        </el-col>
        <el-col :span="6" class="flex-end">
           <el-button type="primary" @click="fetchData">Lọc dữ liệu</el-button>
           <el-button @click="resetFilters">Làm mới</el-button>
        </el-col>
      </el-row>
    </el-card>

    <el-card class="shadow-sm">
      <el-table :data="users" v-loading="loading" stripe border style="width: 100%">
        <el-table-column prop="username" label="Tên đăng nhập" width="130" fixed />
        
        <el-table-column prop="full_name" label="Họ và tên" min-width="180">
           <template #default="{ row }">
              <div class="font-bold">{{ row.full_name }}</div>
              <div class="text-xs text-muted">{{ row.email || 'Chưa có email' }}</div>
           </template>
        </el-table-column>

        <el-table-column label="Chức vụ" width="160">
          <template #default="{ row }">
            <el-tag :type="getRoleType(row.role_id)" size="small" effect="dark">
              {{ getRoleName(row.role_id) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="phone_number" label="Điện thoại" width="120" />
        
        <el-table-column label="Bưu cục / Phương tiện" min-width="180">
           <template #default="{ row }">
              <div class="text-sm">{{ row.primary_hub?.hub_name || 'Hệ thống' }}</div>
              <div v-if="row.role_id === 4 && row.vehicle_plate" class="text-xs text-orange font-bold mt-1">
                 <el-icon class="mr-1"><Van /></el-icon> {{ row.vehicle_plate }}
              </div>
           </template>
        </el-table-column>

        <el-table-column label="Trạng thái" width="100">
           <template #default="{ row }">
              <el-tag :type="row.is_active ? 'success' : 'danger'" size="small">
                 {{ row.is_active ? 'Hoạt động' : 'Tạm khóa' }}
              </el-tag>
           </template>
        </el-table-column>

        <el-table-column label="Thao tác" width="160" fixed="right" align="center">
          <template #default="{ row }">
            <div class="flex gap-1 justify-center">
              <el-button link type="primary" @click="openDialog(row)">
                <el-icon><Edit /></el-icon>
              </el-button>
              <el-button link v-if="!row.is_active" type="success" @click="toggleStatus(row, true)">
                <el-icon><Unlock /></el-icon>
              </el-button>
              <el-button link v-else type="warning" @click="toggleStatus(row, false)">
                <el-icon><Lock /></el-icon>
              </el-button>
              <el-button link type="danger" @click="handleDelete(row)">
                <el-icon><Delete /></el-icon>
              </el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog 
      v-model="dialogVisible" 
      :title="userForm.user_id ? 'Hiệu chỉnh nhân sự' : 'Đăng ký nhân viên mới'" 
      width="650px"
      destroy-on-close
    >
      <el-form :model="userForm" :rules="rules" ref="formRef" label-position="top">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="Tên đăng nhập" prop="username">
              <el-input v-model="userForm.username" placeholder="vd: tung_shipper" :disabled="!!userForm.user_id" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="Mật khẩu" :prop="userForm.user_id ? '' : 'password'">
              <el-input v-model="userForm.password" type="password" :placeholder="userForm.user_id ? 'Bỏ trống nếu giữ nguyên' : 'Tối thiểu 6 ký tự'" show-password />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="Họ và tên nhân viên" prop="full_name">
              <el-input v-model="userForm.full_name" placeholder="Nguyễn Văn A" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="Số điện thoại liên hệ" prop="phone_number">
              <el-input v-model="userForm.phone_number" placeholder="09xxxxxxx" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="Email công việc (Dùng để nhận thông báo)" prop="email">
           <el-input v-model="userForm.email" placeholder="nv.a@smartpost.vn" />
        </el-form-item>

        <el-row :gutter="20">
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
        
        <el-form-item v-if="userForm.role_id === 4" label="Biển số xe công tác" prop="vehicle_plate">
           <el-input v-model="userForm.vehicle_plate" placeholder="29A-888.88" prefix-icon="Van" />
        </el-form-item>
      </el-form>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">Hủy bỏ</el-button>
          <el-button type="primary" @click="handleSave" :loading="saveLoading">Lưu thông tin</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { Plus, Edit, Delete, Search, Unlock, Lock, Van } from '@element-plus/icons-vue';
import api from '@/api/axios';
import { ElMessage, ElMessageBox } from 'element-plus';

const loading = ref(false);
const saveLoading = ref(false);
const dialogVisible = ref(false);
const formRef = ref(null);
const users = ref([]);
const hubs = ref([]);

const filter = reactive({
  query: '',
  role_id: null,
  hub_id: null
});

const userForm = reactive({
  user_id: null,
  username: '',
  password: '',
  full_name: '',
  email: '',
  phone_number: '',
  role_id: 3, // Mặc định là nhân viên kho
  primary_hub_id: null,
  vehicle_plate: '',
  is_active: true
});

const rules = {
  username: [{ required: true, message: 'Nhập tên đăng nhập', trigger: 'blur' }],
  full_name: [{ required: true, message: 'Nhập họ tên nhân viên', trigger: 'blur' }],
  password: [{ required: true, message: 'Nhập mật khẩu', trigger: 'blur', min: 6 }], // Điều chỉnh logic này trong handleOpen nếu cần
  role_id: [{ required: true, message: 'Chọn chức vụ', trigger: 'change' }],
  primary_hub_id: [{ required: true, message: 'Chọn bưu cục làm việc', trigger: 'change' }]
};

const fetchData = async () => {
  loading.value = true;
  try {
    const [usersRes, hubsRes] = await Promise.all([
      api.get('/api/users', { params: filter }),
      api.get('/api/hubs')
    ]);
    
    users.value = usersRes.data;
    hubs.value = hubsRes.data;
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
  fetchData();
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
      primary_hub_id: row.primary_hub_id,
      vehicle_plate: row.vehicle_plate || '',
      is_active: row.is_active
    });
    rules.password[0].required = false; // Khi sửa không bắt buộc pass
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
        
        // 1. Xóa bỏ các trường không cần thiết / gây lỗi 422 khi gửi lên Backend
        if (payload.user_id && !payload.password) delete payload.password;
        delete payload.user_id; // KHÔNG gửi user_id vào trong Body

        if (userForm.user_id) {
          await api.put(`/api/users/${userForm.user_id}`, payload);
          ElMessage.success('Đã cập nhật thông tin nhân viên');
        } else {
          await api.post('/api/users', payload);
          ElMessage.success('Đã tạo tài khoản nhân viên mới');
        }
        
        dialogVisible.value = false;
        fetchData();
      } catch (err) {
        // 2. Xử lý "giải mã" lỗi 422 của FastAPI để hiển thị lên màn hình
        let errorMessage = 'Lỗi khi lưu dữ liệu';
        
        if (err.response?.status === 422) {
          const details = err.response.data.detail;
          if (Array.isArray(details) && details.length > 0) {
            // Lấy tên của ô bị sai (nằm ở cuối mảng loc)
            const fieldName = details[0].loc[details[0].loc.length - 1] || 'Dữ liệu';
            errorMessage = `Lỗi ô "${fieldName}": ${details[0].msg}`;
          }
        } else {
          // Các lỗi 400, 403, 404, 500 bình thường
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
  } catch (err) {
     ElMessage.error('Thao tác trạng thái thất bại');
  }
};

const handleDelete = (row) => {
  ElMessageBox.confirm(`Vô hiệu hóa hoàn toàn nhân sự ${row.full_name}?`, 'Xác nhận xóa', {
    confirmButtonText: 'Đồng ý',
    cancelButtonText: 'Hủy',
    type: 'error'
  }).then(async () => {
    try {
      await api.delete(`/api/users/${row.user_id}`);
      ElMessage.success('Đã xóa nhân viên khỏi danh sách hoạt động');
      fetchData();
    } catch (err) {
      ElMessage.error('Không thể xóa nhân viên này');
    }
  });
};

// Map màu sắc Tag cho chức vụ
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

// Map tên hiển thị cho chức vụ
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
.el-button.is-link { background: transparent !important; }
.w-full { width: 100%; }
.mb-4 { margin-bottom: 1rem; }
.flex-between { display: flex; justify-content: space-between; align-items: center; }
.flex-end { display: flex; justify-content: flex-end; gap: 10px; }
.text-muted { color: #6B7280; font-size: 0.9rem; }
.text-orange { color: #E6A23C; }
.font-bold { font-weight: bold; }
.shadow-sm { box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05); }
.mt-1 { margin-top: 4px; }
</style>