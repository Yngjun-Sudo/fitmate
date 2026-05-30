-- 0007_create_workout_log_sets.sql
CREATE TABLE IF NOT EXISTS workout_log_sets (
  id TEXT PRIMARY KEY,
  log_exercise_id TEXT NOT NULL,
  set_number INTEGER NOT NULL,
  reps INTEGER NOT NULL,
  weight_kg REAL NOT NULL DEFAULT 0,
  FOREIGN KEY (log_exercise_id) REFERENCES workout_log_exercises(id) ON DELETE CASCADE
);