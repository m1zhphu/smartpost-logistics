<template>
  <div class="modern-pickup-page animate-fade-in">
    <div class="page-container">
      
      <!-- Page Header -->
      <header class="page-header">
        <div class="header-content">
          <div class="title-wrapper">
            <div class="icon-box primary">
              <el-icon><Location /></el-icon>
            </div>
            <div>
              <h2 class="page-title">Điều phối lấy hàng (Pickup)</h2>
              <p class="page-subtitle">Xác nhận văn phòng, điều phối bưu tá và xác nhận kết quả lấy hàng online/hotline</p>
            </div>
          </div>
        </div>
        <div class="header-actions flex gap-2">
          <el-button type="primary" @click="openCreatePickupDialog">
            <el-icon class="mr-2"><Plus /></el-icon>
            <span>Tạo đơn Hotline/CSKH</span>
          </el-button>
          <el-button type="success" @click="handleRefresh" :loading="loading" plain>
            <el-icon class="mr-2"><Refresh /></el-icon>
            <span>Làm mới</span>
          </el-button>
        </div>
      </header>

      <!-- Main Content Card -->
      <div class="content-card">
        <el-tabs v-model="activeTab" @tab-change="handleTabChange">
          
          <!-- TAB 1: CHỜ XÁC NHẬN VĂN PHÒNG -->
          <el-tab-pane name="pending">
            <template #label>
              <div class="flex-center gap-2">
                <el-badge :value="pendingRequests.length" :hidden="pendingRequests.length === 0" type="danger">
                  <span>Chờ xác nhận văn phòng</span>
                </el-badge>
              </div>
            </template>

            <div class="flex-between mb-4">
              <div class="card-header-actions">
                <el-button 
                  type="primary" 
                  :disabled="multipleSelection.length === 0" 
                  @click="openConfirmHubDialog"
                >
                  <el-icon class="mr-2"><OfficeBuilding /></el-icon>
                  <span>Xác nhận văn phòng ({{ multipleSelection.length }} đơn)</span>
                </el-button>
              </div>
              <div class="search-wrapper">
                <el-input 
                  v-model="searchPending" 
                  placeholder="Tìm mã, SĐT, địa chỉ..." 
                  class="modern-input-small"
                  clearable
                >
                  <template #prefix><el-icon><Search /></el-icon></template>
                </el-input>
              </div>
            </div>

            <el-table 
              :data="filteredPending" 
              v-loading="loading" 
              class="modern-table" 
              @selection-change="handleSelectionChange"
              stripe
            >
              <el-table-column type="selection" width="55" align="center" />
              <el-table-column prop="request_code" label="Mã Yêu Cầu" width="150">
                <template #default="{ row }">
                  <span class="code-badge warning">{{ row.request_code }}</span>
                </template>
              </el-table-column>
              <el-table-column label="Nguồn đơn" width="130" align="center">
                <template #default="{ row }">
                  <el-tag :type="getSourceTagType(row.source)" effect="dark" size="small" class="fw-bold">
                    {{ row.source || 'PORTAL' }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column label="Người gửi / Shop" min-width="160">
                <template #default="{ row }">
                  <div class="sender-info">
                    <span class="fw-bold text-dark">{{ row.customer_name || 'Khách vãng lai' }}</span>
                    <span class="text-xs text-muted"><el-icon class="mr-1"><Phone /></el-icon>{{ row.sender_phone }}</span>
                  </div>
                </template>
              </el-table-column>
              <el-table-column label="Địa chỉ lấy hàng" min-width="220" show-overflow-tooltip>
                <template #default="{ row }">
                  <span class="address-text">{{ row.pickup_address }}</span>
                </template>
              </el-table-column>
              <el-table-column label="Ước tính" width="140" align="center">
                <template #default="{ row }">
                  <div class="text-xs">
                    <div>KL: <strong>{{ row.est_weight }} kg</strong></div>
                    <div>SL: <strong>{{ row.est_quantity }} kiện</strong></div>
                  </div>
                </template>
              </el-table-column>
              <el-table-column label="Ngày hẹn" width="150" align="center">
                <template #default="{ row }">
                  <span class="text-xs">{{ formatDate(row.created_at) }}</span>
                </template>
              </el-table-column>
              <el-table-column label="Độ ưu tiên" width="120" align="center">
                <template #default="{ row }">
                  <el-tag :type="getPriorityType(row.priority)" size="small" effect="dark">{{ row.priority }}</el-tag>
                </template>
              </el-table-column>
              <template #empty>
                <el-empty description="Không có yêu cầu nào chờ xác nhận văn phòng" :image-size="100" />
              </template>
            </el-table>
          </el-tab-pane>

          <!-- TAB 2: ĐÃ TIẾP NHẬN & CHỜ GÁN BƯU TÁ -->
          <el-tab-pane name="received">
            <template #label>
              <div class="flex-center gap-2">
                <el-badge :value="receivedRequests.length" :hidden="receivedRequests.length === 0" type="primary">
                  <span>Chờ gán bưu tá</span>
                </el-badge>
              </div>
            </template>

            <div class="flex-between mb-4">
              <div>
                <el-select 
                  v-if="authStore.user?.role_id === 1" 
                  v-model="selectedHubId" 
                  placeholder="Chọn bưu cục để xem đơn" 
                  filterable 
                  class="modern-input-small w-[250px]"
                  @change="() => fetchTabRequests('received')"
                >
                  <el-option label="Tất cả bưu cục" :value="null" />
                  <el-option v-for="h in hubs" :key="h.hub_id" :label="h.hub_name" :value="h.hub_id" />
                </el-select>
              </div>
              <div class="search-wrapper">
                <el-input 
                  v-model="searchReceived" 
                  placeholder="Tìm mã, SĐT, địa chỉ..." 
                  class="modern-input-small"
                  clearable
                >
                  <template #prefix><el-icon><Search /></el-icon></template>
                </el-input>
              </div>
            </div>

            <el-table 
              :data="filteredReceived" 
              v-loading="loading" 
              class="modern-table" 
              stripe
            >
              <el-table-column prop="request_code" label="Mã Yêu Cầu" width="150">
                <template #default="{ row }">
                  <span class="code-badge success">{{ row.request_code }}</span>
                </template>
              </el-table-column>
              <el-table-column label="Nguồn đơn" width="120" align="center">
                <template #default="{ row }">
                  <el-tag :type="getSourceTagType(row.source)" effect="dark" size="small" class="fw-bold">
                    {{ row.source || 'PORTAL' }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column label="Người gửi / Shop" min-width="160">
                <template #default="{ row }">
                  <div class="sender-info">
                    <span class="fw-bold text-dark">{{ row.customer_name || 'Khách vãng lai' }}</span>
                    <span class="text-xs text-muted"><el-icon class="mr-1"><Phone /></el-icon>{{ row.sender_phone }}</span>
                  </div>
                </template>
              </el-table-column>
              <el-table-column label="Địa chỉ lấy hàng" min-width="220" show-overflow-tooltip>
                <template #default="{ row }">
                  <span class="address-text">{{ row.pickup_address }}</span>
                </template>
              </el-table-column>
              <el-table-column label="Văn phòng nhận" width="160" show-overflow-tooltip>
                <template #default="{ row }">
                  <span class="fw-bold text-primary">{{ row.target_hub_name || getHubName(row.target_hub_id) || 'N/A' }}</span>
                </template>
              </el-table-column>
              <el-table-column prop="notes" label="Ghi chú khách" min-width="150" show-overflow-tooltip />
              <el-table-column label="Thao tác" width="150" align="center" fixed="right">
                <template #default="{ row }">
                  <el-button 
                    type="primary" 
                    size="small" 
                    plain 
                    @click="openAssignShipperDialog(row)"
                  >
                    <el-icon class="mr-1"><Bicycle /></el-icon>
                    <span>Gán bưu tá</span>
                  </el-button>
                </template>
              </el-table-column>
              <template #empty>
                <el-empty description="Không có yêu cầu lấy hàng nào tại văn phòng của bạn" :image-size="100" />
              </template>
            </el-table>
          </el-tab-pane>

          <!-- TAB 3: ĐANG ĐI LẤY -->
          <el-tab-pane name="assigned">
            <template #label>
              <div class="flex-center gap-2">
                <el-badge :value="assignedRequests.length" :hidden="assignedRequests.length === 0" type="info">
                  <span>Đang đi lấy</span>
                </el-badge>
              </div>
            </template>

            <div class="flex-between mb-4">
              <div>
                <el-select 
                  v-if="authStore.user?.role_id === 1" 
                  v-model="selectedHubId" 
                  placeholder="Chọn bưu cục để xem đơn" 
                  filterable 
                  class="modern-input-small w-[250px]"
                  @change="() => fetchTabRequests('assigned')"
                >
                  <el-option label="Tất cả bưu cục" :value="null" />
                  <el-option v-for="h in hubs" :key="h.hub_id" :label="h.hub_name" :value="h.hub_id" />
                </el-select>
              </div>
              <div class="search-wrapper">
                <el-input 
                  v-model="searchAssigned" 
                  placeholder="Tìm mã, SĐT, bưu tá..." 
                  class="modern-input-small"
                  clearable
                >
                  <template #prefix><el-icon><Search /></el-icon></template>
                </el-input>
              </div>
            </div>

            <el-table 
              :data="filteredAssigned" 
              v-loading="loading" 
              class="modern-table" 
              stripe
            >
              <el-table-column prop="request_code" label="Mã Yêu Cầu" width="150">
                <template #default="{ row }">
                  <span class="code-badge info">{{ row.request_code }}</span>
                </template>
              </el-table-column>
              <el-table-column label="Người gửi / Shop" min-width="160">
                <template #default="{ row }">
                  <div class="sender-info">
                    <span class="fw-bold text-dark">{{ row.customer_name || 'Khách vãng lai' }}</span>
                    <span class="text-xs text-muted"><el-icon class="mr-1"><Phone /></el-icon>{{ row.sender_phone }}</span>
                  </div>
                </template>
              </el-table-column>
              <el-table-column label="Địa chỉ lấy hàng" min-width="220" show-overflow-tooltip>
                <template #default="{ row }">
                  <span class="address-text">{{ row.pickup_address }}</span>
                </template>
              </el-table-column>
              <el-table-column label="Bưu tá phụ trách" width="180">
                <template #default="{ row }">
                  <div class="flex-center gap-2" v-if="row.assigned_shipper_name">
                    <el-avatar :size="24" class="bg-primary text-white text-xs fw-bold">{{ row.assigned_shipper_name.charAt(0) }}</el-avatar>
                    <span class="fw-semibold text-dark text-xs">{{ row.assigned_shipper_name }}</span>
                  </div>
                  <span v-else class="text-muted text-xs">Chưa rõ</span>
                </template>
              </el-table-column>
              <el-table-column label="Ngày gán" width="150" align="center">
                <template #default="{ row }">
                  <span class="text-xs">{{ formatDate(row.pickup_assigned_at || row.created_at) }}</span>
                </template>
              </el-table-column>
              <el-table-column label="Thao tác" width="180" align="center" fixed="right">
                <template #default="{ row }">
                  <el-button 
                    type="success" 
                    size="small" 
                    @click="openPickedDialog(row)"
                  >
                    <el-icon class="mr-1"><Check /></el-icon>
                    <span>Xác nhận đã lấy</span>
                  </el-button>
                </template>
              </el-table-column>
              <template #empty>
                <el-empty description="Không có đơn hàng nào đang trong quá trình đi lấy" :image-size="100" />
              </template>
            </el-table>
          </el-tab-pane>

        </el-tabs>
      </div>

      <!-- Dialog: Tạo Yêu Cầu Lấy Hàng Hotline/CSKH -->
      <el-dialog 
        v-model="createDialogVisible" 
        title="Tạo Yêu Cầu Lấy Hàng (Hotline / CSKH)" 
        width="900px"
        destroy-on-close
      >
        <el-form 
          :model="createForm" 
          :rules="createRules" 
          ref="createFormRef" 
          label-position="top" 
          v-loading="dialogLoading"
          class="dialog-cskh-form"
        >
          <el-row :gutter="20">
            <!-- LEFT COLUMN: Routing & Client Info -->
            <el-col :span="12">
              <div class="form-section-title mb-3"><el-icon class="mr-2"><User /></el-icon>Thông tin Khách hàng & Nguồn đơn</div>
              
              <el-row :gutter="10">
                <el-col :span="12">
                  <el-form-item label="KHÁCH HÀNG / SHOP" prop="customer_id">
                    <el-select 
                      v-model="createForm.customer_id" 
                      placeholder="Tìm Shop..." 
                      filterable 
                      class="w-full"
                      @change="handleCustomerChange"
                    >
                      <el-option 
                        v-for="c in customers" 
                        :key="c.customer_id" 
                        :label="c.transaction_name || c.company_name || c.representative_name" 
                        :value="c.customer_id" 
                      />
                    </el-select>
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="NGUỒN ĐƠN YÊU CẦU" prop="source">
                    <el-select v-model="createForm.source" placeholder="Chọn nguồn..." class="w-full">
                      <el-option label="HOTLINE" value="HOTLINE" />
                      <el-option label="CSKH" value="CSKH" />
                      <el-option label="ADMIN" value="ADMIN" />
                    </el-select>
                  </el-form-item>
                </el-col>
              </el-row>

              <el-form-item label="VĂN PHÒNG TIẾP NHẬN (TÙY CHỌN)" prop="target_hub_id">
                <el-select 
                  v-model="createForm.target_hub_id" 
                  placeholder="Để trống để tự phân bổ theo địa chỉ gửi..." 
                  filterable 
                  clearable
                  class="w-full"
                >
                  <el-option 
                    v-for="h in hubs" 
                    :key="h.hub_id" 
                    :label="h.hub_code + ' - ' + h.hub_name" 
                    :value="h.hub_id" 
                  />
                </el-select>
              </el-form-item>

              <div class="form-section-title mb-3 mt-3"><el-icon class="mr-2"><OfficeBuilding /></el-icon>Thông tin Người gửi (Lấy hàng)</div>
              
              <el-row :gutter="10">
                <el-col :span="12">
                  <el-form-item label="Tên người gửi" prop="sender_name">
                    <el-input v-model="createForm.sender_name" placeholder="Tên shop/Người gửi..." />
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="Số điện thoại gửi" prop="sender_phone">
                    <el-input v-model="createForm.sender_phone" placeholder="SĐT liên hệ lấy hàng..." />
                  </el-form-item>
                </el-col>
              </el-row>

              <el-row :gutter="10">
                <el-col :span="8">
                  <el-form-item label="Tỉnh/Thành phố" prop="sender_province_id">
                    <el-select 
                      v-model="createForm.sender_province_id" 
                      placeholder="Chọn Tỉnh..." 
                      filterable 
                      class="w-full"
                      @change="handleSenderProvinceChange"
                    >
                      <el-option v-for="p in provinces" :key="p.id" :label="p.name" :value="p.id" />
                    </el-select>
                  </el-form-item>
                </el-col>
                <el-col :span="8">
                  <el-form-item label="Quận/Huyện" prop="sender_district_id">
                    <el-select 
                      v-model="createForm.sender_district_id" 
                      placeholder="Chọn Quận..." 
                      filterable 
                      class="w-full"
                      @change="handleSenderDistrictChange"
                    >
                      <el-option v-for="d in senderDistricts" :key="d.id" :label="d.name" :value="d.id" />
                    </el-select>
                  </el-form-item>
                </el-col>
                <el-col :span="8">
                  <el-form-item label="Phường/Xã" prop="sender_ward_id">
                    <el-select 
                      v-model="createForm.sender_ward_id" 
                      placeholder="Chọn Xã..." 
                      filterable 
                      class="w-full"
                      @change="handleSenderWardChange"
                    >
                      <el-option v-for="w in senderWards" :key="w.id" :label="w.name" :value="w.id" />
                    </el-select>
                  </el-form-item>
                </el-col>
              </el-row>

              <el-form-item label="Địa chỉ gửi hàng chi tiết" prop="sender_address_detail">
                <el-input v-model="createForm.sender_address_detail" type="textarea" :rows="2" placeholder="Số nhà, ngõ, tên đường..." resize="none" />
              </el-form-item>
            </el-col>

            <!-- RIGHT COLUMN: Receiver Info & Package Details -->
            <el-col :span="12">
              <div class="form-section-title mb-3"><el-icon class="mr-2"><User /></el-icon>Thông tin Người nhận (Giao hàng)</div>

              <el-row :gutter="10">
                <el-col :span="12">
                  <el-form-item label="Tên người nhận" prop="receiver_name">
                    <el-input v-model="createForm.receiver_name" placeholder="Tên khách hàng nhận..." />
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="Số điện thoại nhận" prop="receiver_phone">
                    <el-input v-model="createForm.receiver_phone" placeholder="SĐT khách nhận..." />
                  </el-form-item>
                </el-col>
              </el-row>

              <el-row :gutter="10">
                <el-col :span="8">
                  <el-form-item label="Tỉnh/Thành phố" prop="receiver_province_id">
                    <el-select 
                      v-model="createForm.receiver_province_id" 
                      placeholder="Chọn Tỉnh..." 
                      filterable 
                      class="w-full"
                      @change="handleReceiverProvinceChange"
                    >
                      <el-option v-for="p in provinces" :key="p.id" :label="p.name" :value="p.id" />
                    </el-select>
                  </el-form-item>
                </el-col>
                <el-col :span="8">
                  <el-form-item label="Quận/Huyện" prop="receiver_district_id">
                    <el-select 
                      v-model="createForm.receiver_district_id" 
                      placeholder="Chọn Quận..." 
                      filterable 
                      class="w-full"
                      @change="handleReceiverDistrictChange"
                    >
                      <el-option v-for="d in receiverDistricts" :key="d.id" :label="d.name" :value="d.id" />
                    </el-select>
                  </el-form-item>
                </el-col>
                <el-col :span="8">
                  <el-form-item label="Phường/Xã" prop="receiver_ward_id">
                    <el-select 
                      v-model="createForm.receiver_ward_id" 
                      placeholder="Chọn Xã..." 
                      filterable 
                      class="w-full"
                      @change="handleReceiverWardChange"
                    >
                      <el-option v-for="w in receiverWards" :key="w.id" :label="w.name" :value="w.id" />
                    </el-select>
                  </el-form-item>
                </el-col>
              </el-row>

              <!-- Cảnh báo tỉnh người nhận chưa có bưu cục -->
              <el-alert
                v-if="receiverProvinceNoHub"
                type="warning"
                :closable="false"
                show-icon
                class="mb-3"
              >
                <template #title>
                  ⚠️ Tỉnh/thành <strong>{{ createForm.receiver_province_name }}</strong> chưa có bưu cục phát hàng trong hệ thống.
                </template>
                <template #default>
                  Vui lòng liên hệ Admin để thêm bưu cục cho tỉnh này, hoặc chọn tỉnh khác có bưu cục. Không thể tạo đơn nếu tỉnh người nhận chưa có bưu cục.
                </template>
              </el-alert>

              <el-form-item label="Địa chỉ nhận hàng chi tiết" prop="receiver_address_detail">
                <el-input v-model="createForm.receiver_address_detail" type="textarea" :rows="2" placeholder="Số nhà, ngõ, tên đường..." resize="none" />
              </el-form-item>

              <div class="form-section-title mb-3 mt-3"><el-icon class="mr-2"><Box /></el-icon>Thông tin Hàng hóa & Cước phí</div>
              
              <el-form-item label="Tên hàng hóa" prop="product_name">
                <el-input v-model="createForm.product_name" placeholder="Mô tả kiện hàng..." />
              </el-form-item>

              <el-row :gutter="10">
                <el-col :span="8">
                  <el-form-item label="Khối lượng (kg)" prop="weight">
                    <el-input-number v-model="createForm.weight" :min="0.1" :step="0.1" class="w-full" />
                  </el-form-item>
                </el-col>
                <el-col :span="8">
                  <el-form-item label="Tiền thu hộ (COD)" prop="cod_amount">
                    <el-input-number v-model="createForm.cod_amount" :min="0" :step="1000" class="w-full" :controls="false" />
                  </el-form-item>
                </el-col>
                <el-col :span="8">
                  <el-form-item label="Khai giá (đ)" prop="declared_value">
                    <el-input-number v-model="createForm.declared_value" :min="0" :step="50000" class="w-full" :controls="false" />
                  </el-form-item>
                </el-col>
              </el-row>

              <el-row :gutter="10">
                <el-col :span="12">
                  <el-form-item label="Dịch vụ vận chuyển">
                    <el-radio-group v-model="createForm.service_type" class="w-full">
                      <el-radio-button label="STANDARD">Chuẩn</el-radio-button>
                      <el-radio-button label="FAST">Nhanh</el-radio-button>
                    </el-radio-group>
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="Thanh toán cước">
                    <el-select v-model="createForm.payment_method" class="w-full">
                      <el-option label="Shop trả cước cuối tháng" value="SENDER_DEBT" />
                      <el-option label="Shop trả ngay khi gửi" value="SENDER_PAY" />
                      <el-option label="Người nhận trả cước" value="RECEIVER_PAY" />
                    </el-select>
                  </el-form-item>
                </el-col>
              </el-row>

              <el-row :gutter="10">
                <el-col :span="8">
                  <el-form-item label="Dài (cm)" prop="length">
                    <el-input-number v-model="createForm.length" :min="0" class="w-full" :controls="false" />
                  </el-form-item>
                </el-col>
                <el-col :span="8">
                  <el-form-item label="Rộng (cm)" prop="width">
                    <el-input-number v-model="createForm.width" :min="0" class="w-full" :controls="false" />
                  </el-form-item>
                </el-col>
                <el-col :span="8">
                  <el-form-item label="Cao (cm)" prop="height">
                    <el-input-number v-model="createForm.height" :min="0" class="w-full" :controls="false" />
                  </el-form-item>
                </el-col>
              </el-row>

              <el-form-item label="Ghi chú người gửi" prop="note">
                <el-input v-model="createForm.note" placeholder="Chỉ dẫn lấy hàng hoặc giao hàng..." />
              </el-form-item>
            </el-col>
          </el-row>
        </el-form>
        <template #footer>
          <div class="flex justify-end gap-2">
            <el-button @click="createDialogVisible = false">Hủy</el-button>
            <el-tooltip
              :content="receiverProvinceNoHub ? 'Tỉnh người nhận chưa có bưu cục trong hệ thống' : ''"
              :disabled="!receiverProvinceNoHub"
              placement="top"
            >
              <span>
                <el-button 
                  type="primary" 
                  :disabled="dialogLoading || receiverProvinceNoHub" 
                  @click="submitCreatePickup"
                >
                  Tạo Yêu Cầu
                </el-button>
              </span>
            </el-tooltip>
          </div>
        </template>
      </el-dialog>

      <!-- Confirm Hub Dialog (Tab 1) -->
      <el-dialog 
        v-model="confirmHubVisible" 
        title="Xác nhận Văn phòng lấy hàng" 
        width="450px"
        destroy-on-close
      >
        <div class="dialog-form" v-loading="dialogLoading">
          <div class="dialog-form-item">
            <label>CHỌN VĂN PHÒNG NHẬN (HUB)</label>
            <el-select 
              v-model="selectedHubId" 
              placeholder="Chọn bưu cục nhận..." 
              filterable 
              class="dialog-select"
            >
              <el-option 
                v-for="hub in hubs" 
                :key="hub.hub_id" 
                :label="hub.hub_code + ' - ' + hub.hub_name" 
                :value="hub.hub_id" 
              />
            </el-select>
          </div>
          <div class="dialog-form-item">
            <label>GHI CHÚ / CHỈ DẪN THÊM</label>
            <el-input 
              v-model="hubConfirmNote" 
              type="textarea" 
              :rows="3" 
              placeholder="Nhập ghi chú cho bưu cục lấy hàng..." 
              resize="none" 
            />
          </div>
        </div>
        <template #footer>
          <div class="flex justify-end gap-2">
            <el-button @click="confirmHubVisible = false">Hủy</el-button>
            <el-button type="primary" :disabled="!selectedHubId || dialogLoading" @click="submitConfirmHub">
              Xác nhận
            </el-button>
          </div>
        </template>
      </el-dialog>

      <!-- Assign Shipper Dialog (Tab 2) -->
      <el-dialog 
        v-model="assignShipperVisible" 
        title="Phân công Bưu tá đi lấy hàng" 
        width="450px"
        destroy-on-close
      >
        <div v-if="selectedRequest" class="dialog-form" v-loading="dialogLoading">
          <div class="mb-4">
            <div class="text-xs text-muted mb-2">ĐƠN PICKUP:</div>
            <div class="fw-bold text-dark mb-2">{{ selectedRequest.request_code }}</div>
            <div class="text-xs text-muted mb-2">ĐỊA CHỈ LẤY:</div>
            <div style="font-size: 13px; line-height: 1.4; color: #1e293b;" class="mb-2">
              {{ selectedRequest.pickup_address }}
            </div>
          </div>
          <div class="dialog-form-item">
            <label>CHỌN BƯU TÁ (SHIPPER)</label>
            <el-select 
              v-model="selectedShipperId" 
              placeholder="Chọn bưu tá lấy hàng..." 
              filterable 
              class="dialog-select"
            >
              <el-option 
                v-for="shipper in shippers" 
                :key="shipper.user_id" 
                :label="shipper.full_name + ' (' + shipper.phone + ')'" 
                :value="shipper.user_id" 
              />
            </el-select>
          </div>
          <div class="dialog-form-item">
            <label>GHI CHÚ GIAO VIỆC</label>
            <el-input 
              v-model="shipperAssignNote" 
              type="textarea" 
              :rows="3" 
              placeholder="Ví dụ: Gọi trước khi đến, lấy hàng trước 5h chiều..." 
              resize="none" 
            />
          </div>
        </div>
        <template #footer>
          <div class="flex justify-end gap-2">
            <el-button @click="assignShipperVisible = false">Hủy</el-button>
            <el-button type="primary" :disabled="!selectedShipperId || dialogLoading" @click="submitAssignShipper">
              Giao việc
            </el-button>
          </div>
        </template>
      </el-dialog>

      <!-- Dialog: Xác Nhận Đã Lấy Hàng Thành Công -->
      <el-dialog 
        v-model="pickedDialogVisible" 
        title="Xác nhận lấy hàng thành công (Hồ sơ biên nhận)" 
        width="480px"
        destroy-on-close
      >
        <el-form :model="pickedForm" label-position="top" v-loading="dialogLoading">
          <el-form-item label="MÃ YÊU CẦU PICKUP">
            <el-input v-model="pickedForm.request_code" disabled class="fw-bold" />
          </el-form-item>
          
          <el-form-item label="ẢNH BIÊN NHẬN THỰC ĐỊA (BẮT BUỘC)" required>
            <div class="flex-center flex-column gap-2 border-dashed p-4 rounded text-center upload-container">
              <el-upload
                class="receipt-uploader"
                :action="uploadUrl"
                :headers="uploadHeaders"
                name="file"
                :show-file-list="false"
                :on-success="handleUploadSuccess"
                :before-upload="beforeUpload"
                v-loading="uploadLoading"
              >
                <div v-if="pickedForm.pickup_image_url" class="relative group preview-wrapper">
                  <img :src="getFullImageUrl(pickedForm.pickup_image_url)" class="receipt-preview" />
                  <div class="upload-overlay">Thay đổi ảnh</div>
                </div>
                <div v-else class="upload-placeholder">
                  <el-icon class="receipt-uploader-icon"><Plus /></el-icon>
                  <div class="text-xs text-muted mt-2">Nhấp để chọn tải ảnh biên nhận</div>
                </div>
              </el-upload>
            </div>
            <div class="helper-text mt-1">Chỉ chấp nhận JPG/PNG dung lượng dưới 5MB.</div>
          </el-form-item>

          <el-form-item label="GHI CHÚ XÁC NHẬN">
            <el-input 
              v-model="pickedForm.note" 
              type="textarea" 
              :rows="3" 
              placeholder="Nhập thông tin xác nhận như số lượng thực tế, người giao..." 
            />
          </el-form-item>
        </el-form>
        <template #footer>
          <div class="flex justify-end gap-2">
            <el-button @click="pickedDialogVisible = false">Hủy</el-button>
            <el-button type="success" :disabled="!pickedForm.pickup_image_url || dialogLoading" @click="submitPicked">
              Đã Lấy Hàng
            </el-button>
          </div>
        </template>
      </el-dialog>

    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, reactive } from 'vue';
import { Location, Refresh, Search, Bicycle, OfficeBuilding, Phone, Plus, Check, User, Box } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import api from '@/api/axios';
import moment from 'moment';
import { useAuthStore } from '@/stores/auth';

const authStore = useAuthStore();

const activeTab = ref('pending');
const loading = ref(false);
const dialogLoading = ref(false);
const uploadLoading = ref(false);

const pendingRequests = ref([]);
const receivedRequests = ref([]);
const assignedRequests = ref([]);
const hubs = ref([]);
const shippers = ref([]);
const customers = ref([]);

const searchPending = ref('');
const searchReceived = ref('');
const searchAssigned = ref('');


// Selection states
const multipleSelection = ref([]);

// Dialog States
const confirmHubVisible = ref(false);
const selectedHubId = ref(null);
const hubConfirmNote = ref('');

const assignShipperVisible = ref(false);
const selectedRequest = ref(null);
const selectedShipperId = ref(null);
const shipperAssignNote = ref('');

// --- Geographic data loaders ---
const ADDR_API = '/vietnam-address.json';
const provinces = ref([]);
const senderDistricts = ref([]);
const senderWards = ref([]);
const receiverDistricts = ref([]);
const receiverWards = ref([]);
let allAddressData = [];

const createDialogVisible = ref(false);
const createFormRef = ref(null);
const createForm = reactive({
  customer_id: null,
  target_hub_id: null,
  source: 'HOTLINE',
  sender_name: '',
  sender_phone: '',
  sender_address_detail: '',
  sender_province_id: null,
  sender_district_id: null,
  sender_ward_id: null,
  sender_province_name: '',
  sender_district_name: '',
  sender_ward_name: '',

  receiver_name: '',
  receiver_phone: '',
  receiver_address_detail: '',
  receiver_province_id: null,
  receiver_district_id: null,
  receiver_ward_id: null,
  receiver_province_name: '',
  receiver_district_name: '',
  receiver_ward_name: '',

  product_name: 'Bưu phẩm bưu kiện',
  weight: 0.5,
  length: 0,
  width: 0,
  height: 0,
  quantity: 1,
  declared_value: 0,
  cod_amount: 0,
  service_type: 'STANDARD',
  payment_method: 'SENDER_DEBT',
  note: ''
});

const createRules = {
  customer_id: [{ required: true, message: 'Vui lòng chọn khách hàng', trigger: 'change' }],
  source: [{ required: true, message: 'Vui lòng chọn nguồn đơn', trigger: 'change' }],
  sender_name: [{ required: true, message: 'Nhập tên người gửi', trigger: 'blur' }],
  sender_phone: [{ required: true, message: 'Nhập SĐT người gửi', trigger: 'blur' }],
  sender_province_id: [{ required: true, message: 'Chọn tỉnh gửi', trigger: 'change' }],
  sender_district_id: [{ required: true, message: 'Chọn huyện gửi', trigger: 'change' }],
  sender_ward_id: [{ required: true, message: 'Chọn xã gửi', trigger: 'change' }],
  sender_address_detail: [{ required: true, message: 'Nhập địa chỉ chi tiết gửi', trigger: 'blur' }],
  receiver_name: [{ required: true, message: 'Nhập tên người nhận', trigger: 'blur' }],
  receiver_phone: [{ required: true, message: 'Nhập SĐT người nhận', trigger: 'blur' }],
  receiver_province_id: [{ required: true, message: 'Chọn tỉnh nhận', trigger: 'change' }],
  receiver_district_id: [{ required: true, message: 'Chọn huyện nhận', trigger: 'change' }],
  receiver_ward_id: [{ required: true, message: 'Chọn xã nhận', trigger: 'change' }],
  receiver_address_detail: [{ required: true, message: 'Nhập địa chỉ chi tiết nhận', trigger: 'blur' }],
  product_name: [{ required: true, message: 'Nhập tên hàng hóa', trigger: 'blur' }],
  weight: [{ required: true, message: 'Nhập khối lượng', trigger: 'change' }]
};

// "Xác nhận đã lấy" States
const pickedDialogVisible = ref(false);
const pickedForm = reactive({
  request_code: '',
  pickup_image_url: '',
  note: ''
});

// Image Upload Configuration
const uploadUrl = computed(() => {
  const base = import.meta.env.VITE_API_URL || '';
  return `${base}/api/upload/bill?is_pickup=true`;
});

const uploadHeaders = computed(() => {
  return authStore.token ? { Authorization: `Bearer ${authStore.token}` } : {};
});

const getFullImageUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  const base = import.meta.env.VITE_API_URL || '';
  return `${base}${url}`;
};

