-- ============================================================
-- Migration : Article Queue + Agent Runs
-- 2026-03-30 — Vanzon Explorer
-- ============================================================

-- ── 1. Table article_queue ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS article_queue (
  id                  TEXT        PRIMARY KEY,         -- = slug (unique)
  slug                TEXT        NOT NULL UNIQUE,
  title               TEXT        NOT NULL,
  excerpt             TEXT        NOT NULL DEFAULT '',
  category            TEXT        NOT NULL,
  tag                 TEXT,
  read_time           TEXT        NOT NULL DEFAULT '5 min',
  target_keyword      TEXT        NOT NULL DEFAULT '',
  secondary_keywords  TEXT[]      NOT NULL DEFAULT '{}',
  target_word_count   INTEGER,
  word_count_note     TEXT,
  status              TEXT        NOT NULL DEFAULT 'pending'
                                  CHECK (status IN ('pending', 'writing', 'published', 'needs-improvement')),
  priority            INTEGER     NOT NULL DEFAULT 50,
  sanity_id           TEXT,
  published_at        TIMESTAMPTZ,
  last_seo_check      TIMESTAMPTZ,
  seo_position        INTEGER,
  search_volume       INTEGER,
  competition_level   TEXT,
  seo_score           NUMERIC,
  added_by            TEXT,
  last_optimized_at   TIMESTAMPTZ,
  last_link_check     TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER article_queue_updated_at
  BEFORE UPDATE ON article_queue
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Index pour les requêtes fréquentes
CREATE INDEX IF NOT EXISTS idx_article_queue_status   ON article_queue (status);
CREATE INDEX IF NOT EXISTS idx_article_queue_priority ON article_queue (priority ASC, created_at ASC);

-- RLS : service_role seulement (agents server-side)
ALTER TABLE article_queue ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_all" ON article_queue
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- ── 2. Fonction atomique claim_pending_article ────────────────────────────────
-- Sélectionne + verrouille atomiquement le prochain article pending (ORDER BY priority ASC)
-- Évite les race conditions si 2 agents tournent simultanément.
CREATE OR REPLACE FUNCTION claim_pending_article(p_slug TEXT DEFAULT NULL)
RETURNS SETOF article_queue
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  UPDATE article_queue
  SET status = 'writing'
  WHERE id = (
    SELECT id FROM article_queue
    WHERE
      CASE WHEN p_slug IS NOT NULL
        THEN slug = p_slug AND status IN ('pending', 'needs-improvement')
        ELSE status = 'pending'
      END
    ORDER BY priority ASC, created_at ASC
    LIMIT 1
    FOR UPDATE SKIP LOCKED
  )
  RETURNING *;
END;
$$;

-- ── 3. Table agent_runs ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS agent_runs (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_name       TEXT        NOT NULL,
  started_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  finished_at      TIMESTAMPTZ,
  status           TEXT        NOT NULL DEFAULT 'running'
                               CHECK (status IN ('running', 'success', 'error')),
  items_processed  INTEGER     NOT NULL DEFAULT 0,
  items_created    INTEGER     NOT NULL DEFAULT 0,
  error_message    TEXT,
  metadata         JSONB
);

CREATE INDEX IF NOT EXISTS idx_agent_runs_name       ON agent_runs (agent_name);
CREATE INDEX IF NOT EXISTS idx_agent_runs_started_at ON agent_runs (started_at DESC);

ALTER TABLE agent_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_all" ON agent_runs
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
