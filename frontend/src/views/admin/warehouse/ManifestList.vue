<template>
  <div class="modern-manifest-list-page animate-fade-in">
    <div class="page-container">
      <!-- Header Section -->
      <header class="page-header mb-24">
        <div class="header-left">
          <div class="header-icon">
            <el-icon><List /></el-icon>
          </div>
          <div>
            <h1 class="page-title">Tra cứu & Lịch sử Chuyến xe</h1>
            <p class="page-subtitle">Quản lý các chuyến xe trung chuyển đang tới và tra cứu thông tin hành trình túi hàng</p>
          </div>
        </div>
      </header>

      <el-row :gutter="24">
        <!-- CỘT TRÁI: DANH SÁCH XE ĐANG TỚI BƯU CỤC -->
        <el-col :xs="24" :lg="10" class="mb-24">
          <el-card class="content-card">
            <template #header>
              <div class="card-header flex-between">
                <span class="header-title flex-center gap-2">
                  <el-icon class="text-primary"><Van /></el-icon>
                  Chuyến xe liên quan bưu cục của bạn
                </span>
                <el-button type="primary" size="small" plain icon="Refresh" @click="fetchIncoming" :loading="loadingIncoming">
                  Làm mới
                </el-button>
              </div>
            </template>

            <el-table :data="incomingManifests" v-loading="loadingIncoming" class="modern-table" style="width: 100%" height="500px">
              <el-table-column label="Mã Chuyến Xe" min-width="140">
                <template #default="{ row }">
                  <span class="code-badge primary cursor-pointer" @click="viewManifestDetail(row.manifest_code)">
                    {{ row.manifest_code }}
                  </span>
                </template>
              </el-table-column>
              
              <el-table-column prop="vehicle_number" label="Biển Số Xe" width="110">
                <template #default="{ row }">
                  <span class="vehicle-tag"><el-icon><Van /></el-icon> {{ row.vehicle_number || 'N/A' }}</span>
                </template>
              </el-table-column>

              <el-table-column prop="from_hub_name" label="Nơi Gửi" min-width="110" show-overflow-tooltip />
              <el-table-column prop="to_hub_name" label="Nơi Nhận" min-width="110" show-overflow-tooltip />

              <el-table-column label="Thao Tác" width="120" align="center">
                <template #default="{ row }">
                  <el-button type="primary" size="small" plain @click="viewManifestDetail(row.manifest_code)">
                    Xem chi tiết
                  </el-button>
                </template>
              </el-table-column>
              
              <template #empty>
                <el-empty description="Không tìm thấy chuyến xe nào liên quan bưu cục của bạn" :image-size="80" />
              </template>
            </el-table>
          </el-card>
        </el-col>

        <!-- CỘT PHẢI: TRA CỨU NHANH & CHI TIẾT CHUYẾN XE -->
        <el-col :xs="24" :lg="14" class="mb-24">
          <el-card class="content-card">
            <template #header>
              <div class="card-header">
                <span class="header-title flex-center gap-2">
                  <el-icon class="text-warning"><Search /></el-icon>
                  Tra cứu chi tiết Chuyến xe
                </span>
              </div>
            </template>

            <!-- Khung tìm kiếm nhanh -->
            <div class="search-box mb-24">
              <RecentSearchInput
                v-model="searchCode"
                placeholder="Nhập mã chuyến xe (Manifest Code) cần tra cứu..."
                class="search-input"
                clearable
                storageKey="recentSearches_manifest"
                popoverWidth="400"
                @keyup.enter="searchInputRef?.saveSearch(searchCode); viewManifestDetail(searchCode)"
                @search="viewManifestDetail(searchCode)"
                ref="searchInputRef"
              >
                <template #prefix>
                  <el-icon><Search /></el-icon>
                </template>
                <template #append>
                  <el-button type="primary" @click="searchInputRef?.saveSearch(searchCode); viewManifestDetail(searchCode)" :loading="loadingDetail">
                    Tra Cứu
                  </el-button>
                </template>
              </RecentSearchInput>
            </div>

            <!-- Chi tiết Chuyến xe hiển thị động -->
            <div v-if="manifestDetail" class="detail-section">
              <div class="manifest-meta-box">
                <el-row :gutter="20">
                  <el-col :span="12">
                    <div class="meta-item">
                      <span class="label">MÃ CHUYẾN XE</span>
                      <span class="value text-primary">{{ manifestDetail.manifest_code }}</span>
                    </div>
                  </el-col>
                  <el-col :span="12">
                    <div class="meta-item">
                      <span class="label">BIỂN SỐ XE TẢI</span>
                      <span class="value">{{ manifestDetail.vehicle_number || 'Chưa rõ' }}</span>
                    </div>
                  </el-col>
                  <el-col :span="12" class="mt-3">
                    <div class="meta-item">
                      <span class="label">BƯU CỤC GỬI</span>
                      <span class="value">{{ manifestDetail.from_hub_name || 'Không rõ' }}</span>
                    </div>
                  </el-col>
                  <el-col :span="12" class="mt-3">
                    <div class="meta-item">
                      <span class="label">TỔNG SỐ TÚI HÀNG</span>
                      <span class="value text-success" style="font-size: 20px;">{{ manifestBags.length }} túi</span>
                    </div>
                  </el-col>
                </el-row>
                
                <div class="divider"></div>
                <div class="flex-end gap-2">
                  <el-button type="info" plain icon="Printer" @click="printManifest">In bản kê</el-button>
                </div>
              </div>

              <!-- Danh sách túi hàng trong Manifest -->
              <h3 class="section-title mb-4">Danh sách Túi hàng trong xe</h3>
              <el-table :data="manifestBags" v-loading="loadingDetail" class="modern-table" style="width: 100%" border>
                <el-table-column prop="bag_code" label="Mã Túi Hàng" width="150">
                  <template #default="{ row }">
                    <span class="code-badge default">{{ row.bag_code }}</span>
                  </template>
                </el-table-column>
                
                <el-table-column prop="dest_hub_name" label="Bưu Cục Đích của Túi" min-width="150" />
                
                <el-table-column prop="total_waybills" label="Tổng Số Đơn Hàng" width="130" align="center">
                  <template #default="{ row }">
                    <span class="fw-bold">{{ row.total_waybills || 0 }} đơn</span>
                  </template>
                </el-table-column>

                <el-table-column prop="status" label="Trạng Thái Túi" width="130" align="center">
                  <template #default="{ row }">
                    <el-tag :type="getBagStatusType(row.status)" effect="light">
                      {{ getBagStatusLabel(row.status) }}
                    </el-tag>
                  </template>
                </el-table-column>
              </el-table>
            </div>
            
            <div v-else class="empty-detail">
              <el-empty description="Vui lòng chọn chuyến xe đang tới hoặc nhập mã chuyến xe để tra cứu thông tin chi tiết!" :image-size="120" />
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { List, Van, Search, Printer, Refresh } from '@element-plus/icons-vue';
import api from '@/api/axios';
import { ElMessage } from 'element-plus';
import RecentSearchInput from '@/components/RecentSearchInput.vue';

