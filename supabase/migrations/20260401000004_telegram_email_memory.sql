CREATE TABLE IF NOT EXISTS telegram_email_memory (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action_type TEXT NOT NULL,
  context     JSONB NOT NULL DEFAULT '{}',
  subject     TEXT NOT NULL,
  body        TEXT NOT NULL,
  approved_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_email_memory_type
  ON telegram_email_memory(action_type, approved_at DESC);
