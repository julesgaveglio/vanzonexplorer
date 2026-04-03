-- Ajout déduplication et traçabilité source pour telegram_email_memory
ALTER TABLE telegram_email_memory
  ADD COLUMN IF NOT EXISTS message_id TEXT,
  ADD COLUMN IF NOT EXISTS source     TEXT DEFAULT 'telegram';

-- Contrainte unique sur message_id (nullable — les anciennes lignes restent sans valeur)
CREATE UNIQUE INDEX IF NOT EXISTS idx_email_memory_message_id
  ON telegram_email_memory(message_id)
  WHERE message_id IS NOT NULL;
