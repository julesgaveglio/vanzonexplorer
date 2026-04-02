#!/usr/bin/env tsx
/**
 * backlinks-weekly-agent.ts — Discovery intelligent + extraction email
 * Usage: npx tsx scripts/agents/backlinks-weekly-agent.ts
 * Déclenché par GitHub Actions chaque lundi à 8h UTC
 *
 * Stratégie évolutive :
 * 1. Charge l'historique des sessions → sélectionne les 4 clusters les moins récents
 * 2. La méthode de recherche tourne chaque semaine (general → blog → local → forum)
 * 3. Tavily search (2 keywords/cluster) → collecte de domaines
 * 4. Jina AI → extraction légère d'emails (contact/about/homepage)
 * 5. Groq → score de pertinence backlink (multi-clé fallback)
 * 6. Insère nouveaux prospects (déduplication stricte par domaine)
 * 7. Enregistre la session pour guider la prochaine rotation
 */

import Groq from "groq-sdk";
import { createClient } from "@supabase/supabase-js";
import { notifyTelegram } from "../lib/telegram";
import KEYWORDS_DATA from "../data/backlink-keywords.json";

// ── Supabase ───────────────────────────────────────────────────────────────────
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ── Env checks ─────────────────────────────────────────────────────────────────
const TAVILY_API_KEY   = process.env.TAVILY_API_KEY   ?? "";
const JINA_API_KEY     = process.env.JINA_API_KEY     ?? "";
const GROQ_KEYS        = [
  process.env.GROQ_API_KEY,
  process.env.GROQ_API_KEY_2,
  process.env.GROQ_API_KEY_3,
].filter(Boolean) as string[];

function log(msg: string) {
  console.log(`[${new Date().toISOString()}] ${msg}`);
}

// ── Méthodes de recherche (rotation hebdomadaire) ─────────────────────────────
const METHODS = ["tavily_general", "tavily_blog", "tavily_local", "tavily_forum"] as const;
type Method = typeof METHODS[number];

function buildQuery(keyword: string, method: Method): string {
  switch (method) {
    case "tavily_blog":   return `blog ${keyword}`;
    case "tavily_local":  return `${keyword} pays basque`;
    case "tavily_forum":  return `forum communauté ${keyword}`;
    default:              return keyword;
  }
}

// ── Groq multi-clé fallback ────────────────────────────────────────────────────
async function groqComplete(messages: Groq.Chat.ChatCompletionMessageParam[], maxTokens = 1500): Promise<string> {
  for (const key of GROQ_KEYS) {
    try {
      const client = new Groq({ apiKey: key });
      const resp = await client.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages,
        temperature: 0.2,
        max_tokens: maxTokens,
      });
      return resp.choices[0]?.message?.content ?? "";
    } catch (err) {
      const msg = (err as Error).message ?? "";
      if (msg.includes("429") || msg.includes("rate_limit")) {
        log(`  Groq rate limit — rotation clé suivante`);
        continue;
      }
      throw err;
    }
  }
  throw new Error("Toutes les clés Groq sont épuisées");
}

// ── Tavily search ──────────────────────────────────────────────────────────────
interface TavilyResult {
  url?: string;
  title?: string;
  content?: string;
}

async function searchTavily(query: string): Promise<TavilyResult[]> {
  if (!TAVILY_API_KEY) return [];
  try {
    const res = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ api_key: TAVILY_API_KEY, query, max_results: 10 }),
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) return [];
    const data = await res.json() as { results?: TavilyResult[] };
    return data.results ?? [];
  } catch {
    return [];
  }
}

// ── Extraction d'email via regex (légère, sans API payante) ───────────────────
const EMAIL_REGEX = /\b[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}\b/g;
const FAKE_EMAIL_DOMAINS = new Set([
  "example.com", "sentry.io", "rollbar.com", "google.com", "googleapis.com",
  "w3.org", "schema.org", "cloudflare.com", "wordpress.com", "woocommerce.com",
  "gravatar.com", "wp.com", "cdn.com", "amazonaws.com",
]);

