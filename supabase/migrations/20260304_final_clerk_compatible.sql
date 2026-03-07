-- ============================================================
-- Vanzon Explorer — Migration complète compatible Clerk
-- Date : 2026-03-04
-- Remplace les migrations précédentes
-- Utilise clerk_id (text) au lieu de FK vers auth.users
-- ============================================================


-- ── 0. UTILITAIRE ────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


-- ── 1. PROFILES ──────────────────────────────────────────────
DROP TABLE IF EXISTS public.profiles CASCADE;

CREATE TABLE public.profiles (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_id    text UNIQUE NOT NULL,
  full_name   text,
  email       text,
  phone       text,
  avatar_url  text,
  van_model   text,
  van_year    int,
  plan        text NOT NULL DEFAULT 'free'
              CHECK (plan IN ('free', 'club_member', 'formation_buyer')),
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX profiles_clerk_id_idx ON public.profiles(clerk_id);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


-- ── 2. SUBSCRIPTIONS ─────────────────────────────────────────
DROP TABLE IF EXISTS public.subscriptions CASCADE;

CREATE TABLE public.subscriptions (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_id                text NOT NULL,
  plan                    text NOT NULL DEFAULT 'club_basic'
                          CHECK (plan IN ('club_basic', 'club_premium')),
  status                  text NOT NULL DEFAULT 'active'
                          CHECK (status IN ('active', 'cancelled', 'past_due', 'expired', 'trialing')),
  stripe_customer_id      text,
  stripe_subscription_id  text UNIQUE,
  stripe_price_id         text,
  current_period_start    timestamptz,
  current_period_end      timestamptz,
  cancelled_at            timestamptz,
  created_at              timestamptz NOT NULL DEFAULT now(),
  updated_at              timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX subscriptions_clerk_id_idx ON public.subscriptions(clerk_id);
CREATE INDEX subscriptions_status_idx ON public.subscriptions(status);
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


-- ── 3. VANS_LOCATION ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.vans_location (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug                text UNIQUE NOT NULL,
  name                text NOT NULL,
  model               text NOT NULL,
  year                int,
  seats               int NOT NULL DEFAULT 3,
  sleeping_spots      int NOT NULL DEFAULT 2,
  sleeping_extra      int NOT NULL DEFAULT 1,
  features            text[] DEFAULT '{}',
  price_per_night     numeric(10,2) NOT NULL,
  price_per_week      numeric(10,2),
  price_per_month     numeric(10,2),
  yescapa_url         text,
  booking_platform    text DEFAULT 'yescapa',
  main_image_url      text,
  gallery_urls        text[] DEFAULT '{}',
  is_active           boolean NOT NULL DEFAULT true,
  meta_title          text,
  meta_description    text,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.vans_location ENABLE ROW LEVEL SECURITY;

CREATE POLICY "vans_location: lecture publique"
  ON public.vans_location FOR SELECT USING (is_active = true);

CREATE TRIGGER vans_location_updated_at
  BEFORE UPDATE ON public.vans_location
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.vans_location (slug, name, model, seats, sleeping_spots, sleeping_extra, features, price_per_night, yescapa_url, main_image_url, gallery_urls)
VALUES
  ('yoni', 'Yoni', 'Renault Trafic III', 3, 2, 1,
   ARRAY['Cuisine coulissante', 'Glacière portative', 'Toilette sèche'],
   65.00, 'https://www.yescapa.fr/campers/89215',
   'https://iili.io/KGOKoq7.png',
   ARRAY['https://iili.io/KGOKoq7.png', 'https://iili.io/KGOKCsS.png', 'https://iili.io/KGeBURn.png']),
  ('xalbat', 'Xalbat', 'Renault Trafic III', 3, 2, 1,
   ARRAY['Cuisine coulissante', 'Glacière portative', 'Toilette sèche'],
   65.00, 'https://www.yescapa.fr/campers/98869',
   'https://iili.io/KGOKqzl.png',
   ARRAY['https://iili.io/KGOKqzl.png', 'https://iili.io/KGOKBX2.png', 'https://iili.io/KGeBrDG.png'])
ON CONFLICT (slug) DO NOTHING;


-- ── 4. VANS_SALES ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.vans_sales (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug                text UNIQUE NOT NULL,
  name                text NOT NULL,
  model               text NOT NULL,
  year                int,
  mileage             int,
  price               numeric(10,2) NOT NULL,
  price_is_negotiable boolean NOT NULL DEFAULT true,
  short_description   text,
  long_description    text,
  features            text[] DEFAULT '{}',
  condition           text DEFAULT 'bon'
                      CHECK (condition IN ('neuf', 'excellent', 'bon', 'correct', 'à rénover')),
  main_image_url      text,
  gallery_urls        text[] DEFAULT '{}',
  status              text NOT NULL DEFAULT 'available'
                      CHECK (status IN ('available', 'reserved', 'sold', 'draft')),
  contact_email       text,
  contact_phone       text,
  meta_title          text,
  meta_description    text,
  sold_at             timestamptz,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.vans_sales ENABLE ROW LEVEL SECURITY;

CREATE POLICY "vans_sales: lecture publique"
  ON public.vans_sales FOR SELECT USING (status IN ('available', 'reserved'));

CREATE TRIGGER vans_sales_updated_at
  BEFORE UPDATE ON public.vans_sales
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


-- ── 5. FORMATION_LEADS ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.formation_leads (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email               text NOT NULL,
  first_name          text,
  last_name           text,
  phone               text,
  project_stage       text,
  budget              text,
  timeline            text,
  van_type_interest   text,
  source              text DEFAULT 'website',
  utm_source          text,
  utm_medium          text,
  utm_campaign        text,
  ghl_contact_id      text UNIQUE,
  status              text NOT NULL DEFAULT 'new'
                      CHECK (status IN ('new', 'contacted', 'qualified', 'converted', 'lost')),
  notes               text,
  clerk_id            text,  -- si le lead crée un compte Clerk
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX formation_leads_email_idx ON public.formation_leads(email);
CREATE INDEX formation_leads_status_idx ON public.formation_leads(status);
CREATE INDEX formation_leads_ghl_idx ON public.formation_leads(ghl_contact_id);
ALTER TABLE public.formation_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "formation_leads: insertion publique"
  ON public.formation_leads FOR INSERT WITH CHECK (true);

CREATE TRIGGER formation_leads_updated_at
  BEFORE UPDATE ON public.formation_leads
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


-- ── 6. SAVED_PRODUCTS ────────────────────────────────────────
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


-- ── 7. PRICE_ALERTS ──────────────────────────────────────────
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


-- ── FIN ──────────────────────────────────────────────────────
