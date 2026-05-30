-- Create User table
CREATE TABLE IF NOT EXISTS User (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  height_cm REAL,
  weight_kg REAL,
  birth_date INTEGER,
  gender TEXT,
  goal TEXT,
  activity_level TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_users_email ON User(email);
