import axiosClient from '../axiosClient';

export const printService = {
  printWaybill: async (waybillCode: string) => {
    const res = await axiosClient.get(`/print/${waybillCode}`);
    return res.data; 
  },
};