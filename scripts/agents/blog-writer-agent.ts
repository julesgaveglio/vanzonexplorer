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
 *   GEMINI_API_KEY
 *   SANITY_API_WRITE_TOKEN
 *   PEXELS_API_KEY
 *   DATAFORSEO_LOGIN
 *   DATAFORSEO_PASSWORD
 *   NEXT_PUBLIC_SANITY_PROJECT_ID (optional, defaults to lewexa74)
 *   NEXT_PUBLIC_SANITY_DATASET (optional, defaults to production)
 */

import path from "path";
import { createClient } from "@sanity/client";
import { searchPexelsPhoto, downloadPexelsPhoto, buildPexelsCredit } from "../../src/lib/pexels";

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

interface GeminiRawContent {
  title: string;
  seoTitle: string;
  seoDescription: string;
  excerpt: string;
  body: string;
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

// ── Tavily: fetch verified external sources for a topic ───────────────────────
interface TavilySource {
  url: string;
  title: string;
}

async function fetchExternalSources(keyword: string): Promise<TavilySource[]> {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) return [];
  try {
    const res = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        query: keyword,
        search_depth: "basic",
        max_results: 5,
        include_domains: [
          "wikipedia.org",
          "ffrandonnee.fr",
          "pyrenees-atlantiques.fr",
          "pays-basque.fr",
          "tourisme64.com",
          "sncf.com",
          "lescrêtes.fr",
          "bassussarry.fr",
          "ascain.fr",
        ],
      }),
    });
    if (!res.ok) return [];
    const data = await res.json();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const results: TavilySource[] = (data.results ?? []).slice(0, 3).map((r: any) => ({
      url: r.url,
      title: r.title,
    }));
    return results;
  } catch {
    return [];
  }
}

// ── Post-processing: inject internal links into generated markdown ─────────────
// Applies each internal URL once (first occurrence of any matching phrase).
// Only applies to regular paragraph lines — not to headings/blockquotes/list items.
function injectInternalLinks(markdown: string): string {
  // Priority-ordered list: first match wins for each URL.
  // NOTE: \b doesn't work with French accented chars (é, à, û…) — use lookahead/lookbehind instead.
  // (?<![a-zA-ZÀ-ÿ]) = not preceded by a letter  (handles accents too)
  // (?![a-zA-ZÀ-ÿ])  = not followed by a letter
  const W = "(?<![a-zA-ZÀ-ÿ])"; // word-start boundary for French
  const w = "(?![a-zA-ZÀ-ÿ])";  // word-end boundary for French
  const rules: Array<{ pattern: RegExp; url: string }> = [
    // /vanzon/location — louer/réserver un van
    { pattern: new RegExp(`${W}(lou(?:er?|ez) (?:un |votre |son |notre |leur )?van(?:\\s+aménagé)?)${w}`, "i"), url: "/vanzon/location" },
    { pattern: new RegExp(`${W}(location de van(?:\\s+aménagé)?)${w}`, "i"), url: "/vanzon/location" },
    { pattern: new RegExp(`${W}(van en location)${w}`, "i"), url: "/vanzon/location" },
    { pattern: new RegExp(`${W}(réserver (?:un |ton |votre )?van)${w}`, "i"), url: "/vanzon/location" },
    { pattern: new RegExp(`${W}(vanlife)${w}`, "i"), url: "/vanzon/location" },
    // /vanzon/achat — acheter un van
    { pattern: new RegExp(`${W}(acheter (?:un |votre |ton |son )?van(?:\\s+aménagé)?)${w}`, "i"), url: "/vanzon/achat" },
    { pattern: new RegExp(`${W}(van aménagé à (?:vendre|la vente|acheter))${w}`, "i"), url: "/vanzon/achat" },
    { pattern: new RegExp(`${W}(van aménagé)${w}`, "i"), url: "/vanzon/achat" }, // first mention of "van aménagé"
    // /vanzon/articles/ou-dormir-van-pays-basque — bivouac & nuit en van
    { pattern: new RegExp(`${W}(bivouac(?:er|ant|quer)?)${w}`, "i"), url: "/vanzon/articles/ou-dormir-van-pays-basque" },
    { pattern: new RegExp(`${W}(dormir (?:dans |en |à bord de )?(?:son |ton |votre )?van)${w}`, "i"), url: "/vanzon/articles/ou-dormir-van-pays-basque" },
    { pattern: new RegExp(`${W}(nuit(?:s)? (?:dans |en |à bord de )?(?:son |ton |votre )?van)${w}`, "i"), url: "/vanzon/articles/ou-dormir-van-pays-basque" },
    // /vanzon/articles/road-trip-pays-basque-van — road trip
    { pattern: new RegExp(`${W}(road[- ]trip (?:au |en van au |au )?Pays Basque)${w}`, "i"), url: "/vanzon/articles/road-trip-pays-basque-van" },
    { pattern: new RegExp(`${W}(road[- ]trip)${w}`, "i"), url: "/vanzon/articles/road-trip-pays-basque-van" },
    { pattern: new RegExp(`${W}(itinéraire (?:de |du |au )?Pays Basque)${w}`, "i"), url: "/vanzon/articles/road-trip-pays-basque-van" },
    // /vanzon/pays-basque — guide/spots Pays Basque
    { pattern: new RegExp(`${W}(guide (?:du |de )?Pays Basque)${w}`, "i"), url: "/vanzon/pays-basque" },
    { pattern: new RegExp(`${W}(spots? (?:du |au |en )?Pays Basque)${w}`, "i"), url: "/vanzon/pays-basque" },
    { pattern: new RegExp(`${W}(Pays Basque vanlife)${w}`, "i"), url: "/vanzon/pays-basque" },
  ];

  const usedUrls = new Set<string>();
  const lines = markdown.split("\n");

  const result = lines.map((line) => {
    const trimmed = line.trim();
    // Skip headings, blockquotes, list items — only process paragraph text
    if (
      trimmed.startsWith("#") ||
      trimmed.startsWith(">") ||
      trimmed.startsWith("-") ||
      trimmed.startsWith("*") ||
      /^\d+\./.test(trimmed) ||
      trimmed.startsWith("⚠️") ||
      trimmed.startsWith("💡") ||
      trimmed.startsWith("📍") ||
      trimmed.startsWith("✅")
    ) {
      return line;
    }

    let processed = line;
    for (const { pattern, url } of rules) {
      if (usedUrls.has(url)) continue;
      const newLine = processed.replace(pattern, (match) => {
        usedUrls.add(url);
        return `[${match}](${url})`;
      });
      if (newLine !== processed) {
        processed = newLine;
        break; // One replacement per line to keep text natural
      }
    }
    return processed;
  });

  return result.join("\n");
}

