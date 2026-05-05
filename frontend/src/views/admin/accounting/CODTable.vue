<template>
  <div class="modern-cod-page">
    <div class="page-container">

      <!-- Header Section -->
      <header class="page-header animate-fade-in">
        <div class="header-content">
          <div class="title-wrapper">
            <div class="icon-box success">
              <el-icon><Money /></el-icon>
            </div>
            <div>
              <h2 class="page-title">Đối soát COD - Shop</h2>
              <p class="page-subtitle">Chốt bảng kê và thanh toán tiền COD cho khách hàng / cửa hàng</p>
            </div>
          </div>
        </div>
        <div class="header-actions">
          <button class="btn-icon" @click="fetchData" title="Làm mới dữ liệu">
            <el-icon><Refresh /></el-icon>
          </button>
          <button 
            class="btn-secondary" 
            @click="exportExcel" 
            :disabled="codList.length === 0 || exporting"
          >
            <el-icon class="is-loading mr-2" v-if="exporting"><Loading /></el-icon>
            <el-icon v-else><Download /></el-icon>
            <span>Xuất Excel</span>
          </button>
        </div>
      </header>

      <!-- Advanced Filter Section -->
      <div class="content-card filter-card animate-fade-in mb-24">
        <el-row :gutter="20" class="filter-row">
          <el-col :xs="24" :sm="12" :lg="8" class="filter-col">
            <div class="filter-label">Khách hàng / Shop</div>
            <el-select
              v-model="filter.customer_id"
              placeholder="Tìm và chọn Khách hàng / Shop..."
              clearable 
              filterable 
              class="w-full modern-select"
              @change="fetchData"
            >
              <template #prefix><el-icon><Shop /></el-icon></template>
              <el-option
                v-for="shop in customers"
                :key="shop.customer_id"
                :label="shop.company_name || shop.full_name || `KH #${shop.customer_id}`"
                :value="shop.customer_id"
              />
            </el-select>
          </el-col>
          
          <el-col :xs="24" :sm="12" :lg="6" class="filter-col">
            <div class="filter-label">Trạng thái đối soát</div>
            <el-select 
              v-model="filter.status" 
              placeholder="Trạng thái" 
              class="w-full modern-select" 
              @change="fetchData"
            >
              <el-option label="Chưa đối soát (DELIVERED)" value="DELIVERED" />
              <el-option label="Đã chốt bảng kê (SETTLED)" value="SETTLED" />
            </el-select>
          </el-col>
          
          <el-col :xs="24" :sm="12" :lg="10" class="filter-action-col flex-end">
             <button class="btn-secondary" @click="resetFilters">
               <el-icon><RefreshRight /></el-icon> Đặt lại
             </button>
             <button class="btn-primary" @click="fetchData">
               <el-icon><Search /></el-icon> Tải dữ liệu
             </button>
          </el-col>
        </el-row>
      </div>

      <!-- Alert for generated statement -->
      <el-collapse-transition>
        <div v-if="lastStatementCode" class="success-alert mb-24">
          <div class="alert-icon"><el-icon><CircleCheckFilled /></el-icon></div>
          <div class="alert-content">
            <h4 class="alert-title">Đã tạo Bảng kê {{ lastStatementCode }} thành công!</h4>
            <p class="alert-desc">Bạn có thể nhấn 'Xuất Excel' để tải file chi tiết bảng kê này và gửi cho khách hàng.</p>
          </div>
          <button class="alert-close" @click="lastStatementCode = ''"><el-icon><Close /></el-icon></button>
        </div>
      </el-collapse-transition>

      <!-- Selection Action Bar -->
      <el-collapse-transition>
        <div v-if="selectedRows.length > 0" class="selection-action-bar mb-24">
          <div class="selection-stats">
            <div class="stat-item">
              <span class="label">Đã chọn:</span>
              <span class="value text-primary">{{ selectedRows.length }} đơn</span>
            </div>
            <div class="stat-divider"></div>
            <div class="stat-item">
              <span class="label">Tổng COD:</span>
              <span class="value text-danger">{{ formatMoney(selectedSumCOD) }} đ</span>
            </div>
            <div class="stat-divider"></div>
            <div class="stat-item">
              <span class="label">Tổng phí VC:</span>
              <span class="value">{{ formatMoney(selectedSumFee) }} đ</span>
            </div>
            <div class="stat-divider"></div>
            <div class="stat-item highlight">
              <span class="label">CẦN THANH TOÁN:</span>
              <span class="value amount-total">{{ formatMoney(selectedSumCOD - selectedSumFee) }} đ</span>
            </div>
          </div>
          <button class="btn-success lg-btn shadow-btn" @click="generateStatement" :disabled="loading">
            <el-icon class="is-loading mr-2" v-if="loading"><Loading /></el-icon>
            <el-icon v-else><DocumentCopy /></el-icon>
            <span>CHỐT BẢNG KÊ NGAY</span>
          </button>
        </div>
      </el-collapse-transition>

      <!-- Main Table Card -->
      <div class="content-card table-wrapper animate-fade-in-up">
        <div class="card-header-inner mb-4 flex-between">
          <h3 class="inner-title">Danh sách Vận đơn đối soát</h3>
          <el-tag type="info" effect="light" round class="fw-bold px-3">{{ codList.length }} đơn</el-tag>
        </div>

        <el-table
          ref="multipleTableRef"
          :data="codList"
          v-loading="loading"
          class="modern-table border-table"
          show-summary
          :summary-method="calculateSummaries"
          @selection-change="handleSelectionChange"
          style="width: 100%"
        >
          <!-- Checkbox -->
          <el-table-column type="selection" width="55" :selectable="canSelectRow" align="center" />

          <!-- Mã vận đơn -->
          <el-table-column prop="waybill_code" label="Mã vận đơn" min-width="150" fixed="left">
            <template #default="{ row }">
              <span class="code-badge primary">{{ row.waybill_code }}</span>
            </template>
          </el-table-column>

          <!-- Khách hàng / Shop -->
          <el-table-column label="Khách hàng gửi (Shop)" min-width="220">
            <template #default="{ row }">
              <div class="customer-info">
                <span class="fw-bold text-dark flex-center gap-1">
                  <el-icon class="text-primary"><Shop /></el-icon> 
                  {{ getShopName(row) }}
                </span>
                <span class="text-xs text-muted flex-center gap-1 mt-1">
                  <el-icon><Phone /></el-icon> {{ getShopPhone(row) }}
                </span>
              </div>
            </template>
          </el-table-column>

          <!-- Người nhận -->
          <el-table-column label="Người nhận" min-width="180">
            <template #default="{ row }">
              <div class="customer-info">
                <span class="fw-bold text-dark">{{ row.receiver_name }}</span>
                <span class="text-xs text-muted mt-1">{{ row.receiver_phone }}</span>
              </div>
            </template>
          </el-table-column>

          <!-- Tiền COD -->
          <el-table-column label="Tiền COD" min-width="130" align="right">
            <template #default="{ row }">
              <span class="amount-cod">{{ formatMoney(row.cod_amount) }} đ</span>
            </template>
          </el-table-column>

          <!-- Phí VC -->
          <el-table-column label="Phí vận chuyển" min-width="130" align="right">
            <template #default="{ row }">
              <span class="fw-500 text-dark">{{ formatMoney(row.shipping_fee) }} đ</span>
            </template>
          </el-table-column>

          <!-- Thanh toán cho shop -->
          <el-table-column label="Thanh toán cho shop" min-width="170" align="right">
            <template #default="{ row }">
              <span class="amount-net">{{ formatMoney((row.cod_amount||0) - (row.shipping_fee||0)) }} đ</span>
            </template>
          </el-table-column>

          <!-- Trạng thái -->
          <el-table-column label="Trạng thái" width="140" align="center" fixed="right">
            <template #default="{ row }">
              <div class="modern-tag" :class="row.status === 'SETTLED' ? 'tag-success' : 'tag-warning'">
                <span class="dot"></span>
                {{ row.status === 'SETTLED' ? 'Đã chốt' : 'Chờ đối soát' }}
              </div>
            </template>
          </el-table-column>
          
          <template #empty>
            <el-empty description="Không có vận đơn nào thỏa mãn điều kiện lọc" :image-size="100" />
          </template>
        </el-table>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { 
  DocumentCopy, Download, Refresh, Search, InfoFilled, Shop, 
  Money, RefreshRight, CircleCheckFilled, Close, Loading, Phone 
} from '@element-plus/icons-vue';
import api from '@/api/axios';
import { ElMessage, ElNotification, ElMessageBox } from 'element-plus';

