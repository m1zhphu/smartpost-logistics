<template>
  <div class="modern-waybill-management" style="min-width: 0; width: 100%;">
    <div class="page-container" style="min-width: 0; width: 100%;">
      
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
          <button class="btn-secondary" @click="exportSelectedExcel" :disabled="selectedWaybillsList.length === 0 || exportingSelected" style="margin-right: 8px;">
            <el-icon class="is-loading mr-2" v-if="exportingSelected"><Loading /></el-icon>
            <el-icon v-else><Download /></el-icon>
            <span>Xuất Excel Đơn Đã Chọn ({{ selectedWaybillsList.length }})</span>
          </button>
          <button class="btn-secondary" @click="openUpdateDialog" style="margin-right: 8px;">
            <el-icon><Upload /></el-icon>
            <span>Cập Nhật Excel</span>
          </button>
          <button class="btn-secondary" @click="openImportDialog" style="margin-right: 8px;">
            <el-icon><Upload /></el-icon>
            <span>Nhập Excel</span>
          </button>
          <button class="btn-primary" @click="$router.push('/admin/waybills/create')">
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
                <span class="sla-title">Đúng hạn</span>
                <span class="sla-value">{{ slaStats.on_time }}</span>
              </div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="sla-card warning">
              <div class="sla-info">
                <span class="sla-title">Sắp trễ</span>
                <span class="sla-value">{{ slaStats.warning }}</span>
              </div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="sla-card overdue">
              <div class="sla-info">
                <span class="sla-title">Quá hạn</span>
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
              <el-option label="Mới tạo" value="CREATED" />
              <el-option label="Chờ OCR" value="PENDING_OCR" />
              <el-option label="Chờ duyệt OCR" value="PICKED_PENDING_VERIFY" />
              <el-option label="Trong kho" value="IN_HUB" />
              <el-option label="Đang đi giao" value="DELIVERING" />
              <el-option label="Giao thành công" value="DELIVERED" />
              <el-option label="Đã đối soát" value="SETTLED" />
              <el-option label="Đã hủy" value="CANCELLED" />
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
              <el-option label="Đã thu COD" value="PAID" />
              <el-option label="Chưa thu COD" value="UNPAID" />
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

        <!-- Row 3 -->
        <el-row :gutter="20" class="filter-row mt-20">
          <el-col :xs="24" :sm="12" :lg="9" class="filter-col">
            <div class="filter-label">Dịch vụ vận chuyển</div>
            <el-select v-model="serviceTypeFilter" placeholder="Tất cả dịch vụ" clearable class="w-full modern-select">
              <el-option label="Chuyển phát nhanh" value="CPN" />
              <el-option label="Tiết kiệm" value="TK" />
              <el-option label="Hỏa tốc" value="HT" />
              <el-option label="Phát trước 9h" value="PT9H" />
              <el-option label="Quốc tế" value="QT" />
            </el-select>
          </el-col>
          
          <el-col :xs="24" :sm="12" :lg="9" class="filter-col">
            <div class="filter-label">Kiểm soát SLA</div>
            <el-select v-model="slaStatusFilter" placeholder="Tất cả trạng thái SLA" clearable class="w-full modern-select">
              <el-option label="Đúng hạn" value="ON_TIME" />
              <el-option label="Sắp trễ" value="WARNING" />
              <el-option label="Quá hạn" value="OVERDUE" />
            </el-select>
          </el-col>
        </el-row>
      </div>

      <!-- Main Table Card (Grouped by Customer) -->
      <div class="content-card table-wrapper animate-fade-in-up" style="min-width: 0; width: 100%; overflow: hidden;">
        <div class="card-header-inner mb-4 flex-between">
          <h3 class="inner-title">Danh sách Khách hàng & Vận đơn</h3>
          <el-tag type="primary" effect="light" round class="fw-bold">Tổng số vận đơn hiển thị: {{ total }}</el-tag>
        </div>
        <div class="waybill-table-scroll">
          <!-- Bảng dành cho Quản trị viên (Gom nhóm theo Khách hàng) -->
          <el-table 
            v-if="isAdmin"
            :data="paginatedCustomers" 
            v-loading="loading" 
            element-loading-text="Đang tải dữ liệu..."
            class="modern-table"
            style="width: 100%;"
            row-key="customer_id"
            @expand-change="handleCustomerExpand"
          >
            <!-- Expanded Area for Customer's Waybills -->
            <el-table-column type="expand">
              <template #default="{ row: customer }">
                <div style="padding: 16px 24px; background: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0; margin: 8px 16px;">
                  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                    <h4 style="margin: 0; font-size: 14px; color: #1e293b; display: flex; align-items: center; gap: 6px;">
                      <el-icon><Tickets /></el-icon>
                      Danh sách vận đơn của: <strong style="color: #3b82f6;">{{ customer.company_name || customer.name }}</strong>
                    </h4>
                    <span style="font-size: 12px; color: #64748b;">
                      Đã chọn: <strong>{{ activeWaybillSelection[customer.customer_id]?.length || 0 }}</strong> / {{ customerWaybills[customer.customer_id]?.length || 0 }} đơn
                    </span>
                  </div>

                  <el-table
                    :data="(customerWaybills[customer.customer_id] || []).slice(((innerCurrentPage[customer.customer_id] || 1) - 1) * 10, (innerCurrentPage[customer.customer_id] || 1) * 10)"
                    v-loading="customerWaybillsLoading[customer.customer_id]"
                    element-loading-text="Đang tải dữ liệu..."
                    style="width: 100%;"
                    class="inner-waybill-table"
                    row-key="waybill_code"
                    :row-class-name="tableRowClassName"
                    @selection-change="(val) => handleWaybillSelectionChange(customer.customer_id, val)"
                  >
                    <!-- Checkbox -->
                    <el-table-column type="selection" width="55" align="center" :reserve-selection="true" />

                    <!-- Mã vận đơn -->
                    <el-table-column prop="waybill_code" label="Mã vận đơn" min-width="240">
                      <template #default="{ row }">
                        <div class="code-link" @click="viewTracking(row.waybill_code)" title="Xem hành trình" style="display: flex; flex-direction: column; align-items: flex-start; gap: 2px;">
                          <span class="fw-bold">{{ row.waybill_code }}</span>
                          <el-tag v-if="row.verify_status !== 'VERIFIED'" type="danger" size="small" effect="dark" class="verify-badge animate-pulse" style="font-size: 9px; font-weight: 700; border-radius: 4px; padding: 1px 4px; border: none;">
                            ⚠️ CHƯA DUYỆT
                          </el-tag>
                          <el-tag v-else type="success" size="small" effect="plain" class="verify-badge" style="font-size: 9px; font-weight: 600; border-radius: 4px; padding: 1px 4px;">
                            ✓ ĐÃ DUYỆT
                          </el-tag>
                        </div>
                      </template>
                    </el-table-column>

                    <!-- Dịch vụ chuyển -->
                    <el-table-column label="Dịch vụ" min-width="140" align="center">
                      <template #default="{ row }">
                        <el-tag v-if="row.service_type && (row.service_type.toUpperCase() === 'EXPRESS' || row.service_type.toUpperCase() === 'HT')" size="small" effect="dark" style="background-color: #ff4d4f !important; color: white !important; font-weight: 800; border: none; box-shadow: 0 0 8px rgba(255, 77, 79, 0.8); padding: 2px 8px;">
                          🔥 HỎA TỐC
                        </el-tag>
                        <el-tag v-else-if="row.service_type && (row.service_type.toUpperCase() === 'STANDARD' || row.service_type.toUpperCase() === 'CPN')" type="primary" size="small" effect="plain">
                          CPN (Nhanh)
                        </el-tag>
                        <el-tag v-else-if="row.service_type && (row.service_type.toUpperCase() === 'TK' || row.service_type.toUpperCase() === 'ECONOMY')" type="info" size="small" effect="plain">
                          Tiết kiệm
                        </el-tag>
                        <el-tag v-else type="info" size="small" effect="plain">
                          {{ row.service_type || 'Tiết kiệm' }}
                        </el-tag>
                      </template>
                    </el-table-column>

                    <!-- Người nhận -->
                    <el-table-column label="Người nhận" min-width="240">
                      <template #default="{ row }">
                        <div style="display: flex; flex-direction: column; gap: 2px;">
                          <span class="fw-bold text-dark">{{ row.receiver_name }}</span>
                          <span style="font-size: 11px; color: #475569;"><el-icon><Phone /></el-icon> {{ row.receiver_phone }}</span>
                          <span style="font-size: 11px; color: #64748b; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" :title="row.receiver_address">
                            <el-icon><Location /></el-icon> {{ row.receiver_address }}
                          </span>
                          <span v-if="row.old_province" style="font-size: 10px; color: #d97706; font-weight: 600; display: inline-flex; align-items: center; gap: 4px; margin-top: 2px;">
                            <el-icon><RefreshRight /></el-icon> Tỉnh cũ: {{ row.old_province }}
                          </span>
                        </div>
                      </template>
                    </el-table-column>

                    <!-- Phòng ban -->
                    <el-table-column label="Phòng ban" min-width="150">
                      <template #default="{ row }">
                        <el-tag v-if="row.customer_department_name" type="info" effect="light" class="fw-semibold">
                          {{ row.customer_department_name }}
                        </el-tag>
                        <span v-else style="color: #94a3b8; font-style: italic;">---</span>
                      </template>
                    </el-table-column>

                    <!-- Người gửi -->
                    <el-table-column label="Người gửi" min-width="200">
                      <template #default="{ row }">
                        <div v-if="row.sender_name" style="display: flex; flex-direction: column; gap: 2px; font-size: 12px;">
                          <span class="fw-bold text-dark">{{ row.sender_name }}</span>
                          <span style="font-size: 11px; color: #64748b;"><el-icon><Phone /></el-icon> {{ row.sender_phone }}</span>
                          <span style="font-size: 11px; color: #94a3b8; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" :title="row.sender_address">
                            <el-icon><Location /></el-icon> {{ row.sender_address }}
                          </span>
                        </div>
                        <span v-else style="color: #94a3b8; font-style: italic;">Mặc định</span>
                      </template>
                    </el-table-column>

                    <!-- Trạng thái -->
                    <el-table-column prop="status" label="Trạng thái" min-width="130" align="center">
                      <template #default="{ row }">
                        <div class="modern-tag" :class="getStatusClass(row.status)">
                          <span class="dot"></span>
                          {{ getStatusLabel(row.status) }}
                        </div>
                      </template>
                    </el-table-column>

                    <!-- SLA & Đơn vị giữ -->
                    <el-table-column label="SLA & Đang giữ" min-width="150">
                      <template #default="{ row }">
                        <div style="display: flex; flex-direction: column; gap: 2px;">
                          <!-- Cảnh báo Trễ hạn -->
                          <el-tag v-if="row.sla_status === 'OVERDUE'" type="danger" size="small" effect="dark" style="width: fit-content; background-color: #f5222d !important; color: white !important; font-weight: bold; border: none; margin-bottom: 2px; animation: pulse 1s infinite alternate;">
                            ⚠️ TRỄ HẠN
                          </el-tag>
                          <el-tag v-else :type="row.sla_status === 'WARNING' ? 'warning' : 'success'" size="small" effect="dark" style="width: fit-content;">
                            {{ getSlaStatusLabel(row.sla_status) }}
                          </el-tag>
                          <span style="font-size: 11px; color: #64748b;">
                            <b>Giữ:</b> {{ row.holding_hub?.hub_name || row.holding_shipper?.full_name || '---' }}
                          </span>
                        </div>
                      </template>
                    </el-table-column>

                    <!-- Chi tiết hàng -->
                    <el-table-column label="Chi tiết hàng" min-width="140">
                      <template #default="{ row }">
                        <div style="font-size: 12px; color: #334155; line-height: 1.4;">
                          <div><b>Trọng lượng:</b> {{ row.actual_weight }} kg</div>
                          <div v-if="row.length"><b>Kích thước:</b> {{ row.length }}x{{ row.width }}x{{ row.height }}</div>
                        </div>
                      </template>
                    </el-table-column>

                    <!-- Tài chính -->
                    <el-table-column label="Tài chính (VNĐ)" min-width="220" align="right">
                      <template #default="{ row }">
                        <div class="finance-display" style="font-size: 12px; display: flex; flex-direction: column; gap: 2px;">
                          <div class="finance-line">
                            <span class="label" style="color: #64748b;">Cước: </span>
                            <span class="value text-primary fw-bold">{{ formatCurrencyManual(row.shipping_fee || 0) }}</span>
                          </div>
                          <div class="finance-line" v-if="row.cod_amount > 0">
                            <span class="label" style="color: #64748b;">Thu hộ (COD): </span>
                            <span class="value text-warning fw-bold">{{ formatCurrencyManual(row.cod_amount) }}</span>
                          </div>
                          <div class="finance-line" style="border-top: 1px dashed #e2e8f0; margin-top: 2px; padding-top: 2px;">
                            <span class="label" style="color: #64748b;">Tổng thu: </span>
                            <span class="value text-danger fw-bold">{{ formatCurrencyManual(row.total_amount_to_collect || (row.cod_amount + (row.payment_method === 'RECEIVER_PAY' ? row.shipping_fee : 0))) }}</span>
                          </div>
                          <div style="font-size: 10px; color: #475569; margin-top: 2px;">
                            <span style="background: #f1f5f9; padding: 2px 6px; border-radius: 4px; font-weight: 600;">
                              {{ row.payment_method === 'SENDER_DEBT' ? 'Công nợ shop' : row.payment_method === 'RECEIVER_PAY' ? 'Thu cước người nhận' : row.payment_method === 'SENDER_PAY' ? 'Shop trả trước' : row.payment_method || '---' }}
                            </span>
                          </div>
                        </div>
                      </template>
                    </el-table-column>

                    <!-- Thao tác -->
                    <el-table-column label="Thao tác" min-width="140" align="center">
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
                  </el-table>
                  <div style="margin-top: 12px; display: flex; justify-content: flex-end;">
                    <el-pagination
                      v-if="(customerWaybills[customer.customer_id] || []).length > 0"
                      v-model:current-page="innerCurrentPage[customer.customer_id]"
                      :page-size="10"
                      layout="total, prev, pager, next"
                      :total="(customerWaybills[customer.customer_id] || []).length"
                    />
                  </div>
                </div>
              </template>
            </el-table-column>

            <!-- Customer Columns -->
            <el-table-column prop="customer_code" label="Mã Khách Hàng" min-width="150">
              <template #default="{ row }">
                <span class="fw-bold text-dark">{{ row.customer_code }}</span>
              </template>
            </el-table-column>
            
            <el-table-column prop="company_name" label="Tên Shop / Doanh nghiệp" min-width="250">
              <template #default="{ row }">
                <span class="fw-bold">{{ row.company_name || row.name }}</span>
              </template>
            </el-table-column>

            <el-table-column prop="phone" label="Số điện thoại" min-width="150" />
            
            <el-table-column prop="address" label="Địa chỉ" min-width="300" show-overflow-tooltip />

            <el-table-column prop="staff_in_charge_name" label="CSKH Quản lý" min-width="180">
              <template #default="{ row }">
                <el-tag v-if="row.staff_in_charge_name" type="success" effect="light">
                  {{ row.staff_in_charge_name }}
                </el-tag>
                <span v-else style="color: #94a3b8; font-style: italic;">Chưa gán</span>
              </template>
            </el-table-column>

            <template #empty>
              <el-empty description="Không tìm thấy khách hàng nào phù hợp" :image-size="100" />
            </template>
          </el-table>

          <!-- Bảng phẳng dành cho CSKH và các Role khác (Hiển thị Vận đơn trực tiếp) -->
          <el-table 
            v-if="!isAdmin"
            :data="flatWaybills" 
            v-loading="loading" 
            class="modern-table"
            style="width: 100%;"
            row-key="waybill_code"
            :row-class-name="tableRowClassName"
            @selection-change="handleFlatSelectionChange"
          >
            <!-- Checkbox -->
            <el-table-column type="selection" width="55" align="center" :reserve-selection="true" />

            <!-- Mã vận đơn -->
            <el-table-column prop="waybill_code" label="Mã vận đơn" min-width="220">
              <template #default="{ row }">
                <div class="code-link" @click="viewTracking(row.waybill_code)" title="Xem hành trình" style="display: flex; flex-direction: column; align-items: flex-start; gap: 2px;">
                  <span class="fw-bold">{{ row.waybill_code }}</span>
                  <el-tag v-if="row.verify_status !== 'VERIFIED'" type="danger" size="small" effect="dark" class="verify-badge animate-pulse" style="font-size: 9px; font-weight: 700; border-radius: 4px; padding: 1px 4px; border: none;">
                    ⚠️ CHƯA DUYỆT
                  </el-tag>
                  <el-tag v-else type="success" size="small" effect="plain" class="verify-badge" style="font-size: 9px; font-weight: 600; border-radius: 4px; padding: 1px 4px;">
                    ✓ ĐÃ DUYỆT
                  </el-tag>
                </div>
              </template>
            </el-table-column>

            <!-- Dịch vụ chuyển -->
            <el-table-column label="Dịch vụ" min-width="140" align="center">
              <template #default="{ row }">
                <el-tag v-if="row.service_type && (row.service_type.toUpperCase() === 'EXPRESS' || row.service_type.toUpperCase() === 'HT')" size="small" effect="dark" style="background-color: #ff4d4f !important; color: white !important; font-weight: 800; border: none; box-shadow: 0 0 8px rgba(255, 77, 79, 0.8); padding: 2px 8px;">
                  🔥 HỎA TỐC
                </el-tag>
                <el-tag v-else-if="row.service_type && (row.service_type.toUpperCase() === 'STANDARD' || row.service_type.toUpperCase() === 'CPN')" type="primary" size="small" effect="plain">
                  CPN (Nhanh)
                </el-tag>
                <el-tag v-else-if="row.service_type && (row.service_type.toUpperCase() === 'TK' || row.service_type.toUpperCase() === 'ECONOMY')" type="info" size="small" effect="plain">
                  Tiết kiệm
                </el-tag>
                <el-tag v-else type="info" size="small" effect="plain">
                  {{ row.service_type || 'Tiết kiệm' }}
                </el-tag>
              </template>
            </el-table-column>

            <!-- Khách hàng -->
            <el-table-column label="Khách hàng" min-width="220">
              <template #default="{ row }">
                <div style="font-size: 12px; line-height: 1.4; display: flex; flex-direction: column; gap: 2px;">
                  <div class="fw-bold text-dark">{{ row.customer_name || '---' }}</div>
                  <div style="color: #64748b;">Mã KH: <b>{{ row.customer_code || '---' }}</b></div>
                  <div v-if="row.customer_department_name" style="margin-top: 2px;">
                    <el-tag type="info" size="small" effect="light" class="fw-semibold">
                      PB: {{ row.customer_department_name }}
                    </el-tag>
                  </div>
                </div>
              </template>
            </el-table-column>

            <!-- Người nhận -->
            <el-table-column label="Người nhận" min-width="240">
              <template #default="{ row }">
                <div style="display: flex; flex-direction: column; gap: 2px;">
                  <span class="fw-bold text-dark">{{ row.receiver_name }}</span>
                  <span style="font-size: 11px; color: #475569;"><el-icon><Phone /></el-icon> {{ row.receiver_phone }}</span>
                  <span style="font-size: 11px; color: #64748b; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" :title="row.receiver_address">
                    <el-icon><Location /></el-icon> {{ row.receiver_address }}
                  </span>
                  <span v-if="row.old_province" style="font-size: 10px; color: #d97706; font-weight: 600; display: inline-flex; align-items: center; gap: 4px; margin-top: 2px;">
                    <el-icon><RefreshRight /></el-icon> Tỉnh cũ: {{ row.old_province }}
                  </span>
                </div>
              </template>
            </el-table-column>

            <!-- Người gửi -->
            <el-table-column label="Người gửi" min-width="200">
              <template #default="{ row }">
                <div v-if="row.sender_name" style="display: flex; flex-direction: column; gap: 2px; font-size: 12px;">
                  <span class="fw-bold text-dark">{{ row.sender_name }}</span>
                  <span style="font-size: 11px; color: #64748b;"><el-icon><Phone /></el-icon> {{ row.sender_phone }}</span>
                  <span style="font-size: 11px; color: #94a3b8; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" :title="row.sender_address">
                    <el-icon><Location /></el-icon> {{ row.sender_address }}
                  </span>
                </div>
                <span v-else style="color: #94a3b8; font-style: italic;">Mặc định</span>
              </template>
            </el-table-column>

            <!-- Trạng thái -->
            <el-table-column prop="status" label="Trạng thái" min-width="130" align="center">
              <template #default="{ row }">
                <div class="modern-tag" :class="getStatusClass(row.status)">
                  <span class="dot"></span>
                  {{ getStatusLabel(row.status) }}
                </div>
              </template>
            </el-table-column>

            <!-- SLA & Đơn vị giữ -->
            <el-table-column label="SLA & Đang giữ" min-width="150">
              <template #default="{ row }">
                <div style="display: flex; flex-direction: column; gap: 2px;">
                  <!-- Cảnh báo Trễ hạn -->
                  <el-tag v-if="row.sla_status === 'OVERDUE'" type="danger" size="small" effect="dark" style="width: fit-content; background-color: #f5222d !important; color: white !important; font-weight: bold; border: none; margin-bottom: 2px; animation: pulse 1s infinite alternate;">
                    ⚠️ TRỄ HẠN
                  </el-tag>
                  <el-tag v-else :type="row.sla_status === 'OVERDUE' ? 'danger' : row.sla_status === 'WARNING' ? 'warning' : 'success'" size="small" effect="dark" style="width: fit-content;">
                    {{ getSlaStatusLabel(row.sla_status) }}
                  </el-tag>
                  <span style="font-size: 11px; color: #64748b;">
                    <b>Giữ:</b> {{ row.holding_hub?.hub_name || row.holding_shipper?.full_name || '---' }}
                  </span>
                </div>
              </template>
            </el-table-column>

            <!-- Chi tiết hàng -->
            <el-table-column label="Chi tiết hàng" min-width="140">
              <template #default="{ row }">
                <div style="font-size: 12px; color: #334155; line-height: 1.4;">
                  <div><b>Trọng lượng:</b> {{ row.actual_weight }} kg</div>
                  <div v-if="row.length"><b>Kích thước:</b> {{ row.length }}x{{ row.width }}x{{ row.height }}</div>
                </div>
              </template>
            </el-table-column>

            <!-- Tài chính -->
            <el-table-column label="Tài chính (VNĐ)" min-width="220" align="right">
              <template #default="{ row }">
                <div class="finance-display" style="font-size: 12px; display: flex; flex-direction: column; gap: 2px;">
                  <div class="finance-line">
                    <span class="label" style="color: #64748b;">Cước: </span>
                    <span class="value text-primary fw-bold">{{ formatCurrencyManual(row.shipping_fee || 0) }}</span>
                  </div>
                  <div class="finance-line" v-if="row.cod_amount > 0">
                    <span class="label" style="color: #64748b;">Thu hộ (COD): </span>
                    <span class="value text-warning fw-bold">{{ formatCurrencyManual(row.cod_amount) }}</span>
                  </div>
                  <div class="finance-line" style="border-top: 1px dashed #e2e8f0; margin-top: 2px; padding-top: 2px;">
                    <span class="label" style="color: #64748b;">Tổng thu: </span>
                    <span class="value text-danger fw-bold">{{ formatCurrencyManual(row.total_amount_to_collect || (row.cod_amount + (row.payment_method === 'RECEIVER_PAY' ? row.shipping_fee : 0))) }}</span>
                  </div>
                  <div style="font-size: 10px; color: #475569; margin-top: 2px;">
                    <span style="background: #f1f5f9; padding: 2px 6px; border-radius: 4px; font-weight: 600;">
                      {{ row.payment_method === 'SENDER_DEBT' ? 'Công nợ shop' : row.payment_method === 'RECEIVER_PAY' ? 'Thu cước người nhận' : row.payment_method === 'SENDER_PAY' ? 'Shop trả trước' : row.payment_method || '---' }}
                    </span>
                  </div>
                </div>
              </template>
            </el-table-column>

            <!-- Thao tác -->
            <el-table-column label="Thao tác" min-width="140" align="center">
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
        </div>

        <!-- Phân trang -->
        <div class="pagination-wrapper mt-24 flex-between">
          <span class="pagination-info" v-if="isAdmin">Hiển thị {{ paginatedCustomers.length }} / {{ displayCustomers.length }} khách hàng</span>
          <span class="pagination-info" v-else>Tổng số vận đơn hiển thị: {{ total }}</span>
          
          <el-pagination
            v-model:current-page="currentPage"
            v-model:page-size="pageSize"
            :page-sizes="[10, 20, 50, 100]"
            layout="total, sizes, prev, pager, next, jumper"
            :total="isAdmin ? displayCustomers.length : total"
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
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
        
        <!-- Thông tin địa chỉ gửi/nhận và Tỉnh cũ -->
        <div v-if="selectedWaybill" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px; margin-bottom: 20px; font-size: 13px;">
          <div style="margin-bottom: 8px; display: flex; flex-direction: column; gap: 4px;">
            <div><b style="color: #475569;">Người nhận:</b> {{ selectedWaybill.receiver_name }} ({{ selectedWaybill.receiver_phone }})</div>
            <div style="color: #64748b; display: flex; align-items: center; gap: 4px;">
              <el-icon><Location /></el-icon> <span>{{ selectedWaybill.receiver_address }}</span>
            </div>
            <div v-if="selectedWaybill.old_province" style="color: #d97706; font-weight: 600; font-size: 12px; display: inline-flex; align-items: center; gap: 4px; margin-top: 2px;">
              <el-icon><RefreshRight /></el-icon> <span>Tỉnh cũ trước sáp nhập: {{ selectedWaybill.old_province }}</span>
            </div>
          </div>
          <div style="border-top: 1px dashed #cbd5e1; padding-top: 8px; display: flex; flex-direction: column; gap: 4px;">
            <div><b style="color: #475569;">Người gửi:</b> {{ selectedWaybill.sender_name || 'Khách hàng liên kết' }} ({{ selectedWaybill.sender_phone }})</div>
            <div style="color: #64748b; display: flex; align-items: center; gap: 4px;">
              <el-icon><Location /></el-icon> <span>{{ selectedWaybill.sender_address }}</span>
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
                <!-- Gallery ảnh lấy hàng (pickup) - tối đa 5 ảnh -->
                <div v-if="getPickupImages(activity).length > 0" class="pickup-proof">
                  <span class="pickup-proof-label">Ảnh xác nhận pickup ({{ getPickupImages(activity).length }} ảnh)</span>
                  <div class="pickup-proof-gallery">
                    <el-image
                      v-for="(imgUrl, imgIdx) in getPickupImages(activity)"
                      :key="'pickup-' + imgIdx"
                      class="pickup-proof-image"
                      :src="resolveMediaUrl(imgUrl)"
                      :preview-src-list="getPickupImages(activity).map(u => resolveMediaUrl(u))"
                      :initial-index="imgIdx"
                      fit="cover"
                      preview-teleported
                    />
                  </div>
                </div>
                <!-- Gallery ảnh giao hàng (POD) - tối đa 5 ảnh -->
                <div v-if="getPodImages(activity).length > 0" class="pickup-proof">
                  <span class="pickup-proof-label">Ảnh xác nhận giao hàng (POD) ({{ getPodImages(activity).length }} ảnh)</span>
                  <div class="pickup-proof-gallery">
                    <el-image
                      v-for="(imgUrl, imgIdx) in getPodImages(activity)"
                      :key="'pod-' + imgIdx"
                      class="pickup-proof-image"
                      :src="resolveMediaUrl(imgUrl)"
                      :preview-src-list="getPodImages(activity).map(u => resolveMediaUrl(u))"
                      :initial-index="imgIdx"
                      fit="cover"
                      preview-teleported
                    />
                  </div>
                </div>
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
              <span>Thông tin Thu hộ & Loại hàng</span>
            </div>
            <el-row :gutter="24">
              <el-col :span="12">
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
              </el-col>
              <el-col :span="12">
                <el-form-item :label="editForm.product_group === 'HIGH_VALUE' ? 'Giá trị khai giá (đ) *' : 'Giá trị khai giá (đ)'" :required="editForm.product_group === 'HIGH_VALUE'">
                  <el-input-number 
                    v-model="editForm.declared_value" 
                    :min="0" :step="10000" 
                    class="w-full modern-price-input"
                    :controls="false"
                    :formatter="(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')"
                    :parser="(value) => value.replace(/\$\s?|(\.*)/g, '')"
                  />
                </el-form-item>
              </el-col>
            </el-row>
            <el-form-item label="Nhóm sản phẩm" class="mb-12">
              <el-select v-model="editForm.product_group" placeholder="Chọn loại hàng..." class="w-full">
                <el-option v-for="pt in productTypes" :key="pt.code" :label="pt.label" :value="pt.code" />
              </el-select>
            </el-form-item>

            <!-- Warning & Special handling info -->
            <div v-if="getProductTypeInfo(editForm.product_group)?.special_handling" class="special-handling-note mb-12" style="font-size: 12px; display: flex; align-items: flex-start; gap: 6px; padding: 6px 10px; background-color: #fdf6ec; border-radius: 6px; border-left: 4px solid #e6a23c; line-height: 1.4; color: #d97706; margin-top: 8px;">
              <el-icon class="mt-2" style="font-size: 14px;"><Warning /></el-icon>
              <div>
                <strong>{{ getProductTypeInfo(editForm.product_group)?.label }}:</strong> {{ getProductTypeInfo(editForm.product_group)?.handling_note }}
                <span v-if="getProductTypeInfo(editForm.product_group)?.packing_recommended" style="color: #2563eb; font-weight: bold; margin-left: 4px;">
                  (Khuyến nghị đóng bọc chống va đập/đổ vỡ)
                </span>
              </div>
            </div>
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

      <!-- Import Excel Dialog -->
      <el-dialog
        v-model="importDialogVisible"
        title="Nhập Excel tạo đơn hàng loạt"
        width="540px"
        class="modern-dialog"
        destroy-on-close
      >
        <div class="import-excel-container" style="padding: 10px 0;">
          <div class="template-download-section mb-16" style="padding: 12px; background: #f0f7ff; border-radius: 8px; border: 1px solid #d0e7ff; margin-bottom: 16px;">
            <p style="margin: 0; font-size: 13px; color: #1e3a8a; line-height: 1.6;">
              Tải mẫu file Excel hoặc chuẩn bị file của bạn với các cột bắt buộc: 
              <b>Họ tên, Số điện thoại, Địa chỉ nhận hàng, Khối lượng (kg)</b>. 
              Các cột tự chọn khác: <i>COD, Dịch vụ, Tên hàng, Ghi chú, Dài, Rộng, Cao, Mã KH, Mã bưu cục nhận</i>.
            </p>
            <div style="margin-top: 8px; text-align: right;">
              <el-link type="primary" :underline="false" @click="downloadTemplate" style="font-size: 13px; font-weight: 600;">
                <el-icon class="mr-4"><Download /></el-icon> Tải File Mẫu (.csv)
              </el-link>
            </div>
          </div>

          <el-form label-position="top">
            <el-form-item label="Chọn Khách hàng mặc định">
              <el-select v-model="importCustomerId" placeholder="Chọn Khách hàng / Shop..." clearable filterable class="w-full">
                <el-option 
                  v-for="c in customers" 
                  :key="c.customer_id" 
                  :label="c.company_name ? `${c.customer_code} - ${c.company_name}` : `${c.customer_code} - ${c.name}`" 
                  :value="c.customer_id" 
                />
              </el-select>
              <div style="font-size: 12px; color: #6b7280; margin-top: 4px;">
                Mặc định áp dụng nếu trong file Excel không điền cột "Mã Khách Hàng".
              </div>
            </el-form-item>

            <el-form-item label="Chọn File Excel / CSV">
              <el-upload
                class="excel-uploader"
                drag
                action=""
                :auto-upload="false"
                :on-change="handleFileChange"
                :limit="1"
                :on-exceed="handleExceed"
                accept=".xlsx, .xls, .csv"
                ref="uploadRef"
              >
                <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
                <div class="el-upload__text">
                  Kéo thả file Excel/CSV vào đây hoặc <em>nhấp để tải lên</em>
                </div>
                <template #tip>
                  <div class="el-upload__tip" style="color: #909399;">
                    Hỗ trợ định dạng .xlsx, .xls, .csv.
                  </div>
                </template>
              </el-upload>
            </el-form-item>
          </el-form>

          <!-- Import Summary Result -->
          <div v-if="importResult" class="import-result-section mt-16" style="margin-top: 16px; padding: 12px; border-radius: 8px; background: #f8fafc; border: 1px solid #e2e8f0;">
            <h4 style="margin: 0 0 8px 0; font-size: 14px; display: flex; align-items: center; justify-content: space-between;">
              <span>Kết quả Import:</span>
              <el-tag :type="importResult.status === 'success' ? 'success' : 'danger'" size="small">
                {{ importResult.status === 'success' ? 'Hoàn tất' : 'Có lỗi xảy ra' }}
              </el-tag>
            </h4>
            <div style="font-size: 13px; line-height: 1.8;">
              <div>🟢 Tạo thành công: <strong style="color: #10b981;">{{ importResult.imported_count }} đơn</strong></div>
              <div>🔴 Thất bại: <strong style="color: #ef4444;">{{ importResult.failed_count }} dòng</strong></div>
            </div>
            
            <div v-if="importResult.errors && importResult.errors.length > 0" class="error-list" style="margin-top: 8px; max-height: 150px; overflow-y: auto; padding: 8px; background: #fff5f5; border-radius: 6px; border: 1px solid #fed7d7;">
              <div v-for="err in importResult.errors" :key="err.row" style="font-size: 12px; color: #c53030; margin-bottom: 4px;">
                Dòng {{ err.row }}: {{ err.error }}
              </div>
            </div>
          </div>
        </div>

        <template #footer>
          <button class="btn-secondary mr-2" @click="importDialogVisible = false">Đóng</button>
          <button 
            class="btn-primary" 
            @click="submitImport" 
            :disabled="!selectedFile || importSubmitting"
          >
            <el-icon class="is-loading mr-2" v-if="importSubmitting"><Loading /></el-icon>
            <el-icon v-else><Upload /></el-icon>
            <span>Bắt đầu Tải lên</span>
          </button>
        </template>
      </el-dialog>

      <!-- Update Excel Dialog -->
      <el-dialog
        v-model="updateDialogVisible"
        title="Cập nhật Vận đơn hàng loạt qua Excel"
        width="540px"
        class="modern-dialog"
        destroy-on-close
      >
        <div class="import-excel-container" style="padding: 10px 0;">
          <div class="template-download-section mb-16" style="padding: 12px; background: #fffbeb; border-radius: 8px; border: 1px solid #fef3c7; margin-bottom: 16px;">
            <p style="margin: 0; font-size: 13px; color: #b45309; line-height: 1.6;">
              Tải lên file Excel chứa cột <b>Mã Vận Đơn</b> và các cột cần cập nhật (như <b>Khối lượng (kg), COD, Dịch vụ, Dài, Rộng, Cao, Ghi chú</b>). 
              <br><i>Lưu ý: Tên và địa chỉ người nhận sẽ không được thay đổi để đảm bảo tính an toàn dữ liệu.</i>
            </p>
          </div>

          <el-form label-position="top">
            <el-form-item label="Chọn File Excel / CSV đã chỉnh sửa">
              <el-upload
                class="excel-uploader"
                drag
                action=""
                :auto-upload="false"
                :on-change="handleUpdateFileChange"
                :limit="1"
                :on-exceed="handleUpdateExceed"
                accept=".xlsx, .xls, .csv"
                ref="updateUploadRef"
              >
                <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
                <div class="el-upload__text">
                  Kéo thả file Excel/CSV vào đây hoặc <em>nhấp để tải lên</em>
                </div>
              </el-upload>
            </el-form-item>
          </el-form>

          <!-- Update Summary Result -->
          <div v-if="updateResult" class="import-result-section mt-16" style="margin-top: 16px; padding: 12px; border-radius: 8px; background: #f8fafc; border: 1px solid #e2e8f0;">
            <h4 style="margin: 0 0 8px 0; font-size: 14px; display: flex; align-items: center; justify-content: space-between;">
              <span>Kết quả Cập nhật:</span>
              <el-tag :type="updateResult.status === 'success' ? 'success' : 'danger'" size="small">
                {{ updateResult.status === 'success' ? 'Hoàn tất' : 'Có lỗi xảy ra' }}
              </el-tag>
            </h4>
            <div style="font-size: 13px; line-height: 1.8;">
              <div>🟢 Cập nhật thành công: <strong style="color: #10b981;">{{ updateResult.imported_count }} đơn</strong></div>
              <div>🔴 Thất bại: <strong style="color: #ef4444;">{{ updateResult.failed_count }} dòng</strong></div>
            </div>
            
            <div v-if="updateResult.errors && updateResult.errors.length > 0" class="error-list" style="margin-top: 8px; max-height: 150px; overflow-y: auto; padding: 8px; background: #fff5f5; border-radius: 6px; border: 1px solid #fed7d7;">
              <div v-for="err in updateResult.errors" :key="err.row" style="font-size: 12px; color: #c53030; margin-bottom: 4px;">
                Dòng {{ err.row }}: {{ err.error }}
              </div>
            </div>
          </div>
        </div>

        <template #footer>
          <button class="btn-secondary mr-2" @click="updateDialogVisible = false">Đóng</button>
          <button 
            class="btn-primary" 
            @click="submitUpdateExcel" 
            :disabled="!selectedUpdateFile || updateSubmitting"
          >
            <el-icon class="is-loading mr-2" v-if="updateSubmitting"><Loading /></el-icon>
            <el-icon v-else><Upload /></el-icon>
            <span>Bắt đầu Cập nhật</span>
          </button>
        </template>
      </el-dialog>

    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRoute } from 'vue-router';
