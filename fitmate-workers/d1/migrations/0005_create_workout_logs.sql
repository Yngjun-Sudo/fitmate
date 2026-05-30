-- Create WorkoutLog table
CREATE TABLE IF NOT EXISTS WorkoutLog (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id TEXT NOT NULL,
  plan_id TEXT,
  date INTEGER NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 0,
  notes TEXT NOT NULL DEFAULT '',
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  FOREIGN KEY (user_id) REFERENCES User(id) ON DELETE CASCADE,
  FOREIGN KEY (plan_id) REFERENCES WorkoutPlan(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_workout_logs_user_id ON WorkoutLog(user_id);
CREATE INDEX IF NOT EXISTS idx_workout_logs_date ON WorkoutLog(date);
