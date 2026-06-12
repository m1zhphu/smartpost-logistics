<template>
  <div class="customer-portal">
    <div class="portal-container">
      <el-row :gutter="24" class="portal-content animate-fade-in-up">
        <el-col :span="24">
          <el-card class="info-card">
            <template #header>
              <div class="flex-between w-full">
                <div class="card-header-title">
                  <el-icon><Notebook /></el-icon>
                  <span>Sổ địa chỉ người nhận</span>
                </div>
                <div class="flex-center gap-2">
                  <el-input
                    v-model="searchQuery"
                    placeholder="Tìm theo tên hoặc SĐT..."
                    clearable
                    style="width: 250px;"
                  >
                    <template #prefix>
                      <el-icon><Search /></el-icon>
                    </template>
                  </el-input>
                  <el-button type="primary" @click="openAddDialog">
                    <el-icon class="mr-6"><Plus /></el-icon>Thêm địa chỉ mới
                  </el-button>
                </div>
              </div>
            </template>

            <!-- Table List of Saved Recipients -->
            <el-table :data="filteredRecipients" style="width: 100%" v-loading="loading">
              <el-table-column type="index" label="STT" width="60" align="center" />
              <el-table-column prop="name" label="Họ và tên" min-width="150" sortable>
                <template #default="{ row }">
                  <span class="fw-bold">{{ row.name }}</span>
                </template>
              </el-table-column>
              <el-table-column prop="phone" label="Số điện thoại" width="150">
                <template #default="{ row }">
                  <span class="text-success fw-bold">{{ row.phone }}</span>
                </template>
              </el-table-column>
              <el-table-column label="Địa chỉ" min-width="300">
                <template #default="{ row }">
                  <span>{{ formatFullAddress(row) }}</span>
                </template>
              </el-table-column>
              <el-table-column label="Thao tác" width="160" align="center">
                <template #default="{ row }">
                  <el-button-group>
                    <el-button type="primary" size="small" :icon="Edit" @click="openEditDialog(row)">Sửa</el-button>
                    <el-button type="danger" size="small" :icon="Delete" @click="handleDelete(row)">Xóa</el-button>
                  </el-button-group>
                </template>
              </el-table-column>
              <template #empty>
                <div class="text-center py-5">
                  <el-icon style="font-size: 48px; color: var(--sp-text-muted);" class="mb-2"><FolderOpened /></el-icon>
                  <p class="text-muted">Chưa có người nhận nào trong sổ địa chỉ.</p>
                </div>
              </template>
            </el-table>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- Add/Edit Dialog -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogType === 'add' ? 'Thêm người nhận mới' : 'Cập nhật người nhận'"
      width="550px"
      destroy-on-close
    >
      <el-form :model="form" :rules="rules" ref="formRef" label-position="top">
        <el-form-item label="Họ tên người nhận" prop="name" required>
          <el-input v-model="form.name" placeholder="Nhập tên người nhận..." />
        </el-form-item>

        <el-form-item label="Số điện thoại" prop="phone" required>
          <el-input v-model="form.phone" placeholder="Nhập số điện thoại liên hệ..." />
        </el-form-item>

        <el-row :gutter="16">
          <el-col :span="8">
            <el-form-item label="Tỉnh / Thành" prop="province_id" required>
              <el-select v-model="form.province_id" placeholder="Chọn tỉnh" @change="handleProvinceChange" filterable style="width: 100%;">
                <el-option v-for="p in provinces" :key="p.id" :label="p.name" :value="p.id" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="Quận / Huyện" prop="district_id" required>
              <el-select v-model="form.district_id" placeholder="Chọn huyện" @change="handleDistrictChange" :disabled="!form.province_id" filterable style="width: 100%;">
                <el-option v-for="d in districts" :key="d.id" :label="d.name" :value="d.id" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="Phường / Xã" prop="ward_id">
              <el-select v-model="form.ward_id" placeholder="Chọn xã" :disabled="!form.district_id" filterable style="width: 100%;">
                <el-option v-for="w in wards" :key="w.id" :label="w.name" :value="w.id" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="Địa chỉ chi tiết (Số nhà, đường...)" prop="address_detail">
          <el-input v-model="form.address_detail" type="textarea" :rows="2" placeholder="Địa chỉ giao hàng chi tiết..." />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialogVisible = false">Hủy</el-button>
          <el-button type="primary" :loading="submitLoading" @click="handleSave">Lưu thông tin</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, reactive, onMounted } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Notebook, Search, Plus, Edit, Delete, FolderOpened } from '@element-plus/icons-vue';