// ── Inline markdown parser (bold, italic, links) ──────────────────────────────
function parseInlineMarkdown(text: string): {
  children: Array<{ _type: "span"; _key: string; text: string; marks: string[] }>;
  markDefs: Array<{ _type: string; _key: string; href: string; blank: boolean }>;
} {
  const children: Array<{ _type: "span"; _key: string; text: string; marks: string[] }> = [];
  const markDefs: Array<{ _type: string; _key: string; href: string; blank: boolean }> = [];

  // Match **bold**, *italic*, [text](url) — order matters (bold before italic)
  const regex = /\*\*([^*\n]+?)\*\*|\*([^*\n]+?)\*|\[([^\]\n]+?)\]\((https?:\/\/[^)\n]+|\/[^)\n]*)\)/g;

  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    // Plain text before match
    if (match.index > lastIndex) {
      const plain = text.slice(lastIndex, match.index);
      if (plain) children.push({ _type: "span", _key: randomKey(), text: plain, marks: [] });
    }

    if (match[1] !== undefined) {
      // **bold**
      children.push({ _type: "span", _key: randomKey(), text: match[1], marks: ["strong"] });
    } else if (match[2] !== undefined) {
      // *italic*
      children.push({ _type: "span", _key: randomKey(), text: match[2], marks: ["em"] });
    } else if (match[3] !== undefined && match[4] !== undefined) {
      // [text](url)
      const linkKey = `lnk${randomKey()}`;
      const isExternal = match[4].startsWith("http");
      markDefs.push({ _type: "link", _key: linkKey, href: match[4], blank: isExternal });
      children.push({ _type: "span", _key: randomKey(), text: match[3], marks: [linkKey] });
    }

    lastIndex = match.index + match[0].length;
  }

  // Remaining text
  if (lastIndex < text.length) {
    const remaining = text.slice(lastIndex);
    if (remaining) children.push({ _type: "span", _key: randomKey(), text: remaining, marks: [] });
  }

  // Fallback: whole text as one span
  if (children.length === 0) {
    children.push({ _type: "span", _key: randomKey(), text, marks: [] });
  }

  return { children, markDefs };
}

