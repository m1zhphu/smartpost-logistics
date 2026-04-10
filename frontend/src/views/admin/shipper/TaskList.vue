<template>
  <div class="shipper-app-full">
    <div class="page-header mb-4">
      <div class="header-content">
        <h2 class="misa-title m-0">Nhiệm vụ Giao hàng</h2>
        <p class="text-muted mt-1 m-0 flex-align-center">
          <span class="status-dot online"></span>
          Chào buổi sáng, <strong>{{ auth.user?.full_name || 'Tài xế' }}</strong>!
        </p>
      </div>
      <el-button 
        type="primary" 
        plain
        :icon="RefreshRight" 
        @click="fetchData" 
        :loading="loading" 
      >
        Làm mới
      </el-button>
    </div>

    <el-row :gutter="20" class="mb-5">
      <el-col :xs="12" :sm="8" :md="6">
        <div class="stat-box warning-box">
          <div class="stat-title">ĐANG CHỜ GIAO</div>
          <div class="stat-value">{{ pendingTasks.length }} <span class="stat-unit">đơn</span></div>
        </div>
      </el-col>
      <el-col :xs="12" :sm="8" :md="6">
        <div class="stat-box success-box">
          <div class="stat-title">ĐÃ HOÀN THÀNH</div>
          <div class="stat-value">{{ completedCount }} <span class="stat-unit">đơn</span></div>
        </div>
      </el-col>
    </el-row>

    <div v-if="loading && pendingTasks.length === 0" class="loading-state">
      <el-icon class="is-loading text-primary" :size="40"><Loading /></el-icon>
      <p class="text-muted mt-2">Đang tải danh sách đơn hàng...</p>
    </div>

    <el-empty 
      v-else-if="pendingTasks.length === 0" 
      description="Tuyệt vời! Hiện tại không có đơn hàng nào cần giao." 
      :image-size="150"
    />

    <el-row v-else :gutter="20">
      <el-col 
        :xs="24" :sm="12" :md="8" :lg="8" :xl="6" 
        v-for="task in pendingTasks" :key="task.waybill_code" 
        class="mb-4"
      >
        <el-card shadow="hover" class="task-card">
          <div v-if="task.service_type === 'EXPRESS'" class="express-ribbon">HỎA TỐC</div>

          <div class="task-header">
            <span class="waybill-code">{{ task.waybill_code }}</span>
            <el-tag size="small" type="warning" effect="dark" class="font-bold">ĐANG GIAO</el-tag>
          </div>
          
          <el-divider class="my-3" />

          <div class="task-body">
            <div class="info-row">
              <div class="icon-circle primary-icon"><el-icon><User /></el-icon></div>
              <div class="info-content">
                <div class="info-name">{{ task.receiver_name }}</div>
                <a :href="'tel:' + task.receiver_phone" class="info-phone" @click.stop>
                  {{ task.receiver_phone }}
                </a>
              </div>
            </div>
            
            <div class="info-row mt-3">
              <div class="icon-circle danger-icon"><el-icon><Location /></el-icon></div>
              <div class="info-content">
                <div class="info-address">{{ task.receiver_address }}</div>
              </div>
            </div>

            <div v-if="task.note" class="note-box mt-3">
              <el-icon><Warning /></el-icon>
              <span>{{ task.note }}</span>
            </div>

            <div class="cod-container mt-4">
              <div class="cod-label"><el-icon><Money /></el-icon> THU KHÁCH (COD)</div>
              <div class="cod-amount">{{ formatMoney(task.cod_amount || task.total_amount_to_collect || 0) }} đ</div>
            </div>
          </div>

          <div class="task-actions mt-4">
            <el-button 
              type="success" 
              class="btn-confirm" 
              @click="gotoPOD(task)"
            >
              XÁC NHẬN GIAO HÀNG
            </el-button>
            <el-button 
              type="primary" 
              plain 
              class="btn-call" 
              @click="callCustomer(task.receiver_phone)"
              title="Gọi cho khách"
            >
              <el-icon :size="20"><PhoneFilled /></el-icon>
            </el-button>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { useRouter } from 'vue-router';
import { PhoneFilled, User, Location, RefreshRight, Money, Warning, Loading } from '@element-plus/icons-vue'; 
import api from '@/api/axios';
import { ElMessage } from 'element-plus';

const auth = useAuthStore();
const router = useRouter();

const loading = ref(false);
const allTasks = ref([]); 
const pendingTasks = ref([]);
const completedCount = ref(0);

const formatMoney = (val) => {
  if (!val) return '0';
  return Number(val).toLocaleString('vi-VN');
};