// Lấy tên bưu cục từ hub_id (vì BookingRequestResponse không có target_hub_name)
const getHubName = (hubId) => {
  if (!hubId) return null;
  const hub = hubs.value.find(h => h.hub_id === hubId);
  return hub ? hub.hub_name : null;
};

const normalizeProvinceName = (name) => {
  if (!name) return '';
  return name.normalize('NFC').trim().toLowerCase()
    .replace(/^thành phố\s+/i, '')
    .replace(/^tỉnh\s+/i, '')
    .replace(/^tp\.\s*/i, '')
    .replace(/^tp\s+/i, '');
};

// Kiểm tra tỉnh người nhận có bưu cục phát hàng không
// So sánh cả province_id lẫn tên tỉnh (normalized) — giống logic backend _find_hub_for_province
const receiverProvinceNoHub = computed(() => {
  if (!createForm.receiver_province_id) return false;

  const pid = Number(createForm.receiver_province_id);
  const receiverName = normalizeProvinceName(createForm.receiver_province_name);

  const found = hubs.value.some(h => {
    if (h.status === false) return false;
    // 1. So sánh province_id trực tiếp
    if (h.province_id && Number(h.province_id) === pid) return true;
    // 2. Fallback: so sánh tên tỉnh trong hub_name / address_detail
    const hubText = normalizeProvinceName(`${h.hub_name || ''} ${h.address_detail || ''}`);
    return receiverName && (hubText.includes(receiverName) || receiverName.includes(hubText.split(' ')[0]));
  });

  return !found;
});