// ── Markdown → Portable Text converter ────────────────────────────────────────
function markdownToPortableText(markdown: string): PortableTextBlock[] {
  const blocks: PortableTextBlock[] = [];
  const lines = markdown.split("\n");

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed === "---") continue;

    let style: PortableTextBlock["style"] = "normal";
    let rawText = trimmed;

    if (trimmed.startsWith("### ")) {
      style = "h3";
      rawText = trimmed.slice(4);
    } else if (trimmed.startsWith("## ")) {
      style = "h2";
      rawText = trimmed.slice(3);
    } else if (trimmed.startsWith("> ")) {
      style = "blockquote";
      rawText = trimmed.slice(2);
    } else if (trimmed.startsWith("# ")) {
      continue; // Skip H1 — stored in title field
    }

    // For headings and blockquotes, strip inline marks for simplicity
    if (style === "h2" || style === "h3" || style === "blockquote") {
      const plainText = rawText.replace(/\*\*(.*?)\*\*/g, "$1").replace(/\*(.*?)\*/g, "$1").replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");
      blocks.push({
        _type: "block",
        _key: randomKey(),
        style,
        children: [{ _type: "span", _key: randomKey(), text: plainText, marks: [] }],
        markDefs: [],
      });
      continue;
    }

    // Normal paragraphs: parse inline bold/italic/links
    const { children, markDefs } = parseInlineMarkdown(rawText);
    blocks.push({
      _type: "block",
      _key: randomKey(),
      style,
      children,
      markDefs,
    });
  }

  return blocks;
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

// ── Gemini helper ──────────────────────────────────────────────────────────────
async function callGemini(
  apiKey: string,
  prompt: string,
  opts: { json?: boolean; maxTokens?: number; noThinking?: boolean } = {}
): Promise<string> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          maxOutputTokens: opts.maxTokens ?? 4096,
          temperature: 0.7,
          // Disable thinking to avoid token consumption on reasoning overhead
          ...(opts.noThinking ? { thinkingConfig: { thinkingBudget: 0 } } : {}),
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

