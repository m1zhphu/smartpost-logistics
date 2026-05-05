import axiosClient from '../axiosClient';

export const warehouseService = {
  // 1. Quét nhập kho
  scanInHub: async (waybillCode: string, note: string = '') => {
    const res = await axiosClient.post('/scans/in-hub', { waybill_code: waybillCode, note });
    return res.data;
  },

  // 2. Cân lại hàng (tùy chọn)
  updateWeight: async (waybillCode: string, actualWeight: number, note: string = '') => {
    const res = await axiosClient.patch(`/scans/${waybillCode}/weigh`, { actual_weight: actualWeight, note });
    return res.data;
  },

  // 3. Đóng túi
  scanBagging: async (payload: { bag_code?: string; destination_hub_id: number; waybill_codes: string[]; note?: string }) => {
    const res = await axiosClient.post('/scans/bagging', payload);
    return res.data;
  },

  // 4. Bốc lên xe (Xuất Hub)
  manifestLoad: async (payload: { manifest_code: string; to_hub_id: number; vehicle_number?: string; bag_codes: string[] }) => {
    const res = await axiosClient.post('/scans/manifest-load', payload);
    return res.data;
  },

  // 5. Gỡ xuống xe (Nhập Hub)
  manifestUnload: async (payload: { manifest_code: string; bag_codes: string[] }) => {
    const res = await axiosClient.post('/scans/manifest-unload', payload);
    return res.data;
  },
  // Lấy danh sách các chuyến xe đang di chuyển TỚI bưu cục hiện tại
  getIncomingManifests: async () => {
    const res = await axiosClient.get('/scans/manifests/incoming');
    return res.data.items || [];
  },

  // Lấy danh sách các túi hàng thuộc về một chuyến xe
  getManifestBags: async (manifestCode: string) => {
    const res = await axiosClient.get(`/scans/manifests/${manifestCode}/bags`);
    return res.data.items || [];
  },
};