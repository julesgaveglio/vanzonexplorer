-- ============================================================
-- Migration : Backlinks v2 — Sessions de scraping + contact_email
-- 2026-04-02 — Vanzon Explorer
-- ============================================================

-- ── Nouvelles colonnes sur backlink_prospects ─────────────────
ALTER TABLE backlink_prospects ADD COLUMN IF NOT EXISTS contact_email  TEXT;
ALTER TABLE backlink_prospects ADD COLUMN IF NOT EXISTS contact_source TEXT;   -- 'jina_regex', 'manual'
ALTER TABLE backlink_prospects ADD COLUMN IF NOT EXISTS contacted_at   TIMESTAMPTZ;

-- ── Table de suivi des sessions de scraping ───────────────────
CREATE TABLE IF NOT EXISTS backlink_scrape_sessions (
  id                 UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  session_date       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  clusters_used      TEXT[]      NOT NULL DEFAULT '{}',
  keywords_used      TEXT[]      NOT NULL DEFAULT '{}',
  method             TEXT        NOT NULL DEFAULT 'tavily_general',
  domains_found      INTEGER     NOT NULL DEFAULT 0,
  domains_new        INTEGER     NOT NULL DEFAULT 0,
  emails_found       INTEGER     NOT NULL DEFAULT 0,
  prospects_inserted INTEGER     NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_scrape_sessions_date ON backlink_scrape_sessions(session_date DESC);
ALTER TABLE backlink_scrape_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role only" ON backlink_scrape_sessions USING (false);
