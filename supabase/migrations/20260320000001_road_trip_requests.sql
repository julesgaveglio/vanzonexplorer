-- supabase/migrations/20260320000001_road_trip_requests.sql

CREATE TABLE IF NOT EXISTS road_trip_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prenom TEXT NOT NULL,
  email TEXT NOT NULL,
  region TEXT NOT NULL,
  duree INTEGER NOT NULL CHECK (duree BETWEEN 1 AND 14),
  interets TEXT[] NOT NULL,
  style_voyage TEXT NOT NULL,
  periode TEXT NOT NULL,
  profil_voyageur TEXT NOT NULL,
  budget TEXT NOT NULL,
  experience_van BOOLEAN NOT NULL DEFAULT false,
  itineraire_json JSONB,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'error')),
  created_at TIMESTAMPTZ DEFAULT now(),
  sent_at TIMESTAMPTZ
);

ALTER TABLE road_trip_requests ENABLE ROW LEVEL SECURITY;

-- No public read policy — admin only via service_role
CREATE INDEX idx_road_trip_requests_email ON road_trip_requests(email);
CREATE INDEX idx_road_trip_requests_status ON road_trip_requests(status);
CREATE INDEX idx_road_trip_requests_created_at ON road_trip_requests(created_at DESC);
CREATE INDEX idx_road_trip_requests_email_status ON road_trip_requests(email, status, created_at DESC);