// Address Dynamic API
const ADDR_API = 'https://provinces.open-api.vn/api';
const provinces = ref([]);
const districtsCache = {};
const wardsCache = {};

const districts = ref([]);
const wards = ref([]);
const loading = ref(false);
const submitLoading = ref(false);
const searchQuery = ref('');

const authStore = useAuthStore();
const storageKey = computed(() => 'customer_recipients_' + (authStore.user?.id || authStore.user?.username || 'global'));

const recipients = ref([]);
const dialogVisible = ref(false);
const dialogType = ref('add'); // 'add' | 'edit'
const formRef = ref(null);
const editingId = ref(null);

const form = reactive({
  name: '',
  phone: '',
  province_id: null,
  district_id: null,
  ward_id: null,
  address_detail: ''
});

const rules = {
  name: [{ required: true, message: 'Vui lòng nhập họ tên người nhận', trigger: 'blur' }],
  phone: [{ required: true, message: 'Vui lòng nhập số điện thoại', trigger: 'blur' }],
  province_id: [{ required: true, message: 'Vui lòng chọn Tỉnh/Thành', trigger: 'change' }],
  district_id: [{ required: true, message: 'Vui lòng chọn Quận/Huyện', trigger: 'change' }]
};

// Autocomplete suggestions
const filteredRecipients = computed(() => {
  const query = searchQuery.value.trim().toLowerCase();
  if (!query) return recipients.value;
  return recipients.value.filter(item => 
    (item.name && item.name.toLowerCase().includes(query)) ||
    (item.phone && item.phone.includes(query))
  );
});

// Load provinces, districts, and wards
const fetchProvinces = async () => {
  try {
    const res = await fetch(`${ADDR_API}/`);
    const data = await res.json();
    provinces.value = data.map(p => ({ id: p.code, name: p.name }));
  } catch (err) {
    console.error('Không thể tải danh sách tỉnh/thành', err);
  }
};

const fetchDistrictsForProvince = async (provinceId) => {
  if (!provinceId) return [];
  const pId = Number(provinceId);
  if (districtsCache[pId]) return districtsCache[pId];
  try {
    const res = await fetch(`${ADDR_API}/p/${pId}?depth=2`);
    const data = await res.json();
    const list = (data.districts || []).map(d => ({ id: d.code, name: d.name }));
    districtsCache[pId] = list;
    return list;
  } catch (err) {
    console.error('Không thể tải danh sách quận/huyện', err);
    return [];
  }
};

const fetchWardsForDistrict = async (districtId) => {
  if (!districtId) return [];
  const dId = Number(districtId);
  if (wardsCache[dId]) return wardsCache[dId];
  try {
    const res = await fetch(`${ADDR_API}/d/${dId}?depth=2`);
    const data = await res.json();
    const list = (data.wards || []).map(w => ({ id: w.code, name: w.name }));
    wardsCache[dId] = list;
    return list;
  } catch (err) {
    console.error('Không thể tải danh sách phường/xã', err);
    return [];
  }
};

const loadRecipients = () => {
  loading.value = true;
  try {
    const raw = localStorage.getItem(storageKey.value);
    recipients.value = raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('Lỗi khi đọc sổ địa chỉ', e);
  } finally {
    loading.value = false;
  }
};

const getProvinceName = (id) => provinces.value.find(p => Number(p.id) === Number(id))?.name || '';
const getDistrictName = (provId, distId) => {
  if (!provId || !distId) return '';
  const cached = districtsCache[Number(provId)];
  if (cached) {
    return cached.find(d => Number(d.id) === Number(distId))?.name || '';
  }
  return '';
};
const getWardName = (distId, wardId) => {
  if (!distId || !wardId) return '';
  const cached = wardsCache[Number(distId)];
  if (cached) {
    return cached.find(w => Number(w.id) === Number(wardId))?.name || '';
  }
  return '';
};

