<template>
  <div class="modern-waybill-management">
    <div class="page-container">
      
      <!-- Header Section -->
      <header class="page-header animate-fade-in">
        <div class="header-content">
          <div class="title-wrapper">
            <div class="icon-box primary">
              <el-icon><Tickets /></el-icon>
            </div>
            <div>
              <h2 class="page-title">Quản lý Vận đơn</h2>
              <p class="page-subtitle">Tra cứu hành trình, cập nhật trạng thái và in ấn mẫu biểu</p>
            </div>
          </div>
        </div>
        <div class="header-actions">
          <button class="btn-secondary" @click="exportExcel" :disabled="exporting">
            <el-icon class="is-loading mr-2" v-if="exporting"><Loading /></el-icon>
            <el-icon v-else><Download /></el-icon>
            <span>Xuất Excel</span>
          </button>
          <button class="btn-primary ml-2" @click="$router.push('/admin/waybills/create')" style="margin-left: 8px;">
            <el-icon><Plus /></el-icon>
            <span>Thêm mới (F2)</span>
          </button>
        </div>
      </header>

      <!-- SLA Dashboard Widget -->
      <div class="sla-dashboard mb-24 animate-fade-in">
        <el-row :gutter="16">
          <el-col :span="6">
            <div class="sla-card total">
              <div class="sla-info">
                <span class="sla-title">Tổng số vận đơn</span>
                <span class="sla-value">{{ slaStats.total }}</span>
              </div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="sla-card on-time">
              <div class="sla-info">
                <span class="sla-title">Đúng hạn (ON TIME)</span>
                <span class="sla-value">{{ slaStats.on_time }}</span>
              </div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="sla-card warning">
              <div class="sla-info">
                <span class="sla-title">Sắp trễ (WARNING)</span>
                <span class="sla-value">{{ slaStats.warning }}</span>
              </div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="sla-card overdue">
              <div class="sla-info">
                <span class="sla-title">Quá hạn (OVERDUE)</span>
                <span class="sla-value">{{ slaStats.overdue }}</span>
              </div>
            </div>
          </el-col>
        </el-row>
      </div>

      <!-- Advanced Filter Section -->
      <div class="content-card filter-card animate-fade-in mb-24">
        <!-- Row 1 -->
        <el-row :gutter="20" class="filter-row">
          <el-col :xs="24" :sm="12" :lg="6" class="filter-col">
            <div class="filter-label">Tìm kiếm</div>
            <el-input 
              v-model="searchQuery" 
              placeholder="Mã vận đơn, SĐT hoặc Tên nhận..." 
              clearable 
              class="modern-input"
              @keyup.enter="handleSearch"
            >
              <template #prefix><el-icon><Search /></el-icon></template>
            </el-input>
          </el-col>
          
          <el-col :xs="24" :sm="12" :lg="6" class="filter-col">
            <div class="filter-label">Trạng thái</div>
            <el-select v-model="statusFilter" placeholder="Tất cả trạng thái" clearable class="w-full modern-select">
              <el-option label="Mới tạo (CREATED)" value="CREATED" />
              <el-option label="Trong kho (IN_HUB)" value="IN_HUB" />
              <el-option label="Đang đi giao (DELIVERING)" value="DELIVERING" />
              <el-option label="Giao thành công (DELIVERED)" value="DELIVERED" />
              <el-option label="Đã đối soát (SETTLED)" value="SETTLED" />
              <el-option label="Đã hủy (CANCELLED)" value="CANCELLED" />
            </el-select>
          </el-col>
          
          <el-col :xs="24" :sm="12" :lg="6" class="filter-col">
            <div class="filter-label">Thời gian tạo</div>
            <el-date-picker
              v-model="dateRange"
              type="daterange"
              range-separator="-"
              start-placeholder="Từ ngày"
              end-placeholder="Đến ngày"
              class="w-full modern-date-picker"
              format="DD/MM/YYYY"
            />
          </el-col>
          
          <el-col :xs="24" :sm="12" :lg="6" class="filter-col">
            <div class="filter-label">Trạng thái COD</div>
            <el-select v-model="codStatusFilter" placeholder="Tất cả trạng thái COD" clearable class="w-full modern-select">
              <el-option label="Đã thu COD (PAID)" value="PAID" />
              <el-option label="Chưa thu COD (UNPAID)" value="UNPAID" />
            </el-select>
          </el-col>
        </el-row>
        
        <!-- Row 2 -->
        <el-row :gutter="20" class="filter-row mt-20">
          <el-col :xs="24" :sm="12" :lg="9" class="filter-col">
            <div class="filter-label">Bưu cục giữ (Kho)</div>
            <el-select v-model="holdingHubFilter" placeholder="Tất cả bưu cục giữ" clearable class="w-full modern-select">
              <el-option v-for="hub in hubs" :key="hub.hub_id" :label="hub.hub_name" :value="hub.hub_id" />
            </el-select>
          </el-col>
          
          <el-col :xs="24" :sm="12" :lg="9" class="filter-col">
            <div class="filter-label">Bưu tá giữ (Shipper)</div>
            <el-select v-model="holdingShipperFilter" placeholder="Tất cả bưu tá" clearable class="w-full modern-select">
              <el-option v-for="shipper in shippers" :key="shipper.user_id" :label="`${shipper.full_name} (${shipper.username})`" :value="shipper.user_id" />
            </el-select>
          </el-col>
          
          <el-col :xs="24" :sm="12" :lg="6" class="filter-action-col">
             <button class="btn-secondary w-full" @click="resetFilters">
               <el-icon><RefreshRight /></el-icon> Đặt lại
             </button>
             <button class="btn-primary w-full" @click="handleSearch">
               <el-icon><Search /></el-icon> Tìm kiếm
             </button>
          </el-col>
        </el-row>
      </div>

      <!-- Main Table Card -->
      <div class="content-card table-wrapper animate-fade-in-up">
        <div class="card-header-inner mb-4 flex-between">
          <h3 class="inner-title">Danh sách Vận đơn</h3>
          <el-tag type="primary" effect="light" round class="fw-bold">Tổng: {{ total }} bản ghi</el-tag>
        </div>

        <el-table 
          :data="waybills" 
          v-loading="loading" 
          class="modern-table"
          :row-class-name="tableRowClassName"
          style="width: 100%"
        >
          <!-- Mã vận đơn -->
          <el-table-column prop="waybill_code" label="Mã vận đơn" min-width="160" fixed="left">
            <template #default="{ row }">
               <div class="code-link" @click="viewTracking(row.waybill_code)" title="Xem hành trình" style="display: flex; flex-direction: column; align-items: flex-start; gap: 4px;">
                 <span class="fw-bold">{{ row.waybill_code }}</span>
                 <!-- Cảnh báo chưa kiểm duyệt ảnh bill OCR -->
                 <el-tag v-if="row.verify_status !== 'VERIFIED'" type="danger" size="small" effect="dark" class="verify-badge animate-pulse" style="font-size: 10px; font-weight: 700; border-radius: 4px; border: none; letter-spacing: 0.3px; padding: 2px 6px;">
                   ⚠️ CHƯA DUYỆT OCR
                 </el-tag>
                 <el-tag v-else type="success" size="small" effect="plain" class="verify-badge" style="font-size: 10px; font-weight: 600; border-radius: 4px; padding: 2px 6px;">
                   ✓ ĐÃ DUYỆT OCR
                 </el-tag>
               </div>
            </template>
          </el-table-column>
          
          <!-- Thông tin Người nhận -->
          <el-table-column label="Thông tin Người nhận" min-width="260">
            <template #default="{ row }">
              <div class="recipient-profile">
                <div class="avatar-circle bg-info">
                  <el-icon><User /></el-icon>
                </div>
                <div class="recipient-details">
                  <div class="name-phone">
                    <span class="fw-bold text-dark">{{ row.receiver_name }}</span>
                    <span class="phone-tag"><el-icon><Phone /></el-icon>{{ row.receiver_phone }}</span>
                  </div>
                  <span class="address-text" :title="row.receiver_address">
                    <el-icon class="mr-1"><Location /></el-icon>{{ row.receiver_address }}
                  </span>
                </div>
              </div>
            </template>
          </el-table-column>

          <!-- Trạng thái -->
          <el-table-column prop="status" label="Trạng thái" min-width="150" align="center">
            <template #default="{ row }">
              <div class="modern-tag" :class="getStatusClass(row.status)">
                <span class="dot"></span>
                {{ getStatusLabel(row.status) }}
              </div>
            </template>
          </el-table-column>

          <!-- SLA & Đơn vị giữ -->
          <el-table-column label="SLA & Đơn vị giữ" min-width="180">
            <template #default="{ row }">
              <div class="sla-holding">
                <el-tag :type="row.sla_status === 'OVERDUE' ? 'danger' : row.sla_status === 'WARNING' ? 'warning' : 'success'" size="small" effect="dark" class="mb-1">
                  {{ row.sla_status || 'ON_TIME' }}
                </el-tag>
                <div class="text-xs mt-1" style="font-size: 11px; color: #6b7280; margin-top: 4px;">
                  <b>Đang giữ:</b> 
                  {{ row.holding_hub ? row.holding_hub.hub_name : (row.holding_shipper ? row.holding_shipper.full_name : '---') }}
                </div>
              </div>
            </template>
          </el-table-column>

          <!-- Xác thực Bill -->
          <el-table-column label="Xác thực Bill" min-width="140" align="center">
            <template #default="{ row }">
              <div class="modern-tag" :class="getVerifyClass(row.verify_status)">
                {{ getVerifyLabel(row.verify_status) }}
              </div>
            </template>
          </el-table-column>

          <!-- Tài chính -->
          <el-table-column label="Tài chính (VNĐ)" min-width="200" align="right">
            <template #default="{ row }">
              <div class="finance-display">
                <div class="finance-line">
                  <span class="label">Cước phí:</span>
                  <span class="value text-primary">{{ formatCurrencyManual(row.shipping_fee || 0) }}</span>
                </div>
                <!-- Hiển thị phụ phí nếu có -->
                <div class="finance-line" v-if="(row.extra_services_fee || 0) > 0">
                  <span class="label">Phụ phí:</span>
                  <span class="value text-warning">{{ formatCurrencyManual(row.extra_services_fee) }}</span>
                </div>
                <!-- Tính toán Tổng thu an toàn để tránh NaN -->
                <div class="finance-line total-row">
                  <span class="label">Tổng thu:</span>
                  <span class="value fw-bold">
                    {{ formatCurrencyManual(
                      row.total_amount_to_collect || 
                      ((row.shipping_fee || 0) + (row.extra_services_fee || 0)) * 1.08
                    ) }}
                  </span>
                </div>
                <div class="finance-line highlight">
                  <span class="label">Thu hộ (COD):</span>
                  <span class="value">{{ formatCurrencyManual(row.cod_amount || 0) }}</span>
                </div>
              </div>
            </template>
          </el-table-column>

          <!-- Nguồn / Đích -->
          <el-table-column label="Hành trình (Nguồn → Đích)" min-width="220">
            <template #default="{ row }">
              <div class="hub-route">
                <span class="hub-item origin">{{ row.origin_hub?.hub_name || '---' }}</span>
                <el-icon class="route-arrow"><Right /></el-icon>
                <span class="hub-item dest">{{ row.dest_hub?.hub_name || '---' }}</span>
              </div>
            </template>
          </el-table-column>

          <!-- Thao tác -->
          <el-table-column label="Thao tác" width="180" fixed="right" align="center">
            <template #default="{ row }">
              <div class="action-buttons">
                <button class="icon-btn edit" @click="handlePrint(row.waybill_code)" title="In tem vận đơn">
                  <el-icon><Printer /></el-icon>
                </button>
                <button class="icon-btn success" @click="viewTracking(row.waybill_code)" title="Theo dõi hành trình">
                  <el-icon><Van /></el-icon>
                </button>
                
                <el-dropdown trigger="click" placement="bottom-end">
                  <button class="icon-btn secondary" title="Thêm thao tác">
                    <el-icon><MoreFilled /></el-icon>
                  </button>
                  <template #dropdown>
                    <el-dropdown-menu class="modern-dropdown">
                      <el-dropdown-item @click="openEditDialog(row)">
                        <el-icon><Edit /></el-icon> Hiệu chỉnh thông tin
                      </el-dropdown-item>
                      <el-dropdown-item @click="openOverrideDialog(row)" class="text-warning">
                        <el-icon><Money /></el-icon> Sửa giá vận đơn
                      </el-dropdown-item>
                      <el-dropdown-item 
                        @click="handleUpdateStatus(row.waybill_code)"
                        :disabled="row.status === 'DELIVERED' || row.status === 'SETTLED'"
                        class="text-success"
                      >
                        <el-icon><Check /></el-icon> Hoàn tất giao hàng
                      </el-dropdown-item>
                      <el-dropdown-item @click="openTransferDialog(row)">
                        <el-icon><Position /></el-icon> Điều chuyển bưu kiện
                      </el-dropdown-item>
                      <el-dropdown-item 
                        v-if="row.status !== 'DELIVERED' && row.status !== 'SETTLED' && row.status !== 'CANCELLED'"
                        @click="handleDelete(row.waybill_code)"
                        class="text-danger"
                      >
                        <el-icon><Delete /></el-icon> Hủy vận đơn
                      </el-dropdown-item>
                    </el-dropdown-menu>
                  </template>
                </el-dropdown>
              </div>
            </template>
          </el-table-column>
          
          <template #empty>
            <el-empty description="Không tìm thấy vận đơn nào phù hợp" :image-size="100" />
          </template>
        </el-table>

        <!-- Pagination -->
        <div class="pagination-wrapper mt-24 flex-between">
          <span class="pagination-info">Hiển thị {{ waybills.length }} / {{ total }} bản ghi</span>
          <el-pagination
            v-model:current-page="currentPage"
            v-model:page-size="pageSize"
            :page-sizes="[10, 20, 50, 100]"
            layout="sizes, prev, pager, next, jumper"
            :total="total"
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
            background
            class="modern-pagination"
          />
        </div>
      </div>

      <!-- Tracking History Modal -->
      <el-dialog 
        v-model="trackingDialog" 
        title="Lịch sử hành trình Vận đơn" 
        width="650px" 
        class="modern-dialog"
        destroy-on-close
      >
        <div v-if="selectedWaybill" class="tracking-summary-card mb-24">
          <div class="tracking-summary-left">
            <span class="label">Mã vận đơn:</span>
            <span class="code">{{ selectedWaybill.waybill_code }}</span>
          </div>
          <div class="tracking-summary-right">
             <div class="modern-tag" :class="getStatusClass(selectedWaybill.status)">
               {{ getStatusLabel(selectedWaybill.status) }}
             </div>
          </div>
        </div>
        
        <el-scrollbar max-height="450px" class="tracking-scrollbar">
          <el-timeline v-loading="trackingLoading" class="modern-timeline">
            <el-timeline-item
              v-for="(activity, index) in trackingLogs"
              :key="index"
              :type="index === 0 ? 'primary' : 'info'"
              :hollow="index !== 0"
              :timestamp="formatTime(activity.system_time)"
              placement="top"
            >
              <div class="timeline-card" :class="{'latest': index === 0}">
                <h4 class="status-title">{{ activity.status_id }}</h4>
                <p class="status-note">{{ activity.note }}</p>
                <div v-if="activity.hub_name" class="status-location">
                   <el-icon><LocationInformation /></el-icon>
                   <span>{{ activity.hub_name }}</span>
                </div>
              </div>
            </el-timeline-item>
            
            <el-empty v-if="!trackingLoading && trackingLogs.length === 0" description="Chưa có dữ liệu hành trình" :image-size="80" />
          </el-timeline>
        </el-scrollbar>
        
        <template #footer>
          <div class="dialog-footer-actions">
             <button class="btn-secondary" @click="trackingDialog = false">Đóng cửa sổ</button>
          </div>
        </template>
      </el-dialog>

      <!-- Edit Modal (2-Column Form) -->
      <el-dialog 
        v-model="editDialogVisible" 
        title="Hiệu chỉnh thông tin Vận đơn" 
        width="650px" 
        class="modern-dialog"
        destroy-on-close
      >
        <el-form :model="editForm" label-position="top" class="modern-form">
          <div class="form-section">
            <div class="section-header">
              <el-icon><UserFilled /></el-icon>
              <span>Thông tin Người nhận</span>
            </div>
            <el-row :gutter="24">
              <el-col :span="12">
                <el-form-item label="Tên người nhận">
                  <el-input v-model="editForm.receiver_name" placeholder="VD: Nguyễn Văn A">
                    <template #prefix><el-icon><User /></el-icon></template>
                  </el-input>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="Số điện thoại liên hệ">
                  <el-input v-model="editForm.receiver_phone" placeholder="VD: 09xxxxxxx">
                    <template #prefix><el-icon><Phone /></el-icon></template>
                  </el-input>
                </el-form-item>
              </el-col>
            </el-row>
            <el-form-item label="Địa chỉ giao hàng chi tiết">
              <el-input 
                v-model="editForm.receiver_address" 
                type="textarea" 
                :rows="3" 
                placeholder="Số nhà, đường, phường/xã, quận/huyện..."
                resize="none"
              />
            </el-form-item>
          </div>
          
          <div class="form-section no-border mb-0">
            <div class="section-header">
              <el-icon><Money /></el-icon>
              <span>Thông tin Thu hộ</span>
            </div>
            <el-form-item label="Số tiền thu hộ (COD - VNĐ)">
              <el-input-number 
                v-model="editForm.cod_amount" 
                :min="0" :step="10000" 
                class="w-full modern-price-input"
                :controls="false"
                :formatter="(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')"
                :parser="(value) => value.replace(/\$\s?|(\.*)/g, '')"
              />
            </el-form-item>
          </div>
        </el-form>
        
        <template #footer>
          <div class="dialog-footer-actions">
            <button class="btn-secondary" @click="editDialogVisible = false">Hủy bỏ</button>
            <button class="btn-primary" @click="submitEdit" :disabled="editSubmitting">
              <el-icon class="is-loading mr-2" v-if="editSubmitting"><Loading /></el-icon>
              <span>{{ editSubmitting ? 'Đang cập nhật...' : 'Cập nhật (Ctrl+S)' }}</span>
            </button>
          </div>
        </template>
      </el-dialog>

      <!-- Dialog Sửa giá Vận đơn -->
      <el-dialog
        v-model="overrideDialogVisible"
        title="✏️ Sửa giá Vận đơn"
        width="480px"
        :close-on-click-modal="false"
        destroy-on-close
        class="modern-dialog"
      >
        <div class="override-info-box" v-if="overrideForm.waybill_code">
          <div class="info-row">
            <span class="label">Mã vận đơn:</span>
            <span class="value code">{{ overrideForm.waybill_code }}</span>
          </div>
          <div class="info-row">
            <span class="label">Cước hiện tại:</span>
            <span class="value text-primary">{{ formatCurrencyManual(overrideForm.current_shipping_fee) }}</span>
          </div>
        </div>

        <el-form :model="overrideForm" label-position="top" class="mt-16">
          <el-row :gutter="16">
            <el-col :span="12">
              <el-form-item label="Cước mới (VNĐ)">
                <el-input-number
                  v-model="overrideForm.new_shipping_fee"
                  :min="0" :step="1000" :controls="false"
                  class="w-full"
                />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="Phụ phí mới (VNĐ)">
                <el-input-number
                  v-model="overrideForm.new_extra_fee"
                  :min="0" :step="1000" :controls="false"
                  class="w-full"
                />
              </el-form-item>
            </el-col>
          </el-row>

          <el-form-item label="⚠️ Lý do điều chỉnh (BẮt buộc)">
            <el-input
              v-model="overrideForm.reason"
              type="textarea"
              :rows="3"
              placeholder="VD: Sửa sai cước theo hợp đồng mới; Điều chỉnh sau kiểm trú..."
              maxlength="200"
              show-word-limit
            />
          </el-form-item>

          <div class="warning-note" v-if="overrideForm.new_shipping_fee !== overrideForm.current_shipping_fee">
            <el-icon><Warning /></el-icon>
            Nếu bảng kê đã “CHỔT” (CONFIRMED), hệ thống sẽ tự động tạo <b>phiếu điều chỉnh</b> thay vì sửa trực tiếp.
          </div>
        </el-form>

        <template #footer>
          <div class="dialog-footer-actions">
            <button class="btn-secondary" @click="overrideDialogVisible = false">Hủy</button>
            <button
              class="btn-warning"
              @click="submitOverridePrice"
              :disabled="!overrideForm.reason.trim() || overrideSubmitting"
            >
              <el-icon class="is-loading mr-2" v-if="overrideSubmitting"><Loading /></el-icon>
              <el-icon v-else><Money /></el-icon>
              <span>{{ overrideSubmitting ? 'Đang xử lý...' : 'Xác nhận Sửa giá' }}</span>
            </button>
          </div>
        </template>
      </el-dialog>

      <!-- Transfer Dialog -->
      <el-dialog
        v-model="transferDialogVisible"
        title="Điều chuyển Vận đơn"
        width="480px"
        class="modern-dialog"
        destroy-on-close
      >
        <el-form :model="transferForm" label-position="top">
          <el-form-item label="Loại đích đến">
            <el-radio-group v-model="transferForm.target_type">
              <el-radio-button value="HUB">Chuyển sang Kho</el-radio-button>
              <el-radio-button value="SHIPPER">Giao cho Bưu tá</el-radio-button>
            </el-radio-group>
          </el-form-item>
          <el-form-item label="ID Đích đến (Mã Kho / Mã NV)">
            <el-input-number v-model="transferForm.target_id" :min="1" class="w-full" :controls="false" />
          </el-form-item>
          <el-form-item label="Lý do điều chuyển (Bắt buộc)">
            <el-input v-model="transferForm.reason" type="textarea" :rows="3" placeholder="Nhập lý do..." />
          </el-form-item>
        </el-form>
        <template #footer>
          <button class="btn-secondary mr-2" @click="transferDialogVisible = false">Hủy</button>
          <button class="btn-primary" @click="submitTransfer" :disabled="!transferForm.reason.trim() || transferSubmitting || !transferForm.target_id">
            Xác nhận
          </button>
        </template>
      </el-dialog>

    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { 
  Search, Plus, Printer, Download, MoreFilled, Check, Edit, Delete, 
  Location, LocationInformation, Tickets, RefreshRight, Van, User, 
  Phone, Right, Loading, UserFilled, Money, Warning, Position
} from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import api from '@/api/axios';
import moment from 'moment';
import { useAuthStore } from '@/stores/auth';

