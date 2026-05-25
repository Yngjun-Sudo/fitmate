import { create } from 'zustand';
import type { FoodItem, MealRecord, TDEECalcInput, TDEEResult, CreateMealRecordInput } from '../types';
import * as dietApi from '../api/diet';

interface DietState {
  tdeeResult: TDEEResult | null;
  foodItems: FoodItem[];
  mealRecords: MealRecord[];
  isLoading: boolean;
  error: string | null;

  calculateTDEE: (input: TDEECalcInput) => Promise<void>;
  searchFoodItems: (search: string) => Promise<void>;
  createFoodItem: (data: Parameters<typeof dietApi.createFoodItem>[0]) => Promise<FoodItem>;
  fetchMealRecords: (date: string) => Promise<void>;
  createMealRecord: (input: CreateMealRecordInput) => Promise<void>;
  deleteMealRecord: (id: string) => Promise<void>;
  clearError: () => void;
}

export const useDietStore = create<DietState>((set, get) => ({
  tdeeResult: null,
  foodItems: [],
  mealRecords: [],
  isLoading: false,
  error: null,

  calculateTDEE: async (input) => {
    set({ isLoading: true, error: null });
    try {
      const result = await dietApi.calculateTDEE(input);
      set({ tdeeResult: result, isLoading: false });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '计算失败';
      set({ error: msg, isLoading: false });
    }
  },

  searchFoodItems: async (search) => {
    set({ isLoading: true, error: null });
    try {
      const result = await dietApi.searchFoodItems(search);
      set({ foodItems: result.items, isLoading: false });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '搜索失败';
      set({ error: msg, isLoading: false });
    }
  },

  createFoodItem: async (data) => {
    try {
      const food = await dietApi.createFoodItem(data);
      set((s) => ({ foodItems: [food, ...s.foodItems] }));
      return food;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '添加失败';
      set({ error: msg });
      throw err;
    }
  },

  fetchMealRecords: async (date) => {
    set({ isLoading: true, error: null });
    try {
      const records = await dietApi.getMealRecords(date);
      set({ mealRecords: records, isLoading: false });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '加载饮食记录失败';
      set({ error: msg, isLoading: false });
    }
  },

  createMealRecord: async (input) => {
    set({ isLoading: true, error: null });
    try {
      const record = await dietApi.createMealRecord(input);
      set((s) => ({ mealRecords: [record, ...s.mealRecords], isLoading: false }));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '记录失败';
      set({ error: msg, isLoading: false });
      throw err;
    }
  },

  deleteMealRecord: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await dietApi.deleteMealRecord(id);
      set((s) => ({ mealRecords: s.mealRecords.filter((r) => r.id !== id), isLoading: false }));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '删除失败';
      set({ error: msg, isLoading: false });
      throw err;
    }
  },

  clearError: () => set({ error: null }),
}));
