<template>
  <div class="login-wrapper">
    <div class="login-card">
      <div class="login-logo-top">
        <img src="@/assets/CompanyLogo4.png" alt="SpeedLight Group" />
      </div>
      
      <div class="login-header">
        <h1>ĐĂNG NHẬP</h1>
      </div>
      
      <el-form :model="loginForm" :rules="rules" ref="formRef" class="login-form">
        <el-form-item prop="username">
          <el-input 
            v-model="loginForm.username" 
            placeholder="Tài khoản" 
            prefix-icon="User"
            clearable
            class="custom-input"
          ></el-input>
        </el-form-item>
        
        <el-form-item prop="password">
          <el-input 
            v-model="loginForm.password" 
            type="password" 
            placeholder="Mật khẩu" 
            prefix-icon="Lock" 
            show-password
            @keyup.enter="handleLogin"
            class="custom-input"
          ></el-input>
        </el-form-item>
        
        <el-button 
          type="primary" 
          class="login-btn" 
          :loading="loading" 
          @click="handleLogin"
        >ĐĂNG NHẬP</el-button>
      </el-form>
      
      <div class="login-actions">
        <button class="forgot-link" type="button" @click="openForgotDialog">Quên mật khẩu?</button>
        <span>Chưa có tài khoản?</span>
        <router-link to="/register" class="register-link">Đăng ký ngay</router-link>
      </div>

      <div style="text-align: center; margin-top: 16px; padding-top: 16px; border-top: 1px dashed #e2e8f0;">
        <span style="color: #64748b; font-size: 13px;">Bạn là nhân viên? </span>
        <router-link to="/admin/login" style="color: #4318ff; font-weight: 700; font-size: 13px; text-decoration: none;">Chuyển trang đăng nhập</router-link>
      </div>
      
      <div class="login-logo-bottom">
        <img src="@/assets/CompanyLogo2.png" alt="Speed Up Logistics" />
        <div class="logo-divider"></div>
        <img src="@/assets/CompanyLogo3.png" alt="Speed Up Invest" />
      </div>
    </div>

    <el-dialog
      v-model="forgotDialogVisible"
      title="Đặt lại mật khẩu"
      width="460px"
      destroy-on-close
    >
      <el-form :model="forgotForm" label-position="top">
        <el-form-item label="Email tài khoản">
          <el-input v-model="forgotForm.email" placeholder="Nhập email đã đăng ký" clearable />
        </el-form-item>

        <template v-if="forgotStep === 2">
          <el-form-item label="Mã OTP">
            <el-input v-model="forgotForm.otp" maxlength="6" placeholder="Nhập mã OTP 6 số" />
          </el-form-item>
          <el-form-item label="Mật khẩu mới">
            <el-input v-model="forgotForm.new_password" type="password" show-password placeholder="Tối thiểu 6 ký tự" />
          </el-form-item>
          <el-form-item label="Nhập lại mật khẩu mới">
            <el-input v-model="forgotForm.confirm_password" type="password" show-password placeholder="Nhập lại mật khẩu mới" />
          </el-form-item>
        </template>
      </el-form>
      <template #footer>
        <el-button @click="forgotDialogVisible = false">Hủy</el-button>
        <el-button v-if="forgotStep === 1" type="primary" :loading="forgotLoading" @click="requestForgotOtp">Gửi OTP</el-button>
        <el-button v-else type="primary" :loading="forgotLoading" @click="resetForgotPassword">Đặt lại mật khẩu</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '../../stores/auth';
import { ElMessage } from 'element-plus';
import api from '../../api/axios';

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();
const formRef = ref(null);
const loading = ref(false);
const rememberMe = ref(false);
const forgotDialogVisible = ref(false);
const forgotLoading = ref(false);
const forgotStep = ref(1);

const loginForm = reactive({
  username: '',
  password: ''
});

const forgotForm = reactive({
  email: '',
  otp: '',
  new_password: '',
  confirm_password: ''
});