const auth = useAuthStore();
const customers = ref([]);
const loading = ref(false);
const searchQuery = ref('');
const statusFilter = ref('');

const slaStats = ref({ total: 0, on_time: 0, warning: 0, overdue: 0 });
const transferDialogVisible = ref(false);
const transferSubmitting = ref(false);
const transferForm = ref({ waybill_code: '', target_type: 'HUB', target_id: null, reason: '' });
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

// --- OVERRIDE PRICE STATE ---
const overrideDialogVisible = ref(false);
const overrideSubmitting = ref(false);
const overrideForm = ref({
  waybill_id: null,
  waybill_code: '',
  current_shipping_fee: 0,
  new_shipping_fee: 0,
  new_extra_fee: 0,
  reason: ''
});

// --- ADVANCED SEARCH FILTER DATA ---
const hubs = ref([]);
const shippers = ref([]);
const holdingHubFilter = ref(null);
const holdingShipperFilter = ref(null);
const codStatusFilter = ref('');

const fetchHubsAndShippers = async () => {
  try {
    const [hubsRes, usersRes, customersRes] = await Promise.all([
      api.get('/api/hubs').catch(() => ({ data: [] })),
      api.get('/api/users').catch(() => ({ data: [] })),
      api.get('/api/customers').catch(() => ({ data: [] }))
    ]);
    hubs.value = Array.isArray(hubsRes.data) ? hubsRes.data : (hubsRes.data.items || hubsRes.data.data || []);
    const allUsers = Array.isArray(usersRes.data) ? usersRes.data : (usersRes.data.items || usersRes.data.data || []);
    shippers.value = allUsers.filter(u => u.role_id === 4);
    customers.value = Array.isArray(customersRes.data) ? customersRes.data : (customersRes.data.items || customersRes.data.data || []);
  } catch (err) {
    console.error('Không thể tải danh sách bưu cục/bưu tá/khách hàng:', err);
  }
};

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
      end_date: dateRange.value?.[1] ? moment(dateRange.value[1]).toISOString() : null,
      holding_hub_id: holdingHubFilter.value || null,
      holding_shipper_id: holdingShipperFilter.value || null,
      cod_status: codStatusFilter.value || null
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
      end_date: dateRange.value?.[1] ? moment(dateRange.value[1]).toISOString() : null,
      holding_hub_id: holdingHubFilter.value || null,
      holding_shipper_id: holdingShipperFilter.value || null,
      cod_status: codStatusFilter.value || null
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
  holdingHubFilter.value = null;
  holdingShipperFilter.value = null;
  codStatusFilter.value = '';
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
  const baseUrl = import.meta.env.VITE_API_URL || '';
  window.open(`${baseUrl}/api/print/${code}`, '_blank');
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
      `Xác nhận đơn hàng <strong>${code}</strong> đã được giao thành công?`,
      'Hoàn tất giao hàng',
      { 
        confirmButtonText: 'Đồng ý', 
        cancelButtonText: 'Hủy', 
        type: 'info',
        dangerouslyUseHTMLString: true,
        customClass: 'modern-message-box'
      }
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
      `Xác nhận hủy vận đơn <strong>${code}</strong>?<br/>Thao tác này sẽ xóa đơn khỏi hệ thống vận hành.`,
      'Hủy Vận Đơn',
      { 
        confirmButtonText: 'Hủy đơn', 
        cancelButtonText: 'Quay lại', 
        type: 'warning',
        dangerouslyUseHTMLString: true,
        customClass: 'modern-message-box'
      }
    );
    await api.delete(`/api/waybills/${code}`);
    ElMessage.success(`Đã hủy vận đơn ${code}`);
    handleSearch();
  } catch (error) {
    if (error !== 'cancel') ElMessage.error('Lỗi khi hủy đơn');
  }
};

