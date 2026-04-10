-- supabase/migrations/20260410000002_poi_cache_admin_fields.sql
-- Colonnes additionnelles pour le gestionnaire POI admin
--   image_url           : URL de l'image (OG scrapée ou uploadée)
--   price_indication    : prix lisible (ex: "12-20€/pers")
--   opening_hours       : horaires lisibles
--   duration_minutes    : durée estimée en minutes (pour les activités)

ALTER TABLE poi_cache
  ADD COLUMN IF NOT EXISTS image_url TEXT,
  ADD COLUMN IF NOT EXISTS price_indication TEXT,
  ADD COLUMN IF NOT EXISTS opening_hours TEXT,
  ADD COLUMN IF NOT EXISTS duration_minutes INTEGER;