// Filtered data computed properties
const filteredPending = computed(() => {
  if (!searchPending.value) return pendingRequests.value;
  const q = searchPending.value.toLowerCase().trim();
  return pendingRequests.value.filter(r => 
    r.request_code.toLowerCase().includes(q) ||
    (r.customer_name && r.customer_name.toLowerCase().includes(q)) ||
    (r.sender_phone && r.sender_phone.includes(q)) ||
    r.pickup_address.toLowerCase().includes(q)
  );
});

const filteredReceived = computed(() => {
  if (!searchReceived.value) return receivedRequests.value;
  const q = searchReceived.value.toLowerCase().trim();
  return receivedRequests.value.filter(r => 
    r.request_code.toLowerCase().includes(q) ||
    (r.customer_name && r.customer_name.toLowerCase().includes(q)) ||
    (r.sender_phone && r.sender_phone.includes(q)) ||
    r.pickup_address.toLowerCase().includes(q)
  );
});

const filteredAssigned = computed(() => {
  if (!searchAssigned.value) return assignedRequests.value;
  const q = searchAssigned.value.toLowerCase().trim();
  return assignedRequests.value.filter(r => 
    r.request_code.toLowerCase().includes(q) ||
    (r.customer_name && r.customer_name.toLowerCase().includes(q)) ||
    (r.sender_phone && r.sender_phone.includes(q)) ||
    (r.assigned_shipper_name && r.assigned_shipper_name.toLowerCase().includes(q)) ||
    r.pickup_address.toLowerCase().includes(q)
  );
});

