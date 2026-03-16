"use client";

import { useState, useTransition } from "react";
import type { ArticleQueueItem } from "../types";
import { CATEGORY_COLORS, STATUS_CONFIG, CATEGORIES } from "../types";
import { deleteFromQueue, triggerPublish } from "../actions";

interface ArticleQueueListProps {
  articles: ArticleQueueItem[];
}

export default function ArticleQueueList({ articles }: ArticleQueueListProps) {
  const queued = articles.filter(
    (a) => a.status === "pending" || a.status === "writing" || a.status === "needs-improvement"
  );

  const pendingCount = articles.filter((a) => a.status === "pending").length;
  const publishedCount = articles.filter((a) => a.status === "published").length;
  const writingCount = articles.filter((a) => a.status === "writing").length;

  if (queued.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-10 text-center">
        <p className="text-slate-400 text-sm">La file d&apos;attente est vide.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {CATEGORIES.map((category) => {
        const categoryArticles = queued
          .filter((a) => a.category === category)
          .sort((a, b) => a.priority - b.priority);

        if (categoryArticles.length === 0) return null;

        const pubCount = articles.filter((a) => a.category === category && a.status === "published").length;
        const pendCount = categoryArticles.filter((a) => a.status === "pending" || a.status === "writing").length;
        const catColor = CATEGORY_COLORS[category] ?? { bg: "bg-slate-50", text: "text-slate-600" };

        return (
          <div key={category} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-50 flex items-center gap-3">
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${catColor.bg} ${catColor.text}`}>
                {category}
              </span>
              <span className="text-xs text-slate-400 font-medium">
                {categoryArticles.length} article{categoryArticles.length > 1 ? "s" : ""} · {pubCount} publié{pubCount > 1 ? "s" : ""} · {pendCount} en attente
              </span>
            </div>
            <div className="divide-y divide-slate-50">
              {categoryArticles.map((article) => (
                <ArticleRow key={article.id} article={article} />
              ))}
            </div>
          </div>
        );
      })}
      <p className="text-xs text-slate-400 text-center pt-2">
        {pendingCount} en attente · {publishedCount} publiés · {writingCount} en rédaction
      </p>
    </div>
  );
}

function ArticleRow({ article }: { article: ArticleQueueItem }) {
  const [isPending, startTransition] = useTransition();
  const [isDeleted, setIsDeleted] = useState(false);
  const statusCfg = STATUS_CONFIG[article.status];
  const isWriting = article.status === "writing";

  if (isDeleted) return null;

  let seoScoreBadge: string | null = null;
  if (article.seoScore !== undefined) {
    if (article.seoScore >= 500) seoScoreBadge = "Fort";
    else if (article.seoScore >= 200) seoScoreBadge = "Moyen";
    else seoScoreBadge = "Faible";
  }

  const dateLabel = article.publishedAt
    ? new Date(article.publishedAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })
    : article.createdAt
    ? new Date(article.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })
    : null;

  function handleDelete() {
    if (!confirm(`Supprimer "${article.title}" de la queue ?`)) return;
    startTransition(async () => {
      const result = await deleteFromQueue(article.id);
      if (result.success) setIsDeleted(true);
      else alert("Erreur lors de la suppression : " + result.error);
    });
  }

  function handlePublish() {
    startTransition(async () => {
      const result = await triggerPublish(article.slug);
      if (!result.success) alert("Erreur : " + result.error);
    });
  }

  const sanityHref = article.sanityId
    ? `/vanzon/studio/structure/article;${article.sanityId}`
    : `/vanzon/studio/structure/article`;

  return (
    <div className={`flex items-center gap-4 px-6 py-4 transition-colors ${isWriting ? "bg-blue-50/40" : "hover:bg-slate-50/40"} ${isPending ? "opacity-50" : ""}`}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${statusCfg.bg} ${statusCfg.text}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot} ${isWriting ? "animate-pulse" : ""}`} />
            {statusCfg.label}
          </span>
          {seoScoreBadge && (
            <span className="text-xs text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full border border-slate-100">
              SEO {seoScoreBadge}{article.searchVolume ? ` · ${article.searchVolume}/mo` : ""}
            </span>
          )}
          {dateLabel && <span className="text-xs text-slate-400">{dateLabel}</span>}
        </div>
        <p className="text-sm font-semibold text-slate-800 truncate">{article.title}</p>
        <p className="text-xs text-slate-400 mt-0.5 font-mono truncate">{article.targetKeyword}</p>
      </div>
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <button onClick={handlePublish} disabled={isPending || isWriting}
          className="inline-flex items-center gap-1 text-xs font-medium text-white bg-indigo-500 hover:bg-indigo-600 disabled:bg-slate-300 disabled:cursor-not-allowed px-2.5 py-1.5 rounded-lg transition-colors">
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
          </svg>
          <span className="hidden sm:inline">Publier</span>
        </button>
        <a href={sanityHref} target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-purple-600 bg-slate-50 hover:bg-purple-50 px-2.5 py-1.5 rounded-lg transition-colors">
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          <span className="hidden sm:inline">Éditer</span>
        </a>
        <button onClick={handleDelete} disabled={isPending}
          className="inline-flex items-center gap-1 text-xs font-medium text-slate-400 hover:text-red-500 bg-slate-50 hover:bg-red-50 disabled:opacity-50 px-2.5 py-1.5 rounded-lg transition-colors">
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          <span className="hidden sm:inline">Supprimer</span>
        </button>
      </div>
    </div>
  );
}
