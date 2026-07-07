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
  // {
  //   path: '/register',
  //   name: 'Register',
  //   component: () => import('../views/auth/RegisterView.vue'),
  // },
  {
    path: '/register',
    redirect: '/login'
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
      {
        path: 'waybills/create-internal',
        name: 'CreateInternalWaybill',
        component: () => import('../views/admin/waybills/CreateInternalWaybill.vue'),
      },
      {
        path: 'waybills/ocr-reviewed',
        name: 'Đơn đã OCR',
        component: () => import('../views/admin/waybills/OcrReviewedList.vue'),
      },
      // Warehouse
      /*
      {
        path: 'warehouse/scan-in',
        name: 'ScanIn',
        component: () => import('../views/admin/warehouse/ScanIn.vue'),
      },
      */
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
        path: 'delivery/development-ready',
        name: 'DevelopmentDeliveryReady',
        component: () => import('../views/admin/delivery/DevelopmentDeliveryReady.vue'),
        meta: { requiresAuth: true, title: '' }
      },
      {
        path: 'delivery/assign',
        name: 'AssignShipper',
        component: () => import('../views/admin/delivery/AssignShipper.vue'),
      },
      {
        path: 'delivery/pickup-management',
        name: 'PickupManagement',
        component: () => import('../views/admin/delivery/PickupManagement.vue'),
        meta: { requiresAuth: true, title: 'Điều phối lấy hàng' }
      },
      {
        path: 'delivery/pickup-create',
        name: 'Thêm mới yêu cầu',
        component: () => import('../views/admin/delivery/CreatePickupRequest.vue'),
        meta: { requiresAuth: true, title: 'Thêm mới yêu cầu' }
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
      // Profile
      {
        path: 'profile',
        name: 'AdminProfile',
        component: () => import('../views/admin/profile/AdminProfile.vue'),
        meta: { requiresAuth: true }
      },
    ],
  },
];

const customerRoutes = [
  {
    path: '/customer',
    component: MainLayout,
    meta: { requiresAuth: true },
    children: [
      {
        path: 'dashboard',
        name: 'CustomerDashboard',
        component: () => import('../views/customer/CustomerDashboard.vue'),
        meta: { title: 'Tổng quan' }
      },
      {
        path: 'create',
        name: 'CustomerCreatePickup',
        component: () => import('../views/customer/CustomerCreatePickup.vue'),
        meta: { title: 'Tạo yêu cầu lấy hàng' }
      },
      {
        path: 'drafts',
        name: 'CustomerDrafts',
        component: () => import('../views/customer/CustomerDrafts.vue'),
        meta: { title: 'Bản nháp' }
      },
      {
        path: 'queue',
        name: 'CustomerQueue',
        component: () => import('../views/customer/CustomerQueue.vue'),
        meta: { title: 'Hàng chờ tạo đơn' }
      },
      {
        path: 'orders',
        name: 'CustomerOrders',
        component: () => import('../views/customer/CustomerOrders.vue'),
        meta: { title: 'Yêu cầu của tôi' }
      },
      {
        path: 'orders/:waybill_code',
        name: 'CustomerOrderDetail',
        component: () => import('../views/customer/CustomerOrders.vue'),
        meta: { title: 'Chi tiet yeu cau' }
      },
      {
        path: 'recipients',
        name: 'CustomerRecipients',
        component: () => import('../views/customer/CustomerRecipients.vue'),
        meta: { title: 'Sổ địa chỉ người nhận' }
      },
      {
        path: 'departments',
        name: 'CustomerDepartments',
        component: () => import('../views/customer/CustomerDepartments.vue'),
        meta: { title: 'Quản lý phòng ban' }
      },
      {
        path: 'profile',
        name: 'CustomerProfile',
        component: () => import('../views/customer/CustomerProfile.vue'),
        meta: { title: 'Thông tin cá nhân' }
      }
    ]
  }
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [...publicRoutes, ...adminRoutes, ...customerRoutes],
  scrollBehavior() {
    return { top: 0 };
  },
});

router.onError((error) => {
  const message = String(error?.message || error || '');
  const isChunkLoadError = /Failed to fetch dynamically imported module|Importing a module script failed|Loading chunk|ChunkLoadError/i.test(message);
  if (isChunkLoadError && !sessionStorage.getItem('route-reload-retried')) {
    sessionStorage.setItem('route-reload-retried', '1');
    window.location.reload();
  }
});

router.afterEach(() => {
  sessionStorage.removeItem('route-reload-retried');
});

// 4. Navigation Guard
router.beforeEach((to, from) => {
  const auth = useAuthStore();

  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    const redirect = encodeURIComponent(to.fullPath);
    if (to.path.startsWith('/admin')) {
      return `/admin/login?redirect=${redirect}`;
    }
    return `/login?redirect=${redirect}`;
  }

  // Nếu đã đăng nhập và đang cố vào trang login/admin-login/setup-admin
  if ((to.path === '/login' || to.path === '/admin/login' || to.path === '/setup-admin') && auth.isAuthenticated) {
    const redirect = typeof to.query.redirect === 'string' ? to.query.redirect : '';
    if (redirect && redirect.startsWith('/')) {
      return redirect;
    }
    if (auth.isCustomer) {
      return '/customer/dashboard';
    }
    return '/admin/dashboard';
  }

  // Chặn khách hàng vào các trang /admin/*
  if (to.path.startsWith('/admin') && auth.isAuthenticated && auth.isCustomer) {
    return '/customer/dashboard';
  }

  // Chặn nhân viên/admin vào trang /customer/*
  if (to.path.startsWith('/customer') && auth.isAuthenticated && !auth.isCustomer) {
    return '/admin/dashboard';
  }

  return true;
});

export default router;
