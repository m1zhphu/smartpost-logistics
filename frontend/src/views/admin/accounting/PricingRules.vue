<template>
  <div class="modern-pricing-management">
    <div class="page-container">

      <!-- Header Section -->
      <header class="page-header animate-fade-in">
        <div class="header-content">
          <div class="title-wrapper">
            <div class="icon-box primary">
              <el-icon><Ticket /></el-icon>
            </div>
            <div>
              <h2 class="page-title">Cấu hình Bảng Giá</h2>
              <p class="page-subtitle">Quản lý phí vận chuyển theo tuyến đường, khối lượng và loại dịch vụ</p>
            </div>
          </div>
        </div>
        <div class="header-actions">
          <button class="btn-secondary circle-btn" @click="refreshAll" title="Làm mới toàn bộ dữ liệu">
            <el-icon><Refresh /></el-icon>
          </button>
        </div>
      </header>

      <!-- Stats Grid -->
      <div class="stats-grid animate-fade-in mb-24">
        <div class="stat-card">
          <div class="stat-icon-wrapper bg-blue">
            <el-icon><List /></el-icon>
          </div>
          <div class="stat-content">
            <span class="stat-value">{{ rules.length }}</span>
            <span class="stat-label">Tổng quy tắc tuyến</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon-wrapper bg-green">
            <el-icon><CircleCheck /></el-icon>
          </div>
          <div class="stat-content">
            <span class="stat-value">{{ activeCount }}</span>
            <span class="stat-label">Tuyến đang áp dụng</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon-wrapper bg-orange">
            <el-icon><Lightning /></el-icon>
          </div>
          <div class="stat-content">
            <span class="stat-value">{{ expressCount }}</span>
            <span class="stat-label">Hỏa tốc / hàng đặc biệt</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon-wrapper bg-purple">
            <el-icon><Setting /></el-icon>
          </div>
          <div class="stat-content">
            <span class="stat-value">{{ services.length }}</span>
            <span class="stat-label">Dịch vụ tiện ích</span>
          </div>
        </div>
      </div>

      <!-- Main Tabs -->
      <el-tabs v-model="activeTab" class="modern-tabs animate-fade-in-up">
        
        <el-tab-pane label="Danh sách Bảng giá" name="policies">
          <div class="content-card table-wrapper">
            <div class="card-header-inner mb-4 flex-between">
              <h3 class="inner-title">Danh sách Bảng giá / Chính sách giá</h3>
              <button v-if="canEditPricing" class="btn-primary" @click="openPolicyDialog(null)">
                <el-icon><Plus /></el-icon> Thêm Bảng giá
              </button>
            </div>

            <el-table
              :data="policies"
              v-loading="policyLoading"
              class="modern-table"
              row-class-name="modern-row"
              style="width: 100%"
            >
              <el-table-column prop="policy_code" label="Mã bảng giá" min-width="150">
                <template #default="{ row }">
                  <span class="code-badge uppercase">{{ row.policy_code }}</span>
                </template>
              </el-table-column>
              <el-table-column prop="policy_name" label="Tên bảng giá" min-width="260" />
              <el-table-column prop="policy_type" label="Loại bảng giá" min-width="150" align="center">
                <template #default="{ row }">
                  {{ getPolicyTypeName(row.policy_type) }}
                </template>
              </el-table-column>
              <el-table-column label="Duyệt" min-width="120" align="center">
                <template #default="{ row }">
                  <div class="status-pill" :class="row.is_approved ? 'active' : 'locked'">
                    {{ row.is_approved ? 'Đã duyệt' : 'Chưa duyệt' }}
                  </div>
                </template>
              </el-table-column>
              <el-table-column label="Trạng thái" min-width="140" align="center">
                <template #default="{ row }">
                  <div class="status-pill" :class="row.is_active ? 'active' : 'locked'">
                    {{ row.is_active ? 'Đang áp dụng' : 'Tạm dừng' }}
                  </div>
                </template>
              </el-table-column>
              <el-table-column label="Thao tác" min-width="120" align="center">
                <template #default="{ row }">
                  <div class="action-buttons" style="display: flex; gap: 8px; justify-content: center;">
                    <button class="icon-btn edit" @click.stop="viewPolicyRules(row)" title="Xem cước tuyến">
                      <el-icon><MapLocation /></el-icon>
                    </button>
                    <button v-if="canEditPricing" class="icon-btn edit" @click.stop="openPolicyDialog(row)" title="Chỉnh sửa bảng giá">
                      <el-icon><Edit /></el-icon>
                    </button>
                  </div>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </el-tab-pane>

        <!-- TAB 1: MAIN ROUTES -->
        <el-tab-pane label="Bảng Giá Cước Tuyến" name="main_routes">
          
          <!-- Filter Section -->
          <div class="content-card filter-card mb-24">
            <div class="filter-wrapper">
              <div class="filter-inputs">
                <el-select v-model="filter.service_type" placeholder="Tất cả dịch vụ" clearable class="modern-select w-200">
                  <el-option label="Chuyển phát nhanh" value="CPN" />
                  <el-option label="Tiết kiệm" value="TK" />
                  <el-option label="Hỏa tốc / hàng đặc biệt" value="HT" />
                </el-select>
                <el-select v-model="filterProvinceId" placeholder="Lọc theo tỉnh/thành" clearable filterable class="modern-select w-260">
                  <el-option v-for="province in provinces" :key="province.id" :label="province.name" :value="province.id" />
                </el-select>
              </div>
              <div class="filter-actions">
                <button class="btn-secondary" @click="resetFilters">
                  <el-icon><RefreshRight /></el-icon> Đặt lại
                </button>
                <button v-if="canEditPricing" class="btn-primary" @click="openDialog(null)">
                  <el-icon><Plus /></el-icon> Thêm Tuyến Giá
                </button>
              </div>
            </div>
          </div>

          <!-- Table Section -->
          <div class="content-card table-wrapper">
            <div class="card-header-inner mb-4">
              <h3 class="inner-title">Danh sách Quy tắc Giá theo tuyến</h3>
              <el-tag type="primary" effect="light" round class="fw-bold">{{ filteredRules.length }} quy tắc</el-tag>
            </div>

            <el-table 
              :data="paginatedRules" 
              v-loading="loading" 
              class="modern-table"
              row-class-name="modern-row"
              style="width: 100%"
            >
              <!-- Tuyến đường -->
              <el-table-column label="Tuyến đường vận chuyển" min-width="320">
                <template #default="{ row }">
                  <div v-if="isZoneRule(row)" class="zone-route-display">
                    <span class="zone-route-icon">
                      <el-icon><MapLocation /></el-icon>
                    </span>
                    <div class="zone-route-content">
                      <span class="zone-route-code">{{ row.zone_name }}</span>
                      <span class="zone-route-name">{{ getZoneSummary(row.zone_name) }}</span>
                    </div>
                  </div>
                  <div v-else class="route-visualization">
                    <div class="route-hub origin">
                      <span class="hub-code">{{ row.from_province_id || '---' }}</span>
                      <span class="hub-name text-truncate">{{ getProvinceName(row.from_province_id) }}</span>
                    </div>
                    <div class="route-connector">
                      <div class="line"></div>
                      <el-icon class="arrow-icon"><Right /></el-icon>
                    </div>
                    <div class="route-hub dest">
                      <span class="hub-code">{{ row.to_province_id || '---' }}</span>
                      <span class="hub-name text-truncate">{{ getProvinceName(row.to_province_id) }}</span>
                    </div>
                  </div>
                </template>
              </el-table-column>

              <!-- Dịch vụ -->
              <el-table-column label="Bảng giá" min-width="180" align="center">
                <template #default="{ row }">
                  <span class="code-badge">{{ getPolicyName(row.policy_id) }}</span>
                </template>
              </el-table-column>

              <el-table-column label="Loại Dịch vụ" min-width="160" align="center">
                <template #default="{ row }">
                  <div class="modern-tag" :class="getServiceTagClass(row.service_type)">
                    <span class="dot"></span>
                    {{ getServiceLabel(row.service_type) }}
                  </div>
                </template>
              </el-table-column>

              <!-- Nấc cân -->
              <el-table-column label="Nấc cân áp dụng" min-width="160" align="center">
                <template #default="{ row }">
                  <div class="weight-badge">
                    <el-icon><ScaleToOriginal /></el-icon>
                    <span>{{ row.min_weight }} – {{ row.max_weight }} kg</span>
                  </div>
                </template>
              </el-table-column>

              <!-- Đơn giá -->
              <el-table-column label="Đơn giá" min-width="160" align="right">
                <template #default="{ row }">
                  <div class="price-display">
                    <span class="amount">{{ formatMoney(row.price) }}</span>
                    <span class="currency">đ</span>
                  </div>
                  <div class="price-hint" v-if="row.pricing_method === 'INCREMENTAL'">
                    +{{ formatMoney(row.increment_price) }}đ / {{ row.increment_weight }}kg sau {{ row.base_weight }}kg
                  </div>
                </template>
              </el-table-column>

              <!-- Trạng thái -->
              <el-table-column label="Trạng thái" min-width="140" align="center">
                <template #default="{ row }">
                  <div class="status-pill" :class="row.is_active ? 'active' : 'locked'">
                    {{ row.is_active ? 'Đang áp dụng' : 'Tạm dừng' }}
                  </div>
                </template>
              </el-table-column>

              <!-- Thao tác -->
              <el-table-column v-if="canEditPricing" label="Thao tác" min-width="120" align="center">
                <template #default="{ row }">
                  <div class="action-buttons">
                    <button class="icon-btn edit" @click="openDialog(row)" title="Chỉnh sửa">
                      <el-icon><Edit /></el-icon>
                    </button>
                    <button class="icon-btn delete" @click="handleDelete(row)" title="Xóa">
                      <el-icon><Delete /></el-icon>
                    </button>
                  </div>
                </template>
              </el-table-column>

              <template #empty>
                <div class="empty-state">
                  <el-empty description="Chưa có quy tắc giá nào hoặc không tìm thấy kết quả phù hợp" :image-size="100" />
                  <button v-if="canEditPricing" class="btn-primary mt-4 mx-auto" @click="openDialog(null)">
                    <el-icon><Plus /></el-icon> Thêm quy tắc đầu tiên
                  </button>
                </div>
              </template>
            </el-table>
            <div style="margin-top: 16px; display: flex; justify-content: flex-end;">
              <el-pagination
                v-model:current-page="currentRulesPage"
                v-model:page-size="rulesPageSize"
                :page-sizes="[10, 20, 50, 100]"
                layout="total, sizes, prev, pager, next, jumper"
                :total="filteredRules.length"
              />
            </div>
          </div>
        </el-tab-pane>

        <!-- TAB 2: EXTRA SERVICES -->
        <el-tab-pane label="Phí Dịch vụ Tiện Ích" name="extra_services">
          <div class="content-card table-wrapper">
            <div class="card-header-inner mb-4 flex-between">
              <h3 class="inner-title">Cấu hình phí dịch vụ cộng thêm</h3>
              <button v-if="canEditPricing" class="btn-primary" @click="openServiceDialog(null)">
                <el-icon><Plus /></el-icon> Thêm Dịch vụ mới
              </button>
            </div>

            <el-table 
              :data="services" 
              v-loading="serviceLoading" 
              class="modern-table"
              row-class-name="modern-row"
              style="width: 100%"
            >
              <el-table-column label="Mã Dịch vụ" min-width="140">
                <template #default="{ row }">
                  <span class="code-badge uppercase">{{ row.service_code }}</span>
                </template>
              </el-table-column>

              <el-table-column prop="service_name" label="Tên Dịch vụ" min-width="220">
                <template #default="{ row }">
                  <span class="fw-bold text-dark">{{ row.service_name }}</span>
                </template>
              </el-table-column>

              <el-table-column label="Loại Phí" min-width="150" align="center">
                <template #default="{ row }">
                  <div class="modern-tag" :class="row.fee_type === 'FIXED' ? 'tag-primary' : 'tag-warning'">
                    <span class="dot"></span>
                    {{ getServiceFeeTypeLabel(row.fee_type) }}
                  </div>
                </template>
              </el-table-column>

              <el-table-column label="Tính trên" min-width="160" align="center">
                <template #default="{ row }">
                  <span>{{ getCalculationBaseLabel(row.calculation_base) }}</span>
                </template>
              </el-table-column>

              <el-table-column label="Khoảng áp dụng" min-width="190" align="center">
                <template #default="{ row }">
                  <span v-if="row.min_order_value || row.max_order_value">
                    {{ row.min_order_value ? formatMoney(row.min_order_value) : '0' }} - {{ row.max_order_value ? formatMoney(row.max_order_value) : 'Không giới hạn' }}
                  </span>
                  <span v-else>Toàn bộ</span>
                </template>
              </el-table-column>

              <el-table-column label="Mức Phí áp dụng" min-width="180" align="right">
                <template #default="{ row }">
                  <div class="price-display highlight">
                    <span class="amount">{{ formatMoney(row.fee_value) }}</span>
                    <span class="currency">{{ row.fee_type === 'PERCENT' ? '%' : 'VNĐ' }}</span>
                  </div>
                  <div class="price-hint" v-if="row.min_fee">Tối thiểu {{ formatMoney(row.min_fee) }} VNĐ</div>
                </template>
              </el-table-column>

              <el-table-column label="Trạng thái" min-width="140" align="center">
                <template #default="{ row }">
                  <el-switch 
                    v-model="row.is_active" 
                    :disabled="!canEditPricing" 
                    @change="toggleServiceStatus(row)" 
                    style="--el-switch-on-color: #05CD99; --el-switch-off-color: #E2E8F0" 
                  />
                </template>
              </el-table-column>

              <el-table-column v-if="canEditPricing" label="Thao tác" min-width="100" align="center">
                <template #default="{ row }">
                  <button class="icon-btn edit mx-auto" @click="openServiceDialog(row)" title="Chỉnh sửa">
                    <el-icon><Edit /></el-icon>
                  </button>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </el-tab-pane>

        <el-tab-pane label="Phí đóng kiện" name="packing_rules">
          <div class="content-card table-wrapper">
            <div class="card-header-inner mb-4 flex-between">
              <h3 class="inner-title">Cấu hình phí đóng kiện theo mốc cân</h3>
              <button v-if="canEditPricing" class="btn-primary" @click="openPackingDialog(null)">
                <el-icon><Plus /></el-icon> Thêm mốc đóng kiện
              </button>
            </div>

            <el-table :data="packingRules" v-loading="packingLoading" class="modern-table" row-class-name="modern-row" style="width: 100%">
              <el-table-column label="Loại đóng kiện" min-width="160">
                <template #default="{ row }">
                  <span class="code-badge">{{ getPackingTypeLabel(row.packing_type) }}</span>
                </template>
              </el-table-column>
              <el-table-column label="Mốc cân" min-width="150" align="center">
                <template #default="{ row }">
                  <span>{{ row.min_weight }} - {{ row.max_weight }} kg</span>
                </template>
              </el-table-column>
              <el-table-column label="Phí đóng kiện" min-width="160" align="right">
                <template #default="{ row }">
                  <div class="price-display">
                    <span class="amount">{{ formatMoney(row.packing_fee) }}</span>
                    <span class="currency">VNĐ</span>
                  </div>
                </template>
              </el-table-column>
              <el-table-column label="Trọng lượng cộng thêm" min-width="180" align="center">
                <template #default="{ row }">
                  <span class="fw-bold">{{ row.added_weight }} kg</span>
                </template>
              </el-table-column>
              <el-table-column label="Trạng thái" min-width="140" align="center">
                <template #default="{ row }">
                  <el-switch v-model="row.is_active" :disabled="!canEditPricing" @change="togglePackingStatus(row)" style="--el-switch-on-color: #05CD99; --el-switch-off-color: #E2E8F0" />
                </template>
              </el-table-column>
              <el-table-column v-if="canEditPricing" label="Thao tác" min-width="120" align="center">
                <template #default="{ row }">
                  <div class="action-buttons">
                    <button class="icon-btn edit" @click="openPackingDialog(row)" title="Chỉnh sửa">
                      <el-icon><Edit /></el-icon>
                    </button>
                    <button class="icon-btn delete" @click="handleDeletePacking(row)" title="Xóa">
                      <el-icon><Delete /></el-icon>
                    </button>
                  </div>
                </template>
              </el-table-column>
              <template #empty>
                <el-empty description="Chưa có mốc phí đóng kiện" :image-size="100" />
              </template>
            </el-table>
          </div>
        </el-tab-pane>

        <el-tab-pane label="Phân vùng tỉnh" name="province_zones">
          <div class="content-card table-wrapper">
            <div class="card-header-inner mb-4 flex-between">
              <h3 class="inner-title">Cấu hình tỉnh/thành theo vùng giá</h3>
              <button v-if="canEditPricing" class="btn-primary" @click="openZoneDialog(null)">
                <el-icon><Plus /></el-icon> Thêm phân vùng
              </button>
            </div>

            <el-table
              :data="provinceZones"
              v-loading="zoneLoading"
              class="modern-table"
              row-class-name="modern-row"
              style="width: 100%"
            >
              <el-table-column label="Tỉnh/thành gửi" min-width="220">
                <template #default="{ row }">
                  <span class="fw-bold">{{ getProvinceName(row.origin_province_id) }}</span>
                </template>
              </el-table-column>
              <el-table-column label="Tỉnh/thành nhận" min-width="220">
                <template #default="{ row }">
                  <span class="fw-bold">{{ getProvinceName(row.destination_province_id) }}</span>
                </template>
              </el-table-column>
              <el-table-column label="Zone áp dụng" min-width="180" align="center">
                <template #default="{ row }">
                  <span class="code-badge">{{ row.zone_name }}</span>
                </template>
              </el-table-column>
              <el-table-column v-if="canEditPricing" label="Thao tác" width="120" align="center">
                <template #default="{ row }">
                  <button class="icon-btn delete" @click="handleDeleteZone(row)" title="Xóa">
                    <el-icon><Delete /></el-icon>
                  </button>
                </template>
              </el-table-column>
              <template #empty>
                <el-empty description="Chưa có phân vùng tỉnh/thành" :image-size="100" />
              </template>
            </el-table>
          </div>
        </el-tab-pane>
      </el-tabs>

      <!-- Dialog: Route Rule -->
      <el-dialog 
        v-model="dialogVisible" 
        :title="ruleForm.rule_id ? 'Cập nhật Quy tắc Giá' : 'Thêm Quy tắc Giá mới'" 
        width="750px" 
        class="modern-dialog"
        destroy-on-close
      >
        <el-form :model="ruleForm" :rules="formRules" ref="ruleFormRef" label-position="top" class="modern-form">
          
          <div class="form-section">
            <div class="section-header">
              <el-icon><MapLocation /></el-icon>
              <span>Thiết lập Tuyến đường</span>
            </div>
            <el-form-item label="Kiểu áp dụng giá" prop="scope_type">
              <el-segmented
                v-model="ruleForm.scope_type"
                :options="[
                  { label: 'Theo zone phân vùng', value: 'ZONE' },
                  { label: 'Theo tuyến tỉnh cụ thể', value: 'PROVINCE' }
                ]"
              />
            </el-form-item>
            <el-form-item v-if="ruleForm.scope_type === 'ZONE'" label="Zone áp dụng" prop="zone_name">
              <el-select v-model="ruleForm.zone_name" filterable allow-create placeholder="Chọn hoặc nhập zone" class="w-full">
                <el-option label="Nội thành HCM" value="NOI_THANH_HCM" />
                <el-option label="Dưới 300KM" value="DUOI_300KM" />
                <el-option label="Đặc biệt HN - ĐN" value="DAC_BIET_HN_DN" />
                <el-option label="Trên 300KM" value="TREN_300KM" />
                <el-option label="HCM - Đà Nẵng" value="HCM_DN" />
                <el-option label="HCM - Hà Nội" value="HCM_HN" />
              </el-select>
            </el-form-item>
            <div v-if="ruleForm.scope_type === 'PROVINCE'" class="route-selector-container">
              <div class="route-box origin">
                <el-form-item label="Tỉnh/thành gửi" prop="from_province_id" class="mb-0">
                  <el-select v-model="ruleForm.from_province_id" filterable placeholder="Chọn tỉnh/thành gửi" class="w-full">
                    <el-option v-for="province in provinces" :key="province.id" :label="province.name" :value="province.id" />
                  </el-select>
                </el-form-item>
              </div>
              <div class="route-arrow-center">
                <el-icon><Right /></el-icon>
              </div>
              <div class="route-box dest">
                <el-form-item label="Tỉnh/thành nhận" prop="to_province_id" class="mb-0">
                  <el-select v-model="ruleForm.to_province_id" filterable placeholder="Chọn tỉnh/thành nhận" class="w-full">
                    <el-option v-for="province in provinces" :key="province.id" :label="province.name" :value="province.id" />
                  </el-select>
                </el-form-item>
              </div>
            </div>
          </div>

          <div class="form-section">
            <div class="section-header">
              <el-icon><Box /></el-icon>
              <span>Dịch vụ & Khối lượng</span>
            </div>
            
            <el-form-item label="Loại dịch vụ áp dụng" prop="service_type">
              <el-select v-model="ruleForm.service_type" placeholder="Chọn loại dịch vụ" class="w-full modern-select">
                <el-option label="Chuyển phát nhanh" value="CPN" />
                <el-option label="Tiết kiệm" value="TK" />
                <el-option label="Hỏa tốc / hàng đặc biệt" value="HT" />
              </el-select>
            </el-form-item>

            <el-row :gutter="24">
              <el-col :span="12">
                <el-form-item label="Khối lượng từ (kg)" prop="min_weight">
                  <el-input-number v-model="ruleForm.min_weight" :precision="2" :step="0.01" :min="0" class="w-full modern-input-number" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="Khối lượng đến (kg)" prop="max_weight">
                  <el-input-number v-model="ruleForm.max_weight" :precision="2" :step="0.01" :min="0.01" class="w-full modern-input-number" />
                </el-form-item>
              </el-col>
            </el-row>
          </div>

          <div class="form-section no-border">
            <div class="section-header">
              <el-icon><Money /></el-icon>
              <span>Đơn giá & Chính sách</span>
            </div>
            <el-row :gutter="24">
              <el-col :span="12">
                <el-form-item label="Kiểu tính giá" prop="pricing_method">
                  <el-select v-model="ruleForm.pricing_method" class="w-full">
                    <el-option label="Giá cố định theo mốc cân" value="FIXED" />
                    <el-option label="Giá gốc + cộng thêm theo bước cân" value="INCREMENTAL" />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="Đơn giá áp dụng (VNĐ)" prop="price">
                  <el-input-number 
                    v-model="ruleForm.price" 
                    :min="1000" 
                    :step="5000" 
                    class="w-full modern-price-input" 
                    :controls="false" 
                    :formatter="val => val ? val.toLocaleString('vi-VN') : ''" 
                    :parser="val => val.replace(/[^\d]/g, '')" 
                  />
                  <div class="price-hint" v-if="ruleForm.price">
                    Tương đương: <strong>{{ formatMoney(ruleForm.price) }} VNĐ</strong>
                  </div>
                </el-form-item>
              </el-col>
              <template v-if="ruleForm.pricing_method === 'INCREMENTAL'">
                <el-col :span="8">
                  <el-form-item label="Mốc cân gốc (kg)" prop="base_weight">
                    <el-input-number v-model="ruleForm.base_weight" :precision="2" :step="0.01" :min="0" class="w-full modern-input-number" />
                  </el-form-item>
                </el-col>
                <el-col :span="8">
                  <el-form-item label="Bước cân cộng thêm (kg)" prop="increment_weight">
                    <el-input-number v-model="ruleForm.increment_weight" :precision="2" :step="0.01" :min="0.01" class="w-full modern-input-number" />
                  </el-form-item>
                </el-col>
                <el-col :span="8">
                  <el-form-item label="Giá mỗi bước (VNĐ)" prop="increment_price">
                    <el-input-number v-model="ruleForm.increment_price" :min="0" :step="1000" class="w-full modern-price-input" :controls="false" />
                  </el-form-item>
                </el-col>
              </template>
              <el-col :span="12">
                <el-form-item label="Phụ phí xăng dầu (%)" prop="fuel_surcharge_percent">
                  <el-input-number v-model="ruleForm.fuel_surcharge_percent" :precision="2" :step="1" :min="0" class="w-full modern-input-number" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="VAT (%)" prop="vat_percent">
                  <el-input-number v-model="ruleForm.vat_percent" :precision="2" :step="1" :min="0" class="w-full modern-input-number" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="Thuộc Chính sách giá">
                  <el-select v-model="ruleForm.policy_id" class="w-full">
                    <el-option v-for="p in policies" :key="p.policy_id" :label="p.policy_name" :value="p.policy_id" />
                  </el-select>
                </el-form-item>
              </el-col>
            </el-row>
            <div v-if="!ruleForm.rule_id" class="bulk-rate-wrapper">
              <div class="bulk-rate-header">
                <div>
                  <div class="bulk-rate-title">Các mốc cước bổ sung</div>
                  <div class="bulk-rate-subtitle">Cùng zone/tuyến và dịch vụ, chỉ khác khối lượng và giá cước</div>
                </div>
                <button type="button" class="btn-secondary" @click="addExtraRateRow">
                  <el-icon><Plus /></el-icon> Thêm mốc cước
                </button>
              </div>

              <div v-for="(item, index) in extraRateRows" :key="item.id" class="bulk-rate-row">
                <div class="bulk-rate-index">#{{ index + 2 }}</div>
                <el-input-number v-model="item.min_weight" :precision="2" :step="0.01" :min="0" class="bulk-rate-input" placeholder="Từ kg" />
                <el-input-number v-model="item.max_weight" :precision="2" :step="0.01" :min="0.01" class="bulk-rate-input" placeholder="Đến kg" />
                <el-input-number
                  v-model="item.price"
                  :min="1000"
                  :step="5000"
                  class="bulk-rate-price"
                  :controls="false"
                  :formatter="val => val ? val.toLocaleString('vi-VN') : ''"
                  :parser="val => val.replace(/[^\d]/g, '')"
                  placeholder="Giá cước"
                />
                <button type="button" class="icon-btn delete" @click="removeExtraRateRow(index)" title="Xóa mốc cước">
                  <el-icon><Delete /></el-icon>
                </button>
              </div>
            </div>
            <el-form-item class="mb-0 mt-2">
              <div class="status-switch-wrapper">
                <span class="fw-bold text-dark mr-3">Trạng thái:</span>
                <el-switch 
                  v-model="ruleForm.is_active" 
                  active-text="Đang áp dụng" 
                  inactive-text="Tạm dừng" 
                  style="--el-switch-on-color: #05CD99" 
                />
              </div>
            </el-form-item>
          </div>
        </el-form>

        <template #footer>
          <div class="dialog-footer-actions">
            <button class="btn-secondary" @click="dialogVisible = false">Hủy bỏ</button>
            <button class="btn-primary" @click="handleSave" :disabled="saveLoading">
              <el-icon class="is-loading mr-2" v-if="saveLoading"><Loading /></el-icon>
              <span>{{ saveLoading ? 'Đang lưu...' : 'Xác nhận lưu' }}</span>
            </button>
          </div>
        </template>
      </el-dialog>

      <el-dialog
        v-model="packingDialogVisible"
        :title="packingForm.id ? 'Cập nhật mốc phí đóng kiện' : 'Thêm mốc phí đóng kiện'"
        width="620px"
        class="modern-dialog"
        destroy-on-close
      >
        <el-form :model="packingForm" :rules="packingRulesForm" ref="packingFormRef" label-position="top" class="modern-form">
          <div class="form-section no-border">
            <div class="section-header">
              <el-icon><Box /></el-icon>
              <span>Thiết lập phí đóng kiện</span>
            </div>
            <el-form-item label="Loại đóng kiện" prop="packing_type">
              <el-select v-model="packingForm.packing_type" class="w-full">
                <el-option label="Đóng kiện gỗ" value="WOOD" />
                <el-option label="Đóng kiện xốp" value="FOAM" />
              </el-select>
            </el-form-item>
            <el-row :gutter="16">
              <el-col :span="12">
                <el-form-item label="Khối lượng từ (kg)" prop="min_weight">
                  <el-input-number v-model="packingForm.min_weight" :precision="2" :step="1" :min="0" class="w-full modern-input-number" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="Khối lượng đến (kg)" prop="max_weight">
                  <el-input-number v-model="packingForm.max_weight" :precision="2" :step="1" :min="0.01" class="w-full modern-input-number" />
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="16">
              <el-col :span="12">
                <el-form-item label="Phí đóng kiện (VNĐ)" prop="packing_fee">
                  <el-input-number v-model="packingForm.packing_fee" :min="0" :step="10000" class="w-full modern-price-input" :controls="false" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="Trọng lượng cộng thêm (kg)" prop="added_weight">
                  <el-input-number v-model="packingForm.added_weight" :precision="2" :step="1" :min="0" class="w-full modern-input-number" />
                </el-form-item>
              </el-col>
            </el-row>
            <el-form-item class="mb-0">
              <el-switch v-model="packingForm.is_active" active-text="Đang áp dụng" inactive-text="Tạm dừng" style="--el-switch-on-color: #05CD99" />
            </el-form-item>
          </div>
        </el-form>
        <template #footer>
          <div class="dialog-footer-actions">
            <button class="btn-secondary" @click="packingDialogVisible = false">Hủy bỏ</button>
            <button class="btn-primary" @click="handleSavePacking" :disabled="packingSaveLoading">
              <el-icon class="is-loading mr-2" v-if="packingSaveLoading"><Loading /></el-icon>
              <span>{{ packingSaveLoading ? 'Đang lưu...' : 'Xác nhận lưu' }}</span>
            </button>
          </div>
        </template>
      </el-dialog>

      <el-dialog
        v-model="zoneDialogVisible"
        title="Thêm phân vùng tỉnh"
        width="620px"
        class="modern-dialog"
        destroy-on-close
      >
        <el-form :model="zoneForm" :rules="zoneRules" ref="zoneFormRef" label-position="top" class="modern-form">
          <div class="form-section no-border">
            <div class="section-header">
              <el-icon><MapLocation /></el-icon>
              <span>Thiết lập vùng giá</span>
            </div>
            <el-form-item label="Tỉnh/thành gửi" prop="origin_province_id">
              <el-select v-model="zoneForm.origin_province_id" filterable placeholder="Chọn tỉnh/thành gửi" class="w-full">
                <el-option v-for="province in provinces" :key="province.id" :label="province.name" :value="province.id" />
              </el-select>
            </el-form-item>
            <el-form-item label="Tỉnh/thành nhận" prop="destination_province_ids">
              <el-select v-model="zoneForm.destination_province_ids" multiple collapse-tags collapse-tags-tooltip filterable placeholder="Chọn một hoặc nhiều tỉnh/thành nhận" class="w-full">
                <el-option v-for="province in provinces" :key="province.id" :label="province.name" :value="province.id" />
              </el-select>
            </el-form-item>
            <el-form-item label="Zone áp dụng" prop="zone_name">
              <el-select v-model="zoneForm.zone_name" filterable allow-create placeholder="Chọn hoặc nhập zone" class="w-full">
                <el-option label="Nội thành HCM" value="NOI_THANH_HCM" />
                <el-option label="Dưới 300KM" value="DUOI_300KM" />
                <el-option label="Đặc biệt HN - ĐN" value="DAC_BIET_HN_DN" />
                <el-option label="Trên 300KM" value="TREN_300KM" />
                <el-option label="HCM - Đà Nẵng" value="HCM_DN" />
                <el-option label="HCM - Hà Nội" value="HCM_HN" />
              </el-select>
            </el-form-item>
          </div>
        </el-form>
        <template #footer>
          <div class="dialog-footer-actions">
            <button class="btn-secondary" @click="zoneDialogVisible = false">Hủy bỏ</button>
            <button class="btn-primary" @click="handleSaveZone" :disabled="zoneSaveLoading">
              <el-icon class="is-loading mr-2" v-if="zoneSaveLoading"><Loading /></el-icon>
              <span>{{ zoneSaveLoading ? 'Đang lưu...' : 'Xác nhận lưu' }}</span>
            </button>
          </div>
        </template>
      </el-dialog>

      <!-- Dialog: Pricing Policy -->
      <el-dialog
        v-model="policyDialogVisible"
        :title="policyForm.policy_id ? 'Cập nhật Bảng giá' : 'Thêm Bảng giá mới'"
        width="620px"
        class="modern-dialog"
        destroy-on-close
      >
        <el-form :model="policyForm" :rules="policyRules" ref="policyFormRef" label-position="top" class="modern-form">
          <el-row :gutter="24">
            <el-col :span="10">
              <el-form-item label="Mã bảng giá" prop="policy_code">
                <el-input v-model="policyForm.policy_code" placeholder="VD: STD_2026" class="uppercase" />
              </el-form-item>
            </el-col>
            <el-col :span="14">
              <el-form-item label="Tên bảng giá" prop="policy_name">
                <el-input v-model="policyForm.policy_name" placeholder="VD: Bảng giá Tiêu chuẩn 2026" />
              </el-form-item>
            </el-col>
          </el-row>

          <el-form-item label="Loại bảng giá" prop="policy_type">
            <el-radio-group v-model="policyForm.policy_type" class="custom-radio-group w-full">
              <el-radio-button value="GENERAL">Bảng giá chung</el-radio-button>
              <el-radio-button value="CUSTOMER">Bảng giá riêng khách hàng</el-radio-button>
            </el-radio-group>
          </el-form-item>

          <el-row :gutter="24">
            <el-col :span="12">
              <el-form-item label="Trạng thái duyệt">
                <el-switch v-model="policyForm.is_approved" active-text="Đã duyệt" inactive-text="Chưa duyệt" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="Trạng thái áp dụng">
                <el-switch v-model="policyForm.is_active" active-text="Đang áp dụng" inactive-text="Tạm dừng" />
              </el-form-item>
            </el-col>
          </el-row>
        </el-form>

        <template #footer>
          <div class="dialog-footer-actions">
            <button class="btn-secondary" @click="policyDialogVisible = false">Hủy bỏ</button>
            <button class="btn-primary" @click="handleSavePolicy" :disabled="policySaveLoading">
              <el-icon class="is-loading mr-2" v-if="policySaveLoading"><Loading /></el-icon>
              <span>Xác nhận lưu</span>
            </button>
          </div>
        </template>
      </el-dialog>

      <!-- Dialog: Extra Service -->
      <el-dialog 
        v-model="serviceDialogVisible" 
        :title="serviceForm.id ? 'Cập nhật Dịch vụ' : 'Thêm Dịch vụ mới'" 
        width="600px" 
        class="modern-dialog"
        destroy-on-close
      >
        <el-form :model="serviceForm" :rules="serviceRules" ref="serviceFormRef" label-position="top" class="modern-form">
          
          <el-row :gutter="24">
            <el-col :span="10">
              <el-form-item label="Mã hệ thống" prop="service_code">
                <el-input v-model="serviceForm.service_code" placeholder="VD: CO_CHECK" :disabled="!!serviceForm.id" class="uppercase">
                  <template #prefix><el-icon><Key /></el-icon></template>
                </el-input>
              </el-form-item>
            </el-col>
            <el-col :span="14">
              <el-form-item label="Tên hiển thị" prop="service_name">
                <el-input v-model="serviceForm.service_name" placeholder="VD: Dịch vụ Đồng kiểm" />
              </el-form-item>
            </el-col>
          </el-row>

          <el-form-item label="Cách tính phí áp dụng" prop="fee_type">
            <el-radio-group v-model="serviceForm.fee_type" class="custom-radio-group w-full">
              <el-radio-button value="FIXED">Giá Cố định (VNĐ)</el-radio-button>
              <el-radio-button value="PERCENT">Phần trăm (%)</el-radio-button>
              <el-radio-button value="PER_ITEM">Theo sản phẩm</el-radio-button>
            </el-radio-group>
          </el-form-item>

          <el-form-item label="Tính trên" prop="calculation_base">
            <el-select v-model="serviceForm.calculation_base" class="w-full">
              <el-option label="Giá cố định / theo vận đơn" value="FIXED" />
              <el-option label="Giá trị đơn hàng" value="DECLARED_VALUE" />
              <el-option label="Tiền thu hộ COD" value="COD_AMOUNT" />
              <el-option label="Cước chính" value="MAIN_FEE" />
              <el-option label="Số lượng sản phẩm" value="QUANTITY" />
            </el-select>
          </el-form-item>

          <el-form-item :label="serviceForm.fee_type === 'FIXED' ? 'Số tiền thu (VNĐ)' : 'Tỉ lệ phần trăm (%)'" prop="fee_value">
            <el-input-number 
              v-model="serviceForm.fee_value" 
              :min="0" 
              :step="serviceForm.fee_type === 'FIXED' ? 5000 : 0.5" 
              class="w-full modern-price-input" 
              :controls="false" 
              :formatter="val => val ? Number(val).toLocaleString('vi-VN') : ''" 
              :parser="val => val.replace(/[^\d.]/g, '')" 
            />
          </el-form-item>

          <el-row :gutter="16">
            <el-col :span="12">
              <el-form-item label="Giá trị từ (VNĐ)" prop="min_order_value">
                <el-input-number v-model="serviceForm.min_order_value" :min="0" :step="1000000" class="w-full modern-price-input" :controls="false" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="Giá trị đến (VNĐ)" prop="max_order_value">
                <el-input-number v-model="serviceForm.max_order_value" :min="0" :step="1000000" class="w-full modern-price-input" :controls="false" />
              </el-form-item>
            </el-col>
          </el-row>

          <el-form-item label="Phí tối thiểu (VNĐ)" prop="min_fee">
            <el-input-number v-model="serviceForm.min_fee" :min="0" :step="10000" class="w-full modern-price-input" :controls="false" />
          </el-form-item>

          <el-form-item class="mb-0">
             <div class="status-switch-wrapper">
                <span class="fw-bold text-dark mr-3">Trạng thái:</span>
                <el-switch 
                  v-model="serviceForm.is_active" 
                  active-text="Đang áp dụng" 
                  inactive-text="Tạm khóa" 
                  style="--el-switch-on-color: #05CD99" 
                />
              </div>
          </el-form-item>

        </el-form>
        <template #footer>
          <div class="dialog-footer-actions">
            <button class="btn-secondary" @click="serviceDialogVisible = false">Hủy bỏ</button>
            <button class="btn-primary" @click="handleSaveService" :disabled="serviceSaveLoading">
              <el-icon class="is-loading mr-2" v-if="serviceSaveLoading"><Loading /></el-icon>
              <span>Xác nhận lưu</span>
            </button>
          </div>
        </template>
      </el-dialog>

      <!-- Drawer: Policy Rules Details & Classification -->
      <el-drawer
        v-model="rulesDrawerVisible"
        :title="`Cấu hình Cước Tuyến - ${selectedPolicy?.policy_name || ''}`"
        size="75%"
        class="responsive-drawer"
        destroy-on-close
      >
        <template #header>
          <div class="drawer-header-custom">
            <span class="drawer-title" style="font-size: 18px; font-weight: 700; color: var(--sp-text-main);">Cấu hình Cước Tuyến</span>
            <el-tag size="small" type="info" class="uppercase ml-2" style="margin-left: 8px;">{{ selectedPolicy?.policy_code }}</el-tag>
            <div class="drawer-subtitle mt-1 text-muted" style="font-size: 13px; margin-top: 4px;">
              Phân loại phí vận chuyển theo từng loại dịch vụ của bảng giá
            </div>
          </div>
        </template>

        <div v-if="selectedPolicy" class="drawer-body-content">
          <!-- Policy Overview Mini-Card -->
          <div class="policy-mini-card" style="margin-bottom: 20px;">
            <el-descriptions :column="3" border size="small" class="responsive-descriptions">
              <el-descriptions-item label="Loại bảng giá">
                <el-tag size="small" type="primary">{{ selectedPolicy.policy_type === 'GENERAL' ? 'Bảng giá chung' : 'Bảng giá riêng' }}</el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="Phê duyệt">
                <el-tag size="small" :type="selectedPolicy.is_approved ? 'success' : 'warning'">
                  {{ selectedPolicy.is_approved ? 'Đã duyệt' : 'Chưa duyệt' }}
                </el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="Trạng thái">
                <el-tag size="small" :type="selectedPolicy.is_active ? 'success' : 'danger'">
                  {{ selectedPolicy.is_active ? 'Đang áp dụng' : 'Tạm dừng' }}
                </el-tag>
              </el-descriptions-item>
            </el-descriptions>
          </div>

          <!-- Add Rule Trigger -->
          <div class="drawer-action-bar" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; flex-wrap: wrap; gap: 12px;">
            <h4 style="margin: 0; font-size: 15px; font-weight: 700; color: var(--sp-text-main);">Quy tắc cước tuyến theo dịch vụ</h4>
            <div style="display: flex; gap: 8px; align-items: center;">
              <button class="btn-secondary" @click="exportToExcel" title="Xuất toàn bộ bảng cước ra Excel" style="display: flex; align-items: center; gap: 4px; padding: 8px 12px; border-radius: 6px; border: 1px solid var(--sp-border, #d9d9d9); background: #fff; cursor: pointer; font-weight: 600; font-size: 13px;">
                <el-icon><Download /></el-icon> Xuất Excel
              </button>
              <button v-if="canEditPricing" class="btn-secondary" @click="triggerExcelImport" title="Nhập bảng cước từ Excel" style="display: flex; align-items: center; gap: 4px; padding: 8px 12px; border-radius: 6px; border: 1px solid var(--sp-border, #d9d9d9); background: #fff; cursor: pointer; font-weight: 600; font-size: 13px;">
                <el-icon><Upload /></el-icon> Nhập Excel
              </button>
              <button v-if="canEditPricing" class="btn-primary" @click="openDialogForPolicy(selectedPolicy)">
                <el-icon><Plus /></el-icon> Thêm Tuyến Giá mới
              </button>
            </div>
          </div>
          <input type="file" ref="excelInput" style="display: none;" accept=".xlsx, .xls" @change="importFromExcel" />

          <!-- Tabs of Service Types -->
          <el-tabs v-if="selectedPolicyRules.length > 0" v-model="activeDrawerServiceTab" class="drawer-tabs">
            <el-tab-pane
              v-for="serviceType in availableServiceTypesInPolicy"
              :key="serviceType"
              :label="getServiceLabel(serviceType)"
              :name="serviceType"
            >
              <el-table
                :data="getRulesByServiceType(serviceType)"
                class="modern-table"
                style="width: 100%"
                row-class-name="modern-row"
              >
                <el-table-column label="Tuyến đường" min-width="260">
                  <template #default="{ row }">
                    <div v-if="isZoneRule(row)" class="zone-route-inline">
                      <el-icon><MapLocation /></el-icon>
                      <span>{{ row.zone_name }}</span>
                    </div>
                    <div v-else style="display: flex; align-items: center; gap: 8px;">
                      <span style="font-weight: 600;">{{ getProvinceName(row.from_province_id) }}</span>
                      <el-icon><Right /></el-icon>
                      <span style="font-weight: 600;">{{ getProvinceName(row.to_province_id) }}</span>
                    </div>
                  </template>
                </el-table-column>
                
                <el-table-column label="Khối lượng" min-width="150" align="center">
                  <template #default="{ row }">
                    <span>{{ row.min_weight }} - {{ row.max_weight }} kg</span>
                  </template>
                </el-table-column>

                <el-table-column label="Đơn giá" min-width="150" align="right">
                  <template #default="{ row }">
                    <span class="fw-bold text-dark">{{ formatMoney(row.price) }} đ</span>
                  </template>
                </el-table-column>

                <el-table-column label="Trạng thái" min-width="120" align="center">
                  <template #default="{ row }">
                    <el-switch
                      v-model="row.is_active"
                      :disabled="!canEditPricing"
                      @change="toggleRuleStatus(row)"
                      style="--el-switch-on-color: #05CD99"
                    />
                  </template>
                </el-table-column>

                <el-table-column v-if="canEditPricing" label="Thao tác" width="120" align="center">
                  <template #default="{ row }">
                    <div class="action-buttons" style="display: flex; gap: 8px; justify-content: center;">
                      <button class="icon-btn edit" @click="openDialog(row)" title="Chỉnh sửa" style="padding: 4px; border: none; background: none; cursor: pointer;">
                        <el-icon><Edit /></el-icon>
                      </button>
                      <button class="icon-btn delete" @click="handleDelete(row)" title="Xóa" style="padding: 4px; border: none; background: none; cursor: pointer; color: var(--el-color-danger, #f56c6c);">
                        <el-icon><Delete /></el-icon>
                      </button>
                    </div>
                  </template>
                </el-table-column>
              </el-table>
            </el-tab-pane>
          </el-tabs>

          <el-empty v-else description="Bảng giá này chưa cấu hình cước tuyến nào" :image-size="120">
            <button v-if="canEditPricing" class="btn-primary mt-4 mx-auto" @click="openDialogForPolicy(selectedPolicy)">
              <el-icon><Plus /></el-icon> Cấu hình quy tắc đầu tiên
            </button>
          </el-empty>
        </div>
      </el-drawer>

    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed, watch } from 'vue';
