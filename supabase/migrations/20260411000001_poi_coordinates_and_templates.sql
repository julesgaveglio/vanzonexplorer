-- supabase/migrations/20260411000001_poi_coordinates_and_templates.sql
-- Refonte SEO Road Trip Pays Basque
--   1. Colonne `coordinates` sur poi_cache (format "lat,lng" string)
--   2. Table road_trip_templates : itinéraires pré-générés par combo (duration × groupType × region)

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. poi_cache : ajoute coordinates générique
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE poi_cache ADD COLUMN IF NOT EXISTS coordinates TEXT;
CREATE INDEX IF NOT EXISTS idx_poi_coordinates
  ON poi_cache(coordinates) WHERE coordinates IS NOT NULL;

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. road_trip_templates : itinéraires pré-générés statiques
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS road_trip_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  region_slug TEXT NOT NULL,
  duration_key TEXT NOT NULL,
  group_type TEXT NOT NULL,
  title TEXT NOT NULL,
  intro TEXT,
  itinerary_json JSONB NOT NULL,
  poi_ids UUID[] DEFAULT ARRAY[]::UUID[],
  overnight_ids UUID[] DEFAULT ARRAY[]::UUID[],
  tips TEXT[] DEFAULT ARRAY[]::TEXT[],
  faq JSONB DEFAULT '[]'::JSONB,
  published BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT road_trip_templates_unique UNIQUE (region_slug, duration_key, group_type),
  CONSTRAINT road_trip_templates_duration_check CHECK (
    duration_key IN ('1-jour', 'weekend', '5-jours', '1-semaine')
  ),
  CONSTRAINT road_trip_templates_group_check CHECK (
    group_type IN ('solo', 'couple', 'amis', 'famille')
  )
);

CREATE INDEX IF NOT EXISTS idx_rtt_region ON road_trip_templates(region_slug);
CREATE INDEX IF NOT EXISTS idx_rtt_lookup
  ON road_trip_templates(region_slug, duration_key, group_type);

ALTER TABLE road_trip_templates ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "road_trip_templates_public_read"
    ON road_trip_templates FOR SELECT
    TO anon
    USING (published = true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
