<template>
  <div class="create-pickup-page">
    <div class="page-heading">
      <div>
        <h2>Thêm mới yêu cầu</h2>
        <p>Tạo yêu cầu pickup thay khách hàng từ tổng đài hoặc kênh nội bộ.</p>
      </div>
    </div>

    <el-form ref="formRef" :model="form" :rules="rules" label-position="top" v-loading="loading">
      <el-card class="form-card">
        <template #header><strong>Thông tin tiếp nhận</strong></template>
        <el-row :gutter="20">
          <el-col :md="12" :sm="24">
            <el-form-item label="Khách hàng" prop="customer_id">
              <el-select v-model="form.customer_id" filterable placeholder="Chọn mã hoặc tên khách hàng" class="w-full" @change="fillCustomer">
                <el-option v-for="customer in customers" :key="customer.customer_id" :value="customer.customer_id" :label="`[${customer.customer_code}] ${customer.name}`">
                  <div class="customer-option"><strong>{{ customer.customer_code }}</strong><span>{{ customer.name }} - {{ customer.phone_number }}</span></div>
                </el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :md="6" :sm="12">
            <el-form-item label="Nguồn tiếp nhận" prop="source">
              <el-select v-model="form.source" class="w-full">
                <el-option label="Tổng đài" value="HOTLINE" />
                <el-option label="Trang thành viên" value="PORTAL" />
                <el-option label="CSKH tiếp nhận" value="CSKH" />
                <el-option label="Quản trị tạo" value="ADMIN" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :md="6" :sm="12"><el-form-item label="Hình thức yêu cầu"><el-radio-group v-model="form.pickup_mode"><el-radio-button value="SINGLE">Đơn lẻ</el-radio-button><el-radio-button value="BULK_MAIL">Túi thư</el-radio-button></el-radio-group></el-form-item></el-col>
          <el-col :md="6" :sm="12"><el-form-item label="Nhân viên lấy hàng"><el-select v-model="form.assigned_shipper_id" filterable clearable placeholder="Gán sau hoặc chọn ngay" class="w-full"><el-option v-for="shipper in shippers" :key="shipper.user_id" :label="`${shipper.full_name} (${shipper.username})`" :value="shipper.user_id" /></el-select></el-form-item></el-col>
          <el-col :md="6" :sm="12">
            <el-form-item label="Văn phòng tiếp nhận" prop="target_hub_id">
              <el-select v-model="form.target_hub_id" filterable placeholder="Chọn văn phòng" class="w-full">
                <el-option v-for="hub in hubs" :key="hub.hub_id" :label="`${hub.hub_code} - ${hub.hub_name}`" :value="hub.hub_id" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
      </el-card>

      <el-card class="form-card">
        <template #header><strong>Thông tin lấy hàng</strong></template>
        <el-row :gutter="20">
          <el-col :md="8"><el-form-item label="Người gửi" prop="sender.name"><el-input v-model="form.sender.name" /></el-form-item></el-col>
          <el-col :md="8"><el-form-item label="Số điện thoại" prop="sender.phone"><el-input v-model="form.sender.phone" /></el-form-item></el-col>
          <el-col :md="8"><el-form-item label="Tỉnh/Thành" prop="sender.province_id"><el-select v-model="form.sender.province_id" filterable class="w-full" @change="loadSenderDistricts"><el-option v-for="item in provinces" :key="item.code" :label="item.name" :value="item.code" /></el-select></el-form-item></el-col>
          <el-col :md="8"><el-form-item label="Quận/Huyện"><el-select v-model="form.sender.district_id" filterable class="w-full" @change="loadSenderWards"><el-option v-for="item in senderDistricts" :key="item.code" :label="item.name" :value="item.code" /></el-select></el-form-item></el-col>
          <el-col :md="8"><el-form-item label="Phường/Xã"><el-select v-model="form.sender.ward_id" filterable class="w-full"><el-option v-for="item in senderWards" :key="item.code" :label="item.name" :value="item.code" /></el-select></el-form-item></el-col>
          <el-col :md="8"><el-form-item label="Địa chỉ chi tiết" prop="sender.address"><el-input v-model="form.sender.address" /></el-form-item></el-col>
        </el-row>
      </el-card>

      <el-card v-if="form.pickup_mode === 'SINGLE'" class="form-card">
        <template #header><strong>Thông tin giao hàng</strong></template>
        <el-row :gutter="20">
          <el-col :md="8"><el-form-item label="Người nhận (có thể bổ sung sau)"><el-input v-model="form.receiver.name" /></el-form-item></el-col>
          <el-col :md="8"><el-form-item label="Số điện thoại"><el-input v-model="form.receiver.phone" /></el-form-item></el-col>
          <el-col :md="8"><el-form-item label="Tỉnh/Thành"><el-select v-model="form.receiver.province_id" filterable clearable class="w-full" @change="loadReceiverDistricts"><el-option v-for="item in provinces" :key="item.code" :label="item.name" :value="item.code" /></el-select></el-form-item></el-col>
          <el-col :md="8"><el-form-item label="Quận/Huyện"><el-select v-model="form.receiver.district_id" filterable class="w-full" @change="loadReceiverWards"><el-option v-for="item in receiverDistricts" :key="item.code" :label="item.name" :value="item.code" /></el-select></el-form-item></el-col>
          <el-col :md="8"><el-form-item label="Phường/Xã"><el-select v-model="form.receiver.ward_id" filterable class="w-full"><el-option v-for="item in receiverWards" :key="item.code" :label="item.name" :value="item.code" /></el-select></el-form-item></el-col>
          <el-col :md="8"><el-form-item label="Địa chỉ chi tiết"><el-input v-model="form.receiver.address" /></el-form-item></el-col>
        </el-row>
      </el-card>

      <el-card v-if="form.pickup_mode === 'BULK_MAIL'" class="form-card">
        <template #header><strong>Danh sách thư trong túi</strong></template>
        <el-row :gutter="20"><el-col :md="8"><el-form-item label="Loại bưu gửi"><el-select v-model="form.bulk_product_type" class="w-full"><el-option v-for="type in productTypes" :key="type.code" :label="type.label" :value="type.code" /></el-select></el-form-item></el-col><el-col :md="8"><el-form-item label="Hình thức giao hàng"><el-select v-model="form.service_type" class="w-full" :class="{ 'urgent-select': form.service_type === 'HT' }"><el-option label="Tiết kiệm" value="TK" /><el-option label="Chuyển phát nhanh" value="CPN" /><el-option label="Hỏa tốc" value="HT" /></el-select></el-form-item></el-col><el-col :md="8"><el-form-item label="Số lượng dự kiến"><el-input-number v-model="form.bulk_estimated_quantity" :min="1" :max="1000" class="w-full" @change="syncBulkRows" /></el-form-item></el-col></el-row>
        <div v-for="(mail,index) in form.bulk_draft_items" :key="mail.local_id" class="mail-row">
          <div class="mail-row-title"><strong>Thư {{ index + 1 }}</strong><el-button v-if="form.bulk_draft_items.length > 1" type="danger" link @click="removeMail(index)">Xóa</el-button></div>
          <el-row :gutter="12"><el-col :md="5"><el-input v-model="mail.customer_reference_code" placeholder="Mã tham chiếu" /></el-col><el-col :md="5"><el-input v-model="mail.receiver_name" placeholder="Tên người nhận (nếu có)" /></el-col><el-col :md="5"><el-input v-model="mail.receiver_phone" placeholder="SĐT (nếu có)" /></el-col><el-col :md="6"><el-input v-model="mail.receiver_address" placeholder="Địa chỉ (nếu có)" /></el-col><el-col :md="3"><el-input v-model="mail.note" placeholder="Ghi chú" /></el-col></el-row>
        </div>
        <el-button type="primary" plain @click="addMail">Thêm thư</el-button>
      </el-card>

      <el-card v-if="form.pickup_mode === 'SINGLE'" class="form-card">
        <template #header><strong>Hàng hóa và dịch vụ</strong></template>
        <el-row :gutter="20">
          <el-col :md="8"><el-form-item label="Tên hàng hóa" prop="item.product_name"><el-input v-model="form.item.product_name" /></el-form-item></el-col>
          <el-col :md="4"><el-form-item label="Khối lượng (kg)" prop="item.weight"><el-input-number v-model="form.item.weight" :min="0.01" :precision="2" class="w-full" /></el-form-item></el-col>
          <el-col :md="4"><el-form-item label="Số lượng"><el-input-number v-model="form.item.quantity" :min="1" class="w-full" /></el-form-item></el-col>
          <el-col :md="4"><el-form-item label="COD"><el-input-number v-model="form.cod_amount" :min="0" :step="10000" class="w-full" /></el-form-item></el-col>
          <el-col :md="4"><el-form-item label="Hình thức giao hàng"><el-select v-model="form.service_type" class="w-full" :class="{ 'urgent-select': form.service_type === 'HT' }"><el-option label="Tiết kiệm" value="TK" /><el-option label="Chuyển phát nhanh" value="CPN" /><el-option label="Hỏa tốc" value="HT" /></el-select></el-form-item></el-col>
          <el-col :md="8"><el-form-item label="Thanh toán"><el-select v-model="form.payment_method" class="w-full"><el-option label="Shop trả cuối tháng" value="SENDER_DEBT" /><el-option label="Shop trả ngay khi gửi" value="SENDER_PAY" /><el-option label="Người nhận thanh toán" value="RECEIVER_PAY" /></el-select></el-form-item></el-col>
          <el-col :md="16"><el-form-item label="Ghi chú"><el-input v-model="form.note" type="textarea" :rows="2" /></el-form-item></el-col>
        </el-row>
      </el-card>

      <div class="form-actions"><el-button @click="$router.back()">Hủy</el-button><el-button type="primary" :loading="submitting" @click="submit">Tạo yêu cầu</el-button></div>
    </el-form>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref, watch } from 'vue';
