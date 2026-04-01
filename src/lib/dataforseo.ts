const DFS_BASE = "https://api.dataforseo.com/v3";

// Taux de conversion USD → EUR (mis à jour manuellement si besoin)
const USD_TO_EUR = 0.92;

// Labels lisibles par endpoint DataForSEO
const ENDPOINT_LABELS: Record<string, string> = {
  "/serp/google/organic/live/advanced":                    "Analyse SERP Google — positions organiques",
  "/serp/google/organic/live/regular":                     "Analyse SERP Google — résultats organiques",
  "/dataforseo_labs/google/keyword_ideas/live":            "Idées de mots-clés Google",
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

function getAuthHeader(): string {
  const login = process.env.DATAFORSEO_LOGIN!;
  const password = process.env.DATAFORSEO_PASSWORD!;
  return "Basic " + Buffer.from(`${login}:${password}`).toString("base64");
}

// Log silencieux dans Supabase — fire-and-forget, ne bloque jamais l'appel principal
async function logDfsCall(endpoint: string, costUsd: number, statusCode: number): Promise<void> {
  if (costUsd <= 0) return; // ne loguer que les appels facturés
  try {
    const { createSupabaseAdmin } = await import("@/lib/supabase/server");
    const sb = createSupabaseAdmin();
    const label = ENDPOINT_LABELS[endpoint] ?? endpoint.split("/").filter(Boolean).join(" / ");
    await sb.from("dataforseo_logs").insert({
      endpoint,
      label,
      cost_usd: costUsd,
      cost_eur: Number((costUsd * USD_TO_EUR).toFixed(6)),
      status_code: statusCode,
    });
  } catch {
    // jamais bloquer l'appel principal pour un log raté
  }
}

export async function dfsPost<T = unknown>(
  endpoint: string,
  body: unknown
): Promise<T> {
  const res = await fetch(`${DFS_BASE}${endpoint}`, {
    method: "POST",
    headers: {
      Authorization: getAuthHeader(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    next: { revalidate: 300 }, // 5 min cache
  });

  if (!res.ok) {
    throw new Error(`DataForSEO error ${res.status}: ${await res.text()}`);
  }

  const json = await res.json();

  // Log automatique du coût (fire-and-forget)
  void logDfsCall(endpoint, Number(json.cost ?? 0), Number(json.status_code ?? 0));

  if (json.status_code !== 20000) {
    throw new Error(`DataForSEO API error: ${json.status_message}`);
  }

  return json.tasks?.[0]?.result?.[0] as T;
}

export const DFS_TARGET = "vanzonexplorer.com";
export const DFS_LOCATION = "France";
export const DFS_LANGUAGE = "fr";
export const DFS_LOCATION_CODE = 2250;
export const DFS_LANGUAGE_CODE = "fr";

export async function dfsPostRaw<T = unknown>(
  endpoint: string,
  body: unknown
): Promise<T> {
  const res = await fetch(`${DFS_BASE}${endpoint}`, {
    method: "POST",
    headers: {
      Authorization: getAuthHeader(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    next: { revalidate: 3600 },
  });
  if (!res.ok) {
    throw new Error(`DataForSEO HTTP error ${res.status}: ${await res.text()}`);
  }
  const json = await res.json();

  // Log automatique du coût (fire-and-forget)
  void logDfsCall(
    endpoint,
    Number((json as Record<string, unknown>).cost ?? 0),
    Number((json as Record<string, unknown>).status_code ?? 0),
  );

  return json as T;
}
