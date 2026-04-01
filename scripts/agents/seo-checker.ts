#!/usr/bin/env tsx
/**
 * seo-checker.ts
 *
 * Weekly SEO rank checker for Vanzon Explorer.
 * Checks Google rankings for published articles and updates the queue.
 *
 * Usage: npx tsx scripts/agents/seo-checker.ts
 *
 * Required env vars:
 *   DATAFORSEO_LOGIN
 *   DATAFORSEO_PASSWORD
 */

import { fileURLToPath } from "url";
import * as path from "path";
import { notifyTelegram } from "../lib/telegram";
import { getQueueItems, updateQueueItem } from "../lib/queue";
import { startRun, finishRun, logDfsCall } from "../lib/agent-runs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface RankedKeywordsResult {
  items?: Array<{
    keyword_data?: {
      keyword?: string;
    };
    ranked_serp_element?: {
      serp_item?: {
        rank_absolute?: number;
        url?: string;
      };
    };
  }>;
  total_count?: number;
}

interface SerpOrganicItem {
  type: string;
  rank_absolute?: number;
  url?: string;
  domain?: string;
}

interface SerpOrganicResult {
  items?: SerpOrganicItem[];
  total_count?: number;
}

// ---------------------------------------------------------------------------
// DataForSEO inline client
// ---------------------------------------------------------------------------

const DFS_BASE = "https://api.dataforseo.com/v3";
const DFS_TARGET = "vanzonexplorer.com";
const DFS_LOCATION_CODE = 2250; // France
const DFS_LANGUAGE_CODE = "fr";

function getAuthHeader(): string {
  const login = process.env.DATAFORSEO_LOGIN;
  const password = process.env.DATAFORSEO_PASSWORD;
  if (!login || !password) {
    throw new Error(
      "Missing required env vars: DATAFORSEO_LOGIN and DATAFORSEO_PASSWORD"
    );
  }
  return "Basic " + Buffer.from(`${login}:${password}`).toString("base64");
}

