<template>
  <div class="p-6 max-w-4xl mx-auto">
    <div class="mb-6 text-center">
      <h2 class="text-3xl font-bold text-gray-800">Công Cụ Báo Giá Nhanh</h2>
      <p class="text-gray-500 mt-2">Dành cho CSKH báo giá trực tiếp qua điện thoại</p>
    </div>

    <el-row :gutter="20">
      <el-col :span="12">
        <el-card shadow="hover" class="h-full">
          <template #header>
            <div class="font-bold text-lg text-primary flex items-center">
              <el-icon class="mr-2"><Location /></el-icon> Thông tin Vận chuyển
            </div>
          </template>
          <el-form label-position="top">
            <el-row :gutter="10">
              <el-col :span="12">
                <el-form-item label="Tỉnh/Thành phố gửi (ID)">
                  <el-input-number v-model="simForm.origin_province_id" class="w-full" :min="1" :controls="false" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="Tỉnh/Thành phố nhận (ID)">
                  <el-input-number v-model="simForm.dest_province_id" class="w-full" :min="1" :controls="false" />
                </el-form-item>
              </el-col>
            </el-row>

            <el-divider border-style="dashed" />

            <div class="font-bold mb-3 text-gray-700">Thông số Hàng hóa</div>
            <el-row :gutter="10">
              <el-col :span="12">
                <el-form-item label="Khối lượng (kg)">
                  <el-input-number v-model="simForm.weight" class="w-full" :min="0.1" :step="0.5" :controls="false" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="Thu hộ COD (VNĐ)">
                  <el-input-number v-model="simForm.cod_amount" class="w-full" :min="0" :step="10000" :controls="false" />
                </el-form-item>
              </el-col>
            </el-row>

            <div class="text-sm text-gray-500 mb-2">Kích thước (cm) - Để tính khối lượng quy đổi:</div>
            <el-row :gutter="10">
              <el-col :span="8">
                <el-form-item label="Dài">
                  <el-input-number v-model="simForm.length" class="w-full" :min="0" :controls="false" />
                </el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item label="Rộng">
                  <el-input-number v-model="simForm.width" class="w-full" :min="0" :controls="false" />
                </el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item label="Cao">
                  <el-input-number v-model="simForm.height" class="w-full" :min="0" :controls="false" />
                </el-form-item>
              </el-col>
            </el-row>

            <el-divider border-style="dashed" />

            <el-form-item label="Dịch vụ Giao hàng">
              <el-radio-group v-model="simForm.service_type" class="w-full flex">
                <el-radio-button value="STANDARD" class="flex-1 text-center">Tiêu chuẩn</el-radio-button>
                <el-radio-button value="EXPRESS" class="flex-1 text-center">Hỏa tốc</el-radio-button>
              </el-radio-group>
            </el-form-item>

            <el-button type="primary" size="large" class="w-full mt-4 text-lg font-bold" @click="simulatePrice" :loading="simLoading">
              TÍNH CƯỚC PHÍ
            </el-button>
          </el-form>
        </el-card>
      </el-col>

      <el-col :span="12">
        <el-card shadow="hover" class="h-full result-card" :class="{'has-result': simResult}">
          <template #header>
            <div class="font-bold text-lg text-success flex items-center">
              <el-icon class="mr-2"><Money /></el-icon> Kết Quả Báo Giá
            </div>
          </template>
          
          <div v-if="simResult" class="result-content">
            <div class="alert bg-blue-50 border border-blue-200 text-blue-800 rounded p-4 mb-6 flex">
              <el-icon class="mr-2 mt-1"><InfoFilled /></el-icon> <span>{{ simResult.note }}</span>
            </div>

            <div class="cost-row flex justify-between items-center py-3 border-b">
              <span class="text-gray-600">Khối lượng tính cước:</span>
              <span class="font-bold text-lg">{{ simResult.charge_weight }} kg</span>
            </div>
            
            <div class="cost-row flex justify-between items-center py-3 border-b">
              <span class="text-gray-600">Cước chính:</span>
              <span class="font-bold text-lg">{{ simResult.main_fee.toLocaleString() }} ₫</span>
            </div>

            <div class="cost-row flex justify-between items-center py-3 border-b">
              <span class="text-gray-600">Phí tiện ích (Khai giá/Thu hộ):</span>
              <span class="font-bold text-lg text-orange-500">+ {{ simResult.extra_fee.toLocaleString() }} ₫</span>
            </div>

            <div class="cost-row flex justify-between items-center py-3 border-b">
              <span class="text-gray-600">Thuế VAT (8%):</span>
              <span class="font-bold text-lg text-gray-500">+ {{ simResult.vat_8.toLocaleString() }} ₫</span>
            </div>

            <div class="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
              <div class="flex justify-between items-center">
                <span class="text-gray-700 font-bold text-xl">TỔNG CƯỚC PHÍ:</span>
                <span class="text-3xl font-extrabold text-red-600">{{ simResult.grand_total.toLocaleString() }} ₫</span>
              </div>
            </div>
            
            <el-button class="w-full mt-6" type="success" plain @click="resetForm">Tính tuyến khác</el-button>
          </div>
          
          <div v-else class="empty-state h-full flex flex-col items-center justify-center text-gray-400 py-12">
            <el-icon :size="60" class="mb-4 text-gray-200"><Calculator /></el-icon>
            <p>Nhập thông tin bên trái để xem báo giá</p>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { Location, Money, InfoFilled, Calculator } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import api from '@/api/axios';

const simLoading = ref(false);
const simResult = ref(null);

const simForm = reactive({
  origin_province_id: 1,
  dest_province_id: 2,
  weight: 1.0,
  length: 0,
  width: 0,
  height: 0,
  service_type: 'STANDARD',
  cod_amount: 0,
  extra_services: []
});

const simulatePrice = async () => {
  simLoading.value = true;
  simResult.value = null;
  try {
    const res = await api.post('/api/pricing/simulate', simForm);
    simResult.value = res.data;
  } catch (error) {
    ElMessage.error(error.response?.data?.detail || 'Chưa có bảng giá cho tuyến này');
  } finally {
    simLoading.value = false;
  }
};

const resetForm = () => {
  simResult.value = null;
};
</script>

<style scoped>
.text-primary { color: #4318FF; }
.text-success { color: #05CD99; }
.w-full { width: 100%; }
.result-card.has-result {
  border-color: #05CD99;
  box-shadow: 0 4px 20px rgba(5, 205, 153, 0.1);
}
</style>
