<template>
  <div class="modern-customer-management">
    <div class="page-container">
      
      <!-- Header Section -->
      <header class="page-header animate-fade-in">
        <div class="header-content">
          <div class="title-wrapper">
            <div class="icon-box primary">
              <el-icon><Shop /></el-icon>
            </div>
            <div>
              <h2 class="page-title">Quản lý Khách hàng</h2>
              <p class="page-subtitle">Danh sách các đối tác, công ty và shop gửi hàng</p>
            </div>
          </div>
        </div>
        <div class="header-actions">
          <button class="btn-primary" @click="openDialog(null)">
            <el-icon><Plus /></el-icon>
            <span>Thêm Khách hàng</span>
          </button>
        </div>
      </header>

      <!-- Search & Filter Section -->
      <div class="content-card filter-card animate-fade-in mb-24">
        <div class="search-wrapper">
          <el-input
            v-model="searchQuery"
            placeholder="Tìm theo tên shop, SĐT hoặc mã khách hàng..."
            class="modern-input search-input"
            clearable
            @clear="fetchData"
            @keyup.enter="fetchData"
          >
            <template #prefix><el-icon><Search /></el-icon></template>
            <template #append>
              <el-button @click="fetchData" class="search-btn">Tìm kiếm</el-button>
            </template>
          </el-input>
        </div>
      </div>

      <!-- Main Table Card -->
      <div class="content-card table-wrapper animate-fade-in-up">
        <el-table 
          :data="customers" 
          v-loading="loading" 
          class="modern-table"
          row-class-name="modern-row"
          style="width: 100%"
        >
          <!-- Mã KH -->
          <el-table-column prop="customer_code" label="Mã KH" width="120" fixed="left">
            <template #default="{ row }">
              <span class="code-badge">{{ row.customer_code }}</span>
            </template>
          </el-table-column>

          <!-- Tên Shop / Công ty -->
          <el-table-column label="Thông tin Khách hàng" min-width="260">
            <template #default="{ row }">
              <div class="customer-profile">
                <div class="avatar-icon" :class="row.customer_type === 'COMPANY' ? 'bg-primary' : 'bg-success'">
                  <el-icon v-if="row.customer_type === 'COMPANY'"><OfficeBuilding /></el-icon>
                  <el-icon v-else><Shop /></el-icon>
                </div>
                <div class="customer-details">
                  <div class="name-row">
                    <span class="fw-bold text-dark">{{ row.transaction_name || row.company_name || row.customer_code }}</span>
                    <el-tag :type="row.customer_type === 'COMPANY' ? 'primary' : 'success'" size="small" class="type-tag" effect="plain">
                      {{ row.customer_type === 'COMPANY' ? 'Công ty' : 'Shop' }}
                    </el-tag>
                  </div>
                  <span class="text-xs text-muted" v-if="row.company_name && row.transaction_name">
                    <el-icon class="mr-1"><Briefcase /></el-icon>{{ row.company_name }}
                  </span>
                </div>
              </div>
            </template>
          </el-table-column>

          <!-- Người đại diện -->
          <el-table-column label="Người đại diện" min-width="160">
            <template #default="{ row }">
              <span class="text-dark fw-500">
                <el-icon class="mr-1 text-muted"><User /></el-icon>
                {{ row.representative_name || '—' }}
              </span>
            </template>
          </el-table-column>

          <!-- Liên hệ -->
          <el-table-column label="Thông tin liên hệ" min-width="180">
            <template #default="{ row }">
              <div class="contact-info">
                <span class="fw-bold text-dark">
                  <el-icon class="mr-1"><Phone /></el-icon>{{ row.phone || '—' }}
                </span>
                <span class="text-xs text-muted mt-1" v-if="row.email">
                  <el-icon class="mr-1"><Message /></el-icon>{{ row.email }}
                </span>
              </div>
            </template>
          </el-table-column>

          <!-- Ngân hàng (COD) -->
          <el-table-column label="Ngân hàng nhận COD" min-width="220">
            <template #default="{ row }">
              <div v-if="row.bank_name" class="bank-card-mini">
                <div class="bank-header">
                  <el-icon><Wallet /></el-icon>
                  <span class="bank-name">{{ row.bank_name }}</span>
                </div>
                <div class="bank-number">{{ row.bank_number }}</div>
                <div class="bank-owner">{{ row.bank_owner }}</div>
              </div>
              <span v-else class="text-muted text-xs flex-center-start">
                <el-icon class="mr-1"><Warning /></el-icon> Chưa cập nhật
              </span>
            </template>
          </el-table-column>

          <!-- Trạng thái -->
          <el-table-column label="Trạng thái" width="130" align="center">
            <template #default="{ row }">
              <div class="status-pill" :class="row.status === 'ACTIVE' ? 'active' : 'locked'">
                {{ row.status === 'ACTIVE' ? 'Hoạt động' : 'Ngừng' }}
              </div>
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

          <template #empty>
            <el-empty description="Không tìm thấy dữ liệu khách hàng" :image-size="100" />
          </template>
        </el-table>
      </div>

      <!-- Modern Dialog Form (2-Column Layout) -->
      <el-dialog 
        v-model="dialogVisible" 
        :title="customerForm.id ? 'Cập nhật Khách hàng' : 'Thêm Khách hàng mới'" 
        width="800px"
        class="modern-dialog scrollable-dialog"
        destroy-on-close
      >
        <el-form :model="customerForm" :rules="rules" ref="formRef" label-position="top" class="modern-form">
          
          <!-- Phân vùng 1: Thông tin cơ bản -->
          <div class="form-section">
            <div class="section-header">
              <el-icon><InfoFilled /></el-icon>
              <span>Thông tin cơ bản</span>
            </div>
            <el-row :gutter="24">
              <el-col :span="8">
                <el-form-item label="Mã khách hàng" prop="customer_code">
                  <el-input v-model="customerForm.customer_code" placeholder="KH001" :disabled="!!customerForm.id">
                    <template #prefix><el-icon><Key /></el-icon></template>
                  </el-input>
                </el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item label="Loại khách hàng" prop="customer_type">
                  <el-select v-model="customerForm.customer_type" class="w-full">
                    <el-option label="Shop / Cá nhân" value="SHOP" />
                    <el-option label="Công ty / Doanh nghiệp" value="COMPANY" />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item label="Trạng thái hoạt động" prop="status">
                  <el-select v-model="customerForm.status" class="w-full">
                    <el-option label="Đang hoạt động" value="ACTIVE">
                      <span class="text-success fw-bold">Đang hoạt động</span>
                    </el-option>
                    <el-option label="Ngừng hợp tác" value="INACTIVE">
                      <span class="text-danger fw-bold">Ngừng hợp tác</span>
                    </el-option>
                  </el-select>
                </el-form-item>
              </el-col>
            </el-row>
          </div>

          <!-- Phân vùng 2: Liên hệ & Định danh -->
          <div class="form-section">
            <div class="section-header">
              <el-icon><Avatar /></el-icon>
              <span>Liên hệ & Định danh</span>
            </div>
            <el-row :gutter="24">
              <el-col :span="12">
                <el-form-item label="Tên giao dịch (Tên Shop)" prop="name">
                  <el-input v-model="customerForm.name" placeholder="VD: Shop Thời trang Blue">
                    <template #prefix><el-icon><Shop /></el-icon></template>
                  </el-input>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="Tên công ty (nếu có)" prop="company_name">
                  <el-input v-model="customerForm.company_name" placeholder="VD: Công ty TNHH ABC">
                    <template #prefix><el-icon><OfficeBuilding /></el-icon></template>
                  </el-input>
                </el-form-item>
              </el-col>
            </el-row>

            <el-row :gutter="24">
              <el-col :span="12">
                <el-form-item label="Người đại diện" prop="representative_name">
                  <el-input v-model="customerForm.representative_name" placeholder="VD: Nguyễn Văn A">
                    <template #prefix><el-icon><User /></el-icon></template>
                  </el-input>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="Mã số thuế" prop="tax_code">
                  <el-input v-model="customerForm.tax_code" placeholder="VD: 0123456789">
                    <template #prefix><el-icon><Document /></el-icon></template>
                  </el-input>
                </el-form-item>
              </el-col>
            </el-row>

            <el-row :gutter="24">
              <el-col :span="12">
                <el-form-item label="Số điện thoại liên hệ" prop="phone">
                  <el-input v-model="customerForm.phone" placeholder="VD: 09xxxxxxx">
                    <template #prefix><el-icon><Phone /></el-icon></template>
                  </el-input>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="Địa chỉ Email" prop="email">
                  <el-input v-model="customerForm.email" placeholder="VD: shop@example.com">
                    <template #prefix><el-icon><Message /></el-icon></template>
                  </el-input>
                </el-form-item>
              </el-col>
            </el-row>

            <el-form-item label="Địa chỉ lấy hàng mặc định" prop="address">
              <el-input 
                v-model="customerForm.address" 
                type="textarea" 
                :rows="2" 
                placeholder="Số 1, Đường X, Phường Y, TP.HCM..." 
                resize="none"
              />
            </el-form-item>
          </div>

          <!-- Phân vùng 3: Thanh toán COD -->
          <div class="form-section no-border">
            <div class="section-header">
              <el-icon><CreditCard /></el-icon>
              <span>Thông tin ngân hàng nhận COD</span>
            </div>
            <el-row :gutter="24">
              <el-col :span="12">
                <el-form-item label="Ngân hàng" prop="bank_name">
                  <el-input v-model="customerForm.bank_name" placeholder="VD: Vietcombank, MBBank...">
                    <template #prefix><el-icon><Wallet /></el-icon></template>
                  </el-input>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="Số tài khoản" prop="bank_number">
                  <el-input v-model="customerForm.bank_number" placeholder="VD: 123456789">
                    <template #prefix><el-icon><Menu /></el-icon></template>
                  </el-input>
                </el-form-item>
              </el-col>
            </el-row>
            <el-row>
              <el-col :span="24">
                <el-form-item label="Tên chủ tài khoản" prop="bank_owner">
                  <el-input v-model="customerForm.bank_owner" placeholder="VD: NGUYEN VAN A">
                    <template #prefix><el-icon><UserFilled /></el-icon></template>
                  </el-input>
                </el-form-item>
              </el-col>
            </el-row>
          </div>

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
  Plus, Edit, Delete, Search, Shop, OfficeBuilding, Phone, Message,
  Wallet, Briefcase, User, Warning, Key, Document, Avatar, InfoFilled, 
  CreditCard, Menu, UserFilled, Loading
} from '@element-plus/icons-vue';
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
  name: '',            
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
  customer_code: [{ required: true, message: 'Vui lòng nhập mã khách hàng', trigger: 'blur' }],
  name: [{ required: true, message: 'Vui lòng nhập tên giao dịch/shop', trigger: 'blur' }],
  phone: [{ required: true, message: 'Vui lòng nhập số điện thoại liên hệ', trigger: 'blur' }],
  customer_type: [{ required: true, message: 'Vui lòng chọn loại khách hàng', trigger: 'change' }],
  status: [{ required: true, message: 'Vui lòng chọn trạng thái', trigger: 'change' }]
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
  ElMessageBox.confirm(
    `Bạn có chắc chắn muốn xóa khách hàng <strong>${row.transaction_name || row.name || row.customer_code}</strong>?`, 
    'Cảnh báo xóa', 
    {
      confirmButtonText: 'Xóa dữ liệu',
      cancelButtonText: 'Hủy bỏ',
      type: 'error',
      dangerouslyUseHTMLString: true,
      customClass: 'modern-message-box'
    }
  ).then(async () => {
    try {
      await api.delete(`/api/customers/${row.customer_id || row.id}`);
      ElMessage.success('Đã xóa khách hàng thành công!');
      fetchData();
    } catch (err) {
      ElMessage.error('Xóa không thành công.');
    }
  }).catch(() => {});
};

