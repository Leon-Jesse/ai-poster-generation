export interface User {
  ID: number;
  email: string;
  avatar_url?: string;
  status: string;
  created_at: string;
  balance?: number; // Added balance
}

export interface AuthResponse {
  code: number;
  message: string;
  data: {
    user?: User;
    token?: string;
  };
}

// Ensure api.ts is imported correctly
import api from '@/lib/api';

export const authService = {
  // Send Verification Code
  sendCode: async (email: string, type: 'register' | 'login' | 'reset_password' = 'register') => {
    return api.post<any, AuthResponse>('/auth/send-code', { email, type });
  },

  // Register
  register: async (email: string, password: string, code: string, token: string) => {
    return api.post<any, AuthResponse>('/auth/register', { email, password, code, token });
  },

  // Login
  login: async (email: string, password: string) => {
    return api.post<any, AuthResponse>('/auth/login', { email, password });
  },

  // Reset Password
  resetPassword: async (email: string, new_password: string, code: string, token: string) => {
    return api.post<any, AuthResponse>('/auth/password/reset', { email, new_password, code, token });
  },

  changePassword: async (data: any) => {
    return api.post<any, AuthResponse>('/auth/password/change', data);
  },

  // Get Current User
  getMe: async () => {
    return api.get<any, AuthResponse>('/users/me');
  },
};
