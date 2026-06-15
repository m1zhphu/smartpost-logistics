<template>
  <div class="audit-logs-page">
    <div class="page-header flex-between mb-4">
      <div class="title-section">
        <h2 class="misa-title">Nhật ký Hệ thống</h2>
        <p class="text-muted">Ghi lại toàn bộ thao tác can thiệp dữ liệu của Admin</p>
      </div>
      <div class="actions">
        <el-button :icon="Refresh" @click="fetchLogs" :loading="loading">Làm mới</el-button>
      </div>
    </div>

    <el-card class="mb-4 shadow-sm border-radius-8">
      <el-table :data="logs" v-loading="loading" stripe border style="width: 100%">
        <el-table-column prop="timestamp" label="Thời gian" width="180">
          <template #default="{ row }">
            {{ formatTime(row.timestamp) }}
          </template>
        </el-table-column>
        <el-table-column prop="admin_id" label="Mã Admin" width="100" />
        <el-table-column prop="target_table" label="Đối tượng" width="130">
          <template #default="{ row }">
            <el-tag size="small" type="info">{{ row.target_table }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="target_id" label="ID Đối tượng" width="120" />
        <el-table-column prop="column_name" label="Trường sửa" width="120" />
        <el-table-column label="Giá trị cũ → Mới" min-width="250">
          <template #default="{ row }">
            <div class="change-flow">
              <span class="old">{{ row.old_value }}</span>
              <el-icon><Right /></el-icon>
              <span class="new">{{ row.new_value }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="reason" label="Lý do thay đổi" min-width="200" show-overflow-tooltip />
      </el-table>
      
      <div v-if="logs.length === 0 && !loading" class="text-center py-10">
        <el-empty description="Hiện tại chưa có bản ghi nhật ký nào." />
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { Refresh, Right } from '@element-plus/icons-vue';
import api from '@/api/axios';
import moment from 'moment';
import { ElMessage } from 'element-plus';

const loading = ref(false);
const logs = ref([]);

const fetchLogs = async () => {
  loading.value = true;
  try {
    const res = await api.get('/api/admin/audit-logs');
    logs.value = res.data;
  } catch (err) {
    ElMessage.error('Không thể tải nhật ký hệ thống');
  } finally {
    loading.value = false;
  }
};

const formatTime = (t) => moment(t).format('DD/MM/YYYY HH:mm:ss');

onMounted(fetchLogs);
</script>

<style scoped src="@/styles/admin/dashboard/AuditLogs.css"></style>
