"use client";

import { useState, useRef, useCallback } from "react";

export interface QueueArticle {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  category: string;
  target_keyword: string;
  secondary_keywords: string[];
  target_word_count: number;
  status: string;
  priority: number;
  added_by: string;
  published_at: string | null;
}

interface QueueTableProps {
  articles: QueueArticle[];
  onChange: (articles: QueueArticle[]) => void;
  onDelete: (id: string) => void;
}

const CATEGORIES = ["Business Van", "Aménagement Van", "Achat Van", "Location Van"];
const STATUSES = ["pending", "generating", "published", "error"];

const statusConfig: Record<string, { label: string; className: string }> = {
  pending:    { label: "En attente",   className: "bg-amber-50 text-amber-700 border-amber-200" },
  generating: { label: "En cours",    className: "bg-blue-50 text-blue-700 border-blue-200" },
  published:  { label: "Publié",      className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  error:      { label: "Erreur",      className: "bg-red-50 text-red-700 border-red-200" },
};

export default function QueueTable({ articles, onChange, onDelete }: QueueTableProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const dragSourceIndex = useRef<number | null>(null);

  // ── Drag & Drop ──────────────────────────────────────────────
  const handleDragStart = useCallback((index: number) => {
    dragSourceIndex.current = index;
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, id: string) => {
    e.preventDefault();
    setDragOverId(id);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    const src = dragSourceIndex.current;
    if (src === null || src === targetIndex) {
      setDragOverId(null);
      return;
    }

    const next = [...articles];
    const [moved] = next.splice(src, 1);
    next.splice(targetIndex, 0, moved);

    // Reassign priorities to match new visual order
    const withPriorities = next.map((a, i) => ({ ...a, priority: i + 1 }));
    onChange(withPriorities);
    dragSourceIndex.current = null;
    setDragOverId(null);
  }, [articles, onChange]);

  const handleDragEnd = useCallback(() => {
    dragSourceIndex.current = null;
    setDragOverId(null);
  }, []);

  // ── Inline edit ──────────────────────────────────────────────
  const updateField = useCallback((id: string, field: keyof QueueArticle, value: unknown) => {
    onChange(articles.map(a => a.id === id ? { ...a, [field]: value } : a));
  }, [articles, onChange]);

  if (articles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
          <svg className="w-7 h-7 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
          </svg>
        </div>
        <p className="text-slate-900 font-semibold">Aucun article en file</p>
        <p className="text-slate-500 text-sm mt-1">Lance la génération pour peupler la file d&apos;articles.</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-slate-100">
      {articles.map((article, index) => {
        const isExpanded = expandedId === article.id;
        const isDragOver = dragOverId === article.id;
        const cfg = statusConfig[article.status] ?? statusConfig.pending;

        return (
          <div
            key={article.id}
            draggable
            onDragStart={() => handleDragStart(index)}
            onDragOver={(e) => handleDragOver(e, article.id)}
            onDrop={(e) => handleDrop(e, index)}
            onDragEnd={handleDragEnd}
            className={`group transition-all duration-150 ${
              isDragOver ? "bg-blue-50 border-l-2 border-l-blue-400" : "bg-white border-l-2 border-l-transparent hover:border-l-slate-200"
            }`}
          >
            {/* Row */}
            <div className="flex items-center gap-3 px-4 py-3">
              {/* Drag handle */}
              <div className="cursor-grab active:cursor-grabbing text-slate-300 hover:text-slate-500 flex-shrink-0 select-none touch-none">
                <svg width="10" height="16" viewBox="0 0 10 16" fill="currentColor">
                  <circle cx="2" cy="2" r="1.5"/>
                  <circle cx="8" cy="2" r="1.5"/>
                  <circle cx="2" cy="8" r="1.5"/>
                  <circle cx="8" cy="8" r="1.5"/>
                  <circle cx="2" cy="14" r="1.5"/>
                  <circle cx="8" cy="14" r="1.5"/>
                </svg>
              </div>

              {/* Priority badge */}
              <span className="w-6 h-6 flex-shrink-0 flex items-center justify-center text-xs font-bold text-slate-400 bg-slate-100 rounded-md">
                {article.priority}
              </span>

              {/* Title + keyword */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-800 truncate leading-tight">{article.title}</p>
                <p className="text-xs text-slate-400 truncate mt-0.5">{article.target_keyword}</p>
              </div>

              {/* Category */}
              <span className="hidden md:inline-flex text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md flex-shrink-0">
                {article.category}
              </span>

              {/* Word count */}
              <span className="hidden lg:inline text-xs text-slate-400 w-14 text-right flex-shrink-0">
                {article.target_word_count.toLocaleString()} mots
              </span>

              {/* Status */}
              <span className={`hidden sm:inline-flex text-xs font-medium px-2 py-0.5 rounded-md border flex-shrink-0 ${cfg.className}`}>
                {cfg.label}
              </span>

              {/* Actions */}
              <div className="flex items-center gap-1 flex-shrink-0 ml-1">
                <button
                  onClick={() => setExpandedId(isExpanded ? null : article.id)}
                  className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
                  title="Modifier"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125" />
                  </svg>
                </button>
                <button
                  onClick={() => {
                    if (confirm(`Supprimer "${article.title}" ?`)) onDelete(article.id);
                  }}
                  className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
                  title="Supprimer"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Expanded edit form */}
            {isExpanded && (
              <div className="px-4 pb-5 bg-slate-50 border-t border-slate-100">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                  {/* Title */}
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Titre</label>
                    <input
                      type="text"
                      value={article.title}
                      onChange={e => updateField(article.id, "title", e.target.value)}
                      className="w-full text-sm px-3 py-2 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  {/* Excerpt */}
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Résumé</label>
                    <textarea
                      value={article.excerpt}
                      onChange={e => updateField(article.id, "excerpt", e.target.value)}
                      rows={2}
                      className="w-full text-sm px-3 py-2 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    />
                  </div>

                  {/* Target keyword */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Mot-clé cible</label>
                    <input
                      type="text"
                      value={article.target_keyword}
                      onChange={e => updateField(article.id, "target_keyword", e.target.value)}
                      className="w-full text-sm px-3 py-2 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  {/* Category */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Catégorie</label>
                    <select
                      value={article.category}
                      onChange={e => updateField(article.id, "category", e.target.value)}
                      className="w-full text-sm px-3 py-2 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>

                  {/* Word count */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Nombre de mots cible</label>
                    <input
                      type="number"
                      value={article.target_word_count}
                      onChange={e => updateField(article.id, "target_word_count", Number(e.target.value))}
                      min={500}
                      max={5000}
                      step={100}
                      className="w-full text-sm px-3 py-2 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  {/* Status */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Statut</label>
                    <select
                      value={article.status}
                      onChange={e => updateField(article.id, "status", e.target.value)}
                      className="w-full text-sm px-3 py-2 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {STATUSES.map(s => (
                        <option key={s} value={s}>{statusConfig[s]?.label ?? s}</option>
                      ))}
                    </select>
                  </div>

                  {/* Secondary keywords */}
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                      Mots-clés secondaires <span className="text-slate-400 normal-case font-normal">(séparés par virgule)</span>
                    </label>
                    <input
                      type="text"
                      value={(article.secondary_keywords ?? []).join(", ")}
                      onChange={e => updateField(article.id, "secondary_keywords", e.target.value.split(",").map(s => s.trim()).filter(Boolean))}
                      className="w-full text-sm px-3 py-2 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
