import axios from 'axios';
import { useAuthStore } from '@/store/useAuthStore';

// Use environment variable for API URL, fallback to local default
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  // 默认超时时间：60 秒，避免生成图片这种长耗时请求过早超时
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Helper function to check if we're on an auth page
const isAuthPage = () => {
  const path = window.location.pathname;
  return path === '/login' || path === '/register' || path.startsWith('/password');
};

// Request interceptor to add token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => {
    // Check for business logic 401 (if backend returns 200 OK but code 401)
    if (response.data && response.data.code === 401) {
      localStorage.removeItem('token');
      // Clear user from store
      useAuthStore.getState().logout();
      // Only redirect if not already on auth page to avoid infinite loop
      if (!isAuthPage()) {
        window.location.href = '/login';
      }
      return Promise.reject(new Error(response.data.message || 'Unauthorized'));
    }
    return response.data;
  },
  (error) => {
    // Handle 401 Unauthorized (HTTP 401)
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      // Clear user from store
      useAuthStore.getState().logout();
      // Only redirect if not already on auth page to avoid infinite loop
      if (!isAuthPage()) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
