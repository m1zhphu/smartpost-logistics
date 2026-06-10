<template>
  <div class="ws-notification-container">
    <transition-group name="slide-fade" tag="div">
      <div 
        v-for="notification in notifications" 
        :key="notification.id" 
        class="notification-card"
        :class="`type-${notification.type}`"
      >
        <div class="notification-icon">
          <el-icon v-if="notification.type === 'success'"><CircleCheck /></el-icon>
          <el-icon v-else-if="notification.type === 'danger'"><CircleClose /></el-icon>
          <el-icon v-else-if="notification.type === 'warning'"><Warning /></el-icon>
          <el-icon v-else><InfoFilled /></el-icon>
        </div>
        
        <div class="notification-content">
          <div class="notification-title">{{ notification.title }}</div>
          <div class="notification-body">{{ notification.body }}</div>
          <div class="notification-time">{{ notification.time }}</div>
        </div>
        
        <button class="notification-close-btn" @click="removeNotification(notification.id)">
          <el-icon><Close /></el-icon>
        </button>
      </div>
    </transition-group>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { 
  CircleCheck, 
  CircleClose, 
  Warning, 
  InfoFilled, 
  Close 
} from '@element-plus/icons-vue';

const authStore = useAuthStore();
const notifications = ref([]);
let ws = null;
let reconnectTimeout = null;
let reconnectAttempts = 0;
const maxReconnectDelay = 30000;

// Web Audio API sound synthesis for "Tingg Tingg"
const playTingTing = () => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    const playNote = (time, freq, duration) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, time);
      
      // Starting gain at 0.25 to make it audible but pleasant
      gain.gain.setValueAtTime(0.25, time);
      // Bell-like exponential decay
      gain.gain.exponentialRampToValueAtTime(0.001, time + duration);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(time);
      osc.stop(time + duration);
    };

    // First "ting": B5 (987.77 Hz) for 0.4s
    playNote(ctx.currentTime, 987.77, 0.4);
    // Second "ting": E6 (1318.51 Hz) starting after 120ms for 0.5s
    playNote(ctx.currentTime + 0.12, 1318.51, 0.5);
  } catch (error) {
    console.error('Không thể phát âm thanh thông báo:', error);
  }
};

const mapEventToMessage = (event, payload) => {
  switch (event) {
    case 'pickup.created':
    case 'pickup.created_by_admin':
      return {
        title: 'Yêu cầu lấy hàng mới',
        body: `Đơn hàng ${payload.waybill_code || ''} (Mã YC: ${payload.request_code || ''}) đã được tạo thành công.`,
        type: 'success'
      };
    case 'pickup.price_finalized':
      return {
        title: 'Cập nhật giá cước',
        body: `Đơn hàng ${payload.waybill_code || ''} đã được duyệt cước phí cuối cùng.`,
        type: 'info'
      };
    case 'pickup.dispatched_to_hub':
      return {
        title: 'Điều phối về bưu cục',
        body: `Đơn hàng ${payload.waybill_code || ''} đang được chuyển về bưu cục.`,
        type: 'info'
      };
    case 'pickup.hub_accepted':
      return {
        title: 'Bưu cục tiếp nhận',
        body: `Đơn hàng ${payload.waybill_code || ''} đã được tiếp nhận bởi bưu cục.`,
        type: 'success'
      };
    case 'pickup.hub_rejected':
      return {
        title: 'Bưu cục từ chối',
        body: `Đơn hàng ${payload.waybill_code || ''} bị từ chối tiếp nhận bởi bưu cục.`,
        type: 'danger'
      };
    case 'shipper.availability_changed':
      return {
        title: 'Trạng thái bưu tá thay đổi',
        body: `Bưu tá ${payload.full_name || ''} đã thay đổi trạng thái hoạt động thành ${payload.is_available ? 'Sẵn sàng' : 'Bận'}.`,
        type: 'warning'
      };
    case 'pickup.assigned_shipper':
      return {
        title: 'Đã phân công bưu tá',
        body: `Đơn hàng ${payload.waybill_code || ''} đã được bàn giao cho bưu tá ${payload.shipper_name || ''} đi lấy hàng.`,
        type: 'info'
      };
    case 'pickup.picked':
      return {
        title: 'Đã lấy hàng thành công',
        body: `Bưu tá đã lấy thành công kiện hàng ${payload.waybill_code || ''}.`,
        type: 'success'
      };
    default:
      return {
        title: 'Thông báo hệ thống',
        body: typeof payload === 'object' ? JSON.stringify(payload) : String(payload),
        type: 'info'
      };
  }
};

