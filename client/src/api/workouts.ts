import apiClient from './client';
import type {
  ApiResponse, WorkoutPlan, WorkoutLog, CreateWorkoutPlanInput,
  CreateWorkoutLogInput, PaginatedResponse,
} from '../types';

// === 训练计划 ===

export async function getWorkoutPlans(): Promise<WorkoutPlan[]> {
  const res = await apiClient.get<ApiResponse<WorkoutPlan[]>>('/workout-plans');
  return res.data.data!;
}

export async function getWorkoutPlanById(id: string): Promise<WorkoutPlan> {
  const res = await apiClient.get<ApiResponse<WorkoutPlan>>(`/workout-plans/${id}`);
  return res.data.data!;
}

export async function createWorkoutPlan(input: CreateWorkoutPlanInput): Promise<WorkoutPlan> {
  const res = await apiClient.post<ApiResponse<WorkoutPlan>>('/workout-plans', input);
  return res.data.data!;
}

export async function updateWorkoutPlan(id: string, input: Partial<CreateWorkoutPlanInput>): Promise<WorkoutPlan> {
  const res = await apiClient.put<ApiResponse<WorkoutPlan>>(`/workout-plans/${id}`, input);
  return res.data.data!;
}

export async function deleteWorkoutPlan(id: string): Promise<void> {
  await apiClient.delete(`/workout-plans/${id}`);
}

// === 训练记录 ===

export async function getWorkoutLogs(params?: {
  date?: string;
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
}): Promise<PaginatedResponse<WorkoutLog>> {
  const res = await apiClient.get<ApiResponse<PaginatedResponse<WorkoutLog>>>('/workout-logs', { params });
  return res.data.data!;
}

export async function getWorkoutLogById(id: string): Promise<WorkoutLog> {
  const res = await apiClient.get<ApiResponse<WorkoutLog>>(`/workout-logs/${id}`);
  return res.data.data!;
}

export async function createWorkoutLog(input: CreateWorkoutLogInput): Promise<WorkoutLog> {
  const res = await apiClient.post<ApiResponse<WorkoutLog>>('/workout-logs', input);
  return res.data.data!;
}

export async function updateWorkoutLog(id: string, input: Partial<CreateWorkoutLogInput>): Promise<WorkoutLog> {
  const res = await apiClient.put<ApiResponse<WorkoutLog>>(`/workout-logs/${id}`, input);
  return res.data.data!;
}
