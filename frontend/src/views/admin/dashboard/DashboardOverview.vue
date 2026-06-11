<template>
  <div class="modern-dashboard">
    <div class="dashboard-wrapper">
      
      <!-- Welcome Banner -->
      <div class="welcome-banner animate-fade-in mb-24">
        <div class="welcome-content">
          <div class="welcome-text">
            <h2>Xin chào, {{ userName }}! 👋</h2>
            <p>Chào mừng bạn đến với Hệ thống Quản trị Logistics. Chúc bạn một ngày làm việc hiệu quả.</p>
          </div>
          <div class="welcome-date">
            <el-icon><Calendar /></el-icon>
            <span>{{ currentDate }}</span>
          </div>
        </div>
      </div>

      <!-- Header Section -->
      <header class="dashboard-header animate-fade-in">
        <div class="header-left">
          <div class="title-wrapper">
            <h1>Hệ thống SmartPost</h1>
            <span class="live-badge">
              <span class="ping"></span>
              Live
            </span>
          </div>
          <p class="subtitle">Tổng quan hiệu suất bưu cục của bạn hôm nay</p>
        </div>
        
        <div class="header-right">
          <div class="sync-status">
            <el-icon><Timer /></el-icon>
            <span>Cập nhật: <strong>{{ lastSync }}</strong></span>
          </div>
          <button class="btn-primary" @click="refreshData" :disabled="loading">
            <el-icon class="spin-icon" v-if="loading"><Refresh /></el-icon>
            <el-icon v-else><Refresh /></el-icon>
            <span>{{ loading ? 'Đang tải...' : 'Làm mới' }}</span>
          </button>
        </div>
      </header>

      <!-- Statistics Grid -->
      <el-row :gutter="24" class="stat-container">
        <el-col :xs="24" :sm="12" :lg="8" v-for="(stat, index) in statConfig" :key="index">
          <div class="stat-card" :style="`--theme-color: ${stat.color}`">
            <div class="stat-card-inner">
              <div class="stat-content">
                <p class="stat-label">{{ stat.label }}</p>
                <div class="stat-value-wrapper">
                  <h2 class="stat-value">{{ stat.value }}</h2>
                  <span class="stat-unit">{{ stat.unit }}</span>
                </div>
                <div class="stat-trend" :class="stat.trendDir">
                  <el-icon><component :is="stat.trendIcon" /></el-icon>
                  <span>{{ stat.trendText }}</span>
                </div>
              </div>
              <div class="stat-icon-wrapper">
                <el-icon><component :is="stat.icon" /></el-icon>
              </div>
            </div>
            <!-- Decorative background element -->
            <div class="stat-deco"></div>
          </div>
        </el-col>
      </el-row>

      <!-- Main Content Layout -->
      <el-row :gutter="24" class="content-container">
        
        <!-- Chart Section -->
        <el-col :lg="16" :md="24" class="mb-24">
          <div class="content-card chart-card">
            <div class="card-header">
              <div class="header-title">
                <div class="icon-box primary"><el-icon><TrendCharts /></el-icon></div>
                <h3>Sản lượng vận đơn</h3>
              </div>
              <el-radio-group v-model="chartTime" size="default" class="custom-radio">
                <el-radio-button value="7d">7 Ngày</el-radio-button>
                <el-radio-button value="30d">30 Ngày</el-radio-button>
              </el-radio-group>
            </div>
            
            <div class="modern-chart-wrapper">
              <div class="y-axis">
                <span>{{ maxChartVal }}</span>
                <span>{{ Math.floor(maxChartVal * 0.75) }}</span>
                <span>{{ Math.floor(maxChartVal * 0.5) }}</span>
                <span>{{ Math.floor(maxChartVal * 0.25) }}</span>
                <span>0</span>
              </div>
              
              <div class="chart-area" v-if="stats && stats.chart_data && Object.keys(stats.chart_data).length > 0">
                <div v-for="(val, key) in stats.chart_data" :key="key" class="bar-group">
                  <div class="bar-track">
                    <div class="bar-fill" :style="`height: ${(val / maxChartVal) * 100}%`">
                      <div class="tooltip">{{ val }} đơn</div>
                    </div>
                  </div>
                  <span class="bar-label">{{ key }}</span>
                </div>
              </div>
              
              <div class="chart-empty" v-else>
                <el-empty description="Chưa có dữ liệu thống kê" :image-size="80" />
              </div>
            </div>
          </div>
        </el-col>

        <!-- Sidebar Section: Quick Actions & Activity -->
        <el-col :lg="8" :md="24">
          <div class="sidebar-layout">
            
            <!-- Quick Actions -->
            <div class="content-card action-card">
              <div class="card-header borderless">
                <h3>Thao tác nhanh</h3>
              </div>
              <div class="action-grid">
                <div @click="$router.push('/admin/waybills/create')" class="action-item primary">
                  <div class="action-icon"><el-icon><Plus /></el-icon></div>
                  <span>Tạo đơn</span>
                </div>
                <div @click="$router.push('/admin/warehouse/scan-in')" class="action-item info">
                  <div class="action-icon"><el-icon><List /></el-icon></div>
                  <span>Nhập kho</span>
                </div>
                <div @click="$router.push('/admin/accounting/cod')" class="action-item warning">
                  <div class="action-icon"><el-icon><Wallet /></el-icon></div>
                  <span>Đối soát</span>
                </div>
                <div @click="$router.push('/admin/users')" class="action-item success">
                  <div class="action-icon"><el-icon><User /></el-icon></div>
                  <span>Nhân sự</span>
                </div>
              </div>
            </div>

            <!-- Recent Activity -->
            <div class="content-card activity-card">
              <div class="card-header borderless">
                <h3>Hoạt động gần đây</h3>
              </div>
              <div class="timeline" v-if="activities && activities.length > 0">
                <div v-for="act in activities" :key="act.id" class="timeline-item animate-fade-in clickable-activity" @click="goToActivityDetails(act)" title="Nhấn để xem chi tiết đơn hàng">
                  <div class="timeline-marker" :class="`marker-${act.type}`"></div>
                  <div class="timeline-content">
                    <p v-html="act.message"></p>
                    <span class="time">{{ act.time }}</span>
                  </div>
                </div>
              </div>
              <div class="timeline-empty" v-else>
                <el-empty description="Chưa có hoạt động nào" :image-size="60" />
              </div>
            </div>
            
          </div>
        </el-col>
      </el-row>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, reactive } from 'vue';
