<template>
  <el-container class="modern-layout-container">
    <!-- Tier 1: Primary Sidebar (Icons only) -->
    <div class="primary-sidebar">
      <div class="logo-mini">
        <div class="logo-icon">SP</div>
      </div>
      
      <div class="menu-list">
        <div 
          v-for="menu in menuData" 
          :key="menu.id"
          class="menu-item-primary"
          :class="{ active: activePrimaryId === menu.id }"
          @click="handlePrimaryClick(menu)"
        >
          <div class="icon-wrapper">
            <el-icon :size="22"><component :is="menu.icon" /></el-icon>
          </div>
          <span class="menu-label">{{ menu.label }}</span>
        </div>
      </div>
    </div>

    <!-- Tier 2: Secondary Panel (Sub-menus) -->
    <div class="secondary-panel" :class="{ open: isPanelOpen }">
      <div class="panel-header">
        <span class="panel-title">{{ activeMenuData?.label }}</span>
        <button class="close-btn" @click="isPanelOpen = false">
          <el-icon><Close /></el-icon>
        </button>
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
            <span class="item-dot"></span>
            {{ item.label }}
          </div>
        </div>
      </div>
    </div>

    <el-container class="main-wrapper" :class="{ 'panel-expanded': isPanelOpen }">
      <!-- Topbar -->
      <el-header class="modern-header">
        <div class="header-left">
          <div class="breadcrumb-info">
             <div class="home-icon-box">
               <el-icon><HomeFilled /></el-icon>
             </div>
             <span class="separator">/</span>
             <span class="page-title">{{ currentPageTitle }}</span>
          </div>
        </div>
        
        <div class="header-right">
          <div class="search-box mr-4 hidden-sm-and-down">
             <el-input 
                placeholder="Tìm kiếm nhanh..." 
                class="modern-search-input"
             >
                <template #prefix><el-icon><Search /></el-icon></template>
             </el-input>
          </div>
          
          <div class="user-profile-wrapper">
             <el-dropdown trigger="click" placement="bottom-end">
               <div class="user-profile-trigger">
                 <el-avatar :size="40" class="modern-avatar">{{ user?.full_name?.charAt(0) || 'A' }}</el-avatar>
                 <div class="user-display-name">
                    <span class="fw-bold text-dark">{{ user?.full_name || 'Quản trị viên' }}</span>
                    <span class="text-xs text-muted">{{ isAdmin ? 'Administrator' : 'Nhân viên' }}</span>
                 </div>
                 <el-icon class="dropdown-icon"><ArrowDown /></el-icon>
               </div>
               
               <template #dropdown>
                 <el-dropdown-menu class="modern-dropdown">
                   <div class="dropdown-header">
                      <div class="fw-bold text-dark">{{ user?.full_name || 'Quản trị viên' }}</div>
                      <div class="text-xs text-muted">@{{ user?.username || 'admin' }}</div>
                   </div>
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
        <router-view v-slot="{ Component }">
          <transition name="fade-slide" mode="out-in">
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
  Close, Search, HomeFilled, ArrowDown, User, Collection, Location, List, TrendCharts, Service
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
          { label: 'Túi gom lấy hàng', path: '/admin/warehouse/pickup-bags' },
          { label: 'Lên/Xuống xe (Manifest)', path: '/admin/warehouse/manifest' },
          { label: 'Lịch sử Chuyến xe', path: '/admin/warehouse/manifests' }
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
          { label: 'Tạo Bảng Kê (Debt/COD)', path: '/admin/accounting/statements' },
          { label: 'Đối soát COD - Shop', path: '/admin/accounting/cod' },
          { label: 'Chốt ca Shipper', path: '/admin/accounting/confirm-cash' }
        ]}
      ]
    },
    {
      id: 'cskh', icon: Service, label: 'CSKH', roles: [1, 2, 3, 5], // Thêm Role 3 (Nhân viên kho/CSKH)
      children: [
        { title: 'TRUNG TÂM CSKH', items: [
          { label: 'Duyệt Bill & Báo giá', path: '/admin/cskh/verification' },
          { label: 'Mô phỏng giá cước', path: '/admin/pricing/simulator' }
        ]}
      ]
    }
  ];

  if (!role) return [];
  return allMenus.filter(menu => menu.roles.includes(role));
});

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
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