onMounted(fetchData);
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

/* Base Layout */
.modern-customer-management {
  min-height: calc(100vh - 64px);
  background-color: #F4F7FE; /* Light SaaS background */
  font-family: 'Plus Jakarta Sans', sans-serif;
  color: #2B3674;
  padding: 32px 24px;
}

.page-container {
  max-width: 1500px;
  margin: 0 auto;
}

.mb-24 { margin-bottom: 24px; }
.w-full { width: 100%; }

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

/* Cards */
.content-card {
  background: #FFFFFF;
  border-radius: 20px;
  padding: 24px;
  box-shadow: 0px 4px 20px rgba(0, 0, 0, 0.02);
}

.filter-card {
  padding: 20px 24px;
}

/* Search Input Customization */
.search-wrapper {
  max-width: 500px;
}

:deep(.search-input .el-input-group__append) {
  background-color: #4318FF;
  border-color: #4318FF;
  color: white;
  border-top-right-radius: 10px;
  border-bottom-right-radius: 10px;
  overflow: hidden;
}

:deep(.search-input .el-input-group__append .el-button) {
  color: white;
  font-weight: 700;
  border: none;
  padding: 12px 20px;
  margin: -10px -20px;
}

:deep(.search-input .el-input-group__append .el-button:hover) {
  background-color: #3311DB;
}