const loading = ref(false);
const exporting = ref(false);
const codList = ref([]);
const customers = ref([]);
const lastStatementId = ref(null);
const lastStatementCode = ref('');
const multipleTableRef = ref(null);
const selectedRows = ref([]);

const filter = reactive({
  customer_id: null,
  status: 'DELIVERED' 
});

const selectedSumCOD = computed(() => selectedRows.value.reduce((s, r) => s + (Number(r.cod_amount) || 0), 0));
const selectedSumFee = computed(() => selectedRows.value.reduce((s, r) => s + (Number(r.shipping_fee) || 0), 0));

const formatMoney = (v) => Number(v || 0).toLocaleString('vi-VN');

const handleSelectionChange = (val) => { selectedRows.value = val; };
const canSelectRow = (row) => row.status !== 'SETTLED';

const getCustomerInfo = (id) => {
  return customers.value.find(c => c.customer_id === id) || {};
};

const getShopName = (row) => {
  const c = getCustomerInfo(row.customer_id);
  return c.company_name || c.full_name || row.customer?.company_name || row.sender_name || `Khách hàng #${row.customer_id}`;
};

const getShopPhone = (row) => {
  const c = getCustomerInfo(row.customer_id);
  return c.phone || row.sender_phone || 'Không có SĐT';
};

