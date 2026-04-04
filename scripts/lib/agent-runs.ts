/**
 * scripts/lib/agent-runs.ts
 *
 * Audit trail for agent executions.
 * Each agent calls startRun() at the beginning, finishRun() at the end.
 */

import type { ApiCostsJson } from "./ai-costs";
import { getSupabaseClient, USD_TO_EUR } from "./supabase";

const ENDPOINT_LABELS: Record<string, string> = {
  "/serp/google/organic/live/advanced":                    "Analyse SERP Google — positions organiques",
  "/serp/google/organic/live/regular":                     "Analyse SERP Google — résultats organiques",
  "/dataforseo_labs/google/keyword_ideas/live":            "Idées de mots-clés Google",
  "/dataforseo_labs/google/keyword_overview/live":         "Aperçu d'un mot-clé (volume, difficulté)",
  "/dataforseo_labs/google/ranked_keywords/live":          "Mots-clés positionnés du domaine",
  "/dataforseo_labs/google/domain_rank_overview/live":     "Vue d'ensemble domaine (autorité & trafic)",
  "/dataforseo_labs/google/competitors_domain/live":       "Analyse des concurrents SEO",
  "/dataforseo_labs/google/keyword_suggestions/live":      "Suggestions de mots-clés",
  "/dataforseo_labs/google/related_keywords/live":         "Mots-clés associés",
  "/dataforseo_labs/google/bulk_keyword_difficulty/live":  "Difficulté des mots-clés (bulk)",
  "/dataforseo_labs/google/search_intent/live":            "Analyse intention de recherche",
  "/on_page/instant_pages":                                "Audit on-page d'une page",
  "/on_page/lighthouse":                                   "Audit Lighthouse (performance)",
  "/ai_optimization/llm_mentions/live/advanced":           "Visibilité IA — mentions LLM",
  "/backlinks/summary/live":                               "Résumé des backlinks du domaine",
  "/backlinks/referring_domains/live":                     "Domaines référents",
  "/content_analysis/search/live":                         "Analyse de contenu — recherche",
};

export interface RunResult {
  status: "success" | "error";
  itemsProcessed?: number;
  itemsCreated?: number;
  error?: string;
  metadata?: Record<string, unknown>;
  costEur?: number;
  tokensInput?: number;
  tokensOutput?: number;
  apiCosts?: ApiCostsJson;
}

/**
 * Logue un appel DataForSEO dans dataforseo_logs.
 * Fire-and-forget — ne bloque jamais l'agent.
 */
export async function logDfsCall(endpoint: string, costUsd: number): Promise<void> {
  if (costUsd <= 0) return;
  try {
    const sb = getSupabaseClient();
    const label = ENDPOINT_LABELS[endpoint] ?? endpoint.split("/").filter(Boolean).join(" / ");
    await sb.from("dataforseo_logs").insert({
      endpoint,
      label,
      cost_usd: costUsd,
      cost_eur: Number((costUsd * USD_TO_EUR).toFixed(6)),
      status_code: 20000,
    });
  } catch {
    // non-fatal
  }
}

/** Démarre un run. Retourne l'id du run à passer à finishRun(). */
export async function startRun(
  agentName: string,
  metadata?: Record<string, unknown>
): Promise<string> {
  try {
    const sb = getSupabaseClient();
    const { data, error } = await sb
      .from("agent_runs")
      .insert({ agent_name: agentName, status: "running", metadata })
      .select("id")
      .single();
    if (error) throw error;
    return (data as { id: string }).id;
  } catch {
    // Ne jamais bloquer l'agent si l'audit échoue
    return "no-op";
  }
}

/** Termine un run avec son résultat. */
export async function finishRun(runId: string, result: RunResult): Promise<void> {
  if (runId === "no-op") return;
  try {
    const sb = getSupabaseClient();
    await sb.from("agent_runs").update({
      finished_at:     new Date().toISOString(),
      status:          result.status,
      items_processed: result.itemsProcessed ?? 0,
      items_created:   result.itemsCreated ?? 0,
      error_message:   result.error ?? null,
      ...(result.metadata ? { metadata: result.metadata } : {}),
      ...(result.costEur      !== undefined ? { cost_eur:        result.costEur }      : {}),
      ...(result.tokensInput  !== undefined ? { tokens_input:    result.tokensInput }  : {}),
      ...(result.tokensOutput !== undefined ? { tokens_output:   result.tokensOutput } : {}),
      ...(result.apiCosts     !== undefined ? { api_costs_json:  result.apiCosts }     : {}),
    }).eq("id", runId);
  } catch {
    // Non-fatal
  }
}