const handleSelectionChange = (val) => {
  multipleSelection.value = val;
};

const handleTabChange = (tab) => {
  fetchTabRequests(tab);
};

const handleRefresh = () => {
  handleTabChange(activeTab.value);
};

const fetchTabRequests = async (tabName) => {
  loading.value = true;
  try {
    const isAdmin = authStore.user?.role_id === 1;
    const hubId = isAdmin ? null : (authStore.user?.primary_hub_id || null);

    if (tabName === 'pending') {
      const res = await api.get('/api/delivery/online-pickup-requests', {
        params: { status: 'PENDING_CONFIRMATION' }
      });
      pendingRequests.value = res.data || [];
    } else if (tabName === 'received') {
      if (isAdmin) {
        // Super Admin: dùng /pickup-requests — trả về tất cả đơn hoặc lọc theo selectedHubId
        const params = { status: 'RECEIVED' };
        if (selectedHubId.value) params.hub_id = selectedHubId.value;
        const res = await api.get('/api/delivery/pickup-requests', { params });
        receivedRequests.value = res.data || [];
      } else {
        const res = await api.get('/api/delivery/hub-pickup-requests', {
          params: { status: 'RECEIVED', hub_id: hubId }
        });
        receivedRequests.value = res.data || [];
      }
    } else if (tabName === 'assigned') {
      if (isAdmin) {
        // Super Admin: dùng /pickup-requests — trả về tất cả đơn hoặc lọc theo selectedHubId
        const params = { status: 'ASSIGNED_PICKUP' };
        if (selectedHubId.value) params.hub_id = selectedHubId.value;
        const res = await api.get('/api/delivery/pickup-requests', { params });
        assignedRequests.value = res.data || [];
      } else {
        const res = await api.get('/api/delivery/hub-pickup-requests', {
          params: { status: 'ASSIGNED_PICKUP', hub_id: hubId }
        });
        assignedRequests.value = res.data || [];
      }
    }
  } catch (err) {
    const detail = err.response?.data?.detail || '';

    if (detail.toLowerCase().includes('van phong')) {
      receivedRequests.value = [];
      assignedRequests.value = [];
    } else {
      ElMessage.error(detail || 'Lỗi tải danh sách yêu cầu lấy hàng');
    }
  } finally {
    loading.value = false;
  }
};


