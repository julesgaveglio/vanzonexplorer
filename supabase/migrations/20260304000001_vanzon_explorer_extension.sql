-- ============================================================
-- Vanzon Explorer — Extension de la base Club Vanzon
-- Migration: 2026-03-04
--
-- Tables existantes conservées :
--   brands, categories, products, saved_products, price_alerts
--
-- Nouvelles tables :
--   profiles, subscriptions, vans_location, vans_sales, formation_leads
-- ============================================================


-- ────────────────────────────────────────────────────────────
-- 1. PROFILES
--    Profil étendu lié à auth.users (1:1)
--    Créé automatiquement à l'inscription via trigger
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
  id              uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name       text,
  phone           text,
  avatar_url      text,

  -- Van info (optionnel — renseigné après inscription)
  van_model       text,                          -- ex: "Renault Trafic III"
  van_year        int,

  -- Plan actif (mis à jour via subscriptions)
  plan            text NOT NULL DEFAULT 'free'
                  CHECK (plan IN ('free', 'club_member', 'formation_buyer')),

  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles: lecture publique"
  ON public.profiles FOR SELECT USING (true);

CREATE POLICY "profiles: modification par le propriétaire"
  ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Trigger de création automatique à l'inscription
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data ->> 'full_name',
    NEW.raw_user_meta_data ->> 'avatar_url'
  );
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger de mise à jour updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_updated_at ON public.profiles;
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


-- ────────────────────────────────────────────────────────────
-- 2. SUBSCRIPTIONS
--    Abonnements au Club privé
--    Connecté à Stripe via stripe_*_id
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                 uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  plan                    text NOT NULL DEFAULT 'club_basic'
                          CHECK (plan IN ('club_basic', 'club_premium')),

  status                  text NOT NULL DEFAULT 'active'
                          CHECK (status IN ('active', 'cancelled', 'past_due', 'expired', 'trialing')),

  -- Stripe
  stripe_customer_id      text,
  stripe_subscription_id  text UNIQUE,
  stripe_price_id         text,

  current_period_start    timestamptz,
  current_period_end      timestamptz,

  cancelled_at            timestamptz,
  created_at              timestamptz NOT NULL DEFAULT now(),
  updated_at              timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX subscriptions_user_id_idx ON public.subscriptions(user_id);
CREATE INDEX subscriptions_status_idx ON public.subscriptions(status);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "subscriptions: lecture par le propriétaire"
  ON public.subscriptions FOR SELECT USING (auth.uid() = user_id);

CREATE TRIGGER subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Mise à jour du plan dans profiles quand subscription change
CREATE OR REPLACE FUNCTION public.sync_profile_plan()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NEW.status = 'active' OR NEW.status = 'trialing' THEN
    UPDATE public.profiles SET plan = 'club_member' WHERE id = NEW.user_id;
  ELSE
    -- Vérifier s'il n'a pas d'autre sub active avant de rétrograder
    IF NOT EXISTS (
      SELECT 1 FROM public.subscriptions
      WHERE user_id = NEW.user_id
        AND id != NEW.id
        AND status IN ('active', 'trialing')
    ) THEN
      UPDATE public.profiles SET plan = 'free' WHERE id = NEW.user_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER subscriptions_sync_plan
  AFTER INSERT OR UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.sync_profile_plan();