const fetchData = async () => {
  loading.value = true;
  selectedRows.value = [];
  try {
    const custRes = await api.get('/api/customers').catch(() => ({ data: [] }));
    const raw = custRes.data;
    customers.value = Array.isArray(raw) ? raw : (raw.items || raw.data || []);

    const params = { status: filter.status, page: 1, size: 500 };
    if (filter.customer_id) params.customer_id = filter.customer_id;

    const res = await api.post('/api/waybills/search', params);
    codList.value = res.data.items || [];
  } catch (err) {
    ElMessage.error('Lỗi khi tải dữ liệu đối soát');
    codList.value = [];
  } finally {
    loading.value = false;
  }
};

const resetFilters = () => {
  filter.customer_id = null;
  filter.status = 'DELIVERED';
  lastStatementCode.value = '';
  lastStatementId.value = null;
  fetchData();
};

const generateStatement = async () => {
  if (selectedRows.value.length === 0) {
    return ElMessage.warning('Vui lòng tick chọn ít nhất 1 vận đơn để chốt bảng kê.');
  }

  const targetCustomerId = selectedRows.value[0].customer_id;
  const targetShopName = getShopName(selectedRows.value[0]);
  
  const isAllSameShop = selectedRows.value.every(row => row.customer_id === targetCustomerId);
  if (!isAllSameShop) {
    return ElMessage.error('CẢNH BÁO: Các vận đơn bạn chọn thuộc về nhiều Shop khác nhau!');
  }

  const shopInfo = getCustomerInfo(targetCustomerId);
  
  // --- THUẬT TOÁN DÒ TÌM NGÂN HÀNG SIÊU NHẠY ---
  const bankObj = shopInfo.bank_accounts?.[0] || shopInfo.bank_account || shopInfo;

  const bankName = bankObj.bank_name || 'Chưa cập nhật NH';
  const bankAccount = bankObj.account_number || 'Chưa có STK';
  const bankOwner = bankObj.account_name || 'Chưa cập nhật Tên';
  // ---------------------------------------------

  const popupHtml = `
    <div style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 14px; line-height: 1.5; color: #1B2559;">
      <div style="margin-bottom: 12px;">Tạo bảng kê thanh toán cho Shop: <b style="color: #4318FF; font-size: 15px;">${targetShopName}</b></div>
      <div style="margin-bottom: 12px;">Số lượng: <b>${selectedRows.value.length}</b> vận đơn.</div>
      
      <div style="background: #F4F7FE; border-radius: 12px; padding: 16px; margin: 16px 0; text-align: center; border: 1px solid #E9EDF7;">
        <div style="color: #8F9BBA; font-size: 12px; font-weight: 700; text-transform: uppercase; margin-bottom: 4px;">Tổng tiền CẦN CHUYỂN KHOẢN:</div>
        <div style="color: #05CD99; font-size: 28px; font-weight: 800;">${formatMoney(selectedSumCOD.value - selectedSumFee.value)} đ</div>
      </div>
      
      <div style="background-color: #FFFFFF; border: 1px dashed #A3AED0; border-radius: 12px; padding: 16px; margin-bottom: 16px;">
        <div style="font-weight: 800; color: #2B3674; margin-bottom: 10px; font-size: 12px; text-transform: uppercase;">Thông tin Chuyển khoản (Copy):</div>
        <div style="display: grid; grid-template-columns: 100px 1fr; gap: 8px; font-size: 14px;">
          <span style="color: #8F9BBA; font-weight: 600;">Ngân hàng:</span> <b style="color: #1B2559;">${bankName}</b>
          <span style="color: #8F9BBA; font-weight: 600;">Số tài khoản:</span> <b style="color: #EE5D50; font-size: 16px;">${bankAccount}</b>
          <span style="color: #8F9BBA; font-weight: 600;">Chủ TK:</span> <b style="color: #1B2559;">${bankOwner}</b>
        </div>
      </div>
      <div style="font-weight: 600;">Bạn có chắc chắn muốn xác nhận chốt sổ bảng kê này?</div>
    </div>
  `;

  try {
    await ElMessageBox.confirm(
      popupHtml,
      'Xác nhận Chốt Bảng Kê',
      { 
        confirmButtonText: 'Đã chuyển khoản & Chốt ngay', 
        cancelButtonText: 'Hủy bỏ', 
        type: 'warning', 
        dangerouslyUseHTMLString: true, 
        customStyle: { maxWidth: '500px' },
        customClass: 'modern-message-box'
      }
    );
  } catch {
    return;
  }

  loading.value = true;
  try {
    const waybillCodes = selectedRows.value.map(r => r.waybill_code);

    const res = await api.post(`/api/accounting/create-shop-statement?customer_id=${targetCustomerId}`, {
        waybill_codes: waybillCodes,
        note: "Đối soát tự động từ hệ thống"
    });

    lastStatementId.value = res.data?.statement_id || res.data?.id;
    lastStatementCode.value = res.data?.statement_code || `#${lastStatementId.value}`;

    ElNotification({
      title: 'Chốt bảng kê thành công!',
      message: `Bảng kê ${lastStatementCode.value} đã được tạo cho Shop ${targetShopName}.`,
      type: 'success',
      duration: 5000
    });

    if (multipleTableRef.value) multipleTableRef.value.clearSelection();
    fetchData(); 
  } catch (err) {
    const detail = err.response?.data?.detail || 'Lỗi khi chốt bảng kê.';
    ElMessage.error(detail);
  } finally {
    loading.value = false;
  }
};

