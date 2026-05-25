// === 枚举类型 ===
export type Gender = 'male' | 'female' | 'other';
export type Goal = 'lose_fat' | 'build_muscle' | 'maintain' | 'general_fitness';
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';
export type ExerciseCategory = 'chest' | 'back' | 'shoulders' | 'legs' | 'arms' | 'core' | 'full_body';
export type Difficulty = 'beginner' | 'intermediate' | 'advanced';

// === API 响应 ===
export interface ApiResponse<T = unknown> {
  code: number;
  data: T | null;
  message: string;
}

// === 用户 ===
export interface User {
  id: string;
  email: string;
  name: string;
  heightCm: number | null;
  weightKg: number | null;
  birthDate: string | null;
  gender: Gender | null;
  goal: Goal | null;
  activityLevel: ActivityLevel | null;
  createdAt: string;
  updatedAt?: string;
}

// === 认证 ===
export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput {
  email: string;
  password: string;
  name: string;
}

export interface UpdateProfileInput {
  name?: string;
  heightCm?: number;
  weightKg?: number;
  birthDate?: string;
  gender?: Gender;
  goal?: Goal;
  activityLevel?: ActivityLevel;
}

export interface AuthResult {
  user: User;
  token: string;
}

// === 训练动作 ===
export interface Exercise {
  id: string;
  name: string;
  description: string;
  category: ExerciseCategory;
  muscleGroup: string;
  equipment: string;
  difficulty: Difficulty;
  instructions: string;
  imageUrl: string;
  createdAt: string;
}

// === 训练计划 ===
export interface WorkoutPlan {
  id: string;
  userId: string;
  name: string;
  description: string;
  isTemplate: boolean;
  createdAt: string;
  updatedAt: string;
  exercises?: WorkoutPlanExercise[];
}

export interface WorkoutPlanExercise {
  id: string;
  planId: string;
  exerciseId: string;
  dayOfWeek: number;
  sets: number;
  reps: number;
  durationSeconds: number;
  restSeconds: number;
  sortOrder: number;
  notes: string;
  exercise?: Exercise;
}

export interface CreateWorkoutPlanInput {
  name: string;
  description?: string;
  exercises: {
    exerciseId: string;
    dayOfWeek: number;
    sets: number;
    reps: number;
    durationSeconds?: number;
    restSeconds?: number;
    sortOrder?: number;
    notes?: string;
  }[];
}

// === 训练记录 ===
export interface WorkoutLog {
  id: string;
  userId: string;
  planId: string | null;
  date: string;
  durationMinutes: number;
  notes: string;
  createdAt: string;
  exercises?: WorkoutLogExercise[];
  plan?: WorkoutPlan;
}

export interface WorkoutLogExercise {
  id: string;
  logId: string;
  exerciseId: string;
  notes: string;
  exercise?: Exercise;
  sets?: WorkoutLogSet[];
}

export interface WorkoutLogSet {
  id: string;
  logExerciseId: string;
  setNumber: number;
  reps: number;
  weightKg: number;
}

export interface CreateWorkoutLogInput {
  planId?: string;
  date: string;
  durationMinutes?: number;
  notes?: string;
  exercises: {
    exerciseId: string;
    notes?: string;
    sets: { setNumber: number; reps: number; weightKg: number }[];
  }[];
}

// === 饮食 ===
export interface FoodItem {
  id: string;
  name: string;
  caloriesPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
  servingSize: number;
  servingUnit: string;
  isCustom: boolean;
  createdAt: string;
}

export interface MealRecord {
  id: string;
  userId: string;
  date: string;
  mealType: MealType;
  foodItemId: string;
  quantityGrams: number;
  createdAt: string;
  foodItem?: FoodItem;
}

export interface CreateMealRecordInput {
  foodItemId: string;
  quantityGrams: number;
  mealType: MealType;
  date: string;
}

export interface TDEECalcInput {
  gender: Gender;
  weightKg: number;
  heightCm: number;
  age: number;
  activityLevel: ActivityLevel;
  goal: Goal;
}

export interface TDEEResult {
  bmr: number;
  tdee: number;
  targetCalories: number;
  proteinGrams: number;
  carbsGrams: number;
  fatGrams: number;
}

// === AI 对话 ===
export interface ChatSession {
  id: string;
  userId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  id: string;
  sessionId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: string;
}

// === 分页 ===
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