import { 
  Plus, Edit, Delete, List, Right, Refresh, RefreshRight, LocationFilled, 
  CircleCheck, ScaleToOriginal, Ticket, Setting, Lightning, Van, 
  MapLocation, Box, Money, Loading, Key, Download, Upload
} from '@element-plus/icons-vue';
import * as XLSX from 'xlsx';
import api from '@/api/axios';
import { ElMessage, ElMessageBox } from 'element-plus';
import { useAuthStore } from '@/stores/auth';

// ================= THIẾT LẬP QUYỀN (RBAC) =================
const authStore = useAuthStore();
const user = computed(() => authStore.user);

// Chỉ Admin (1) và Kế toán (5) mới có quyền Sửa/Xóa giá cước
const canEditPricing = computed(() => user.value?.role_id === 1 || user.value?.role_id === 5);

// STATE CHUNG
const activeTab = ref('policies');
const policies = ref([]);
const provinces = ref([]);
const policyLoading = ref(false);
const policySaveLoading = ref(false);
const policyDialogVisible = ref(false);
const policyFormRef = ref(null);
const provinceZones = ref([]);
const zoneLoading = ref(false);
const zoneSaveLoading = ref(false);
const zoneDialogVisible = ref(false);
const zoneFormRef = ref(null);
const packingRules = ref([]);
const packingLoading = ref(false);
const packingSaveLoading = ref(false);
const packingDialogVisible = ref(false);
const packingFormRef = ref(null);

