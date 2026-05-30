import { sqliteTable, text, real, integer, index } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';
// === Users 表 ===
export const users = sqliteTable('users', {
    id: text('id').primaryKey(),
    email: text('email').notNull().unique(),
    passwordHash: text('password_hash').notNull(),
    name: text('name').notNull(),
    heightCm: real('height_cm'),
    weightKg: real('weight_kg'),
    birthDate: integer('birth_date', { mode: 'timestamp' }),
    gender: text('gender'),
    goal: text('goal'),
    activityLevel: text('activity_level'),
    createdAt: integer('created_at', { mode: 'timestamp' }).default(sql `(unixepoch())`),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).default(sql `(unixepoch())`),
}, (table) => ({
    emailIdx: index('idx_users_email').on(table.email),
}));
// === Exercises 表 ===
export const exercises = sqliteTable('exercises', {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    description: text('description').notNull().default(''),
    category: text('category').notNull(),
    muscleGroup: text('muscle_group').notNull(),
    equipment: text('equipment').notNull().default(''),
    difficulty: text('difficulty').notNull().default('beginner'),
    instructions: text('instructions').notNull().default(''),
    imageUrl: text('image_url').notNull().default(''),
    createdAt: integer('created_at', { mode: 'timestamp' }).default(sql `(unixepoch())`),
}, (table) => ({
    nameIdx: index('idx_exercises_name').on(table.name),
    categoryIdx: index('idx_exercises_category').on(table.category),
}));
// === Workout Plans 表 ===
export const workoutPlans = sqliteTable('workout_plans', {
    id: text('id').primaryKey(),
    userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    description: text('description').notNull().default(''),
    isTemplate: integer('is_template', { mode: 'boolean' }).notNull().default(false),
    createdAt: integer('created_at', { mode: 'timestamp' }).default(sql `(unixepoch())`),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).default(sql `(unixepoch())`),
}, (table) => ({
    userIdIdx: index('idx_workout_plans_user_id').on(table.userId),
}));
// === Workout Plan Exercises 表 ===
export const workoutPlanExercises = sqliteTable('workout_plan_exercises', {
    id: text('id').primaryKey(),
    planId: text('plan_id').notNull().references(() => workoutPlans.id, { onDelete: 'cascade' }),
    exerciseId: text('exercise_id').notNull().references(() => exercises.id),
    dayOfWeek: integer('day_of_week').notNull().default(0),
    sets: integer('sets').notNull().default(3),
    reps: integer('reps').notNull().default(10),
    durationSeconds: integer('duration_seconds').notNull().default(0),
    restSeconds: integer('rest_seconds').notNull().default(60),
    sortOrder: integer('sort_order').notNull().default(0),
    notes: text('notes').notNull().default(''),
}, (table) => ({
    planIdIdx: index('idx_workout_plan_exercises_plan_id').on(table.planId),
}));
// === Workout Logs 表 ===
export const workoutLogs = sqliteTable('workout_logs', {
    id: text('id').primaryKey(),
    userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    planId: text('plan_id').references(() => workoutPlans.id, { onDelete: 'set null' }),
    date: integer('date', { mode: 'timestamp' }).notNull(),
    durationMinutes: integer('duration_minutes').notNull().default(0),
    notes: text('notes').notNull().default(''),
    createdAt: integer('created_at', { mode: 'timestamp' }).default(sql `(unixepoch())`),
}, (table) => ({
    userIdIdx: index('idx_workout_logs_user_id').on(table.userId),
    dateIdx: index('idx_workout_logs_date').on(table.date),
}));
// === Workout Log Exercises 表 ===
export const workoutLogExercises = sqliteTable('workout_log_exercises', {
    id: text('id').primaryKey(),
    logId: text('log_id').notNull().references(() => workoutLogs.id, { onDelete: 'cascade' }),
    exerciseId: text('exercise_id').notNull().references(() => exercises.id),
    notes: text('notes').notNull().default(''),
});
// === Workout Log Sets 表 ===
export const workoutLogSets = sqliteTable('workout_log_sets', {
    id: text('id').primaryKey(),
    logExerciseId: text('log_exercise_id').notNull().references(() => workoutLogExercises.id, { onDelete: 'cascade' }),
    setNumber: integer('set_number').notNull(),
    reps: integer('reps').notNull(),
    weightKg: real('weight_kg').notNull().default(0),
});
// === Food Items 表 ===
export const foodItems = sqliteTable('food_items', {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    caloriesPer100g: real('calories_per_100g').notNull().default(0),
    proteinPer100g: real('protein_per_100g').notNull().default(0),
    carbsPer100g: real('carbs_per_100g').notNull().default(0),
    fatPer100g: real('fat_per_100g').notNull().default(0),
    servingSize: real('serving_size').notNull().default(100),
    servingUnit: text('serving_unit').notNull().default('g'),
    isCustom: integer('is_custom', { mode: 'boolean' }).notNull().default(false),
    createdByUserId: text('created_by_user_id').references(() => users.id),
    createdAt: integer('created_at', { mode: 'timestamp' }).default(sql `(unixepoch())`),
});
// === Meal Records 表 ===
export const mealRecords = sqliteTable('meal_records', {
    id: text('id').primaryKey(),
    userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    date: integer('date', { mode: 'timestamp' }).notNull(),
    mealType: text('meal_type').notNull(),
    foodItemId: text('food_item_id').notNull().references(() => foodItems.id),
    quantityGrams: real('quantity_grams').notNull().default(0),
    createdAt: integer('created_at', { mode: 'timestamp' }).default(sql `(unixepoch())`),
}, (table) => ({
    userIdIdx: index('idx_meal_records_user_id').on(table.userId),
    dateIdx: index('idx_meal_records_date').on(table.date),
}));
// === Chat Sessions 表 ===
export const chatSessions = sqliteTable('chat_sessions', {
    id: text('id').primaryKey(),
    userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    title: text('title').notNull().default('新对话'),
    createdAt: integer('created_at', { mode: 'timestamp' }).default(sql `(unixepoch())`),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).default(sql `(unixepoch())`),
}, (table) => ({
    userIdIdx: index('idx_chat_sessions_user_id').on(table.userId),
}));
// === Chat Messages 表 ===
export const chatMessages = sqliteTable('chat_messages', {
    id: text('id').primaryKey(),
    sessionId: text('session_id').notNull().references(() => chatSessions.id, { onDelete: 'cascade' }),
    role: text('role').notNull(),
    content: text('content').notNull(),
    createdAt: integer('created_at', { mode: 'timestamp' }).default(sql `(unixepoch())`),
}, (table) => ({
    sessionIdIdx: index('idx_chat_messages_session_id').on(table.sessionId),
}));
