import axios from 'axios';
import type { ApiResponse } from '../types';

// 生产环境用 Vercel 后端，开发环境用相对路径走 Vite 代理
const API_BASE = (import.meta as any).env?.VITE_API_URL || 'https://fitmate-api-jet.vercel.app';

const apiClient = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// === 请求拦截器：自动附带 Bearer Token ===
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('fitness_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// === 响应拦截器：统一处理 401（静默处理，不跳转登录页） ===
apiClient.interceptors.response.use(
  (response) => {
    const data = response.data as ApiResponse;
    // 业务层面的认证错误 — 静默清除 token，不跳转
    if (data.code === 401) {
      localStorage.removeItem('fitness_token');
    }
    return response;
  },
  (error) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      // 静默清除 token，不跳转登录页（登录已关闭）
      localStorage.removeItem('fitness_token');
    }
    return Promise.reject(error);
  },
);

export default apiClient;
