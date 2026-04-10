<template>
  <div class="pricing-rules-page">

    <div class="page-header">
      <div class="header-left">
        <div class="header-icon">
          <el-icon><Ticket /></el-icon>
        </div>
        <div>
          <h1 class="page-title">Cấu hình Bảng Giá</h1>
          <p class="page-subtitle">Quản lý phí vận chuyển theo tuyến đường, khối lượng và loại dịch vụ</p>
        </div>
      </div>
      <div class="header-actions">
        <el-button @click="refreshAll" :icon="Refresh" circle title="Làm mới toàn bộ" />
      </div>
    </div>

    <div class="stats-row">
      <div class="stat-card">
        <div class="stat-icon blue"><el-icon><List /></el-icon></div>
        <div class="stat-info">
          <span class="stat-value">{{ rules.length }}</span>
          <span class="stat-label">Tổng quy tắc tuyến</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon green"><el-icon><CircleCheck /></el-icon></div>
        <div class="stat-info">
          <span class="stat-value">{{ activeCount }}</span>
          <span class="stat-label">Tuyến đang áp dụng</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon orange"><el-icon><Lightning /></el-icon></div>
        <div class="stat-info">
          <span class="stat-value">{{ expressCount }}</span>
          <span class="stat-label">Hoả tốc (EXPRESS)</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon purple"><el-icon><Setting /></el-icon></div>
        <div class="stat-info">
          <span class="stat-value">{{ services.length }}</span>
          <span class="stat-label">Dịch vụ tiện ích</span>
        </div>
      </div>
    </div>

    <el-tabs v-model="activeTab" class="custom-tabs mt-4">
      
      <el-tab-pane label="Bảng Giá Cước Tuyến" name="main_routes">
        
        <el-card class="filter-card mb-4" shadow="never">
          <div class="filter-bar">
            <el-select v-model="filter.service_type" placeholder="Tất cả dịch vụ" clearable style="width: 200px">
              <el-option label="⚡ Hoả tốc (EXPRESS)" value="EXPRESS" />
              <el-option label="🚚 Tiêu chuẩn (STANDARD)" value="STANDARD" />
            </el-select>
            <el-select v-model="filterHubId" placeholder="Lọc theo Bưu cục" clearable filterable style="width: 260px">
              <el-option v-for="hub in hubs" :key="hub.hub_id" :label="`${hub.hub_code} - ${hub.hub_name}`" :value="hub.hub_id" />
            </el-select>
            <div class="filter-actions">
              <el-button type="primary" :icon="Search" @click="fetchData">Tìm kiếm</el-button>
              <el-button :icon="Refresh" @click="resetFilters">Đặt lại</el-button>
              <el-button v-if="canEditPricing" type="primary" :icon="Plus" @click="openDialog(null)" plain>Thêm Tuyến Giá</el-button>
            </div>
          </div>
        </el-card>

        <el-card class="table-card" shadow="never">
          <template #header>
            <div class="card-header">
              <span class="card-title">Danh sách Quy tắc Giá theo tuyến</span>
              <el-tag type="info" size="small">{{ filteredRules.length }} quy tắc</el-tag>
            </div>
          </template>

          <el-table :data="filteredRules" v-loading="loading" stripe style="width: 100%" :header-cell-style="{ background: '#f8fafc', color: '#374151', fontWeight: '600' }" row-class-name="table-row">
            <el-table-column label="Tuyến đường" min-width="280">
              <template #default="{ row }">
                <div class="route-cell">
                  <div class="hub-tag origin">
                    <el-icon><LocationFilled /></el-icon>
                    <span>{{ row.origin_hub ? row.origin_hub.hub_name : `Hub #${row.origin_hub_id}` }}</span>
                  </div>
                  <div class="route-arrow"><el-icon><Right /></el-icon></div>
                  <div class="hub-tag dest">
                    <el-icon><Location /></el-icon>
                    <span>{{ row.dest_hub ? row.dest_hub.hub_name : `Hub #${row.dest_hub_id}` }}</span>
                  </div>
                </div>
                <div class="hub-codes">
                  <span class="code-badge">{{ row.origin_hub?.hub_code || '---' }}</span>
                  <span class="code-arrow">→</span>
                  <span class="code-badge">{{ row.dest_hub?.hub_code || '---' }}</span>
                </div>
              </template>
            </el-table-column>

            <el-table-column label="Dịch vụ" width="140" align="center">
              <template #default="{ row }">
                <div :class="['service-badge', row.service_type === 'EXPRESS' ? 'express' : 'standard']">
                  <span>{{ row.service_type === 'EXPRESS' ? '⚡ Hoả tốc' : '🚚 Tiêu chuẩn' }}</span>
                </div>
              </template>
            </el-table-column>

            <el-table-column label="Nấc cân" width="170" align="center">
              <template #default="{ row }">
                <div class="weight-cell">
                  <el-icon><ScaleToOriginal /></el-icon>
                  <span>{{ row.min_weight }} – {{ row.max_weight }} kg</span>
                </div>
              </template>
            </el-table-column>

            <el-table-column label="Đơn giá" width="160" align="right">
              <template #default="{ row }">
                <div class="price-cell">
                  <span class="price-value">{{ formatMoney(row.price) }}</span>
                  <span class="price-unit">đ</span>
                </div>
              </template>
            </el-table-column>

            <el-table-column label="Trạng thái" width="130" align="center">
              <template #default="{ row }">
                <div :class="['status-pill', row.is_active ? 'active' : 'inactive']">
                  <span class="status-dot"></span>
                  {{ row.is_active ? 'Đang áp dụng' : 'Tạm dừng' }}
                </div>
              </template>
            </el-table-column>

            <el-table-column v-if="canEditPricing" label="Thao tác" width="120" align="center" fixed="right">
              <template #default="{ row }">
                <div class="action-buttons flex gap-1 justify-center">
                  <el-tooltip content="Chỉnh sửa" placement="top">
                    <el-button text type="primary" :icon="Edit" @click="openDialog(row)" size="small" />
                  </el-tooltip>
                  <el-tooltip content="Xóa quy tắc" placement="top">
                    <el-button text type="danger" :icon="Delete" @click="handleDelete(row)" size="small" />
                  </el-tooltip>
                </div>
              </template>
            </el-table-column>
          </el-table>

          <div v-if="filteredRules.length === 0 && !loading" class="empty-state">
            <el-icon class="empty-icon"><DocumentRemove /></el-icon>
            <p>Chưa có quy tắc giá nào</p>
            <el-button v-if="canEditPricing" type="primary" :icon="Plus" @click="openDialog(null)">Thêm quy tắc đầu tiên</el-button>
          </div>
        </el-card>
      </el-tab-pane>

      <el-tab-pane label="Phí Dịch vụ Tiện Ích" name="extra_services">
        <el-card shadow="never" class="table-card">
          <template #header>
            <div class="card-header">
              <span class="card-title">Cấu hình phí dịch vụ cộng thêm</span>
              <el-button v-if="canEditPricing" type="primary" :icon="Plus" @click="openServiceDialog(null)" plain>
                Thêm Dịch vụ mới
              </el-button>
            </div>
          </template>

          <el-table :data="services" v-loading="serviceLoading" stripe style="width: 100%" :header-cell-style="{ background: '#f8fafc', color: '#374151', fontWeight: '600' }">
            <el-table-column label="Mã Dịch vụ" width="150" align="center">
              <template #default="{ row }">
                <el-tag type="info" class="font-mono">{{ row.service_code }}</el-tag>
              </template>
            </el-table-column>

            <el-table-column prop="service_name" label="Tên Dịch vụ" min-width="200">
              <template #default="{ row }">
                <span style="font-weight: 600; color: #111827;">{{ row.service_name }}</span>
              </template>
            </el-table-column>

            <el-table-column label="Loại Phí" width="150" align="center">
              <template #default="{ row }">
                <el-tag :type="row.fee_type === 'FIXED' ? 'primary' : 'warning'" size="small">
                  {{ row.fee_type === 'FIXED' ? 'Giá cố định' : 'Phần trăm (%)' }}
                </el-tag>
              </template>
            </el-table-column>

            <el-table-column label="Mức Phí" width="180" align="right">
              <template #default="{ row }">
                <div class="price-cell">
                  <span class="price-value" style="color: #ea580c;">{{ formatMoney(row.fee_value) }}</span>
                  <span class="price-unit">{{ row.fee_type === 'FIXED' ? 'VNĐ' : '% COD' }}</span>
                </div>
              </template>
            </el-table-column>

            <el-table-column label="Trạng thái" width="120" align="center">
              <template #default="{ row }">
                <el-switch v-model="row.is_active" :disabled="!canEditPricing" @change="toggleServiceStatus(row)" style="--el-switch-on-color: #16a34a" />
              </template>
            </el-table-column>

            <el-table-column v-if="canEditPricing" label="Thao tác" width="100" align="center" fixed="right">
              <template #default="{ row }">
                <el-button link type="primary" :icon="Edit" @click="openServiceDialog(row)" />
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-tab-pane>

    </el-tabs>

    <el-dialog v-model="dialogVisible" :title="ruleForm.rule_id ? '✏️ Cập nhật Quy tắc Giá' : '➕ Thêm Quy tắc Giá mới'" width="600px" destroy-on-close>
      <el-form :model="ruleForm" :rules="formRules" ref="ruleFormRef" label-position="top">
        <div class="form-section-title">📍 Tuyến đường</div>
        <el-row :gutter="16">
          <el-col :span="11">
            <el-form-item label="Bưu cục gửi (Origin)" prop="origin_hub_id">
              <el-select v-model="ruleForm.origin_hub_id" filterable placeholder="Chọn bưu cục gửi" class="w-full">
                <el-option v-for="hub in hubs" :key="hub.hub_id" :label="`${hub.hub_code} - ${hub.hub_name}`" :value="hub.hub_id" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="2" class="route-mid-arrow">
            <el-icon><Right /></el-icon>
          </el-col>
          <el-col :span="11">
            <el-form-item label="Bưu cục nhận (Destination)" prop="dest_hub_id">
              <el-select v-model="ruleForm.dest_hub_id" filterable placeholder="Chọn bưu cục nhận" class="w-full">
                <el-option v-for="hub in hubs" :key="hub.hub_id" :label="`${hub.hub_code} - ${hub.hub_name}`" :value="hub.hub_id" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <div class="form-section-title">📦 Loại dịch vụ & Khối lượng</div>
        <el-form-item label="Loại dịch vụ" prop="service_type">
          <el-radio-group v-model="ruleForm.service_type" class="service-radio-group">
            <el-radio-button label="EXPRESS">⚡ Hoả tốc</el-radio-button>
            <el-radio-button label="STANDARD">🚚 Tiêu chuẩn</el-radio-button>
          </el-radio-group>
        </el-form-item>

        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="Khối lượng từ (kg)" prop="min_weight">
              <el-input-number v-model="ruleForm.min_weight" :precision="2" :step="0.5" :min="0" class="w-full" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="Khối lượng đến (kg)" prop="max_weight">
              <el-input-number v-model="ruleForm.max_weight" :precision="2" :step="0.5" :min="0.01" class="w-full" />
            </el-form-item>
          </el-col>
        </el-row>

        <div class="form-section-title">💰 Đơn giá</div>
        <el-form-item label="Đơn giá (VNĐ)" prop="price">
          <el-input-number v-model="ruleForm.price" :min="1000" :step="5000" class="w-full price-input" :controls="false" :formatter="val => val ? val.toLocaleString('vi-VN') : ''" :parser="val => val.replace(/[^\d]/g, '')" />
          <div class="price-preview" v-if="ruleForm.price">
            → <strong>{{ formatMoney(ruleForm.price) }} đ</strong>
          </div>
        </el-form-item>

        <el-form-item label="Thuộc Chính sách giá">
          <el-select v-model="ruleForm.policy_id" class="w-full">
            <el-option v-for="p in policies" :key="p.policy_id" :label="p.policy_name" :value="p.policy_id" />
          </el-select>
        </el-form-item>

        <el-form-item>
          <el-switch v-model="ruleForm.is_active" active-text="Đang áp dụng" inactive-text="Tạm dừng" />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialogVisible = false">Hủy bỏ</el-button>
          <el-button type="primary" @click="handleSave" :loading="saveLoading" size="large">
            {{ ruleForm.rule_id ? 'Cập nhật quy tắc' : 'Thêm quy tắc' }}
          </el-button>
        </div>
      </template>
    </el-dialog>

    <el-dialog v-model="serviceDialogVisible" :title="serviceForm.id ? '✏️ Cập nhật Dịch vụ' : '➕ Thêm Dịch vụ mới'" width="500px" destroy-on-close>
      <el-form :model="serviceForm" :rules="serviceRules" ref="serviceFormRef" label-position="top">
        
        <el-row :gutter="20">
          <el-col :span="10">
            <el-form-item label="Mã hệ thống (Code)" prop="service_code">
              <el-input v-model="serviceForm.service_code" placeholder="VD: CO_CHECK" :disabled="!!serviceForm.id" class="font-mono uppercase"/>
            </el-form-item>
          </el-col>
          <el-col :span="14">
            <el-form-item label="Tên hiển thị" prop="service_name">
              <el-input v-model="serviceForm.service_name" placeholder="VD: Dịch vụ Đồng kiểm" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="Cách tính phí" prop="fee_type">
          <el-radio-group v-model="serviceForm.fee_type" style="width: 100%; display: flex;">
            <el-radio-button label="FIXED" style="flex: 1; text-align: center;">Giá Cố định (VNĐ)</el-radio-button>
            <el-radio-button label="PERCENT" style="flex: 1; text-align: center;">Phần trăm (% COD)</el-radio-button>
          </el-radio-group>
        </el-form-item>

        <el-form-item :label="serviceForm.fee_type === 'FIXED' ? 'Số tiền (VNĐ)' : 'Tỉ lệ phần trăm (%)'" prop="fee_value">
          <el-input-number v-model="serviceForm.fee_value" :min="0" :step="serviceForm.fee_type === 'FIXED' ? 5000 : 0.5" class="w-full price-input" :controls="false" :formatter="val => val ? Number(val).toLocaleString('vi-VN') : ''" :parser="val => val.replace(/[^\d.]/g, '')" />
        </el-form-item>

        <el-form-item>
          <el-switch v-model="serviceForm.is_active" active-text="Đang áp dụng" inactive-text="Tạm khóa" />
        </el-form-item>

      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="serviceDialogVisible = false">Hủy bỏ</el-button>
          <el-button type="primary" @click="handleSaveService" :loading="serviceSaveLoading">Xác nhận</el-button>
        </div>
      </template>
    </el-dialog>

  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue';