const policyForm = reactive({
  policy_id: null,
  policy_code: '',
  policy_name: '',
  policy_type: 'CUSTOMER',
  is_approved: true,
  is_active: true
});

const policyRules = {
  policy_code: [{ required: true, message: 'Nhập mã bảng giá', trigger: 'blur' }],
  policy_name: [{ required: true, message: 'Nhập tên bảng giá', trigger: 'blur' }]
};

const zoneForm = reactive({
  origin_province_id: null,
  destination_province_ids: [],
  zone_name: ''
});

const zoneRules = {
  origin_province_id: [{ required: true, message: 'Vui lòng chọn tỉnh/thành gửi', trigger: 'change' }],
  destination_province_ids: [{ required: true, type: 'array', min: 1, message: 'Vui lòng chọn ít nhất một tỉnh/thành nhận', trigger: 'change' }],
  zone_name: [{ required: true, message: 'Vui lòng nhập zone', trigger: 'blur' }]
};

const packingForm = reactive({
  id: null,
  packing_type: 'WOOD',
  min_weight: 0,
  max_weight: 5,
  packing_fee: 30000,
  added_weight: 6,
  is_active: true
});

const packingRulesForm = {
  packing_type: [{ required: true, message: 'Vui lòng chọn loại đóng kiện', trigger: 'change' }],
  packing_fee: [{ required: true, type: 'number', min: 0, message: 'Vui lòng nhập phí đóng kiện', trigger: 'blur' }],
  added_weight: [{ required: true, type: 'number', min: 0, message: 'Vui lòng nhập trọng lượng cộng thêm', trigger: 'blur' }]
};

