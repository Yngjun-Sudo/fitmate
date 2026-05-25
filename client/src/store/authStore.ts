import { create } from 'zustand';
import type { User } from '../types';
import * as authApi from '../api/auth';

interface AuthState {
  token: string | null;
  user: User | null;
  isLoading: boolean;
  error: string | null;

  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  fetchUser: () => Promise<void>;
  updateProfile: (data: Parameters<typeof authApi.updateProfile>[0]) => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  token: localStorage.getItem('fitness_token'),
  user: null,
  isLoading: false,
  error: null,

  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const result = await authApi.login({ email, password });
      localStorage.setItem('fitness_token', result.token);
      set({ token: result.token, user: result.user, isLoading: false });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '登录失败';
      set({ error: msg, isLoading: false });
      throw err;
    }
  },

  register: async (email: string, password: string, name: string) => {
    set({ isLoading: true, error: null });
    try {
      const result = await authApi.register({ email, password, name });
      localStorage.setItem('fitness_token', result.token);
      set({ token: result.token, user: result.user, isLoading: false });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '注册失败';
      set({ error: msg, isLoading: false });
      throw err;
    }
  },

  logout: () => {
    localStorage.removeItem('fitness_token');
    set({ token: null, user: null, error: null });
  },

  fetchUser: async () => {
    const { token } = get();
    if (!token) return;
    set({ isLoading: true });
    try {
      const user = await authApi.getMe();
      set({ user, isLoading: false });
    } catch {
      // Token 无效，清除
      localStorage.removeItem('fitness_token');
      set({ token: null, user: null, isLoading: false });
    }
  },

  updateProfile: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const user = await authApi.updateProfile(data);
      set({ user, isLoading: false });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '更新失败';
      set({ error: msg, isLoading: false });
      throw err;
    }
  },

  clearError: () => set({ error: null }),
}));