import { ElMessage } from 'element-plus';
import api from '@/api/axios';

const ADDR_API = 'https://provinces.open-api.vn/api';
const formRef = ref();
const loading = ref(false);
const submitting = ref(false);
const customers = ref([]);
const hubs = ref([]);
const shippers = ref([]);
const productTypes = ref([]);
const provinces = ref([]);
const senderDistricts = ref([]);
const senderWards = ref([]);
const receiverDistricts = ref([]);
const receiverWards = ref([]);

const emptyAddress = () => ({ name: '', phone: '', address: '', province_id: null, district_id: null, ward_id: null });
const createMail = () => ({ local_id: `${Date.now()}-${Math.random()}`, customer_reference_code: '', receiver_name: '', receiver_phone: '', receiver_address: '', note: '' });
const form = reactive({ customer_id: null, source: 'HOTLINE', target_hub_id: null, assigned_shipper_id: null, pickup_mode: 'SINGLE', sender: emptyAddress(), receiver: emptyAddress(), item: { product_name: '', weight: 0.5, quantity: 1 }, bulk_product_type: 'DOCUMENT', bulk_estimated_quantity: 1, bulk_draft_items: [createMail()], cod_amount: 0, service_type: 'STANDARD', payment_method: 'SENDER_DEBT', note: '' });
const rules = {
  customer_id: [{ required: true, message: 'Chọn khách hàng', trigger: 'change' }],
  source: [{ required: true, message: 'Chọn nguồn tiếp nhận', trigger: 'change' }],
  target_hub_id: [{ required: true, message: 'Chọn văn phòng tiếp nhận', trigger: 'change' }],
  'sender.name': [{ required: true, message: 'Nhập người gửi', trigger: 'blur' }],
  'sender.phone': [{ required: true, message: 'Nhập số điện thoại', trigger: 'blur' }],
  'sender.address': [{ required: true, message: 'Nhập địa chỉ lấy hàng', trigger: 'blur' }],
  'sender.province_id': [{ required: true, message: 'Chọn tỉnh lấy hàng', trigger: 'change' }],
  'item.product_name': [{ required: true, message: 'Nhập tên hàng hóa', trigger: 'blur' }],
};