const addNotification = (event, payload) => {
  const id = Date.now() + Math.random().toString(36).substr(2, 9);
  const info = mapEventToMessage(event, payload);
  const now = new Date();
  const timeString = now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  
  const newNotif = {
    id,
    title: info.title,
    body: info.body,
    type: info.type,
    time: timeString
  };
  
  // Add to active notifications
  notifications.value.unshift(newNotif);
  
  // Play sound
  playTingTing();
  
  // Auto dismiss after 10 seconds
  setTimeout(() => {
    removeNotification(id);
  }, 10000);
};

const removeNotification = (id) => {
  notifications.value = notifications.value.filter(n => n.id !== id);
};

const connectWebSocket = () => {
  if (ws) {
    ws.close();
  }
  
  if (!authStore.token) {
    return;
  }
  
  let wsUrl = '';
  if (import.meta.env.VITE_API_URL) {
    // Replace http:// or https:// with ws:// or wss://
    wsUrl = import.meta.env.VITE_API_URL.replace(/^http/, 'ws') + '/ws/realtime';
  } else {
    // If VITE_API_URL is empty, check environment hostname
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      wsUrl = 'ws://127.0.0.1:8000/ws/realtime';
    } else {
      wsUrl = (window.location.protocol === 'https:' ? 'wss://' : 'ws://') + window.location.host + '/ws/realtime';
    }
  }
  
  // Attach token for authentication
  wsUrl += `?token=${encodeURIComponent(authStore.token)}`;
  
  console.log('Connecting to real-time WebSocket:', wsUrl);
  ws = new WebSocket(wsUrl);
  
  ws.onopen = () => {
    console.log('WebSocket connected successfully.');
    reconnectAttempts = 0;
  };
  
  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      console.log('WebSocket message received:', data);
      
      if (data.event) {
        const isStaff = authStore.user && [1, 2, 3, 5, 7].includes(authStore.user.role_id);
        const isCustomer = authStore.user && authStore.user.customer_id;
        
        let shouldNotify = false;
        
        if (isStaff) {
          if (authStore.user.role_id === 5) {
            // Hub Manager/Staff: only show notifications for their hub
            const targetHubId = data.payload?.target_hub_id || data.payload?.hub_id;
            if (!targetHubId || targetHubId === authStore.user.primary_hub_id) {
              shouldNotify = true;
            }
          } else {
            // Admin/CSKH: show all notifications
            shouldNotify = true;
          }
        } else if (isCustomer) {
          // Customer: only show notifications for their own orders
          const belongsToCustomer = data.payload?.customer_id === authStore.user.customer_id;
          if (belongsToCustomer) {
            const customerEvents = [
              'pickup.price_finalized',
              'pickup.hub_accepted',
              'pickup.hub_rejected',
              'pickup.assigned_shipper',
              'pickup.picked'
            ];
            if (customerEvents.includes(data.event)) {
              shouldNotify = true;
            }
          }
        }
        
        if (shouldNotify) {
          addNotification(data.event, data.payload);
        }
        
        // Always dispatch custom window event for realtime updates across views
        window.dispatchEvent(new CustomEvent('realtime-pickup-event', {
          detail: { event: data.event, payload: data.payload }
        }));
      }
    } catch (err) {
      console.error('Error parsing WebSocket message:', err);
    }
  };
  
  ws.onclose = (e) => {
    console.log(`WebSocket closed (code: ${e.code}, reason: ${e.reason}). Attempting reconnect...`);
    if (authStore.token) {
      const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), maxReconnectDelay);
      reconnectAttempts++;
      reconnectTimeout = setTimeout(connectWebSocket, delay);
    }
  };
  
  ws.onerror = (err) => {
    console.error('WebSocket error:', err);
    ws.close();
  };
};

const disconnectWebSocket = () => {
  if (reconnectTimeout) {
    clearTimeout(reconnectTimeout);
    reconnectTimeout = null;
  }
  if (ws) {
    ws.close();
    ws = null;
  }
};

// Listen to auth state changes to connect/disconnect
watch(() => authStore.token, (newToken) => {
  if (newToken) {
    connectWebSocket();
  } else {
    disconnectWebSocket();
  }
});

