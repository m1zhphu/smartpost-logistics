<template>
  <el-config-provider :locale="vi">
    <router-view />
  </el-config-provider>
</template>

<script setup>
import { onBeforeUnmount, onMounted, watch } from 'vue';
import vi from 'element-plus/es/locale/lang/vi';
import { ElMessage } from 'element-plus';
import api from '@/api/axios';
import { useAuthStore } from '@/stores/auth';

const authStore = useAuthStore();
let sessionCheckTimer = null;
let sessionCheckInFlight = false;
let sessionInvalidHandled = false;

const checkSession = async () => {
  if (!authStore.token) {
    sessionInvalidHandled = false;
    return;
  }
  if (sessionCheckInFlight || sessionInvalidHandled) return;
  sessionCheckInFlight = true;
  try {
    const response = await api.get('/api/auth/me', {
      validateStatus: (status) => status < 500
    });

    if ([401, 403].includes(response.status)) {
      sessionInvalidHandled = true;
      const message = response.data?.detail || 'Tài khoản không còn được phép truy cập hệ thống';
      ElMessage.error(message);
      authStore.logout();
    }
  } catch (error) {
    // Network errors are handled by normal API flows; do not logout without a server decision.
  } finally {
    sessionCheckInFlight = false;
  }
};

onMounted(() => {
  checkSession();
  sessionCheckTimer = window.setInterval(checkSession, 30000);
});

watch(() => authStore.token, () => {
  sessionInvalidHandled = false;
  checkSession();
});

onBeforeUnmount(() => {
  if (sessionCheckTimer) {
    window.clearInterval(sessionCheckTimer);
  }
});
</script>

<style src="@/styles/App.css"></style>
