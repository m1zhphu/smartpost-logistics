import axiosClient from '../axiosClient';

export const accountingService = {
  // Lấy danh sách shipper đang giữ tiền COD
  getCashConfirmationList: async () => {
    const res = await axiosClient.get('/accounting/cash-confirmation');
    return res.data;
  },
  // Chốt ca thu tiền từ Shipper
  confirmShipperCash: async (waybillCodes: string[], note: string = "Xác nhận thu tiền mặt") => {
    const res = await axiosClient.post('/accounting/confirm-shipper-cash', {
      waybill_codes: waybillCodes,
      note: note
    });
    return res.data;
  },
  // Tạo bảng kê đối soát cho Shop
  createShopStatement: async (customerId: number) => {
    const res = await axiosClient.post(`/accounting/create-shop-statement?customer_id=${customerId}`);
    return res.data;
  },
  // Lấy URL để tải file Excel đối soát (Không call axios trực tiếp vì đây là file)
  getExportStatementUrl: (statementId: number, token: string) => {
    // Thay baseURL bằng URL server thật của bạn
    const baseURL = axiosClient.defaults.baseURL || 'http://localhost:8000/api';
    return `${baseURL}/accounting/cod/${statementId}/export?token=${token}`;
  }
};