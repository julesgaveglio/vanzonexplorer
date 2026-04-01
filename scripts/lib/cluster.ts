/**
 * scripts/lib/cluster.ts
 *
 * Assignation automatique pilier/cluster basée sur keyword matching.
 * Utilisé par queue-builder-monthly, blog-writer-agent, cluster-updater.
 */

import pillarsData from "../data/pillars.json";

export interface PillarCluster {
  pillarId: string;
  pillarUrl: string;
  pillarLabel: string;
  clusterTopic: string;  // ex: "business-rentabilite"
  clusterLabel: string;  // ex: "Business & Rentabilité"
}

export interface Pillar {
  id: string;
  pillarUrl: string;
  label: string;
  clusters: Cluster[];
}

export interface Cluster {
  id: string;
  label: string;
  keywords: string[];
}

const pillars = pillarsData as Pillar[];

/**
 * Assigne un pilier et un cluster à un article selon son keyword cible + titre + catégorie.
 * Retourne null si aucun match trouvé.
 */
export function assignCluster(opts: {
  targetKeyword: string;
  title: string;
  category?: string;
  secondaryKeywords?: string[];
}): PillarCluster | null {
  const { targetKeyword, title, category = "", secondaryKeywords = [] } = opts;

  // Text to match against (lowercase)
  const searchText = [targetKeyword, title, ...secondaryKeywords].join(" ").toLowerCase();

  // 1. Determine pillar from category first (fast path)
  let preferredPillarId: string | null = null;
  const cat = category.toLowerCase();
  if (cat.includes("formation") || cat.includes("business van")) preferredPillarId = "formation";
  else if (cat.includes("achat") || cat.includes("aménagement")) preferredPillarId = "achat";
  else if (cat.includes("location")) preferredPillarId = "location";

  // 2. Score each pillar/cluster by keyword match count
  let bestMatch: { pillar: Pillar; cluster: Cluster; score: number } | null = null;

  for (const pillar of pillars) {
    // Apply pillar preference bonus
    const pillarBonus = pillar.id === preferredPillarId ? 2 : 0;

    for (const cluster of pillar.clusters) {
      let score = pillarBonus;
      for (const kw of cluster.keywords) {
        if (searchText.includes(kw.toLowerCase())) score += 2;
        // Partial match (first meaningful word)
        const firstWord = kw.split(" ")[0];
        if (firstWord.length > 4 && searchText.includes(firstWord.toLowerCase())) score += 1;
      }
      if (score > (bestMatch?.score ?? 0)) {
        bestMatch = { pillar, cluster, score };
      }
    }
  }

  // Require at least a score of 2 to avoid false positives
  if (!bestMatch || bestMatch.score < 2) {
    // Fallback: use category-based pillar with first cluster
    if (preferredPillarId) {
      const fallbackPillar = pillars.find(p => p.id === preferredPillarId);
      if (fallbackPillar) {
        return {
          pillarId: fallbackPillar.id,
          pillarUrl: fallbackPillar.pillarUrl,
          pillarLabel: fallbackPillar.label,
          clusterTopic: fallbackPillar.clusters[0].id,
          clusterLabel: fallbackPillar.clusters[0].label,
        };
      }
    }
    return null;
  }

  return {
    pillarId: bestMatch.pillar.id,
    pillarUrl: bestMatch.pillar.pillarUrl,
    pillarLabel: bestMatch.pillar.label,
    clusterTopic: bestMatch.cluster.id,
    clusterLabel: bestMatch.cluster.label,
  };
}

/**
 * Groupe une liste d'articles par pilier puis cluster.
 */
export function groupByCluster<T extends { pillarSlug?: string; clusterTopic?: string; slug: string }>(
  articles: T[]
): Map<string, Map<string, T[]>> {
  const result = new Map<string, Map<string, T[]>>();

  for (const article of articles) {
    const pillar = article.pillarSlug ?? "unassigned";
    const cluster = article.clusterTopic ?? "general";

    if (!result.has(pillar)) result.set(pillar, new Map());
    const pillarMap = result.get(pillar)!;
    if (!pillarMap.has(cluster)) pillarMap.set(cluster, []);
    pillarMap.get(cluster)!.push(article);
  }

  return result;
}

/**
 * Trouve les articles "frères" (même pilier + cluster, slug différent).
 */
export function findSiblings<T extends { pillarSlug?: string; clusterTopic?: string; slug: string }>(
  article: T,
  allArticles: T[],
  maxSiblings = 3
): T[] {
  if (!article.pillarSlug || !article.clusterTopic) return [];

  return allArticles
    .filter(a =>
      a.slug !== article.slug &&
      a.pillarSlug === article.pillarSlug &&
      a.clusterTopic === article.clusterTopic
    )
    .slice(0, maxSiblings);
}
