-- 0004_create_workout_plan_exercises.sql
CREATE TABLE IF NOT EXISTS workout_plan_exercises (
  id TEXT PRIMARY KEY,
  plan_id TEXT NOT NULL,
  exercise_id TEXT NOT NULL,
  day_of_week INTEGER NOT NULL DEFAULT 0,
  sets INTEGER NOT NULL DEFAULT 3,
  reps INTEGER NOT NULL DEFAULT 10,
  duration_seconds INTEGER NOT NULL DEFAULT 0,
  rest_seconds INTEGER NOT NULL DEFAULT 60,
  sort_order INTEGER NOT NULL DEFAULT 0,
  notes TEXT NOT NULL DEFAULT '',
  FOREIGN KEY (plan_id) REFERENCES workout_plans(id) ON DELETE CASCADE,
  FOREIGN KEY (exercise_id) REFERENCES exercises(id)
);

CREATE INDEX IF NOT EXISTS idx_workout_plan_exercises_plan_id ON workout_plan_exercises(plan_id);