const getStatusClass = (status) => {
  const map = {
    'CREATED': 'tag-info',
    'IN_HUB': 'tag-primary',
    'DELIVERING': 'tag-warning',
    'DELIVERED': 'tag-success',
    'SETTLED': 'tag-success',
    'CANCELLED': 'tag-danger'
  };
  return map[status] || 'tag-info';
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

const getVerifyClass = (status) => {
  const map = {
    'VERIFIED': 'tag-success',
    'MISMATCH': 'tag-danger',
  };
  return map[status] || 'tag-warning';
};

const getVerifyLabel = (status) => {
  const map = {
    'VERIFIED': '\u{1F7E2} Verified',
    'MISMATCH': '\u{1F534} Mismatch',
  };
  return map[status] || '\u{1F7E0} Pending';
};

const formatTime = (t) => moment(t).format('DD/MM/YYYY HH:mm');
const handleSizeChange = () => handleSearch();
const handleCurrentChange = () => handleSearch();

// --- OVERRIDE PRICE FUNCTIONS ---
const openOverrideDialog = (row) => {
  overrideForm.value = {
    waybill_id: row.waybill_id,
    waybill_code: row.waybill_code,
    current_shipping_fee: row.shipping_fee || 0,
    new_shipping_fee: row.shipping_fee || 0,
    new_extra_fee: 0,
    reason: ''
  };
  overrideDialogVisible.value = true;
};

const submitOverridePrice = async () => {
  if (!overrideForm.value.reason.trim()) {
    return ElMessage.warning('Vui lòng nhập lý do điều chỉnh!');
  }

  overrideSubmitting.value = true;
  try {
    const payload = {
      waybill_id: overrideForm.value.waybill_id,
      new_shipping_fee: overrideForm.value.new_shipping_fee,
      new_extra_fee: overrideForm.value.new_extra_fee || null,
      reason: overrideForm.value.reason.trim()
    };

    const res = await api.post('/api/accounting/override-price', payload);
    const data = res.data;

    overrideDialogVisible.value = false;

    if (data.status === 'ADJUSTED') {
      // Bảng kê đã CONFIRMED → tạo phiếu điều chỉnh
      ElMessageBox.alert(
        `Đã tạo <b>phiếu điều chỉnh #${data.adjustment_id}</b><br>
         Chênh lệch: <b>${Number(data.diff_amount).toLocaleString('vi-VN')} đ</b><br>
         Lý do: ${data.reason}`,
        '⚠️ Đã tạo phiếu điều chỉnh',
        { type: 'warning', dangerouslyUseHTMLString: true, confirmButtonText: 'Đóng' }
      );
    } else {
      // Bảng kê DRAFT → sửa trực tiếp
      // Cập nhật ngay tất cả giá trị tài chính từ BE trả về vào bảng local (optimistic update)
      const idx = waybills.value.findIndex(w => w.waybill_id === overrideForm.value.waybill_id);
      if (idx !== -1) {
        waybills.value[idx] = {
          ...waybills.value[idx],
          shipping_fee: data.new_shipping_fee,
          extra_services_fee: data.new_extra_fee,
          vat_amount: data.new_vat,
          total_amount_to_collect: data.new_total
        };
      }
      ElMessage.success(`✅ Cập nhật giá thành công! Tổng mới: ${Number(data.new_total).toLocaleString('vi-VN')} đ`);
    }

    // Reload từ server để đồng bộ toàn bộ dữ liệu
    await handleSearch();
  } catch (err) {
    ElMessage.error(err.response?.data?.detail || 'Lỗi khi sửa giá vận đơn');
  } finally {
    overrideSubmitting.value = false;
  }
};

const fetchSLAStats = async () => {
  try {
    const res = await api.get('/api/waybills/sla/dashboard');
    slaStats.value = res.data;
  } catch (err) {}
};

const tableRowClassName = ({ row }) => {
  if (row.sla_status === 'OVERDUE') {
    return 'overdue-row';
  }
  return 'modern-row';
};

const openTransferDialog = (row) => {
  transferForm.value = { waybill_code: row.waybill_code, target_type: 'HUB', target_id: null, reason: '' };
  transferDialogVisible.value = true;
};

const submitTransfer = async () => {
  transferSubmitting.value = true;
  try {
    await api.post(`/api/waybills/${transferForm.value.waybill_code}/transfer`, null, {
      params: {
        target_type: transferForm.value.target_type,
        target_id: transferForm.value.target_id,
        reason: transferForm.value.reason
      }
    });
    ElMessage.success('Điều chuyển thành công!');
    transferDialogVisible.value = false;
    handleSearch();
    fetchSLAStats();
  } catch (err) {
    ElMessage.error(err.response?.data?.detail || 'Lỗi điều chuyển');
  } finally {
    transferSubmitting.value = false;
  }
};

onMounted(() => {
  handleSearch();
  fetchSLAStats();
  fetchHubsAndShippers();
});
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

/* Base Layout */
.modern-waybill-management {
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

.mb-24 { margin-bottom: 24px; }
.mb-4 { margin-bottom: 16px; }
.mb-0 { margin-bottom: 0 !important; }
.mt-24 { margin-top: 24px; }
.mt-20 { margin-top: 20px; }
.w-full { width: 100%; }

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

/* Filters Card */
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
:deep(.modern-select .el-input__wrapper),
:deep(.modern-date-picker .el-input__wrapper) {
  background: #F8FAFC; box-shadow: none !important; border: 1px solid #E2E8F0; border-radius: 10px; padding: 6px 12px; transition: all 0.3s;
}

:deep(.modern-input .el-input__wrapper:hover),
:deep(.modern-select .el-input__wrapper:hover),
:deep(.modern-date-picker .el-input__wrapper:hover),
:deep(.modern-input .el-input__wrapper.is-focus),
:deep(.modern-select .el-input__wrapper.is-focus),
:deep(.modern-date-picker .el-input__wrapper.is-focus) {
  border-color: #4318FF; background: #FFFFFF;
}

/* Table Header */
.card-header-inner { display: flex; align-items: center; gap: 16px; }
.card-header-inner.flex-between { justify-content: space-between; }
.inner-title { margin: 0; font-size: 18px; font-weight: 800; color: #1B2559; }

/* Table Elements */
:deep(.modern-table) {
  --el-table-border-color: transparent;
  --el-table-header-bg-color: #F4F7FE;
  --el-table-header-text-color: #A3AED0;
  --el-table-text-color: #2B3674;
}
:deep(.modern-table th.el-table__cell) { font-weight: 700; font-size: 13px; text-transform: uppercase; padding: 16px 0; border-bottom: 2px solid #E9EDF7 !important; }
:deep(.modern-table td.el-table__cell) { padding: 16px 0; border-bottom: 1px solid #F4F7FE !important; }

/* Table Content Styles */
.code-link {
  font-family: 'Courier New', Courier, monospace; font-weight: 800; color: #4318FF; background: #F4F7FE;
  padding: 6px 10px; border-radius: 8px; font-size: 13px; display: inline-block; cursor: pointer; transition: 0.3s;
}
.code-link:hover { background: #4318FF; color: white; }

.recipient-profile { display: flex; align-items: center; gap: 12px; }
.avatar-circle { width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 16px; color: white; flex-shrink: 0; }
.bg-info { background: linear-gradient(135deg, #8F9BBA, #A3AED0); }

.recipient-details { display: flex; flex-direction: column; gap: 4px; overflow: hidden; }
.name-phone { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.phone-tag { background: #F8FAFC; border: 1px solid #E2E8F0; padding: 2px 6px; border-radius: 6px; font-size: 11px; font-weight: 600; color: #4B5563; display: flex; align-items: center; gap: 4px; }
.address-text { font-size: 12px; color: #A3AED0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; display: flex; align-items: center; }

.finance-display { display: flex; flex-direction: column; gap: 4px; }
.finance-line { display: flex; justify-content: flex-end; gap: 8px; font-size: 12px; color: #A3AED0; }
.finance-line .value { font-weight: 700; color: #2B3674; }
.finance-line.highlight .value { color: #EE5D50; font-size: 14px; }

.hub-route { display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 600; }
.hub-item { padding: 4px 8px; border-radius: 6px; }
.hub-item.origin { background: rgba(67, 24, 255, 0.05); color: #4318FF; }
.hub-item.dest { background: rgba(5, 205, 153, 0.05); color: #05CD99; }
.route-arrow { color: #A3AED0; font-size: 16px; }

/* Tags */
.modern-tag { display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px; border-radius: 20px; font-size: 12px; font-weight: 700; width: fit-content; margin: 0 auto; }
.modern-tag .dot { width: 6px; height: 6px; border-radius: 50%; }
.tag-info { background: rgba(143, 155, 186, 0.1); color: #8F9BBA; }
.tag-info .dot { background: #8F9BBA; }
.tag-primary { background: rgba(67, 24, 255, 0.1); color: #4318FF; }
.tag-primary .dot { background: #4318FF; }
.tag-warning { background: rgba(255, 181, 71, 0.1); color: #FFB547; }
.tag-warning .dot { background: #FFB547; }
.tag-success { background: rgba(5, 205, 153, 0.1); color: #05CD99; }
.tag-success .dot { background: #05CD99; }
.tag-danger { background: rgba(238, 93, 80, 0.1); color: #EE5D50; }
.tag-danger .dot { background: #EE5D50; }

/* Buttons */
.btn-primary { background: #4318FF; color: white; border: none; padding: 10px 20px; border-radius: 12px; font-weight: 700; font-family: inherit; font-size: 14px; display: inline-flex; align-items: center; gap: 8px; cursor: pointer; transition: all 0.3s ease; box-shadow: 0 4px 15px rgba(67, 24, 255, 0.25); }
.btn-primary:hover:not(:disabled) { background: #3311DB; transform: translateY(-2px); }
.btn-secondary { background: #F4F7FE; color: #2B3674; border: none; padding: 10px 20px; border-radius: 12px; font-weight: 700; font-family: inherit; font-size: 14px; display: inline-flex; align-items: center; gap: 8px; cursor: pointer; transition: all 0.3s ease; }
.btn-secondary:hover:not(:disabled) { background: #E9EDF7; }

.action-buttons { display: flex; gap: 6px; justify-content: center; }
.icon-btn { width: 32px; height: 32px; border-radius: 8px; border: none; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s; font-size: 16px; }
.icon-btn.edit { background: #F4F7FE; color: #4318FF; }
.icon-btn.edit:hover { background: #4318FF; color: white; }
.icon-btn.success { background: #F0FDF4; color: #05CD99; }
.icon-btn.success:hover { background: #05CD99; color: white; }
.icon-btn.secondary { background: #F8FAFC; color: #8F9BBA; }
.icon-btn.secondary:hover { background: #E2E8F0; color: #1B2559; }

/* Pagination */
.pagination-wrapper { display: flex; justify-content: space-between; align-items: center; }
.pagination-info { font-size: 13px; color: #A3AED0; font-weight: 600; font-style: italic; }
:deep(.modern-pagination .el-pager li), :deep(.modern-pagination button) { background: #F8FAFC !important; border-radius: 8px; font-weight: 600; color: #8F9BBA; }
:deep(.modern-pagination .el-pager li.is-active) { background: #4318FF !important; color: white; }

/* Modern Dialogs */
:deep(.modern-dialog) { border-radius: 20px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.1); }
:deep(.modern-dialog .el-dialog__header) { margin: 0; padding: 24px; border-bottom: 1px solid #E9EDF7; }
:deep(.modern-dialog .el-dialog__title) { font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 800; color: #2B3674; font-size: 18px; }
:deep(.modern-dialog .el-dialog__body) { padding: 24px; }
:deep(.modern-dialog .el-dialog__footer) { padding: 16px 24px 24px; border-top: 1px solid #E9EDF7; }
.dialog-footer-actions { display: flex; justify-content: flex-end; gap: 12px; }

/* Form Sections for Edit Modal */
.form-section { background: #FFFFFF; border: 1px solid #E9EDF7; border-radius: 16px; padding: 20px; margin-bottom: 20px; }
.form-section.no-border { border: none; background: #F8FAFC; }
.section-header { display: flex; align-items: center; gap: 8px; font-size: 15px; font-weight: 800; color: #1B2559; margin-bottom: 16px; padding-bottom: 12px; border-bottom: 1px dashed #E2E8F0; }
.section-header .el-icon { color: #4318FF; font-size: 18px; }

:deep(.modern-form .el-form-item__label) { font-weight: 700; color: #2B3674; margin-bottom: 8px; }
:deep(.modern-form .el-input__wrapper),
:deep(.modern-form .el-textarea__inner) { background: #F8FAFC; box-shadow: 0 0 0 1px #E2E8F0 inset; border-radius: 10px; padding: 8px 12px; transition: all 0.3s ease; }
:deep(.modern-form .el-textarea__inner) { padding: 12px; }
:deep(.modern-form .el-input__wrapper:hover),
:deep(.modern-form .el-textarea__inner:hover) { box-shadow: 0 0 0 1px #4318FF inset; }
:deep(.modern-form .el-input__wrapper.is-focus),
:deep(.modern-form .el-textarea__inner:focus) { box-shadow: 0 0 0 2px rgba(67, 24, 255, 0.2) inset !important; background: #FFFFFF; }
:deep(.modern-price-input .el-input__inner) { font-size: 18px !important; font-weight: 800 !important; color: #EE5D50 !important; text-align: left; }

/* Tracking Summary & Timeline */
.tracking-summary-card { background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 12px; padding: 16px 20px; display: flex; justify-content: space-between; align-items: center; }
.tracking-summary-left { display: flex; flex-direction: column; gap: 4px; }
.tracking-summary-left .label { font-size: 12px; color: #8F9BBA; font-weight: 700; text-transform: uppercase; }
.tracking-summary-left .code { font-family: monospace; font-size: 20px; font-weight: 800; color: #4318FF; }

.tracking-scrollbar { padding-right: 16px; margin-right: -16px; }
:deep(.modern-timeline .el-timeline-item__timestamp) { font-weight: 700; color: #8F9BBA; font-size: 12px; }
:deep(.modern-timeline .el-timeline-item__node--primary) { background-color: #4318FF; }

.timeline-card { background: #F8FAFC; border: 1px solid #E9EDF7; border-radius: 12px; padding: 16px; margin-top: 8px; transition: all 0.3s; }
.timeline-card.latest { background: #FFFFFF; border-color: #4318FF; box-shadow: 0 4px 15px rgba(67, 24, 255, 0.1); }
.status-title { margin: 0 0 6px; font-size: 14px; font-weight: 800; color: #1B2559; }
.status-note { margin: 0 0 8px; font-size: 13px; color: #4B5563; line-height: 1.5; }
.status-location { display: inline-flex; align-items: center; gap: 6px; background: rgba(67, 24, 255, 0.05); color: #4318FF; padding: 4px 10px; border-radius: 6px; font-size: 12px; font-weight: 700; }

/* Dropdown */
:deep(.modern-dropdown .el-dropdown-menu__item) { padding: 10px 16px; font-weight: 600; font-size: 13px; gap: 8px; }
:deep(.modern-dropdown .el-dropdown-menu__item:hover) { background-color: #F4F7FE; color: #4318FF; }
:deep(.modern-dropdown .text-success) { color: #05CD99 !important; }
:deep(.modern-dropdown .text-danger) { color: #EE5D50 !important; }

/* Utilities */
.fw-bold { font-weight: 700; }
.text-dark { color: #1B2559; }
.text-primary { color: #4318FF; }
.mr-1 { margin-right: 4px; }
.mr-2 { margin-right: 8px; }
.flex-between { display: flex; justify-content: space-between; align-items: center; }

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
}

/* Override Price Dialog */
.btn-warning {
  display: inline-flex; align-items: center; gap: 8px;
  padding: 10px 20px; background: linear-gradient(135deg, #f9a825, #ffcc02);
  color: #333; border: none; border-radius: 12px;
  font-size: 14px; font-weight: 700; cursor: pointer; transition: all 0.2s;
}
.btn-warning:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(249,168,37,0.3); }
.btn-warning:disabled { opacity: 0.5; cursor: not-allowed; }

.override-info-box {
  background: #F8FAFF; border-radius: 10px; padding: 14px;
  display: flex; flex-direction: column; gap: 8px;
}
.override-info-box .info-row { display: flex; justify-content: space-between; align-items: center; }
.override-info-box .label { font-size: 13px; color: #8F9BBA; }
.override-info-box .value { font-size: 14px; font-weight: 600; color: #1B2559; }
.override-info-box .value.code { font-family: monospace; background: #EEF2FF; color: #6C5CE7; padding: 2px 8px; border-radius: 6px; }
.override-info-box .text-primary { color: #4318FF; }

.warning-note {
  display: flex; align-items: flex-start; gap: 8px; font-size: 13px;
  background: #FFF8E6; border: 1px solid #FFE082; border-radius: 8px;
  padding: 10px 14px; color: #795548; margin-top: 8px;
}
.warning-note .el-icon { color: #f9a825; margin-top: 2px; flex-shrink: 0; }
.mt-16 { margin-top: 16px; }
.mr-2 { margin-right: 8px; }
.w-full { width: 100%; }
.finance-line.total-row {
  margin-top: 4px;
  padding-top: 4px;
  border-top: 1px dashed #E9EDF7;
  color: #1B2559;
}
.finance-line.total-row .value {
  color: #2B3674;
}
:deep(.text-warning) { color: #e6a817 !important; }

/* SLA Dashboard */
.sla-dashboard .sla-card {
  background: #FFFFFF;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.02);
  display: flex;
  align-items: center;
  border-left: 4px solid transparent;
}
.sla-card.total { border-left-color: #4318FF; }
.sla-card.on-time { border-left-color: #05CD99; }
.sla-card.warning { border-left-color: #FFB547; }
.sla-card.overdue { border-left-color: #EE5D50; }

.sla-info { display: flex; flex-direction: column; }
.sla-title { font-size: 13px; color: #8F9BBA; font-weight: 700; margin-bottom: 4px; }
.sla-value { font-size: 24px; font-weight: 800; color: #2B3674; }

:deep(.overdue-row) {
  background-color: #FFF1F2 !important;
}

.sla-holding {
  display: flex;
  flex-direction: column;
}

@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.85; transform: scale(0.96); }
}
.animate-pulse {
  animation: pulse 2.5s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
</style>