import { useRouter } from 'vue-router';
import api from '@/api/axios';
import { ElMessage, ElNotification } from 'element-plus';
import { 
  Refresh, Box, Money, Check, Top, Warning, 
  CircleCheck, Plus, List, Van, Wallet, Timer, TrendCharts, User, CaretBottom, CaretTop, Calendar
} from '@element-plus/icons-vue';
import moment from 'moment';
import { useAuthStore } from '@/stores/auth';

const router = useRouter();
const authStore = useAuthStore();
const userName = computed(() => authStore.user?.full_name || authStore.user?.username || 'Nhân viên');

const currentDate = computed(() => {
  const days = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
  const now = new Date();
  return `${days[now.getDay()]}, ${now.getDate()} tháng ${now.getMonth() + 1}, ${now.getFullYear()}`;
});

const loading = ref(false);
const lastSync = ref('--:--:--');
const chartTime = ref('7d');
const stats = ref({
  total_waybills: 0,
  total_cod_pending: 0,
  total_cod_settled: 0,
  chart_data: {}
});

const formatMoney = (v) => Number(v || 0).toLocaleString('vi-VN');

const maxChartVal = computed(() => {
  const vals = Object.values(stats.value.chart_data || {});
  if (vals.length === 0) return 10;
  const max = Math.max(...vals);
  return max > 0 ? (max + Math.ceil(max * 0.1)) : 10; // add 10% buffer
});

