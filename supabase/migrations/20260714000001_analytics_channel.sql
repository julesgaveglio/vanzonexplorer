-- ============================================================
-- Analytics multi-canal — étend funnel_events à tout le site
-- Ajoute la classification par canal d'acquisition + landing page
-- pour attribuer chaque visiteur/conversion à sa source d'origine.
-- ============================================================

ALTER TABLE funnel_events
  ADD COLUMN IF NOT EXISTS channel TEXT,           -- organic | google-ads | meta-ads | meta-organic | referral | campaign | direct
  ADD COLUMN IF NOT EXISTS landing_page TEXT;      -- 1re page vue de la session (first-touch)

-- Index pour les agrégations du dashboard (canal × période)
CREATE INDEX IF NOT EXISTS funnel_events_channel_idx ON funnel_events(channel);
CREATE INDEX IF NOT EXISTS funnel_events_channel_created_idx ON funnel_events(channel, created_at DESC);
CREATE INDEX IF NOT EXISTS funnel_events_landing_idx ON funnel_events(landing_page);
