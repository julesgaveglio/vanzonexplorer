-- Reservations table
-- Stores rental booking data parsed from Yescapa/Wikicampers Gmail confirmation emails
-- Used by WhatsApp automation (pre/post trip messages) and admin dashboard

CREATE TABLE IF NOT EXISTS reservations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  platform TEXT NOT NULL CHECK (platform IN ('yescapa', 'wikicampers')),
  platform_ref TEXT NOT NULL,
  client_name TEXT,
  client_phone TEXT,
  client_email TEXT,
  van_name TEXT,
  start_date DATE,
  end_date DATE,
  revenue DECIMAL(10,2),
  status TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'in_progress', 'completed', 'cancelled')),
  destination TEXT,
  travelers_count INTEGER,
  insurance TEXT,
  km_included TEXT,
  gmail_thread_id TEXT,
  gmail_message_id TEXT,
  whatsapp_pre_sent_at TIMESTAMPTZ,
  whatsapp_post_sent_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Unique constraint to prevent duplicate imports
CREATE UNIQUE INDEX IF NOT EXISTS reservations_platform_ref_idx ON reservations(platform, platform_ref);

-- Index for date-based queries (upcoming reservations for WhatsApp automation)
CREATE INDEX IF NOT EXISTS reservations_start_date_idx ON reservations(start_date);

-- RLS
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access" ON reservations FOR ALL USING (true) WITH CHECK (true);
