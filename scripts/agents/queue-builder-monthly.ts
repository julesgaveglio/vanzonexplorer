#!/usr/bin/env tsx
/**
 * queue-builder-monthly.ts
 *
 * Agent mensuel de mise à jour de la queue d'articles.
 * Lit keywords-research.json → identifie les gaps → génère de nouveaux articles
 * avec Gemini → met à jour article-queue.json.
 *
 * Usage:
 *   npx tsx scripts/agents/queue-builder-monthly.ts
 *   npx tsx scripts/agents/queue-builder-monthly.ts --dry-run   # aperçu sans écriture
 *
 * Required env vars:
 *   GEMINI_API_KEY
 */

import path from "path";
import fs from "fs/promises";

const PROJECT_ROOT = path.resolve(path.dirname(__filename), "../..");
const QUEUE_FILE = path.join(PROJECT_ROOT, "scripts/data/article-queue.json");
const KEYWORDS_FILE = path.join(PROJECT_ROOT, "scripts/data/keywords-research.json");

// Max new articles to add per run (pour éviter une queue trop dense)
const MAX_NEW_ARTICLES = 8;
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

interface ArticleQueueItem {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  tag: string | null;
  readTime: string;
  targetKeyword: string;
  secondaryKeywords: string[];
  targetWordCount: number;
  wordCountNote: string;
  status: "pending" | "published";
  priority: number;
  sanityId: string | null;
  publishedAt: string | null;
  lastSeoCheck: string | null;
  seoPosition: number | null;
  searchVolume?: number;
  competitionLevel?: string;
  addedBy?: string;
  addedAt?: string;
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
          maxOutputTokens: 1024,
          temperature: 0.35,
          responseMimeType: "application/json",
        },
      }),
    }
  );

  if (!res.ok) throw new Error(`Gemini HTTP ${res.status}: ${await res.text()}`);
  const json = await res.json() as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
  const text = json.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  if (!text) throw new Error("Gemini réponse vide");
  return text.replace(/^```json\s*/i, "").replace(/\s*```$/i, "").trim();
}

async function generateArticleBrief(
  keyword: string,
  segment: string,
  segmentLabel: string
): Promise<GeminiArticleMeta> {
  const SEGMENT_CONTEXT: Record<string, string> = {
    location: "Location de van aménagé au Pays Basque — cible les touristes et voyageurs qui veulent louer un van. CTA vers /location.",
    achat: "Achat de van aménagé — cible les acheteurs en recherche. CTA vers /achat.",
    club: "Club Privé Vanzon — deals et codes promo sur équipements vanlife. CTA vers /club.",
    formation: "Formation Van Business Academy — apprendre à créer une activité de location de van. CTA vers /formation.",
  };

  const prompt = `Tu es un expert SEO spécialisé en vanlife et location de vans au Pays Basque (France).

Génère les métadonnées complètes d'un article de blog SEO pour Vanzon Explorer.

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

  const raw = await callGemini(prompt);
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
  const rawQueue = await fs.readFile(QUEUE_FILE, "utf-8");
  const queue = JSON.parse(rawQueue) as ArticleQueueItem[];
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

  const newArticles: ArticleQueueItem[] = [];

  for (const { keyword, segment, segmentLabel } of toProcess) {
    console.log(`\n▶ "${keyword.keyword}" (score:${keyword.score}, vol:${keyword.searchVolume}, ${keyword.competitionLevel})`);

    try {
      const meta = await generateArticleBrief(keyword.keyword, segment, segmentLabel);

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
        addedAt: new Date().toISOString(),
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

  // Merge into queue and re-sort by priority desc
  const updatedQueue = [...queue, ...newArticles].sort((a, b) => b.priority - a.priority);
  await fs.writeFile(QUEUE_FILE, JSON.stringify(updatedQueue, null, 2), "utf-8");

  console.log(`\n✅ Queue mise à jour — ${updatedQueue.length} articles total`);
}

main().catch((err) => {
  console.error("❌ Fatal:", err.message);
  process.exit(1);
});
