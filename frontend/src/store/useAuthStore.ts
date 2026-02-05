import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authService, User } from '@/services/authService';

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  login: (token: string, user: User) => void;
  logout: () => void;
  fetchUser: () => Promise<void>;
  setUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isLoading: false,
      error: null,

      login: (token, user) => {
        localStorage.setItem('token', token);
        set({ token, user, error: null });
      },

      logout: () => {
        localStorage.removeItem('token');
        set({ token: null, user: null, error: null });
      },

      setUser: (user) => set({ user }),

      fetchUser: async () => {
        set({ isLoading: true });
        try {
          const res = await authService.getMe();
          if (res.code === 0 && res.data) {
            // GetMe API 直接返回用户信息，不是嵌套在 user 字段中
            const userData: User = {
              ID: res.data.id || res.data.user?.ID || 0,
              email: res.data.email || res.data.user?.email || '',
              status: res.data.user?.status || 'enabled',
              created_at: res.data.created_at || res.data.user?.created_at || '',
              balance: res.data.balance ?? res.data.user?.balance,
              remaining_free_trials: res.data.remaining_free_trials ?? res.data.user?.remaining_free_trials,
            };
            set({ user: userData, error: null });
          } else {
            // If fetching user fails, maybe token is invalid
            set({ error: res.message });
          }
        } catch (error: any) {
            console.error("Failed to fetch user", error);
            // Don't auto logout on every error, but maybe on 401
            set({ error: error.message || 'Failed to fetch user' });
        } finally {
          set({ isLoading: false });
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ token: state.token, user: state.user }), // Only persist token and user
    }
  )
);
