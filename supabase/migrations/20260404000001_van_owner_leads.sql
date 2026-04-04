-- Table de pré-inscription propriétaires pour la marketplace MVP-0
CREATE TABLE IF NOT EXISTS van_owner_leads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  first_name TEXT NOT NULL,
  email TEXT NOT NULL,
  van_type TEXT NOT NULL CHECK (van_type IN ('fourgon', 'minibus', 'autre')),
  location TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'contacted', 'interested', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE van_owner_leads ENABLE ROW LEVEL SECURITY;

-- Tout le monde peut s'inscrire (formulaire public)
CREATE POLICY "public_insert" ON van_owner_leads
  FOR INSERT TO anon WITH CHECK (true);

-- Seul le service_role peut lire/modifier (admin)
CREATE POLICY "admin_all" ON van_owner_leads
  FOR ALL TO service_role USING (true) WITH CHECK (true);
