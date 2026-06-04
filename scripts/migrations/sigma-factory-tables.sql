-- ============================================================
-- Sigma Factory — Tables Supabase (100% dissociées de VanZon)
-- Préfixe : sigma_
-- ============================================================

-- 1. Auth dashboard
CREATE TABLE IF NOT EXISTS sigma_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('admin', 'viewer')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Campagnes publicitaires
CREATE TABLE IF NOT EXISTS sigma_campaigns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE,
  budget_euros NUMERIC(10,2),
  platform TEXT DEFAULT 'meta',
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Leads opt-in
CREATE TABLE IF NOT EXISTS sigma_leads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  firstname TEXT,
  phone TEXT,
  is_hot BOOLEAN DEFAULT true,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_content TEXT,
  utm_term TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sigma_leads_email ON sigma_leads(email);
CREATE INDEX IF NOT EXISTS idx_sigma_leads_created ON sigma_leads(created_at);

-- 4. Funnel events (tracking tunnel)
CREATE TABLE IF NOT EXISTS sigma_funnel_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT,
  event TEXT NOT NULL,
  page TEXT,
  email TEXT,
  firstname TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_content TEXT,
  utm_term TEXT,
  referrer TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sigma_events_event ON sigma_funnel_events(event);
CREATE INDEX IF NOT EXISTS idx_sigma_events_email ON sigma_funnel_events(email);
CREATE INDEX IF NOT EXISTS idx_sigma_events_created ON sigma_funnel_events(created_at);
CREATE INDEX IF NOT EXISTS idx_sigma_events_session ON sigma_funnel_events(session_id);

-- 5. VSL versions
CREATE TABLE IF NOT EXISTS sigma_vsl_versions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  bunny_video_id TEXT,
  bunny_library_id TEXT,
  color TEXT DEFAULT '#B9945F',
  is_active BOOLEAN DEFAULT false,
  transcript_srt TEXT,
  transcript_text TEXT,
  hook_suggestions JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Email campaigns
CREATE TABLE IF NOT EXISTS sigma_email_campaigns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  subject TEXT,
  body_html TEXT,
  color TEXT DEFAULT '#B9945F',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 7. Email sends
CREATE TABLE IF NOT EXISTS sigma_email_sends (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  campaign_id UUID REFERENCES sigma_email_campaigns(id),
  campaign_name TEXT,
  subject TEXT,
  sent_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sigma_sends_email ON sigma_email_sends(email);

-- 8. Email clicks
CREATE TABLE IF NOT EXISTS sigma_email_clicks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  campaign_name TEXT,
  clicked_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sigma_clicks_email ON sigma_email_clicks(email);
