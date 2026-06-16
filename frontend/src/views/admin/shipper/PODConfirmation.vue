<template>
  <div class="pod-page-wrapper">
    <div class="pod-container">
      
      <div class="page-header mb-5">
        <el-button circle class="back-btn" @click="$router.back()">
          <el-icon><Back /></el-icon>
        </el-button>
        <h2 class="misa-title m-0">Xác nhận Giao hàng</h2>
      </div>

      <el-row :gutter="24" class="responsive-row">
        
        <el-col :xs="24" :sm="24" :md="12" class="mb-4">
          <el-card shadow="never" class="info-card" v-loading="loadingInfo">
            <template #header>
              <div class="card-title">
                <el-icon><Document /></el-icon> Thông tin Vận đơn
              </div>
            </template>
            
            <div class="info-block">
              <label>Mã Vận đơn</label>
              <div class="info-value text-primary font-black text-xl tracking-wide">
                {{ waybill?.waybill_code || route.params.id }}
              </div>
            </div>
            
            <el-divider border-style="dashed" class="my-4" />
            
            <div class="info-block" v-if="waybill">
              <label>Người nhận</label>
              <div class="info-value font-bold text-gray-800">{{ waybill.receiver_name }}</div>
              <div class="info-sub-value text-primary font-semibold mt-1">
                <el-icon><PhoneFilled /></el-icon> {{ waybill.receiver_phone }}
              </div>
              <div class="info-sub-value text-gray-600 mt-2 flex items-start gap-1">
                <el-icon class="mt-0.5"><Location /></el-icon> 
                <span>{{ waybill.receiver_address }}</span>
              </div>
            </div>

            <div class="cod-box mt-5" v-if="waybill">
              <div class="cod-label">CẦN THU KHÁCH</div>
              <div class="cod-amount">{{ formatCurrency(waybill.cod_amount || waybill.total_amount_to_collect || 0) }}</div>
            </div>
          </el-card>
        </el-col>

        <el-col :xs="24" :sm="24" :md="12">
          <el-card shadow="hover" class="action-card">
            
            <div class="pod-upload-section mb-5">
              <label class="section-label">
                Ảnh xác nhận giao hàng <span class="text-danger">*</span>
                <span class="text-xs text-gray-400 ml-1">(Tối đa 5 ảnh)</span>
              </label>

              <div v-if="podImageUrls.length > 0" class="pod-thumb-gallery mb-3">
                <div
                  v-for="(url, idx) in podImageUrls"
                  :key="'pod-thumb-' + idx"
                  class="pod-thumb-item"
                >
                  <img :src="url" class="pod-thumb-img" />
                  <button class="pod-thumb-remove" @click.prevent="removePodImage(idx)">✕</button>
                  <span v-if="idx === 0" class="pod-thumb-label">Chính</span>
                </div>
              </div>

              <div v-if="podImageUrls.length < 5" class="upload-area" :class="{ 'compact': podImageUrls.length > 0 }">
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  multiple
                  class="file-input"
                  @change="handleFile"
                />
                <div class="upload-placeholder">
                  <el-icon class="camera-icon"><CameraFilled /></el-icon>
                  <p class="upload-text">
                    {{ podImageUrls.length === 0 ? 'Chạm để chụp ảnh / Tải lên' : `Thêm ảnh (còn ${5 - podImageUrls.length} slot)` }}
                  </p>
                  <p class="upload-hint" v-if="podImageUrls.length === 0">Bắt buộc phải có ảnh bằng chứng giao hàng</p>
                </div>
              </div>
            </div>

            <div class="note-section mb-6">
              <label class="section-label">Ghi chú giao hàng (Nếu có)</label>
              <el-input
                v-model="note"
                type="textarea"
                placeholder="Khách đã nhận, hàng nguyên vẹn..."
                :rows="3"
                resize="none"
              />
            </div>

            <div class="action-buttons">
              <el-button
                type="success"
                class="btn-success w-full mb-3"
                :loading="loading"
                @click="submitPOD"
                :disabled="podImageUrls.length === 0"
              >
                <el-icon class="mr-2"><CircleCheckFilled /></el-icon> GIAO THÀNH CÔNG
              </el-button>
              
              <el-button
                type="danger" 
                plain
                class="btn-fail w-full"
                @click="reportFailure"
              >
                <el-icon class="mr-2"><WarningFilled /></el-icon> Báo cáo Giao Thất bại
              </el-button>
            </div>
            
          </el-card>
        </el-col>
        
      </el-row>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { CameraFilled, Back, CircleCheckFilled, WarningFilled, Document, PhoneFilled, Location } from '@element-plus/icons-vue';