-- ────────────────────────────────────────────────────────────
-- 3. VANS_LOCATION
--    Vans disponibles à la location (Yoni, Xalbat...)
--    Source de vérité côté admin — affiché sur /location
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.vans_location (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug                text UNIQUE NOT NULL,          -- 'yoni', 'xalbat'
  name                text NOT NULL,
  model               text NOT NULL,                 -- 'Renault Trafic III'
  year                int,

  -- Capacité
  seats               int NOT NULL DEFAULT 3,
  sleeping_spots      int NOT NULL DEFAULT 2,        -- places couchage adultes
  sleeping_extra      int NOT NULL DEFAULT 1,        -- places couchage enfants/extras

  -- Équipements (tableau libre)
  features            text[] DEFAULT '{}',

  -- Tarifs
  price_per_night     numeric(10,2) NOT NULL,
  price_per_week      numeric(10,2),
  price_per_month     numeric(10,2),

  -- Plateforme de réservation externe
  yescapa_url         text,
  booking_platform    text DEFAULT 'yescapa',

  -- Médias
  main_image_url      text,
  gallery_urls        text[] DEFAULT '{}',

  -- État
  is_active           boolean NOT NULL DEFAULT true,

  -- SEO
  meta_title          text,
  meta_description    text,

  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.vans_location ENABLE ROW LEVEL SECURITY;

-- Lecture publique (page /location visible sans auth)
CREATE POLICY "vans_location: lecture publique"
  ON public.vans_location FOR SELECT USING (is_active = true);

CREATE TRIGGER vans_location_updated_at
  BEFORE UPDATE ON public.vans_location
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Données initiales
INSERT INTO public.vans_location (slug, name, model, year, seats, sleeping_spots, sleeping_extra, features, price_per_night, yescapa_url, main_image_url, gallery_urls)
VALUES
  (
    'yoni',
    'Yoni',
    'Renault Trafic III',
    NULL,
    3, 2, 1,
    ARRAY['Cuisine coulissante', 'Glacière portative', 'Toilette sèche'],
    65.00,
    'https://www.yescapa.fr/campers/89215',
    'https://iili.io/KGOKoq7.png',
    ARRAY['https://iili.io/KGOKoq7.png', 'https://iili.io/KGOKCsS.png', 'https://iili.io/KGeBURn.png']
  ),
  (
    'xalbat',
    'Xalbat',
    'Renault Trafic III',
    NULL,
    3, 2, 1,
    ARRAY['Cuisine coulissante', 'Glacière portative', 'Toilette sèche'],
    65.00,
    'https://www.yescapa.fr/campers/98869',
    'https://iili.io/KGOKqzl.png',
    ARRAY['https://iili.io/KGOKqzl.png', 'https://iili.io/KGOKBX2.png', 'https://iili.io/KGeBrDG.png']
  )
ON CONFLICT (slug) DO NOTHING;


-- ────────────────────────────────────────────────────────────
-- 4. VANS_SALES
--    Vans disponibles à l'achat (futurs annonces)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.vans_sales (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug                text UNIQUE NOT NULL,
  name                text NOT NULL,
  model               text NOT NULL,
  year                int,
  mileage             int,                           -- kilométrage

  -- Prix
  price               numeric(10,2) NOT NULL,
  price_is_negotiable boolean NOT NULL DEFAULT true,

  -- Description
  short_description   text,
  long_description    text,
  features            text[] DEFAULT '{}',
  condition           text DEFAULT 'bon'
                      CHECK (condition IN ('neuf', 'excellent', 'bon', 'correct', 'à rénover')),

  -- Médias
  main_image_url      text,
  gallery_urls        text[] DEFAULT '{}',

  -- État de l'annonce
  status              text NOT NULL DEFAULT 'available'
                      CHECK (status IN ('available', 'reserved', 'sold', 'draft')),

  -- Contact / réservation
  contact_email       text,
  contact_phone       text,

  -- SEO
  meta_title          text,
  meta_description    text,

  sold_at             timestamptz,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.vans_sales ENABLE ROW LEVEL SECURITY;

-- Lecture publique des annonces actives
CREATE POLICY "vans_sales: lecture publique"
  ON public.vans_sales FOR SELECT USING (status IN ('available', 'reserved'));

CREATE TRIGGER vans_sales_updated_at
  BEFORE UPDATE ON public.vans_sales
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


-- ────────────────────────────────────────────────────────────
-- 5. FORMATION_LEADS
--    Prospects ayant pris RDV via GoHighLevel ou formulaire
--    Ne remplace pas GHL — sert à centraliser dans Supabase
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.formation_leads (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identité
  email               text NOT NULL,
  first_name          text,
  last_name           text,
  phone               text,

  -- Qualification
  project_stage       text,                          -- 'idée', 'recherche fourgon', 'aménagement', 'déjà lancé'
  budget              text,                          -- tranche ex: '< 10k', '10-20k', '> 20k'
  timeline            text,                          -- 'immédiat', '3-6 mois', '> 6 mois'
  van_type_interest   text,                          -- type de fourgon envisagé

  -- Source
  source              text DEFAULT 'website',        -- 'website', 'instagram', 'ghl', 'referral'
  utm_source          text,
  utm_medium          text,
  utm_campaign        text,

  -- Sync GHL
  ghl_contact_id      text UNIQUE,

  -- Suivi
  status              text NOT NULL DEFAULT 'new'
                      CHECK (status IN ('new', 'contacted', 'qualified', 'converted', 'lost')),
  notes               text,

  user_id             uuid REFERENCES auth.users(id) ON DELETE SET NULL,  -- si le lead devient membre

  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX formation_leads_email_idx ON public.formation_leads(email);
CREATE INDEX formation_leads_status_idx ON public.formation_leads(status);
CREATE INDEX formation_leads_ghl_idx ON public.formation_leads(ghl_contact_id);

-- RLS : lecture admin seulement (pas de politique publique)
ALTER TABLE public.formation_leads ENABLE ROW LEVEL SECURITY;

-- La table n'est accessible qu'avec le service_role key (admin)
-- Pas de politique SELECT publique → anon ne peut pas lire les leads

-- Insertion possible sans auth (formulaire public)
CREATE POLICY "formation_leads: insertion publique"
  ON public.formation_leads FOR INSERT WITH CHECK (true);

CREATE TRIGGER formation_leads_updated_at
  BEFORE UPDATE ON public.formation_leads
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


-- ────────────────────────────────────────────────────────────
-- FIN DE MIGRATION
-- ────────────────────────────────────────────────────────────
