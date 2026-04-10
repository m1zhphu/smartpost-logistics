<template>
  <div class="service-config-page">
    <div class="page-header flex-between mb-4">
      <div class="header-left flex-center gap-2">
        <div class="header-icon">
          <el-icon><Setting /></el-icon>
        </div>
        <div>
          <h2 class="misa-title">Cấu hình Dịch vụ Tiện ích</h2>
          <p class="text-muted">Quản lý giá cước các dịch vụ cộng thêm (Đồng kiểm, Bảo hiểm...)</p>
        </div>
      </div>
      <div class="header-right">
        <el-button @click="fetchServices" :icon="Refresh" circle title="Làm mới" />
        <el-button type="primary" :icon="Plus" @click="openDialog(null)">
          Thêm Dịch vụ mới
        </el-button>
      </div>
    </div>

    <el-card shadow="never" class="table-card">
      <el-table :data="services" v-loading="loading" stripe border style="width: 100%">
        
        <el-table-column label="Mã Dịch vụ" width="150" align="center">
          <template #default="{ row }">
            <el-tag type="info" class="font-mono">{{ row.service_code }}</el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="service_name" label="Tên Dịch vụ" min-width="200">
          <template #default="{ row }">
            <span class="font-bold">{{ row.service_name }}</span>
          </template>
        </el-table-column>

        <el-table-column label="Loại Phí" width="150" align="center">
          <template #default="{ row }">
            <el-tag :type="row.fee_type === 'FIXED' ? 'primary' : 'warning'" size="small">
              {{ row.fee_type === 'FIXED' ? 'Giá cố định' : 'Phần trăm (%)' }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="Mức Phí" width="180" align="right">
          <template #default="{ row }">
            <div class="price-cell">
              <span class="price-value">{{ formatMoney(row.fee_value) }}</span>
              <span class="price-unit">{{ row.fee_type === 'FIXED' ? 'VNĐ' : '% COD' }}</span>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="Trạng thái" width="120" align="center">
          <template #default="{ row }">
            <el-switch 
              v-model="row.is_active" 
              @change="toggleStatus(row)" 
              style="--el-switch-on-color: #13ce66"
            />
          </template>
        </el-table-column>

        <el-table-column label="Thao tác" width="100" align="center" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" :icon="Edit" @click="openDialog(row)" />
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog
      v-model="dialogVisible"
      :title="serviceForm.id ? '✏️ Cập nhật Dịch vụ' : '➕ Thêm Dịch vụ mới'"
      width="500px"
      destroy-on-close
    >
      <el-form :model="serviceForm" :rules="formRules" ref="formRef" label-position="top">
        
        <el-row :gutter="20">
          <el-col :span="10">
            <el-form-item label="Mã hệ thống (Code)" prop="service_code">
              <el-input 
                v-model="serviceForm.service_code" 
                placeholder="VD: CO_CHECK" 
                :disabled="!!serviceForm.id" 
                class="font-mono uppercase"
              />
            </el-form-item>
          </el-col>
          <el-col :span="14">
            <el-form-item label="Tên hiển thị" prop="service_name">
              <el-input v-model="serviceForm.service_name" placeholder="VD: Dịch vụ Đồng kiểm" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="Cách tính phí" prop="fee_type">
          <el-radio-group v-model="serviceForm.fee_type" class="w-full flex">
            <el-radio-button label="FIXED" class="flex-1 text-center">Giá Cố định (VNĐ)</el-radio-button>
            <el-radio-button label="PERCENT" class="flex-1 text-center">Phần trăm (% COD)</el-radio-button>
          </el-radio-group>
        </el-form-item>

        <el-form-item :label="serviceForm.fee_type === 'FIXED' ? 'Số tiền (VNĐ)' : 'Tỉ lệ phần trăm (%)'" prop="fee_value">
          <el-input-number
            v-model="serviceForm.fee_value"
            :min="0"
            :step="serviceForm.fee_type === 'FIXED' ? 5000 : 0.5"
            class="w-full price-input"
            :controls="false"
            :formatter="val => val ? Number(val).toLocaleString('vi-VN') : ''"
            :parser="val => val.replace(/[^\d.]/g, '')"
          />
        </el-form-item>

        <el-form-item>
          <el-switch v-model="serviceForm.is_active" active-text="Đang áp dụng" inactive-text="Tạm khóa" />
        </el-form-item>

      </el-form>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialogVisible = false">Hủy bỏ</el-button>
          <el-button type="primary" @click="handleSave" :loading="saveLoading">Xác nhận</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { Setting, Plus, Edit, Refresh } from '@element-plus/icons-vue';
import api from '@/api/axios';
import { ElMessage } from 'element-plus';

const loading = ref(false);
const saveLoading = ref(false);
const dialogVisible = ref(false);
const formRef = ref(null);
const services = ref([]);

const serviceForm = reactive({
  id: null,
  service_code: '',
  service_name: '',
  fee_type: 'FIXED',
  fee_value: 0,
  is_active: true
});

const formRules = {
  service_code: [{ required: true, message: 'Nhập mã dịch vụ', trigger: 'blur' }],
  service_name: [{ required: true, message: 'Nhập tên dịch vụ', trigger: 'blur' }],
  fee_value: [{ required: true, message: 'Nhập mức phí', trigger: 'blur' }]
};

const formatMoney = (val) => {
  if (val === null || val === undefined) return '0';
  return Number(val).toLocaleString('vi-VN');
};

const fetchServices = async () => {
  loading.value = true;
  try {
    const res = await api.get('/api/pricing/extra-services');
    services.value = res.data || [];
  } catch (err) {
    ElMessage.error('Lỗi khi tải danh sách dịch vụ');
  } finally {
    loading.value = false;
  }
};

const openDialog = (row) => {
  if (row) {
    Object.assign(serviceForm, row);
  } else {
    Object.assign(serviceForm, {
      id: null,
      service_code: '',
      service_name: '',
      fee_type: 'FIXED',
      fee_value: 0,
      is_active: true
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
        if (serviceForm.id) {
          await api.put(`/api/pricing/extra-services/${serviceForm.id}`, serviceForm);
          ElMessage.success('Cập nhật thành công!');
        } else {
          await api.post('/api/pricing/extra-services', serviceForm);
          ElMessage.success('Thêm dịch vụ thành công!');
        }
        dialogVisible.value = false;
        fetchServices();
      } catch (err) {
        ElMessage.error(err.response?.data?.detail || 'Lỗi lưu dữ liệu.');
      } finally {
        saveLoading.value = false;
      }
    }
  });
};

