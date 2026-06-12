<template>
  <div class="notif-bell-wrapper" ref="wrapperRef">
    <!-- Nút chuông -->
    <button
      class="bell-btn"
      :class="{ ringing: isRinging, 'has-unread': hasUnread }"
      @click="togglePanel"
      title="Thông báo"
    >
      <svg class="bell-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M13.73 21a2 2 0 0 1-3.46 0" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>

      <!-- Badge số chưa đọc -->
      <transition name="badge-pop">
        <span v-if="unreadCount > 0" class="badge">
          {{ unreadCount > 99 ? '99+' : unreadCount }}
        </span>
      </transition>

      <!-- Vầng sáng khi có thông báo mới -->
      <span v-if="isRinging" class="bell-glow"></span>
    </button>

    <!-- Panel lịch sử thông báo -->
    <transition name="panel-drop">
      <div v-if="panelOpen" class="notif-panel">
        <!-- Header của panel -->
        <div class="panel-header">
          <div class="panel-title">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            Thông báo
            <span v-if="unreadCount > 0" class="panel-badge">{{ unreadCount }} mới</span>
          </div>
          <div class="panel-actions">
            <button v-if="unreadCount > 0" class="action-btn" @click="markAllRead" title="Đánh dấu tất cả đã đọc">
              <el-icon><Check /></el-icon>
            </button>
            <button v-if="history.length > 0" class="action-btn danger" @click="clearAll" title="Xoá tất cả">
              <el-icon><Delete /></el-icon>
            </button>
          </div>
        </div>

        <!-- Danh sách thông báo -->
        <div class="panel-body" ref="listRef">
          <div v-if="history.length === 0" class="panel-empty">
            <div class="empty-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" stroke="#cbd5e1" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M13.73 21a2 2 0 0 1-3.46 0" stroke="#cbd5e1" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
            <p>Chưa có thông báo nào</p>
          </div>

          <transition-group name="notif-item" tag="div" class="notif-list">
            <div
              v-for="notif in history"
              :key="notif.id"
              class="notif-item"
              :class="[`type-${notif.type}`, { unread: !notif.read }]"
              @click="markRead(notif.id)"
            >
              <!-- Chấm chưa đọc -->
              <span class="unread-dot" v-if="!notif.read"></span>

              <!-- Icon loại -->
              <div class="notif-item-icon">
                <el-icon v-if="notif.type === 'success'"><CircleCheck /></el-icon>
                <el-icon v-else-if="notif.type === 'danger'"><CircleClose /></el-icon>
                <el-icon v-else-if="notif.type === 'warning'"><Warning /></el-icon>
                <el-icon v-else><InfoFilled /></el-icon>
              </div>

              <!-- Nội dung -->
              <div class="notif-item-content">
                <div class="notif-item-title">{{ notif.title }}</div>
                <div class="notif-item-body">{{ notif.body }}</div>
                <div class="notif-item-time">{{ notif.dateString }} · {{ notif.timeString }}</div>
              </div>

              <!-- Nút xoá -->
              <button class="notif-item-remove" @click.stop="removeOne(notif.id)" title="Xoá">
                <el-icon><Close /></el-icon>
              </button>
            </div>
          </transition-group>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue';
import { useNotificationStore } from '@/stores/notifications';
import {
  CircleCheck, CircleClose, Warning, InfoFilled, Close, Check, Delete
} from '@element-plus/icons-vue';

const notifStore = useNotificationStore();
const { history, unreadCount, hasUnread } = notifStore;

const panelOpen = ref(false);
const isRinging = ref(false);
const wrapperRef = ref(null);
let ringTimer = null;

/* ── Mở/đóng panel ── */
const togglePanel = () => {
  panelOpen.value = !panelOpen.value;
  if (panelOpen.value && unreadCount > 0) {
    // Không tự đọc, để user chủ động markAllRead
  }
};

/* ── Khi có thông báo mới → rung chuông 3s ── */
watch(() => notifStore.history.length, (newLen, oldLen) => {
  if (newLen > oldLen) {
    if (ringTimer) clearTimeout(ringTimer);
    isRinging.value = true;
    ringTimer = setTimeout(() => {
      isRinging.value = false;
    }, 3000);
  }
});

