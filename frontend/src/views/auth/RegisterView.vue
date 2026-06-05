<template>
  <div class="register-wrapper">
    <div class="register-card">
      <div class="register-logo-top">
        <img src="@/assets/CompanyLogo4.png" alt="SmartPost Logistics" />
      </div>
      
      <div class="register-header">
        <h1>ĐĂNG KÝ KHÁCH HÀNG MỚI</h1>
      
      </div>

      <!-- BƯỚC 1: NHẬP THÔNG TIN ĐĂNG KÝ -->
      <el-form 
        v-if="step === 1" 
        :model="registerForm" 
        :rules="step1Rules" 
        ref="formStep1Ref" 
        class="register-form" 
        label-position="top"
      >
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item prop="username" label="Tên đăng nhập">
              <el-input 
                v-model="registerForm.username" 
                placeholder="Tên đăng nhập (3-50 ký tự)" 
                prefix-icon="User"
                clearable
                class="custom-input"
              ></el-input>
            </el-form-item>
          </el-col>
          
          <el-col :span="12">
            <el-form-item prop="full_name" label="Họ và tên">
              <el-input 
                v-model="registerForm.full_name" 
                placeholder="Họ và tên của bạn" 
                prefix-icon="User"
                clearable
                class="custom-input"
              ></el-input>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item prop="email" label="Địa chỉ Email">
              <el-input 
                v-model="registerForm.email" 
                placeholder="customer@example.com" 
                prefix-icon="Message"
                clearable
                class="custom-input"
              ></el-input>
            </el-form-item>
          </el-col>
          
          <el-col :span="12">
            <el-form-item prop="phone_number" label="Số điện thoại">
              <el-input 
                v-model="registerForm.phone_number" 
                placeholder="Số điện thoại liên hệ" 
                prefix-icon="Phone"
                clearable
                class="custom-input"
              ></el-input>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item prop="password" label="Mật khẩu">
              <el-input 
                v-model="registerForm.password" 
                type="password" 
                placeholder="Mật khẩu (tối thiểu 6 ký tự)" 
                prefix-icon="Lock" 
                show-password
                class="custom-input"
              ></el-input>
            </el-form-item>
          </el-col>
          
          <el-col :span="12">
            <el-form-item prop="confirmPassword" label="Xác nhận mật khẩu">
              <el-input 
                v-model="registerForm.confirmPassword" 
                type="password" 
                placeholder="Nhập lại mật khẩu" 
                prefix-icon="Lock" 
                show-password
                class="custom-input"
              ></el-input>
            </el-form-item>
          </el-col>
        </el-row>

        <el-button 
          type="primary" 
          class="register-btn" 
          :loading="loading" 
          @click="goToStep2"
        >ĐĂNG KÝ</el-button>
        
        <div class="register-actions">
          <span>Bạn đã có tài khoản? </span>
          <router-link to="/login" class="login-link">Đăng nhập</router-link>
        </div>
      </el-form>

      <!-- BƯỚC 2: NHẬP MÃ XÁC THỰC OTP -->
      <el-form 
        v-else 
        :model="registerForm" 
        :rules="step2Rules" 
        ref="formStep2Ref" 
        class="register-form" 
        label-position="top"
      >
        <div class="otp-back-header mb-20">
          <el-button link class="back-btn" @click="goBackToStep1">
            <el-icon class="mr-6"><ArrowLeft /></el-icon> Quay lại thiết lập tài khoản
          </el-button>
        </div>

        <div class="otp-instructions text-center mb-20">
          <h2 class="otp-title">Xác thực tài khoản</h2>
          <p class="otp-subtitle">Mã xác thực kích hoạt (OTP) đã được gửi tới email <strong>{{ registerForm.email }}</strong>.</p>
        </div>

        <div class="otp-inputs-container">
          <input
            v-for="(digit, index) in 6"
            :key="index"
            :ref="el => { if (el) otpInputRefs[index] = el }"
            v-model="otpDigits[index]"
            type="text"
            maxlength="1"
            class="otp-digit-input"
            @input="handleOtpInput($event, index)"
            @keydown="handleOtpKeydown($event, index)"
            @paste="handleOtpPaste($event)"
            autocomplete="off"
          />
        </div>

        <el-form-item prop="otp" class="hidden-otp-item">
          <el-input v-model="registerForm.otp" style="display: none;"></el-input>
        </el-form-item>

        <el-button 
          type="primary" 
          class="register-btn" 
          :loading="loading" 
          @click="handleRegister"
          :disabled="registerForm.otp.length < 6"
        >TIẾP TỤC</el-button>

        <div class="register-actions flex-col gap-10 mt-20">
          <span class="cooldown-text" v-if="otpCooldown > 0">
            Gửi lại mã xác nhận sau <strong>{{ formattedCooldown }}</strong>
          </span>
          <el-button 
            v-else
            link 
            type="primary" 
            :disabled="otpLoading"
            :loading="otpLoading"
            @click="handleResendOtp"
          >
            Gửi lại mail xác nhận
          </el-button>
        </div>
      </el-form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onBeforeUnmount, watch, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../../stores/auth';