import api from '@/api/axios';
import { ElMessage, ElMessageBox } from 'element-plus';
import { useAuthStore } from '@/stores/auth';

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();
const loading = ref(false);
const loadingInfo = ref(false);
const note = ref('');
const waybill = ref(null);
const podImageUrls = ref([]);

const formatCurrency = (val) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val || 0);

const handleFile = async (e) => {
  const files = Array.from(e.target.files || []);
  if (!files.length) return;

  const remaining = 5 - podImageUrls.value.length;
  const toProcess = files.slice(0, remaining);

  if (files.length > remaining) {
    ElMessage.warning(`Chỉ được tải tối đa 5 ảnh. Đã bỏ bớt ${files.length - remaining} ảnh.`);
  }

  const validFiles = toProcess.filter(f => {
    if (!f.type.startsWith('image/')) {
      ElMessage.error(`${f.name}: Chỉ chấp nhận file ảnh!`);
      return false;
    }
    if (f.size / 1024 / 1024 > 5) {
      ElMessage.error(`${f.name}: Ảnh phải nhỏ hơn 5MB!`);
      return false;
    }
    return true;
  });

  if (!validFiles.length) return;

  loading.value = true;
  try {
    const formData = new FormData();
    validFiles.forEach(f => formData.append('files', f));

    const uploadRes = await api.post('/api/upload/pod/batch', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        ...(authStore.token ? { Authorization: `Bearer ${authStore.token}` } : {})
      }
    });

    const urls = uploadRes.data?.image_urls || [];
    if (uploadRes.data?.image_url && urls.length === 0) {
      urls.push(uploadRes.data.image_url);
    }

    urls.forEach(url => {
      if (podImageUrls.value.length < 5) {
        podImageUrls.value.push(url);
      }
    });

    if (urls.length > 0) {
      ElMessage.success(`Đã tải lên ${urls.length} ảnh thành công!`);
    }
  } catch (err) {
    ElMessage.error(err.response?.data?.detail || 'Lỗi khi tải ảnh lên. Vui lòng thử lại.');
  } finally {
    loading.value = false;
    e.target.value = '';
  }
};

const removePodImage = (idx) => {
  podImageUrls.value.splice(idx, 1);
};

const submitPOD = async () => {
  if (podImageUrls.value.length === 0) {
    return ElMessage.warning('Vui lòng chụp ảnh bằng chứng giao hàng!');
  }
  loading.value = true;
  try {
    await api.post('/api/delivery/confirm-success', {
      waybill_code: route.params.id,
      actual_cod_collected: waybill.value?.cod_amount || waybill.value?.total_amount_to_collect || 0,
      pod_image_url: podImageUrls.value[0],
      pod_image_urls: podImageUrls.value,
      note: note.value
    });

    ElMessage.success('✅ Đã xác nhận giao hàng thành công!');
    router.push('/admin/delivery/my-tasks');
  } catch (err) {
    ElMessage.error(err.response?.data?.detail || 'Lỗi khi cập nhật trạng thái.');
  } finally {
    loading.value = false;
  }
};

