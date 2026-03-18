#!/usr/bin/env tsx
/**
 * article-optimizer-quarterly.ts
 *
 * Agent trimestriel d'optimisation des articles publiés.
 * Analyse les performances GSC → identifie les articles à améliorer
 * → génère une version optimisée avec Gemini → met à jour Sanity.
 *
 * Critères d'optimisation :
 *   - Article publié depuis 90+ jours
 *   - Position GSC entre 6 et 30 (potentiel d'amélioration réel)
 *   - CTR < 3% (titre ou meta description à améliorer)
 *   - OU impressions > 500 mais clics < 15 (page 2 avec trafic potentiel)
 *
 * Usage:
 *   npx tsx scripts/agents/article-optimizer-quarterly.ts
 *   npx tsx scripts/agents/article-optimizer-quarterly.ts --dry-run
 *   npx tsx scripts/agents/article-optimizer-quarterly.ts [slug]   # article précis
 *
 * Required env vars:
 *   GEMINI_API_KEY
 *   SANITY_API_WRITE_TOKEN
 *   NEXT_PUBLIC_SANITY_PROJECT_ID
 *   GOOGLE_GSC_CLIENT_ID
 *   GOOGLE_GSC_CLIENT_SECRET
 *   GOOGLE_REFRESH_TOKEN
 */

import path from "path";
import fs from "fs/promises";
import fsSync from "fs";
import { createClient } from "@sanity/client";

const PROJECT_ROOT = path.resolve(path.dirname(__filename), "../..");
const QUEUE_FILE = path.join(PROJECT_ROOT, "scripts/data/article-queue.json");
const SITE_URL = "https://vanzonexplorer.com";
const PROMPTS_DIR = path.join(PROJECT_ROOT, "scripts/agents/prompts");

function loadAgentPrompt(name: string): string | null {
  const mdPath = path.join(PROMPTS_DIR, `${name}.md`);
  return fsSync.existsSync(mdPath) ? fsSync.readFileSync(mdPath, "utf-8").trim() : null;
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface ArticleQueueItem {
  id: string;
  slug: string;
  title: string;
  targetKeyword: string;
  secondaryKeywords: string[];
  status: "pending" | "published";
  sanityId: string | null;
  publishedAt: string | null;
  lastSeoCheck: string | null;
  seoPosition: number | null;
}

interface GscRow {
  url: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

interface OptimizationTarget {
  article: ArticleQueueItem;
  gsc: GscRow;
  reason: string;
}

// ── GSC OAuth ─────────────────────────────────────────────────────────────────

async function getGscAccessToken(): Promise<string> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_GSC_CLIENT_ID!,
      client_secret: process.env.GOOGLE_GSC_CLIENT_SECRET!,
      refresh_token: process.env.GOOGLE_REFRESH_TOKEN!,
      grant_type: "refresh_token",
    }),
  });
  if (!res.ok) throw new Error(`GSC OAuth error: ${await res.text()}`);
  const data = await res.json() as { access_token: string };
  return data.access_token;
}

async function fetchGscData(accessToken: string, urls: string[]): Promise<GscRow[]> {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 90); // 90 jours de données

  const res = await fetch(
    `https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(SITE_URL + "/")}/searchAnalytics/query`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        startDate: startDate.toISOString().slice(0, 10),
        endDate: endDate.toISOString().slice(0, 10),
        dimensions: ["page"],
        dimensionFilterGroups: [
          {
            filters: urls.map((url) => ({
              dimension: "page",
              operator: "equals",
              expression: url,
            })),
          },
        ],
        rowLimit: 1000,
      }),
    }
  );

  if (!res.ok) throw new Error(`GSC API error ${res.status}: ${await res.text()}`);
  const data = await res.json() as { rows?: Array<{ keys: string[]; clicks: number; impressions: number; ctr: number; position: number }> };

  return (data.rows ?? []).map((row) => ({
    url: row.keys[0],
    clicks: row.clicks,
    impressions: row.impressions,
    ctr: Math.round(row.ctr * 1000) / 10,
    position: Math.round(row.position * 10) / 10,
  }));
}

// ── Sanity ────────────────────────────────────────────────────────────────────

