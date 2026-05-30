-- Create ChatMessage table
CREATE TABLE IF NOT EXISTS ChatMessage (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  session_id TEXT NOT NULL,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  FOREIGN KEY (session_id) REFERENCES ChatSession(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON ChatMessage(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON ChatMessage(created_at);
