<template>
  <div class="modern-dashboard">
    <div class="dashboard-wrapper">
      
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
                <el-radio-button label="7d">7 Ngày</el-radio-button>
                <el-radio-button label="30d">30 Ngày</el-radio-button>
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
  CircleCheck, Plus, List, Van, Wallet, Timer, TrendCharts, User, CaretBottom, CaretTop
} from '@element-plus/icons-vue';
import moment from 'moment';

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

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

/* Base Layout */
.modern-dashboard {
  min-height: 100vh;
  background-color: #F4F7FE; /* Light SaaS background */
  font-family: 'Plus Jakarta Sans', sans-serif;
  color: #2B3674;
  padding: 32px 24px;
}

.dashboard-wrapper {
  max-width: 1600px;
  margin: 0 auto;
}

.mb-24 {
  margin-bottom: 24px;
}

/* Header */
.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 40px;
  flex-wrap: wrap;
  gap: 20px;
}

.title-wrapper {
  display: flex;
  align-items: center;
  gap: 16px;
}

.dashboard-header h1 {
  font-size: 32px;
  font-weight: 800;
  color: #2B3674;
  margin: 0;
  letter-spacing: -0.5px;
}

.live-badge {
  background: rgba(5, 205, 153, 0.1);
  color: #05CD99;
  font-size: 12px;
  font-weight: 700;
  padding: 4px 10px;
  border-radius: 20px;
  display: flex;
  align-items: center;
  gap: 6px;
  text-transform: uppercase;
}

.ping {
  width: 8px;
  height: 8px;
  background-color: #05CD99;
  border-radius: 50%;
  box-shadow: 0 0 0 0 rgba(5, 205, 153, 0.4);
  animation: ping 1.5s infinite;
}

.subtitle {
  color: #A3AED0;
  font-size: 15px;
  margin: 8px 0 0 0;
  font-weight: 500;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 20px;
}

.sync-status {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #A3AED0;
  font-size: 14px;
  background: #FFFFFF;
  padding: 10px 16px;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.02);
}

.sync-status strong {
  color: #2B3674;
}

.btn-primary {
  background: #4318FF;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 12px;
  font-weight: 700;
  font-family: inherit;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(67, 24, 255, 0.25);
}

.btn-primary:hover:not(:disabled) {
  background: #3311DB;
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(67, 24, 255, 0.35);
}

.btn-primary:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.spin-icon {
  animation: spin 1s linear infinite;
}

/* Stat Cards */
.stat-container {
  margin-bottom: 32px;
}

.stat-card {
  background: #FFFFFF;
  border-radius: 20px;
  padding: 24px;
  position: relative;
  overflow: hidden;
  box-shadow: 0px 4px 20px rgba(0, 0, 0, 0.02);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  height: 100%;
}

.stat-card:hover {
  transform: translateY(-5px);
  box-shadow: 0px 10px 30px rgba(0, 0, 0, 0.05);
}

.stat-card-inner {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  position: relative;
  z-index: 2;
}

.stat-label {
  color: #A3AED0;
  font-size: 13px;
  font-weight: 700;
  margin: 0 0 8px 0;
}

.stat-value-wrapper {
  display: flex;
  align-items: baseline;
  gap: 6px;
  margin-bottom: 12px;
}

.stat-value {
  color: #2B3674;
  font-size: 30px;
  font-weight: 800;
  margin: 0;
  line-height: 1;
}

.stat-unit {
  color: #A3AED0;
  font-size: 14px;
  font-weight: 600;
}

.stat-trend {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  font-weight: 700;
  padding: 4px 10px;
  border-radius: 8px;
}

