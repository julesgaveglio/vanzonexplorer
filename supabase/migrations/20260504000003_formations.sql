-- =====================================================
-- Formations multi-produits + codes promo
-- =====================================================

CREATE TABLE IF NOT EXISTS formations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  price_cents INTEGER NOT NULL DEFAULT 0,
  emoji TEXT DEFAULT '🎓',
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS formation_modules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  formation_id UUID NOT NULL REFERENCES formations(id) ON DELETE CASCADE,
  module_id UUID NOT NULL REFERENCES vba_modules(id) ON DELETE CASCADE,
  display_order INTEGER NOT NULL,
  is_locked BOOLEAN DEFAULT false,
  UNIQUE(formation_id, module_id)
);

CREATE TABLE IF NOT EXISTS formation_access (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clerk_id TEXT NOT NULL,
  formation_id UUID NOT NULL REFERENCES formations(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(clerk_id, formation_id)
);

CREATE TABLE IF NOT EXISTS promo_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  formation_id UUID NOT NULL REFERENCES formations(id) ON DELETE CASCADE,
  discount_percent INTEGER NOT NULL DEFAULT 100,
  is_active BOOLEAN DEFAULT true,
  max_uses INTEGER,
  uses_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE formations ENABLE ROW LEVEL SECURITY;
ALTER TABLE formation_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE formation_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE promo_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "formations_public_read" ON formations FOR SELECT USING (is_published = true);
CREATE POLICY "formation_modules_public_read" ON formation_modules FOR SELECT USING (true);
CREATE POLICY "formation_access_public_read" ON formation_access FOR SELECT USING (true);
CREATE POLICY "promo_codes_active_read" ON promo_codes FOR SELECT USING (is_active = true);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_formation_access_clerk ON formation_access(clerk_id);
CREATE INDEX IF NOT EXISTS idx_formation_modules_formation ON formation_modules(formation_id);

-- =====================================================
-- Seed: Formation "Homologation VASP"
-- =====================================================

INSERT INTO formations (name, slug, description, price_cents, emoji)
VALUES (
  'Homologation VASP',
  'homologation-vasp',
  'Formation complète pour homologuer votre van en VASP. De la préparation du dossier à la validation finale.',
  49700,
  '📋'
);

-- Map VBA modules 7,8 (déverrouillés) + 9,10 (verrouillés / teaser)
INSERT INTO formation_modules (formation_id, module_id, display_order, is_locked)
SELECT
  (SELECT id FROM formations WHERE slug = 'homologation-vasp'),
  id,
  "order" - 6,
  CASE WHEN "order" <= 8 THEN false ELSE true END
FROM vba_modules
WHERE "order" IN (7, 8, 9, 10)
ORDER BY "order";

-- Code promo PHILIPPE = accès gratuit (100% discount)
INSERT INTO promo_codes (code, formation_id, discount_percent)
VALUES (
  'PHILIPPE',
  (SELECT id FROM formations WHERE slug = 'homologation-vasp'),
  100
);
