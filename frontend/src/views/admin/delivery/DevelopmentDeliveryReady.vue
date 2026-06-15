<template>
  <div class="ready-page">
    <header class="page-header">
      <div>
        <h2>Đơn chuẩn bị giao</h2>
        <p>Đưa đơn đã OCR và xác thực sang bước phân công giao hàng, tạm bỏ qua nghiệp vụ kho.</p>
      </div>
      <el-button :icon="Refresh" :loading="loading" @click="loadWaybills">Làm mới</el-button>
    </header>

    <el-alert
      title="Chức năng dùng trong giai đoạn phát triển"
      description="Chỉ đơn đã OCR thành công, vận đơn đã xác thực và đang ở trạng thái Mới tạo mới được chuyển. Mỗi lần chuyển đều lưu hành trình; luồng kho hiện hữu không bị thay đổi."
      type="warning"
      show-icon
      :closable="false"
      class="development-alert"
    />

    <section class="summary-grid">
      <div class="summary-card"><span>Đủ điều kiện</span><strong>{{ waybills.length }}</strong></div>
      <div class="summary-card urgent"><span>Hỏa tốc</span><strong>{{ urgentCount }}</strong></div>
      <div class="summary-card cod"><span>Tổng COD</span><strong>{{ money(totalCod) }}</strong></div>
      <div class="summary-card selected"><span>Đang chọn</span><strong>{{ selectedRows.length }}</strong></div>
    </section>

    <section class="content-card">
      <div class="toolbar">
        <el-input v-model="keyword" clearable placeholder="Tìm mã vận đơn, người nhận, số điện thoại" :prefix-icon="Search" @keyup.enter="loadWaybills" />
        <div class="toolbar-actions">
          <el-button @click="loadWaybills">Tìm kiếm</el-button>
          <el-button type="primary" :loading="submitting" :disabled="!selectedRows.length" @click="prepareSelected">
            Chuyển {{ selectedRows.length }} đơn sang sẵn sàng giao
          </el-button>
          <el-button type="success" plain @click="router.push('/admin/delivery/assign')">Mở phân công Shipper</el-button>
        </div>
      </div>

      <el-table
        v-loading="loading"
        :data="waybills"
        row-key="waybill_id"
        :row-class-name="rowClassName"
        @selection-change="selectedRows = $event"
      >
        <el-table-column type="selection" width="48" />
        <el-table-column label="Vận đơn" min-width="185">
          <template #default="{ row }">
            <div class="code-line">
              <strong>{{ row.waybill_code }}</strong>
              <el-tag v-if="isUrgent(row)" type="danger" size="small" effect="dark">HỎA TỐC</el-tag>
            </div>
            <div class="status-tags">
              <el-tag type="success" size="small">OCR thành công</el-tag>
              <el-tag type="success" size="small" effect="plain">Đã xác thực</el-tag>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="Người nhận" min-width="220">
          <template #default="{ row }">
            <strong>{{ row.receiver_name || 'Chưa có tên' }}</strong>
            <div class="muted">{{ row.receiver_phone || 'Chưa có SĐT' }}</div>
            <div class="muted ellipsis">{{ row.receiver_address || 'Chưa có địa chỉ' }}</div>
          </template>
        </el-table-column>
        <el-table-column label="Dịch vụ / Thanh toán" min-width="175">
          <template #default="{ row }">
            <el-tag :type="isUrgent(row) ? 'danger' : 'info'">{{ serviceLabel(row.service_type) }}</el-tag>
            <div class="payment">{{ paymentLabel(row.payment_method) }}</div>
          </template>
        </el-table-column>
        <el-table-column label="Tài chính" min-width="155" align="right">
          <template #default="{ row }">
            <div>Phí: <strong>{{ money(row.shipping_fee) }}</strong></div>
            <div>COD: <strong class="cod-text">{{ money(row.cod_amount) }}</strong></div>
            <div class="muted">Tổng thu: {{ money(row.total_amount_to_collect) }}</div>
          </template>
        </el-table-column>
        <el-table-column label="Hình ảnh" width="135" align="center">
          <template #default="{ row }">
            <div class="image-links">
              <el-link v-if="row.bill_image_url" type="primary" :href="assetUrl(row.bill_image_url)" target="_blank">Ảnh bill</el-link>
              <el-link v-if="row.pickup_image_url" type="success" :href="assetUrl(row.pickup_image_url)" target="_blank">Ảnh pickup</el-link>
              <span v-if="!row.bill_image_url && !row.pickup_image_url" class="muted">Chưa có</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="Bưu cục giao" width="125" align="center">
          <template #default="{ row }">#{{ row.dest_hub_id || row.origin_hub_id || row.holding_hub_id || '-' }}</template>
        </el-table-column>
        <template #empty><el-empty description="Không có đơn đủ điều kiện" /></template>
      </el-table>
    </section>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { Refresh, Search } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useRouter } from 'vue-router'
