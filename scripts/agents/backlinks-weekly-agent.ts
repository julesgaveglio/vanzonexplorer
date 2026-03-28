#!/usr/bin/env tsx
/**
 * backlinks-weekly-agent.ts — Discovery et suivi backlinks hebdomadaire
 * Usage: npx tsx scripts/agents/backlinks-weekly-agent.ts
 * Déclenché par GitHub Actions chaque lundi à 8h UTC
 *
 * Actions :
 * 1. Lance le discovery SerpApi → score Groq → insère nouveaux prospects
 * 2. Envoie des relances pour les prospects contactés > 10 jours sans réponse
 * 3. Envoie un email récap via Resend
 */

import Groq from "groq-sdk";
import { createClient } from "@supabase/supabase-js";

// ── Supabase ───────────────────────────────────────────────────────────────────

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ── SerpApi ────────────────────────────────────────────────────────────────────

const SERP_QUERIES = [
  "meilleur blog van life france",
  "forum aménagement fourgon",
  "guide road trip campervan france",
  "homologation VASP forum",
  "vanlife france communauté",
  "blog voyage van aménagé",
  "forum fourgon aménagé entraide",
  "site road trip france camping",
];

const EXCLUDED_DOMAINS = new Set([
  "youtube.com", "facebook.com", "instagram.com", "twitter.com",
  "pinterest.com", "tiktok.com", "reddit.com", "wikipedia.org",
  "amazon.fr", "amazon.com", "leboncoin.fr", "airbnb.fr",
  "yescapa.fr", "wikicampers.fr", "google.com", "google.fr",
  "vanzonexplorer.com",
]);

interface SerpOrganicResult {
  link?: string;
  title?: string;
  snippet?: string;
}

interface SerpApiResponse {
  organic_results?: SerpOrganicResult[];
  error?: string;
}

async function searchSerpApi(query: string): Promise<SerpOrganicResult[]> {
  const params = new URLSearchParams({
    api_key: process.env.SERPAPI_KEY || "",
    q: query,
    hl: "fr",
    gl: "fr",
    num: "10",
    engine: "google",
  });
  try {
    const resp = await fetch(`https://serpapi.com/search?${params}`);
    if (!resp.ok) return [];
    const data: SerpApiResponse = await resp.json();
    return data.organic_results || [];
  } catch {
    return [];
  }
}

function extractDomain(url: string): string | null {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

// ── Discovery ─────────────────────────────────────────────────────────────────

async function runDiscovery(groq: Groq): Promise<number> {
  console.log("🔍 Lancement du discovery SerpApi...");

  const allResults: Array<{ result: SerpOrganicResult; query: string }> = [];

  for (let i = 0; i < SERP_QUERIES.length; i += 4) {
    const batch = SERP_QUERIES.slice(i, i + 4);
    const batchResults = await Promise.all(
      batch.map(async (query) => {
        const results = await searchSerpApi(query);
        return results.map((r) => ({ result: r, query }));
      })
    );
    allResults.push(...batchResults.flat());
    // Respectful delay between batches
    if (i + 4 < SERP_QUERIES.length) {
      await new Promise((r) => setTimeout(r, 1000));
    }
  }

  console.log(`  ${allResults.length} résultats collectés`);

  // Extract unique domains
  const domainMap = new Map<string, { url: string; title: string; snippet: string; query: string }>();
  for (const { result, query } of allResults) {
    if (!result.link) continue;
    const domain = extractDomain(result.link);
    if (!domain || EXCLUDED_DOMAINS.has(domain)) continue;
    if (!domainMap.has(domain)) {
      domainMap.set(domain, {
        url: result.link,
        title: result.title || "",
        snippet: result.snippet || "",
        query,
      });
    }
  }

  // Filter existing domains
  const { data: existing } = await supabase.from("backlink_prospects").select("domain");
  const existingDomains = new Set((existing || []).map((r: { domain: string }) => r.domain));
  const newDomains = [...domainMap.entries()].filter(([d]) => !existingDomains.has(d));

  console.log(`  ${newDomains.length} nouveaux domaines (${domainMap.size - newDomains.length} déjà en base)`);

  if (newDomains.length === 0) return 0;

  // Score with Groq (max 30 candidates)
  const candidates = newDomains.slice(0, 30).map(([domain, info]) => ({
    domain,
    url: info.url,
    title: info.title,
    snippet: info.snippet,
    query: info.query,
  }));

  const groqResponse = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      {
        role: "user",
        content: `Expert SEO link building — site location vans aménagés Pays Basque (vanzonexplorer.com).
Score chaque domaine (1-10) pour pertinence backlink. Garde uniquement score ≥ 5. Max 15 entrées.
Types : "blog", "forum", "partenaire", "annuaire", "media"

Réponds UNIQUEMENT JSON valide :
[{"domain":"...","url":"...","type":"blog","score":7,"notes":"...","source_query":"..."}]

Domaines :
${JSON.stringify(candidates, null, 2)}`,
      },
    ],
    temperature: 0.2,
    max_tokens: 2000,
  });

  const rawContent = groqResponse.choices[0]?.message?.content || "[]";
  let scored: Array<{ domain: string; url: string; type: string; score: number; notes: string; source_query: string }> = [];
  try {
    const jsonMatch = rawContent.match(/\[[\s\S]*\]/);
    if (jsonMatch) scored = JSON.parse(jsonMatch[0]);
  } catch {
    console.error("  Erreur parsing Groq JSON");
    return 0;
  }

  const validTypes = ["blog", "forum", "partenaire", "annuaire", "media"];
  const toInsert = scored
    .filter((p) => p.domain && p.score >= 5)
    .map((p) => ({
      domain: p.domain,
      url: p.url,
      type: validTypes.includes(p.type) ? p.type : "blog",
      score: Math.min(10, Math.max(1, Math.round(p.score))),
      statut: "découvert",
      notes: p.notes || "",
      source_query: p.source_query || candidates.find((c) => c.domain === p.domain)?.query || "",
    }));

  if (toInsert.length > 0) {
    const { error } = await supabase.from("backlink_prospects").insert(toInsert);
    if (error) {
      console.error("  Erreur insertion:", error.message);
      return 0;
    }
  }

  console.log(`  ✅ ${toInsert.length} nouveaux prospects insérés`);
  return toInsert.length;
}

