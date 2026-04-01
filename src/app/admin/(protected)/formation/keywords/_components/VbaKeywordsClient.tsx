"use client";

import { useState, useEffect, useCallback } from "react";
import KeywordTable from "./KeywordTable";

interface VbaKeyword {
  id: string;
  keyword: string;
  search_volume: number;
  keyword_difficulty: number | null;
  cpc: number;
  intent: string | null;
  topic_cluster: string | null;
  opportunity_score: number | null;
  competition_level: string | null;
}

interface LogEntry {
  level: "info" | "success" | "error";
  message: string;
}

const CLUSTERS = ["Tous", "Formation Van", "Business Van", "Aménagement Van", "Achat Van", "Location Van", "Réglementation", "Vanlife", "Général"];

export default function VbaKeywordsClient() {
  const [keywords, setKeywords] = useState<VbaKeyword[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [activeCluster, setActiveCluster] = useState("Tous");

  const fetchKeywords = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/formation/keywords");
      const data = await res.json();
      setKeywords(data.keywords ?? []);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchKeywords();
  }, [fetchKeywords]);

  async function handleSearch() {
    setSearching(true);
    setLogs([]);

    try {
      const response = await fetch("/api/admin/formation/keywords", { method: "POST" });
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
                await fetchKeywords();
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
      setSearching(false);
    }
  }

  const filteredKeywords = activeCluster === "Tous"
    ? keywords
    : keywords.filter(k => k.topic_cluster === activeCluster);

  const totalVolume = keywords.reduce((s, k) => s + (k.search_volume ?? 0), 0);
  const quickWins = keywords.filter(k => (k.keyword_difficulty ?? 100) < 30 && (k.search_volume ?? 0) > 20).length;
  const clusters = new Set(keywords.map(k => k.topic_cluster).filter(Boolean)).size;

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <p className="text-slate-400 text-sm font-medium mb-1">Van Business Academy</p>
          <h1 className="text-3xl font-black text-slate-900">Mots-Clés VBA</h1>
          <p className="text-slate-500 mt-1">Stratégie SEO formation van · business · achat-revente</p>
        </div>
        <button
          onClick={handleSearch}
          disabled={searching}
          className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {searching ? (
            <>
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Recherche en cours...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Rechercher les mots-clés
            </>
          )}
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total mots-clés", value: keywords.length, icon: "🔑" },
          { label: "Volume cumulé", value: totalVolume.toLocaleString("fr-FR"), icon: "📊" },
          { label: "Quick Wins", value: quickWins, icon: "⚡" },
          { label: "Clusters couverts", value: clusters, icon: "🗂️" },
        ].map((kpi) => (
          <div key={kpi.label} className="bg-white rounded-2xl border border-slate-200 p-5">
            <div className="text-2xl mb-1">{kpi.icon}</div>
            <p className="text-2xl font-black text-slate-900">{kpi.value}</p>
            <p className="text-xs text-slate-500 mt-0.5">{kpi.label}</p>
          </div>
        ))}
      </div>

      {/* Logs SSE */}
      {logs.length > 0 && (
        <div className="mb-6 bg-slate-900 rounded-xl p-4 text-xs font-mono max-h-48 overflow-y-auto">
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

      {/* Filtres par cluster */}
      {keywords.length > 0 && (
        <div className="flex gap-2 flex-wrap mb-4">
          {CLUSTERS.filter(c => c === "Tous" || keywords.some(k => k.topic_cluster === c)).map((cluster) => (
            <button
              key={cluster}
              onClick={() => setActiveCluster(cluster)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                activeCluster === cluster
                  ? "bg-blue-600 text-white"
                  : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              {cluster}
              {cluster !== "Tous" && (
                <span className="ml-1.5 opacity-60">
                  {keywords.filter(k => k.topic_cluster === cluster).length}
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center h-32 text-slate-400">Chargement...</div>
      ) : keywords.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-32 text-slate-400 gap-2">
          <p>Aucun mot-clé VBA</p>
          <p className="text-sm">Clique sur &quot;Rechercher les mots-clés&quot; pour démarrer</p>
        </div>
      ) : (
        <KeywordTable keywords={filteredKeywords} />
      )}
    </div>
  );
}