const rules = {
  username: [
    { required: true, message: 'Vui lòng nhập tên đăng nhập', trigger: 'blur' }
  ],
  password: [
    { required: true, message: 'Vui lòng nhập mật khẩu', trigger: 'blur' },
    { min: 6, message: 'Mật khẩu phải có ít nhất 6 ký tự', trigger: 'blur' }
  ]
};

const openForgotDialog = () => {
  forgotStep.value = 1;
  forgotForm.email = '';
  forgotForm.otp = '';
  forgotForm.new_password = '';
  forgotForm.confirm_password = '';
  forgotDialogVisible.value = true;
};

const requestForgotOtp = async () => {
  if (!forgotForm.email.trim()) {
    ElMessage.warning('Vui lòng nhập email tài khoản');
    return;
  }

  forgotLoading.value = true;
  try {
    const res = await api.post('/api/auth/forgot-password/request-otp', {
      email: forgotForm.email.trim()
    });
    ElMessage.success(res.data?.message || 'OTP đã được gửi tới email nếu tài khoản tồn tại');
    forgotStep.value = 2;
  } catch (error) {
    ElMessage.error(error.response?.data?.detail || 'Không thể gửi OTP đặt lại mật khẩu');
  } finally {
    forgotLoading.value = false;
  }
};

const resetForgotPassword = async () => {
  if (!forgotForm.otp || forgotForm.otp.length !== 6) {
    ElMessage.warning('Vui lòng nhập mã OTP 6 số');
    return;
  }
  if (!forgotForm.new_password || forgotForm.new_password.length < 6) {
    ElMessage.warning('Mật khẩu mới phải có ít nhất 6 ký tự');
    return;
  }
  if (forgotForm.new_password !== forgotForm.confirm_password) {
    ElMessage.warning('Mật khẩu nhập lại không khớp');
    return;
  }

  forgotLoading.value = true;
  try {
    const res = await api.post('/api/auth/forgot-password/reset', {
      email: forgotForm.email.trim(),
      otp: forgotForm.otp,
      new_password: forgotForm.new_password
    });
    ElMessage.success(res.data?.message || 'Đặt lại mật khẩu thành công');
    loginForm.username = forgotForm.email.trim();
    forgotDialogVisible.value = false;
  } catch (error) {
    ElMessage.error(error.response?.data?.detail || 'Không thể đặt lại mật khẩu');
  } finally {
    forgotLoading.value = false;
  }
};

const handleLogin = async () => {
  if (!formRef.value) return;
  
  await formRef.value.validate(async (valid) => {
    if (!valid) return;
    
    loading.value = true;
    try {
      const response = await api.post('/api/auth/login', loginForm);
      const { access_token, full_name } = response.data;
      
      let role_id = null;
      if (access_token) {
        try {
          const base64Url = access_token.split('.')[1];
          const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
          const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
              return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
          }).join(''));
          const tokenData = JSON.parse(jsonPayload);
          role_id = tokenData.role_id;
        } catch (e) {
          console.error("Lỗi giải mã token", e);
        }
      }

      if (role_id !== 6) {
        ElMessage.error('Tài khoản nhân viên không được phép đăng nhập trang khách hàng. Vui lòng truy cập cổng đăng nhập nhân viên.');
        return;
      }

      // Lưu thông tin vào store
      authStore.setUser({ full_name }, access_token);
      
      ElMessage({
        message: 'Đăng nhập thành công! Đang vào hệ thống...',
        type: 'success',
        duration: 1500
      });
      
      const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '';
      await router.push(redirect && redirect.startsWith('/') ? redirect : '/customer/dashboard');
      
    } catch (error) {
      const msg = error.response?.data?.detail || 'Sai tài khoản hoặc mật khẩu';
      ElMessage.error(msg);
    } finally {
      // SỬA LỖI: Luôn tắt vòng xoay loading bất kể thành công hay lỗi
      loading.value = false;
    }
  });
};
</script>

<style scoped src="@/styles/auth/LoginView.css"></style>
