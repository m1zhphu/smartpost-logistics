<template>
  <div class="customer-portal">
    <div class="portal-container">
      
      <!-- Top Header / Profile Info -->
      <header class="portal-header animate-fade-in">
        <div class="brand-info">
          <img src="@/assets/CompanyLogo4.png" alt="SmartPost" class="portal-logo" />
          <div class="welcome-text">
            <h2>CỔNG THÔNG TIN KHÁCH HÀNG</h2>
            <p>Chào mừng quý khách, <strong>{{ authStore.user?.full_name || 'Khách hàng' }}</strong></p>
          </div>
        </div>
        <div class="header-actions">
          <el-button type="danger" plain @click="handleLogout">
            <el-icon class="mr-6"><Close /></el-icon> Đăng xuất
          </el-button>
        </div>
      </header>

      <el-row :gutter="24" class="portal-content">
        <!-- Left Side: Profile Details & Support -->
        <el-col :xs="24" :sm="24" :md="7" v-if="!showCreateForm">
          <el-card class="profile-card info-card animate-fade-in">
            <template #header>
              <div class="card-header-title">
                <el-icon><User /></el-icon><span>Hồ sơ khách hàng</span>
              </div>
            </template>
            <div class="profile-details">
              <div class="avatar-wrapper">
                <el-avatar :size="70" class="portal-avatar">{{ authStore.user?.full_name?.charAt(0) || 'C' }}</el-avatar>
                <h3>{{ authStore.user?.full_name }}</h3>
                <el-tag type="success" size="small" effect="dark" round>Tài khoản Shop</el-tag>
              </div>
              <div class="details-list">
                <div class="detail-item">
                  <span class="label">Mã khách hàng:</span>
                  <span class="value">{{ customerInfo.customer_code || 'REG-PENDING' }}</span>
                </div>
                <div class="detail-item">
                  <span class="label">Số điện thoại:</span>
                  <span class="value">{{ customerInfo.phone_number || 'Chưa cập nhật' }}</span>
                </div>
                <div class="detail-item">
                  <span class="label">Email liên hệ:</span>
                  <span class="value">{{ customerInfo.email }}</span>
                </div>
                <div class="detail-item">
                  <span class="label">Địa chỉ đăng ký:</span>
                  <span class="value">{{ formattedAddress }}</span>
                </div>
              </div>
              <div style="margin-top: 20px; text-align: center; width: 100%;">
                <el-button type="primary" style="width: 100%;" @click="openEditDialog">
                  <el-icon class="mr-6"><Edit /></el-icon> Cập nhật thông tin
                </el-button>
                <el-button plain style="width: 100%; margin: 10px 0 0;" @click="openChangePasswordDialog">
                  <el-icon class="mr-6"><Lock /></el-icon> Đổi mật khẩu
                </el-button>
              </div>
            </div>
          </el-card>

          <el-card class="support-card info-card mt-20 animate-fade-in">
            <template #header>
              <div class="card-header-title">
                <el-icon><Service /></el-icon><span>Hỗ trợ & CSKH</span>
              </div>
            </template>
            <div class="support-info">
              <p>Nếu bạn cần tư vấn gửi hàng, báo giá hoặc khiếu nại, vui lòng liên hệ:</p>
              <div class="hotline-box">
                <el-icon><Phone /></el-icon>
                <div class="hotline-details">
                  <span class="phone-num">1900 6868</span>
                  <span class="sub">(Hoạt động từ 7h00 - 22h00)</span>
                </div>
              </div>
              <div class="email-box">
                <el-icon><Message /></el-icon>
                <span>support@smartpost.vn</span>
              </div>
            </div>
          </el-card>
        </el-col>

        <!-- Right Side: Create Form or Dashboard -->
        <el-col :xs="24" :sm="24" :md="showCreateForm ? 24 : 17">
          
          <!-- ================= CREATE PICKUP REQUEST FORM ================= -->
          <div v-if="showCreateForm" class="create-pickup-form-wrapper animate-fade-in-up">
            <div class="form-header mb-4">
              <div class="flex-center gap-3">
                <el-button circle @click="cancelCreate">
                  <el-icon><ArrowLeft /></el-icon>
                </el-button>
                <div>
                  <h2 class="section-title">Tạo yêu cầu gửi hàng mới</h2>
                  <p class="section-subtitle">Nhập thông tin người gửi, người nhận và gói hàng để tạo vận đơn</p>
                </div>
              </div>
              <div class="form-header-actions">
                <el-button @click="saveDraft" type="info" plain>
                  <el-icon class="mr-1"><FolderOpened /></el-icon>Lưu nháp
                </el-button>
                <el-button type="primary" @click="submitPickupRequest" :loading="submitLoading">
                  <el-icon class="mr-1"><Upload /></el-icon>Gửi yêu cầu
                </el-button>
              </div>
            </div>

            <el-row :gutter="24">
              <!-- Left side of form: Input fields -->
              <el-col :xs="24" :sm="24" :md="16">
                <el-form :model="form" label-position="top">
                  
                  <!-- SENDER & RECEIVER INFO -->
                  <el-row :gutter="20">
                    <!-- SENDER CARD -->
                    <el-col :xs="24" :sm="12">
                      <el-card class="form-section-card mb-4" shadow="never">
                        <template #header>
                          <div class="form-card-title text-primary">
                            <el-icon><User /></el-icon><span>Thông tin Người gửi</span>
                          </div>
                        </template>
                        <el-form-item label="Họ tên người gửi" required>
                          <el-input v-model="form.sender.name" placeholder="Tên người gửi hoặc Tên shop" />
                        </el-form-item>
                        <el-form-item label="Số điện thoại" required>
                          <el-input v-model="form.sender.phone" placeholder="Số điện thoại liên hệ" />
                        </el-form-item>
                        <el-row :gutter="10">
                          <el-col :span="8">
                            <el-form-item label="Tỉnh/Thành">
                              <el-select v-model="form.sender.province_id" placeholder="Chọn tỉnh" @change="handleSenderProvinceChange" filterable>
                                <el-option v-for="p in provinces" :key="p.id" :label="p.name" :value="p.id" />
                              </el-select>
                            </el-form-item>
                          </el-col>
                          <el-col :span="8">
                            <el-form-item label="Quận/Huyện">
                              <el-select v-model="form.sender.district_id" placeholder="Chọn huyện" @change="handleSenderDistrictChange" :disabled="!form.sender.province_id" filterable>
                                <el-option v-for="d in senderDistricts" :key="d.id" :label="d.name" :value="d.id" />
                              </el-select>
                            </el-form-item>
                          </el-col>
                          <el-col :span="8">
                            <el-form-item label="Phường/Xã">
                              <el-select v-model="form.sender.ward_id" placeholder="Chọn xã" :disabled="!form.sender.district_id" filterable>
                                <el-option v-for="w in senderWards" :key="w.id" :label="w.name" :value="w.id" />
                              </el-select>
                            </el-form-item>
                          </el-col>
                        </el-row>
                        <el-form-item label="Địa chỉ chi tiết (Số nhà, đường...)">
                          <el-input v-model="form.sender.address_detail" type="textarea" :rows="2" placeholder="Địa chỉ lấy hàng chi tiết" />
                        </el-form-item>
                      </el-card>
                    </el-col>

                    <!-- RECEIVER CARD -->
                    <el-col :xs="24" :sm="12">
                      <el-card class="form-section-card mb-4" shadow="never">
                        <template #header>
                          <div class="form-card-title text-success">
                            <el-icon><User /></el-icon><span>Thông tin Người nhận</span>
                          </div>
                        </template>
                        <el-form-item label="Họ tên người nhận" required>
                          <el-input v-model="form.receiver.name" placeholder="Tên người nhận hàng" />
                        </el-form-item>
                        <el-form-item label="Số điện thoại" required>
                          <el-input v-model="form.receiver.phone" placeholder="Số điện thoại liên hệ" />
                        </el-form-item>
                        <el-row :gutter="10">
                          <el-col :span="8">
                            <el-form-item label="Tỉnh/Thành" required>
                              <el-select v-model="form.receiver.province_id" placeholder="Chọn tỉnh" @change="handleReceiverProvinceChange" filterable>
                                <el-option v-for="p in provinces" :key="p.id" :label="p.name" :value="p.id" />
                              </el-select>
                            </el-form-item>
                          </el-col>
                          <el-col :span="8">
                            <el-form-item label="Quận/Huyện" required>
                              <el-select v-model="form.receiver.district_id" placeholder="Chọn huyện" @change="handleReceiverDistrictChange" :disabled="!form.receiver.province_id" filterable>
                                <el-option v-for="d in receiverDistricts" :key="d.id" :label="d.name" :value="d.id" />
                              </el-select>
                            </el-form-item>
                          </el-col>
                          <el-col :span="8">
                            <el-form-item label="Phường/Xã" required>
                              <el-select v-model="form.receiver.ward_id" placeholder="Chọn xã" :disabled="!form.receiver.district_id" filterable>
                                <el-option v-for="w in receiverWards" :key="w.id" :label="w.name" :value="w.id" />
                              </el-select>
                            </el-form-item>
                          </el-col>
                        </el-row>
                        <el-form-item label="Địa chỉ chi tiết (Số nhà, đường...)">
                          <el-input v-model="form.receiver.address_detail" type="textarea" :rows="2" placeholder="Địa chỉ giao hàng chi tiết" />
                        </el-form-item>
                      </el-card>
                    </el-col>
                  </el-row>

                  <!-- ITEMS DETAILS -->
                  <el-card class="form-section-card mb-4" shadow="never">
                    <template #header>
                      <div class="form-card-title text-warning">
                        <el-icon><Box /></el-icon><span>Thông tin Hàng hóa</span>
                      </div>
                    </template>
                    <div v-for="(item, index) in form.items" :key="index" class="item-input-row">
                      <el-row :gutter="16">
                        <el-col :xs="24" :sm="6">
                          <el-form-item label="Tên sản phẩm" required>
                            <el-input v-model="item.product_name" placeholder="Ví dụ: Quần áo, mỹ phẩm..." @input="debouncedSimulate" />
                          </el-form-item>
                        </el-col>
                        <el-col :xs="12" :sm="4">
                          <el-form-item label="Khối lượng (kg)" required>
                            <el-input-number v-model="item.weight" :min="0.1" :step="0.1" class="w-full animate-calc" @change="debouncedSimulate" />
                          </el-form-item>
                        </el-col>
                        <el-col :xs="12" :sm="3">
                          <el-form-item label="Số lượng" required>
                            <el-input-number v-model="item.quantity" :min="1" class="w-full animate-calc" @change="debouncedSimulate" />
                          </el-form-item>
                        </el-col>
                        <el-col :xs="24" :sm="8">
                          <el-form-item label="Kích thước cm (Dài x Rộng x Cao)">
                            <div class="dimension-inputs">
                              <el-input-number v-model="item.length" :min="0" placeholder="D" class="animate-calc" @change="debouncedSimulate" />
                              <span>x</span>
                              <el-input-number v-model="item.width" :min="0" placeholder="R" class="animate-calc" @change="debouncedSimulate" />
                              <span>x</span>
                              <el-input-number v-model="item.height" :min="0" placeholder="C" class="animate-calc" @change="debouncedSimulate" />
                            </div>
                          </el-form-item>
                        </el-col>
                        <el-col :xs="24" :sm="3">
                          <el-form-item label="Khai giá (đ)">
                            <el-input-number v-model="item.declared_value" :min="0" :step="50000" class="w-full" @change="debouncedSimulate" />
                          </el-form-item>
                        </el-col>
                      </el-row>
                    </div>
                  </el-card>

                  <!-- SETTINGS & EXTRA SERVICES -->
                  <el-row :gutter="20">
                    <el-col :xs="24" :sm="12">
                      <el-card class="form-section-card mb-4" shadow="never">
                        <template #header>
                          <div class="form-card-title text-info">
                            <el-icon><Setting /></el-icon><span>Cấu hình Vận chuyển</span>
                          </div>
                        </template>
                        <el-form-item label="Dịch vụ vận chuyển" required>
                          <el-radio-group v-model="form.service_type" @change="debouncedSimulate">
                            <el-radio-button label="STANDARD">Chuẩn (STANDARD)</el-radio-button>
                            <el-radio-button label="FAST">Nhanh (FAST)</el-radio-button>
                          </el-radio-group>
                        </el-form-item>
                        <el-form-item label="Số tiền thu hộ (COD)">
                          <el-input-number v-model="form.cod_amount" :min="0" :step="10000" class="w-full" @change="debouncedSimulate" />
                        </el-form-item>
                        <el-form-item label="Phương thức thanh toán">
                          <el-select v-model="form.payment_method" class="w-full">
                            <el-option label="Shop trả cước cuối tháng (SENDER_DEBT)" value="SENDER_DEBT" />
                            <el-option label="Shop trả cước ngay khi gửi (SENDER_PAY)" value="SENDER_PAY" />
                            <el-option label="Người nhận thanh toán cước (RECEIVER_PAY)" value="RECEIVER_PAY" />
                          </el-select>
                        </el-form-item>
                        <el-form-item label="Ghi chú khi giao">
                          <el-select v-model="form.delivery_note_option" class="w-full">
                            <el-option label="Cho xem hàng, không thử (CHO_XEM_HANG)" value="CHO_XEM_HANG" />
                            <el-option label="Cho thử hàng (CHO_THU_HANG)" value="CHO_THU_HANG" />
                            <el-option label="Không cho xem hàng (KHONG_CHO_XEM_HANG)" value="KHONG_CHO_XEM_HANG" />
                          </el-select>
                        </el-form-item>
                        <el-form-item label="Ghi chú thêm">
                          <el-input v-model="form.note" type="textarea" :rows="2" placeholder="Ghi chú thêm cho bưu tá..." />
                        </el-form-item>
                      </el-card>
                    </el-col>

                    <el-col :xs="24" :sm="12">
                      <el-card class="form-section-card mb-4" shadow="never">
                        <template #header>
                          <div class="form-card-title text-primary">
                            <el-icon><CircleCheck /></el-icon><span>Dịch vụ gia tăng</span>
                          </div>
                        </template>
                        <el-checkbox-group v-model="form.extra_services" @change="debouncedSimulate" class="extra-services-checkboxes">
                          <el-checkbox 
                            v-for="srv in availableServices" 
                            :key="srv.service_code" 
                            :label="srv.service_code"
                          >
                            <span class="fw-bold">{{ srv.service_name }}</span>
                            <span class="text-xs text-muted block">
                              Phí: {{ srv.fee_type === 'FIXED' ? srv.fee_value.toLocaleString() + 'đ' : srv.fee_value + '%' }}
                            </span>
                          </el-checkbox>
                        </el-checkbox-group>
                      </el-card>
                    </el-col>
                  </el-row>

                </el-form>
              </el-col>

              <!-- Right side: Real-time estimated billing details -->
              <el-col :xs="24" :sm="24" :md="8">
                <el-card class="billing-summary-card mb-4 sticky-card" v-loading="simulateLoading">
                  <template #header>
                    <div class="billing-header text-primary fw-bold text-center">
                      ƯỚC TÍNH CƯỚC PHÍ
                    </div>
                  </template>
                  <div class="billing-details" v-if="simulateResult">
                    <div class="billing-line">
                      <span>Cước chính:</span>
                      <span class="price-val">{{ simulateResult.main_fee.toLocaleString() }} đ</span>
                    </div>
                    <div class="billing-line">
                      <span>Phí dịch vụ gia tăng:</span>
                      <span class="price-val">{{ simulateResult.extra_fee.toLocaleString() }} đ</span>
                    </div>
                    <div class="billing-line">
                      <span>Thuế VAT (8%):</span>
                      <span class="price-val">{{ simulateResult.vat_8.toLocaleString() }} đ</span>
                    </div>
                    <el-divider class="my-3" />
                    <div class="billing-line total">
                      <span>TỔNG CỘNG TẠM TÍNH:</span>
                      <span class="price-val text-success">{{ simulateResult.grand_total.toLocaleString() }} đ</span>
                    </div>
                    <div class="text-xs text-muted mt-3 text-center">
                      * Cước phí thực tế sẽ được cập nhật sau khi bưu cục cân đo hàng hóa.
                    </div>
                  </div>
                  <div class="billing-error text-center text-warning" style="padding: 20px 10px;" v-else-if="simulateError">
                    <el-icon class="large-icon mb-2" style="font-size: 28px; color: #e6a23c;"><Warning /></el-icon>
                    <p style="font-size: 13px; font-weight: 500; color: #e6a23c;">{{ simulateError }}</p>
                    <p style="font-size: 11px; color: #909399; margin-top: 8px;">Vui lòng chọn Tỉnh đi / Tỉnh đến khác (ví dụ: Hà Nội $\leftrightarrow$ TP. Hồ Chí Minh) đã được cấu hình giá cước trong hệ thống.</p>
                  </div>
                  <div class="billing-placeholder text-center text-muted" v-else>
                    <el-icon class="large-icon mb-2"><InfoFilled /></el-icon>
                    <p>Vui lòng điền địa chỉ người gửi, người nhận và khối lượng hàng hóa để xem cước phí dự kiến.</p>
                  </div>
                </el-card>
              </el-col>
            </el-row>
          </div>

          <!-- ================= MAIN CUSTOMER DASHBOARD ================= -->
          <div v-else>
            <div class="banner-welcome animate-fade-in">
              <div class="banner-content">
                <h1>Giao Hàng Nhanh Chóng & Tiết Kiệm</h1>
                <p>SmartPost Logistics - Hệ thống vận chuyển và công nghệ thông minh hàng đầu dành cho các chủ shop kinh doanh online.</p>
                <el-button type="success" size="large" @click="goToTracking">
                  <el-icon class="mr-6"><Search /></el-icon> TRA CỨU HÀNH TRÌNH VẬN ĐƠN
                </el-button>
              </div>
            </div>

            <el-row :gutter="20" class="actions-grid mt-20">
              <el-col :xs="24" :sm="12" :md="12">
                <el-card class="action-card" shadow="hover" @click="startCreatePickup">
                  <div class="action-icon bg-green">
                    <el-icon><DocumentAdd /></el-icon>
                  </div>
                  <div class="action-desc">
                    <h4>Yêu cầu gửi hàng</h4>
                    <p>Tạo yêu cầu lấy hàng hoặc gửi bưu kiện mới đến các bưu cục SmartPost.</p>
                  </div>
                </el-card>
              </el-col>
              <el-col :xs="24" :sm="12" :md="12">
                <el-card class="action-card" shadow="hover" @click="goToTracking">
                  <div class="action-icon bg-blue">
                    <el-icon><Location /></el-icon>
                  </div>
                  <div class="action-desc">
                    <h4>Tra cứu bưu phẩm</h4>
                    <p>Theo dõi thời gian thực lịch trình bưu gửi và xác nhận người nhận.</p>
                  </div>
                </el-card>
              </el-col>
            </el-row>

            <el-card class="recent-waybills-card mt-20 animate-fade-in">
              <template #header>
                <div class="flex-between">
                  <div class="card-header-title">
                    <el-icon><List /></el-icon><span>Bưu gửi & Yêu cầu lấy hàng của tôi</span>
                  </div>
                  <el-button size="small" type="primary" plain @click="fetchPickupsList">
                    <el-icon class="mr-1"><Refresh /></el-icon>Làm mới
                  </el-button>
                </div>
              </template>
              
              <el-table :data="pickupsList" v-loading="listLoading" stripe class="modern-table">
                <el-table-column prop="request_code" label="Mã Yêu Cầu" width="130">
                  <template #default="{ row }">
                    <span class="code-badge warning">{{ row.request_code }}</span>
                  </template>
                </el-table-column>
                <el-table-column prop="waybill_code" label="Mã Vận Đơn" width="130">
                  <template #default="{ row }">
                    <span class="code-badge success">{{ row.waybill_code || '---' }}</span>
                  </template>
                </el-table-column>
                <el-table-column label="Ngày tạo" width="150">
                  <template #default="{ row }">
                    <span class="text-xs">{{ formatDate(row.created_at) }}</span>
                  </template>
                </el-table-column>
                <el-table-column label="Trạng thái" width="140">
                  <template #default="{ row }">
                    <el-tag :type="getPickupStatusType(row.pickup_status)" size="small">
                      {{ getPickupStatusLabel(row.pickup_status) }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column label="Bưu cục nhận" min-width="160" show-overflow-tooltip>
                  <template #default="{ row }">
                    <span>{{ row.hub_name || 'Đang xử lý...' }}</span>
                  </template>
                </el-table-column>
                <el-table-column label="Cước phí" width="140" align="right">
                  <template #default="{ row }">
                    <div v-if="row.price_status === 'FINALIZED' || row.price_status === 'ADJUSTED'">
                      <div class="fw-bold text-success">{{ (row.final_total_amount || 0).toLocaleString() }}đ</div>
                      <span class="text-xs text-muted">(Đã cân đo)</span>
                    </div>
                    <div v-else>
                      <div class="fw-bold text-primary">{{ (row.estimated_total_amount || 0).toLocaleString() }}đ</div>
                      <span class="text-xs text-muted">(Tạm tính)</span>
                    </div>
                  </template>
                </el-table-column>
                <el-table-column label="Thao tác" width="130" align="center" fixed="right">
                  <template #default="{ row }">
                    <el-button type="primary" size="small" plain @click="openDetail(row)">
                      Xem chi tiết
                    </el-button>
                  </template>
                </el-table-column>
                <template #empty>
                  <el-empty description="Bạn chưa tạo đơn gửi hàng nào hoặc chưa có lịch sử vận đơn" :image-size="100" />
                </template>
              </el-table>
            </el-card>
          </div>

        </el-col>
      </el-row>

      <!-- DETAIL MODAL DIALOG -->
      <el-dialog 
        v-model="detailDialogVisible" 
        title="Chi tiết yêu cầu & Vận đơn" 
        width="650px"
        destroy-on-close
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
                <div class="detail-grid-item">
                  <span class="label">Trạng thái lấy hàng:</span>
                  <span class="value">
                    <el-tag :type="getPickupStatusType(selectedPickup.pickup_status)" size="small">
                      {{ getPickupStatusLabel(selectedPickup.pickup_status) }}
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
                <div class="detail-grid-item full-width">
                  <span class="label">Địa chỉ lấy hàng:</span>
                  <span class="value text-dark">{{ selectedPickup.pickup_address || '---' }}</span>
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
              </div>
            </el-tab-pane>

            <!-- Tab 2: Billing Breakdown -->
            <el-tab-pane label="Cước phí & Thanh toán" name="billing">
              <div class="billing-comparison">
                <el-row :gutter="20">
                  <el-col :span="12">
                    <div class="billing-column-card estimated">
                      <div class="card-title">Cước dự kiến (Tạm tính)</div>
                      <div class="price-row">
                        <span>Cước phí chính:</span>
                        <span>{{ (selectedPickup.estimated_shipping_fee || 0).toLocaleString() }}đ</span>
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
              <div class="timeline-wrapper" v-loading="timelineLoading">
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
            </el-tab-pane>

          </el-tabs>
        </div>
      </el-dialog>

    </div>

    <!-- Dialog cập nhật thông tin khách hàng -->
    <el-dialog
      v-model="editDialogVisible"
      title="Cập nhật hồ sơ khách hàng"
      width="600px"
      destroy-on-close
    >
      <el-form :model="editForm" label-position="top">
        <el-form-item label="Họ tên đại diện Shop" required>
          <el-input v-model="editForm.full_name" placeholder="Tên hiển thị shop" />
        </el-form-item>
        
        <el-form-item label="Số điện thoại liên hệ" required>
          <el-input v-model="editForm.phone_number" placeholder="Số điện thoại liên hệ" />
        </el-form-item>

        <el-row :gutter="20">
          <el-col :xs="24" :sm="8">
            <el-form-item label="Tỉnh / Thành phố">
              <el-select v-model="editForm.province_id" placeholder="Chọn tỉnh/thành" @change="handleProvinceChange" class="w-full">
                <el-option v-for="p in provinces" :key="p.id" :label="p.name" :value="p.id" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="8">
            <el-form-item label="Quận / Huyện">
              <el-select v-model="editForm.district_id" placeholder="Chọn quận/huyện" @change="handleDistrictChange" class="w-full" :disabled="!editForm.province_id">
                <el-option v-for="d in availableDistricts" :key="d.id" :label="d.name" :value="d.id" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="8">
            <el-form-item label="Phường / Xã">
              <el-select v-model="editForm.ward_id" placeholder="Chọn phường/xã" class="w-full" :disabled="!editForm.district_id">
                <el-option v-for="w in availableWards" :key="w.id" :label="w.name" :value="w.id" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="Địa chỉ chi tiết (Số nhà, tên đường...)">
          <el-input v-model="editForm.address_detail" type="textarea" :rows="2" placeholder="Địa chỉ chi tiết nơi gửi hàng" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="editDialogVisible = false">Hủy</el-button>
          <el-button type="primary" @click="handleSaveProfile">Lưu thay đổi</el-button>
        </span>
      </template>
    </el-dialog>

    <el-dialog v-model="changePasswordVisible" title="Đổi mật khẩu" width="460px" destroy-on-close>
      <el-form :model="changePasswordForm" label-position="top">
        <el-form-item label="Mật khẩu hiện tại">
          <el-input v-model="changePasswordForm.current_password" type="password" show-password />
        </el-form-item>
        <el-form-item label="Mật khẩu mới">
          <el-input v-model="changePasswordForm.new_password" type="password" show-password />
        </el-form-item>
        <el-form-item label="Nhập lại mật khẩu mới">
          <el-input v-model="changePasswordForm.confirm_password" type="password" show-password />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="changePasswordVisible = false">Hủy</el-button>
          <el-button type="primary" :loading="changePasswordLoading" @click="changePassword">Lưu mật khẩu</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import api from '@/api/axios';
import moment from 'moment';
import { 
  User, Service, Phone, Message, Close, 
  Search, DocumentAdd, Location, List, Edit, Lock,
  Box, Setting, CircleCheck, InfoFilled, FolderOpened, Upload, ArrowLeft, Refresh, Warning
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
  payment_method: 'SENDER_DEBT'
});

