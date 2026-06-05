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
           <div style="display: flex; justify-content: center; gap: 10px; margin-top: 10px;">
             <el-button type="info" size="small" plain @click="goBack">Quay lại</el-button>
           </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Search, StarFilled } from '@element-plus/icons-vue';
import QrcodeVue from 'qrcode.vue';
import api from '@/api/axios';
import moment from 'moment';
import { ElMessage } from 'element-plus';

const route = useRoute();
const router = useRouter();
const waybillCode = ref('');
const loading = ref(false);
const searched = ref(false);
const trackingData = ref(null);
const trackingLogs = ref([]);

const goBack = () => {
  if (window.history.length > 1) {
    router.back();
  } else {
    router.push('/customer/portal');
  }
};

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

<style scoped src="@/styles/customer/tracking/PublicTracking.css"></style>
