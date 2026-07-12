<template>
  <div class="modern-confirm-cash">
    <div class="page-container">

      <!-- Header Section -->
      <header class="page-header animate-fade-in">
        <div class="header-content">
          <div class="title-wrapper">
            <div class="icon-box primary">
              <el-icon><Money /></el-icon>
            </div>
            <div>
              <h2 class="page-title">Chốt ca Shipper — Nộp tiền COD</h2>
              <p class="page-subtitle">Kế toán đối soát và xác nhận tiền mặt COD do Shipper nộp về</p>
            </div>
          </div>
        </div>
        <div class="header-actions">
          <button class="btn-secondary" @click="fetchData" :disabled="loading">
            <el-icon class="is-loading mr-2" v-if="loading"><Loading /></el-icon>
            <el-icon v-else><RefreshRight /></el-icon>
            <span>Làm mới dữ liệu</span>
          </button>
        </div>
      </header>

      <!-- Main Layout -->
      <el-row :gutter="24" class="form-row-container animate-fade-in-up">
        
        <!-- LEFT COLUMN: Shipper List (70%) -->
        <el-col :xs="24" :lg="16" class="column-layout">
          <div class="content-card list-card flex-fill">
            
            <div class="section-header flex-between mb-24">
              <div class="flex-center gap-2 text-primary">
                <el-icon><List /></el-icon>
                <span>Danh sách Shipper cần chốt ca</span>
              </div>
              <el-tag type="primary" effect="light" round class="fw-bold px-3">{{ shipperReports.length }} người</el-tag>
            </div>

            <div class="confirm-cash-table-scroll">
              <el-table 
                :data="shipperReports" 
                v-loading="loading" 
                class="modern-table"
                style="width: 100%; min-width: 810px; max-width: none;"
              >
                <!-- Expandable Row -->
                <el-table-column type="expand">
                  <template #default="{ row }">
                    <div class="expand-detail-box">
                      <div class="waybill-tags" style="display: flex; flex-wrap: wrap; gap: 8px;">
                        <span 
                          v-for="code in row.waybill_codes" 
                          :key="code" 
                          class="code-badge default"
                          style="cursor: pointer; display: inline-flex; align-items: center; gap: 4px; padding: 6px 10px; border-radius: 4px; border: 1px solid var(--sp-border, #d9d9d9); background: #f5f7fa; font-family: monospace; font-size: 13px;"
                          @click="showWaybillDetail(code)"
                          title="Click để xem chi tiết & lịch sử đơn"
                        >
                          {{ code }}
                          <el-icon><View /></el-icon>
                        </span>
                      </div>
                    </div>
                  </template>
                </el-table-column>

                <!-- Thông tin Shipper -->
                <el-table-column label="Thông tin Shipper" min-width="200">
                  <template #default="{ row }">
                    <div class="shipper-profile">
                      <div class="avatar-circle bg-primary">
                        {{ row.shipper_name?.charAt(0) || 'S' }}
                      </div>
                      <div class="shipper-details">
                        <span class="fw-bold text-dark">{{ row.shipper_name }}</span>
                        <span class="text-xs text-muted font-mono mt-1">ID: {{ row.shipper_id }}</span>
                      </div>
                    </div>
                  </template>
                </el-table-column>

                <!-- Đã giao -->
                <el-table-column label="Giao T.Công" width="110" align="center">
                  <template #default="{ row }">
                    <div class="modern-tag tag-success">
                      {{ row.delivered_count }} đơn
                    </div>
                  </template>
                </el-table-column>

                <!-- COD Phải thu -->
                <el-table-column label="Hệ thống yêu cầu" min-width="160" align="right">
                  <template #default="{ row }">
                    <span class="amount-expected">{{ formatMoney(row.expected_cod) }} đ</span>
                  </template>
                </el-table-column>

                <!-- Thực nộp -->
                <el-table-column label="Thực nộp (đ)" min-width="160" align="center">
                  <template #default="{ row }">
                    <el-input-number 
                      v-model="row.actual_cash" 
                      :controls="false" 
                      class="w-full modern-price-input actual-input"
                      :min="0"
                      :precision="0"
                      :step="1000"
                      :formatter="val => val ? val.toLocaleString('vi-VN') : '0'" 
                      :parser="val => val.replace(/[^\d]/g, '')" 
                    />
                  </template>
                </el-table-column>

                <!-- Thao tác -->
                <el-table-column label="Thao tác" width="130" align="center">
                  <template #default="{ row }">
                    <button 
                      class="btn-primary w-full justify-center fw-800" 
                      @click="confirmShipper(row)" 
                      :disabled="row.confirming || (row.expected_cod === 0 && row.delivered_count === 0)"
                    >
                      <el-icon class="is-loading mr-1" v-if="row.confirming"><Loading /></el-icon>
                      <span>CHỐT CA</span>
                    </button>
                  </template>
                </el-table-column>
                
                <template #empty>
                  <el-empty description="Tuyệt vời! Không còn Shipper nào cần chốt ca hiện tại." :image-size="100" />
                </template>
              </el-table>
            </div>

          </div>
        </el-col>

        <!-- RIGHT COLUMN: Summary (30%) -->
        <el-col :xs="24" :lg="8" class="column-layout">
          <div class="content-card summary-card sticky-card">
            <div class="section-header text-primary mb-24">
              <el-icon><DataAnalysis /></el-icon><span>TỔNG KẾT CA LÀM VIỆC</span>
            </div>
            
            <div class="stat-container">
              <div class="stat-box">
                <span class="stat-label">Tổng số Shipper:</span>
                <span class="stat-value text-dark">{{ shipperReports.length }} <span class="text-sm fw-500">người</span></span>
              </div>
              
              <div class="stat-divider"></div>
              
              <div class="stat-box">
                <span class="stat-label">Tổng COD chờ thu:</span>
                <span class="stat-value text-danger">{{ formatMoney(totalExpected) }} <span class="text-sm fw-500">đ</span></span>
              </div>
            </div>

            <div class="info-alert mt-24">
              <el-icon class="info-icon"><InfoFilled /></el-icon>
              <div class="info-content">
                Hệ thống chỉ thống kê các đơn hàng có trạng thái <b class="text-success fw-bold">ĐÃ GIAO</b>. 
                Các đơn thất bại hoặc đang giao sẽ được chốt vào ca sau.
              </div>
            </div>
          </div>
        </el-col>

      </el-row>
    </div>

    <!-- Dialog: Chi tiết vận đơn -->
    <el-dialog 
      v-model="detailDialogVisible" 
      :title="'Chi tiết vận đơn: ' + selectedWaybillCode" 
      width="650px" 
      class="modern-dialog"
      destroy-on-close
    >
      <div v-loading="loadingDetail" style="min-height: 200px; padding: 10px;">
        <template v-if="waybillDetail">
          <el-descriptions :column="2" border class="mb-4">
            <el-descriptions-item label="Mã vận đơn" :span="2">
              <span class="font-mono fw-bold" style="color: var(--sp-primary-color, #05CD99);">{{ waybillDetail.waybill_code }}</span>
            </el-descriptions-item>
            <el-descriptions-item label="Người nhận">
              <span class="fw-bold">{{ waybillDetail.receiver_name }}</span>
            </el-descriptions-item>
            <el-descriptions-item label="Số điện thoại">
              <span>{{ waybillDetail.receiver_phone }}</span>
            </el-descriptions-item>
            <el-descriptions-item label="Địa chỉ nhận" :span="2">
              <span style="font-size: 13px;">{{ waybillDetail.receiver_address }}</span>
            </el-descriptions-item>
            <el-descriptions-item label="Tiền COD">
              <span class="text-danger fw-bold">{{ formatMoney(waybillDetail.cod_amount) }} đ</span>
            </el-descriptions-item>
            <el-descriptions-item label="Phí vận chuyển">
              <span class="text-dark fw-bold">{{ formatMoney(waybillDetail.shipping_fee) }} đ</span>
            </el-descriptions-item>
            <el-descriptions-item label="Khối lượng">
              <span>{{ waybillDetail.actual_weight || waybillDetail.weight || 0 }} kg</span>
            </el-descriptions-item>
            <el-descriptions-item label="Trạng thái">
              <el-tag :type="getStatusType(waybillDetail.status)">{{ getStatusLabel(waybillDetail.status) }}</el-tag>
            </el-descriptions-item>
          </el-descriptions>

          <!-- Timeline hành trình -->
          <div class="timeline-section mt-4">
            <h4 style="margin-bottom: 16px; font-weight: 700; font-size: 15px; color: var(--sp-text-main);">Lịch sử hành trình</h4>
            <el-timeline v-if="trackingLogs && trackingLogs.length > 0">
              <el-timeline-item
                v-for="(log, index) in trackingLogs"
                :key="index"
                :timestamp="formatDateTime(log.time)"
                :type="index === trackingLogs.length - 1 ? 'primary' : ''"
              >
                <p class="fw-bold" style="margin: 0; font-size: 13px;">{{ getStatusLabel(log.status_id) }}</p>
                <p v-if="log.note" style="margin: 4px 0 0 0; font-size: 12px; color: var(--sp-text-muted);">{{ log.note }}</p>
              </el-timeline-item>
            </el-timeline>
            <el-empty v-else description="Chưa có lịch sử cập nhật trạng thái" :image-size="60" />
          </div>
        </template>
        <el-empty v-else-if="!loadingDetail" description="Không tìm thấy chi tiết vận đơn này" :image-size="80" />
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { Money, RefreshRight, List, DataAnalysis, InfoFilled, Loading, View } from '@element-plus/icons-vue';
import api from '@/api/axios';
import { ElMessage, ElMessageBox } from 'element-plus';

