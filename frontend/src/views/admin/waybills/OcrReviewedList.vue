<template>
  <div class="ocr-page">
    <div class="page-head">
      <div>
        <h2>Đơn đã OCR</h2>
        <p>Danh sách vận đơn đã được mobile OCR và đang chờ quản trị viên hoàn thiện.</p>
      </div>
      <el-button type="primary" :loading="loading" @click="fetchRows">Làm mới</el-button>
    </div>

    <el-card shadow="never" class="filter-card">
      <el-form :inline="true" :model="filters" class="filters">
        <el-form-item label="Từ khóa">
          <el-input v-model="filters.q" clearable placeholder="Mã vận đơn, SĐT, người nhận..." @keyup.enter="search" />
        </el-form-item>
        <el-form-item label="Trạng thái OCR">
          <el-select v-model="filters.ocr_status" clearable placeholder="Tất cả" style="width: 170px">
            <el-option label="Chờ kiểm tra" value="REVIEW" />
            <el-option label="Thiếu thông tin" value="INCOMPLETE" />
          </el-select>
        </el-form-item>
        <el-form-item label="Khách hàng">
          <el-select v-model="filters.customer_id" clearable filterable placeholder="Tất cả" style="width: 220px">
            <el-option
              v-for="customer in customers"
              :key="customer.customer_id"
              :label="customer.company_name || customer.transaction_name || customer.customer_code"
              :value="customer.customer_id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="Bưu cục">
          <el-select v-model="filters.hub_id" clearable filterable placeholder="Tất cả" style="width: 190px">
            <el-option v-for="hub in hubs" :key="hub.hub_id" :label="hub.hub_name" :value="hub.hub_id" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="search">Tìm kiếm</el-button>
          <el-button @click="reset">Đặt lại</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="never">
      <el-table :data="rows" v-loading="loading" border stripe>
        <el-table-column label="Mã vận đơn" min-width="240">
          <template #default="{ row }">
            <el-tag type="success">{{ row.waybill_code }}</el-tag>
            <div class="muted">{{ row.request_code || '---' }}</div>
          </template>
        </el-table-column>
        <el-table-column label="Túi thư / Khách hàng" min-width="220">
          <template #default="{ row }">
            <div>{{ row.bag_code || 'Đơn lẻ' }}</div>
            <div class="muted">{{ row.customer_name || row.customer_code || '---' }}</div>
          </template>
        </el-table-column>
        <el-table-column label="Người nhận" min-width="260">
          <template #default="{ row }">
            <strong>{{ row.receiver_name || '---' }}</strong>
            <div>{{ row.receiver_phone || '---' }}</div>
            <div class="muted address">{{ row.receiver_address || '---' }}</div>
          </template>
        </el-table-column>
        <el-table-column label="Hàng hóa" min-width="180">
          <template #default="{ row }">
            <div>{{ row.product_name || '---' }}</div>
            <div class="muted">{{ row.actual_weight || 0 }} kg - COD {{ formatMoney(row.cod_amount) }}</div>
          </template>
        </el-table-column>
        <el-table-column label="Ảnh" width="160">
          <template #default="{ row }">
            <div class="image-actions" style="display: flex; gap: 12px; align-items: center;">
              <div v-if="row.bill_image_url" style="text-align: center;">
                <el-image
                  style="width: 45px; height: 45px; border-radius: 4px; border: 1px solid #dcdfe6; cursor: pointer;"
                  :src="imageUrl(row.bill_image_url)"
                  :preview-src-list="[imageUrl(row.bill_image_url)]"
                  fit="cover"
                  preview-teleported
                />
                <div style="font-size: 11px; margin-top: 2px; color: #409EFF; font-weight: 500;">Bill</div>
              </div>
              
              <div v-if="getPickupImages(row).length" style="text-align: center;">
                <el-image
                  style="width: 45px; height: 45px; border-radius: 4px; border: 1px solid #dcdfe6; cursor: pointer;"
                  :src="imageUrl(getPickupImages(row)[0])"
                  :preview-src-list="getPickupImages(row).map(url => imageUrl(url))"
                  fit="cover"
                  preview-teleported
                />
                <div style="font-size: 11px; margin-top: 2px; color: #67C23A; font-weight: 500;">Pickup</div>
              </div>

              <span v-if="!row.bill_image_url && !getPickupImages(row).length" class="muted">---</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="OCR" width="150">
          <template #default="{ row }">
            <el-tag :type="row.ocr_status === 'REVIEW' ? 'success' : 'warning'">{{ getOcrStatusLabel(row.ocr_status) }}</el-tag>
            <div v-if="row.missing_fields?.length" class="missing">{{ row.missing_fields.join(', ') }}</div>
          </template>
        </el-table-column>
        <el-table-column label="Ngày OCR" width="160">
          <template #default="{ row }">{{ formatDate(row.updated_at) }}</template>
        </el-table-column>
        <el-table-column label="Thao tác" width="190" fixed="right">
          <template #default="{ row }">
            <el-button
              type="primary"
              size="small"
              :disabled="row.can_finalize_from_ocr === false"
              @click="finalize(row)"
            >Tạo nhanh đơn nội địa</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pager">
        <el-pagination
          v-model:current-page="filters.page"
          v-model:page-size="filters.size"
          layout="total, sizes, prev, pager, next"
          :total="total"
          :page-sizes="[10, 20, 50, 100]"
          @current-change="fetchRows"
          @size-change="search"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import api from '@/api/axios';
