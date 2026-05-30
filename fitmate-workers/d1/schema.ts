import { sqliteTable, text, real, integer, foreignKey } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

// User table
export const users = sqliteTable('User', {
  id: text('id').primaryKey().default(sql`(lower(hex(randomblob(16))))`),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  name: text('name').notNull(),
  heightCm: real('height_cm'),
  weightKg: real('weight_kg'),
  birthDate: integer('birth_date'),
  gender: text('gender'),
  goal: text('goal'),
  activityLevel: text('activity_level'),
  createdAt: integer('created_at').notNull().default(sql`(unixepoch())`),
  updatedAt: integer('updated_at').notNull(),
}, (table) => ({
  emailIdx: sql`CREATE INDEX IF NOT EXISTS idx_users_email ON User(email)`,
}));

// Exercise table
export const exercises = sqliteTable('Exercise', {
  id: text('id').primaryKey().default(sql`(lower(hex(randomblob(16))))`),
  name: text('name').notNull(),
  description: text('description').notNull().default(''),
  category: text('category').notNull(),
  muscleGroup: text('muscle_group').notNull(),
  equipment: text('equipment').notNull().default(''),
  difficulty: text('difficulty').notNull().default('beginner'),
  instructions: text('instructions').notNull().default(''),
  imageUrl: text('image_url').notNull().default(''),
  createdAt: integer('created_at').notNull().default(sql`(unixepoch())`),
});

// WorkoutPlan table
export const workoutPlans = sqliteTable('WorkoutPlan', {
  id: text('id').primaryKey().default(sql`(lower(hex(randomblob(16))))`),
  userId: text('user_id').notNull(),
  name: text('name').notNull(),
  description: text('description').notNull().default(''),
  isTemplate: integer('is_template').notNull().default(0),
  createdAt: integer('created_at').notNull().default(sql`(unixepoch())`),
  updatedAt: integer('updated_at').notNull(),
}, (table) => ({
  userIdFk: foreignKey({
    columns: [table.userId],
    foreignColumns: [users.id],
  }).onDelete('cascade'),
}));

// WorkoutPlanExercise table
export const workoutPlanExercises = sqliteTable('WorkoutPlanExercise', {
  id: text('id').primaryKey().default(sql`(lower(hex(randomblob(16))))`),
  planId: text('plan_id').notNull(),
  exerciseId: text('exercise_id').notNull(),
  dayOfWeek: integer('day_of_week').notNull().default(0),
  sets: integer('sets').notNull().default(3),
  reps: integer('reps').notNull().default(10),
  durationSeconds: integer('duration_seconds').notNull().default(0),
  restSeconds: integer('rest_seconds').notNull().default(60),
  sortOrder: integer('sort_order').notNull().default(0),
  notes: text('notes').notNull().default(''),
}, (table) => ({
  planIdFk: foreignKey({
    columns: [table.planId],
    foreignColumns: [workoutPlans.id],
  }).onDelete('cascade'),
  exerciseIdFk: foreignKey({
    columns: [table.exerciseId],
    foreignColumns: [exercises.id],
  }).onDelete('cascade'),
}));

// WorkoutLog table
export const workoutLogs = sqliteTable('WorkoutLog', {
  id: text('id').primaryKey().default(sql`(lower(hex(randomblob(16))))`),
  userId: text('user_id').notNull(),
  planId: text('plan_id'),
  date: integer('date').notNull(),
  durationMinutes: integer('duration_minutes').notNull().default(0),
  notes: text('notes').notNull().default(''),
  createdAt: integer('created_at').notNull().default(sql`(unixepoch())`),
}, (table) => ({
  userIdFk: foreignKey({
    columns: [table.userId],
    foreignColumns: [users.id],
  }).onDelete('cascade'),
  planIdFk: foreignKey({
    columns: [table.planId],
    foreignColumns: [workoutPlans.id],
  }).onDelete('set null'),
}));

// WorkoutLogExercise table
export const workoutLogExercises = sqliteTable('WorkoutLogExercise', {
  id: text('id').primaryKey().default(sql`(lower(hex(randomblob(16))))`),
  logId: text('log_id').notNull(),
  exerciseId: text('exercise_id').notNull(),
  notes: text('notes').notNull().default(''),
}, (table) => ({
  logIdFk: foreignKey({
    columns: [table.logId],
    foreignColumns: [workoutLogs.id],
  }).onDelete('cascade'),
  exerciseIdFk: foreignKey({
    columns: [table.exerciseId],
    foreignColumns: [exercises.id],
  }).onDelete('cascade'),
}));

