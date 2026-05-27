-- Title A/B testing system for opt-in page
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS title_variants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  position INT NOT NULL,
  is_active BOOLEAN DEFAULT false,
  is_completed BOOLEAN DEFAULT false,
  views_target INT DEFAULT 150,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Insert the current title as variant 1
INSERT INTO title_variants (title, position, is_active) VALUES
  ('Donne-moi 13 minutes et je te partage (vraiment) tout le process pour générer 600€/mois de revenu locatif avec un van aménagé', 1, true);
