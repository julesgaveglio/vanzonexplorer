// Re-export du type canonique depuis la source unique de vérité
import type { ArticleStatus } from "@/types/article-queue";
export type { ArticleStatus, ArticleQueueItem } from "@/types/article-queue";

export interface GscMetrics {
  position?: number;
  clicks?: number;
  impressions?: number;
  ctr?: number;
  sessions?: number;
}

export interface GaMetrics {
  sessions?: number;
  pageviews?: number;
  avgDuration?: number; // seconds
  bounceRate?: number;  // 0-100
}

export const CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
  "Pays Basque": { bg: "bg-teal-50", text: "text-teal-700" },
  "Aménagement Van": { bg: "bg-emerald-50", text: "text-emerald-700" },
  "Business Van": { bg: "bg-amber-50", text: "text-amber-700" },
  "Achat Van": { bg: "bg-violet-50", text: "text-violet-700" },
  "Club Privé": { bg: "bg-rose-50", text: "text-rose-700" },
  "Vie en van": { bg: "bg-sky-50", text: "text-sky-700" },
  "Réglementation": { bg: "bg-orange-50", text: "text-orange-700" },
};

export const STATUS_CONFIG: Record<ArticleStatus, { label: string; bg: string; text: string; dot: string }> = {
  pending: { label: "En attente", bg: "bg-slate-100", text: "text-slate-600", dot: "bg-slate-400" },
  writing: { label: "En rédaction", bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-500" },
  published: { label: "Publié", bg: "bg-green-50", text: "text-green-700", dot: "bg-green-500" },
  "needs-improvement": { label: "À améliorer", bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500" },
};

export const CATEGORIES = ["Vie en van", "Réglementation", "Pays Basque", "Aménagement Van", "Business Van", "Achat Van", "Club Privé"] as const;
