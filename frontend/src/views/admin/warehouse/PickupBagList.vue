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
          <el-table-column label="Thao tác" width="220" fixed="right" align="center">
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

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

.modern-bag-management {
  min-height: calc(100vh - 64px);
  background-color: #F4F7FE;
  font-family: 'Plus Jakarta Sans', sans-serif;
  color: #2B3674;
  padding: 32px 24px;
}

.page-container {
  max-width: 1500px;
  margin: 0 auto;
}

.mb-24 { margin-bottom: 24px; }
.mb-4 { margin-bottom: 16px; }
.w-full { width: 100%; }
.fw-bold { font-weight: 700; }
.fw-semibold { font-weight: 600; }
.text-dark { color: #1B2559; }
.text-primary { color: #4318FF; }
.text-danger { color: #FF3B30; }
.text-success { color: #05CD99; }
.mr-1 { margin-right: 4px; }
.ml-1 { margin-left: 4px; }
.block { display: block; }
.text-xs { font-size: 11px; }
.text-sm { font-size: 13px; }
.text-muted { color: #A3AED0; }
.font-bold { font-weight: 800; }
.flex-between { display: flex; justify-content: space-between; align-items: center; }
.flex-center { display: flex; align-items: center; }
.gap-2 { gap: 8px; }
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

/* Stats cards */
.stat-mini-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
}
.card-icon {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
}
.info-bg { background: rgba(67, 24, 255, 0.08); color: #4318FF; }
.warning-bg { background: rgba(255, 181, 71, 0.08); color: #FFB547; }
.danger-bg { background: rgba(255, 59, 48, 0.08); color: #FF3B30; }
.success-bg { background: rgba(5, 205, 153, 0.08); color: #05CD99; }

.card-stat-info { display: flex; flex-direction: column; }
.stat-lbl { font-size: 12px; font-weight: 700; color: #A3AED0; text-transform: uppercase; letter-spacing: 0.5px; }
.stat-val { font-size: 20px; font-weight: 800; margin: 4px 0 0 0; }
.stat-unit { font-size: 12px; font-weight: 500; color: #A3AED0; }

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

/* Card Header */
.card-header-inner { display: flex; align-items: center; gap: 16px; }
.card-header-inner.flex-between { justify-content: space-between; }
.inner-title { margin: 0; font-size: 18px; font-weight: 800; color: #1B2559; }

/* Table styling */
:deep(.modern-table) {
  --el-table-border-color: transparent;
  --el-table-header-bg-color: #F4F7FE;
  --el-table-header-text-color: #A3AED0;
  --el-table-text-color: #2B3674;
}
:deep(.modern-table th.el-table__cell) { font-weight: 700; font-size: 13px; text-transform: uppercase; padding: 16px 0; border-bottom: 2px solid #E9EDF7 !important; }
:deep(.modern-table td.el-table__cell) { padding: 16px 0; border-bottom: 1px solid #F4F7FE !important; }
:deep(.compact-table .el-table__cell) { padding: 10px 0; }

.code-badge { font-family: monospace; font-weight: 800; padding: 6px 10px; border-radius: 8px; font-size: 13px; display: inline-block; }
.code-badge.primary { background: #F4F7FE; color: #4318FF; }
.code-badge.success { background: rgba(5, 205, 153, 0.1); color: #05CD99; }
.code-badge.warning { background: rgba(255, 181, 71, 0.1); color: #FFB547; }
.code-badge.danger { background: rgba(255, 59, 48, 0.1); color: #FF3B30; }

.qty-group-display { display: flex; align-items: center; justify-content: center; gap: 6px; }
.qty-badge { font-weight: 800; font-size: 13px; padding: 4px 8px; border-radius: 6px; }
.qty-badge.expected { background: #F4F7FE; color: #8F9BBA; }
.qty-badge.actual { background: rgba(5, 205, 153, 0.1); color: #05CD99; }
.qty-badge.actual.has-missing { background: rgba(255, 59, 48, 0.1); color: #FF3B30; }
.qty-separator { color: #D1D5DB; }

.time-text { display: flex; align-items: center; font-size: 13px; color: #A3AED0; font-weight: 600; }

/* Modern Tags */
.modern-tag { display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px; border-radius: 20px; font-size: 12px; font-weight: 700; width: fit-content; margin: 0 auto; }
.modern-tag .dot { width: 6px; height: 6px; border-radius: 50%; }

.tag-info { background: rgba(67, 24, 255, 0.08); color: #4318FF; }
.tag-info .dot { background: #4318FF; }

.tag-warning { background: rgba(255, 181, 71, 0.08); color: #FFB547; }
.tag-warning .dot { background: #FFB547; }

.tag-success-outline { background: rgba(5, 205, 153, 0.05); color: #05CD99; border: 1px solid #05CD99; }
.tag-success-outline .dot { background: #05CD99; }

.tag-warning-outline { background: rgba(255, 181, 71, 0.05); color: #FFB547; border: 1px solid #FFB547; }
.tag-warning-outline .dot { background: #FFB547; }

.tag-danger-outline { background: rgba(255, 59, 48, 0.05); color: #FF3B30; border: 1px solid #FF3B30; }
.tag-danger-outline .dot { background: #FF3B30; }

.tag-info-outline { background: rgba(67, 24, 255, 0.05); color: #4318FF; border: 1px solid #4318FF; }
.tag-info-outline .dot { background: #4318FF; }

.tag-success { background: rgba(5, 205, 153, 0.1); color: #05CD99; }
.tag-success .dot { background: #05CD99; }

/* Buttons */
.btn-primary { background: #4318FF; color: white; border: none; padding: 10px 20px; border-radius: 12px; font-weight: 700; font-family: inherit; font-size: 14px; display: inline-flex; align-items: center; gap: 8px; cursor: pointer; transition: all 0.3s ease; box-shadow: 0 4px 15px rgba(67, 24, 255, 0.25); }
.btn-primary:hover:not(:disabled) { background: #3311DB; transform: translateY(-2px); }
.btn-secondary { background: #F4F7FE; color: #2B3674; border: none; padding: 10px 20px; border-radius: 12px; font-weight: 700; font-family: inherit; font-size: 14px; display: inline-flex; align-items: center; gap: 8px; cursor: pointer; transition: all 0.3s ease; }
.btn-secondary:hover:not(:disabled) { background: #E9EDF7; }

.icon-btn { width: 32px; height: 32px; border-radius: 8px; border: none; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s; font-size: 16px; }
.icon-btn.edit { background: #F4F7FE; color: #4318FF; }
.icon-btn.edit:hover { background: #4318FF; color: white; }
.icon-btn.delete { background: #FFECEB; color: #FF3B30; }
.icon-btn.delete:hover { background: #FF3B30; color: white; }

.action-btn-group { display: flex; align-items: center; gap: 8px; justify-content: center; }
.action-btn-sm { font-weight: 700; border-radius: 8px; font-family: inherit; }

/* Dialog Styles */
:deep(.modern-dialog) { border-radius: 20px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.1); }
:deep(.modern-dialog .el-dialog__header) { margin: 0; padding: 24px; border-bottom: 1px solid #E9EDF7; }
:deep(.modern-dialog .el-dialog__title) { font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 800; color: #2B3674; font-size: 18px; }
:deep(.modern-dialog .el-dialog__body) { padding: 24px; }
:deep(.modern-dialog .el-dialog__footer) { padding: 16px 24px 24px; border-top: 1px solid #E9EDF7; }
.dialog-footer-actions { display: flex; justify-content: flex-end; gap: 12px; }

/* Bag details styling */
.bag-detail-header { background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 12px; padding: 20px; }
.detail-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }
.detail-item { display: flex; flex-direction: column; gap: 4px; }
.detail-label { font-size: 11px; font-weight: 700; color: #8F9BBA; text-transform: uppercase; }
.detail-value { font-size: 14px; color: #2B3674; }

.section-title-box { display: flex; align-items: center; gap: 8px; margin-bottom: 16px; }
.section-title { font-size: 14px; font-weight: 800; color: #1B2559; text-transform: uppercase; letter-spacing: 0.5px; }

/* Chain of custody timeline */
.timeline-wrapper { display: flex; flex-direction: column; gap: 0; position: relative; padding-left: 8px; }
.timeline-step { display: flex; position: relative; padding-bottom: 24px; }
.timeline-step::before { content: ''; position: absolute; left: 11px; top: 24px; bottom: 0; width: 2px; background: #E9EDF7; }
.timeline-step:last-child::before { display: none; }

.step-bullet { width: 24px; height: 24px; border-radius: 50%; border: 2px solid #D1D5DB; background: white; display: flex; align-items: center; justify-content: center; z-index: 2; margin-right: 16px; }
.step-bullet .bullet-inner { width: 8px; height: 8px; border-radius: 50%; background: #D1D5DB; }
.step-bullet.step-active { border-color: #4318FF; }
.step-bullet.step-active .bullet-inner { background: #4318FF; animation: pulse 1.5s infinite; }

.step-content { flex: 1; display: flex; flex-direction: column; gap: 4px; }
.step-header { display: flex; justify-content: space-between; align-items: center; }
.step-time { color: #A3AED0; font-weight: 600; }

/* Discrepancy block */
.discrepancy-card { border: 1px solid #E2E8F0; border-radius: 12px; padding: 16px; background: #FFFFFF; }
.discrepancy-card.missing-card { border-color: rgba(255, 181, 71, 0.3); background: rgba(255, 181, 71, 0.01); }
.discrepancy-card.extra-card { border-color: rgba(255, 59, 48, 0.3); background: rgba(255, 59, 48, 0.01); }
.card-hdr { font-size: 12px; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 0.5px; }
.card-body-scroll { height: 150px; overflow-y: auto; display: flex; flex-flow: wrap; gap: 8px; align-content: flex-start; }

.code-badge-inline { font-family: monospace; font-weight: 800; font-size: 11px; padding: 4px 8px; border-radius: 6px; }
.code-badge-inline.warning { background: rgba(255, 181, 71, 0.1); color: #FFB547; border: 1px solid rgba(255, 181, 71, 0.2); }
.code-badge-inline.danger { background: rgba(255, 59, 48, 0.1); color: #FF3B30; border: 1px solid rgba(255, 59, 48, 0.2); }

.error-alert-box { background: rgba(255, 59, 48, 0.06); border: 1px solid rgba(255, 59, 48, 0.15); border-radius: 12px; padding: 16px; }
.alert-list { margin: 0; padding-left: 20px; list-style-type: square; }

/* Scanner Dialog layout */
.scanner-dialog-layout { font-family: inherit; }
.scanner-card { background: #FFFFFF; border: 1px solid #E9EDF7; border-radius: 16px; padding: 20px; min-height: 480px; display: flex; flex-direction: column; }

.barcode-input-area { position: relative; }
:deep(.modern-scanner-input .el-input__wrapper) {
  background: #F4F7FE; border: 2px solid #E9EDF7; border-radius: 14px; padding: 12px 18px; box-shadow: none !important; font-size: 16px; font-weight: 700; color: #1B2559;
}
:deep(.modern-scanner-input .el-input__wrapper.is-focus) {
  border-color: #4318FF; background: #FFFFFF;
}
.scanner-icon { font-size: 20px; color: #4318FF; }

.btn-scan { background: #4318FF; color: white; border: none; padding: 0 24px; border-top-right-radius: 14px; border-bottom-right-radius: 14px; font-weight: 700; height: 100%; cursor: pointer; transition: all 0.3s; }
.btn-scan:hover { background: #3311DB; }

/* Scan Stats count */
.scan-stats-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
.scan-stat-box { display: flex; flex-direction: column; align-items: center; padding: 12px; border-radius: 12px; text-align: center; }
.scan-stat-box.green { background: rgba(5, 205, 153, 0.08); color: #05CD99; }
.scan-stat-box.yellow { background: rgba(255, 181, 71, 0.08); color: #FFB547; }
.scan-stat-box.red { background: rgba(255, 59, 48, 0.08); color: #FF3B30; }
.scan-stat-box .lbl { font-size: 11px; font-weight: 700; text-transform: uppercase; margin-bottom: 4px; }
.scan-stat-box .val { font-size: 18px; font-weight: 800; }

/* Realtime Error alerts box */
.realtime-errors-box { background: rgba(255, 59, 48, 0.05); border: 1px solid rgba(255, 59, 48, 0.15); border-radius: 12px; padding: 16px; flex: 1; display: flex; flex-direction: column; overflow: hidden; }
.realtime-errors-box .error-header { font-size: 12px; font-weight: 800; margin-bottom: 8px; display: flex; align-items: center; }
.error-scroll-area { overflow-y: auto; flex: 1; max-height: 120px; }
.error-item-text { font-size: 12px; color: #FF3B30; margin-bottom: 4px; line-height: 1.4; }

.realtime-no-error-box { background: rgba(5, 205, 153, 0.06); border: 1px dashed #05CD99; border-radius: 12px; padding: 20px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; flex: 1; font-size: 13px; font-weight: 700; color: #05CD99; }

:deep(.modern-tabs-flat) { border: none !important; box-shadow: none !important; border-radius: 12px; overflow: hidden; }
:deep(.modern-tabs-flat .el-tabs__content) { padding: 16px 0 0 0; }

/* Animations */
.animate-fade-in { animation: fadeIn 0.5s ease-out; }
.animate-fade-in-up { animation: fadeInUp 0.5s ease-out; }
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes fadeInUp { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }
@keyframes pulse {
  0% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.3); opacity: 0.7; }
  100% { transform: scale(1); opacity: 1; }
}

@media (max-width: 992px) {
  .filter-col { margin-bottom: 16px; }
}
@media (max-width: 768px) {
  .page-header { flex-direction: column; align-items: flex-start; }
  .header-actions, .filter-action-col { width: 100%; flex-direction: column; }
  .detail-grid { grid-template-columns: 1fr; }
}
</style>