const getServiceLabel = (type) => {
  const map = {
    'CPN': 'Chuyển phát nhanh trong nước',
    'TK': 'Chuyển phát tiết kiệm',
    'HT': 'Hỏa tốc / hàng đặc biệt'
  };
  return map[type] || type;
};

const getServiceTagClass = (type) => {
  if (type === 'HT') return 'tag-warning';
  if (type === 'CPN') return 'tag-primary';
  return 'tag-info';
};

const getPolicyTypeName = (type) => {
  const map = {
    'CUSTOMER': 'Khách hàng',
    'SYSTEM': 'Hệ thống',
    'PARTNER': 'Đối tác',
    'INTERNAL': 'Nội bộ'
  };
  return map[type] || type;
};

// ================= STATE CHO CƯỚC CHÍNH =================
const loading = ref(false);
const saveLoading = ref(false);
const dialogVisible = ref(false);
const ruleFormRef = ref(null);
const rules = ref([]);
const extraRateRows = ref([]);
const filterProvinceId = ref(null);
const filter = reactive({ service_type: '' });

const ruleForm = reactive({
  rule_id: null, policy_id: 1, scope_type: 'ZONE', from_province_id: null, to_province_id: null, zone_name: null,
  service_type: 'CPN', min_weight: 0, max_weight: 0.5, price: 30000,
  pricing_method: 'FIXED', base_weight: null, increment_weight: null, increment_price: null,
  fuel_surcharge_percent: 10, vat_percent: 8, is_active: true
});

