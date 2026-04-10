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
              <div class="cod-label">CẦN THU KHÁCH (COD)</div>
              <div class="cod-amount">{{ formatCurrency(waybill.cod_amount || waybill.total_amount_to_collect || 0) }}</div>
            </div>
          </el-card>
        </el-col>

        <el-col :xs="24" :sm="24" :md="12">
          <el-card shadow="hover" class="action-card">
            
            <div class="pod-upload-section mb-5">
              <label class="section-label">Ảnh bằng chứng (POD) <span class="text-danger">*</span></label>
              
              <div class="upload-area" :class="{ 'has-image': preview }">
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  class="file-input"
                  @change="handleFile"
                />
                <div v-if="!preview" class="upload-placeholder">
                  <el-icon class="camera-icon"><CameraFilled /></el-icon>
                  <p class="upload-text">Chạm để chụp ảnh / Tải lên</p>
                  <p class="upload-hint">Bắt buộc phải có ảnh bằng chứng giao hàng</p>
                </div>
                <img v-else :src="preview" class="preview-img" />
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
                :disabled="!imageFile"
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

const router = useRouter();
const route = useRoute();
const loading = ref(false);
const loadingInfo = ref(false);
const note = ref('');
const preview = ref(null);
const imageFile = ref(null);
const waybill = ref(null);

const formatCurrency = (val) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val || 0);

const handleFile = (e) => {
  const file = e.target.files[0];
  if (file) {
    imageFile.value = file;
    const reader = new FileReader();
    reader.onload = (f) => preview.value = f.target.result;
    reader.readAsDataURL(file);
  }
};

const submitPOD = async () => {
  if (!imageFile.value) return ElMessage.warning('Vui lòng chụp ảnh bằng chứng giao hàng!');
  loading.value = true;
  try {
    const formData = new FormData();
    formData.append('file', imageFile.value);
    let podUrl = '';
    try {
      const uploadRes = await api.post('/api/upload/pod', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      podUrl = uploadRes.data.url || uploadRes.data.file_url || '';
    } catch {
      podUrl = 'uploaded_locally'; 
    }

    await api.post('/api/delivery/confirm-success', {
      waybill_code: route.params.id,
      actual_cod_collected: waybill.value?.cod_amount || waybill.value?.total_amount_to_collect || 0, 
      pod_image_url: podUrl,
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
  // Tạo danh sách radio để chọn lý do thay vì gõ tay
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
      // Lấy giá trị radio đã chọn bằng DOM (Hơi trick một chút cho ElMessageBox html)
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

<style scoped>
/* Tổng quan */
.pod-page-wrapper {
  background-color: #f4f6f8;
  min-height: calc(100vh - 64px);
  padding: 24px;
}
.pod-container {
  max-width: 900px;
  margin: 0 auto;
}

/* Các lớp tiện ích */
.m-0 { margin: 0; }
.mt-1 { margin-top: 4px; }
.mt-2 { margin-top: 8px; }
.mt-4 { margin-top: 16px; }
.mt-5 { margin-top: 20px; }
.mb-3 { margin-bottom: 12px; }
.mb-4 { margin-bottom: 16px; }
.mb-5 { margin-bottom: 20px; }
.mb-6 { margin-bottom: 24px; }
.my-4 { margin: 16px 0; }
.mr-2 { margin-right: 8px; }
.w-full { width: 100%; }
.font-bold { font-weight: 700; }
.font-black { font-weight: 900; }
.text-primary { color: #409EFF; }
.text-danger { color: #F56C6C; }
.text-muted { color: #6b7280; }
.tracking-wide { letter-spacing: 0.5px; }
.flex { display: flex; }
.items-center { align-items: center; }
.items-start { align-items: flex-start; }
.gap-1 { gap: 4px; }

/* Header */
.page-header {
  display: flex;
  align-items: center;
  gap: 16px;
}
.back-btn { font-size: 18px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
.misa-title { font-size: 22px; color: #1f2937; letter-spacing: -0.5px; }

/* Thẻ thông tin (Cột Trái) */
.info-card { border-radius: 12px; border: none; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
.card-title { font-weight: 800; font-size: 15px; color: #374151; display: flex; align-items: center; gap: 8px; }
.info-block label { font-size: 12px; font-weight: 800; color: #9ca3af; text-transform: uppercase; margin-bottom: 4px; display: block; }
.info-value { font-size: 16px; }
.info-sub-value { font-size: 14px; }

/* Tiền Thu Hộ */
.cod-box {
  background: #fff5f5; border: 2px dashed #fca5a5;
  border-radius: 12px; padding: 16px; text-align: center;
}
.cod-label { font-size: 12px; font-weight: 900; color: #c81e1e; margin-bottom: 4px; }
.cod-amount { font-size: 32px; font-weight: 900; color: #e53935; line-height: 1; }

/* Khu vực thao tác (Cột Phải) */
.action-card { border-radius: 12px; border: none; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
.section-label { font-size: 14px; font-weight: 700; color: #374151; margin-bottom: 8px; display: block; }

/* Vùng Upload Ảnh */
.upload-area {
  position: relative;
  background-color: #f9fafb;
  border: 2px dashed #d1d5db;
  border-radius: 12px;
  height: 220px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  overflow: hidden;
}
.upload-area:hover { border-color: #9ca3af; background-color: #f3f4f6; }
.upload-area:active { transform: scale(0.98); }
.upload-area.has-image { border-style: solid; border-color: #e5e7eb; }
.file-input { position: absolute; inset: 0; width: 100%; height: 100%; opacity: 0; cursor: pointer; z-index: 10; }
.upload-placeholder { text-align: center; color: #9ca3af; pointer-events: none; }
.camera-icon { font-size: 48px; margin-bottom: 8px; color: #d1d5db; }
.upload-text { font-size: 15px; font-weight: 700; color: #6b7280; margin: 0 0 4px 0; }
.upload-hint { font-size: 12px; margin: 0; }
.preview-img { width: 100%; height: 100%; object-fit: cover; }

/* Nút bấm */
.btn-success { height: 54px; font-size: 16px; font-weight: 800; border-radius: 10px; letter-spacing: 0.5px; }
.btn-fail { height: 48px; font-size: 15px; font-weight: 700; border-radius: 10px; }

/* Responsive Mobile Mode */
@media (max-width: 768px) {
  .pod-page-wrapper { padding: 12px; background: white; }
  .responsive-row { display: flex; flex-direction: column; }
  .info-card, .action-card { box-shadow: none; border: 1px solid #ebeef5; margin-bottom: 16px; }
}
</style>