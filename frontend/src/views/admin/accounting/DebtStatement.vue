<template>
  <div class="debt-statement-container animate-fade-in">
    <div class="page-header">
      <div class="header-left">
        <div class="header-icon">
          <el-icon><Tickets /></el-icon>
        </div>
        <div>
          <h1 class="page-title">Tạo Bảng Kê Cước</h1>
          <p class="page-subtitle">Lập bảng kê đối soát cước (Debt) hoặc tiền thu hộ (COD) cho khách hàng</p>
        </div>
      </div>
    </div>

    <div class="main-layout">
      <!-- CỘT TRÁI: LỌC & DANH SÁCH -->
      <div class="content-side">
        <!-- Bộ lọc -->
        <el-card class="filter-card mb-24">
          <template #header>
            <div class="card-header">
              <span class="header-title"><el-icon><Search /></el-icon> Lọc vận đơn cần lập bảng kê</span>
            </div>
          </template>
          
          <el-row :gutter="20">
            <el-col :span="12">
              <div class="filter-item">
                <label>KHÁCH HÀNG / SHOP</label>
                <el-select v-model="filters.customer_id" placeholder="Tất cả khách hàng..." filterable class="w-full">
                  <el-option v-for="c in customers" :key="c.customer_id" :label="c.company_name" :value="c.customer_id" />
                </el-select>
              </div>
            </el-col>
            <el-col :span="8">
              <div class="filter-item">
                <label>TRẠNG THÁI ĐƠN</label>
                <el-select v-model="filters.status" class="w-full">
                  <el-option label="Đã giao thành công (DELIVERED)" value="DELIVERED" />
                  <el-option label="Đã trả hàng (RETURNED)" value="RETURNED" />
                </el-select>
              </div>
            </el-col>
            <el-col :span="4" class="flex-bottom">
              <el-button type="primary" :loading="loading" @click="fetchWaybills" class="w-full">
                <el-icon><Search /></el-icon> Tải danh sách
              </el-button>
            </el-col>
          </el-row>
        </el-card>

        <!-- Danh sách vận đơn -->
        <el-card class="table-card">
          <template #header>
            <div class="card-header flex-between">
              <span class="header-title"><el-icon><Collection /></el-icon> Danh sách Vận đơn</span>
              <div class="table-stats">
                <span class="stat-tag">{{ waybills.length }} đơn / {{ selectedWaybills.length }} đã chọn</span>
              </div>
            </div>
          </template>

          <el-table :data="waybills" style="width: 100%" v-loading="loading" @selection-change="handleSelectionChange">
            <el-table-column type="selection" width="55" />
            <el-table-column property="waybill_code" label="MÃ VẬN ĐƠN" width="150" />
            <el-table-column property="receiver_name" label="NGƯỜI NHẬN" min-width="150" />
            <el-table-column label="CƯỚC PHÍ" align="right">
              <template #default="{ row }">
                <span class="text-primary fw-bold">{{ formatCurrencyManual(row.shipping_fee) }}</span>
              </template>
            </el-table-column>
            <el-table-column label="COD" align="right">
              <template #default="{ row }">
                <span>{{ formatCurrencyManual(row.cod_amount) }}</span>
              </template>
            </el-table-column>
            <el-table-column label="TRẠNG THÁI" width="120">
              <template #default="{ row }">
                <el-tag :type="row.status === 'DELIVERED' ? 'success' : 'info'" size="small">
                  {{ row.status }}
                </el-tag>
              </template>
            </el-table-column>
            
            <template #empty>
              <div class="empty-state">
                <el-empty description="Chọn bộ lọc và bấm Tải danh sách" />
              </div>
            </template>
          </el-table>
        </el-card>
      </div>

      <!-- CỘT PHẢI: TỔNG HỢP & TẠO -->
      <div class="summary-side">
        <el-card class="summary-card mb-24">
          <template #header>
            <div class="card-header">
              <span class="header-title"><el-icon><Wallet /></el-icon> Tổng hợp đã chọn</span>
            </div>
          </template>

          <div class="summary-list">
            <div class="summary-item">
              <span class="label">Số đơn chọn</span>
              <span class="value">{{ selectedWaybills.length }}</span>
            </div>
            <div class="summary-item">
              <span class="label">Tổng cước</span>
              <span class="value">{{ formatCurrencyManual(totalShipping) }}</span>
            </div>
            <div class="summary-item">
              <span class="label">Tổng COD</span>
              <span class="value">{{ formatCurrencyManual(totalCOD) }}</span>
            </div>
            <div class="summary-item">
              <span class="label">VAT (8%)</span>
              <span class="value">{{ formatCurrencyManual(totalVAT) }}</span>
            </div>
            <div class="grand-total-box">
              <span class="label">TỔNG THANH TOÁN</span>
              <span class="value">{{ formatCurrencyManual(grandTotal) }}</span>
            </div>
          </div>
        </el-card>

        <el-card class="action-card">
          <template #header>
            <div class="card-header">
              <span class="header-title"><el-icon><CircleCheck /></el-icon> Lập bảng kê mới</span>
            </div>
          </template>

          <div class="action-form">
            <div class="form-item">
              <label>LOẠI BẢNG KÊ</label>
              <el-radio-group v-model="newStatement.type" class="w-full type-selector">
                <el-radio-button value="DEBT">Đối soát Cước (Debt)</el-radio-button>
                <el-radio-button value="COD">Đối soát COD</el-radio-button>
              </el-radio-group>
            </div>

            <div class="form-item">
              <label>MÃ BẢNG KÊ (TỰ TẠO)</label>
              <el-input v-model="newStatement.custom_code" placeholder="Nhập mã hoặc tự sinh...">
                <template #append>
                  <el-button @click="generateCode"><el-icon><Refresh /></el-icon></el-button>
                </template>
              </el-input>
            </div>

            <el-button 
              type="primary" 
              size="large" 
              class="w-full mt-16 create-btn" 
              :disabled="selectedWaybills.length === 0"
              :loading="creating"
              @click="createStatement"
            >
              <el-icon><Tickets /></el-icon> Tạo bảng kê ({{ selectedWaybills.length }} đơn)
            </el-button>
          </div>
        </el-card>
      </div>
    </div>

    <!-- KHU VỰC: DANH SÁCH BẢNG KÊ VỪA TẠO -->
    <div class="created-statements-section mt-24 animate-fade-in-up" v-if="createdStatements.length > 0">
      <div class="section-header">
        <h3 class="title">📄 Các bảng kê vừa lập</h3>
        <span class="subtitle">Danh sách các bảng kê bạn vừa khởi tạo thành công</span>
      </div>

      <div class="statements-grid">
        <div v-for="stmt in createdStatements" :key="stmt.statement_id" class="statement-card">
          <div class="card-left">
            <div class="stmt-icon" :class="stmt.type.toLowerCase()">
              <el-icon><Tickets /></el-icon>
            </div>
            <div class="stmt-info">
              <div class="code-row">
                <span class="code">{{ stmt.statement_code }}</span>
                <span class="badge" :class="stmt.status.toLowerCase()">{{ stmt.status }}</span>
              </div>
              <div class="meta">
                <span>Loại: <b>{{ stmt.type }}</b></span>
                <span class="dot"></span>
                <span>Tổng tiền: <b class="text-primary">{{ formatCurrencyManual(stmt.grand_total || stmt.total_amount) }}</b></span>
              </div>
            </div>
          </div>
          
          <div class="card-actions">
            <el-tooltip content="Xác nhận / Chốt bảng kê" placement="top" v-if="stmt.status === 'DRAFT'">
              <button class="btn-icon-sm success" @click="confirmStatement(stmt)">
                <el-icon><CircleCheck /></el-icon>
              </button>
            </el-tooltip>
            <el-tooltip content="Xuất Excel (.xlsx)" placement="top">
              <button class="btn-icon-sm primary" @click="exportStatement(stmt, 'xlsx')">
                <el-icon><Download /></el-icon>
              </button>
            </el-tooltip>
            <el-tooltip content="Xuất CSV (.csv)" placement="top">
              <button class="btn-icon-sm warning" @click="exportStatement(stmt, 'csv')">
                <el-icon><Tickets /></el-icon>
              </button>
            </el-tooltip>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import api from '@/api/axios';
