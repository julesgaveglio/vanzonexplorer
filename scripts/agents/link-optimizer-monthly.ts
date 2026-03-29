#!/usr/bin/env tsx
/**
 * link-optimizer-monthly.ts
 *
 * Agent mensuel d'optimisation des liens dans les articles publiés.
 * Coût IA : 0 token — 100% algorithmique.
 *
 * PHASE 1 — LIENS EXTERNES
 *   Extrait tous les liens externes (markDefs Sanity Portable Text)
 *   → HEAD request sur chaque lien → supprime les liens morts (4xx, timeout)
 *   → Évite de supprimer les timeouts réseau passagers (recheck × 2)
 *
 * PHASE 2 — MAILLAGE INTERNE
 *   Construit un index keyword → /articles/[slug] depuis la queue
 *   → Scanne chaque bloc "normal" à la recherche de mots-clés d'autres articles
 *   → Injecte jusqu'à MAX_INTERNAL_LINKS nouveaux liens par article
 *   → Règles : pas dans les h2/h3, pas sur un span déjà marqué, pas le même
 *     article cible deux fois, pas le premier paragraphe (intro)
 *
 * Usage:
 *   npx tsx scripts/agents/link-optimizer-monthly.ts
 *   npx tsx scripts/agents/link-optimizer-monthly.ts --dry-run
 *   npx tsx scripts/agents/link-optimizer-monthly.ts [slug]   # article précis
 *
 * Required env vars:
 *   SANITY_API_WRITE_TOKEN
 *   NEXT_PUBLIC_SANITY_PROJECT_ID (optional, defaults to lewexa74)
 */

import path from "path";
import fsSync from "fs";
import { createClient } from "@sanity/client";
import { notifyTelegram } from "../lib/telegram";
import { getQueueItems, updateQueueItem } from "../lib/queue";
import { startRun, finishRun } from "../lib/agent-runs";

const PROJECT_ROOT = path.resolve(path.dirname(__filename), "../..");
const CONFIG_FILE = path.join(PROJECT_ROOT, "scripts/agents/prompts/link-optimizer-monthly.json");
const SITE_URL = "https://vanzonexplorer.com";
const SITE_HOST = "vanzonexplorer.com";

// ── Config (overridable via /admin/agents) ────────────────────────────────────

interface AgentConfig {
  maxInternalLinksPerArticle: number;
  minDaysBetweenChecks: number;
  minKeywordLength: number;
  externalCheckTimeoutMs: number;
  externalCheckRetries: number;
  skipExternalDomains: string[];
}

const DEFAULT_CONFIG: AgentConfig = {
  maxInternalLinksPerArticle: 3,
  minDaysBetweenChecks: 30,
  minKeywordLength: 5,
  externalCheckTimeoutMs: 8000,
  externalCheckRetries: 2,
  skipExternalDomains: [
    "google.com", "google.fr", "facebook.com", "instagram.com",
    "twitter.com", "x.com", "youtube.com", "linkedin.com",
  ],
};

function loadConfig(): AgentConfig {
  if (!fsSync.existsSync(CONFIG_FILE)) return DEFAULT_CONFIG;
  try {
    return { ...DEFAULT_CONFIG, ...JSON.parse(fsSync.readFileSync(CONFIG_FILE, "utf-8")) };
  } catch {
    return DEFAULT_CONFIG;
  }
}

// ── Sanity ────────────────────────────────────────────────────────────────────

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "lewexa74",
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
  apiVersion: "2024-01-01",
  token: process.env.SANITY_API_WRITE_TOKEN,
  useCdn: false,
});

// ── Types ─────────────────────────────────────────────────────────────────────

import type { ArticleQueueItem } from "../lib/queue";

interface PTMark {
  _type: string;
  _key: string;
  href?: string;
  [key: string]: unknown;
}

interface PTSpan {
  _type: "span";
  _key: string;
  text: string;
  marks: string[];
}

interface PTBlock {
  _type: string;
  _key: string;
  style?: string;
  children?: PTSpan[];
  markDefs?: PTMark[];
  listItem?: string;
  level?: number;
  [key: string]: unknown;
}

interface SanityArticle {
  _id: string;
  content: PTBlock[];
}

interface LinkCheckResult {
  url: string;
  ok: boolean;
  status?: number;
  error?: string;
}

interface InternalLinkEntry {
  url: string;       // /articles/slug
  slug: string;
  title: string;
  keywords: string[]; // sorted longest first for priority matching
}

// ── Utils ─────────────────────────────────────────────────────────────────────

function generateKey(): string {
  return Math.random().toString(36).slice(2, 10);
}

