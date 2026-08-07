<template>
  <div class="outbound-dispatch-container p-4">
    <el-card class="box-card shadow-sm mb-4">
      <template #header>
        <div class="flex-between align-center">
          <div class="flex-center gap-2">
            <el-icon class="text-primary text-xl"><Promotion /></el-icon>
            <div>
              <h3 class="m-0 text-lg font-bold text-gray-800">Quét Xuất Kho Đi Bưu Cục</h3>
              <p class="m-0 text-xs text-gray-500">Xuất kho khai thác đi bưu cục đích theo tuyến vận chuyển (Quy trình mới)</p>
            </div>
          </div>
          <el-radio-group v-model="activeTab" size="default">
            <el-radio-button label="scan">Quét xuất kho mới</el-radio-button>
            <el-radio-button label="history">Lịch sử phiếu xuất kho</el-radio-button>
          </el-radio-group>
        </div>
      </template>

      <!-- TAB 1: SCAN OUTBOUND DISPATCH -->
      <div v-if="activeTab === 'scan'">
        <!-- STEP 1: CHỌN BƯU CỤC NHẬN -->
        <el-row :gutter="20" class="mb-4">
          <el-col :xs="24" :sm="12" :md="10">
            <div class="step-card p-3 rounded bg-blue-50 border border-blue-200">
              <label class="block text-xs font-bold text-blue-800 uppercase mb-1">
                Bước 1: Chọn bưu cục nhận (Bưu cục đích) <span class="text-red-500">*</span>
              </label>
              <el-select
                v-model="selectedDestHubId"
                filterable
                placeholder="Chọn bưu cục / văn phòng nhận hàng..."
                class="w-full"
                size="large"
                @change="handleHubChange"
              >
                <el-option
                  v-for="hub in hubsList"
                  :key="hub.hub_id"
                  :label="`${hub.hub_name}${hub.address_detail ? ' (' + hub.address_detail + ')' : ''}`"
                  :value="hub.hub_id"
                />
              </el-select>
            </div>
          </el-col>
          
          <el-col :xs="24" :sm="12" :md="14">
            <div class="step-card p-3 rounded bg-green-50 border border-green-200">
              <label class="block text-xs font-bold text-green-800 uppercase mb-1">
                Bước 2: Quét / Nhập mã vận đơn (Bill)
              </label>
              <div class="flex gap-2">
                <el-input
                  ref="barcodeInputRef"
                  v-model="barcodeInput"
                  placeholder="Quét hoặc nhập mã vận đơn (SP...)..."
                  size="large"
                  clearable
                  :disabled="!selectedDestHubId"
                  @keyup.enter="handleScanWaybill"
                >
                  <template #prefix>
                    <el-icon><Scan /></el-icon>
                  </template>
                </el-input>
                <el-button
                  type="primary"
                  size="large"
                  :disabled="!selectedDestHubId || !barcodeInput"
                  :loading="checking"
                  @click="handleScanWaybill"
                >
                  Quét (Enter)
                </el-button>
              </div>
            </div>
          </el-col>
        </el-row>

        <!-- WARNING ALERT IF ANY -->
        <el-alert
          v-if="warningMessage"
          type="error"
          show-icon
          class="mb-4 text-sm font-bold"
          :closable="true"
          @close="warningMessage = ''"
        >
          <template #title>
            <span class="text-red-700 font-bold text-base">{{ warningMessage }}</span>
          </template>
        </el-alert>

        <!-- TABLE OF SCANNED WAYBILLS IN CURRENT BATCH -->
        <div class="scanned-list-wrapper mt-4">
          <div class="flex-between align-center mb-3">
            <div class="flex-center gap-2">
              <span class="font-bold text-gray-700">Danh sách vận đơn đã quét xuất kho</span>
              <el-tag type="success" size="large" effect="dark" round>
                {{ scannedWaybills.length }} vận đơn
              </el-tag>
            </div>
            
            <div class="flex gap-2">
              <el-button
                v-if="scannedWaybills.length > 0"
                type="danger"
                plain
                size="default"
                @click="clearScannedList"
              >
                Xóa danh sách
              </el-button>
              <el-button
                type="success"
                size="large"
                :disabled="scannedWaybills.length === 0 || !selectedDestHubId"
                :loading="submitting"
                @click="confirmOutboundDispatch"
              >
                <el-icon class="mr-1"><Check /></el-icon>
                Chốt Phiếu Xuất Kho ({{ scannedWaybills.length }})
              </el-button>
            </div>
          </div>

          <el-table
            :data="scannedWaybills"
            border
            stripe
            style="width: 100%"
            empty-text="Chưa có vận đơn nào được quét xuất kho trong phiên này"
          >
            <el-table-column type="index" label="STT" width="60" align="center" />
            <el-table-column prop="waybill_code" label="Mã Vận Đơn" width="180">
              <template #default="{ row }">
                <span class="font-mono font-bold text-primary">{{ row.waybill_code }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="receiver_name" label="Người Nhận" min-width="140" />
            <el-table-column prop="receiver_phone" label="SĐT Nhận" width="120" />
            <el-table-column prop="receiver_province_name" label="Tỉnh/Thành Đích" width="140" />
            <el-table-column prop="receiver_address" label="Địa Chỉ Giao Hàng" min-width="200" show-overflow-tooltip />
            <el-table-column label="Thao Tác" width="90" align="center">
              <template #default="{ $index }">
                <el-button
                  type="danger"
                  circle
                  size="small"
                  icon="Delete"
                  @click="removeScannedItem($index)"
                />
              </template>
            </el-table-column>
          </el-table>
        </div>
      </div>

      <!-- TAB 2: LỊCH SỬ PHIẾU XUẤT KHO -->
      <div v-if="activeTab === 'history'">
        <div class="flex-between align-center mb-3">
          <span class="font-bold text-gray-700">Lịch sử các phiếu xuất kho đi bưu cục</span>
          <el-button type="primary" plain @click="fetchHistorySlips">
            <el-icon class="mr-1"><Refresh /></el-icon>Tải lại
          </el-button>
        </div>

        <el-table
          v-loading="loadingHistory"
          :data="historySlips"
          border
          stripe
          style="width: 100%"
        >
          <el-table-column prop="dispatch_code" label="Mã Phiếu Xuất" width="180">
            <template #default="{ row }">
              <span class="font-mono font-bold text-primary">{{ row.dispatch_code }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="origin_hub_name" label="Bưu Cục Nguồn" min-width="150" />
          <el-table-column prop="dest_hub_name" label="Bưu Cục Nhận" min-width="150" />
          <el-table-column prop="waybill_count" label="Số Lượng Don" width="120" align="center">
            <template #default="{ row }">
              <el-tag type="info">{{ row.waybill_count }} đơn</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="creator_name" label="Người Tạo" width="140" />
          <el-table-column prop="status" label="Trạng Thái" width="130" align="center">
            <template #default="{ row }">
              <el-tag :type="row.status === 'COMPLETED' ? 'success' : 'warning'">
                {{ row.status === 'COMPLETED' ? 'Đã nhận đủ' : 'Đang luân chuyển' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="created_at" label="Thời Gian Tạo" width="160">
            <template #default="{ row }">
              {{ formatDate(row.created_at) }}
            </template>
          </el-table-column>
        </el-table>
      </div>
    </el-card>

    <!-- WARNING CONFIRMATION DIALOG -->
    <el-dialog
      v-model="showWarningDialog"
      title="⚠️ CẢNH BÁO LỆCH BƯU CỤC / SAI TUYẾN"
      width="500px"
      align-center
    >
      <div class="text-center p-3">
        <el-icon class="text-red-500 text-5xl mb-2"><WarningFilled /></el-icon>
        <p class="text-red-600 font-bold text-base mb-3">{{ pendingWarningMessage }}</p>
        <p class="text-xs text-gray-500">
          Bạn có chắc chắn vẫn muốn thêm đơn hàng này vào Phiếu xuất kho này không?
        </p>
      </div>
      <template #footer>
        <div class="flex justify-end gap-2">
          <el-button @click="showWarningDialog = false">Bỏ qua (Bỏ bill này)</el-button>
          <el-button type="danger" @click="confirmAddWarningWaybill">
            Xác nhận vẫn thêm vào phiếu
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Promotion, Aim as Scan, Check, Refresh, WarningFilled } from '@element-plus/icons-vue'
import apiClient from '@/api/axios'

const activeTab = ref('scan')
const selectedDestHubId = ref(null)
const barcodeInput = ref('')
const barcodeInputRef = ref(null)

const hubsList = ref([])
const scannedWaybills = ref([])
const checking = ref(false)
const submitting = ref(false)

const warningMessage = ref('')
const showWarningDialog = ref(false)
const pendingWarningMessage = ref('')
const pendingWaybillData = ref(null)

const historySlips = ref([])
const loadingHistory = ref(false)

const playWarningSound = () => {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sawtooth'
    osc.frequency.setValueAtTime(440, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.3)
    gain.gain.setValueAtTime(0.3, ctx.currentTime)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + 0.3)
  } catch (e) {
    // Ignore audio context errors
  }
}

const fetchHubs = async () => {
  try {
    const res = await apiClient.get('/api/hubs')
    hubsList.value = res.data || []
  } catch (err) {
    ElMessage.error('Không tải được danh sách bưu cục')
  }
}

const handleHubChange = () => {
  nextTick(() => {
    barcodeInputRef.value?.focus()
  })
}

const handleScanWaybill = async () => {
  if (!selectedDestHubId.value) {
    ElMessage.warning('Vui lòng chọn Bưu cục nhận trước!')
    return
  }
  const code = barcodeInput.value?.trim()
  if (!code) return

  // Check if already in scanned list
  if (scannedWaybills.value.some(w => w.waybill_code === code)) {
    ElMessage.warning(`Mã '${code}' đã có trong danh sách vừa quét!`)
    barcodeInput.value = ''
    return
  }

  checking.value = true
  warningMessage.value = ''
  try {
    const res = await apiClient.post('/api/outbound-dispatch/check-waybill', {
      waybill_code: code,
      dest_hub_id: selectedDestHubId.value
    })

    const data = res.data
    if (data.valid && data.waybill) {
      if (data.warning) {
        playWarningSound()
        pendingWarningMessage.value = data.warning_message || 'Cảnh báo lệch tuyến vận chuyển!'
        pendingWaybillData.value = data.waybill
        showWarningDialog.value = true
      } else {
        scannedWaybills.value.unshift(data.waybill)
        ElMessage.success(`Đã thêm mã '${data.waybill.waybill_code}' thành công!`)
        barcodeInput.value = ''
      }
    }
  } catch (err) {
    ElMessage.error(err.response?.data?.detail || `Lỗi khi kiểm tra mã '${code}'`)
  } finally {
    checking.value = false
    nextTick(() => {
      barcodeInputRef.value?.focus()
    })
  }
}

const confirmAddWarningWaybill = () => {
  if (pendingWaybillData.value) {
    scannedWaybills.value.unshift(pendingWaybillData.value)
    ElMessage.success(`Đã thêm mã '${pendingWaybillData.value.waybill_code}' (dù có cảnh báo)`)
  }
  showWarningDialog.value = false
  pendingWaybillData.value = null
  barcodeInput.value = ''
  nextTick(() => {
    barcodeInputRef.value?.focus()
  })
}

const removeScannedItem = (index) => {
  scannedWaybills.value.splice(index, 1)
}

const clearScannedList = () => {
  scannedWaybills.value = []
}

const confirmOutboundDispatch = async () => {
  if (!selectedDestHubId.value || scannedWaybills.value.length === 0) return

  const codes = scannedWaybills.value.map(w => w.waybill_code)
  submitting.value = true

  try {
    const res = await apiClient.post('/api/outbound-dispatch/confirm', {
      dest_hub_id: selectedDestHubId.value,
      waybill_codes: codes
    })

    if (res.data?.success) {
      ElMessageBox.alert(
        `Đã chốt phiếu xuất kho thành công!\nMã phiếu: ${res.data.dispatch_code}\nBưu cục nhận: ${res.data.dest_hub_name}\nSố lượng: ${res.data.waybill_count} đơn.`,
        'Thành công',
        { confirmButtonText: 'Đóng', type: 'success' }
      )
      scannedWaybills.value = []
      fetchHistorySlips()
    }
  } catch (err) {
    ElMessage.error(err.response?.data?.detail || 'Lỗi khi chốt phiếu xuất kho')
  } finally {
    submitting.value = false
  }
}

const fetchHistorySlips = async () => {
  loadingHistory.value = true
  try {
    const res = await apiClient.get('/api/outbound-dispatch/slips')
    historySlips.value = res.data || []
  } catch (err) {
    ElMessage.error('Không tải được lịch sử phiếu xuất kho')
  } finally {
    loadingHistory.value = false
  }
}

const formatDate = (dateStr) => {
  if (!dateStr) return 'N/A'
  return new Date(dateStr).toLocaleString('vi-VN')
}

onMounted(() => {
  fetchHubs()
  fetchHistorySlips()
})
</script>

<style scoped>
.outbound-dispatch-container {
  max-width: 1300px;
  margin: 0 auto;
}
.flex-between { display: flex; justify-content: space-between; }
.flex-center { display: flex; align-items: center; }
.step-card { transition: all 0.2s ease; }
</style>