function getSanityClient() {
  return createClient({
    projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ?? "lewexa74",
    dataset: "production",
    apiVersion: "2024-01-01",
    token: process.env.SANITY_API_WRITE_TOKEN,
    useCdn: false,
  });
}

interface SanityArticle {
  _id: string;
  title: string;
  body: Array<{ _type: string; children?: Array<{ text?: string }> }>;
  seoTitle?: string;
  seoDescription?: string;
  excerpt?: string;
}

async function fetchArticleFromSanity(sanityId: string): Promise<SanityArticle | null> {
  const client = getSanityClient();
  return client.fetch(`*[_id == $id][0]{ _id, title, body, seoTitle, seoDescription, excerpt }`, { id: sanityId });
}

// Extract plain text from Portable Text body
function extractBodyText(body: SanityArticle["body"]): string {
  return body
    .filter((b) => b._type === "block")
    .map((b) => b.children?.map((c) => c.text ?? "").join("") ?? "")
    .join("\n");
}

// ── Gemini ────────────────────────────────────────────────────────────────────

async function callGemini(prompt: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY manquant");

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          maxOutputTokens: 512,
          temperature: 0.3,
          responseMimeType: "application/json",
        },
      }),
    }
  );
  if (!res.ok) throw new Error(`Gemini HTTP ${res.status}`);
  const json = await res.json() as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
  return (json.candidates?.[0]?.content?.parts?.[0]?.text ?? "").replace(/^```json\s*/i, "").replace(/\s*```$/i, "").trim();
}

interface OptimizedMeta {
  seoTitle: string;
  seoDescription: string;
  excerpt: string;
  improvements: string; // explanation of changes
}

async function generateOptimizedMeta(
  article: SanityArticle,
  targetKeyword: string,
  gsc: GscRow
): Promise<OptimizedMeta> {
  const bodyPreview = extractBodyText(article.body).slice(0, 1500);

  const baseInstructions = loadAgentPrompt("article-optimizer-quarterly") ??
    "Tu es un expert SEO. Optimise les métadonnées de cet article pour améliorer son CTR et sa position Google.";

  const prompt = `${baseInstructions}

ARTICLE :
Titre actuel : "${article.title}"
SEO Title actuel : "${article.seoTitle ?? article.title}"
Meta description actuelle : "${article.seoDescription ?? article.excerpt ?? ""}"
Mot-clé cible : "${targetKeyword}"
Aperçu du contenu : "${bodyPreview}"

DONNÉES GSC (90 derniers jours) :
Position moyenne : ${gsc.position}
Impressions : ${gsc.impressions}
Clics : ${gsc.clicks}
CTR : ${gsc.ctr}%

PROBLÈME À RÉSOUDRE :
${gsc.position > 10 ? `Position ${gsc.position} → article sur page ${Math.ceil(gsc.position / 10)}, besoin de push vers top 10` : ""}
${gsc.ctr < 3 ? `CTR de ${gsc.ctr}% → titre/meta peu incitatifs, améliorer le SERP snippet` : ""}
${gsc.impressions > 500 && gsc.clicks < 15 ? `Bonne visibilité (${gsc.impressions} impressions) mais faible CTR → snippet à retravailler` : ""}

Génère un JSON avec des métadonnées optimisées :
{
  "seoTitle": "Nouveau titre SEO optimisé (55-60 chars, mot-clé en premier si possible)",
  "seoDescription": "Nouvelle meta description (150-160 chars, avec chiffre/bénéfice concret + appel à l'action)",
  "excerpt": "Extrait court accrocheur (100-120 chars)",
  "improvements": "Explication courte des changements effectués et pourquoi"
}`;

  const raw = await callGemini(prompt);
  return JSON.parse(raw) as OptimizedMeta;
}

