#!/usr/bin/env tsx
/**
 * blog-writer-agent.ts
 *
 * Automated SEO blog writer for Vanzon Explorer.
 * Reads article queue, generates content with Claude, publishes to Sanity.
 *
 * Usage:
 *   npx tsx scripts/agents/blog-writer-agent.ts           # next pending article
 *   npx tsx scripts/agents/blog-writer-agent.ts [slug]    # specific article
 *   npx tsx scripts/agents/blog-writer-agent.ts next      # explicit "next" mode
 *
 * Required env vars:
 *   ANTHROPIC_API_KEY
 *   SANITY_API_WRITE_TOKEN
 *   PEXELS_API_KEY
 *   DATAFORSEO_LOGIN
 *   DATAFORSEO_PASSWORD
 *   NEXT_PUBLIC_SANITY_PROJECT_ID (optional, defaults to lewexa74)
 *   NEXT_PUBLIC_SANITY_DATASET (optional, defaults to production)
 */

import path from "path";
import { createClient } from "@sanity/client";
import Anthropic from "@anthropic-ai/sdk";
import { searchPexelsPhoto, downloadPexelsPhoto, buildPexelsCredit } from "../../src/lib/pexels";
import type { PexelsPhoto } from "../../src/lib/pexels";

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
  status: "pending" | "writing" | "published" | "needs-improvement";
  priority: number;
  sanityId: string | null;
  publishedAt: string | null;
  lastSeoCheck: string | null;
  seoPosition: number | null;
}

interface PortableTextBlock {
  _type: "block";
  _key: string;
  style: "normal" | "h2" | "h3" | "blockquote";
  children: Array<{
    _type: "span";
    _key: string;
    text: string;
    marks: string[];
  }>;
  markDefs: unknown[];
}

interface GeneratedContent {
  title: string;
  seoTitle: string;
  seoDescription: string;
  excerpt: string;
  content: PortableTextBlock[];
  faqItems?: Array<{ question: string; answer: string }>;
}

interface KeywordData {
  search_volume?: number;
  competition_level?: string;
  cpc?: number;
}

// ── Sanity client (write access) ───────────────────────────────────────────────
const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "lewexa74",
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
  apiVersion: "2024-01-01",
  token: process.env.SANITY_API_WRITE_TOKEN,
  useCdn: false,
});

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

// ── Random key generator for Portable Text ─────────────────────────────────────
function randomKey(): string {
  return Math.random().toString(36).slice(2, 9);
}

/**
 * Ensure every block and span in the content array has a unique _key.
 * Claude may return blocks without keys or with duplicate keys.
 */
function ensureUniqueKeys(blocks: PortableTextBlock[]): PortableTextBlock[] {
  return blocks.map((block) => ({
    ...block,
    _key: randomKey(),
    children: block.children.map((child) => ({
      ...child,
      _key: randomKey(),
    })),
  }));
}

// ── Step 1: Get keyword data from DataForSEO ───────────────────────────────────
async function getKeywordData(keyword: string): Promise<KeywordData> {
  console.log(`  Fetching keyword data for: "${keyword}"...`);
  try {
    const result = await dfsPost<KeywordData>(
      "/dataforseo_labs/google/keyword_overview/live",
      [
        {
          keywords: [keyword],
          location_code: DFS_LOCATION_CODE,
          language_code: DFS_LANGUAGE_CODE,
        },
      ]
    );
    const data = (result as unknown as { items?: KeywordData[] })?.items?.[0] ?? {};
    console.log(
      `  Keyword data: volume=${data.search_volume ?? "N/A"}, competition=${data.competition_level ?? "N/A"}, cpc=${data.cpc ?? "N/A"}`
    );
    return data;
  } catch (err) {
    // Non-fatal: we'll proceed without keyword data rather than abort
    console.warn(`  Warning: Could not fetch keyword data — ${(err as Error).message}`);
    return {};
  }
}