import { ElMessage, ElMessageBox } from 'element-plus';
import { 
  Search, Refresh, Tickets, Download, 
  CircleCheck, Wallet, Money, Collection 
} from '@element-plus/icons-vue';

// --- STATE ---
const loading = ref(false);
const creating = ref(false);
const waybills = ref([]);
const customers = ref([]);
const createdStatements = ref([]); 

const filters = ref({
  customer_id: '',
  status: 'DELIVERED'
});

const newStatement = ref({
  type: 'DEBT',
  custom_code: ''
});

const formatCurrencyManual = (val) => {
  if (!val) return '0 đ';
  return Number(val).toLocaleString('vi-VN') + ' đ';
};

const handleSelectionChange = (val) => {
  waybills.value.forEach(w => {
    w.selected = val.some(s => s.waybill_id === w.waybill_id);
  });
};

const generateCode = () => {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const rand = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  newStatement.value.custom_code = `BK-${date}-${rand}`;
};

onMounted(generateCode);
onMounted(async () => {
  try {
    const res = await api.get('/api/customers');
    customers.value = res.data;
  } catch (err) {
    console.error('Lỗi tải khách hàng:', err);
  }
});

const fetchWaybills = async () => {
  if (!filters.value.customer_id) {
    return ElMessage.warning('Vui lòng chọn khách hàng');
  }
  loading.value = true;
  try {
    // BE không có endpoint unlisted-waybills, ta dùng endpoint chung /api/waybills với filter
    const res = await api.post('/api/waybills/search', {
      customer_id: filters.value.customer_id,
      status: filters.value.status,
      page: 1,
      size: 1000
    });
    // BE trả về { items: [], total: 0 } cho endpoint /api/waybills
    const items = res.data.items || res.data;
    waybills.value = items.map(w => ({ ...w, selected: false }));
  } catch (err) {
    ElMessage.error('Lỗi tải vận đơn');
  } finally {
    loading.value = false;
  }
};

