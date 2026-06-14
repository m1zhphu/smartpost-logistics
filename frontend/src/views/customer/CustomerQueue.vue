<template>
  <div class="customer-portal">
    <div class="portal-container">
      <el-row :gutter="24" class="portal-content">
        <el-col :span="24">
          <div>
            <!-- QUEUE CARD -->
            <el-card class="recent-waybills-card mt-20 animate-fade-in border-warning" shadow="hover">
              <template #header>
                <div class="flex-between">
                  <div class="card-header-title text-warning" style="color: #eab308;">
                    <el-icon><FolderOpened /></el-icon><span>Hàng Chờ Tạo Đơn ({{ draftsList.length }})</span>
                  </div>
                  <div class="flex-center gap-2 flex-wrap">
                    <el-button type="warning" plain @click="triggerExcelImport">
                      <el-icon class="mr-1"><DocumentAdd /></el-icon>Nhập từ Excel
                    </el-button>
                    <el-button v-if="selectedDrafts.length > 0" type="danger" plain @click="deleteSelectedDrafts">
                      <el-icon class="mr-1"><Close /></el-icon>Xóa mục đã chọn ({{ selectedDrafts.length }})
                    </el-button>
                    <el-button v-if="draftsList.length > 0" type="success" :disabled="selectedDrafts.length === 0" @click="submitSelectedDrafts" :loading="submitLoading">
                      <el-icon class="mr-1"><Upload /></el-icon>Gửi đơn đã chọn ({{ selectedDrafts.length }})
                    </el-button>
                  </div>
                </div>
              </template>
              
              <div v-if="draftsList.length === 0" class="text-center py-5 text-muted">
                <el-icon class="large-icon mb-2" style="font-size: 32px; color: #909399;"><InfoFilled /></el-icon>
                <p>Hàng chờ tạo đơn hiện tại đang trống.</p>
                <el-button type="primary" class="mt-3" @click="router.push('/customer/create')">Tạo đơn mới</el-button>
              </div>

              <div v-else>
                <el-alert
                  title="Hướng dẫn: Vui lòng cho tất cả hàng hóa của các đơn vào 1 túi thư/bao chung (nếu có nhiều đơn) để bưu tá qua lấy hàng một lần thuận tiện nhất."
                  type="warning"
                  show-icon
                  :closable="false"
                  class="mb-4"
                />
                
                <el-table :data="draftsList" stripe class="modern-table" @selection-change="handleSelectionChange">
                  <el-table-column type="selection" width="55" />
                  <el-table-column label="Thời gian lưu" width="160">
                    <template #default="{ row }">
                      <span class="text-xs fw-bold">{{ formatDate(row.created_at) }}</span>
                    </template>
                  </el-table-column>
                  <el-table-column label="Người nhận" min-width="160">
                    <template #default="{ row }">
                      <el-tag v-if="row.pickup_mode === 'BULK_MAIL'" type="warning" size="small">Bổ sung sau OCR</el-tag>
                      <template v-else>
                        <div class="fw-bold">{{ row.receiver.name || '---' }}</div>
                        <div class="text-xs text-muted">{{ row.receiver.phone || '---' }}</div>
                      </template>
                    </template>
                  </el-table-column>
                  <el-table-column label="Hàng hóa" min-width="150">
                    <template #default="{ row }">
                      <div v-if="row.pickup_mode === 'BULK_MAIL'" class="text-xs fw-bold">{{ row.bulk_estimated_quantity }} bưu gửi</div>
                      <div v-else class="text-xs">{{ row.items[0]?.product_name || '---' }}</div>
                      <div class="text-xs text-info" style="margin-top: 2px;">
                        <el-tag size="small" type="info">{{ getProductTypeLabel(row.pickup_mode === 'BULK_MAIL' ? row.bulk_product_type : row.items[0]?.product_group) }}</el-tag>
                      </div>
                      <div v-if="row.pickup_mode !== 'BULK_MAIL'" class="text-xs fw-bold text-primary" style="margin-top: 4px;">{{ row.items[0]?.weight || 0 }} kg</div>
                    </template>
                  </el-table-column>
                  <el-table-column label="Trạng thái" min-width="180">
                    <template #default="{ row }">
                      <div v-if="row.error" class="text-danger text-xs" style="line-height: 1.4; display: flex; align-items: center;">
                        <el-icon style="font-size: 14px; margin-right: 4px; flex-shrink: 0;"><Warning /></el-icon>
                        <span>{{ row.error }}</span>
                      </div>
                      <el-tag v-else type="info" size="small">Chờ gửi</el-tag>
                    </template>
                  </el-table-column>
                  <el-table-column label="Thao tác" width="180" align="center" fixed="right">
                    <template #default="{ row }">
                      <el-button type="primary" size="small" plain @click="resumeDraft(row)">
                        Tiếp tục
                      </el-button>
                      <el-button type="danger" size="small" plain @click="deleteDraft(row.draft_id)">
                        Xóa
                      </el-button>
                    </template>
                  </el-table-column>
                </el-table>
              </div>
            </el-card>
          </div>
        </el-col>
      </el-row>
      <input type="file" ref="excelInput" style="display: none;" accept=".xlsx, .xls" @change="handleExcelUpload" />
    </div>
  </div>
