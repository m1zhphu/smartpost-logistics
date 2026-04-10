<template>
  <div class="confirm-cash-page p-4">
    <div class="page-header mb-6">
      <div class="header-left">
        <div class="header-icon bg-blue-100 text-blue-600"><el-icon><Money /></el-icon></div>
        <div>
          <h2 class="misa-title m-0">Chốt ca Shipper — Nộp tiền COD</h2>
          <p class="text-muted m-0 mt-1">Kế toán đối soát và xác nhận tiền mặt COD do Shipper nộp về</p>
        </div>
      </div>
      <div class="header-actions">
        <el-button type="primary" plain :icon="RefreshRight" @click="fetchData" :loading="loading" size="large">
          Làm mới dữ liệu
        </el-button>
      </div>
    </div>

    <el-row :gutter="20">
      <el-col :xs="24" :lg="17">
        <el-card shadow="never" class="table-card border-none rounded-xl" v-loading="loading">
          <template #header>
            <div class="font-bold text-gray-800 flex items-center justify-between">
              <span><el-icon class="mr-2"><List /></el-icon> Danh sách Shipper cần chốt ca</span>
              <el-tag type="info" effect="plain" round>{{ shipperReports.length }} người</el-tag>
            </div>
          </template>

          <el-table :data="shipperReports" style="width: 100%" :header-cell-style="{ background: '#f8fafc', color: '#4b5563' }">
            
            <el-table-column type="expand">
              <template #default="{ row }">
                <div class="p-4 bg-gray-50 border border-gray-100 m-3 rounded-lg">
                  <p class="font-bold text-gray-700 mb-2 text-sm">Chi tiết các mã vận đơn ({{ row.delivered_count }} đơn):</p>
                  <div class="flex flex-wrap gap-2">
                    <el-tag 
                      v-for="code in row.waybill_codes" 
                      :key="code" 
                      type="info" 
                      effect="plain"
                      class="font-mono font-bold"
                    >
                      {{ code }}
                    </el-tag>
                  </div>
                </div>
              </template>
            </el-table-column>

            <el-table-column label="Thông tin Shipper" min-width="220">
              <template #default="{ row }">
                <div class="flex items-center gap-3">
                  <el-avatar :size="40" class="bg-blue-500 text-white font-bold">
                    {{ row.shipper_name?.charAt(0) || 'S' }}
                  </el-avatar>
                  <div class="flex flex-col">
                    <span class="font-bold text-gray-800 text-base">{{ row.shipper_name }}</span>
                    <span class="text-xs text-gray-500 font-mono mt-0.5">ID: {{ row.shipper_id }}</span>
                  </div>
                </div>
              </template>
            </el-table-column>

            <el-table-column label="Đã giao" width="100" align="center">
              <template #default="{ row }">
                <el-tag type="success" effect="dark" class="font-bold px-3">{{ row.delivered_count }}</el-tag>
              </template>
            </el-table-column>

            <el-table-column label="COD phải thu" width="160" align="right">
              <template #default="{ row }">
                <div class="text-red-600 font-black text-lg">{{ formatMoney(row.expected_cod) }}đ</div>
              </template>
            </el-table-column>

            <el-table-column label="Tiền Thực Nộp (đ)" width="180" align="center">
              <template #default="{ row }">
                <el-input-number 
                  v-model="row.actual_cash" 
                  :controls="false" 
                  class="w-full price-input"
                  :min="0"
                  :precision="0"
                  :step="1000"
                />
              </template>
            </el-table-column>

            <el-table-column label="Thao tác" width="130" align="center" fixed="right">
              <template #default="{ row }">
                <el-button 
                  type="primary" 
                  @click="confirmShipper(row)" 
                  :loading="row.confirming"
                  class="font-bold w-full"
                  :disabled="row.expected_cod === 0 && row.delivered_count === 0"
                >
                  CHỐT CA
                </el-button>
              </template>
            </el-table-column>
          </el-table>

          <el-empty v-if="!loading && shipperReports.length === 0" description="Tuyệt vời! Không còn Shipper nào cần chốt ca." />
        </el-card>
      </el-col>

      <el-col :xs="24" :lg="7">
        <el-card shadow="never" class="border-none rounded-xl bg-blue-50 sticky top-6">
          <template #header>
            <div class="font-bold text-blue-800"><el-icon><DataAnalysis /></el-icon> TỔNG KẾT CA LÀM VIÊC</div>
          </template>
          
          <div class="flex justify-between items-center mb-4">
            <span class="text-blue-700 font-semibold">Tổng Shipper:</span>
            <span class="text-xl font-black text-blue-900">{{ shipperReports.length }}</span>
          </div>

          <div class="flex justify-between items-center mb-4">
            <span class="text-blue-700 font-semibold">Tổng COD chờ thu:</span>
            <span class="text-2xl font-black text-red-600">{{ formatMoney(totalExpected) }} đ</span>
          </div>

          <el-divider class="border-blue-200 my-4" />
          
          <div class="bg-blue-100 text-blue-800 p-4 rounded-lg text-sm font-medium leading-relaxed flex gap-3">
            <el-icon class="text-xl mt-0.5 flex-shrink-0"><InfoFilled /></el-icon>
            <div>
              Hệ thống chỉ thống kê các đơn hàng có trạng thái <b class="text-green-600">ĐÃ GIAO (DELIVERED)</b>. Các đơn thất bại hoặc đang giao sẽ được chốt vào ca sau.
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { Money, RefreshRight, List, DataAnalysis, InfoFilled } from '@element-plus/icons-vue';
import api from '@/api/axios';
import { ElMessage, ElMessageBox } from 'element-plus';

