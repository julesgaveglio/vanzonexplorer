#!/usr/bin/env tsx
/**
 * keyword-researcher.ts
 *
 * DataForSEO keyword research script — generates article queue entries for Vanzon.
 *
 * Usage:
 *   npx tsx scripts/agents/keyword-researcher.ts [catégorie]
 *   # ex: npx tsx scripts/agents/keyword-researcher.ts "Club Privé"
 *   # sans arg = toutes les catégories
 *
 * Required env vars:
 *   DATAFORSEO_LOGIN
 *   DATAFORSEO_PASSWORD
 *   GEMINI_API_KEY
 */

import path from "path";

// ── Constants ──────────────────────────────────────────────────────────────────
// scripts/agents/ → project root is two directories up
const PROJECT_ROOT = path.resolve(path.dirname(__filename), "../..");
const QUEUE_FILE = path.join(PROJECT_ROOT, "scripts/data/article-queue.json");
const DFS_BASE = "https://api.dataforseo.com/v3";
const DFS_LOCATION_CODE = 2250; // France
const DFS_LANGUAGE_CODE = "fr";

// ── Interfaces ─────────────────────────────────────────────────────────────────
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
  targetWordCount?: number;
  wordCountNote?: string;
  status: "pending" | "writing" | "published" | "needs-improvement";
  priority: number;
  sanityId: string | null;
  publishedAt: string | null;
  lastSeoCheck: string | null;
  seoPosition: number | null;
  // SEO research fields
  searchVolume?: number;
  competitionLevel?: string;  // "LOW" | "MEDIUM" | "HIGH"
  seoScore?: number;          // searchVolume × competition factor
  createdAt?: string;         // ISO date added to queue
}

interface DfsKeywordIdeasResult {
  items?: Array<{
    keyword: string;
    keyword_info?: {
      search_volume?: number;
      competition_level?: string;  // "LOW" | "MEDIUM" | "HIGH" | "TOP"
    };
  }>;
}

interface GeminiArticleMeta {
  title: string;
  slug: string;
  excerpt: string;
  seoTitle: string;
  seoDescription: string;
  secondaryKeywords: string[];
  readTime: string;
  targetWordCount: number;
  wordCountNote: string;
}

// ── Seed keywords per category ─────────────────────────────────────────────────
const SEED_KEYWORDS: Record<string, string[]> = {
  "Pays Basque":     ["van pays basque", "location van pays basque", "spot camping car pays basque"],
  "Aménagement Van": ["aménager van", "isolation fourgon", "electricité van solaire"],
  "Business Van":    ["mettre van en location", "revenus location van", "monétiser fourgon"],
  "Achat Van":       ["acheter van aménagé occasion", "prix van aménagé 2025", "quel fourgon choisir"],
  "Club Privé":      ["bon plan van", "promo location van", "reduction vanlife", "deal camping car"],
};

// ── DataForSEO helpers ─────────────────────────────────────────────────────────
function getDfsAuthHeader(): string {
  const login = process.env.DATAFORSEO_LOGIN;
  const password = process.env.DATAFORSEO_PASSWORD;
  if (!login || !password) {
    throw new Error("DATAFORSEO_LOGIN and DATAFORSEO_PASSWORD env vars are required");
  }
  return "Basic " + Buffer.from(`${login}:${password}`).toString("base64");
}