const fetchJson = async (url) => (await fetch(url)).json();
const nameOf = (items, id) => items.find(item => item.code === id)?.name || '';
const loadSenderDistricts = async () => { form.sender.district_id = null; form.sender.ward_id = null; senderWards.value = []; senderDistricts.value = form.sender.province_id ? (await fetchJson(`${ADDR_API}/p/${form.sender.province_id}?depth=2`)).districts || [] : []; };
const loadSenderWards = async () => { form.sender.ward_id = null; senderWards.value = form.sender.district_id ? (await fetchJson(`${ADDR_API}/d/${form.sender.district_id}?depth=2`)).wards || [] : []; };
const loadReceiverDistricts = async () => { form.receiver.district_id = null; form.receiver.ward_id = null; receiverWards.value = []; receiverDistricts.value = form.receiver.province_id ? (await fetchJson(`${ADDR_API}/p/${form.receiver.province_id}?depth=2`)).districts || [] : []; };
const loadReceiverWards = async () => { form.receiver.ward_id = null; receiverWards.value = form.receiver.district_id ? (await fetchJson(`${ADDR_API}/d/${form.receiver.district_id}?depth=2`)).wards || [] : []; };

const fillCustomer = async (id) => {
  const customer = customers.value.find(item => item.customer_id === id);
  if (!customer) return;
  form.sender.name = customer.representative_name || customer.transaction_name || customer.company_name || customer.name;
  form.sender.phone = customer.phone_number || customer.phone || '';
  form.sender.address = customer.address_detail || customer.address || '';
  form.sender.province_id = customer.province_id || null;
  await loadSenderDistricts();
  form.sender.district_id = customer.district_id || null;
  await loadSenderWards();
  form.sender.ward_id = customer.ward_id || null;
};

const syncBulkRows = (quantity) => { const target = Number(quantity || 1); while (form.bulk_draft_items.length < target) form.bulk_draft_items.push(createMail()); if (form.bulk_draft_items.length > target) form.bulk_draft_items.splice(target); };
const addMail = () => { form.bulk_draft_items.push(createMail()); form.bulk_estimated_quantity = form.bulk_draft_items.length; };
const removeMail = (index) => { form.bulk_draft_items.splice(index, 1); form.bulk_estimated_quantity = Math.max(1, form.bulk_draft_items.length); };

