-- Table pour l'app Closer Coach (/closer) : historique + mémoire des appels de closing.
-- Source de vérité. Le script scripts/closing-memory-sync.ts matérialise ensuite
-- la mémoire Obsidian (Vanzon Memory Database) à partir de cette table.
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

-- Colonnes de contexte / rangement (ajoutées pour la mémoire structurée).
alter table closing_analyses add column if not exists closer text;
alter table closing_analyses add column if not exists call_date date;
alter table closing_analyses add column if not exists ville text;
alter table closing_analyses add column if not exists statut text;
alter table closing_analyses add column if not exists context jsonb;
-- Lien vers la réservation Calendly du prospect (closing_calls).
alter table closing_analyses add column if not exists closing_call_id uuid references closing_calls(id) on delete set null;
-- Empreinte du transcript pour éviter les doublons à l'import.
alter table closing_analyses add column if not exists transcript_hash text;

create index if not exists closing_analyses_created_at_idx on closing_analyses (created_at desc);
create index if not exists closing_analyses_closer_idx on closing_analyses (closer);
create index if not exists closing_analyses_statut_idx on closing_analyses (statut);
create unique index if not exists closing_analyses_transcript_hash_uidx
  on closing_analyses (transcript_hash) where transcript_hash is not null;

-- RLS : accès uniquement via la service_role key (createSupabaseAdmin).
alter table closing_analyses enable row level security;
