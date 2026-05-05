import * as FileSystem from 'expo-file-system';
import axiosClient from '../axiosClient';

export const waybillService = {
  getTasks: async () => {
    const res = await axiosClient.get('/delivery/my-tasks');
    return res.data.items || [];
  },

  getTracking: async (code: string) => {
    const res = await axiosClient.get(`/waybills/${code}/tracking`);
    return res.data.history;
  },

  createWaybill: async (payload: any) => {
    const res = await axiosClient.post('/waybills', payload);
    return res.data;
  },
  searchWaybills: async (filters: any) => {
    const res = await axiosClient.post('/waybills/search', filters);
    return res.data;
  },
  getHubs: async () => {
    const res = await axiosClient.get('/hubs');
    return res.data.items || res.data;
  },
  getCustomers: async () => {
    const res = await axiosClient.get('/customers');
    return res.data.items || res.data || [];
  },
  
  updateWeight: async (code: string, weight: number) => {
    const res = await axiosClient.patch(`/waybills/${code}/weight`, { actual_weight: weight });
    return res.data;
  },
  updateWaybillInfo: async (code: string, payload: any) => {
    const res = await axiosClient.put(`/waybills/${code}`, payload);
    return res.data;
  },
  cancelWaybill: async (code: string) => {
    const res = await axiosClient.delete(`/waybills/${code}`);
    return res.data;
  },
  createCustomer: async (payload: any) => {
    const res = await axiosClient.post('/customers', payload);
    return res.data;
  },
};