const exportExcel = async () => {
  exporting.value = true;
  try {
    let apiUrl = lastStatementId.value ? `/api/accounting/cod/${lastStatementId.value}/export` : '/api/waybills/export';
    let method = lastStatementId.value ? 'get' : 'post';
    let requestData = lastStatementId.value ? {} : { status: filter.status, customer_id: filter.customer_id, page: 1, size: 10000 };

    const res = await api({ method, url: apiUrl, data: requestData, responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `BangKeCOD_${lastStatementCode.value || lastStatementId.value || new Date().getTime()}.xlsx`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
    ElMessage.success('Đã tải file Excel thành công!');
  } catch (err) {
    ElMessage.error('Xuất Excel thất bại. Vui lòng kiểm tra lại.');
  } finally {
    exporting.value = false;
  }
};

const calculateSummaries = ({ columns, data }) => {
  const sums = [];
  columns.forEach((column, index) => {
    if (index === 0) { sums[index] = 'TỔNG CỘNG'; return; }
    if ([1, 2, 3, 7].includes(index)) { sums[index] = ''; return; }
    
    if (index === 4) {
        const totalCod = data.reduce((prev, curr) => prev + (Number(curr.cod_amount) || 0), 0);
        sums[index] = formatMoney(totalCod) + ' đ';
    }
    if (index === 5) {
        const totalFee = data.reduce((prev, curr) => prev + (Number(curr.shipping_fee) || 0), 0);
        sums[index] = formatMoney(totalFee) + ' đ';
    }
    if (index === 6) {
        const totalNet = data.reduce((prev, curr) => prev + ((Number(curr.cod_amount) || 0) - (Number(curr.shipping_fee) || 0)), 0);
        sums[index] = formatMoney(totalNet) + ' đ';
    }
  });
  return sums;
};

onMounted(fetchData);
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

/* Base Layout */
.modern-cod-page {
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

/* Utilities */
.flex-between { display: flex; justify-content: space-between; align-items: center; }
.flex-center { display: flex; align-items: center; }
.flex-end { display: flex; justify-content: flex-end; align-items: center; }
.gap-1 { gap: 4px; }
.gap-2 { gap: 8px; }
.w-full { width: 100%; }
.mb-24 { margin-bottom: 24px; }
.mb-4 { margin-bottom: 16px; }
.mt-1 { margin-top: 4px; }
.mr-1 { margin-right: 4px; }
.mr-2 { margin-right: 8px; }
.px-3 { padding-left: 12px; padding-right: 12px; }
.fw-bold { font-weight: 700; }
.fw-500 { font-weight: 500; }
.text-dark { color: #1B2559; }
.text-muted { color: #A3AED0; }
.text-primary { color: #4318FF; }
.text-success { color: #05CD99; }
.text-danger { color: #EE5D50; }
.text-xs { font-size: 12px; }

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
.icon-box.success { background: rgba(5, 205, 153, 0.1); color: #05CD99; }

.page-title { font-size: 28px; font-weight: 800; color: #2B3674; margin: 0 0 4px 0; letter-spacing: -0.5px; }
.page-subtitle { color: #A3AED0; font-size: 14px; margin: 0; font-weight: 500; }

.header-actions { display: flex; gap: 12px; }

/* Filter Section */
.content-card {
  background: #FFFFFF;
  border-radius: 20px;
  padding: 24px;
  box-shadow: 0px 4px 20px rgba(0, 0, 0, 0.02);
}

.filter-card { padding: 20px 24px; }
.filter-row { align-items: flex-end; }
.filter-label { font-size: 13px; font-weight: 700; color: #2B3674; margin-bottom: 8px; }
.filter-action-col { display: flex; gap: 12px; }

:deep(.modern-select .el-input__wrapper) {
  background: #F8FAFC; box-shadow: none !important; border: 1px solid #E2E8F0; border-radius: 10px; padding: 6px 12px; transition: all 0.3s;
}
:deep(.modern-select .el-input__wrapper:hover),
:deep(.modern-select .el-input__wrapper.is-focus) {
  border-color: #4318FF; background: #FFFFFF;
}

/* Success Alert */
.success-alert {
  background: #F0FDF4; border: 1px solid #BBF7D0; border-radius: 16px; padding: 16px 20px; display: flex; align-items: flex-start; gap: 16px; position: relative;
}
.alert-icon { font-size: 24px; color: #05CD99; }
.alert-content { flex: 1; }
.alert-title { margin: 0 0 4px 0; font-size: 16px; font-weight: 800; color: #15803D; }
.alert-desc { margin: 0; font-size: 14px; color: #166534; }
.alert-close { background: transparent; border: none; font-size: 20px; color: #15803D; cursor: pointer; transition: 0.2s; position: absolute; top: 16px; right: 16px; }
.alert-close:hover { opacity: 0.7; }

/* Selection Action Bar */
.selection-action-bar {
  background: #FFFFFF; border: 1px solid #4318FF; border-radius: 16px; padding: 16px 24px; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 10px 30px rgba(67, 24, 255, 0.1); flex-wrap: wrap; gap: 16px;
}
.selection-stats { display: flex; align-items: center; flex-wrap: wrap; gap: 16px; }
.stat-item { display: flex; align-items: baseline; gap: 8px; }
.stat-item .label { font-size: 13px; font-weight: 700; color: #8F9BBA; text-transform: uppercase; }
.stat-item .value { font-size: 16px; font-weight: 800; color: #1B2559; }
.stat-divider { width: 1px; height: 24px; background: #E9EDF7; }
.stat-item.highlight .label { color: #1B2559; }
.stat-item.highlight .amount-total { font-size: 24px; color: #05CD99; }

/* Buttons */
.btn-primary { background: #4318FF; color: white; border: none; padding: 10px 20px; border-radius: 10px; font-weight: 700; font-family: inherit; font-size: 14px; display: inline-flex; align-items: center; gap: 8px; cursor: pointer; transition: all 0.3s ease; box-shadow: 0 4px 15px rgba(67, 24, 255, 0.25); }
.btn-primary:hover:not(:disabled) { background: #3311DB; transform: translateY(-2px); }
.btn-secondary { background: #F4F7FE; color: #2B3674; border: none; padding: 10px 20px; border-radius: 10px; font-weight: 700; font-family: inherit; font-size: 14px; display: inline-flex; align-items: center; gap: 8px; cursor: pointer; transition: all 0.3s ease; }
.btn-secondary:hover:not(:disabled) { background: #E9EDF7; }
.btn-success { background: #05CD99; color: white; border: none; padding: 10px 20px; border-radius: 10px; font-weight: 700; font-family: inherit; font-size: 14px; display: inline-flex; align-items: center; gap: 8px; cursor: pointer; transition: all 0.3s ease; }
.btn-success:hover:not(:disabled) { background: #04b083; transform: translateY(-2px); }
.shadow-btn { box-shadow: 0 8px 20px rgba(5, 205, 153, 0.3); }
.lg-btn { padding: 14px 28px; font-size: 16px; border-radius: 12px; }

.btn-icon { width: 40px; height: 40px; border-radius: 10px; background: #F4F7FE; color: #4318FF; border: none; display: flex; align-items: center; justify-content: center; font-size: 18px; cursor: pointer; transition: 0.3s; }
.btn-icon:hover { background: #E9EDF7; }

button:disabled { opacity: 0.7; cursor: not-allowed; }

/* Table Header */
.card-header-inner { display: flex; align-items: center; gap: 16px; }
.card-header-inner.flex-between { justify-content: space-between; }
.inner-title { margin: 0; font-size: 18px; font-weight: 800; color: #1B2559; }

/* Modern Table */
:deep(.modern-table) {
  --el-table-border-color: transparent;
  --el-table-header-bg-color: #F8FAFC;
  --el-table-header-text-color: #A3AED0;
  --el-table-text-color: #2B3674;
}
:deep(.modern-table th.el-table__cell) { font-weight: 700; font-size: 12px; text-transform: uppercase; padding: 16px 0; border-bottom: 2px solid #E9EDF7 !important; }
:deep(.modern-table td.el-table__cell) { padding: 16px 0; border-bottom: 1px solid #F4F7FE !important; }
:deep(.border-table td.el-table__cell) { border-bottom: 1px dashed #E9EDF7 !important; }

/* Table Footer Summary Styling */
:deep(.el-table__footer-wrapper tbody td.el-table__cell) {
    background-color: #F8FAFC;
    font-weight: 800;
    color: #1B2559;
    font-size: 14px;
    border-top: 2px solid #E9EDF7;
}

/* Checkbox styling */
:deep(.el-checkbox__inner) { border-radius: 4px; border-color: #A3AED0; }
:deep(.el-checkbox__input.is-checked .el-checkbox__inner) { background-color: #4318FF; border-color: #4318FF; }

/* Table Content Styles */
.code-badge { font-family: monospace; font-weight: 800; padding: 6px 10px; border-radius: 8px; font-size: 13px; display: inline-block; }
.code-badge.primary { background: #F4F7FE; color: #4318FF; }

.customer-info { display: flex; flex-direction: column; gap: 2px; }

.amount-cod { font-weight: 800; color: #EE5D50; font-size: 15px; }
.amount-net { font-weight: 800; color: #05CD99; font-size: 15px; }

/* Tags */
.modern-tag { display: inline-flex; align-items: center; justify-content: center; gap: 6px; padding: 6px 12px; border-radius: 20px; font-size: 12px; font-weight: 800; width: max-content; margin: 0 auto; }
.modern-tag .dot { width: 6px; height: 6px; border-radius: 50%; }
.tag-warning { background: rgba(255, 181, 71, 0.1); color: #FFB547; }
.tag-warning .dot { background: #FFB547; }
.tag-success { background: rgba(5, 205, 153, 0.1); color: #05CD99; }
.tag-success .dot { background: #05CD99; }

/* Animations */
.animate-fade-in { animation: fadeIn 0.5s ease-out; }
.animate-fade-in-up { animation: fadeInUp 0.5s ease-out; }
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes fadeInUp { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }

/* Responsive */
@media (max-width: 992px) { .filter-col { margin-bottom: 16px; } }
@media (max-width: 768px) {
  .page-header { flex-direction: column; align-items: flex-start; }
  .header-actions, .filter-action-col { width: 100%; flex-direction: column; }
  .filter-action-col .btn-primary, .filter-action-col .btn-secondary { width: 100%; margin: 0; }
  .selection-stats { flex-direction: column; align-items: flex-start; gap: 8px; }
  .stat-divider { display: none; }
  .selection-action-bar .btn-success { width: 100%; justify-content: center; }
}
</style>