const selectedWaybills = computed(() => waybills.value.filter(w => w.selected));
const totalShipping = computed(() => selectedWaybills.value.reduce((s, w) => s + (w.shipping_fee || 0), 0));
const totalCOD = computed(() => selectedWaybills.value.reduce((s, w) => s + (w.cod_amount || 0), 0));
const totalVAT = computed(() => totalShipping.value * 0.08);
const grandTotal = computed(() => totalShipping.value + totalVAT.value);

const createStatement = async () => {
  if (selectedWaybills.value.length === 0) return;
  creating.value = true;
  try {
    const payload = {
      type: newStatement.value.type,
      statement_code: newStatement.value.custom_code,
      customer_id: filters.value.customer_id,
      waybill_ids: selectedWaybills.value.map(w => w.waybill_id)
    };
    
    const res = await api.post('/api/accounting/statements', payload);
    
    createdStatements.value.unshift({
      ...res.data,
      type: newStatement.value.type 
    });
    
    ElMessage.success('✅ Đã tạo bảng kê thành công!');
    waybills.value = waybills.value.filter(w => !w.selected);
    generateCode();
  } catch (err) {
    ElMessage.error(err.response?.data?.detail || 'Lỗi tạo bảng kê');
  } finally {
    creating.value = false;
  }
};

const confirmStatement = async (stmt) => {
  try {
    await ElMessageBox.confirm(
      `Bạn có chắc chắn muốn CHỐT bảng kê ${stmt.statement_code}? Sau khi chốt sẽ không thể sửa trực tiếp.`,
      'Xác nhận chốt',
      { type: 'warning' }
    );
    
    await api.patch(`/api/accounting/statements/${stmt.statement_id}/status`, { status: 'CONFIRMED' });
    
    stmt.status = 'CONFIRMED';
    ElMessage.success('✅ Đã chốt bảng kê thành công!');
  } catch (err) {
    if (err !== 'cancel') ElMessage.error('Lỗi chốt bảng kê');
  }
};