.stat-trend.up { background: rgba(5, 205, 153, 0.1); color: #05CD99; }
.stat-trend.down { background: rgba(255, 181, 71, 0.1); color: #FFB547; }

.stat-icon-wrapper {
  width: 56px;
  height: 56px;
  border-radius: 16px;
  background: var(--theme-color);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  box-shadow: 0 8px 16px -4px var(--theme-color);
}

.stat-deco {
  position: absolute;
  top: -20px;
  right: -20px;
  width: 100px;
  height: 100px;
  border-radius: 50%;
  background: var(--theme-color);
  opacity: 0.03;
  z-index: 1;
}

/* Content Cards */
.content-card {
  background: #FFFFFF;
  border-radius: 20px;
  padding: 24px;
  box-shadow: 0px 4px 20px rgba(0, 0, 0, 0.02);
  height: 100%;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 1px solid #E9EDF7;
}

.card-header.borderless {
  border-bottom: none;
  padding-bottom: 10px;
}

.header-title {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-title h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: #2B3674;
}

.icon-box {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
}
.icon-box.primary { background: rgba(67, 24, 255, 0.1); color: #4318FF; }

/* Custom Radio Group */
:deep(.custom-radio .el-radio-button__inner) {
  border: none !important;
  background: #F4F7FE;
  color: #A3AED0;
  font-weight: 600;
  border-radius: 8px !important;
  padding: 8px 16px;
  margin-left: 8px;
  box-shadow: none !important;
}

:deep(.custom-radio .el-radio-button.is-active .el-radio-button__inner) {
  background: #4318FF;
  color: white;
}

/* Chart Area */
.modern-chart-wrapper {
  display: flex;
  height: 320px;
  gap: 16px;
}

.y-axis {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding-bottom: 28px;
  color: #A3AED0;
  font-size: 12px;
  font-weight: 600;
  text-align: right;
  min-width: 40px;
}

.chart-area {
  flex: 1;
  display: flex;
  align-items: flex-end;
  justify-content: space-around;
  padding-bottom: 28px;
  position: relative;
  background-image: repeating-linear-gradient(to bottom, transparent, transparent calc(25% - 1px), #F4F7FE 25%);
  background-size: 100% 100%;
}

.bar-group {
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 100%;
  width: 40px;
  position: relative;
}

.bar-track {
  width: 100%;
  height: 100%;
  background: rgba(67, 24, 255, 0.05);
  border-radius: 8px;
  position: relative;
  display: flex;
  align-items: flex-end;
}

.bar-fill {
  width: 100%;
  background: linear-gradient(180deg, #4318FF 0%, #868CFF 100%);
  border-radius: 8px;
  transition: height 0.8s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  cursor: pointer;
}

.bar-fill:hover {
  background: linear-gradient(180deg, #3311DB 0%, #4318FF 100%);
}

.bar-label {
  position: absolute;
  bottom: -28px;
  color: #A3AED0;
  font-size: 12px;
  font-weight: 600;
}

/* Tooltip */
.tooltip {
  position: absolute;
  top: -35px;
  left: 50%;
  transform: translateX(-50%);
  background: #2B3674;
  color: white;
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 700;
  white-space: nowrap;
  opacity: 0;
  visibility: hidden;
  transition: all 0.2s;
}

.tooltip::after {
  content: '';
  position: absolute;
  bottom: -4px;
  left: 50%;
  transform: translateX(-50%);
  border-width: 4px 4px 0;
  border-style: solid;
  border-color: #2B3674 transparent transparent transparent;
}

.bar-fill:hover .tooltip {
  opacity: 1;
  visibility: visible;
  top: -40px;
}

/* Sidebar Layout */
.sidebar-layout {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* Quick Actions */
.action-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.action-item {
  padding: 20px 16px;
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1px solid transparent;
}

.action-item:hover {
  transform: translateY(-3px);
}

.action-icon {
  width: 48px;
  height: 48px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
}

.action-item span {
  font-size: 14px;
  font-weight: 700;
  color: #2B3674;
}

.action-item.primary { background: #F4F7FE; }
.action-item.primary .action-icon { background: #4318FF; color: white; }
.action-item.primary:hover { border-color: #4318FF; box-shadow: 0 10px 20px rgba(67,24,255,0.1); }

.action-item.info { background: #F0F9FF; }
.action-item.info .action-icon { background: #3998FC; color: white; }
.action-item.info:hover { border-color: #3998FC; box-shadow: 0 10px 20px rgba(57,152,252,0.1); }

.action-item.warning { background: #FFF9F0; }
.action-item.warning .action-icon { background: #FFB547; color: white; }
.action-item.warning:hover { border-color: #FFB547; box-shadow: 0 10px 20px rgba(255,181,71,0.1); }

.action-item.success { background: #F0FDF4; }
.action-item.success .action-icon { background: #05CD99; color: white; }
.action-item.success:hover { border-color: #05CD99; box-shadow: 0 10px 20px rgba(5,205,153,0.1); }

/* Timeline Activity */
.timeline {
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin-top: 10px;
}

.timeline-item {
  display: flex;
  gap: 16px;
  position: relative;
}

.timeline-item:not(:last-child)::after {
  content: '';
  position: absolute;
  left: 5px;
  top: 20px;
  bottom: -20px;
  width: 2px;
  background: #E9EDF7;
}

.timeline-marker {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  margin-top: 4px;
  position: relative;
  z-index: 1;
}
.marker-primary { background: #4318FF; box-shadow: 0 0 0 4px rgba(67, 24, 255, 0.1); }
.marker-warning { background: #FFB547; box-shadow: 0 0 0 4px rgba(255, 181, 71, 0.1); }
.marker-success { background: #05CD99; box-shadow: 0 0 0 4px rgba(5, 205, 153, 0.1); }

.timeline-content p {
  margin: 0 0 4px 0;
  font-size: 14px;
  color: #2B3674;
  line-height: 1.5;
}

.timeline-content strong {
  color: #111C44;
}

.timeline-content .time {
  font-size: 12px;
  color: #A3AED0;
  font-weight: 600;
}

/* Animations */
@keyframes ping {
  0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(5, 205, 153, 0.7); }
  70% { transform: scale(1); box-shadow: 0 0 0 6px rgba(5, 205, 153, 0); }
  100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(5, 205, 153, 0); }
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.animate-fade-in { animation: fadeIn 0.6s ease-out; }

/* Responsive adjustments */
@media (max-width: 768px) {
  .dashboard-header { flex-direction: column; align-items: flex-start; }
  .header-right { width: 100%; justify-content: space-between; }
  .modern-chart-wrapper { overflow-x: auto; }
  .chart-area { min-width: 500px; }
}
</style>