-- 1. Nouvelles colonnes sur road_trip_requests
ALTER TABLE road_trip_requests
  ADD COLUMN IF NOT EXISTS region_slug TEXT,
  ADD COLUMN IF NOT EXISTS summary_80w TEXT,
  ADD COLUMN IF NOT EXISTS geojson JSONB,
  ADD COLUMN IF NOT EXISTS article_sanity_id TEXT,
  ADD COLUMN IF NOT EXISTS article_slug TEXT,
  ADD COLUMN IF NOT EXISTS quality_score INTEGER;

-- 2. Modifier la contrainte status
-- D'abord supprimer l'ancienne contrainte, puis recréer
ALTER TABLE road_trip_requests DROP CONSTRAINT IF EXISTS road_trip_requests_status_check;
ALTER TABLE road_trip_requests ADD CONSTRAINT road_trip_requests_status_check
  CHECK (status IN ('pending', 'sent', 'error', 'article_pending', 'review', 'published'));

-- 3. Index
CREATE INDEX IF NOT EXISTS idx_road_trip_requests_region_slug ON road_trip_requests (region_slug);
CREATE INDEX IF NOT EXISTS idx_road_trip_requests_published ON road_trip_requests (status) WHERE status = 'published';

-- 4. Nouvelle table road_trip_regions
CREATE TABLE IF NOT EXISTS road_trip_regions (
  slug TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  geojson_bounds JSONB,
  neighboring_slugs TEXT[],
  cover_image_url TEXT,
  mountain BOOLEAN DEFAULT false,
  article_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Seed des 15 régions
INSERT INTO road_trip_regions (slug, name, mountain, neighboring_slugs) VALUES
  ('pays-basque', 'Pays Basque', true, ARRAY['landes', 'pyrenees']),
  ('bretagne', 'Bretagne', false, ARRAY['normandie', 'loire']),
  ('provence', 'Provence', false, ARRAY['camargue', 'ardeche']),
  ('camargue', 'Camargue', false, ARRAY['provence']),
  ('alsace', 'Alsace', false, ARRAY['vosges', 'jura']),
  ('dordogne', 'Dordogne', false, ARRAY['landes', 'pyrenees']),
  ('corse', 'Corse', true, ARRAY[]::TEXT[]),
  ('normandie', 'Normandie', false, ARRAY['bretagne', 'cotentin']),
  ('ardeche', 'Ardèche', false, ARRAY['provence', 'vercors']),
  ('pyrenees', 'Pyrénées', true, ARRAY['pays-basque', 'dordogne']),
  ('loire', 'Val de Loire', false, ARRAY['bretagne', 'normandie']),
  ('jura', 'Jura', true, ARRAY['alsace', 'vercors']),
  ('vercors', 'Vercors', true, ARRAY['jura', 'ardeche']),
  ('cotentin', 'Cotentin', false, ARRAY['normandie']),
  ('landes', 'Landes', false, ARRAY['pays-basque', 'dordogne'])
ON CONFLICT (slug) DO NOTHING;

-- 6. RLS sur road_trip_regions : lecture publique
ALTER TABLE road_trip_regions ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "road_trip_regions_public_read"
    ON road_trip_regions FOR SELECT
    TO anon
    USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 7. RLS sur road_trip_requests : lecture publique colonnes limitées WHERE published
-- Note: Cette policy permet de lire les itinéraires publiés côté client pour la carte
DO $$ BEGIN
  CREATE POLICY "road_trip_requests_public_read_published"
    ON road_trip_requests FOR SELECT
    TO anon
    USING (status = 'published');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