// ── Step 3: Generate article with Gemini ───────────────────────────────────────
// Two-call strategy: metadata as JSON (small, safe) + body as plain markdown text.
// Avoids JSON encoding corruption for long French text with apostrophes/newlines.
async function generateArticle(
  article: ArticleQueueItem,
  keywordData: KeywordData,
  paaQuestions: string[]
): Promise<GeneratedContent> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY env var is required");
  }

  const paaBlock =
    paaQuestions.length > 0
      ? paaQuestions.map((q, i) => `${i + 1}. ${q}`).join("\n")
      : "Aucune question PAA disponible — génère 5 questions pertinentes sur le sujet.";

  // Fetch verified external sources via Tavily
  console.log(`  [Tavily] Searching external sources for: "${article.targetKeyword}"...`);
  const externalSources = await fetchExternalSources(article.targetKeyword);
  const externalLinksBlock =
    externalSources.length > 0
      ? `LIENS EXTERNES VÉRIFIÉS — UTILISE 1 À 3 DE CES URLs (elles existent réellement):
${externalSources.map((s) => `- [${s.title}](${s.url})`).join("\n")}
Place ces liens naturellement dans le texte, là où le sujet le justifie.`
      : `LIENS EXTERNES: aucune source vérifiée disponible — n'invente aucune URL externe.`;

  const context = `
Contexte:
- Site: Vanzon Explorer (location/vente van aménagé au Pays Basque)
- Keyword cible: "${article.targetKeyword}"
- Volume mensuel: ${keywordData.search_volume ?? "N/A"}
- Concurrence: ${keywordData.competition_level ?? "N/A"}
- Mots-clés secondaires: ${article.secondaryKeywords.join(", ")}
- Questions PAA:
${paaBlock}
`.trim();

  // ── Call 1: metadata only (small JSON, no encoding issues) ──────────────────
  console.log(`  [Gemini 1/2] Generating metadata...`);
  const metaPrompt = `${context}

Génère les métadonnées SEO pour l'article "${article.title}".

Réponds UNIQUEMENT avec ce JSON (pas d'explication):
{"title":"H1 exact optimisé avec keyword principal","seoTitle":"max 60 caractères","seoDescription":"max 155 caractères accrocheur","excerpt":"résumé 200-250 caractères"}`;

  const metaText = await callGemini(apiKey, metaPrompt, { json: true, maxTokens: 2048, noThinking: true });
  let meta: Pick<GeminiRawContent, "title" | "seoTitle" | "seoDescription" | "excerpt">;
  try {
    // Strip code fences if present
    const cleaned = metaText.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "").trim();
    meta = JSON.parse(cleaned);
  } catch {
    // Try to extract JSON object with regex
    const match = metaText.match(/\{[\s\S]*\}/);
    if (!match) {
      throw new Error("Gemini metadata call returned invalid JSON:\n" + metaText.slice(0, 400));
    }
    try {
      meta = JSON.parse(match[0]);
    } catch {
      throw new Error("Gemini metadata call returned invalid JSON:\n" + metaText.slice(0, 400));
    }
  }

  // ── Call 2: article body as plain markdown (no JSON wrapping) ───────────────
  console.log(`  [Gemini 2/2] Generating article body (2000-2500 mots)...`);
  const bodyPrompt = `${context}

Rédige le corps complet d'un article de 2000-2500 mots sur "${article.title}".

═══════════════════════════════════════
STRUCTURE OBLIGATOIRE
═══════════════════════════════════════
(utilise ## pour H2, ### pour H3, jamais de # H1)

## [Section 1 — informationnel/éducatif, 400-500 mots]
### [Sous-section 1a]
[150-200 mots avec données concrètes]
### [Sous-section 1b]
[150-200 mots]

## [Section 2 — pratique/actionnable, 400-500 mots]
### [Sous-section 2a]
[150-200 mots — étapes concrètes]
### [Sous-section 2b]
[150-200 mots]

## [Section 3 — données chiffrées / comparatif, 300-350 mots]
[Inclure un tableau comparatif si pertinent — max 4 colonnes]

## [Section 4 — Pays Basque & expérience terrain, 300-350 mots]
[Ancrage local fort — mentions de lieux précis du Pays Basque]

## FAQ — Questions fréquentes
### [Question 1 tirée du PAA]
[Réponse directe 80-120 mots — optimisé featured snippet]
### [Question 2]
[80-120 mots]
### [Question 3]
[80-120 mots]
### [Question 4]
[80-120 mots]
### [Question 5]
[80-120 mots]

## Conclusion
[100-130 mots — récapitulatif 3 points clés, CTA naturel]

═══════════════════════════════════════
MISE EN FORME OBLIGATOIRE
═══════════════════════════════════════

TEXTE ENRICHI — utilise dans chaque section:
- **texte en gras** pour les mots-clés importants, données chiffrées, lieux précis
- *texte en italique* pour les termes techniques, citations, mots basques
- Listes à puces (- item) pour les éléments parallèles (3+ items)

CALLOUTS — utilise au minimum 1 par section H2:
⚠️ [Avertissement ou point de vigilance important]
💡 [Conseil pratique ou astuce terrain Vanzon]
📍 [Spot ou lieu précis avec contexte]
✅ [Bonne pratique recommandée]

═══════════════════════════════════════
LIENS EXTERNES (OBLIGATOIRE — UTILISE CES URLs EXACTES)
═══════════════════════════════════════

${externalLinksBlock}
Format: [texte ancre court et descriptif](url)
Les liens internes seront ajoutés automatiquement en post-traitement — ne les inclus PAS.

═══════════════════════════════════════
TON & STYLE
═══════════════════════════════════════
- Expert terrain Vanzon Explorer au Pays Basque
- Chaleureux, tutoiement pour les vanlifers
- Données concrètes: distances en km, prix réels, durées précises
- Ancrage local: noms de lieux basques précis (Biarritz, Bidart, Ascain, etc.)
- Jamais de superlatifs vides ("incroyable", "parfait", "révolutionnaire")
- Jamais d'ouvertures clichées ("Dans un monde où...", "De nos jours...")

Réponds UNIQUEMENT avec le texte markdown de l'article, sans JSON, sans balises, sans explication.`;

  const rawBody = await callGemini(apiKey, bodyPrompt, { json: false, maxTokens: 8192 });

  // Post-process: inject internal links automatically (Gemini doesn't generate them reliably)
  const body = injectInternalLinks(rawBody);

  // Convert markdown body to Portable Text blocks
  const content = markdownToPortableText(body);

  const parsed: GeneratedContent = {
    title: meta.title,
    seoTitle: meta.seoTitle,
    seoDescription: meta.seoDescription,
    excerpt: meta.excerpt,
    content,
  };

  console.log(`  Article generated: "${parsed.title}" (${parsed.content.length} blocks)`);
  return parsed;
}

