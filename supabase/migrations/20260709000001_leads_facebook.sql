-- Leads captes via la page generique de telechargement de ressources (/ressources?ressource=...)
-- Alimentee notamment par les automatisations "commente GUIDE" sur Facebook/Instagram
CREATE TABLE IF NOT EXISTS leads_facebook (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prenom TEXT NOT NULL,
  nom TEXT NOT NULL,
  email TEXT NOT NULL,
  ressource TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'facebook',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE leads_facebook ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_leads_facebook_email ON leads_facebook(email);
CREATE INDEX IF NOT EXISTS idx_leads_facebook_ressource ON leads_facebook(ressource);
