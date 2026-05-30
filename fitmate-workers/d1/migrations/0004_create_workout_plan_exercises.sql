-- Create WorkoutPlanExercise table
CREATE TABLE IF NOT EXISTS WorkoutPlanExercise (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  plan_id TEXT NOT NULL,
  exercise_id TEXT NOT NULL,
  day_of_week INTEGER NOT NULL DEFAULT 0,
  sets INTEGER NOT NULL DEFAULT 3,
  reps INTEGER NOT NULL DEFAULT 10,
  duration_seconds INTEGER NOT NULL DEFAULT 0,
  rest_seconds INTEGER NOT NULL DEFAULT 60,
  sort_order INTEGER NOT NULL DEFAULT 0,
  notes TEXT NOT NULL DEFAULT '',
  FOREIGN KEY (plan_id) REFERENCES WorkoutPlan(id) ON DELETE CASCADE,
  FOREIGN KEY (exercise_id) REFERENCES Exercise(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_workout_plan_exercises_plan_id ON WorkoutPlanExercise(plan_id);
CREATE INDEX IF NOT EXISTS idx_workout_plan_exercises_exercise_id ON WorkoutPlanExercise(exercise_id);