// Simulation price result
const simulateResult = ref(null);
const simulateError = ref('');

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

// START CREATE REQUEST & CHECK DRAFT
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
  simulateResult.value = null;

  showCreateForm.value = true;
  
  // Check localStorage draft
  const draft = localStorage.getItem('customer_pickup_draft');
  if (draft) {
    ElMessageBox.confirm(
      'Bạn có một bản nháp yêu cầu lấy hàng chưa hoàn tất. Bạn có muốn khôi phục lại không?',
      'Khôi phục bản nháp',
      {
        confirmButtonText: 'Khôi phục',
        cancelButtonText: 'Xóa bản nháp',
        type: 'info'
      }
    ).then(async () => {
      try {
        const parsed = JSON.parse(draft);
        Object.assign(form, parsed);

        // Preload restored draft districts and wards
        if (form.sender.province_id) {
          senderDistricts.value = await fetchDistrictsForProvince(form.sender.province_id);
        }
        if (form.sender.district_id) {
          senderWards.value = await fetchWardsForDistrict(form.sender.district_id);
        }
        if (form.receiver.province_id) {
          receiverDistricts.value = await fetchDistrictsForProvince(form.receiver.province_id);
        }
        if (form.receiver.district_id) {
          receiverWards.value = await fetchWardsForDistrict(form.receiver.district_id);
        }

        debouncedSimulate();
        ElMessage.success('Đã khôi phục bản nháp.');
      } catch (err) {
        console.error(err);
      }
    }).catch((action) => {
      if (action === 'cancel') {
        localStorage.removeItem('customer_pickup_draft');
        ElMessage.info('Đã xóa bản nháp cũ.');
      }
    });
  }
};