.modern-layout-container {
  height: 100vh;
  display: flex;
  overflow: hidden;
  position: relative;
  font-family: 'Plus Jakarta Sans', sans-serif;
  background-color: #F4F7FE;
}

/* Tier 1: Primary Sidebar */
.primary-sidebar {
  width: 90px;
  background-color: #FFFFFF;
  border-right: 1px solid #E9EDF7;
  display: flex;
  flex-direction: column;
  z-index: 100;
  box-shadow: 4px 0 20px rgba(0, 0, 0, 0.02);
  height: 100%;
  overflow: hidden;
}

.logo-mini {
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-bottom: 1px solid #F4F7FE;
  margin-bottom: 16px;
  flex-shrink: 0; /* Không cho logo co lại */
}

.logo-icon {
  width: 44px;
  height: 44px;
  background: linear-gradient(135deg, #4318FF 0%, #868CFF 100%);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 800;
  font-size: 18px;
  box-shadow: 0 4px 15px rgba(67, 24, 255, 0.3);
}

.menu-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 0 12px 24px 12px;
  flex: 1;
  overflow-y: auto;
  -ms-overflow-style: none;  /* IE and Edge */
  scrollbar-width: none;  /* Firefox */
}

.menu-list::-webkit-scrollbar {
  display: none; /* Safari and Chrome */
}

.menu-item-primary {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 12px 0;
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  color: #A3AED0;
}

.icon-wrapper {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.menu-label {
  font-size: 11px;
  font-weight: 700;
  margin-top: 6px;
  text-align: center;
  transition: all 0.3s ease;
}

.menu-item-primary:hover .icon-wrapper {
  background-color: #F4F7FE;
  color: #4318FF;
}

.menu-item-primary:hover .menu-label {
  color: #4318FF;
}

.menu-item-primary.active .icon-wrapper {
  background-color: #4318FF;
  color: white;
  box-shadow: 0 4px 10px rgba(67, 24, 255, 0.25);
}

.menu-item-primary.active .menu-label {
  color: #4318FF;
}

/* Tier 2: Secondary Panel */
.secondary-panel {
  width: 260px;
  background-color: #FFFFFF;
  border-right: 1px solid #E9EDF7;
  position: absolute;
  left: 90px;
  top: 0;
  bottom: 0;
  z-index: 90;
  transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease;
  transform: translateX(-100%);
  opacity: 0;
  pointer-events: none;
  display: flex;
  flex-direction: column;
  box-shadow: 10px 0 30px rgba(0, 0, 0, 0.03);
}

.secondary-panel.open {
  transform: translateX(0);
  opacity: 1;
  pointer-events: auto;
}

.panel-header {
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  border-bottom: 1px solid #F4F7FE;
}

.panel-title {
  font-weight: 800;
  font-size: 16px;
  color: #1B2559;
  letter-spacing: -0.5px;
}

.close-btn {
  background: #F4F7FE;
  border: none;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #A3AED0;
  cursor: pointer;
  transition: all 0.2s;
}

.close-btn:hover {
  background: #EE5D50;
  color: white;
}

.panel-content {
  padding: 24px;
  overflow-y: auto;
}

.panel-content::-webkit-scrollbar { width: 4px; }
.panel-content::-webkit-scrollbar-thumb { background-color: #E9EDF7; border-radius: 4px; }

.menu-group { margin-bottom: 28px; }

.group-title {
  font-size: 12px;
  font-weight: 800;
  color: #A3AED0;
  margin-bottom: 12px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.sub-menu-item {
  padding: 12px 16px;
  font-size: 14px;
  font-weight: 600;
  color: #2B3674;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 4px;
}

.item-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: #E9EDF7;
  transition: all 0.2s ease;
}

.sub-menu-item:hover {
  background-color: #F4F7FE;
  color: #4318FF;
  transform: translateX(4px);
}

.sub-menu-item:hover .item-dot {
  background-color: #4318FF;
}

.sub-menu-item.active {
  background-color: rgba(67, 24, 255, 0.05);
  color: #4318FF;
}

.sub-menu-item.active .item-dot {
  background-color: #4318FF;
  box-shadow: 0 0 0 3px rgba(67, 24, 255, 0.1);
}

/* Main Content Area */
.main-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  transition: all 0.3s;
  background-color: #F4F7FE;
}

/* Header */
.modern-header {
  height: 80px;
  background: #F4F7FE;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 32px;
}

.breadcrumb-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.home-icon-box {
  width: 32px;
  height: 32px;
  background: #FFFFFF;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #4318FF;
  box-shadow: 0 2px 10px rgba(0,0,0,0.02);
}

.separator {
  color: #A3AED0;
  font-weight: 600;
}

.page-title {
  font-weight: 800;
  color: #1B2559;
  font-size: 24px;
  letter-spacing: -0.5px;
}

.header-right {
  display: flex;
  align-items: center;
}

/* Search Input */
:deep(.modern-search-input .el-input__wrapper) {
  background: #FFFFFF;
  border-radius: 20px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.02) !important;
  border: 1px solid transparent;
  padding: 6px 20px;
  width: 250px;
  transition: all 0.3s;
}

