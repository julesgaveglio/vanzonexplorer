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
 *   DATAFORSEO_LOGIN (optional — keyword data skipped if absent)
 *   DATAFORSEO_PASSWORD
 *   TAVILY_API_KEY (optional — external sources skipped if absent)
 *   TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID (optional — notifications)
 *   NEXT_PUBLIC_SANITY_PROJECT_ID (optional, defaults to lewexa74)
 *   NEXT_PUBLIC_SANITY_DATASET (optional, defaults to production)
 */

import fs from "fs";
import path from "path";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@sanity/client";
import { searchPexelsPhoto, downloadPexelsPhoto, buildPexelsCredit } from "../../src/lib/pexels";
import { notifyTelegram } from "../lib/telegram";

// ── Constants ──────────────────────────────────────────────────────────────────
// scripts/agents/ → project root is two directories up
const PROJECT_ROOT = path.resolve(path.dirname(__filename), "../..");
const QUEUE_FILE = path.join(PROJECT_ROOT, "scripts/data/article-queue.json");
const PROMPTS_DIR = path.join(PROJECT_ROOT, "scripts/agents/prompts");

function loadAgentPrompt(name: string): string | null {
  const mdPath = path.join(PROMPTS_DIR, `${name}.md`);
  return fs.existsSync(mdPath) ? fs.readFileSync(mdPath, "utf-8").trim() : null;
}
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
  targetWordCount?: number; // target word count — drives structure & prompt constraints
  wordCountNote?: string;   // rationale (for humans reading the queue)
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

// ── Sanity: fetch all published article slugs ──────────────────────────────────
async function getPublishedSlugs(): Promise<Set<string>> {
  try {
    const docs = await sanity.fetch<Array<{ slug: { current: string } }>>(
      `*[_type == "article" && defined(slug.current)]{ slug }`
    );
    const slugs = new Set(docs.map((d) => d.slug.current));
    console.log(`  [LinkCheck] ${slugs.size} published article slug(s) fetched from Sanity`);
    return slugs;
  } catch (err) {
    console.warn(`  [LinkCheck] Could not fetch published slugs from Sanity: ${(err as Error).message}`);
    return new Set();
  }
}

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

interface PublishedArticle {
  slug: string;
  title: string;
  targetKeyword: string;
}

