<template>
  <div class="login-wrapper admin-login-wrapper">
    <div class="login-card">
      <div class="login-logo-top">
        <img src="@/assets/CompanyLogo4.png" alt="SmartPost Logistics" />
      </div>
      
      <div class="login-header">
        <h1>ĐĂNG NHẬP HỆ THỐNG</h1>
        <p class="subtitle">Dành cho Nhân viên & Quản trị viên</p>
      </div>
      
      <el-form :model="loginForm" :rules="rules" ref="formRef" class="login-form">
        <el-form-item prop="username">
          <el-input 
            v-model="loginForm.username" 
            placeholder="Tên đăng nhập" 
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
          type="warning" 
          class="login-btn" 
          :loading="loading" 
          @click="handleLogin"
        >ĐĂNG NHẬP HỆ THỐNG</el-button>
      </el-form>

      <div class="login-actions justify-center mt-20">
        <router-link to="/login" class="login-link text-warning">Đăng nhập tài khoản khách hàng</router-link>
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
import { User, Lock } from '@element-plus/icons-vue';

const router = useRouter();
const authStore = useAuthStore();
const formRef = ref(null);
const loading = ref(false);

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

      // Check roles: role_id 6 is customer
      if (role_id === 6) {
        ElMessage.error('Tài khoản khách hàng không được phép đăng nhập trang quản trị');
        return;
      }

      // Save user session
      authStore.setUser({ full_name }, access_token);
      
      ElMessage({
        message: 'Đăng nhập thành công! Đang vào hệ thống...',
        type: 'success',
        duration: 1500
      });
      
      await router.push('/admin/dashboard');
      
    } catch (error) {
      const msg = error.response?.data?.detail || 'Sai tài khoản hoặc mật khẩu';
      ElMessage.error(msg);
    } finally {
      loading.value = false;
    }
  });
};
</script>

<script>
import { User, Lock } from '@element-plus/icons-vue';
export default {
  components: {
    User, Lock
  }
}
</script>

<style scoped src="@/styles/auth/LoginView.css"></style>
<style scoped>
.subtitle {
  text-align: center;
  color: var(--text-muted);
  margin-top: 4px;
  font-size: 0.9rem;
}
.text-warning {
  color: #e6a23c;
  text-decoration: none;
  font-weight: 600;
}
.text-warning:hover {
  text-decoration: underline;
}
.justify-center {
  display: flex;
  justify-content: center;
}
.mt-20 {
  margin-top: 20px;
}
</style>