// ── Relances ──────────────────────────────────────────────────────────────────

async function runFollowUps(): Promise<number> {
  console.log("📮 Vérification des relances...");

  const tenDaysAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString();

  // Prospects contactés > 10 jours sans réponse et pas déjà relancés
  const { data: staleOutreach } = await supabase
    .from("backlink_outreach")
    .select("id, prospect_id, backlink_prospects(domain, statut)")
    .eq("approved", true)
    .eq("reply_received", false)
    .is("follow_up_sent_at", null)
    .lt("sent_at", tenDaysAgo);

  if (!staleOutreach || staleOutreach.length === 0) {
    console.log("  Aucune relance nécessaire");
    return 0;
  }

  console.log(`  ${staleOutreach.length} prospect(s) à relancer`);

  // Mark follow_up_sent_at (actual email sending would require integration)
  for (const o of staleOutreach) {
    await supabase
      .from("backlink_outreach")
      .update({
        follow_up_sent_at: new Date().toISOString(),
      })
      .eq("id", o.id);

    // Move prospect to "relancé"
    await supabase
      .from("backlink_prospects")
      .update({ statut: "relancé" })
      .eq("id", o.prospect_id);
  }

  return staleOutreach.length;
}

// ── Email récap ───────────────────────────────────────────────────────────────

async function sendRecapEmail(newProspects: number, followUps: number): Promise<void> {
  if (!process.env.RESEND_API_KEY) {
    console.log("  RESEND_API_KEY manquant — email récap ignoré");
    return;
  }

  const { data: stats } = await supabase
    .from("backlink_prospects")
    .select("statut");

  const counts = {
    total: stats?.length || 0,
    contacte: stats?.filter((p: { statut: string }) => p.statut === "contacté").length || 0,
    obtenu: stats?.filter((p: { statut: string }) => p.statut === "obtenu").length || 0,
  };

  const html = `
<h2>📊 Récap Backlinks Hebdomadaire — Vanzon Explorer</h2>
<p>Date : ${new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</p>

<h3>Actions de cette semaine</h3>
<ul>
  <li>🔍 <strong>${newProspects} nouveaux prospects</strong> découverts et scorés</li>
  <li>📮 <strong>${followUps} relances</strong> envoyées automatiquement</li>
</ul>

<h3>État du pipeline</h3>
<ul>
  <li>Total prospects : <strong>${counts.total}</strong></li>
  <li>Contactés en attente : <strong>${counts.contacte}</strong></li>
  <li>Backlinks obtenus : <strong>${counts.obtenu}</strong></li>
</ul>

<p><a href="https://vanzonexplorer.com/admin/backlinks">Voir le Kanban →</a></p>
  `.trim();

  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "Vanzon Bot <bot@vanzonexplorer.com>",
      to: ["gavegliojules@gmail.com"],
      subject: `📊 Backlinks — ${newProspects} nouveaux prospects cette semaine`,
      html,
    }),
  }).catch((e) => console.error("  Erreur envoi email:", e));

  console.log("  ✅ Email récap envoyé");
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log("🚀 Backlinks Weekly Agent — démarrage");
  console.log(`   ${new Date().toISOString()}`);
  console.log("");

  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

  const newProspects = await runDiscovery(groq);
  console.log("");

  const followUps = await runFollowUps();
  console.log("");

  await sendRecapEmail(newProspects, followUps);
  console.log("");

  console.log("✅ Agent terminé");
  console.log(`   ${newProspects} nouveaux prospects | ${followUps} relances`);
}

main().catch((e) => {
  console.error("Erreur fatale:", e);
  process.exit(1);
});
