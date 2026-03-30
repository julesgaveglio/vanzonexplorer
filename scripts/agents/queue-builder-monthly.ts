#!/usr/bin/env tsx
/**
 * queue-builder-monthly.ts
 *
 * Agent mensuel de mise à jour de la queue d'articles.
 * Lit keywords-research.json → identifie les gaps → génère de nouveaux articles
 * avec Claude → met à jour article-queue.json.
 *
 * Usage:
 *   npx tsx scripts/agents/queue-builder-monthly.ts
 *   npx tsx scripts/agents/queue-builder-monthly.ts --dry-run   # aperçu sans écriture
 *
 * Required env vars:
 *   ANTHROPIC_API_KEY
 */

import path from "path";
import fsSync from "fs";
import { promises as fs } from "fs";
import Anthropic from "@anthropic-ai/sdk";
import { notifyTelegram } from "../lib/telegram";
import { getQueueItems, insertQueueItem, type ArticleQueueItem } from "../lib/queue";
import { startRun, finishRun } from "../lib/agent-runs";
import { createCostTracker } from "../lib/ai-costs";

const PROJECT_ROOT = path.resolve(path.dirname(__filename), "../..");
const KEYWORDS_FILE = path.join(PROJECT_ROOT, "scripts/data/keywords-research.json");
const PROMPTS_DIR = path.join(PROJECT_ROOT, "scripts/agents/prompts");

function loadAgentPrompt(name: string): string | null {
  const mdPath = path.join(PROMPTS_DIR, `${name}.md`);
  return fsSync.existsSync(mdPath) ? fsSync.readFileSync(mdPath, "utf-8").trim() : null;
}

// Max new articles to add per run (pour éviter une queue trop dense)
const MAX_NEW_ARTICLES = 12;
// Min score pour qu'un mot-clé soit retenu
const MIN_SCORE = 100;

// ── Types ─────────────────────────────────────────────────────────────────────

interface KeywordResult {
  keyword: string;
  searchVolume: number;
  competitionLevel: string;
  score: number;
}

interface SegmentReport {
  segment: string;
  label: string;
  topOpportunities: KeywordResult[];
  keywords: KeywordResult[];
}

interface ResearchReport {
  generatedAt: string;
  quarter: string;
  segments: SegmentReport[];
}

interface GeminiArticleMeta {
  title: string;
  slug: string;
  excerpt: string;
  secondaryKeywords: string[];
  readTime: string;
  targetWordCount: number;
  wordCountNote: string;
  category: string;
  tag: string;
}

// ── Claude ────────────────────────────────────────────────────────────────────

async function callClaude(prompt: string): Promise<{ text: string; usage: { input_tokens: number; output_tokens: number } }> {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const response = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1024,
    messages: [{ role: "user", content: prompt }],
  });
  const content = response.content[0];
  if (content.type !== "text") throw new Error("Claude réponse vide");
  const text = content.text.replace(/^```json\s*/i, "").replace(/\s*```$/i, "").trim();
  return {
    text,
    usage: {
      input_tokens: response.usage.input_tokens,
      output_tokens: response.usage.output_tokens
    }
  };
}

