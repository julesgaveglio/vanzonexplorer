-- Add google_calendar_event_id to reservations for Calendar sync deduplication
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS google_calendar_event_id TEXT;