import { Plus, Edit, Delete, List, Right, Refresh, Search, Location, LocationFilled, CircleCheck, DocumentRemove, ScaleToOriginal, Ticket, Setting } from '@element-plus/icons-vue';
import api from '@/api/axios';
import { ElMessage, ElMessageBox } from 'element-plus';
import { useAuthStore } from '@/stores/auth';

// Fix Lightning & Van icons
const Lightning = { render: () => null };
const Van = { render: () => null };

// ================= THIẾT LẬP QUYỀN (RBAC) =================
const authStore = useAuthStore();
const user = computed(() => authStore.user);

// Chỉ Admin (1) và Kế toán (5) mới có quyền Sửa/Xóa giá cước
const canEditPricing = computed(() => user.value?.role_id === 1 || user.value?.role_id === 5);

// STATE CHUNG
const activeTab = ref('main_routes');
const policies = ref([]);
const hubs = ref([]);

// ================= STATE CHO CƯỚC CHÍNH =================
const loading = ref(false);
const saveLoading = ref(false);
const dialogVisible = ref(false);
const ruleFormRef = ref(null);
const rules = ref([]);
const filterHubId = ref(null);
const filter = reactive({ service_type: '' });

const ruleForm = reactive({
  rule_id: null, policy_id: 1, origin_hub_id: null, dest_hub_id: null,
  service_type: 'STANDARD', min_weight: 0, max_weight: 0.5, price: 30000, is_active: true
});

