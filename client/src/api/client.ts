import axios from 'axios';
import type { ApiResponse } from '../types';

// 支持多环境部署：Vercel / Netlify / 本地开发
// Netlify 部署时设置 VITE_API_URL 指向 Render 后端
// Render 后端地址需要在部署后填入
const BASE = (import.meta as any).env?.VITE_API_URL || 'https://fitmate-api-jet.vercel.app';
export const API_BASE = BASE + '/api';

const apiClient = axios.create({
  baseURL: API_BASE,
  timeout: 60000, // 增加到 60s，工具调用可能需要更长时间
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
