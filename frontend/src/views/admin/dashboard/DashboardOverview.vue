<template>
  <div class="dashboard-container">
    <!-- Static Backdrop for Premium Feel -->
    <div class="backdrop-glow"></div>

    <div class="dashboard-content">
      <!-- Header Section -->
      <header class="dashboard-header animate__animated animate__fadeIn">
        <div class="header-info">
          <h1>Hệ thống SmartPost <span class="badge">Live</span></h1>
          <p>Chào mừng trở lại, đây là hiệu suất bưu cục của bạn hôm nay.</p>
        </div>
        <div class="header-actions">
          <div class="last-sync-tag">
            <el-icon><Timer /></el-icon> Cập nhật: {{ lastSync }}
          </div>
          <el-button type="primary" class="premium-btn" @click="refreshData" :loading="loading">
            <el-icon><Refresh /></el-icon> <span>Làm mới</span>
          </el-button>
        </div>
      </header>

      <!-- Main Statistics Grid -->
      <el-row :gutter="24" class="stat-grid">
        <el-col :xs="24" :sm="12" :lg="8" v-for="(stat, index) in statConfig" :key="index">
          <div class="glass-card stat-card ripple" :style="`--card-color: ${stat.color}`">
            <div class="stat-icon">
              <el-icon><component :is="stat.icon" /></el-icon>
            </div>
            <div class="stat-data">
              <span class="label">{{ stat.label }}</span>
              <div class="value-row">
                <h2 class="value counter">{{ stat.value }}</h2>
                <span class="unit">{{ stat.unit }}</span>
              </div>
              <div class="trend" :class="stat.trendDir">
                <el-icon><component :is="stat.trendIcon" /></el-icon>
                <span>{{ stat.trendText }}</span>
              </div>
            </div>
            <div class="stat-chart-mini">
              <div class="sparkline">
                <div v-for="i in 5" :key="i" class="spark-bar" :style="`height: ${Math.random()*60+20}%`"></div>
              </div>
            </div>
          </div>
        </el-col>
      </el-row>

      <!-- Charts & Tables Section -->
      <el-row :gutter="24" class="content-grid">
        <!-- Analytics Chart -->
        <el-col :lg="16" :md="24">
          <div class="glass-card main-chart-card">
            <div class="card-header-premium">
              <div class="title-box">
                <el-icon><TrendCharts /></el-icon>
                <h3>Sản lượng vận đơn (7 ngày)</h3>
              </div>
              <el-radio-group v-model="chartTime" size="small" class="theme-toggle">
                <el-radio-button label="7d">7 Ngày</el-radio-button>
                <el-radio-button label="30d">30 Ngày</el-radio-button>
              </el-radio-group>
            </div>
            
            <div class="premium-chart">
              <div class="y-axis">
                <span>{{ maxChartVal }}</span>
                <span>{{ Math.floor(maxChartVal * 0.75) }}</span>
                <span>{{ Math.floor(maxChartVal * 0.5) }}</span>
                <span>{{ Math.floor(maxChartVal * 0.25) }}</span>
                <span>0</span>
              </div>
              <div class="chart-bars" v-if="stats && stats.chart_data">
                <div v-for="(val, key) in stats.chart_data" :key="key" class="bar-wrapper">
                  <!-- Simplified height logic for reliability -->
                  <div class="bar-pillar" :style="`height: ${Math.min((val * 10) + 20, 260)}px`" v-if="maxChartVal > 1">
                    <div class="pillar-inner" v-if="val > 0"></div>
                    <span class="bar-val-hint" v-if="val > 0">{{ val }}</span>
                  </div>
                  <!-- Fallback to percentage if data is large -->
                  <div class="bar-pillar" :style="`height: calc(${(val/maxChartVal)*100}% + 4px)`" v-else>
                    <div class="pillar-inner" v-if="val > 0"></div>
                    <span class="bar-val-hint" v-if="val > 0">{{ val }}</span>
                  </div>
                  <span class="bar-date">{{ key }}</span>
                </div>
              </div>
              <div class="chart-empty flex-center" v-else>
                <el-empty description="Chưa có dữ liệu" :image-size="60" />
              </div>
            </div>
          </div>
        </el-col>

        <!-- Quick Access & Info -->
        <el-col :lg="8" :md="24">
          <div class="glass-card activity-card">
            <div class="card-header-premium">
              <h3>Thao tác nhanh</h3>
            </div>
            <div class="quick-grid">
              <div @click="$router.push('/admin/waybills/create')" class="quick-item purple">
                <el-icon><Plus /></el-icon>
                <span>Tạo đơn mới</span>
              </div>
              <div @click="$router.push('/admin/warehouse/scan-in')" class="quick-item blue">
                <el-icon><List /></el-icon>
                <span>Nhập kho</span>
              </div>
              <div @click="$router.push('/admin/accounting/cod')" class="quick-item orange">
                <el-icon><Wallet /></el-icon>
                <span>Đối soát</span>
              </div>
              <div @click="$router.push('/admin/users')" class="quick-item green">
                <el-icon><User /></el-icon>
                <span>Nhân sự</span>
              </div>
            </div>

            <div class="recent-activity">
              <h4>Hoạt động gần đây</h4>
              <div class="activity-list">
                <div v-for="i in 3" :key="i" class="activity-item">
                  <div class="dot" :class="['blue','orange','green'][i-1]"></div>
                  <div class="act-content">
                    <p><b>Hệ thống</b> vừa cập nhật bảng giá {{ ['Express','Standard','Bulk'][i-1] }}</p>
                    <small>{{ i * 5 }} phút trước</small>
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
    color: '#3B82F6',
    trendDir: 'up',
    trendIcon: CaretTop,
    trendText: '+12% so với hôm qua'
  },
  {
    label: 'COD CHỜ THU',
    value: formatMoney(stats.value.total_cod_pending),
    unit: 'VNĐ',
    icon: Wallet,
    color: '#F59E0B',
    trendDir: 'down',
    trendIcon: Warning,
    trendText: 'Đang cầm bởi Shipper'
  },
  {
    label: 'COD ĐÃ NỘP KHO',
    value: formatMoney(stats.value.total_cod_settled),
    unit: 'VNĐ',
    icon: Check,
    color: '#10B981',
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
/* Base Variables & Container */
.dashboard-container {
  min-height: calc(100vh - 64px);
  padding: 30px;
  background-color: #f0f2f5;
  position: relative;
  overflow: hidden;
  font-family: 'Inter', -apple-system, sans-serif;
}

.backdrop-glow {
  position: absolute;
  top: -10%; right: -10%;
  width: 500px; height: 500px;
  background: radial-gradient(circle, rgba(59, 130, 246, 0.1) 0%, transparent 70%);
  z-index: 1;
  pointer-events: none;
}

.dashboard-content {
  position: relative;
  z-index: 2;
  width: 100%;
}

/* Glassmorphism Cards */
.glass-card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.5);
  border-radius: 20px;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.02);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.glass-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
}

