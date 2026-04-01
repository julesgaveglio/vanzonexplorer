-- supabase/migrations/20260401000003_telegram_pending_actions.sql
CREATE TABLE IF NOT EXISTS telegram_pending_actions (
  id          TEXT PRIMARY KEY,
  chat_id     BIGINT NOT NULL,
  action      TEXT NOT NULL,
  state       TEXT NOT NULL DEFAULT 'awaiting_confirmation',
  payload     JSONB NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  expires_at  TIMESTAMPTZ DEFAULT NOW() + INTERVAL '10 minutes'
);

CREATE INDEX IF NOT EXISTS idx_telegram_pending_chat
  ON telegram_pending_actions(chat_id);

COMMENT ON TABLE telegram_pending_actions IS
  'Actions Telegram en attente de confirmation (TTL 10 min). States: awaiting_confirmation | awaiting_edit | awaiting_selection';