import { 
  Search, Plus, Printer, Download, MoreFilled, Check, Edit, Delete, 
  Location, LocationInformation, Tickets, RefreshRight, Van, User, 
  Phone, Right, Loading, UserFilled, Money, Warning, Position, Upload, UploadFilled
} from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import api from '@/api/axios';
import { getMediaUrl as resolveMediaUrl } from '@/utils/mediaUrl';
import { getPickupImages, getPodImages } from '@/utils/imageHelpers';
import moment from 'moment';
import { useAuthStore } from '@/stores/auth';

const route = useRoute();
const auth = useAuthStore();
const customers = ref([]);
const displayCustomers = ref([]);
const customerWaybills = ref({});
const customerWaybillsLoading = ref({});
const activeWaybillSelection = ref({});
const flatWaybills = ref([]);

const isAdmin = computed(() => auth.user?.role_id === 1);
const isCSKH = computed(() => auth.user?.role_id === 7);

const loading = ref(false);
const searchQuery = ref('');
const statusFilter = ref('');
const serviceTypeFilter = ref('');
const slaStatusFilter = ref('');

const slaStats = ref({ total: 0, on_time: 0, warning: 0, overdue: 0 });
const transferDialogVisible = ref(false);
const transferSubmitting = ref(false);
const transferForm = ref({ waybill_code: '', target_type: 'HUB', target_id: null, reason: '' });

