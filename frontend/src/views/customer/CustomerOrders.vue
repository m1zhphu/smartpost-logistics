<template>
  <div class="customer-portal" style="min-width: 0;">
    <div class="portal-container" style="min-width: 0;">
      <el-row :gutter="24" class="portal-content" style="min-width: 0;">
        <el-col :span="24" style="min-width: 0;">
          <div style="min-width: 0; width: 100%;">
            <el-card class="recent-waybills-card mt-20 animate-fade-in">
              <template #header>
                <div class="flex-between" style="flex-wrap: wrap; gap: 12px;">
                  <div class="card-header-title">
                    <el-icon><List /></el-icon><span>Bưu gửi & Yêu cầu lấy hàng của tôi</span>
                  </div>
                  <div style="display: flex; align-items: center; gap: 12px; flex-wrap: wrap;">
                    <el-select v-model="filterDept" placeholder="Lọc theo phòng ban" size="small" clearable style="width: 180px;">
                      <el-option
                        v-for="dept in departmentsList"
                        :key="dept.id"
                        :label="dept.name"
                        :value="dept.name"
                      />
                      <el-option label="Không gán phòng ban" value="_UNASSIGNED_" />
                    </el-select>
                    <el-date-picker
                      v-model="filterDate"
                      type="date"
                      placeholder="Lọc theo ngày tạo"
                      format="DD/MM/YYYY"
                      value-format="YYYY-MM-DD"
                      size="small"
                      clearable
                      style="width: 170px;"
                    />
                    <el-button size="small" type="primary" plain @click="fetchPickupsList">
                      <el-icon class="mr-1"><Refresh /></el-icon>Làm mới
                    </el-button>
                  </div>
                </div>
              </template>
              
              <div class="customer-orders-table-scroll">
                <el-table style="width: 100%; min-width: 1200px;" :data="filteredPickupsList" v-loading="listLoading" stripe class="modern-table customer-orders-table" :row-class-name="customerOrderRowClass">
                <el-table-column type="expand" width="48">
                  <template #default="{ row }">
                    <div v-if="row.pickup_mode === 'BULK_MAIL'" class="bulk-waybill-panel">
                      <div class="bulk-waybill-title">
                        Chi tiết từng vận đơn trong túi
                        <span v-if="row.bag_code" class="code-badge success">{{ row.bag_code }}</span>
                      </div>
                      <div v-if="getPickupWaybills(row).length" class="bulk-waybill-table-scroll">
                        <div class="table-scroll-wrapper">
                          <el-table style="width: 100%; min-width: 1250px;" :data="getPaginatedWaybills(row)" size="small" border class="bulk-waybill-table">
                          <el-table-column prop="waybill_code" label="Mã vận đơn" min-width="230">
                            <template #default="{ row: waybill }">
                              <span class="code-badge info">{{ waybill.waybill_code }}</span>
                            </template>
                          </el-table-column>
                          <el-table-column label="Người nhận" min-width="210">
                            <template #default="{ row: waybill }">
                              <div class="bulk-recipient-name">{{ waybill.receiver_name || 'Chưa cập nhật' }}</div>
                              <div class="text-xs text-muted">{{ waybill.receiver_phone || '---' }}</div>
                            </template>
                          </el-table-column>
                          <el-table-column label="Trạng thái đơn" min-width="180">
                            <template #default="{ row: waybill }">
                              <el-tag :type="getWaybillStatusType(waybill.status)" size="small">{{ getWaybillStatusLabel(waybill.status) }}</el-tag>
                            </template>
                          </el-table-column>
                          <el-table-column label="Dịch vụ" min-width="180" align="center">
                            <template #default="{ row: waybill }"><el-tag :type="waybill.service_type === 'HT' ? 'danger' : 'info'" size="small" effect="dark">{{ getServiceTypeLabel(waybill.service_type) }}</el-tag></template>
                          </el-table-column>
                          <el-table-column label="OCR" min-width="140" align="center">
                            <template #default="{ row: waybill }">
                              <el-tag :type="getOcrStatusType(waybill.ocr_status)" size="small" effect="plain">{{ getOcrStatusLabel(waybill.ocr_status) }}</el-tag>
                            </template>
                          </el-table-column>
                          <el-table-column label="Khối lượng / COD" min-width="160" align="right">
                            <template #default="{ row: waybill }">
                              <div>{{ Number(waybill.actual_weight || 0).toLocaleString() }} kg</div>
                              <div class="text-xs text-muted">COD {{ Number(waybill.cod_amount || 0).toLocaleString() }}đ</div>
                            </template>
                          </el-table-column>
                          <el-table-column label="Thao tác" min-width="140" align="center">
                            <template #default="{ row: waybill }">
                              <el-button type="primary" link @click.stop="openBulkWaybillDetail(row, waybill)">Xem đơn</el-button>
                            </template>
                          </el-table-column>
                          </el-table>
                          <div style="display: flex; justify-content: flex-end; margin-top: 8px; padding-right: 12px;">
                            <el-pagination
                              layout="prev, pager, next, total"
                              :total="getPickupWaybills(row).length"
                              :page-size="10"
                              v-model:current-page="innerTableCurrentPages[row.request_code || row.bag_code || 'default']"
                              size="small"
                              background
                            />
                          </div>
                        </div>
                      </div>
                      <el-empty v-else description="Chưa có mã vận đơn trong túi" :image-size="80" />
                    </div>
                    <div v-else class="bulk-waybill-panel">
                      <span class="text-muted text-xs">Yêu cầu đơn lẻ không có danh sách túi thư.</span>
                    </div>
                  </template>
                </el-table-column>
                
                <el-table-column prop="request_code" label="Mã Yêu Cầu" min-width="220">
                  <template #default="{ row }">
                    <span class="code-badge warning">{{ row.request_code }}</span>
                  </template>
                </el-table-column>
                <el-table-column label="Mã Vận Đơn / Túi" min-width="380">
                  <template #default="{ row }">
                    <span class="code-badge success">{{ row.pickup_mode === 'BULK_MAIL' ? (row.bag_code || row.waybill_code || '---') : (row.waybill_code || row.bag_code || '---') }}</span>
                  </template>
                </el-table-column>
                 <el-table-column label="Ngày tạo" min-width="185">
                  <template #default="{ row }">
                    <div style="display: flex; align-items: center; gap: 8px;">
                      <span class="text-xs">{{ formatDate(row.created_at) }}</span>
                      <el-tag v-if="isToday(row.created_at)" size="small" type="success" effect="dark" round>Hôm nay</el-tag>
                    </div>
                  </template>
                </el-table-column>
                <el-table-column label="Phòng ban" min-width="155">
                  <template #default="{ row }">
                    <el-tag size="small" :type="row.parsedDept ? 'primary' : 'info'">
                      {{ row.parsedDept || 'Chưa gán' }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column label="Trạng thái" min-width="280">
                  <template #default="{ row }">
                    <el-tag :type="getCustomerOrderStatusType(row)" size="small">
                      {{ getCustomerOrderStatusLabel(row) }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column label="Bưu cục nhận" min-width="200" show-overflow-tooltip>
                  <template #default="{ row }">
                    <span>{{ row.hub_name || 'Đang xử lý...' }}</span>
                  </template>
                </el-table-column>
                <el-table-column label="Cước phí" min-width="160" align="right">
                  <template #default="{ row }">
                    <div v-if="row.pickup_mode === 'BULK_MAIL'">
                      <div class="fw-bold text-warning">Chờ xử lý</div>
                      <span class="text-xs text-muted">OCR/cân đo</span>
                    </div>
                    <div v-else-if="row.price_status === 'FINALIZED' || row.price_status === 'ADJUSTED'">
                      <div class="fw-bold text-success">{{ (row.final_total_amount || 0).toLocaleString() }}đ</div>
                      <span class="text-xs text-muted">(Đã cân đo)</span>
                    </div>
                    <div v-else>
                      <div class="fw-bold text-primary">{{ (row.estimated_total_amount || 0).toLocaleString() }}đ</div>
                      <span class="text-xs text-muted">(Tạm tính)</span>
                    </div>
                  </template>
                </el-table-column>
                <el-table-column label="Thao tác" min-width="160" align="center">
                  <template #default="{ row }"><el-button type="primary" size="small" plain @click="openDetail(row)">Xem chi tiết</el-button></template>
                </el-table-column>
                <template #empty>
                  <el-empty description="Bạn chưa tạo đơn gửi hàng nào hoặc chưa có lịch sử vận đơn" :image-size="100" />
                </template>
                </el-table>
              </div>
            </el-card>
          </div>
        </el-col>
      </el-row>
      <!-- DETAIL MODAL DIALOG -->
      <el-dialog 
        v-model="detailDialogVisible" 
        title="Chi tiết yêu cầu & Vận đơn" 
        width="1150px"
        destroy-on-close
        top="5vh"
      >
        <div v-if="selectedPickup" class="detail-dialog-content">
          <el-tabs v-model="activeDetailTab">
            
            <!-- Tab 1: General Info -->
            <el-tab-pane label="Thông tin chung" name="general">
              <div class="detail-grid">
                <div class="detail-grid-item">
                  <span class="label">Mã yêu cầu lấy:</span>
                  <span class="value fw-bold text-warning">{{ selectedPickup.request_code }}</span>
                </div>
                <div class="detail-grid-item">
                  <span class="label">Mã vận đơn:</span>
                  <span class="value fw-bold text-success">{{ selectedPickup.waybill_code || '---' }}</span>
                </div>
                <div v-if="selectedPickup.bag_code" class="detail-grid-item">
                  <span class="label">Mã túi thư:</span>
                  <span class="value fw-bold text-success">{{ selectedPickup.bag_code }}</span>
                </div>
                <div v-if="selectedPickup.pickup_mode === 'BULK_MAIL' && getPickupWaybillCodes(selectedPickup).length" class="detail-grid-item full-width">
                  <span class="label">Mã vận đơn trong túi:</span>
                  <div style="max-height: 120px; overflow-y: auto; display: flex; flex-wrap: wrap; gap: 6px; padding: 10px; border: 1px solid #e2e8f0; border-radius: 8px; background: #f8fafc; width: 100%; box-sizing: border-box; margin-top: 4px;">
                    <span
                      v-for="code in getPickupWaybillCodes(selectedPickup)"
                      :key="code"
                      class="code-badge info"
                      style="margin: 0;"
                    >
                      {{ code }}
                    </span>
                  </div>
                </div>
                <div v-if="selectedPickup.pickup_mode === 'BULK_MAIL'" class="detail-grid-item">
                  <span class="label">Số lượng bưu gửi:</span>
                  <span class="value fw-bold">{{ selectedPickup.estimated_quantity || 0 }}</span>
                </div>
                <div class="detail-grid-item">
                  <span class="label">Ngày tạo:</span>
                  <span class="value">{{ formatDate(selectedPickup.created_at) }}</span>
                </div>
                <div class="detail-grid-item">
                  <span class="label">Phòng ban quản lý:</span>
                  <span class="value fw-bold text-primary">{{ selectedPickup.parsedDept || 'Chưa gán' }}</span>
                </div>
                <div class="detail-grid-item">
                  <span class="label">Loại hàng hóa:</span>
                  <span class="value">{{ selectedPickup.product_type_label || selectedPickup.product_type || '---' }}</span>
                </div>
                <div class="detail-grid-item">
                  <span class="label">Dịch vụ vận chuyển:</span>
                  <span class="value fw-bold" :class="{ 'express-service-text': ['HT', 'EXPRESS'].includes(selectedPickup.service_type) }">
                    {{ getServiceTypeLabel(selectedPickup.service_type) }}
                  </span>
                </div>
                <div class="detail-grid-item">
                  <span class="label">Phương thức thanh toán:</span>
                  <span class="value">{{ getPaymentMethodLabel(selectedPickup.payment_method) }}</span>
                </div>
                <div class="detail-grid-item">
                  <span class="label">Trạng thái lấy hàng:</span>
                  <span class="value">
                    <el-tag :type="getCustomerOrderStatusType(selectedPickup)" size="small">
                      {{ getCustomerOrderStatusLabel(selectedPickup) }}
                    </el-tag>
                  </span>
                </div>
                <div class="detail-grid-item">
                  <span class="label">Trạng thái vận đơn:</span>
                  <span class="value">
                    <el-tag :type="getWaybillStatusType(selectedPickup.waybill_status)" size="small">
                      {{ getWaybillStatusLabel(selectedPickup.waybill_status) }}
                    </el-tag>
                  </span>
                </div>
                <div class="detail-grid-item">
                  <span class="label">Văn phòng tiếp nhận:</span>
                  <span class="value text-primary fw-bold">{{ selectedPickup.hub_name || 'Đang xử lý...' }}</span>
                </div>
                <div class="detail-grid-item">
                  <span class="label">Bưu tá lấy hàng:</span>
                  <span class="value text-dark fw-bold">
                    {{ selectedPickup.assigned_shipper_name || 'Chưa phân công' }}
                  </span>
                </div>
                <div v-if="selectedPickup.shop_order_code" class="detail-grid-item">
                  <span class="label">Mã đơn hàng Shop:</span>
                  <span class="value">{{ selectedPickup.shop_order_code }}</span>
                </div>
                <div v-if="selectedPickup.note" class="detail-grid-item full-width">
                  <span class="label">Ghi chú:</span>
                  <span class="value text-dark">{{ selectedPickup.note }}</span>
                </div>
              </div>

              <!-- Sender & Receiver Section -->
              <el-divider content-position="left"><el-icon><Location /></el-icon> Thông tin lấy & giao hàng</el-divider>
              <el-row :gutter="16">
                <el-col :span="12">
                  <div class="address-card sender-card">
                    <div class="address-card-title"><el-icon><User /></el-icon> Người gửi (lấy hàng)</div>
                    <div class="address-line fw-bold">{{ selectedPickup.sender_name || '---' }}</div>
                    <div class="address-line">📞 {{ selectedPickup.sender_phone || '---' }}</div>
                    <div class="address-line text-muted text-xs">
                      {{ [selectedPickup.sender_address, selectedPickup.sender_ward_name, selectedPickup.sender_district_name, selectedPickup.sender_province_name].filter(Boolean).join(', ') || '---' }}
                    </div>
                  </div>
                </el-col>
                <el-col :span="12">
                  <div class="address-card receiver-card">
                    <div class="address-card-title"><el-icon><Location /></el-icon> Người nhận (giao hàng)</div>
                    <div class="address-line fw-bold">{{ selectedPickup.receiver_name || '---' }}</div>
                    <div class="address-line">📞 {{ selectedPickup.receiver_phone || '---' }}</div>
                    <div class="address-line text-muted text-xs">
                      {{ [selectedPickup.receiver_address, selectedPickup.receiver_ward_name, selectedPickup.receiver_district_name, selectedPickup.receiver_province_name].filter(Boolean).join(', ') || '---' }}
                    </div>
                    <div v-if="selectedPickup.old_province" class="address-line text-xs" style="color: #d97706; font-weight: 600; margin-top: 4px; display: inline-flex; align-items: center; gap: 4px;">
                      <el-icon><RefreshRight /></el-icon> Tỉnh cũ trước sáp nhập: {{ selectedPickup.old_province }}
                    </div>
                  </div>
                </el-col>
              </el-row>

              <template v-if="selectedPickup.bill_image_url || getPickupImages(selectedPickup).length > 0 || getPodImages(selectedPickup).length > 0">
                <el-divider content-position="left"><el-icon><Picture /></el-icon> Hình ảnh OCR / lấy hàng</el-divider>
                <div class="pickup-image-grid">
                  <!-- Ảnh OCR bill (giữ nguyên 1 ảnh) -->
                  <div v-if="selectedPickup.bill_image_url" class="pickup-image-card">
                    <div class="pickup-image-title">Ảnh vận đơn OCR</div>
                    <el-image
                      :src="getMediaUrl(selectedPickup.bill_image_url)"
                      :preview-src-list="[getMediaUrl(selectedPickup.bill_image_url)]"
                      fit="cover"
                      preview-teleported
                    />
                  </div>
                  <!-- Gallery ảnh lấy hàng - tối đa 5 ảnh -->
                  <div v-if="getPickupImages(selectedPickup).length > 0" class="pickup-image-card">
                    <div class="pickup-image-title">Ảnh lấy hàng ({{ getPickupImages(selectedPickup).length }} ảnh)</div>
                    <div class="pickup-image-gallery-row">
                      <el-image
                        v-for="(imgUrl, imgIdx) in getPickupImages(selectedPickup)"
                        :key="'pickup-' + imgIdx"
                        :src="getMediaUrl(imgUrl)"
                        :preview-src-list="getPickupImages(selectedPickup).map(u => getMediaUrl(u))"
                        :initial-index="imgIdx"
                        fit="cover"
                        preview-teleported
                      />
                    </div>
                  </div>
                  <!-- Gallery ảnh giao hàng (POD) - tối đa 5 ảnh -->
                  <div v-if="getPodImages(selectedPickup).length > 0" class="pickup-image-card">
                    <div class="pickup-image-title">Ảnh giao hàng (POD) ({{ getPodImages(selectedPickup).length }} ảnh)</div>
                    <div class="pickup-image-gallery-row">
                      <el-image
                        v-for="(imgUrl, imgIdx) in getPodImages(selectedPickup)"
                        :key="'pod-' + imgIdx"
                        :src="getMediaUrl(imgUrl)"
                        :preview-src-list="getPodImages(selectedPickup).map(u => getMediaUrl(u))"
                        :initial-index="imgIdx"
                        fit="cover"
                        preview-teleported
                      />
                    </div>
                  </div>
                </div>
              </template>

              <!-- Items Section -->
              <el-divider content-position="left"><el-icon><Box /></el-icon> Hàng hóa</el-divider>
              <div v-if="selectedPickup.items && selectedPickup.items.length > 0">
                <el-table :data="selectedPickup.items" size="small" stripe>
                  <el-table-column label="Tên hàng hóa" prop="product_name" min-width="140">
                    <template #default="{ row }">
                      <span class="fw-bold">{{ row.product_name || '---' }}</span>
                    </template>
                  </el-table-column>
                  <el-table-column label="Số lượng" prop="quantity" width="80" align="center" />
                  <el-table-column label="Khối lượng" width="100" align="right">
                    <template #default="{ row }">{{ row.weight }} kg</template>
                  </el-table-column>
                  <el-table-column label="Giá trị" width="120" align="right">
                    <template #default="{ row }">{{ (row.declared_value || 0).toLocaleString() }}đ</template>
                  </el-table-column>
                </el-table>
              </div>
              <div v-else class="text-muted text-xs text-center py-2">Chưa có thông tin hàng hóa chi tiết.</div>

              <!-- Weight info -->
              <el-row :gutter="16" class="mt-3">
                <el-col :span="12" v-if="selectedPickup.estimated_weight">
                  <div class="info-chip">
                    <span class="chip-label">Khối lượng ước tính:</span>
                    <span class="chip-value">{{ selectedPickup.estimated_weight }} kg</span>
                  </div>
                </el-col>
                <el-col :span="12" v-if="selectedPickup.actual_weight">
                  <div class="info-chip success">
                    <span class="chip-label">Khối lượng thực tế (sau cân):</span>
                    <span class="chip-value fw-bold text-success">{{ selectedPickup.actual_weight }} kg</span>
                  </div>
                </el-col>
              </el-row>
            </el-tab-pane>

            <!-- Tab 2: Billing Breakdown -->
            <el-tab-pane label="Cước phí & Thanh toán" name="billing">
              <!-- COD Info -->
              <div v-if="selectedPickup.cod_amount > 0" class="cod-banner mb-3">
                <el-icon><Money /></el-icon>
                <span>COD (Thu hộ): <strong>{{ (selectedPickup.cod_amount || 0).toLocaleString() }}đ</strong></span>
              </div>

              <div class="billing-comparison">
                <el-row :gutter="20">
                  <el-col :span="12">
                    <div class="billing-column-card estimated">
                      <div class="card-title">Cước dự kiến (Tạm tính)</div>
                      <div class="price-row">
                        <span>Cước phí chính:</span>
                        <span>{{ (selectedPickup.estimated_shipping_fee || 0).toLocaleString() }}đ</span>
                      </div>
                      <div class="price-row" v-if="selectedPickup.estimated_extra_services_fee > 0">
                        <span>Phí dịch vụ cộng thêm:</span>
                        <span>{{ (selectedPickup.estimated_extra_services_fee || 0).toLocaleString() }}đ</span>
                      </div>
                      <div class="price-row" v-if="selectedPickup.estimated_vat_amount > 0">
                        <span>VAT:</span>
                        <span>{{ (selectedPickup.estimated_vat_amount || 0).toLocaleString() }}đ</span>
                      </div>
                      <el-divider class="my-2" />
                      <div class="price-row total">
                        <span>Tổng cộng:</span>
                        <span>{{ (selectedPickup.estimated_total_amount || 0).toLocaleString() }}đ</span>
                      </div>
                    </div>
                  </el-col>
                  <el-col :span="12">
                    <div class="billing-column-card final" :class="{ empty: !selectedPickup.final_total_amount }">
                      <div class="card-title">Cước thực tế sau cân đo</div>
                      <div v-if="selectedPickup.final_total_amount">
                        <div class="price-row">
                          <span>Cước phí chính:</span>
                          <span>{{ (selectedPickup.final_shipping_fee || 0).toLocaleString() }}đ</span>
                        </div>
                        <div class="price-row" v-if="selectedPickup.final_extra_services_fee > 0">
                          <span>Phí dịch vụ cộng thêm:</span>
                          <span>{{ (selectedPickup.final_extra_services_fee || 0).toLocaleString() }}đ</span>
                        </div>
                        <div class="price-row" v-if="selectedPickup.final_vat_amount > 0">
                          <span>VAT:</span>
                          <span>{{ (selectedPickup.final_vat_amount || 0).toLocaleString() }}đ</span>
                        </div>
                        <el-divider class="my-2" />
                        <div class="price-row total">
                          <span>Tổng cộng:</span>
                          <span class="text-success">{{ (selectedPickup.final_total_amount || 0).toLocaleString() }}đ</span>
                        </div>
                      </div>
                      <div class="empty-state text-center text-muted" v-else>
                        <el-icon class="large-icon mb-1"><InfoFilled /></el-icon>
                        <p>Đang chờ bưu cục nhận và cân đo lại kiện hàng.</p>
                      </div>
                    </div>
                  </el-col>
                </el-row>

                <div 
                  class="difference-alert mt-4" 
                  v-if="selectedPickup.final_total_amount && selectedPickup.final_total_amount !== selectedPickup.estimated_total_amount"
                >
                  <el-alert 
                    :title="getDiffMessage(selectedPickup)" 
                    :type="getDiffAlertType(selectedPickup)" 
                    show-icon 
                    :closable="false" 
                  />
                </div>
              </div>
            </el-tab-pane>

            <!-- Tab 3: Order Timeline -->
            <el-tab-pane label="Hành trình bưu gửi" name="timeline">
              <el-row :gutter="20">
                <el-col :xs="24" :sm="11">
                  <div class="timeline-wrapper" v-loading="timelineLoading" style="max-height: 600px; height: 600px; overflow-y: auto; padding-right: 10px;">
                    <el-timeline v-if="pickupTimeline.length > 0">
                      <el-timeline-item
                        v-for="(log, idx) in pickupTimeline"
                        :key="idx"
                        :timestamp="log.time"
                        type="primary"
                        hollow
                      >
                        <div class="timeline-log-title">{{ log.action }}</div>
                        <div class="timeline-log-desc">
                          Thực hiện: <strong>{{ log.actor }}</strong> tại <em>{{ log.location }}</em>
                        </div>
                        <div class="timeline-log-note" v-if="log.note">Ghi chú: {{ log.note }}</div>
                      </el-timeline-item>
                    </el-timeline>
                    <div class="text-center text-muted py-4" v-else>
                      <el-empty description="Chưa có thông tin hành trình bưu gửi" :image-size="60" />
                    </div>
                  </div>
                </el-col>
                <el-col :xs="24" :sm="13">
                  <div style="border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; height: 600px; background: #f8fafc; position: relative;">
                    <div id="timeline-map" style="width: 100%; height: 100%; z-index: 1;"></div>
                  </div>
                </el-col>
              </el-row>
            </el-tab-pane>

          </el-tabs>
        </div>
      </el-dialog>
    </div>
  </div>
</template>
<script setup>
import { computed, ref, reactive, onMounted, onBeforeUnmount, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { ElMessage, ElMessageBox } from 'element-plus';
import api from '@/api/axios';
import { getMediaUrl as resolveMediaUrl } from '@/utils/mediaUrl';
import { formatVietnamDateTime, parseApiDate } from '@/utils/dateTime';
import { getPickupImages, getPodImages } from '@/utils/imageHelpers';
import { 
  User, Service, Phone, Message, Close, 
  Search, DocumentAdd, Location, List, Edit, Lock,
  Box, Setting, CircleCheck, InfoFilled, FolderOpened, Upload, ArrowLeft, Refresh, Warning, Money, Picture
} from '@element-plus/icons-vue';

// ---- Dynamic Address API (provinces.open-api.vn) ----
const ADDR_API = 'https://provinces.open-api.vn/api';
const provinces = ref([]);
const districtsCache = {};
const wardsCache = {};

const senderDistricts = ref([]);
const senderWards = ref([]);
const receiverDistricts = ref([]);
const receiverWards = ref([]);
const editDistricts = ref([]);
const editWards = ref([]);

const availableDistricts = computed(() => editDistricts.value);
const availableWards = computed(() => editWards.value);

const fetchProvinces = async () => {
  if (provinces.value.length) return;
  try {
    const res = await fetch(`${ADDR_API}/`);
    const data = await res.json();
    provinces.value = data.map(p => ({ id: p.code, name: p.name }));
  } catch (err) {
    console.error('Không thể tải danh sách tỉnh/thành phố', err);
  }
};

const fetchDistrictsForProvince = async (provinceId) => {
  if (!provinceId) return [];
  const pId = Number(provinceId);
  if (districtsCache[pId]) return districtsCache[pId];
  try {
    const res = await fetch(`${ADDR_API}/p/${pId}?depth=2`);
    const data = await res.json();
    const list = (data.districts || []).map(d => ({ id: d.code, name: d.name }));
    districtsCache[pId] = list;
    return list;
  } catch (err) {
    console.error('Không thể tải danh sách quận/huyện', err);
    return [];
  }
};

const fetchWardsForDistrict = async (districtId) => {
  if (!districtId) return [];
  const dId = Number(districtId);
  if (wardsCache[dId]) return wardsCache[dId];
  try {
    const res = await fetch(`${ADDR_API}/d/${dId}?depth=2`);
    const data = await res.json();
    const list = (data.wards || []).map(w => ({ id: w.code, name: w.name }));
    wardsCache[dId] = list;
    return list;
  } catch (err) {
    console.error('Không thể tải danh sách phường/xã', err);
    return [];
  }
};

const authStore = useAuthStore();
const router = useRouter();
const route = useRoute();

const activeTab = computed(() => route.query.tab || 'dashboard');

const customerInfo = ref({
  customer_code: '',
  phone_number: '',
  email: authStore.user?.email || '',
  address_detail: '',
  province_id: null,
  district_id: null,
  ward_id: null,
  address_detail_custom: ''
});

// Portal View States
const showCreateForm = ref(false);
const listLoading = ref(false);
const submitLoading = ref(false);
const simulateLoading = ref(false);
const pickupsList = ref([]);
const draftsList = ref([]);
const savedDraftsList = ref([]);

// Available Extra Services List
const availableServices = ref([]);

// Form model
const form = reactive({
  sender: {
    name: '',
    phone: '',
    province_id: null,
    district_id: null,
    ward_id: null,
    address_detail: ''
  },
  receiver: {
    name: '',
    phone: '',
    province_id: null,
    district_id: null,
    ward_id: null,
    address_detail: ''
  },
  items: [
    {
      product_name: '',
      weight: 0.5,
      length: 0,
      width: 0,
      height: 0,
      quantity: 1,
      declared_value: 0
    }
  ],
  cod_amount: 0,
  cod_receiver_pays_fee: false,
  service_type: 'STANDARD',
  extra_services: [],
  delivery_note_option: 'CHO_XEM_HANG',
  note: '',
  payment_method: 'SENDER_DEBT',
  target_hub_id: null
});

const hubsList = ref([]);

// Simulation price result
const simulateResult = ref(null);
const simulateError = ref('');

const filterDate = ref('');
const filterDept = ref('');
const departmentsList = ref([]);
const loadDepartments = async () => {
  try {
    const res = await api.get('/api/customers/me/departments');
    departmentsList.value = res.data || [];
  } catch (err) {
    console.error('Lỗi khi tải danh sách phòng ban:', err);
  }
};
const parseDeptFromNote = (note) => {
  if (!note) return null;
  const match = note.match(/\[Phòng ban:\s*([^\]]+)\]/);
  return match ? match[1].trim() : null;
};

const getVietnamLocalDateString = (value) => {
  const date = parseApiDate(value);
  if (!date) return '';
  const parts = new Intl.DateTimeFormat('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map(({ type, value: part }) => [type, part]));
  return `${values.year}-${values.month}-${values.day}`;
};

const isToday = (value) => {
  const vietnamDate = getVietnamLocalDateString(value);
  if (!vietnamDate) return false;
  
  const today = new Date();
  const parts = new Intl.DateTimeFormat('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).formatToParts(today);
  const values = Object.fromEntries(parts.map(({ type, value: part }) => [type, part]));
  const todayStr = `${values.year}-${values.month}-${values.day}`;
  
  return vietnamDate === todayStr;
};

const filteredPickupsList = computed(() => {
  let list = pickupsList.value;
  if (filterDate.value) {
    list = list.filter(row => {
      if (!row.created_at) return false;
      const dateStr = getVietnamLocalDateString(row.created_at);
      return dateStr === filterDate.value;
    });
  }
  if (filterDept.value) {
    list = list.filter(row => {
      if (filterDept.value === '_UNASSIGNED_') {
        return !row.parsedDept;
      }
      return row.parsedDept === filterDept.value;
    });
  }
  return list;
});

const innerTableCurrentPages = ref({});

const getPaginatedWaybills = (row) => {
  const allWaybills = getPickupWaybills(row);
  const key = row.request_code || row.bag_code || 'default';
  if (innerTableCurrentPages.value[key] === undefined) {
    innerTableCurrentPages.value[key] = 1;
  }
  const currentPage = innerTableCurrentPages.value[key];
  const pageSize = 10;
  const start = (currentPage - 1) * pageSize;
  return allWaybills.slice(start, start + pageSize);
};

// Details Dialog variables
const detailDialogVisible = ref(false);
const selectedPickup = ref(null);
const activeDetailTab = ref('general');
const pickupTimeline = ref([]);
const timelineLoading = ref(false);

const editDialogVisible = ref(false);
const changePasswordVisible = ref(false);
const changePasswordLoading = ref(false);
const editForm = reactive({
  full_name: '',
  phone_number: '',
  province_id: null,
  district_id: null,
  ward_id: null,
  address_detail: ''
});

const changePasswordForm = reactive({
  current_password: '',
  new_password: '',
  confirm_password: ''
});

const getProvinceName = (id) => provinces.value.find(p => Number(p.id) === Number(id))?.name || '';
const getDistrictName = (provId, distId) => {
  if (!provId || !distId) return '';
  const cached = districtsCache[Number(provId)];
  if (cached) {
    return cached.find(d => Number(d.id) === Number(distId))?.name || '';
  }
  const activeLists = [senderDistricts.value, receiverDistricts.value, editDistricts.value];
  for (const list of activeLists) {
    const found = list.find(d => Number(d.id) === Number(distId));
    if (found) return found.name;
  }
  return '';
};
const getWardName = (distId, wardId) => {
  if (!distId || !wardId) return '';
  const cached = wardsCache[Number(distId)];
  if (cached) {
    return cached.find(w => Number(w.id) === Number(wardId))?.name || '';
  }
  const activeLists = [senderWards.value, receiverWards.value, editWards.value];
  for (const list of activeLists) {
    const found = list.find(w => Number(w.id) === Number(wardId));
    if (found) return found.name;
  }
  return '';
};

const formattedAddress = computed(() => {
  const c = customerInfo.value;
  if (!c) return 'Chưa cập nhật';
  if (c.address_detail_custom) return c.address_detail_custom;
  
  const pName = getProvinceName(c.province_id);
  const dName = getDistrictName(c.province_id, c.district_id);
  const wName = getWardName(c.district_id, c.ward_id);
  
  const parts = [c.address_detail, wName, dName, pName].filter(Boolean);
  return parts.length > 0 ? parts.join(', ') : 'Chưa cập nhật';
});

const handleProvinceChange = async () => {
  editForm.district_id = null;
  editForm.ward_id = null;
  editWards.value = [];
  if (editForm.province_id) {
    editDistricts.value = await fetchDistrictsForProvince(editForm.province_id);
  } else {
    editDistricts.value = [];
  }
};

const handleDistrictChange = async () => {
  editForm.ward_id = null;
  if (editForm.district_id) {
    editWards.value = await fetchWardsForDistrict(editForm.district_id);
  } else {
    editWards.value = [];
  }
};

const handleSenderProvinceChange = async () => {
  form.sender.district_id = null;
  form.sender.ward_id = null;
  senderWards.value = [];
  if (form.sender.province_id) {
    senderDistricts.value = await fetchDistrictsForProvince(form.sender.province_id);
  } else {
    senderDistricts.value = [];
  }
  debouncedSimulate();
};

const handleSenderDistrictChange = async () => {
  form.sender.ward_id = null;
  if (form.sender.district_id) {
    senderWards.value = await fetchWardsForDistrict(form.sender.district_id);
  } else {
    senderWards.value = [];
  }
};

const handleReceiverProvinceChange = async () => {
  form.receiver.district_id = null;
  form.receiver.ward_id = null;
  receiverWards.value = [];
  if (form.receiver.province_id) {
    receiverDistricts.value = await fetchDistrictsForProvince(form.receiver.province_id);
  } else {
    receiverDistricts.value = [];
  }
  debouncedSimulate();
};

const handleReceiverDistrictChange = async () => {
  form.receiver.ward_id = null;
  if (form.receiver.district_id) {
    receiverWards.value = await fetchWardsForDistrict(form.receiver.district_id);
  } else {
    receiverWards.value = [];
  }
};

// SIMULATE ESTIMATED SHIPPING FEE
let simulateTimeout = null;
const debouncedSimulate = () => {
  if (simulateTimeout) clearTimeout(simulateTimeout);
  simulateTimeout = setTimeout(triggerSimulation, 400);
};

const triggerSimulation = async () => {
  if (!form.sender.province_id || !form.receiver.province_id) {
    simulateResult.value = null;
    return;
  }
  
  const mainItem = form.items[0];
  if (!mainItem || !mainItem.weight) {
    simulateResult.value = null;
    simulateError.value = '';
    return;
  }
  
  simulateLoading.value = true;
  simulateError.value = '';
  try {
    const payload = {
      origin_province_id: Number(form.sender.province_id),
      dest_province_id: Number(form.receiver.province_id),
      weight: Number(mainItem.weight),
      length: Number(mainItem.length || 0),
      width: Number(mainItem.width || 0),
      height: Number(mainItem.height || 0),
      service_type: form.service_type,
      cod_amount: Number(form.cod_amount || 0),
      extra_services: form.extra_services
    };
    
    const res = await api.post('/api/pricing/simulate', payload);
    if (res.data && res.data.status === 'SUCCESS') {
      simulateResult.value = res.data;
    } else {
      simulateResult.value = null;
      simulateError.value = 'Không thể tính phí tự động.';
    }
  } catch (err) {
    console.error('Error simulating price:', err);
    simulateResult.value = null;
    simulateError.value = err.response?.data?.detail || 'Tuyến đường này chưa được cấu hình giá cước.';
  } finally {
    simulateLoading.value = false;
  }
};

const fetchAvailableServices = async () => {
  try {
    const res = await api.get('/api/pricing/extra-services');
    availableServices.value = res.data || [];
  } catch (err) {
    console.error('Error fetching extra services:', err);
  }
};

const fetchHubs = async () => {
  try {
    const res = await api.get('/api/hubs');
    hubsList.value = Array.isArray(res.data) ? res.data : (res.data.items || res.data.data || []);
  } catch (err) {
    console.error('Error fetching hubs:', err);
  }
};

const startCreatePickup = async () => {
  // Pre-fill sender information from user profile
  form.sender.name = authStore.user?.full_name || '';
  form.sender.phone = customerInfo.value.phone_number || '';
  form.sender.province_id = customerInfo.value.province_id || null;
  form.sender.district_id = customerInfo.value.district_id || null;
  form.sender.ward_id = customerInfo.value.ward_id || null;
  form.sender.address_detail = customerInfo.value.address_detail || '';

  // Preload sender districts and wards
  if (form.sender.province_id) {
    senderDistricts.value = await fetchDistrictsForProvince(form.sender.province_id);
  } else {
    senderDistricts.value = [];
  }
  if (form.sender.district_id) {
    senderWards.value = await fetchWardsForDistrict(form.sender.district_id);
  } else {
    senderWards.value = [];
  }

  // Reset receiver and items
  form.receiver.name = '';
  form.receiver.phone = '';
  form.receiver.province_id = null;
  form.receiver.district_id = null;
  form.receiver.ward_id = null;
  form.receiver.address_detail = '';
  receiverDistricts.value = [];
  receiverWards.value = [];

  form.items = [{ product_name: '', weight: 0.5, length: 0, width: 0, height: 0, quantity: 1, declared_value: 0 }];
  form.cod_amount = 0;
  form.extra_services = [];
  form.service_type = 'STANDARD';
  form.delivery_note_option = 'CHO_XEM_HANG';
  form.note = '';
  form.payment_method = 'SENDER_DEBT';
  form.target_hub_id = null;
  simulateResult.value = null;

  showCreateForm.value = true;
  router.push({ query: { tab: 'create' } });
};

const resumeSavedDraft = async (draft) => {
  Object.assign(form, JSON.parse(JSON.stringify(draft)));
  
  if (form.sender.province_id) senderDistricts.value = await fetchDistrictsForProvince(form.sender.province_id);
  if (form.sender.district_id) senderWards.value = await fetchWardsForDistrict(form.sender.district_id);
  if (form.receiver.province_id) receiverDistricts.value = await fetchDistrictsForProvince(form.receiver.province_id);
  if (form.receiver.district_id) receiverWards.value = await fetchWardsForDistrict(form.receiver.district_id);
  
  debouncedSimulate();
  showCreateForm.value = true;
};

const deleteSavedDraft = (draftId) => {
  savedDraftsList.value = savedDraftsList.value.filter(d => d.draft_id !== draftId);
  localStorage.setItem('customer_pickup_drafts', JSON.stringify(savedDraftsList.value));
  ElMessage.success('Đã xóa bản nháp');
};

const resumeDraft = async (draft) => {
  Object.assign(form, JSON.parse(JSON.stringify(draft)));
  
  // Load districts and wards
  if (form.sender.province_id) senderDistricts.value = await fetchDistrictsForProvince(form.sender.province_id);
  if (form.sender.district_id) senderWards.value = await fetchWardsForDistrict(form.sender.district_id);
  if (form.receiver.province_id) receiverDistricts.value = await fetchDistrictsForProvince(form.receiver.province_id);
  if (form.receiver.district_id) receiverWards.value = await fetchWardsForDistrict(form.receiver.district_id);
  
  debouncedSimulate();
  showCreateForm.value = true;
};

const deleteDraft = (draftId) => {
  draftsList.value = draftsList.value.filter(d => d.draft_id !== draftId);
  localStorage.setItem('customer_pickup_queue', JSON.stringify(draftsList.value));
  ElMessage.success('Đã xóa đơn khỏi hàng chờ');
};

const saveDraft = () => {
  if (savedDraftsList.value.length >= 20) {
    ElMessage.warning('Chỉ lưu tối đa 20 bản nháp! Vui lòng xóa bớt.');
    return;
  }
  
  const newDraft = {
    ...JSON.parse(JSON.stringify(form)),
    draft_id: Date.now().toString(),
    created_at: new Date().toISOString()
  };

  savedDraftsList.value.push(newDraft);
  localStorage.setItem('customer_pickup_drafts', JSON.stringify(savedDraftsList.value));
  ElMessage.success('Đã lưu bản nháp thành công!');
};

const addToQueue = () => {
  if (draftsList.value.length >= 10) {
    ElMessage.warning('Hàng chờ chỉ lưu tối đa 10 đơn! Vui lòng xóa bớt hoặc gửi yêu cầu.');
    return;
  }
  
  if (!form.sender.name || !form.receiver.name || !form.items[0].product_name || !form.receiver.province_id) {
    ElMessage.warning('Vui lòng điền đủ thông tin cơ bản trước khi đưa vào hàng chờ.');
    return;
  }

  const newDraft = {
    ...JSON.parse(JSON.stringify(form)),
    draft_id: Date.now().toString(),
    created_at: new Date().toISOString()
  };

  draftsList.value.push(newDraft);
  localStorage.setItem('customer_pickup_queue', JSON.stringify(draftsList.value));
  localStorage.removeItem('customer_pickup_draft'); // Clear single draft if any
  
  ElMessage.success(`Đã đưa vào hàng chờ đơn thứ ${draftsList.value.length}. Bạn có thể tiếp tục tạo đơn mới.`);
  
  // Clear receiver and items to allow quick entry of next draft
  form.receiver.name = '';
  form.receiver.phone = '';
  form.receiver.province_id = null;
  form.receiver.district_id = null;
  form.receiver.ward_id = null;
  form.receiver.address_detail = '';
  receiverDistricts.value = [];
  receiverWards.value = [];

  form.items = [{ product_name: '', weight: 0.5, length: 0, width: 0, height: 0, quantity: 1, declared_value: 0 }];
  form.cod_amount = 0;
  form.note = '';
};

const cancelCreate = () => {
  showCreateForm.value = false;
  router.push({ query: { tab: 'dashboard' } });
};

// SUBMIT REQUEST TO BACKEND
const submitPickupRequest = async () => {
  if (!form.sender.name || !form.sender.phone || !form.sender.province_id || !form.sender.district_id) {
    ElMessage.warning('Vui lòng điền đầy đủ thông tin người gửi (bao gồm Tỉnh/Thành và Quận/Huyện)');
    return;
  }
  if (!form.receiver.name || !form.receiver.phone || !form.receiver.province_id || !form.receiver.district_id) {
    ElMessage.warning('Vui lòng điền đầy đủ thông tin người nhận (bao gồm Tỉnh/Thành và Quận/Huyện)');
    return;
  }
  if (!form.items[0].product_name) {
    ElMessage.warning('Vui lòng nhập tên sản phẩm');
    return;
  }

  submitLoading.value = true;
  try {
    const sName = getProvinceName(form.sender.province_id);
    const sDist = getDistrictName(form.sender.province_id, form.sender.district_id);
    const sWrd = getWardName(form.sender.district_id, form.sender.ward_id);

    const rName = getProvinceName(form.receiver.province_id);
    const rDist = getDistrictName(form.receiver.province_id, form.receiver.district_id);
    const rWrd = getWardName(form.receiver.district_id, form.receiver.ward_id);

    const mappedExtra = form.extra_services.map(code => {
      const srv = availableServices.value.find(s => s.service_code === code);
      return {
        service_code: code,
        service_name: srv ? srv.service_name : '',
        service_fee: srv ? (srv.fee_type === 'FIXED' ? srv.fee_value : 0) : 0
      };
    });

    const payload = {
      order_type: 'DOMESTIC',
      sender: {
        name: form.sender.name,
        phone: form.sender.phone,
        address: [form.sender.address_detail, sWrd, sDist, sName].filter(Boolean).join(', '),
        province_id: Number(form.sender.province_id),
        district_id: Number(form.sender.district_id),
        ward_id: Number(form.sender.ward_id),
        province_name: sName,
        district_name: sDist,
        ward_name: sWrd
      },
      receiver: {
        name: form.receiver.name,
        phone: form.receiver.phone,
        address: [form.receiver.address_detail, rWrd, rDist, rName].filter(Boolean).join(', '),
        province_id: Number(form.receiver.province_id),
        district_id: Number(form.receiver.district_id),
        ward_id: Number(form.receiver.ward_id),
        province_name: rName,
        district_name: rDist,
        ward_name: rWrd
      },
      items: form.items.map(i => ({
        product_group: 'PARCEL',
        product_name: i.product_name,
        weight: Number(i.weight),
        length: Number(i.length || 0),
        width: Number(i.width || 0),
        height: Number(i.height || 0),
        quantity: Number(i.quantity || 1),
        declared_value: Number(i.declared_value || 0)
      })),
      cod_amount: Number(form.cod_amount || 0),
      cod_receiver_pays_fee: form.cod_receiver_pays_fee,
      service_type: form.service_type,
      extra_services: mappedExtra,
      delivery_note_option: form.delivery_note_option,
      note: form.note,
      payment_method: form.payment_method,
      pickup_method: 'OUR_STAFF_PICKUP',
      delivery_method: 'OUR_STAFF_DELIVERY',
      target_hub_id: form.target_hub_id || null,
      save_as_draft: false
    };

    const res = await api.post('/api/waybills/customer/pickups', payload);
    
    ElMessage.success(`Tạo yêu cầu thành công! Mã vận đơn: ${res.data.waybill_code}`);
    showCreateForm.value = false;
    fetchPickupsList();
  } catch (err) {
    ElMessage.error(err.response?.data?.detail || 'Có lỗi xảy ra khi tạo yêu cầu lấy hàng');
  } finally {
    submitLoading.value = false;
  }
};

const submitAllDrafts = async () => {
  if (draftsList.value.length === 0) return;

  submitLoading.value = true;
  let successCount = 0;
  const failedDrafts = [];

  for (const draft of draftsList.value) {
    try {
      const sName = getProvinceName(draft.sender.province_id);
      const sDist = getDistrictName(draft.sender.province_id, draft.sender.district_id);
      const sWrd = getWardName(draft.sender.district_id, draft.sender.ward_id);

      const rName = getProvinceName(draft.receiver.province_id);
      const rDist = getDistrictName(draft.receiver.province_id, draft.receiver.district_id);
      const rWrd = getWardName(draft.receiver.district_id, draft.receiver.ward_id);

      const mappedExtra = draft.extra_services.map(code => {
        const srv = availableServices.value.find(s => s.service_code === code);
        return {
          service_code: code,
          service_name: srv ? srv.service_name : '',
          service_fee: srv ? (srv.fee_type === 'FIXED' ? srv.fee_value : 0) : 0
        };
      });

      const payload = {
        order_type: 'DOMESTIC',
        sender: {
          name: draft.sender.name,
          phone: draft.sender.phone,
          address: [draft.sender.address_detail, sWrd, sDist, sName].filter(Boolean).join(', '),
          province_id: Number(draft.sender.province_id),
          district_id: Number(draft.sender.district_id),
          ward_id: Number(draft.sender.ward_id),
          province_name: sName,
          district_name: sDist,
          ward_name: sWrd
        },
        receiver: {
          name: draft.receiver.name,
          phone: draft.receiver.phone,
          address: [draft.receiver.address_detail, rWrd, rDist, rName].filter(Boolean).join(', '),
          province_id: Number(draft.receiver.province_id),
          district_id: Number(draft.receiver.district_id),
          ward_id: Number(draft.receiver.ward_id),
          province_name: rName,
          district_name: rDist,
          ward_name: rWrd
        },
        items: draft.items.map(i => ({
          product_group: 'PARCEL',
          product_name: i.product_name,
          weight: Number(i.weight),
          length: Number(i.length || 0),
          width: Number(i.width || 0),
          height: Number(i.height || 0),
          quantity: Number(i.quantity || 1),
          declared_value: Number(i.declared_value || 0)
        })),
        cod_amount: Number(draft.cod_amount || 0),
        cod_receiver_pays_fee: draft.cod_receiver_pays_fee,
        service_type: draft.service_type,
        extra_services: mappedExtra,
        delivery_note_option: draft.delivery_note_option,
        note: draft.note,
        payment_method: draft.payment_method,
        pickup_method: 'OUR_STAFF_PICKUP',
        delivery_method: 'OUR_STAFF_DELIVERY',
        target_hub_id: draft.target_hub_id || null,
        save_as_draft: false
      };

      await api.post('/api/waybills/customer/pickups', payload);
      successCount++;
    } catch (err) {
      console.error('Lỗi khi gửi đơn nháp:', err);
      failedDrafts.push(draft);
    }
  }

  submitLoading.value = false;
  draftsList.value = failedDrafts;
  localStorage.setItem('customer_pickup_queue', JSON.stringify(failedDrafts));

  if (successCount > 0) {
    if (failedDrafts.length === 0) {
      ElMessage.success(`Tạo thành công ${successCount} đơn hàng! Vui lòng gom chung vào túi thư để bưu tá lấy.`);
    } else {
      ElMessage.warning(`Tạo thành công ${successCount} đơn. ${failedDrafts.length} đơn lỗi vẫn nằm trong hàng chờ.`);
    }
    fetchPickupsList();
  } else {
    ElMessage.error('Không thể tạo đơn hàng từ hàng chờ. Vui lòng kiểm tra lại thông tin.');
  }
};

// LOAD PICKUPS LIST
const fetchPickupsList = async () => {
  listLoading.value = true;
  try {
    const [waybillRes, bulkRes] = await Promise.all([
      api.get('/api/waybills/customer/pickups'),
      api.get('/api/waybills/customer/bulk-mail-pickups')
    ]);
    const normalizeBulkRow = (row) => ({
      ...row,
      pickup_mode: 'BULK_MAIL',
      hub_name: row.hub_name || 'Đang xử lý...',
      price_status: 'PENDING_OCR',
      estimated_total_amount: 0,
      final_total_amount: null,
      waybill_status: row.waybill_code ? 'CREATED' : null
    });

    const bulkRows = (bulkRes.data || []).map(normalizeBulkRow);
    const bulkRequestIds = new Set(bulkRows.map(row => row.request_id).filter(Boolean));
    const bulkBagCodes = new Set(bulkRows.map(row => row.bag_code).filter(Boolean));
    const fallbackBulkMap = new Map();
    const regularRows = (waybillRes.data || [])
      .filter(row => {
        const isBulkChild = row.pickup_mode === 'BULK_MAIL'
          || (row.request_id && bulkRequestIds.has(row.request_id))
          || (row.bag_code && bulkBagCodes.has(row.bag_code));
        if (!isBulkChild) return true;

        const key = row.request_id || row.bag_code;
        if (!bulkRequestIds.has(row.request_id) && key && !fallbackBulkMap.has(key)) {
          fallbackBulkMap.set(key, normalizeBulkRow({
            ...row,
            waybills: (waybillRes.data || [])
              .filter(item => (row.request_id && item.request_id === row.request_id) || (row.bag_code && item.bag_code === row.bag_code))
              .map(item => ({
                waybill_id: item.waybill_id,
                waybill_code: item.waybill_code,
                status: item.waybill_status || item.status,
                receiver_name: item.receiver_name,
                receiver_phone: item.receiver_phone,
                receiver_address: item.receiver_address
              })),
            estimated_quantity: row.estimated_quantity || row.est_quantity || row.bag_item_count,
          }));
        }
        return false;
      })
      .map(row => ({ ...row, pickup_mode: row.pickup_mode || 'SINGLE_WAYBILL' }));
    const fallbackBulkRows = [...fallbackBulkMap.values()];
    pickupsList.value = [...regularRows, ...bulkRows, ...fallbackBulkRows].map(row => {
      return {
        ...row,
        parsedDept: row.customer_department_name || parseDeptFromNote(row.notes || row.note)
      };
    }).sort((a, b) => {
      return new Date(b.created_at || 0) - new Date(a.created_at || 0);
    });
  } catch (err) {
    console.error('Error loading pickups list:', err);
  } finally {
    listLoading.value = false;
  }
};

// DETAIL & TIMELINE DIALOG
const openDetail = async (row) => {
  activeDetailTab.value = 'general';
  detailDialogVisible.value = true;
  
  if (row.waybill_code && row.pickup_mode !== 'BULK_MAIL') {
    timelineLoading.value = true;
    pickupTimeline.value = [];
    try {
      const detailRes = await api.get(`/api/waybills/customer/pickups/${row.waybill_code}`);
      const mappedDetail = {
        ...detailRes.data,
        parsedDept: detailRes.data.customer_department_name || parseDeptFromNote(detailRes.data.notes || detailRes.data.note)
      };
      selectedPickup.value = mappedDetail;
      
      const idx = pickupsList.value.findIndex(item => item.waybill_code === row.waybill_code);
      if (idx !== -1) {
        pickupsList.value[idx] = mappedDetail;
      }
    } catch (err) {
      console.error('Error fetching pickup detail:', err);
      selectedPickup.value = row;
    }

    try {
      const res = await api.get(`/api/waybills/${row.waybill_code}/timeline`);
      pickupTimeline.value = res.data?.timeline || [];
      selectedPickup.value = {
        ...selectedPickup.value,
        bill_image_url: res.data?.bill_image_url || selectedPickup.value?.bill_image_url,
        pickup_image_url: res.data?.pickup_image_url || selectedPickup.value?.pickup_image_url,
        pickup_image_urls: res.data?.pickup_image_urls || selectedPickup.value?.pickup_image_urls || [],
        pod_image_url: res.data?.pod_image_url || selectedPickup.value?.pod_image_url,
        pod_image_urls: res.data?.pod_image_urls || selectedPickup.value?.pod_image_urls || []
      };
    } catch (err) {
      console.error('Error fetching timeline:', err);
    } finally {
      timelineLoading.value = false;
    }
  } else {
    selectedPickup.value = row;
    pickupTimeline.value = [];
  }
};

const getPickupWaybillCodes = (row) => {
  if (!row) return [];
  const items = Array.isArray(row.waybills)
    ? row.waybills
    : (Array.isArray(row.waybill_items) ? row.waybill_items : []);
  const codes = items
    .map(item => item?.waybill_code || item?.bill_code || item?.code)
    .filter(Boolean);
  if (row.waybill_code) codes.unshift(row.waybill_code);
  return [...new Set(codes)];
};

const getPickupWaybills = (row) => {
  if (!row) return [];
  return Array.isArray(row.waybills)
    ? row.waybills.filter(item => item?.waybill_code)
    : [];
};

const openBulkWaybillDetail = (pickup, waybill) => {
  openDetail({
    ...pickup,
    ...waybill,
    pickup_mode: 'SINGLE_WAYBILL',
    pickup_status: pickup.pickup_status,
    waybill_status: waybill.status,
    request_code: pickup.request_code,
    bag_code: pickup.bag_code,
  });
};

const openRouteWaybillDetail = async () => {
  const routeCode = route.params.waybill_code || route.query.waybill_code;
  if (!routeCode) return;
  const code = String(routeCode).trim();
  const row = pickupsList.value.find(item => item.waybill_code === code);
  await openDetail(row || { waybill_code: code, pickup_mode: 'SINGLE_WAYBILL' });
};

watch(
  () => [route.params.waybill_code, route.query.waybill_code],
  () => {
    if (pickupsList.value.length) {
      openRouteWaybillDetail();
    }
  }
);

const getOcrStatusLabel = (status) => {
  const labels = {
    PENDING: 'Chờ OCR',
    INCOMPLETE: 'Thiếu thông tin',
    REVIEW: 'Chờ hoàn thiện',
    CONVERTED: 'Đã tạo đơn',
    SUCCESS: 'Thành công',
  };
  return labels[status] || status || 'Chờ OCR';
};

const getOcrStatusType = (status) => {
  if (['CONVERTED', 'SUCCESS'].includes(status)) return 'success';
  if (status === 'INCOMPLETE') return 'danger';
  return 'warning';
};

const getDiffMessage = (row) => {
  const diff = (row.final_total_amount || 0) - (row.estimated_total_amount || 0);
  if (diff > 0) {
    return `Tổng cước sau cân đo tăng thêm ${diff.toLocaleString()}đ so với tạm tính ban đầu do chênh lệch trọng lượng thực tế.`;
  } else if (diff < 0) {
    return `Tổng cước sau cân đo giảm đi ${Math.abs(diff).toLocaleString()}đ so với tạm tính ban đầu do chênh lệch trọng lượng thực tế.`;
  }
  return 'Tổng cước sau cân đo không đổi.';
};

const getDiffAlertType = (row) => {
  const diff = (row.final_total_amount || 0) - (row.estimated_total_amount || 0);
  return diff > 0 ? 'warning' : 'success';
};

const formatDate = (val) => {
  return formatVietnamDateTime(val);
};

const getMediaUrl = resolveMediaUrl;

const getPickupStatusLabel = (status) => {
  switch (status) {
    case 'PENDING_CONFIRMATION': return 'Chờ điều phối';
    case 'HUB_REJECTED': return 'Chờ điều phối (Bị từ chối)';
    case 'DISPATCHED_TO_HUB': return 'Chưa xác nhận văn phòng';
    case 'RECEIVED': return 'Văn phòng đã tiếp nhận';
    case 'ASSIGNED_PICKUP': return 'Đã gán bưu tá';
    case 'PICKED': return 'Bưu tá đã lấy hàng';
    default: return status || 'Chờ xử lý';
  }
};

const getPickupStatusType = (status) => {
  switch (status) {
    case 'PENDING_CONFIRMATION': return 'warning';
    case 'HUB_REJECTED': return 'danger';
    case 'DISPATCHED_TO_HUB': return 'info';
    case 'RECEIVED': return 'primary';
    case 'ASSIGNED_PICKUP': return 'warning';
    case 'PICKED': return 'success';
    default: return 'info';
  }
};

const getCustomerOrderStatusLabel = (row) => {
  if (row?.ocr_status === 'CONVERTED' || row?.waybill_status === 'CREATED') {
    return 'Đơn đã được tạo';
  }
  if (['REVIEW', 'INCOMPLETE', 'PENDING'].includes(row?.ocr_status)
      || ['PENDING_OCR', 'PICKED_PENDING_VERIFY'].includes(row?.waybill_status)) {
    return 'Đang xác nhận hoàn thiện thông tin';
  }
  return getPickupStatusLabel(row?.pickup_status);
};

const getCustomerOrderStatusType = (row) => {
  if (row?.ocr_status === 'CONVERTED' || row?.waybill_status === 'CREATED') return 'success';
  if (['REVIEW', 'INCOMPLETE', 'PENDING'].includes(row?.ocr_status)
      || ['PENDING_OCR', 'PICKED_PENDING_VERIFY'].includes(row?.waybill_status)) return 'warning';
  return getPickupStatusType(row?.pickup_status);
};

const customerOrderRowClass = ({ row }) => ['HT', 'EXPRESS'].includes(row?.service_type) ? 'urgent-order-row' : '';

const getServiceTypeLabel = (serviceType) => {
  switch ((serviceType || '').toUpperCase()) {
    case 'STANDARD': case 'TK': return 'Tiết kiệm (Tiêu chuẩn)';
    case 'ECONOMY': return 'Tiết kiệm';
    case 'FAST': case 'CPN': return 'Chuyển phát nhanh';
    case 'EXPRESS': case 'HT': return 'Hỏa tốc';
    case 'EXPRESS_STANDARD': return 'Nhanh tiêu chuẩn';
    default: return serviceType || '---';
  }
};

const getPaymentMethodLabel = (method) => {
  switch ((method || '').toUpperCase()) {
    case 'SENDER_DEBT': return 'Người gửi trả (Công nợ)';
    case 'RECEIVER_PAYS': return 'Người nhận trả';
    case 'COD_DEDUCT': return 'Trừ vào tiền COD';
    default: return method || '---';
  }
};

const getWaybillStatusLabel = (status) => {
  switch (status) {
    case 'CREATED': return 'Vừa tạo';
    case 'PICKED_PENDING_VERIFY': return 'Chờ nhập kho';
    case 'IN_HUB': return 'Đã nhập kho';
    case 'PENDING_CONFIRMATION': return 'Chờ duyệt';
    case 'PENDING_PICKUP': return 'Chờ lấy hàng';
    case 'IN_TRANSIT': return 'Đang luân chuyển';
    case 'DELIVERING': return 'Đang giao hàng';
    case 'DELIVERED': return 'Giao thành công';
    case 'RETURNED': return 'Đã chuyển hoàn';
    default: return status || 'Chờ xử lý';
  }
};

const getWaybillStatusType = (status) => {
  switch (status) {
    case 'CREATED': return 'info';
    case 'PICKED_PENDING_VERIFY': return 'warning';
    case 'IN_HUB': return 'success';
    case 'PENDING_CONFIRMATION': return 'warning';
    case 'PENDING_PICKUP': return 'info';
    case 'DELIVERING': return 'primary';
    case 'DELIVERED': return 'success';
    case 'RETURNED': return 'danger';
    default: return 'info';
  }
};

const openChangePasswordDialog = () => {
  changePasswordForm.current_password = '';
  changePasswordForm.new_password = '';
  changePasswordForm.confirm_password = '';
  changePasswordVisible.value = true;
};

const changePassword = async () => {
  if (!changePasswordForm.current_password) {
    ElMessage.warning('Vui lòng nhập mật khẩu hiện tại');
    return;
  }
  if (!changePasswordForm.new_password || changePasswordForm.new_password.length < 6) {
    ElMessage.warning('Mật khẩu mới phải có ít nhất 6 ký tự');
    return;
  }
  if (changePasswordForm.new_password !== changePasswordForm.confirm_password) {
    ElMessage.warning('Mật khẩu nhập lại không khớp');
    return;
  }

  changePasswordLoading.value = true;
  try {
    const res = await api.post('/api/auth/change-password', {
      current_password: changePasswordForm.current_password,
      new_password: changePasswordForm.new_password
    });
    ElMessage.success(res.data?.message || 'Đổi mật khẩu thành công');
    changePasswordVisible.value = false;
  } catch (err) {
    ElMessage.error(err.response?.data?.detail || 'Không thể đổi mật khẩu');
  } finally {
    changePasswordLoading.value = false;
  }
};

const handleLogout = () => {
  authStore.logout();
  ElMessage.success('Đã đăng xuất tài khoản!');
  router.push('/login');
};

const goToTracking = () => {
  router.push('/tracking');
};

const openEditDialog = async () => {
  editForm.full_name = authStore.user?.full_name || customerInfo.value.transaction_name || '';
  editForm.phone_number = customerInfo.value.phone_number || '';
  editForm.province_id = customerInfo.value.province_id || null;
  editForm.district_id = customerInfo.value.district_id || null;
  editForm.ward_id = customerInfo.value.ward_id || null;
  editForm.address_detail = customerInfo.value.address_detail || '';

  // Preload editDistricts and editWards
  if (editForm.province_id) {
    editDistricts.value = await fetchDistrictsForProvince(editForm.province_id);
  } else {
    editDistricts.value = [];
  }
  if (editForm.district_id) {
    editWards.value = await fetchWardsForDistrict(editForm.district_id);
  } else {
    editWards.value = [];
  }

  editDialogVisible.value = true;
};

const handleSaveProfile = async () => {
  if (!editForm.full_name.trim()) {
    ElMessage.warning('Vui lòng điền tên đại diện Shop');
    return;
  }
  if (!editForm.phone_number.trim()) {
    ElMessage.warning('Vui lòng điền số điện thoại liên hệ');
    return;
  }

  const pName = getProvinceName(editForm.province_id);
  const dName = getDistrictName(editForm.province_id, editForm.district_id);
  const wName = getWardName(editForm.district_id, editForm.ward_id);

  try {
    const res = await api.patch('/api/customers/me', {
      full_name: editForm.full_name,
      phone_number: editForm.phone_number,
      province_id: editForm.province_id,
      district_id: editForm.district_id,
      ward_id: editForm.ward_id,
      province: pName,
      ward: wName,
      address_detail: editForm.address_detail
    });

    const updated = res.data?.customer || {};
    customerInfo.value = {
      ...customerInfo.value,
      ...updated,
      phone_number: updated.phone_number || updated.phone || editForm.phone_number,
      province_id: updated.province_id || editForm.province_id,
      district_id: updated.district_id || editForm.district_id,
      ward_id: updated.ward_id || editForm.ward_id,
      address_detail: updated.address_detail || editForm.address_detail,
      address_detail_custom: [editForm.address_detail, wName, dName, pName].filter(Boolean).join(', ')
    };

    if (authStore.user) {
      authStore.user.full_name = editForm.full_name;
      authStore.user.phone_number = editForm.phone_number;
      localStorage.setItem('user', JSON.stringify(authStore.user));
    }

    ElMessage.success(res.data?.message || 'Cập nhật thông tin cá nhân thành công!');
    editDialogVisible.value = false;
  } catch (err) {
    ElMessage.error(err.response?.data?.detail || 'Không thể cập nhật hồ sơ khách hàng');
  }
};

const mapInstance = ref(null);

const getCoordinatesForLocationName = (name) => {
  if (!name) return null;
  const n = name.toLowerCase();
  
  // 1. Kiểm tra trong danh sách bưu cục động từ DB trước
  if (Array.isArray(hubsList.value)) {
    const foundHub = hubsList.value.find(h => {
      const hubNameLower = h.hub_name ? h.hub_name.toLowerCase() : '';
      const hubCodeLower = h.hub_code ? h.hub_code.toLowerCase() : '';
      return (
        hubNameLower && (
          n === hubNameLower ||
          n.includes(hubNameLower) ||
          (hubCodeLower && n.includes(hubCodeLower))
        )
      );
    });
    if (foundHub && foundHub.latitude && foundHub.longitude) {
      return [Number(foundHub.latitude), Number(foundHub.longitude)];
    }
  }
  
  // 2. Fallback sang tọa độ hardcode tĩnh nếu không khớp bưu cục DB hoặc bưu cục chưa cấu hình tọa độ
  if (n.includes('trụ sở chính') || n.includes('tru so chinh') || n.includes('hcm') || n.includes('hồ chí minh')) {
    return [10.776889, 106.700806];
  }
  if (n.includes('vp hà nội') || n.includes('vp ha noi') || n.includes('bưu cục hà nội') || n.includes('buu cuc ha noi')) {
    return [21.028511, 105.804817];
  }
  if (n.includes('khai thác miền bắc') || n.includes('khai thac mien bac') || n.includes('kho miền bắc') || n.includes('khai thac kho mien bac')) {
    return [21.0822, 105.7821];
  }
  if (n.includes('khai thác kho miền nam') || n.includes('khai thac kho mien nam') || n.includes('kho miền nam') || n.includes('khai thac mien nam')) {
    return [10.8402, 106.7724];
  }
  if (n.includes('quảng trị') || n.includes('quang tri')) {
    return [16.7433, 107.1855];
  }
  if (n.includes('đắk nông') || n.includes('dak nong')) {
    return [12.2131, 107.6908];
  }
  if (n.includes('đà nẵng') || n.includes('da nang') || n.includes('hải châu') || n.includes('liên chiểu')) {
    return [16.054407, 108.202164];
  }

  // Tọa độ quận huyện Hà Nội
  if (n.includes('cầu giấy')) return [21.036237, 105.790583];
  if (n.includes('nam từ liêm') || n.includes('mỹ đình')) return [21.020526, 105.776662];
  if (n.includes('đống đa')) return [21.018047, 105.823902];
  if (n.includes('ba đình')) return [21.036067, 105.826279];
  if (n.includes('hai bà trưng')) return [21.009072, 105.850428];
  if (n.includes('hoàng mai')) return [20.978187, 105.845942];
  if (n.includes('thanh xuân')) return [20.993751, 105.811833];
  if (n.includes('hà đông')) return [20.968603, 105.774887];
  if (n.includes('long biên')) return [21.042784, 105.889025];
  if (n.includes('tây hồ')) return [21.066492, 105.818817];
  if (n.includes('gia lâm')) return [21.029671, 105.940555];
  if (n.includes('thanh trì')) return [20.949791, 105.836015];
  if (n.includes('hoài đức')) return [21.018785, 105.706179];
  if (n.includes('hoàn kiếm')) return [21.028511, 105.804817];
  
  // Tỉnh thành khác
  if (n.includes('hà nội')) return [21.028511, 105.804817];
  if (n.includes('bình dương')) return [11.0296, 106.666];
  if (n.includes('đồng nai') || n.includes('biên hòa')) return [10.957, 106.842];
  if (n.includes('hải phòng')) return [20.8449, 106.6881];
  if (n.includes('cần thơ')) return [10.0452, 105.7469];
  
  return [21.028511, 105.804817];
};

const initMap = () => {
  if (typeof window.L === 'undefined') {
    setTimeout(initMap, 200);
    return;
  }
  
  if (mapInstance.value) {
    try {
      mapInstance.value.remove();
    } catch (e) {
      console.error(e);
    }
    mapInstance.value = null;
  }
  
  const mapContainer = document.getElementById('timeline-map');
  if (!mapContainer) return;
  
  // Fix Leaflet marker icon URL issue in webpack/vite
  delete window.L.Icon.Default.prototype._getIconUrl;
  window.L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  });

  const points = [];
  
  // 1. Điểm Người gửi (Bắt đầu)
  const senderLoc = selectedPickup.value?.sender_address || selectedPickup.value?.sender_district_name || selectedPickup.value?.sender_province_name;
  const senderCoords = getCoordinatesForLocationName(senderLoc);
  if (senderCoords) {
    points.push({
      latlng: [...senderCoords],
      title: 'Người gửi (Điểm bắt đầu)',
      desc: selectedPickup.value?.sender_name || 'Người gửi',
      type: 'sender'
    });
  }
  
  // Lọc duy nhất các bưu cục trung chuyển thực tế theo trình tự di chuyển
  const transitHubs = [];
  if (selectedPickup.value?.hub_name) {
    transitHubs.push(selectedPickup.value.hub_name.trim());
  }

  if (Array.isArray(pickupTimeline.value)) {
    // Sắp xếp timeline theo thứ tự thời gian tăng dần
    const sortedTimeline = [...pickupTimeline.value];
    sortedTimeline.forEach(log => {
      if (log.location && log.location !== '---') {
        const locName = log.location.trim();
        // Chỉ thêm nếu khác bưu cục cuối cùng trong danh sách (tránh lặp mốc khi có nhiều log tại cùng 1 bưu cục)
        if (transitHubs.length === 0 || transitHubs[transitHubs.length - 1].toLowerCase() !== locName.toLowerCase()) {
          transitHubs.push(locName);
        }
      }
    });
  }

  // Chuyển đổi danh sách bưu cục trung chuyển sang mảng points
  transitHubs.forEach((hubName, idx) => {
    const coords = getCoordinatesForLocationName(hubName);
    if (coords) {
      points.push({
        latlng: [...coords],
        title: idx === 0 ? 'Bưu cục tiếp nhận (Bắt đầu gom)' : `Bưu cục trung chuyển: ${hubName}`,
        desc: hubName,
        type: idx === 0 ? 'hub' : 'transit'
      });
    }
  });

  // Điểm Người nhận (Kết thúc)
  const receiverLoc = selectedPickup.value?.receiver_address || selectedPickup.value?.receiver_district_name || selectedPickup.value?.receiver_province_name;
  const receiverCoords = getCoordinatesForLocationName(receiverLoc);
  if (receiverCoords) {
    points.push({
      latlng: [...receiverCoords],
      title: 'Người nhận (Điểm kết thúc)',
      desc: selectedPickup.value?.receiver_name || 'Người nhận',
      type: 'receiver'
    });
  }

  if (points.length === 0) return;

  const centerCoords = points[0].latlng;
  const map = window.L.map('timeline-map').setView(centerCoords, 12);
  mapInstance.value = map;
  
  window.L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    subdomains: 'abcd',
    maxZoom: 20
  }).addTo(map);

  // Khởi tạo custom div icon bằng SVG
  const createCustomIcon = (color, char) => {
    return window.L.divIcon({
      html: `
        <div style="position: relative; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center;">
          <svg width="30" height="30" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M15 2C9.48 2 5 6.48 5 12C5 18.52 13.25 26.96 14.3 27.97C14.7 28.36 15.3 28.36 15.7 27.97C16.75 26.96 25 18.52 25 12C25 6.48 20.52 2 15 2Z" fill="${color}"/>
            <circle cx="15" cy="12" r="6" fill="white"/>
          </svg>
          <span style="position: absolute; top: 5px; font-size: 11px; font-weight: 800; color: ${color}; font-family: sans-serif;">${char}</span>
        </div>
      `,
      className: 'custom-map-marker',
      iconSize: [30, 30],
      iconAnchor: [15, 28],
      popupAnchor: [0, -28]
    });
  };

  const icons = {
    sender: createCustomIcon('#10b981', 'S'),   // Xanh lá (Start/Sender)
    receiver: createCustomIcon('#ef4444', 'R'), // Đỏ (Receiver/End)
    hub: createCustomIcon('#3b82f6', 'H'),      // Xanh dương (Hub tiếp nhận)
    transit: createCustomIcon('#f59e0b', 'T')  // Vàng cam (Transit)
  };

  const latlngs = [];
  points.forEach((pt) => {
    latlngs.push(pt.latlng);
    const icon = icons[pt.type] || icons.transit;
    const marker = window.L.marker(pt.latlng, { icon }).addTo(map);
    marker.bindPopup(`
      <div style="font-family: sans-serif; font-size: 13px; line-height: 1.4; max-width: 220px;">
        <b style="color: #1e293b; font-size: 14px;">${pt.title}</b>
        <p style="margin: 4px 0 0 0; color: #64748b;">${pt.desc}</p>
      </div>
    `);
  });
  
  if (latlngs.length > 1) {
    // 1. Luôn thêm marker chủ quyền Quần đảo Hoàng Sa và Trường Sa (Việt Nam) một cách tinh tế
    const sovereigntyIcon = window.L.divIcon({
      html: `
        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; width: 80px;">
          <div style="width: 8px; height: 8px; background-color: #ef4444; border-radius: 50%; border: 1.5px solid white; box-shadow: 0 0 4px rgba(0,0,0,0.4);"></div>
          <span style="font-family: sans-serif; font-size: 9px; font-weight: 700; color: #475569; text-shadow: 0px 0px 3px white; margin-top: 2px; text-align: center; white-space: nowrap;">QĐ. Hoàng Sa<br>(Việt Nam)</span>
        </div>
      `,
      className: 'sovereignty-marker',
      iconSize: [80, 30],
      iconAnchor: [40, 4]
    });
    
    const truongSaIcon = window.L.divIcon({
      html: `
        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; width: 80px;">
          <div style="width: 8px; height: 8px; background-color: #ef4444; border-radius: 50%; border: 1.5px solid white; box-shadow: 0 0 4px rgba(0,0,0,0.4);"></div>
          <span style="font-family: sans-serif; font-size: 9px; font-weight: 700; color: #475569; text-shadow: 0px 0px 3px white; margin-top: 2px; text-align: center; white-space: nowrap;">QĐ. Trường Sa<br>(Việt Nam)</span>
        </div>
      `,
      className: 'sovereignty-marker',
      iconSize: [80, 30],
      iconAnchor: [40, 4]
    });

    window.L.marker([16.5, 112.0], { icon: sovereigntyIcon, interactive: false }).addTo(map);
    window.L.marker([8.63, 111.92], { icon: truongSaIcon, interactive: false }).addTo(map);

    // 2. Hàm tính khoảng cách giữa 2 tọa độ (Km)
    const getDistanceKm = (c1, c2) => {
      const R = 6371;
      const dLat = (c2[0] - c1[0]) * Math.PI / 180;
      const dLon = (c2[1] - c1[1]) * Math.PI / 180;
      const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(c1[0] * Math.PI / 180) * Math.cos(c2[0] * Math.PI / 180) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      return R * c;
    };

    // Hàm chèn các điểm trung gian dọc duyên hải miền Trung Việt Nam để ép đường đi bám sát địa phận Việt Nam
    const getVietnamWaypoints = (c1, c2) => {
      const vnDọcBờBiển = [
        { latlng: [10.9322, 108.1009] }, // Phan Thiết
        { latlng: [12.2458, 109.1948] }, // Nha Trang
        { latlng: [13.7731, 109.2244] }, // Quy Nhơn
        { latlng: [15.1205, 108.7924] }, // Quảng Ngãi
        { latlng: [16.0544, 108.2022] }, // Đà Nẵng
        { latlng: [17.4761, 106.5983] }, // Đồng Hới
        { latlng: [18.6733, 105.6813] }, // Vinh
        { latlng: [19.8075, 105.7764] }  // Thanh Hóa
      ];

      const minLat = Math.min(c1[0], c2[0]);
      const maxLat = Math.max(c1[0], c2[0]);

      // Lấy các mốc nằm giữa phạm vi vĩ độ của 2 điểm đầu/cuối chặng
      const midPoints = vnDọcBờBiển.filter(pt => pt.latlng[0] > minLat + 0.5 && pt.latlng[0] < maxLat - 0.5);

      // Sắp xếp theo chiều di chuyển Nam -> Bắc hoặc Bắc -> Nam
      if (c1[0] < c2[0]) {
        midPoints.sort((a, b) => a.latlng[0] - b.latlng[0]);
      } else {
        midPoints.sort((a, b) => b.latlng[0] - a.latlng[0]);
      }

      return midPoints.map(pt => pt.latlng);
    };

    const drawSegment = async (startPt, endPt) => {
      // Đoạn ngắn: ưu tiên vẽ uốn lượn theo đường bộ thực tế qua OSRM
      const url = `https://router.project-osrm.org/route/v1/driving/${startPt[1]},${startPt[0]};${endPt[1]},${endPt[0]}?overview=full&geometries=geojson`;
      try {
        const res = await fetch(url);
        const data = await res.json();
        if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
          const routeCoords = data.routes[0].geometry.coordinates.map(coord => [coord[1], coord[0]]);
          window.L.polyline(routeCoords, {
            color: '#4f46e5',
            weight: 5,
            opacity: 0.85,
            lineJoin: 'round'
          }).addTo(map);
          return;
        }
      } catch (e) {
        console.warn('OSRM segment routing error:', e);
      }

      // Fallback vẽ đường thẳng
      window.L.polyline([startPt, endPt], {
        color: '#4f46e5',
        weight: 4,
        opacity: 0.8,
        lineJoin: 'round'
      }).addTo(map);
    };

    // Vẽ từng chặng thông minh
    const drawLeg = async (c1, c2) => {
      const distance = getDistanceKm(c1, c2);
      if (distance >= 150) {
        // Chặng dài (liên tỉnh Bắc-Nam) -> Chèn các waypoint bờ biển Việt Nam để hướng đường đi bám sát địa phận Việt Nam
        const waypoints = getVietnamWaypoints(c1, c2);
        const allPointsInLeg = [c1, ...waypoints, c2];
        for (let idx = 0; idx < allPointsInLeg.length - 1; idx++) {
          await drawSegment(allPointsInLeg[idx], allPointsInLeg[idx + 1]);
        }
      } else {
        await drawSegment(c1, c2);
      }
    };

    // Vẽ các chặng tuần tự
    (async () => {
      for (let i = 0; i < latlngs.length - 1; i++) {
        await drawLeg(latlngs[i], latlngs[i+1]);
      }
    })();

    const boundsPolyline = window.L.polyline(latlngs);
    map.fitBounds(boundsPolyline.getBounds(), { padding: [40, 40] });
  } else if (latlngs.length === 1) {
    map.setView(latlngs[0], 13);
  }
};