const formRules = {
  origin_hub_id: [{ required: true, message: 'Vui lòng chọn bưu cục gửi', trigger: 'change' }],
  dest_hub_id: [{ required: true, message: 'Vui lòng chọn bưu cục nhận', trigger: 'change' }],
  price: [{ required: true, type: 'number', min: 1000, message: 'Đơn giá tối thiểu 1,000đ', trigger: 'blur' }]
};

// ================= STATE CHO DỊCH VỤ TIỆN ÍCH =================
const services = ref([]);
const serviceLoading = ref(false);
const serviceSaveLoading = ref(false);
const serviceDialogVisible = ref(false);
const serviceFormRef = ref(null);

const serviceForm = reactive({
  id: null, service_code: '', service_name: '', fee_type: 'FIXED', fee_value: 0, is_active: true
});

const serviceRules = {
  service_code: [{ required: true, message: 'Nhập mã dịch vụ', trigger: 'blur' }],
  service_name: [{ required: true, message: 'Nhập tên dịch vụ', trigger: 'blur' }],
  fee_value: [{ required: true, message: 'Nhập mức phí', trigger: 'blur' }]
};

// ================= COMPUTED & UTILS =================
const activeCount = computed(() => rules.value.filter(r => r.is_active).length);
const expressCount = computed(() => rules.value.filter(r => r.service_type === 'EXPRESS').length);
const standardCount = computed(() => rules.value.filter(r => r.service_type === 'STANDARD').length);

