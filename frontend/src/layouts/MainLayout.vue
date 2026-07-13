<template>
  <el-container class="modern-layout-container" :class="{ 'sidebar-collapsed': isSidebarCollapsed }">
    <!-- Sidebar -->
    <div class="primary-sidebar">
      <div class="logo-mini" @click="$router.push('/admin/dashboard')" style="cursor: pointer;">
        <img src="@/assets/CompanyLogo4.png" alt="SpeedLight" class="logo-icon-img" />
      </div>
      
      <el-menu
        :default-active="route.path"
        class="modern-el-menu"
        :collapse="isSidebarCollapsed"
        router
        unique-opened
        @select="handleMenuSelect"
      >
        <template v-for="menu in menuData" :key="menu.id">
          <!-- Item without children -->
          <el-menu-item v-if="!menu.children" :index="menu.path">
            <el-icon :size="22"><component :is="menu.icon" /></el-icon>
            <template #title>{{ menu.label }}</template>
          </el-menu-item>
          
          <!-- Item with children -->
          <el-sub-menu v-else :index="menu.id">
            <template #title>
              <el-icon :size="22"><component :is="menu.icon" /></el-icon>
              <span>{{ menu.label }}</span>
            </template>
            
            <template v-for="(group, idx) in menu.children" :key="idx">
              <el-menu-item-group>
                <template #title>
                  <span class="group-title">{{ group.title }}</span>
                </template>
                <el-menu-item 
                  v-for="item in group.items" 
                  :key="item.path" 
                  :index="item.path"
                >
                  <span class="item-dot"></span>
                  {{ item.label }}
                </el-menu-item>
              </el-menu-item-group>
            </template>
          </el-sub-menu>
        </template>
      </el-menu>
    </div>

    <el-container class="main-wrapper">
      <!-- Topbar -->
      <el-header class="modern-header">
        <div class="header-left">
          <button class="hamburger-btn" @click="toggleSidebar">
             <el-icon :size="22"><Fold v-if="!isSidebarCollapsed" /><Expand v-else /></el-icon>
          </button>
          <div class="breadcrumb-info">
             <div class="home-icon-box">
               <el-icon><HomeFilled /></el-icon>
             </div>
             <span class="separator">/</span>
             <span class="page-title">{{ currentPageTitle }}</span>
          </div>
        </div>
        
        <div class="header-right">
          <!-- Bộ chuyển đổi bưu cục (Dành cho Admin và Sub-admin) -->
          <div v-if="showHubSelector" class="hub-selector-wrapper" style="margin-right: 16px;">
            <el-select
              v-model="selectedHub"
              placeholder="Tất cả bưu cục"
              clearable
              filterable
              class="modern-hub-select"
              @change="handleHubChange"
              style="width: 200px;"
            >
              <template #prefix>
                <el-icon><Location /></el-icon>
              </template>
              <el-option
                v-for="hub in hubList"
                :key="hub.hub_id"
                :label="hub.hub_name"
                :value="hub.hub_id"
              />
            </el-select>
          </div>
          
          <!-- Chuông thông báo -->
          <NotificationBell />

          <div class="user-profile-wrapper">
             <el-dropdown trigger="click" placement="bottom-end">
               <div class="user-profile-trigger">
                 <el-avatar :size="40" class="modern-avatar">{{ user?.full_name?.charAt(0) || 'A' }}</el-avatar>
                 <div class="user-display-name">
                    <span class="fw-bold text-dark">{{ user?.full_name || 'Quản trị viên' }}</span>
                    <span class="text-xs text-muted" v-if="activeHubDisplay">
                      <el-icon style="vertical-align: middle; margin-right: 2px;"><Location /></el-icon>
                      <span style="vertical-align: middle;">{{ activeHubDisplay }}</span>
                    </span>
                    <span class="text-xs text-muted" v-else>{{ userRoleLabel }}</span>
                 </div>
                 <el-icon class="dropdown-icon"><ArrowDown /></el-icon>
               </div>
               
               <template #dropdown>
                 <el-dropdown-menu class="modern-dropdown">
                   <div class="dropdown-header">
                      <div class="fw-bold text-dark">{{ user?.full_name || 'Quản trị viên' }}</div>
                      <div class="text-xs text-muted">@{{ user?.username || 'admin' }} <span v-if="activeHubDisplay">| {{ activeHubDisplay }}</span></div>
                   </div>
                   <el-dropdown-item @click="goToProfile">
                      <el-icon><User /></el-icon> Thông tin cá nhân
                   </el-dropdown-item>
                   <el-dropdown-item divided @click="handleLogout" class="text-danger">
                      <el-icon><Close /></el-icon> Đăng xuất
                   </el-dropdown-item>
                 </el-dropdown-menu>
               </template>
             </el-dropdown>
          </div>
        </div>
      </el-header>
      
      <!-- Main Content -->
      <el-main class="main-content">
        <router-view v-slot="{ Component, route }">
          <transition name="fade-slide" mode="out-in">
            <component :is="Component" :key="route.fullPath" />
          </transition>
        </router-view>
      </el-main>
    </el-container>

  </el-container>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import { storeToRefs } from 'pinia';