import { ElMessage } from 'element-plus';
import api from '../../api/axios';
import { User, Lock, Message, Key, Phone, ArrowLeft } from '@element-plus/icons-vue';

const router = useRouter();
const authStore = useAuthStore();

const step = ref(1);
const loading = ref(false);
const otpLoading = ref(false);
const otpCooldown = ref(0);
let cooldownTimer = null;

const formStep1Ref = ref(null);
const formStep2Ref = ref(null);

const otpDigits = ref(['', '', '', '', '', '']);
const otpInputRefs = ref([]);

watch(otpDigits, (newVal) => {
  registerForm.otp = newVal.join('');
}, { deep: true });

const formattedCooldown = computed(() => {
  const minutes = Math.floor(otpCooldown.value / 60);
  const seconds = otpCooldown.value % 60;
  return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
});

const registerForm = reactive({
  username: '',
  full_name: '',
  email: '',
  phone_number: '',
  password: '',
  confirmPassword: '',
  otp: '',
  // Các trường mặc định để khớp API
  address: null,
  province_id: null,
  district_id: null,
  ward_id: null
});

const validatePass2 = (rule, value, callback) => {
  if (value === '') {
    callback(new Error('Vui lòng nhập lại mật khẩu'));
  } else if (value !== registerForm.password) {
    callback(new Error('Mật khẩu nhập lại không khớp!'));
  } else {
    callback();
  }
};

const step1Rules = {
  username: [
    { required: true, message: 'Vui lòng nhập tên đăng nhập', trigger: 'blur' },
    { min: 3, max: 50, message: 'Tên đăng nhập từ 3 đến 50 ký tự', trigger: 'blur' }
  ],
  full_name: [
    { required: true, message: 'Vui lòng nhập họ và tên', trigger: 'blur' },
    { min: 2, max: 100, message: 'Họ tên từ 2 đến 100 ký tự', trigger: 'blur' }
  ],
  email: [
    { required: true, message: 'Vui lòng nhập địa chỉ email', trigger: 'blur' },
    { type: 'email', message: 'Email không đúng định dạng', trigger: 'blur' }
  ],
  phone_number: [
    { required: true, message: 'Vui lòng nhập số điện thoại', trigger: 'blur' }
  ],
  password: [
    { required: true, message: 'Vui lòng nhập mật khẩu', trigger: 'blur' },
    { min: 6, max: 128, message: 'Mật khẩu tối thiểu 6 ký tự', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, validator: validatePass2, trigger: 'blur' }
  ]
};

const step2Rules = {
  otp: [
    { required: true, message: 'Vui lòng nhập mã xác thực OTP', trigger: 'blur' },
    { len: 6, message: 'Mã OTP phải gồm đúng 6 ký tự', trigger: 'blur' }
  ]
};