const productTypes = ref([
  { code: 'DOCUMENT', label: 'Thư từ/Tài liệu', special_handling: false, requires_declared_value: false, packing_recommended: false, handling_note: 'Dùng cho thư từ, hồ sơ và tài liệu giấy.' },
  { code: 'PARCEL', label: 'Bưu phẩm, bưu kiện', special_handling: false, requires_declared_value: false, packing_recommended: false, handling_note: 'Dùng cho bưu phẩm và bưu kiện thông thường.' },
  { code: 'GENERAL', label: 'Hàng hóa thông thường', special_handling: false, requires_declared_value: false, packing_recommended: false, handling_note: 'Hàng hóa không thuộc nhóm cần xử lý đặc biệt.' },
  { code: 'LIQUID', label: 'Chất lỏng', special_handling: true, requires_declared_value: false, packing_recommended: true, handling_note: 'Cần bao gói chống rò rỉ và kiểm tra điều kiện vận chuyển.' },
  { code: 'ELECTRONIC', label: 'Điện tử', special_handling: true, requires_declared_value: false, packing_recommended: true, handling_note: 'Cần chống va đập; khai báo pin hoặc linh kiện hạn chế nếu có.' },
  { code: 'FOOD', label: 'Thực phẩm', special_handling: true, requires_declared_value: false, packing_recommended: true, handling_note: 'Cần khai báo điều kiện bảo quản và hạn sử dụng phù hợp.' },
  { code: 'HIGH_VALUE', label: 'Giá trị cao', special_handling: true, requires_declared_value: true, packing_recommended: true, handling_note: 'Bắt buộc khai giá lớn hơn 0 để kiểm soát và bảo hiểm hàng hóa.' }
]);

