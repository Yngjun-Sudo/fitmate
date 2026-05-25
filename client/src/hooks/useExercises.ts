import { useEffect, useCallback } from 'react';
import { useWorkoutStore } from '../store/workoutStore';

/**
 * useExercises Hook — 封装动作库状态操作
 */
export function useExercises() {
  const { exercises, exerciseTotal, isLoading, error, fetchExercises, clearError } = useWorkoutStore();

  const loadExercises = useCallback(
    (params?: { category?: string; muscle?: string; search?: string; page?: number }) => {
      fetchExercises(params);
    },
    [fetchExercises],
  );

  return { exercises, exerciseTotal, isLoading, error, loadExercises, clearError };
}
