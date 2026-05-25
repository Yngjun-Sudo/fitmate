import { create } from 'zustand';
import type { WorkoutPlan, WorkoutLog, Exercise, PaginatedResponse } from '../types';
import * as workoutApi from '../api/workouts';
import * as exerciseApi from '../api/exercises';

interface WorkoutState {
  plans: WorkoutPlan[];
  currentPlan: WorkoutPlan | null;
  logs: WorkoutLog[];
  exercises: Exercise[];
  exerciseTotal: number;
  isLoading: boolean;
  error: string | null;

  // 计划
  fetchPlans: () => Promise<void>;
  fetchPlanById: (id: string) => Promise<void>;
  createPlan: (data: Parameters<typeof workoutApi.createWorkoutPlan>[0]) => Promise<WorkoutPlan>;
  updatePlan: (id: string, data: Parameters<typeof workoutApi.updateWorkoutPlan>[1]) => Promise<void>;
  deletePlan: (id: string) => Promise<void>;

  // 记录
  fetchLogs: (params?: Parameters<typeof workoutApi.getWorkoutLogs>[0]) => Promise<void>;
  fetchLogById: (id: string) => Promise<WorkoutLog>;
  createLog: (data: Parameters<typeof workoutApi.createWorkoutLog>[0]) => Promise<WorkoutLog>;
  updateLog: (id: string, data: Parameters<typeof workoutApi.updateWorkoutLog>[1]) => Promise<void>;

  // 动作
  fetchExercises: (params?: Parameters<typeof exerciseApi.getExercises>[0]) => Promise<void>;

  clearError: () => void;
}

export const useWorkoutStore = create<WorkoutState>((set, get) => ({
  plans: [],
  currentPlan: null,
  logs: [],
  exercises: [],
  exerciseTotal: 0,
  isLoading: false,
  error: null,

  fetchPlans: async () => {
    set({ isLoading: true, error: null });
    try {
      const plans = await workoutApi.getWorkoutPlans();
      set({ plans, isLoading: false });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '加载失败';
      set({ error: msg, isLoading: false });
    }
  },

  fetchPlanById: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const plan = await workoutApi.getWorkoutPlanById(id);
      set({ currentPlan: plan, isLoading: false });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '加载失败';
      set({ error: msg, isLoading: false });
    }
  },

  createPlan: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const plan = await workoutApi.createWorkoutPlan(data);
      set((s) => ({ plans: [plan, ...s.plans], isLoading: false }));
      return plan;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '创建失败';
      set({ error: msg, isLoading: false });
      throw err;
    }
  },

  updatePlan: async (id, data) => {
    set({ isLoading: true, error: null });
    try {
      const updated = await workoutApi.updateWorkoutPlan(id, data);
      set((s) => ({
        plans: s.plans.map((p) => (p.id === id ? updated : p)),
        currentPlan: s.currentPlan?.id === id ? updated : s.currentPlan,
        isLoading: false,
      }));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '更新失败';
      set({ error: msg, isLoading: false });
      throw err;
    }
  },

  deletePlan: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await workoutApi.deleteWorkoutPlan(id);
      set((s) => ({
        plans: s.plans.filter((p) => p.id !== id),
        currentPlan: s.currentPlan?.id === id ? null : s.currentPlan,
        isLoading: false,
      }));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '删除失败';
      set({ error: msg, isLoading: false });
      throw err;
    }
  },

  fetchLogs: async (params) => {
    set({ isLoading: true, error: null });
    try {
      const result = await workoutApi.getWorkoutLogs(params);
      set({ logs: result.items, isLoading: false });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '加载训练记录失败';
      set({ error: msg, isLoading: false });
    }
  },

  fetchLogById: async (id) => {
    try {
      return await workoutApi.getWorkoutLogById(id);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '加载记录失败';
      set({ error: msg });
      throw err;
    }
  },

  createLog: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const log = await workoutApi.createWorkoutLog(data);
      set((s) => ({ logs: [log, ...s.logs], isLoading: false }));
      return log;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '保存失败';
      set({ error: msg, isLoading: false });
      throw err;
    }
  },

  updateLog: async (id, data) => {
    set({ isLoading: true, error: null });
    try {
      const updated = await workoutApi.updateWorkoutLog(id, data);
      set((s) => ({
        logs: s.logs.map((l) => (l.id === id ? updated : l)),
        isLoading: false,
      }));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '更新失败';
      set({ error: msg, isLoading: false });
      throw err;
    }
  },

  fetchExercises: async (params) => {
    set({ isLoading: true, error: null });
    try {
      const result = await exerciseApi.getExercises(params);
      set({ exercises: result.items, exerciseTotal: result.total, isLoading: false });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '加载动作失败';
      set({ error: msg, isLoading: false });
    }
  },

  clearError: () => set({ error: null }),
}));
