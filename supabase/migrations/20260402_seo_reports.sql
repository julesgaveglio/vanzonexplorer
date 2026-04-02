-- supabase/migrations/20260402_seo_reports.sql
CREATE TABLE IF NOT EXISTS seo_reports (
  id           uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  url          text NOT NULL,
  label        text,
  score_global numeric(5,2),
  report_data  jsonb NOT NULL,
  created_at   timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS seo_reports_created_at_idx ON seo_reports (created_at DESC);
CREATE INDEX IF NOT EXISTS seo_reports_url_idx ON seo_reports (url);