const fetchHubs = async () => {
  try {
    const res = await api.get('/api/hubs');
    hubs.value = (res.data.items || res.data || []).filter(h => h.status !== false);
  } catch (err) {
    console.error('Không tải được danh sách bưu cục:', err);
  }
};

const fetchShippersForHub = async (hubId) => {
  try {
    const res = await api.get('/api/users/shippers', {
      params: { hub_id: hubId }
    });
    shippers.value = res.data || [];
  } catch (err) {
    console.error('Không tải được danh sách bưu tá:', err);
  }
};

const fetchCustomers = async () => {
  try {
    const res = await api.get('/api/customers');
    customers.value = res.data.items || res.data || [];
  } catch (err) {
    console.error('Không tải được danh sách khách hàng:', err);
  }
};

// --- Geographic data loaders using local JSON ---
const fetchProvinces = async () => {
  try {
    const res = await fetch(ADDR_API);
    allAddressData = await res.json();
    provinces.value = allAddressData.map(p => ({ id: p.Id, name: p.Name }));
  } catch (err) {
    console.error('Không thể tải danh sách tỉnh/thành phố', err);
  }
};

const fetchDistrictsForProvince = async (provinceId) => {
  if (!provinceId || !allAddressData.length) return [];
  const pId = Number(provinceId);
  const prov = allAddressData.find(p => Number(p.Id) === pId);
  if (!prov || !prov.Districts) return [];
  return prov.Districts.map(d => ({ id: d.Id, name: d.Name }));
};

