import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '../stores/auth';

// 1. Layouts
import MainLayout from '../layouts/MainLayout.vue';

// 2. Public Routes (No Auth Needed)
const publicRoutes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/auth/LoginView.vue'),
  },
  {
    path: '/admin/login',
    name: 'AdminLogin',
    component: () => import('../views/auth/AdminLoginView.vue'),
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('../views/auth/RegisterView.vue'),
  },
  {
    path: '/setup-admin',
    name: 'SetupAdmin',
    component: () => import('../views/auth/SetupAdmin.vue'),
  },
  {
    path: '/tracking/:code?',
    name: 'CustomerTracking',
    component: () => import('../views/customer/tracking/PublicTracking.vue'),
  },
  {
    path: '/customer/portal',
    name: 'CustomerPortal',
    component: () => import('../views/customer/CustomerPortal.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/',
    redirect: '/login'
  }
];

// 3. Admin Routes (Auth Required)
const adminRoutes = [
  {
    path: '/admin',
    component: MainLayout,
    meta: { requiresAuth: true },
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('../views/admin/dashboard/DashboardOverview.vue'),
      },
      // Management
      {
        path: 'hubs',
        name: 'Quản lý Bưu cục',
        component: () => import('../views/admin/hubs/HubList.vue'),
        meta: { requiresAuth: true }
      },
      {
        path: 'customers',
        name: 'Quản lý Khách hàng',
        component: () => import('../views/admin/customers/CustomerList.vue'),
        meta: { requiresAuth: true }
      },
      {
        path: 'users',
        name: 'UserList',
        component: () => import('../views/admin/users/UserList.vue'),
      },
      {
        path: 'audit-logs',
        name: 'AuditLogs',
        component: () => import('../views/admin/dashboard/AuditLogs.vue'),
      },
      // Waybills
      {
        path: 'waybills',
        name: 'WaybillList',
        component: () => import('../views/admin/waybills/WaybillList.vue'),
      },
      {
        path: 'waybills/create',
        name: 'CreateWaybill',
        component: () => import('../views/admin/waybills/CreateWaybill.vue'),
      },
      // Warehouse
      {
        path: 'warehouse/scan-in',
        name: 'ScanIn',
        component: () => import('../views/admin/warehouse/ScanIn.vue'),
      },
      {
        path: 'warehouse/bagging',
        name: 'Bagging',
        component: () => import('../views/admin/warehouse/Bagging.vue'),
      },
      {
        path: 'warehouse/manifest',
        name: 'ManifestScan',
        component: () => import('../views/admin/warehouse/ManifestScan.vue'),
      },
      {
        path: 'warehouse/manifests',
        name: 'ManifestList',
        component: () => import('../views/admin/warehouse/ManifestList.vue'),
      },
      {
        path: 'warehouse/bags', // Đường dẫn là /admin/warehouse/bags
        name: 'BagList',
        component: () => import('../views/admin/warehouse/BagList.vue'),
        meta: { requiresAuth: true }
      },
      {
        path: 'warehouse/pickup-bags',
        name: 'PickupBagList',
        component: () => import('../views/admin/warehouse/PickupBagList.vue'),
        meta: { requiresAuth: true }
      },
      // Delivery
      {
        path: 'delivery/assign',
        name: 'AssignShipper',
        component: () => import('../views/admin/delivery/AssignShipper.vue'),
      },
      {
        path: 'delivery/pickup-management',
        name: 'PickupManagement',
        component: () => import('../views/admin/delivery/PickupManagement.vue'),
        meta: { requiresAuth: true }
      },
      // Accounting & Pricing
      {
        path: 'accounting/cod',
        name: 'CODTable',
        component: () => import('../views/admin/accounting/CODTable.vue'),
      },
      {
        path: 'accounting/statements',
        name: 'DebtStatement',
        component: () => import('../views/admin/accounting/DebtStatement.vue'),
      },
      {
        path: 'accounting/pricing',
        name: 'PricingRules',
        component: () => import('../views/admin/accounting/PricingRules.vue'),
      },
      {
        path: 'accounting/confirm-cash',
        name: 'ConfirmCash',
        component: () => import('../views/admin/accounting/ConfirmCash.vue'),
      },
      {
        path: 'pricing/simulator',
        name: 'PriceSimulator',
        component: () => import('../views/admin/pricing/PriceSimulator.vue'),
      },
      // Shipper Mobile-friendly app
      {
        path: 'delivery/my-tasks', // <--- Đây là URL trên trình duyệt
        name: 'ShipperTasks',
        component: () => import('../views/admin/shipper/TaskList.vue'), // <--- Chỉ đúng vào tên file vật lý
      },
      {
        path: 'shipper/pod/:id',
        name: 'ShipperPOD',
        component: () => import('../views/admin/shipper/PODConfirmation.vue'),
      },
      {
        path: 'service-config',
        name: 'ServiceConfig',
        component: () => import('@/views/admin/accounting/ServiceConfig.vue')
      },
      // CSKH
      {
        path: 'cskh/verification',
        name: 'BillVerification',
        component: () => import('../views/admin/cskh/BillVerification.vue'),
        meta: { requiresAuth: true }
      },
    ],
  },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [...publicRoutes, ...adminRoutes],
});

// 4. Navigation Guard
router.beforeEach((to, from) => {
  const auth = useAuthStore();

  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    if (to.path.startsWith('/admin')) {
      return '/admin/login';
    }
    return '/login';
  }

  // Nếu đã đăng nhập và đang cố vào trang login/admin-login/setup-admin
  if ((to.path === '/login' || to.path === '/admin/login' || to.path === '/setup-admin') && auth.isAuthenticated) {
    if (auth.isCustomer) {
      return '/customer/portal';
    }
    return '/admin/dashboard';
  }

  // Chặn khách hàng vào các trang /admin/*
  if (to.path.startsWith('/admin') && auth.isAuthenticated && auth.isCustomer) {
    return '/customer/portal';
  }

  // Chặn nhân viên/admin vào trang /customer/portal
  if (to.path.startsWith('/customer/portal') && auth.isAuthenticated && !auth.isCustomer) {
    return '/admin/dashboard';
  }

  return true;
});

export default router;