const fetchProductTypes = async () => {
  try {
    const res = await api.get('/api/waybills/product-types');
    if (res.data && res.data.items) {
      productTypes.value = res.data.items;
    }
  } catch (err) {
    console.error('Không thể tải danh sách loại hàng', err);
  }
};

const getProductTypeInfo = (code) => {
  return productTypes.value.find(pt => pt.code === code) || null;
};

// --- IMPORT EXCEL STATE ---
const importDialogVisible = ref(false);
const importSubmitting = ref(false);
const importCustomerId = ref(null);
const selectedFile = ref(null);
const importResult = ref(null);
const uploadRef = ref(null);

const openImportDialog = () => {
  importDialogVisible.value = true;
  importResult.value = null;
  selectedFile.value = null;
  importCustomerId.value = null;
  if (uploadRef.value) {
    uploadRef.value.clearFiles();
  }
};

const handleFileChange = (file) => {
  selectedFile.value = file.raw;
  importResult.value = null;
};

const handleExceed = (files) => {
  if (uploadRef.value) {
    uploadRef.value.clearFiles();
    const file = files[0];
    uploadRef.value.handleStart(file);
    selectedFile.value = file;
  }
};

const downloadTemplate = () => {
  const headers = "Họ tên,Số điện thoại,Địa chỉ nhận hàng,Khối lượng (kg),COD,Dịch vụ,Tên hàng,Ghi chú,Dài,Rộng,Cao,Mã Khách Hàng,Mã bưu cục nhận\n";
  const row1 = "Nguyen Van A,0987654321,123 Duong Le Loi Phuong 1 Quan 1 TpHCM,1.5,150000,CPN,Ao thun nam size L,Cho xem hang khong cho thu,30,20,15,KH0001,K01\n";
  const row2 = "Tran Thi B,0912345678,456 Duong Nguyen Hue Quan Hoa Kiem Ha Noi,0.8,0,TK,Sach giao khoa Lop 12,Giao gio hanh chinh,20,15,5,KH0002,K02\n";
  
  const BOM = "\uFEFF";
  const csvContent = BOM + headers + row1 + row2;
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", "Mau_Import_Van_Don.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  ElMessage.success("Đã tải mẫu file CSV import thành công (Mở tốt trong Excel)!");
};