// ── Step 2: Extract PAA questions from SERP ────────────────────────────────────
async function getPAAQuestions(keyword: string): Promise<string[]> {
  console.log(`  Fetching SERP PAA for: "${keyword}"...`);
  try {
    const result = await dfsPost<unknown>(
      "/serp/google/organic/live/advanced",
      [
        {
          keyword,
          location_code: DFS_LOCATION_CODE,
          language_code: DFS_LANGUAGE_CODE,
          device: "desktop",
          os: "windows",
          depth: 10,
        },
      ]
    );

    const items = (result as { items?: Array<{ type: string; items?: Array<{ title?: string; question?: string }> }> })?.items ?? [];

    const paaQuestions: string[] = [];
    for (const item of items) {
      if (item.type === "people_also_ask" && Array.isArray(item.items)) {
        for (const paa of item.items) {
          const q = paa.title ?? paa.question;
          if (q) paaQuestions.push(q);
          if (paaQuestions.length >= 5) break;
        }
      }
      if (paaQuestions.length >= 5) break;
    }

    console.log(`  Found ${paaQuestions.length} PAA question(s)`);
    return paaQuestions;
  } catch (err) {
    console.warn(`  Warning: Could not fetch PAA questions — ${(err as Error).message}`);
    return [];
  }
}

// ── Step 3: Generate article with Claude ───────────────────────────────────────
async function generateArticle(
  article: ArticleQueueItem,
  keywordData: KeywordData,
  paaQuestions: string[]
): Promise<GeneratedContent> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY env var is required");
  }

  console.log(`  Calling Claude API (claude-sonnet-4-6)...`);
  const anthropic = new Anthropic({ apiKey });

  const paaBlock =
    paaQuestions.length > 0
      ? paaQuestions.map((q, i) => `${i + 1}. ${q}`).join("\n")
      : "Aucune question PAA disponible — génère 5 questions pertinentes sur le sujet.";

  const prompt = `Tu es expert SEO et rédacteur vanlife pour Vanzon Explorer (location/vente van aménagé au Pays Basque).

Données keywords pour "${article.targetKeyword}":
Volume mensuel: ${keywordData.search_volume ?? "N/A"}
Concurrence: ${keywordData.competition_level ?? "N/A"}
CPC: ${keywordData.cpc ?? "N/A"}

Questions PAA (People Also Ask):
${paaBlock}

Mots-clés secondaires: ${article.secondaryKeywords.join(", ")}

Rédige un article de 2000-2500 mots sur "${article.title}" ciblant "${article.targetKeyword}".

Structure OBLIGATOIRE:
H1: [Titre exact optimisé — reprend le keyword principal]
[Introduction 150 mots — intègre keyword principal, accroche émotionnelle, annonce du plan]

H2: [Section 1 — informationnel/éducatif]
[400 mots — données concrètes, liste numérotée ou à puces, conseils pratiques]

H2: [Section 2 — pratique/actionnable]
[400 mots — étapes concrètes, exemples, données terrain]

H2: [Section 3 — Pays Basque + Vanzon]
[300 mots — spécifique Pays Basque, lien naturel vers le service Vanzon Explorer]

H2: FAQ — Questions fréquentes
H3: [Question 1 tirée du PAA]
[Réponse 80-120 mots — directe, complète, optimisée pour les featured snippets]
H3: [Question 2]
H3: [Question 3]
H3: [Question 4]
H3: [Question 5]

H2: Conclusion
[100 mots — récapitulatif, CTA naturel vers vanzonexplorer.com/location ou /achat]

TON: professionnel mais chaleureux, expert terrain, données concrètes, pas de formules génériques

Retourne UNIQUEMENT un objet JSON valide (sans markdown, sans code fences) avec cette structure exacte:
{
  "title": "string — le H1 exact",
  "seoTitle": "string — 60 caractères max, inclut le keyword principal",
  "seoDescription": "string — 155 caractères max, accrocheur et descriptif",
  "excerpt": "string — 200-250 caractères, résumé accrocheur",
  "content": [
    {
      "_type": "block",
      "_key": "unique_key",
      "style": "normal",
      "children": [{"_type": "span", "_key": "key", "text": "Texte du paragraphe", "marks": []}],
      "markDefs": []
    }
  ]
}

Notes sur le format content (Portable Text Sanity):
- Le tableau content commence APRÈS le titre H1 (déjà stocké dans le champ title). Use h2 for main sections, h3 for subsections, normal for paragraphs.
- style "h2" pour les titres de sections
- style "h3" pour les sous-titres FAQ
- style "normal" pour les paragraphes
- style "blockquote" pour les citations
- Chaque bloc a un _key unique (chaîne aléatoire 7 caractères)
- Le tableau content doit contenir tous les blocs de l'article complet`;

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 8192,
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
  });

  const rawText = message.content
    .filter((block) => block.type === "text")
    .map((block) => (block as { type: "text"; text: string }).text)
    .join("");

  let parsed: GeneratedContent;
  try {
    parsed = JSON.parse(rawText) as GeneratedContent;
  } catch {
    // Attempt to extract JSON if Claude added any surrounding text
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Claude did not return valid JSON. Raw response:\n" + rawText.slice(0, 500));
    }
    parsed = JSON.parse(jsonMatch[0]) as GeneratedContent;
  }

  // Ensure all blocks have unique keys
  parsed.content = ensureUniqueKeys(parsed.content);

  console.log(
    `  Article generated: "${parsed.title}" (${parsed.content.length} blocks)`
  );
  return parsed;
}

