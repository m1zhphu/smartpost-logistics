export const PICKUP_STATUS_LABELS = {
  PENDING_CONFIRMATION: 'Chờ xác nhận văn phòng',
  DISPATCHED_TO_HUB: 'Đã điều phối sang văn phòng',
  HUB_REJECTED: 'Văn phòng từ chối tiếp nhận',
  RECEIVED: 'Chờ gán bưu tá',
  ASSIGNED_PICKUP: 'Đã gán bưu tá',
  PICKED: 'Bưu tá đã lấy hàng',
  COMPLETED: 'Hoàn thành',
  CANCELLED: 'Đã hủy yêu cầu',
  // Alias variants
  ASSIGNED: 'Đã gán bưu tá',
  PENDING: 'Chờ xử lý',
};

export const WAYBILL_STATUS_LABELS = {
  CREATED: 'Vận đơn vừa tạo',
  PICKED_PENDING_VERIFY: 'Đã lấy hàng, chờ nhập kho',
  READY_WAREHOUSE: 'Sẵn sàng nhập kho',
  IN_HUB: 'Đã nhập kho',
  IN_TRANSIT: 'Đang vận chuyển',
  DELIVERING: 'Đang giao hàng',
  DELIVERED: 'Giao hàng thành công',
  DELIVERY_FAILED: 'Giao hàng thất bại',
  CUSTOMER_UNAVAILABLE: 'Khách không có mặt',
  RECIPIENT_REFUSED: 'Khách từ chối nhận',
  RETURNED: 'Đã hoàn trả',
  CANCELLED: 'Đã hủy',
};

export const PRICE_STATUS_LABELS = {
  ESTIMATED: 'Cước dự kiến',
  FINALIZED: 'Cước đã chốt',
  ADJUSTED: 'Cước đã điều chỉnh',
};

export function getPickupStatusLabel(status) {
  return PICKUP_STATUS_LABELS[status] || status || 'Chờ xử lý';
}

export function getWaybillStatusLabel(status) {
  return WAYBILL_STATUS_LABELS[status] || status || '---';
}

export function getPriceStatusLabel(status) {
  return PRICE_STATUS_LABELS[status] || status || '---';
}

export function getOfficeStatusLabel(status) {
  if (!status || status === 'CHUA_XAC_NHAN_VAN_PHONG') {
    return 'Chưa xác nhận văn phòng';
  }

  return status;
}

export function getPickupStatusColor(status) {
  switch (status) {
    case 'PENDING_CONFIRMATION':
      return '#f59e0b';
    case 'DISPATCHED_TO_HUB':
      return '#0ea5e9';
    case 'HUB_REJECTED':
      return '#ef4444';
    case 'RECEIVED':
      return '#2563eb';
    case 'ASSIGNED_PICKUP':
      return '#7c3aed';
    case 'PICKED':
      return '#059669';
    case 'CANCELLED':
      return '#6b7280';
    default:
      return '#6b7280';
  }
}

export function hasFinalPrice(priceStatus, finalTotalAmount) {
  return (
    (priceStatus === 'FINALIZED' || priceStatus === 'ADJUSTED') &&
    finalTotalAmount !== null &&
    finalTotalAmount !== undefined
  );
}

export function formatCurrency(value) {
  return `${Number(value || 0).toLocaleString('vi-VN')} đ`;
}

export function formatDateTime(value) {
  if (!value) {
    return '---';
  }

  const hasTimezone = /(Z|[+-]\d{2}:?\d{2})$/i.test(String(value));
  const isApiDateTime = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(String(value));
  const date = new Date(isApiDateTime && !hasTimezone ? `${value}Z` : value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function formatWeight(value) {
  if (value === null || value === undefined || value === '') {
    return '---';
  }

  return `${Number(value).toLocaleString('vi-VN')} kg`;
}