import api from '@/api/axios';
import { ElMessage } from 'element-plus';
import { 
  Monitor, Management, Document, Box, Bicycle, Money, 
  Close, Search, HomeFilled, ArrowDown, User, Collection, Location, List, TrendCharts, Service, Fold, Expand
} from '@element-plus/icons-vue';
import NotificationBell from '@/components/NotificationBell.vue';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const { user, isAdmin } = storeToRefs(authStore);

const isSidebarCollapsed = ref(true);

const showHubSelector = computed(() => {
  const role = user.value?.role_id;
  return role === 1 || role === 9;
});

const userRoleLabel = computed(() => {
  if (authStore.isCustomer) return 'Khách hàng';
  if (authStore.isAdmin) return 'Quản trị viên';
  const role = user.value?.role_id;
  if (role === 9) return 'Phó Quản trị viên (Sub-admin)';
  if (role === 2) return 'Quản lý bưu cục';
  if (role === 3) return 'Nhân viên kho';
  if (role === 4) return 'Bưu tá (Shipper)';
  if (role === 5) return 'Kế toán';
  if (role === 7) return 'CSKH';
  return 'Nhân viên';
});

const goToProfile = () => {
  if (authStore.isCustomer) {
    router.push('/customer/profile');
  } else {
    router.push('/admin/profile');
  }
};

const toggleSidebar = () => {
  isSidebarCollapsed.value = !isSidebarCollapsed.value;
};

// Đóng menu nổi (tooltip) trên mobile sau khi click chọn
const handleMenuSelect = () => {
  if (isSidebarCollapsed.value) {
    // Giả lập click ra ngoài body để Element Plus tự đóng tooltip của menu con
    setTimeout(() => {
      document.body.click();
    }, 100);
  }
};

// Fetch Hub Name
const userHubName = ref('');
const hubList = ref([]);
const selectedHub = ref(authStore.selectedHubId ? Number(authStore.selectedHubId) : null);

const handleHubChange = (val) => {
  authStore.setSelectedHubId(val);
  ElMessage.success({
    message: val ? `Đã chuyển đổi sang bưu cục: ${hubList.value.find(h => h.hub_id === val)?.hub_name}` : 'Đã quay lại chế độ xem Tất cả bưu cục',
    type: 'success',
    duration: 2000
  });
  setTimeout(() => {
    window.location.reload();
  }, 500);
};

const activeHubDisplay = computed(() => {
  if (showHubSelector.value && selectedHub.value) {
    const activeHub = hubList.value.find(h => h.hub_id === selectedHub.value);
    return activeHub ? activeHub.hub_name : (userHubName.value || 'Đang tải...');
  }
  return userHubName.value;
});

onMounted(async () => {
  if (user.value) {
    try {
      const res = await api.get('/api/auth/me');
      if (res.data?.primary_hub?.hub_name) {
        userHubName.value = res.data.primary_hub.hub_name;
      } else if (res.data?.primary_hub_id) {
         // Fallback if primary_hub object doesn't exist but we have the ID
         const hubRes = await api.get(`/api/hubs`);
         const myHub = hubRes.data.find(h => h.hub_id === res.data.primary_hub_id);
         if (myHub) userHubName.value = myHub.hub_name;
      }

      if (showHubSelector.value) {
        const hubRes = await api.get('/api/hubs');
        hubList.value = hubRes.data || [];
      }
    } catch (e) {
      console.error('Không thể lấy thông tin bưu cục', e);
    }
  }
});