const loading = ref(false);
const shipperReports = ref([]);

const formatMoney = (v) => Number(v || 0).toLocaleString('vi-VN');

const totalExpected = computed(() => {
  return shipperReports.value.reduce((sum, row) => sum + (row.expected_cod || 0), 0);
});

const fetchData = async () => {
  loading.value = true;
  try {
    const res = await api.get('/api/accounting/cash-confirmation');
    shipperReports.value = res.data.map(item => ({
      ...item,
      actual_cash: item.expected_cod || 0,
      confirming: false
    }));
  } catch (err) {
    ElMessage.error('Không thể tải dữ liệu chốt ca. Vui lòng kiểm tra lại mạng!');
  } finally {
    loading.value = false;
  }
};

const confirmShipper = async (row) => {
  // Lệch tiền Check
  if (row.actual_cash !== row.expected_cod) {
    try {
      await ElMessageBox.confirm(
        `Số tiền Shipper nộp (<b style="color:#4318FF">${formatMoney(row.actual_cash)}đ</b>) đang <span style="color:#EE5D50; font-weight:bold;">KHÁC</span> với hệ thống yêu cầu (<b>${formatMoney(row.expected_cod)}đ</b>).<br><br>Bạn có chắc chắn muốn chốt ca và ghi nhận khoản lệch này vào công nợ không?`,
        'CẢNH BÁO LỆCH TIỀN',
        { 
          confirmButtonText: 'Vẫn chốt ca', 
          cancelButtonText: 'Kiểm tra lại', 
          type: 'warning',
          dangerouslyUseHTMLString: true,
          customClass: 'modern-message-box danger-confirm'
        }
      );
    } catch {
      return; 
    }
  } else {
    try {
      await ElMessageBox.confirm(
        `Xác nhận thu đủ <b style="color:#05CD99">${formatMoney(row.actual_cash)}đ</b> từ Shipper <b>${row.shipper_name}</b>?`, 
        'Xác nhận thu tiền', 
        { 
          type: 'success',
          dangerouslyUseHTMLString: true,
          customClass: 'modern-message-box'
        }
      );
    } catch {
      return;
    }
  }

  // Submit to Backend
  row.confirming = true;
  try {
    const payload = {
      waybill_codes: row.waybill_codes,
      actual_cash_collected: row.actual_cash, 
      note: `Kế toán chốt ca cho ${row.shipper_name}. Thực nộp: ${row.actual_cash}đ.`
    };

    await api.post('/api/accounting/confirm-shipper-cash', payload);

    ElMessage.success(`✅ Đã chốt ca cho ${row.shipper_name} thành công!`);
    fetchData(); 
  } catch (err) {
    ElMessage.error(err.response?.data?.detail || 'Lỗi hệ thống khi chốt ca!');
  } finally {
    row.confirming = false;
  }
};

