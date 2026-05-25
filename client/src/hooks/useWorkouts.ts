import { useEffect, useCallback } from 'react';
import { useWorkoutStore } from '../store/workoutStore';

/**
 * useWorkouts Hook — 封装训练计划和记录操作
 */
export function useWorkouts() {
  const {
    plans, currentPlan, logs, isLoading, error,
    fetchPlans, fetchPlanById, createPlan, updatePlan, deletePlan,
    fetchLogs, fetchLogById, createLog, updateLog,
    clearError,
  } = useWorkoutStore();

  const loadPlans = useCallback(() => {
    fetchPlans();
  }, [fetchPlans]);

  const loadPlanById = useCallback((id: string) => {
    fetchPlanById(id);
  }, [fetchPlanById]);

  const loadLogs = useCallback((params?: { date?: string; from?: string; to?: string }) => {
    fetchLogs(params);
  }, [fetchLogs]);

  return {
    plans, currentPlan, logs, isLoading, error,
    loadPlans, loadPlanById, createPlan, updatePlan, deletePlan,
    loadLogs, fetchLogById, createLog, updateLog,
    clearError,
  };
}
