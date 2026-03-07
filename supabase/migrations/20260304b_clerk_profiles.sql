-- ============================================================
-- Profiles compatible Clerk (remplace la version auth.users)
-- Utilise clerk_id (text) comme identifiant principal
-- ============================================================

-- Supprimer l'ancienne table si elle existe avec l'ancien schéma
DROP TABLE IF EXISTS public.profiles CASCADE;

CREATE TABLE public.profiles (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_id    text UNIQUE NOT NULL,   -- Clerk user ID (ex: user_2abc...)
  full_name   text,
  email       text,
  phone       text,
  avatar_url  text,

  -- Van info (renseigné depuis le dashboard)
  van_model   text,
  van_year    int,

  -- Plan actuel (mis à jour manuellement ou via webhook Stripe)
  plan        text NOT NULL DEFAULT 'free'
              CHECK (plan IN ('free', 'club_member', 'formation_buyer')),

  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX profiles_clerk_id_idx ON public.profiles(clerk_id);

-- RLS activé — service_role bypasse tout
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Mise à jour du updated_at
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


-- saved_products : mise à jour pour utiliser clerk_id
-- (la table originale utilisait user_id uuid)
DROP TABLE IF EXISTS public.saved_products CASCADE;

CREATE TABLE public.saved_products (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_id    text NOT NULL,
  product_id  uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE(clerk_id, product_id)
);

CREATE INDEX saved_products_clerk_id_idx ON public.saved_products(clerk_id);

ALTER TABLE public.saved_products ENABLE ROW LEVEL SECURITY;

-- Aucune politique publique → lecture via service_role uniquement


-- price_alerts : même mise à jour
DROP TABLE IF EXISTS public.price_alerts CASCADE;

CREATE TABLE public.price_alerts (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_id     text NOT NULL,
  product_id   uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  target_price numeric NOT NULL,
  is_active    boolean NOT NULL DEFAULT true,
  created_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.price_alerts ENABLE ROW LEVEL SECURITY;