const fetchWardsForDistrict = async (districtId) => {
  if (!districtId || !allAddressData.length) return [];
  const dId = Number(districtId);
  for (const prov of allAddressData) {
    if (prov.Districts) {
      const dist = prov.Districts.find(d => Number(d.Id) === dId);
      if (dist && dist.Wards) {
        return dist.Wards.map(w => ({ id: w.Id, name: w.Name }));
      }
    }
  }
  return [];
};

const handleSenderProvinceChange = async () => {
  createForm.sender_district_id = null;
  createForm.sender_ward_id = null;
  senderWards.value = [];
  if (createForm.sender_province_id) {
    senderDistricts.value = await fetchDistrictsForProvince(createForm.sender_province_id);
    const prov = provinces.value.find(p => Number(p.id) === Number(createForm.sender_province_id));
    createForm.sender_province_name = prov ? prov.name : '';
  } else {
    senderDistricts.value = [];
    createForm.sender_province_name = '';
  }
};

const handleSenderDistrictChange = async () => {
  createForm.sender_ward_id = null;
  if (createForm.sender_district_id) {
    senderWards.value = await fetchWardsForDistrict(createForm.sender_district_id);
    const dist = senderDistricts.value.find(d => Number(d.id) === Number(createForm.sender_district_id));
    createForm.sender_district_name = dist ? dist.name : '';
  } else {
    senderWards.value = [];
    createForm.sender_district_name = '';
  }
};

const handleSenderWardChange = () => {
  if (createForm.sender_ward_id) {
    const ward = senderWards.value.find(w => Number(w.id) === Number(createForm.sender_ward_id));
    createForm.sender_ward_name = ward ? ward.name : '';
  } else {
    createForm.sender_ward_name = '';
  }
};

const handleReceiverProvinceChange = async () => {
  createForm.receiver_district_id = null;
  createForm.receiver_ward_id = null;
  receiverWards.value = [];
  if (createForm.receiver_province_id) {
    receiverDistricts.value = await fetchDistrictsForProvince(createForm.receiver_province_id);
    const prov = provinces.value.find(p => Number(p.id) === Number(createForm.receiver_province_id));
    createForm.receiver_province_name = prov ? prov.name : '';
  } else {
    receiverDistricts.value = [];
    createForm.receiver_province_name = '';
  }
};

const handleReceiverDistrictChange = async () => {
  createForm.receiver_ward_id = null;
  if (createForm.receiver_district_id) {
    receiverWards.value = await fetchWardsForDistrict(createForm.receiver_district_id);
    const dist = receiverDistricts.value.find(d => Number(d.id) === Number(createForm.receiver_district_id));
    createForm.receiver_district_name = dist ? dist.name : '';
  } else {
    receiverWards.value = [];
    createForm.receiver_district_name = '';
  }
};

const handleReceiverWardChange = () => {
  if (createForm.receiver_ward_id) {
    const ward = receiverWards.value.find(w => Number(w.id) === Number(createForm.receiver_ward_id));
    createForm.receiver_ward_name = ward ? ward.name : '';
  } else {
    createForm.receiver_ward_name = '';
  }
};

const handleCustomerChange = async (val) => {
  const c = customers.value.find(item => item.customer_id === val);
  if (!c) return;

  createForm.sender_name = c.transaction_name || c.company_name || c.representative_name || '';
  createForm.sender_phone = c.phone_number || '';
  createForm.sender_province_id = c.province_id || null;
  createForm.sender_district_id = c.district_id || null;
  createForm.sender_ward_id = c.ward_id || null;
  createForm.sender_address_detail = c.address_detail || c.street_address || '';

  // Load cascading dropdowns
  if (c.province_id) {
    senderDistricts.value = await fetchDistrictsForProvince(c.province_id);
    const prov = provinces.value.find(p => Number(p.id) === Number(c.province_id));
    createForm.sender_province_name = prov ? prov.name : c.province_name || '';
  } else {
    senderDistricts.value = [];
    createForm.sender_province_name = '';
  }

  if (c.district_id) {
    senderWards.value = await fetchWardsForDistrict(c.district_id);
    const dist = senderDistricts.value.find(d => Number(d.id) === Number(c.district_id));
    createForm.sender_district_name = dist ? dist.name : '';
  } else {
    senderWards.value = [];
    createForm.sender_district_name = '';
  }

  if (c.ward_id) {
    const ward = senderWards.value.find(w => Number(w.id) === Number(c.ward_id));
    createForm.sender_ward_name = ward ? ward.name : c.ward_name || '';
  } else {
    createForm.sender_ward_name = '';
  }
};

// --- Dialog: Tạo đơn CSKH/Hotline ---
const openCreatePickupDialog = async () => {
  // Reset createForm fields
  Object.assign(createForm, {
    customer_id: null,
    target_hub_id: null,
    source: 'HOTLINE',
    sender_name: '',
    sender_phone: '',
    sender_address_detail: '',
    sender_province_id: null,
    sender_district_id: null,
    sender_ward_id: null,
    sender_province_name: '',
    sender_district_name: '',
    sender_ward_name: '',
    receiver_name: '',
    receiver_phone: '',
    receiver_address_detail: '',
    receiver_province_id: null,
    receiver_district_id: null,
    receiver_ward_id: null,
    receiver_province_name: '',
    receiver_district_name: '',
    receiver_ward_name: '',
    product_name: 'Bưu phẩm bưu kiện',
    weight: 0.5,
    length: 0,
    width: 0,
    height: 0,
    quantity: 1,
    declared_value: 0,
    cod_amount: 0,
    service_type: 'STANDARD',
    payment_method: 'SENDER_DEBT',
    note: ''
  });

  senderDistricts.value = [];
  senderWards.value = [];
  receiverDistricts.value = [];
  receiverWards.value = [];

  createDialogVisible.value = true;
};

