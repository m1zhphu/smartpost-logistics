<template>
  <div class="public-tracking-page">
    <div class="tracking-container">
      <div class="tracking-card">
        <div class="tracking-header">
           <div class="logo">SmartPost</div>
           <h1>Theo dõi Hành trình Vận đơn</h1>
           <p>Kết nối & Vận chuyển nhanh chóng</p>
        </div>

        <div class="search-section mb-6">
          <el-input 
            v-model="waybillCode" 
            placeholder="Nhập mã vận đơn (SP...)" 
            size="large"
            @keyup.enter="handleTrack"
          >
            <template #append>
              <el-button type="primary" :icon="Search" @click="handleTrack" :loading="loading">TÌM KIẾM</el-button>
            </template>
          </el-input>
        </div>

        <div v-if="trackingData" class="tracking-results">
           <el-divider />
           <div class="waybill-summary mb-4 flex-between">
              <div class="info">
                <h3>{{ trackingData.waybill_code }}</h3>
                <p>Người nhận: <span class="font-bold">{{ trackingData.receiver_name }}</span></p>
                <p>Trạng thái hiện tại: <el-tag size="small" type="success">{{ trackingData.status }}</el-tag></p>
              </div>
              <div class="qr-code">
                 <qrcode-vue :value="trackingData.waybill_code" :size="80" level="H" />
              </div>
           </div>

           <el-timeline>
              <el-timeline-item
                v-for="(log, index) in trackingLogs"
                :key="index"
                :type="index === 0 ? 'primary' : ''"
                :icon="index === 0 ? 'StarFilled' : ''"
                :timestamp="formatTime(log.system_time)"
                placement="top"
              >
                <el-card class="timeline-card">
                  <h4 class="font-bold">{{ log.status_id }}</h4>
                  <p class="text-muted">{{ log.note }}</p>
                  <p v-if="log.hub_name" class="hub-loc">@ {{ log.hub_name }}</p>
                </el-card>
              </el-timeline-item>
           </el-timeline>
        </div>

        <div v-else-if="searched && !loading" class="empty-results mt-6">
           <el-empty description="Không tìm thấy mã vận đơn. Vui lòng kiểm tra lại!" />
        </div>
        
        <div class="tracking-footer">
           <p>© 2026 SmartPost Logistics • Hotline 24/7: 1900 1234</p>
           <el-button text type="primary" @click="$router.push('/login')">Đăng nhập hệ thống nhân viên</el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { Search, StarFilled } from '@element-plus/icons-vue';
import QrcodeVue from 'qrcode.vue';
import api from '@/api/axios';
import moment from 'moment';
import { ElMessage } from 'element-plus';

const route = useRoute();
const waybillCode = ref('');
const loading = ref(false);
const searched = ref(false);
const trackingData = ref(null);
const trackingLogs = ref([]);

const handleTrack = async () => {
  if (!waybillCode.value) return;
  loading.value = true;
  searched.value = true;
  try {
    const res = await api.get(`/api/waybills/public/${waybillCode.value}`);
    trackingData.value = res.data.waybill;
    trackingLogs.value = res.data.logs;
  } catch (err) {
    trackingData.value = null;
    trackingLogs.value = [];
    ElMessage.warning('Không tìm thấy thông tin cho mã đơn này.');
  } finally {
    loading.value = false;
  }
};

const formatTime = (t) => moment(t).format('DD/MM/YYYY HH:mm');

onMounted(() => {
  const code = route.params.code;
  if (code && code !== ':code') {
    waybillCode.value = code;
    handleTrack();
  }
});
</script>

<style scoped>
.public-tracking-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #F3F4F6 0%, #E5E7EB 100%);
  display: flex;
  justify-content: center;
  padding: 3rem 1rem;
}

.tracking-container { width: 100%; max-width: 800px; }

.tracking-card {
  background: white;
  padding: 3rem;
  border-radius: 12px;
  box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
}

.tracking-header { text-align: center; margin-bottom: 2.5rem; }

.logo {
  font-size: 2.5rem;
  font-weight: 800;
  color: var(--misa-primary);
  letter-spacing: -1px;
}

.tracking-header h1 { font-size: 1.5rem; margin-top: 0.5rem; color: #1F2937; }
.tracking-header p { color: #6B7280; font-size: 0.95rem; }

.mb-6 { margin-bottom: 1.5rem; }
.mt-6 { margin-top: 1.5rem; }
.mb-4 { margin-bottom: 1rem; }
.font-bold { font-weight: 700; }

.waybill-summary h3 { font-size: 1.25rem; font-weight: 800; color: var(--misa-primary); margin-bottom: 0.5rem; }
.waybill-summary p { font-size: 0.95rem; color: #4B5563; margin: 4px 0; }

.timeline-card { border: 1px solid #E5E7EB; box-shadow: none; padding: 10px; }
.timeline-card h4 { font-size: 1.1rem; color: #111827; }
.timeline-card .text-muted { font-size: 0.9rem; color: #6B7280; margin: 5px 0; }
.timeline-card .hub-loc { color: var(--misa-primary); font-weight: 700; font-size: 0.85rem; }

.tracking-footer {
  margin-top: 3rem;
  text-align: center;
  border-top: 1px solid #F3F4F6;
  padding-top: 1.5rem;
  font-size: 0.85rem;
  color: #9CA3AF;
}

:deep(.el-input-group__append) { background-color: var(--misa-primary) !important; color: white !important; border: none !important; }
</style>
