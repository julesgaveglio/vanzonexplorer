-- ============================================================================
-- VANZON SPREADSHEET — Airtable maison
-- ============================================================================

-- ── Bases (projets sur la home) ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS spreadsheet_bases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  icon TEXT DEFAULT '📋',
  color TEXT DEFAULT '#3b82f6',
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ── Tables (onglets dans une base) ──────────────────────────────────────────

CREATE TABLE IF NOT EXISTS spreadsheet_tables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  base_id UUID NOT NULL REFERENCES spreadsheet_bases(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  icon TEXT DEFAULT '📋',
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ── Fields (colonnes dynamiques par table) ──────────────────────────────────

CREATE TABLE IF NOT EXISTS spreadsheet_fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_id UUID NOT NULL REFERENCES spreadsheet_tables(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  field_key TEXT NOT NULL,
  field_type TEXT NOT NULL CHECK (field_type IN ('text', 'number', 'url', 'checkbox', 'select', 'image', 'longtext')),
  options JSONB DEFAULT '{}',
  width INT DEFAULT 150,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ── Records (lignes avec donnees JSONB) ─────────────────────────────────────

CREATE TABLE IF NOT EXISTS spreadsheet_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_id UUID NOT NULL REFERENCES spreadsheet_tables(id) ON DELETE CASCADE,
  data JSONB NOT NULL DEFAULT '{}',
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ── Views (vues sauvegardees) ───────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS spreadsheet_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_id UUID NOT NULL REFERENCES spreadsheet_tables(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  icon TEXT DEFAULT '📋',
  view_type TEXT NOT NULL DEFAULT 'list' CHECK (view_type IN ('list', 'gallery')),
  filters JSONB DEFAULT '[]',
  sort_by TEXT,
  sort_dir TEXT DEFAULT 'asc',
  gallery_image_field TEXT,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ── Index ───────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_spreadsheet_tables_base ON spreadsheet_tables(base_id);
CREATE INDEX IF NOT EXISTS idx_spreadsheet_fields_table ON spreadsheet_fields(table_id);
CREATE INDEX IF NOT EXISTS idx_spreadsheet_records_table ON spreadsheet_records(table_id);
CREATE INDEX IF NOT EXISTS idx_spreadsheet_views_table ON spreadsheet_views(table_id);