// ── Step 4 & 5: Fetch + upload cover image ─────────────────────────────────────
async function uploadCoverImage(
  article: ArticleQueueItem
): Promise<{ imageAsset: { _id: string }; photo: PexelsPhoto }> {
  const searchQuery = article.targetKeyword;
  console.log(`  Searching Pexels for: "${searchQuery}"...`);

  const photo = await searchPexelsPhoto(searchQuery);
  if (!photo) {
    // Fallback: try with the article title
    const fallbackQuery = article.title;
    console.log(`  No results, trying fallback: "${fallbackQuery}"...`);
    const fallbackPhoto = await searchPexelsPhoto(fallbackQuery);
    if (!fallbackPhoto) {
      throw new Error(`No Pexels photo found for "${searchQuery}" or "${fallbackQuery}"`);
    }
    console.log(`  Found photo #${fallbackPhoto.id} by ${fallbackPhoto.photographer}`);
    const buffer = await downloadPexelsPhoto(fallbackPhoto);
    console.log(`  Uploading image to Sanity...`);
    const imageAsset = await sanity.assets.upload("image", buffer, {
      filename: `pexels-${fallbackPhoto.id}.jpg`,
      contentType: "image/jpeg",
    });
    console.log(`  Image asset uploaded: ${imageAsset._id}`);
    return { imageAsset, photo: fallbackPhoto };
  }

  console.log(`  Found photo #${photo.id} by ${photo.photographer}`);
  const buffer = await downloadPexelsPhoto(photo);
  console.log(`  Uploading image to Sanity...`);
  const imageAsset = await sanity.assets.upload("image", buffer, {
    filename: `pexels-${photo.id}.jpg`,
    contentType: "image/jpeg",
  });
  console.log(`  Image asset uploaded: ${imageAsset._id}`);
  return { imageAsset, photo };
}