const loadingIncoming = ref(false);
const loadingDetail = ref(false);
const incomingManifests = ref([]);
const searchCode = ref('');
const manifestDetail = ref(null);
const searchInputRef = ref(null);
const manifestBags = ref([]);

const fetchIncoming = async () => {
  loadingIncoming.value = true;
  try {
    const res = await api.get('/api/scans/manifests/incoming');
    incomingManifests.value = res.data.items || [];
  } catch (err) {
    ElMessage.error('Không thể tải danh sách chuyến xe đang tới');
  } finally {
    loadingIncoming.value = false;
  }
};

const viewManifestDetail = async (code) => {
  if (!code || !code.trim()) {
    return ElMessage.warning('Vui lòng nhập mã chuyến xe');
  }
  
  loadingDetail.value = true;
  manifestDetail.value = null;
  manifestBags.value = [];
  
  try {
    const res = await api.get(`/api/scans/manifests/${code}/bags`);
    const bags = res.data.items || res.data;
    manifestBags.value = bags;
    
    // Tìm thông tin metadata từ chuyến xe đang tới hoặc tự dựng
    const matchedIncoming = incomingManifests.value.find(m => m.manifest_code === code);
    if (matchedIncoming) {
      manifestDetail.value = matchedIncoming;
    } else {
      manifestDetail.value = {
        manifest_code: code,
        vehicle_number: bags[0]?.vehicle_number || 'N/A',
        from_hub_name: bags[0]?.from_hub_name || 'Bưu cục gửi',
      };
    }
    
    searchCode.value = code;
  } catch (err) {
    ElMessage.error(err.response?.data?.detail || 'Không tìm thấy thông tin chi tiết của chuyến xe này');
  } finally {
    loadingDetail.value = false;
  }
};