const statConfig = computed(() => [
  {
    label: 'TỔNG VẬN ĐƠN',
    value: stats.value.total_waybills || 0,
    unit: 'Đơn',
    icon: Box,
    color: '#4318FF', // Modern Indigo
    trendDir: 'up',
    trendIcon: CaretTop,
    trendText: '+12% so với hôm qua'
  },
  {
    label: 'COD CHỜ THU',
    value: formatMoney(stats.value.total_cod_pending),
    unit: 'VNĐ',
    icon: Wallet,
    color: '#FFB547', // Modern Amber
    trendDir: 'down',
    trendIcon: Warning,
    trendText: 'Đang cầm bởi Shipper'
  },
  {
    label: 'COD ĐÃ NỘP KHO',
    value: formatMoney(stats.value.total_cod_settled),
    unit: 'VNĐ',
    icon: Check,
    color: '#05CD99', // Modern Emerald
    trendDir: 'up',
    trendIcon: CircleCheck,
    trendText: 'Đã hạch toán xong'
  }
]);

const loadActivities = () => {
  const stored = localStorage.getItem('dashboard_activities');
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      // Lọc bỏ các hoạt động mock cũ nếu có
      return Array.isArray(parsed) ? parsed.filter(act => act && !String(act.id).startsWith('mock-')) : [];
    } catch (e) {
      console.error(e);
    }
  }
  return [];
};

const activities = ref(loadActivities());

const saveActivities = () => {
  localStorage.setItem('dashboard_activities', JSON.stringify(activities.value));
};

let socket = null;

const connectWebSocket = () => {
  const token = authStore.token;
  if (!token) return;

  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  let wsUrl = '';
  const apiURL = import.meta.env.VITE_API_URL || '';
  if (apiURL) {
    wsUrl = apiURL.replace(/^http/, 'ws') + `/ws/realtime?token=${token}`;
  } else {
    // Kết nối trực tiếp đến cổng 8000 của backend trên 127.0.0.1 (tránh lỗi IPv6 loopback của localhost trên Windows)
    // Và không cần sửa config backend hay khởi động lại Vite dev server
    wsUrl = `${protocol}//127.0.0.1:8000/ws/realtime?token=${token}`;
  }

  socket = new WebSocket(wsUrl);

  socket.onopen = () => {
    console.log('Dashboard WebSocket connected successfully');
  };

  socket.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      handleWsEvent(data);
    } catch (e) {
      console.error('Error parsing WS message:', e);
    }
  };

  socket.onclose = (event) => {
    console.log(`Dashboard WebSocket closed. Code: ${event.code}, Reason: ${event.reason}. Reconnecting...`);
    setTimeout(connectWebSocket, 5000);
  };

  socket.onerror = (err) => {
    console.error('Dashboard WebSocket error:', err);
  };
};

const goToActivityDetails = (act) => {
  try {
    console.log('goToActivityDetails clicked:', act);
    if (!act) return;
    
    let code = '';
    // 1. Lấy mã đơn hàng từ payload
    if (act.payload && (act.payload.waybill_code || act.payload.request_code)) {
      code = act.payload.waybill_code || act.payload.request_code;
    }
    
    // 2. Dự phòng: Trích xuất mã đơn hàng từ message bằng regex nếu payload không có
    if (!code && act.message) {
      const match = act.message.match(/<strong>([A-Z0-9]+)<\/strong>/i) || act.message.match(/([A-Z0-9]{10,})/i);
      if (match) {
        code = match[1];
        console.log('Regex extracted code:', code);
      }
    }

    // 3. Xác định loại sự kiện để chuyển đến trang tương ứng
    const messageText = act.message ? act.message.toLowerCase() : '';
    const isPickupEvent = [
      'pickup.created',
      'pickup.created_by_admin',
      'pickup.assigned_shipper',
      'pickup.picked',
      'pickup.hub_accepted',
      'pickup.hub_rejected'
    ].includes(act.event) || messageText.includes('pickup') || messageText.includes('lấy hàng');

    console.log('Routing details - code:', code, 'isPickupEvent:', isPickupEvent);

    if (isPickupEvent) {
      router.push({
        path: '/admin/delivery/pickup-management',
        query: code ? { search: code } : {}
      });
    } else {
      router.push({
        path: '/admin/waybills',
        query: code ? { search: code } : {}
      });
    }
  } catch (err) {
    console.error('Lỗi khi chuyển hướng chi tiết hoạt động:', err);
  }
};

