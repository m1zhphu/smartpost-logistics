<template>
  <div class="modern-bag-management">
    <div class="page-container">
      
      <!-- Header Section -->
      <header class="page-header animate-fade-in">
        <div class="header-content">
          <div class="title-wrapper">
            <div class="icon-box primary">
              <el-icon><Suitcase /></el-icon>
            </div>
            <div>
              <h2 class="page-title">Danh sách Túi hàng</h2>
              <p class="page-subtitle">Quản lý và tra cứu thông tin các túi hàng tại bưu cục</p>
            </div>
          </div>
        </div>
        <div class="header-actions">
          <button class="btn-primary" @click="goToBagging">
            <el-icon><Plus /></el-icon>
            <span>Đóng túi mới</span>
          </button>
        </div>
      </header>

      <!-- Advanced Filter Section -->
      <div class="content-card filter-card animate-fade-in mb-24">
        <el-row :gutter="20" class="filter-row">
          <el-col :xs="24" :sm="12" :lg="6" class="filter-col">
            <div class="filter-label">Mã túi hàng</div>
            <el-input 
              v-model="filters.bag_code" 
              placeholder="Nhập mã túi cần tìm..." 
              clearable 
              class="modern-input"
              @keyup.enter="fetchBags"
            >
              <template #prefix><el-icon><Search /></el-icon></template>
            </el-input>
          </el-col>
          
          <el-col :xs="24" :sm="12" :lg="5" class="filter-col">
            <div class="filter-label">Trạng thái</div>
            <el-select v-model="filters.status" placeholder="Tất cả trạng thái" clearable class="w-full modern-select" @change="fetchBags">
              <el-option label="Đang mở (Open)" value="OPEN" />
              <el-option label="Đã chốt (Closed)" value="CLOSED" />
              <el-option label="Đã xuất bến (Manifested)" value="MANIFESTED" />
            </el-select>
          </el-col>
          
          <el-col :xs="24" :sm="12" :lg="7" class="filter-col">
            <div class="filter-label">Bưu cục đích đến</div>
            <el-select v-model="filters.dest_hub_id" placeholder="Chọn bưu cục đích..." clearable filterable class="w-full modern-select" @change="fetchBags">
              <template #prefix><el-icon><Location /></el-icon></template>
              <el-option v-for="hub in hubs" :key="hub.hub_id" :label="`${hub.hub_code} - ${hub.hub_name}`" :value="hub.hub_id" />
            </el-select>
          </el-col>
          
          <el-col :xs="24" :sm="12" :lg="6" class="filter-action-col">
             <button class="btn-secondary w-full" @click="resetFilters">
               <el-icon><RefreshRight /></el-icon> Đặt lại
             </button>
             <button class="btn-primary w-full" @click="fetchBags">
               <el-icon><Search /></el-icon> Tìm kiếm
             </button>
          </el-col>
        </el-row>
      </div>

      <!-- Main Table Card -->
      <div class="content-card table-wrapper animate-fade-in-up">
        <div class="card-header-inner mb-4 flex-between">
          <h3 class="inner-title">Danh sách Túi hàng hệ thống</h3>
          <el-tag type="primary" effect="light" round class="fw-bold">Tổng: {{ pagination.total }} túi</el-tag>
        </div>

        <el-table 
          :data="bags" 
          v-loading="loading" 
          class="modern-table"
          row-class-name="modern-row"
          style="width: 100%"
        >
          <!-- STT -->
          <el-table-column type="index" label="STT" width="70" align="center" />
          
          <!-- Mã túi -->
          <el-table-column prop="bag_code" label="Mã Túi (Bag Code)" min-width="180">
            <template #default="{ row }">
              <span class="code-badge primary">{{ row.bag_code }}</span>
            </template>
          </el-table-column>
          
          <!-- Bưu cục đích -->
          <el-table-column prop="dest_hub_name" label="Bưu cục đích" min-width="200">
            <template #default="{ row }">
              <div class="hub-info">
                <el-icon class="text-primary"><LocationInformation /></el-icon>
                <span class="fw-bold text-dark">{{ row.dest_hub_name || 'Không xác định' }}</span>
              </div>
            </template>
          </el-table-column>
          
          <!-- Số lượng đơn -->
          <el-table-column prop="total_waybills" label="Số đơn (Kiện)" width="140" align="center">
            <template #default="{ row }">
              <div class="count-badge">
                <el-icon><Box /></el-icon>
                <span>{{ row.total_waybills || 0 }}</span>
              </div>
            </template>
          </el-table-column>
          
          <!-- Trạng thái -->
          <el-table-column prop="status" label="Trạng thái" width="160" align="center">
            <template #default="{ row }">
              <div class="modern-tag" :class="getStatusClass(row.status)">
                <span class="dot"></span>
                {{ getStatusName(row.status) }}
              </div>
            </template>
          </el-table-column>
          
          <!-- Ngày tạo -->
          <el-table-column prop="created_at" label="Thời gian tạo" min-width="180">
            <template #default="{ row }">
              <span class="time-text">
                <el-icon class="mr-1"><Calendar /></el-icon>
                {{ formatDate(row.created_at) }}
              </span>
            </template>
          </el-table-column>
          
          <!-- Thao tác -->
          <el-table-column label="Thao tác" width="120" fixed="right" align="center">
            <template #default="{ row }">
              <button class="icon-btn edit mx-auto" @click="viewBagDetails(row)" title="Xem chi tiết">
                <el-icon><View /></el-icon>
              </button>
            </template>
          </el-table-column>
          
          <template #empty>
            <el-empty description="Không tìm thấy túi hàng nào" :image-size="100" />
          </template>
        </el-table>

        <!-- Pagination -->
        <div class="pagination-wrapper mt-24 flex-between">
          <span class="pagination-info">Hiển thị {{ bags.length }} / {{ pagination.total }} bản ghi</span>
          <el-pagination
            v-model:current-page="pagination.page"
            v-model:page-size="pagination.size"
            :page-sizes="[10, 20, 50, 100]"
            layout="sizes, prev, pager, next, jumper"
            :total="pagination.total"
            @size-change="handleSizeChange"
            @current-change="handlePageChange"
            background
            class="modern-pagination"
          />
        </div>
      </div>

      <!-- Bag Details Dialog -->
      <el-dialog 
        v-model="dialogVisible" 
        :title="`Chi tiết túi: ${selectedBag?.bag_code}`" 
        width="800px"
        class="modern-dialog"
        destroy-on-close
      >
        <div v-if="selectedBag" class="bag-detail-header mb-24">
          <div class="detail-grid">
            <div class="detail-item">
              <span class="detail-label">Bưu cục đích:</span>
              <span class="detail-value fw-bold text-dark">{{ selectedBag.dest_hub_name }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Trạng thái:</span>
              <div class="modern-tag" :class="getStatusClass(selectedBag.status)">
                <span class="dot"></span> {{ getStatusName(selectedBag.status) }}
              </div>
            </div>
            <div class="detail-item">
              <span class="detail-label">Tổng số kiện:</span>
              <span class="detail-value text-primary fw-bold">{{ selectedBag.total_waybills }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Ngày tạo:</span>
              <span class="detail-value">{{ formatDate(selectedBag.created_at) }}</span>
            </div>
          </div>
        </div>
        
        <div class="section-header">
          <el-icon><List /></el-icon>
          <span>Danh sách vận đơn trong túi</span>
        </div>
        
        <el-table 
          :data="bagItems" 
          v-loading="loadingItems" 
          class="modern-table compact-table border-table" 
          height="350px"
        >
          <el-table-column type="index" label="STT" width="60" align="center" />
          
          <el-table-column prop="waybill_code" label="Mã Vận Đơn" min-width="180">
            <template #default="{ row }">
              <span class="code-badge default">{{ row.waybill_code }}</span>
            </template>
          </el-table-column>
          
          <el-table-column prop="scanned_at" label="Thời gian quét" min-width="200">
             <template #default="{ row }">
              <span class="time-text">
                <el-icon class="mr-1"><Clock /></el-icon>
                {{ formatDate(row.scanned_at) }}
              </span>
            </template>
          </el-table-column>
          
          <template #empty>
            <el-empty description="Túi này chưa có vận đơn nào" :image-size="60" />
          </template>
        </el-table>
        
        <template #footer>
          <div class="dialog-footer-actions">
            <button class="btn-secondary" @click="dialogVisible = false">Đóng cửa sổ</button>
          </div>
        </template>
      </el-dialog>

    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { 
  Search, RefreshRight, Plus, View, Suitcase, Location, 
  LocationInformation, Box, Calendar, List, Clock
} from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import api from '@/api/axios';

const router = useRouter();

// States
const loading = ref(false);
const bags = ref([]);
const hubs = ref([]);

// Lọc & Phân trang
const filters = reactive({
  bag_code: '',
  status: '',
  dest_hub_id: null
});

const pagination = reactive({
  page: 1,
  size: 20,
  total: 0
});

// Dialog chi tiết
const dialogVisible = ref(false);
const selectedBag = ref(null);
const bagItems = ref([]);
const loadingItems = ref(false);

// Methods
const fetchHubs = async () => {
  try {
    const res = await api.get('/api/hubs');
    hubs.value = res.data.items || res.data || [];
  } catch (err) {
    console.error('Lỗi tải danh sách bưu cục', err);
  }
};

const fetchBags = async () => {
  loading.value = true;
  try {
    const params = {
      page: pagination.page,
      size: pagination.size,
      ...(filters.bag_code && { bag_code: filters.bag_code }),
      ...(filters.status && { status: filters.status }),
      ...(filters.dest_hub_id && { dest_hub_id: filters.dest_hub_id })
    };

    const res = await api.get('/api/scans/bags', { params });
    bags.value = res.data.items || [];
    pagination.total = res.data.total || 0;
  } catch (err) {
    ElMessage.error('Lỗi khi tải danh sách túi.');
    console.error(err);
  } finally {
    loading.value = false;
  }
};

const viewBagDetails = async (bag) => {
  selectedBag.value = bag;
  dialogVisible.value = true;
  loadingItems.value = true;
  bagItems.value = [];

  try {
    const res = await api.get(`/api/scans/bags/${bag.bag_code}/items`);
    bagItems.value = res.data.items || res.data || [];
  } catch (err) {
    ElMessage.error('Lỗi tải chi tiết túi.');
  } finally {
    loadingItems.value = false;
  }
};

const resetFilters = () => {
  filters.bag_code = '';
  filters.status = '';
  filters.dest_hub_id = null;
  pagination.page = 1;
  fetchBags();
};

const handleSizeChange = (val) => {
  pagination.size = val;
  fetchBags();
};

const handlePageChange = (val) => {
  pagination.page = val;
  fetchBags();
};

const goToBagging = () => {
  router.push('/admin/warehouse/bagging'); 
};

// Utilities
const formatDate = (dateStr) => {
  if (!dateStr) return '---';
  const date = new Date(dateStr);
  return date.toLocaleString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
};

const getStatusName = (status) => {
  const map = {
    'OPEN': 'Đang mở',
    'CLOSED': 'Đã chốt',
    'MANIFESTED': 'Đã xuất bến'
  };
  return map[status] || status;
};

// Mapping sang CSS class Modern SaaS
const getStatusClass = (status) => {
  const map = {
    'OPEN': 'tag-warning',
    'CLOSED': 'tag-success',
    'MANIFESTED': 'tag-info'
  };
  return map[status] || 'tag-info';
};

onMounted(() => {
  fetchHubs();
  fetchBags();
});
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

/* Base Layout */
.modern-bag-management {
  min-height: calc(100vh - 64px);
  background-color: #F4F7FE; /* Light SaaS background */
  font-family: 'Plus Jakarta Sans', sans-serif;
  color: #2B3674;
  padding: 32px 24px;
}

.page-container {
  max-width: 1500px;
  margin: 0 auto;
}

/* Utilities */
.mb-24 { margin-bottom: 24px; }
.mb-4 { margin-bottom: 16px; }
.mt-24 { margin-top: 24px; }
.w-full { width: 100%; }
.fw-bold { font-weight: 700; }
.text-dark { color: #1B2559; }
.text-primary { color: #4318FF; }
.mr-1 { margin-right: 4px; }
.flex-between { display: flex; justify-content: space-between; align-items: center; }
.mx-auto { margin-left: auto; margin-right: auto; }

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

:deep(.modern-input .el-input__wrapper),
:deep(.modern-select .el-input__wrapper) {
  background: #F8FAFC; box-shadow: none !important; border: 1px solid #E2E8F0; border-radius: 10px; padding: 6px 12px; transition: all 0.3s;
}

:deep(.modern-input .el-input__wrapper:hover),
:deep(.modern-select .el-input__wrapper:hover),
:deep(.modern-input .el-input__wrapper.is-focus),
:deep(.modern-select .el-input__wrapper.is-focus) {
  border-color: #4318FF; background: #FFFFFF;
}

/* Table Card Header */
.card-header-inner { display: flex; align-items: center; gap: 16px; }
.card-header-inner.flex-between { justify-content: space-between; }
.inner-title { margin: 0; font-size: 18px; font-weight: 800; color: #1B2559; }

/* Modern Table */
:deep(.modern-table) {
  --el-table-border-color: transparent;
  --el-table-header-bg-color: #F4F7FE;
  --el-table-header-text-color: #A3AED0;
  --el-table-text-color: #2B3674;
}
:deep(.modern-table th.el-table__cell) { font-weight: 700; font-size: 13px; text-transform: uppercase; padding: 16px 0; border-bottom: 2px solid #E9EDF7 !important; }
:deep(.modern-table td.el-table__cell) { padding: 16px 0; border-bottom: 1px solid #F4F7FE !important; }
:deep(.border-table td.el-table__cell) { border-bottom: 1px dashed #E9EDF7 !important; }
:deep(.compact-table .el-table__cell) { padding: 12px 0; }

/* Table Cell Contents */
.code-badge { font-family: monospace; font-weight: 800; padding: 6px 10px; border-radius: 8px; font-size: 13px; display: inline-block; }
.code-badge.primary { background: #F4F7FE; color: #4318FF; }
.code-badge.default { background: #F8FAFC; color: #1B2559; border: 1px solid #E2E8F0; }

.hub-info { display: flex; align-items: center; gap: 8px; font-size: 13px; }

.count-badge { display: inline-flex; align-items: center; gap: 6px; background: rgba(67, 24, 255, 0.05); color: #4318FF; padding: 4px 12px; border-radius: 20px; font-weight: 700; font-size: 13px; }

.time-text { display: flex; align-items: center; font-size: 13px; color: #A3AED0; font-weight: 600; }

/* Tags */
.modern-tag { display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px; border-radius: 20px; font-size: 12px; font-weight: 700; width: fit-content; margin: 0 auto; }
.modern-tag .dot { width: 6px; height: 6px; border-radius: 50%; }
.tag-info { background: rgba(143, 155, 186, 0.1); color: #8F9BBA; }
.tag-info .dot { background: #8F9BBA; }
.tag-success { background: rgba(5, 205, 153, 0.1); color: #05CD99; }
.tag-success .dot { background: #05CD99; }
.tag-warning { background: rgba(255, 181, 71, 0.1); color: #FFB547; }
.tag-warning .dot { background: #FFB547; }

/* Buttons */
.btn-primary { background: #4318FF; color: white; border: none; padding: 10px 20px; border-radius: 12px; font-weight: 700; font-family: inherit; font-size: 14px; display: inline-flex; align-items: center; gap: 8px; cursor: pointer; transition: all 0.3s ease; box-shadow: 0 4px 15px rgba(67, 24, 255, 0.25); }
.btn-primary:hover:not(:disabled) { background: #3311DB; transform: translateY(-2px); }
.btn-secondary { background: #F4F7FE; color: #2B3674; border: none; padding: 10px 20px; border-radius: 12px; font-weight: 700; font-family: inherit; font-size: 14px; display: inline-flex; align-items: center; gap: 8px; cursor: pointer; transition: all 0.3s ease; }
.btn-secondary:hover:not(:disabled) { background: #E9EDF7; }

.icon-btn { width: 32px; height: 32px; border-radius: 8px; border: none; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s; font-size: 16px; }
.icon-btn.edit { background: #F4F7FE; color: #4318FF; }
.icon-btn.edit:hover { background: #4318FF; color: white; }

/* Pagination */
.pagination-wrapper { display: flex; justify-content: space-between; align-items: center; }
.pagination-info { font-size: 13px; color: #A3AED0; font-weight: 600; font-style: italic; }
:deep(.modern-pagination .el-pager li), :deep(.modern-pagination button) { background: #F8FAFC !important; border-radius: 8px; font-weight: 600; color: #8F9BBA; }
:deep(.modern-pagination .el-pager li.is-active) { background: #4318FF !important; color: white; }

/* Dialog Styles */
:deep(.modern-dialog) { border-radius: 20px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.1); }
:deep(.modern-dialog .el-dialog__header) { margin: 0; padding: 24px; border-bottom: 1px solid #E9EDF7; }
:deep(.modern-dialog .el-dialog__title) { font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 800; color: #2B3674; font-size: 18px; }
:deep(.modern-dialog .el-dialog__body) { padding: 24px; }
:deep(.modern-dialog .el-dialog__footer) { padding: 16px 24px 24px; border-top: 1px solid #E9EDF7; }
.dialog-footer-actions { display: flex; justify-content: flex-end; gap: 12px; }

/* Dialog Header Info Grid */
.bag-detail-header { background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 12px; padding: 20px; }
.detail-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }
.detail-item { display: flex; flex-direction: column; gap: 4px; }
.detail-label { font-size: 12px; font-weight: 700; color: #8F9BBA; text-transform: uppercase; }
.detail-value { font-size: 14px; color: #2B3674; }

.section-header { display: flex; align-items: center; gap: 8px; font-size: 15px; font-weight: 800; color: #1B2559; margin-bottom: 16px; text-transform: uppercase; letter-spacing: 0.5px; }
.section-header .el-icon { color: #4318FF; font-size: 18px; }

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
  .pagination-wrapper { flex-direction: column; gap: 16px; }
  .detail-grid { grid-template-columns: 1fr; }
}
</style>