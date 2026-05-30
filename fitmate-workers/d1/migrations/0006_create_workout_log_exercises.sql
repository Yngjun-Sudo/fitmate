-- Create WorkoutLogExercise table
CREATE TABLE IF NOT EXISTS WorkoutLogExercise (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  log_id TEXT NOT NULL,
  exercise_id TEXT NOT NULL,
  notes TEXT NOT NULL DEFAULT '',
  FOREIGN KEY (log_id) REFERENCES WorkoutLog(id) ON DELETE CASCADE,
  FOREIGN KEY (exercise_id) REFERENCES Exercise(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_workout_log_exercises_log_id ON WorkoutLogExercise(log_id);
CREATE INDEX IF NOT EXISTS idx_workout_log_exercises_exercise_id ON WorkoutLogExercise(exercise_id);