const startCooldown = (seconds = 60) => {
  otpCooldown.value = seconds;
  if (cooldownTimer) clearInterval(cooldownTimer);
  cooldownTimer = setInterval(() => {
    if (otpCooldown.value > 0) {
      otpCooldown.value--;
    } else {
      clearInterval(cooldownTimer);
    }
  }, 1000);
};

const goToStep2 = async () => {
  if (!formStep1Ref.value) return;
  
  await formStep1Ref.value.validate(async (valid) => {
    if (!valid) return;
    
    loading.value = true;
    try {
      // Gọi request OTP trước
      await api.post('/api/auth/register/request-otp', {
        email: registerForm.email
      });
      
      ElMessage.success('Mã xác thực đã được gửi tới email đăng ký!');
      step.value = 2;
      startCooldown(180);
    } catch (error) {
      const msg = error.response?.data?.detail || 'Lỗi gửi yêu cầu OTP. Vui lòng kiểm tra lại thông tin.';
      ElMessage.error(msg);
    } finally {
      loading.value = false;
    }
  });
};

const handleResendOtp = async () => {
  otpLoading.value = true;
  try {
    await api.post('/api/auth/register/request-otp', {
      email: registerForm.email
    });
    ElMessage.success('Đã gửi lại mã OTP thành công!');
    startCooldown(180);
  } catch (error) {
    const msg = error.response?.data?.detail || 'Lỗi gửi lại OTP.';
    ElMessage.error(msg);
  } finally {
    otpLoading.value = false;
  }
};

const handleRegister = async () => {
  if (!formStep2Ref.value) return;
  
  await formStep2Ref.value.validate(async (valid) => {
    if (!valid) return;
    
    loading.value = true;
    try {
      await api.post('/api/auth/register/verify', registerForm);
      ElMessage.success('Đăng ký khách hàng thành công! Vui lòng đăng nhập.');
      await router.push('/login');
      
    } catch (error) {
      const msg = error.response?.data?.detail || 'Mã xác thực không hợp lệ hoặc đã hết hạn.';
      ElMessage.error(msg);
    } finally {
      loading.value = false;
    }
  });
};

const handleOtpInput = (event, index) => {
  const value = event.target.value;
  if (!/^[0-9]$/.test(value)) {
    otpDigits.value[index] = '';
    return;
  }
  otpDigits.value[index] = value;
  if (value && index < 5) {
    otpInputRefs.value[index + 1]?.focus();
  }
};

const handleOtpKeydown = (event, index) => {
  if (event.key === 'Backspace') {
    if (!otpDigits.value[index] && index > 0) {
      otpDigits.value[index - 1] = '';
      otpInputRefs.value[index - 1]?.focus();
    } else {
      otpDigits.value[index] = '';
    }
  } else if (event.key === 'ArrowLeft' && index > 0) {
    otpInputRefs.value[index - 1]?.focus();
  } else if (event.key === 'ArrowRight' && index < 5) {
    otpInputRefs.value[index + 1]?.focus();
  }
};

const handleOtpPaste = (event) => {
  event.preventDefault();
  const pasteData = event.clipboardData.getData('text').trim();
  if (/^\d{6}$/.test(pasteData)) {
    for (let i = 0; i < 6; i++) {
      otpDigits.value[i] = pasteData[i];
    }
    otpInputRefs.value[5]?.focus();
  }
};

const goBackToStep1 = () => {
  otpDigits.value = ['', '', '', '', '', ''];
  step.value = 1;
};

onBeforeUnmount(() => {
  if (cooldownTimer) clearInterval(cooldownTimer);
});
</script>

<script>
import { User, Lock, Message, Key, Phone } from '@element-plus/icons-vue';
export default {
  components: {
    User, Lock, Message, Key, Phone
  }
}
</script>

<style scoped src="@/styles/auth/RegisterView.css"></style>
