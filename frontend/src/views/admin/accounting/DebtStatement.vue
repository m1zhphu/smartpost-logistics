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

            <!-- THAO TÁC -->
            <el-table-column label="THAO TÁC" width="110" align="center">
              <template #default="{ row }">
                <el-button 
                  size="small" 
                  type="primary" 
                  plain 
                  icon="Edit"
                  @click="openOverrideDialog(row)"
                  style="padding: 4px 8px; font-size: 11px;"
                >
                  Sửa cước
                </el-button>
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
            <el-tooltip content="In / Lưu PDF" placement="top">
              <button class="btn-icon-sm info" @click="printStatement(stmt)">
                <el-icon><Printer /></el-icon>
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
            <el-tooltip content="Xem phiếu điều chỉnh cước" placement="top">
              <button class="btn-icon-sm danger" @click="showAdjustments(stmt)" style="background-color: #ffefe5; color: #ff6b00; border: 1px solid #ffd3b6;">
                <el-icon><Money /></el-icon>
              </button>
            </el-tooltip>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Dialog Xem Phiếu Điều Chỉnh -->
  <el-dialog v-model="adjustmentsDialogVisible" title="📜 LỊCH SỬ PHIẾU ĐIỀU CHỈNH CƯỚC" width="700px" append-to-body destroy-on-close>
    <div style="margin-bottom: 16px; font-weight: bold; color: #2b3674;">
      Bảng kê: <span style="color: #4318ff;">{{ selectedStmtForAdj?.statement_code }}</span> (Loại: {{ selectedStmtForAdj?.type }})
    </div>
    
    <el-table :data="adjustmentsList" v-loading="loadingAdjustments" style="width: 100%;" border>
      <el-table-column prop="id" label="Mã Phiếu" width="90" align="center" />
      <el-table-column prop="waybill_code" label="Mã Vận Đơn" width="150" />
      <el-table-column label="Số Tiền Thay Đổi" width="150" align="right">
        <template #default="{ row }">
          <span :style="{ color: row.diff_amount < 0 ? '#EE5D50' : '#05CD99', fontWeight: 'bold' }">
            {{ row.diff_amount > 0 ? '+' : '' }}{{ Number(row.diff_amount).toLocaleString('vi-VN') }} đ
          </span>
        </template>
      </el-table-column>
      <el-table-column prop="reason" label="Lý Do Điều Chỉnh" min-width="180" show-overflow-tooltip />
      <el-table-column prop="username" label="Người Thực Hiện" width="120" />
    </el-table>
    
    <template #footer>
      <div style="display: flex; justify-content: flex-end;">
        <el-button type="primary" @click="adjustmentsDialogVisible = false">Đóng</el-button>
      </div>
    </template>
  </el-dialog>

  <!-- Dialog Sửa Cước Phí -->
  <el-dialog v-model="overrideDialogVisible" title="ĐIỀU CHỈNH CƯỚC PHÍ & TẠO PHIẾU ĐIỀU CHỈNH" width="460px" append-to-body>
    <el-form label-position="top" class="override-form">
      <div style="background: #F4F7FE; border-radius: 8px; padding: 12px; margin-bottom: 16px; border: 1px solid #E9EDF7;">
        <div style="font-size: 13px; color: #2B3674; margin-bottom: 4px;">Vận đơn cần chỉnh sửa:</div>
        <div style="font-size: 16px; font-weight: 800; color: #4318FF;">{{ overrideForm.waybill_code }}</div>
      </div>
      
      <el-form-item label="Cước vận chuyển chính (VNĐ)" required>
        <el-input-number v-model="overrideForm.new_shipping_fee" class="w-full" :min="0" :step="1000" style="width: 100%;" />
      </el-form-item>
      
      <el-form-item label="Phụ phí dịch vụ cộng thêm (VNĐ)">
        <el-input-number v-model="overrideForm.new_extra_fee" class="w-full" :min="0" :step="1000" style="width: 100%;" />
      </el-form-item>
      
      <el-form-item label="Lý do điều chỉnh (Bắt buộc để ghi nhận lịch sử)" required>
        <el-input 
          v-model="overrideForm.reason" 
          type="textarea" 
          :rows="3" 
          placeholder="Nhập lý do chi tiết: VD sai cự ly, sai cân nặng, giảm giá cho khách..." 
        />
      </el-form-item>
    </el-form>
    <template #footer>
      <div class="dialog-footer" style="display: flex; justify-content: flex-end; gap: 8px;">
        <el-button @click="overrideDialogVisible = false">Hủy bỏ</el-button>
        <el-button type="primary" @click="submitOverridePrice" :loading="overrideSubmitting">
          Xác nhận Cập nhật
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import api from '@/api/axios';
import { ElMessage, ElMessageBox } from 'element-plus';
import { 
  Search, Refresh, Tickets, Download, 
  CircleCheck, Wallet, Money, Collection, Printer,
  Edit
} from '@element-plus/icons-vue';

