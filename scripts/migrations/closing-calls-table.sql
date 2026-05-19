-- Closing calls table
-- Stores VBA closing call bookings from Calendly (via Google Calendar sync)
-- Used for WhatsApp automation (confirmation 1h after booking) and admin dashboard

CREATE TABLE IF NOT EXISTS closing_calls (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  scheduled_at TIMESTAMPTZ NOT NULL,
  calendar_event_id TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'completed', 'no_show', 'cancelled')),
  whatsapp_sent_at TIMESTAMPTZ,
  whatsapp_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Prevent duplicate imports from same calendar event
CREATE UNIQUE INDEX IF NOT EXISTS closing_calls_event_idx ON closing_calls(calendar_event_id);

-- Index for upcoming calls (WhatsApp automation cron)
CREATE INDEX IF NOT EXISTS closing_calls_scheduled_idx ON closing_calls(scheduled_at);

-- Index for pending WhatsApp messages
CREATE INDEX IF NOT EXISTS closing_calls_whatsapp_pending_idx ON closing_calls(whatsapp_sent_at) WHERE whatsapp_sent_at IS NULL;

-- RLS
ALTER TABLE closing_calls ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access" ON closing_calls FOR ALL USING (true) WITH CHECK (true);
