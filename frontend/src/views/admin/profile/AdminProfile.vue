<template>
  <div class="customer-portal">
    <div class="portal-container">
      <el-row :gutter="24" class="portal-content">
        <el-col :span="12" :offset="6">
          <el-card class="profile-card info-card animate-fade-in" style="margin-bottom: 20px;">
            <template #header>
              <div class="card-header-title">
                <el-icon><User /></el-icon><span>Thông tin tài khoản quản trị</span>
              </div>
            </template>
            <div class="profile-details text-center">
              <el-avatar :size="90" class="portal-avatar mx-auto mb-3">{{ authStore.user?.full_name?.charAt(0) || 'A' }}</el-avatar>
              <h3 class="mb-3">{{ authStore.user?.full_name || 'Quản trị viên' }}</h3>
              
              <div class="details-list text-left mt-3 mb-4 w-full mx-auto" style="max-width: 450px; text-align: left;">
                <div class="detail-item">
                  <span class="label">Tên tài khoản (Username):</span>
                  <span class="value">@{{ authStore.user?.username || 'admin' }}</span>
                </div>
                <div class="detail-item">
                  <span class="label">Vai trò hệ thống:</span>
                  <span class="value">
                    <el-tag type="danger" size="small" effect="dark">{{ userRoleLabel }}</el-tag>
                  </span>
                </div>
                <div class="detail-item" v-if="userHubName">
                  <span class="label">Bưu cục công tác:</span>
                  <span class="value">{{ userHubName }}</span>
                </div>
              </div>
              
              <div style="margin-top: 15px;">
                <el-button type="primary" @click="openChangePasswordDialog">Đổi mật khẩu</el-button>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>

      <!-- Dialog đổi mật khẩu -->
      <el-dialog v-model="changePasswordVisible" title="Đổi mật khẩu" width="460px" destroy-on-close>
        <el-form :model="changePasswordForm" label-position="top">
          <el-form-item label="Mật khẩu hiện tại">
            <el-input v-model="changePasswordForm.current_password" type="password" show-password />
          </el-form-item>
          <el-form-item label="Mật khẩu mới">
            <el-input v-model="changePasswordForm.new_password" type="password" show-password />
          </el-form-item>
          <el-form-item label="Nhập lại mật khẩu mới">
            <el-input v-model="changePasswordForm.confirm_password" type="password" show-password />
          </el-form-item>
        </el-form>
        <template #footer>
          <span class="dialog-footer">
            <el-button @click="changePasswordVisible = false">Hủy</el-button>
            <el-button type="primary" :loading="changePasswordLoading" @click="changePassword">Lưu mật khẩu</el-button>
          </span>
        </template>
      </el-dialog>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { ElMessage } from 'element-plus';
import api from '@/api/axios';
import { User, Lock } from '@element-plus/icons-vue';

const authStore = useAuthStore();

const userHubName = ref('');
const changePasswordVisible = ref(false);
const changePasswordLoading = ref(false);

const changePasswordForm = reactive({
  current_password: '',
  new_password: '',
  confirm_password: ''
});

const userRoleLabel = computed(() => {
  if (authStore.isCustomer) return 'Khách hàng';
  if (authStore.isAdmin) return 'Quản trị viên';
  const role = authStore.user?.role_id;
  if (role === 2) return 'Quản lý bưu cục';
  if (role === 3) return 'Nhân viên kho';
  if (role === 4) return 'Bưu tá (Shipper)';
  if (role === 5) return 'Kế toán';
  if (role === 7) return 'CSKH';
  return 'Nhân viên';
});

const openChangePasswordDialog = () => {
  changePasswordForm.current_password = '';
  changePasswordForm.new_password = '';
  changePasswordForm.confirm_password = '';
  changePasswordVisible.value = true;
};

const changePassword = async () => {
  if (!changePasswordForm.current_password) {
    ElMessage.warning('Vui lòng nhập mật khẩu hiện tại');
    return;
  }
  if (!changePasswordForm.new_password || changePasswordForm.new_password.length < 6) {
    ElMessage.warning('Mật khẩu mới phải có ít nhất 6 ký tự');
    return;
  }
  if (changePasswordForm.new_password !== changePasswordForm.confirm_password) {
    ElMessage.warning('Mật khẩu nhập lại không khớp');
    return;
  }

  changePasswordLoading.value = true;
  try {
    const res = await api.post('/api/auth/change-password', {
      current_password: changePasswordForm.current_password,
      new_password: changePasswordForm.new_password
    });
    ElMessage.success(res.data?.message || 'Đổi mật khẩu thành công');
    changePasswordVisible.value = false;
  } catch (err) {
    ElMessage.error(err.response?.data?.detail || 'Không thể đổi mật khẩu');
  } finally {
    changePasswordLoading.value = false;
  }
};

onMounted(async () => {
  if (authStore.user) {
    try {
      const res = await api.get('/api/auth/me');
      if (res.data?.primary_hub?.hub_name) {
        userHubName.value = res.data.primary_hub.hub_name;
      } else if (res.data?.primary_hub_id) {
         const hubRes = await api.get(`/api/hubs`);
         const myHub = hubRes.data.find(h => h.hub_id === res.data.primary_hub_id);
         if (myHub) userHubName.value = myHub.hub_name;
      }
    } catch (e) {
      console.error('Không thể lấy thông tin bưu cục', e);
    }
  }
});
</script>

<style scoped src="../../customer/CustomerPortal.css"></style>
