-- Automatisation commentaires Facebook -> DM Messenger avec la ressource PDF
-- (route /api/facebook-webhook). Voir identite-vanzon/brief-automatisation-facebook.md.

-- Catalogue des ressources proposees en fin de Reel ("Commente GUIDE/LISTE...").
-- Ajouter une ligne ici (sans redeployer) quand une nouvelle ressource sort.
CREATE TABLE IF NOT EXISTS ressources (
  slug TEXT PRIMARY KEY,
  titre TEXT NOT NULL,
  -- Exemples de formulations/sujets pour aider la classification IA (pas un match exact)
  mots_cles_exemples TEXT NOT NULL,
  url TEXT NOT NULL,
  actif BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE ressources ENABLE ROW LEVEL SECURITY;

INSERT INTO ressources (slug, titre, mots_cles_exemples, url) VALUES
  (
    'guide',
    'Le guide complet Business Van Aménagé',
    'guide, business, business plan, van aménagé, rentabilité, revente, se lancer, vivre du van',
    'https://vanzonexplorer.com/ressource?ressource=guide&source=facebook'
  ),
  (
    'liste',
    'La liste complète du matériel aménagement VASP',
    'liste, checklist, matériel, équipement, budget aménagement, VASP, liste de courses',
    'https://vanzonexplorer.com/ressource?ressource=liste&source=facebook'
  )
ON CONFLICT (slug) DO NOTHING;

-- Idempotence : Facebook renvoie parfois le meme evenement plusieurs fois.
-- Un commentaire deja traite ne doit jamais redeclencher un DM.
CREATE TABLE IF NOT EXISTS fb_webhook_events (
  comment_id TEXT PRIMARY KEY,
  ressource_slug TEXT,          -- slug envoye, ou NULL si classifie "aucune"
  commenter_name TEXT,
  comment_text TEXT,
  dm_sent BOOLEAN NOT NULL DEFAULT false,
  error TEXT,                   -- trace du dernier echec d'envoi eventuel
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE fb_webhook_events ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_fb_webhook_events_created ON fb_webhook_events(created_at);
