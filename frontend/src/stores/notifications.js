import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import api from '@/api/axios';

// Thời gian debounce gom nhóm đơn hàng cùng khách (ms)
const GROUP_DEBOUNCE_MS = 4000;

export const useNotificationStore = defineStore('notifications', () => {
  const history = ref([]);
  const unreadCount = computed(() => history.value.filter(n => !n.read).length);
  const hasUnread = computed(() => unreadCount.value > 0);

  // Cache tên khách theo customer_id (tránh gọi API lặp lại)
  const _customerNameCache = {};
  // Buffer gom nhóm: key = "event:customer_id"
  const _groupBuffer = {};

  // Lấy tên khách từ cache hoặc API
  const _getCustomerName = async (customerId) => {
    if (!customerId) return null;
    if (_customerNameCache[customerId]) return _customerNameCache[customerId];
    try {
      const res = await api.get(`/api/customers/${customerId}`);
      const c = res.data;
      const name = c.transaction_name || c.representative_name || c.customer_code || `KH#${customerId}`;
      _customerNameCache[customerId] = name;
      return name;
    } catch {
      _customerNameCache[customerId] = `KH#${customerId}`;
      return _customerNameCache[customerId];
    }
  };

  const _buildBody = (event, payload, count, customerName) => {
    const code = payload.waybill_code || payload.request_code || '';
    const name = customerName || 'Khách hàng';

    switch (event) {
      case 'pickup.created':
      case 'pickup.created_by_admin':
        return count > 1
          ? `${name} vừa tạo ${count} đơn hàng.`
          : `${name} vừa tạo đơn ${code}.`;
      case 'pickup.price_finalized':
        return `Đơn ${code} đã duyệt cước phí.`;
      case 'pickup.dispatched_to_hub':
        return `Đơn ${code} đang về bưu cục.`;
      case 'pickup.hub_accepted':
        return `Đơn ${code} đã được tiếp nhận.`;
      case 'pickup.hub_rejected':
        return `Đơn ${code} bị từ chối tiếp nhận.`;
      case 'shipper.availability_changed':
        return `${payload.full_name || 'Bưu tá'} → ${payload.is_available ? 'Sẵn sàng' : 'Bận'}.`;
      case 'pickup.assigned_shipper':
        return `Đơn ${code} → ${payload.shipper_name || 'bưu tá'}.`;
      case 'pickup.picked':
        return `Bưu tá đã lấy thành công đơn ${code}.`;
      default:
        return code || 'Có cập nhật mới.';
    }
  };

  const mapEventToMessage = (event, payload, count = 1, customerName = null) => {
    const typeMap = {
      'pickup.created': { title: 'Yêu cầu lấy hàng mới', type: 'success', icon: '📦' },
      'pickup.created_by_admin': { title: 'Yêu cầu lấy hàng mới', type: 'success', icon: '📦' },
      'pickup.price_finalized': { title: 'Cập nhật giá cước', type: 'info', icon: '💰' },
      'pickup.dispatched_to_hub': { title: 'Điều phối về bưu cục', type: 'info', icon: '🏢' },
      'pickup.hub_accepted': { title: 'Bưu cục tiếp nhận', type: 'success', icon: '✅' },
      'pickup.hub_rejected': { title: 'Bưu cục từ chối', type: 'danger', icon: '❌' },
      'shipper.availability_changed': { title: 'Trạng thái bưu tá', type: 'warning', icon: '🚴' },
      'pickup.assigned_shipper': { title: 'Đã phân công bưu tá', type: 'info', icon: '👷' },
      'pickup.picked': { title: 'Đã lấy hàng', type: 'success', icon: '🎉' },
    };
    const meta = typeMap[event] || { title: 'Thông báo hệ thống', type: 'info', icon: 'ℹ️' };
    return {
      ...meta,
      body: _buildBody(event, payload, count, customerName),
    };
  };

  // Thêm thông báo mới — có debounce gom nhóm cho pickup.created
  const addNotification = async (event, payload) => {
    const isGroupable = event === 'pickup.created' || event === 'pickup.created_by_admin';
    const groupKey = isGroupable && payload.customer_id ? `${event}:${payload.customer_id}` : null;

    if (groupKey) {
      if (_groupBuffer[groupKey]) {
        // Đã có nhóm đang pending → cộng dồn
        _groupBuffer[groupKey].count += 1;
        const count = _groupBuffer[groupKey].count;
        const customerName = _groupBuffer[groupKey].customerName;

        const existing = history.value.find(n => n.id === _groupBuffer[groupKey].notifId);
        if (existing) {
          existing.body = _buildBody(event, payload, count, customerName);
          existing.read = false;
        }

        clearTimeout(_groupBuffer[groupKey].timerId);
        _groupBuffer[groupKey].timerId = setTimeout(() => {
          delete _groupBuffer[groupKey];
        }, GROUP_DEBOUNCE_MS);
        return;
      }

      // Lần đầu: tạo thông báo tạm với tên chung, rồi fetch tên thật async
      const id = Date.now() + Math.random().toString(36).substr(2, 9);
      const now = new Date();
      const info = mapEventToMessage(event, payload, 1, null);

      history.value.unshift({
        id, event,
        title: info.title,
        body: info.body,
        type: info.type,
        icon: info.icon,
        time: now,
        timeString: now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        dateString: now.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }),
        read: false,
      });

      _groupBuffer[groupKey] = {
        notifId: id,
        count: 1,
        customerName: null,
        timerId: setTimeout(() => { delete _groupBuffer[groupKey]; }, GROUP_DEBOUNCE_MS),
      };

      // Fetch tên khách bất đồng bộ → cập nhật body khi có
      _getCustomerName(payload.customer_id).then(name => {
        _groupBuffer[groupKey] && (_groupBuffer[groupKey].customerName = name);
        const notif = history.value.find(n => n.id === id);
        if (notif) {
          notif.body = _buildBody(event, payload, _groupBuffer[groupKey]?.count || 1, name);
        }
      });

    } else {
      // Event không groupable → thêm thẳng
      const id = Date.now() + Math.random().toString(36).substr(2, 9);
      const info = mapEventToMessage(event, payload);
      const now = new Date();

      history.value.unshift({
        id, event,
        title: info.title,
        body: info.body,
        type: info.type,
        icon: info.icon,
        time: now,
        timeString: now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        dateString: now.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }),
        read: false,
      });

      if (history.value.length > 50) {
        history.value = history.value.slice(0, 50);
      }
    }
  };

  const markAllRead = () => { history.value.forEach(n => { n.read = true; }); };
  const markRead = (id) => { const n = history.value.find(n => n.id === id); if (n) n.read = true; };
  const removeOne = (id) => { history.value = history.value.filter(n => n.id !== id); };
  const clearAll = () => { history.value = []; };

  return {
    history,
    unreadCount,
    hasUnread,
    addNotification,
    markAllRead,
    markRead,
    removeOne,
    clearAll,
    mapEventToMessage,
  };
});