const loading = ref(false);
const shipperReports = ref([]);

const formatMoney = (v) => Number(v || 0).toLocaleString('vi-VN');

const totalExpected = computed(() => {
  return shipperReports.value.reduce((sum, row) => sum + (row.expected_cod || 0), 0);
});

// Lấy dữ liệu từ API chốt ca
const fetchData = async () => {
  loading.value = true;
  try {
    const res = await api.get('/api/accounting/cash-confirmation');
    shipperReports.value = res.data.map(item => ({
      ...item,
      // Mặc định gán số tiền thực nộp bằng với số phải thu để kế toán đỡ phải gõ lại
      actual_cash: item.expected_cod || 0,
      confirming: false
    }));
  } catch (err) {
    ElMessage.error('Không thể tải dữ liệu chốt ca. Vui lòng kiểm tra lại mạng!');
  } finally {
    loading.value = false;
  }
};

// Hàm xử lý chốt ca siêu an toàn
const confirmShipper = async (row) => {
  // BƯỚC 1: KIỂM TRA LỆCH TIỀN (DISCREPANCY CHECK)
  if (row.actual_cash !== row.expected_cod) {
    try {
      await ElMessageBox.confirm(
        `Số tiền Shipper nộp (<b>${formatMoney(row.actual_cash)}đ</b>) đang <span style="color:red">KHÁC</span> với hệ thống yêu cầu (<b>${formatMoney(row.expected_cod)}đ</b>).<br><br>Bạn có chắc chắn muốn chốt ca và ghi nhận khoản lệch này vào công nợ không?`,
        'CẢNH BÁO LỆCH TIỀN',
        { 
          confirmButtonText: 'Vẫn chốt ca', 
          cancelButtonText: 'Kiểm tra lại', 
          type: 'warning',
          dangerouslyUseHTMLString: true,
          confirmButtonClass: 'el-button--danger'
        }
      );
    } catch {
      return; // Kế toán chọn hủy để kiểm tra lại
    }
  } else {
    // Tiền khớp nhau, chỉ hỏi xác nhận bình thường
    try {
      await ElMessageBox.confirm(`Xác nhận thu đủ ${formatMoney(row.actual_cash)}đ từ Shipper ${row.shipper_name}?`, 'Xác nhận thu tiền', { type: 'success' });
    } catch {
      return;
    }
  }

  // BƯỚC 2: GỬI LÊN BACKEND
  row.confirming = true;
  try {
    const payload = {
      waybill_codes: row.waybill_codes,
      actual_cash_collected: row.actual_cash, // <--- THÊM BIẾN NÀY ĐỂ BACKEND LƯU LẠI SỐ TIỀN THỰC TẾ
      note: `Kế toán chốt ca cho ${row.shipper_name}. Thực nộp: ${row.actual_cash}đ.`
    };

    await api.post('/api/accounting/confirm-shipper-cash', payload);

    ElMessage.success(`✅ Đã chốt ca cho ${row.shipper_name} thành công!`);
    fetchData(); // Load lại danh sách sau khi chốt xong
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
/* Reset & Typography */
.m-0 { margin: 0; }
.mt-1 { margin-top: 4px; }
.mt-4 { margin-top: 16px; }
.mb-2 { margin-bottom: 8px; }
.mb-4 { margin-bottom: 16px; }
.mb-6 { margin-bottom: 24px; }
.my-4 { margin: 16px 0; }
.mr-2 { margin-right: 8px; }
.w-full { width: 100%; }
.font-bold { font-weight: 700; }
.font-black { font-weight: 900; }
.font-mono { font-family: monospace; }
.text-muted { color: #6b7280; font-size: 14px; }

/* Flexbox Utils */
.flex { display: flex; }
.flex-col { flex-direction: column; }
.flex-wrap { flex-wrap: wrap; }
.items-center { align-items: center; }
.justify-between { justify-content: space-between; }
.gap-2 { gap: 8px; }
.gap-3 { gap: 12px; }

/* Page Header */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: white;
  padding: 20px 24px;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
  border: 1px solid #ebeef5;
}
.header-left { display: flex; align-items: center; gap: 16px; }
.header-icon {
  width: 48px; height: 48px;
  border-radius: 12px;
  display: flex; align-items: center; justify-content: center;
  font-size: 24px;
}
.misa-title { font-size: 22px; color: #111827; letter-spacing: -0.5px; }

/* Inputs */
:deep(.price-input .el-input__inner) {
  font-weight: 800;
  font-size: 16px;
  color: #2563eb;
}

/* Thẻ (Cards) */
.border-none { border: none; }
.rounded-xl { border-radius: 12px; }
.table-card { box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }

/* Bảng */
:deep(.el-table__expanded-cell) {
  padding: 0 !important;
  background-color: #f8fafc !important;
}
</style>