function daysSince(dateStr: string | null | undefined): number {
  if (!dateStr) return Infinity;
  return (Date.now() - new Date(dateStr).getTime()) / 86_400_000;
}

// ── PHASE 1 : External link checking ─────────────────────────────────────────

/** Extract all external markDefs from all blocks */
function extractExternalLinks(body: PTBlock[]): PTMark[] {
  const links: PTMark[] = [];
  for (const block of body) {
    if (!block.markDefs) continue;
    for (const mark of block.markDefs) {
      if (mark._type !== "link" || !mark.href) continue;
      const url = mark.href as string;
      if (!url.startsWith("http")) continue;
      // Skip same-domain links stored as absolute
      try {
        if (new URL(url).hostname === SITE_HOST) continue;
      } catch { continue; }
      links.push(mark);
    }
  }
  return links;
}

/** Check a single URL with HEAD, retry on network error (not on 4xx) */
async function checkUrl(url: string, config: AgentConfig): Promise<LinkCheckResult> {
  const shouldSkip = config.skipExternalDomains.some((d) => url.includes(d));
  if (shouldSkip) return { url, ok: true };

  for (let attempt = 0; attempt < config.externalCheckRetries; attempt++) {
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), config.externalCheckTimeoutMs);
      const res = await fetch(url, {
        method: "HEAD",
        redirect: "follow",
        signal: ctrl.signal,
        headers: { "User-Agent": "Mozilla/5.0 (compatible; VanzonBot/1.0)" },
      });
      clearTimeout(timer);

      // Definitive failures — don't retry
      if ([404, 410, 451].includes(res.status)) {
        return { url, ok: false, status: res.status };
      }
      // Transient server errors — retry
      if (res.status >= 500 && attempt < config.externalCheckRetries - 1) continue;

      return { url, ok: res.ok, status: res.status };
    } catch (err: unknown) {
      if (attempt < config.externalCheckRetries - 1) {
        await new Promise((r) => setTimeout(r, 1500));
        continue;
      }
      const msg = err instanceof Error ? err.message : String(err);
      // Abort = timeout → treat as transient, keep the link
      if (msg.includes("abort") || msg.includes("timeout")) {
        return { url, ok: true, error: "timeout" };
      }
      return { url, ok: false, error: msg };
    }
  }
  return { url, ok: true }; // shouldn't reach here
}

/** Remove dead links from body: removes markDef + clears marks on spans */
function removeDeadLinks(body: PTBlock[], deadKeys: Set<string>): PTBlock[] {
  if (deadKeys.size === 0) return body;
  return body.map((block) => {
    if (!block.markDefs) return block;
    const newMarkDefs = block.markDefs.filter((m) => !deadKeys.has(m._key));
    const newChildren = block.children?.map((span) => ({
      ...span,
      marks: span.marks.filter((m) => !deadKeys.has(m)),
    }));
    return { ...block, markDefs: newMarkDefs, children: newChildren };
  });
}

// ── PHASE 2 : Internal link injection ────────────────────────────────────────

/** Build index of all published articles: keyword → { url, title } */
function buildInternalLinkIndex(
  allItems: ArticleQueueItem[],
  currentSlug: string,
  config: AgentConfig
): InternalLinkEntry[] {
  const entries: InternalLinkEntry[] = [];

  for (const item of allItems) {
    if (item.status !== "published" || !item.sanityId) continue;
    if (item.slug === currentSlug) continue; // never link to self

    // Build keyword list: full phrases first, then individual significant words
    const rawKeywords = [item.targetKeyword, ...item.secondaryKeywords]
      .filter((kw) => kw && kw.trim().length > 0)
      .map((kw) => kw.toLowerCase().trim());

    const allKeywords: string[] = [];
    for (const kw of rawKeywords) {
      // Add full phrase if long enough
      if (kw.length >= config.minKeywordLength) allKeywords.push(kw);
      // Also add individual words ≥ minKeywordLength (excludes stopwords by length)
      for (const word of kw.split(/\s+/)) {
        if (word.length >= config.minKeywordLength) allKeywords.push(word);
      }
    }

    const keywords = allKeywords
      // Remove duplicates
      .filter((kw, i, arr) => arr.indexOf(kw) === i)
      // Longest keywords first → prefer specific matches
      .sort((a, b) => b.length - a.length);

    if (keywords.length === 0) continue;

    entries.push({
      url: `/articles/${item.slug}`,
      slug: item.slug,
      title: item.title,
      keywords,
    });
  }

  return entries;
}

/** Collect all URLs already linked in the body (to avoid duplicates) */
function getAlreadyLinkedUrls(body: PTBlock[]): Set<string> {
  const urls = new Set<string>();
  for (const block of body) {
    for (const mark of block.markDefs ?? []) {
      if (mark.href) urls.add(mark.href as string);
    }
  }
  return urls;
}

