#!/usr/bin/env tsx
/**
 * run-cmo-migration.ts — Applique la migration SQL des tables CMO dans Supabase
 * Usage: npx tsx scripts/run-cmo-migration.ts
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Extrait le project ref depuis l'URL Supabase
const PROJECT_REF = SUPABASE_URL.replace("https://", "").split(".")[0];

const SQL = `
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

create index if not exists cmo_reports_type_created on cmo_reports(type, created_at desc);
create index if not exists cmo_actions_report_id on cmo_actions(report_id);
create index if not exists cmo_actions_status on cmo_actions(status);
`;

async function main() {
  console.log("[Migration CMO] Démarrage — project:", PROJECT_REF);

  // Vérifier si les tables existent déjà
  const checkRes = await fetch(
    `${SUPABASE_URL}/rest/v1/cmo_reports?select=id&limit=1`,
    {
      headers: {
        apikey: SERVICE_KEY,
        Authorization: `Bearer ${SERVICE_KEY}`,
      },
    }
  );

  if (checkRes.ok) {
    console.log("✅ Table cmo_reports existe déjà — migration déjà appliquée.");
    return;
  }

  console.log("[Migration CMO] Tables absentes (status:", checkRes.status, "), application...");

  // Utiliser l'API Management Supabase
  const res = await fetch(
    `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${SERVICE_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query: SQL }),
    }
  );

  const body = await res.text();
  console.log("[Migration CMO] Status:", res.status);
  console.log("[Migration CMO] Response:", body.slice(0, 400));

  if (res.ok) {
    console.log("✅ Migration appliquée avec succès !");
  } else {
    console.error("❌ Échec de la migration.");
    process.exit(1);
  }
}

main().catch(console.error);
