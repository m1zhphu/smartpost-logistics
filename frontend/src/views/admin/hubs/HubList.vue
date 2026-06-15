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

      <!-- ===== DESKTOP TABLE (ẩn trên mobile) ===== -->
      <div class="content-card table-wrapper animate-fade-in-up desktop-only">
        <el-table 
          :data="hubs" 
          v-loading="loading" 
          class="modern-table"
          row-class-name="modern-row"
          style="width: 100%"
        >
          <!-- Mã Bưu cục -->
          <el-table-column prop="hub_code" label="Mã BC" min-width="120">
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
          <el-table-column prop="province_id" label="Tỉnh/Thành" min-width="180" align="center">
            <template #default="{ row }">
              <div class="province-cell">
                <span class="fw-bold text-dark">{{ getProvinceName(row.province_id) || 'Chưa chọn' }}</span>
                <span class="id-badge">{{ row.province_id || '---' }}</span>
              </div>
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
          <el-table-column label="Thao tác" width="120" align="center">
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

      <!-- ===== MOBILE CARD LIST (chỉ hiện trên điện thoại) ===== -->
      <div class="mobile-only" v-loading="loading">
        <el-empty v-if="hubs.length === 0 && !loading" description="Chưa có dữ liệu bưu cục" :image-size="80" />
        <div
          v-for="hub in hubs"
          :key="hub.hub_id"
          class="mobile-hub-card animate-fade-in-up"
        >
          <!-- Card Header: Mã + Badge loại -->
          <div class="mhc-header">
            <span class="code-text">{{ hub.hub_code }}</span>
            <div class="modern-tag" :class="getHubTypeClass(hub.hub_type)">
              <span class="dot"></span>
              {{ getHubTypeName(hub.hub_type) }}
            </div>
          </div>

          <!-- Tên bưu cục -->
          <div class="mhc-name">{{ hub.hub_name }}</div>

          <!-- Thông tin chi tiết -->
          <div class="mhc-info-list">
            <div class="mhc-info-row">
              <span class="mhc-label">Tỉnh/Thành</span>
              <div class="province-cell">
                <span class="fw-bold text-dark">{{ getProvinceName(hub.province_id) || 'Chưa chọn' }}</span>
                <span class="id-badge">{{ hub.province_id || '---' }}</span>
              </div>
            </div>
            <div class="mhc-info-row">
              <span class="mhc-label">Trưởng BC</span>
              <span class="mhc-value">
                <el-icon style="font-size:12px; margin-right:4px;"><UserFilled /></el-icon>
                {{ getManagerName(hub.manager_id) }}
              </span>
            </div>
            <div class="mhc-info-row mhc-address">
              <span class="mhc-label">Địa chỉ</span>
              <span class="mhc-value mhc-address-text">
                <el-icon style="font-size:12px; margin-right:4px;"><Location /></el-icon>
                {{ hub.address_detail || 'Chưa cập nhật' }}
              </span>
            </div>
          </div>

          <!-- Footer: Trạng thái + Thao tác -->
          <div class="mhc-footer">
            <div class="mhc-status">
              <span class="mhc-label" style="margin-right:8px;">Hoạt động</span>
              <el-switch
                v-model="hub.status"
                @change="toggleStatus(hub)"
                style="--el-switch-on-color: #05CD99; --el-switch-off-color: #E2E8F0"
              />
            </div>
            <div class="action-buttons">
              <button class="icon-btn edit" @click="openDialog(hub)" title="Chỉnh sửa">
                <el-icon><Edit /></el-icon>
              </button>
              <button class="icon-btn delete" @click="handleDelete(hub)" title="Xóa">
                <el-icon><Delete /></el-icon>
              </button>
            </div>
          </div>
        </div>
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
                  <el-option label="Trung tâm" value="CENTER">
                    <span style="color: #FFB547; font-weight: bold;">Trung tâm</span>
                  </el-option>
                  <el-option label="Bưu cục" value="HUB">
                    <span style="color: #4318FF; font-weight: bold;">Bưu cục</span>
                  </el-option>
                  <el-option label="Điểm nhận" value="STATION">
                    <span style="color: #05CD99; font-weight: bold;">Điểm nhận</span>
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
          
          <el-form-item label="Tỉnh/Thành quản lý" prop="province_id">
             <el-select v-model="hubForm.province_id" class="w-full" filterable clearable placeholder="Chọn tỉnh/thành">
                <el-option
                  v-for="province in provinces"
                  :key="province.id"
                  :label="`${province.name} (#${province.id})`"
                  :value="province.id"
                />
             </el-select>
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
const provinces = ref([]);

const hubForm = reactive({
  hub_id: null,
  hub_code: '',
  hub_name: '',
  hub_type: 'HUB',
  province_id: null,
  address_detail: '',
  manager_id: null,
  status: true
});

const rules = {
  hub_code: [{ required: true, message: 'Vui lòng nhập mã bưu cục', trigger: 'blur' }],
  hub_name: [{ required: true, message: 'Vui lòng nhập tên bưu cục', trigger: 'blur' }],
  hub_type: [{ required: true, message: 'Vui lòng chọn phân cấp', trigger: 'change' }],
  province_id: [{ required: true, message: 'Vui lòng chọn tỉnh/thành quản lý', trigger: 'change' }]
};

const fetchProvinces = async () => {
  if (provinces.value.length) return;
  try {
    const res = await fetch('https://provinces.open-api.vn/api/');
    const data = await res.json();
    provinces.value = (Array.isArray(data) ? data : [])
      .map(p => ({ id: Number(p.code), name: p.name }))
      .filter(p => p.id && p.name);
  } catch (err) {
    ElMessage.error('Không thể lấy danh sách tỉnh/thành');
  }
};

const getProvinceName = (provinceId) => {
  const province = provinces.value.find(p => Number(p.id) === Number(provinceId));
  return province?.name || '';
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
      province_id: null,
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

onMounted(() => {
  fetchProvinces();
  fetchData();
});
</script>

<style scoped src="@/styles/admin/hubs/HubList.css"></style>