:deep(.modern-search-input .el-input__wrapper.is-focus) {
  border-color: #4318FF;
  box-shadow: 0 4px 15px rgba(67, 24, 255, 0.1) !important;
}

:deep(.modern-search-input .el-input__inner) {
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-weight: 500;
  color: #1B2559;
}

/* User Profile */
.user-profile-wrapper {
  margin-left: 20px;
}

.user-profile-trigger {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  background: #FFFFFF;
  padding: 6px 16px 6px 6px;
  border-radius: 30px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.02);
  transition: all 0.3s ease;
}

.user-profile-trigger:hover {
  box-shadow: 0 4px 15px rgba(0,0,0,0.05);
}

.modern-avatar {
  background: linear-gradient(135deg, #FFB547 0%, #FF8A00 100%);
  color: white;
  font-weight: 800;
  font-size: 16px;
}

.user-display-name {
  display: flex;
  flex-direction: column;
}

.dropdown-icon {
  color: #A3AED0;
  font-weight: bold;
}

/* Dropdown styling */
:deep(.modern-dropdown) {
  border-radius: 16px;
  padding: 8px;
  min-width: 200px;
}

.dropdown-header {
  padding: 8px 16px 12px;
  border-bottom: 1px solid #F4F7FE;
  margin-bottom: 8px;
}

:deep(.modern-dropdown .el-dropdown-menu__item) {
  border-radius: 8px;
  padding: 10px 16px;
  font-weight: 600;
  font-size: 14px;
}

:deep(.modern-dropdown .el-dropdown-menu__item:hover) {
  background-color: #FFF0F0;
  color: #EE5D50;
}

/* Main Content Wrapper */
.main-content {
  padding: 0;
  height: calc(100vh - 80px);
  overflow-y: auto;
  overflow-x: hidden;
}

.main-content::-webkit-scrollbar { width: 6px; }
.main-content::-webkit-scrollbar-thumb { background-color: #E2E8F0; border-radius: 10px; }

/* Transitions */
.fade-slide-enter-active, .fade-slide-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.fade-slide-enter-from { opacity: 0; transform: translateY(10px); }
.fade-slide-leave-to { opacity: 0; transform: translateY(-10px); }

/* Utility Classes */
.mr-4 { margin-right: 16px; }
.fw-bold { font-weight: 700; }
.text-dark { color: #1B2559; }
.text-muted { color: #A3AED0; }
.text-xs { font-size: 12px; }
.text-danger { color: #EE5D50; }
</style>