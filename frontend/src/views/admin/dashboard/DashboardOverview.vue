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
              <div class="timeline">
                <div v-for="i in 3" :key="i" class="timeline-item">
                  <div class="timeline-marker" :class="['marker-primary', 'marker-warning', 'marker-success'][i-1]"></div>
                  <div class="timeline-content">
                    <p>Bảng giá <strong>{{ ['Express', 'Standard', 'Bulk'][i-1] }}</strong> vừa được cập nhật tự động</p>
                    <span class="time">{{ i * 5 }} phút trước</span>
                  </div>
                </div>
              </div>
            </div>
            
          </div>
        </el-col>
      </el-row>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, reactive } from 'vue';
import api from '@/api/axios';
import { ElMessage } from 'element-plus';
import { 
  Refresh, Box, Money, Check, Top, Warning, 
  CircleCheck, Plus, List, Van, Wallet, Timer, TrendCharts, User, CaretBottom, CaretTop, Calendar
} from '@element-plus/icons-vue';
import moment from 'moment';
import { useAuthStore } from '@/stores/auth';

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

onMounted(refreshData);
</script>

<style scoped src="@/styles/admin/dashboard/DashboardOverview.css"></style>