async function dfsPost<T = unknown>(endpoint: string, body: unknown): Promise<T> {
  const res = await fetch(`${DFS_BASE}${endpoint}`, {
    method: "POST",
    headers: {
      Authorization: getAuthHeader(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error(`DataForSEO error ${res.status}: ${await res.text()}`);
  }

  const json = await res.json();
  if (json.status_code !== 20000) {
    throw new Error(`DataForSEO API error: ${json.status_message}`);
  }

  void logDfsCall(endpoint, json.cost ?? 0);
  return json.tasks?.[0]?.result?.[0] as T;
}

// ---------------------------------------------------------------------------
// SEO position lookup
// ---------------------------------------------------------------------------

/**
 * Check the ranking position of DFS_TARGET for a given keyword.
 * Returns the position (1-based) or null if not found in top 100.
 *
 * Strategy:
 *   1. Try ranked_keywords endpoint (domain-centric, fast).
 *   2. Fall back to SERP live advanced if ranked_keywords returns nothing.
 */
async function checkPosition(keyword: string): Promise<number | null> {
  // --- Attempt 1: ranked_keywords ---
  try {
    const result = await dfsPost<RankedKeywordsResult>(
      "/dataforseo_labs/google/ranked_keywords/live",
      [
        {
          target: DFS_TARGET,
          keyword_filters: [["keyword_data.keyword", "=", keyword]],
          location_code: DFS_LOCATION_CODE,
          language_code: DFS_LANGUAGE_CODE,
          item_types: ["organic"],
          limit: 1,
        },
      ]
    );

    const items = result?.items ?? [];
    if (items.length > 0) {
      const position =
        items[0]?.ranked_serp_element?.serp_item?.rank_absolute ?? null;
      if (position !== null) {
        return position;
      }
    }
  } catch (err) {
    console.warn(
      `  [warn] ranked_keywords failed for "${keyword}", falling back to SERP: ${err}`
    );
  }

  // --- Attempt 2: SERP live advanced ---
  try {
    const serpResult = await dfsPost<SerpOrganicResult>(
      "/serp/google/organic/live/advanced",
      [
        {
          keyword,
          location_code: DFS_LOCATION_CODE,
          language_code: DFS_LANGUAGE_CODE,
          device: "desktop",
          depth: 100,
        },
      ]
    );

    const serpItems = serpResult?.items ?? [];
    for (const item of serpItems) {
      if (
        item.type === "organic" &&
        item.url &&
        item.url.includes(DFS_TARGET)
      ) {
        return item.rank_absolute ?? null;
      }
    }

    // Not found in top 100
    return null;
  } catch (err) {
    console.warn(`  [warn] SERP fallback failed for "${keyword}": ${err}`);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  const runId = await startRun("seo-checker");

  // Load published articles from Supabase
  const queue = await getQueueItems({ status: "published" });

  // Filter: published articles with publishedAt older than 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const articlesToCheck = queue.filter(
    (a) =>
      a.publishedAt !== null &&
      new Date(a.publishedAt) < thirtyDaysAgo
  );

  if (articlesToCheck.length === 0) {
    console.log("No articles to check (none published for more than 30 days).");
    await finishRun(runId, { status: "success", itemsProcessed: 0 });
    process.exit(0);
  }

  console.log(
    `Checking SEO rankings for ${articlesToCheck.length} article(s)...\n`
  );

  // Tracking for report
  const reportLines: string[] = [];
  let countGood = 0;
  let countBad = 0;
  let countNotRanking = 0;

  for (const article of articlesToCheck) {
    console.log(`  Checking: "${article.title}" — keyword: "${article.targetKeyword}"`);

    let position: number | null = null;

    try {
      position = await checkPosition(article.targetKeyword);
    } catch (err) {
      console.warn(`  [error] Could not check "${article.targetKeyword}": ${err}`);
    }

    // Determine sentinel / label
    const now = new Date().toISOString();

    if (position === null) {
      // Not found in top 100
      await updateQueueItem(article.id, { seoPosition: 101, status: "needs-improvement", lastSeoCheck: now });
      countNotRanking++;
      reportLines.push(
        `  ${article.title} — Not ranking (>100) for "${article.targetKeyword}"`
      );
      console.log(`    -> Not ranking (marked needs-improvement)`);
    } else if (position > 15) {
      await updateQueueItem(article.id, { seoPosition: position, status: "needs-improvement", lastSeoCheck: now });
      countBad++;
      reportLines.push(
        `  ${article.title} — Position ${position} for "${article.targetKeyword}"`
      );
      console.log(`    -> Position ${position} (marked needs-improvement)`);
    } else {
      // Good ranking — keep current status, just update position
      await updateQueueItem(article.id, { seoPosition: position, lastSeoCheck: now });
      countGood++;
      reportLines.push(
        `  ${article.title} — Position ${position} for "${article.targetKeyword}" ✓`
      );
      console.log(`    -> Position ${position} (good)`);
    }

    // Rate-limit between DataForSEO calls
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  // Print report
  const dateStr = new Date().toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  console.log(`
=== SEO Check Report — ${dateStr} ===
Articles checked: ${articlesToCheck.length}
  ✅ Position ≤ 15: ${countGood} articles
  ⚠️  Position > 15: ${countBad} articles (marked needs-improvement)
  ❌ Not ranking: ${countNotRanking} articles (marked needs-improvement)

Rankings:
${reportLines.join("\n")}
`);

  await finishRun(runId, {
    status: "success",
    itemsProcessed: articlesToCheck.length,
    metadata: { good: countGood, bad: countBad, notRanking: countNotRanking },
  });
}

main()
  .then(() => notifyTelegram("📊 *SEO Checker* — Vérification hebdomadaire des positions terminée."))
  .catch(async (err) => {
    await notifyTelegram(`❌ *SEO Checker* — Erreur : ${(err as Error).message}`);
    console.error("Fatal error:", err);
    process.exit(1);
  });