const formRules = {
  zone_name: [{ required: true, message: 'Vui lòng chọn hoặc nhập zone', trigger: 'change' }],
  pricing_method: [{ required: true, message: 'Vui lòng chọn kiểu tính giá', trigger: 'change' }],
  price: [{ required: true, type: 'number', min: 1000, message: 'Đơn giá tối thiểu 1,000đ', trigger: 'blur' }]
};

// ================= STATE CHO DỊCH VỤ TIỆN ÍCH =================
const services = ref([]);
const serviceLoading = ref(false);
const serviceSaveLoading = ref(false);
const serviceDialogVisible = ref(false);
const serviceFormRef = ref(null);

const serviceForm = reactive({
  id: null, service_code: '', service_name: '', fee_type: 'FIXED', fee_value: 0,
  calculation_base: 'FIXED', min_order_value: null, max_order_value: null, min_fee: null,
  is_active: true
});

const serviceRules = {
  service_code: [{ required: true, message: 'Nhập mã dịch vụ', trigger: 'blur' }],
  service_name: [{ required: true, message: 'Nhập tên dịch vụ', trigger: 'blur' }],
  fee_value: [{ required: true, message: 'Nhập mức phí', trigger: 'blur' }]
};

// ================= COMPUTED & UTILS =================
const activeCount = computed(() => rules.value.filter(r => r.is_active).length);
const expressCount = computed(() => rules.value.filter(r => r.service_type === 'HT').length);