onMounted(() => {
  if (authStore.token) {
    connectWebSocket();
  }
  
  // Hỗ trợ kiểm thử nhanh thông qua Console của Trình duyệt
  window.triggerTestNotification = (event = 'pickup.created', payload = {}) => {
    const defaultPayloads = {
      'pickup.created': { waybill_code: 'SP686868', request_code: 'REQ1001' },
      'pickup.price_finalized': { waybill_code: 'SP686868' },
      'pickup.hub_rejected': { waybill_code: 'SP686868' },
      'pickup.assigned_shipper': { waybill_code: 'SP686868', shipper_name: 'Nguyễn Văn A' },
      'pickup.picked': { waybill_code: 'SP686868' }
    };
    
    const finalPayload = Object.keys(payload).length > 0 
      ? payload 
      : (defaultPayloads[event] || { waybill_code: 'SP123456' });
      
    addNotification(event, finalPayload);
  };
});

onBeforeUnmount(() => {
  disconnectWebSocket();
  if (window.triggerTestNotification) {
    delete window.triggerTestNotification;
  }
});
</script>

<style scoped>
.ws-notification-container {
  position: fixed;
  top: 80px; /* Thấp hơn header một chút */
  right: 24px;
  width: 380px;
  max-width: calc(100vw - 48px);
  z-index: 99999;
  display: flex;
  flex-direction: column;
  gap: 12px;
  pointer-events: none; /* Không cản trở các click phía sau vùng trống */
}

.notification-card {
  pointer-events: auto; /* Cho phép tương tác với thẻ thông báo */
  position: relative;
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 16px 20px 16px 16px;
  border-radius: var(--radius-md, 16px);
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(226, 232, 240, 0.8);
  box-shadow: 
    0 10px 25px -5px rgba(0, 0, 0, 0.05), 
    0 8px 10px -6px rgba(0, 0, 0, 0.03),
    inset 0 1px 0 rgba(255, 255, 255, 0.5);
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.3s ease;
  overflow: hidden;
}

.notification-card:hover {
  transform: translateY(-3px) scale(1.01);
  box-shadow: 
    0 20px 30px -10px rgba(0, 0, 0, 0.1), 
    0 10px 15px -5px rgba(0, 0, 0, 0.05);
}

/* Thanh chỉ thị màu sắc bên trái */
.notification-card::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 5px;
}

.notification-card.type-success::before { background: linear-gradient(180deg, #10b981, #059669); }
.notification-card.type-danger::before { background: linear-gradient(180deg, #ef4444, #dc2626); }
.notification-card.type-warning::before { background: linear-gradient(180deg, #f59e0b, #d97706); }
.notification-card.type-info::before { background: linear-gradient(180deg, #0f3d26, #1b5e20); }

/* Icon tròn */
.notification-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 38px;
  height: 38px;
  border-radius: 12px;
  font-size: 20px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.03);
}

.notification-card.type-success .notification-icon { background: rgba(16, 185, 129, 0.12); color: #10b981; }
.notification-card.type-danger .notification-icon { background: rgba(239, 68, 68, 0.12); color: #ef4444; }
.notification-card.type-warning .notification-icon { background: rgba(245, 158, 11, 0.12); color: #f59e0b; }
.notification-card.type-info .notification-icon { background: rgba(15, 61, 38, 0.12); color: #0f3d26; }

/* Phần nội dung */
.notification-content {
  flex-grow: 1;
}

.notification-title {
  font-weight: 700;
  font-size: 14px;
  color: #1e293b;
  margin-bottom: 4px;
  line-height: 1.4;
}

.notification-body {
  font-size: 13px;
  color: #475569;
  line-height: 1.5;
  word-break: break-word;
}

.notification-time {
  font-size: 10px;
  color: #94a3b8;
  margin-top: 8px;
  display: block;
}

/* Nút tắt thông báo */
.notification-close-btn {
  position: absolute;
  top: 12px;
  right: 12px;
  border: none;
  background: transparent;
  color: #94a3b8;
  cursor: pointer;
  padding: 6px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s, color 0.2s, transform 0.2s;
}

.notification-close-btn:hover {
  background: rgba(0, 0, 0, 0.06);
  color: #1e293b;
  transform: rotate(90deg);
}

/* Hiệu ứng chuyển động (Vue Transitions) */
.slide-fade-enter-active {
  transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.slide-fade-leave-active {
  transition: all 0.3s cubic-bezier(0.25, 1, 0.5, 1);
  position: absolute;
  width: 100%;
}

.slide-fade-enter-from {
  opacity: 0;
  transform: translateX(80px) scale(0.9);
}
.slide-fade-leave-to {
  opacity: 0;
  transform: translateX(120px) scale(0.85);
}

.slide-fade-move {
  transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}
</style>