</template>

<script setup>
import { computed, ref, reactive, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { ElMessage, ElMessageBox } from 'element-plus';
import api from '@/api/axios';
import { formatVietnamDateTime } from '@/utils/dateTime';
import * as XLSX from 'xlsx';
import { 
  User, Service, Phone, Message, Close, 
  Search, DocumentAdd, Location, List, Edit, Lock,
  Box, Setting, CircleCheck, InfoFilled, FolderOpened, Upload, ArrowLeft, Refresh, Warning
} from '@element-plus/icons-vue';
import { parseExcelFile, processExcelRows } from '@/utils/excelParser';

// ---- Dynamic Address API (provinces.open-api.vn) ----
const ADDR_API = 'https://provinces.open-api.vn/api';
const provinces = ref([]);
const productTypes = ref([
  { code: 'DOCUMENT', label: 'Thư từ/Tài liệu' },
  { code: 'PARCEL', label: 'Bưu phẩm, bưu kiện' },
  { code: 'GENERAL', label: 'Hàng hóa thông thường' },
  { code: 'LIQUID', label: 'Chất lỏng' },
  { code: 'ELECTRONIC', label: 'Điện tử' },
  { code: 'FOOD', label: 'Thực phẩm' },
  { code: 'HIGH_VALUE', label: 'Giá trị cao' }
]);

const fetchProductTypes = async () => {
  try {
    const res = await api.get('/api/waybills/product-types');
    if (res.data && res.data.items) {
      productTypes.value = res.data.items;
    }
  } catch (err) {
    console.error('Không thể tải danh sách loại hàng', err);
  }
};

const getProductTypeLabel = (code) => {
  const pt = productTypes.value.find(p => p.code === code);
  return pt ? pt.label : 'Bưu phẩm, bưu kiện';
};

const excelInput = ref(null);
const districtsCache = {};
const wardsCache = {};

const senderDistricts = ref([]);
const senderWards = ref([]);
const receiverDistricts = ref([]);
const receiverWards = ref([]);
const editDistricts = ref([]);
const editWards = ref([]);

const fetchProvinces = async () => {
  if (provinces.value.length) return;
  try {
    const res = await fetch(`${ADDR_API}/`);
    const data = await res.json();
    provinces.value = data.map(p => ({ id: p.code, name: p.name }));
  } catch (err) {
    console.error('Không thể tải danh sách tỉnh/thành phố', err);
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

const authStore = useAuthStore();
const router = useRouter();
const route = useRoute();

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

// Portal View States
const submitLoading = ref(false);
const draftsList = ref([]);
const availableServices = ref([]);

// Form model
const form = reactive({
  sender: {
    name: '',
    phone: '',
    province_id: null,
    district_id: null,
    ward_id: null,
    address_detail: ''
  },
  receiver: {
    name: '',
    phone: '',
    province_id: null,
    district_id: null,
    ward_id: null,
    address_detail: ''
  },
  items: [
    {
      product_name: '',
      weight: 0.5,
      length: 0,
      width: 0,
      height: 0,
      quantity: 1,
      declared_value: 0
    }
  ],
  cod_amount: 0,
  cod_receiver_pays_fee: false,
  service_type: 'STANDARD',
  extra_services: [],
  delivery_note_option: 'CHO_XEM_HANG',
  note: '',
  payment_method: 'SENDER_DEBT',
  target_hub_id: null
});

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

const resumeDraft = (draft) => {
  router.push(`/customer/create?resume_draft_id=${draft.draft_id}`);
};

const deleteDraft = (draftId) => {
  draftsList.value = draftsList.value.filter(d => d.draft_id !== draftId);
  localStorage.setItem('customer_pickup_queue', JSON.stringify(draftsList.value));
  ElMessage.success('Đã xóa đơn khỏi hàng chờ');
};

const triggerExcelImport = () => {
  excelInput.value.click();
};

const handleExcelUpload = async (event) => {
  const file = event.target.files[0];
  if (!file) return;

  try {
    if (provinces.value.length === 0) {
      await fetchProvinces();
    }

    ElMessage.info('Đang đọc file Excel...');
    const rawRows = await parseExcelFile(file);

    if (rawRows.length === 0) {
      ElMessage.warning('File Excel không có dữ liệu.');
      return;
    }

    ElMessage.info(`Đang phân tích ${rawRows.length} dòng dữ liệu...`);

    const defaultSender = {
      name: form.sender?.name || authStore.user?.full_name || customerInfo.value?.transaction_name || '',
      phone: form.sender?.phone || customerInfo.value?.phone_number || '',
      province_id: form.sender?.province_id || customerInfo.value?.province_id || null,
      district_id: form.sender?.district_id || customerInfo.value?.district_id || null,
      ward_id: form.sender?.ward_id || customerInfo.value?.ward_id || null,
      address_detail: form.sender?.address_detail || customerInfo.value?.address_detail || ''
    };

    const importedDrafts = await processExcelRows({
      rawRows,
      provincesList: provinces.value,
      fetchDistricts: fetchDistrictsForProvince,
      fetchWards: fetchWardsForDistrict,
      districtsCache,
      wardsCache,
      defaultSender,
      targetHubId: form.target_hub_id
    });

    if (importedDrafts.length === 0) {
      ElMessage.warning('Không phân tích được đơn hàng hợp lệ nào từ file Excel.');
      event.target.value = '';
      return;
    }

    try {
      await ElMessageBox.confirm(
        `Hệ thống đã đọc và phân tích thành công ${importedDrafts.length} đơn hàng hợp lệ từ file Excel. Bạn có muốn đưa ${importedDrafts.length} đơn hàng này vào hàng chờ không?`,
        'Xác nhận nhập dữ liệu',
        {
          confirmButtonText: 'Đồng ý',
          cancelButtonText: 'Hủy',
          type: 'success'
        }
      );
    } catch (e) {
      ElMessage.info('Đã hủy nhập dữ liệu từ Excel');
      event.target.value = '';
      return;
    }

    draftsList.value.push(...importedDrafts);
    localStorage.setItem('customer_pickup_queue', JSON.stringify(draftsList.value));

    ElMessage.success(`Nhập thành công ${importedDrafts.length} đơn vào hàng chờ.`);
    event.target.value = '';
  } catch (err) {
    console.error(err);
    ElMessage.error('Có lỗi xảy ra khi đọc file Excel. Vui lòng kiểm tra lại cấu trúc file.');
  }
};

const storageKey = computed(() => 'customer_recipients_' + (authStore.user?.id || authStore.user?.username || 'global'));

const saveToAddressBook = (receiver) => {
  if (!receiver.name || !receiver.phone || !receiver.province_id) return;
  try {
    const raw = localStorage.getItem(storageKey.value);
    const list = raw ? JSON.parse(raw) : [];
    const index = list.findIndex(item => item.phone === receiver.phone);
    if (index >= 0) {
      list[index] = {
        ...list[index],
        name: receiver.name,
        province_id: receiver.province_id,
        district_id: receiver.district_id,
        ward_id: receiver.ward_id,
        address_detail: receiver.address_detail
      };
    } else {
      list.push({
        id: Date.now().toString(),
        name: receiver.name,
        phone: receiver.phone,
        province_id: receiver.province_id,
        district_id: receiver.district_id,
        ward_id: receiver.ward_id,
        address_detail: receiver.address_detail,
        created_at: new Date().toISOString()
      });
    }
    localStorage.setItem(storageKey.value, JSON.stringify(list));
  } catch (e) {
    console.error('Error saving to recipient book', e);
  }
};

const selectedDrafts = ref([]);

const handleSelectionChange = (val) => {
  selectedDrafts.value = val;
};

const deleteSelectedDrafts = () => {
  if (selectedDrafts.value.length === 0) return;
  ElMessageBox.confirm(
    `Bạn có chắc muốn xóa ${selectedDrafts.value.length} đơn hàng đã chọn khỏi hàng chờ không?`,
    'Xác nhận xóa',
    {
      confirmButtonText: 'Xóa',
      cancelButtonText: 'Hủy',
      type: 'warning'
    }
  ).then(() => {
    const selectedIds = selectedDrafts.value.map(d => d.draft_id);
    draftsList.value = draftsList.value.filter(d => !selectedIds.includes(d.draft_id));
    localStorage.setItem('customer_pickup_queue', JSON.stringify(draftsList.value));
    selectedDrafts.value = [];
    ElMessage.success('Đã xóa thành công các đơn đã chọn');
  }).catch(() => {});
};

const submitSelectedDrafts = async () => {
  if (selectedDrafts.value.length === 0) return;

  try {
    await ElMessageBox.confirm(
      `Bạn có chắc chắn muốn gửi ${selectedDrafts.value.length} yêu cầu lấy hàng đã chọn không?`,
      'Xác nhận gửi yêu cầu',
      {
        confirmButtonText: 'Xác nhận gửi',
        cancelButtonText: 'Hủy',
        type: 'success'
      }
    );
  } catch (e) {
    return; // User cancelled
  }

  submitLoading.value = true;
  await preloadCachesForDrafts();
  let successCount = 0;
  const successIds = [];

  for (const draft of selectedDrafts.value) {
    try {
      const sName = getProvinceName(draft.sender.province_id);
      const sDist = getDistrictName(draft.sender.province_id, draft.sender.district_id);
      const sWrd = getWardName(draft.sender.district_id, draft.sender.ward_id);

      if (draft.pickup_mode === 'BULK_MAIL') {
        const draftItems = (draft.bulk_draft_items || []).map((item, index) => ({
          sequence_no: index + 1,
          customer_reference_code: item.customer_reference_code || null,
          receiver_name: item.receiver_name || null,
          receiver_phone: item.receiver_phone || null,
          receiver_address: item.receiver_address || null,
          note: item.note || null
        }));
        const firstMail = draftItems[0] || {};
        const hasReceiver = Number(draft.bulk_estimated_quantity) === 1 && (
          firstMail.receiver_name || firstMail.receiver_phone || firstMail.receiver_address
        );
        await api.post('/api/waybills/customer/bulk-mail-pickups', {
          product_type: draft.bulk_product_type,
          service_type: draft.service_type || 'TK',
          payment_method: draft.payment_method || 'SENDER_DEBT',
          estimated_quantity: Number(draft.bulk_estimated_quantity),
          sender: {
            name: draft.sender.name,
            phone: draft.sender.phone,
            address: [draft.sender.address_detail, sWrd, sDist, sName].filter(Boolean).join(', '),
            province_id: Number(draft.sender.province_id),
            district_id: Number(draft.sender.district_id),
            ward_id: draft.sender.ward_id ? Number(draft.sender.ward_id) : null,
            province_name: sName,
            district_name: sDist,
            ward_name: sWrd
          },
          receiver: hasReceiver ? {
            name: firstMail.receiver_name || null,
            phone: firstMail.receiver_phone || null,
            address: firstMail.receiver_address || '',
          } : null,
          draft_items: draftItems,
          target_hub_id: draft.target_hub_id || null,
          note: draft.note || null
        });
        successCount++;
        successIds.push(draft.draft_id);
        continue;
      }

      const rName = getProvinceName(draft.receiver.province_id);
      const rDist = getDistrictName(draft.receiver.province_id, draft.receiver.district_id);
      const rWrd = getWardName(draft.receiver.district_id, draft.receiver.ward_id);

      const mappedExtra = draft.extra_services.map(code => {
        const srv = availableServices.value.find(s => s.service_code === code);
        return {
          service_code: code,
          service_name: srv ? srv.service_name : '',
          service_fee: srv ? (srv.fee_type === 'FIXED' ? srv.fee_value : 0) : 0
        };
      });

      const payload = {
        order_type: 'DOMESTIC',
        sender: {
          name: draft.sender.name,
          phone: draft.sender.phone,
          address: [draft.sender.address_detail, sWrd, sDist, sName].filter(Boolean).join(', '),
          province_id: Number(draft.sender.province_id),
          district_id: Number(draft.sender.district_id),
          ward_id: Number(draft.sender.ward_id),
          province_name: sName,
          district_name: sDist,
          ward_name: sWrd
        },
        receiver: {
          name: draft.receiver.name,
          phone: draft.receiver.phone,
          address: [draft.receiver.address_detail, rWrd, rDist, rName].filter(Boolean).join(', '),
          province_id: Number(draft.receiver.province_id),
          district_id: Number(draft.receiver.district_id),
          ward_id: Number(draft.receiver.ward_id),
          province_name: rName,
          district_name: rDist,
          ward_name: rWrd
        },
        items: draft.items.map(i => ({
          product_group: i.product_group || 'PARCEL',
          product_name: i.product_name,
          weight: Number(i.weight),
          length: Number(i.length || 0),
          width: Number(i.width || 0),
          height: Number(i.height || 0),
          quantity: Number(i.quantity || 1),
          declared_value: Number(i.declared_value || 0)
        })),
        cod_amount: Number(draft.cod_amount || 0),
        cod_receiver_pays_fee: draft.cod_receiver_pays_fee,
        service_type: draft.service_type,
        extra_services: mappedExtra,
        delivery_note_option: draft.delivery_note_option,
        note: draft.note,
        payment_method: draft.payment_method,
        pickup_method: 'OUR_STAFF_PICKUP',
        delivery_method: 'OUR_STAFF_DELIVERY',
        target_hub_id: draft.target_hub_id || null,
        save_as_draft: false
      };

      await api.post('/api/waybills/customer/pickups', payload);
      successCount++;
      successIds.push(draft.draft_id);
      saveToAddressBook(draft.receiver);
    } catch (err) {
      console.error('Lỗi khi gửi đơn nháp:', err);
      let errorMsg = 'Lỗi hệ thống khi gửi đơn hàng.';
      if (err.response && err.response.data) {
        if (Array.isArray(err.response.data.detail)) {
          errorMsg = err.response.data.detail.map(d => d.msg).join(', ');
        } else if (err.response.data.detail) {
          errorMsg = err.response.data.detail;
        }
      }
      draft.error = errorMsg;
    }
  }

  submitLoading.value = false;

  const totalSelected = selectedDrafts.value.length;
  const failedCount = totalSelected - successCount;

  // Cập nhật danh sách đơn hàng chờ: giữ các đơn thất bại và lưu lỗi, xóa đơn thành công
  draftsList.value = draftsList.value.map(d => {
    const matchedSelected = selectedDrafts.value.find(sd => sd.draft_id === d.draft_id);
    if (matchedSelected) {
      if (successIds.includes(d.draft_id)) {
        return null;
      }
      return { ...d, error: matchedSelected.error || 'Lỗi gửi đơn' };
    }
    return d;
  }).filter(Boolean);

  localStorage.setItem('customer_pickup_queue', JSON.stringify(draftsList.value));
  selectedDrafts.value = [];

  if (successCount > 0) {
    if (failedCount === 0) {
      ElMessage.success(`Tạo thành công tất cả ${successCount} đơn hàng đã chọn!`);
      router.push('/customer/orders');
    } else {
      ElMessage.warning(`Đã tạo thành công ${successCount} đơn. Có ${failedCount} đơn bị lỗi, vui lòng kiểm tra chi tiết lỗi trong hàng chờ.`);
    }
  } else {
    ElMessage.error(`Tất cả ${totalSelected} đơn gửi thất bại. Vui lòng kiểm tra chi tiết lỗi trong hàng chờ.`);
  }
};

const formatDate = (val) => {
  return formatVietnamDateTime(val);
};

const fetchAvailableServices = async () => {
  try {
    const res = await api.get('/api/pricing/extra-services');
    availableServices.value = res.data || [];
  } catch (err) {
    console.error('Error fetching extra services:', err);
  }
};

const preloadCachesForDrafts = async () => {
  if (!draftsList.value || draftsList.value.length === 0) return;
  const provinceIds = new Set();
  const districtIds = new Set();

  for (const draft of draftsList.value) {
    if (draft.sender) {
      if (draft.sender.province_id) provinceIds.add(Number(draft.sender.province_id));
      if (draft.sender.district_id) districtIds.add(Number(draft.sender.district_id));
    }
    if (draft.receiver) {
      if (draft.receiver.province_id) provinceIds.add(Number(draft.receiver.province_id));
      if (draft.receiver.district_id) districtIds.add(Number(draft.receiver.district_id));
    }
  }

  if (provinces.value.length === 0) {
    await fetchProvinces();
  }

  try {
    await Promise.all([
      ...Array.from(provinceIds).map(pid => fetchDistrictsForProvince(pid)),
      ...Array.from(districtIds).map(did => fetchWardsForDistrict(did))
    ]);
  } catch (e) {
    console.error('Error preloading address caches:', e);
  }
};

const loadDrafts = () => {
  try {
    const storedQueue = localStorage.getItem('customer_pickup_queue');
    if (storedQueue) {
      draftsList.value = JSON.parse(storedQueue);
    }
  } catch (e) {
    console.error('Lỗi khi tải hàng chờ', e);
  }
};

onMounted(async () => {
  await fetchProvinces();
  await fetchProductTypes();
  loadDrafts();
  await preloadCachesForDrafts();
  fetchAvailableServices();
});
</script>

<style scoped src="./CustomerPortal.css"></style>