async function generateArticleBrief(
  keyword: string,
  segment: string,
  segmentLabel: string,
  costs: ReturnType<typeof createCostTracker>
): Promise<GeminiArticleMeta> {
  const SEGMENT_CONTEXT: Record<string, string> = {
    location: "Location de van aménagé au Pays Basque — cible les touristes et voyageurs qui veulent louer un van. CTA vers /location.",
    achat: "Achat de van aménagé — cible les acheteurs en recherche. CTA vers /achat.",
    club: "Club Privé Vanzon — deals et codes promo sur équipements vanlife. CTA vers /club.",
    formation: "Formation Van Business Academy — apprendre à créer une activité de location de van. CTA vers /formation.",
  };

  const baseInstructions = loadAgentPrompt("queue-builder-monthly") ??
    `Tu es un expert SEO spécialisé en vanlife et location de vans au Pays Basque (France).\n\nGénère les métadonnées complètes d'un article de blog SEO pour Vanzon Explorer.\n\nRègles :\n- Tutoiement, ancrage Pays Basque (Biarritz, Bayonne, Saint-Jean-de-Luz)\n- targetWordCount entre 900 et 2200\n- wordCountNote doit mentionner l'angle éditorial unique et le CTA`;

  const prompt = `${baseInstructions}

Mot-clé cible : "${keyword}"
Segment : ${segmentLabel}
Contexte : ${SEGMENT_CONTEXT[segment] ?? segmentLabel}

Réponds UNIQUEMENT en JSON valide avec ces champs :
{
  "title": "Titre SEO accrocheur (60-70 caractères, contient le mot-clé)",
  "slug": "slug-kebab-case-sans-accents",
  "excerpt": "Meta description 140-160 caractères, incitative",
  "secondaryKeywords": ["3 à 5 mots-clés secondaires liés"],
  "readTime": "X min",
  "targetWordCount": 1400,
  "wordCountNote": "Justification du nombre de mots + angle éditorial + CTA recommandé + liens internes suggérés",
  "category": "catégorie parmi : Location Van / Achat Van / Aménagement Van / Pays Basque / Business Van / Vie en van",
  "tag": "tag court"
}

Règles :
- Tutoiement, ancrage Pays Basque (Biarritz, Bayonne, Saint-Jean-de-Luz)
- targetWordCount entre 900 et 2200
- wordCountNote doit mentionner l'angle éditorial unique et le CTA`;

  const { text: raw, usage } = await callClaude(prompt);
  costs.addAnthropic("haiku", usage.input_tokens, usage.output_tokens);
  return JSON.parse(raw) as GeminiArticleMeta;
}

// ── Gap analysis ──────────────────────────────────────────────────────────────

function isAlreadyCovered(keyword: string, queue: ArticleQueueItem[]): boolean {
  const kw = keyword.toLowerCase();
  return queue.some((a) => {
    const target = (a.targetKeyword ?? "").toLowerCase();
    const title = (a.title ?? "").toLowerCase();
    const secondary = (a.secondaryKeywords ?? []).map((s) => s.toLowerCase());
    // Check for significant overlap (3+ words in common or exact match)
    const kwWords = kw.split(" ").filter((w) => w.length > 3);
    const titleMatch = kwWords.filter((w) => title.includes(w)).length >= 2;
    const targetMatch = target.includes(kw) || kw.includes(target);
    const secondaryMatch = secondary.some((s) => s.includes(kw) || kw.includes(s));
    return titleMatch || targetMatch || secondaryMatch;
  });
}

// ── Priority by segment ───────────────────────────────────────────────────────

