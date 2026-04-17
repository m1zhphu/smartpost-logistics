import axiosClient from '../axiosClient';

export const deliveryService = {
  // Lấy danh sách nhiệm vụ của Shipper
  getMyTasks: async () => {
    const res = await axiosClient.get('/delivery/my-tasks');
    return res.data.items || [];
  },

  // Xác nhận giao thành công
  confirmSuccess: async (payload: {
    waybill_code: string;
    actual_cod_collected: number;
    pod_image_url: string; // Yêu cầu bắt buộc phải có ảnh
    note?: string;
  }) => {
    const res = await axiosClient.post('/delivery/confirm-success', payload);
    return res.data;
  },

  // Báo cáo giao thất bại
  reportFailure: async (payload: {
    waybill_code: string;
    reason_code: string;
    note?: string;
  }) => {
    const res = await axiosClient.post('/delivery/report-failure', payload);
    return res.data;
  },

  // Lấy danh sách Shipper thuộc bưu cục hiện tại (Backend lọc theo primary_hub_id)
  getShippers: async () => {
    const res = await axiosClient.get('/users/shippers');
    return res.data;
  },

  // Phân công danh sách đơn cho 1 Shipper
  assignShipper: async (payload: { shipper_id: number; waybill_codes: string[] }) => {
    const res = await axiosClient.post('/delivery/assign-shipper', payload);
    return res.data;
  }
  ,
  getPendingCOD: async () => {
    const res = await axiosClient.get('/delivery/my-pending-cod');
    return res.data; // Giả sử Backend trả về { total_cod: 5000000, count: 15 }
  }
};