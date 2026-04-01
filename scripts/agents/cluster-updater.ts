#!/usr/bin/env tsx
/**
 * cluster-updater.ts
 *
 * Agent de synchronisation pilier/cluster SEO.
 * - Assigne pillar_slug + cluster_topic aux articles qui n'en ont pas
 * - Injecte/met à jour la section "Sur le même sujet" dans le body Sanity
 *   de chaque article avec liens vers pilier + frères du même cluster
 *
 * Usage:
 *   npx tsx scripts/agents/cluster-updater.ts            # tous les articles publiés
 *   npx tsx scripts/agents/cluster-updater.ts --dry-run  # aperçu sans modification
 *   npx tsx scripts/agents/cluster-updater.ts [slug]     # article spécifique
 *
 * Required env vars:
 *   SANITY_API_WRITE_TOKEN
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient } from "@sanity/client";
import { getQueueItems, updateQueueItem } from "../lib/queue";
import { assignCluster, findSiblings, groupByCluster } from "../lib/cluster";
import { notifyTelegram } from "../lib/telegram";
import { startRun, finishRun } from "../lib/agent-runs";

const SITE_URL = "https://vanzonexplorer.com";
const CLUSTER_SECTION_MARKER = "Sur le même sujet"; // H2 marker to detect existing section

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ?? "lewexa74",
  dataset: "production",
  apiVersion: "2024-01-01",
  token: process.env.SANITY_API_WRITE_TOKEN,
  useCdn: false,
});

// ── Types Portable Text ────────────────────────────────────────────────────────

interface PTSpan {
  _type: "span"; _key: string; text: string; marks: string[];
}
interface PTMarkDef {
  _type: string; _key: string; href?: string; blank?: boolean;
}
interface PTBlock {
  _type: string; _key: string; style?: string;
  children?: PTSpan[]; markDefs?: PTMarkDef[];
  listItem?: string; level?: number;
}
interface SanityDoc { _id: string; content: PTBlock[]; }

function rk(): string { return Math.random().toString(36).slice(2, 10); }

// ── Build "Sur le même sujet" Portable Text blocks ────────────────────────────

function buildClusterSection(
  pillarUrl: string,
  pillarLabel: string,
  siblings: Array<{ slug: string; title: string }>
): PTBlock[] {
  const blocks: PTBlock[] = [];

  // H2 header
  blocks.push({
    _type: "block", _key: rk(), style: "h2",
    children: [{ _type: "span", _key: rk(), text: "Sur le même sujet", marks: [] }],
    markDefs: [],
  });

  // Pillar link as first list item
  const pillarLinkKey = rk();
  blocks.push({
    _type: "block", _key: rk(), style: "normal",
    listItem: "bullet", level: 1,
    children: [
      { _type: "span", _key: rk(), text: "Guide complet : ", marks: [] },
      { _type: "span", _key: rk(), text: pillarLabel, marks: [pillarLinkKey] },
    ],
    markDefs: [{ _type: "link", _key: pillarLinkKey, href: SITE_URL + pillarUrl, blank: false }],
  });

  // Sibling links
  for (const sibling of siblings) {
    const linkKey = rk();
    blocks.push({
      _type: "block", _key: rk(), style: "normal",
      listItem: "bullet", level: 1,
      children: [{ _type: "span", _key: rk(), text: sibling.title, marks: [linkKey] }],
      markDefs: [{ _type: "link", _key: linkKey, href: `${SITE_URL}/articles/${sibling.slug}`, blank: false }],
    });
  }

  return blocks;
}

// ── Check if article already has a cluster section ────────────────────────────

function hasClusterSection(content: PTBlock[]): boolean {
  return content.some(
    b => b._type === "block" && b.style === "h2" &&
    b.children?.some(c => c.text?.includes(CLUSTER_SECTION_MARKER))
  );
}

function removeExistingClusterSection(content: PTBlock[]): PTBlock[] {
  let inClusterSection = false;
  return content.filter(block => {
    if (block._type === "block" && block.style === "h2" &&
        block.children?.some(c => c.text?.includes(CLUSTER_SECTION_MARKER))) {
      inClusterSection = true;
      return false;
    }
    if (inClusterSection) {
      // End of cluster section: new h2 (not our marker)
      if (block._type === "block" && block.style === "h2") {
        inClusterSection = false;
        return true;
      }
      return false; // Remove old cluster list items
    }
    return true;
  });
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const targetSlug = process.argv.find(a => !a.startsWith("-") && a !== process.argv[1] && !a.includes("cluster"));

  console.log(`🗂️  Cluster Updater${dryRun ? " (DRY RUN)" : ""} — ${new Date().toLocaleDateString("fr-FR")}`);
  if (targetSlug) console.log(`   Mode : article spécifique → "${targetSlug}"`);

  const runId = await startRun("cluster-updater", { dryRun, targetSlug });

  // 1. Charger tous les articles publiés
  const allPublished = await getQueueItems({ status: "published" });
  console.log(`\n✓ ${allPublished.length} articles publiés chargés\n`);

  // 2. Assigner cluster aux articles qui n'en ont pas
  let backfilled = 0;
  for (const article of allPublished) {
    if (article.pillarSlug && article.clusterTopic) continue;
    const assigned = assignCluster({
      targetKeyword: article.targetKeyword,
      title: article.title,
      category: article.category,
      secondaryKeywords: article.secondaryKeywords,
    });
    if (!assigned) continue;
    if (!dryRun) {
      await updateQueueItem(article.id, {
        pillarSlug: assigned.pillarId,
        clusterTopic: assigned.clusterTopic,
      });
    }
    article.pillarSlug = assigned.pillarId;
    article.clusterTopic = assigned.clusterTopic;
    backfilled++;
  }
  if (backfilled > 0) console.log(`✓ ${backfilled} articles backfillés avec leur cluster\n`);

  // 3. Filtrer selon targetSlug si précisé
  const toProcess = targetSlug
    ? allPublished.filter(a => a.slug === targetSlug)
    : allPublished.filter(a => a.sanityId && a.pillarSlug);

  console.log(`📋 ${toProcess.length} articles à traiter pour la section cluster\n`);

  let updated = 0;
  let skipped = 0;

  for (const article of toProcess) {
    if (!article.sanityId || !article.pillarSlug) { skipped++; continue; }

    // Trouver les frères de cluster
    const siblings = findSiblings(article, allPublished, 3).filter(s => s.sanityId);
    if (siblings.length === 0) {
      console.log(`  ⚪ ${article.slug} — 0 frères de cluster, skip`);
      skipped++;
      continue;
    }

    // Charger le document Sanity
    let doc: SanityDoc | null = null;
    try {
      doc = await sanity.fetch<SanityDoc>(`*[_id == $id][0]{ _id, content }`, { id: article.sanityId });
    } catch {
      console.warn(`  ⚠️  ${article.slug} — Sanity fetch error`);
      skipped++;
      continue;
    }
    if (!doc) { skipped++; continue; }

    // Vérifier si la section existe déjà et est à jour
    const pillarUrl = article.pillarSlug === "formation" ? "/formation"
      : article.pillarSlug === "achat" ? "/achat"
      : "/location";
    const pillarLabel = article.pillarSlug === "formation" ? "Formation Van Business Academy"
      : article.pillarSlug === "achat" ? "Achat Van Aménagé"
      : "Location Van Aménagé";

    const clusterBlocks = buildClusterSection(pillarUrl, pillarLabel,
      siblings.map(s => ({ slug: s.slug, title: s.title }))
    );

    // Remove old section + append fresh one
    const cleanContent = removeExistingClusterSection(doc.content);
    const newContent = [...cleanContent, ...clusterBlocks];

    if (!dryRun) {
      try {
        await sanity.patch(article.sanityId).set({ content: newContent }).commit();
        console.log(`  ✓ ${article.slug} → "${pillarLabel}" + ${siblings.length} frères`);
        updated++;
      } catch (err) {
        console.warn(`  ✗ ${article.slug} — patch error: ${(err as Error).message}`);
        skipped++;
      }
    } else {
      console.log(`  [DRY RUN] ${article.slug} → ${siblings.length} frères à injecter`);
      updated++;
    }
  }

  await finishRun(runId, {
    status: "success",
    itemsProcessed: toProcess.length,
    itemsCreated: updated,
    metadata: { backfilled, updated, skipped },
  });

  console.log(`\n${dryRun ? "🔍 DRY RUN — " : ""}✅ ${updated} articles mis à jour, ${skipped} ignorés, ${backfilled} backfillés`);
}

main()
  .then(() => notifyTelegram("🗂️ *Cluster Updater* — Sections cluster synchronisées."))
  .catch(async err => {
    await notifyTelegram(`❌ *Cluster Updater* — Erreur : ${(err as Error).message}`);
    console.error("Fatal:", (err as Error).message);
    process.exit(1);
  });
