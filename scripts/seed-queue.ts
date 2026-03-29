#!/usr/bin/env tsx
/**
 * seed-queue.ts — One-time migration from article-queue.json to Supabase.
 * Run once: npx tsx scripts/seed-queue.ts
 */

import path from "path";
import fs from "fs/promises";
import { insertQueueItem } from "./lib/queue";
import type { ArticleQueueItem } from "./lib/queue";

const QUEUE_FILE = path.resolve(path.dirname(__filename), "data/article-queue.json");

async function main() {
  const raw = await fs.readFile(QUEUE_FILE, "utf-8");
  const items = JSON.parse(raw) as ArticleQueueItem[];
  console.log(`🌱 Seeding ${items.length} articles into Supabase article_queue...\n`);

  let inserted = 0;
  let skipped = 0;

  for (const item of items) {
    try {
      const result = await insertQueueItem(item);
      if (result.inserted) {
        console.log(`  ✓ ${item.slug}`);
        inserted++;
      } else {
        console.log(`  ~ ${item.slug} (already exists)`);
        skipped++;
      }
    } catch (err) {
      console.error(`  ✗ ${item.slug}: ${(err as Error).message}`);
    }
  }

  console.log(`\n✅ Done: ${inserted} inserted, ${skipped} skipped`);
}

main().catch((err) => { console.error(err); process.exit(1); });