const exportStatement = async (stmt, format = 'xlsx') => {
  const statementId = stmt.statement_id;
  const isCSV = format === 'csv';
  
  let endpoint = '';
  if (stmt.type === 'COD') {
    endpoint = isCSV 
      ? `/api/accounting/cod/${statementId}/export-csv` 
      : `/api/accounting/cod/${statementId}/export`;
  } else {
    endpoint = isCSV 
      ? `/api/accounting/statements/${statementId}/export-csv` 
      : `/api/accounting/statements/${statementId}/export`;
  }

  try {
    const res = await api.get(endpoint, { responseType: 'blob' });
    const url = URL.createObjectURL(res.data);
    const a = document.createElement('a');
    a.href = url;
    const ext = isCSV ? 'csv' : 'xlsx';
    a.download = `BangKe_${stmt.type}_${stmt.statement_code || statementId}.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    ElMessage.success(`✅ Đã tải file ${ext.toUpperCase()} thành công!`);
  } catch (err) {
    const msg = isCSV ? 'Bản kê này chưa hỗ trợ xuất CSV' : 'Lỗi xuất file Excel';
    ElMessage.error(err.response?.data?.detail || msg);
  }
};
</script>

<style scoped>
.debt-statement-container {
  padding: 24px;
  background: #f8fafc;
  min-height: 100vh;
}

.page-header {
  margin-bottom: 32px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.header-icon {
  width: 48px;
  height: 48px;
  background: #7c3aed;
  color: white;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  box-shadow: 0 4px 12px rgba(124, 58, 237, 0.3);
}

.page-title {
  font-size: 24px;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
}

.page-subtitle {
  color: #64748b;
  margin: 4px 0 0 0;
}

.main-layout {
  display: grid;
  grid-template-columns: 1fr 350px;
  gap: 24px;
}

.filter-item label {
  display: block;
  font-size: 12px;
  font-weight: 600;
  color: #64748b;
  margin-bottom: 8px;
}

.flex-bottom {
  display: flex;
  align-items: flex-end;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
}

.header-title {
  font-weight: 600;
  color: #334155;
  display: flex;
  align-items: center;
  gap: 6px;
}

.summary-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.summary-item {
  display: flex;
  justify-content: space-between;
  padding-bottom: 8px;
  border-bottom: 1px dashed #e2e8f0;
}

.summary-item .label { color: #64748b; }
.summary-item .value { font-weight: 600; color: #1e293b; }

.grand-total-box {
  background: #7c3aed;
  padding: 16px;
  border-radius: 8px;
  color: white;
  margin-top: 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.grand-total-box .value { font-size: 20px; font-weight: 700; }

.type-selector {
  display: flex;
}
.type-selector :deep(.el-radio-button) { flex: 1; }
.type-selector :deep(.el-radio-button__inner) { width: 100%; }

.form-item { margin-bottom: 16px; }
.form-item label {
  display: block;
  font-size: 12px;
  font-weight: 600;
  color: #64748b;
  margin-bottom: 8px;
}

.create-btn {
  height: 48px;
  font-weight: 600;
}

/* Created Statements Section */
.created-statements-section {
  padding-top: 24px;
  border-top: 1px solid #e2e8f0;
}

.section-header { margin-bottom: 16px; }
.section-header .title { font-size: 18px; font-weight: 700; color: #1e293b; margin: 0; }
.section-header .subtitle { font-size: 14px; color: #64748b; }

.statements-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 16px;
}

.statement-card {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: all 0.3s ease;
}

.statement-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.card-left { display: flex; align-items: center; gap: 16px; }

.stmt-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
}
.stmt-icon.debt { background: #f0fdf4; color: #16a34a; }
.stmt-icon.cod { background: #fff7ed; color: #ea580c; }

.code-row { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; }
.code-row .code { font-weight: 700; color: #1e293b; }
.code-row .badge {
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 4px;
  text-transform: uppercase;
  font-weight: 600;
}
.badge.draft { background: #f1f5f9; color: #64748b; }
.badge.confirmed { background: #f0fdf4; color: #16a34a; }

.meta { font-size: 13px; color: #64748b; display: flex; align-items: center; gap: 8px; }
.dot { width: 4px; height: 4px; border-radius: 50%; background: #cbd5e1; }

.card-actions { display: flex; gap: 8px; }

.btn-icon-sm {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-icon-sm.primary { background: #f5f3ff; color: #7c3aed; }
.btn-icon-sm.warning { background: #fff7ed; color: #ea580c; }
.btn-icon-sm.success { background: #f0fdf4; color: #16a34a; }

.btn-icon-sm:hover { opacity: 0.8; transform: scale(1.05); }

.w-full { width: 100%; }
.mt-24 { margin-top: 24px; }
.mt-16 { margin-top: 16px; }
.mb-24 { margin-bottom: 24px; }
.flex-between { display: flex; justify-content: space-between; align-items: center; }
.animate-fade-in { animation: fadeIn 0.5s ease-out; }
.animate-fade-in-up { animation: fadeInUp 0.5s ease-out; }

@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
</style>