import api from '@/api/axios'
import { getMediaUrl } from '@/utils/mediaUrl'

const router = useRouter()
const loading = ref(false)
const submitting = ref(false)
const keyword = ref('')
const waybills = ref([])
const selectedRows = ref([])

const urgentCount = computed(() => waybills.value.filter(isUrgent).length)
const totalCod = computed(() => waybills.value.reduce((sum, item) => sum + Number(item.cod_amount || 0), 0))

const isUrgent = (row) => ['HT', 'EXPRESS', 'URGENT'].includes(String(row.service_type || '').toUpperCase())
const money = (value) => `${Number(value || 0).toLocaleString('vi-VN')} đ`
const serviceLabel = (value) => isUrgent({ service_type: value }) ? 'Hỏa tốc' : (value || 'Tiêu chuẩn')
const paymentLabel = (value) => ({ COD: 'Thu hộ COD', CASH: 'Tiền mặt', PREPAID: 'Người gửi trả', RECEIVER: 'Người nhận trả', BANK_TRANSFER: 'Chuyển khoản' }[value] || value || 'Chưa xác định')
const rowClassName = ({ row }) => isUrgent(row) ? 'urgent-row' : ''
const assetUrl = getMediaUrl

const loadWaybills = async () => {
  loading.value = true
  try {
    const response = await api.get('/api/delivery/development/ocr-ready', { params: { q: keyword.value || undefined } })
    waybills.value = Array.isArray(response.data) ? response.data : []
    selectedRows.value = []
  } catch (error) {
    ElMessage.error(error.response?.data?.detail || 'Không thể tải danh sách đơn đã OCR')
  } finally {
    loading.value = false
  }
}

const prepareSelected = async () => {
  try {
    await ElMessageBox.confirm(
      `Chuyển ${selectedRows.value.length} đơn sang trạng thái sẵn sàng phân công giao hàng?`,
      'Xác nhận giả lập',
      { type: 'warning', confirmButtonText: 'Chuyển trạng thái', cancelButtonText: 'Hủy' }
    )
    submitting.value = true
    const response = await api.post('/api/delivery/development/prepare-delivery', {
      waybill_codes: selectedRows.value.map(item => item.waybill_code)
    })
    ElMessage.success(`Đã chuẩn bị ${response.data.count} đơn để phân công giao hàng`)
    await loadWaybills()
  } catch (error) {
    if (error !== 'cancel') ElMessage.error(error.response?.data?.detail || 'Không thể chuyển trạng thái đơn')
  } finally {
    submitting.value = false
  }
}

onMounted(loadWaybills)
</script>

<style scoped>
.ready-page { padding: 24px; color: #17233d; }
.page-header, .toolbar { display: flex; align-items: center; justify-content: space-between; gap: 20px; }
.page-header h2 { margin: 0 0 6px; font-size: 26px; }
.page-header p { margin: 0; color: #6b7890; }
.development-alert { margin: 20px 0; }
.summary-grid { display: grid; grid-template-columns: repeat(4, minmax(150px, 1fr)); gap: 16px; margin-bottom: 18px; }
.summary-card { border-left: 4px solid #0b7043; border-radius: 12px; padding: 16px 20px; background: #fff; box-shadow: 0 5px 18px rgba(25, 45, 70, .07); }
.summary-card span { display: block; color: #6b7890; font-size: 13px; }
.summary-card strong { display: block; margin-top: 5px; font-size: 24px; }
.summary-card.urgent { border-color: #e53935; }
.summary-card.cod { border-color: #f59e0b; }
.summary-card.selected { border-color: #409eff; }
.content-card { padding: 20px; border-radius: 14px; background: #fff; box-shadow: 0 6px 24px rgba(25, 45, 70, .08); }
.toolbar { margin-bottom: 18px; }
.toolbar .el-input { max-width: 390px; }
.toolbar-actions { display: flex; gap: 10px; }
.code-line, .status-tags { display: flex; align-items: center; gap: 7px; }
.status-tags { margin-top: 8px; }
.muted { color: #748096; font-size: 12px; margin-top: 4px; }
.ellipsis { max-width: 260px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.payment { margin-top: 8px; font-size: 13px; }
.cod-text { color: #df2d2d; }
.image-links { display: flex; flex-direction: column; gap: 6px; }
:deep(.urgent-row td) { background: #fff5f5 !important; }
:deep(.urgent-row td:first-child) { border-left: 4px solid #e53935; }
@media (max-width: 1100px) {
  .summary-grid { grid-template-columns: repeat(2, 1fr); }
  .toolbar { align-items: stretch; flex-direction: column; }
  .toolbar .el-input { max-width: none; }
}
</style>
