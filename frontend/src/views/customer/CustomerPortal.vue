<template>
  <div class="customer-portal">
    <div class="portal-container">
      
      <!-- Top Header / Profile Info -->
      <header class="portal-header">
        <div class="brand-info">
          <img src="@/assets/CompanyLogo4.png" alt="SmartPost" class="portal-logo" />
          <div class="welcome-text">
            <h2>CỔNG THÔNG TIN KHÁCH HÀNG</h2>
            <p>Chào mừng quý khách, <strong>{{ authStore.user?.full_name || 'Khách hàng' }}</strong></p>
          </div>
        </div>
        <div class="header-actions">
          <el-button type="danger" plain @click="handleLogout">
            <el-icon class="mr-6"><Close /></el-icon> Đăng xuất
          </el-button>
        </div>
      </header>

      <el-row :gutter="24" class="portal-content">
        <!-- Left Side: Profile Details & Support -->
        <el-col :span="8">
          <el-card class="profile-card info-card">
            <template #header>
              <div class="card-header-title">
                <el-icon><User /></el-icon><span>Hồ sơ khách hàng</span>
              </div>
            </template>
            <div class="profile-details">
              <div class="avatar-wrapper">
                <el-avatar :size="70" class="portal-avatar">{{ authStore.user?.full_name?.charAt(0) || 'C' }}</el-avatar>
                <h3>{{ authStore.user?.full_name }}</h3>
                <el-tag type="success" size="small" effect="dark" round>Tài khoản Shop</el-tag>
              </div>
              <div class="details-list">
                <div class="detail-item">
                  <span class="label">Mã khách hàng:</span>
                  <span class="value">{{ customerInfo.customer_code || 'REG-PENDING' }}</span>
                </div>
                <div class="detail-item">
                  <span class="label">Số điện thoại:</span>
                  <span class="value">{{ customerInfo.phone_number || 'Chưa cập nhật' }}</span>
                </div>
                <div class="detail-item">
                  <span class="label">Email liên hệ:</span>
                  <span class="value">{{ customerInfo.email }}</span>
                </div>
                <div class="detail-item">
                  <span class="label">Địa chỉ đăng ký:</span>
                  <span class="value">{{ customerInfo.address_detail || 'Hồ Chí Minh' }}</span>
                </div>
              </div>
            </div>
          </el-card>

          <el-card class="support-card info-card mt-20">
            <template #header>
              <div class="card-header-title">
                <el-icon><Service /></el-icon><span>Hỗ trợ & CSKH</span>
              </div>
            </template>
            <div class="support-info">
              <p>Nếu bạn cần tư vấn gửi hàng, báo giá hoặc khiếu nại, vui lòng liên hệ:</p>
              <div class="hotline-box">
                <el-icon><Phone /></el-icon>
                <div class="hotline-details">
                  <span class="phone-num">1900 6868</span>
                  <span class="sub">(Hoạt động từ 7h00 - 22h00)</span>
                </div>
              </div>
              <div class="email-box">
                <el-icon><Message /></el-icon>
                <span>support@smartpost.vn</span>
              </div>
            </div>
          </el-card>
        </el-col>

        <!-- Right Side: Main Actions & Quick Tracking -->
        <el-col :span="16">
          <div class="banner-welcome">
            <div class="banner-content">
              <h1>Giao Hàng Nhanh Chóng & Tiết Kiệm</h1>
              <p>SmartPost Logistics - Hệ thống vận chuyển và công nghệ thông minh hàng đầu dành cho các chủ shop kinh doanh online.</p>
              <el-button type="success" size="large" @click="goToTracking">
                <el-icon class="mr-6"><Search /></el-icon> TRA CỨU HÀNH TRÌNH VẬN ĐƠN
              </el-button>
            </div>
          </div>

          <el-row :gutter="20" class="actions-grid mt-20">
            <el-col :span="12">
              <el-card class="action-card" shadow="hover" @click="goToCreateWaybill">
                <div class="action-icon bg-green">
                  <el-icon><DocumentAdd /></el-icon>
                </div>
                <div class="action-desc">
                  <h4>Yêu cầu gửi hàng</h4>
                  <p>Tạo yêu cầu lấy hàng hoặc gửi bưu kiện mới đến các bưu cục SmartPost.</p>
                </div>
              </el-card>
            </el-col>
            <el-col :span="12">
              <el-card class="action-card" shadow="hover" @click="goToTracking">
                <div class="action-icon bg-blue">
                  <el-icon><Location /></el-icon>
                </div>
                <div class="action-desc">
                  <h4>Tra cứu bưu phẩm</h4>
                  <p>Theo dõi thời gian thực lịch trình bưu gửi và xác nhận người nhận.</p>
                </div>
              </el-card>
            </el-col>
          </el-row>

          <el-card class="recent-waybills-card mt-20">
            <template #header>
              <div class="card-header-title">
                <el-icon><List /></el-icon><span>Bưu gửi gần đây</span>
              </div>
            </template>
            <el-empty description="Bạn chưa tạo đơn gửi hàng nào hoặc chưa có lịch sử vận đơn" :image-size="80" />
          </el-card>
        </el-col>
      </el-row>

    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import api from '@/api/axios';
import { 
  User, Service, Phone, Message, Close, 
  Search, DocumentAdd, Location, List 
} from '@element-plus/icons-vue';

const authStore = useAuthStore();
const router = useRouter();
const customerInfo = ref({
  customer_code: '',
  phone_number: '',
  email: authStore.user?.email || '',
  address_detail: ''
});