const saveDraft = () => {
  try {
    localStorage.setItem('customer_pickup_draft', JSON.stringify(form));
    ElMessage.success('Đã lưu bản nháp thành công!');
  } catch (err) {
    ElMessage.error('Không thể lưu bản nháp');
  }
};

const cancelCreate = () => {
  showCreateForm.value = false;
};

// SUBMIT REQUEST TO BACKEND
const submitPickupRequest = async () => {
  if (!form.sender.name || !form.sender.phone || !form.sender.address_detail || !form.sender.province_id) {
    ElMessage.warning('Vui lòng điền đầy đủ thông tin người gửi');
    return;
  }
  if (!form.receiver.name || !form.receiver.phone || !form.receiver.address_detail || !form.receiver.province_id || !form.receiver.district_id || !form.receiver.ward_id) {
    ElMessage.warning('Vui lòng điền đầy đủ thông tin người nhận (bao gồm Tỉnh/Huyện/Xã)');
    return;
  }
  if (!form.items[0].product_name || !form.items[0].weight) {
    ElMessage.warning('Vui lòng nhập tên sản phẩm và khối lượng');
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
      save_as_draft: false
    };

    const res = await api.post('/api/waybills/customer/pickups', payload);
    
    ElMessage.success(`Tạo yêu cầu thành công! Mã vận đơn: ${res.data.waybill_code}`);
    localStorage.removeItem('customer_pickup_draft');
    showCreateForm.value = false;
    fetchPickupsList();
  } catch (err) {
    ElMessage.error(err.response?.data?.detail || 'Có lỗi xảy ra khi tạo yêu cầu lấy hàng');
  } finally {
    submitLoading.value = false;
  }
};

