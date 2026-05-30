-- Create MealRecord table
CREATE TABLE IF NOT EXISTS MealRecord (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id TEXT NOT NULL,
  date INTEGER NOT NULL,
  meal_type TEXT NOT NULL,
  food_item_id TEXT NOT NULL,
  quantity_grams REAL NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  FOREIGN KEY (user_id) REFERENCES User(id) ON DELETE CASCADE,
  FOREIGN KEY (food_item_id) REFERENCES FoodItem(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_meal_records_user_id ON MealRecord(user_id);
CREATE INDEX IF NOT EXISTS idx_meal_records_date ON MealRecord(date);
CREATE INDEX IF NOT EXISTS idx_meal_records_food_item_id ON MealRecord(food_item_id);