watch(() => form.target_hub_id, async (hubId) => {
  form.assigned_shipper_id = null;
  shippers.value = [];
  if (!hubId) return;
  try { const response = await api.get('/api/users/shippers', { params: { hub_id: hubId } }); shippers.value = response.data || []; }
  catch { ElMessage.warning('Không tải được danh sách nhân viên lấy hàng'); }
});

const addressPayload = (address, districts, wards) => ({ ...address, province_name: nameOf(provinces.value, address.province_id), district_name: nameOf(districts, address.district_id), ward_name: nameOf(wards, address.ward_id) });
const submit = async () => {
  const valid = await formRef.value.validate().catch(() => false);
  if (!valid) return;
  submitting.value = true;
  try {
    const common = {
      customer_id: form.customer_id, source: form.source, target_hub_id: form.target_hub_id, order_type: 'DOMESTIC',
      assigned_shipper_id: form.assigned_shipper_id,
      sender: addressPayload(form.sender, senderDistricts.value, senderWards.value),
      payment_method: form.payment_method, note: form.note,
    };
    const payload = form.pickup_mode === 'BULK_MAIL' ? {
      ...common,
      product_type: form.bulk_product_type,
      service_type: form.service_type,
      estimated_quantity: form.bulk_estimated_quantity,
      draft_items: form.bulk_draft_items.map((mail, index) => ({ sequence_no: index + 1, customer_reference_code: mail.customer_reference_code || null, receiver_name: mail.receiver_name || null, receiver_phone: mail.receiver_phone || null, receiver_address: mail.receiver_address || null, note: mail.note || null })),
    } : {
      ...common,
      receiver: addressPayload(form.receiver, receiverDistricts.value, receiverWards.value),
      items: [{ product_group: 'PARCEL', product_name: form.item.product_name, weight: form.item.weight, quantity: form.item.quantity, declared_value: 0 }],
      documents: [], cod_amount: form.cod_amount, service_type: form.service_type, extra_services: [],
      pickup_method: 'OUR_STAFF_PICKUP', delivery_method: 'OUR_STAFF_DELIVERY', save_as_draft: false,
    };
    const endpoint = form.pickup_mode === 'BULK_MAIL' ? '/api/waybills/admin/bulk-mail-pickups' : '/api/waybills/admin/pickups';
    const response = await api.post(endpoint, payload);
    ElMessage.success(`Đã tạo yêu cầu ${response.data.request_code}`);
    form.receiver = emptyAddress(); form.item.product_name = ''; form.cod_amount = 0; form.note = '';
    receiverDistricts.value = []; receiverWards.value = [];
    formRef.value.clearValidate();
  } catch (error) { ElMessage.error(error.response?.data?.detail || 'Không thể tạo yêu cầu pickup'); }
  finally { submitting.value = false; }
};

onMounted(async () => {
  loading.value = true;
  try {
    const [customerRes, hubRes, provinceRes, meRes, productRes] = await Promise.all([api.get('/api/customers'), api.get('/api/hubs'), fetchJson(`${ADDR_API}/`), api.get('/api/auth/me'), api.get('/api/waybills/product-types')]);
    customers.value = customerRes.data?.items || customerRes.data || [];
    const activeHubs = (hubRes.data || []).filter(item => item.status !== false);
    const currentUser = meRes.data || {};
    hubs.value = currentUser.role_id === 1
      ? activeHubs
      : activeHubs.filter(item => item.hub_id === currentUser.primary_hub_id);
    if (hubs.value.length === 1) form.target_hub_id = hubs.value[0].hub_id;
    if (currentUser.role_id === 7) form.source = 'CSKH';
    provinces.value = provinceRes || [];
    productTypes.value = productRes.data?.items || productRes.data || [];
  } catch { ElMessage.error('Không tải được dữ liệu tạo yêu cầu'); }
  finally { loading.value = false; }
});
</script>

<style scoped>
.create-pickup-page{max-width:1200px;margin:0 auto}.page-heading{margin-bottom:20px}.page-heading h2{margin:0 0 6px;color:#102a43}.page-heading p{margin:0;color:#64748b}.form-card{margin-bottom:18px;border-radius:12px}.w-full{width:100%}.customer-option{display:flex;gap:10px}.customer-option span{color:#64748b}.form-actions{display:flex;justify-content:flex-end;gap:10px;padding:4px 0 24px}.urgent-select :deep(.el-select__wrapper){background:#fff1f2;box-shadow:0 0 0 2px #ef4444 inset}.mail-row{padding:12px;margin-bottom:12px;border:1px solid #e2e8f0;border-radius:10px}.mail-row-title{display:flex;justify-content:space-between;margin-bottom:10px}
</style>
