// Type canonique ArticleQueueItem — source unique de vérité
// Combine la version complète de scripts/lib/queue.ts et les champs admin

export type ArticleStatus = "pending" | "writing" | "published" | "needs-improvement";

export interface ArticleQueueItem {
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
  status: ArticleStatus;
  priority: number;
  sanityId: string | null;
  publishedAt: string | null;
  lastSeoCheck: string | null;
  seoPosition: number | null;
  searchVolume?: number;
  competitionLevel?: string;
  seoScore?: number;
  addedBy?: string;
  lastOptimizedAt?: string | null;
  lastLinkCheck?: string | null;
  pillarSlug?: string;
  clusterTopic?: string;
  createdAt?: string;
}