// ── Step 3.5: SERP image search + upload ──────────────────────────────────────
// 1 API call per article → stays well within the 250/month quota.
// Non-fatal: article publishes normally even if SERP fails.

interface SerpImageResult {
  url: string;
  alt: string;
  sanityId: string;
}

async function searchAndUploadSerpImages(
  keyword: string,
  articleTitle: string,
  maxImages = 3
): Promise<SerpImageResult[]> {
  const apiKey = process.env.SERPAPI_KEY;
  if (!apiKey) {
    console.log("  SERPAPI_KEY not set — skipping inline images.");
    return [];
  }

  // ── 1 API call: fetch top 8 images, keep best 3 ──────────────────────────
  const query = `${keyword} pays basque`;
  const url =
    `https://serpapi.com/search.json` +
    `?engine=google_images` +
    `&q=${encodeURIComponent(query)}` +
    `&api_key=${apiKey}` +
    `&hl=fr&gl=fr&num=8&safe=active`;

  console.log(`  [SERP] Searching images for: "${query}" (1 call, quota: 250/mois)...`);

  let candidates: Array<{ original?: string; title?: string }> = [];
  try {
    const res = await fetch(url);
    if (!res.ok) {
      console.warn(`  [SERP] API returned ${res.status} — skipping inline images.`);
      return [];
    }
    const json = await res.json() as { images_results?: typeof candidates };
    candidates = json.images_results ?? [];
    console.log(`  [SERP] ${candidates.length} images found.`);
  } catch (err) {
    console.warn(`  [SERP] Fetch error: ${(err as Error).message} — skipping.`);
    return [];
  }

  // ── Upload valid images to Sanity (up to maxImages) ───────────────────────
  const results: SerpImageResult[] = [];

  for (const candidate of candidates) {
    if (results.length >= maxImages) break;
    if (!candidate.original) continue;

    try {
      const imgRes = await fetch(candidate.original, { signal: AbortSignal.timeout(8000) });
      if (!imgRes.ok) continue;

      const contentType = imgRes.headers.get("content-type") ?? "image/jpeg";
      if (!contentType.startsWith("image/")) continue;

      const buffer = Buffer.from(await imgRes.arrayBuffer());
      if (buffer.length < 10_000) continue; // skip tiny/broken images

      const ext = contentType.includes("png") ? "png" : contentType.includes("webp") ? "webp" : "jpg";
      const asset = await sanity.assets.upload("image", buffer, {
        filename: `serp-${randomKey()}.${ext}`,
        contentType,
      });

      const alt = candidate.title ?? articleTitle;
      results.push({ url: candidate.original, alt, sanityId: asset._id });
      console.log(`  [SERP] Uploaded image ${results.length}/${maxImages}: ${asset._id}`);
    } catch {
      // Skip this image silently and try the next
    }
  }

  console.log(`  [SERP] ${results.length} image(s) ready to insert in article.`);
  return results;
}

/** Insert Sanity image blocks at strategic positions in the content (after H2 sections). */
function injectImagesIntoContent(
  blocks: PortableTextBlock[],
  images: SerpImageResult[]
): Array<PortableTextBlock | Record<string, unknown>> {
  if (images.length === 0) return blocks;

  const result: Array<PortableTextBlock | Record<string, unknown>> = [];
  let h2Count = 0;
  let imageIndex = 0;
  // Insert after the content of 1st, 3rd, and 5th H2 (i.e., after a few paragraphs)
  const insertAfterH2Numbers = new Set([1, 3, 5]);
  let blocksAfterH2 = 0;

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    result.push(block);

    if (block.style === "h2") {
      h2Count++;
      blocksAfterH2 = 0;
      continue;
    }

    if (insertAfterH2Numbers.has(h2Count) && imageIndex < images.length) {
      blocksAfterH2++;
      // Insert image after 3 content blocks following the H2
      if (blocksAfterH2 === 3) {
        const img = images[imageIndex++];
        result.push({
          _type: "image",
          _key: randomKey(),
          asset: { _type: "reference", _ref: img.sanityId },
          alt: img.alt,
        });
      }
    }
  }

  return result;
}

