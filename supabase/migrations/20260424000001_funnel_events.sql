-- ============================================================
-- Funnel Events — Tracking 100% fiable côté serveur
-- Chaque événement du tunnel VBA est loggé ici
-- ============================================================

CREATE TABLE funnel_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identification session/lead
  session_id TEXT,                -- UUID généré côté client, persisté en localStorage
  email TEXT,                     -- email du lead (après opt-in)
  firstname TEXT,

  -- Événement
  event TEXT NOT NULL,            -- optin, vsl_view, vsl_25, vsl_50, vsl_75, vsl_100, booking_start, booking_confirmed, checkout, purchase
  page TEXT NOT NULL,             -- chemin URL (ex: /van-business-academy/presentation)

  -- Attribution
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_content TEXT,
  utm_term TEXT,
  referrer TEXT,

  -- Metadata flexible
  metadata JSONB DEFAULT '{}'::jsonb,  -- ex: { value: 997, currency: "EUR" } pour purchase

  -- Timestamp
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index pour les requêtes fréquentes
CREATE INDEX funnel_events_session_idx ON funnel_events(session_id);
CREATE INDEX funnel_events_email_idx ON funnel_events(email);
CREATE INDEX funnel_events_event_idx ON funnel_events(event);
CREATE INDEX funnel_events_created_idx ON funnel_events(created_at DESC);

-- RLS — lecture uniquement via service_role (admin)
ALTER TABLE funnel_events ENABLE ROW LEVEL SECURITY;