async function dfsPost<T = unknown>(endpoint: string, body: unknown): Promise<T> {
  const res = await fetch(`${DFS_BASE}${endpoint}`, {
    method: "POST",
    headers: {
      Authorization: getDfsAuthHeader(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error(`DataForSEO HTTP error ${res.status}: ${await res.text()}`);
  }

  const json = await res.json();
  if (json.status_code !== 20000) {
    throw new Error(`DataForSEO API error ${json.status_code}: ${json.status_message}`);
  }

  return json.tasks?.[0]?.result?.[0] as T;
}

// ── Queue helpers ──────────────────────────────────────────────────────────────
async function readQueue(): Promise<ArticleQueueItem[]> {
  const fs = await import("fs/promises");
  const raw = await fs.readFile(QUEUE_FILE, "utf-8");
  return JSON.parse(raw) as ArticleQueueItem[];
}

async function updateQueue(queue: ArticleQueueItem[]): Promise<void> {
  const fs = await import("fs/promises");
  await fs.writeFile(QUEUE_FILE, JSON.stringify(queue, null, 2), "utf-8");
}

// ── Gemini: generate article metadata ──────────────────────────────────────────
async function callGemini(
  apiKey: string,
  prompt: string,
  opts: { json?: boolean; maxTokens?: number } = {}
): Promise<string> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          maxOutputTokens: opts.maxTokens ?? 1024,
          temperature: 0.4,
          ...(opts.json ? { responseMimeType: "application/json" } : {}),
        },
      }),
    }
  );

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gemini API error ${res.status}: ${errText}`);
  }

  const json = await res.json() as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };

  const text = json.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  if (!text) throw new Error("Gemini returned empty response");
  return text;
}

async function generateArticleMeta(
  keyword: string,
  category: string,
  apiKey: string
): Promise<GeminiArticleMeta> {
  const prompt = `Tu es un expert SEO spécialisé en vanlife et location de vans en France.

Génère les métadonnées d'un article de blog SEO en français pour le mot-clé cible : "${keyword}"
Catégorie : ${category}

Réponds UNIQUEMENT en JSON valide avec exactement ces champs :
{
  "title": "Titre SEO accrocheur de l'article en français (60-70 caractères)",
  "slug": "slug-en-kebab-case-depuis-le-titre",
  "excerpt": "Meta description attrayante de 140-160 caractères en français",
  "seoTitle": "Titre SEO optimisé (55-60 caractères)",
  "seoDescription": "Description SEO complète (150-160 caractères)",
  "secondaryKeywords": ["mot-clé secondaire 1", "mot-clé secondaire 2", "mot-clé secondaire 3"],
  "readTime": "X min",
  "targetWordCount": 1200,
  "wordCountNote": "Courte justification du nombre de mots cible"
}