async function updateSanityMeta(sanityId: string, meta: OptimizedMeta): Promise<void> {
  const client = getSanityClient();
  await client.patch(sanityId).set({
    seoTitle: meta.seoTitle,
    seoDescription: meta.seoDescription,
    excerpt: meta.excerpt,
  }).commit();
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const targetSlug = process.argv.find((a) => !a.startsWith("-") && a !== process.argv[1] && !a.includes("optimizer"));

  console.log(`⚡ Agent Optimiseur d'Articles${dryRun ? " (DRY RUN)" : ""}`);
  console.log(`Date : ${new Date().toLocaleDateString("fr-FR")}\n`);

  // Load queue
  const rawQueue = await fs.readFile(QUEUE_FILE, "utf-8");
  const queue = JSON.parse(rawQueue) as ArticleQueueItem[];

  // Filter published articles 90+ days old with a Sanity ID
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

  let candidates = queue.filter((a) => {
    if (a.status !== "published" || !a.sanityId || !a.publishedAt) return false;
    if (targetSlug && a.slug !== targetSlug) return false;
    return new Date(a.publishedAt) <= ninetyDaysAgo;
  });

  if (candidates.length === 0) {
    console.log("ℹ️  Aucun article éligible (publiés 90+ jours avec Sanity ID).");
    return;
  }

  console.log(`📋 ${candidates.length} articles éligibles à analyser\n`);

  // Fetch GSC data
  console.log("📡 Récupération des données Google Search Console...");
  const accessToken = await getGscAccessToken();
  const urls = candidates.map((a) => `${SITE_URL}/articles/${a.slug}`);
  const gscRows = await fetchGscData(accessToken, urls);

  const gscByUrl = Object.fromEntries(gscRows.map((r) => [r.url, r]));

  // Identify optimization targets
  const targets: OptimizationTarget[] = [];

  for (const article of candidates) {
    const url = `${SITE_URL}/articles/${article.slug}`;
    const gsc = gscByUrl[url];

    if (!gsc) {
      console.log(`  ⚪ ${article.slug} — pas de données GSC (trop récent ou non indexé)`);
      continue;
    }

    const reasons: string[] = [];
    if (gsc.position >= 6 && gsc.position <= 30) reasons.push(`position ${gsc.position} (page ${Math.ceil(gsc.position / 10)})`);
    if (gsc.ctr < 3 && gsc.impressions >= 100) reasons.push(`CTR ${gsc.ctr}%`);
    if (gsc.impressions > 500 && gsc.clicks < 15) reasons.push(`${gsc.impressions} impressions / ${gsc.clicks} clics`);

    if (reasons.length > 0) {
      targets.push({ article, gsc, reason: reasons.join(", ") });
      console.log(`  🎯 ${article.slug} — ${reasons.join(", ")}`);
    } else {
      console.log(`  ✅ ${article.slug} — pos.${gsc.position}, CTR ${gsc.ctr}% (OK)`);
    }
  }

  if (targets.length === 0) {
    console.log("\n✅ Tous les articles performent bien — aucune optimisation nécessaire.");
    return;
  }

  console.log(`\n🔧 ${targets.length} articles à optimiser :\n`);

  let optimized = 0;
  const updatedQueue = [...queue];

  for (const { article, gsc, reason } of targets) {
    console.log(`\n▶ "${article.title}"`);
    console.log(`  Raison : ${reason}`);

    try {
      const sanityArticle = await fetchArticleFromSanity(article.sanityId!);
      if (!sanityArticle) {
        console.log("  ⚠️  Article Sanity introuvable");
        continue;
      }

      const meta = await generateOptimizedMeta(sanityArticle, article.targetKeyword, gsc);
      console.log(`  Nouveau titre : "${meta.seoTitle}"`);
      console.log(`  Amélioration : ${meta.improvements}`);

      if (!dryRun) {
        await updateSanityMeta(article.sanityId!, meta);

        // Update queue item
        const idx = updatedQueue.findIndex((a) => a.id === article.id);
        if (idx >= 0) updatedQueue[idx].lastSeoCheck = new Date().toISOString();
      }

      optimized++;
    } catch (err) {
      console.error(`  ✗ Erreur : ${(err as Error).message}`);
    }
  }

  if (!dryRun && optimized > 0) {
    await fs.writeFile(QUEUE_FILE, JSON.stringify(updatedQueue, null, 2), "utf-8");
  }

  console.log(`\n${dryRun ? "🔍 DRY RUN — " : ""}✅ ${optimized} articles optimisés`);
}

main().catch((err) => {
  console.error("❌ Fatal:", err.message);
  process.exit(1);
});