const submitImport = async () => {
  if (!selectedFile.value) {
    ElMessage.warning('Vui lòng chọn file Excel trước');
    return;
  }
  
  importSubmitting.value = true;
  importResult.value = null;
  
  const formData = new FormData();
  formData.append('file', selectedFile.value);
  if (importCustomerId.value) {
    formData.append('customer_id', importCustomerId.value);
  }
  
  try {
    const response = await api.post('/api/waybills/import-excel', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    
    importResult.value = response.data;
    if (response.data.failed_count === 0) {
      ElMessage.success(`Nhập Excel thành công: Đã tạo ${response.data.imported_count} đơn hàng!`);
      importDialogVisible.value = false;
      handleSearch();
      fetchSLAStats();
    } else if (response.data.imported_count > 0) {
      ElMessage.warning(`Import hoàn tất một phần: Thành công ${response.data.imported_count} đơn, thất bại ${response.data.failed_count} dòng.`);
      handleSearch();
      fetchSLAStats();
    } else {
      ElMessage.error(`Import thất bại hoàn toàn! ${response.data.failed_count} dòng có lỗi.`);
    }
  } catch (err) {
    console.error(err);
    const detail = err.response?.data?.detail || 'Lỗi hệ thống khi tải file lên';
    ElMessage.error(`Lỗi import: ${detail}`);
  } finally {
    importSubmitting.value = false;
  }
};

const dateRange = ref([]);
const waybills = ref([]);
const total = ref(0);
const currentPage = ref(1);
const pageSize = ref(10);
const innerCurrentPage = ref({});

const paginatedCustomers = computed(() => {
  if (!isAdmin.value) return [];
  const start = (currentPage.value - 1) * pageSize.value;
  const end = start + pageSize.value;
  return displayCustomers.value.slice(start, end);
});

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
  cod_amount: 0,
  product_group: 'PARCEL',
  declared_value: 0
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
    const customerParams = {};
    if (auth.user?.role_id === 7) {
      customerParams.mine = true;
    }
    const [hubsRes, usersRes, customersRes] = await Promise.all([
      api.get('/api/hubs').catch(() => ({ data: [] })),
      api.get('/api/users').catch(() => ({ data: [] })),
      api.get('/api/customers', { params: customerParams }).catch(() => ({ data: [] }))
    ]);
    hubs.value = Array.isArray(hubsRes.data) ? hubsRes.data : (hubsRes.data.items || hubsRes.data.data || []);
    const allUsers = Array.isArray(usersRes.data) ? usersRes.data : (usersRes.data.items || usersRes.data.data || []);
    shippers.value = allUsers.filter(u => u.role_id === 4);
    customers.value = Array.isArray(customersRes.data) ? customersRes.data : (customersRes.data.items || customersRes.data.data || []);
    displayCustomers.value = [...customers.value];
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
  activeWaybillSelection.value = {};
  currentPage.value = 1;
  try {
    const filters = {
      page: !isAdmin.value ? currentPage.value : 1,
      size: !isAdmin.value ? pageSize.value : 10000,
      waybill_code: searchQuery.value || null,
      status: statusFilter.value || null,
      start_date: dateRange.value?.[0] ? moment(dateRange.value[0]).toISOString() : null,
      end_date: dateRange.value?.[1] ? moment(dateRange.value[1]).toISOString() : null,
      holding_hub_id: holdingHubFilter.value || null,
      holding_shipper_id: holdingShipperFilter.value || null,
      cod_status: codStatusFilter.value || null,
      service_type: serviceTypeFilter.value || null,
      sla_status: slaStatusFilter.value || null
    };
    
    const response = await api.post('/api/waybills/search', filters);
    
    if (!isAdmin.value) {
      flatWaybills.value = response.data.items || [];
      total.value = response.data.total || 0;
    } else {
      const allWaybills = response.data.items || [];
      
      const grouped = {};
      allWaybills.forEach(w => {
        const cId = w.customer_id;
        if (!grouped[cId]) {
          grouped[cId] = [];
        }
        grouped[cId].push(w);
      });
      
      customerWaybills.value = grouped;
      
      const isFiltering = !!(
        searchQuery.value || statusFilter.value || dateRange.value?.[0] ||
        holdingHubFilter.value || holdingShipperFilter.value || codStatusFilter.value ||
        serviceTypeFilter.value || slaStatusFilter.value || auth.selectedHubId
      );
      
      if (isFiltering) {
        displayCustomers.value = customers.value.filter(c => !!grouped[c.customer_id]);
      } else {
        displayCustomers.value = [...customers.value];
      }
      
      total.value = allWaybills.length;
    }
  } catch (err) {
    console.error(err);
    ElMessage.error('Không thể tìm kiếm vận đơn');
    displayCustomers.value = [];
    flatWaybills.value = [];
  } finally {
    loading.value = false;
  }
};