Règles :
- Le slug doit être en minuscules, sans accents, séparé par des tirets
- Le mot-clé cible doit apparaître naturellement dans le titre
- Les mots-clés secondaires doivent être liés à la catégorie ${category}
- targetWordCount entre 800 et 2000 selon la complexité du sujet
`;

  const raw = await callGemini(apiKey, prompt, { json: true, maxTokens: 1024 });

  // Strip potential markdown code fences
  const cleaned = raw.replace(/^```json\s*/i, "").replace(/\s*```$/i, "").trim();
  const meta = JSON.parse(cleaned) as GeminiArticleMeta;
  return meta;
}

// ── Process a single category ──────────────────────────────────────────────────
interface SummaryRow {
  keyword: string;
  searchVolume: number | undefined;
  competitionLevel: string | undefined;
  seoScore: number;
  title: string;
  status: string;
}

async function processCategory(
  category: string,
  queue: ArticleQueueItem[],
  geminiKey: string
): Promise<SummaryRow[]> {
  const seedKeywords = SEED_KEYWORDS[category];
  if (!seedKeywords) {
    console.warn(`  [WARN] No seed keywords found for category: ${category}`);
    return [];
  }

  console.log(`\n▶ Processing category: ${category}`);
  console.log(`  Seed keywords: ${seedKeywords.join(", ")}`);

  // ── Step 1: Fetch keyword ideas from DataForSEO ──────────────────────────────
  let items: NonNullable<DfsKeywordIdeasResult["items"]> = [];
  try {
    const result = await dfsPost<DfsKeywordIdeasResult>(
      "/dataforseo_labs/google/keyword_ideas/live",
      [
        {
          keywords: seedKeywords,
          language_code: DFS_LANGUAGE_CODE,
          location_code: DFS_LOCATION_CODE,
          include_serp_info: false,
          limit: 100,
        },
      ]
    );
    items = result?.items ?? [];
    console.log(`  DataForSEO returned ${items.length} keyword idea(s)`);
  } catch (err) {
    console.warn(`  [WARN] DataForSEO request failed for category "${category}": ${(err as Error).message}`);
    return [];
  }

  if (items.length === 0) {
    console.warn(`  [WARN] No keyword ideas returned for category: ${category}`);
    return [];
  }

  // ── Step 2: Filter & score ───────────────────────────────────────────────────
  type ScoredItem = {
    keyword: string;
    searchVolume: number;
    competitionLevel: string;
    score: number;
  };

  const competitionFactor = (level: string): number => {
    if (level === "LOW") return 1.0;
    if (level === "MEDIUM") return 0.7;
    return 0.3; // HIGH or TOP
  };

  const scored: ScoredItem[] = items
    .filter((item) => {
      const vol = item.keyword_info?.search_volume ?? 0;
      const comp = item.keyword_info?.competition_level ?? "";
      return vol >= 200 && (comp === "LOW" || comp === "MEDIUM");
    })
    .map((item) => {
      const vol = item.keyword_info!.search_volume!;
      const comp = item.keyword_info!.competition_level!;
      return {
        keyword: item.keyword,
        searchVolume: vol,
        competitionLevel: comp,
        score: vol * competitionFactor(comp),
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  console.log(`  ${scored.length} keyword(s) pass filter (vol>=200, competition LOW|MEDIUM)`);

  // ── Step 3: Check existing queue slugs ──────────────────────────────────────
  const existingKeywords = new Set(queue.map((item) => item.targetKeyword.toLowerCase().trim()));
  const existingSlugs = new Set(queue.map((item) => item.slug.toLowerCase().trim()));

  const summaryRows: SummaryRow[] = [];
  const newItems: ArticleQueueItem[] = [];

  for (const item of scored) {
    // Check if keyword already exists in queue
    if (existingKeywords.has(item.keyword.toLowerCase().trim())) {
      console.log(`  [SKIP] Keyword already in queue: "${item.keyword}"`);
      summaryRows.push({
        keyword: item.keyword,
        searchVolume: item.searchVolume,
        competitionLevel: item.competitionLevel,
        seoScore: item.score,
        title: "(already in queue)",
        status: "skipped",
      });
      continue;
    }

    // ── Step 4: Generate metadata with Gemini ──────────────────────────────────
    let meta: GeminiArticleMeta;
    try {
      console.log(`  Generating metadata for: "${item.keyword}"...`);
      meta = await generateArticleMeta(item.keyword, category, geminiKey);
    } catch (err) {
      console.warn(`  [WARN] Gemini metadata generation failed for "${item.keyword}": ${(err as Error).message}`);
      summaryRows.push({
        keyword: item.keyword,
        searchVolume: item.searchVolume,
        competitionLevel: item.competitionLevel,
        seoScore: item.score,
        title: "(gemini error)",
        status: "error",
      });
      continue;
    }

    // Ensure slug is unique — if collision, append suffix
    let slug = meta.slug;
    let slugSuffix = 1;
    while (existingSlugs.has(slug.toLowerCase().trim())) {
      slug = `${meta.slug}-${slugSuffix}`;
      slugSuffix++;
    }

    const queueItem: ArticleQueueItem = {
      id: slug,
      slug,
      title: meta.title,
      excerpt: meta.excerpt,
      category,
      tag: null,
      readTime: meta.readTime,
      targetKeyword: item.keyword,
      secondaryKeywords: meta.secondaryKeywords,
      targetWordCount: meta.targetWordCount,
      wordCountNote: meta.wordCountNote,
      status: "pending",
      priority: queue.length + newItems.length,
      sanityId: null,
      publishedAt: null,
      lastSeoCheck: null,
      seoPosition: null,
      searchVolume: item.searchVolume,
      competitionLevel: item.competitionLevel,
      seoScore: item.score,
      createdAt: new Date().toISOString(),
    };

    newItems.push(queueItem);
    existingKeywords.add(item.keyword.toLowerCase().trim());
    existingSlugs.add(slug.toLowerCase().trim());

    console.log(`  + Added: "${meta.title}" [slug: ${slug}]`);
    summaryRows.push({
      keyword: item.keyword,
      searchVolume: item.searchVolume,
      competitionLevel: item.competitionLevel,
      seoScore: item.score,
      title: meta.title,
      status: "added",
    });
  }

  // ── Step 5: Persist new items to queue ──────────────────────────────────────
  if (newItems.length > 0) {
    for (const newItem of newItems) {
      queue.push(newItem);
    }
    await updateQueue(queue);
    console.log(`  Saved ${newItems.length} new article(s) to queue.`);
  } else {
    console.log(`  No new articles added for this category.`);
  }

  return summaryRows;
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main(): Promise<void> {
  const targetCategory = process.argv[2] ?? null;

  // Validate env vars
  const geminiKey = process.env.GEMINI_API_KEY;
  if (!geminiKey) {
    console.error("ERROR: GEMINI_API_KEY env var is required");
    process.exit(1);
  }

  // Validate DataForSEO credentials early
  try {
    getDfsAuthHeader();
  } catch (err) {
    console.error(`ERROR: ${(err as Error).message}`);
    process.exit(1);
  }

  // Determine categories to process
  const categoriesToProcess: string[] = targetCategory
    ? [targetCategory]
    : Object.keys(SEED_KEYWORDS);

  if (targetCategory && !SEED_KEYWORDS[targetCategory]) {
    console.error(`ERROR: Unknown category "${targetCategory}"`);
    console.error(`Available categories: ${Object.keys(SEED_KEYWORDS).join(", ")}`);
    process.exit(1);
  }

  console.log("=== Vanzon Keyword Researcher ===");
  console.log(`Categories to process: ${categoriesToProcess.join(", ")}`);
  console.log(`Queue file: ${QUEUE_FILE}`);
  console.log("");

  // Load queue once
  let queue = await readQueue();
  console.log(`Current queue size: ${queue.length} article(s)`);

  // Process each category
  const allSummaryRows: (SummaryRow & { category: string })[] = [];

  for (const category of categoriesToProcess) {
    try {
      const rows = await processCategory(category, queue, geminiKey);
      for (const row of rows) {
        allSummaryRows.push({ ...row, category });
      }
      // Reload queue after each category to get the latest state
      queue = await readQueue();
    } catch (err) {
      console.error(`ERROR processing category "${category}": ${(err as Error).message}`);
    }
  }

  // ── Final summary ──────────────────────────────────────────────────────────
  console.log("\n=== Summary ===");
  if (allSummaryRows.length === 0) {
    console.log("No keywords processed.");
  } else {
    // Format as table
    const tableData = allSummaryRows.map((row) => ({
      category: row.category,
      keyword: row.keyword.length > 30 ? row.keyword.slice(0, 27) + "..." : row.keyword,
      volume: row.searchVolume ?? "N/A",
      competition: row.competitionLevel ?? "N/A",
      score: Math.round(row.seoScore),
      title: row.title.length > 50 ? row.title.slice(0, 47) + "..." : row.title,
      status: row.status,
    }));

    console.table(tableData);

    const added = allSummaryRows.filter((r) => r.status === "added").length;
    const skipped = allSummaryRows.filter((r) => r.status === "skipped").length;
    const errors = allSummaryRows.filter((r) => r.status === "error").length;

    console.log(`\nTotal: ${added} added, ${skipped} skipped, ${errors} errors`);
    console.log(`Queue now has ${queue.length} article(s)`);
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
