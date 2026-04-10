<template>
  <div class="cod-page">
    <div class="page-header">
      <div>
        <h2 class="page-title">Đối soát COD - Shop</h2>
        <p class="page-subtitle">Chốt bảng kê và thanh toán tiền COD cho khách hàng / cửa hàng</p>
      </div>
      <div class="header-actions">
        <el-button :icon="Refresh" circle @click="fetchData" title="Làm mới" />
        <el-button
          type="success"
          :icon="Download"
          @click="exportExcel"
          :loading="exporting"
          :disabled="codList.length === 0"
        >
          Xuất Excel
        </el-button>
        <el-button
          type="primary"
          :icon="DocumentCopy"
          @click="generateStatement"
          :loading="loading"
          :disabled="selectedRows.length === 0"
        >
          Chốt bảng kê ({{ selectedRows.length }} đơn)
        </el-button>
      </div>
    </div>

    <el-card class="filter-card" shadow="never">
      <div class="filter-bar">
        <el-select
          v-model="filter.customer_id"
          placeholder="Lọc theo Khách hàng / Shop"
          clearable filterable style="width:260px"
          @change="fetchData"
        >
          <el-option
            v-for="shop in customers"
            :key="shop.customer_id"
            :label="shop.company_name || shop.full_name || `KH #${shop.customer_id}`"
            :value="shop.customer_id"
          />
        </el-select>

        <el-select v-model="filter.status" placeholder="Trạng thái" style="width:180px" @change="fetchData">
          <el-option label="Chưa đối soát (DELIVERED)" value="DELIVERED" />
          <el-option label="Đã chốt bảng kê (SETTLED)" value="SETTLED" />
        </el-select>

        <el-button type="primary" :icon="Search" @click="fetchData">Tải dữ liệu</el-button>
        <el-button :icon="Refresh" @click="resetFilters">Làm mới bộ lọc</el-button>
      </div>
    </el-card>

    <div class="selection-bar" v-if="selectedRows.length > 0">
      <div class="selection-info">
        <el-icon class="text-blue-500 text-lg"><InfoFilled /></el-icon>
        <span>
          Đã chọn <strong class="text-blue-700">{{ selectedRows.length }}</strong> vận đơn —
          Tổng COD: <strong class="text-danger">{{ formatMoney(selectedSumCOD) }} đ</strong> |
          Tổng phí: <strong>{{ formatMoney(selectedSumFee) }} đ</strong> |
          CẦN THANH TOÁN SHOP: <strong class="text-success text-lg">{{ formatMoney(selectedSumCOD - selectedSumFee) }} đ</strong>
        </span>
      </div>
      <el-button type="primary" size="large" class="font-bold shadow-md" @click="generateStatement" :loading="loading">
        Chốt bảng kê ngay
      </el-button>
    </div>

    <el-card class="table-card" shadow="never">
      <template #header>
        <div class="card-header">
          <span>Danh sách Vận đơn</span>
          <el-tag type="info">{{ codList.length }} đơn</el-tag>
        </div>
      </template>

      <el-table
        ref="multipleTableRef"
        :data="codList"
        v-loading="loading"
        stripe border
        show-summary
        :summary-method="calculateSummaries"
        @selection-change="handleSelectionChange"
        :header-cell-style="{ background: '#f8fafc', fontWeight: '600' }"
      >
        <el-table-column type="selection" width="50" :selectable="canSelectRow" align="center" />

        <el-table-column prop="waybill_code" label="Mã vận đơn" width="155" fixed>
          <template #default="{ row }">
            <span class="code-text">{{ row.waybill_code }}</span>
          </template>
        </el-table-column>

        <el-table-column label="Khách hàng / Shop gửi" min-width="200">
          <template #default="{ row }">
            <div>
              <p class="name text-blue-700">
                <el-icon class="mr-1"><Shop /></el-icon> 
                {{ getShopName(row) }}
              </p>
              <p class="phone">{{ getShopPhone(row) }}</p>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="Người nhận" min-width="160">
          <template #default="{ row }">
            <div>
              <p class="name">{{ row.receiver_name }}</p>
              <p class="phone">{{ row.receiver_phone }}</p>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="Tiền COD" width="130" align="right">
          <template #default="{ row }">
            <span class="amount-cod">{{ formatMoney(row.cod_amount) }} đ</span>
          </template>
        </el-table-column>

        <el-table-column label="Phí vận chuyển" width="130" align="right">
          <template #default="{ row }">
            <span>{{ formatMoney(row.shipping_fee) }} đ</span>
          </template>
        </el-table-column>

        <el-table-column label="Thanh toán cho shop" width="170" align="right">
          <template #default="{ row }">
            <span class="amount-net">{{ formatMoney((row.cod_amount||0) - (row.shipping_fee||0)) }} đ</span>
          </template>
        </el-table-column>

        <el-table-column label="Trạng thái" width="140" align="center">
          <template #default="{ row }">
            <div :class="['status-pill', row.status === 'SETTLED' ? 'settled' : 'pending']">
              <span class="dot"></span>
              {{ row.status === 'SETTLED' ? 'Đã chốt' : 'Chờ đối soát' }}
            </div>
          </template>
        </el-table-column>
      </el-table>

      <div v-if="codList.length === 0 && !loading" class="empty-msg">
        <el-empty description="Không có vận đơn nào thỏa mãn điều kiện lọc." />
      </div>
    </el-card>

    <el-alert
      v-if="lastStatementCode"
      :title="`✅ Đã tạo Bảng kê ${lastStatementCode} thành công!`"
      description="Nhấn 'Xuất Excel' để tải file chi tiết bảng kê này gửi cho khách hàng."
      type="success"
      show-icon
      :closable="false"
      class="mt-4 shadow-sm"
    />
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { DocumentCopy, Download, Refresh, Search, InfoFilled, Shop } from '@element-plus/icons-vue';
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
  // Tìm trong mảng bank_accounts, hoặc object bank_account, hoặc lấy trực tiếp ở object ngoài cùng
  const bankObj = shopInfo.bank_accounts?.[0] || shopInfo.bank_account || shopInfo;

  const bankName = bankObj.bank_name || 'Chưa cập nhật NH';
  const bankAccount = bankObj.account_number || 'Chưa có STK';
  const bankOwner = bankObj.account_name || 'Chưa cập nhật Tên';
  // ---------------------------------------------

  const popupHtml = `
    <div style="font-size: 14px; line-height: 1.5; color: #374151;">
      Tạo bảng kê thanh toán cho Shop: <b class="text-blue-600" style="font-size: 15px;">${targetShopName}</b><br>
      Số lượng: <b>${selectedRows.value.length}</b> vận đơn.<br>
      <div style="margin: 10px 0; padding-bottom: 10px; border-bottom: 1px solid #e5e7eb;">
        Tổng tiền CẦN CHUYỂN KHOẢN: <br>
        <b style="color: #16a34a; font-size: 22px">${formatMoney(selectedSumCOD.value - selectedSumFee.value)} đ</b>
      </div>
      
      <div style="background-color: #f8fafc; border: 1px dashed #94a3b8; border-radius: 8px; padding: 12px; margin-bottom: 15px;">
        <div style="font-weight: 800; color: #475569; margin-bottom: 6px; font-size: 12px; text-transform: uppercase;">Thông tin Chuyển khoản (Copy):</div>
        <div style="display: grid; grid-template-columns: 90px 1fr; gap: 4px; font-size: 14px;">
          <span style="color: #64748b;">Ngân hàng:</span> <b>${bankName}</b>
          <span style="color: #64748b;">Số tài khoản:</span> <b style="color: #ea580c; font-size: 16px;">${bankAccount}</b>
          <span style="color: #64748b;">Chủ TK:</span> <b>${bankOwner}</b>
        </div>
      </div>
      <div>Xác nhận chốt sổ bảng kê này?</div>
    </div>
  `;

  try {
    await ElMessageBox.confirm(
      popupHtml,
      'Xác nhận Chốt Bảng Kê & Thanh Toán',
      { confirmButtonText: 'Đã chuyển khoản & Chốt ngay', cancelButtonText: 'Hủy', type: 'warning', dangerouslyUseHTMLString: true, customStyle: { maxWidth: '450px' } }
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
.cod-page { display: flex; flex-direction: column; gap: 16px; padding: 10px; }

.page-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 24px 28px;
  background: linear-gradient(135deg, #064e3b 0%, #059669 100%);
  border-radius: 12px; color: white;
  box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
}
.page-title { font-size: 1.5rem; font-weight: 800; margin: 0; letter-spacing: -0.5px; }
.page-subtitle { font-size: 0.9rem; opacity: 0.85; margin: 6px 0 0; }
.header-actions { display: flex; gap: 12px; align-items: center; }

.filter-card { border-radius: 12px; border: 1px solid #e5e7eb; box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
:deep(.filter-card .el-card__body) { padding: 16px 20px; }
.filter-bar { display: flex; gap: 12px; align-items: center; flex-wrap: wrap; }

.selection-bar {
  display: flex; align-items: center; justify-content: space-between;
  background: #eff6ff; border: 1px solid #bfdbfe;
  border-radius: 12px; padding: 16px 24px;
  font-size: 0.95rem;
  box-shadow: 0 4px 6px -1px rgba(59, 130, 246, 0.1);
}
.selection-info { display: flex; align-items: center; gap: 10px; }

.table-card { border-radius: 12px; border: 1px solid #e5e7eb; }
.card-header { display: flex; align-items: center; justify-content: space-between; font-weight: 700; font-size: 1.05rem; color: #1f2937; }

.code-text { font-family: monospace; font-size: 0.9rem; font-weight: 800; color: #1d4ed8; letter-spacing: 0.5px; }
.name { margin: 0; font-weight: 700; font-size: 0.9rem; color: #374151; }
.phone { margin: 0; font-size: 0.8rem; color: #6b7280; margin-top: 2px; }
.amount-cod { font-weight: 800; color: #dc2626; font-size: 0.95rem; }
.amount-net { font-weight: 800; color: #16a34a; font-size: 0.95rem; }

.status-pill {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 6px 12px; border-radius: 20px; font-size: 0.8rem; font-weight: 700;
}
.status-pill.settled { background: #dcfce7; color: #15803d; }
.status-pill.pending { background: #fef9c3; color: #b45309; }
.dot { width: 6px; height: 6px; border-radius: 50%; display: inline-block; background: currentColor; }

.text-danger { color: #dc2626; }
.text-success { color: #16a34a; }
.text-blue-600 { color: #2563eb; }
.text-blue-700 { color: #1d4ed8; }
.text-lg { font-size: 1.125rem; }
.font-bold { font-weight: bold; }
.shadow-md { box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
.empty-msg { padding: 60px; }
.mt-4 { margin-top: 16px; }
.mr-1 { margin-right: 4px; }

:deep(.el-table__footer-wrapper tbody td.el-table__cell) {
    background-color: #f1f5f9;
    font-weight: 800;
    color: #1e293b;
}
</style>