const fetchData = async () => {
  loading.value = true;
  try {
    const res = await api.get('/api/delivery/my-tasks');
    allTasks.value = res.data.items || res.data || [];

    // Lọc những đơn đang giao
    pendingTasks.value = allTasks.value.filter(t => t.status === 'DELIVERING');
    completedCount.value = allTasks.value.length - pendingTasks.value.length;
  } catch (err) {
    ElMessage.error('Không thể tải danh sách đơn hàng. Vui lòng kiểm tra mạng!');
    allTasks.value = [];
    pendingTasks.value = [];
  } finally {
    loading.value = false;
  }
};

const gotoPOD = (task) => {
  router.push(`/admin/shipper/pod/${task.waybill_code}`);
};

const callCustomer = (phone) => {
  if (phone) window.location.href = `tel:${phone}`;
};

onMounted(() => {
  fetchData();
});
</script>

<style scoped>
/* Tổng quan */
.shipper-app-full {
  padding: 0;
}
.m-0 { margin: 0; }
.mt-1 { margin-top: 4px; }
.mt-2 { margin-top: 8px; }
.mt-3 { margin-top: 12px; }
.mt-4 { margin-top: 16px; }
.mb-4 { margin-bottom: 16px; }
.mb-5 { margin-bottom: 20px; }
.my-3 { margin: 12px 0; }
.font-bold { font-weight: bold; }
.text-primary { color: #409EFF; }
.text-muted { color: #6b7280; font-size: 14px; }

/* Header */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: white;
  padding: 16px 20px;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
  border: 1px solid #ebeef5;
}
.misa-title { font-size: 22px; color: #1f2937; }
.flex-align-center { display: flex; align-items: center; gap: 6px; }
.status-dot { width: 8px; height: 8px; border-radius: 50%; }
.status-dot.online { background-color: #67C23A; box-shadow: 0 0 0 2px #e1f3d8; }

/* Thống kê */
.stat-box {
  padding: 16px 20px;
  border-radius: 12px;
  border: 1px solid;
  display: flex;
  flex-direction: column;
}
.stat-box.warning-box { background: #fdf6ec; border-color: #faecd8; }
.stat-box.success-box { background: #f0f9eb; border-color: #e1f3d8; }
.stat-title { font-size: 12px; font-weight: 800; color: #909399; margin-bottom: 4px; }
.stat-box.warning-box .stat-title { color: #E6A23C; }
.stat-box.success-box .stat-title { color: #67C23A; }
.stat-value { font-size: 28px; font-weight: 900; color: #303133; line-height: 1; }
.stat-unit { font-size: 14px; font-weight: 600; opacity: 0.8; }

/* Loading State */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 0;
}

/* Thẻ Task Card */
.task-card {
  border-radius: 12px;
  position: relative;
  border-top: 4px solid #E6A23C;
}
.express-ribbon {
  position: absolute;
  top: 0; right: 0;
  background: #F56C6C; color: white;
  font-size: 11px; font-weight: bold;
  padding: 4px 12px;
  border-bottom-left-radius: 12px;
}
.task-header { display: flex; justify-content: space-between; align-items: center; }
.waybill-code { font-size: 18px; font-weight: 900; color: #1d4ed8; letter-spacing: 0.5px; }

/* Nội dung thông tin */
.info-row { display: flex; align-items: flex-start; gap: 12px; }
.icon-circle {
  width: 36px; height: 36px; border-radius: 10px;
  display: flex; align-items: center; justify-content: center; font-size: 18px;
}
.primary-icon { background: #ecf5ff; color: #409EFF; }
.danger-icon { background: #fef0f0; color: #F56C6C; }
.info-content { flex: 1; }
.info-name { font-weight: bold; font-size: 15px; color: #1f2937; }
.info-phone { color: #409EFF; font-weight: bold; font-size: 15px; text-decoration: none; display: inline-block; margin-top: 2px; }
.info-address { font-size: 14px; color: #4b5563; line-height: 1.4; margin-top: 4px; }

/* Ghi chú */
.note-box {
  background: #fdf6ec; color: #e6a23c;
  padding: 8px 12px; border-radius: 8px;
  font-size: 13px; font-weight: 600;
  display: flex; align-items: flex-start; gap: 6px;
}
.note-box .el-icon { margin-top: 2px; }

/* Hộp COD */
.cod-container {
  background: #fef0f0; border: 1px dashed #f56c6c;
  border-radius: 8px; padding: 12px 16px;
  display: flex; justify-content: space-between; align-items: center;
}
.cod-label { font-size: 13px; font-weight: bold; color: #c81e1e; display: flex; align-items: center; gap: 4px; }
.cod-amount { font-size: 22px; font-weight: 900; color: #e53935; }

/* Các nút bấm */
.task-actions { display: flex; gap: 12px; }
.btn-confirm { flex: 1; height: 46px; font-size: 15px; font-weight: bold; border-radius: 8px; }
.btn-call { width: 56px; height: 46px; border-radius: 8px; padding: 0; }
</style>