const handleCustomerExpand = async (row, expandedRows) => {
  const isExpanded = expandedRows.some(r => r.customer_id === row.customer_id);
  if (isExpanded) {
    if (!customerWaybills.value[row.customer_id] || customerWaybills.value[row.customer_id].length === 0) {
      customerWaybillsLoading.value[row.customer_id] = true;
      try {
        const response = await api.post('/api/waybills/search', {
          page: 1,
          size: 500,
          customer_id: row.customer_id
        });
        customerWaybills.value[row.customer_id] = response.data.items || [];
        innerCurrentPage.value[row.customer_id] = 1;
      } catch (err) {
        console.error(err);
        ElMessage.error('Không thể tải vận đơn cho khách hàng này');
      } finally {
        customerWaybillsLoading.value[row.customer_id] = false;
      }
    }
  }
};

const handleWaybillSelectionChange = (customerId, selectedList) => {
  activeWaybillSelection.value[customerId] = selectedList;
};

const handleFlatSelectionChange = (selectedList) => {
  activeWaybillSelection.value['flat'] = selectedList;
};

const selectedWaybillsList = computed(() => {
  if (!isAdmin.value) {
    return activeWaybillSelection.value['flat'] || [];
  }
  return Object.values(activeWaybillSelection.value).flat();
});