const FAILURE_REASONS = [
  { label: 'Khách không nghe máy', value: 'CUS_NOT_AVAILABLE' },
  { label: 'Sai địa chỉ / Không tìm thấy', value: 'WRONG_ADDRESS' },
  { label: 'Khách từ chối nhận', value: 'CUS_REJECTED' },
  { label: 'Khách hẹn giao lại ngày khác', value: 'RESCHEDULED' },
  { label: 'Lý do khác', value: 'OTHER' }
];

const reportFailure = async () => {
  let htmlString = '<div style="text-align: left; margin-bottom: 15px;">Vui lòng chọn lý do giao thất bại:</div>';
  htmlString += '<div class="reason-radio-group" style="display: flex; flex-direction: column; gap: 10px; text-align: left;">';
  
  FAILURE_REASONS.forEach((r, idx) => {
    htmlString += `
      <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; padding: 8px; border: 1px solid #dcdfe6; border-radius: 6px;">
        <input type="radio" name="fail_reason" value="${r.value}" ${idx === 0 ? 'checked' : ''} style="accent-color: #f56c6c;">
        <span style="font-weight: 500; font-size: 14px;">${r.label}</span>
      </label>
    `;
  });
  htmlString += '</div>';

  try {
    const { action } = await ElMessageBox({
      title: 'Báo cáo Giao thất bại',
      message: htmlString,
      dangerouslyUseHTMLString: true,
      showCancelButton: true,
      confirmButtonText: 'Xác nhận thất bại',
      cancelButtonText: 'Quay lại',
      confirmButtonClass: 'el-button--danger'
    });

    if (action === 'confirm') {
      const selectedRadio = document.querySelector('input[name="fail_reason"]:checked');
      const selectedReason = selectedRadio ? selectedRadio.value : 'OTHER';

      await api.post('/api/delivery/report-failure', {
        waybill_code: waybill.value?.waybill_code || route.params.id,
        reason_code: selectedReason, 
        note: note.value || 'Tài xế báo cáo thất bại trên app'
      });
      ElMessage.warning('Đã ghi nhận giao hàng thất bại.');
      router.push('/admin/delivery/my-tasks');
    }
  } catch (err) {
    if (err !== 'cancel') {
        ElMessage.error(err.response?.data?.detail || 'Lỗi khi báo cáo.');
    }
  }
};

onMounted(async () => {
  const id = route.params.id;
  if (!id) return;
  loadingInfo.value = true;
  try {
    const res = await api.get(`/api/waybills/${id}/tracking`);
    waybill.value = res.data?.waybill || res.data;
  } catch {
  } finally {
    loadingInfo.value = false;
  }
});
</script>

<style scoped src="@/styles/admin/shipper/PODConfirmation.css"></style>

<style scoped>
/* Batch upload gallery */
.pod-thumb-gallery {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.pod-thumb-item {
  position: relative;
  width: 80px;
  height: 80px;
  border-radius: 8px;
  overflow: hidden;
  border: 2px solid #e2e8f0;
  flex-shrink: 0;
}
.pod-thumb-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.pod-thumb-remove {
  position: absolute;
  top: 2px;
  right: 2px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: rgba(239, 68, 68, 0.85);
  color: #fff;
  border: none;
  cursor: pointer;
  font-size: 9px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  line-height: 1;
  transition: background 0.2s;
}
.pod-thumb-remove:hover { background: #dc2626; }
.pod-thumb-label {
  position: absolute;
  bottom: 2px;
  left: 2px;
  background: rgba(67,24,255,0.8);
  color: #fff;
  font-size: 9px;
  font-weight: 700;
  padding: 1px 4px;
  border-radius: 3px;
  line-height: 1.4;
}
.upload-area.compact {
  min-height: 64px;
  padding: 10px;
}
.upload-area.compact .camera-icon {
  font-size: 24px;
}
.upload-area.compact .upload-text {
  font-size: 12px;
  margin: 4px 0 0;
}
</style>