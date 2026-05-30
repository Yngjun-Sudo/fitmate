-- 0009_create_meal_records.sql
CREATE TABLE IF NOT EXISTS meal_records (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  date INTEGER NOT NULL,
  meal_type TEXT NOT NULL,
  food_item_id TEXT NOT NULL,
  quantity_grams REAL NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (food_item_id) REFERENCES food_items(id)
);

CREATE INDEX IF NOT EXISTS idx_meal_records_user_id ON meal_records(user_id);
CREATE INDEX IF NOT EXISTS idx_meal_records_date ON meal_records(date);