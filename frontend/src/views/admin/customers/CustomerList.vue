<template>
  <div class="customer-management-page">
    <div class="page-header flex-between mb-4">
      <div class="title-section">
        <h2 class="misa-title">Quản lý Khách hàng (Shops/Partners)</h2>
        <p class="text-muted">Danh sách các đối tác gửi hàng thường xuyên</p>
      </div>
      <div class="actions">
        <el-button type="primary" :icon="Plus" @click="openDialog(null)">Thêm Khách hàng</el-button>
      </div>
    </div>

    <el-card class="mb-4">
      <el-input
        v-model="searchQuery"
        placeholder="Tìm theo tên shop, SĐT hoặc mã khách hàng"
        prefix-icon="Search"
        style="width: 400px"
        clearable
        @clear="fetchData"
        @keyup.enter="fetchData"
      />
    </el-card>

    <el-card>
      <el-table :data="customers" v-loading="loading" stripe border style="width:100%">
        <el-table-column prop="customer_code" label="Mã KH" width="100" fixed />

        <el-table-column label="Loại" width="90">
          <template #default="{ row }">
            <el-tag :type="row.customer_type === 'COMPANY' ? 'primary' : 'success'" size="small">
              {{ row.customer_type === 'COMPANY' ? 'Công ty' : 'Shop' }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="Tên Shop / Công ty" min-width="180">
          <template #default="{ row }">
            <p class="font-bold mb-0">{{ row.transaction_name || row.company_name || row.customer_code }}</p>
            <p class="text-xs text-muted mb-0" v-if="row.company_name && row.transaction_name">{{ row.company_name }}</p>
          </template>
        </el-table-column>

        <el-table-column label="Người đại diện" width="150">
          <template #default="{ row }">
            <span>{{ row.representative_name || '—' }}</span>
          </template>
        </el-table-column>

        <el-table-column label="Liên hệ" width="180">
          <template #default="{ row }">
            <p class="mb-0">{{ row.phone || '—' }}</p>
            <p class="text-xs text-muted mb-0">{{ row.email || '' }}</p>
          </template>
        </el-table-column>

        <el-table-column prop="address" label="Địa chỉ lấy hàng" min-width="200">
          <template #default="{ row }">
            <span class="text-sm">{{ row.address || '—' }}</span>
          </template>
        </el-table-column>

        <el-table-column label="Ngân hàng (COD)" width="180">
          <template #default="{ row }">
            <div v-if="row.bank_name" class="bank-info">
              <p class="font-bold text-xs mb-0">{{ row.bank_name }}</p>
              <p class="text-xs mb-0">{{ row.bank_number }}</p>
              <p class="text-xs text-muted mb-0">{{ row.bank_owner }}</p>
            </div>
            <span v-else class="text-muted text-xs">Chưa cập nhật</span>
          </template>
        </el-table-column>

        <el-table-column label="Trạng thái" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 'ACTIVE' ? 'success' : 'danger'" size="small">
              {{ row.status === 'ACTIVE' ? 'Hoạt động' : 'Ngừng' }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="Thao tác" width="120" fixed="right" align="center">
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

    <!-- Customer Dialog -->
    <el-dialog v-model="dialogVisible" :title="customerForm.id ? 'Cập nhật Khách hàng' : 'Thêm Khách hàng mới'" width="680px">
      <el-form :model="customerForm" :rules="rules" ref="formRef" label-position="top">

        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="Mã khách hàng" prop="customer_code">
              <el-input v-model="customerForm.customer_code" placeholder="KH001" :disabled="!!customerForm.id" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="Loại khách hàng">
              <el-select v-model="customerForm.customer_type" class="w-full">
                <el-option label="Shop / Cá nhân" value="SHOP" />
                <el-option label="Công ty / Doanh nghiệp" value="COMPANY" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="Trạng thái">
              <el-select v-model="customerForm.status" class="w-full">
                <el-option label="Hoạt động" value="ACTIVE" />
                <el-option label="Ngừng hợp tác" value="INACTIVE" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="Tên giao dịch (Tên Shop)" prop="name">
              <el-input v-model="customerForm.name" placeholder="Shop Thời trang Blue" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="Tên công ty (nếu có)">
              <el-input v-model="customerForm.company_name" placeholder="Công ty TNHH ABC" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="Người đại diện">
              <el-input v-model="customerForm.representative_name" placeholder="Nguyễn Văn A" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="Mã số thuế">
              <el-input v-model="customerForm.tax_code" placeholder="0123456789" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="Số điện thoại" prop="phone">
              <el-input v-model="customerForm.phone" placeholder="09xxxxxxx" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="Email">
              <el-input v-model="customerForm.email" placeholder="shop@example.com" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="Địa chỉ lấy hàng mặc định" prop="address">
          <el-input v-model="customerForm.address" type="textarea" :rows="2" placeholder="Số 1, Đường X, Phường Y, TP.HCM..." />
        </el-form-item>

        <el-divider>Thông tin tài khoản ngân hàng nhận COD</el-divider>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="Ngân hàng">
              <el-input v-model="customerForm.bank_name" placeholder="Vietcombank, BIDV..." />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="Số tài khoản">
              <el-input v-model="customerForm.bank_number" placeholder="123456789" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="Tên chủ tài khoản">
          <el-input v-model="customerForm.bank_owner" placeholder="NGUYEN VAN A" />
        </el-form-item>

      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">Hủy</el-button>
        <el-button type="primary" @click="handleSave" :loading="saveLoading">Xác nhận</el-button>
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
const searchQuery = ref('');
const formRef = ref(null);
const customers = ref([]);

const customerForm = reactive({
  id: null,
  customer_code: '',
  customer_type: 'SHOP',
  status: 'ACTIVE',
  name: '',            // → transaction_name trong DB
  company_name: '',
  representative_name: '',
  tax_code: '',
  phone: '',
  email: '',
  address: '',
  bank_name: '',
  bank_number: '',
  bank_owner: ''
});

const rules = {
  customer_code: [{ required: true, message: 'Nhập mã khách hàng', trigger: 'blur' }],
  name: [{ required: true, message: 'Nhập tên giao dịch/shop', trigger: 'blur' }],
  phone: [{ required: true, message: 'Nhập số điện thoại', trigger: 'blur' }],
};

const fetchData = async () => {
  loading.value = true;
  try {
    const res = await api.get('/api/customers', { params: { q: searchQuery.value } });
    customers.value = res.data;
  } catch (err) {
    ElMessage.error('Không thể lấy danh sách khách hàng');
  } finally {
    loading.value = false;
  }
};

const openDialog = (row) => {
  if (row) {
    Object.assign(customerForm, {
      id: row.customer_id || row.id,
      customer_code: row.customer_code,
      customer_type: row.customer_type || 'SHOP',
      status: row.status || 'ACTIVE',
      name: row.transaction_name || row.name || '',
      company_name: row.company_name || '',
      representative_name: row.representative_name || '',
      tax_code: row.tax_code || '',
      phone: row.phone || '',
      email: row.email || '',
      address: row.address || row.address_detail || '',
      bank_name: row.bank_name || '',
      bank_number: row.bank_number || '',
      bank_owner: row.bank_owner || ''
    });
  } else {
    Object.assign(customerForm, {
      id: null, customer_code: '', customer_type: 'SHOP', status: 'ACTIVE',
      name: '', company_name: '', representative_name: '', tax_code: '',
      phone: '', email: '', address: '',
      bank_name: '', bank_number: '', bank_owner: ''
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
        if (customerForm.id) {
          await api.put(`/api/customers/${customerForm.id}`, customerForm);
          ElMessage.success('Cập nhật khách hàng thành công!');
        } else {
          await api.post('/api/customers', customerForm);
          ElMessage.success('Thêm khách hàng mới thành công!');
        }
        dialogVisible.value = false;
        fetchData();
      } catch (err) {
        ElMessage.error(err.response?.data?.detail || 'Lỗi khi lưu thông tin khách hàng.');
      } finally {
        saveLoading.value = false;
      }
    }
  });
};

const handleDelete = (row) => {
  ElMessageBox.confirm(`Xóa khách hàng ${row.transaction_name || row.name}?`, 'Cảnh báo', {
    confirmButtonText: 'Xóa',
    cancelButtonText: 'Hủy',
    type: 'warning'
  }).then(async () => {
    try {
      await api.delete(`/api/customers/${row.customer_id || row.id}`);
      ElMessage.success('Đã xóa khách hàng!');
      fetchData();
    } catch (err) {
      ElMessage.error('Xóa không thành công.');
    }
  });
};

onMounted(fetchData);
</script>

<style scoped>
.el-button.is-link { background: transparent !important; padding: 4px; }
.el-button.is-link:hover { opacity: 0.8; }
.mb-4 { margin-bottom: 1rem; }
.mb-0 { margin: 0; }
.w-full { width: 100%; }
.text-xs { font-size: 0.75rem; }
.text-sm { font-size: 0.875rem; }
.font-bold { font-weight: 700; }
.text-muted { color: #9CA3AF; }
.bank-info p { margin: 0; line-height: 1.3; }
.flex-between { display: flex; justify-content: space-between; align-items: center; }
</style>