const SEGMENT_BASE_PRIORITY: Record<string, number> = {
  location: 90,
  achat: 60,
  club: 40,
  formation: 70,
};

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  console.log(`🗂️  Agent Queue Builder${dryRun ? " (DRY RUN)" : ""} — ${new Date().toLocaleDateString("fr-FR")}\n`);

  // Load keyword research
  let research: ResearchReport;
  try {
    const raw = await fs.readFile(KEYWORDS_FILE, "utf-8");
    research = JSON.parse(raw) as ResearchReport;
    console.log(`✓ Rapport keywords chargé — ${research.quarter} (${research.generatedAt.slice(0, 10)})`);
  } catch {
    console.error("❌ keywords-research.json introuvable. Lance d'abord keyword-research-quarterly.ts");
    process.exit(1);
  }

  // Load article queue
  const queue = await getQueueItems();
  console.log(`✓ Queue chargée — ${queue.length} articles (${queue.filter((a) => a.status === "published").length} publiés)\n`);

  // Collect all opportunities across segments
  const opportunities: Array<{ keyword: KeywordResult; segment: string; segmentLabel: string }> = [];

  for (const segmentReport of research.segments) {
    const candidates = segmentReport.keywords
      .filter((k) => k.score >= MIN_SCORE)
      .slice(0, 30); // top 30 per segment

    for (const kw of candidates) {
      if (!isAlreadyCovered(kw.keyword, queue)) {
        opportunities.push({ keyword: kw, segment: segmentReport.segment, segmentLabel: segmentReport.label });
      }
    }
  }

  // Sort by score desc, take top MAX_NEW_ARTICLES
  opportunities.sort((a, b) => b.keyword.score - a.keyword.score);
  const toProcess = opportunities.slice(0, MAX_NEW_ARTICLES);

  console.log(`📊 ${opportunities.length} opportunités non couvertes → traitement des ${toProcess.length} meilleures\n`);

  if (toProcess.length === 0) {
    console.log("✅ Queue déjà bien couverte — aucun ajout nécessaire.");
    return;
  }

  const runId = await startRun("queue-builder-monthly", { newArticlesCount: toProcess.length });
  const costs = createCostTracker();
  const newArticles: ArticleQueueItem[] = [];

  for (const { keyword, segment, segmentLabel } of toProcess) {
    console.log(`\n▶ "${keyword.keyword}" (score:${keyword.score}, vol:${keyword.searchVolume}, ${keyword.competitionLevel})`);

    try {
      const meta = await generateArticleBrief(keyword.keyword, segment, segmentLabel, costs);

      // Check slug uniqueness
      const slugExists = queue.some((a) => a.slug === meta.slug) || newArticles.some((a) => a.slug === meta.slug);
      const finalSlug = slugExists ? `${meta.slug}-${Date.now()}` : meta.slug;

      const article: ArticleQueueItem = {
        id: finalSlug,
        slug: finalSlug,
        title: meta.title,
        excerpt: meta.excerpt,
        category: meta.category,
        tag: meta.tag,
        readTime: meta.readTime,
        targetKeyword: keyword.keyword,
        secondaryKeywords: meta.secondaryKeywords,
        targetWordCount: meta.targetWordCount,
        wordCountNote: meta.wordCountNote,
        status: "pending",
        priority: SEGMENT_BASE_PRIORITY[segment] ?? 50,
        sanityId: null,
        publishedAt: null,
        lastSeoCheck: null,
        seoPosition: null,
        searchVolume: keyword.searchVolume,
        competitionLevel: keyword.competitionLevel,
        addedBy: "queue-builder-monthly",
      };

      newArticles.push(article);
      console.log(`  ✓ "${meta.title}"`);
    } catch (err) {
      console.error(`  ✗ Erreur : ${(err as Error).message}`);
    }
  }

  if (newArticles.length === 0) {
    console.log("\n⚠️  Aucun article généré.");
    return;
  }

  console.log(`\n📝 ${newArticles.length} nouveaux articles générés :`);
  newArticles.forEach((a) => console.log(`  • [${a.priority}] ${a.targetKeyword} → "${a.title}"`));

  if (dryRun) {
    console.log("\n🔍 DRY RUN — aucune écriture.");
    return;
  }

  let itemsCreated = 0;

  for (const item of newArticles) {
    const { inserted } = await insertQueueItem(item);
    if (inserted) itemsCreated++;
  }

  await finishRun(runId, {
    status: "success",
    itemsCreated,
    itemsProcessed: newArticles.length,
    ...costs.toRunResult(),
  });
  console.log(`\n✅ Queue mise à jour — ${itemsCreated} articles insérés`);
}

main()
  .then(() => notifyTelegram("🗂️ *Queue Builder* — Nouveaux briefs d'articles ajoutés à la queue."))
  .catch(async (err) => {
    await notifyTelegram(`❌ *Queue Builder* — Erreur : ${(err as Error).message}`);
    console.error("❌ Fatal:", (err as Error).message);
    process.exit(1);
  });
