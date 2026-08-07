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
          <el-table-column prop="waybill_count" label="Số Lượng Đơn" width="120" align="center">
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
          <el-table-column label="Thao Tác" width="130" align="center">
            <template #default="{ row }">
              <el-button
                type="primary"
                plain
                size="small"
                @click="printDispatchSlip(row)"
              >
                <el-icon class="mr-1"><Printer /></el-icon>In phiếu
              </el-button>
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

    <!-- SUCCESS PRINT PROMPT DIALOG -->
    <el-dialog
      v-model="showSuccessPrintModal"
      title="🎉 CHỐT PHIẾU XUẤT KHO THÀNH CÔNG"
      width="520px"
      align-center
    >
      <div class="text-center p-3">
        <el-icon class="text-5xl mb-2" style="color: #059669"><CircleCheckFilled /></el-icon>
        <h3 class="text-base font-bold text-gray-800 m-0 mb-1">Đã chốt phiếu xuất kho thành công!</h3>
        <p class="font-mono text-primary font-bold text-lg mb-2">{{ createdSlipInfo?.dispatch_code }}</p>
        <p class="text-sm text-gray-600 mb-4">
          Bưu cục nhận: <b>{{ createdSlipInfo?.dest_hub_name }}</b> | Số lượng: <b>{{ createdSlipInfo?.waybill_count }} đơn</b>
        </p>
        <div class="p-3 bg-green-50 rounded border border-green-200 text-xs text-green-800 mb-2">
          Bạn có muốn in Phiếu Xuất Kho (định dạng PDF chuẩn SpeedLight) ngay bây giờ không?
        </div>
      </div>
      <template #footer>
        <div class="flex justify-end gap-2">
          <el-button @click="showSuccessPrintModal = false">Bỏ qua / Để sau</el-button>
          <el-button type="success" size="large" @click="handlePrintCreatedSlip">
            <el-icon class="mr-1"><Printer /></el-icon> In Phiếu Xuất Kho ngay
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { Promotion, Aim as Scan, Check, Refresh, WarningFilled, Printer, CircleCheckFilled } from '@element-plus/icons-vue'
import apiClient from '@/api/axios'
import logoUrl from '@/assets/CompanyLogo4.png'

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

const showSuccessPrintModal = ref(false)
const createdSlipInfo = ref(null)

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
      const destHubObj = hubsList.value.find(h => h.hub_id === selectedDestHubId.value)
      createdSlipInfo.value = {
        dispatch_id: res.data.dispatch_id,
        dispatch_code: res.data.dispatch_code,
        dest_hub_name: res.data.dest_hub_name,
        dest_hub_address: destHubObj?.address_detail || '',
        waybill_count: res.data.waybill_count,
        items: [...scannedWaybills.value],
        created_at: new Date().toISOString()
      }

      scannedWaybills.value = []
      fetchHistorySlips()
      showSuccessPrintModal.value = true
    }
  } catch (err) {
    ElMessage.error(err.response?.data?.detail || 'Lỗi khi chốt phiếu xuất kho')
  } finally {
    submitting.value = false
  }
}

const handlePrintCreatedSlip = () => {
  if (createdSlipInfo.value) {
    printDispatchSlip(createdSlipInfo.value)
  }
  showSuccessPrintModal.value = false
}

