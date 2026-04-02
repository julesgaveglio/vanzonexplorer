-- draft_articles : brouillons d'articles éditables (backlinks, guest posts, etc.)
CREATE TABLE IF NOT EXISTS draft_articles (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  title       TEXT        NOT NULL DEFAULT 'Sans titre',
  html_content TEXT       NOT NULL DEFAULT '',
  excerpt     TEXT        DEFAULT '',
  target_url  TEXT        DEFAULT '',
  status      TEXT        NOT NULL DEFAULT 'draft'
                          CHECK (status IN ('draft', 'queued', 'archived')),
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger updated_at
CREATE OR REPLACE FUNCTION update_draft_articles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_draft_articles_updated_at
  BEFORE UPDATE ON draft_articles
  FOR EACH ROW EXECUTE FUNCTION update_draft_articles_updated_at();

-- RLS désactivé (accès admin uniquement via service_role)
ALTER TABLE draft_articles DISABLE ROW LEVEL SECURITY;
