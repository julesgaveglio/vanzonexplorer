"use client";

import { useState, useEffect, useCallback } from "react";

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

export default function QueueGeneratorClient() {
  const [stats, setStats] = useState<QueueStats>({ total: 0, vba: 0, pending: 0, published: 0 });
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [result, setResult] = useState<{ inserted: number; skipped: number } | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/formation/queue-articles/stats");
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch {
      // silent — stats are optional
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

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
                await fetchStats();
              }
            } catch {
              // skip malformed events
            }
          }
        }
      }
    } catch (err) {
      setLogs(prev => [...prev, { level: "error", message: String(err) }]);
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <p className="text-slate-400 text-sm font-medium mb-1">Van Business Academy</p>
          <h1 className="text-3xl font-black text-slate-900">File d&apos;articles</h1>
          <p className="text-slate-500 mt-1">Génère jusqu&apos;à 50 articles SEO à partir des mots-clés VBA</p>
        </div>
        <button
          onClick={handleGenerate}
          disabled={generating}
          className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {generating ? (
            <>
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Génération en cours...
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
            { label: "Articles en file (VBA)", value: stats.vba, icon: "📝" },
            { label: "En attente", value: stats.pending, icon: "⏳" },
            { label: "Publiés", value: stats.published, icon: "✅" },
            { label: "Total file", value: stats.total, icon: "📚" },
          ].map((kpi) => (
            <div key={kpi.label} className="bg-white rounded-2xl border border-slate-200 p-5">
              <div className="text-2xl mb-1">{kpi.icon}</div>
              <p className="text-2xl font-black text-slate-900">{kpi.value}</p>
              <p className="text-xs text-slate-500 mt-0.5">{kpi.label}</p>
            </div>
          ))
        )}
      </div>

      {/* Résultat */}
      {result && (
        <div className="mb-6 bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center gap-3">
          <span className="text-2xl">✅</span>
          <div>
            <p className="font-semibold text-emerald-800">Génération terminée !</p>
            <p className="text-sm text-emerald-700">
              <strong>{result.inserted}</strong> articles ajoutés à la file
              {result.skipped > 0 && `, ${result.skipped} doublons ignorés`}
            </p>
          </div>
        </div>
      )}

      {/* Logs SSE */}
      {logs.length > 0 && (
        <div className="mb-6 bg-slate-900 rounded-xl p-4 text-xs font-mono max-h-64 overflow-y-auto">
          {logs.map((log, i) => (
            <div
              key={i}
              className={`mb-0.5 ${
                log.level === "error" ? "text-red-400" :
                log.level === "success" ? "text-emerald-400" :
                "text-slate-300"
              }`}
            >
              <span className="text-slate-500 mr-2">
                {log.level === "error" ? "✗" : log.level === "success" ? "✓" : "›"}
              </span>
              {log.message}
            </div>
          ))}
        </div>
      )}

      {/* Explication */}
      {!generating && logs.length === 0 && (
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-5 text-sm text-blue-800">
          <p className="font-semibold mb-2">Comment ça fonctionne</p>
          <ol className="space-y-1 list-decimal list-inside text-blue-700">
            <li>Lit les top 60 mots-clés de la table <strong>vba_keywords</strong> (par score d&apos;opportunité)</li>
            <li>Génère des titres, slugs, excerpts et mots-clés secondaires via Groq</li>
            <li>Déduplique les articles déjà présents dans la file</li>
            <li>Insère les nouveaux articles avec <code>added_by = &apos;vba-keyword-strategy&apos;</code></li>
          </ol>
          <p className="mt-3 text-blue-600 text-xs">
            Prérequis : avoir d&apos;abord lancé la recherche de mots-clés depuis &quot;Mots-Clés VBA&quot;.
          </p>
        </div>
      )}
    </div>
  );
}