const formatFullAddress = (row) => {
  const pName = getProvinceName(row.province_id);
  const dName = getDistrictName(row.province_id, row.district_id);
  const wName = getWardName(row.district_id, row.ward_id);
  
  const parts = [row.address_detail, wName, dName, pName].filter(Boolean);
  return parts.length > 0 ? parts.join(', ') : 'Chưa cập nhật';
};

const handleProvinceChange = async () => {
  form.district_id = null;
  form.ward_id = null;
  wards.value = [];
  if (form.province_id) {
    districts.value = await fetchDistrictsForProvince(form.province_id);
  } else {
    districts.value = [];
  }
};

const handleDistrictChange = async () => {
  form.ward_id = null;
  if (form.district_id) {
    wards.value = await fetchWardsForDistrict(form.district_id);
  } else {
    wards.value = [];
  }
};

const openAddDialog = () => {
  dialogType.value = 'add';
  editingId.value = null;
  form.name = '';
  form.phone = '';
  form.province_id = null;
  form.district_id = null;
  form.ward_id = null;
  form.address_detail = '';
  districts.value = [];
  wards.value = [];
  dialogVisible.value = true;
};

const openEditDialog = async (row) => {
  dialogType.value = 'edit';
  editingId.value = row.id;
  form.name = row.name;
  form.phone = row.phone;
  form.province_id = row.province_id;
  
  districts.value = await fetchDistrictsForProvince(row.province_id);
  form.district_id = row.district_id;
  
  wards.value = await fetchWardsForDistrict(row.district_id);
  form.ward_id = row.ward_id;
  
  form.address_detail = row.address_detail;
  dialogVisible.value = true;
};

const handleSave = async () => {
  if (!formRef.value) return;
  await formRef.value.validate(async (valid) => {
    if (!valid) return;
    submitLoading.value = true;
    try {
      const list = [...recipients.value];
      if (dialogType.value === 'add') {
        const exists = list.some(item => item.phone === form.phone);
        if (exists) {
          ElMessage.warning('Số điện thoại này đã tồn tại trong danh bạ.');
          submitLoading.value = false;
          return;
        }
        list.push({
          id: Date.now().toString(),
          ...JSON.parse(JSON.stringify(form)),
          created_at: new Date().toISOString()
        });
        ElMessage.success('Đã thêm người nhận mới thành công.');
      } else {
        const index = list.findIndex(item => item.id === editingId.value);
        if (index >= 0) {
          list[index] = {
            ...list[index],
            ...JSON.parse(JSON.stringify(form))
          };
          ElMessage.success('Đã cập nhật thông tin người nhận.');
        }
      }
      recipients.value = list;
      localStorage.setItem(storageKey.value, JSON.stringify(list));
      dialogVisible.value = false;
    } catch (e) {
      console.error(e);
      ElMessage.error('Có lỗi xảy ra khi lưu thông tin.');
    } finally {
      submitLoading.value = false;
    }
  });
};

const handleDelete = (row) => {
  ElMessageBox.confirm(
    `Bạn có chắc chắn muốn xóa "${row.name}" khỏi sổ địa chỉ không?`,
    'Xác nhận xóa',
    {
      confirmButtonText: 'Xóa',
      cancelButtonText: 'Hủy',
      type: 'warning'
    }
  ).then(() => {
    const list = recipients.value.filter(item => item.id !== row.id);
    recipients.value = list;
    localStorage.setItem(storageKey.value, JSON.stringify(list));
    ElMessage.success('Đã xóa người nhận khỏi sổ địa chỉ.');
  }).catch(() => {});
};

onMounted(async () => {
  await fetchProvinces();
  loadRecipients();
  
  // Warm up caches for existing recipients
  for (const item of recipients.value) {
    if (item.province_id && !districtsCache[item.province_id]) {
      fetchDistrictsForProvince(item.province_id);
    }
    if (item.district_id && !wardsCache[item.district_id]) {
      fetchWardsForDistrict(item.district_id);
    }
  }
});
</script>

<style scoped src="./CustomerPortal.css"></style>
