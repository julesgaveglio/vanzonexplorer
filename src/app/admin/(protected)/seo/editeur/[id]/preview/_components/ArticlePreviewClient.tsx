"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

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
  const [queued, setQueued] = useState(draft.status === "queued");

  function handlePublish() {
    if (!confirm("Valider cet article et l'ajouter à la file de publication ?")) return;
    startTransition(async () => {
      const res = await fetch(`/api/admin/seo/drafts/${draft.id}/queue`, { method: "POST" });
      if (res.ok) {
        setQueued(true);
      }
    });
  }

  const readTimeMin = Math.ceil(
    (draft.html_content.replace(/<[^>]+>/g, " ").split(/\s+/).filter(Boolean).length) / 200
  );

  return (
    <div className="min-h-screen bg-slate-100">

      {/* Barre admin fixe en haut */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Retour à l&apos;éditeur
            </button>
            <span className="text-slate-300">|</span>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Aperçu article</span>
          </div>

          <div className="flex items-center gap-2">
            {queued ? (
              <span className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 border border-green-200 text-xs font-semibold rounded-lg">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                En file de publication
              </span>
            ) : (
              <button
                onClick={handlePublish}
                disabled={isPending}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-sky-500 text-white text-sm font-semibold rounded-lg hover:from-blue-700 hover:to-sky-600 transition-all shadow-sm disabled:opacity-60"
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
                Publier l&apos;article
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Contenu de la page — style Vanzon Explorer blog */}
      <div className="pt-14">

        {/* Hero article */}
        <div className="bg-white border-b border-slate-200 py-12">
          <div className="max-w-2xl mx-auto px-6">

            {/* Badge catégorie */}
            <div className="mb-5">
              <span
                style={{ background: "linear-gradient(135deg,#3B82F6,#0EA5E9)" }}
                className="inline-block text-white text-[11px] font-bold tracking-widest uppercase px-3 py-1.5 rounded-full"
              >
                Vanzon Explorer
              </span>
            </div>

            {/* Titre */}
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 leading-tight mb-4"
              style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
              {draft.title}
            </h1>

            {/* Excerpt */}
            {draft.excerpt && (
              <p className="text-lg text-slate-500 leading-relaxed mb-6">
                {draft.excerpt}
              </p>
            )}

            {/* Meta */}
            <div className="flex items-center gap-4 text-sm text-slate-400 border-t border-slate-100 pt-5">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-sky-400 flex items-center justify-center text-white text-xs font-bold">
                  V
                </div>
                <span className="font-medium text-slate-600">Vanzon Explorer</span>
              </div>
              <span>·</span>
              <span>{readTimeMin} min de lecture</span>
              {draft.target_url && (
                <>
                  <span>·</span>
                  <a
                    href={draft.target_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline truncate max-w-[200px]"
                  >
                    {draft.target_url.replace("https://", "")}
                  </a>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Corps de l'article */}
        <div className="bg-white">
          <div className="max-w-2xl mx-auto px-6 py-12">
            <div
              className="article-preview-content"
              dangerouslySetInnerHTML={{ __html: draft.html_content }}
            />
          </div>
        </div>

        {/* Footer Vanzon */}
        <div className="bg-slate-50 border-t border-slate-200 py-12">
          <div className="max-w-2xl mx-auto px-6 text-center">
            <div className="h-0.5 w-12 mx-auto mb-6 rounded-full"
              style={{ background: "linear-gradient(135deg,#3B82F6,#0EA5E9)" }} />
            <p className="text-sm text-slate-400">vanzonexplorer.com</p>
          </div>
        </div>
      </div>

      {/* Styles article */}
      <style>{`
        .article-preview-content {
          font-family: 'Georgia', 'Times New Roman', serif;
          font-size: 16px;
          line-height: 1.85;
          color: #1e293b;
        }
        .article-preview-content h1 {
          font-family: 'Inter', system-ui, sans-serif;
          font-size: 28px;
          font-weight: 800;
          color: #0f172a;
          margin: 0 0 28px;
          line-height: 1.2;
        }
        .article-preview-content h2 {
          font-family: 'Inter', system-ui, sans-serif;
          font-size: 20px;
          font-weight: 700;
          color: #0f172a;
          margin: 40px 0 14px;
          padding-top: 28px;
          border-top: 1px solid #e2e8f0;
          line-height: 1.3;
        }
        .article-preview-content h3 {
          font-family: 'Inter', system-ui, sans-serif;
          font-size: 16px;
          font-weight: 600;
          color: #334155;
          margin: 24px 0 10px;
          line-height: 1.4;
        }
        .article-preview-content p {
          margin: 0 0 18px;
          color: #334155;
        }
        .article-preview-content ul,
        .article-preview-content ol {
          margin: 0 0 18px;
          padding-left: 22px;
        }
        .article-preview-content li {
          margin-bottom: 8px;
          color: #334155;
        }
        .article-preview-content strong {
          font-weight: 600;
          color: #0f172a;
        }
        .article-preview-content em {
          color: #64748b;
        }
        .article-preview-content a {
          color: #3B82F6;
          text-decoration: underline;
          text-underline-offset: 2px;
        }
        .article-preview-content a:hover {
          color: #2563eb;
        }
        .article-preview-content blockquote {
          margin: 24px 0;
          padding: 14px 18px;
          border-left: 3px solid #3B82F6;
          background: #eff6ff;
          border-radius: 0 8px 8px 0;
          color: #1d4ed8;
          font-style: normal;
          font-family: 'Inter', system-ui, sans-serif;
          font-size: 14px;
          line-height: 1.6;
        }
        .article-preview-content table {
          width: 100%;
          border-collapse: collapse;
          margin: 24px 0;
          font-family: 'Inter', system-ui, sans-serif;
          font-size: 13px;
        }
        .article-preview-content th {
          background: #f1f5f9;
          padding: 10px 14px;
          text-align: left;
          font-weight: 600;
          color: #334155;
          border: 1px solid #e2e8f0;
        }
        .article-preview-content td {
          padding: 10px 14px;
          border: 1px solid #e2e8f0;
          color: #475569;
        }
        .article-preview-content tr:hover td {
          background: #f8fafc;
        }
      `}</style>
    </div>
  );
}
