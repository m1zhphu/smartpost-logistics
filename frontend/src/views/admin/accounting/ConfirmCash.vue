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

            <el-table 
              :data="shipperReports" 
              v-loading="loading" 
              class="modern-table"
              style="width: 100%"
            >
              <!-- Expandable Row -->
              <el-table-column type="expand">
                <template #default="{ row }">
                  <div class="expand-detail-box">
                    <p class="detail-title">Chi tiết các mã vận đơn ({{ row.delivered_count }} đơn):</p>
                    <div class="waybill-tags">
                      <span 
                        v-for="code in row.waybill_codes" 
                        :key="code" 
                        class="code-badge default"
                      >
                        {{ code }}
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
              <el-table-column label="Thao tác" width="130" align="center" fixed="right">
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
                Hệ thống chỉ thống kê các đơn hàng có trạng thái <b class="text-success fw-bold">ĐÃ GIAO (DELIVERED)</b>. 
                Các đơn thất bại hoặc đang giao sẽ được chốt vào ca sau.
              </div>
            </div>
          </div>
        </el-col>

      </el-row>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { Money, RefreshRight, List, DataAnalysis, InfoFilled, Loading } from '@element-plus/icons-vue';
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

onMounted(() => {
  fetchData();
});
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap');

/* Base Layout */
.modern-confirm-cash {
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
.justify-center { justify-content: center; }
.gap-1 { gap: 4px; }
.gap-2 { gap: 8px; }
.w-full { width: 100%; }
.mb-24 { margin-bottom: 24px; }
.mt-24 { margin-top: 24px; }
.mt-1 { margin-top: 4px; }
.mr-1 { margin-right: 4px; }
.mr-2 { margin-right: 8px; }
.px-3 { padding-left: 12px; padding-right: 12px; }
.fw-500 { font-weight: 500; }
.fw-bold { font-weight: 700; }
.fw-800 { font-weight: 800; }
.text-dark { color: #1B2559; }
.text-muted { color: #A3AED0; }
.text-primary { color: #4318FF; }
.text-success { color: #05CD99; }
.text-danger { color: #EE5D50; }
.text-xs { font-size: 12px; }
.text-sm { font-size: 14px; }

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

.page-title { font-size: 28px; font-weight: 800; color: #2B3674; margin: 0 0 4px 0; letter-spacing: -0.5px; }
.page-subtitle { color: #A3AED0; font-size: 14px; margin: 0; font-weight: 500; }

.header-actions { display: flex; gap: 12px; }

/* Buttons */
.btn-primary { background: #4318FF; color: white; border: none; padding: 10px 20px; border-radius: 10px; font-family: inherit; font-size: 13px; display: inline-flex; align-items: center; gap: 6px; cursor: pointer; transition: all 0.3s ease; box-shadow: 0 4px 15px rgba(67, 24, 255, 0.25); }
.btn-primary:hover:not(:disabled) { background: #3311DB; transform: translateY(-2px); }
.btn-secondary { background: #FFFFFF; color: #2B3674; border: 1px solid #E2E8F0; padding: 10px 20px; border-radius: 10px; font-weight: 700; font-family: inherit; font-size: 14px; display: inline-flex; align-items: center; gap: 8px; cursor: pointer; transition: all 0.3s ease; }
.btn-secondary:hover:not(:disabled) { background: #F8FAFC; border-color: #A3AED0; }
button:disabled { opacity: 0.7; cursor: not-allowed; }

/* Layout */
.form-row-container { display: flex; align-items: stretch; }
.column-layout { display: flex; flex-direction: column; }
.flex-fill { flex: 1; display: flex; flex-direction: column; }

/* Cards */
.content-card {
  background: #FFFFFF;
  border-radius: 20px;
  padding: 24px;
  box-shadow: 0px 4px 20px rgba(0, 0, 0, 0.02);
  border: 1px solid #E9EDF7;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.section-header .el-icon { font-size: 18px; }

/* Modern Table */
:deep(.modern-table) {
  --el-table-border-color: transparent;
  --el-table-header-bg-color: #F8FAFC;
  --el-table-header-text-color: #A3AED0;
  --el-table-text-color: #2B3674;
}
:deep(.modern-table th.el-table__cell) { font-weight: 700; font-size: 12px; text-transform: uppercase; padding: 16px 0; border-bottom: 2px solid #E9EDF7 !important; }
:deep(.modern-table td.el-table__cell) { padding: 16px 0; border-bottom: 1px solid #F4F7FE !important; }
:deep(.el-table__expanded-cell) { padding: 0 !important; background-color: transparent !important; }

/* Expandable Row Content */
.expand-detail-box {
  background: #F8FAFC; border: 1px dashed #E2E8F0; border-radius: 12px; padding: 16px; margin: 12px 24px;
}
.detail-title { margin: 0 0 12px 0; font-size: 13px; font-weight: 700; color: #8F9BBA; }
.waybill-tags { display: flex; flex-wrap: wrap; gap: 8px; }

.code-badge { font-family: monospace; font-weight: 800; padding: 4px 10px; border-radius: 6px; font-size: 13px; display: inline-block; letter-spacing: 0.5px; }
.code-badge.default { background: #FFFFFF; color: #1B2559; border: 1px solid #E2E8F0; }

/* Shipper Info */
.shipper-profile { display: flex; align-items: center; gap: 12px; }
.avatar-circle { width: 42px; height: 42px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 18px; font-weight: 800; color: white; flex-shrink: 0; }
.bg-primary { background: linear-gradient(135deg, #4318FF, #868CFF); box-shadow: 0 4px 10px rgba(67, 24, 255, 0.2); }
.shipper-details { display: flex; flex-direction: column; justify-content: center; }

/* Table Columns */
.modern-tag { display: inline-flex; align-items: center; justify-content: center; gap: 6px; padding: 4px 12px; border-radius: 8px; font-size: 13px; font-weight: 800; }
.tag-success { background: rgba(5, 205, 153, 0.1); color: #05CD99; }

.amount-expected { font-weight: 900; color: #EE5D50; font-size: 18px; }

/* Input Number Customization */
:deep(.modern-price-input .el-input__wrapper) { background: #F8FAFC; box-shadow: 0 0 0 1px #E2E8F0 inset !important; border-radius: 8px; padding: 8px 12px; transition: all 0.3s; }
:deep(.modern-price-input .el-input__wrapper:hover) { box-shadow: 0 0 0 1px #4318FF inset !important; }
:deep(.modern-price-input .el-input__wrapper.is-focus) { box-shadow: 0 0 0 2px rgba(67, 24, 255, 0.2) inset !important; background: #FFFFFF; }
:deep(.actual-input .el-input__inner) { font-size: 18px !important; font-weight: 900 !important; color: #4318FF !important; text-align: center; }

/* Summary Right Column */
.sticky-card { position: sticky; top: 24px; background: #F8FAFC; border: 1px solid #E9EDF7; }

.stat-container { display: flex; flex-direction: column; gap: 16px; }
.stat-box { display: flex; justify-content: space-between; align-items: center; }
.stat-label { font-size: 14px; font-weight: 700; color: #8F9BBA; }
.stat-value { font-size: 28px; font-weight: 900; line-height: 1; }
.stat-divider { height: 1px; background-image: linear-gradient(to right, #E2E8F0 50%, transparent 50%); background-size: 8px 1px; background-repeat: repeat-x; }

/* Info Alert */
.info-alert { background: #E9EDF7; border-radius: 12px; padding: 16px; display: flex; align-items: flex-start; gap: 12px; }
.info-icon { font-size: 20px; color: #4318FF; margin-top: 2px; }
.info-content { font-size: 13px; line-height: 1.5; color: #2B3674; }

/* Message Box Customization for Danger */
:deep(.danger-confirm .el-button--primary) { background-color: #EE5D50 !important; border-color: #EE5D50 !important; }
:deep(.danger-confirm .el-button--primary:hover) { background-color: #e0483b !important; }

/* Animations */
.animate-fade-in { animation: fadeIn 0.5s ease-out; }
.animate-fade-in-up { animation: fadeInUp 0.5s ease-out; }
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes fadeInUp { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }

/* Responsive */
@media (max-width: 1200px) {
  .form-row-container { flex-direction: column; gap: 24px; }
  .column-layout { width: 100%; max-width: 100%; }
  .sticky-card { position: relative; top: 0; }
}
</style>