-- 0008_create_food_items.sql
CREATE TABLE IF NOT EXISTS food_items (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  calories_per_100g REAL NOT NULL DEFAULT 0,
  protein_per_100g REAL NOT NULL DEFAULT 0,
  carbs_per_100g REAL NOT NULL DEFAULT 0,
  fat_per_100g REAL NOT NULL DEFAULT 0,
  serving_size REAL NOT NULL DEFAULT 100,
  serving_unit TEXT NOT NULL DEFAULT 'g',
  is_custom INTEGER NOT NULL DEFAULT 0,
  created_by_user_id TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  FOREIGN KEY (created_by_user_id) REFERENCES users(id)
);