const filteredRules = computed(() => {
  return rules.value.filter(r => {
    const matchService = !filter.service_type || r.service_type === filter.service_type;
    const matchProvince = !filterProvinceId.value || r.from_province_id === filterProvinceId.value || r.to_province_id === filterProvinceId.value;
    return matchService && matchProvince;
  });
});

// Pagination for main rules list
const currentRulesPage = ref(1);
const rulesPageSize = ref(10);

const paginatedRules = computed(() => {
  const start = (currentRulesPage.value - 1) * rulesPageSize.value;
  const end = start + rulesPageSize.value;
  return filteredRules.value.slice(start, end);
});

watch([filter, () => filterProvinceId.value], () => {
  currentRulesPage.value = 1;
}, { deep: true });

// Rules Drawer details and service classification
const rulesDrawerVisible = ref(false);
const selectedPolicy = ref(null);
const activeDrawerServiceTab = ref('');

const selectedPolicyRules = computed(() => {
  if (!selectedPolicy.value) return [];
  return rules.value.filter(r => r.policy_id === selectedPolicy.value.policy_id);
});

const availableServiceTypesInPolicy = computed(() => {
  const types = new Set(selectedPolicyRules.value.map(r => r.service_type));
  return Array.from(types);
});

const getRulesByServiceType = (serviceType) => {
  return selectedPolicyRules.value.filter(r => r.service_type === serviceType);
};

const viewPolicyRules = (policy) => {
  selectedPolicy.value = policy;
  rulesDrawerVisible.value = true;
  const types = availableServiceTypesInPolicy.value;
  if (types.length > 0) {
    activeDrawerServiceTab.value = types[0];
  } else {
    activeDrawerServiceTab.value = '';
  }
};

const toggleRuleStatus = async (row) => {
  try {
    await api.put(`/api/pricing/rules/${row.rule_id}`, row);
    ElMessage.success('Cập nhật trạng thái quy tắc thành công');
  } catch (err) {
    row.is_active = !row.is_active;
    ElMessage.error('Không thể cập nhật trạng thái');
  }
};

const openDialogForPolicy = (policy) => {
  extraRateRows.value = [];
  Object.assign(ruleForm, { 
    rule_id: null, 
    policy_id: policy.policy_id, 
    scope_type: 'ZONE',
    from_province_id: null, 
    to_province_id: null, 
    zone_name: null,
    service_type: 'CPN', 
    min_weight: 0, 
    max_weight: 0.5, 
    price: 30000, 
    pricing_method: 'FIXED',
    base_weight: null,
    increment_weight: null,
    increment_price: null,
    fuel_surcharge_percent: 10,
    vat_percent: 8,
    is_active: true 
  });
  dialogVisible.value = true;
};

const formatMoney = (val) => {
  if (!val && val !== 0) return '0';
  return Number(val).toLocaleString('vi-VN');
};

const getPolicyName = (policyId) => {
  const policy = policies.value.find(p => p.policy_id === policyId);
  return policy ? policy.policy_code : `#${policyId}`;
};

const getProvinceName = (provinceId) => {
  const province = provinces.value.find(p => p.id === Number(provinceId));
  return province ? province.name : `Tỉnh #${provinceId || '---'}`;
};

const isZoneRule = (row) => Boolean(row?.zone_name);

const getZoneSummary = (zoneName) => {
  if (!zoneName) return 'Chưa có thông tin zone';

  const matches = provinceZones.value.filter(zone => zone.zone_name === zoneName);
  if (!matches.length) return 'Quy tắc giá theo zone';

  const originNames = [...new Set(matches.map(zone => getProvinceName(zone.origin_province_id)))];
  const destinationCount = new Set(matches.map(zone => zone.destination_province_id)).size;
  const originLabel = originNames.length === 1 ? originNames[0] : `${originNames.length} tỉnh gửi`;

  return `${originLabel} -> ${destinationCount} tỉnh nhận`;
};

const getPackingTypeLabel = (type) => {
  const map = {
    WOOD: 'Đóng kiện gỗ',
    FOAM: 'Đóng kiện xốp'
  };
  return map[type] || type;
};

const getServiceFeeTypeLabel = (type) => {
  const map = {
    FIXED: 'Giá cố định',
    PERCENT: 'Phần trăm',
    PER_ITEM: 'Theo sản phẩm'
  };
  return map[type] || type;
};

const getCalculationBaseLabel = (base) => {
  const map = {
    FIXED: 'Theo vận đơn',
    DECLARED_VALUE: 'Giá trị đơn hàng',
    COD_AMOUNT: 'Tiền thu hộ COD',
    MAIN_FEE: 'Cước chính',
    QUANTITY: 'Số lượng sản phẩm'
  };
  return map[base] || base || 'Theo vận đơn';
};

const refreshAll = () => {
  fetchData();
  fetchPolicies();
  fetchServices();
  fetchProvinceZones();
  fetchPackingRules();
};

// ================= HÀM CHO CƯỚC CHÍNH =================
const fetchData = async () => {
  loading.value = true;
  try {
    const res = await api.get('/api/pricing/rules');
    rules.value = res.data || [];
  } catch (err) {
    ElMessage.error('Lỗi khi tải bảng giá');
  } finally {
    loading.value = false;
  }
};

const resetFilters = () => { filter.service_type = ''; filterProvinceId.value = null; };

const createExtraRateRow = () => ({
  id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  min_weight: 0,
  max_weight: 0.5,
  price: 30000
});

const addExtraRateRow = () => {
  const last = extraRateRows.value[extraRateRows.value.length - 1] || ruleForm;
  const minWeight = Number(last.max_weight || 0);
  extraRateRows.value.push({
    ...createExtraRateRow(),
    min_weight: minWeight,
    max_weight: Number((minWeight + 0.5).toFixed(2)),
    price: Number(last.price || ruleForm.price || 30000)
  });
};

const removeExtraRateRow = (index) => {
  extraRateRows.value.splice(index, 1);
};

const openDialog = (row) => {
  extraRateRows.value = [];
  if (row) Object.assign(ruleForm, { ...row, scope_type: row.zone_name ? 'ZONE' : 'PROVINCE' });
  else Object.assign(ruleForm, { rule_id: null, policy_id: policies.value[0]?.policy_id || 1, scope_type: 'ZONE', from_province_id: null, to_province_id: null, zone_name: null, service_type: 'CPN', min_weight: 0, max_weight: 0.5, price: 30000, pricing_method: 'FIXED', base_weight: null, increment_weight: null, increment_price: null, fuel_surcharge_percent: 10, vat_percent: 8, is_active: true });
  dialogVisible.value = true;
};

const fetchProvinceZones = async () => {
  zoneLoading.value = true;
  try {
    const res = await api.get('/api/pricing/zones');
    provinceZones.value = res.data || [];
  } catch (err) {
    ElMessage.error('Không tải được danh sách phân vùng tỉnh');
  } finally {
    zoneLoading.value = false;
  }
};

const fetchPackingRules = async () => {
  packingLoading.value = true;
  try {
    const res = await api.get('/api/pricing/packing-rules');
    packingRules.value = res.data || [];
  } catch (err) {
    ElMessage.error('Không tải được danh sách phí đóng kiện');
  } finally {
    packingLoading.value = false;
  }
};

const openPackingDialog = (row) => {
  if (row) Object.assign(packingForm, row);
  else Object.assign(packingForm, {
    id: null,
    packing_type: 'WOOD',
    min_weight: 0,
    max_weight: 5,
    packing_fee: 30000,
    added_weight: 6,
    is_active: true
  });
  packingDialogVisible.value = true;
};

const handleSavePacking = async () => {
  if (!packingFormRef.value) return;
  await packingFormRef.value.validate(async (valid) => {
    if (!valid) return;
    if (packingForm.min_weight >= packingForm.max_weight) {
      ElMessage.error('Khối lượng tối thiểu phải nhỏ hơn tối đa');
      return;
    }
    packingSaveLoading.value = true;
    try {
      if (packingForm.id) {
        await api.put(`/api/pricing/packing-rules/${packingForm.id}`, packingForm);
        ElMessage.success('Đã cập nhật mốc phí đóng kiện');
      } else {
        await api.post('/api/pricing/packing-rules', packingForm);
        ElMessage.success('Đã thêm mốc phí đóng kiện');
      }
      packingDialogVisible.value = false;
      fetchPackingRules();
    } catch (err) {
      ElMessage.error(err.response?.data?.detail || 'Không thể lưu phí đóng kiện');
    } finally {
      packingSaveLoading.value = false;
    }
  });
};

