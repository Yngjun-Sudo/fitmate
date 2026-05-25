import apiClient from './client';
import type { ApiResponse, AuthResult, LoginInput, RegisterInput, UpdateProfileInput, User } from '../types';

/**
 * 用户注册
 */
export async function register(input: RegisterInput): Promise<AuthResult> {
  const res = await apiClient.post<ApiResponse<AuthResult>>('/auth/register', input);
  return res.data.data!;
}

/**
 * 用户登录
 */
export async function login(input: LoginInput): Promise<AuthResult> {
  const res = await apiClient.post<ApiResponse<AuthResult>>('/auth/login', input);
  return res.data.data!;
}

/**
 * 获取当前用户信息
 */
export async function getMe(): Promise<User> {
  const res = await apiClient.get<ApiResponse<User>>('/auth/me');
  return res.data.data!;
}

/**
 * 更新个人信息
 */
export async function updateProfile(input: UpdateProfileInput): Promise<User> {
  const res = await apiClient.put<ApiResponse<User>>('/auth/profile', input);
  return res.data.data!;
}
