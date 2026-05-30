-- Create FoodItem table
CREATE TABLE IF NOT EXISTS FoodItem (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
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
  FOREIGN KEY (created_by_user_id) REFERENCES User(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_food_items_name ON FoodItem(name);
CREATE INDEX IF NOT EXISTS idx_food_items_is_custom ON FoodItem(is_custom);
