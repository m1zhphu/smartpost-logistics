<template>
  <el-container class="layout-container">
    <!-- Tier 1: Primary Sidebar (Icons only) -->
    <div class="primary-sidebar">
      <div class="logo-mini">
        <div class="logo-icon">SP</div>
      </div>
      
      <div 
        v-for="menu in menuData" 
        :key="menu.id"
        class="menu-item-primary"
        :class="{ active: activePrimaryId === menu.id }"
        @click="handlePrimaryClick(menu)"
      >
        <el-icon :size="22"><component :is="menu.icon" /></el-icon>
        <span class="menu-label">{{ menu.label }}</span>
      </div>
    </div>

    <!-- Tier 2: Secondary Panel (Sub-menus) -->
    <div class="secondary-panel" :class="{ open: isPanelOpen }">
      <div class="panel-header">
        <span class="panel-title">{{ activeMenuData?.label }}</span>
        <el-icon class="close-btn" @click="isPanelOpen = false"><Close /></el-icon>
      </div>
      
      <div class="panel-content">
        <div v-for="(group, idx) in activeMenuData?.children" :key="idx" class="menu-group">
          <div class="group-title">{{ group.title }}</div>
          <div 
            v-for="item in group.items" 
            :key="item.path"
            class="sub-menu-item"
            :class="{ active: $route.path === item.path }"
            @click="navigateTo(item.path)"
          >
            {{ item.label }}
          </div>
        </div>
      </div>
    </div>

    <el-container class="main-wrapper" :class="{ 'panel-expanded': isPanelOpen }">
      <!-- Topbar -->
      <el-header class="header">
        <div class="header-left">
          <div class="breadcrumb-info">
             <el-icon class="home-icon"><HomeFilled /></el-icon>
             <span class="separator">/</span>
             <span class="page-title">{{ currentPageTitle }}</span>
          </div>
        </div>
        
        <div class="header-right">
          <div class="search-box mr-4 hidden-sm-and-down">
             <el-input placeholder="Tìm kiếm nhanh..." prefix-icon="Search" class="misa-search-input" />
          </div>
          
          <div class="user-profile-wrapper">
             <el-avatar :size="32" class="misa-avatar">{{ user?.full_name?.charAt(0) || 'A' }}</el-avatar>
             <span class="user-display-name">
                <b>{{ user?.full_name || 'Quản trị viên' }}</b>
                <small>@{{ user?.username || 'admin' }} • {{ isAdmin ? 'Admin' : 'Nhân viên' }}</small>
             </span>
             <el-dropdown trigger="click">
               <el-icon class="dropdown-trigger"><ArrowDown /></el-icon>
               <template #dropdown>
                 <el-dropdown-menu>
                   <el-dropdown-item @click="handleLogout">Đăng xuất</el-dropdown-item>
                 </el-dropdown-menu>
               </template>
             </el-dropdown>
          </div>
        </div>
      </el-header>
      
      <el-main class="main-content">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import { storeToRefs } from 'pinia';
import { 
  Monitor, Management, Document, Box, Bicycle, Money, 
  Close, Search, HomeFilled, ArrowDown, User, Collection, Location, List, TrendCharts
} from '@element-plus/icons-vue';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const { user, isAdmin } = storeToRefs(authStore);

const isPanelOpen = ref(false);
const activePrimaryId = ref('dashboard');

// Menu động dựa vào role_id của user
const menuData = computed(() => {
  const role = user.value?.role_id;
  
  const allMenus = [
    { id: 'dashboard', icon: Monitor, label: 'Dashboard', path: '/admin/dashboard', roles: [1, 2, 5] },
    { 
      id: 'system', icon: Management, label: 'Hệ thống', roles: [1, 2], // Chỉ Admin
      children: [
        { title: 'HỆ THỐNG', items: [
          { label: 'Bưu cục (Hubs)', path: '/admin/hubs' },
          { label: 'Nhân sự (Staff)', path: '/admin/users' },
        ]}
      ]
    },
    {
      id: 'customer', icon: User, label: 'Khách hàng', roles: [1, 2, 5], // Admin, Manager, Kế toán
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
      id: 'waybill', icon: Document, label: 'Vận đơn', roles: [1, 2, 3], // Admin, Manager, Kho
      children: [
        { title: 'VẬN ĐƠN', items: [
          { label: 'Tạo mới Vận đơn', path: '/admin/waybills/create' },
          { label: 'Tra cứu & Quản lý', path: '/admin/waybills' }
        ]}
      ]
    },
    {
      id: 'warehouse', icon: Box, label: 'Kho hàng', roles: [1, 2, 3], // Admin, Manager, Kho
      children: [
        { title: 'VẬN HÀNH KHO', items: [
          { label: 'Quét Nhập kho', path: '/admin/warehouse/scan-in' },
          { label: 'Đóng túi (Bagging)', path: '/admin/warehouse/bagging' },
          { label: 'Danh sách túi', path: '/admin/warehouse/bags' },
          { label: 'Lên/Xuống xe (Manifest)', path: '/admin/warehouse/manifest' }
        ]}
      ]
    },
    {
      id: 'delivery', icon: Location, label: 'Điều phối', roles: [1, 2, 4], // Admin, Manager, Shipper
      children: [
        { title: 'GIAO HÀNG', items: [
          { label: role === 4 ? 'Nhiệm vụ của tôi' : 'Phân công Shipper', path: role === 4 ? '/admin/delivery/my-tasks' : '/admin/delivery/assign' }
        ]}
      ]
    },
    {
      id: 'accounting', icon: Money, label: 'Kế toán', roles: [1, 2, 5], // Admin, Manager, Kế toán
      children: [
        { title: 'KẾ TOÁN', items: [
          { label: 'Đối soát COD - Shop', path: '/admin/accounting/cod' },
          { label: 'Chốt ca Shipper', path: '/admin/accounting/confirm-cash' }
        ]}
      ]
    }
  ];

  // Nếu chưa có user (lúc mới tải trang), trả về mảng rỗng để tránh lỗi
  if (!role) return [];
  return allMenus.filter(menu => menu.roles.includes(role));
});

