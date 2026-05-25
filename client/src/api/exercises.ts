import apiClient from './client';
import type { ApiResponse, Exercise, PaginatedResponse } from '../types';

/**
 * 获取动作列表
 */
export async function getExercises(params?: {
  category?: string;
  muscle?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}): Promise<PaginatedResponse<Exercise>> {
  const res = await apiClient.get<ApiResponse<PaginatedResponse<Exercise>>>('/exercises', { params });
  return res.data.data!;
}

/**
 * 获取动作详情
 */
export async function getExerciseById(id: string): Promise<Exercise> {
  const res = await apiClient.get<ApiResponse<Exercise>>(`/exercises/${id}`);
  return res.data.data!;
}
