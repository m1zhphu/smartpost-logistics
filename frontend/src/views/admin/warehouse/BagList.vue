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
            <RecentSearchInput 
              v-model="filters.bag_code" 
              placeholder="Nhập mã túi cần tìm..." 
              clearable 
              class="modern-input"
              storageKey="recentSearches_bags"
              popoverWidth="300"
              @keyup.enter="fetchBags"
              @search="fetchBags"
              ref="searchInputRef"
            >
              <template #prefix><el-icon><Search /></el-icon></template>
            </RecentSearchInput>
          </el-col>
          
          <el-col :xs="24" :sm="12" :lg="5" class="filter-col">
            <div class="filter-label">Trạng thái</div>
            <el-select v-model="filters.status" placeholder="Tất cả trạng thái" clearable class="w-full modern-select" @change="fetchBags">
              <el-option label="Đang mở" value="OPEN" />
              <el-option label="Đã chốt" value="CLOSED" />
              <el-option label="Đã xuất bến" value="MANIFESTED" />
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
          <el-table-column prop="bag_code" label="Mã Túi" min-width="180">
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
          <el-table-column label="Thao tác" width="120" align="center">
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
import RecentSearchInput from '@/components/RecentSearchInput.vue';

const router = useRouter();

// States
const loading = ref(false);
const bags = ref([]);
const hubs = ref([]);
const searchInputRef = ref(null);

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
  searchInputRef.value?.saveSearch(filters.bag_code);
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

<style scoped src="@/styles/admin/warehouse/BagList.css"></style>