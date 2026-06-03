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

<style scoped src="@/styles/admin/customers/CustomerList.css"></style>