const togglePackingStatus = async (row) => {
  try {
    await api.put(`/api/pricing/packing-rules/${row.id}`, row);
    ElMessage.success('Đã cập nhật trạng thái phí đóng kiện');
  } catch (err) {
    row.is_active = !row.is_active;
    ElMessage.error('Không thể cập nhật trạng thái phí đóng kiện');
  }
};

const handleDeletePacking = (row) => {
  ElMessageBox.confirm(
    `Bạn có chắc chắn muốn xóa mốc phí <strong>${getPackingTypeLabel(row.packing_type)} ${row.min_weight}-${row.max_weight}kg</strong>?`,
    'Xác nhận xóa',
    {
      confirmButtonText: 'Xóa mốc phí',
      cancelButtonText: 'Hủy bỏ',
      type: 'warning',
      dangerouslyUseHTMLString: true,
      customClass: 'modern-message-box'
    }
  ).then(async () => {
    try {
      await api.delete(`/api/pricing/packing-rules/${row.id}`);
      ElMessage.success('Đã xóa mốc phí đóng kiện');
      fetchPackingRules();
    } catch (err) {
      ElMessage.error('Không thể xóa mốc phí đóng kiện');
    }
  }).catch(() => {});
};

const openZoneDialog = () => {
  Object.assign(zoneForm, {
    origin_province_id: null,
    destination_province_ids: [],
    zone_name: ''
  });
  zoneDialogVisible.value = true;
};

const handleSaveZone = async () => {
  if (!zoneFormRef.value) return;
  await zoneFormRef.value.validate(async (valid) => {
    if (!valid) return;
    zoneSaveLoading.value = true;
    try {
      const requests = zoneForm.destination_province_ids.map((provinceId) => api.post('/api/pricing/zones', {
        origin_province_id: zoneForm.origin_province_id,
        destination_province_id: provinceId,
        zone_name: zoneForm.zone_name
      }));
      const results = await Promise.allSettled(requests);
      const successCount = results.filter(r => r.status === 'fulfilled').length;
      const failedCount = results.length - successCount;
      if (successCount > 0) {
        ElMessage.success(`Đã thêm ${successCount} phân vùng tỉnh`);
      }
      if (failedCount > 0) {
        ElMessage.warning(`${failedCount} phân vùng chưa lưu được, vui lòng kiểm tra trùng lặp hoặc dữ liệu nhập`);
      }
      zoneDialogVisible.value = false;
      fetchProvinceZones();
    } catch (err) {
      ElMessage.error(err.response?.data?.detail || 'Không thể lưu phân vùng tỉnh');
    } finally {
      zoneSaveLoading.value = false;
    }
  });
};

const handleDeleteZone = (row) => {
  const routeLabel = `${getProvinceName(row.origin_province_id)} → ${getProvinceName(row.destination_province_id)}`;
  ElMessageBox.confirm(
    `Bạn có chắc chắn muốn xóa phân vùng <strong>${routeLabel}</strong>?`,
    'Xác nhận xóa',
    {
      confirmButtonText: 'Xóa phân vùng',
      cancelButtonText: 'Hủy bỏ',
      type: 'warning',
      dangerouslyUseHTMLString: true,
      customClass: 'modern-message-box'
    }
  ).then(async () => {
    try {
      await api.delete(`/api/pricing/zones/${row.id}`);
      ElMessage.success('Đã xóa phân vùng tỉnh');
      fetchProvinceZones();
    } catch (err) {
      ElMessage.error('Không thể xóa phân vùng tỉnh');
    }
  }).catch(() => {});
};

const handleSave = async () => {
  if (!ruleFormRef.value) return;
  await ruleFormRef.value.validate(async (valid) => {
    if (valid) {
      saveLoading.value = true;
      try {
        if (ruleForm.scope_type === 'PROVINCE' && (!ruleForm.from_province_id || !ruleForm.to_province_id)) {
          ElMessage.error('Vui lòng chọn tỉnh/thành gửi và tỉnh/thành nhận');
          saveLoading.value = false;
          return;
        }
        const payload = { ...ruleForm };
        delete payload.scope_type;
        if (ruleForm.scope_type === 'ZONE') {
          payload.from_province_id = null;
          payload.to_province_id = null;
        } else {
          payload.zone_name = null;
        }
        if (ruleForm.rule_id) {
          await api.put(`/api/pricing/rules/${ruleForm.rule_id}`, payload);
          ElMessage.success('Cập nhật quy tắc giá thành công!');
        } else {
          const rateRows = [
            { min_weight: ruleForm.min_weight, max_weight: ruleForm.max_weight, price: ruleForm.price },
            ...extraRateRows.value
          ];
          const invalidRowIndex = rateRows.findIndex(row => Number(row.min_weight) >= Number(row.max_weight) || Number(row.price) < 1000);
          if (invalidRowIndex >= 0) {
            ElMessage.error(`Mốc cước #${invalidRowIndex + 1} chưa hợp lệ. Kiểm tra khối lượng và giá cước.`);
            saveLoading.value = false;
            return;
          }

          const requests = rateRows.map(row => {
            const rowPayload = {
              ...payload,
              min_weight: Number(row.min_weight),
              max_weight: Number(row.max_weight),
              price: Number(row.price)
            };
            delete rowPayload.id;
            return api.post('/api/pricing/rules', rowPayload);
          });
          const results = await Promise.allSettled(requests);
          const successCount = results.filter(r => r.status === 'fulfilled').length;
          const failedCount = results.length - successCount;
          if (successCount > 0) ElMessage.success(`Đã thêm ${successCount} mốc cước`);
          if (failedCount > 0) ElMessage.warning(`${failedCount} mốc cước chưa lưu được, vui lòng kiểm tra trùng lặp`);
          if (successCount === 0) {
            saveLoading.value = false;
            return;
          }
          ElMessage.success('Thêm quy tắc giá mới thành công!');
        }
        dialogVisible.value = false;
        fetchData();
      } catch (err) {
        ElMessage.error(err.response?.data?.detail || 'Lỗi khi lưu quy tắc giá.');
      } finally {
        saveLoading.value = false;
      }
    }
  });
};

const handleDelete = (row) => {
  const routeLabel = `${getProvinceName(row.from_province_id)} → ${getProvinceName(row.to_province_id)}`;
  ElMessageBox.confirm(
    `Bạn có chắc chắn muốn xóa quy tắc giá cho tuyến <strong>${routeLabel}</strong>?`, 
    'Xác nhận xóa', 
    { 
      confirmButtonText: 'Xóa quy tắc', 
      cancelButtonText: 'Hủy bỏ', 
      type: 'error',
      dangerouslyUseHTMLString: true,
      customClass: 'modern-message-box'
    }
  ).then(async () => {
      try {
        await api.delete(`/api/pricing/rules/${row.rule_id}`);
        ElMessage.success('Đã xóa quy tắc.');
        fetchData();
      } catch (err) {
        ElMessage.error('Không thể xóa.');
      }
    }).catch(() => {});
};

// ================= HÀM CHO DỊCH VỤ TIỆN ÍCH =================
const fetchServices = async () => {
  serviceLoading.value = true;
  try {
    const res = await api.get('/api/pricing/extra-services');
    services.value = res.data || [];
  } catch (err) {
    ElMessage.error('Lỗi khi tải danh sách dịch vụ');
  } finally {
    serviceLoading.value = false;
  }
};

const openServiceDialog = (row) => {
  if (row) Object.assign(serviceForm, row);
  else Object.assign(serviceForm, {
    id: null,
    service_code: '',
    service_name: '',
    fee_type: 'FIXED',
    fee_value: 0,
    calculation_base: 'FIXED',
    min_order_value: null,
    max_order_value: null,
    min_fee: null,
    is_active: true
  });
  serviceDialogVisible.value = true;
};

const handleSaveService = async () => {
  if (!serviceFormRef.value) return;
  await serviceFormRef.value.validate(async (valid) => {
    if (valid) {
      serviceSaveLoading.value = true;
      try {
        if (
          serviceForm.min_order_value !== null &&
          serviceForm.max_order_value !== null &&
          serviceForm.min_order_value >= serviceForm.max_order_value
        ) {
          ElMessage.error('Giá trị từ phải nhỏ hơn giá trị đến');
          serviceSaveLoading.value = false;
          return;
        }
        if (serviceForm.id) {
          await api.put(`/api/pricing/extra-services/${serviceForm.id}`, serviceForm);
          ElMessage.success('Cập nhật dịch vụ thành công!');
        } else {
          await api.post('/api/pricing/extra-services', serviceForm);
          ElMessage.success('Thêm dịch vụ thành công!');
        }
        serviceDialogVisible.value = false;
        fetchServices();
      } catch (err) {
        ElMessage.error(err.response?.data?.detail || 'Lỗi lưu dữ liệu.');
      } finally {
        serviceSaveLoading.value = false;
      }
    }
  });
};

const toggleServiceStatus = async (row) => {
  try {
    await api.put(`/api/pricing/extra-services/${row.id}`, { ...row });
    ElMessage.success('Đã cập nhật trạng thái');
  } catch (err) {
    row.is_active = !row.is_active; 
    ElMessage.error('Lỗi khi cập nhật trạng thái');
  }
};