const submitCreatePickup = async () => {
  if (!createFormRef.value) return;
  
  await createFormRef.value.validate(async (valid) => {
    if (!valid) {
      ElMessage.warning('Vui lòng kiểm tra và hoàn tất đầy đủ thông tin bắt buộc.');
      return;
    }

    dialogLoading.value = true;
    try {
      const payload = {
        customer_id: createForm.customer_id,
        target_hub_id: createForm.target_hub_id || null,
        source: createForm.source,
        order_type: "DOMESTIC",
        shop_order_code: `HL-${Date.now()}`,
        sender: {
          name: createForm.sender_name,
          phone: createForm.sender_phone,
          address: `${createForm.sender_address_detail}, ${createForm.sender_ward_name}, ${createForm.sender_district_name}, ${createForm.sender_province_name}`,
          province_id: Number(createForm.sender_province_id),
          district_id: Number(createForm.sender_district_id),
          ward_id: Number(createForm.sender_ward_id),
          province_name: createForm.sender_province_name,
          district_name: createForm.sender_district_name,
          ward_name: createForm.sender_ward_name
        },
        receiver: {
          name: createForm.receiver_name,
          phone: createForm.receiver_phone,
          address: `${createForm.receiver_address_detail}, ${createForm.receiver_ward_name}, ${createForm.receiver_district_name}, ${createForm.receiver_province_name}`,
          province_id: Number(createForm.receiver_province_id),
          district_id: Number(createForm.receiver_district_id),
          ward_id: Number(createForm.receiver_ward_id),
          province_name: createForm.receiver_province_name,
          district_name: createForm.receiver_district_name,
          ward_name: createForm.receiver_ward_name
        },
        items: [
          {
            product_group: "PARCEL",
            product_name: createForm.product_name || "Bưu phẩm bưu kiện",
            description: createForm.note || "",
            weight: Number(createForm.weight || 0.5),
            length: Number(createForm.length || 0),
            width: Number(createForm.width || 0),
            height: Number(createForm.height || 0),
            quantity: Number(createForm.quantity || 1),
            declared_value: Number(createForm.declared_value || 0),
          }
        ],
        documents: [],
        cod_amount: Number(createForm.cod_amount || 0),
        cod_receiver_pays_fee: false,
        service_type: createForm.service_type || "STANDARD",
        extra_services: [],
        delivery_note_option: "CHO_XEM_HANG",
        note: createForm.note || "",
        payment_method: createForm.payment_method || "SENDER_DEBT",
        save_as_draft: false
      };

      const res = await api.post('/api/waybills/admin/pickups', payload);
      const data = res.data;

      ElMessage.success(`Tạo yêu cầu thành công! Vận đơn: ${data.waybill_code}`);
      createDialogVisible.value = false;

      // Handle redirect / switch tabs depending on target_hub_id selection
      if (data.pickup_status === 'RECEIVED') {
        // Nếu Super Admin, tự đổi selectedHubId sang hub của đơn vừa tạo
        if (authStore.user?.role_id === 1 && createForm.target_hub_id) {
          selectedHubId.value = createForm.target_hub_id;
        }
        activeTab.value = 'received';
        fetchTabRequests('received');
      } else {
        activeTab.value = 'pending';
        fetchTabRequests('pending');
      }
    } catch (err) {
      ElMessage.error(err.response?.data?.detail || 'Có lỗi xảy ra khi tạo yêu cầu lấy hàng.');
    } finally {
      dialogLoading.value = false;
    }
  });
};

// --- Dialog: Confirm Hub (Tab 1) ---
const openConfirmHubDialog = () => {
  selectedHubId.value = authStore.user?.primary_hub_id || null;
  hubConfirmNote.value = '';
  confirmHubVisible.value = true;
};

const submitConfirmHub = async () => {
  if (!selectedHubId.value) return;
  
  dialogLoading.value = true;
  try {
    const requestIds = multipleSelection.value.map(r => r.request_id);
    await api.post('/api/delivery/online-pickup-requests/confirm-hub', {
      request_ids: requestIds,
      hub_id: selectedHubId.value,
      note: hubConfirmNote.value.trim() || 'Xác nhận văn phòng lấy hàng online'
    });
    
    ElMessage.success(`Đã xác nhận bưu cục cho ${requestIds.length} yêu cầu thành công!`);
    confirmHubVisible.value = false;
    multipleSelection.value = [];
    fetchTabRequests('pending');
  } catch (err) {
    ElMessage.error(err.response?.data?.detail || 'Có lỗi xảy ra khi xác nhận bưu cục');
  } finally {
    dialogLoading.value = false;
  }
};

// --- Dialog: Assign Shipper (Tab 2) ---
const openAssignShipperDialog = async (row) => {
  selectedRequest.value = row;
  selectedShipperId.value = null;
  shipperAssignNote.value = '';
  
  dialogLoading.value = true;
  assignShipperVisible.value = true;
  
  // Load shippers based on target hub of request
  await fetchShippersForHub(row.target_hub_id);
  dialogLoading.value = false;
};

const submitAssignShipper = async () => {
  if (!selectedShipperId.value || !selectedRequest.value) return;
  
  dialogLoading.value = true;
  try {
    const code = selectedRequest.value.request_code;
    await api.post(`/api/delivery/pickup-requests/${code}/assign-shipper`, {
      shipper_id: selectedShipperId.value,
      note: shipperAssignNote.value.trim() || 'Phân công shipper lấy hàng'
    });
    
    ElMessage.success(`Đã gán bưu tá cho đơn ${code} thành công!`);
    assignShipperVisible.value = false;
    fetchTabRequests('received');
  } catch (err) {
    ElMessage.error(err.response?.data?.detail || 'Có lỗi xảy ra khi phân công bưu tá');
  } finally {
    dialogLoading.value = false;
  }
};

// --- Dialog: Xác nhận đã lấy hàng ---
const openPickedDialog = (row) => {
  pickedForm.request_code = row.request_code;
  pickedForm.pickup_image_url = '';
  pickedForm.note = '';
  pickedDialogVisible.value = true;
};

const submitPicked = async () => {
  if (!pickedForm.pickup_image_url) {
    ElMessage.warning('Vui lòng chụp/tải lên ảnh biên nhận để làm hồ sơ thực địa.');
    return;
  }

  dialogLoading.value = true;
  try {
    const code = pickedForm.request_code;
    await api.post(`/api/delivery/pickup-requests/${code}/picked`, {
      pickup_image_url: pickedForm.pickup_image_url,
      note: pickedForm.note.trim() || 'Xác nhận bưu tá đã lấy hàng thành công trên Web'
    });

    ElMessage.success(`Xác nhận đã lấy đơn hàng ${code} thành công!`);
    pickedDialogVisible.value = false;
    fetchTabRequests('assigned');
  } catch (err) {
    ElMessage.error(err.response?.data?.detail || 'Lỗi hệ thống khi cập nhật kết quả lấy hàng');
  } finally {
    dialogLoading.value = false;
  }
};

// File Upload Event Handlers
const beforeUpload = (file) => {
  const isImage = file.type.startsWith('image/');
  const isLt5M = file.size / 1024 / 1024 < 5;

  if (!isImage) {
    ElMessage.error('Chỉ hỗ trợ định dạng tệp ảnh (JPG, PNG, WEBP)!');
    return false;
  }
  if (!isLt5M) {
    ElMessage.error('Kích thước ảnh biên nhận tối đa là 5MB!');
    return false;
  }
  uploadLoading.value = true;
  return true;
};