// --- STATE ---
const loading = ref(false);
const creating = ref(false);
const waybills = ref([]);
const customers = ref([]);
const createdStatements = ref([]); 

// --- PHIẾU ĐIỀU CHỈNH CƯỚC ---
const adjustmentsDialogVisible = ref(false);
const loadingAdjustments = ref(false);
const adjustmentsList = ref([]);
const selectedStmtForAdj = ref(null);

const showAdjustments = async (stmt) => {
  selectedStmtForAdj.value = stmt;
  adjustmentsDialogVisible.value = true;
  loadingAdjustments.value = true;
  adjustmentsList.value = [];
  try {
    const res = await api.get(`/api/accounting/statements/${stmt.statement_id}/adjustments`, {
      params: { statement_type: stmt.type }
    });
    adjustmentsList.value = res.data;
  } catch (err) {
    ElMessage.error('Không thể tải lịch sử điều chỉnh cước');
  } finally {
    loadingAdjustments.value = false;
  }
};

// --- DIALOG ĐIỀU CHỈNH GIÁ ---
const overrideDialogVisible = ref(false);
const overrideSubmitting = ref(false);
const overrideForm = ref({
  waybill_id: null,
  waybill_code: '',
  current_shipping_fee: 0,
  new_shipping_fee: 0,
  new_extra_fee: 0,
  reason: ''
});

const openOverrideDialog = (row) => {
  overrideForm.value = {
    waybill_id: row.waybill_id,
    waybill_code: row.waybill_code,
    current_shipping_fee: row.shipping_fee || 0,
    new_shipping_fee: row.shipping_fee || 0,
    new_extra_fee: row.extra_services_fee || 0,
    reason: ''
  };
  overrideDialogVisible.value = true;
};

const submitOverridePrice = async () => {
  if (!overrideForm.value.reason.trim()) {
    return ElMessage.warning('Vui lòng nhập lý do điều chỉnh!');
  }

  overrideSubmitting.value = true;
  try {
    const payload = {
      waybill_id: overrideForm.value.waybill_id,
      new_shipping_fee: overrideForm.value.new_shipping_fee,
      new_extra_fee: overrideForm.value.new_extra_fee || null,
      reason: overrideForm.value.reason.trim()
    };

    const res = await api.post('/api/accounting/override-price', payload);
    const data = res.data;

    overrideDialogVisible.value = false;

    if (data.status === 'ADJUSTED') {
      ElMessageBox.alert(
        `Đã tạo <b>phiếu điều chỉnh #${data.adjustment_id}</b><br>
         Chênh lệch cước: <b>${Number(data.diff_amount).toLocaleString('vi-VN')} đ</b><br>
         Lý do: ${data.reason}`,
        '⚠️ Đã tạo phiếu điều chỉnh cước',
        { type: 'warning', dangerouslyUseHTMLString: true, confirmButtonText: 'Đóng' }
      );
    } else {
      ElMessage.success(`✅ Cập nhật giá thành công! Tổng cước mới: ${Number(data.new_total).toLocaleString('vi-VN')} đ`);
    }

    // Tải lại bảng dữ liệu
    await fetchWaybills();
  } catch (err) {
    ElMessage.error(err.response?.data?.detail || 'Lỗi khi sửa giá vận đơn');
  } finally {
    overrideSubmitting.value = false;
  }
};

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
      type: newStatement.value.type,
      waybills: [...selectedWaybills.value]
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

