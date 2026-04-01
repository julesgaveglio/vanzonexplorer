-- Suivi de l'envoi de l'email de feedback (24h post road trip)
ALTER TABLE road_trip_requests
  ADD COLUMN IF NOT EXISTS feedback_sent_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_road_trip_feedback_pending
  ON road_trip_requests (sent_at)
  WHERE status = 'sent' AND feedback_sent_at IS NULL;
