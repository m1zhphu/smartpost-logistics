import axiosClient from '../axiosClient';

export const pricingService = {
  getRules: async () => {
    const res = await axiosClient.get('/pricing/rules');
    return res.data;
  },
  calculateFee: async (payload: any) => {
    const res = await axiosClient.post('/pricing/calculate', payload);
    return res.data;
  },
  getExtraServices: async () => {
    const res = await axiosClient.get('/pricing/extra-services');
    return res.data;
  }
};