const printStatement = (stmt) => {
  // Tìm thông tin khách hàng
  const customer = customers.value.find(c => c.customer_id === stmt.customer_id) || {};
  const customerName = customer.company_name || 'Khách hàng lẻ';
  const customerPhone = customer.phone_number || 'N/A';
  const customerAddress = customer.address_detail || 'N/A';

  // Lấy danh sách vận đơn thuộc bảng kê
  const items = stmt.waybills || [];
  
  if (items.length === 0) {
    ElMessage.warning('Không có danh sách vận đơn chi tiết của bảng kê này để in. Bảng kê chỉ hỗ trợ in ngay khi vừa lập.');
    return;
  }
  
  const printWindow = window.open('', '_blank', 'width=950,height=750');
  if (!printWindow) {
    ElMessage.error('Không thể mở cửa sổ in. Vui lòng tắt trình chặn popup của trình duyệt.');
    return;
  }

  // Tạo HTML chi tiết vận đơn
  let rowsHtml = '';
  let totalMain = 0;
  let totalCOD = 0;
  let totalExtra = 0;
  let totalVat = 0;
  let grandTotal = 0;

  items.forEach((item, index) => {
    const mainFee = Number(item.shipping_fee || 0);
    const extraFee = Number(item.extra_services_fee || 0);
    const vat = Number(item.vat_amount || 0);
    const totalCollect = Number(item.total_amount_to_collect || 0);
    const cod = Number(item.cod_amount || 0);

    totalMain += mainFee;
    totalCOD += cod;
    totalExtra += extraFee;
    totalVat += vat;
    grandTotal += totalCollect;

    if (stmt.type === 'COD') {
      rowsHtml += `
        <tr>
          <td style="text-align: center;">${index + 1}</td>
          <td><b>${item.waybill_code}</b></td>
          <td>${item.receiver_name || 'N/A'}</td>
          <td>${item.receiver_phone || 'N/A'}</td>
          <td>${item.receiver_address || 'N/A'}</td>
          <td style="text-align: right; font-weight: bold; color: #10b981;">${cod.toLocaleString('vi-VN')} đ</td>
        </tr>
      `;
    } else {
      rowsHtml += `
        <tr>
          <td style="text-align: center;">${index + 1}</td>
          <td><b>${item.waybill_code}</b></td>
          <td>${item.receiver_name || 'N/A'}</td>
          <td style="text-align: right;">${mainFee.toLocaleString('vi-VN')} đ</td>
          <td style="text-align: right;">${extraFee.toLocaleString('vi-VN')} đ</td>
          <td style="text-align: right;">${vat.toLocaleString('vi-VN')} đ</td>
          <td style="text-align: right; font-weight: bold; color: #7c3aed;">${totalCollect.toLocaleString('vi-VN')} đ</td>
        </tr>
      `;
    }
  });

  const isCOD = stmt.type === 'COD';
  const tableHeaders = isCOD ? `
    <tr>
      <th style="width: 50px;">STT</th>
      <th style="width: 150px;">Mã vận đơn</th>
      <th>Người nhận</th>
      <th style="width: 120px;">SĐT nhận</th>
      <th>Địa chỉ nhận</th>
      <th style="width: 150px; text-align: right;">Tiền COD</th>
    </tr>
  ` : `
    <tr>
      <th style="width: 50px;">STT</th>
      <th style="width: 150px;">Mã vận đơn</th>
      <th>Người nhận</th>
      <th style="width: 120px; text-align: right;">Cước chính</th>
      <th style="width: 100px; text-align: right;">Phụ phí</th>
      <th style="width: 100px; text-align: right;">VAT (8%)</th>
      <th style="width: 150px; text-align: right;">Thành tiền</th>
    </tr>
  `;

  const footerSummary = isCOD ? `
    <tr class="total-row">
      <td colspan="5" style="text-align: right; font-weight: bold;">TỔNG CỘNG TIỀN COD:</td>
      <td style="text-align: right; font-weight: bold; color: #10b981; font-size: 16px;">${totalCOD.toLocaleString('vi-VN')} đ</td>
    </tr>
  ` : `
    <tr class="total-row">
      <td colspan="3" style="text-align: right; font-weight: bold;">TỔNG CỘNG:</td>
      <td style="text-align: right; font-weight: bold;">${totalMain.toLocaleString('vi-VN')} đ</td>
      <td style="text-align: right; font-weight: bold;">${totalExtra.toLocaleString('vi-VN')} đ</td>
      <td style="text-align: right; font-weight: bold;">${totalVat.toLocaleString('vi-VN')} đ</td>
      <td style="text-align: right; font-weight: bold; color: #7c3aed; font-size: 16px;">${grandTotal.toLocaleString('vi-VN')} đ</td>
    </tr>
  `;

  const documentTitle = isCOD ? 'BẢNG KÊ ĐỐI SOÁT COD THU HỘ' : 'BẢNG KÊ ĐỐI SOÁT CƯỚC VẬN CHUYỂN';
  const displayAmount = isCOD ? totalCOD : grandTotal;

  printWindow.document.write(`
    <html>
      <head>
        <title>${stmt.statement_code} - In Bảng Kê</title>
        <style>
          body {
            font-family: "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            color: #1e293b;
            padding: 40px;
            font-size: 14px;
            line-height: 1.5;
          }
          .header-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
          }
          .company-name {
            font-size: 20px;
            font-weight: 800;
            color: #7c3aed;
            text-transform: uppercase;
            letter-spacing: 1px;
          }
          .company-info {
            font-size: 12px;
            color: #64748b;
            margin-top: 4px;
          }
          .doc-title {
            text-align: center;
            font-size: 22px;
            font-weight: 800;
            color: #0f172a;
            margin: 20px 0;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .meta-section {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 30px;
            padding: 16px;
            background: #f8fafc;
            border-radius: 8px;
            border: 1px solid #e2e8f0;
          }
          .meta-item {
            margin-bottom: 8px;
          }
          .meta-item b {
            color: #334155;
          }
          .main-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 40px;
          }
          .main-table th {
            background: #f1f5f9;
            color: #475569;
            font-weight: 700;
            text-transform: uppercase;
            font-size: 12px;
            border: 1px solid #cbd5e1;
            padding: 10px;
            text-align: left;
          }
          .main-table td {
            border: 1px solid #e2e8f0;
            padding: 10px;
            color: #334155;
          }
          .main-table tr:nth-child(even) {
            background: #f8fafc;
          }
          .total-row td {
            background: #f1f5f9 !important;
            border-top: 2px solid #94a3b8 !important;
          }
          .signature-section {
            margin-top: 50px;
            display: flex;
            justify-content: space-between;
            padding: 0 50px;
          }
          .signature-box {
            text-align: center;
            width: 250px;
          }
          .signature-title {
            font-weight: 700;
            color: #334155;
            margin-bottom: 80px;
            text-transform: uppercase;
            font-size: 13px;
          }
          .signature-name {
            font-weight: 600;
            color: #0f172a;
          }
          @media print {
            body {
              padding: 20px;
            }
            .meta-section {
              background: none !important;
              border: 1px solid #cbd5e1 !important;
            }
          }
        </style>
      </head>
      <body>
        <table class="header-table">
          <tr>
            <td>
              <div class="company-name">SmartPost Logistics</div>
              <div class="company-info">Hotline: 1900 6789 | Email: support@smartpost.vn</div>
              <div class="company-info">Địa chỉ: 123 Nguyễn Văn Cừ, Quận 5, TP. Hồ Chí Minh</div>
            </td>
            <td style="text-align: right; vertical-align: top;">
              <div style="font-weight: bold; font-size: 16px;">Mã BK: ${stmt.statement_code}</div>
              <div style="color: #64748b; font-size: 12px; margin-top: 4px;">Ngày lập: ${new Date(stmt.created_at || Date.now()).toLocaleDateString('vi-VN')}</div>
            </td>
          </tr>
        </table>

        <div class="doc-title">${documentTitle}</div>

        <div class="meta-section">
          <div>
            <div class="meta-item">Khách hàng: <b>${customerName}</b></div>
            <div class="meta-item">Số điện thoại: <b>${customerPhone}</b></div>
            <div class="meta-item">Địa chỉ: <b>${customerAddress}</b></div>
          </div>
          <div>
            <div class="meta-item">Trạng thái: <span style="font-weight: bold; color: ${stmt.status === 'CONFIRMED' ? '#16a34a' : '#475569'};">${stmt.status}</span></div>
            <div class="meta-item">Tổng số vận đơn: <b>${items.length} đơn</b></div>
            <div class="meta-item">Tổng tiền bảng kê: <b style="font-size: 16px; color: ${isCOD ? '#10b981' : '#7c3aed'};">${displayAmount.toLocaleString('vi-VN')} đ</b></div>
          </div>
        </div>

        <table class="main-table">
          <thead>
            ${tableHeaders}
          </thead>
          <tbody>
            ${rowsHtml}
            ${footerSummary}
          </tbody>
        </table>

        <div style="text-align: right; font-style: italic; color: #64748b; margin-bottom: 20px;">
          ..., Ngày ..... Tháng ..... Năm 20...
        </div>

        <div class="signature-section">
          <div class="signature-box">
            <div class="signature-title">Đại diện khách hàng</div>
            <div style="color: #cbd5e1; margin-bottom: 60px;">(Ký và ghi rõ họ tên)</div>
            <div class="signature-name">................................................</div>
          </div>
          <div class="signature-box">
            <div class="signature-title">Người lập bảng kê</div>
            <div style="color: #cbd5e1; margin-bottom: 60px;">(Ký và ghi rõ họ tên)</div>
            <div class="signature-name">${customer.representative_name || 'Kế toán SmartPost'}</div>
          </div>
        </div>

        <script>
          window.onload = function() {
            window.print();
            setTimeout(function() { window.close(); }, 500);
          };
        <\/script>
      </body>
    </html>
  `);
  printWindow.document.close();
};
</script>

<style scoped src="@/styles/admin/accounting/DebtStatement.css"></style>