function extractEmailsFromText(text: string): string[] {
  const matches = text.match(EMAIL_REGEX) ?? [];
  return [...new Set(matches)].filter((email) => {
    const domain = email.split("@")[1]?.toLowerCase() ?? "";
    return !FAKE_EMAIL_DOMAINS.has(domain) && !domain.includes("png") && !domain.includes("jpg");
  });
}

// ── Jina scrape (léger, max 3 pages/domaine) ──────────────────────────────────
async function extractEmailFromDomain(domain: string): Promise<{ email: string; source: string } | null> {
  if (!JINA_API_KEY) return null;

  const baseUrl = `https://${domain}`;
  const pagesToTry = [`${baseUrl}/contact`, `${baseUrl}/a-propos`, `${baseUrl}/about`, baseUrl];

  for (const page of pagesToTry) {
    try {
      const res = await fetch(`https://r.jina.ai/${page}`, {
        headers: {
          Authorization: `Bearer ${JINA_API_KEY}`,
          Accept: "text/plain",
          "X-Return-Format": "text",
          "X-Timeout": "8",
        },
        signal: AbortSignal.timeout(10000),
      });
      if (!res.ok) continue;

      const text = await res.text();
      const emails = extractEmailsFromText(text);

      // Préférer un email sur le bon domaine
      const onDomain = emails.find((e) => e.endsWith(`@${domain}`) || e.endsWith(`@www.${domain}`));
      if (onDomain) return { email: onDomain, source: "jina_regex" };
      if (emails[0]) return { email: emails[0], source: "jina_regex" };
    } catch {
      // non-bloquant
    }
  }
  return null;
}