/* Header Styles */
.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 32px;
}

.header-info h1 {
  font-size: 28px;
  font-weight: 800;
  color: #1e293b;
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 0;
}

.badge {
  font-size: 11px;
  background: #ef4444;
  color: white;
  padding: 2px 8px;
  border-radius: 20px;
  text-transform: uppercase;
  animation: pulse 2s infinite;
}

.header-info p {
  color: #64748b;
  margin: 8px 0 0;
  font-size: 15px;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 16px;
}

.last-sync-tag {
  background: #e2e8f0;
  padding: 8px 16px;
  border-radius: 12px;
  font-size: 13px;
  color: #475569;
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 600;
}

.premium-btn {
  height: 40px;
  border-radius: 12px;
  font-weight: 600;
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  border: none;
  box-shadow: 0 4px 6px -1px rgba(59, 130, 246, 0.4);
}

/* Stat Cards */
.stat-grid {
  margin-bottom: 32px;
}

.stat-card {
  padding: 24px;
  display: flex;
  align-items: flex-start;
  gap: 20px;
  position: relative;
  overflow: hidden;
}

.stat-icon {
  width: 54px;
  height: 54px;
  border-radius: 14px;
  background: var(--card-color);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 24px;
  box-shadow: 0 8px 16px -4px var(--card-color);
}

.stat-data {
  flex: 1;
}

.stat-data .label {
  font-size: 12px;
  font-weight: 700;
  color: #64748b;
  letter-spacing: 1px;
  text-transform: uppercase;
}

.value-row {
  display: flex;
  align-items: baseline;
  gap: 4px;
  margin: 4px 0;
}