const loadLeafletAssets = () => {
  if (document.getElementById('leaflet-css')) {
    initMap();
    return;
  }
  
  const link = document.createElement('link');
  link.id = 'leaflet-css';
  link.rel = 'stylesheet';
  link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
  document.head.appendChild(link);
  
  const script = document.createElement('script');
  script.id = 'leaflet-js';
  script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
  script.onload = () => {
    initMap();
  };
  document.head.appendChild(script);
};

watch(
  () => activeDetailTab.value,
  (newTab) => {
    if (newTab === 'timeline') {
      setTimeout(() => {
        loadLeafletAssets();
      }, 200);
    }
  }
);

const loadDrafts = () => {
  try {
    const storedQueue = localStorage.getItem('customer_pickup_queue');
    if (storedQueue) {
      draftsList.value = JSON.parse(storedQueue);
    }
  } catch (e) {
    console.error('Lỗi khi tải hàng chờ', e);
  }
  
  try {
    const storedDrafts = localStorage.getItem('customer_pickup_drafts');
    if (storedDrafts) {
      savedDraftsList.value = JSON.parse(storedDrafts);
    }
  } catch (e) {
    console.error('Lỗi khi tải bản nháp', e);
  }
};

onMounted(async () => {
  if (!authStore.user) return;

  loadDrafts();
  await loadDepartments();

  // 1. Fetch provinces first
  await fetchProvinces();

  let activeUser = authStore.user;
  try {
    const meRes = await api.get('/api/auth/me');
    if (meRes.data) {
      activeUser = {
        ...authStore.user,
        ...meRes.data
      };
      authStore.user = activeUser;
      localStorage.setItem('user', JSON.stringify(activeUser));
    }
  } catch (err) {
    console.error('Không thể gọi API /api/auth/me', err);
  }

  try {
    const res = await api.get('/api/customers/me');
    customerInfo.value = {
      ...customerInfo.value,
      ...res.data,
      phone_number: res.data.phone_number || res.data.phone || activeUser.phone_number || '',
      email: res.data.email || activeUser.email || ''
    };

    // 2. Preload districts and wards for the customer's registered address
    if (customerInfo.value.province_id) {
      const dists = await fetchDistrictsForProvince(customerInfo.value.province_id);
      senderDistricts.value = dists;
      editDistricts.value = dists;
    }
    if (customerInfo.value.district_id) {
      const wrds = await fetchWardsForDistrict(customerInfo.value.district_id);
      senderWards.value = wrds;
      editWards.value = wrds;
    }
  } catch (err) {
    console.error('Không thể tải thông tin hồ sơ khách hàng', err);
    customerInfo.value = {
      customer_code: 'REG-PENDING',
      phone_number: activeUser.phone_number || 'Chưa cập nhật',
      email: activeUser.email || '',
      address_detail: '',
      province_id: null,
      district_id: null,
      ward_id: null
    };
  }

  await fetchPickupsList();
  await openRouteWaybillDetail();
  fetchAvailableServices();
  fetchHubs();
  window.addEventListener('realtime-pickup-event', handleRealtimeEvent);
});

const handleRealtimeEvent = (e) => {
  const { event } = e.detail;
  if (event && event.startsWith('pickup.')) {
    fetchPickupsList();
  }
};

onBeforeUnmount(() => {
  window.removeEventListener('realtime-pickup-event', handleRealtimeEvent);
  if (mapInstance.value) {
    try {
      mapInstance.value.remove();
    } catch (e) {
      console.error(e);
    }
  }
});
</script>
<style scoped src="./CustomerPortal.css"></style>