// WorkoutLogSet table
export const workoutLogSets = sqliteTable('WorkoutLogSet', {
  id: text('id').primaryKey().default(sql`(lower(hex(randomblob(16))))`),
  logExerciseId: text('log_exercise_id').notNull(),
  setNumber: integer('set_number').notNull(),
  reps: integer('reps').notNull(),
  weightKg: real('weight_kg').notNull().default(0),
}, (table) => ({
  logExerciseIdFk: foreignKey({
    columns: [table.logExerciseId],
    foreignColumns: [workoutLogExercises.id],
  }).onDelete('cascade'),
}));

// FoodItem table
export const foodItems = sqliteTable('FoodItem', {
  id: text('id').primaryKey().default(sql`(lower(hex(randomblob(16))))`),
  name: text('name').notNull(),
  caloriesPer100g: real('calories_per_100g').notNull().default(0),
  proteinPer100g: real('protein_per_100g').notNull().default(0),
  carbsPer100g: real('carbs_per_100g').notNull().default(0),
  fatPer100g: real('fat_per_100g').notNull().default(0),
  servingSize: real('serving_size').notNull().default(100),
  servingUnit: text('serving_unit').notNull().default('g'),
  isCustom: integer('is_custom').notNull().default(0),
  createdByUserId: text('created_by_user_id'),
  createdAt: integer('created_at').notNull().default(sql`(unixepoch())`),
}, (table) => ({
  createdByFk: foreignKey({
    columns: [table.createdByUserId],
    foreignColumns: [users.id],
  }).onDelete('set null'),
}));

// MealRecord table
export const mealRecords = sqliteTable('MealRecord', {
  id: text('id').primaryKey().default(sql`(lower(hex(randomblob(16))))`),
  userId: text('user_id').notNull(),
  date: integer('date').notNull(),
  mealType: text('meal_type').notNull(),
  foodItemId: text('food_item_id').notNull(),
  quantityGrams: real('quantity_grams').notNull().default(0),
  createdAt: integer('created_at').notNull().default(sql`(unixepoch())`),
}, (table) => ({
  userIdFk: foreignKey({
    columns: [table.userId],
    foreignColumns: [users.id],
  }).onDelete('cascade'),
  foodItemIdFk: foreignKey({
    columns: [table.foodItemId],
    foreignColumns: [foodItems.id],
  }).onDelete('cascade'),
}));

// ChatSession table
export const chatSessions = sqliteTable('ChatSession', {
  id: text('id').primaryKey().default(sql`(lower(hex(randomblob(16))))`),
  userId: text('user_id').notNull(),
  title: text('title').notNull().default('新对话'),
  createdAt: integer('created_at').notNull().default(sql`(unixepoch())`),
  updatedAt: integer('updated_at').notNull(),
}, (table) => ({
  userIdFk: foreignKey({
    columns: [table.userId],
    foreignColumns: [users.id],
  }).onDelete('cascade'),
}));

// ChatMessage table
export const chatMessages = sqliteTable('ChatMessage', {
  id: text('id').primaryKey().default(sql`(lower(hex(randomblob(16))))`),
  sessionId: text('session_id').notNull(),
  role: text('role').notNull(),
  content: text('content').notNull(),
  createdAt: integer('created_at').notNull().default(sql`(unixepoch())`),
}, (table) => ({
  sessionIdFk: foreignKey({
    columns: [table.sessionId],
    foreignColumns: [chatSessions.id],
  }).onDelete('cascade'),
}));

// Type exports
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Exercise = typeof exercises.$inferSelect;
export type NewExercise = typeof exercises.$inferInsert;
export type WorkoutPlan = typeof workoutPlans.$inferSelect;
export type NewWorkoutPlan = typeof workoutPlans.$inferInsert;
export type WorkoutPlanExercise = typeof workoutPlanExercises.$inferSelect;
export type NewWorkoutPlanExercise = typeof workoutPlanExercises.$inferInsert;
export type WorkoutLog = typeof workoutLogs.$inferSelect;
export type NewWorkoutLog = typeof workoutLogs.$inferInsert;
export type WorkoutLogExercise = typeof workoutLogExercises.$inferSelect;
export type NewWorkoutLogExercise = typeof workoutLogExercises.$inferInsert;
export type WorkoutLogSet = typeof workoutLogSets.$inferSelect;
export type NewWorkoutLogSet = typeof workoutLogSets.$inferInsert;
export type FoodItem = typeof foodItems.$inferSelect;
export type NewFoodItem = typeof foodItems.$inferInsert;
export type MealRecord = typeof mealRecords.$inferSelect;
export type NewMealRecord = typeof mealRecords.$inferInsert;
export type ChatSession = typeof chatSessions.$inferSelect;
export type NewChatSession = typeof chatSessions.$inferInsert;
export type ChatMessage = typeof chatMessages.$inferSelect;
export type NewChatMessage = typeof chatMessages.$inferInsert;
