<template>
  <div class="login-wrapper">
    <div class="login-card">
      <div class="login-header">
        <h1>SmartPost</h1>
        <p>Hệ thống Quản trị Logistics Thông minh</p>
      </div>
      
      <el-form :model="loginForm" :rules="rules" ref="formRef" label-position="top">
        <el-form-item label="Tên đăng nhập" prop="username">
          <el-input 
            v-model="loginForm.username" 
            placeholder="Nhập tên đăng nhập" 
            prefix-icon="User"
            clearable
          ></el-input>
        </el-form-item>
        
        <el-form-item label="Mật khẩu" prop="password">
          <el-input 
            v-model="loginForm.password" 
            type="password" 
            placeholder="Nhập mật khẩu" 
            prefix-icon="Lock" 
            show-password
            @keyup.enter="handleLogin"
          ></el-input>
        </el-form-item>
        
        <div class="form-footer">
          <el-checkbox v-model="rememberMe">Ghi nhớ</el-checkbox>
          <el-link type="primary" underline="never">Quên mật khẩu?</el-link>
        </div>
        
        <el-button 
          type="primary" 
          class="login-btn" 
          :loading="loading" 
          @click="handleLogin"
        >Đăng nhập</el-button>
      </el-form>
      
      <div class="login-footer">
        <span>Chưa có tài khoản? <el-link type="primary" underline="never" @click="$router.push('/setup-admin')">Thiết lập hệ thống</el-link></span>
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
      
      // SỬA LỖI: Chuyển thẳng đến Dashboard thay vì '/' để tránh kẹt Router
      await router.push('/admin/dashboard');
      
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

<style scoped>
.login-wrapper {
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #1E293B 0%, #0F172A 100%);
  color: white;
}

.login-card {
  width: 400px;
  background: white;
  padding: 2.5rem;
  border-radius: 12px;
  box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);
  color: #333; /* Fallback an toàn nếu chưa cấu hình biến CSS */
  animation: slideUp 0.5s ease-out;
}

.login-header {
  text-align: center;
  margin-bottom: 2rem;
}

.login-header h1 {
  color: #409EFF; /* Màu primary của Element Plus */
  font-size: 2.25rem;
  font-weight: 800;
  margin-bottom: 0.5rem;
}

.login-header p {
  color: #6b7280;
  font-size: 0.95rem;
}

.form-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.login-btn {
  width: 100%;
  height: 44px;
  font-size: 1rem;
  font-weight: 600;
}

.login-footer {
  margin-top: 1.5rem;
  text-align: center;
  font-size: 0.9rem;
  color: #6b7280;
}

@keyframes slideUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>