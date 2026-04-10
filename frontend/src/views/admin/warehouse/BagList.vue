<template>
  <div class="bag-list-page">
    <div class="page-header flex-between mb-4">
      <div>
        <h2 class="misa-title">Danh sách Túi hàng (Bag Management)</h2>
        <p class="text-muted">Quản lý và tra cứu thông tin các túi hàng tại bưu cục</p>
      </div>
      <el-button type="primary" :icon="Plus" @click="goToBagging">
        Đóng túi mới
      </el-button>
    </div>

    <el-card class="filter-card mb-4" shadow="never">
      <el-form :inline="true" class="demo-form-inline">
        <el-form-item label="Mã túi">
          <el-input v-model="filters.bag_code" placeholder="Nhập mã túi cần tìm" clearable @keyup.enter="fetchBags" />
        </el-form-item>
        <el-form-item label="Trạng thái">
          <el-select v-model="filters.status" placeholder="Tất cả" clearable @change="fetchBags">
            <el-option label="Đang mở (Open)" value="OPEN" />
            <el-option label="Đã chốt (Closed)" value="CLOSED" />
            <el-option label="Đã xuất bến (Manifested)" value="MANIFESTED" />
          </el-select>
        </el-form-item>
        <el-form-item label="Bưu cục đích">
          <el-select v-model="filters.dest_hub_id" placeholder="Chọn bưu cục đích" clearable filterable @change="fetchBags">
            <el-option v-for="hub in hubs" :key="hub.hub_id" :label="hub.hub_name" :value="hub.hub_id" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="fetchBags">Tìm kiếm</el-button>
          <el-button :icon="Refresh" @click="resetFilters">Làm mới</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="never">
      <el-table :data="bags" v-loading="loading" stripe border style="width: 100%">
        <el-table-column type="index" label="STT" width="60" align="center" />
        <el-table-column prop="bag_code" label="Mã Túi (Bag Code)" min-width="180">
          <template #default="{ row }">
            <span class="font-mono font-bold text-primary">{{ row.bag_code }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="dest_hub_name" label="Bưu cục đích" min-width="150" />
        <el-table-column prop="total_waybills" label="Số đơn (Kiện)" width="120" align="center">
          <template #default="{ row }">
            <el-tag type="info">{{ row.total_waybills || 0 }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="Trạng thái" width="150" align="center">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" effect="dark">
              {{ getStatusName(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="Ngày tạo" width="160">
          <template #default="{ row }">
            {{ formatDate(row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="Thao tác" width="120" align="center" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="viewBagDetails(row)">
              Chi tiết
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-container mt-4 flex-end">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.size"
          :page-sizes="[10, 20, 50, 100]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next"
          @size-change="handleSizeChange"
          @current-change="handlePageChange"
        />
      </div>
    </el-card>

    <el-dialog v-model="dialogVisible" :title="`Chi tiết túi: ${selectedBag?.bag_code}`" width="800px">
      <div v-if="selectedBag" class="bag-info mb-4">
        <el-descriptions border :column="2">
          <el-descriptions-item label="Bưu cục đích">{{ selectedBag.dest_hub_name }}</el-descriptions-item>
          <el-descriptions-item label="Trạng thái">
            <el-tag :type="getStatusType(selectedBag.status)" size="small">
              {{ getStatusName(selectedBag.status) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="Tổng số kiện">{{ selectedBag.total_waybills }}</el-descriptions-item>
          <el-descriptions-item label="Ngày tạo">{{ formatDate(selectedBag.created_at) }}</el-descriptions-item>
        </el-descriptions>
      </div>
      
      <h4 class="mb-2">Danh sách vận đơn trong túi</h4>
      <el-table :data="bagItems" v-loading="loadingItems" border stripe height="300px">
        <el-table-column type="index" label="STT" width="60" align="center" />
        <el-table-column prop="waybill_code" label="Mã Vận Đơn" min-width="150" />
        <el-table-column prop="scanned_at" label="Thời gian quét" width="180">
           <template #default="{ row }">
            {{ formatDate(row.scanned_at) }}
          </template>
        </el-table-column>
      </el-table>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { Search, Refresh, Plus, View } from '@element-plus/icons-vue';
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
    // Gọi API lấy danh sách túi (Bạn cần đảm bảo Backend có API này)
    // Ví dụ URL: /api/scans/bags?page=1&size=20&bag_code=...
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
    // API lấy các mã vận đơn nằm trong túi này
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
  router.push('/admin/warehouse/bagging'); // Chuyển đến trang tạo túi mới
};

// Utilities
const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  // Format theo kiểu DD/MM/YYYY HH:mm bằng JS thuần
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

const getStatusType = (status) => {
  const map = {
    'OPEN': 'warning',
    'CLOSED': 'success',
    'MANIFESTED': 'info'
  };
  return map[status] || 'info';
};

onMounted(() => {
  fetchHubs();
  fetchBags();
});
</script>

<style scoped>
.flex-between { display: flex; justify-content: space-between; align-items: center; }
.flex-end { display: flex; justify-content: flex-end; }
.mb-4 { margin-bottom: 1rem; }
.mb-2 { margin-bottom: 0.5rem; }
.mt-4 { margin-top: 1rem; }
.text-muted { color: #6b7280; }
.font-mono { font-family: monospace; }
.font-bold { font-weight: bold; }
.text-primary { color: #409EFF; }
</style>