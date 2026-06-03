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

<style scoped src="@/styles/admin/shipper/TaskList.css"></style>