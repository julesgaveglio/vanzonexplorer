-- Migration: Ajouter les colonnes de tracking Gmail et reply detection à backlink_outreach
-- Date: 2026-04-04

ALTER TABLE backlink_outreach
  ADD COLUMN IF NOT EXISTS gmail_message_id text,
  ADD COLUMN IF NOT EXISTS gmail_thread_id text,
  ADD COLUMN IF NOT EXISTS reply_body text,
  ADD COLUMN IF NOT EXISTS reply_sentiment text CHECK (reply_sentiment IN ('positif', 'negatif', 'neutre')),
  ADD COLUMN IF NOT EXISTS reply_detected_at timestamptz,
  ADD COLUMN IF NOT EXISTS follow_up_count integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_follow_up_at timestamptz;

-- Index pour les requêtes de l'agent daily
CREATE INDEX IF NOT EXISTS idx_outreach_reply_pending
  ON backlink_outreach (sent_at, gmail_thread_id, reply_detected_at)
  WHERE sent_at IS NOT NULL AND gmail_thread_id IS NOT NULL AND reply_detected_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_outreach_followup_eligible
  ON backlink_outreach (sent_at, follow_up_count, reply_detected_at)
  WHERE sent_at IS NOT NULL AND reply_detected_at IS NULL;
