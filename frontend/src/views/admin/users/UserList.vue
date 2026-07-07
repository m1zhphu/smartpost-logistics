<template>
  <div class="modern-user-management">
    <div class="page-container">
      
      <!-- Header Section -->
      <header class="page-header animate-fade-in">
        <div class="header-content">
          <div class="title-wrapper">
            <div class="icon-box primary">
              <el-icon><UserFilled /></el-icon>
            </div>
            <div>
              <h2 class="page-title">Quản lý Nhân sự</h2>
              <p class="page-subtitle">Hệ thống phân quyền: Quản trị viên, Quản lý, Kho, Bưu tá, Kế toán, CSKH</p>
            </div>
          </div>
        </div>
        <div class="header-actions">
          <button class="btn-primary" @click="openDialog(null)">
            <el-icon><Plus /></el-icon>
            <span>Thêm Nhân viên</span>
          </button>
        </div>
      </header>

      <!-- Advanced Filter Section (Frontend Reactive) -->
      <div class="content-card filter-card animate-fade-in mb-24">
        <el-alert
          v-if="isMyShippersView"
          title="Đang hiển thị danh sách bưu tá do bạn phụ trách"
          type="success"
          :closable="false"
          class="mb-12"
        />
        <el-row :gutter="20" class="filter-row">
          <el-col :xs="24" :sm="12" :lg="6" class="filter-col">
            <div class="filter-label">Tìm kiếm trực tiếp</div>
            <el-input 
              v-model="filter.query" 
              placeholder="Tên, SĐT, Username..." 
              clearable 
              class="modern-input"
            >
              <template #prefix><el-icon><Search /></el-icon></template>
            </el-input>
          </el-col>
          
          <el-col :xs="24" :sm="12" :lg="5" class="filter-col">
            <div class="filter-label">Chức vụ</div>
            <el-select v-model="filter.role_id" placeholder="Tất cả chức vụ" clearable class="w-full modern-select">
              <el-option label="Quản trị hệ thống" :value="1" />
              <el-option label="Quản lý bưu cục" :value="2" />
              <el-option label="Nhân viên kho" :value="3" />
              <el-option label="Bưu tá" :value="4" />
              <el-option label="Kế toán" :value="5" />
              <el-option label="CSKH" :value="7" />
            </el-select>
          </el-col>
          
          <el-col :xs="24" :sm="12" :lg="5" class="filter-col">
            <div class="filter-label">Bưu cục trực thuộc</div>
            <el-select v-model="filter.hub_id" placeholder="Tất cả bưu cục" clearable class="w-full modern-select">
              <el-option v-for="hub in hubs" :key="hub.hub_id" :label="hub.hub_name" :value="hub.hub_id" />
            </el-select>
          </el-col>
          
          <el-col :xs="24" :sm="24" :lg="8" class="filter-action-col">
             <button class="btn-secondary w-full" @click="resetFilters">
               <el-icon><RefreshRight /></el-icon> Xóa bộ lọc
             </button>
             <button class="btn-primary w-full" @click="fetchData">
               <el-icon><Refresh /></el-icon> Làm mới dữ liệu
             </button>
          </el-col>
        </el-row>
      </div>

      <!-- ===== DESKTOP TABLE (ẩn trên mobile) ===== -->
      <div class="content-card table-wrapper animate-fade-in-up desktop-only">
        <el-table 
          :data="paginatedUsers" 
          v-loading="loading" 
          class="modern-table"
          row-class-name="modern-row"
          style="width: 100%"
        >
          <!-- Thông tin nhân sự -->
          <el-table-column label="Thông tin nhân viên" min-width="250">
            <template #default="{ row }">
              <div class="user-profile">
                <div class="avatar-circle" :class="getRoleTypeClass(getRoleType(row.role_id))">
                  {{ getInitials(row.full_name) }}
                </div>
                <div class="user-details">
                  <div class="flex-align-center">
                    <span class="fw-bold text-dark">{{ row.full_name }}</span>
                  </div>
                  <span class="text-xs text-muted">
                    <el-icon class="mr-1"><Message /></el-icon>{{ row.email || 'Chưa cập nhật email' }}
                  </span>
                </div>
              </div>
            </template>
          </el-table-column>

          <!-- Chức vụ -->
          <el-table-column label="Chức vụ" min-width="160">
            <template #default="{ row }">
              <div class="modern-tag" :class="'tag-' + getRoleType(row.role_id)">
                <span class="dot"></span>
                {{ getRoleName(row.role_id) }}
              </div>
            </template>
          </el-table-column>

          <!-- Điện thoại -->
          <el-table-column prop="phone_number" label="Điện thoại" min-width="130">
            <template #default="{ row }">
              <span class="contact-text">
                <el-icon class="mr-1"><Phone /></el-icon>{{ row.phone_number }}
              </span>
            </template>
          </el-table-column>
          
          <!-- Nơi làm việc -->
          <el-table-column label="Nơi làm việc" min-width="180">
             <template #default="{ row }">
                <div class="work-info">
                  <span class="hub-name">
                    <el-icon class="mr-1"><OfficeBuilding /></el-icon>
                    {{ row.primary_hub?.hub_name || 'Hệ thống Trung tâm' }}
                  </span>
                </div>
             </template>
          </el-table-column>

          <!-- Trạng thái -->
          <el-table-column label="Trạng thái" min-width="120" align="center">
             <template #default="{ row }">
                <div class="status-pill" :class="row.is_active ? 'active' : 'locked'">
                   {{ row.is_active ? 'Hoạt động' : 'Tạm khóa' }}
                </div>
             </template>
          </el-table-column>

          <!-- Thao tác -->
          <el-table-column label="Thao tác" width="160" align="center">
            <template #default="{ row }">
              <div class="action-buttons">
                <button class="icon-btn edit" @click="viewStaffDetails(row)" title="Xem chi tiết">
                  <el-icon><InfoFilled /></el-icon>
                </button>
                <button class="icon-btn edit" @click="openDialog(row)" title="Chỉnh sửa">
                  <el-icon><Edit /></el-icon>
                </button>
                
                <button v-if="!row.is_active" class="icon-btn success" @click="toggleStatus(row, true)" title="Mở khóa">
                  <el-icon><Unlock /></el-icon>
                </button>
                <button v-else class="icon-btn warning" @click="toggleStatus(row, false)" title="Khóa tài khoản">
                  <el-icon><Lock /></el-icon>
                </button>
              </div>
            </template>
          </el-table-column>

          <template #empty>
            <el-empty description="Không tìm thấy nhân viên nào phù hợp" :image-size="100" />
          </template>
        </el-table>
        <div style="margin-top: 16px; display: flex; justify-content: flex-end;">
          <el-pagination
            v-model:current-page="currentPage"
            v-model:page-size="pageSize"
            :page-sizes="[10, 20, 50, 100]"
            layout="total, sizes, prev, pager, next, jumper"
            :total="filteredUsers.length"
          />
        </div>
      </div>

      <!-- ===== MOBILE CARD LIST (chỉ hiện trên điện thoại) ===== -->
      <div class="mobile-only" v-loading="loading">
        <el-empty v-if="paginatedUsers.length === 0 && !loading" description="Không tìm thấy nhân viên nào" :image-size="80" />
        <div
          v-for="user in paginatedUsers"
          :key="user.user_id"
          class="mobile-user-card animate-fade-in-up"
        >
          <!-- Header: Avatar + Tên + Badge chức vụ -->
          <div class="muc-header">
            <div class="avatar-circle" :class="getRoleTypeClass(getRoleType(user.role_id))">
              {{ getInitials(user.full_name) }}
            </div>
            <div class="muc-identity">
              <div class="flex-align-center">
                <span class="fw-bold text-dark muc-name">{{ user.full_name }}</span>
              </div>
              <div class="modern-tag" :class="'tag-' + getRoleType(user.role_id)" style="width:fit-content;margin-top:4px;">
                <span class="dot"></span>
                {{ getRoleName(user.role_id) }}
              </div>
            </div>
            <div class="status-pill" :class="user.is_active ? 'active' : 'locked'" style="flex-shrink:0;">
              {{ user.is_active ? 'HĐ' : 'Khóa' }}
            </div>
          </div>

          <!-- Info rows -->
          <div class="muc-info-list">
            <div class="muc-info-row">
              <span class="muc-label">Email</span>
              <span class="muc-value">{{ user.email || 'Chưa cập nhật' }}</span>
            </div>
            <div class="muc-info-row" v-if="user.phone_number">
              <span class="muc-label">SĐT</span>
              <span class="muc-value">
                <el-icon style="font-size:12px;margin-right:4px;"><Phone /></el-icon>
                {{ user.phone_number }}
              </span>
            </div>
            <div class="muc-info-row">
              <span class="muc-label">Bưu cục</span>
              <span class="muc-value">
                <el-icon style="font-size:12px;margin-right:4px;"><OfficeBuilding /></el-icon>
                {{ user.primary_hub?.hub_name || 'Trung tâm HT' }}
              </span>
            </div>
          </div>

          <!-- Footer: Thao tác -->
          <div class="muc-footer">
            <button class="icon-btn edit" @click="viewStaffDetails(user)" title="Xem chi tiết">
              <el-icon><InfoFilled /></el-icon>
            </button>
            <button class="icon-btn edit" @click="openDialog(user)" title="Chỉnh sửa">
              <el-icon><Edit /></el-icon>
            </button>
            <button v-if="!user.is_active" class="icon-btn success" @click="toggleStatus(user, true)" title="Mở khóa">
              <el-icon><Unlock /></el-icon>
            </button>
            <button v-else class="icon-btn warning" @click="toggleStatus(user, false)" title="Khóa tài khoản">
              <el-icon><Lock /></el-icon>
            </button>
          </div>
        </div>

        <!-- Pagination mobile -->
        <div v-if="filteredUsers.length > pageSize" class="muc-pagination">
          <el-pagination
            v-model:current-page="currentPage"
            v-model:page-size="pageSize"
            layout="prev, pager, next"
            :total="filteredUsers.length"
            small
          />
        </div>
      </div>

      <!-- Modern Dialog Form (Giữ nguyên) -->
      <el-dialog 
        v-model="dialogVisible" 
        :title="userForm.user_id ? 'Hiệu chỉnh nhân sự' : 'Đăng ký nhân viên mới'" 
        width="700px"
        class="modern-dialog"
        destroy-on-close
      >
        <el-form :model="userForm" :rules="rules" ref="formRef" label-position="top" class="modern-form">
          <div class="form-section-title">Thông tin tài khoản</div>
          <el-row :gutter="24">
            <el-col :span="12">
              <el-form-item label="Tên đăng nhập" prop="username">
                <el-input v-model="userForm.username" placeholder="vd: tung_shipper" :disabled="!!userForm.user_id">
                  <template #prefix><el-icon><User /></el-icon></template>
                </el-input>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="Mật khẩu" :prop="userForm.user_id ? '' : 'password'">
                <el-input 
                  v-model="userForm.password" 
                  type="password" 
                  :placeholder="userForm.user_id ? 'Bỏ trống nếu giữ nguyên' : 'Tối thiểu 6 ký tự'" 
                  show-password 
                >
                  <template #prefix><el-icon><Key /></el-icon></template>
                </el-input>
              </el-form-item>
            </el-col>
          </el-row>

          <div class="form-section-title mt-4">Thông tin cá nhân</div>
          <el-row :gutter="24">
            <el-col :span="12">
              <el-form-item label="Họ và tên nhân viên" prop="full_name">
                <el-input v-model="userForm.full_name" placeholder="Nguyễn Văn A" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="Số điện thoại liên hệ" prop="phone_number">
                <el-input v-model="userForm.phone_number" placeholder="09xxxxxxx">
                  <template #prefix><el-icon><Phone /></el-icon></template>
                </el-input>
              </el-form-item>
            </el-col>
          </el-row>

          <el-form-item label="Email công việc" prop="email">
             <el-input v-model="userForm.email" placeholder="nv.a@smartpost.vn">
                <template #prefix><el-icon><Message /></el-icon></template>
             </el-input>
          </el-form-item>

          <div class="form-section-title mt-4">Thông tin công tác</div>
          <el-row :gutter="24">
            <el-col :span="12">
              <el-form-item label="Vai trò / Chức vụ" prop="role_id">
                <el-select v-model="userForm.role_id" class="w-full" placeholder="Chọn vị trí công tác">
                  <el-option v-if="userForm.role_id === 1" label="Quản trị hệ thống" :value="1" />
                  <el-option label="Quản lý bưu cục" :value="2" />
                  <el-option label="Nhân viên kho" :value="3" />
                  <el-option label="Bưu tá" :value="4" />
                  <el-option label="Kế toán bưu cục" :value="5" />
                  <el-option label="CSKH" :value="7" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="Bưu cục trực thuộc" prop="primary_hub_id">
                <el-select v-model="userForm.primary_hub_id" class="w-full" placeholder="Chọn kho làm việc" @change="syncPrimaryHubAccess">
                  <el-option v-for="hub in hubs" :key="hub.hub_id" :label="hub.hub_name" :value="hub.hub_id" />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
          
          <el-form-item label="Bưu cục được phép truy cập" prop="accessible_hub_ids">
            <el-select
              v-model="userForm.accessible_hub_ids"
              multiple
              filterable
              collapse-tags
              collapse-tags-tooltip
              class="w-full"
              placeholder="Chọn một hoặc nhiều bưu cục"
            >
              <el-option v-for="hub in hubs" :key="hub.hub_id" :label="hub.hub_name" :value="hub.hub_id" />
            </el-select>
          </el-form-item>

          <el-collapse-transition>
            <el-form-item v-if="userForm.role_id === 4" label="Biển số xe công tác" prop="vehicle_plate">
               <el-input v-model="userForm.vehicle_plate" placeholder="VD: 29A-888.88">
                 <template #prefix><el-icon><Van /></el-icon></template>
               </el-input>
            </el-form-item>
          </el-collapse-transition>
          <el-collapse-transition>
            <el-form-item v-if="userForm.role_id === 4" label="CSKH quản lý bưu tá" prop="managed_by_cskh_id">
              <el-select 
                v-model="userForm.managed_by_cskh_id" 
                filterable 
                clearable 
                class="w-full" 
                placeholder="Chọn CSKH phụ trách"
                :popper-append-to-body="true"
                no-data-text="Chưa có nhân viên CSKH nào"
              >
                <el-option
                  v-for="cskh in cskhOptions"
                  :key="cskh.user_id"
                  :label="cskh.full_name ? `${cskh.full_name} (${cskh.username})` : cskh.username"
                  :value="cskh.user_id"
                />
              </el-select>
            </el-form-item>
          </el-collapse-transition>
        </el-form>

        <template #footer>
          <div class="dialog-footer-actions">
            <button class="btn-secondary" @click="dialogVisible = false">Hủy bỏ</button>
            <button class="btn-primary" @click="handleSave" :disabled="saveLoading">
              <el-icon class="is-loading mr-2" v-if="saveLoading"><Loading /></el-icon>
              <span>{{ saveLoading ? 'Đang lưu...' : 'Lưu thông tin' }}</span>
            </button>
          </div>
        </template>
      </el-dialog>

      <!-- Drawer Xem chi tiết Nhân viên -->
      <el-drawer
        v-model="detailDrawerVisible"
        title="Chi tiết Nhân viên"
        size="550px"
        class="modern-detail-drawer"
        destroy-on-close
      >
        <template #header>
          <div class="drawer-header-content">
            <div class="drawer-title-wrapper">
              <div class="avatar-circle large" :class="getRoleTypeClass(getRoleType(selectedUser?.role_id))">
                {{ selectedUser ? getInitials(selectedUser.full_name) : '' }}
              </div>
              <div>
                <h3 class="drawer-main-title">{{ selectedUser?.full_name }}</h3>
                <span class="username-badge">@{{ selectedUser?.username }}</span>
              </div>
            </div>
          </div>
        </template>

        <div v-if="selectedUser" class="drawer-body-details">
          <!-- Section: Thông tin chung -->
          <div class="detail-section">
            <h4 class="section-subtitle">Thông tin Chung</h4>
            <div class="detail-grid">
              <div class="detail-item">
                <span class="detail-label">Họ và tên</span>
                <span class="detail-value">{{ selectedUser.full_name }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Trạng thái tài khoản</span>
                <span class="detail-value">
                  <el-tag :type="selectedUser.is_active ? 'success' : 'danger'" size="small">
                    {{ selectedUser.is_active ? 'Đang hoạt động' : 'Tạm khóa' }}
                  </el-tag>
                </span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Số điện thoại</span>
                <span class="detail-value">{{ selectedUser.phone_number || '—' }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Email công việc</span>
                <span class="detail-value">{{ selectedUser.email || '—' }}</span>
              </div>
            </div>
          </div>

          <!-- Section: Chức vụ & Tài khoản -->
          <div class="detail-section">
            <h4 class="section-subtitle">Tài khoản & Vai trò</h4>
            <div class="detail-grid">
              <div class="detail-item">
                <span class="detail-label">Tên đăng nhập</span>
                <span class="detail-value fw-bold">@{{ selectedUser.username }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Chức vụ / Vai trò</span>
                <span class="detail-value">
                  <el-tag :type="getRoleType(selectedUser.role_id) === 'primary' ? 'primary' : 'warning'" size="small" effect="plain">
                    {{ getRoleName(selectedUser.role_id) }}
                  </el-tag>
                </span>
              </div>
              <div class="detail-item" v-if="selectedUser.role_id === 4">
                <span class="detail-label">CSKH Quản lý bưu tá</span>
                <span class="detail-value fw-bold text-primary">{{ selectedUser.managed_by_cskh?.full_name || 'Chưa gán' }}</span>
              </div>
            </div>
          </div>

          <!-- Section: Nơi làm việc & Phân quyền -->
          <div class="detail-section">
            <h4 class="section-subtitle">Nơi làm việc & Phân quyền bưu cục</h4>
            <div class="detail-grid">
              <div class="detail-item">
                <span class="detail-label">Bưu cục làm việc chính</span>
                <span class="detail-value">{{ selectedUser.primary_hub?.hub_name || 'Hệ thống Trung tâm' }}</span>
              </div>
              <div class="detail-item" v-if="selectedUser.role_id === 4 && selectedUser.vehicle_plate">
                <span class="detail-label">Biển số xe công tác</span>
                <span class="detail-value fw-bold text-warning">{{ selectedUser.vehicle_plate }}</span>
              </div>
              <div class="detail-item full-width" v-if="selectedUser.accessible_hubs?.length">
                <span class="detail-label">Các bưu cục được phép truy cập dữ liệu</span>
                <span class="detail-value">{{ formatAccessibleHubs(selectedUser) }}</span>
              </div>
            </div>
          </div>
        </div>

        <template #footer>
          <div class="drawer-footer-actions">
            <button class="btn-secondary" @click="detailDrawerVisible = false">Đóng</button>
            <button class="btn-primary" @click="detailDrawerVisible = false; openDialog(selectedUser)">
              <el-icon><Edit /></el-icon>
              <span>Chỉnh sửa nhân sự</span>
            </button>
          </div>
        </template>
      </el-drawer>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue';
import { 
  Plus, Edit, Search, Unlock, Lock, Van, 
  UserFilled, RefreshRight, Refresh, Message, Phone, OfficeBuilding, User, Key, Loading, InfoFilled
} from '@element-plus/icons-vue';
import api from '@/api/axios';
import { ElMessage, ElMessageBox } from 'element-plus';
import { useRoute } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const route = useRoute();
const authStore = useAuthStore();
const currentUser = computed(() => authStore.user || {});
const isMyShippersView = computed(() => currentUser.value?.role_id === 7 && (route.query.my_shippers === '1' || route.query.my_shippers === 'true'));
const isProtectedUser = (row) => row?.role_id === 1 || row?.user_id === currentUser.value?.user_id;

const loading = ref(false);
const saveLoading = ref(false);
const dialogVisible = ref(false);
const detailDrawerVisible = ref(false);
const selectedUser = ref(null);

const viewStaffDetails = (row) => {
  selectedUser.value = row;
  detailDrawerVisible.value = true;
};
const formRef = ref(null);

// CHÚ Ý: Biến allUsers lưu toàn bộ dữ liệu gốc kéo từ server
const allUsers = ref([]);
const hubs = ref([]);

const cskhOptions = computed(() => allUsers.value.filter(user => user.role_id === 7 && user.is_active !== false));

const filter = reactive({
  query: '',
  role_id: null,
  hub_id: null,
  is_online: null
});

const currentPage = ref(1);
const pageSize = ref(10);
const paginatedUsers = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  const end = start + pageSize.value;
  return filteredUsers.value.slice(start, end);
});

watch(filter, () => {
  currentPage.value = 1;
}, { deep: true });

// LOGIC MỚI: Xử lý lọc dữ liệu trực tiếp ở Frontend
const filteredUsers = computed(() => {
  return allUsers.value.filter(user => {
    // 1. Kiểm tra text (tên, username, số điện thoại)
    let matchQuery = true;
    if (filter.query) {
      const q = filter.query.toLowerCase();
      const username = (user.username || '').toLowerCase();
      const fullName = (user.full_name || '').toLowerCase();
      const phone = user.phone_number || '';
      
      matchQuery = username.includes(q) || fullName.includes(q) || phone.includes(q);
    }
    
    // 2. Kiểm tra Role
    let matchRole = true;
    if (filter.role_id) {
      matchRole = user.role_id === filter.role_id;
    }
    
    // 3. Kiểm tra Bưu cục
    let matchHub = true;
    if (filter.hub_id) {
      // Đề phòng API trả về primary_hub_id trực tiếp hoặc lồng trong object
      const userHubId = user.primary_hub_id || user.primary_hub?.hub_id;
      const accessibleHubIds = user.accessible_hub_ids || user.accessible_hubs?.map(hub => hub.hub_id) || [];
      matchHub = userHubId === filter.hub_id || accessibleHubIds.includes(filter.hub_id);
    }
    
    // 4. Kiểm tra Trạng thái online/offline
    let matchOnline = true;
    if (filter.is_online !== null) {
      matchOnline = user.is_online === filter.is_online;
    }
    
    return matchQuery && matchRole && matchHub && matchOnline;
  });
});

const userForm = reactive({
  user_id: null,
  username: '',
  password: '',
  full_name: '',
  email: '',
  phone_number: '',
  role_id: 3, 
  primary_hub_id: null,
  accessible_hub_ids: [],
  managed_by_cskh_id: null,
  vehicle_plate: '',
  is_active: true
});

const rules = {
  username: [{ required: true, message: 'Nhập tên đăng nhập', trigger: 'blur' }],
  full_name: [{ required: true, message: 'Nhập họ tên nhân viên', trigger: 'blur' }],
  password: [{ required: true, message: 'Nhập mật khẩu', trigger: 'blur', min: 6 }], 
  role_id: [{ required: true, message: 'Chọn chức vụ', trigger: 'change' }],
  primary_hub_id: [{ required: true, message: 'Chọn bưu cục làm việc', trigger: 'change' }],
  accessible_hub_ids: [{ required: true, type: 'array', min: 1, message: 'Chọn ít nhất một bưu cục truy cập', trigger: 'change' }]
};

// Khởi tạo Avatar Chữ cái đầu
const getInitials = (name) => {
  if (!name) return 'U';
  const parts = name.trim().split(' ');
  return parts[parts.length - 1].charAt(0).toUpperCase();
};

const syncPrimaryHubAccess = () => {
  if (userForm.primary_hub_id && !userForm.accessible_hub_ids.includes(userForm.primary_hub_id)) {
    userForm.accessible_hub_ids.unshift(userForm.primary_hub_id);
  }
};

const formatAccessibleHubs = (row) => {
  const hubsList = row.accessible_hubs || [];
  if (!hubsList.length) return row.primary_hub?.hub_name || '---';
  return hubsList.map(hub => hub.hub_name).join(', ');
};

const getRoleTypeClass = (type) => {
  const map = {
    'danger': 'bg-danger',
    'primary': 'bg-primary',
    'info': 'bg-info',
    'warning': 'bg-warning',
    'success': 'bg-success',
    'cskh': 'bg-primary'
  };
  return map[type] || 'bg-info';
};

const fetchData = async () => {
  loading.value = true;
  try {
    const usersRequest = isMyShippersView.value
      ? api.get('/api/users/my-shippers')
      : api.get('/api/users');
    const [usersRes, hubsRes] = await Promise.all([
      // LOẠI BỎ params: filter ở đây để kéo toàn bộ dữ liệu về một lần
      usersRequest,
      api.get('/api/hubs')
    ]);
    
    allUsers.value = Array.isArray(usersRes.data) ? usersRes.data : (usersRes.data.items || usersRes.data.data || []);
    hubs.value = Array.isArray(hubsRes.data) ? hubsRes.data : (hubsRes.data.items || hubsRes.data.data || []);
  } catch (err) {
    ElMessage.error('Không thể kết nối máy chủ để lấy dữ liệu nhân sự');
  } finally {
    loading.value = false;
  }
};

const resetFilters = () => {
  filter.query = '';
  filter.role_id = null;
  filter.hub_id = null;
  filter.is_online = null;
  // Bỏ fetchData() ở đây vì filteredUsers sẽ tự phản ứng tức thời
};

const openDialog = (row) => {
  if (row) {
    Object.assign(userForm, {
      user_id: row.user_id,
      username: row.username,
      password: '', 
      full_name: row.full_name,
      email: row.email,
      phone_number: row.phone_number,
      role_id: row.role_id,
      primary_hub_id: row.primary_hub_id || row.primary_hub?.hub_id, // Lấy cẩn thận ID
      accessible_hub_ids: row.accessible_hub_ids?.length
        ? [...row.accessible_hub_ids]
        : [row.primary_hub_id || row.primary_hub?.hub_id].filter(Boolean),
      managed_by_cskh_id: row.managed_by_cskh_id || row.managed_by_cskh?.user_id || null,
      vehicle_plate: row.vehicle_plate || '',
      is_active: row.is_active
    });
    rules.password[0].required = false; 
  } else {
    Object.assign(userForm, {
      user_id: null,
      username: '',
      password: '',
      full_name: '',
      email: '',
      phone_number: '',
      role_id: 3,
      primary_hub_id: null,
      accessible_hub_ids: [],
      managed_by_cskh_id: null,
      vehicle_plate: '',
      is_active: true
    });
    rules.password[0].required = true;
  }
  dialogVisible.value = true;
};

const handleSave = async () => {
  if (!formRef.value) return;
  await formRef.value.validate(async (valid) => {
    if (valid) {
      saveLoading.value = true;
      try {
        const payload = { ...userForm };
        if (payload.primary_hub_id && !payload.accessible_hub_ids.includes(payload.primary_hub_id)) {
          payload.accessible_hub_ids = [payload.primary_hub_id, ...payload.accessible_hub_ids];
        }
        if (payload.role_id !== 4) {
          payload.managed_by_cskh_id = null;
        }
        if (!userForm.user_id && payload.role_id === 1) {
          ElMessage.warning('Hệ thống chỉ được có 1 tài khoản Super Admin');
          saveLoading.value = false;
          return;
        }
        const originalUser = allUsers.value.find(u => u.user_id === userForm.user_id);
        if (originalUser?.role_id === 1 && payload.role_id !== 1) {
          ElMessage.warning('Không được hạ quyền tài khoản Super Admin cao nhất');
          saveLoading.value = false;
          return;
        }
        
        if (payload.user_id && !payload.password) delete payload.password;
        delete payload.user_id; 

        if (userForm.user_id) {
          await api.put(`/api/users/${userForm.user_id}`, payload);
          ElMessage.success('Đã cập nhật thông tin nhân viên');
        } else {
          await api.post('/api/users', payload);
          ElMessage.success('Đã tạo tài khoản nhân viên mới');
        }
        
        dialogVisible.value = false;
        fetchData(); // Lưu thành công thì tải lại DB mới nhất
      } catch (err) {
        let errorMessage = 'Lỗi khi lưu dữ liệu';
        
        if (err.response?.status === 422) {
          const details = err.response.data.detail;
          if (Array.isArray(details) && details.length > 0) {
            const fieldName = details[0].loc[details[0].loc.length - 1] || 'Dữ liệu';
            errorMessage = `Lỗi ô "${fieldName}": ${details[0].msg}`;
          }
        } else {
          errorMessage = err.response?.data?.detail || errorMessage;
        }

        ElMessage.error(errorMessage);
      } finally {
        saveLoading.value = false;
      }
    }
  });
};

const toggleStatus = async (row, status) => {
  if (!status && isProtectedUser(row)) {
     ElMessage.warning('Không được khóa tài khoản Super Admin hoặc tài khoản đang đăng nhập');
     return;
  }
  try {
     await api.patch(`/api/users/${row.user_id}/status`, { is_active: status });
     row.is_active = status;
     ElMessage.success(status ? 'Đã mở khóa tài khoản' : 'Đã tạm dừng tài khoản');
     
     // Cập nhật ngầm trong mảng gốc để data table không bị chớp
     const index = allUsers.value.findIndex(u => u.user_id === row.user_id);
     if (index !== -1) allUsers.value[index].is_active = status;

  } catch (err) {
     ElMessage.error('Thao tác trạng thái thất bại');
  }
};

const handleDelete = (row) => {
  if (isProtectedUser(row)) {
    ElMessage.warning('Không được xóa tài khoản Super Admin hoặc tài khoản đang đăng nhập');
    return;
  }
  ElMessageBox.confirm(
    `Vô hiệu hóa hoàn toàn nhân sự <strong>${row.full_name}</strong> khỏi hệ thống?`, 
    'Xác nhận vô hiệu hóa', 
    {
      confirmButtonText: 'Đồng ý',
      cancelButtonText: 'Hủy',
      type: 'error',
      dangerouslyUseHTMLString: true,
      customClass: 'modern-message-box'
    }
  ).then(async () => {
    try {
      await api.delete(`/api/users/${row.user_id}`);
      ElMessage.success('Đã xóa nhân viên khỏi danh sách hoạt động');
      fetchData();
    } catch (err) {
      ElMessage.error('Không thể xóa nhân viên này');
    }
  }).catch(() => {});
};

const getRoleType = (id) => {
  const map = {
    1: 'danger',  // Admin
    2: 'primary', // Manager
    3: 'info',    // Warehouse
    4: 'warning', // Shipper
    5: 'success', // Accountant
    7: 'cskh'     // CSKH
  };
  return map[id] || 'info';
};

const getRoleName = (id) => {
  const map = {
    1: 'Quản trị hệ thống',
    2: 'Quản lý bưu cục',
    3: 'Nhân viên kho',
    4: 'Bưu tá',
    5: 'Kế toán',
    7: 'CSKH'
  };
  return map[id] || 'N/A';
};

onMounted(fetchData);

watch(() => filter.role_id, (newVal) => {
  if (newVal !== 4) {
    filter.is_online = null;
  }
});

watch(() => route.query.my_shippers, () => {
  fetchData();
});

watch(() => userForm.role_id, (roleId) => {
  if (!userForm.user_id && roleId === 1) {
    userForm.role_id = 3;
    ElMessage.warning('Không được tạo nhân sự với quyền Quản trị hệ thống');
  }
});
</script>

<style scoped src="@/styles/admin/users/UserList.css"></style>

<style scoped>
.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
}
.status-dot.online {
  background-color: #67c23a;
  box-shadow: 0 0 0 2px rgba(103, 194, 58, 0.2);
}
.status-dot.offline {
  background-color: #909399;
  box-shadow: 0 0 0 2px rgba(144, 147, 153, 0.2);
}
.ml-8 {
  margin-left: 8px;
}
.flex-align-center {
  display: inline-flex;
  align-items: center;
}
</style>
