-- supabase/migrations/20260410000001_poi_cache_and_leads.sql
-- Refonte Road Trip Personnalisé : lead magnet Pays Basque
--   1. Table poi_cache : POI réutilisables + spots de nuit van
--   2. ALTER road_trip_requests : nouveaux champs de segmentation lead

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Table poi_cache
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS poi_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL,
    -- 'restaurant' | 'activite' | 'parking' | 'culture' | 'nature' | 'spot_nuit'
  subcategory TEXT,
    -- activité : 'rafting' | 'randonnee' | 'surf' | 'musee' | 'marche' | 'plage' …
    -- spot_nuit : 'parking_gratuit' | 'aire_camping_car' | 'camping_van' | 'spot_sauvage'
  budget_level TEXT,
    -- 'gratuit' | 'faible' | 'moyen' | 'eleve' | null
  location_city TEXT NOT NULL,
  address TEXT,
  google_maps_url TEXT,
  external_url TEXT,
  rating NUMERIC(2,1),
  description TEXT,
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],

  -- Parking / accès (POI générique)
  parking_nearby BOOLEAN DEFAULT false,
  parking_info TEXT,

  -- Champs spécifiques spots de nuit van
  overnight_allowed BOOLEAN DEFAULT false,
  overnight_type TEXT,
    -- 'parking_gratuit' | 'aire_camping_car' | 'camping_van' | 'spot_sauvage'
  overnight_price_per_night NUMERIC(6,2),
  overnight_capacity TEXT,
  overnight_amenities TEXT[] DEFAULT ARRAY[]::TEXT[],
  overnight_restrictions TEXT,
  overnight_coordinates TEXT,

  scraped_at TIMESTAMPTZ DEFAULT now(),
  source TEXT,
    -- 'tavily' | 'manual' | 'park4night' | 'campingcar-infos' …

  -- Unique (name + city) → idempotent upsert depuis le seed / scraping
  CONSTRAINT poi_cache_name_city_unique UNIQUE (name, location_city)
);

CREATE INDEX IF NOT EXISTS idx_poi_category ON poi_cache(category);
CREATE INDEX IF NOT EXISTS idx_poi_city ON poi_cache(location_city);
CREATE INDEX IF NOT EXISTS idx_poi_tags ON poi_cache USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_poi_budget ON poi_cache(budget_level);
CREATE INDEX IF NOT EXISTS idx_poi_overnight ON poi_cache(overnight_allowed);
CREATE INDEX IF NOT EXISTS idx_poi_overnight_type ON poi_cache(overnight_type);

ALTER TABLE poi_cache ENABLE ROW LEVEL SECURITY;

-- Lecture publique (admin panel + routes API anon-safe)
DO $$ BEGIN
  CREATE POLICY "poi_cache_public_read"
    ON poi_cache FOR SELECT
    TO anon
    USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. ALTER road_trip_requests : champs lead magnet
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE road_trip_requests
  ADD COLUMN IF NOT EXISTS van_status TEXT,
  ADD COLUMN IF NOT EXISTS group_type TEXT,
  ADD COLUMN IF NOT EXISTS budget_level TEXT,
  ADD COLUMN IF NOT EXISTS overnight_preference TEXT,
  ADD COLUMN IF NOT EXISTS lead_email TEXT,
  ADD COLUMN IF NOT EXISTS lead_firstname TEXT,
  ADD COLUMN IF NOT EXISTS contacted BOOLEAN DEFAULT false;

-- Contrainte CHECK sur van_status (autorise NULL pour les anciens records)
DO $$ BEGIN
  ALTER TABLE road_trip_requests
    ADD CONSTRAINT road_trip_requests_van_status_check
    CHECK (van_status IS NULL OR van_status IN ('proprietaire', 'locataire', 'non_precise'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_road_trip_requests_van_status ON road_trip_requests(van_status);
CREATE INDEX IF NOT EXISTS idx_road_trip_requests_contacted ON road_trip_requests(contacted);
CREATE INDEX IF NOT EXISTS idx_road_trip_requests_overnight_pref ON road_trip_requests(overnight_preference);
