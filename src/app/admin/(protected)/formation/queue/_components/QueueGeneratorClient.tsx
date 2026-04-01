"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import QueueTable, { QueueArticle } from "./QueueTable";

interface QueueStats {
  total: number;
  vba: number;
  pending: number;
  published: number;
}

interface LogEntry {
  level: "info" | "success" | "error";
  message: string;
}

type FilterStatus = "all" | "pending" | "generating" | "published" | "error";

export default function QueueGeneratorClient() {
  const [stats, setStats] = useState<QueueStats>({ total: 0, vba: 0, pending: 0, published: 0 });
  const [articles, setArticles] = useState<QueueArticle[]>([]);
  const [originalArticles, setOriginalArticles] = useState<QueueArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [result, setResult] = useState<{ inserted: number; skipped: number } | null>(null);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [search, setSearch] = useState("");
  const [saveSuccess, setSaveSuccess] = useState(false);
  const logsEndRef = useRef<HTMLDivElement>(null);

  // Dirty check — compare by id+priority+fields
  const isDirty = JSON.stringify(articles) !== JSON.stringify(originalArticles);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [statsRes, articlesRes] = await Promise.all([
        fetch("/api/admin/formation/queue-articles/stats"),
        fetch("/api/admin/formation/queue-articles"),
      ]);
      if (statsRes.ok) setStats(await statsRes.json());
      if (articlesRes.ok) {
        const data = await articlesRes.json();
        const list = data.articles ?? [];
        setArticles(list);
        setOriginalArticles(list);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Auto-scroll logs
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  async function handleGenerate() {
    setGenerating(true);
    setLogs([]);
    setResult(null);
    try {
      const response = await fetch("/api/admin/formation/queue-articles", { method: "POST" });
      if (!response.body) return;
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const event = JSON.parse(line.slice(6));
              if (event.type === "log") {
                setLogs(prev => [...prev, { level: event.level, message: event.message }]);
              } else if (event.type === "done") {
                setResult({ inserted: event.inserted ?? 0, skipped: event.skipped ?? 0 });
                await fetchAll();
              }
            } catch { /* skip */ }
          }
        }
      }
    } catch (err) {
      setLogs(prev => [...prev, { level: "error", message: String(err) }]);
    } finally {
      setGenerating(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    setSaveSuccess(false);
    try {
      // Find modified articles
      const modified = articles.filter((a, i) => {
        const orig = originalArticles[i];
        return !orig || JSON.stringify(a) !== JSON.stringify(orig);
      });

      if (modified.length === 0) { setSaving(false); return; }

      const res = await fetch("/api/admin/formation/queue-articles", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ articles: modified }),
      });

      if (res.ok) {
        setOriginalArticles([...articles]);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch { /* silent */ }
    finally { setSaving(false); }
  }

  async function handleDelete(id: string) {
    try {
      await fetch("/api/admin/formation/queue-articles", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const next = articles.filter(a => a.id !== id);
      setArticles(next);
      setOriginalArticles(next);
      // Update stats
      setStats(s => ({ ...s, total: s.total - 1, pending: s.pending - 1 }));
    } catch { /* silent */ }
  }

  // Filtered view for display — but we pass the full list to QueueTable for reordering
  const filteredArticles = articles.filter(a => {
    const matchStatus = filterStatus === "all" || a.status === filterStatus;
    const matchSearch = !search || a.title.toLowerCase().includes(search.toLowerCase()) || a.target_keyword.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  const displayArticles = search || filterStatus !== "all" ? filteredArticles : articles;

  return (
    <div className="p-8 pb-28">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <p className="text-slate-400 text-sm font-medium mb-1">Van Business Academy</p>
          <h1 className="text-3xl font-black text-slate-900">File d&apos;articles</h1>
          <p className="text-slate-500 mt-1">Réorganise, édite et gère les articles en attente de rédaction</p>
        </div>
        <button
          onClick={handleGenerate}
          disabled={generating}
          className="flex-shrink-0 flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {generating ? (
            <>
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Génération...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Générer 50 articles
            </>
          )}
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-200 p-5 animate-pulse">
              <div className="w-8 h-8 bg-slate-100 rounded mb-2" />
              <div className="w-16 h-6 bg-slate-100 rounded mb-1" />
              <div className="w-24 h-3 bg-slate-100 rounded" />
            </div>
          ))
        ) : (
          [
            { label: "Articles VBA", value: stats.vba, icon: "📝", color: "text-slate-900" },
            { label: "En attente", value: stats.pending, icon: "⏳", color: "text-amber-600" },
            { label: "Publiés", value: stats.published, icon: "✅", color: "text-emerald-600" },
            { label: "Total file", value: stats.total, icon: "📚", color: "text-slate-900" },
          ].map((kpi) => (
            <div key={kpi.label} className="bg-white rounded-2xl border border-slate-200 p-5">
              <div className="text-2xl mb-1">{kpi.icon}</div>
              <p className={`text-2xl font-black ${kpi.color}`}>{kpi.value}</p>
              <p className="text-xs text-slate-500 mt-0.5">{kpi.label}</p>
            </div>
          ))
        )}
      </div>

      {/* SSE Logs */}
      {logs.length > 0 && (
        <div className="mb-6 bg-slate-900 rounded-xl p-4 text-xs font-mono max-h-52 overflow-y-auto">
          {logs.map((log, i) => (
            <div key={i} className={`mb-0.5 ${log.level === "error" ? "text-red-400" : log.level === "success" ? "text-emerald-400" : "text-slate-300"}`}>
              <span className="text-slate-500 mr-2">{log.level === "error" ? "✗" : log.level === "success" ? "✓" : "›"}</span>
              {log.message}
            </div>
          ))}
          <div ref={logsEndRef} />
        </div>
      )}

      {/* Generation result */}
      {result && (
        <div className="mb-6 bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center gap-3">
          <span className="text-2xl">✅</span>
          <div>
            <p className="font-semibold text-emerald-800">Génération terminée !</p>
            <p className="text-sm text-emerald-700">
              <strong>{result.inserted}</strong> articles ajoutés
              {result.skipped > 0 && `, ${result.skipped} doublons ignorés`}
            </p>
          </div>
        </div>
      )}

      {/* Article queue table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        {/* Table toolbar */}
        <div className="px-4 py-3 border-b border-slate-100 flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            <input
              type="text"
              placeholder="Rechercher..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Status filters */}
          <div className="flex items-center gap-1">
            {(["all", "pending", "published", "error"] as FilterStatus[]).map(s => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                  filterStatus === s
                    ? "bg-slate-900 text-white"
                    : "text-slate-500 hover:bg-slate-100"
                }`}
              >
                {s === "all" ? `Tous (${articles.length})` :
                 s === "pending" ? `En attente (${articles.filter(a => a.status === "pending").length})` :
                 s === "published" ? `Publiés (${articles.filter(a => a.status === "published").length})` :
                 `Erreurs (${articles.filter(a => a.status === "error").length})`}
              </button>
            ))}
          </div>

          {/* Dirty indicator */}
          {isDirty && (
            <span className="ml-auto text-xs text-amber-600 font-medium flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block" />
              Modifications non enregistrées
            </span>
          )}
        </div>

        {/* Column headers */}
        <div className="hidden md:grid grid-cols-[28px_28px_1fr_120px_80px_100px_80px] gap-3 px-4 py-2 bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-400 uppercase tracking-wide">
          <span />
          <span>#</span>
          <span>Article</span>
          <span>Catégorie</span>
          <span className="text-right">Mots</span>
          <span>Statut</span>
          <span />
        </div>

        {loading ? (
          <div className="divide-y divide-slate-100">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3 animate-pulse">
                <div className="w-4 h-8 bg-slate-100 rounded" />
                <div className="w-6 h-6 bg-slate-100 rounded" />
                <div className="flex-1">
                  <div className="h-4 bg-slate-100 rounded w-3/4 mb-1.5" />
                  <div className="h-3 bg-slate-100 rounded w-1/3" />
                </div>
                <div className="w-24 h-5 bg-slate-100 rounded" />
                <div className="w-16 h-5 bg-slate-100 rounded" />
              </div>
            ))}
          </div>
        ) : (
          <QueueTable
            articles={displayArticles}
            onChange={(updated) => {
              // If we're in filtered mode, merge back into the full list
              if (search || filterStatus !== "all") {
                const updatedIds = new Set(updated.map(a => a.id));
                const unchanged = articles.filter(a => !updatedIds.has(a.id));
                setArticles([...updated, ...unchanged].sort((a, b) => a.priority - b.priority));
              } else {
                setArticles(updated);
              }
            }}
            onDelete={handleDelete}
          />
        )}

        {!loading && articles.length > 0 && (
          <div className="px-4 py-3 border-t border-slate-100 bg-slate-50 text-xs text-slate-400">
            {displayArticles.length} article{displayArticles.length !== 1 ? "s" : ""}
            {(search || filterStatus !== "all") && ` sur ${articles.length}`}
            {" · "}Glisse les lignes pour réorganiser l&apos;ordre
          </div>
        )}
      </div>

      {/* Floating save bar */}
      <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 ${
        isDirty || saveSuccess ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
      }`}>
        <div className="flex items-center gap-3 bg-slate-900 text-white rounded-2xl shadow-2xl px-5 py-3">
          {saveSuccess ? (
            <div className="flex items-center gap-2 text-emerald-400 text-sm font-medium">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
              Modifications enregistrées
            </div>
          ) : (
            <>
              <p className="text-sm text-slate-300">
                {articles.filter((a, i) => JSON.stringify(a) !== JSON.stringify(originalArticles[i])).length} modification
                {articles.filter((a, i) => JSON.stringify(a) !== JSON.stringify(originalArticles[i])).length > 1 ? "s" : ""} en attente
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => { setArticles([...originalArticles]); }}
                  className="px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold bg-white text-slate-900 rounded-lg hover:bg-slate-100 transition-colors disabled:opacity-50"
                >
                  {saving ? (
                    <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  ) : (
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  )}
                  Enregistrer
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
