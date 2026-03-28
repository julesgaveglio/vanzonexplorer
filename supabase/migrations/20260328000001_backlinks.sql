-- ============================================================
-- Migration : Système Backlinks / Outreach SEO
-- 2026-03-28 — Vanzon Explorer
-- ============================================================

-- ── 1. Prospects identifiés par l'agent discovery ────────────────
CREATE TABLE IF NOT EXISTS backlink_prospects (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  domain       TEXT        NOT NULL UNIQUE,           -- ex: "vanlife-mag.fr"
  url          TEXT        NOT NULL,                  -- URL complète de la page cible
  type         TEXT        NOT NULL DEFAULT 'blog'
                           CHECK (type IN ('blog', 'forum', 'partenaire', 'annuaire', 'media')),
  score        INTEGER     NOT NULL DEFAULT 5
                           CHECK (score >= 1 AND score <= 10),
  statut       TEXT        NOT NULL DEFAULT 'découvert'
                           CHECK (statut IN ('découvert', 'contacté', 'relancé', 'obtenu', 'rejeté')),
  notes        TEXT,
  source_query TEXT,       -- requête SerpApi qui a trouvé ce domaine
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_backlink_prospects_statut  ON backlink_prospects(statut);
CREATE INDEX IF NOT EXISTS idx_backlink_prospects_score   ON backlink_prospects(score DESC);
CREATE INDEX IF NOT EXISTS idx_backlink_prospects_created ON backlink_prospects(created_at DESC);

ALTER TABLE backlink_prospects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role only" ON backlink_prospects USING (false);

-- ── 2. Emails d'outreach (drafts + envoyés) ──────────────────────
CREATE TABLE IF NOT EXISTS backlink_outreach (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  prospect_id       UUID        NOT NULL REFERENCES backlink_prospects(id) ON DELETE CASCADE,
  recipient_email   TEXT,                    -- rempli manuellement ou via enrichissement
  email_subject     TEXT,
  email_body        TEXT,
  template_type     TEXT        CHECK (template_type IN ('blog', 'forum', 'partenaire')),
  approved          BOOLEAN     NOT NULL DEFAULT FALSE,  -- validation manuelle requise
  sent_at           TIMESTAMPTZ,
  reply_received    BOOLEAN     NOT NULL DEFAULT FALSE,
  follow_up_sent_at TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_backlink_outreach_prospect ON backlink_outreach(prospect_id);
CREATE INDEX IF NOT EXISTS idx_backlink_outreach_approved ON backlink_outreach(approved) WHERE approved = FALSE;

ALTER TABLE backlink_outreach ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role only" ON backlink_outreach USING (false);

-- ── 3. Backlinks effectivement obtenus ───────────────────────────
CREATE TABLE IF NOT EXISTS backlink_obtained (
  id             UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  prospect_id    UUID    NOT NULL REFERENCES backlink_prospects(id) ON DELETE CASCADE,
  backlink_url   TEXT    NOT NULL,   -- URL de la page qui nous linke
  anchor_text    TEXT,               -- texte d'ancre du lien
  dr_score       INTEGER,            -- Domain Rating Ahrefs si connu
  date_obtained  DATE    NOT NULL DEFAULT CURRENT_DATE
);

CREATE INDEX IF NOT EXISTS idx_backlink_obtained_date ON backlink_obtained(date_obtained DESC);

ALTER TABLE backlink_obtained ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role only" ON backlink_obtained USING (false);
