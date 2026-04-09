"use client";

import { useState, useEffect, useCallback } from "react";
import CompetitorTable from "./CompetitorTable";

interface Competitor {
  id: string;
  domain: string;
  name: string;
  description: string | null;
  strengths: string | null;
  weaknesses: string | null;
  pricing: string | null;
  offerings: string | null;
  traffic_estimate: number;
  domain_authority: number;
  last_analyzed: string | null;
}

interface LogEntry {
  level: "info" | "success" | "error";
  message: string;
}

export default function CompetitorsClient() {
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);

  const fetchCompetitors = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/formation/competitors");
      const data = await res.json();
      setCompetitors(data.competitors ?? []);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCompetitors();
  }, [fetchCompetitors]);

  async function handleAnalyze() {
    setAnalyzing(true);
    setLogs([]);

    try {
      const response = await fetch("/api/admin/formation/competitors", { method: "POST" });
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
                await fetchCompetitors();
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
      setAnalyzing(false);
    }
  }

  const avgAuthority = competitors.length
    ? Math.round(competitors.reduce((s, c) => s + (c.domain_authority ?? 0), 0) / competitors.length)
    : 0;
  const totalTraffic = competitors.reduce((s, c) => s + (c.traffic_estimate ?? 0), 0);
  const withStrengths = competitors.filter(c => c.strengths).length;

  return (
    <div className="p-4 md:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <p className="text-slate-400 text-sm font-medium mb-1">Van Business Academy</p>
          <h1 className="text-3xl font-black text-slate-900">Veille Concurrents</h1>
          <p className="text-slate-500 mt-1">Analyse des acteurs du marché formation van en France</p>
        </div>
        <button
          onClick={handleAnalyze}
          disabled={analyzing}
          className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {analyzing ? (
            <>
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Analyse en cours...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Lancer l&apos;analyse
            </>
          )}
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Concurrents", value: competitors.length, icon: "👥" },
          { label: "Autorité moy.", value: avgAuthority, icon: "⚡" },
          { label: "Trafic cumulé", value: totalTraffic.toLocaleString("fr-FR"), icon: "📈" },
          { label: "Profils analysés", value: withStrengths, icon: "🔍" },
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

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center h-32 text-slate-400">Chargement...</div>
      ) : competitors.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-32 text-slate-400 gap-2">
          <p>Aucun concurrent analysé</p>
          <p className="text-sm">Clique sur &quot;Lancer l&apos;analyse&quot; pour démarrer</p>
        </div>
      ) : (
        <CompetitorTable competitors={competitors} />
      )}
    </div>
  );
}
