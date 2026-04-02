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
  -- Colonne FTS mise à jour par trigger (GENERATED ALWAYS refusé par PostgreSQL sur ces fonctions)
  fts_vector         TSVECTOR,
  obsidian_synced_at TIMESTAMPTZ,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger pour maintenir fts_vector à jour à chaque INSERT/UPDATE
CREATE OR REPLACE FUNCTION vanzon_memory_fts_update() RETURNS trigger AS $$
BEGIN
  NEW.fts_vector := to_tsvector('french'::regconfig,
    COALESCE(NEW.title, '') || ' ' ||
    COALESCE(NEW.content, '') || ' ' ||
    COALESCE(array_to_string(NEW.tags, ' '), '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER vanzon_memory_fts_trigger
  BEFORE INSERT OR UPDATE ON vanzon_memory
  FOR EACH ROW EXECUTE FUNCTION vanzon_memory_fts_update();

CREATE INDEX IF NOT EXISTS vanzon_memory_category_idx
  ON vanzon_memory(category);

CREATE INDEX IF NOT EXISTS vanzon_memory_created_idx
  ON vanzon_memory(created_at DESC);

CREATE INDEX IF NOT EXISTS vanzon_memory_sync_idx
  ON vanzon_memory(obsidian_synced_at)
  WHERE obsidian_synced_at IS NULL;

-- Index GIN sur fts_vector pour la recherche plein texte
CREATE INDEX IF NOT EXISTS vanzon_memory_fts_idx
  ON vanzon_memory USING gin(fts_vector);

COMMENT ON TABLE vanzon_memory IS 'Mémoire interne Vanzon — notes vocales catégorisées par Groq';
