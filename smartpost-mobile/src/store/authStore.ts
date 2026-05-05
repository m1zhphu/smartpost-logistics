import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AuthState {
  token: string | null;
  user: any | null;
  setAuth: (token: string, user: any) => Promise<void>;
  logout: () => Promise<void>;
  loadToken: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,

  setAuth: async (token, user) => {
    await AsyncStorage.setItem('access_token', token);
    await AsyncStorage.setItem('user_info', JSON.stringify(user));
    set({ token, user });
  },

  logout: async () => {
    await AsyncStorage.removeItem('access_token');
    await AsyncStorage.removeItem('user_info');
    set({ token: null, user: null });
  },

  loadToken: async () => {
    const token = await AsyncStorage.getItem('access_token');
    const userStr = await AsyncStorage.getItem('user_info');
    if (token && userStr) {
      set({ token, user: JSON.parse(userStr) });
    }
  },
}));