// Menu động dựa vào role_id của user
const menuData = computed(() => {
  const role = user.value?.role_id;
  
  const allMenus = [
    { id: 'dashboard', icon: Monitor, label: 'Bảng điều khiển', path: '/admin/dashboard', roles: [1, 2, 5, 7, 9] },
    { 
      id: 'system', icon: Management, label: 'Hệ thống', roles: [1, 2, 9], // Chỉ Admin
      children: [
        { title: 'HỆ THỐNG', items: [
          { label: 'Bưu cục', path: '/admin/hubs' },
          { label: 'Nhân sự', path: '/admin/users' },
        ]}
      ]
    },
    {
      id: 'customer', icon: User, label: 'Khách hàng', roles: [1, 2, 5, 7, 9], // Admin, Manager, Kế toán, CSKH, Sub-admin
      children: [
        { title: 'KHÁCH HÀNG', items: [
          { label: 'Danh sách khách hàng', path: '/admin/customers' },
        ]},
        { title: 'CHÍNH SÁCH GIÁ', items: [
          { label: 'Cấu hình Giá', path: '/admin/accounting/pricing' }
        ]}
      ]
    },
    {
      id: 'waybill', icon: Document, label: 'Vận đơn', roles: [1, 2, 3, 7, 9], // Admin, Manager, Kho, CSKH, Sub-admin
      children: [
        { title: 'VẬN ĐƠN', items: [
          { label: 'Tạo mới Vận đơn', path: '/admin/waybills/create' },
          { label: 'Gửi thư nội bộ', path: '/admin/waybills/create-internal' },
          { label: 'Tra cứu & Quản lý', path: '/admin/waybills' },
          { label: 'Đơn đã OCR', path: '/admin/waybills/ocr-reviewed' }
        ]}
      ]
    },
    // { id: 'scan-in', icon: Box, label: 'Quét Nhập kho', path: '/admin/warehouse/scan-in', roles: [1, 2, 3] },
    {
      id: 'warehouse', icon: Box, label: 'Kho hàng', roles: [1, 2, 3, 9], // Admin, Manager, Kho, Sub-admin
      children: [
        { title: 'VẬN HÀNH KHO', items: [
          // { label: 'Quét Nhập kho', path: '/admin/warehouse/scan-in' },
          { label: 'Đóng túi', path: '/admin/warehouse/bagging' },
          { label: 'Danh sách túi', path: '/admin/warehouse/bags' },
          { label: 'Túi gom lấy hàng', path: '/admin/warehouse/pickup-bags' },
          { label: 'Lên/Xuống xe', path: '/admin/warehouse/manifest' },
          { label: 'Lịch sử Chuyến xe', path: '/admin/warehouse/manifests' }
        ]}
      ]
    },
    {
      id: 'delivery', icon: Location, label: 'Điều phối', roles: [1, 2, 3, 4, 7, 9], // Admin, Manager, Kho, Shipper, CSKH, Sub-admin
      children: role === 4 ? [
        { title: 'GIAO HÀNG', items: [
          { label: 'Nhiệm vụ của tôi', path: '/admin/delivery/my-tasks' }
        ]}
      ] : [
        { title: 'LẤY HÀNG', items: [
          ...([1, 2, 7, 9].includes(role) ? [{ label: 'Thêm mới yêu cầu', path: '/admin/delivery/pickup-create' }] : []),
          // Tạm ẩn hai menu con cho luồng gán bưu tá trực tiếp
          // ...([1, 7].includes(role) ? [{ label: 'Chờ xác nhận văn phòng', path: '/admin/delivery/pickup-management?tab=pending' }] : []),
          // { label: 'Chờ bưu cục xác nhận', path: '/admin/delivery/pickup-management?tab=dispatch-hub' },
          { label: 'Chờ gán bưu tá', path: '/admin/delivery/pickup-management?tab=received' },
          { label: 'Đang đi lấy', path: '/admin/delivery/pickup-management?tab=assigned' }
        ]},
        { title: 'GIAO HÀNG', items: [
          { label: 'Phân công Shipper', path: '/admin/delivery/assign' }
        ]}
      ]
    },
    {
      id: 'accounting', icon: Money, label: 'Kế toán', roles: [1, 2, 5, 9], // Admin, Manager, Kế toán, Sub-admin
      children: [
        { title: 'KẾ TOÁN', items: [
          { label: 'Tạo Bảng Kê', path: '/admin/accounting/statements' },
          { label: 'Đối soát COD - Shop', path: '/admin/accounting/cod' },
          { label: 'Chốt ca Shipper', path: '/admin/accounting/confirm-cash' }
        ]}
      ]
    },
    {
      id: 'cskh', icon: Service, label: 'CSKH', roles: [1, 2, 3, 5, 7, 9], // Thêm Role 7 (CSKH)
      children: [
        { title: 'TRUNG TÂM CSKH', items: [
          { label: 'Khách hàng tôi quản lý', path: '/admin/customers?mine=1' },
          { label: 'Bưu tá tôi quản lý', path: '/admin/users?my_shippers=1' },
          // Tạm ẩn menu này do trùng lặp với menu Điều phối > Chờ gán bưu tá
          // { label: 'Yêu cầu pickup', path: '/admin/delivery/pickup-management?tab=received' }
          // { label: 'Duyệt Bill & Báo giá', path: '/admin/cskh/verification' },
          // { label: 'Mô phỏng giá cước', path: '/admin/pricing/simulator' }
        ]}
      ]
    },
    {
      id: 'customer_portal', icon: HomeFilled, label: 'Cổng Khách Hàng', roles: [6], // Khách hàng
      children: [
        { title: 'TỔNG QUAN', items: [
          { label: 'Bảng điều khiển', path: '/customer/dashboard' },
        ]},
        { title: 'VẬN ĐƠN', items: [
          { label: 'Tạo yêu cầu lấy hàng', path: '/customer/create' },
          { label: 'Bản nháp', path: '/customer/drafts' },
          { label: 'Hàng chờ tạo đơn', path: '/customer/queue' },
          { label: 'Yêu cầu của tôi', path: '/customer/orders' },
          { label: 'Sổ địa chỉ người nhận', path: '/customer/recipients' },
          { label: 'Quản lý phòng ban', path: '/customer/departments' },
        ]},
        { title: 'TÀI KHOẢN', items: [
          { label: 'Thông tin cá nhân', path: '/customer/profile' },
        ]}
      ]
    }
  ];

  if (!role) return [];
  return allMenus.filter(m => m.roles.includes(role));
});

