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
        <el-col :xs="24" :sm="24" :md="8">
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
                  <span class="value">{{ formattedAddress }}</span>
                </div>
              </div>
              <div style="margin-top: 20px; text-align: center; width: 100%;">
                <el-button type="primary" style="width: 100%;" @click="openEditDialog">
                  <el-icon class="mr-6"><Edit /></el-icon> Cập nhật thông tin
                </el-button>
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
        <el-col :xs="24" :sm="24" :md="16">
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
            <el-col :xs="24" :sm="12" :md="12">
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
            <el-col :xs="24" :sm="12" :md="12">
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

    <!-- Dialog cập nhật thông tin khách hàng -->
    <el-dialog
      v-model="editDialogVisible"
      title="Cập nhật hồ sơ khách hàng"
      width="600px"
      destroy-on-close
    >
      <el-form :model="editForm" label-position="top">
        <el-form-item label="Họ tên đại diện Shop" required>
          <el-input v-model="editForm.full_name" placeholder="Tên hiển thị shop" />
        </el-form-item>
        
        <el-form-item label="Số điện thoại liên hệ" required>
          <el-input v-model="editForm.phone_number" placeholder="Số điện thoại liên hệ" />
        </el-form-item>

        <el-row :gutter="20">
          <el-col :xs="24" :sm="8">
            <el-form-item label="Tỉnh / Thành phố">
              <el-select v-model="editForm.province_id" placeholder="Chọn tỉnh/thành" @change="handleProvinceChange" class="w-full">
                <el-option v-for="p in provinces" :key="p.id" :label="p.name" :value="p.id" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="8">
            <el-form-item label="Quận / Huyện">
              <el-select v-model="editForm.district_id" placeholder="Chọn quận/huyện" @change="handleDistrictChange" class="w-full" :disabled="!editForm.province_id">
                <el-option v-for="d in availableDistricts" :key="d.id" :label="d.name" :value="d.id" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="8">
            <el-form-item label="Phường / Xã">
              <el-select v-model="editForm.ward_id" placeholder="Chọn phường/xã" class="w-full" :disabled="!editForm.district_id">
                <el-option v-for="w in availableWards" :key="w.id" :label="w.name" :value="w.id" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="Địa chỉ chi tiết (Số nhà, tên đường...)">
          <el-input v-model="editForm.address_detail" type="textarea" :rows="2" placeholder="Địa chỉ chi tiết nơi gửi hàng" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="editDialogVisible = false">Hủy</el-button>
          <el-button type="primary" @click="handleSaveProfile">Lưu thay đổi</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import api from '@/api/axios';
import { 
  User, Service, Phone, Message, Close, 
  Search, DocumentAdd, Location, List, Edit
} from '@element-plus/icons-vue';
import { provinces, districts, wards } from '@/utils/vietnam_divisions';

const authStore = useAuthStore();
const router = useRouter();

const customerInfo = ref({
  customer_code: '',
  phone_number: '',
  email: authStore.user?.email || '',
  address_detail: '',
  province_id: null,
  district_id: null,
  ward_id: null,
  address_detail_custom: ''
});

const editDialogVisible = ref(false);
const editForm = reactive({
  full_name: '',
  phone_number: '',
  province_id: null,
  district_id: null,
  ward_id: null,
  address_detail: ''
});

const getProvinceName = (id) => provinces.find(p => p.id === Number(id))?.name || '';
const getDistrictName = (provId, distId) => districts[Number(provId)]?.find(d => d.id === Number(distId))?.name || '';
const getWardName = (distId, wardId) => {
  if (!distId || !wardId) return '';
  const list = wards[Number(distId)] || [];
  return list.find(w => w.id === Number(wardId))?.name || '';
};

const formattedAddress = computed(() => {
  const c = customerInfo.value;
  if (!c) return 'Chưa cập nhật';
  if (c.address_detail_custom) return c.address_detail_custom;
  
  const pName = getProvinceName(c.province_id);
  const dName = getDistrictName(c.province_id, c.district_id);
  const wName = getWardName(c.district_id, c.ward_id);
  
  const parts = [c.address_detail, wName, dName, pName].filter(Boolean);
  return parts.length > 0 ? parts.join(', ') : 'Chưa cập nhật';
});

const availableDistricts = computed(() => {
  return editForm.province_id ? (districts[editForm.province_id] || []) : [];
});

const availableWards = computed(() => {
  return editForm.district_id ? (wards[editForm.district_id] || []) : [];
});

const handleProvinceChange = () => {
  editForm.district_id = null;
  editForm.ward_id = null;
};

const handleDistrictChange = () => {
  editForm.ward_id = null;
};

const handleLogout = () => {
  authStore.logout();
  ElMessage.success('Đã đăng xuất tài khoản!');
  router.push('/login');
};

const goToTracking = () => {
  router.push('/tracking');
};

const goToCreateWaybill = () => {
  ElMessage.info('Tính năng tạo yêu cầu gửi hàng trực tuyến đang được nâng cấp!');
};

