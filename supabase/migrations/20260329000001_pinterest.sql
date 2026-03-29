-- ============================================================
-- Migration : Système Pinterest Automation
-- 2026-03-29 — Vanzon Explorer
-- ============================================================

-- ── 1. Boards récupérés via API Pinterest ────────────────────
CREATE TABLE IF NOT EXISTS pinterest_boards (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  pinterest_id    TEXT        NOT NULL UNIQUE,
  name            TEXT        NOT NULL,
  description     TEXT,
  pin_count       INTEGER     NOT NULL DEFAULT 0,
  follower_count  INTEGER     NOT NULL DEFAULT 0,
  privacy         TEXT        NOT NULL DEFAULT 'public',
  fetched_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pinterest_boards_fetched ON pinterest_boards(fetched_at DESC);
CREATE INDEX IF NOT EXISTS idx_pinterest_boards_pins    ON pinterest_boards(pin_count DESC);

ALTER TABLE pinterest_boards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role only" ON pinterest_boards USING (false);

-- ── 2. Keyword opportunities analysées ───────────────────────
CREATE TABLE IF NOT EXISTS pinterest_keyword_opportunities (
  id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  keyword               TEXT        NOT NULL UNIQUE,
  pin_count             INTEGER     NOT NULL DEFAULT 0,
  avg_repin_count       FLOAT       NOT NULL DEFAULT 0,
  competition_level     TEXT        NOT NULL DEFAULT 'medium'
                        CHECK (competition_level IN ('low', 'medium', 'high')),
  recommended_priority  INTEGER     NOT NULL DEFAULT 5
                        CHECK (recommended_priority >= 1 AND recommended_priority <= 10),
  notes                 TEXT,
  analyzed_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pinterest_kw_priority  ON pinterest_keyword_opportunities(recommended_priority DESC);
CREATE INDEX IF NOT EXISTS idx_pinterest_kw_analyzed  ON pinterest_keyword_opportunities(analyzed_at DESC);

ALTER TABLE pinterest_keyword_opportunities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role only" ON pinterest_keyword_opportunities USING (false);

-- ── 3. Board recommendations suggérées par Groq ──────────────
CREATE TABLE IF NOT EXISTS pinterest_board_recommendations (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  board_name       TEXT        NOT NULL,
  description      TEXT,
  target_keywords  TEXT[]      NOT NULL DEFAULT '{}',
  content_pillars  TEXT[]      NOT NULL DEFAULT '{}',
  status           TEXT        NOT NULL DEFAULT 'suggested'
                   CHECK (status IN ('suggested', 'created', 'active')),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pinterest_board_rec_status   ON pinterest_board_recommendations(status);
CREATE INDEX IF NOT EXISTS idx_pinterest_board_rec_created  ON pinterest_board_recommendations(created_at DESC);

ALTER TABLE pinterest_board_recommendations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role only" ON pinterest_board_recommendations USING (false);

-- ── 4. Content queue — pins planifiés ────────────────────────
CREATE TABLE IF NOT EXISTS pinterest_content_queue (
  id                   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  title                TEXT        NOT NULL,
  description          TEXT,
  target_keyword       TEXT,
  destination_url      TEXT,
  source_article_slug  TEXT,
  board_name           TEXT,
  image_url            TEXT,
  status               TEXT        NOT NULL DEFAULT 'draft'
                       CHECK (status IN ('draft', 'approved', 'scheduled', 'published', 'failed')),
  scheduled_at         TIMESTAMPTZ,
  published_at         TIMESTAMPTZ,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pinterest_queue_status  ON pinterest_content_queue(status);
CREATE INDEX IF NOT EXISTS idx_pinterest_queue_created ON pinterest_content_queue(created_at DESC);

ALTER TABLE pinterest_content_queue ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role only" ON pinterest_content_queue USING (false);

-- ── 5. Pins créés — tracking Phase 2 ─────────────────────────
CREATE TABLE IF NOT EXISTS pinterest_pins_created (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  queue_item_id    UUID        REFERENCES pinterest_content_queue(id) ON DELETE SET NULL,
  pinterest_pin_id TEXT        NOT NULL UNIQUE,
  title            TEXT        NOT NULL,
  destination_url  TEXT,
  impressions      INTEGER     NOT NULL DEFAULT 0,
  saves            INTEGER     NOT NULL DEFAULT 0,
  clicks           INTEGER     NOT NULL DEFAULT 0,
  published_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_stats_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pinterest_pins_published ON pinterest_pins_created(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_pinterest_pins_saves     ON pinterest_pins_created(saves DESC);

ALTER TABLE pinterest_pins_created ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role only" ON pinterest_pins_created USING (false);