// ── Step 6: Create Sanity article document ─────────────────────────────────────
async function createSanityArticle(
  article: ArticleQueueItem,
  generatedContent: GeneratedContent,
  imageAsset: { _id: string },
  photo: PexelsPhoto
): Promise<string> {
  const doc = {
    _type: "article",
    title: generatedContent.title,
    slug: { _type: "slug", current: article.slug },
    excerpt: generatedContent.excerpt,
    category: article.category,
    tag: article.tag || undefined,
    readTime: article.readTime,
    publishedAt: new Date().toISOString(),
    featured: false,
    coverImage: {
      _type: "image",
      asset: { _type: "reference", _ref: imageAsset._id },
      alt: photo.alt || article.title,
      credit: buildPexelsCredit(photo),
      pexelsId: photo.id,
      pexelsUrl: photo.url,
    },
    content: generatedContent.content,
    seoTitle: generatedContent.seoTitle,
    seoDescription: generatedContent.seoDescription,
  };

  console.log(`  Creating Sanity document...`);
  const created = await sanity.create(doc);
  console.log(`  Sanity document created: ${created._id}`);
  return created._id;
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main(): Promise<void> {
  // Validate required env vars
  const missingVars: string[] = [];
  if (!process.env.ANTHROPIC_API_KEY) missingVars.push("ANTHROPIC_API_KEY");
  if (!process.env.SANITY_API_WRITE_TOKEN) missingVars.push("SANITY_API_WRITE_TOKEN");
  if (!process.env.PEXELS_API_KEY) missingVars.push("PEXELS_API_KEY");
  if (!process.env.DATAFORSEO_LOGIN) missingVars.push("DATAFORSEO_LOGIN");
  if (!process.env.DATAFORSEO_PASSWORD) missingVars.push("DATAFORSEO_PASSWORD");
  if (missingVars.length > 0) {
    console.error(`\nMissing required environment variables:\n  ${missingVars.join("\n  ")}`);
    process.exit(1);
  }

  // Parse CLI arg
  const slugArg = process.argv[2];
  const isNextMode = !slugArg || slugArg === "next";

  // Step 1: Read queue
  console.log("\nReading article queue...");
  const queue = await readQueue();

  // Step 2: Find target article
  let article: ArticleQueueItem | undefined;

  if (isNextMode) {
    // Find lowest-priority pending article
    const pending = queue
      .filter((a) => a.status === "pending")
      .sort((a, b) => a.priority - b.priority);
    article = pending[0];
    if (!article) {
      console.log("No pending articles in queue. All done!");
      process.exit(0);
    }
  } else {
    // Find by slug
    article = queue.find((a) => a.slug === slugArg);
    if (!article) {
      console.error(`No article found with slug: "${slugArg}"`);
      process.exit(1);
    }
    if (article.status !== "pending") {
      console.warn(
        `Article "${article.slug}" has status "${article.status}" (not pending). Proceeding anyway...`
      );
    }
  }

  console.log(`\nSelected article: "${article.title}"`);
  console.log(`  Slug: ${article.slug}`);
  console.log(`  Category: ${article.category}`);
  console.log(`  Target keyword: ${article.targetKeyword}`);
  console.log(`  Priority: ${article.priority}`);

  // Step 3: Mark as "writing" in queue
  const articleIndex = queue.findIndex((a) => a.id === article!.id);
  queue[articleIndex].status = "writing";
  await updateQueue(queue);
  console.log(`\nStatus updated to "writing"`);

  // Track whether we need to restore status on error
  let publishedSuccessfully = false;

  try {
    // Step 4: DataForSEO — keyword overview
    console.log("\n[1/5] Fetching keyword data from DataForSEO...");
    const keywordData = await getKeywordData(article.targetKeyword);

    // Step 5: DataForSEO — PAA questions from SERP
    console.log("\n[2/5] Fetching PAA questions from SERP...");
    const paaQuestions = await getPAAQuestions(article.targetKeyword);

    // Step 6: Generate article with Claude
    console.log("\n[3/5] Generating article with Claude...");
    const generatedContent = await generateArticle(article, keywordData, paaQuestions);

    // Step 7: Pexels cover image
    console.log("\n[4/5] Fetching and uploading cover image...");
    const { imageAsset, photo } = await uploadCoverImage(article);

    // Step 8: Create Sanity document
    console.log("\n[5/5] Publishing to Sanity...");
    const sanityId = await createSanityArticle(article, generatedContent, imageAsset, photo);

    // Step 9: Update queue — mark as published
    const publishedAt = new Date().toISOString();
    queue[articleIndex].status = "published";
    queue[articleIndex].sanityId = sanityId;
    queue[articleIndex].publishedAt = publishedAt;
    await updateQueue(queue);

    publishedSuccessfully = true;

    // Success log
    console.log("\n" + "=".repeat(60));
    console.log("Article published successfully!");
    console.log(`  Title:      ${generatedContent.title}`);
    console.log(`  Slug:       /articles/${article.slug}`);
    console.log(`  Sanity ID:  ${sanityId}`);
    console.log(`  SEO title:  ${generatedContent.seoTitle}`);
    console.log(`  Cover:      Photo by ${photo.photographer} on Pexels`);
    console.log(`  Published:  ${publishedAt}`);
    console.log("=".repeat(60));
    console.log(`\nView in Studio: https://vanzon.sanity.studio/desk/article`);
  } catch (err) {
    // Restore status to "pending" so the article can be retried
    if (!publishedSuccessfully) {
      console.error(`\nError occurred — restoring article status to "pending"...`);
      queue[articleIndex].status = "pending";
      await updateQueue(queue).catch((writeErr) => {
        console.error(`  Failed to restore queue status: ${(writeErr as Error).message}`);
      });
    }
    throw err;
  }
}

main().catch((err) => {
  console.error(`\nFatal error: ${(err as Error).message}`);
  if (process.env.DEBUG) {
    console.error(err);
  }
  process.exit(1);
});