const filteredRules = computed(() => {
  return rules.value.filter(r => {
    const matchService = !filter.service_type || r.service_type === filter.service_type;
    const matchHub = !filterHubId.value || r.origin_hub_id === filterHubId.value || r.dest_hub_id === filterHubId.value;
    return matchService && matchHub;
  });
});

const formatMoney = (val) => {
  if (!val && val !== 0) return '0';
  return Number(val).toLocaleString('vi-VN');
};

const refreshAll = () => {
  fetchData();
  fetchServices();
};

// ================= HÀM CHO CƯỚC CHÍNH =================
const fetchData = async () => {
  loading.value = true;
  try {
    const res = await api.get('/api/pricing/rules');
    rules.value = res.data || [];
  } catch (err) {
    ElMessage.error('Lỗi khi tải bảng giá');
  } finally {
    loading.value = false;
  }
};

const resetFilters = () => { filter.service_type = ''; filterHubId.value = null; };

const openDialog = (row) => {
  if (row) Object.assign(ruleForm, row);
  else Object.assign(ruleForm, { rule_id: null, policy_id: policies.value[0]?.policy_id || 1, origin_hub_id: null, dest_hub_id: null, service_type: 'STANDARD', min_weight: 0, max_weight: 0.5, price: 30000, is_active: true });
  dialogVisible.value = true;
};

