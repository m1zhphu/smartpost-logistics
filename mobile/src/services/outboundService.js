import { apiClient } from '../context/UserContext';

export const scanInboundAtDestHub = async (code) => {
  try {
    const response = await apiClient.post('/api/outbound-dispatch/mobile/inbound-scan', { code });
    return { success: true, data: response.data };
  } catch (error) {
    const msg = error.response?.data?.detail || error.message || 'Lỗi quét nhập kho bưu cục đến';
    return { success: false, message: msg };
  }
};

export const getPendingDeliveryWaybills = async () => {
  try {
    const response = await apiClient.get('/api/outbound-dispatch/mobile/pending-delivery-waybills');
    return { success: true, data: response.data };
  } catch (error) {
    const msg = error.response?.data?.detail || error.message || 'Lỗi lấy danh sách đơn chờ xuất kho đi giao';
    return { success: false, message: msg };
  }
};

export const scanOutboundDelivery = async (waybillCodeOrCodes) => {
  try {
    const payload = Array.isArray(waybillCodeOrCodes)
      ? { waybill_codes: waybillCodeOrCodes }
      : { waybill_code: waybillCodeOrCodes };
    const response = await apiClient.post('/api/outbound-dispatch/mobile/outbound-delivery-scan', payload);
    return { success: true, data: response.data };
  } catch (error) {
    const msg = error.response?.data?.detail || error.message || 'Lỗi xuất kho đi giao';
    return { success: false, message: msg };
  }
};

export const submitPOD = async (waybillCode, imageUrl, note = '') => {
  try {
    const response = await apiClient.post('/api/outbound-dispatch/mobile/pod', {
      waybill_code: waybillCode,
      image_url: imageUrl,
      note,
    });
    return { success: true, data: response.data };
  } catch (error) {
    const msg = error.response?.data?.detail || error.message || 'Lỗi gửi báo phát POD';
    return { success: false, message: msg };
  }
};

export const reportIncident = async (waybillCode, reason, note = '', imageUrl = null) => {
  try {
    const response = await apiClient.post('/api/outbound-dispatch/mobile/incident', {
      waybill_code: waybillCode,
      reason,
      note,
      image_url: imageUrl,
    });
    return { success: true, data: response.data };
  } catch (error) {
    const msg = error.response?.data?.detail || error.message || 'Lỗi gửi báo cáo sự cố';
    return { success: false, message: msg };
  }
};
