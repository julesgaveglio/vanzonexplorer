-- ============================================================
-- Funnel Ads — Créatives publicitaires par campagne
-- ============================================================

CREATE TABLE funnel_ads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES funnel_campaigns(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  hook_type TEXT,              -- emotional, data, urgency, other
  video_url TEXT,
  transcript TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX funnel_ads_campaign_idx ON funnel_ads(campaign_id);
ALTER TABLE funnel_ads ENABLE ROW LEVEL SECURITY;
