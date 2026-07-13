<template>
  <div class="modern-cod-page" style="min-width: 0; width: 100%;">
    <div class="page-container" style="min-width: 0; width: 100%;">

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
              <el-option label="Chưa đối soát" value="DELIVERED" />
              <el-option label="Đã chốt bảng kê" value="SETTLED" />
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
            <div style="margin-top: 10px;">
              <el-button type="warning" size="small" icon="Money" @click="showAdjustments" style="font-weight: bold; border-radius: 6px;">
                Xem Phiếu Điều Chỉnh Cước
              </el-button>
            </div>
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
      <div class="content-card table-wrapper animate-fade-in-up" style="min-width: 0; width: 100%; overflow: hidden;">
        <div class="card-header-inner mb-4 flex-between">
          <h3 class="inner-title">Danh sách Vận đơn đối soát</h3>
          <el-tag type="info" effect="light" round class="fw-bold px-3">{{ codList.length }} đơn</el-tag>
        </div>

        <div class="cod-table-scroll">
          <el-table
            ref="multipleTableRef"
            :data="codList"
            v-loading="loading"
            class="modern-table border-table"
            show-summary
            :summary-method="calculateSummaries"
            @selection-change="handleSelectionChange"
            style="width: 100%; min-width: 1400px; max-width: none;"
          >
          <!-- Checkbox -->
          <el-table-column type="selection" width="55" :selectable="canSelectRow" align="center" />

          <!-- Mã vận đơn -->
          <el-table-column prop="waybill_code" label="Mã vận đơn" min-width="220">
            <template #default="{ row }">
              <span class="code-badge primary">{{ row.waybill_code }}</span>
            </template>
          </el-table-column>

          <!-- Khách hàng / Shop -->
          <el-table-column label="Khách hàng gửi" min-width="220">
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
          <el-table-column label="Trạng thái" min-width="160" align="center">
            <template #default="{ row }">
              <div class="modern-tag" :class="row.status === 'SETTLED' ? 'tag-success' : 'tag-warning'">
                <span class="dot"></span>
                {{ row.status === 'SETTLED' ? 'Đã chốt' : 'Chờ đối soát' }}
              </div>
            </template>
          </el-table-column>

          <!-- Thao tác -->
          <el-table-column label="Thao tác" min-width="140" align="center">
            <template #default="{ row }">
              <el-button
                size="small"
                type="primary"
                plain
                icon="Edit"
                @click="openOverrideDialog(row)"
                :disabled="row.status === 'SETTLED'"
              >
                Sửa giá
              </el-button>
            </template>
          </el-table-column>
          
          <template #empty>
            <el-empty description="Không có vận đơn nào thỏa mãn điều kiện lọc" :image-size="100" />
          </template>
        </el-table>
      </div>
    </div>

    </div>

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

    <!-- Dialog Xem Phiếu Điều Chỉnh -->
    <el-dialog v-model="adjustmentsDialogVisible" title="📜 LỊCH SỬ PHIẾU ĐIỀU CHỈNH CƯỚC (BẢNG KÊ COD)" width="700px" append-to-body destroy-on-close>
      <div style="margin-bottom: 16px; font-weight: bold; color: #2b3674;">
        Bảng kê COD: <span style="color: #4318ff;">{{ lastStatementCode }}</span>
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
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { 
  DocumentCopy, Download, Refresh, Search, InfoFilled, Shop, 
  Money, RefreshRight, CircleCheckFilled, Close, Loading, Phone,
  Edit
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

// --- PHIẾU ĐIỀU CHỈNH CƯỚC ---
const adjustmentsDialogVisible = ref(false);
const loadingAdjustments = ref(false);
const adjustmentsList = ref([]);

const showAdjustments = async () => {
  if (!lastStatementId.value) return;
  adjustmentsDialogVisible.value = true;
  loadingAdjustments.value = true;
  adjustmentsList.value = [];
  try {
    const res = await api.get(`/api/accounting/statements/${lastStatementId.value}/adjustments`, {
      params: { statement_type: 'COD' }
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
    await fetchData();
  } catch (err) {
    ElMessage.error(err.response?.data?.detail || 'Lỗi khi sửa giá vận đơn');
  } finally {
    overrideSubmitting.value = false;
  }
};

const filter = reactive({
  customer_id: null,
  status: 'DELIVERED' 
});

const selectedSumCOD = computed(() => selectedRows.value.reduce((s, r) => s + (Number(r.cod_amount) || 0), 0));
const selectedSumFee = computed(() => selectedRows.value.reduce((s, r) => s + (Number(r.shipping_fee) || 0), 0));

const formatMoney = (v) => Number(v || 0).toLocaleString('vi-VN');

const handleSelectionChange = (val) => { selectedRows.value = val; };
const canSelectRow = (row) => true;

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
    if (index === 0) { sums[index] = ''; return; } // Checkbox
    if (index === 1) { sums[index] = 'TỔNG CỘNG'; return; } // Mã vận đơn
    if ([2, 3, 7, 8].includes(index)) { sums[index] = ''; return; }
    
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

<style scoped src="@/styles/admin/accounting/CODTable.css"></style>