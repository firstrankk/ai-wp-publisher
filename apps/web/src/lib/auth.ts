import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { authApi } from './api';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'EDITOR' | 'VIEWER';
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  _hasHydrated: boolean;
  setAuth: (user: User, token: string) => void;
  clearAuth: () => void;
  restoreSession: () => Promise<void>;
  isAuthenticated: boolean;
  isAdmin: boolean;
}

export const useAuth = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoading: false,
      _hasHydrated: false,
      setAuth: (user, token) => {
        localStorage.setItem('token', token);
        set({ user, token });
      },
      clearAuth: () => {
        localStorage.removeItem('token');
        set({ user: null, token: null });
      },
      restoreSession: async () => {
        const token = localStorage.getItem('token');
        if (!token) return;
        if (get().user) return;

        set({ isLoading: true });
        try {
          const response = await authApi.me();
          set({ user: response.data, token, isLoading: false });
        } catch {
          localStorage.removeItem('token');
          set({ user: null, token: null, isLoading: false });
        }
      },
      get isAuthenticated() {
        return !!get().token;
      },
      get isAdmin() {
        return get().user?.role === 'ADMIN';
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ user: state.user, token: state.token }),
      onRehydrateStorage: () => () => {
        useAuth.setState({ _hasHydrated: true });
      },
    }
  )
);