// ── Cover image via SerpAPI (primary) or Pexels (fallback) ────────────────────
async function uploadCoverImage(
  article: ArticleQueueItem
): Promise<{ imageAsset: { _id: string }; credit: string }> {
  const serpApiKey = process.env.SERPAPI_KEY;

  // ── Try SerpAPI first (more relevant images) ───────────────────────────────
  if (serpApiKey) {
    const query = `${article.targetKeyword} pays basque`;
    const url =
      `https://serpapi.com/search.json` +
      `?engine=google_images` +
      `&q=${encodeURIComponent(query)}` +
      `&api_key=${serpApiKey}` +
      `&hl=fr&gl=fr&num=10&safe=active&imgtype=photo&imgsize=large`;

    console.log(`  [Cover] Searching SerpAPI images for: "${query}"...`);
    try {
      const res = await fetch(url);
      if (res.ok) {
        const json = await res.json() as { images_results?: Array<{ original?: string; title?: string; source?: string }> };
        const candidates = json.images_results ?? [];

        for (const candidate of candidates) {
          if (!candidate.original) continue;
          try {
            const imgRes = await fetch(candidate.original, { signal: AbortSignal.timeout(8000) });
            if (!imgRes.ok) continue;
            const contentType = imgRes.headers.get("content-type") ?? "image/jpeg";
            if (!contentType.startsWith("image/")) continue;
            const buffer = Buffer.from(await imgRes.arrayBuffer());
            if (buffer.length < 50_000) continue; // skip small/broken images
            const ext = contentType.includes("png") ? "png" : contentType.includes("webp") ? "webp" : "jpg";
            const asset = await sanity.assets.upload("image", buffer, {
              filename: `cover-serp-${randomKey()}.${ext}`,
              contentType,
            });
            const credit = candidate.source ? `Photo via ${candidate.source}` : "Photo via Google Images";
            console.log(`  [Cover] SerpAPI image uploaded: ${asset._id}`);
            return { imageAsset: asset, credit };
          } catch {
            continue;
          }
        }
      }
    } catch (err) {
      console.warn(`  [Cover] SerpAPI failed: ${(err as Error).message} — falling back to Pexels`);
    }
  }

  // ── Fallback: Pexels ───────────────────────────────────────────────────────
  console.log(`  [Cover] Falling back to Pexels for: "${article.targetKeyword}"...`);
  const photo = await searchPexelsPhoto(article.targetKeyword) ?? await searchPexelsPhoto(article.title);
  if (!photo) throw new Error(`No cover image found for "${article.targetKeyword}"`);

  console.log(`  [Cover] Pexels photo #${photo.id} by ${photo.photographer}`);
  const buffer = await downloadPexelsPhoto(photo);
  const imageAsset = await sanity.assets.upload("image", buffer, {
    filename: `cover-pexels-${photo.id}.jpg`,
    contentType: "image/jpeg",
  });
  console.log(`  [Cover] Pexels image uploaded: ${imageAsset._id}`);
  return { imageAsset, credit: buildPexelsCredit(photo) };
}

// ── Step 6: Create Sanity article document ─────────────────────────────────────
async function createSanityArticle(
  article: ArticleQueueItem,
  generatedContent: GeneratedContent,
  imageAsset: { _id: string },
  credit: string
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
      alt: article.title,
      credit,
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
  if (!process.env.GEMINI_API_KEY) missingVars.push("GEMINI_API_KEY");
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

    // Step 6: Generate article with Gemini
    console.log("\n[3/6] Generating article with Gemini...");
    const generatedContent = await generateArticle(article, keywordData, paaQuestions);

    // Step 6.5: SERP images — 1 API call, inject into content body
    console.log("\n[4/6] Fetching inline images via SERP API...");
    const serpImages = await searchAndUploadSerpImages(
      article.targetKeyword,
      generatedContent.title
    );
    if (serpImages.length > 0) {
      generatedContent.content = injectImagesIntoContent(
        generatedContent.content,
        serpImages
      ) as PortableTextBlock[];
      console.log(`  ${serpImages.length} image(s) injected into article content.`);
    }

    // Step 7: Cover image (SerpAPI → Pexels fallback)
    console.log("\n[5/6] Fetching and uploading cover image...");
    const { imageAsset, credit } = await uploadCoverImage(article);

    // Step 8: Create Sanity document
    console.log("\n[6/6] Publishing to Sanity...");
    const sanityId = await createSanityArticle(article, generatedContent, imageAsset, credit);

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
    console.log(`  Cover:      ${credit}`);
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