// SỬA LỖI Ở ĐÂY: Thêm .value vào menuData
const activeMenuData = computed(() => {
  if (!menuData.value) return null;
  return menuData.value.find(m => m.id === activePrimaryId.value);
});

const handlePrimaryClick = (menu) => {
  activePrimaryId.value = menu.id;
  if (menu.path) {
    navigateTo(menu.path);
    isPanelOpen.value = false;
  } else {
    isPanelOpen.value = true;
  }
};

const navigateTo = (path) => {
  router.push(path);
  isPanelOpen.value = false;
};

const currentPageTitle = computed(() => {
  return route.name || 'Bảng điều khiển';
});

const handleLogout = () => {
  authStore.logout();
};

// SỬA LỖI Ở ĐÂY: Thêm .value vào menuData
watch(() => route.path, (newPath) => {
  if (!menuData.value || menuData.value.length === 0) return;
  
  menuData.value.forEach(m => {
    if (m.path === newPath) activePrimaryId.value = m.id;
    if (m.children) {
      m.children.forEach(group => {
        if (group.items.some(item => item.path === newPath)) {
          activePrimaryId.value = m.id;
        }
      });
    }
  });
}, { immediate: true });
</script>

<style scoped>
.layout-container {
  height: 100vh;
  display: flex;
  overflow: hidden;
  position: relative;
}

/* Tier 1 Sidebar */
.primary-sidebar {
  width: 80px;
  background-color: #ffffff;
  border-right: 1px solid #e5e7eb;
  display: flex;
  flex-direction: column;
  z-index: 100;
  box-shadow: 2px 0 5px rgba(0,0,0,0.02);
}

.logo-mini {
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-bottom: 1px solid #f3f4f6;
}

.logo-icon {
  width: 32px;
  height: 32px;
  background: var(--misa-primary);
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 800;
  font-size: 14px;
}

.menu-item-primary {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 12px 0;
  cursor: pointer;
  transition: all 0.2s;
  color: #6b7280;
  border-left: 3px solid transparent;
}

.menu-item-primary:hover {
  background-color: #f8fafc;
  color: var(--misa-primary);
}

.menu-item-primary.active {
  color: var(--misa-primary);
  background-color: #eff6ff;
  border-left-color: var(--misa-primary);
}

.menu-label {
  font-size: 10px;
  margin-top: 4px;
  font-weight: 500;
  text-align: center;
}

/* Tier 2 Panel */
.secondary-panel {
  width: 220px;
  background-color: #ffffff;
  border-right: 1px solid #e5e7eb;
  position: absolute;
  left: 80px;
  top: 0;
  bottom: 0;
  z-index: 90;
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.2s;
  transform: translateX(-100%);
  opacity: 0;
  pointer-events: none;
  display: flex;
  flex-direction: column;
}

.secondary-panel.open {
  transform: translateX(0);
  opacity: 1;
  pointer-events: auto;
  box-shadow: 10px 0 15px -3px rgba(0, 0, 0, 0.05);
}

.panel-header {
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  border-bottom: 1px solid #f3f4f6;
}

.panel-title {
  font-weight: 700;
  font-size: 14px;
  color: #111827;
  text-transform: uppercase;
}

.close-btn {
  cursor: pointer;
  color: #9ca3af;
}

.close-btn:hover { color: #111827; }

.panel-content {
  padding: 16px 0;
  overflow-y: auto;
}

.menu-group {
  margin-bottom: 24px;
}

.group-title {
  padding: 0 16px;
  font-size: 11px;
  font-weight: 700;
  color: #9ca3af;
  margin-bottom: 8px;
  letter-spacing: 0.5px;
}

.sub-menu-item {
  padding: 10px 16px 10px 32px;
  font-size: 13px;
  color: #4b5563;
  cursor: pointer;
  transition: all 0.2s;
}

.sub-menu-item:hover {
  background-color: #f3f4f6;
  color: var(--misa-primary);
}

.sub-menu-item.active {
  color: var(--misa-primary);
  font-weight: 600;
  background-color: #eff6ff;
}

/* Main Content Area */
.main-wrapper {
  flex: 1;
  transition: padding-left 0.3s;
}

.main-wrapper.panel-expanded {
  padding-left: 0; /* Content is pushed OR covered depending on requirement. Usually pushed in MISA. */
}

/* Header */
.header {
  height: 64px;
  background: white;
  border-bottom: 1px solid #f3f4f6;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
}

.breadcrumb-info {
  display: flex; align-items: center; gap: 8px;
}
.home-icon { color: #6b7280; cursor: pointer; }
.separator { color: #d1d5db; }
.page-title { font-weight: 700; color: #111827; font-size: 15px; }

.header-right { display: flex; align-items: center; }

.user-profile-wrapper {
  display: flex; align-items: center; gap: 12px;
  padding-left: 16px; border-left: 1px solid #f3f4f6;
}

.user-display-name {
  display: flex; flex-direction: column;
}
.user-display-name b { font-size: 13px; color: #111827; }
.user-display-name small { font-size: 11px; color: #6b7280; }
.dropdown-trigger { cursor: pointer; color: #9ca3af; }

.main-content {
  background-color: #f8fafc;
  padding: 24px;
}

.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

.mr-4 { margin-right: 1rem; }
</style>

