<template>
  <div class="hub-management-page">
    <div class="page-header flex-between mb-4">
      <div class="title-section">
        <h2 class="misa-title">Quản lý Bưu cục (Hubs)</h2>
        <p class="text-muted">Định nghĩa mạng lưới vận hành của hệ thống</p>
      </div>
      <div class="actions">
        <el-button type="primary" :icon="Plus" @click="openDialog(null)">Thêm Bưu cục mới</el-button>
      </div>
    </div>

    <el-card>
      <el-table :data="hubs" v-loading="loading" stripe border>
        <el-table-column prop="hub_code" label="Mã BC" width="120" fixed />
        <el-table-column prop="hub_name" label="Tên Bưu cục" width="220" />
        <el-table-column prop="hub_type" label="Loại hình" width="120">
          <template #default="{ row }">
            <el-tag :type="row.hub_type === 'CENTER' ? 'danger' : 'info'">{{ row.hub_type }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="province_id" label="Tỉnh/Thành ID" width="120" />
        <el-table-column prop="address_detail" label="Địa chỉ chi tiết" />
        
        <el-table-column label="Trưởng bưu cục" width="180">
          <template #default="{ row }">
            <div class="manager-info">
              <span>{{ getManagerName(row.manager_id) }}</span>
            </div>
          </template>
        </el-table-column>
        
        <el-table-column prop="status" label="Trạng thái" width="120">
          <template #default="{ row }">
            <el-switch v-model="row.status" @change="toggleStatus(row)" />
          </template>
        </el-table-column>
        <el-table-column label="Thao tác" width="140" fixed="right" align="center">
          <template #default="{ row }">
            <div class="flex gap-2 justify-center">
              <el-button link type="primary" @click="openDialog(row)">
                <el-icon><Edit /></el-icon>
              </el-button>
              <el-button link type="danger" @click="handleDelete(row)">
                <el-icon><Delete /></el-icon>
              </el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="dialogVisible" :title="hubForm.hub_id ? 'Cập nhật Bưu cục' : 'Thêm Bưu cục mới'" width="500px">
      <el-form :model="hubForm" :rules="rules" ref="formRef" label-position="top">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="Mã bưu cục" prop="hub_code">
              <el-input v-model="hubForm.hub_code" placeholder="BC-HCM-01" :disabled="!!hubForm.hub_id" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="Phân cấp" prop="hub_type">
              <el-select v-model="hubForm.hub_type" class="w-full">
                <el-option label="Trung tâm (Center)" value="CENTER" />
                <el-option label="Bưu cục (Hub)" value="HUB" />
                <el-option label="Điểm nhận (Station)" value="STATION" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-form-item label="Tên bưu cục" prop="hub_name">
          <el-input v-model="hubForm.hub_name" placeholder="Bưu cục Tân Bình" />
        </el-form-item>
        
        <el-form-item label="Mã định danh Tỉnh/Thành" prop="province_id">
           <el-input-number v-model="hubForm.province_id" :min="1" class="w-full" />
        </el-form-item>

        <el-form-item label="Địa chỉ chi tiết" prop="address_detail">
          <el-input v-model="hubForm.address_detail" type="textarea" placeholder="Số 10, Lý Thường Kiệt..." />
        </el-form-item>

        <el-form-item label="Người quản lý" prop="manager_id">
           <el-select v-model="hubForm.manager_id" placeholder="Chọn nhân viên quản lý" class="w-full" filterable>
              <el-option v-for="user in admins" :key="user.user_id" :label="user.full_name || user.username" :value="user.user_id" />
           </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">Hủy</el-button>
          <el-button type="primary" @click="handleSave" :loading="saveLoading">Xác nhận</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { Plus, Edit, Delete } from '@element-plus/icons-vue';
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

// Hàm mới: Tra cứu tên nhân viên quản lý từ ID
const getManagerName = (managerId) => {
  if (!managerId) return 'Chưa phân công';
  // Tìm trong mảng admins xem ai có user_id trùng khớp
  const manager = admins.value.find(u => u.user_id === managerId);
  // Ưu tiên hiển thị full_name, nếu không có thì dùng username, cuối cùng là fallback
  return manager ? (manager.full_name || manager.username) : `ID: ${managerId}`;
};

const fetchData = async () => {
  loading.value = true;
  try {
    const [hubsRes, usersRes] = await Promise.all([
      api.get('/api/hubs'),
      // Lưu ý: Nếu API '/api/users' cần cấu hình để lọc admin, hãy đảm bảo query param ở đây hợp lệ
      api.get('/api/users')
    ]);
    
    hubs.value = hubsRes.data;
    // Đảm bảo admins là một mảng
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
          // Thêm Idempotency-Key để đề phòng backend yêu cầu (nếu không cần thì có thể bỏ header này)
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
  ElMessageBox.confirm(`Bạn có chắc chắn muốn xóa bưu cục ${row.hub_name}?`, 'Cảnh báo', {
    confirmButtonText: 'Xóa',
    cancelButtonText: 'Hủy',
    type: 'warning'
  }).then(async () => {
    try {
      await api.delete(`/api/hubs/${row.hub_id}`);
      ElMessage.success('Đã xóa bưu cục!');
      fetchData();
    } catch (err) {
      ElMessage.error('Xóa không thành công.');
    }
  });
};

const toggleStatus = async (row) => {
  try {
    await api.patch(`/api/hubs/${row.hub_id}/status`, { status: row.status });
    ElMessage.success(`Đã cập nhật trạng thái hoạt động bưu cục.`);
  } catch (error) {
    // 1. Lấy thông báo lỗi chi tiết từ Backend gửi lên
    const errorMsg = error.response?.data?.detail || 'Lỗi hệ thống khi cập nhật trạng thái';
    ElMessage.error(errorMsg);
    
    // 2. QUAN TRỌNG: Trả cái nút gạt (Switch) về lại trạng thái cũ
    row.status = !row.status;
  }
};

onMounted(fetchData);
</script>

<style scoped>
.el-button.is-link { background: transparent !important; }
.w-full { width: 100%; }
.mb-4 { margin-bottom: 1rem; }
.manager-info { font-weight: 600; color: #4B5563; }
.flex-between {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>