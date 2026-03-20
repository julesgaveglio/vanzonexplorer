-- supabase/migrations/20260320000002_email_unsubscribes.sql

CREATE TABLE IF NOT EXISTS email_unsubscribes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE email_unsubscribes ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_email_unsubscribes_email ON email_unsubscribes(email);