async function fetchExternalSources(keyword: string): Promise<TavilySource[]> {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) return [];
  try {
    const res = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        query: keyword + " site:fr OR site:.fr OR site:wikipedia.org",
        search_depth: "basic",
        max_results: 8,
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
function injectInternalLinks(markdown: string, publishedSlugs: Set<string> = new Set()): string {
  // Priority-ordered list: first match wins for each URL.
  // NOTE: \b doesn't work with French accented chars (é, à, û…) — use lookahead/lookbehind instead.
  // (?<![a-zA-ZÀ-ÿ]) = not preceded by a letter  (handles accents too)
  // (?![a-zA-ZÀ-ÿ])  = not followed by a letter
  const W = "(?<![a-zA-ZÀ-ÿ])"; // word-start boundary for French
  const w = "(?![a-zA-ZÀ-ÿ])";  // word-end boundary for French

  // Helper: only include article-specific rules if the slug is published
  const articleUrl = (slug: string) =>
    publishedSlugs.size === 0 || publishedSlugs.has(slug)
      ? `/articles/${slug}`
      : null;

  const allRules: Array<{ pattern: RegExp; url: string | null }> = [
    // /location — louer/réserver un van
    { pattern: new RegExp(`${W}(lou(?:er?|ez) (?:un |votre |son |notre |leur )?van(?:\\s+aménagé)?)${w}`, "i"), url: "/location" },
    { pattern: new RegExp(`${W}(location de van(?:\\s+aménagé)?)${w}`, "i"), url: "/location" },
    { pattern: new RegExp(`${W}(van en location)${w}`, "i"), url: "/location" },
    { pattern: new RegExp(`${W}(réserver (?:un |ton |votre )?van)${w}`, "i"), url: "/location" },
    { pattern: new RegExp(`${W}(vanlife)${w}`, "i"), url: "/location" },
    // /achat — acheter un van
    { pattern: new RegExp(`${W}(acheter (?:un |votre |ton |son )?van(?:\\s+aménagé)?)${w}`, "i"), url: "/achat" },
    { pattern: new RegExp(`${W}(van aménagé à (?:vendre|la vente|acheter))${w}`, "i"), url: "/achat" },
    { pattern: new RegExp(`${W}(van aménagé)${w}`, "i"), url: "/achat" }, // first mention of "van aménagé"
    // /articles/spots-dormir-van-pays-basque-legaux — bivouac & nuit en van
    { pattern: new RegExp(`${W}(bivouac(?:er|ant|quer)?)${w}`, "i"), url: articleUrl("spots-dormir-van-pays-basque-legaux") },
    { pattern: new RegExp(`${W}(dormir (?:dans |en |à bord de )?(?:son |ton |votre )?van)${w}`, "i"), url: articleUrl("spots-dormir-van-pays-basque-legaux") },
    { pattern: new RegExp(`${W}(nuit(?:s)? (?:dans |en |à bord de )?(?:son |ton |votre )?van)${w}`, "i"), url: articleUrl("spots-dormir-van-pays-basque-legaux") },
    // /road-trip-pays-basque-van — road trip (page statique)
    { pattern: new RegExp(`${W}(road[- ]trip (?:au |en van au |au )?Pays Basque)${w}`, "i"), url: "/road-trip-pays-basque-van" },
    { pattern: new RegExp(`${W}(road[- ]trip)${w}`, "i"), url: "/road-trip-pays-basque-van" },
    { pattern: new RegExp(`${W}(itinéraire (?:de |du |au )?Pays Basque)${w}`, "i"), url: "/road-trip-pays-basque-van" },
    // /road-trip-personnalise — générateur IA
    { pattern: new RegExp(`${W}(planifier (?:son |ton |votre )?(?:road[- ]trip|itinéraire))${w}`, "i"), url: "/road-trip-personnalise" },
    { pattern: new RegExp(`${W}(itinéraire personnalisé)${w}`, "i"), url: "/road-trip-personnalise" },
    // /pays-basque — guide/spots Pays Basque
    { pattern: new RegExp(`${W}(guide (?:du |de )?Pays Basque)${w}`, "i"), url: "/pays-basque" },
    { pattern: new RegExp(`${W}(spots? (?:du |au |en )?Pays Basque)${w}`, "i"), url: "/pays-basque" },
    { pattern: new RegExp(`${W}(Pays Basque vanlife)${w}`, "i"), url: "/pays-basque" },
    // /formation — Van Business Academy
    { pattern: new RegExp(`${W}(se lancer dans la location de van)${w}`, "i"), url: "/formation" },
    { pattern: new RegExp(`${W}(Van Business Academy)${w}`, "i"), url: "/formation" },
    { pattern: new RegExp(`${W}(aménager (?:son |votre |ton )?fourgon)${w}`, "i"), url: "/formation" },
  ];

  // Filter out rules with null URL (unpublished article targets)
  const rules = allRules.filter((r): r is { pattern: RegExp; url: string } => r.url !== null);

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

// ── Post-processing: verify and strip broken external links from Portable Text ─
// Sends HEAD requests to all external hrefs in markDefs.
// Removes markDef + flattens marks on spans for any URL that doesn't return 2xx.
async function verifyExternalLinks(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  blocks: Array<Record<string, any>>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<Array<Record<string, any>>> {
  // Collect all unique external hrefs
  const externalHrefs = new Set<string>();
  for (const block of blocks) {
    if (block._type !== "block" || !Array.isArray(block.markDefs)) continue;
    for (const def of block.markDefs) {
      if (def._type === "link" && typeof def.href === "string" && def.href.startsWith("http")) {
        externalHrefs.add(def.href);
      }
    }
  }

  if (externalHrefs.size === 0) return blocks;
  console.log(`  [LinkVerify] Checking ${externalHrefs.size} external link(s)...`);

  // HEAD-check each URL (5s timeout)
  const brokenUrls = new Set<string>();
  await Promise.all(
    Array.from(externalHrefs).map(async (href) => {
      try {
        const res = await fetch(href, {
          method: "HEAD",
          signal: AbortSignal.timeout(5000),
          headers: { "User-Agent": "Mozilla/5.0 (compatible; VanzonBot/1.0)" },
          redirect: "follow",
        });
        if (!res.ok) {
          brokenUrls.add(href);
          console.warn(`  [LinkVerify] BROKEN (${res.status}): ${href}`);
        } else {
          console.log(`  [LinkVerify] OK (${res.status}): ${href}`);
        }
      } catch {
        brokenUrls.add(href);
        console.warn(`  [LinkVerify] BROKEN (timeout/error): ${href}`);
      }
    })
  );

  if (brokenUrls.size === 0) return blocks;

  // Remove broken markDefs and flatten their marks in spans
  return blocks.map((block) => {
    if (block._type !== "block" || !Array.isArray(block.markDefs)) return block;

    const brokenKeys = new Set<string>(
      (block.markDefs as Array<{ _type: string; _key: string; href: string }>)
        .filter((def) => def._type === "link" && brokenUrls.has(def.href))
        .map((def) => def._key)
    );
    if (brokenKeys.size === 0) return block;

    const cleanMarkDefs = (block.markDefs as Array<{ _key: string }>).filter(
      (def) => !brokenKeys.has(def._key)
    );
    const cleanChildren = (
      block.children as Array<{ marks?: string[]; [k: string]: unknown }>
    ).map((child) => ({
      ...child,
      marks: (child.marks ?? []).filter((m: string) => !brokenKeys.has(m)),
    }));

    return { ...block, markDefs: cleanMarkDefs, children: cleanChildren };
  });
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

interface SerpAnalysis {
  paaQuestions: string[];
  topResults: Array<{ title: string; url: string; description: string }>;
}

// ── Step 2: SERP analysis — PAA questions + top organic results ─────────────────
async function analyzeSERP(keyword: string): Promise<SerpAnalysis> {
  console.log(`  Analyzing SERP for: "${keyword}"...`);
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

    type SerpItem = {
      type: string;
      title?: string;
      url?: string;
      description?: string;
      question?: string;
      items?: SerpItem[];
    };

    const items = (result as { items?: SerpItem[] })?.items ?? [];
    const paaQuestions: string[] = [];
    const topResults: SerpAnalysis["topResults"] = [];

    for (const item of items) {
      if (item.type === "people_also_ask" && Array.isArray(item.items)) {
        for (const paa of item.items) {
          const q = paa.title ?? paa.question;
          if (q && paaQuestions.length < 6) paaQuestions.push(q);
        }
      }
      if (item.type === "organic" && item.title && item.url && topResults.length < 5) {
        topResults.push({
          title: item.title,
          url: item.url,
          description: item.description ?? "",
        });
      }
    }

    console.log(`  Found ${paaQuestions.length} PAA + ${topResults.length} top organic results`);
    return { paaQuestions, topResults };
  } catch (err) {
    console.warn(`  Warning: SERP analysis failed — ${(err as Error).message}`);
    return { paaQuestions: [], topResults: [] };
  }
}

// ── Claude Sonnet 4.5 via Anthropic SDK ───────────────────────────────────────
async function callClaude(prompt: string, opts: { maxTokens?: number } = {}): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is required");

  const client = new Anthropic({ apiKey });
  const response = await client.messages.create({
    model: "claude-sonnet-4-5",
    max_tokens: opts.maxTokens ?? 8000,
    messages: [{ role: "user", content: prompt }],
  });

  const text = response.content
    .filter((b) => b.type === "text")
    .map((b) => (b as { type: "text"; text: string }).text)
    .join("");

  if (!text) throw new Error("Claude returned empty response");
  return text;
}

// ── Gemini Flash — fast metadata generation only ────────────────────────────────
async function callGemini(
  apiKey: string,
  prompt: string,
  opts: { json?: boolean; maxTokens?: number; model?: string } = {}
): Promise<string> {
  const model = opts.model ?? "gemini-2.5-flash";
  // gemini-2.5-pro requires thinking mode; flash can disable it with budget:0
  const thinkingConfig = model.includes("pro")
    ? { thinkingBudget: 8192 }
    : { thinkingBudget: 0 };
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          maxOutputTokens: opts.maxTokens ?? 2048,
          temperature: 0.5,
          thinkingConfig,
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

// ── FAQ extraction from markdown ──────────────────────────────────────────────
function extractFaqFromMarkdown(markdown: string): Array<{ question: string; answer: string }> {
  const items: Array<{ question: string; answer: string }> = [];
  const lines = markdown.split("\n");
  let inFaqSection = false;
  let currentQuestion: string | null = null;
  const currentAnswerLines: string[] = [];

  const saveCurrentItem = () => {
    if (currentQuestion && currentAnswerLines.length > 0) {
      items.push({ question: currentQuestion, answer: currentAnswerLines.join(" ").trim() });
      currentAnswerLines.length = 0;
    }
  };

  for (const line of lines) {
    const trimmed = line.trim();
    if (!inFaqSection) {
      if (/^##\s.*(FAQ|Questions\s+fr)/i.test(trimmed)) inFaqSection = true;
      continue;
    }
    // End FAQ section on next H2
    if (trimmed.startsWith("## ") && !/FAQ/i.test(trimmed)) {
      saveCurrentItem();
      break;
    }
    // New question (H3)
    if (trimmed.startsWith("### ")) {
      saveCurrentItem();
      currentQuestion = trimmed.slice(4).replace(/\*\*/g, "").trim();
      continue;
    }
    // Answer line
    if (currentQuestion && trimmed && !trimmed.startsWith("#") && !trimmed.startsWith(">")) {
      currentAnswerLines.push(trimmed.replace(/\*\*/g, "").replace(/\*/g, "").replace(/\[([^\]]+)\]\([^)]+\)/g, "$1"));
    }
  }
  saveCurrentItem();

  return items.slice(0, 8);
}

function buildFaqJsonLd(faqItems: Array<{ question: string; answer: string }>): string {
  if (faqItems.length === 0) return "";
  return JSON.stringify({
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqItems.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  });
}

// ── Step 3: Generate article ────────────────────────────────────────────────────
// Strategy: Claude Sonnet 4.5 for both metadata (JSON) and body (quality).
async function generateArticle(
  article: ArticleQueueItem,
  keywordData: KeywordData,
  serpAnalysis: SerpAnalysis,
  externalSources: TavilySource[],
  publishedSlugs: Set<string> = new Set(),
  publishedArticles: PublishedArticle[] = []
): Promise<GeneratedContent> {

  const { paaQuestions, topResults } = serpAnalysis;

  // ── Word count & structure based on article type ─────────────────────────────
  const targetWords = article.targetWordCount ?? 1400;
  const tolerance = Math.round(targetWords * 0.1);
  const wordCountInstruction = `**LONGUEUR CIBLE : ${targetWords} mots (±${tolerance} mots maximum — pas un mot de plus).**
Chaque phrase doit apporter une valeur concrète. Zéro remplissage, zéro répétition, zéro transition creuse.`;

  // Dynamic structure based on word count
  let structureBlock: string;
  const faqCount = targetWords <= 1200 ? 3 : targetWords <= 1800 ? 4 : 5;

  if (targetWords <= 1200) {
    structureBlock = `## Introduction (100-150 mots)
Accroche directe. Pose le problème, annonce la solution. Keyword dans les 80 premiers mots.

## [Section 1 — Essentiel, 300-350 mots]
### [Sous-section A — 150 mots]
### [Sous-section B — 150 mots]

## [Section 2 — Pratique, 300-350 mots]
Conseils terrain, données concrètes, liste si pertinent.

## FAQ — Questions fréquentes (${faqCount} questions × 80-100 mots chacune)
### [Question 1]
### [Question 2]
### [Question 3]

## Conclusion (80-100 mots)
3 points clés, CTA naturel.`;
  } else if (targetWords <= 1800) {
    structureBlock = `## Introduction (120-150 mots)
Accroche percutante. Keyword dans les 100 premiers mots. Annonce du plan.

## [Section 1 — Informationnel, 350-400 mots]
### [Sous-section A — 170 mots]
### [Sous-section B — 170 mots]

## [Section 2 — Pratique & Actionnable, 350-400 mots]
### [Sous-section A — 200 mots]
### [Sous-section B — 150 mots]

## [Section 3 — Données / Comparatif, 250-300 mots]
Liste à puces comparative si pertinent. ❌ INTERDIT : tableaux Markdown (| col | col |).

## FAQ — Questions fréquentes (${faqCount} questions × 80-100 mots chacune)
### [Question 1]
### [Question 2]
### [Question 3]
### [Question 4]

## Conclusion (100-120 mots)`;
  } else {
    structureBlock = `## Introduction (150-180 mots)
Accroche forte. Keyword dans les 100 premiers mots. Angle différenciateur vs top résultats.

## [Section 1 — Informationnel, 400-450 mots]
### [Sous-section A — 200 mots]
### [Sous-section B — 200 mots]

## [Section 2 — Pratique & Actionnable, 400-450 mots]
### [Sous-section A — 200 mots]
### [Sous-section B — 200 mots]

## [Section 3 — Données chiffrées / Comparatif, 300-350 mots]
Liste à puces comparative obligatoire. ❌ INTERDIT : tableaux Markdown (| col | col |).

## [Section 4 — Ancrage local / Expérience terrain, 250-300 mots]

## FAQ — Questions fréquentes (${faqCount} questions × 80-100 mots chacune)
### [Question 1]
### [Question 2]
### [Question 3]
### [Question 4]
### [Question 5]

## Conclusion (120-150 mots)`;
  }

  const paaBlock =
    paaQuestions.length > 0
      ? paaQuestions.slice(0, faqCount).map((q, i) => `${i + 1}. ${q}`).join("\n")
      : `Génère ${faqCount} questions pertinentes sur le sujet (angle PAA Google).`;

  const serpBlock =
    topResults.length > 0
      ? `TOP ${topResults.length} RÉSULTATS GOOGLE ACTUELS (ce que ton article doit dépasser):\n` +
        topResults.map((r, i) => `${i + 1}. "${r.title}" — ${r.url}\n   ${r.description}`).join("\n")
      : "";

  const externalLinksBlock =
    externalSources.length > 0
      ? `SOURCES EXTERNES VÉRIFIÉES (URLs réelles — intègre 2 à 3 de ces sources là où elles apportent de la valeur):
${externalSources.map((s) => `- [${s.title}](${s.url})`).join("\n")}`
      : `Aucune source externe fournie par Tavily. OBLIGATION : inclure 2-3 liens vers des sources d'autorité officielles françaises que tu connais avec certitude (ex: fr.wikipedia.org, légifrance.gouv.fr, service-public.fr, insee.fr, offices de tourisme officiels). Les liens cassés seront supprimés automatiquement après vérification.`;

  const publishedArticlesBlock =
    publishedArticles.length > 0
      ? `ARTICLES BLOG VANZON DÉJÀ PUBLIÉS (liens internes articles — intègre 2 à 3 liens pertinents si le contexte s'y prête):
${publishedArticles.slice(0, 15).map((a) => `- [${a.title}](/articles/${a.slug}) — keyword: "${a.targetKeyword}"`).join("\n")}`
      : "";

  // ── Call 1: metadata via Claude Sonnet 4.5 ───────────────────────────────────
  console.log(`  [Claude] Generating metadata JSON...`);
  const metaPrompt = `Tu génères des métadonnées SEO pour un article de blog.

Site: Vanzon Explorer — location et vente de van aménagé au Pays Basque
Article: "${article.title}"
Keyword cible: "${article.targetKeyword}"
Mots-clés secondaires: ${article.secondaryKeywords.join(", ")}

Réponds UNIQUEMENT avec ce JSON valide (aucune explication, aucune balise markdown):
{"title":"H1 accrocheur avec keyword principal (60-80 chars)","seoTitle":"title tag SEO max 60 chars","seoDescription":"meta description 140-155 chars avec CTA","excerpt":"accroche article 180-220 chars"}`;

  const metaText = await callClaude(metaPrompt, { maxTokens: 512 });
  let meta: Pick<GeminiRawContent, "title" | "seoTitle" | "seoDescription" | "excerpt">;
  try {
    const cleaned = metaText.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "").trim();
    meta = JSON.parse(cleaned);
  } catch {
    const match = metaText.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("Claude metadata: invalid JSON — " + metaText.slice(0, 200));
    meta = JSON.parse(match[0]);
  }

  // ── Call 2: article body via Claude Sonnet 4.5 ────────────────────────────────
  console.log(`  [Claude Sonnet 4.5] Generating article body...`);
  const internalLinksBlock = loadAgentPrompt("internal-links");
  const styleBlock = loadAgentPrompt("blog-writer") ?? `Tu es Jules Gaveglio, co-fondateur de Vanzon Explorer — expert vanlife au Pays Basque depuis 5 ans. Tu rédiges des articles de blog SEO qui classent sur Google et convertissent des lecteurs en clients.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
MISE EN FORME (obligatoire, pas optionnel)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• **gras** → mots-clés importants, données chiffrées, noms de lieux, points-clés
• *italique* → termes techniques, mots basques (larrun, pottok, txakoli…), citations
• Listes à puces → dès qu'il y a 3 éléments parallèles ou plus
• ❌ JAMAIS de tableaux Markdown (syntaxe | col | col | INTERDITE — utilise des listes à puces à la place)
• 1 callout par section H2 minimum (choisis selon le contexte):
  ⚠️ Point de vigilance important
  💡 Conseil pratique Vanzon Explorer
  📍 Spot ou lieu précis avec contexte utile
  ✅ Bonne pratique recommandée

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STYLE & TON
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Tutoiement chaleureux — tu parles à un vanlifer passionné
• Phrases courtes et rythmées. Alterner court/développé.
• Données concrètes: prix €, distances km, durées précises
• Ancrage local: noms de lieux basques précis (Biarritz, Saint-Jean-de-Luz, Ascain, Col de Saint-Ignace, Bayonne, Bidart, Hossegor…)
• Zéro superlatif creux ("incroyable", "révolutionnaire", "époustouflant")
• Zéro ouverture bateau ("De nos jours…", "Dans un monde où…")
• Écris comme un humain passionné qui connaît le terrain, pas comme une IA`;

  const bodyPrompt = `${styleBlock}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ARTICLE À RÉDIGER
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Titre H1: "${article.title}"
${article.wordCountNote ? `Format et contraintes spécifiques: ${article.wordCountNote}` : ""}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CONTRAINTE ABSOLUE DE LONGUEUR
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${wordCountInstruction}
Un article trop long avec du remplissage est pire qu'un article court et dense.
Chaque paragraphe doit avoir une raison d'exister.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DONNÉES SEO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Keyword principal: "${article.targetKeyword}"
Keywords secondaires: ${article.secondaryKeywords.join(", ")}
Volume mensuel: ${keywordData.search_volume ?? "inconnu"} recherches/mois
Concurrence: ${keywordData.competition_level ?? "inconnue"}

${serpBlock}

QUESTIONS "PEOPLE ALSO ASK" (à traiter en FAQ):
${paaBlock}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STRUCTURE (utilise ## pour H2, ### pour H3 — jamais de # H1)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${structureBlock}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
OBLIGATIONS SEO ABSOLUES (non négociables)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. **Keyword "${article.targetKeyword}" dans les 100 premiers mots** — intègre-le naturellement dès la première phrase ou le deuxième paragraphe.
2. **Minimum 5 liens internes** — utilise les pages Vanzon listées ci-dessous dans des phrases naturelles. Les liens en liste nue sont INTERDITS.
3. **Minimum 2 liens externes** — vers des sources d'autorité officielles françaises (Légifrance, Wikipedia FR, INSEE, service-public.fr, offices de tourisme). Les liens cassés sont supprimés automatiquement, donc ne t'inquiète pas si tu n'es pas sûr à 100%.
4. **H2 avec keywords secondaires** — au moins 2 titres H2 doivent inclure un de ces mots-clés : ${article.secondaryKeywords.slice(0, 4).join(", ")}.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
LIENS INTERNES VANZON EXPLORER (maillage interne)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${internalLinksBlock ?? "Pas de fichier internal-links.md trouvé — applique quand même des liens vers /location, /road-trip-personnalise et /formation quand c'est pertinent."}

${publishedArticlesBlock}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
LIENS EXTERNES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${externalLinksBlock}
Format: [texte ancre descriptif](url) — intègre dans des phrases naturelles, jamais en liste nue.

Réponds UNIQUEMENT avec le texte markdown. Aucune explication, aucune balise, aucun JSON.`;

  // Scale max tokens to target word count.
  // Formula: content tokens (≈1.5 tokens/word) + safety margin (2000).
  // Minimum of 6000 to ensure full content fits.
  const maxTokensForBody = Math.max(6000, Math.min(16000, Math.ceil(targetWords * 1.5) + 2000));
  const rawBody = await callClaude(bodyPrompt, { maxTokens: maxTokensForBody });

  // Extract FAQ items for Schema.org JSON-LD (before link injection modifies text)
  const faqItems = extractFaqFromMarkdown(rawBody);
  if (faqItems.length > 0) {
    console.log(`  [FAQ] ${faqItems.length} FAQ item(s) extracted for JSON-LD schema`);
  }

  // Post-process: inject internal links automatically (guaranteed, Claude-independent)
  // Only injects article links for slugs confirmed to exist in Sanity
  const body = injectInternalLinks(rawBody, publishedSlugs);

  // Convert markdown body to Portable Text blocks
  const content = markdownToPortableText(body);

  const parsed: GeneratedContent = {
    title: meta.title,
    seoTitle: meta.seoTitle,
    seoDescription: meta.seoDescription,
    excerpt: meta.excerpt,
    content,
    faqItems: faqItems.length > 0 ? faqItems : undefined,
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
  const faqJsonLd = generatedContent.faqItems && generatedContent.faqItems.length > 0
    ? buildFaqJsonLd(generatedContent.faqItems)
    : undefined;

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
    ...(faqJsonLd ? { faqSchema: faqJsonLd } : {}),
  };

  console.log(`  Creating Sanity document...`);
  const created = await sanity.create(doc);
  console.log(`  Sanity document created: ${created._id}`);
  return created._id;
}

// ── Google Search Console — sitemap submission ─────────────────────────────────
async function submitSitemapToGSC(): Promise<void> {
  const clientId = process.env.GOOGLE_GSC_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_GSC_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    console.log("  [GSC] Credentials manquants — soumission sitemap ignorée");
    return;
  }

  try {
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: "refresh_token",
      }),
    });
    const { access_token } = await tokenRes.json() as { access_token?: string };
    if (!access_token) throw new Error("Impossible d'obtenir un access token GSC");

    const site = encodeURIComponent("https://vanzonexplorer.com/");
    const sitemap = encodeURIComponent("https://vanzonexplorer.com/sitemap.xml");
    const res = await fetch(
      `https://www.googleapis.com/webmasters/v3/sites/${site}/sitemaps/${sitemap}`,
      { method: "PUT", headers: { Authorization: `Bearer ${access_token}` } }
    );

    if (res.status === 204) {
      console.log("  [GSC] ✅ Sitemap soumis à Google Search Console");
    } else {
      const err = await res.text();
      console.warn(`  [GSC] Réponse inattendue (${res.status}): ${err}`);
    }
  } catch (err) {
    // Non-bloquant
    console.warn(`  [GSC] Erreur soumission sitemap : ${(err as Error).message}`);
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main(): Promise<void> {
  // Validate required env vars
  const missingVars: string[] = [];
  if (!process.env.ANTHROPIC_API_KEY) missingVars.push("ANTHROPIC_API_KEY");
  if (!process.env.SANITY_API_WRITE_TOKEN) missingVars.push("SANITY_API_WRITE_TOKEN");
  if (!process.env.PEXELS_API_KEY) missingVars.push("PEXELS_API_KEY");
  // DataForSEO is optional — functions degrade gracefully
  if (!process.env.DATAFORSEO_LOGIN) console.warn("  ⚠️  DATAFORSEO_LOGIN not set — keyword data will be skipped");
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
  console.log(`  Target word count: ${article.targetWordCount ?? 1400} mots`);
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
    console.log("\n[1/7] Fetching keyword data from DataForSEO...");
    const keywordData = await getKeywordData(article.targetKeyword);

    // Step 5: DataForSEO SERP — PAA questions + top organic results
    console.log("\n[2/7] Analyzing SERP (PAA + top results)...");
    const serpAnalysis = await analyzeSERP(article.targetKeyword);

    // Step 5.5: Tavily — fetch verified external sources
    console.log("\n[3/7] Fetching external sources via Tavily...");
    const externalSources = await fetchExternalSources(article.targetKeyword);
    console.log(`  Found ${externalSources.length} verified external source(s)`);

    // Step 5.6: Fetch published Sanity slugs for link verification
    console.log("\n[4/7] Fetching published article slugs from Sanity...");
    const publishedSlugs = await getPublishedSlugs();

    // Build published articles list for dynamic internal links in prompt
    const publishedArticles: PublishedArticle[] = queue
      .filter((a) => a.status === "published" && a.slug && a.id !== article!.id)
      .map((a) => ({ slug: a.slug, title: a.title, targetKeyword: a.targetKeyword }));
    console.log(`  ${publishedArticles.length} published article(s) available for internal links`);

    // Step 6: Generate article — Claude Sonnet 4.5 for metadata + body
    console.log("\n[5/7] Generating article (Claude Sonnet 4.5)...");
    const generatedContent = await generateArticle(article, keywordData, serpAnalysis, externalSources, publishedSlugs, publishedArticles);

    // Step 6.1: Verify external links — strip broken ones before publishing
    console.log("\n[5.5/7] Verifying external links...");
    generatedContent.content = await verifyExternalLinks(generatedContent.content) as typeof generatedContent.content;

    // Step 6.5: SERP images — 1 API call, inject into content body
    console.log("\n[6/7] Fetching inline images via SERP API...");
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
    console.log("\n[7/7] Fetching and uploading cover image...");
    const { imageAsset, credit } = await uploadCoverImage(article);

    // Step 8: Create Sanity document
    console.log("\nPublishing to Sanity...");
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

    // Step 10: Submit sitemap to Google Search Console (non-blocking)
    await submitSitemapToGSC();

    await notifyTelegram(`✍️ *Blog Writer* — Article publié : "${generatedContent.title}"\n🔗 vanzonexplorer.com/articles/${article.slug}`);
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

main().catch(async (err) => {
  await notifyTelegram(`❌ *Blog Writer* — Erreur : ${(err as Error).message}`);
  console.error(`\nFatal error: ${(err as Error).message}`);
  if (process.env.DEBUG) {
    console.error(err);
  }
  process.exit(1);
});