const toggleStatus = async (row) => {
  try {
    await api.put(`/api/pricing/extra-services/${row.id}`, { ...row });
    ElMessage.success('Đã cập nhật trạng thái');
  } catch (err) {
    row.is_active = !row.is_active; // revert
    ElMessage.error('Lỗi khi cập nhật trạng thái');
  }
};

onMounted(() => {
  fetchServices();
});
</script>

<style scoped>
.service-config-page { padding: 0; }
.header-icon { font-size: 28px; color: var(--el-color-primary); }
.flex-between { display: flex; justify-content: space-between; align-items: center; }
.flex-center { display: flex; align-items: center; }
.gap-2 { gap: 12px; }
.mb-4 { margin-bottom: 20px; }
.misa-title { margin: 0; font-size: 1.5rem; font-weight: bold; }
.text-muted { color: #6b7280; font-size: 0.9rem; margin: 4px 0 0; }
.font-mono { font-family: monospace; font-size: 0.9rem; }
.font-bold { font-weight: bold; }
.uppercase :deep(input) { text-transform: uppercase; }

.price-cell { display: flex; align-items: baseline; justify-content: flex-end; gap: 4px; }
.price-value { font-size: 1.1rem; font-weight: 700; color: #16a34a; }
.price-unit { font-size: 0.8rem; color: #6b7280; }

.w-full { width: 100%; }
.flex { display: flex; }
.flex-1 { flex: 1; }
:deep(.price-input .el-input__inner) { font-size: 1.2rem; font-weight: bold; color: #16a34a; text-align: right; }
</style>    