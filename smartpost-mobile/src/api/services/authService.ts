import axiosClient from '../axiosClient';

export const authService = {
  login: async (username: string, password: string) => {
    // KHÔNG dùng FormData nữa. Gửi thẳng Object JSON
    const payload = {
      username: username,
      password: password
    };

    const response = await axiosClient.post('/auth/login', payload);
    return response.data; 
  },
};