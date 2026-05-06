-- Email click tracking (CTA clicks from broadcast emails)
CREATE TABLE IF NOT EXISTS email_clicks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  campaign_name TEXT NOT NULL,
  clicked_url TEXT,
  clicked_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE email_clicks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "email_clicks_public_read" ON email_clicks FOR SELECT USING (true);
CREATE INDEX IF NOT EXISTS idx_email_clicks_email ON email_clicks(email);