/* ── Click ngoài panel → đóng ── */
const handleClickOutside = (e) => {
  if (wrapperRef.value && !wrapperRef.value.contains(e.target)) {
    panelOpen.value = false;
  }
};

onMounted(() => {
  document.addEventListener('mousedown', handleClickOutside);
});

onBeforeUnmount(() => {
  document.removeEventListener('mousedown', handleClickOutside);
  if (ringTimer) clearTimeout(ringTimer);
});

const markAllRead = () => notifStore.markAllRead();
const markRead   = (id) => notifStore.markRead(id);
const removeOne  = (id) => notifStore.removeOne(id);
const clearAll   = () => notifStore.clearAll();
</script>

<style scoped>
/* ── Wrapper ── */
.notif-bell-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

/* ── Nút chuông ── */
.bell-btn {
  position: relative;
  width: 42px;
  height: 42px;
  border-radius: 12px;
  border: 1px solid transparent;
  background: var(--sp-surface, #f8fafc);
  color: var(--sp-text-muted, #64748b);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.25s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  margin-right: 10px;
}

.bell-btn:hover {
  background: #fff;
  border-color: rgba(15, 61, 38, 0.15);
  color: #0f3d26;
  box-shadow: 0 4px 12px rgba(15, 61, 38, 0.1);
}

.bell-btn.has-unread {
  background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
  border-color: rgba(16, 185, 129, 0.3);
  color: #0f3d26;
}

.bell-icon {
  width: 20px;
  height: 20px;
  transition: transform 0.2s ease;
}

/* Hiệu ứng rung chuông */
@keyframes ring {
  0%   { transform: rotate(0deg); }
  10%  { transform: rotate(12deg); }
  20%  { transform: rotate(-10deg); }
  30%  { transform: rotate(10deg); }
  40%  { transform: rotate(-8deg); }
  50%  { transform: rotate(6deg); }
  60%  { transform: rotate(-4deg); }
  70%  { transform: rotate(2deg); }
  80%  { transform: rotate(-2deg); }
  90%  { transform: rotate(1deg); }
  100% { transform: rotate(0deg); }
}

.bell-btn.ringing .bell-icon {
  animation: ring 0.6s ease-in-out infinite;
  transform-origin: top center;
  color: #10b981;
}

/* Vầng sáng pulse */
.bell-glow {
  position: absolute;
  inset: -4px;
  border-radius: 16px;
  background: rgba(16, 185, 129, 0.2);
  animation: glow-pulse 1.2s ease-in-out infinite;
}

@keyframes glow-pulse {
  0%, 100% { opacity: 0.6; transform: scale(1); }
  50%       { opacity: 0;   transform: scale(1.4); }
}

/* Badge số chưa đọc */
.badge {
  position: absolute;
  top: -6px;
  right: -6px;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  background: linear-gradient(135deg, #ef4444, #dc2626);
  color: white;
  font-size: 10px;
  font-weight: 800;
  border-radius: 9px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 6px rgba(239, 68, 68, 0.5);
  border: 2px solid white;
  line-height: 1;
}

/* Badge pop animation */
.badge-pop-enter-active { animation: badge-bounce 0.4s cubic-bezier(0.34, 1.56, 0.64, 1); }
.badge-pop-leave-active { animation: badge-bounce 0.2s ease reverse; }
@keyframes badge-bounce {
  from { transform: scale(0); }
  to   { transform: scale(1); }
}

/* ── Panel dropdown ── */
.notif-panel {
  position: absolute;
  top: calc(100% + 12px);
  right: 0;
  width: 380px;
  max-height: 520px;
  background: white;
  border-radius: 20px;
  box-shadow:
    0 20px 60px -10px rgba(0, 0, 0, 0.15),
    0 8px 20px -4px rgba(0, 0, 0, 0.08),
    0 0 0 1px rgba(15, 61, 38, 0.08);
  z-index: 9999;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

/* Panel drop animation */
.panel-drop-enter-active {
  animation: panel-in 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  transform-origin: top right;
}
.panel-drop-leave-active {
  animation: panel-in 0.2s ease reverse;
  transform-origin: top right;
}
@keyframes panel-in {
  from { opacity: 0; transform: scale(0.92) translateY(-8px); }
  to   { opacity: 1; transform: scale(1)    translateY(0); }
}

/* Panel header */
.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 20px 14px;
  border-bottom: 1px solid #f1f5f9;
  background: linear-gradient(135deg, #f0fdf4 0%, #ffffff 60%);
  flex-shrink: 0;
}

.panel-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 800;
  color: #0f3d26;
}

.panel-badge {
  font-size: 11px;
  font-weight: 700;
  background: linear-gradient(135deg, #10b981, #059669);
  color: white;
  padding: 2px 8px;
  border-radius: 20px;
  margin-left: 4px;
}

.panel-actions {
  display: flex;
  gap: 6px;
}

.action-btn {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  background: white;
  color: #64748b;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  font-size: 14px;
}

.action-btn:hover {
  background: #f0fdf4;
  border-color: #10b981;
  color: #10b981;
}

.action-btn.danger:hover {
  background: #fff5f5;
  border-color: #ef4444;
  color: #ef4444;
}

/* Panel body */
.panel-body {
  overflow-y: auto;
  flex: 1;
  min-height: 0;
}

.panel-body::-webkit-scrollbar { width: 4px; }
.panel-body::-webkit-scrollbar-thumb {
  background: #e2e8f0;
  border-radius: 4px;
}

/* Empty state */
.panel-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 24px;
  gap: 12px;
  color: #94a3b8;
  font-size: 14px;
}

.panel-empty p { margin: 0; font-weight: 500; }

/* Notif list */
.notif-list {
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

/* Notif item */
.notif-item {
  position: relative;
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px 36px 12px 12px;
  border-radius: 12px;
  cursor: pointer;
  transition: background 0.2s ease;
  border: 1px solid transparent;
}

.notif-item:hover {
  background: #f8fafc;
  border-color: #e2e8f0;
}

.notif-item.unread {
  background: #f0fdf4;
  border-color: rgba(16, 185, 129, 0.15);
}

.notif-item.unread:hover {
  background: #dcfce7;
}

/* Chấm chưa đọc */
.unread-dot {
  position: absolute;
  top: 16px;
  left: 8px;
  width: 7px;
  height: 7px;
  background: #10b981;
  border-radius: 50%;
  box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.2);
  flex-shrink: 0;
}

/* Icon loại */
.notif-item-icon {
  flex-shrink: 0;
  width: 34px;
  height: 34px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  margin-left: 8px;
}

.notif-item.type-success .notif-item-icon { background: rgba(16, 185, 129, 0.12); color: #10b981; }
.notif-item.type-danger  .notif-item-icon { background: rgba(239, 68, 68, 0.12);  color: #ef4444; }
.notif-item.type-warning .notif-item-icon { background: rgba(245, 158, 11, 0.12); color: #f59e0b; }
.notif-item.type-info    .notif-item-icon { background: rgba(15, 61, 38, 0.10);   color: #0f3d26; }

/* Item content */
.notif-item-content { flex: 1; min-width: 0; }

.notif-item-title {
  font-size: 13px;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 3px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.notif-item.unread .notif-item-title { color: #0f3d26; }

.notif-item-body {
  font-size: 12px;
  color: #64748b;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.notif-item-time {
  font-size: 11px;
  color: #94a3b8;
  margin-top: 5px;
  font-weight: 500;
}

/* Nút xoá item */
.notif-item-remove {
  position: absolute;
  top: 10px;
  right: 8px;
  width: 24px;
  height: 24px;
  border-radius: 6px;
  border: none;
  background: transparent;
  color: #cbd5e1;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  opacity: 0;
  transition: all 0.2s ease;
}

.notif-item:hover .notif-item-remove {
  opacity: 1;
}

.notif-item-remove:hover {
  background: #fee2e2;
  color: #ef4444;
}

/* Transition items */
.notif-item-enter-active { transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); }
.notif-item-leave-active { transition: all 0.2s ease; position: absolute; width: 100%; }
.notif-item-enter-from   { opacity: 0; transform: translateX(-16px); }
.notif-item-leave-to     { opacity: 0; transform: translateX(16px); }
.notif-item-move         { transition: transform 0.3s ease; }

/* Responsive: mobile */
@media (max-width: 640px) {
  .notif-panel {
    width: calc(100vw - 32px);
    right: -12px;
  }
}
</style>