const handleSave = async () => {
  if (!ruleFormRef.value) return;
  await ruleFormRef.value.validate(async (valid) => {
    if (valid) {
      saveLoading.value = true;
      try {
        if (ruleForm.rule_id) {
          await api.put(`/api/pricing/rules/${ruleForm.rule_id}`, ruleForm);
          ElMessage.success('Cập nhật quy tắc giá thành công!');
        } else {
          await api.post('/api/pricing/rules', ruleForm);
          ElMessage.success('Thêm quy tắc giá mới thành công!');
        }
        dialogVisible.value = false;
        fetchData();
      } catch (err) {
        ElMessage.error(err.response?.data?.detail || 'Lỗi khi lưu quy tắc giá.');
      } finally {
        saveLoading.value = false;
      }
    }
  });
};

const handleDelete = (row) => {
  const routeLabel = `${row.origin_hub?.hub_name || row.origin_hub_id} → ${row.dest_hub?.hub_name || row.dest_hub_id}`;
  ElMessageBox.confirm(`Xóa quy tắc giá cho tuyến "${routeLabel}"?`, 'Xác nhận xóa', { confirmButtonText: 'Xóa', cancelButtonText: 'Giữ lại', type: 'warning' })
    .then(async () => {
      try {
        await api.delete(`/api/pricing/rules/${row.rule_id}`);
        ElMessage.success('Đã xóa quy tắc.');
        fetchData();
      } catch (err) {
        ElMessage.error('Không thể xóa.');
      }
    });
};

