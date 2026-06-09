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
          
          <div class="user-profile-wrapper">
             <el-dropdown trigger="click" placement="bottom-end">
               <div class="user-profile-trigger">
                 <el-avatar :size="40" class="modern-avatar">{{ user?.full_name?.charAt(0) || 'A' }}</el-avatar>
                 <div class="user-display-name">
                    <span class="fw-bold text-dark">{{ user?.full_name || 'Quản trị viên' }}</span>
                    <span class="text-xs text-muted" v-if="userHubName">
                      <el-icon style="vertical-align: middle; margin-right: 2px;"><Location /></el-icon>
                      <span style="vertical-align: middle;">{{ userHubName }}</span>
                    </span>
                    <span class="text-xs text-muted" v-else>{{ isAdmin ? 'Administrator' : 'Nhân viên' }}</span>
                 </div>
                 <el-icon class="dropdown-icon"><ArrowDown /></el-icon>
               </div>
               
               <template #dropdown>
                 <el-dropdown-menu class="modern-dropdown">
                   <div class="dropdown-header">
                      <div class="fw-bold text-dark">{{ user?.full_name || 'Quản trị viên' }}</div>
                      <div class="text-xs text-muted">@{{ user?.username || 'admin' }} <span v-if="userHubName">| {{ userHubName }}</span></div>
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
import { 
  Monitor, Management, Document, Box, Bicycle, Money, 
  Close, Search, HomeFilled, ArrowDown, User, Collection, Location, List, TrendCharts, Service, Fold, Expand
} from '@element-plus/icons-vue';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const { user, isAdmin } = storeToRefs(authStore);

const isSidebarCollapsed = ref(true);

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
    } catch (e) {
      console.error('Không thể lấy thông tin bưu cục', e);
    }
  }
});

// Menu động dựa vào role_id của user
const menuData = computed(() => {
  const role = user.value?.role_id;
  
  const allMenus = [
    { id: 'dashboard', icon: Monitor, label: 'Dashboard', path: '/admin/dashboard', roles: [1, 2, 5, 7] },
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
      id: 'customer', icon: User, label: 'Khách hàng', roles: [1, 2, 5, 7], // Admin, Manager, Kế toán, CSKH
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
      id: 'waybill', icon: Document, label: 'Vận đơn', roles: [1, 2, 3, 7], // Admin, Manager, Kho, CSKH
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
      id: 'delivery', icon: Location, label: 'Điều phối', roles: [1, 2, 3, 4, 7], // Admin, Manager, Kho, Shipper, CSKH
      children: role === 4 ? [
        { title: 'GIAO HÀNG', items: [
          { label: 'Nhiệm vụ của tôi', path: '/admin/delivery/my-tasks' }
        ]}
      ] : [
        { title: 'LẤY HÀNG (PICKUP)', items: [
          { label: 'Chờ xác nhận văn phòng', path: '/admin/delivery/pickup-management?tab=pending' },
          { label: 'Chờ gán bưu tá', path: '/admin/delivery/pickup-management?tab=received' },
          { label: 'Đang đi lấy', path: '/admin/delivery/pickup-management?tab=assigned' }
        ]},
        { title: 'GIAO HÀNG', items: [
          { label: 'Phân công Shipper', path: '/admin/delivery/assign' }
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
      id: 'cskh', icon: Service, label: 'CSKH', roles: [1, 2, 3, 5, 7], // Thêm Role 7 (CSKH)
      children: [
        { title: 'TRUNG TÂM CSKH', items: [
          { label: 'Khách hàng tôi quản lý', path: '/admin/customers?mine=1' },
          { label: 'Bưu tá tôi quản lý', path: '/admin/users?my_shippers=1' },
          { label: 'Duyệt Bill & Báo giá', path: '/admin/cskh/verification' },
          { label: 'Mô phỏng giá cước', path: '/admin/pricing/simulator' }
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
          { label: 'Bản nháp & Hàng chờ', path: '/customer/drafts' },
          { label: 'Yêu cầu của tôi', path: '/customer/orders' },
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
  return route.name || 'Bảng điều khiển';
});

const handleLogout = () => {
  authStore.logout();
};

</script>

<style scoped src="@/styles/layouts/MainLayout.css"></style>