const printDispatchSlip = async (slipData) => {
  let detailData = slipData
  if (slipData.dispatch_id && (!slipData.items || slipData.items.length === 0)) {
    try {
      const res = await apiClient.get(`/api/outbound-dispatch/slips/${slipData.dispatch_id}`)
      detailData = res.data
    } catch (e) {
      ElMessage.error('Không lấy được thông tin chi tiết phiếu xuất kho')
      return
    }
  }

  const items = detailData.items || []
  const dateStr = detailData.created_at ? new Date(detailData.created_at).toLocaleString('vi-VN') : new Date().toLocaleString('vi-VN')

  const rowsHtml = items.map((it, idx) => `
    <tr>
      <td style="text-align: center;">${idx + 1}</td>
      <td style="font-weight: bold; font-family: monospace; color: #0284c7;">${it.waybill_code}</td>
      <td>${it.receiver_name || 'N/A'}</td>
      <td>${it.receiver_phone || 'N/A'}</td>
      <td>${it.receiver_address || 'N/A'}</td>
      <td style="text-align: center;">${it.receiver_province_name || 'N/A'}</td>
      <td style="text-align: right;">${it.weight ? it.weight + ' kg' : '---'}</td>
    </tr>
  `).join('')

  const printWindow = window.open('', '_blank', 'width=950,height=850')
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Phiếu Xuất Kho - ${detailData.dispatch_code}</title>
      <meta charset="utf-8" />
      <style>
        body { font-family: 'Inter', Roboto, Arial, sans-serif; color: #1e293b; margin: 0; padding: 24px; background: #fff; }
        .slip-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #059669; padding-bottom: 12px; margin-bottom: 20px; }
        .logo-img { max-height: 55px; object-fit: contain; }
        .brand-title { font-size: 16px; font-weight: 800; color: #059669; text-transform: uppercase; letter-spacing: 0.5px; }
        .brand-sub { font-size: 11px; color: #64748b; margin-top: 2px; }
        .doc-title { text-align: center; margin: 15px 0 20px 0; }
        .doc-title h2 { font-size: 20px; font-weight: 900; color: #0f172a; margin: 0; text-transform: uppercase; }
        .doc-code { font-family: monospace; font-size: 14px; color: #059669; font-weight: bold; margin-top: 4px; }
        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px; margin-bottom: 20px; }
        .info-item { font-size: 12px; margin-bottom: 6px; }
        .info-item label { font-weight: 700; color: #475569; }
        .info-item span { color: #0f172a; font-weight: 600; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 12px; }
        th { background: #f1f5f9; color: #334155; font-weight: 700; text-align: left; padding: 10px; border: 1px solid #cbd5e1; text-transform: uppercase; }
        td { padding: 9px 10px; border: 1px solid #e2e8f0; color: #334155; }
        tr:nth-child(even) { background-color: #f8fafc; }
        .summary-box { display: flex; justify-content: space-between; align-items: center; background: #ecfdf5; border: 1px solid #a7f3d0; padding: 12px 16px; border-radius: 6px; font-size: 13px; font-weight: 700; color: #065f46; margin-bottom: 30px; }
        .signature-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; text-align: center; gap: 20px; margin-top: 40px; }
        .sig-title { font-size: 12px; font-weight: 700; color: #1e293b; text-transform: uppercase; }
        .sig-sub { font-size: 11px; color: #64748b; font-style: italic; margin-top: 2px; }
        .sig-space { height: 75px; }
        .sig-name { font-size: 12px; font-weight: 700; color: #0f172a; }
        @media print {
          body { padding: 0; }
          @page { size: A4 portrait; margin: 12mm; }
        }
      </style>
    </head>
    <body>
      <div class="slip-header">
        <div>
          <div class="brand-title">SPEEDLIGHT LOGISTICS</div>
          <div class="brand-sub">Hệ thống Quản lý & Vận hành Vận chuyển Chuyên nghiệp</div>
        </div>
        <div>
          <img src="${logoUrl}" alt="SpeedLight" class="logo-img" />
        </div>
      </div>

      <div class="doc-title">
        <h2>PHIẾU XUẤT KHO VẬN CHUYỂN BƯU CỤC</h2>
        <div class="doc-code">Mã phiếu: ${detailData.dispatch_code}</div>
      </div>

      <div class="info-grid">
        <div>
          <div class="info-item"><label>Bưu cục xuất (Nguồn):</label> <span>${detailData.origin_hub_name || 'N/A'}</span></div>
          <div class="info-item"><label>Địa chỉ xuất:</label> <span>${detailData.origin_hub_address || 'Kho trung chuyển khai thác'}</span></div>
          <div class="info-item"><label>Người tạo phiếu:</label> <span>${detailData.creator_name || 'N/A'}</span></div>
        </div>
        <div>
          <div class="info-item"><label>Bưu cục nhận (Đích):</label> <span style="color: #059669; font-weight: 800;">${detailData.dest_hub_name || 'N/A'}</span></div>
          <div class="info-item"><label>Địa chỉ nhận:</label> <span>${detailData.dest_hub_address || 'Bưu cục đích'}</span></div>
          <div class="info-item"><label>Thời gian tạo:</label> <span>${dateStr}</span></div>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th style="width: 40px; text-align: center;">STT</th>
            <th style="width: 170px;">Mã Vận Đơn</th>
            <th style="width: 140px;">Người Nhận</th>
            <th style="width: 100px;">Điện Thoại</th>
            <th>Địa Chỉ Giao Hàng</th>
            <th style="width: 120px; text-align: center;">Tỉnh/Thành Đích</th>
            <th style="width: 80px; text-align: right;">Khối Lượng</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>

      <div class="summary-box">
        <div>Tổng số lượng vận đơn xuất kho: ${items.length} đơn</div>
        <div>Trạng thái: Đang luân chuyển bưu cục</div>
      </div>

      <div class="signature-grid">
        <div>
          <div class="sig-title">NGƯỜI LẬP PHIẾU</div>
          <div class="sig-sub">(Ký, ghi rõ họ tên)</div>
          <div class="sig-space"></div>
          <div class="sig-name">${detailData.creator_name || '---'}</div>
        </div>
        <div>
          <div class="sig-title">NHÂN VIÊN VẬN CHUYỂN</div>
          <div class="sig-sub">(Ký, ghi rõ họ tên)</div>
          <div class="sig-space"></div>
          <div class="sig-name">.........................................</div>
        </div>
        <div>
          <div class="sig-title">THỦ KHO NHẬN HÀNG</div>
          <div class="sig-sub">(Ký, ghi rõ họ tên)</div>
          <div class="sig-space"></div>
          <div class="sig-name">.........................................</div>
        </div>
      </div>

      <script>
        window.onload = function() {
          window.print();
        };
      <\/script>
    </body>
    </html>
  `
  printWindow.document.write(htmlContent)
  printWindow.document.close()
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