// ================= HÀM CHO DỊCH VỤ TIỆN ÍCH =================
const fetchServices = async () => {
  serviceLoading.value = true;
  try {
    const res = await api.get('/api/pricing/extra-services');
    services.value = res.data || [];
  } catch (err) {
    ElMessage.error('Lỗi khi tải danh sách dịch vụ');
  } finally {
    serviceLoading.value = false;
  }
};

const openServiceDialog = (row) => {
  if (row) Object.assign(serviceForm, row);
  else Object.assign(serviceForm, { id: null, service_code: '', service_name: '', fee_type: 'FIXED', fee_value: 0, is_active: true });
  serviceDialogVisible.value = true;
};

const handleSaveService = async () => {
  if (!serviceFormRef.value) return;
  await serviceFormRef.value.validate(async (valid) => {
    if (valid) {
      serviceSaveLoading.value = true;
      try {
        if (serviceForm.id) {
          await api.put(`/api/pricing/extra-services/${serviceForm.id}`, serviceForm);
          ElMessage.success('Cập nhật dịch vụ thành công!');
        } else {
          await api.post('/api/pricing/extra-services', serviceForm);
          ElMessage.success('Thêm dịch vụ thành công!');
        }
        serviceDialogVisible.value = false;
        fetchServices();
      } catch (err) {
        ElMessage.error(err.response?.data?.detail || 'Lỗi lưu dữ liệu.');
      } finally {
        serviceSaveLoading.value = false;
      }
    }
  });
};

const toggleServiceStatus = async (row) => {
  try {
    await api.put(`/api/pricing/extra-services/${row.id}`, { ...row });
    ElMessage.success('Đã cập nhật trạng thái');
  } catch (err) {
    row.is_active = !row.is_active; 
    ElMessage.error('Lỗi khi cập nhật trạng thái');
  }
};

// ================= INIT =================
const fetchPolicies = async () => { policies.value = [{ policy_id: 1, policy_name: 'Bảng giá Tiêu chuẩn 2026' }]; };
const fetchHubs = async () => {
  try {
    const res = await api.get('/api/hubs');
    hubs.value = res.data.items || res.data || [];
  } catch (err) { ElMessage.error('Không tải được danh sách bưu cục'); }
};

onMounted(() => {
  fetchData();
  fetchServices(); 
  fetchPolicies();
  fetchHubs();
});
</script>

<style scoped>
.pricing-rules-page {
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* ── Header ── */
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  background: linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%);
  border-radius: 12px;
  color: white;
}
.header-left { display: flex; align-items: center; gap: 16px; }
.header-icon { width: 52px; height: 52px; background: rgba(255,255,255,0.2); border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 24px; }
.page-title { margin: 0; font-size: 1.4rem; font-weight: 700; letter-spacing: -0.3px; }
.page-subtitle { margin: 4px 0 0; font-size: 0.85rem; opacity: 0.8; }