const exportingSelected = ref(false);

const exportSelectedExcel = async () => {
  if (selectedWaybillsList.value.length === 0) {
    ElMessage.warning('Vui lòng chọn ít nhất 1 vận đơn để xuất');
    return;
  }
  
  exportingSelected.value = true;
  try {
    const payload = {
      waybill_codes: selectedWaybillsList.value.map(w => w.waybill_code)
    };
    const response = await api.post('/api/waybills/export-selected', payload, {
      responseType: 'blob'
    });
    
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    const filename = `DonHangChon_${moment().format('YYYYMMDD_HHmm')}.xlsx`;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
    ElMessage.success('Đã xuất các đơn hàng được chọn thành công!');
  } catch (err) {
    ElMessage.error('Không thể xuất Excel');
  } finally {
    exportingSelected.value = false;
  }
};

// --- UPDATE EXCEL STATE & FUNCTIONS ---
const updateDialogVisible = ref(false);
const updateSubmitting = ref(false);
const selectedUpdateFile = ref(null);
const updateResult = ref(null);
const updateUploadRef = ref(null);

const openUpdateDialog = () => {
  updateDialogVisible.value = true;
  updateResult.value = null;
  selectedUpdateFile.value = null;
  if (updateUploadRef.value) {
    updateUploadRef.value.clearFiles();
  }
};

