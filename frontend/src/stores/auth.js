import { defineStore } from 'pinia';
import router from '../router';

export const useAuthStore = defineStore('auth', {
  state: () => {
    const savedUser = localStorage.getItem('user');
    return {
      user: (savedUser && savedUser !== 'undefined') ? JSON.parse(savedUser) : null,
      token: localStorage.getItem('token') || null,
      loading: false,
    };
  },
  getters: {
    isAuthenticated: (state) => !!state.token,
    // ĐÃ SỬA: Cập nhật logic check Admin theo hệ thống 5 Role (Role 1 là Super Admin)
    isAdmin: (state) => state.user?.role_id === 1,
  },
  actions: {
    setUser(user, token) {
      // --- BƯỚC QUAN TRỌNG: Giải mã JWT Token để lấy Hub ID và Role ID ---
      if (token) {
        try {
          // JWT có 3 phần cách nhau bởi dấu chấm, phần thứ 2 chứa dữ liệu (payload)
          const base64Url = token.split('.')[1];
          const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
          const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
              return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
          }).join(''));

          const tokenData = JSON.parse(jsonPayload);
          
          // Gộp thông tin từ Token vào object User
          user = {
            ...user,
            user_id: tokenData.user_id,
            role_id: tokenData.role_id,
            primary_hub_id: tokenData.primary_hub_id,
            username: tokenData.sub,
            permissions: tokenData.permissions
          };
        } catch (e) {
          console.error("Không thể giải mã Token để lấy bưu cục", e);
        }
      }
      // ------------------------------------------------------------------

      this.user = user;
      this.token = token;
      
      if (user) {
        localStorage.setItem('user', JSON.stringify(user));
      } else {
        localStorage.removeItem('user');
      }
      
      if (token) {
        localStorage.setItem('token', token);
      } else {
        localStorage.removeItem('token');
      }
    },
    
    logout() {
      this.user = null;
      this.token = null;
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      router.push('/login');
    },
  },
});