const openEditDialog = () => {
  editForm.full_name = authStore.user?.full_name || customerInfo.value.transaction_name || '';
  editForm.phone_number = customerInfo.value.phone_number || '';
  editForm.province_id = customerInfo.value.province_id || null;
  editForm.district_id = customerInfo.value.district_id || null;
  editForm.ward_id = customerInfo.value.ward_id || null;
  editForm.address_detail = customerInfo.value.address_detail || '';
  editDialogVisible.value = true;
};

const handleSaveProfile = () => {
  if (!editForm.full_name.trim()) {
    ElMessage.warning('Vui lòng điền tên đại diện Shop');
    return;
  }
  if (!editForm.phone_number.trim()) {
    ElMessage.warning('Vui lòng điền số điện thoại liên hệ');
    return;
  }

  // Cập nhật thông tin client reactive
  customerInfo.value.phone_number = editForm.phone_number;
  customerInfo.value.province_id = editForm.province_id;
  customerInfo.value.district_id = editForm.district_id;
  customerInfo.value.ward_id = editForm.ward_id;
  customerInfo.value.address_detail = editForm.address_detail;

  const pName = getProvinceName(editForm.province_id);
  const dName = getDistrictName(editForm.province_id, editForm.district_id);
  const wName = getWardName(editForm.district_id, editForm.ward_id);
  const parts = [editForm.address_detail, wName, dName, pName].filter(Boolean);
  customerInfo.value.address_detail_custom = parts.join(', ');

  // Lưu vào localStorage
  localStorage.setItem(`customer_profile_${authStore.user?.customer_id}`, JSON.stringify(customerInfo.value));

  // Cập nhật lại tên hiển thị của authStore
  if (authStore.user) {
    authStore.user.full_name = editForm.full_name;
    const rawAuth = localStorage.getItem('auth_user');
    if (rawAuth) {
      try {
        const parsed = JSON.parse(rawAuth);
        parsed.full_name = editForm.full_name;
        localStorage.setItem('auth_user', JSON.stringify(parsed));
      } catch (e) {}
    }
  }

  ElMessage.success('Cập nhật thông tin cá nhân thành công!');
  editDialogVisible.value = false;
};

onMounted(async () => {
  if (!authStore.user) return;

  // 1. Kiểm tra localStorage trước
  const savedProfile = localStorage.getItem(`customer_profile_${authStore.user.customer_id}`);
  if (savedProfile) {
    try {
      customerInfo.value = JSON.parse(savedProfile);
      return;
    } catch (e) {
      console.error('Lỗi khi phân tích hồ sơ đã lưu:', e);
    }
  }

  // 2. Lấy thông tin tài khoản chi tiết từ /api/auth/me để lấy phone_number & email thực tế từ backend
  let activeUser = authStore.user;
  try {
    const meRes = await api.get('/api/auth/me');
    if (meRes.data) {
      activeUser = {
        ...authStore.user,
        ...meRes.data
      };
      // Đồng bộ ngược lại authStore
      authStore.user = activeUser;
      localStorage.setItem('user', JSON.stringify(activeUser));
    }
  } catch (err) {
    console.error('Không thể gọi API /api/auth/me', err);
  }

  // 3. Gọi API để lấy thông tin khách hàng từ DB
  try {
    const customerId = activeUser.customer_id;
    if (customerId) {
      const searchKeywords = [activeUser.phone_number, activeUser.full_name, activeUser.username].filter(Boolean);
      let foundCustomer = null;

      for (const keyword of searchKeywords) {
        const res = await api.get(`/api/customers/search`, {
          params: { q: keyword }
        });
        const items = res.data.items || res.data || [];
        if (items.length > 0) {
          const matched = items.find(c => c.customer_id === customerId);
          if (matched) {
            foundCustomer = matched;
            break;
          }
        }
      }

      if (foundCustomer) {
        customerInfo.value = {
          ...customerInfo.value,
          ...foundCustomer,
          phone_number: foundCustomer.phone || foundCustomer.phone_number || activeUser.phone_number || '',
          email: foundCustomer.email || activeUser.email || ''
        };
      } else {
        // Fallback: nếu không tìm thấy Customer từ API, tự tạo hồ sơ tạm từ thông tin /api/auth/me
        customerInfo.value = {
          customer_code: 'REG-PENDING',
          phone_number: activeUser.phone_number || 'Chưa cập nhật',
          email: activeUser.email || '',
          address_detail: 'Hồ Chí Minh',
          province_id: null,
          district_id: null,
          ward_id: null
        };
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

.w-full {
  width: 100%;
}

@media (max-width: 768px) {
  .customer-portal {
    padding: 12px;
  }

  .portal-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
    padding: 16px;
  }

  .header-actions {
    width: 100%;
  }

  .header-actions .el-button {
    width: 100%;
    justify-content: center;
  }

  .banner-welcome {
    padding: 20px;
  }

  .banner-content h1 {
    font-size: 1.4rem;
  }

  .banner-content p {
    font-size: 0.85rem;
    margin-bottom: 16px;
  }

  .banner-content .el-button {
    width: 100%;
    justify-content: center;
  }

  .action-card :deep(.el-card__body) {
    padding: 16px;
  }

  :deep(.el-dialog) {
    width: 92% !important;
    margin-top: 10vh !important;
  }
}
</style>