// --- DIALOG CHI TIẾT ĐƠN HÀNG ---
const detailDialogVisible = ref(false);
const loadingDetail = ref(false);
const selectedWaybillCode = ref('');
const waybillDetail = ref(null);
const trackingLogs = ref([]);

const getStatusLabel = (status) => {
  const map = {
    'PENDING_PICKUP': 'Chờ lấy hàng',
    'PICKED': 'Đã lấy hàng',
    'IN_TRANSIT': 'Đang trung chuyển',
    'DELIVERING': 'Đang giao hàng',
    'DELIVERED': 'Đã giao thành công',
    'DELIVERY_FAILED': 'Giao thất bại',
    'RETURNING': 'Đang chuyển hoàn',
    'RETURNED': 'Đã hoàn trả',
    'CANCELLED': 'Đã hủy đơn',
    'PENDING_OCR': 'Chờ xử lý thông tin'
  };
  return map[status] || status;
};

const getStatusType = (status) => {
  const map = {
    'DELIVERED': 'success',
    'DELIVERING': 'warning',
    'PENDING_PICKUP': 'info',
    'CANCELLED': 'danger',
    'DELIVERY_FAILED': 'danger',
    'RETURNED': 'danger'
  };
  return map[status] || '';
};

const formatDateTime = (val) => {
  if (!val) return '';
  const date = new Date(val);
  const pad = (n) => n.toString().padStart(2, '0');
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const showWaybillDetail = async (code) => {
  selectedWaybillCode.value = code;
  detailDialogVisible.value = true;
  loadingDetail.value = true;
  waybillDetail.value = null;
  trackingLogs.value = [];
  
  try {
    const searchRes = await api.post('/api/waybills/search', { waybill_code: code });
    if (searchRes.data.items && searchRes.data.items.length > 0) {
      waybillDetail.value = searchRes.data.items[0];
    }
    const trackingRes = await api.get(`/api/waybills/${code}/tracking`);
    trackingLogs.value = trackingRes.data.history || [];
  } catch (err) {
    console.error(err);
    ElMessage.error('Không tải được chi tiết đơn hàng: ' + (err.response?.data?.detail || err.message));
  } finally {
    loadingDetail.value = false;
  }
};

onMounted(() => {
  fetchData();
});
</script>

<style scoped src="@/styles/admin/accounting/ConfirmCash.css"></style>