/* ── Stats ── */
.stats-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
.stat-card { background: white; border-radius: 10px; padding: 16px 20px; display: flex; align-items: center; gap: 14px; box-shadow: 0 1px 4px rgba(0,0,0,0.07); border: 1px solid #e5e7eb; }
.stat-icon { width: 44px; height: 44px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 20px; }
.stat-icon.blue { background: #eff6ff; color: #2563eb; }
.stat-icon.green { background: #f0fdf4; color: #16a34a; }
.stat-icon.orange { background: #fff7ed; color: #ea580c; }
.stat-icon.purple { background: #faf5ff; color: #7c3aed; }
.stat-info { display: flex; flex-direction: column; }
.stat-value { font-size: 1.6rem; font-weight: 700; color: #111827; line-height: 1; }
.stat-label { font-size: 0.75rem; color: #6b7280; margin-top: 4px; }

/* ── Custom Tabs ── */
.custom-tabs {
  background: white;
  padding: 16px 20px;
  border-radius: 10px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.07);
  border: 1px solid #e5e7eb;
}
.custom-tabs :deep(.el-tabs__item) {
  font-weight: 600;
  font-size: 1.05rem;
}

/* ── Cards ── */
.filter-card { border-radius: 8px; border: 1px solid #e5e7eb; }
:deep(.filter-card .el-card__body) { padding: 16px 20px; }
.filter-bar { display: flex; gap: 12px; align-items: center; flex-wrap: wrap; }
.filter-actions { display: flex; gap: 8px; margin-left: auto; }
.table-card { border-radius: 8px; border: 1px solid #e5e7eb; }
.card-header { display: flex; align-items: center; justify-content: space-between; }
.card-title { font-size: 0.95rem; font-weight: 600; color: #111827; }

/* ── Table Cells ── */
.route-cell { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
.hub-tag { display: inline-flex; align-items: center; gap: 4px; padding: 3px 8px; border-radius: 6px; font-size: 0.78rem; font-weight: 600; }
.hub-tag.origin { background: #eff6ff; color: #1d4ed8; }
.hub-tag.dest { background: #f0fdf4; color: #15803d; }
.route-arrow { color: #9ca3af; font-size: 14px; }
.hub-codes { display: flex; align-items: center; gap: 4px; margin-top: 4px; }
.code-badge { font-size: 0.7rem; font-family: monospace; background: #f3f4f6; color: #6b7280; padding: 1px 6px; border-radius: 4px; }
.code-arrow { color: #d1d5db; font-size: 11px; }

.service-badge { display: inline-block; padding: 4px 10px; border-radius: 20px; font-size: 0.78rem; font-weight: 600; }
.service-badge.express { background: #fef3c7; color: #d97706; }
.service-badge.standard { background: #e0f2fe; color: #0369a1; }

.weight-cell { display: flex; align-items: center; gap: 6px; justify-content: center; color: #374151; font-size: 0.85rem; }

.price-cell { display: flex; align-items: baseline; gap: 4px; justify-content: flex-end; }
.price-value { font-size: 1.05rem; font-weight: 700; color: #16a34a; }
.price-unit { font-size: 0.75rem; color: #6b7280; }

.status-pill { display: inline-flex; align-items: center; gap: 5px; padding: 4px 10px; border-radius: 20px; font-size: 0.75rem; font-weight: 600; }
.status-pill.active { background: #dcfce7; color: #15803d; }
.status-pill.inactive { background: #f3f4f6; color: #6b7280; }
.status-dot { width: 6px; height: 6px; border-radius: 50%; display: inline-block; }
.status-pill.active .status-dot { background: #16a34a; }
.status-pill.inactive .status-dot { background: #9ca3af; }

.empty-state { padding: 60px 20px; text-align: center; color: #9ca3af; }
.empty-icon { font-size: 3rem; margin-bottom: 12px; display: block; }

/* ── Dialogs ── */
.form-section-title { font-size: 0.8rem; font-weight: 700; color: #6b7280; text-transform: uppercase; margin: 12px 0 10px; padding-bottom: 6px; border-bottom: 1px solid #f3f4f6; }
.route-mid-arrow { display: flex; align-items: center; justify-content: center; padding-top: 32px; color: #9ca3af; font-size: 18px; }
.price-preview { margin-top: 6px; font-size: 0.85rem; color: #6b7280; }
.price-preview strong { color: #16a34a; font-size: 1rem; }
.dialog-footer { display: flex; justify-content: flex-end; gap: 10px; }

.w-full { width: 100%; }
.font-mono { font-family: monospace; }
.uppercase :deep(input) { text-transform: uppercase; }
:deep(.price-input .el-input__inner) { font-size: 1.2rem; font-weight: 800; color: #16a34a; text-align: right; }
:deep(.el-table .table-row:hover td) { background: #f0f9ff !important; }
</style>