// LOAD PICKUPS LIST
const fetchPickupsList = async () => {
  listLoading.value = true;
  try {
    const res = await api.get('/api/waybills/customer/pickups');
    pickupsList.value = res.data || [];
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
  
  if (row.waybill_code) {
    timelineLoading.value = true;
    pickupTimeline.value = [];
    try {
      const detailRes = await api.get(`/api/waybills/customer/pickups/${row.waybill_code}`);
      selectedPickup.value = detailRes.data;
      
      const idx = pickupsList.value.findIndex(item => item.waybill_code === row.waybill_code);
      if (idx !== -1) {
        pickupsList.value[idx] = detailRes.data;
      }
    } catch (err) {
      console.error('Error fetching pickup detail:', err);
      selectedPickup.value = row;
    }

    try {
      const res = await api.get(`/api/waybills/${row.waybill_code}/timeline`);
      pickupTimeline.value = res.data?.timeline || [];
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
  return val ? moment(val).format('HH:mm DD/MM/YYYY') : '---';
};

const getPickupStatusLabel = (status) => {
  switch (status) {
    case 'PENDING_CONFIRMATION': return 'Chờ bưu cục xác nhận';
    case 'RECEIVED': return 'Bưu cục đã tiếp nhận';
    case 'ASSIGNED_PICKUP': return 'Đã gán bưu tá lấy hàng';
    case 'PICKED': return 'Bưu tá đã lấy hàng';
    default: return status || 'Chờ xử lý';
  }
};

const getPickupStatusType = (status) => {
  switch (status) {
    case 'PENDING_CONFIRMATION': return 'warning';
    case 'RECEIVED': return 'info';
    case 'ASSIGNED_PICKUP': return 'primary';
    case 'PICKED': return 'success';
    default: return 'info';
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

onMounted(async () => {
  if (!authStore.user) return;

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

  fetchPickupsList();
  fetchAvailableServices();
});
</script>

<style scoped>
.customer-portal {
  background: var(--sp-bg-app, #f8fafc);
  min-height: 100vh;
  padding: 24px;
  font-family: 'Plus Jakarta Sans', sans-serif;
}

.portal-container {
  max-width: 1400px;
  margin: 0 auto;
}

.portal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #ffffff;
  padding: 16px 24px;
  border-radius: 12px;
  box-shadow: 0px 4px 15px rgba(0, 0, 0, 0.02);
  margin-bottom: 24px;
  border: 1px solid var(--sp-border, #e2e8f0);
}

.brand-info {
  display: flex;
  align-items: center;
  gap: 16px;
}

.portal-logo {
  height: 50px;
  object-fit: contain;
}

.welcome-text h2 {
  font-size: 1.25rem;
  font-weight: 800;
  color: var(--sp-primary, #4318FF);
  margin: 0;
}

.welcome-text p {
  font-size: 0.9rem;
  color: var(--sp-text-muted, #a3b1cc);
  margin: 4px 0 0 0;
}

.mr-6 {
  margin-right: 6px;
}

.portal-content {
  margin-top: 10px;
}

.info-card {
  border-radius: 16px;
  border: 1px solid var(--sp-border, #e2e8f0);
  box-shadow: 0px 4px 15px rgba(0, 0, 0, 0.02);
}

.card-header-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 700;
  font-size: 0.95rem;
  color: var(--sp-text-main, #1b2559);
}

.card-header-title .el-icon {
  color: var(--sp-primary, #4318FF);
  font-size: 1.1rem;
}

.profile-details {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.avatar-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 20px;
}

.portal-avatar {
  background-color: rgba(67, 24, 255, 0.1);
  color: var(--sp-primary, #4318FF);
  font-weight: bold;
  font-size: 1.8rem;
  margin-bottom: 12px;
}

.avatar-wrapper h3 {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--sp-text-main, #1b2559);
  margin: 0 0 6px 0;
}

.details-list {
  width: 100%;
}

.detail-item {
  display: flex;
  flex-direction: column;
  padding: 10px 0;
  border-bottom: 1px solid var(--sp-border, #e2e8f0);
}

.detail-item:last-child {
  border-bottom: none;
}

.detail-item .label {
  font-size: 0.8rem;
  color: var(--sp-text-muted, #a3b1cc);
  margin-bottom: 4px;
}

.detail-item .value {
  font-size: 0.9rem;
  color: var(--sp-text-main, #1b2559);
  font-weight: 600;
}

.support-info p {
  font-size: 0.85rem;
  color: var(--sp-text-muted, #a3b1cc);
  margin: 0 0 16px 0;
  line-height: 1.5;
}

.hotline-box {
  display: flex;
  align-items: center;
  gap: 12px;
  background: rgba(67, 24, 255, 0.05);
  border: 1px solid var(--sp-border, #e2e8f0);
  padding: 12px;
  border-radius: 12px;
  margin-bottom: 12px;
}

.hotline-box .el-icon {
  font-size: 1.5rem;
  color: var(--sp-primary, #4318FF);
}

.hotline-details {
  display: flex;
  flex-direction: column;
}

.phone-num {
  font-size: 1.15rem;
  font-weight: 800;
  color: var(--sp-primary, #4318FF);
}

.hotline-details .sub {
  font-size: 0.75rem;
  color: var(--sp-text-muted, #a3b1cc);
}

.email-box {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.85rem;
  color: var(--sp-text-main, #1b2559);
  padding-left: 4px;
}

.email-box .el-icon {
  color: var(--sp-text-muted, #a3b1cc);
}

.banner-welcome {
  background: linear-gradient(135deg, var(--sp-primary, #4318FF) 0%, #707EAE 100%);
  border-radius: 16px;
  padding: 36px;
  color: #ffffff;
  box-shadow: 0px 10px 30px rgba(67, 24, 255, 0.15);
}

.banner-content h1 {
  font-size: 1.75rem;
  font-weight: 800;
  margin: 0 0 12px 0;
  letter-spacing: -0.5px;
}

.banner-content p {
  font-size: 0.95rem;
  line-height: 1.6;
  opacity: 0.9;
  margin: 0 0 24px 0;
  max-width: 600px;
}

.actions-grid {
  margin-top: 20px;
}

.action-card {
  border-radius: 16px;
  border: 1px solid var(--sp-border, #e2e8f0);
  cursor: pointer;
  transition: all 0.3s ease;
}

.action-card:hover {
  transform: translateY(-4px);
  box-shadow: 0px 8px 25px rgba(0, 0, 0, 0.05);
  border-color: var(--sp-primary, #4318FF);
}

.action-card :deep(.el-card__body) {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
}

.action-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 50px;
  height: 50px;
  border-radius: 12px;
  font-size: 1.5rem;
}

.bg-green {
  background: rgba(16, 185, 129, 0.1);
  color: #10B981;
}

.bg-blue {
  background: rgba(59, 130, 246, 0.1);
  color: #3B82F6;
}

.action-desc h4 {
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--sp-text-main, #1b2559);
  margin: 0 0 4px 0;
}

.action-desc p {
  font-size: 0.8rem;
  color: var(--sp-text-muted, #a3b1cc);
  margin: 0;
  line-height: 1.4;
}

.recent-waybills-card {
  border-radius: 16px;
  border: 1px solid var(--sp-border, #e2e8f0);
  box-shadow: 0px 4px 15px rgba(0, 0, 0, 0.02);
}

.mt-20 {
  margin-top: 20px;
}

.w-full {
  width: 100%;
}

/* Form Styles */
.create-pickup-form-wrapper {
  background: #ffffff;
  padding: 24px;
  border-radius: 16px;
  border: 1px solid var(--sp-border, #e2e8f0);
  box-shadow: 0px 4px 20px rgba(0, 0, 0, 0.02);
}

.form-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid var(--sp-border, #e2e8f0);
  padding-bottom: 16px;
}

.form-header-actions {
  display: flex;
  gap: 10px;
}

.section-title {
  font-size: 1.5rem;
  font-weight: 800;
  color: var(--sp-text-main, #1b2559);
  margin: 0 0 4px 0;
}

.section-subtitle {
  font-size: 0.85rem;
  color: var(--sp-text-muted, #a3b1cc);
  margin: 0;
}

.form-section-card {
  border-radius: 12px;
  border: 1px solid var(--sp-border, #e2e8f0) !important;
}

.form-card-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 700;
  font-size: 0.95rem;
}

.item-input-row {
  padding: 12px 0;
}

.dimension-inputs {
  display: flex;
  align-items: center;
  gap: 4px;
}
.dimension-inputs span {
  color: var(--sp-text-muted, #a3b1cc);
}

.extra-services-checkboxes {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* Estimated price box */
.billing-summary-card {
  border-radius: 16px;
  border: 2px solid var(--sp-primary, #4318FF);
  box-shadow: 0px 8px 30px rgba(67, 24, 255, 0.08);
}
.sticky-card {
  position: sticky;
  top: 24px;
}
.billing-header {
  font-size: 14px;
  letter-spacing: 0.5px;
}
.billing-line {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
  margin-bottom: 12px;
}
.billing-line.total {
  font-size: 15px;
  font-weight: 800;
}
.price-val {
  font-weight: 700;
}

.billing-placeholder {
  padding: 24px 12px;
}
.billing-placeholder .large-icon {
  font-size: 32px;
  color: var(--sp-primary, #4318FF);
}

:deep(.modern-table) {
  --el-table-border-color: transparent;
  --el-table-header-bg-color: #F8FAFC;
  --el-table-header-text-color: var(--sp-text-muted, #a3b1cc);
  --el-table-text-color: var(--sp-text-main, #1b2559);
}
:deep(.modern-table th.el-table__cell) {
  font-weight: 700;
  font-size: 12px;
  text-transform: uppercase;
  padding: 12px 0;
  border-bottom: 2px solid var(--sp-bg-app, #f8fafc) !important;
}

.code-badge {
  font-family: monospace;
  font-weight: 800;
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 12px;
  display: inline-block;
}
.code-badge.warning { background: rgba(245, 158, 11, 0.1); color: #D97706; }
.code-badge.success { background: rgba(16, 185, 129, 0.1); color: #059669; }

/* Detail Dialog styling */
.detail-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  padding: 12px 0;
}
.detail-grid-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.detail-grid-item.full-width {
  grid-column: span 2;
}
.detail-grid-item .label {
  font-size: 11px;
  color: var(--sp-text-muted, #a3b1cc);
  text-transform: uppercase;
  font-weight: 600;
}
.detail-grid-item .value {
  font-size: 14px;
  color: var(--sp-text-main, #1b2559);
}

.billing-comparison {
  padding: 12px 0;
}
.billing-column-card {
  background: #F8FAFC;
  border-radius: 12px;
  padding: 16px;
  border: 1px solid var(--sp-border, #e2e8f0);
}
.billing-column-card.estimated {
  border-left: 4px solid var(--sp-primary, #4318FF);
}
.billing-column-card.final {
  border-left: 4px solid #10B981;
}
.billing-column-card.final.empty {
  border-left-color: var(--sp-text-muted, #a3b1cc);
}
.billing-column-card .card-title {
  font-weight: 800;
  font-size: 12px;
  text-transform: uppercase;
  color: var(--sp-text-main, #1b2559);
  margin-bottom: 12px;
}
.price-row {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  margin-bottom: 8px;
}
.price-row.total {
  font-weight: 800;
  font-size: 14px;
}

.timeline-wrapper {
  padding: 16px 8px;
  max-height: 400px;
  overflow-y: auto;
}
.timeline-log-title {
  font-weight: 800;
  color: var(--sp-text-main, #1b2559);
  font-size: 13px;
}
.timeline-log-desc {
  font-size: 12px;
  color: var(--sp-text-muted, #a3b1cc);
  margin-top: 2px;
}
.timeline-log-note {
  font-size: 11px;
  color: #D97706;
  background: rgba(245, 158, 11, 0.05);
  padding: 4px 8px;
  border-radius: 4px;
  display: inline-block;
  margin-top: 4px;
}

.animate-fade-in { animation: fadeIn 0.4s ease-out; }
.animate-fade-in-up { animation: fadeInUp 0.4s ease-out; }
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes fadeInUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }

/* Micro-animations */
.animate-calc {
  transition: all 0.3s;
}
.animate-calc:hover {
  transform: scale(1.02);
}

@media (max-width: 768px) {
  .customer-portal {
    padding: 12px;
  }

  .portal-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
    padding: 16px;
  }

  .header-actions {
    width: 100%;
  }

  .header-actions .el-button {
    width: 100%;
    justify-content: center;
  }

  .banner-welcome {
    padding: 20px;
  }

  .banner-content h1 {
    font-size: 1.4rem;
  }

  .banner-content p {
    font-size: 0.85rem;
    margin-bottom: 16px;
  }

  .banner-content .el-button {
    width: 100%;
    justify-content: center;
  }

  .action-card :deep(.el-card__body) {
    padding: 16px;
  }

  .form-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }
  
  .form-header-actions {
    width: 100%;
  }
  .form-header-actions .el-button {
    flex: 1;
  }

  :deep(.el-dialog) {
    width: 92% !important;
    margin-top: 10vh !important;
  }
}
</style>
