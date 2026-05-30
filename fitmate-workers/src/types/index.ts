// Type definitions for FitMate Workers
// Adapted from original fitmate/server/src/types/index.ts
// Key changes: Date → number (Unix timestamp), boolean → number (0/1)

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  heightCm?: number;
  weightKg?: number;
  birthDate?: number;
  gender?: string;
  goal?: string;
  activityLevel?: string;
  createdAt: number;
  updatedAt: number;
}

export interface Exercise {
  id: string;
  name: string;
  description: string;
  category: string;
  muscleGroup: string;
  equipment: string;
  difficulty: string;
  instructions: string;
  imageUrl: string;
  createdAt: number;
}

export interface WorkoutPlan {
  id: string;
  userId: string;
  name: string;
  description: string;
  isTemplate: number;
  createdAt: number;
  updatedAt: number;
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

export interface WorkoutLog {
  id: string;
  userId: string;
  planId?: string;
  date: number;
  durationMinutes: number;
  notes: string;
  createdAt: number;
  exercises?: WorkoutLogExercise[];
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

export interface FoodItem {
  id: string;
  name: string;
  caloriesPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
  servingSize: number;
  servingUnit: string;
  isCustom: number;
  createdByUserId?: string;
  createdAt: number;
}

export interface MealRecord {
  id: string;
  userId: string;
  date: number;
  mealType: string;
  foodItemId: string;
  quantityGrams: number;
  createdAt: number;
  foodItem?: FoodItem;
}

export interface ChatSession {
  id: string;
  userId: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages?: ChatMessage[];
}

export interface ChatMessage {
  id: string;
  sessionId: string;
  role: string;
  content: string;
  createdAt: number;
}

// Request types
export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  heightCm?: number;
  weightKg?: number;
  birthDate?: number;
  gender?: string;
  goal?: string;
  activityLevel?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface CreateWorkoutPlanRequest {
  name: string;
  description?: string;
  isTemplate?: number;
  exercises?: Omit<WorkoutPlanExercise, 'id' | 'planId'>[];
}

export interface LogWorkoutRequest {
  planId?: string;
  date: number;
  durationMinutes?: number;
  notes?: string;
  exercises: Array<{
    exerciseId: string;
    notes?: string;
    sets: Omit<WorkoutLogSet, 'id' | 'logExerciseId' | 'setNumber'>[];
  }>;
}

export interface CreateMealRecordRequest {
  date: number;
  mealType: string;
  foodItemId: string;
  quantityGrams: number;
}

export interface CreateFoodItemRequest {
  name: string;
  caloriesPer100g?: number;
  proteinPer100g?: number;
  carbsPer100g?: number;
  fatPer100g?: number;
  servingSize?: number;
  servingUnit?: string;
}

export interface ChatMessageRequest {
  content: string;
}

// Response types
export interface ApiResponse<T> {
  code: number;
  data: T;
  message: string;
}

export interface AuthResponse {
  token: string;
  user: Omit<User, 'passwordHash'>;
}

// JWT Payload
export interface JwtPayload {
  userId: string;
  email: string;
}