/**
 * Try to inject one internal link into a block.
 * Returns null if no injection opportunity found.
 */
function injectLinkInBlock(
  block: PTBlock,
  keyword: string,
  linkKey: string
): PTBlock | null {
  // Only inject in normal body paragraphs
  if (block._type !== "block") return null;
  if (block.style && block.style !== "normal") return null;
  if (!block.children || block.children.length === 0) return null;

  const keywordLower = keyword.toLowerCase();
  const newChildren: PTSpan[] = [];
  let injected = false;

  for (const span of block.children) {
    // Skip already-marked spans (avoid nesting links)
    if (span.marks.length > 0 || injected) {
      newChildren.push(span);
      continue;
    }

    const textLower = span.text.toLowerCase();
    const idx = textLower.indexOf(keywordLower);

    if (idx === -1) {
      newChildren.push(span);
      continue;
    }

    // Ensure keyword is not in the middle of a word
    const charBefore = idx > 0 ? textLower[idx - 1] : " ";
    const charAfter = textLower[idx + keyword.length] ?? " ";
    const isWordBoundary = /[\s,.'";:!?()[\]-]/.test(charBefore) && /[\s,.'";:!?()[\]-]/.test(charAfter);
    if (!isWordBoundary) {
      newChildren.push(span);
      continue;
    }

    // Split span into [before, keyword, after]
    const before = span.text.slice(0, idx);
    const match = span.text.slice(idx, idx + keyword.length);
    const after = span.text.slice(idx + keyword.length);

    if (before) newChildren.push({ ...span, _key: generateKey(), text: before, marks: [] });
    newChildren.push({ ...span, _key: generateKey(), text: match, marks: [linkKey] });
    if (after) newChildren.push({ ...span, _key: generateKey(), text: after, marks: [] });

    injected = true;
  }

  if (!injected) return null;

  const newMarkDefs = [...(block.markDefs ?? []), {
    _type: "link",
    _key: linkKey,
    href: "",  // filled by caller
  }];

  return { ...block, children: newChildren, markDefs: newMarkDefs };
}

/**
 * Inject internal links into body.
 * Returns { body, count } — body is unchanged if count === 0.
 */
function injectInternalLinks(
  body: PTBlock[],
  linkIndex: InternalLinkEntry[],
  alreadyLinked: Set<string>,
  config: AgentConfig
): { body: PTBlock[]; count: number } {
  let injectedCount = 0;
  const newBody = [...body];
  const linkedUrls = new Set(alreadyLinked); // track newly added too

  // Skip first paragraph (usually the intro — already SEO-optimized)
  const eligibleBlockIndices = newBody
    .map((b, i) => ({ b, i }))
    .filter(({ b, i }) => b._type === "block" && b.style === "normal" && i > 0)
    .map(({ i }) => i);

  for (const entry of linkIndex) {
    if (injectedCount >= config.maxInternalLinksPerArticle) break;
    if (linkedUrls.has(entry.url)) continue; // already linked to this article

    let injected = false;

    for (const keyword of entry.keywords) {
      if (injected) break;
      if (injectedCount >= config.maxInternalLinksPerArticle) break;

      for (const blockIdx of eligibleBlockIndices) {
        const linkKey = generateKey();
        const result = injectLinkInBlock(newBody[blockIdx], keyword, linkKey);

        if (result) {
          // Fix the href in the newly added markDef
          const newMarkDefs = result.markDefs!.map((m) =>
            m._key === linkKey ? { ...m, href: entry.url } : m
          );
          newBody[blockIdx] = { ...result, markDefs: newMarkDefs };
          linkedUrls.add(entry.url);
          injectedCount++;
          injected = true;
          break;
        }
      }
    }
  }

  return { body: newBody, count: injectedCount };
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const isDryRun = process.argv.includes("--dry-run");
  const targetSlug = process.argv.slice(2).find((a) => !a.startsWith("--"));

  console.log(`\n🔗 Agent Link Optimizer${isDryRun ? " [DRY RUN]" : ""}`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  const config = loadConfig();
  console.log(`⚙️  Config: maxLinks=${config.maxInternalLinksPerArticle}, cooldown=${config.minDaysBetweenChecks}j, timeout=${config.externalCheckTimeoutMs}ms\n`);

  const runId = await startRun("link-optimizer-monthly");

  // Load queue
  const queue = await getQueueItems({ status: "published" });

  // Build internal link index from ALL published articles
  const published = queue.filter((a) => a.status === "published" && a.sanityId);
  console.log(`📚 ${published.length} articles publiés dans la queue\n`);

  // Select articles to process
  let toProcess = published.filter((a) => {
    if (targetSlug) return a.slug === targetSlug;
    return daysSince(a.lastLinkCheck) >= config.minDaysBetweenChecks;
  });

  if (toProcess.length === 0) {
    console.log("✅ Tous les articles ont été vérifiés récemment. Rien à faire.");
    return;
  }

  console.log(`🔍 ${toProcess.length} article(s) à traiter\n`);

  let totalExternalFixed = 0;
  let totalInternalAdded = 0;
  let totalUpdated = 0;

  for (const item of toProcess) {
    console.log(`\n▶ "${item.title}" (${item.slug})`);

    // Fetch Sanity body
    const article = await sanity.fetch<SanityArticle | null>(
      `*[_id == $id][0]{_id, content}`,
      { id: item.sanityId }
    );

    if (!article || !article.content) {
      console.log(`  ⚠️  Article non trouvé dans Sanity (sanityId: ${item.sanityId})`);
      continue;
    }

    let body = article.content;
    let modified = false;

    // ── PHASE 1: External links ──────────────────────────────────────────────
    const externalLinks = extractExternalLinks(body);
    if (externalLinks.length > 0) {
      console.log(`  🌐 ${externalLinks.length} lien(s) externe(s) à vérifier...`);

      // Check all links concurrently (with a concurrency cap of 5)
      const checkBatches: PTMark[][] = [];
      for (let i = 0; i < externalLinks.length; i += 5) {
        checkBatches.push(externalLinks.slice(i, i + 5));
      }

      const deadKeys = new Set<string>();
      for (const batch of checkBatches) {
        const results = await Promise.all(
          batch.map((mark) => checkUrl(mark.href as string, config))
        );
        for (let j = 0; j < results.length; j++) {
          const r = results[j];
          const mark = batch[j];
          if (!r.ok) {
            const reason = r.status ? `HTTP ${r.status}` : r.error ?? "erreur";
            console.log(`    ❌ MORT [${reason}] ${r.url}`);
            deadKeys.add(mark._key);
          } else {
            console.log(`    ✓ OK ${r.url}`);
          }
        }
      }

      if (deadKeys.size > 0) {
        body = removeDeadLinks(body, deadKeys);
        totalExternalFixed += deadKeys.size;
        modified = true;
        console.log(`  🗑️  ${deadKeys.size} lien(s) mort(s) supprimé(s)`);
      }
    } else {
      console.log(`  🌐 Aucun lien externe`);
    }

    // ── PHASE 2: Internal links ──────────────────────────────────────────────
    const linkIndex = buildInternalLinkIndex(queue, item.slug, config);
    const alreadyLinked = getAlreadyLinkedUrls(body);
    const { body: newBody, count } = injectInternalLinks(body, linkIndex, alreadyLinked, config);

    if (count > 0) {
      body = newBody;
      totalInternalAdded += count;
      modified = true;
      console.log(`  🔗 ${count} lien(s) interne(s) ajouté(s)`);
    } else {
      console.log(`  🔗 Maillage interne déjà optimal`);
    }

    // ── UPDATE ───────────────────────────────────────────────────────────────
    const now = new Date().toISOString();

    if (modified && !isDryRun) {
      await sanity.patch(article._id).set({ body }).commit();
      console.log(`  ✅ Sanity mis à jour`);
      totalUpdated++;
    } else if (isDryRun && modified) {
      console.log(`  [DRY RUN] Modifications simulées — Sanity non modifié`);
    }

    // Always update lastLinkCheck in Supabase
    if (!isDryRun) {
      await updateQueueItem(item.id, { lastLinkCheck: now });
    }
  }

  // Summary
  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`📊 Résumé :`);
  console.log(`   Articles traités  : ${toProcess.length}`);
  console.log(`   Liens morts supprimés : ${totalExternalFixed}`);
  console.log(`   Liens internes ajoutés : ${totalInternalAdded}`);
  console.log(`   Articles mis à jour dans Sanity : ${totalUpdated}`);
  if (isDryRun) console.log("\n   ⚠️  [DRY RUN] — aucune modification réelle");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  await finishRun(runId, {
    status: "success",
    itemsProcessed: toProcess.length,
    metadata: { externalFixed: totalExternalFixed, internalAdded: totalInternalAdded },
  });
}

main()
  .then(() => notifyTelegram("🔗 *Link Optimizer* — Liens morts supprimés, maillage interne mis à jour."))
  .catch(async (err) => {
    await notifyTelegram(`❌ *Link Optimizer* — Erreur : ${(err as Error).message}`);
    console.error("❌ Erreur agent link-optimizer:", err);
    process.exit(1);
  });