.stat-data .value {
  font-size: 26px;
  font-weight: 800;
  color: #0f172a;
}

.stat-data .unit {
  font-size: 14px;
  font-weight: 600;
  color: #94a3b8;
}

.trend {
  font-size: 12px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 4px;
}

.trend.up { color: #10b981; }
.trend.down { color: #f59e0b; }

.stat-chart-mini {
  position: absolute;
  right: 0; bottom: 0;
  width: 100px; height: 60px;
  opacity: 0.15;
}

.sparkline {
  display: flex;
  align-items: flex-end;
  gap: 4px;
  height: 100%;
  padding-bottom: 10px;
}

.spark-bar {
  flex: 1;
  background: var(--card-color);
  border-radius: 2px 2px 0 0;
}

/* Premium Chart */
.main-chart-card {
  padding: 24px;
  height: 100%;
}

.card-header-premium {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
}

.title-box { display: flex; align-items: center; gap: 10px; }
.title-box h3 { margin: 0; font-size: 18px; font-weight: 800; color: #1e293b; }
.title-box .el-icon { color: #3b82f6; font-size: 20px; }

.premium-chart {
  display: flex;
  height: 300px;
  gap: 20px;
  position: relative;
}

.y-axis {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding-bottom: 25px;
  color: #94a3b8;
  font-size: 11px;
  font-weight: 600;
}

.chart-bars {
  flex: 1;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  border-bottom: 2px solid #f1f5f9;
  padding: 0 10px;
}

.bar-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  max-width: 60px;
  position: relative;
}

.bar-pillar {
  width: 34px;
  background: #f1f5f9;
  border-radius: 8px 8px 0 0;
  position: relative;
  transition: all 0.5s ease;
  overflow: hidden;
}

.pillar-inner {
  position: absolute;
  bottom: 0; left: 0; right: 0; top: 0;
  background: linear-gradient(to top, #3b82f6, #60a5fa);
  opacity: 0.8;
  transition: all 0.3s;
}

.bar-wrapper:hover .pillar-inner {
  opacity: 1;
  transform: scaleX(1.1);
}

.bar-value-pop {
  position: absolute;
  top: -25px;
  background: #1e293b;
  color: white;
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 4px;
  opacity: 0;
  transition: 0.3s;
}

.bar-wrapper:hover .bar-value-pop { opacity: 1; transform: translateY(-5px); }

.bar-val-hint {
  position: absolute;
  top: -20px;
  font-size: 10px;
  font-weight: 800;
  color: #3b82f6;
  width: 100%;
  text-align: center;
}
.bar-date {
  font-size: 11px;
  color: #94a3b8;
  font-weight: 700;
  margin-top: 10px;
}

/* Quick Access & Activity */
.quick-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 30px;
}

.quick-item {
  padding: 20px 10px;
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  transition: 0.3s;
  background: #f8fafc;
}

.quick-item:hover { transform: scale(1.05); }
.quick-item .el-icon { font-size: 24px; }
.quick-item span { font-size: 13px; font-weight: 700; color: #475569; }

.quick-item.purple { background: #f5f3ff; color: #7c3aed; }
.quick-item.blue { background: #eff6ff; color: #2563eb; }
.quick-item.orange { background: #fff7ed; color: #ea580c; }
.quick-item.green { background: #f0fdf4; color: #16a34a; }

.recent-activity h4 { font-size: 14px; font-weight: 800; color: #1e293b; margin-bottom: 16px; }
.activity-list { display: flex; flex-direction: column; gap: 16px; }
.activity-item { display: flex; gap: 12px; }
.activity-item .dot { width: 10px; height: 10px; border-radius: 50%; margin-top: 4px; }
.activity-item .dot.blue { background: #3b82f6; }
.activity-item .dot.orange { background: #f59e0b; }
.activity-item .dot.green { background: #10b981; }
.activity-item .act-content p { margin: 0; font-size: 13px; color: #334155; line-height: 1.4; }
.activity-item .act-content small { color: #94a3b8; font-size: 11px; }

/* Animations */
@keyframes pulse {
  0% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.05); opacity: 0.8; }
  100% { transform: scale(1); opacity: 1; }
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.animate__fadeIn { animation: fadeIn 0.6s ease-out; }
</style>