:deep(.modern-input .el-input__wrapper) {
  background: #F8FAFC;
  box-shadow: none !important;
  border: 1px solid #E2E8F0;
  border-top-left-radius: 10px;
  border-bottom-left-radius: 10px;
  padding: 6px 12px;
  transition: all 0.3s;
}

:deep(.modern-input .el-input__wrapper.is-focus) {
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

/* Specific Cell Styles */
.code-badge {
  font-family: 'Courier New', Courier, monospace;
  font-weight: 700;
  background: #F4F7FE;
  color: #4318FF;
  padding: 6px 10px;
  border-radius: 8px;
  font-size: 13px;
  display: inline-block;
}

.customer-profile {
  display: flex;
  align-items: center;
  gap: 12px;
}

.avatar-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 20px;
  flex-shrink: 0;
}
.bg-primary { background: linear-gradient(135deg, #4318FF, #868CFF); box-shadow: 0 4px 10px rgba(67, 24, 255, 0.2); }
.bg-success { background: linear-gradient(135deg, #05CD99, #4ADE80); box-shadow: 0 4px 10px rgba(5, 205, 153, 0.2); }

.customer-details {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.name-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.fw-bold { font-weight: 700; }
.fw-500 { font-weight: 600; }
.text-dark { color: #1B2559; }
.text-xs { font-size: 12px; }
.text-muted { color: #A3AED0; }
.text-success { color: #05CD99; }
.text-danger { color: #EE5D50; }
.mr-1 { margin-right: 4px; }
.mt-1 { margin-top: 4px; }

.contact-info {
  display: flex;
  flex-direction: column;
}

.flex-center-start {
  display: flex;
  align-items: center;
}

.type-tag {
  border-radius: 6px;
  font-weight: 800;
  font-size: 10px;
  text-transform: uppercase;
}

/* Bank Mini Card */
.bank-card-mini {
  background: #F8FAFC;
  border: 1px solid #E9EDF7;
  border-radius: 10px;
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.bank-header {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #4318FF;
  font-weight: 700;
  font-size: 13px;
}

.bank-number {
  font-family: 'Courier New', Courier, monospace;
  font-weight: 700;
  color: #1B2559;
  font-size: 14px;
}

.bank-owner {
  font-size: 11px;
  font-weight: 800;
  color: #8F9BBA;
  text-transform: uppercase;
}

/* Status Pill */
.status-pill {
  display: inline-block;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 700;
}
.status-pill.active { background: rgba(5, 205, 153, 0.1); color: #05CD99; }
.status-pill.locked { background: rgba(238, 93, 80, 0.1); color: #EE5D50; }

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
.icon-btn.delete { background: #FFF0F0; color: #EE5D50; }
.icon-btn.delete:hover { background: #EE5D50; color: white; }

/* Modern Dialog with 2-Column Form */
:deep(.modern-dialog) {
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 20px 40px rgba(0,0,0,0.1);
  margin-top: 5vh !important;
}

:deep(.scrollable-dialog .el-dialog__body) {
  max-height: 70vh;
  overflow-y: auto;
  padding: 24px 32px;
}

:deep(.scrollable-dialog .el-dialog__body::-webkit-scrollbar) {
  width: 6px;
}

:deep(.scrollable-dialog .el-dialog__body::-webkit-scrollbar-thumb) {
  background-color: #E2E8F0;
  border-radius: 10px;
}

:deep(.modern-dialog .el-dialog__header) {
  margin: 0;
  padding: 24px 32px;
  border-bottom: 1px solid #E9EDF7;
}

:deep(.modern-dialog .el-dialog__title) {
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-weight: 800;
  color: #2B3674;
  font-size: 20px;
}

:deep(.modern-dialog .el-dialog__footer) {
  padding: 16px 32px 24px;
  border-top: 1px solid #E9EDF7;
}

.dialog-footer-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

/* Form Sections */
.form-section {
  background: #FFFFFF;
  border: 1px solid #E9EDF7;
  border-radius: 16px;
  padding: 20px 24px;
  margin-bottom: 24px;
}

.form-section.no-border {
  border: none;
  background: #F8FAFC;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  font-weight: 800;
  color: #1B2559;
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 1px dashed #E2E8F0;
}

.section-header .el-icon {
  color: #4318FF;
  font-size: 18px;
}

:deep(.modern-form .el-form-item__label) {
  font-weight: 700;
  color: #2B3674;
  margin-bottom: 8px;
}

:deep(.modern-form .el-input__wrapper),
:deep(.modern-form .el-select__wrapper),
:deep(.modern-form .el-textarea__inner) {
  background: #F8FAFC;
  box-shadow: 0 0 0 1px #E2E8F0 inset;
  border-radius: 10px;
  padding: 8px 12px;
  transition: all 0.3s ease;
}

:deep(.modern-form .el-textarea__inner) {
  padding: 12px;
}

:deep(.modern-form .el-input__wrapper:hover),
:deep(.modern-form .el-select__wrapper:hover),
:deep(.modern-form .el-textarea__inner:hover) {
  box-shadow: 0 0 0 1px #4318FF inset;
}

:deep(.modern-form .el-input__wrapper.is-focus),
:deep(.modern-form .el-select__wrapper.is-focus),
:deep(.modern-form .el-textarea__inner:focus) {
  box-shadow: 0 0 0 2px rgba(67, 24, 255, 0.2) inset !important;
  background: #FFFFFF;
}

/* Animations */
.animate-fade-in { animation: fadeIn 0.6s ease-out; }
.animate-fade-in-up { animation: fadeInUp 0.6s ease-out; }

@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }

/* Responsive */
@media (max-width: 768px) {
  .page-header { flex-direction: column; align-items: flex-start; }
  .header-actions { width: 100%; }
  .header-actions .btn-primary { width: 100%; justify-content: center; }
  .search-wrapper { max-width: 100%; }
}
</style>