const handleLogout = () => {
  authStore.logout();
  ElMessage.success('Đã đăng xuất tài khoản!');
};

const goToTracking = () => {
  router.push('/tracking');
};

const goToCreateWaybill = () => {
  ElMessage.info('Tính năng tạo yêu cầu gửi hàng trực tuyến đang được nâng cấp!');
};

onMounted(async () => {
  try {
    // Tải thông tin chi tiết khách hàng từ server
    if (authStore.user?.customer_id) {
      const res = await api.get(`/api/customers/search`, {
        params: { query: authStore.user.full_name }
      });
      const items = res.data.items || res.data || [];
      if (items.length > 0) {
        const found = items.find(c => c.customer_id === authStore.user.customer_id);
        if (found) {
          customerInfo.value = found;
        }
      }
    }
  } catch (err) {
    console.error('Không thể tải thông tin hồ sơ khách hàng', err);
  }
});
</script>

<style scoped>
.customer-portal {
  background: var(--app-bg);
  min-height: 100vh;
  padding: 24px;
  font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
}

.portal-container {
  max-width: 1200px;
  margin: 0 auto;
}

.portal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #ffffff;
  padding: 16px 24px;
  border-radius: var(--radius-sm);
  box-shadow: var(--shadow-sm);
  margin-bottom: 24px;
  border: 1px solid var(--border-color);
}

.brand-info {
  display: flex;
  align-items: center;
  gap: 16px;
}

.portal-logo {
  height: 50px;
  object-fit: contain;
}

.welcome-text h2 {
  font-size: 1.25rem;
  font-weight: 800;
  color: var(--primary-color);
  margin: 0;
}

.welcome-text p {
  font-size: 0.9rem;
  color: var(--text-muted);
  margin: 4px 0 0 0;
}

.mr-6 {
  margin-right: 6px;
}

.portal-content {
  margin-top: 10px;
}

.info-card {
  border-radius: var(--radius-md);
  border: 1px solid var(--border-color);
  box-shadow: var(--shadow-sm);
}

.card-header-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 700;
  font-size: 0.95rem;
  color: var(--text-main);
}

.card-header-title .el-icon {
  color: var(--primary-color);
  font-size: 1.1rem;
}

.profile-details {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.avatar-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 20px;
}

.portal-avatar {
  background-color: var(--primary-light);
  color: var(--primary-color);
  font-weight: bold;
  font-size: 1.8rem;
  margin-bottom: 12px;
}

.avatar-wrapper h3 {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--text-main);
  margin: 0 0 6px 0;
}

.details-list {
  width: 100%;
}

.detail-item {
  display: flex;
  flex-direction: column;
  padding: 10px 0;
  border-bottom: 1px solid var(--border-color);
}

.detail-item:last-child {
  border-bottom: none;
}

.detail-item .label {
  font-size: 0.8rem;
  color: var(--text-muted);
  margin-bottom: 4px;
}

.detail-item .value {
  font-size: 0.9rem;
  color: var(--text-main);
  font-weight: 600;
}

.support-info p {
  font-size: 0.85rem;
  color: var(--text-muted);
  margin: 0 0 16px 0;
  line-height: 1.5;
}

.hotline-box {
  display: flex;
  align-items: center;
  gap: 12px;
  background: var(--primary-light);
  border: 1px solid var(--border-color);
  padding: 12px;
  border-radius: var(--radius-sm);
  margin-bottom: 12px;
}

.hotline-box .el-icon {
  font-size: 1.5rem;
  color: var(--primary-hover);
}

.hotline-details {
  display: flex;
  flex-direction: column;
}

.phone-num {
  font-size: 1.15rem;
  font-weight: 800;
  color: var(--primary-hover);
}

.hotline-details .sub {
  font-size: 0.75rem;
  color: var(--primary-hover);
}

.email-box {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.85rem;
  color: var(--text-main);
  padding-left: 4px;
}

.email-box .el-icon {
  color: var(--text-muted);
}

.banner-welcome {
  background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-hover) 100%);
  border-radius: var(--radius-md);
  padding: 36px;
  color: #ffffff;
  box-shadow: var(--shadow-sm);
}

.banner-content h1 {
  font-size: 1.75rem;
  font-weight: 800;
  margin: 0 0 12px 0;
}

.banner-content p {
  font-size: 0.95rem;
  line-height: 1.6;
  opacity: 0.9;
  margin: 0 0 24px 0;
  max-width: 600px;
}

.actions-grid {
  margin-top: 20px;
}

.action-card {
  border-radius: var(--radius-md);
  border: 1px solid var(--border-color);
  cursor: pointer;
  transition: all var(--transition-normal) ease;
}

.action-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-md);
  border-color: var(--primary-color);
}

.action-card :deep(.el-card__body) {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
}

.action-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 50px;
  height: 50px;
  border-radius: 10px;
  font-size: 1.5rem;
}

.bg-green {
  background: var(--primary-light);
  color: var(--primary-color);
}

.bg-blue {
  background: #e3f2fd;
  color: #1565c0;
}

.action-desc h4 {
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--text-main);
  margin: 0 0 4px 0;
}

.action-desc p {
  font-size: 0.8rem;
  color: var(--text-muted);
  margin: 0;
  line-height: 1.4;
}

.recent-waybills-card {
  border-radius: var(--radius-md);
  border: 1px solid var(--border-color);
  box-shadow: var(--shadow-sm);
}

.mt-20 {
  margin-top: 20px;
}
</style>
