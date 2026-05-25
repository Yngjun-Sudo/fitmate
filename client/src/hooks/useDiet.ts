import { useCallback } from 'react';
import { useDietStore } from '../store/dietStore';

/**
 * useDiet Hook — 封装饮食相关操作
 */
export function useDiet() {
  const {
    tdeeResult, foodItems, mealRecords, isLoading, error,
    calculateTDEE, searchFoodItems, createFoodItem,
    fetchMealRecords, createMealRecord, deleteMealRecord, clearError,
  } = useDietStore();

  const loadMealRecords = useCallback((date: string) => {
    fetchMealRecords(date);
  }, [fetchMealRecords]);

  const searchFood = useCallback((query: string) => {
    searchFoodItems(query);
  }, [searchFoodItems]);

  const calcTDEE = useCallback((input: Parameters<typeof calculateTDEE>[0]) => {
    calculateTDEE(input);
  }, [calculateTDEE]);

  return {
    tdeeResult, foodItems, mealRecords, isLoading, error,
    calcTDEE, searchFood, createFoodItem,
    loadMealRecords, createMealRecord, deleteMealRecord, clearError,
  };
}
