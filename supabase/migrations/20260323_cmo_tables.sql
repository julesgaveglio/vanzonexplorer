-- supabase/migrations/20260323_cmo_tables.sql

create table if not exists cmo_reports (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('weekly', 'monthly', 'adhoc')),
  created_at timestamptz default now(),
  period_label text,
  health_score integer check (health_score between 0 and 100),
  content jsonb not null default '{}',
  status text default 'active' check (status in ('active', 'archived'))
);

create table if not exists cmo_actions (
  id uuid primary key default gen_random_uuid(),
  report_id uuid references cmo_reports(id) on delete cascade,
  created_at timestamptz default now(),
  title text not null,
  channel text check (channel in ('acquisition', 'content', 'retention', 'reputation', 'intelligence')),
  ice_score integer check (ice_score between 0 and 100),
  effort text check (effort in ('low', 'medium', 'high')),
  status text default 'todo' check (status in ('todo', 'in_progress', 'done')),
  notes text
);

-- Index pour les requêtes courantes
create index if not exists cmo_reports_type_created on cmo_reports(type, created_at desc);
create index if not exists cmo_actions_report_id on cmo_actions(report_id);
create index if not exists cmo_actions_status on cmo_actions(status);
