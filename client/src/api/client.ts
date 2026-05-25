import axios from 'axios';
import type { ApiResponse } from '../types';

// 开发环境用相对路径走 Vite 代理，生产环境用 Render 后端地址
const API_BASE = (import.meta as any).env?.VITE_API_URL || '/api';

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

// === 响应拦截器：统一处理 401 ===
apiClient.interceptors.response.use(
  (response) => {
    const data = response.data as ApiResponse;
    // 业务层面的认证错误
    if (data.code === 401) {
      localStorage.removeItem('fitness_token');
      window.location.href = '/login';
    }
    return response;
  },
  (error) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      localStorage.removeItem('fitness_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  },
);

export default apiClient;
