-- supabase/migrations/20260402000001_vanzon_memory.sql
-- Table de mémoire interne Vanzon — notes vocales Telegram

CREATE TABLE IF NOT EXISTS vanzon_memory (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category           TEXT NOT NULL,
  obsidian_file      TEXT NOT NULL,
  title              TEXT NOT NULL,
  content            TEXT NOT NULL,
  source             TEXT NOT NULL DEFAULT 'telegram_voice',
  tags               TEXT[] NOT NULL DEFAULT '{}',
  -- Colonne générée pour le full-text search multi-champs (requis par Supabase JS .textSearch())
  -- Le client Supabase JS ne supporte pas les expressions SQL comme argument de colonne
  fts_vector         TSVECTOR GENERATED ALWAYS AS (
    to_tsvector('french', title || ' ' || content || ' ' || array_to_string(tags, ' '))
  ) STORED,
  obsidian_synced_at TIMESTAMPTZ,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS vanzon_memory_category_idx
  ON vanzon_memory(category);

CREATE INDEX IF NOT EXISTS vanzon_memory_created_idx
  ON vanzon_memory(created_at DESC);

CREATE INDEX IF NOT EXISTS vanzon_memory_sync_idx
  ON vanzon_memory(obsidian_synced_at)
  WHERE obsidian_synced_at IS NULL;

-- Index GIN sur la colonne générée fts_vector
CREATE INDEX IF NOT EXISTS vanzon_memory_fts_idx
  ON vanzon_memory USING gin(fts_vector);

-- État 'awaiting_memory_edit' ajouté aux états valides de telegram_pending_actions
-- (états existants : awaiting_confirmation | awaiting_edit | awaiting_selection)
COMMENT ON TABLE vanzon_memory IS 'Mémoire interne Vanzon — notes vocales catégorisées par Groq';