const handleUpdateFileChange = (file) => {
  selectedUpdateFile.value = file.raw;
  updateResult.value = null;
};

const handleUpdateExceed = (files) => {
  if (updateUploadRef.value) {
    updateUploadRef.value.clearFiles();
    const file = files[0];
    updateUploadRef.value.handleStart(file);
    selectedUpdateFile.value = file;
  }
};

const submitUpdateExcel = async () => {
  if (!selectedUpdateFile.value) {
    ElMessage.warning('Vui lòng chọn file Excel đã chỉnh sửa trước');
    return;
  }
  
  updateSubmitting.value = true;
  updateResult.value = null;
  
  const formData = new FormData();
  formData.append('file', selectedUpdateFile.value);
  
  try {
    const response = await api.post('/api/waybills/update-excel', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    
    updateResult.value = response.data;
    if (response.data.failed_count === 0) {
      ElMessage.success(`Cập nhật thành công ${response.data.imported_count} đơn hàng!`);
      updateDialogVisible.value = false;
      handleSearch();
    } else if (response.data.imported_count > 0) {
      ElMessage.warning(`Cập nhật hoàn tất một phần: Thành công ${response.data.imported_count} đơn, thất bại ${response.data.failed_count} dòng.`);
      handleSearch();
    } else {
      ElMessage.error(`Cập nhật thất bại hoàn toàn! ${response.data.failed_count} dòng có lỗi.`);
    }
  } catch (err) {
    console.error(err);
    const detail = err.response?.data?.detail || 'Lỗi hệ thống khi tải file lên';
    ElMessage.error(`Lỗi cập nhật: ${detail}`);
  } finally {
    updateSubmitting.value = false;
  }
};

const resetFilters = () => {
  searchQuery.value = '';
  statusFilter.value = '';
  dateRange.value = [];
  holdingHubFilter.value = null;
  holdingShipperFilter.value = null;
  codStatusFilter.value = '';
  serviceTypeFilter.value = '';
  slaStatusFilter.value = '';
  handleSearch();
};

const viewTracking = async (code) => {
  trackingDialog.value = true;
  trackingLoading.value = true;
  if (!isAdmin.value) {
    selectedWaybill.value = flatWaybills.value.find(w => w.waybill_code === code);
  } else {
    selectedWaybill.value = Object.values(customerWaybills.value).flat().find(w => w.waybill_code === code);
  }
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

const getMediaUrl = resolveMediaUrl;

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
    cod_amount: row.cod_amount,
    product_group: row.product_group || 'PARCEL',
    declared_value: row.declared_value || 0
  };
  editDialogVisible.value = true;
};

const submitEdit = async () => {
  if (editForm.value.product_group === 'HIGH_VALUE' && Number(editForm.value.declared_value || 0) <= 0) {
    ElMessage.warning('Hàng giá trị cao bắt buộc phải khai giá > 0');
    return;
  }

  editSubmitting.value = true;
  try {
    await api.put(`/api/waybills/${editForm.value.waybill_code}`, editForm.value);
    ElMessage.success('Đã cập nhật thông tin vận đơn thành công!');
    editDialogVisible.value = false;
    handleSearch();
  } catch (error) {
    ElMessage.error(error.response?.data?.detail || 'Lỗi khi lưu thông tin');
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
    'PENDING_OCR': 'tag-warning',
    'CREATED': 'tag-info',
    'PICKED_PENDING_VERIFY': 'tag-warning',
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
    'PENDING_OCR': 'Chờ OCR',
    'CREATED': 'Mới tạo',
    'PICKED_PENDING_VERIFY': 'Chờ duyệt OCR',
    'IN_HUB': 'Trong kho',
    'DELIVERING': 'Đang giao',
    'DELIVERED': 'Giao xong',
    'SETTLED': 'Đối soát xong',
    'CANCELLED': 'Đã hủy'
  };
  return map[status] || status;
};

const getSlaStatusLabel = (status) => {
  const map = {
    'ON_TIME': 'Đúng hạn',
    'WARNING': 'Sắp trễ',
    'OVERDUE': 'Quá hạn'
  };
  return map[status] || 'Đúng hạn';
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
    'VERIFIED': '🟢 Đã xác thực',
    'MISMATCH': '🔴 Sai lệch',
  };
  return map[status] || '🟠 Chờ duyệt';
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
      const updateLocalWaybill = (list) => {
        const idx = list.findIndex(w => w.waybill_id === overrideForm.value.waybill_id);
        if (idx !== -1) {
          list[idx] = {
            ...list[idx],
            shipping_fee: data.new_shipping_fee,
            extra_services_fee: data.new_extra_fee,
            vat_amount: data.new_vat,
            total_amount_to_collect: data.new_total
          };
        }
      };
      if (!isAdmin.value) {
        updateLocalWaybill(flatWaybills.value);
      } else {
        Object.values(customerWaybills.value).forEach(list => updateLocalWaybill(list));
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
  const searchCode = route.query.search;
  if (searchCode) {
    searchQuery.value = String(searchCode).trim();
  }
  handleSearch();
  fetchSLAStats();
  fetchHubsAndShippers();
  fetchProductTypes();
});
</script>

<style scoped src="@/styles/admin/waybills/WaybillList.css"></style>
