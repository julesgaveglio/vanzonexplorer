-- ================================================================
-- Club Privé — Migration Supabase
-- À exécuter dans le SQL Editor du dashboard Supabase
-- ================================================================

-- 1. Ajouter les colonnes manquantes à la table profiles existante
alter table profiles
  add column if not exists email             text,
  add column if not exists first_name        text,
  add column if not exists last_name         text,
  add column if not exists role              text default 'user',
  add column if not exists stripe_customer_id text,
  add column if not exists subscription_status text default 'free',
  add column if not exists updated_at        timestamptz default now();

-- 2. Table des catégories de deals
create table if not exists categories (
  id          uuid    default gen_random_uuid() primary key,
  slug        text    unique not null,
  name        text    not null,
  icon        text    not null default 'Wrench',
  description text,
  sort_order  integer default 0,
  created_at  timestamptz default now()
);

-- 3. Table des marques partenaires
create table if not exists brands (
  id                 uuid    default gen_random_uuid() primary key,
  slug               text    unique not null,
  name               text    not null,
  logo_url           text,
  logo_png_url       text,
  description        text,
  website_url        text,
  is_partner         boolean default false,
  is_trusted         boolean default false,
  promo_code_global  text,
  affiliate_url_base text,
  status             text    default 'active',
  created_at         timestamptz default now()
);

-- 4. Table des produits/deals
create table if not exists products (
  id               uuid    default gen_random_uuid() primary key,
  slug             text    unique not null,
  name             text    not null,
  brand_id         uuid    references brands(id) on delete cascade,
  category_id      uuid    references categories(id) on delete set null,
  description      text,
  long_description text,
  why_this_deal    text,
  original_price   numeric not null default 0,
  promo_price      numeric not null default 0,
  discount_percent integer default 0,
  promo_code       text,
  offer_type       text    default 'code_promo',
  affiliate_url    text,
  main_image_url   text,
  gallery_urls     text[]  default '{}',
  tags             text[]  default '{}',
  van_types        text[]  default '{}',
  is_featured      boolean default false,
  is_active        boolean default true,
  copy_count       integer default 0,
  priority_score   integer default 0,
  expires_at       timestamptz,
  created_at       timestamptz default now()
);

-- 5. Table des offres sauvegardées (peut exister avec un schéma différent)
-- On ajoute les colonnes manquantes si la table existe déjà
do $$
begin
  if not exists (select from information_schema.tables where table_name = 'saved_products') then
    create table saved_products (
      id         uuid default gen_random_uuid() primary key,
      user_id    text not null,
      product_id uuid references products(id) on delete cascade,
      saved_at   timestamptz default now(),
      unique(user_id, product_id)
    );
  end if;
end $$;

-- 6. Table des alertes prix
create table if not exists price_alerts (
  id           uuid    default gen_random_uuid() primary key,
  user_id      text    not null,
  product_id   uuid    references products(id) on delete cascade,
  target_price numeric not null,
  is_active    boolean default true,
  created_at   timestamptz default now()
);

-- 7. Table des demandes de partenariat
create table if not exists partnership_requests (
  id           uuid default gen_random_uuid() primary key,
  clerk_id     text not null,
  company_name text not null,
  email        text not null,
  website      text,
  message      text,
  status       text default 'pending',
  created_at   timestamptz default now()
);

-- 8. RLS — activer sur toutes les nouvelles tables
alter table categories          enable row level security;
alter table brands              enable row level security;
alter table products            enable row level security;
alter table price_alerts        enable row level security;
alter table partnership_requests enable row level security;

-- 9. Policies lecture publique pour categories, brands, products
create policy "Public read categories"  on categories  for select using (true);
create policy "Public read brands"      on brands      for select using (true);
create policy "Public read products"    on products    for select using (is_active = true);

-- 10. Policies saved_products — lecture/écriture par owner
create policy "Users read own saved" on saved_products
  for select using (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

create policy "Users insert own saved" on saved_products
  for insert with check (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

create policy "Users delete own saved" on saved_products
  for delete using (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- 11. Policies price_alerts — lecture/écriture par owner
create policy "Users read own alerts" on price_alerts
  for select using (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

create policy "Users insert own alerts" on price_alerts
  for insert with check (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

create policy "Users delete own alerts" on price_alerts
  for delete using (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- 12. Indexes pour les performances
create index if not exists idx_products_brand_id      on products(brand_id);
create index if not exists idx_products_category_id   on products(category_id);
create index if not exists idx_products_is_active     on products(is_active);
create index if not exists idx_products_priority      on products(priority_score desc);
create index if not exists idx_saved_products_user_id on saved_products(user_id);
create index if not exists idx_price_alerts_user_id   on price_alerts(user_id);
