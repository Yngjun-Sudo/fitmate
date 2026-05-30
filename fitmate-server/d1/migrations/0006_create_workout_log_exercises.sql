-- 0006_create_workout_log_exercises.sql
CREATE TABLE IF NOT EXISTS workout_log_exercises (
  id TEXT PRIMARY KEY,
  log_id TEXT NOT NULL,
  exercise_id TEXT NOT NULL,
  notes TEXT NOT NULL DEFAULT '',
  FOREIGN KEY (log_id) REFERENCES workout_logs(id) ON DELETE CASCADE,
  FOREIGN KEY (exercise_id) REFERENCES exercises(id)
);