const currentPageTitle = computed(() => {
  const titleMap = {
    'Dashboard': 'Bảng điều khiển',
    'UserList': 'Quản lý nhân sự',
    'AuditLogs': 'Nhật ký hệ thống',
    'WaybillList': 'Danh sách vận đơn',
    'CreateWaybill': 'Tạo vận đơn',
    'CreateInternalWaybill': 'Gửi thư nội bộ',
    'ScanIn': 'Quét nhập kho',
    'Bagging': 'Đóng túi',
    'ManifestScan': 'Lên/Xuống xe',
    'ManifestList': 'Lịch sử chuyến xe',
    'BagList': 'Danh sách túi hàng',
    'PickupBagList': 'Túi gom lấy hàng',
    'DevelopmentDeliveryReady': 'Đơn chuẩn bị giao',
    'AssignShipper': 'Phân công Shipper',
    'PickupManagement': 'Điều phối lấy hàng',
    'CODTable': 'Đối soát COD - Shop',
    'DebtStatement': 'Tạo Bảng Kê',
    'PricingRules': 'Cấu hình Giá',
    'ConfirmCash': 'Chốt ca Shipper',
    'PriceSimulator': 'Mô phỏng giá cước',
    'ShipperTasks': 'Nhiệm vụ của tôi',
    'ShipperPOD': 'Xác nhận giao hàng (POD)',
    'ServiceConfig': 'Cấu hình dịch vụ',
    'BillVerification': 'Duyệt Bill & Báo giá',
    'CustomerDashboard': 'Bảng điều khiển',
    'CustomerCreatePickup': 'Tạo yêu cầu lấy hàng',
    'CustomerDrafts': 'Bản nháp',
    'CustomerQueue': 'Hàng chờ tạo đơn',
    'CustomerOrders': 'Yêu cầu của tôi',
    'CustomerRecipients': 'Sổ địa chỉ người nhận',
    'CustomerDepartments': 'Quản lý phòng ban',
    'CustomerProfile': 'Thông tin cá nhân'
  };
  return titleMap[route.name] || route.name || 'Bảng điều khiển';
});

const handleLogout = () => {
  authStore.logout();
};

</script>

<style scoped src="@/styles/layouts/MainLayout.css"></style>

<style scoped>
:deep(.modern-hub-select .el-input__wrapper) {
  background: var(--sp-surface, #ffffff);
  backdrop-filter: blur(12px);
  border-radius: 20px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.02) !important;
  border: 1px solid var(--sp-border, #e2e8f0);
  transition: all 0.3s;
}
:deep(.modern-hub-select .el-input__wrapper.is-focus) {
  border-color: var(--sp-primary, #388e3c);
  box-shadow: 0 4px 15px rgba(56, 142, 60, 0.1) !important;
}
:deep(.modern-hub-select .el-input__inner) {
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-weight: 600;
  color: var(--sp-text-main, #1b2559);
}
</style>
