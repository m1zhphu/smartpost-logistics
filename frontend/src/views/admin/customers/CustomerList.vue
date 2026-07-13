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
          <RecentSearchInput
            v-model="searchQuery"
            placeholder="Tìm theo tên shop, SĐT hoặc mã khách hàng..."
            class="modern-input search-input"
            clearable
            storageKey="recentSearches_customers"
            popoverWidth="400"
            @clear="fetchData"
            @keyup.enter="fetchData"
            @search="fetchData"
            ref="searchInputRef"
          >
            <template #prefix><el-icon><Search /></el-icon></template>
            <template #append>
              <el-button @click="fetchData" class="search-btn">Tìm kiếm</el-button>
            </template>
          </RecentSearchInput>
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
      <div v-show="activeTab === 'all'" class="content-card table-wrapper animate-fade-in-up desktop-only">
        <el-table 
          :data="paginatedCustomers" 
          v-loading="loading" 
          class="modern-table"
          row-class-name="modern-row"
          style="width: 100%"
        >
          <!-- Mã KH -->
          <el-table-column prop="customer_code" label="Mã KH" width="120">
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

          <!-- Nhân viên quản lý -->
          <el-table-column label="Nhân viên quản lý" min-width="180">
            <template #default="{ row }">
              <span class="text-dark fw-500">
                <el-icon class="mr-1 text-muted"><UserFilled /></el-icon>
                {{ row.staff_in_charge_name || '—' }}
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

          <!-- Trạng thái -->
          <el-table-column label="Trạng thái" width="130" align="center">
            <template #default="{ row }">
              <div class="status-pill" :class="row.status === 'ACTIVE' ? 'active' : 'locked'">
                {{ row.status === 'ACTIVE' ? 'Hoạt động' : 'Ngừng' }}
              </div>
            </template>
          </el-table-column>

          <!-- Thao tác -->
          <el-table-column label="Thao tác" width="120" align="center">
            <template #default="{ row }">
              <div class="action-buttons">
                <button class="icon-btn edit" @click="viewCustomerDetails(row)" title="Xem chi tiết">
                  <el-icon><InfoFilled /></el-icon>
                </button>
                <button class="icon-btn edit" @click="openDialog(row)" title="Chỉnh sửa">
                  <el-icon><Edit /></el-icon>
                </button>
              </div>
            </template>
          </el-table-column>

          <template #empty>
            <el-empty description="Không tìm thấy dữ liệu khách hàng" :image-size="100" />
          </template>
        </el-table>
        <div style="margin-top: 16px; display: flex; justify-content: flex-end;">
          <el-pagination
            v-model:current-page="currentPage"
            v-model:page-size="pageSize"
            :page-sizes="[10, 20, 50, 100]"
            layout="total, sizes, prev, pager, next, jumper"
            :total="customers.length"
          />
        </div>
      </div>

      <!-- Mobile Cards: All Customers -->
      <div v-show="activeTab === 'all'" class="mobile-only" v-loading="loading">
        <el-empty v-if="paginatedCustomers.length === 0 && !loading" description="Không tìm thấy dữ liệu khách hàng" :image-size="80" />
        <div
          v-for="customer in paginatedCustomers"
          :key="customer.id"
          class="mobile-customer-card animate-fade-in-up"
        >
          <div class="mcc-header">
            <div class="avatar-icon" :class="customer.customer_type === 'COMPANY' ? 'bg-primary' : 'bg-success'">
              <el-icon v-if="customer.customer_type === 'COMPANY'"><OfficeBuilding /></el-icon>
              <el-icon v-else><Shop /></el-icon>
            </div>
            <div class="mcc-identity">
              <span class="fw-bold text-dark mcc-name">{{ customer.transaction_name || customer.company_name || customer.customer_code }}</span>
              <div style="display:flex;gap:6px;align-items:center;">
                <span class="code-badge" style="padding:2px 6px;font-size:11px;">{{ customer.customer_code }}</span>
                <el-tag :type="customer.customer_type === 'COMPANY' ? 'primary' : 'success'" size="small" class="type-tag" effect="plain">
                  {{ customer.customer_type === 'COMPANY' ? 'Doanh nghiệp' : 'Cá nhân' }}
                </el-tag>
              </div>
            </div>
            <div class="status-pill" :class="customer.status === 'ACTIVE' ? 'active' : 'locked'" style="flex-shrink:0;">
              {{ customer.status === 'ACTIVE' ? 'HĐ' : 'Ngừng' }}
            </div>
          </div>
          <div class="mcc-info-list">
            <div class="mcc-info-row">
              <span class="mcc-label">Quản lý</span>
              <span class="mcc-value"><el-icon style="margin-right:4px;"><UserFilled /></el-icon>{{ customer.staff_in_charge_name || '—' }}</span>
            </div>
            <div class="mcc-info-row">
              <span class="mcc-label">SĐT</span>
              <span class="mcc-value"><el-icon style="margin-right:4px;"><Phone /></el-icon>{{ customer.phone || '—' }}</span>
            </div>
          </div>
          <div class="mcc-footer">
            <button class="icon-btn edit" @click="viewCustomerDetails(customer)" title="Xem chi tiết">
              <el-icon><InfoFilled /></el-icon>
            </button>
            <button class="icon-btn edit" @click="openDialog(customer)" title="Chỉnh sửa">
              <el-icon><Edit /></el-icon>
            </button>
          </div>
        </div>
        <div v-if="customers.length > pageSize" class="mcc-pagination">
          <el-pagination v-model:current-page="currentPage" v-model:page-size="pageSize" layout="prev, pager, next" :total="customers.length" small />
        </div>
      </div>

      <div v-if="canManageAssignment" v-show="activeTab === 'unassigned'" class="content-card table-wrapper animate-fade-in-up desktop-only">
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
          <el-table-column prop="customer_code" label="Mã KH" width="120">
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

          <el-table-column label="Bảng giá áp dụng" min-width="200">
            <template #default="{ row }">
              <span class="text-dark fw-500 truncate-text" :title="row.policy_name || (row.policy_id ? `Bảng giá #${row.policy_id}` : 'Chưa gán')">
                {{ row.policy_name || (row.policy_id ? `Bảng giá #${row.policy_id}` : 'Chưa gán') }}
              </span>
            </template>
          </el-table-column>

          <el-table-column label="Gán CSKH" min-width="300">
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

      <!-- Mobile Cards: Unassigned -->
      <div v-if="canManageAssignment" v-show="activeTab === 'unassigned'" class="mobile-only" v-loading="unassignedLoading">
        <div class="assignment-header" style="background:var(--sp-surface);padding:16px;border-radius:14px;margin-bottom:16px;">
          <div>
            <h3 class="section-title">Chưa có nhân viên quản lý</h3>
            <p class="section-description">Chọn CSKH phụ trách rồi xác nhận.</p>
          </div>
          <el-button @click="fetchUnassignedCustomers">Làm mới</el-button>
        </div>
        <el-empty v-if="unassignedCustomers.length === 0 && !unassignedLoading" description="Không có khách hàng chờ gán" :image-size="80" />
        <div v-for="customer in unassignedCustomers" :key="customer.id" class="mobile-customer-card animate-fade-in-up">
          <div class="mcc-header">
            <div class="avatar-icon" :class="customer.customer_type === 'COMPANY' ? 'bg-primary' : 'bg-success'">
              <el-icon v-if="customer.customer_type === 'COMPANY'"><OfficeBuilding /></el-icon>
              <el-icon v-else><Shop /></el-icon>
            </div>
            <div class="mcc-identity">
              <span class="fw-bold text-dark mcc-name">{{ customer.transaction_name || customer.company_name || customer.customer_code }}</span>
              <span class="code-badge" style="padding:2px 6px;font-size:11px;">{{ customer.customer_code }}</span>
            </div>
            <el-tag type="warning" size="small" effect="plain" style="flex-shrink:0;">Chưa gán</el-tag>
          </div>
          <div class="mcc-info-list" style="margin-bottom:16px;">
            <div class="mcc-info-row" v-if="customer.phone">
              <span class="mcc-label">SĐT</span>
              <span class="mcc-value"><el-icon style="margin-right:4px;"><Phone /></el-icon>{{ customer.phone }}</span>
            </div>
          </div>
          <div class="assign-row" style="border-top:1px solid var(--sp-bg-app);padding-top:12px;">
            <el-select
              v-model="assignmentDrafts[customer.customer_id || customer.id]"
              :disabled="isCskh"
              filterable
              placeholder="Chọn nhân viên"
              class="w-full"
            >
              <el-option
                v-for="staff in assignableStaffOptions"
                :key="staff.user_id"
                :label="staff.full_name ? `${staff.full_name} (${staff.username})` : staff.username"
                :value="staff.user_id"
              />
            </el-select>
            <button
              class="btn-primary" style="width:100%;justify-content:center;"
              :disabled="assigningCustomerId === (customer.customer_id || customer.id)"
              @click="assignCustomer(customer)"
            >
              <el-icon><UserFilled /></el-icon>
              <span>{{ assigningCustomerId === (customer.customer_id || customer.id) ? 'Đang gán...' : 'Gán NVCSKH' }}</span>
            </button>
          </div>
        </div>
      </div>

      <div v-show="activeTab === 'inactive'" class="content-card table-wrapper animate-fade-in-up desktop-only">
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
          <el-table-column prop="customer_code" label="Mã KH" width="120">
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
          <el-table-column label="Thao tác" width="90" align="center">
            <template #default="{ row }">
              <button class="icon-btn edit" @click="openDialog(row)" title="Chỉnh sửa"><el-icon><Edit /></el-icon></button>
            </template>
          </el-table-column>
          <template #empty>
            <el-empty description="Không có khách hàng ngừng hợp tác" :image-size="100" />
          </template>
        </el-table>
      </div>

      <!-- Mobile Cards: Inactive -->
      <div v-show="activeTab === 'inactive'" class="mobile-only" v-loading="inactiveLoading">
        <div class="assignment-header" style="background:var(--sp-surface);padding:16px;border-radius:14px;margin-bottom:16px;">
          <div>
            <h3 class="section-title">Ngừng hợp tác</h3>
          </div>
          <el-button @click="fetchInactiveCustomers">Làm mới</el-button>
        </div>
        <el-empty v-if="inactiveCustomers.length === 0 && !inactiveLoading" description="Không có khách hàng ngừng hợp tác" :image-size="80" />
        <div v-for="customer in inactiveCustomers" :key="customer.id" class="mobile-customer-card animate-fade-in-up">
          <div class="mcc-header">
            <div class="avatar-icon inactive-avatar"><el-icon><Shop /></el-icon></div>
            <div class="mcc-identity">
              <span class="fw-bold text-dark mcc-name">{{ customer.transaction_name || customer.company_name || customer.customer_code }}</span>
              <span class="code-badge" style="padding:2px 6px;font-size:11px;">{{ customer.customer_code }}</span>
            </div>
            <el-tag type="danger" size="small" effect="plain" style="flex-shrink:0;">Ngừng</el-tag>
          </div>
          <div class="mcc-footer" style="padding-top:10px;justify-content:flex-end;">
            <button class="btn-secondary" style="padding:8px 16px;" @click="openDialog(customer)">
              <el-icon class="mr-1"><Edit /></el-icon> Chỉnh sửa
            </button>
          </div>
        </div>
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
                  <el-input v-model="customerForm.customer_code" placeholder="Hệ thống tự tạo" :disabled="!!customerForm.id">
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

            <!-- Địa chỉ mới 2 cấp: Tỉnh / Thành phố → Phường / Xã -->
            <el-row :gutter="24">
              <el-col :span="12">
                <el-form-item label="Tỉnh / Thành phố (Mới)" prop="province">
                  <el-select
                    v-model="selectedProvinceCode"
                    filterable
                    clearable
                    class="w-full"
                    placeholder="Chọn tỉnh / thành phố mới"
                    @change="onProvinceChange"
                  >
                    <template #prefix><el-icon><Location /></el-icon></template>
                    <el-option
                      v-for="p in provinces"
                      :key="p.Code"
                      :label="p.FullName"
                      :value="p.Code"
                    />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="Phường / Xã (Mới)" prop="ward">
                  <el-select
                    v-model="selectedWardCode"
                    filterable
                    clearable
                    class="w-full"
                    placeholder="Chọn phường / xã mới"
                    :disabled="!selectedProvinceCode"
                    :loading="legacyLookupLoading"
                    @change="onWardChange"
                  >
                    <template #prefix><el-icon><Location /></el-icon></template>
                    <el-option
                      v-for="w in wards"
                      :key="w.Code"
                      :label="w.FullName"
                      :value="w.Code"
                    />
                  </el-select>
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="24">
              <el-col :span="24">
                <el-form-item label="Số nhà, đường" prop="street_address">
                  <el-input v-model="customerForm.street_address" placeholder="VD: 12 Nguyễn Huệ" />
                </el-form-item>
              </el-col>
            </el-row>

            <!-- Box thông tin địa chỉ sẽ được lưu (không cho chỉnh sửa trực tiếp, có viền xanh lá) -->
            <div v-if="customerForm.province || customerForm.ward" class="address-preview-container animate-fade-in" style="border: 2px solid #2ec17e; border-radius: 12px; padding: 16px; background-color: #f4fbf7; margin-bottom: 20px;">
              <div style="display: flex; align-items: center; margin-bottom: 12px; color: #2ec17e; font-weight: bold; font-size: 14px;">
                <el-icon style="margin-right: 6px;"><Location /></el-icon>
                <span>Thông tin địa chỉ lưu trữ</span>
              </div>
              <div style="display: flex; align-items: baseline; gap: 8px; margin-bottom: 8px;">
                <span style="font-size: 12px; color: #888; white-space: nowrap; min-width: 130px;">Địa chỉ sau sáp nhập:</span>
                <span style="font-size: 14px; font-weight: 600; color: #2e7d32;">{{ newAddress || '—' }}</span>
              </div>
              <div style="display: flex; align-items: baseline; gap: 8px;">
                <span style="font-size: 12px; color: #888; white-space: nowrap; min-width: 130px;">Tỉnh cũ trước sáp nhập:</span>
                <span v-if="legacyLookupLoading" style="font-size: 13px; color: #999; font-style: italic;">Đang tra cứu...</span>
                <span v-else style="font-size: 14px; font-weight: 600; color: #2b6cb0;">{{ oldProvinceName || '—' }}</span>
              </div>
            </div>
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

      <!-- Drawer Xem chi tiết Khách hàng -->
      <el-drawer
        v-model="detailDrawerVisible"
        title="Chi tiết Khách hàng"
        size="550px"
        class="modern-detail-drawer"
        destroy-on-close
      >
        <template #header>
          <div class="drawer-header-content">
            <div class="drawer-title-wrapper">
              <div class="avatar-icon large" :class="selectedCustomer?.customer_type === 'COMPANY' ? 'bg-primary' : 'bg-success'">
                <el-icon v-if="selectedCustomer?.customer_type === 'COMPANY'"><OfficeBuilding /></el-icon>
                <el-icon v-else><Shop /></el-icon>
              </div>
              <div>
                <h3 class="drawer-main-title">{{ selectedCustomer?.transaction_name || selectedCustomer?.name || selectedCustomer?.customer_code }}</h3>
                <span class="code-badge">{{ selectedCustomer?.customer_code }}</span>
              </div>
            </div>
          </div>
        </template>

        <div v-if="selectedCustomer" class="drawer-body-details">
          <!-- Section: Thông tin chung -->
          <div class="detail-section">
            <h4 class="section-subtitle">Thông tin Chung</h4>
            <div class="detail-grid">
              <div class="detail-item">
                <span class="detail-label">Loại khách hàng</span>
                <span class="detail-value">
                  <el-tag :type="selectedCustomer.customer_type === 'COMPANY' ? 'primary' : 'success'" size="small" effect="plain">
                    {{ selectedCustomer.customer_type === 'COMPANY' ? 'Doanh nghiệp' : 'Cá nhân' }}
                  </el-tag>
                </span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Trạng thái</span>
                <span class="detail-value">
                  <el-tag :type="selectedCustomer.status === 'ACTIVE' ? 'success' : 'danger'" size="small">
                    {{ selectedCustomer.status === 'ACTIVE' ? 'Đang hoạt động' : 'Ngừng hợp tác' }}
                  </el-tag>
                </span>
              </div>
              <div class="detail-item" v-if="selectedCustomer.company_name">
                <span class="detail-label">Tên công ty</span>
                <span class="detail-value">{{ selectedCustomer.company_name }}</span>
              </div>
              <div class="detail-item" v-if="selectedCustomer.representative_name">
                <span class="detail-label">Người đại diện</span>
                <span class="detail-value">{{ selectedCustomer.representative_name }}</span>
              </div>
              <div class="detail-item" v-if="selectedCustomer.tax_code">
                <span class="detail-label">Mã số thuế</span>
                <span class="detail-value">{{ selectedCustomer.tax_code }}</span>
              </div>
            </div>
          </div>

          <!-- Section: Tài khoản -->
          <div class="detail-section">
            <h4 class="section-subtitle">Tài khoản & Phân quyền</h4>
            <div class="detail-grid">
              <div class="detail-item">
                <span class="detail-label">Tên đăng nhập</span>
                <span class="detail-value fw-bold">@{{ selectedCustomer.account_username || selectedCustomer.username || 'Chưa tạo' }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Bảng giá áp dụng</span>
                <span class="detail-value">{{ selectedCustomer.policy_name || 'Chưa cấu hình (Áp dụng mặc định)' }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Nhân viên CSKH quản lý</span>
                <span class="detail-value fw-bold text-primary">{{ selectedCustomer.staff_in_charge_name || 'Chưa gán nhân viên' }}</span>
              </div>
            </div>
          </div>

          <!-- Section: Liên hệ & Địa chỉ -->
          <div class="detail-section">
            <h4 class="section-subtitle">Thông tin Liên hệ & Địa chỉ</h4>
            <div class="detail-grid">
              <div class="detail-item">
                <span class="detail-label">Số điện thoại</span>
                <span class="detail-value">{{ selectedCustomer.phone || '—' }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Email</span>
                <span class="detail-value">{{ selectedCustomer.email || '—' }}</span>
              </div>
              <div class="detail-item full-width">
                <span class="detail-label">Địa chỉ mới (Đăng ký)</span>
                <span class="detail-value fw-bold text-success" style="color: #2ec17e;">{{ selectedCustomer.address || '—' }}</span>
              </div>
              <div class="detail-item full-width" v-if="selectedCustomer.old_province">
                <span class="detail-label">Tỉnh cũ trước sáp nhập</span>
                <span class="detail-value" style="color: #2b6cb0; font-weight: 600;">{{ selectedCustomer.old_province }}</span>
              </div>
            </div>
          </div>

          <!-- Section: Nhận COD -->
          <div class="detail-section">
            <h4 class="section-subtitle">Tài khoản Ngân hàng (Nhận COD)</h4>
            <div class="detail-grid" v-if="selectedCustomer.bank_name">
              <div class="detail-item">
                <span class="detail-label">Ngân hàng</span>
                <span class="detail-value">{{ selectedCustomer.bank_name }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Số tài khoản</span>
                <span class="detail-value">{{ selectedCustomer.account_number || selectedCustomer.bank_number || '—' }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Chủ tài khoản</span>
                <span class="detail-value uppercase fw-bold">{{ selectedCustomer.account_name || selectedCustomer.bank_owner || '—' }}</span>
              </div>
            </div>
            <div v-else class="no-bank-info">
              <el-icon><Warning /></el-icon>
              <span>Chưa cập nhật tài khoản ngân hàng nhận tiền thu hộ (COD)</span>
            </div>
          </div>
        </div>

        <template #footer>
          <div class="drawer-footer-actions">
            <button class="btn-secondary" @click="detailDrawerVisible = false">Đóng</button>
            <button class="btn-primary" @click="detailDrawerVisible = false; openDialog(selectedCustomer)">
              <el-icon><Edit /></el-icon>
              <span>Chỉnh sửa thông tin</span>
            </button>
          </div>
        </template>
      </el-drawer>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed, watch } from 'vue';
import { 
  Plus, Edit, Search, Shop, OfficeBuilding, Phone, Message,
  Wallet, Briefcase, User, Warning, Key, Document, Avatar, InfoFilled, 
  CreditCard, Menu, UserFilled, Loading, Location
} from '@element-plus/icons-vue';
import api from '@/api/axios';
import RecentSearchInput from '@/components/RecentSearchInput.vue';
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
const detailDrawerVisible = ref(false);
const selectedCustomer = ref(null);

const viewCustomerDetails = (row) => {
  selectedCustomer.value = row;
  detailDrawerVisible.value = true;
};
const activeTab = ref('all');
const searchQuery = ref('');
const searchInputRef = ref(null);
const staffFilterId = ref(null);
const formRef = ref(null);
const customers = ref([]);
const unassignedCustomers = ref([]);
const inactiveCustomers = ref([]);
const staffOptions = ref([]);
const pricingPolicies = ref([]);
const assignmentDrafts = reactive({});
const assigningCustomerId = ref(null);

// ---- Địa chỉ Cascade: Tỉnh -> Xã (dùng Provinces Open API V2 để tra cứu tỉnh cũ) ----
const PROVINCES_API_V2 = 'https://provinces.open-api.vn/api/v2';

// Map mã tỉnh cũ (trước 2025) -> tên tỉnh cũ
// province_code trả về từ to-legacies là mã của hệ thống 63 tỉnh cũ
const OLD_PROVINCE_CODE_MAP = {
  1: 'Thành phố Hà Nội', 2: 'Tỉnh Hà Giang', 4: 'Tỉnh Cao Bằng',
  6: 'Tỉnh Bắc Kạn', 8: 'Tỉnh Tuyên Quang', 10: 'Tỉnh Lào Cai',
  11: 'Tỉnh Điện Biên', 12: 'Tỉnh Lai Châu', 14: 'Tỉnh Sơn La',
  15: 'Tỉnh Yên Bái', 17: 'Tỉnh Hòa Bình', 19: 'Tỉnh Thái Nguyên',
  20: 'Tỉnh Lạng Sơn', 22: 'Tỉnh Quảng Ninh', 24: 'Tỉnh Bắc Giang',
  25: 'Tỉnh Phú Thọ', 26: 'Tỉnh Vĩnh Phúc', 27: 'Tỉnh Bắc Ninh',
  30: 'Tỉnh Hải Dương', 31: 'Thành phố Hải Phòng', 33: 'Tỉnh Hưng Yên',
  34: 'Tỉnh Thái Bình', 35: 'Tỉnh Hà Nam', 36: 'Tỉnh Nam Định',
  37: 'Tỉnh Ninh Bình', 38: 'Tỉnh Thanh Hóa', 40: 'Tỉnh Nghệ An',
  42: 'Tỉnh Hà Tĩnh', 44: 'Tỉnh Quảng Bình', 45: 'Tỉnh Quảng Trị',
  46: 'Tỉnh Thừa Thiên Huế', 48: 'Thành phố Đà Nẵng', 49: 'Tỉnh Quảng Nam',
  51: 'Tỉnh Quảng Ngãi', 52: 'Tỉnh Bình Định', 54: 'Tỉnh Phú Yên',
  56: 'Tỉnh Khánh Hòa', 58: 'Tỉnh Ninh Thuận', 60: 'Tỉnh Bình Thuận',
  62: 'Tỉnh Kon Tum', 64: 'Tỉnh Gia Lai', 66: 'Tỉnh Đắk Lắk',
  67: 'Tỉnh Đắk Nông', 68: 'Tỉnh Lâm Đồng', 70: 'Tỉnh Bình Phước',
  72: 'Tỉnh Tây Ninh', 74: 'Tỉnh Bình Dương', 75: 'Tỉnh Đồng Nai',
  77: 'Tỉnh Bà Rịa - Vũng Tàu', 79: 'Thành phố Hồ Chí Minh', 80: 'Tỉnh Long An',
  82: 'Tỉnh Tiền Giang', 83: 'Tỉnh Bến Tre', 84: 'Tỉnh Trà Vinh',
  86: 'Tỉnh Vĩnh Long', 87: 'Tỉnh Đồng Tháp', 89: 'Tỉnh An Giang',
  91: 'Tỉnh Kiên Giang', 92: 'Thành phố Cần Thơ', 93: 'Tỉnh Hậu Giang',
  94: 'Tỉnh Sóc Trăng', 95: 'Tỉnh Bạc Liêu', 96: 'Tỉnh Cà Mau'
};

const provinces = ref([]);
const wards = ref([]);
const selectedProvinceCode = ref(null);
const selectedWardCode = ref(null);
const oldProvinceName = ref('');
const legacyLookupLoading = ref(false);

import localProvincesData from '../../../../assets/data/vietnam_provinces.json';

const newAddress = computed(() => {
  return [
    customerForm.street_address,
    customerForm.ward,
    customerForm.province,
    customerForm.country
  ].filter(Boolean).join(', ');
});

const fetchProvinces = async () => {
  provinces.value = localProvincesData;
};

const onProvinceChange = (code) => {
  const found = provinces.value.find(p => p.Code === code);
  customerForm.province = found ? found.FullName : '';
  customerForm.ward = '';
  selectedWardCode.value = null;
  wards.value = found ? found.Wards : [];
  oldProvinceName.value = '';
};

// Look up legacy (pre-2025) province using Provinces Open API V2
const onWardChange = async (wardCode) => {
  if (!wardCode) {
    customerForm.ward = '';
    oldProvinceName.value = '';
    return;
  }

  // Set ward name from the selected code
  const wardObj = wards.value.find(w => w.Code === wardCode);
  customerForm.ward = wardObj ? wardObj.FullName : '';

  // Call API V2 to get legacy wards (pre-2025)
  legacyLookupLoading.value = true;
  oldProvinceName.value = '';
  try {
    const legacyRes = await fetch(`${PROVINCES_API_V2}/w/${wardCode}/to-legacies/`);
    if (!legacyRes.ok) throw new Error('Legacy lookup failed');
    const legacies = await legacyRes.json();

    if (Array.isArray(legacies) && legacies.length > 0) {
      // province_code here is the OLD (pre-2025) province code
      // Use local map to look up the old province name - do NOT call /p/{code}
      // because API V2 only knows new 34 provinces, not old 63
      const legacyProvinceCode = legacies[0].province_code;
      oldProvinceName.value = OLD_PROVINCE_CODE_MAP[legacyProvinceCode] || customerForm.province;
    } else {
      // Ward has no legacy data (newly created ward with no direct mapping)
      oldProvinceName.value = customerForm.province;
    }
  } catch (err) {
    console.error('[Address] Legacy province lookup error:', err);
    oldProvinceName.value = customerForm.province;
  } finally {
    legacyLookupLoading.value = false;
  }
};

const preloadAddressDropdowns = async (row) => {
  await fetchProvinces();
  if (!row) {
    selectedProvinceCode.value = null;
    selectedWardCode.value = null;
    customerForm.ward = '';
    wards.value = [];
    oldProvinceName.value = '';
    return;
  }

  // Determine province name to restore
  const searchProvinceName = row.province || row.province_name || customerForm.province || '';
  const wardName = row.ward || row.ward_name || '';

  // Find province in new list
  const cleanProv = searchProvinceName.replace(/^(Tỉnh|Thành phố|TP\.)\s+/i, '').trim().toLowerCase();
  const prov = provinces.value.find(p => {
    const pName = p.FullName.replace(/^(Tỉnh|Thành phố|TP\.)\s+/i, '').trim().toLowerCase();
    return pName === cleanProv;
  });

  if (prov) {
    selectedProvinceCode.value = prov.Code;
    onProvinceChange(prov.Code);

    // Find ward by name in the ward list to get its code
    const cleanWard = wardName.replace(/^(Phường|Xã|Thị trấn)\s+/i, '').trim().toLowerCase();
    const wardObj = wards.value.find(w => {
      const wName = w.FullName.replace(/^(Phường|Xã|Thị trấn)\s+/i, '').trim().toLowerCase();
      return wName === cleanWard;
    });

    if (wardObj) {
      selectedWardCode.value = wardObj.Code;
      await onWardChange(wardObj.Code);
    } else {
      // Ward name exists but not found in list → just display it without legacy lookup
      customerForm.ward = wardName;
      selectedWardCode.value = null;
      oldProvinceName.value = row.address_detail ? row.address_detail.split(',').map(p => p.trim())[2] || '' : '';
    }
  } else {
    selectedProvinceCode.value = null;
    selectedWardCode.value = null;
    customerForm.ward = '';
    wards.value = [];
    oldProvinceName.value = '';
  }
};

const currentPage = ref(1);
const pageSize = ref(10);
const paginatedCustomers = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  const end = start + pageSize.value;
  return customers.value.slice(start, end);
});

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
  district: '',
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
    staffOptions.value = raw.filter(user => user.is_active !== false && user.role_id !== 6 && user.role_id !== 4);
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
  searchInputRef.value?.saveSearch(searchQuery.value);
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

const openDialog = async (row) => {
  if (row) {
    let targetRow = row;
    if (row.customer_code) {
      try {
        const res = await api.get(`/api/customers/code/${row.customer_code}`);
        if (res.data) {
          targetRow = res.data;
        }
      } catch (err) {
        console.error('Lỗi khi lấy thông tin chi tiết khách hàng:', err);
      }
    }
    
    Object.assign(customerForm, {
      id: targetRow.customer_id || targetRow.id,
      customer_code: targetRow.customer_code,
      customer_type: targetRow.customer_type === 'COMPANY' ? 'COMPANY' : 'PERSONAL',
      status: targetRow.status || 'ACTIVE',
      staff_in_charge_id: targetRow.staff_in_charge_id || null,
      policy_id: targetRow.policy_id || null,
      name: targetRow.transaction_name || targetRow.name || '',
      company_name: targetRow.company_name || '',
      representative_name: targetRow.representative_name || '',
      tax_code: targetRow.tax_code || '',
      phone: targetRow.phone || '',
      email: targetRow.email || '',
      address: targetRow.address || '',
      address_detail: targetRow.address_detail || '',
      country: targetRow.country || 'Việt Nam',
      province: targetRow.province || targetRow.province_name || '',
      district: '',
      ward: targetRow.ward || targetRow.ward_name || '',
      street_address: targetRow.street_address || '',
      bank_name: targetRow.bank_name || '',
      bank_number: targetRow.bank_number || targetRow.account_number || '',
      bank_owner: targetRow.bank_owner || targetRow.account_name || '',
      username: targetRow.account_username || targetRow.username || '',
      password: ''
    });
    await preloadAddressDropdowns(targetRow);
  } else {
    Object.assign(customerForm, {
      id: null, customer_code: '', customer_type: 'PERSONAL', status: 'ACTIVE',
      staff_in_charge_id: isCskh.value ? currentUser.value.user_id : null,
      policy_id: null,
      name: '', company_name: '', representative_name: '', tax_code: '',
      phone: '', email: '', address: '', address_detail: '',
      country: 'Việt Nam', province: '', district: '', ward: '', street_address: '',
      bank_name: '', bank_number: '', bank_owner: '',
      username: '', password: ''
    });
    await preloadAddressDropdowns(null);
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
          address: newAddress.value,
          // Full delivery address (used by waybills, shipping carriers)
          address_detail: newAddress.value,
          // Old province name before 2025 merger (used for vehicle sorting/bagging)
          old_province: oldProvinceName.value || '',
          province_name: customerForm.province,
          ward_name: customerForm.ward
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
  fetchProvinces();
  if (canManageAssignment.value && activeTab.value === 'unassigned') {
    fetchUnassignedCustomers();
  }
});

watch(() => route.query.mine, () => {
  fetchData();
});
</script>

<style scoped src="@/styles/admin/customers/CustomerList.css"></style>