const getBagStatusType = (status) => {
  const map = {
    'CREATED': 'info',
    'IN_TRANSIT': 'warning',
    'ARRIVED': 'success',
    'UNLOADED': 'success'
  };
  return map[status] || 'primary';
};

const getBagStatusLabel = (status) => {
  const map = {
    'CREATED': 'Mới tạo',
    'IN_TRANSIT': 'Đang luân chuyển',
    'ARRIVED': 'Đã đến',
    'UNLOADED': 'Đã dỡ hàng'
  };
  return map[status] || status;
};

const printManifest = () => {
  if (!manifestDetail.value) return;
  const printWindow = window.open('', '_blank');
  
  let rowsHtml = '';
  manifestBags.value.forEach((bag, idx) => {
    rowsHtml += `
      <tr>
        <td style="text-align: center; border: 1px solid #ddd; padding: 8px;">${idx + 1}</td>
        <td style="border: 1px solid #ddd; padding: 8px; font-weight: bold;">${bag.bag_code}</td>
        <td style="border: 1px solid #ddd; padding: 8px;">${bag.dest_hub_name || ''}</td>
        <td style="text-align: center; border: 1px solid #ddd; padding: 8px;">${bag.total_waybills || 0}</td>
        <td style="text-align: center; border: 1px solid #ddd; padding: 8px; font-weight: 600;">${getBagStatusLabel(bag.status)}</td>
      </tr>
    `;
  });

  printWindow.document.write(`
    <html>
      <head>
        <title>Manifest ${manifestDetail.value.manifest_code}</title>
        <style>
          body { font-family: 'Plus Jakarta Sans', Arial, sans-serif; padding: 20px; color: #333; }
          .header { text-align: center; margin-bottom: 30px; }
          .title { font-size: 24px; font-weight: bold; margin-bottom: 5px; }
          .meta-table { width: 100%; margin-bottom: 30px; border-collapse: collapse; }
          .meta-table td { padding: 8px; }
          .items-table { width: 100%; border-collapse: collapse; }
          .items-table th { background-color: #f4f7fe; border: 1px solid #ddd; padding: 10px; font-weight: bold; }
          .footer { margin-top: 40px; display: flex; justify-content: space-between; }
          .sig-box { text-align: center; width: 200px; height: 100px; }
        </style>
      </head>
      <body onload="window.print(); window.close();">
        <div class="header">
          <div class="title">BẢNG KÊ CHUYẾN XE</div>
          <div>Mã số: <strong>${manifestDetail.value.manifest_code}</strong></div>
        </div>
        
        <table class="meta-table">
          <tr>
            <td><strong>Biển số xe:</strong> ${manifestDetail.value.vehicle_number || 'N/A'}</td>
            <td><strong>Bưu cục gửi:</strong> ${manifestDetail.value.from_hub_name || 'Không rõ'}</td>
          </tr>
          <tr>
            <td><strong>Tổng số túi hàng:</strong> ${manifestBags.value.length} túi</td>
            <td><strong>Ngày in:</strong> ${new Date().toLocaleString('vi-VN')}</td>
          </tr>
        </table>
        
        <table class="items-table">
          <thead>
            <tr>
              <th style="width: 50px;">STT</th>
              <th>Mã túi hàng</th>
              <th>Bưu cục đích của túi</th>
              <th style="width: 120px;">Số đơn hàng</th>
              <th style="width: 120px;">Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>
        
        <div class="footer">
          <div class="sig-box">
            <p><strong>Người lập bảng kê</strong></p>
            <p style="margin-top: 50px; font-style: italic;">(Ký, ghi rõ họ tên)</p>
          </div>
          <div class="sig-box">
            <p><strong>Người nhận bàn giao</strong></p>
            <p style="margin-top: 50px; font-style: italic;">(Ký, ghi rõ họ tên)</p>
          </div>
        </div>
      </body>
    </html>
  `);
  printWindow.document.close();
};

onMounted(fetchIncoming);
</script>

<style scoped src="@/styles/admin/warehouse/ManifestList.css"></style>
