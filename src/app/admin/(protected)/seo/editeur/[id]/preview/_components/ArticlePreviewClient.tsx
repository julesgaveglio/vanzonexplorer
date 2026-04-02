"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import ArticleTemplate from "@/components/article-template/ArticleTemplate";

interface Draft {
  id: string;
  title: string;
  excerpt: string;
  html_content: string;
  target_url: string;
  status: "draft" | "queued" | "archived";
}

export default function ArticlePreviewClient({ draft }: { draft: Draft }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [published, setPublished] = useState(false);
  const [publishedUrl, setPublishedUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handlePublish() {
    if (!confirm("Publier cet article directement sur vanzonexplorer.com ?")) return;
    startTransition(async () => {
      setError(null);
      const res = await fetch(`/api/admin/seo/drafts/${draft.id}/publish`, { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setPublished(true);
        setPublishedUrl(data.url);
      } else {
        setError(data.error ?? "Erreur lors de la publication");
      }
    });
  }

  const adminBar = (
    <div className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-slate-200 shadow-sm">
      <div className="max-w-[1120px] mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Retour
          </button>
          <span className="text-slate-200">|</span>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Aperçu avant publication</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {error && (
            <span className="text-xs text-red-600 font-medium max-w-[280px] truncate">{error}</span>
          )}

          <a
            href={`/admin/seo/editeur/${draft.id}`}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-600 border border-slate-200 rounded-lg hover:border-slate-300 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Éditer
          </a>

          {published && publishedUrl ? (
            <a
              href={publishedUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 border border-green-200 text-xs font-semibold rounded-lg hover:bg-green-100 transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Publié — Voir l&apos;article →
            </a>
          ) : (
            <button
              onClick={handlePublish}
              disabled={isPending}
              className="flex items-center gap-2 px-4 py-2 bg-[#4D5FEC] hover:bg-[#3B4FD4] text-white text-sm font-semibold rounded-lg transition-colors shadow-sm disabled:opacity-60"
            >
              {isPending ? (
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
              {isPending ? "Publication…" : "Publier sur le site"}
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <ArticleTemplate
      title={draft.title}
      excerpt={draft.excerpt}
      html_content={draft.html_content}
      target_url={draft.target_url}
      adminBar={adminBar}
    />
  );
}
