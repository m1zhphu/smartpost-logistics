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
              <h2 class="page-title">Quản lý Túi gom Lấy hàng</h2>
              <p class="page-subtitle">Quản lý, theo dõi hành trình và đối soát túi hàng bưu tá thu gom</p>
            </div>
          </div>
        </div>
        <div class="header-actions">
          <button class="btn-primary" @click="openCreateBagModal">
            <el-icon><Plus /></el-icon>
            <span>Tạo mã túi mới</span>
          </button>
        </div>
      </header>

      <!-- Stats Cards -->
      <el-row :gutter="20" class="mb-24 animate-fade-in">
        <el-col :xs="24" :sm="8" :lg="6">
          <div class="content-card stat-mini-card">
            <div class="card-icon info-bg">
              <el-icon><Box /></el-icon>
            </div>
            <div class="card-stat-info">
              <span class="stat-lbl">Chờ lấy / Đang gom</span>
              <h3 class="stat-val text-dark">{{ stats.waiting }} <span class="stat-unit">Túi</span></h3>
            </div>
          </div>
        </el-col>
        <el-col :xs="24" :sm="8" :lg="6">
          <div class="content-card stat-mini-card">
            <div class="card-icon warning-bg">
              <el-icon><Clock /></el-icon>
            </div>
            <div class="card-stat-info">
              <span class="stat-lbl">Đã về kho (Chờ đối soát)</span>
              <h3 class="stat-val text-dark">{{ stats.inbound }} <span class="stat-unit">Túi</span></h3>
            </div>
          </div>
        </el-col>
        <el-col :xs="24" :sm="8" :lg="6">
          <div class="content-card stat-mini-card">
            <div class="card-icon danger-bg">
              <el-icon><Warning /></el-icon>
            </div>
            <div class="card-stat-info">
              <span class="stat-lbl">Túi lỗi / Lệch bill</span>
              <h3 class="stat-val text-danger">{{ stats.discrepant }} <span class="stat-unit">Túi</span></h3>
            </div>
          </div>
        </el-col>
        <el-col :xs="24" :sm="8" :lg="6">
          <div class="content-card stat-mini-card">
            <div class="card-icon success-bg">
              <el-icon><CircleCheckFilled /></el-icon>
            </div>
            <div class="card-stat-info">
              <span class="stat-lbl">Đã hoàn tất đối soát</span>
              <h3 class="stat-val text-success">{{ stats.closed }} <span class="stat-unit">Túi</span></h3>
            </div>
          </div>
        </el-col>
      </el-row>

      <!-- Advanced Filter Section -->
      <div class="content-card filter-card animate-fade-in mb-24">
        <el-row :gutter="20" class="filter-row">
          <el-col :xs="24" :sm="12" :lg="7" class="filter-col">
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
          
          <el-col :xs="24" :sm="12" :lg="7" class="filter-col">
            <div class="filter-label">Trạng thái túi</div>
            <el-select v-model="filters.status" placeholder="Tất cả trạng thái" clearable class="w-full modern-select" @change="fetchBags">
              <el-option label="Mới tạo (CREATED)" value="CREATED" />
              <el-option label="Bưu tá đã lấy (PICKED)" value="PICKED" />
              <el-option label="Đã về kho (INBOUND)" value="INBOUND" />
              <el-option label="Đã mở túi (OPENED)" value="OPENED" />
              <el-option label="Đang đối soát (PROCESSING)" value="PROCESSING" />
              <el-option label="Đã đối soát (VERIFIED)" value="VERIFIED" />
              <el-option label="Đã đóng / Hoàn tất (CLOSED)" value="CLOSED" />
            </el-select>
          </el-col>
          
          <el-col :xs="24" :sm="24" :lg="10" class="filter-action-col">
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
          <h3 class="inner-title">Danh sách túi lấy hàng (PICKUP BAGS)</h3>
          <el-tag type="primary" effect="light" round class="fw-bold">Tổng: {{ bags.length }} túi</el-tag>
        </div>

        <el-table 
          :data="bags" 
          v-loading="loading" 
          class="modern-table"
          row-class-name="modern-row"
          style="width: 100%"
        >
          <el-table-column type="index" label="STT" width="60" align="center" />
          
          <!-- Mã túi -->
          <el-table-column prop="bag_code" label="Mã Túi (Bag Code)" min-width="170">
            <template #default="{ row }">
              <span class="code-badge primary">{{ row.bag_code }}</span>
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

          <!-- Khách gửi -->
          <el-table-column label="Khách hàng gửi" min-width="180">
            <template #default="{ row }">
              <div class="customer-info" v-if="row.customer_code">
                <span class="fw-bold text-dark block">{{ row.customer_code }}</span>
                <span class="text-xs text-muted block">{{ row.customer_name }}</span>
              </div>
              <span v-else class="text-muted">---</span>
            </template>
          </el-table-column>

          <!-- Bưu tá phụ trách -->
          <el-table-column prop="shipper_name" label="Bưu tá lấy hàng" min-width="150">
            <template #default="{ row }">
              <div class="shipper-info" v-if="row.shipper_name">
                <el-icon class="mr-1 text-primary"><User /></el-icon>
                <span class="fw-semibold text-dark">{{ row.shipper_name }}</span>
              </div>
              <span v-else class="text-muted">Chưa gán</span>
            </template>
          </el-table-column>
          
          <!-- Ngày hẹn lấy -->
          <el-table-column prop="pickup_time" label="Thời gian" min-width="150">
            <template #default="{ row }">
              <span class="time-text">
                <el-icon class="mr-1"><Calendar /></el-icon>
                {{ formatDate(row.pickup_time) }}
              </span>
            </template>
          </el-table-column>

          <!-- Số lượng thư dự kiến / thực tế -->
          <el-table-column label="Số lượng đơn" width="180" align="center">
            <template #default="{ row }">
              <div class="qty-group-display">
                <el-tooltip content="Số lượng dự kiến" placement="top">
                  <span class="qty-badge expected">{{ row.est_quantity || 0 }}</span>
                </el-tooltip>
                <span class="qty-separator">/</span>
                <el-tooltip content="Thực nhận đã quét" placement="top">
                  <span class="qty-badge actual" :class="{ 'has-missing': row.missing_quantity > 0 }">{{ row.actual_quantity || 0 }}</span>
                </el-tooltip>
                <el-tooltip v-if="row.missing_quantity > 0" :content="`Lệch thiếu ${row.missing_quantity} đơn`" placement="top">
                  <el-tag type="danger" size="small" class="ml-1 font-bold">-{{ row.missing_quantity }}</el-tag>
                </el-tooltip>
              </div>
            </template>
          </el-table-column>
          
          <!-- Thao tác -->
          <el-table-column label="Thao tác" width="220" align="center">
            <template #default="{ row }">
              <div class="action-btn-group">
                <!-- Chi tiết -->
                <button class="icon-btn edit" @click="viewBagDetails(row)" title="Xem chi tiết & Hành trình">
                  <el-icon><View /></el-icon>
                </button>

                <!-- Quét đối soát -->
                <el-button 
                  v-if="['INBOUND', 'OPENED', 'PROCESSING'].includes(row.status)"
                  type="primary" 
                  size="small" 
                  class="action-btn-sm"
                  @click="openVerifyScanner(row)"
                >
                  <el-icon class="mr-1"><Scan /></el-icon> Đối soát
                </el-button>

                <!-- Các nút chuyển trạng thái nhanh -->
                <el-button 
                  v-if="row.status === 'PICKED'"
                  type="warning" 
                  size="small" 
                  class="action-btn-sm"
                  :loading="btnLoading"
                  @click="handleInboundBag(row)"
                >
                  Inbound
                </el-button>
                <el-button 
                  v-if="row.status === 'INBOUND'"
                  type="info" 
                  size="small" 
                  class="action-btn-sm"
                  :loading="btnLoading"
                  @click="handleOpenBag(row)"
                >
                  Mở túi
                </el-button>
                <el-button 
                  v-if="row.status === 'VERIFIED'"
                  type="success" 
                  size="small" 
                  class="action-btn-sm"
                  :loading="btnLoading"
                  @click="handleCloseBag(row)"
                >
                  Chốt túi
                </el-button>
              </div>
            </template>
          </el-table-column>
          
          <template #empty>
            <el-empty description="Không tìm thấy túi gom lấy hàng nào" :image-size="100" />
          </template>
        </el-table>
      </div>

      <!-- Detail/Timeline Dialog -->
      <el-dialog 
        v-model="detailDialogVisible" 
        :title="`Hành trình túi gom: ${selectedBag?.bag_code}`" 
        width="850px"
        class="modern-dialog"
        destroy-on-close
      >
        <div v-if="selectedBag" class="bag-detail-container">
          <div class="bag-detail-header mb-24">
            <div class="detail-grid">
              <div class="detail-item">
                <span class="detail-label">Mã khách hàng:</span>
                <span class="detail-value fw-bold text-dark">{{ selectedBag.customer_code || '---' }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Tên khách hàng:</span>
                <span class="detail-value text-dark">{{ selectedBag.customer_name || '---' }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Bưu tá phụ trách:</span>
                <span class="detail-value text-dark fw-semibold">{{ selectedBag.shipper_name || '---' }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Trạng thái:</span>
                <div class="modern-tag" :class="getStatusClass(selectedBag.status)" style="margin:0">
                  <span class="dot"></span> {{ getStatusName(selectedBag.status) }}
                </div>
              </div>
              <div class="detail-item">
                <span class="detail-label">Số đơn dự kiến:</span>
                <span class="detail-value fw-bold text-primary">{{ selectedBag.est_quantity || 0 }} kiện</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Số đơn thực nhận:</span>
                <span class="detail-value fw-bold text-success">{{ selectedBag.actual_quantity || 0 }} kiện</span>
              </div>
            </div>
          </div>

          <!-- Section 1: Chain of Custody Timeline -->
          <div class="section-title-box">
            <el-icon class="text-primary"><Location /></el-icon>
            <span class="section-title">Hành trình bàn giao túi (Chain of Custody)</span>
          </div>
          
          <div class="timeline-wrapper mb-24">
            <div class="timeline-step" v-for="(step, idx) in selectedBag.chain_of_custody" :key="idx">
              <div class="step-bullet" :class="{ 'step-active': idx === selectedBag.chain_of_custody.length - 1 }">
                <div class="bullet-inner"></div>
              </div>
              <div class="step-content">
                <div class="step-header">
                  <span class="step-action fw-bold text-dark">{{ step.action }}</span>
                  <span class="step-time text-xs text-muted">{{ formatDate(step.time) }}</span>
                </div>
                <div class="step-desc text-sm">
                  Người chịu trách nhiệm / Bàn giao: <span class="fw-semibold text-primary">{{ step.handler }}</span>
                </div>
              </div>
            </div>
            <div v-if="!selectedBag.chain_of_custody || selectedBag.chain_of_custody.length === 0" class="text-center text-muted py-4">
              Không có dữ liệu hành trình
            </div>
          </div>

          <!-- Section 2: Discrepancy & Errors alerting -->
          <div v-if="selectedBag.discrepancy" class="discrepancy-section mb-24">
            <div class="section-title-box">
              <el-icon class="text-danger"><Warning /></el-icon>
              <span class="section-title">Báo cáo chênh lệch & Lỗi đối soát</span>
            </div>

            <!-- Error boxes -->
            <div v-if="selectedBag.discrepancy.errors && selectedBag.discrepancy.errors.length > 0" class="error-alert-box mb-4">
              <div class="alert-title text-danger fw-bold mb-2">Phát hiện {{ selectedBag.discrepancy.errors.length }} lỗi nghiệp vụ:</div>
              <ul class="alert-list">
                <li v-for="(err, i) in selectedBag.discrepancy.errors" :key="i" class="text-sm text-danger">
                  <el-icon class="mr-1"><WarningFilled /></el-icon> {{ err }}
                </li>
              </ul>
            </div>

            <el-row :gutter="20">
              <el-col :span="12">
                <div class="discrepancy-card missing-card">
                  <div class="card-hdr text-warning fw-bold">ĐƠN CHƯA BÀN GIAO (THIẾU) ({{ selectedBag.discrepancy.missing_bills?.length || 0 }})</div>
                  <div class="card-body-scroll">
                    <div v-for="c in selectedBag.discrepancy.missing_bills" :key="c" class="code-badge-inline warning">
                      {{ c }}
                    </div>
                    <span v-if="!selectedBag.discrepancy.missing_bills || selectedBag.discrepancy.missing_bills.length === 0" class="text-xs text-muted">Không thiếu bill nào</span>
                  </div>
                </div>
              </el-col>
              <el-col :span="12">
                <div class="discrepancy-card extra-card">
                  <div class="card-hdr text-danger fw-bold">ĐƠN DƯ / SAI KHÁCH GỬI ({{ selectedBag.discrepancy.extra_bills?.length || 0 }})</div>
                  <div class="card-body-scroll">
                    <div v-for="c in selectedBag.discrepancy.extra_bills" :key="c" class="code-badge-inline danger">
                      {{ c }}
                    </div>
                    <span v-if="!selectedBag.discrepancy.extra_bills || selectedBag.discrepancy.extra_bills.length === 0" class="text-xs text-muted">Không thừa bill nào</span>
                  </div>
                </div>
              </el-col>
            </el-row>
          </div>
        </div>

        <template #footer>
          <div class="dialog-footer-actions">
            <button class="btn-secondary" @click="detailDialogVisible = false">Đóng</button>
          </div>
        </template>
      </el-dialog>

      <!-- Create Bag Modal -->
      <el-dialog
        v-model="createDialogVisible"
        title="Tạo mã túi gom lấy hàng mới"
        width="500px"
        class="modern-dialog"
      >
        <el-form :model="createForm" label-position="top" class="modern-form">
          <el-form-item label="Khách hàng gửi" required>
            <el-select 
              v-model="createForm.customer_id" 
              placeholder="Chọn khách hàng gửi..." 
              filterable 
              class="w-full modern-select"
            >
              <el-option 
                v-for="c in customers" 
                :key="c.customer_id" 
                :label="`[${c.customer_code}] ${c.company_name}`" 
                :value="c.customer_id" 
              />
            </el-select>
          </el-form-item>

          <el-form-item label="Số lượng thư dự kiến" required>
            <el-input-number 
              v-model="createForm.est_quantity" 
              :min="1" 
              :max="10000" 
              class="w-full modern-select"
            />
          </el-form-item>

          <el-form-item label="Mã túi gom (Tùy chọn)">
            <el-input 
              v-model="createForm.bag_code" 
              placeholder="Hệ thống tự động sinh nếu để trống" 
              class="modern-input"
            />
          </el-form-item>
        </el-form>

        <template #footer>
          <div class="dialog-footer-actions">
            <el-button @click="createDialogVisible = false">Hủy</el-button>
            <el-button type="primary" :loading="btnLoading" @click="submitCreateBag">Tạo túi</el-button>
          </div>
        </template>
      </el-dialog>

      <!-- Verification / Scanning Dialog (Modal to do scans) -->
      <el-dialog
        v-model="scanDialogVisible"
        :title="`ĐỐI SOÁT TÚI LẤY HÀNG: ${scanningBag?.bag_code}`"
        width="1100px"
        class="modern-dialog"
        :before-close="beforeScanDialogClose"
        destroy-on-close
      >
        <div v-if="scanningBag" class="scanner-dialog-layout">
          <el-row :gutter="20">
            <!-- Left pane: scanning & controls -->
            <el-col :span="12">
              <div class="scanner-card">
                <div class="section-header text-primary">
                  <el-icon><Scan /></el-icon>
                  <span>Màn hình quét mã vạch</span>
                </div>

                <div class="barcode-input-area mb-24">
                  <el-input
                    v-model="scanBarcode"
                    placeholder="Quét hoặc nhập mã vận đơn tại đây..."
                    ref="scanBarcodeRef"
                    @keyup.enter="handleScanWaybill"
                    class="modern-scanner-input"
                    :disabled="scanLoading"
                  >
                    <template #prefix><el-icon class="scanner-icon"><Scan /></el-icon></template>
                    <template #append>
                       <button class="btn-scan" @click="handleScanWaybill" :disabled="scanLoading">
                         <span>QUÉT</span>
                       </button>
                    </template>
                  </el-input>
                  <p class="text-xs text-muted mt-2">Hệ thống hỗ trợ quét liên tục. Nhấn Enter để gửi mã.</p>
                </div>

                <!-- Alert summary stats for scanner -->
                <div class="scan-stats-row mb-24">
                  <div class="scan-stat-box green">
                    <span class="lbl">Thực quét</span>
                    <span class="val">{{ scannedCodes.length }}</span>
                  </div>
                  <div class="scan-stat-box yellow">
                    <span class="lbl">Thiếu bill</span>
                    <span class="val">{{ scanningDiscrepancy.missing_quantity || 0 }}</span>
                  </div>
                  <div class="scan-stat-box red">
                    <span class="lbl">Dư / Sai bill</span>
                    <span class="val">{{ scanningDiscrepancy.extra_quantity || 0 }}</span>
                  </div>
                </div>

                <!-- Live alert box for scan warning -->
                <div v-if="scanningDiscrepancy.errors && scanningDiscrepancy.errors.length > 0" class="realtime-errors-box">
                  <div class="error-header text-danger"><el-icon class="mr-1"><Warning /></el-icon> PHÁT HIỆN LỖI KHI ĐỐI SOÁT:</div>
                  <div class="error-scroll-area">
                    <div v-for="(e, i) in scanningDiscrepancy.errors" :key="i" class="error-item-text">
                      - {{ e }}
                    </div>
                  </div>
                </div>

                <div v-else class="realtime-no-error-box">
                  <el-icon class="text-success"><CircleCheckFilled /></el-icon>
                  <span>Chưa phát hiện lỗi nghiệp vụ</span>
                </div>
              </div>
            </el-col>

            <!-- Right pane: discrepancy display & results -->
            <el-col :span="12">
              <div class="scanner-card">
                <div class="section-header text-success">
                  <el-icon><List /></el-icon>
                  <span>Danh sách vận đơn đối soát</span>
                </div>

                <el-tabs type="border-card" class="modern-tabs-flat">
                  <el-tab-pane label="Đã quét thành công">
                    <el-table :data="scannedCodes" height="350px" class="compact-table">
                      <el-table-column type="index" width="50" align="center" />
                      <el-table-column label="Mã vận đơn">
                        <template #default="{ row }">
                          <span class="code-badge success">{{ row }}</span>
                        </template>
                      </el-table-column>
                      <el-table-column width="70" align="center">
                        <template #default="{ $index }">
                          <button class="icon-btn delete small mx-auto" @click="removeScannedBill($index)" title="Xóa bill này">
                            <el-icon><Delete /></el-icon>
                          </button>
                        </template>
                      </el-table-column>
                    </el-table>
                  </el-tab-pane>

                  <el-tab-pane :label="`Thiếu (${scanningDiscrepancy.missing_bills?.length || 0})`">
                    <el-table :data="scanningDiscrepancy.missing_bills || []" height="350px" class="compact-table">
                      <el-table-column type="index" width="50" align="center" />
                      <el-table-column label="Mã vận đơn">
                        <template #default="{ row }">
                          <span class="code-badge warning">{{ row }}</span>
                        </template>
                      </el-table-column>
                    </el-table>
                  </el-tab-pane>

                  <el-tab-pane :label="`Dư / Sai (${scanningDiscrepancy.extra_bills?.length || 0})`">
                    <el-table :data="scanningDiscrepancy.extra_bills || []" height="350px" class="compact-table">
                      <el-table-column type="index" width="50" align="center" />
                      <el-table-column label="Mã vận đơn">
                        <template #default="{ row }">
                          <span class="code-badge danger">{{ row }}</span>
                        </template>
                      </el-table-column>
                    </el-table>
                  </el-tab-pane>
                </el-tabs>
              </div>
            </el-col>
          </el-row>
        </div>

        <template #footer>
          <div class="dialog-footer-actions">
            <el-button @click="closeScannerDialog" :disabled="scanLoading">Đóng & Lưu nháp</el-button>
            <el-button 
              type="success" 
              :loading="scanLoading" 
              :disabled="scannedCodes.length === 0"
              @click="submitCloseAndLockBag"
            >
              <el-icon class="mr-1"><Check /></el-icon> Hoàn tất đối soát & Chốt túi
            </el-button>
          </div>
        </template>
      </el-dialog>

      <!-- Audio Elements -->
      <audio ref="beepOk" src="https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3"></audio>
      <audio ref="beepError" src="https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3"></audio>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, nextTick } from 'vue';
import { 
  Suitcase, Check, Delete, List, Plus, Refresh, Box, 
  Lock, Location, Key, DataLine, LocationInformation, Loading,
  RefreshLeft, Search, RefreshRight, Calendar, View, User, Warning,
  CircleCheckFilled, WarningFilled, Clock
} from '@element-plus/icons-vue';
// Use Aim as Scan icon helper
import { Aim as Scan } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import api from '@/api/axios';

// States
const loading = ref(false);
const btnLoading = ref(false);
const bags = ref([]);
const customers = ref([]);

// Stats count
const stats = reactive({
  waiting: 0,
  inbound: 0,
  discrepant: 0,
  closed: 0
});

// Filters
const filters = reactive({
  bag_code: '',
  status: ''
});

// Create Modal
const createDialogVisible = ref(false);
const createForm = reactive({
  customer_id: null,
  est_quantity: 50,
  bag_code: ''
});

// Detail Dialog
const detailDialogVisible = ref(false);
const selectedBag = ref(null);

// Scanner Dialog
const scanDialogVisible = ref(false);
const scanningBag = ref(null);
const scanBarcode = ref('');
const scannedCodes = ref([]);
const scanLoading = ref(false);
const scanningDiscrepancy = ref({
  missing_bills: [],
  extra_bills: [],
  errors: [],
  actual_quantity: 0,
  missing_quantity: 0,
  extra_quantity: 0
});

const scanBarcodeRef = ref(null);
const beepOk = ref(null);
const beepError = ref(null);

// Methods
const fetchBags = async () => {
  loading.value = true;
  try {
    const params = {};
    if (filters.bag_code) params.bag_code = filters.bag_code;
    if (filters.status) params.status = filters.status;

    const res = await api.get('/api/scans/pickup-bags', { params });
    bags.value = res.data || [];
    calculateStats();
  } catch (err) {
    ElMessage.error('Lỗi khi tải danh sách túi lấy hàng.');
    console.error(err);
  } finally {
    loading.value = false;
  }
};

const calculateStats = () => {
  stats.waiting = bags.value.filter(b => ['CREATED', 'PICKED'].includes(b.status)).length;
  stats.inbound = bags.value.filter(b => b.status === 'INBOUND').length;
  stats.closed = bags.value.filter(b => b.status === 'CLOSED').length;
  stats.discrepant = bags.value.filter(b => b.missing_quantity > 0).length;
};

const fetchCustomers = async () => {
  try {
    const res = await api.get('/api/customers');
    customers.value = res.data.items || res.data || [];
  } catch (err) {
    console.error('Lỗi tải danh sách khách hàng', err);
  }
};

const resetFilters = () => {
  filters.bag_code = '';
  filters.status = '';
  fetchBags();
};

const openCreateBagModal = () => {
  createForm.customer_id = null;
  createForm.est_quantity = 50;
  createForm.bag_code = '';
  createDialogVisible.value = true;
};

const submitCreateBag = async () => {
  if (!createForm.customer_id) {
    ElMessage.warning('Vui lòng chọn khách hàng gửi.');
    return;
  }
  btnLoading.value = true;
  try {
    const payload = {
      customer_id: createForm.customer_id,
      est_quantity: createForm.est_quantity
    };
    if (createForm.bag_code.trim()) {
      payload.bag_code = createForm.bag_code.trim();
    }
    
    await api.post('/api/scans/pickup-bags', payload);
    ElMessage.success('Tạo túi lấy hàng mới thành công!');
    createDialogVisible.value = false;
    fetchBags();
  } catch (err) {
    ElMessage.error(err.response?.data?.detail || 'Không tạo được túi lấy hàng.');
  } finally {
    btnLoading.value = false;
  }
};

const viewBagDetails = async (bag) => {
  try {
    loading.value = true;
    const res = await api.get(`/api/scans/pickup-bags/${bag.bag_code}`);
    selectedBag.value = res.data;
    detailDialogVisible.value = true;
  } catch (err) {
    ElMessage.error('Không tải được chi tiết túi.');
  } finally {
    loading.value = false;
  }
};

const handleInboundBag = async (bag) => {
  btnLoading.value = true;
  try {
    await api.post(`/api/scans/pickup-bags/${bag.bag_code}/inbound`);
    ElMessage.success(`Túi ${bag.bag_code} đã nhập kho thành công!`);
    fetchBags();
  } catch (err) {
    ElMessage.error(err.response?.data?.detail || 'Lỗi nhập kho túi.');
  } finally {
    btnLoading.value = false;
  }
};

const handleOpenBag = async (bag) => {
  btnLoading.value = true;
  try {
    await api.post(`/api/scans/pickup-bags/${bag.bag_code}/open`);
    ElMessage.success(`Đã mở túi ${bag.bag_code} thành công. Hãy tiến hành đối soát.`);
    fetchBags();
  } catch (err) {
    ElMessage.error(err.response?.data?.detail || 'Lỗi mở túi.');
  } finally {
    btnLoading.value = false;
  }
};

const handleCloseBag = async (bag) => {
  btnLoading.value = true;
  try {
    await api.post(`/api/scans/pickup-bags/${bag.bag_code}/close`);
    ElMessage.success(`Đã hoàn tất đóng túi ${bag.bag_code}! Toàn bộ đơn hàng đã chuyển sang trạng thái Nhập kho (IN_HUB)`);
    fetchBags();
  } catch (err) {
    ElMessage.error(err.response?.data?.detail || 'Lỗi chốt đóng túi.');
  } finally {
    btnLoading.value = false;
  }
};

// Scanner operations
const openVerifyScanner = async (bag) => {
  scanningBag.value = bag;
  scannedCodes.value = [];
  scanningDiscrepancy.value = {
    missing_bills: [],
    extra_bills: [],
    errors: [],
    actual_quantity: 0,
    missing_quantity: 0,
    extra_quantity: 0
  };
  
  scanDialogVisible.value = true;
  scanLoading.value = true;
  
  try {
    // Nếu trạng thái của túi là INBOUND, tự động gọi API mở túi để đưa về OPENED / PROCESSING
    if (bag.status === 'INBOUND') {
      await api.post(`/api/scans/pickup-bags/${bag.bag_code}/open`);
    }

    // Lấy chi tiết túi và nạp các bills hiện đã quét (nếu có)
    const detailRes = await api.get(`/api/scans/pickup-bags/${bag.bag_code}`);
    const detailData = detailRes.data;
    
    // Nạp các bills thực tế đã nằm trong túi
    const itemsRes = await api.get(`/api/scans/bags/${bag.bag_code}/items`);
    const existingItems = itemsRes.data.items || [];
    scannedCodes.value = existingItems.map(item => item.waybill_code);

    if (detailData.discrepancy) {
      scanningDiscrepancy.value = detailData.discrepancy;
    }
    
    nextTick(() => {
      focusScannerInput();
    });
  } catch (err) {
    ElMessage.error('Không thể khởi tạo phiên đối soát.');
    scanDialogVisible.value = false;
  } finally {
    scanLoading.value = false;
  }
};

const focusScannerInput = () => {
  if (scanBarcodeRef.value) {
    scanBarcodeRef.value.focus();
  }
};

const playSound = (isSuccess) => {
  if (isSuccess && beepOk.value) {
    beepOk.value.currentTime = 0;
    beepOk.value.play().catch(() => {});
  } else if (!isSuccess && beepError.value) {
    beepError.value.currentTime = 0;
    beepError.value.play().catch(() => {});
  }
};

const handleScanWaybill = async () => {
  const code = scanBarcode.value.trim();
  if (!code) return;
  
  if (scannedCodes.value.includes(code)) {
    ElMessage.warning(`Mã đơn ${code} đã được quét đối soát trước đó.`);
    playSound(false);
    scanBarcode.value = '';
    return;
  }
  
  scanLoading.value = true;
  
  // Tạo danh sách quét tạm thời bao gồm mã mới
  const newScannedList = [...scannedCodes.value, code];
  
  try {
    // Gọi API Verify của túi lấy hàng
    const res = await api.post(`/api/scans/pickup-bags/${scanningBag.value.bag_code}/verify`, {
      waybill_codes: newScannedList
    });
    
    // Nếu verify thành công hoặc trả về kết quả
    scannedCodes.value = newScannedList;
    if (res.data.discrepancy) {
      scanningDiscrepancy.value = res.data.discrepancy;
    }
    
    ElMessage.success(`Quét thành công đơn: ${code}`);
    playSound(true);
  } catch (err) {
    // Trích xuất thông tin lỗi từ response
    const errMsg = err.response?.data?.detail || 'Lỗi đối soát đơn hàng.';
    
    // Nếu có cảnh báo lệch dữ liệu, ta vẫn giữ mã trong danh sách nhưng phát âm thanh báo lỗi
    ElMessageBox.alert(
      `<strong>Lỗi:</strong> ${errMsg}<br/><br/><i>Hệ thống phát hiện lỗi đối soát, tuy nhiên mã vẫn được ghi nhận vào phiên đối soát hiện tại để xử lý chênh lệch.</i>`, 
      'Cảnh báo đối soát', 
      {
        dangerouslyUseHTMLString: true,
        confirmButtonText: 'Đồng ý',
        type: 'warning'
      }
    );
    
    playSound(false);
    
    // Vẫn nạp mã và reload trạng thái chênh lệch từ server
    scannedCodes.value = newScannedList;
    try {
      const res = await api.post(`/api/scans/pickup-bags/${scanningBag.value.bag_code}/verify`, {
        waybill_codes: newScannedList
      });
      if (res.data.discrepancy) {
        scanningDiscrepancy.value = res.data.discrepancy;
      }
    } catch (_) {}
  } finally {
    scanBarcode.value = '';
    scanLoading.value = false;
    nextTick(() => {
      focusScannerInput();
    });
  }
};

const removeScannedBill = async (index) => {
  const removedCode = scannedCodes.value[index];
  const newScannedList = scannedCodes.value.filter((_, i) => i !== index);
  
  scanLoading.value = true;
  try {
    const res = await api.post(`/api/scans/pickup-bags/${scanningBag.value.bag_code}/verify`, {
      waybill_codes: newScannedList
    });
    scannedCodes.value = newScannedList;
    if (res.data.discrepancy) {
      scanningDiscrepancy.value = res.data.discrepancy;
    }
    ElMessage.info(`Đã loại bỏ đơn ${removedCode} khỏi phiên đối soát.`);
  } catch (err) {
    ElMessage.error('Không thể cập nhật danh sách đối soát.');
  } finally {
    scanLoading.value = false;
    nextTick(() => {
      focusScannerInput();
    });
  }
};

const submitCloseAndLockBag = async () => {
  if (scanningDiscrepancy.value.missing_quantity > 0) {
    try {
      await ElMessageBox.confirm(
        `Túi hàng vẫn còn THIẾU ${scanningDiscrepancy.value.missing_quantity} đơn hàng chưa được bưu tá quét. Bạn có chắc chắn muốn chốt túi hàng và ghi nhận chênh lệch?`,
        'Xác nhận chốt túi thiếu đơn',
        {
          confirmButtonText: 'Chốt túi và ghi nhận',
          cancelButtonText: 'Hủy',
          type: 'error'
        }
      );
    } catch {
      return; // Stop if cancel
    }
  }

  scanLoading.value = true;
  try {
    await api.post(`/api/scans/pickup-bags/${scanningBag.value.bag_code}/close`);
    ElMessage.success(`Chốt túi ${scanningBag.value.bag_code} thành công! Toàn bộ đơn hàng đã chuyển sang Nhập kho (IN_HUB)`);
    scanDialogVisible.value = false;
    fetchBags();
  } catch (err) {
    ElMessage.error(err.response?.data?.detail || 'Lỗi khi chốt đóng túi.');
  } finally {
    scanLoading.value = false;
  }
};

const closeScannerDialog = () => {
  scanDialogVisible.value = false;
  fetchBags();
};

const beforeScanDialogClose = (done) => {
  ElMessageBox.confirm(
    'Bạn có muốn đóng cửa sổ quét? Tiến trình đối soát hiện tại sẽ được lưu nháp.',
    'Xác nhận đóng',
    {
      confirmButtonText: 'Đóng',
      cancelButtonText: 'Tiếp tục quét',
      type: 'warning'
    }
  ).then(() => {
    done();
    fetchBags();
  }).catch(() => {});
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
    'CREATED': 'Mới tạo',
    'PICKED': 'Bưu tá đã lấy',
    'INBOUND': 'Đã về kho',
    'OPENED': 'Đã mở túi',
    'PROCESSING': 'Đang đối soát',
    'VERIFIED': 'Đã đối soát',
    'CLOSED': 'Hoàn tất'
  };
  return map[status] || status;
};

const getStatusClass = (status) => {
  const map = {
    'CREATED': 'tag-info',
    'PICKED': 'tag-warning',
    'INBOUND': 'tag-success-outline',
    'OPENED': 'tag-warning-outline',
    'PROCESSING': 'tag-danger-outline',
    'VERIFIED': 'tag-info-outline',
    'CLOSED': 'tag-success'
  };
  return map[status] || 'tag-info';
};

onMounted(() => {
  fetchCustomers();
  fetchBags();
});
</script>

<style scoped src="@/styles/admin/warehouse/PickupBagList.css"></style>
