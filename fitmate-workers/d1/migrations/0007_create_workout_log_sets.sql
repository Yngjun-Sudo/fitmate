-- Create WorkoutLogSet table
CREATE TABLE IF NOT EXISTS WorkoutLogSet (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  log_exercise_id TEXT NOT NULL,
  set_number INTEGER NOT NULL,
  reps INTEGER NOT NULL,
  weight_kg REAL NOT NULL DEFAULT 0,
  FOREIGN KEY (log_exercise_id) REFERENCES WorkoutLogExercise(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_workout_log_sets_log_exercise_id ON WorkoutLogSet(log_exercise_id);
