<template>
  <div class="setup-wrapper">
    <div class="setup-card">
      <div class="setup-header">
        <el-icon class="setup-icon"><Management /></el-icon>
        <h1>Thiết lập Quản trị viên</h1>
        <p>Chào mừng đến với SmartPost. Hãy tạo tài khoản Quản trị tối cao (Super Admin) để bắt đầu sử dụng hệ thống.</p>
      </div>

      <el-form :model="setupForm" :rules="rules" ref="formRef" label-position="top">
        <el-form-item label="Tên đăng nhập" prop="username">
          <el-input v-model="setupForm.username" placeholder="admin" prefix-icon="User" />
        </el-form-item>
        
        <el-form-item label="Họ và tên" prop="full_name">
          <el-input v-model="setupForm.full_name" placeholder="Nguyễn Văn A" prefix-icon="Postcard" />
        </el-form-item>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="Mật khẩu" prop="password">
              <el-input v-model="setupForm.password" type="password" placeholder="Tối thiểu 6 ký tự" show-password prefix-icon="Lock" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="Xác nhận mật khẩu" prop="confirmPassword">
              <el-input v-model="setupForm.confirmPassword" type="password" placeholder="Nhập lại mật khẩu" show-password prefix-icon="Select" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="Email công việc" prop="email">
           <el-input v-model="setupForm.email" placeholder="admin@smartpost.vn" prefix-icon="Message" />
        </el-form-item>

        <el-button type="primary" class="setup-btn" :loading="loading" @click="handleSetup">Xác nhận & Khởi tạo</el-button>
      </el-form>
      
      <div class="setup-footer">
        <el-link underline="never" @click="$router.push('/login')">Quay lại Đăng nhập</el-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, ElNotification } from 'element-plus';
import api from '../../../api/axios';

const router = useRouter();
const formRef = ref(null);
const loading = ref(false);

const setupForm = reactive({
  username: '',
  full_name: '',
  password: '',
  confirmPassword: '',
  email: ''
});

const validatePass2 = (rule, value, callback) => {
  if (value !== setupForm.password) {
    callback(new Error('Mật khẩu xác nhận không khớp!'));
  } else {
    callback();
  }
};

const rules = {
  username: [{ required: true, message: 'Nhập tên đăng nhập', trigger: 'blur' }],
  full_name: [{ required: true, message: 'Nhập họ tên', trigger: 'blur' }],
  password: [{ required: true, message: 'Nhập mật khẩu', trigger: 'blur', min: 6 }],
  confirmPassword: [
    { required: true, message: 'Vui lòng xác nhận mật khẩu', trigger: 'blur' },
    { validator: validatePass2, trigger: 'blur' }
  ],
  email: [{ type: 'email', message: 'Email không hợp lệ', trigger: 'blur' }]
};

const handleSetup = async () => {
  if (!formRef.value) return;
  
  await formRef.value.validate(async (valid) => {
    if (valid) {
      loading.value = true;
      try {
        await api.post('/api/setup-admin', setupForm);
        ElNotification({
          title: 'Khởi tạo thành công',
          message: 'Tài khoản Super Admin đã được tạo. Vui lòng đăng nhập.',
          type: 'success',
        });
        router.push('/login');
      } catch (error) {
        ElMessage.error(error.response?.data?.detail || 'Lỗi khi khởi tạo hệ thống.');
      } finally {
        loading.value = false;
      }
    }
  });
};
</script>

<style scoped>
.setup-wrapper {
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #F8FAFC;
}

.setup-card {
  width: 500px;
  background: white;
  padding: 3rem;
  border-radius: 16px;
  box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
  border: 1px solid var(--misa-border);
}

.setup-header {
  text-align: center;
  margin-bottom: 2rem;
}

.setup-icon {
  font-size: 3rem;
  color: var(--misa-primary);
  margin-bottom: 1rem;
}

.setup-header h1 {
  font-size: 1.75rem;
  font-weight: 800;
  color: var(--misa-text);
  margin-bottom: 0.5rem;
}

.setup-header p {
  color: var(--misa-text-muted);
  font-size: 0.9rem;
  line-height: 1.5;
}

.setup-btn {
  width: 100%;
  height: 48px;
  font-size: 1.1rem;
  font-weight: 700;
  margin-top: 1rem;
}

.setup-footer {
  text-align: center;
  margin-top: 1.5rem;
}
</style>
