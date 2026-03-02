import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { apiRequest } from '../lib/apiClient';
import type { Role } from '../types/hotel';

export interface User {
  id: string;
  username: string;
  role: Role;
}

interface AuthStore {
  user: User | null;
  token: string | null;
  error: string;
  login: (username: string, password: string) => Promise<boolean>;
  register: (username: string, password: string, role: Role) => Promise<boolean>;
  logout: () => void;
}

interface AuthResponse {
  token: string;
  user: User;
}

function toCnAuthError(message: string) {
  if (!message) return '请求失败，请稍后重试';
  if (message.includes('Username already exists')) return '用户名已存在';
  if (message.includes('Username and password are required')) return '请输入用户名和密码';
  if (message.includes('Invalid username or password')) return '用户名或密码错误';
  if (message.toLowerCase().includes('password') && message.includes('6')) return '密码至少 6 位';
  return message;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      error: '',

      register: async (username, password, role) => {
        try {
          const res = await apiRequest<AuthResponse>('/api/auth/register', {
            method: 'POST',
            body: { username, password, role },
          });
          set({ user: res.user, token: res.token, error: '' });
          return true;
        } catch (e) {
          const msg = e instanceof Error ? e.message : '请求失败';
          set({ error: toCnAuthError(msg) });
          return false;
        }
      },

      login: async (username, password) => {
        try {
          const res = await apiRequest<AuthResponse>('/api/auth/login', {
            method: 'POST',
            body: { username, password },
          });
          set({ user: res.user, token: res.token, error: '' });
          return true;
        } catch (e) {
          const msg = e instanceof Error ? e.message : '请求失败';
          set({ error: toCnAuthError(msg) });
          return false;
        }
      },

      logout: () => set({ user: null, token: null, error: '' }),
    }),
    { name: 'auth-storage' }
  )
);