import { getMediaUrl } from '@/utils/mediaUrl';
import { formatVietnamDateTime } from '@/utils/dateTime';

const router = useRouter();
const loading = ref(false);
const getOcrStatusLabel = (status) => {
  const map = {
    'REVIEW': 'Chờ duyệt',
    'PENDING': 'Chờ xử lý',
    'VERIFIED': 'Đã duyệt',
    'MISMATCH': 'Sai lệch'
  };
  return map[status] || status;
};

const rows = ref([]);
const customers = ref([]);
const hubs = ref([]);
const total = ref(0);
const filters = reactive({
  q: '',
  ocr_status: '',
  customer_id: null,
  hub_id: null,
  page: 1,
  size: 20,
});

const fetchLookups = async () => {
  const [customerRes, hubRes] = await Promise.all([
    api.get('/api/customers').catch(() => ({ data: [] })),
    api.get('/api/hubs').catch(() => ({ data: [] })),
  ]);
  customers.value = customerRes.data.items || customerRes.data || [];
  hubs.value = hubRes.data.items || hubRes.data || [];
};

const fetchRows = async () => {
  loading.value = true;
  try {
    const params = { ...filters };
    if (!params.q) delete params.q;
    if (!params.ocr_status) delete params.ocr_status;
    if (!params.customer_id) delete params.customer_id;
    if (!params.hub_id) delete params.hub_id;
    const res = await api.get('/api/waybills/ocr-reviewed', { params });
    rows.value = res.data.items || [];
    total.value = res.data.total || 0;
  } catch (error) {
    ElMessage.error(error.response?.data?.detail || 'Không tải được danh sách OCR');
  } finally {
    loading.value = false;
  }
};

const search = () => {
  filters.page = 1;
  fetchRows();
};

const reset = () => {
  filters.q = '';
  filters.ocr_status = '';
  filters.customer_id = null;
  filters.hub_id = null;
  search();
};

const finalize = (row) => {
  router.push({
    path: '/admin/waybills/create',
    query: { source: 'ocr', waybill_code: row.waybill_code },
  });
};

const formatMoney = (value) => Number(value || 0).toLocaleString('vi-VN') + 'd';
const formatDate = (value) => formatVietnamDateTime(value);
const imageUrl = getMediaUrl;

const getPickupImages = (row) => {
  if (row.pickup_image_urls && row.pickup_image_urls.length > 0) {
    return row.pickup_image_urls;
  }
  return row.pickup_image_url ? [row.pickup_image_url] : [];
};

onMounted(async () => {
  await fetchLookups();
  await fetchRows();
});
</script>

<style scoped>
.ocr-page {
  padding: 24px;
}
.page-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 18px;
}
.page-head h2 {
  margin: 0 0 6px;
  color: #132238;
}
.page-head p,
.muted {
  color: #64748b;
  font-size: 13px;
}
.filter-card {
  margin-bottom: 16px;
}
.filters {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}
.address {
  max-width: 280px;
  white-space: normal;
}
.image-actions {
  display: flex;
  gap: 10px;
}
.missing {
  margin-top: 6px;
  color: #d97706;
  font-size: 12px;
}
.pager {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
</style>
