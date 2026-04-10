<template>
  <div class="waybill-list-page">
    <div class="page-header flex-center space-between flex-between mb-4">
      <div class="header-left">
        <h2 class="misa-title">Quản lý Vận đơn</h2>
        <p class="misa-subtitle">Tra cứu hành trình, cập nhật trạng thái và in ấn mẫu biểu</p>
      </div>
      <div class="header-right flex gap-2">
        <el-button type="success" :icon="Plus" @click="$router.push('/admin/waybills/create')">Thêm mới (F2)</el-button>
        <el-button :icon="Download" @click="exportExcel" :loading="exporting" plain>Xuất Excel</el-button>
      </div>
    </div>

    <el-card class="filter-card mb-4" shadow="never">
      <el-row :gutter="12">
        <el-col :span="6">
          <el-input 
            v-model="searchQuery" 
            placeholder="Mã vận đơn / SĐT / Tên nhận" 
            clearable 
            prefix-icon="Search"
            @keyup.enter="handleSearch"
            size="default"
          ></el-input>
        </el-col>
        <el-col :span="4">
          <el-select v-model="statusFilter" placeholder="Trạng thái" clearable class="w-full">
            <el-option label="Tất cả trạng thái" value=""></el-option>
            <el-option label="Mới tạo (CREATED)" value="CREATED"></el-option>
            <el-option label="Trong kho (IN_HUB)" value="IN_HUB"></el-option>
            <el-option label="Đang đi giao (DELIVERING)" value="DELIVERING"></el-option>
            <el-option label="Giao thành công (DELIVERED)" value="DELIVERED"></el-option>
            <el-option label="Đã đối soát (SETTLED)" value="SETTLED"></el-option>
            <el-option label="Đã hủy (CANCELLED)" value="CANCELLED"></el-option>
          </el-select>
        </el-col>
        <el-col :span="6">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="-"
            start-placeholder="Từ ngày"
            end-placeholder="Đến ngày"
            class="w-full"
          ></el-date-picker>
        </el-col>
        <el-col :span="8" class="flex-end gap-2">
          <el-button type="primary" :icon="Search" @click="handleSearch">Tìm kiếm</el-button>
          <el-button @click="resetFilters" plain>Mặc định</el-button>
        </el-col>
      </el-row>
    </el-card>

    <el-card class="table-card" shadow="never">
      <el-table 
        :data="waybills" 
        v-loading="loading" 
        stripe border 
        style="width: 100%"
        :header-cell-style="{ background: '#F2F5F8', color: '#111827', fontWeight: 'bold' }"
      >
        <el-table-column prop="waybill_code" label="Mã vận đơn" width="150" fixed>
          <template #default="{ row }">
             <el-link type="primary" :underline="false" @click="viewTracking(row.waybill_code)" class="font-bold">
               {{ row.waybill_code }}
             </el-link>
          </template>
        </el-table-column>
        
        <el-table-column label="Thông tin Người nhận" width="240">
          <template #default="{ row }">
            <div class="recipient-info">
              <div class="flex-center gap-2">
                 <span class="name font-bold">{{ row.receiver_name }}</span>
                 <el-tag size="small" effect="plain" type="info">{{ row.receiver_phone }}</el-tag>
              </div>
              <p class="addr text-muted mt-1 truncate" :title="row.receiver_address">{{ row.receiver_address }}</p>
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="status" label="Trạng thái" width="140" align="center">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" effect="light" round>
              {{ getStatusLabel(row.status) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="Tài chính (VNĐ)" width="200" align="right">
          <template #default="{ row }">
            <div class="finance-info">
              <p class="text-muted text-xs">Cước: {{ formatCurrencyManual(row.shipping_fee || 0) }}</p>
              <p class="font-bold text-danger">COD: {{ formatCurrencyManual(row.cod_amount) }}</p>
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="origin_hub.hub_name" label="Nguồn (Origin)" min-width="150" />
        <el-table-column prop="dest_hub.hub_name" label="Đích (Dest)" min-width="150" />

        <el-table-column label="Thao tác" width="220" fixed="right" align="center">
          <template #default="{ row }">
            <div class="action-buttons flex-center gap-1 justify-center">
              <el-button link type="primary" @click="handlePrint(row.waybill_code)">
                <el-icon><Printer /></el-icon> In
              </el-button>
              <el-button link type="primary" @click="viewTracking(row.waybill_code)">
                <el-icon><Van /></el-icon> Track
              </el-button>
              
              <el-dropdown trigger="click">
                <el-button link type="primary" :icon="MoreFilled" />
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item :icon="Edit" @click="openEditDialog(row)">Sửa</el-dropdown-item>
                    <el-dropdown-item 
                      :icon="Check" 
                      class="text-success" 
                      @click="handleUpdateStatus(row.waybill_code)"
                      :disabled="row.status === 'DELIVERED' || row.status === 'SETTLED'"
                    >
                      Kết thúc
                    </el-dropdown-item>
                    <el-dropdown-item 
                      :icon="Delete" 
                      class="text-danger" 
                      @click="handleDelete(row.waybill_code)"
                      v-if="row.status === 'CREATED'"
                    >
                      Hủy
                    </el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-wrapper mt-4 flex-between">
        <span class="text-muted text-sm italic">Hiển thị {{ waybills.length }} / {{ total }} bản ghi</span>
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="total"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
          background
        />
      </div>
    </el-card>

    <!-- Tracking History Modal -->
    <el-dialog v-model="trackingDialog" title="Lịch sử hành trình Vận đơn" width="650px" class="misa-dialog">
      <div v-if="selectedWaybill" class="tracking-summary mb-4 flex-between bg-primary-light p-3 border-radius-4">
        <div>
          <span class="text-muted text-xs block mb-1">Mã vận đơn:</span>
          <span class="font-bold text-lg text-primary">{{ selectedWaybill.waybill_code }}</span>
        </div>
        <div class="text-right">
           <el-tag :type="getStatusType(selectedWaybill.status)" effect="dark">{{ getStatusLabel(selectedWaybill.status) }}</el-tag>
        </div>
      </div>
      <el-scrollbar max-height="400px">
        <el-timeline v-loading="trackingLoading" class="p-4">
          <el-timeline-item
            v-for="(activity, index) in trackingLogs"
            :key="index"
            :type="index === 0 ? 'primary' : ''"
            :hollow="index !== 0"
            :timestamp="formatTime(activity.system_time)"
          >
            <div class="timeline-content">
              <h4 class="font-bold text-sm">{{ activity.status_id }}</h4>
              <p class="activity-note text-muted text-xs mt-1">{{ activity.note }}</p>
              <div v-if="activity.hub_name" class="activity-loc flex-center gap-1 mt-1">
                 <el-icon><Location /></el-icon>
                 <span>{{ activity.hub_name }}</span>
              </div>
            </div>
          </el-timeline-item>
        </el-timeline>
      </el-scrollbar>
      <template #footer>
         <el-button @click="trackingDialog = false">Đóng</el-button>
      </template>
    </el-dialog>

    <!-- Edit Modal -->
    <el-dialog v-model="editDialogVisible" title="Hiệu chỉnh thông tin Vận đơn" width="550px" class="misa-dialog">
      <el-form :model="editForm" label-position="top">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="Tên người nhận">
              <el-input v-model="editForm.receiver_name" placeholder="Nhập tên người nhận"></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="Số điện thoại">
              <el-input v-model="editForm.receiver_phone" placeholder="Nhập số điện thoại"></el-input>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="Địa chỉ giao hàng">
          <el-input v-model="editForm.receiver_address" type="textarea" :rows="3" placeholder="Số nhà, đường, phường/xã, quận/huyện..."></el-input>
        </el-form-item>
        <el-form-item label="Số tiền thu hộ (COD)">
          <el-input-number v-model="editForm.cod_amount" :min="0" :step="10000" class="w-full"></el-input-number>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="editDialogVisible = false">Hủy bỏ</el-button>
          <el-button type="primary" @click="submitEdit" :loading="editSubmitting">Cập nhật (Ctrl + S)</el-button>
        </span>
      </template>
    </el-dialog>

  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { Search, Plus, Printer, Download, MoreFilled, Check, Edit, Delete, Location } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import api from '@/api/axios';
import moment from 'moment';

const loading = ref(false);
const searchQuery = ref('');
const statusFilter = ref('');
const dateRange = ref([]);
const waybills = ref([]);
const total = ref(0);
const currentPage = ref(1);
const pageSize = ref(20);

const trackingDialog = ref(false);
const trackingLoading = ref(false);
const selectedWaybill = ref(null);
const trackingLogs = ref([]);

const editDialogVisible = ref(false);
const editSubmitting = ref(false);
const editForm = ref({
  waybill_code: '',
  receiver_name: '',
  receiver_phone: '',
  receiver_address: '',
  cod_amount: 0
});

const formatCurrencyManual = (amount) => {
  if (amount === null || amount === undefined) return '0 đ';
  return amount.toLocaleString('vi-VN') + ' đ';
};

const handleSearch = async () => {
  loading.value = true;
  try {
    const filters = {
      page: currentPage.value,
      size: pageSize.value,
      waybill_code: searchQuery.value,
      status: statusFilter.value || null,
      start_date: dateRange.value?.[0] ? moment(dateRange.value[0]).toISOString() : null,
      end_date: dateRange.value?.[1] ? moment(dateRange.value[1]).toISOString() : null
    };
    const response = await api.post('/api/waybills/search', filters);
    waybills.value = response.data.items || [];
    total.value = response.data.total || 0;
  } catch (err) {
    ElMessage.error('Không thể tìm kiếm vận đơn');
    waybills.value = [];
  } finally {
    loading.value = false;
  }
};

const exporting = ref(false);

const exportExcel = async () => {
  exporting.value = true;
  try {
    const filters = {
      page: 1,
      size: 10000,
      waybill_code: searchQuery.value,
      status: statusFilter.value || null,
      start_date: dateRange.value?.[0] ? moment(dateRange.value[0]).toISOString() : null,
      end_date: dateRange.value?.[1] ? moment(dateRange.value[1]).toISOString() : null
    };
    const response = await api.post('/api/waybills/export', filters, {
      responseType: 'blob'
    });
    
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    const filename = `DanhSachVanDon_${moment().format('YYYYMMDD_HHmm')}.xlsx`;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
    ElMessage.success('Đã xuất file Excel thành công!');
  } catch (err) {
    ElMessage.error('Không thể xuất Excel');
  } finally {
    exporting.value = false;
  }
};

const resetFilters = () => {
  searchQuery.value = '';
  statusFilter.value = '';
  dateRange.value = [];
  handleSearch();
};

const viewTracking = async (code) => {
  trackingDialog.value = true;
  trackingLoading.value = true;
  selectedWaybill.value = waybills.value.find(w => w.waybill_code === code);
  try {
    const response = await api.get(`/api/waybills/${code}/tracking`);
    trackingLogs.value = response.data.history;
  } catch (err) {
    ElMessage.error('Không tìm thấy dữ liệu hành trình');
    trackingLogs.value = [];
  } finally {
    trackingLoading.value = false;
  }
};

const handlePrint = (code) => {
  window.open(`http://localhost:8000/api/print/${code}`, '_blank');
};

const openEditDialog = (row) => {
  editForm.value = {
    waybill_code: row.waybill_code,
    receiver_name: row.receiver_name,
    receiver_phone: row.receiver_phone,
    receiver_address: row.receiver_address,
    cod_amount: row.cod_amount
  };
  editDialogVisible.value = true;
};

const submitEdit = async () => {
  editSubmitting.value = true;
  try {
    await api.put(`/api/waybills/${editForm.value.waybill_code}`, editForm.value);
    ElMessage.success('Đã cập nhật thông tin vận đơn thành công!');
    editDialogVisible.value = false;
    handleSearch();
  } catch (error) {
    ElMessage.error('Lỗi khi lưu thông tin');
  } finally {
    editSubmitting.value = false;
  }
};

const handleUpdateStatus = async (code) => {
  try {
    await ElMessageBox.confirm(
      `Xác nhận đơn hàng ${code} đã được giao thành công?`,
      'Hoàn tất giao hàng',
      { confirmButtonText: 'Đồng ý', cancelButtonText: 'Hủy', type: 'info' }
    );
    await api.patch(`/api/waybills/${code}/delivered`);
    ElMessage.success('Cập nhật trạng thái thành công!');
    handleSearch();
  } catch (error) {
    if (error !== 'cancel') ElMessage.error('Lỗi hệ thống');
  }
};

const handleDelete = async (code) => {
  try {
    await ElMessageBox.confirm(
      `Xác nhận hủy vận đơn ${code}? Thao tác này sẽ xóa đơn khỏi hệ thống vận hành.`,
      'Hủy Vận Đơn',
      { confirmButtonText: 'Hủy đơn', cancelButtonText: 'Quay lại', type: 'warning' }
    );
    await api.delete(`/api/waybills/${code}`);
    ElMessage.success(`Đã hủy vận đơn ${code}`);
    handleSearch();
  } catch (error) {
    if (error !== 'cancel') ElMessage.error('Lỗi khi hủy đơn');
  }
};

const getStatusType = (status) => {
  const map = {
    'CREATED': 'info',
    'IN_HUB': 'primary',
    'DELIVERING': 'warning',
    'DELIVERED': 'success',
    'SETTLED': 'success',
    'CANCELLED': 'info'
  };
  return map[status] || 'info';
};

const getStatusLabel = (status) => {
  const map = {
    'CREATED': 'Mới tạo',
    'IN_HUB': 'Trong kho',
    'DELIVERING': 'Đang giao',
    'DELIVERED': 'Giao xong',
    'SETTLED': 'Đối soát xong',
    'CANCELLED': 'Đã hủy'
  };
  return map[status] || status;
};

const formatTime = (t) => moment(t).format('DD/MM/YYYY HH:mm');
const handleSizeChange = () => handleSearch();
const handleCurrentChange = () => handleSearch();

onMounted(handleSearch);
</script>

<style scoped>
.waybill-list-page {
  padding: 0;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.recipient-info .name {
  font-size: 13px;
  color: var(--misa-text);
}

.recipient-info .addr {
  font-size: 12px;
  max-width: 210px;
}

.finance-info p {
  margin: 0;
  line-height: 1.4;
}

.text-xs { font-size: 11px; }
.text-sm { font-size: 13px; }
.text-lg { font-size: 18px; }
.block { display: block; }
.truncate { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

.flex-end { display: flex; justify-content: flex-end; align-items: center; }
.justify-center { justify-content: center; }

.bg-primary-light {
  background-color: var(--misa-primary-light);
}

.border-radius-4 {
  border-radius: 4px;
}

.activity-note {
  line-height: 1.4;
}

.activity-loc {
  color: var(--misa-primary);
  font-size: 11px;
}
</style>
<style scoped>
.waybill-list-page {
  padding: 0;
  width: 100%;
  max-width: 100% !important;
}
.page-header { display: flex; justify-content: space-between; align-items: flex-end; }
.flex-between { display: flex; justify-content: space-between; }
/* Fix action button blobs */
.action-buttons .el-button.is-link { 
  background: transparent !important; 
  padding: 4px 8px; 
  height: auto;
}
.action-buttons .el-icon { font-size: 18px; }
.filter-card { border-radius: 8px; }
.recipient-info p { margin: 0; line-height: 1.4; }
.name { font-size: 0.95rem; }
.phone { font-size: 0.85rem; }
.addr { font-size: 0.8rem; color: #666; max-width: 200px; }
.truncate { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.mt-4 { margin-top: 1rem; }
.flex-end { display: flex; justify-content: flex-end; gap: 10px; }
.font-bold { font-weight: 600; }
.text-success { color: #67C23A; }
.text-danger { color: #F56C6C; }
.activity-note { color: #666; font-size: 0.9rem; margin: 4px 0; }
.activity-loc { color: #409EFF; font-size: 0.8rem; font-weight: 600; }
</style>