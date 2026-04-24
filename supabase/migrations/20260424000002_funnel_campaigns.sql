-- ============================================================
-- Funnel Campaigns — Organiser les données par campagne
-- ============================================================

CREATE TABLE funnel_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE,
  budget_euros INTEGER,
  platform TEXT,           -- meta, google, organic, etc.
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE funnel_campaigns ENABLE ROW LEVEL SECURITY;
