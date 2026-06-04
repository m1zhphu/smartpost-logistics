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
        <span>Chưa có tài khoản?</span>
        <router-link to="/register" class="register-link">Đăng ký ngay</router-link>
      </div>
      
      <div class="login-logo-bottom">
        <img src="@/assets/CompanyLogo2.png" alt="Speed Up Logistics" />
        <div class="logo-divider"></div>
        <img src="@/assets/CompanyLogo3.png" alt="Speed Up Invest" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../../stores/auth';
import { ElMessage } from 'element-plus';
import api from '../../api/axios';

const router = useRouter();
const authStore = useAuthStore();
const formRef = ref(null);
const loading = ref(false);
const rememberMe = ref(false);

const loginForm = reactive({
  username: '',
  password: ''
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

const handleLogin = async () => {
  if (!formRef.value) return;
  
  await formRef.value.validate(async (valid) => {
    if (!valid) return;
    
    loading.value = true;
    try {
      const response = await api.post('/api/auth/login', loginForm);
      const { user, access_token } = response.data;
      
      // Lưu thông tin vào store
      authStore.setUser(user, access_token);
      
      ElMessage({
        message: 'Đăng nhập thành công! Đang vào hệ thống...',
        type: 'success',
        duration: 1500
      });
      
      if (authStore.isCustomer) {
        await router.push('/customer/portal');
      } else {
        await router.push('/admin/dashboard');
      }
      
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