const handleWsEvent = (data) => {
  const event = data.event;
  const payload = data.payload || {};
  
  let message = '';
  let type = 'primary'; // 'primary', 'warning', 'success'
  
  if (event === 'pickup.created') {
    message = `Khách hàng vừa yêu cầu pickup đơn mới <strong>${payload.waybill_code || payload.request_code}</strong>`;
    type = 'primary';
  } else if (event === 'pickup.created_by_admin') {
    message = `Admin vừa tạo hộ đơn pickup <strong>${payload.waybill_code || payload.request_code}</strong>`;
    type = 'primary';
  } else if (event === 'pickup.price_finalized') {
    message = `Đơn pickup <strong>${payload.waybill_code || payload.request_code}</strong> đã được chốt giá cước`;
    type = 'success';
  } else if (event === 'pickup.assigned_shipper') {
    message = `Đã gán bưu tá lấy hàng cho đơn <strong>${payload.waybill_code || payload.request_code}</strong>`;
    type = 'warning';
  } else if (event === 'pickup.picked') {
    message = `Bưu tá đã lấy thành công đơn <strong>${payload.waybill_code || payload.request_code}</strong>`;
    type = 'success';
  } else if (event === 'pickup.dispatched_to_hub') {
    message = `Đơn hàng <strong>${payload.waybill_code || payload.request_code}</strong> đã được điều phối đến kho`;
    type = 'primary';
  } else if (event === 'pickup.hub_accepted') {
    message = `Kho đã chấp nhận đơn hàng <strong>${payload.waybill_code || payload.request_code}</strong>`;
    type = 'success';
  } else if (event === 'pickup.hub_rejected') {
    message = `Kho đã từ chối nhận đơn <strong>${payload.waybill_code || payload.request_code}</strong>`;
    type = 'warning';
  } else {
    return;
  }
  
  activities.value.unshift({
    id: `ws-${Date.now()}-${Math.random()}`,
    message: message,
    time: moment().format('HH:mm:ss DD/MM'),
    type: type,
    event: event,
    payload: payload
  });
  
  if (activities.value.length > 10) {
    activities.value = activities.value.slice(0, 10);
  }
  
  saveActivities();
  
  // Show premium notification with click-to-navigate action
  ElNotification({
    title: 'Cập nhật đơn hàng',
    message: message,
    dangerouslyUseHTMLString: true,
    type: type === 'success' ? 'success' : (type === 'warning' ? 'warning' : 'info'),
    duration: 8000,
    position: 'bottom-right',
    onClick: () => {
      goToActivityDetails({ event, payload });
    }
  });
};

const refreshData = async () => {
  loading.value = true;
  try {
    const res = await api.get('/api/dashboard/summary');
    stats.value = res.data;
    lastSync.value = moment().format('HH:mm:ss');
  } catch (err) {
    console.error(err);
    ElMessage.error('Không thể kết nối máy chủ');
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  refreshData();
  connectWebSocket();
});

onUnmounted(() => {
  if (socket) {
    socket.onclose = null;
    socket.close();
  }
});
</script>

<style scoped src="@/styles/admin/dashboard/DashboardOverview.css"></style>

<style scoped>
.clickable-activity {
  cursor: pointer;
  padding: 8px 12px;
  margin: -8px -12px;
  border-radius: 10px;
  transition: all 0.2s ease;
}
.clickable-activity:hover {
  background-color: rgba(67, 24, 255, 0.08);
}
</style>
