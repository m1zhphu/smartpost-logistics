<template>
  <div class="modern-customer-management">
    <div class="page-container">
      
      <!-- Header Section -->
      <header class="page-header animate-fade-in">
        <div class="header-content">
          <div class="title-wrapper">
            <div class="icon-box primary">
              <el-icon><Shop /></el-icon>
            </div>
            <div>
              <h2 class="page-title">Quản lý Khách hàng</h2>
              <p class="page-subtitle">Danh sách các đối tác, công ty và shop gửi hàng</p>
            </div>
          </div>
        </div>
        <div class="header-actions">
          <button class="btn-primary" @click="openDialog(null)">
            <el-icon><Plus /></el-icon>
            <span>Thêm Khách hàng</span>
          </button>
        </div>
      </header>

      <el-tabs v-model="activeTab" class="customer-tabs" @tab-change="handleTabChange">
        <el-tab-pane label="Danh sách khách hàng" name="all" />
        <el-tab-pane v-if="canManageAssignment" label="Khách chưa gán CSKH" name="unassigned" />
        <el-tab-pane label="Ngừng hợp tác" name="inactive" />
      </el-tabs>

      <!-- Search & Filter Section -->
      <div v-show="activeTab === 'all'" class="content-card filter-card animate-fade-in mb-24">
        <div class="search-wrapper">
          <el-alert
            v-if="isMineView"
            title="Đang hiển thị danh sách khách hàng do bạn phụ trách"
            type="success"
            :closable="false"
            class="mb-12"
          />
          <el-input
            v-model="searchQuery"
            placeholder="Tìm theo tên shop, SĐT hoặc mã khách hàng..."
            class="modern-input search-input"
            clearable
            @clear="fetchData"
            @keyup.enter="fetchData"
          >
            <template #prefix><el-icon><Search /></el-icon></template>
            <template #append>
              <el-button @click="fetchData" class="search-btn">Tìm kiếm</el-button>
            </template>
          </el-input>
          <el-select
            v-if="!isMineView"
            v-model="staffFilterId"
            placeholder="Lọc theo nhân viên quản lý"
            clearable
            filterable
            class="modern-select mt-12"
            @change="fetchData"
            @clear="fetchData"
          >
            <el-option
              v-for="staff in staffOptions"
              :key="staff.user_id"
              :label="staff.full_name ? `${staff.full_name} (${staff.username})` : staff.username"
              :value="staff.user_id"
            />
          </el-select>
        </div>
      </div>

      <!-- Main Table Card -->
      <div v-show="activeTab === 'all'" class="content-card table-wrapper animate-fade-in-up">
        <el-table 
          :data="customers" 
          v-loading="loading" 
          class="modern-table"
          row-class-name="modern-row"
          style="width: 100%"
        >
          <!-- Mã KH -->
          <el-table-column prop="customer_code" label="Mã KH" width="120" fixed="left">
            <template #default="{ row }">
              <span class="code-badge">{{ row.customer_code }}</span>
            </template>
          </el-table-column>

          <!-- Tên Shop / Công ty -->
          <el-table-column label="Thông tin Khách hàng" min-width="260">
            <template #default="{ row }">
              <div class="customer-profile">
                <div class="avatar-icon" :class="row.customer_type === 'COMPANY' ? 'bg-primary' : 'bg-success'">
                  <el-icon v-if="row.customer_type === 'COMPANY'"><OfficeBuilding /></el-icon>
                  <el-icon v-else><Shop /></el-icon>
                </div>
                <div class="customer-details">
                  <div class="name-row">
                    <span class="fw-bold text-dark">{{ row.transaction_name || row.company_name || row.customer_code }}</span>
                    <el-tag :type="row.customer_type === 'COMPANY' ? 'primary' : 'success'" size="small" class="type-tag" effect="plain">
                      {{ row.customer_type === 'COMPANY' ? 'Doanh nghiệp' : 'Cá nhân' }}
                    </el-tag>
                  </div>
                  <span class="text-xs text-muted" v-if="row.company_name && row.transaction_name">
                    <el-icon class="mr-1"><Briefcase /></el-icon>{{ row.company_name }}
                  </span>
                </div>
              </div>
            </template>
          </el-table-column>

          <!-- Người đại diện -->
          <el-table-column label="Người đại diện" min-width="160">
            <template #default="{ row }">
              <span class="text-dark fw-500">
                <el-icon class="mr-1 text-muted"><User /></el-icon>
                {{ row.representative_name || '—' }}
              </span>
            </template>
          </el-table-column>

          <el-table-column label="Nhân viên quản lý" min-width="180">
            <template #default="{ row }">
              <span class="text-dark fw-500">
                <el-icon class="mr-1 text-muted"><UserFilled /></el-icon>
                {{ row.staff_in_charge_name || '—' }}
              </span>
            </template>
          </el-table-column>

          <el-table-column label="Tên đăng nhập" min-width="170">
            <template #default="{ row }">
              <span class="username-badge">@{{ row.account_username || row.username || 'Chưa tạo' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="Bảng giá áp dụng" min-width="190">
            <template #default="{ row }">
              <span class="text-dark fw-500">
                {{ row.policy_name || (row.policy_id ? `Bảng giá #${row.policy_id}` : 'Chưa gán') }}
              </span>
            </template>
          </el-table-column>

          <!-- Liên hệ -->
          <el-table-column label="Thông tin liên hệ" min-width="180">
            <template #default="{ row }">
              <div class="contact-info">
                <span class="fw-bold text-dark">
                  <el-icon class="mr-1"><Phone /></el-icon>{{ row.phone || '—' }}
                </span>
                <span class="text-xs text-muted mt-1" v-if="row.email">
                  <el-icon class="mr-1"><Message /></el-icon>{{ row.email }}
                </span>
              </div>
            </template>
          </el-table-column>

          <!-- Ngân hàng (COD) -->
          <el-table-column label="Ngân hàng nhận COD" min-width="220">
            <template #default="{ row }">
              <div v-if="row.bank_name" class="bank-card-mini">
                <div class="bank-header">
                  <el-icon><Wallet /></el-icon>
                  <span class="bank-name">{{ row.bank_name }}</span>
                </div>
                <div class="bank-number">{{ row.account_number || row.bank_number }}</div>
                <div class="bank-owner">{{ row.account_name || row.bank_owner }}</div>
              </div>
              <span v-else class="text-muted text-xs flex-center-start">
                <el-icon class="mr-1"><Warning /></el-icon> Chưa cập nhật
              </span>
            </template>
          </el-table-column>

          <!-- Trạng thái -->
          <el-table-column label="Trạng thái" width="130" align="center">
            <template #default="{ row }">
              <div class="status-pill" :class="row.status === 'ACTIVE' ? 'active' : 'locked'">
                {{ row.status === 'ACTIVE' ? 'Hoạt động' : 'Ngừng' }}
              </div>
            </template>
          </el-table-column>

          <!-- Thao tác -->
          <el-table-column label="Thao tác" width="120" fixed="right" align="center">
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
            <el-empty description="Không tìm thấy dữ liệu khách hàng" :image-size="100" />
          </template>
        </el-table>
      </div>

      <div v-if="canManageAssignment" v-show="activeTab === 'unassigned'" class="content-card table-wrapper animate-fade-in-up">
        <div class="assignment-header">
          <div>
            <h3 class="section-title">Khách hàng chưa có nhân viên quản lý</h3>
            <p class="section-description">Chọn CSKH phụ trách rồi xác nhận gán trên từng khách hàng.</p>
          </div>
          <el-button :loading="unassignedLoading" @click="fetchUnassignedCustomers">
            Làm mới
          </el-button>
        </div>

        <el-table
          :data="unassignedCustomers"
          v-loading="unassignedLoading"
          class="modern-table"
          row-class-name="modern-row"
          style="width: 100%"
        >
          <el-table-column prop="customer_code" label="Mã KH" width="120" fixed="left">
            <template #default="{ row }">
              <span class="code-badge">{{ row.customer_code }}</span>
            </template>
          </el-table-column>

          <el-table-column label="Thông tin khách hàng" min-width="260">
            <template #default="{ row }">
              <div class="customer-profile">
                <div class="avatar-icon" :class="row.customer_type === 'COMPANY' ? 'bg-primary' : 'bg-success'">
                  <el-icon v-if="row.customer_type === 'COMPANY'"><OfficeBuilding /></el-icon>
                  <el-icon v-else><Shop /></el-icon>
                </div>
                <div class="customer-details">
                  <div class="name-row">
                    <span class="fw-bold text-dark">{{ row.transaction_name || row.company_name || row.customer_code }}</span>
                    <el-tag type="warning" size="small" class="type-tag" effect="plain">Chưa gán</el-tag>
                  </div>
                  <span class="text-xs text-muted" v-if="row.company_name">{{ row.company_name }}</span>
                </div>
              </div>
            </template>
          </el-table-column>

          <el-table-column label="Liên hệ" min-width="180">
            <template #default="{ row }">
              <div class="contact-info">
                <span class="fw-bold text-dark">
                  <el-icon class="mr-1"><Phone /></el-icon>{{ row.phone || '—' }}
                </span>
                <span class="text-xs text-muted mt-1" v-if="row.email">
                  <el-icon class="mr-1"><Message /></el-icon>{{ row.email }}
                </span>
              </div>
            </template>
          </el-table-column>

          <el-table-column label="Bảng giá áp dụng" min-width="180">
            <template #default="{ row }">
              <span class="text-dark fw-500">{{ row.policy_name || (row.policy_id ? `Bảng giá #${row.policy_id}` : 'Chưa gán') }}</span>
            </template>
          </el-table-column>

          <el-table-column label="Gán CSKH" min-width="300" fixed="right">
            <template #default="{ row }">
              <div class="assign-row">
                <el-select
                  v-model="assignmentDrafts[row.customer_id || row.id]"
                  :disabled="isCskh"
                  filterable
                  placeholder="Chọn nhân viên"
                  class="assign-select"
                >
                  <el-option
                    v-for="staff in assignableStaffOptions"
                    :key="staff.user_id"
                    :label="staff.full_name ? `${staff.full_name} (${staff.username})` : staff.username"
                    :value="staff.user_id"
                  />
                </el-select>
                <button
                  class="btn-primary btn-assign"
                  :disabled="assigningCustomerId === (row.customer_id || row.id)"
                  @click="assignCustomer(row)"
                >
                  <el-icon><UserFilled /></el-icon>
                  <span>{{ assigningCustomerId === (row.customer_id || row.id) ? 'Đang gán' : 'Gán' }}</span>
                </button>
              </div>
            </template>
          </el-table-column>

          <template #empty>
            <el-empty description="Không có khách hàng đang chờ gán CSKH" :image-size="100" />
          </template>
        </el-table>
      </div>

      <div v-show="activeTab === 'inactive'" class="content-card table-wrapper animate-fade-in-up">
        <div class="assignment-header">
          <div>
            <h3 class="section-title">Khách hàng ngừng hợp tác</h3>
            <p class="section-description">Các hồ sơ đã ngừng hợp tác sẽ không hiển thị chung với danh sách khách hàng đang hoạt động.</p>
          </div>
          <el-button :loading="inactiveLoading" @click="fetchInactiveCustomers">Làm mới</el-button>
        </div>

        <el-table
          :data="inactiveCustomers"
          v-loading="inactiveLoading"
          class="modern-table"
          row-class-name="modern-row"
          style="width: 100%"
        >
          <el-table-column prop="customer_code" label="Mã KH" width="120" fixed="left">
            <template #default="{ row }">
              <span class="code-badge">{{ row.customer_code }}</span>
            </template>
          </el-table-column>
          <el-table-column label="Thông tin khách hàng" min-width="260">
            <template #default="{ row }">
              <div class="customer-profile">
                <div class="avatar-icon inactive-avatar"><el-icon><Shop /></el-icon></div>
                <div class="customer-details">
                  <div class="name-row">
                    <span class="fw-bold text-dark">{{ row.transaction_name || row.company_name || row.customer_code }}</span>
                    <el-tag type="danger" size="small" class="type-tag" effect="plain">Ngừng hợp tác</el-tag>
                  </div>
                  <span class="text-xs text-muted" v-if="row.company_name">{{ row.company_name }}</span>
                </div>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="Tên đăng nhập" min-width="170">
            <template #default="{ row }">
              <span class="username-badge">@{{ row.account_username || row.username || 'Chưa tạo' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="Liên hệ" min-width="180">
            <template #default="{ row }">
              <div class="contact-info">
                <span class="fw-bold text-dark"><el-icon class="mr-1"><Phone /></el-icon>{{ row.phone || '—' }}</span>
                <span class="text-xs text-muted mt-1" v-if="row.email"><el-icon class="mr-1"><Message /></el-icon>{{ row.email }}</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="Nhân viên quản lý" min-width="180">
            <template #default="{ row }">
              <span class="text-dark fw-500"><el-icon class="mr-1 text-muted"><UserFilled /></el-icon>{{ row.staff_in_charge_name || '—' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="Thao tác" width="90" fixed="right" align="center">
            <template #default="{ row }">
              <button class="icon-btn edit" @click="openDialog(row)" title="Chỉnh sửa"><el-icon><Edit /></el-icon></button>
            </template>
          </el-table-column>
          <template #empty>
            <el-empty description="Không có khách hàng ngừng hợp tác" :image-size="100" />
          </template>
        </el-table>
      </div>

      <!-- Modern Dialog Form (2-Column Layout) -->
      <el-dialog 
        v-model="dialogVisible" 
        :title="customerForm.id ? 'Cập nhật Khách hàng' : 'Thêm Khách hàng mới'" 
        width="900px"
        class="modern-dialog scrollable-dialog"
        destroy-on-close
      >
        <el-form :model="customerForm" :rules="rules" ref="formRef" label-position="top" class="modern-form">
          
          <!-- Phân vùng 1: Thông tin cơ bản -->
          <div class="form-section">
            <div class="section-header">
              <el-icon><InfoFilled /></el-icon>
              <span>Thông tin cơ bản</span>
            </div>
            <el-row :gutter="24">
              <el-col :span="8">
                <el-form-item v-if="customerForm.id" label="Mã khách hàng" prop="customer_code">
                  <el-input v-model="customerForm.customer_code" placeholder="KH001" :disabled="!!customerForm.id">
                    <template #prefix><el-icon><Key /></el-icon></template>
                  </el-input>
                </el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item label="Loại khách hàng" prop="customer_type">
                  <el-select v-model="customerForm.customer_type" class="w-full">
                    <el-option label="Khách hàng cá nhân" value="PERSONAL" />
                    <el-option label="Công ty / Doanh nghiệp" value="COMPANY" />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item label="Trạng thái hoạt động" prop="status">
                  <el-select v-model="customerForm.status" class="w-full">
                    <el-option label="Đang hoạt động" value="ACTIVE">
                      <span class="text-success fw-bold">Đang hoạt động</span>
                    </el-option>
                    <el-option label="Ngừng hợp tác" value="INACTIVE">
                      <span class="text-danger fw-bold">Ngừng hợp tác</span>
                    </el-option>
                  </el-select>
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="24">
              <el-col :span="24">
                <el-form-item label="Nhân viên quản lý khách hàng" prop="staff_in_charge_id">
                  <el-select
                    v-model="customerForm.staff_in_charge_id"
                    placeholder="Chọn nhân viên phụ trách"
                    filterable
                    class="w-full"
                  >
                    <el-option
                      v-for="staff in staffOptions"
                      :key="staff.user_id"
                      :label="staff.full_name ? `${staff.full_name} (${staff.username})` : staff.username"
                      :value="staff.user_id"
                    />
                  </el-select>
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="24">
              <el-col :span="24">
                <el-form-item label="Bảng giá áp dụng" prop="policy_id">
                  <el-select v-model="customerForm.policy_id" placeholder="Có thể chọn sau" filterable clearable class="w-full">
                    <el-option
                      v-for="policy in pricingPolicies"
                      :key="policy.policy_id"
                      :label="`${policy.policy_code} - ${policy.policy_name}`"
                      :value="policy.policy_id"
                    />
                  </el-select>
                </el-form-item>
              </el-col>
            </el-row>
          </div>

          <div class="form-section account-section-marker">
            <div class="section-header">
              <el-icon><Key /></el-icon>
              <span>Tài khoản đăng nhập</span>
            </div>
            <el-alert
              v-if="!customerForm.id"
              title="Mã khách hàng sẽ được hệ thống tự tạo. Tên đăng nhập có thể để trống để tự sinh theo mã khách hàng."
              type="info"
              :closable="false"
              class="mb-12"
            />
            <el-row :gutter="24">
              <el-col :span="12">
                <el-form-item label="Tên đăng nhập" prop="username">
                  <el-input v-model="customerForm.username" :placeholder="customerForm.id ? 'Tên đăng nhập' : 'Để trống để tự tạo'" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item :label="customerForm.id ? 'Mật khẩu mới' : 'Mật khẩu'" prop="password">
                  <el-input v-model="customerForm.password" type="password" show-password :placeholder="customerForm.id ? 'Bỏ trống nếu không đổi' : 'Để trống để dùng SĐT/mã KH'" />
                </el-form-item>
              </el-col>
            </el-row>
          </div>
          <!-- Phân vùng 2: Liên hệ & Định danh -->
          <div class="form-section">
            <div class="section-header">
              <el-icon><Avatar /></el-icon>
              <span>Liên hệ & Định danh</span>
            </div>
            <el-row :gutter="24">
              <el-col :span="12">
                <el-form-item :label="customerForm.customer_type === 'COMPANY' ? 'Tên giao dịch' : 'Họ và tên khách hàng'" prop="name">
                  <el-input v-model="customerForm.name" :placeholder="customerForm.customer_type === 'COMPANY' ? 'VD: ABC Logistics' : 'VD: Nguyễn Văn A'">
                    <template #prefix><el-icon><Shop /></el-icon></template>
                  </el-input>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item v-if="customerForm.customer_type === 'COMPANY'" label="Tên công ty / doanh nghiệp" prop="company_name">
                  <el-input v-model="customerForm.company_name" placeholder="VD: Công ty TNHH ABC">
                    <template #prefix><el-icon><OfficeBuilding /></el-icon></template>
                  </el-input>
                </el-form-item>
              </el-col>
            </el-row>

            <el-row v-if="customerForm.customer_type === 'COMPANY'" :gutter="24">
              <el-col :span="12">
                <el-form-item label="Người đại diện" prop="representative_name">
                  <el-input v-model="customerForm.representative_name" placeholder="VD: Nguyễn Văn A">
                    <template #prefix><el-icon><User /></el-icon></template>
                  </el-input>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="Mã số thuế" prop="tax_code">
                  <el-input v-model="customerForm.tax_code" placeholder="VD: 0123456789">
                    <template #prefix><el-icon><Document /></el-icon></template>
                  </el-input>
                </el-form-item>
              </el-col>
            </el-row>

            <el-row :gutter="24">
              <el-col :span="12">
                <el-form-item label="Số điện thoại liên hệ" prop="phone">
                  <el-input v-model="customerForm.phone" placeholder="VD: 09xxxxxxx">
                    <template #prefix><el-icon><Phone /></el-icon></template>
                  </el-input>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="Địa chỉ Email" prop="email">
                  <el-input v-model="customerForm.email" placeholder="VD: shop@example.com">
                    <template #prefix><el-icon><Message /></el-icon></template>
                  </el-input>
                </el-form-item>
              </el-col>
            </el-row>

            <el-row :gutter="24">
              <el-col :span="12">
                <el-form-item label="Quốc gia" prop="country">
                  <el-input v-model="customerForm.country" placeholder="VD: Việt Nam" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="Tỉnh / Thành phố" prop="province">
                  <el-input v-model="customerForm.province" placeholder="VD: TP. Hồ Chí Minh" />
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="24">
              <el-col :span="12">
                <el-form-item label="Phường / Xã" prop="ward">
                  <el-input v-model="customerForm.ward" placeholder="VD: Phường Bến Nghé" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="Số nhà, đường" prop="street_address">
                  <el-input v-model="customerForm.street_address" placeholder="VD: 12 Nguyễn Huệ" />
                </el-form-item>
              </el-col>
            </el-row>
          </div>

          <!-- Phân vùng 3: Thanh toán COD -->
          <div class="form-section no-border">
            <div class="section-header">
              <el-icon><CreditCard /></el-icon>
              <span>Thông tin ngân hàng nhận COD</span>
            </div>
            <el-row :gutter="24">
              <el-col :span="12">
                <el-form-item label="Ngân hàng" prop="bank_name">
                  <el-input v-model="customerForm.bank_name" placeholder="VD: Vietcombank, MBBank...">
                    <template #prefix><el-icon><Wallet /></el-icon></template>
                  </el-input>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="Số tài khoản" prop="bank_number">
                  <el-input v-model="customerForm.bank_number" placeholder="VD: 123456789">
                    <template #prefix><el-icon><Menu /></el-icon></template>
                  </el-input>
                </el-form-item>
              </el-col>
            </el-row>
            <el-row>
              <el-col :span="24">
                <el-form-item label="Tên chủ tài khoản" prop="bank_owner">
                  <el-input v-model="customerForm.bank_owner" placeholder="VD: NGUYEN VAN A">
                    <template #prefix><el-icon><UserFilled /></el-icon></template>
                  </el-input>
                </el-form-item>
              </el-col>
            </el-row>
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
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed, watch } from 'vue';
import { 
  Plus, Edit, Delete, Search, Shop, OfficeBuilding, Phone, Message,
  Wallet, Briefcase, User, Warning, Key, Document, Avatar, InfoFilled, 
  CreditCard, Menu, UserFilled, Loading
} from '@element-plus/icons-vue';
import api from '@/api/axios';
import { ElMessage, ElMessageBox } from 'element-plus';
import { useAuthStore } from '@/stores/auth';
import { useRoute } from 'vue-router';

const authStore = useAuthStore();
const route = useRoute();
const currentUser = computed(() => authStore.user || {});
const isCskh = computed(() => currentUser.value?.role_id === 7);
const isMineView = computed(() => route.query.mine === '1' || route.query.mine === 'true');
const canManageAssignment = computed(() => [1, 2, 7].includes(currentUser.value?.role_id));
const assignableStaffOptions = computed(() => {
  if (isCskh.value) {
    return staffOptions.value.filter(staff => staff.user_id === currentUser.value?.user_id);
  }
  return staffOptions.value;
});

const loading = ref(false);
const unassignedLoading = ref(false);
const inactiveLoading = ref(false);
const saveLoading = ref(false);
const dialogVisible = ref(false);
const activeTab = ref('all');
const searchQuery = ref('');
const staffFilterId = ref(null);
const formRef = ref(null);
const customers = ref([]);
const unassignedCustomers = ref([]);
const inactiveCustomers = ref([]);
const staffOptions = ref([]);
const pricingPolicies = ref([]);
const assignmentDrafts = reactive({});
const assigningCustomerId = ref(null);

const customerForm = reactive({
  id: null,
  customer_code: '',
  customer_type: 'PERSONAL',
  status: 'ACTIVE',
  staff_in_charge_id: null,
  policy_id: null,
  name: '',            
  company_name: '',
  representative_name: '',
  tax_code: '',
  phone: '',
  email: '',
  address: '',
  country: 'Việt Nam',
  province: '',
  ward: '',
  street_address: '',
  bank_name: '',
  bank_number: '',
  bank_owner: '',
  username: '',
  password: ''
});

const rules = {
  customer_code: [{ required: true, message: 'Vui lòng nhập mã khách hàng', trigger: 'blur' }],
  name: [{ required: true, message: 'Vui lòng nhập tên giao dịch/shop', trigger: 'blur' }],
  phone: [{ required: true, message: 'Vui lòng nhập số điện thoại liên hệ', trigger: 'blur' }],
  staff_in_charge_id: [{ required: true, message: 'Vui lòng chọn nhân viên quản lý khách hàng', trigger: 'change' }],
  customer_type: [{ required: true, message: 'Vui lòng chọn loại khách hàng', trigger: 'change' }],
  status: [{ required: true, message: 'Vui lòng chọn trạng thái', trigger: 'change' }]
};

const parseAddressParts = (address = '') => {
  const parts = String(address || '').split(',').map(part => part.trim()).filter(Boolean);
  return {
    street_address: parts[0] || '',
    ward: parts[1] || '',
    province: parts[2] || '',
    country: parts[3] || 'Việt Nam'
  };
};

const fetchStaffOptions = async () => {
  try {
    const res = await api.get('/api/users');
    const raw = Array.isArray(res.data) ? res.data : (res.data.items || res.data.data || []);
    staffOptions.value = raw.filter(user => user.is_active !== false && user.role_id !== 6);
  } catch (err) {
    staffOptions.value = [];
    ElMessage.warning('Không thể lấy danh sách nhân viên quản lý');
  }
};

const fetchPricingPolicies = async () => {
  try {
    const res = await api.get('/api/pricing/policies');
    pricingPolicies.value = Array.isArray(res.data) ? res.data : (res.data.items || res.data.data || []);
  } catch (err) {
    pricingPolicies.value = [];
    ElMessage.warning('Không thể lấy danh sách bảng giá');
  }
};

const fetchData = async () => {
  loading.value = true;
  try {
    const params = {
      q: searchQuery.value,
      mine: isMineView.value
    };
    if (!params.mine && staffFilterId.value) {
      params.staff_in_charge_id = staffFilterId.value;
    }
    const res = await api.get('/api/customers', { params });
    customers.value = res.data;
  } catch (err) {
    ElMessage.error('Không thể lấy danh sách khách hàng');
  } finally {
    loading.value = false;
  }
};

const fetchUnassignedCustomers = async () => {
  if (!canManageAssignment.value) return;
  unassignedLoading.value = true;
  try {
    const res = await api.get('/api/customers', { params: { unassigned: true } });
    unassignedCustomers.value = Array.isArray(res.data) ? res.data : [];
    unassignedCustomers.value.forEach((customer) => {
      const id = customer.customer_id || customer.id;
      if (!assignmentDrafts[id]) {
        assignmentDrafts[id] = isCskh.value ? currentUser.value.user_id : null;
      }
    });
  } catch (err) {
    ElMessage.error('Không thể lấy danh sách khách hàng chưa gán CSKH');
  } finally {
    unassignedLoading.value = false;
  }
};

const fetchInactiveCustomers = async () => {
  inactiveLoading.value = true;
  try {
    const res = await api.get('/api/customers', { params: { status: 'INACTIVE' } });
    inactiveCustomers.value = Array.isArray(res.data) ? res.data : [];
  } catch (err) {
    ElMessage.error('Không thể lấy danh sách khách hàng ngừng hợp tác');
  } finally {
    inactiveLoading.value = false;
  }
};

const handleTabChange = (tabName) => {
  if (tabName === 'unassigned') {
    fetchUnassignedCustomers();
  } else if (tabName === 'inactive') {
    fetchInactiveCustomers();
  } else {
    fetchData();
  }
};

const assignCustomer = async (row) => {
  const customerId = row.customer_id || row.id;
  const staffId = isCskh.value ? currentUser.value.user_id : assignmentDrafts[customerId];
  if (!staffId) {
    ElMessage.warning('Vui lòng chọn CSKH phụ trách');
    return;
  }

  assigningCustomerId.value = customerId;
  try {
    await api.patch(`/api/customers/${customerId}/staff-in-charge`, {
      staff_in_charge_id: staffId
    });
    ElMessage.success('Đã gán CSKH phụ trách cho khách hàng');
    delete assignmentDrafts[customerId];
    fetchUnassignedCustomers();
    fetchData();
  } catch (err) {
    ElMessage.error(err.response?.data?.detail || 'Không thể gán CSKH cho khách hàng');
  } finally {
    assigningCustomerId.value = null;
  }
};

const openDialog = (row) => {
  if (row) {
    Object.assign(customerForm, {
      id: row.customer_id || row.id,
      customer_code: row.customer_code,
      customer_type: row.customer_type === 'SHOP' ? 'PERSONAL' : (row.customer_type || 'PERSONAL'),
      status: row.status || 'ACTIVE',
      staff_in_charge_id: row.staff_in_charge_id || null,
      policy_id: row.policy_id || null,
      name: row.transaction_name || row.name || '',
      company_name: row.company_name || '',
      representative_name: row.representative_name || '',
      tax_code: row.tax_code || '',
      phone: row.phone || '',
      email: row.email || '',
      address: row.address || row.address_detail || '',
      ...parseAddressParts(row.address || row.address_detail || ''),
      country: row.country || parseAddressParts(row.address || row.address_detail || '').country,
      province: row.province || row.province_name || parseAddressParts(row.address || row.address_detail || '').province,
      ward: row.ward || row.ward_name || parseAddressParts(row.address || row.address_detail || '').ward,
      street_address: row.street_address || parseAddressParts(row.address || row.address_detail || '').street_address,
      bank_name: row.bank_name || '',
      bank_number: row.bank_number || row.account_number || '',
      bank_owner: row.bank_owner || row.account_name || '',
      username: row.account_username || row.username || '',
      password: ''
    });
  } else {
    Object.assign(customerForm, {
      id: null, customer_code: '', customer_type: 'PERSONAL', status: 'ACTIVE',
      staff_in_charge_id: isCskh.value ? currentUser.value.user_id : null,
      policy_id: null,
      name: '', company_name: '', representative_name: '', tax_code: '',
      phone: '', email: '', address: '',
      country: 'Việt Nam', province: '', ward: '', street_address: '',
      bank_name: '', bank_number: '', bank_owner: '',
      username: '', password: ''
    });
  }
  dialogVisible.value = true;
};

const handleSave = async () => {
  if (!formRef.value) return;
  await formRef.value.validate(async (valid) => {
    if (valid) {
      saveLoading.value = true;
      try {
        const payload = {
          ...customerForm,
          address: [
            customerForm.street_address,
            customerForm.ward,
            customerForm.province,
            customerForm.country
          ].filter(Boolean).join(', ')
        };
        if (payload.customer_type !== 'COMPANY') {
          payload.company_name = '';
          payload.representative_name = '';
          payload.tax_code = '';
        }

        if (customerForm.id) {
          await api.put(`/api/customers/${customerForm.id}`, payload);
          ElMessage.success('Cập nhật khách hàng thành công!');
        } else {
          await api.post('/api/customers', payload);
          ElMessage.success('Thêm khách hàng mới thành công!');
        }
        dialogVisible.value = false;
        if (activeTab.value === 'inactive') {
          fetchInactiveCustomers();
        } else {
          fetchData();
        }
      } catch (err) {
        ElMessage.error(err.response?.data?.detail || 'Lỗi khi lưu thông tin khách hàng.');
      } finally {
        saveLoading.value = false;
      }
    }
  });
};

const handleDelete = (row) => {
  ElMessageBox.confirm(
    `Bạn có chắc chắn muốn xóa khách hàng <strong>${row.transaction_name || row.name || row.customer_code}</strong>?`, 
    'Cảnh báo xóa', 
    {
      confirmButtonText: 'Xóa dữ liệu',
      cancelButtonText: 'Hủy bỏ',
      type: 'error',
      dangerouslyUseHTMLString: true,
      customClass: 'modern-message-box'
    }
  ).then(async () => {
    try {
      const res = await api.delete(`/api/customers/${row.customer_id || row.id}`);
      ElMessage.success(res.data?.message || 'Đã cập nhật trạng thái khách hàng');
      fetchData();
      fetchInactiveCustomers();
    } catch (err) {
      ElMessage.error(err.response?.data?.detail || 'Xóa không thành công.');
    }
  }).catch(() => {});
};

onMounted(() => {
  fetchData();
  fetchStaffOptions();
  fetchPricingPolicies();
  if (canManageAssignment.value && activeTab.value === 'unassigned') {
    fetchUnassignedCustomers();
  }
});

watch(() => route.query.mine, () => {
  fetchData();
});
</script>

<style scoped src="@/styles/admin/customers/CustomerList.css"></style>