const handleUploadSuccess = (response) => {
  uploadLoading.value = false;
  if (response.status === 'success' || response.image_url) {
    pickedForm.pickup_image_url = response.image_url;
    ElMessage.success('Tải ảnh biên nhận thực địa lên thành công!');
  } else {
    ElMessage.error('Không tìm thấy tệp ảnh tải lên trong kết quả trả về.');
  }
};

// Formatting utilities
const formatDate = (val) => {
  return val ? moment(val).format('HH:mm DD/MM/YYYY') : '---';
};

const getPriorityType = (priority) => {
  switch (priority) {
    case 'VIP':
    case 'URGENT':
      return 'danger';
    case 'NORMAL':
      return 'info';
    default:
      return 'warning';
  }
};

const getSourceTagType = (source) => {
  switch (source?.toUpperCase()) {
    case 'HOTLINE': return 'danger';
    case 'CSKH': return 'warning';
    case 'ADMIN': return 'primary';
    default: return 'info';
  }
};

onMounted(() => {
  fetchTabRequests('pending');
  fetchHubs();
  fetchCustomers();
  fetchProvinces();
});
</script>

<style scoped>
.modern-pickup-page {
  min-height: calc(100vh - 64px);
  background-color: var(--sp-bg-app, #f8fafc);
  font-family: 'Plus Jakarta Sans', sans-serif;
  color: var(--sp-text-main, #1e293b);
  padding: 24px;
}

.page-container {
  max-width: 1500px;
  margin: 0 auto;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.flex-between { display: flex; justify-content: space-between; align-items: center; }
.flex-center { display: flex; align-items: center; }
.gap-2 { gap: 8px; }
.gap-3 { gap: 12px; }
.w-full { width: 100%; }
.mb-4 { margin-bottom: 16px; }
.mb-3 { margin-bottom: 12px; }
.mt-3 { margin-top: 12px; }
.mr-2 { margin-right: 8px; }
.mr-1 { margin-right: 4px; }
.fw-bold { font-weight: 700; }
.fw-semibold { font-weight: 600; }
.text-dark { color: var(--sp-text-main, #1e293b); }
.text-muted { color: var(--sp-text-muted, #64748b); }
.text-danger { color: var(--sp-danger, #ef4444); }
.text-primary { color: var(--sp-primary, #4318ff); }
.text-xs { font-size: 12px; }

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
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
.icon-box.primary { background: rgba(67, 24, 255, 0.1); color: var(--sp-primary, #4318ff); }

.page-title { font-size: 28px; font-weight: 800; color: var(--sp-text-main, #1e293b); margin: 0 0 4px 0; letter-spacing: -0.5px; }
.page-subtitle { color: var(--sp-text-muted, #64748b); font-size: 14px; margin: 0; font-weight: 500; }

.content-card {
  background: var(--sp-surface, #ffffff);
  backdrop-filter: blur(12px);
  border-radius: 16px;
  box-shadow: 0px 4px 15px rgba(0, 0, 0, 0.02);
  border: 1px solid var(--sp-bg-app, #f8fafc);
  padding: 24px;
  overflow: hidden;
}

.card-header-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

:deep(.modern-table) {
  --el-table-border-color: transparent;
  --el-table-header-bg-color: #F8FAFC;
  --el-table-header-text-color: var(--sp-text-muted, #64748b);
  --el-table-text-color: var(--sp-text-main, #1e293b);
}
:deep(.modern-table th.el-table__cell) { font-weight: 700; font-size: 12px; text-transform: uppercase; padding: 12px 0; border-bottom: 2px solid var(--sp-bg-app, #f8fafc) !important; }
:deep(.modern-table td.el-table__cell) { padding: 12px 0; border-bottom: 1px solid var(--sp-bg-app, #f8fafc) !important; }

.code-badge { font-family: monospace; font-weight: 800; padding: 4px 8px; border-radius: 6px; font-size: 12px; display: inline-block; }
.code-badge.warning { background: rgba(245, 158, 11, 0.1); color: #D97706; }
.code-badge.success { background: rgba(16, 185, 129, 0.1); color: #059669; }
.code-badge.info { background: rgba(59, 130, 246, 0.1); color: #2563eb; }

.sender-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.address-text {
  font-size: 12px;
  color: var(--sp-text-muted, #64748b);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 280px;
  display: inline-block;
}

.search-wrapper {
  width: 240px;
}
:deep(.modern-input-small .el-input__wrapper) { background: #F8FAFC; box-shadow: none !important; border: 1px solid var(--sp-border, #cbd5e1); border-radius: 8px; padding: 4px 10px; transition: all 0.3s; }
:deep(.modern-input-small .el-input__wrapper:hover),
:deep(.modern-input-small .el-input__wrapper.is-focus) { border-color: var(--sp-primary, #4318ff); background: var(--sp-surface, #ffffff); }

/* Dialog Form Styling */
.dialog-form {
  padding: 8px 0;
}
.dialog-form-item {
  margin-bottom: 16px;
}
.dialog-form-item label {
  display: block;
  font-weight: 700;
  font-size: 13px;
  color: var(--sp-text-main, #1e293b);
  margin-bottom: 6px;
}
:deep(.dialog-select) {
  width: 100%;
}
:deep(.dialog-select .el-input__wrapper) {
  border-radius: 8px;
  padding: 6px 12px;
}

/* Tabs styles */
:deep(.el-tabs__header) {
  margin-bottom: 24px;
}
:deep(.el-tabs__nav-wrap::after) {
  background-color: var(--sp-bg-app, #f8fafc);
}
:deep(.el-tabs__item) {
  font-size: 15px;
  font-weight: 700;
  color: var(--sp-text-muted, #64748b);
  padding: 0 20px;
}
:deep(.el-tabs__item.is-active) {
  color: var(--sp-primary, #4318ff);
}
:deep(.el-tabs__active-bar) {
  background-color: var(--sp-primary, #4318ff);
  height: 3px;
  border-radius: 3px;
}

/* Custom CSS for picked photo uploading */
.upload-container {
  border: 2px dashed #cbd5e1;
  background-color: #f8fafc;
  cursor: pointer;
  transition: all 0.3s ease;
}
.upload-container:hover {
  border-color: var(--sp-success, #10b981);
  background-color: #f0fdf4;
}
.receipt-uploader {
  display: inline-block;
  width: 100%;
}
.receipt-preview {
  width: 100%;
  max-height: 220px;
  object-fit: cover;
  border-radius: 6px;
}
.upload-placeholder {
  padding: 24px 0;
}
.receipt-uploader-icon {
  font-size: 28px;
  color: #94a3b8;
}
.preview-wrapper {
  position: relative;
  overflow: hidden;
  border-radius: 6px;
}
.upload-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(0, 0, 0, 0.6);
  color: white;
  padding: 6px;
  font-size: 12px;
  font-weight: 600;
  opacity: 0;
  transition: opacity 0.3s ease;
}
.preview-wrapper:hover .upload-overlay {
  opacity: 1;
}

/* CSKH Form Styles */
.form-section-title {
  font-size: 14px;
  font-weight: 800;
  color: var(--sp-primary, #4318ff);
  border-bottom: 2px solid #e2e8f0;
  padding-bottom: 6px;
}
.dialog-cskh-form {
  max-height: 65vh;
  overflow-y: auto;
  padding-right: 8px;
}

.animate-fade-in { animation: fadeIn 0.4s ease-out; }
.animate-fade-in-up { animation: fadeInUp 0.4s ease-out; }
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes fadeInUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
</style>