// ================= INIT =================
const fetchPolicies = async () => {
  policyLoading.value = true;
  try {
    const res = await api.get('/api/pricing/policies', { params: { active_only: false } });
    policies.value = Array.isArray(res.data) ? res.data : (res.data.items || res.data.data || []);
    if (!policies.value.length) {
      policies.value = [{ policy_id: 1, policy_code: 'DEFAULT', policy_name: 'Bảng giá Tiêu chuẩn 2026' }];
    }
  } catch (err) {
    policies.value = [{ policy_id: 1, policy_code: 'DEFAULT', policy_name: 'Bảng giá Tiêu chuẩn 2026' }];
  } finally {
    policyLoading.value = false;
  }
};

const openPolicyDialog = (row) => {
  if (row) {
    Object.assign(policyForm, {
      policy_id: row.policy_id,
      policy_code: row.policy_code,
      policy_name: row.policy_name,
      policy_type: row.policy_type || 'CUSTOMER',
      is_approved: !!row.is_approved,
      is_active: row.is_active !== false
    });
  } else {
    Object.assign(policyForm, {
      policy_id: null,
      policy_code: '',
      policy_name: '',
      policy_type: 'CUSTOMER',
      is_approved: true,
      is_active: true
    });
  }
  policyDialogVisible.value = true;
};

const handleSavePolicy = async () => {
  if (!policyFormRef.value) return;
  await policyFormRef.value.validate(async (valid) => {
    if (!valid) return;

    policySaveLoading.value = true;
    try {
      const payload = {
        policy_code: policyForm.policy_code,
        policy_name: policyForm.policy_name,
        policy_type: policyForm.policy_type,
        is_approved: policyForm.is_approved,
        is_active: policyForm.is_active
      };

      if (policyForm.policy_id) {
        await api.put(`/api/pricing/policies/${policyForm.policy_id}`, payload);
        ElMessage.success('Cập nhật bảng giá thành công!');
      } else {
        await api.post('/api/pricing/policies', payload);
        ElMessage.success('Thêm bảng giá thành công!');
      }

      policyDialogVisible.value = false;
      fetchPolicies();
    } catch (err) {
      ElMessage.error(err.response?.data?.detail || 'Lỗi khi lưu bảng giá.');
    } finally {
      policySaveLoading.value = false;
    }
  });
};

const normalizeProvince = (item) => ({
  id: Number(item.Id || item.id || item.code),
  name: item.Name || item.name
});

const fetchProvinces = async () => {
  try {
    const res = await fetch('/vietnam-address.json');
    const data = await res.json();
    provinces.value = (data || []).map(normalizeProvince).filter(p => p.id && p.name);
  } catch (localErr) {
    try {
      const res = await fetch('https://provinces.open-api.vn/api/?depth=1');
      const data = await res.json();
      provinces.value = (data || []).map(normalizeProvince).filter(p => p.id && p.name);
    } catch (err) {
      ElMessage.error('Không tải được danh sách tỉnh/thành');
    }
  }
};

const excelInput = ref(null);

const triggerExcelImport = () => {
  if (excelInput.value) {
    excelInput.value.value = '';
    excelInput.value.click();
  }
};

const exportToExcel = () => {
  if (!selectedPolicyRules.value || selectedPolicyRules.value.length === 0) {
    ElMessage.warning('Không có dữ liệu cước tuyến nào để xuất!');
    return;
  }

  const rows = selectedPolicyRules.value.map(rule => ({
    'Mã quy tắc (Không sửa)': rule.rule_id || '',
    'Tỉnh đi': getProvinceName(rule.from_province_id) || '',
    'Tỉnh nhận': getProvinceName(rule.to_province_id) || '',
    'Phân vùng (Zone)': rule.zone_name || '',
    'Dịch vụ (CPN/TK/HT)': rule.service_type || 'CPN',
    'Khối lượng từ (kg)': rule.min_weight !== null ? Number(rule.min_weight) : 0,
    'Khối lượng đến (kg)': rule.max_weight !== null ? Number(rule.max_weight) : 0,
    'Đơn giá (VNĐ)': rule.price !== null ? Number(rule.price) : 0,
    'Kiểu tính giá (FIXED/INCREMENTAL)': rule.pricing_method || 'FIXED',
    'Mốc cân gốc (kg)': rule.base_weight !== null ? Number(rule.base_weight) : '',
    'Khối lượng cộng thêm (kg)': rule.increment_weight !== null ? Number(rule.increment_weight) : '',
    'Giá cộng thêm (VNĐ)': rule.increment_price !== null ? Number(rule.increment_price) : '',
    'Phụ phí xăng dầu (%)': rule.fuel_surcharge_percent !== null ? Number(rule.fuel_surcharge_percent) : 10,
    'VAT (%)': rule.vat_percent !== null ? Number(rule.vat_percent) : 8,
    'Trạng thái (Áp dụng/Tạm dừng)': rule.is_active ? 'Áp dụng' : 'Tạm dừng'
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Quy tắc cước');
  
  const filename = `Bang_cuoc_${selectedPolicy.value.policy_code || 'Policy'}_${Date.now()}.xlsx`;
  XLSX.writeFile(workbook, filename);
  ElMessage.success('Xuất file Excel thành công!');
};

const findProvinceIdByName = (name) => {
  if (!name) return null;
  const cleanName = name.toString().toLowerCase()
    .normalize('NFC').trim()
    .replace(/^(tỉnh|thành phố|tp\.|tp)\s+/i, '')
    .trim();
  
  const found = provinces.value.find(p => {
    const cleanPName = p.name.toLowerCase()
      .normalize('NFC').trim()
      .replace(/^(tỉnh|thành phố|tp\.|tp)\s+/i, '')
      .trim();
    return cleanPName === cleanName || cleanPName.includes(cleanName) || cleanName.includes(cleanPName);
  });
  return found ? found.id : null;
};

const importFromExcel = async (event) => {
  const file = event.target.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = async (e) => {
    try {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      if (jsonData.length === 0) {
        ElMessage.warning('File Excel trống hoặc không đúng định dạng!');
        return;
      }

      ElMessage.info(`Đang xử lý ${jsonData.length} quy tắc cước từ Excel...`);
      loading.value = true;

      const promises = jsonData.map(async (row, idx) => {
        const ruleId = row['Mã quy tắc (Không sửa)'];
        const fromProvinceId = findProvinceIdByName(row['Tỉnh đi']);
        const toProvinceId = findProvinceIdByName(row['Tỉnh nhận']);
        const zoneName = row['Phân vùng (Zone)'] || null;

        if (!zoneName && (!fromProvinceId || !toProvinceId)) {
          throw new Error(`Dòng #${idx + 2}: Thiếu tuyến đường (Tỉnh gửi, nhận hoặc Phân vùng không hợp lệ).`);
        }

        const payload = {
          policy_id: selectedPolicy.value.policy_id,
          from_province_id: fromProvinceId,
          to_province_id: toProvinceId,
          zone_name: zoneName,
          service_type: row['Dịch vụ (CPN/TK/HT)'] || 'CPN',
          min_weight: Number(row['Khối lượng từ (kg)'] || 0),
          max_weight: Number(row['Khối lượng đến (kg)'] || 0),
          price: Number(row['Đơn giá (VNĐ)'] || 0),
          pricing_method: row['Kiểu tính giá (FIXED/INCREMENTAL)'] || 'FIXED',
          base_weight: row['Mốc cân gốc (kg)'] !== undefined && row['Mốc cân gốc (kg)'] !== '' ? Number(row['Mốc cân gốc (kg)']) : null,
          increment_weight: row['Khối lượng cộng thêm (kg)'] !== undefined && row['Khối lượng cộng thêm (kg)'] !== '' ? Number(row['Khối lượng cộng thêm (kg)']) : null,
          increment_price: row['Giá cộng thêm (VNĐ)'] !== undefined && row['Giá cộng thêm (VNĐ)'] !== '' ? Number(row['Giá cộng thêm (VNĐ)']) : null,
          fuel_surcharge_percent: Number(row['Phụ phí xăng dầu (%)'] !== undefined ? row['Phụ phí xăng dầu (%)'] : 10),
          vat_percent: Number(row['VAT (%)'] !== undefined ? row['VAT (%)'] : 8),
          is_active: row['Trạng thái (Áp dụng/Tạm dừng)'] === 'Tạm dừng' ? false : true
        };

        if (ruleId) {
          return api.put(`/api/pricing/rules/${ruleId}`, payload);
        } else {
          return api.post('/api/pricing/rules', payload);
        }
      });

      const results = await Promise.allSettled(promises);
      const succeeded = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected');

      if (succeeded > 0) {
        ElMessage.success(`Nhập Excel thành công: Đã xử lý ${succeeded}/${jsonData.length} dòng.`);
      }
      if (failed.length > 0) {
        console.error('Lỗi khi nhập một số dòng:', failed);
        ElMessage.error(`${failed.length} dòng gặp lỗi khi lưu. Chi tiết: ${failed[0].reason?.response?.data?.detail || failed[0].reason?.message || 'Lỗi trùng lặp hoặc sai cấu hình'}`);
      }

      await fetchData();
    } catch (err) {
      console.error(err);
      ElMessage.error(`Lỗi đọc file Excel: ${err.message}`);
    } finally {
      loading.value = false;
    }
  };
  reader.readAsArrayBuffer(file);
};

onMounted(() => {
  fetchData();
  fetchServices(); 
  fetchPolicies();
  fetchProvinceZones();
  fetchPackingRules();
  fetchProvinces();
});
</script>

<style scoped>
@import '@/styles/admin/accounting/PricingRules.css';
</style>

<style>
/* Global CSS overrrides for teleported Element Plus components on Mobile */
@media (max-width: 768px) {
  .responsive-drawer {
    width: 100% !important;
  }
  
  .responsive-descriptions .el-descriptions__body table tbody tr {
    display: flex;
    flex-direction: column;
  }
  .responsive-descriptions .el-descriptions__body table tbody tr td {
    display: flex;
    justify-content: space-between;
    width: 100%;
    border-bottom: 1px solid var(--sp-border);
  }
  
  .drawer-action-bar {
    flex-direction: column !important;
    align-items: flex-start !important;
    gap: 12px;
  }
  .drawer-action-bar button {
    width: 100%;
    justify-content: center;
  }
}
</style>