// ── Extraction du domaine ──────────────────────────────────────────────────────
function extractDomain(url: string): string | null {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

// ── Chargement de l'historique des sessions ────────────────────────────────────
interface Session {
  clusters_used: string[];
  session_date: string;
}

async function loadSessions(): Promise<Session[]> {
  const { data } = await supabase
    .from("backlink_scrape_sessions")
    .select("clusters_used, session_date")
    .order("session_date", { ascending: false })
    .limit(16);
  return data ?? [];
}

// ── Sélection des clusters à cibler cette semaine ─────────────────────────────
function selectClusters(sessions: Session[]): typeof KEYWORDS_DATA.clusters {
  // Map cluster_id → dernière utilisation
  const lastUsed = new Map<string, Date>();
  for (const session of sessions) {
    for (const clusterId of session.clusters_used) {
      const d = new Date(session.session_date);
      const prev = lastUsed.get(clusterId);
      if (!prev || d > prev) lastUsed.set(clusterId, d);
    }
  }

  // Trier par date la plus ancienne → priorité aux clusters jamais utilisés
  return [...KEYWORDS_DATA.clusters]
    .map((c) => ({ ...c, _lastUsed: lastUsed.get(c.id) ?? new Date(0) }))
    .sort((a, b) => a._lastUsed.getTime() - b._lastUsed.getTime())
    .slice(0, 4)
    .map(({ _lastUsed: _, ...c }) => c);
}

// ── Scoring Groq par batch ─────────────────────────────────────────────────────
interface Candidate {
  domain: string;
  url: string;
  title: string;
  snippet: string;
  query: string;
}

interface ScoredProspect {
  domain: string;
  url: string;
  type: string;
  score: number;
  notes: string;
  source_query: string;
}

async function scoreWithGroq(candidates: Candidate[]): Promise<ScoredProspect[]> {
  const raw = await groqComplete([{
    role: "user",
    content: `Expert SEO link building — vanzonexplorer.com (location vans aménagés Pays Basque, vanlife, road trip, outdoor).
Score chaque domaine (1-10) pour pertinence backlink. Inclus uniquement score >= 5.
Types : "blog", "forum", "partenaire", "annuaire", "media"

Réponds UNIQUEMENT avec un JSON valide (tableau) :
[{"domain":"...","url":"...","type":"blog","score":7,"notes":"...","source_query":"..."}]

Domaines à scorer :
${JSON.stringify(candidates, null, 2)}`,
  }]);

  try {
    const match = raw.match(/\[[\s\S]*\]/);
    if (!match) return [];
    const scored = JSON.parse(match[0]) as ScoredProspect[];
    const validTypes = new Set(["blog", "forum", "partenaire", "annuaire", "media"]);
    return scored
      .filter((p) => p.domain && p.score >= 5)
      .map((p) => ({
        ...p,
        type: validTypes.has(p.type) ? p.type : "blog",
        score: Math.min(10, Math.max(1, Math.round(p.score))),
        notes: p.notes ?? "",
        source_query: p.source_query ?? candidates.find((c) => c.domain === p.domain)?.query ?? "",
      }));
  } catch {
    return [];
  }
}

// ── Discovery principal ────────────────────────────────────────────────────────
async function runDiscovery(
  clusters: typeof KEYWORDS_DATA.clusters,
  method: Method,
  excludedDomains: Set<string>
): Promise<{ candidates: Candidate[]; rawCount: number }> {

  log(`🔍 Méthode : ${method} — ${clusters.length} clusters`);

  const domainMap = new Map<string, Candidate>();

  for (const cluster of clusters) {
    // 2 keywords par cluster pour limiter les appels Tavily
    const selectedKeywords = cluster.keywords.slice(0, 2);

    for (const keyword of selectedKeywords) {
      const query = buildQuery(keyword, method);
      log(`  Tavily : "${query}"`);

      const results = await searchTavily(query);

      for (const r of results) {
        if (!r.url) continue;
        const domain = extractDomain(r.url);
        if (!domain || excludedDomains.has(domain) || domainMap.has(domain)) continue;
        domainMap.set(domain, {
          domain,
          url: r.url,
          title: r.title ?? "",
          snippet: r.content?.slice(0, 200) ?? "",
          query,
        });
      }

      // Délai poli entre requêtes Tavily
      await new Promise((r) => setTimeout(r, 800));
    }
  }

  return {
    candidates: [...domainMap.values()],
    rawCount: domainMap.size,
  };
}

// ── Main ───────────────────────────────────────────────────────────────────────
async function main() {
  log("🚀 Backlinks Weekly Agent — démarrage");

  if (!TAVILY_API_KEY) throw new Error("TAVILY_API_KEY manquant");
  if (GROQ_KEYS.length === 0) throw new Error("Aucune GROQ_API_KEY configurée");

  // 1. Charger l'historique + domaines existants
  const [sessions, { data: existingProspects }] = await Promise.all([
    loadSessions(),
    supabase.from("backlink_prospects").select("domain"),
  ]);

  const existingDomains = new Set((existingProspects ?? []).map((r: { domain: string }) => r.domain));
  const excludedDomains = new Set([
    ...KEYWORDS_DATA.excluded_domains,
    ...existingDomains,
  ]);

  log(`📦 ${existingDomains.size} domaines déjà en base`);

  // 2. Sélectionner clusters et méthode
  const selectedClusters = selectClusters(sessions);
  const method: Method = METHODS[sessions.length % METHODS.length];

  log(`📂 Clusters : ${selectedClusters.map((c) => c.id).join(", ")}`);
  log(`⚙️  Méthode : ${method} (session #${sessions.length + 1})`);

  // 3. Discovery via Tavily
  const { candidates, rawCount } = await runDiscovery(selectedClusters, method, excludedDomains);

  log(`🌐 ${rawCount} domaines trouvés (${candidates.length} nouveaux potentiels)`);

  if (candidates.length === 0) {
    log("Aucun nouveau domaine — session enregistrée sans insertion.");
    await supabase.from("backlink_scrape_sessions").insert({
      clusters_used: selectedClusters.map((c) => c.id),
      keywords_used: selectedClusters.flatMap((c) => c.keywords.slice(0, 2)),
      method,
      domains_found: 0, domains_new: 0, emails_found: 0, prospects_inserted: 0,
    });
    await notifyTelegram(`🔗 *Backlinks Weekly* — Aucun nouveau domaine (${rawCount} vus, tous déjà en base).`);
    return;
  }

  // 4. Limiter à 25 candidats max pour ne pas saturer Jina + Groq
  const toProcess = candidates.slice(0, 25);

  // 5. Extraction emails via Jina (en parallèle, max 5 à la fois)
  log(`📧 Extraction emails Jina sur ${toProcess.length} domaines...`);
  let emailsFound = 0;
  const emailMap = new Map<string, { email: string; source: string }>();

  for (let i = 0; i < toProcess.length; i += 5) {
    const batch = toProcess.slice(i, i + 5);
    const results = await Promise.allSettled(
      batch.map((c) => extractEmailFromDomain(c.domain))
    );
    for (let j = 0; j < results.length; j++) {
      const result = results[j];
      if (result.status === "fulfilled" && result.value) {
        emailMap.set(batch[j].domain, result.value);
        emailsFound++;
      }
    }
    // Délai entre batches Jina
    if (i + 5 < toProcess.length) await new Promise((r) => setTimeout(r, 1000));
  }

  log(`  ${emailsFound} emails extraits`);

  // 6. Scoring Groq par batch de 15
  log("🎯 Scoring Groq...");
  const scored: ScoredProspect[] = [];

  for (let i = 0; i < toProcess.length; i += 15) {
    const batch = toProcess.slice(i, i + 15);
    const batchScored = await scoreWithGroq(batch);
    scored.push(...batchScored);
    if (i + 15 < toProcess.length) await new Promise((r) => setTimeout(r, 500));
  }

  log(`  ${scored.length} prospects scorés (score ≥ 5)`);

  // 7. Insertion en DB
  if (scored.length === 0) {
    log("Aucun prospect retenu après scoring.");
  } else {
    const toInsert = scored.map((p) => ({
      domain:         p.domain,
      url:            p.url,
      type:           p.type,
      score:          p.score,
      statut:         "découvert",
      notes:          p.notes,
      source_query:   p.source_query,
      contact_email:  emailMap.get(p.domain)?.email ?? null,
      contact_source: emailMap.get(p.domain)?.source ?? null,
    }));

    const { error } = await supabase.from("backlink_prospects").insert(toInsert);
    if (error) throw new Error(`Erreur insertion prospects : ${error.message}`);

    log(`✅ ${toInsert.length} prospects insérés (dont ${toInsert.filter((p) => p.contact_email).length} avec email)`);
  }

  // 8. Enregistrement de la session
  await supabase.from("backlink_scrape_sessions").insert({
    clusters_used:      selectedClusters.map((c) => c.id),
    keywords_used:      selectedClusters.flatMap((c) => c.keywords.slice(0, 2).map((k) => buildQuery(k, method))),
    method,
    domains_found:      rawCount,
    domains_new:        candidates.length,
    emails_found:       emailsFound,
    prospects_inserted: scored.length,
  });

  // 9. Telegram
  const withEmail = scored.filter((p) => emailMap.has(p.domain)).length;
  const tgLines = [
    `🔗 *Backlinks Weekly* — Discovery terminé`,
    ``,
    `🌐 Domaines trouvés : ${rawCount}`,
    `✨ Nouveaux : ${candidates.length}`,
    `🎯 Scorés (≥5) : ${scored.length}`,
    `📧 Avec email : ${withEmail}`,
    `📂 Clusters : ${selectedClusters.map((c) => c.theme).join(", ")}`,
    `⚙️ Méthode : ${method}`,
  ].join("\n");

  await notifyTelegram(tgLines);
  log("✅ Agent terminé");
}

main().catch(async (err) => {
  const msg = (err as Error).message ?? String(err);
  console.error("[backlinks-weekly] FATAL:", msg);
  await notifyTelegram(`❌ *Backlinks Weekly* — Erreur fatale :\n${msg}`).catch(() => {});
  process.exit(1);
});
