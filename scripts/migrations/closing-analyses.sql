-- Table pour l'app Closer Coach (/closer) : historique des analyses d'appels de closing.
-- Distincte de closing_calls (qui est liée aux réservations Calendly).
-- À exécuter dans le SQL editor Supabase.

create table if not exists closing_analyses (
  id uuid primary key default gen_random_uuid(),
  title text,
  prospect text,
  transcript text not null,
  analysis jsonb not null,
  score int,
  created_at timestamptz not null default now()
);

create index if not exists closing_analyses_created_at_idx
  on closing_analyses (created_at desc);

-- RLS : accès uniquement via la service_role key (createSupabaseAdmin), pas d'accès public.
alter table closing_analyses enable row level security;
