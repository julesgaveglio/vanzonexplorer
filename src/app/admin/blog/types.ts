export type ArticleStatus = "pending" | "writing" | "published" | "needs-improvement";

export interface ArticleQueueItem {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  category: "Pays Basque" | "Aménagement Van" | "Business Van" | "Achat Van" | "Club Privé";
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
  // New SEO fields from keyword researcher
  searchVolume?: number;
  competitionLevel?: string;
  seoScore?: number;
  createdAt?: string;
}

export interface GscMetrics {
  position?: number;
  clicks?: number;
  impressions?: number;
  ctr?: number;
  sessions?: number;
}

export const CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
  "Pays Basque": { bg: "bg-teal-50", text: "text-teal-700" },
  "Aménagement Van": { bg: "bg-emerald-50", text: "text-emerald-700" },
  "Business Van": { bg: "bg-amber-50", text: "text-amber-700" },
  "Achat Van": { bg: "bg-violet-50", text: "text-violet-700" },
  "Club Privé": { bg: "bg-rose-50", text: "text-rose-700" },
};

export const STATUS_CONFIG: Record<ArticleStatus, { label: string; bg: string; text: string; dot: string }> = {
  pending: { label: "En attente", bg: "bg-slate-100", text: "text-slate-600", dot: "bg-slate-400" },
  writing: { label: "En rédaction", bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-500" },
  published: { label: "Publié", bg: "bg-green-50", text: "text-green-700", dot: "bg-green-500" },
  "needs-improvement": { label: "À améliorer", bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500" },
};

export const CATEGORIES = ["Pays Basque", "Aménagement Van", "Business Van", "Achat Van", "Club Privé"] as const;
