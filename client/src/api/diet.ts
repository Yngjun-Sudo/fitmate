import apiClient from './client';
import type {
  ApiResponse, FoodItem, MealRecord, TDEECalcInput, TDEEResult,
  CreateMealRecordInput, PaginatedResponse,
} from '../types';

// === TDEE ===
export async function calculateTDEE(input: TDEECalcInput): Promise<TDEEResult> {
  const res = await apiClient.post<ApiResponse<TDEEResult>>('/diet/tdee', input);
  return res.data.data!;
}

// === 食物 ===
export async function searchFoodItems(search: string, page?: number): Promise<PaginatedResponse<FoodItem>> {
  const res = await apiClient.get<ApiResponse<PaginatedResponse<FoodItem>>>('/food-items', {
    params: { search, page },
  });
  return res.data.data!;
}

export async function createFoodItem(data: {
  name: string;
  caloriesPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
}): Promise<FoodItem> {
  const res = await apiClient.post<ApiResponse<FoodItem>>('/food-items', data);
  return res.data.data!;
}

// === 饮食记录 ===
export async function getMealRecords(date: string): Promise<MealRecord[]> {
  const res = await apiClient.get<ApiResponse<MealRecord[]>>('/meal-records', { params: { date } });
  return res.data.data!;
}

export async function createMealRecord(input: CreateMealRecordInput): Promise<MealRecord> {
  const res = await apiClient.post<ApiResponse<MealRecord>>('/meal-records', input);
  return res.data.data!;
}

export async function deleteMealRecord(id: string): Promise<void> {
  await apiClient.delete(`/meal-records/${id}`);
}
