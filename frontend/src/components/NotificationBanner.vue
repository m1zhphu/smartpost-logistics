<template>
  <!-- WebSocket handler: không render UI, thông báo hiển thị qua NotificationBell -->
  <div style="display:none;"></div>
</template>

<script setup>
import { onMounted, onBeforeUnmount, watch } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { useNotificationStore } from '@/stores/notifications';

const authStore = useAuthStore();
const notifStore = useNotificationStore();

let ws = null;
let reconnectTimeout = null;
let reconnectAttempts = 0;
const maxReconnectDelay = 30000;

/* ── Âm thanh thông báo ── */
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
      gain.gain.setValueAtTime(0.25, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(time);
      osc.stop(time + duration);
    };
    playNote(ctx.currentTime, 987.77, 0.4);
    playNote(ctx.currentTime + 0.12, 1318.51, 0.5);
  } catch (error) {
    console.error('Không thể phát âm thanh thông báo:', error);
  }
};

/* ── WebSocket ── */
const shouldNotify = (event, payload, user) => {
  const isStaff = user && [1, 2, 3, 5, 7].includes(user.role_id);
  const isCustomer = user && user.customer_id;

  if (isStaff) {
    if (event === 'pickup.hub_rejected') {
      return user.role_id === 1;
    } else if (user.role_id === 1 || user.role_id === 7) {
      return true;
    } else {
      const targetHubId = payload?.target_hub_id || payload?.hub_id;
      return !targetHubId || targetHubId === user.primary_hub_id;
    }
  } else if (isCustomer) {
    const belongsToCustomer = payload?.customer_id === user.customer_id;
    if (belongsToCustomer) {
      const customerEvents = [
        'pickup.price_finalized',
        'pickup.hub_accepted',
        'pickup.hub_rejected',
        'pickup.assigned_shipper',
        'pickup.picked'
      ];
      return customerEvents.includes(event);
    }
  }
  return false;
};

const connectWebSocket = () => {
  if (ws) {
    ws.onclose = null;
    ws.close();
  }
  if (!authStore.token) return;

  let wsUrl = '';
  if (import.meta.env.VITE_API_URL) {
    wsUrl = import.meta.env.VITE_API_URL.replace(/^http/, 'ws') + '/ws/realtime';
  } else {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      wsUrl = 'ws://127.0.0.1:8000/ws/realtime';
    } else {
      wsUrl = (window.location.protocol === 'https:' ? 'wss://' : 'ws://') + window.location.host + '/ws/realtime';
    }
  }
  wsUrl += `?token=${encodeURIComponent(authStore.token)}`;

  console.log('Connecting to real-time WebSocket:', wsUrl);
  ws = new WebSocket(wsUrl);

  ws.onopen = () => {
    console.log('WebSocket connected.');
    reconnectAttempts = 0;
  };

  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      if (data.event) {
        // Luôn phát custom event để các view cập nhật real-time
        window.dispatchEvent(new CustomEvent('realtime-pickup-event', {
          detail: { event: data.event, payload: data.payload }
        }));

        if (shouldNotify(data.event, data.payload, authStore.user)) {
          // Thêm vào store (lịch sử + badge trong chuông)
          notifStore.addNotification(data.event, data.payload);
          playTingTing();
        }
      }
    } catch (err) {
      console.error('WebSocket message parse error:', err);
    }
  };

  ws.onclose = (e) => {
    console.log(`WebSocket closed (code: ${e.code}). Reconnecting...`);
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
    ws.onclose = null;
    ws.close();
    ws = null;
  }
};

watch(() => authStore.token, (newToken) => {
  if (newToken) connectWebSocket();
  else disconnectWebSocket();
});

onMounted(() => {
  if (authStore.token) connectWebSocket();

  // Helper test từ console trình duyệt
  window.triggerTestNotification = (event = 'pickup.created', payload = {}) => {
    const defaults = {
      'pickup.created': { waybill_code: 'SP686868', request_code: 'REQ1001' },
      'pickup.price_finalized': { waybill_code: 'SP686868' },
      'pickup.hub_rejected': { waybill_code: 'SP686868' },
      'pickup.assigned_shipper': { waybill_code: 'SP686868', shipper_name: 'Nguyễn Văn A' },
      'pickup.picked': { waybill_code: 'SP686868' }
    };
    const finalPayload = Object.keys(payload).length > 0 ? payload : (defaults[event] || { waybill_code: 'SP123456' });
    notifStore.addNotification(event, finalPayload);
    const latest = notifStore.history[0];
    addToast(latest);
    playTingTing();
  };
});

onBeforeUnmount(() => {
  disconnectWebSocket();
  delete window.triggerTestNotification;
});
</script>

<style scoped>
.ws-notification-container {
  position: fixed;
  top: 80px;
  right: 24px;
  width: 380px;
  max-width: calc(100vw - 48px);
  z-index: 99999;
  display: flex;
  flex-direction: column;
  gap: 12px;
  pointer-events: none;
}

.notification-card {
  pointer-events: auto;
  position: relative;
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 16px 20px 16px 16px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(226, 232, 240, 0.8);
  box-shadow:
    0 10px 25px -5px rgba(0, 0, 0, 0.08),
    0 8px 10px -6px rgba(0, 0, 0, 0.04),
    inset 0 1px 0 rgba(255, 255, 255, 0.6);
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.3s ease;
  overflow: hidden;
}

.notification-card:hover {
  transform: translateY(-3px) scale(1.01);
  box-shadow:
    0 20px 30px -10px rgba(0, 0, 0, 0.12),
    0 10px 15px -5px rgba(0, 0, 0, 0.06);
}

.notification-card::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 5px;
}

.notification-card.type-success::before { background: linear-gradient(180deg, #10b981, #059669); }
.notification-card.type-danger::before  { background: linear-gradient(180deg, #ef4444, #dc2626); }
.notification-card.type-warning::before { background: linear-gradient(180deg, #f59e0b, #d97706); }
.notification-card.type-info::before    { background: linear-gradient(180deg, #0f3d26, #1b5e20); }

.notification-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 38px;
  height: 38px;
  border-radius: 12px;
  font-size: 20px;
}

.notification-card.type-success .notification-icon { background: rgba(16, 185, 129, 0.12); color: #10b981; }
.notification-card.type-danger  .notification-icon { background: rgba(239, 68, 68, 0.12);  color: #ef4444; }
.notification-card.type-warning .notification-icon { background: rgba(245, 158, 11, 0.12); color: #f59e0b; }
.notification-card.type-info    .notification-icon { background: rgba(15, 61, 38, 0.12);   color: #0f3d26; }

.notification-content { flex-grow: 1; }

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
  margin-top: 6px;
  display: block;
}

.notification-close-btn {
  position: absolute;
  top: 10px;
  right: 10px;
  border: none;
  background: transparent;
  color: #94a3b8;
  cursor: pointer;
  padding: 4px;
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

/* Vue Transitions */
.slide-fade-enter-active { transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1); }
.slide-fade-leave-active {
  transition: all 0.3s cubic-bezier(0.25, 1, 0.5, 1);
  position: absolute;
  width: 100%;
}
.slide-fade-enter-from { opacity: 0; transform: translateX(80px) scale(0.9); }
.slide-fade-leave-to   { opacity: 0; transform: translateX(120px) scale(0.85); }
.slide-fade-move       { transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1); }
</style>
