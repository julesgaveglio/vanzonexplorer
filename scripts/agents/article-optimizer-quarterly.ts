#!/usr/bin/env tsx
/**
 * article-optimizer-quarterly.ts
 *
 * Agent trimestriel d'optimisation des articles publiés.
 * Analyse les performances GSC → identifie les articles à améliorer
 * → génère une version optimisée avec Claude → met à jour Sanity.
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
 *   ANTHROPIC_API_KEY
 *   SANITY_API_WRITE_TOKEN
 *   NEXT_PUBLIC_SANITY_PROJECT_ID
 *   GOOGLE_GSC_CLIENT_ID
 *   GOOGLE_GSC_CLIENT_SECRET
 *   GOOGLE_REFRESH_TOKEN
 */

import * as path from "path";
import * as fs from "fs";
import { createClient } from "@sanity/client";
import Anthropic from "@anthropic-ai/sdk";
import { notifyTelegram } from "../lib/telegram";
import { getQueueItems, updateQueueItem } from "../lib/queue";
import type { ArticleQueueItem } from "../lib/queue";
import { startRun, finishRun } from "../lib/agent-runs";
import { createCostTracker } from "../lib/ai-costs";

const PROJECT_ROOT = path.resolve(path.dirname(__filename), "../..");
const SITE_URL = "https://vanzonexplorer.com";
const PROMPTS_DIR = path.join(PROJECT_ROOT, "scripts/agents/prompts");

function loadAgentPrompt(name: string): string | null {
  const mdPath = path.join(PROMPTS_DIR, `${name}.md`);
  return fs.existsSync(mdPath) ? fs.readFileSync(mdPath, "utf-8").trim() : null;
}

// ── Types ─────────────────────────────────────────────────────────────────────

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

// ── Claude ────────────────────────────────────────────────────────────────────

interface ClaudeResponse {
  text: string;
  usage: { input_tokens: number; output_tokens: number };
}

async function callClaude(prompt: string): Promise<ClaudeResponse> {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const message = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 512,
    messages: [{ role: "user", content: prompt }],
  });
  const content = message.content[0];
  if (content.type !== "text") throw new Error("Claude returned non-text response");
  const text = content.text.replace(/^```json\s*/i, "").replace(/\s*```$/i, "").trim();
  return { text, usage: message.usage };
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
): Promise<{ meta: OptimizedMeta; usage: { input_tokens: number; output_tokens: number } }> {
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

  const { text, usage } = await callClaude(prompt);
  const meta = JSON.parse(text) as OptimizedMeta;
  return { meta, usage };
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

  const runId = await startRun("article-optimizer-quarterly");
  const costs = createCostTracker();

  // Load queue
  const queue = await getQueueItems({ status: "published" });

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

  for (const { article, gsc, reason } of targets) {
    console.log(`\n▶ "${article.title}"`);
    console.log(`  Raison : ${reason}`);

    try {
      const sanityArticle = await fetchArticleFromSanity(article.sanityId!);
      if (!sanityArticle) {
        console.log("  ⚠️  Article Sanity introuvable");
        continue;
      }

      const { meta, usage } = await generateOptimizedMeta(sanityArticle, article.targetKeyword, gsc);
      costs.addAnthropic("haiku", usage.input_tokens, usage.output_tokens);
      console.log(`  Nouveau titre : "${meta.seoTitle}"`);
      console.log(`  Amélioration : ${meta.improvements}`);

      if (!dryRun) {
        await updateSanityMeta(article.sanityId!, meta);
        await updateQueueItem(article.id, { lastOptimizedAt: new Date().toISOString() });
      }

      optimized++;
    } catch (err) {
      console.error(`  ✗ Erreur : ${(err as Error).message}`);
    }
  }

  await finishRun(runId, { status: "success", itemsProcessed: targets.length, itemsCreated: optimized, ...costs.toRunResult() });
  console.log(`\n${dryRun ? "🔍 DRY RUN — " : ""}✅ ${optimized} articles optimisés`);
}

main()
  .then(() => notifyTelegram("⚡ *Article Optimizer* — Optimisation trimestrielle terminée."))
  .catch(async (err) => {
    await notifyTelegram(`❌ *Article Optimizer* — Erreur : ${(err as Error).message}`);
    console.error("❌ Fatal:", (err as Error).message);
    process.exit(1);
  });
