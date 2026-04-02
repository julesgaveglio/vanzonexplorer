// src/lib/vanzon-memory/search.ts
// Full-text search dans la mémoire Vanzon.
// Compatible tsx CLI (pas de fs ni de modules Next.js-only).

import { createClient } from "@supabase/supabase-js";
import type { MemoryNote } from "./types";

// Créer le client Supabase manuellement pour compatibilité tsx CLI
// (createSupabaseAdmin() utilise next/headers — non disponible hors Next.js)
function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(url, key);
}

export interface SearchMemoryParams {
  query:       string;
  category?:   string;
  after_date?: string;  // ISO date string ex: "2026-03-01"
  limit?:      number;
}

export async function searchVanzonMemory(params: SearchMemoryParams): Promise<MemoryNote[]> {
  const { query, category, after_date, limit = 5 } = params;
  const supabase = getSupabaseClient();

  // Préparer la query FTS : mots séparés par & pour AND, caractères spéciaux supprimés
  const ftsQuery = query
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map(w => w.replace(/[^a-zA-ZÀ-ÿ0-9]/g, ""))
    .filter(Boolean)
    .join(" & ");

  let dbQuery = supabase
    .from("vanzon_memory")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (ftsQuery) {
    // Cible la colonne générée fts_vector (TSVECTOR STORED) définie dans la migration
    // Le client Supabase JS ne supporte pas les expressions SQL comme nom de colonne
    dbQuery = dbQuery.textSearch("fts_vector", ftsQuery, { config: "french" });
  }

  if (category) {
    dbQuery = dbQuery.eq("category", category);
  }

  if (after_date) {
    dbQuery = dbQuery.gte("created_at", after_date);
  }

  const { data, error } = await dbQuery;

  if (error) {
    console.error("[memory search] error:", error);
    return [];
  }

  return (data ?? []) as MemoryNote[];
}
