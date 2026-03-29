"use client";

import { useState, useRef } from "react";

interface LogEntry {
  level: "info" | "success" | "warning" | "error";
  message: string;
}

interface ResearchResult {
  boardsFetched: number;
  keywordsAnalyzed: number;
  boardRecommendations: number;
  contentQueueItems: number;
  summary: string;
}

export default function PinterestResearchButton() {
  const [running, setRunning] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [result, setResult] = useState<ResearchResult | null>(null);
  const logsEndRef = useRef<HTMLDivElement>(null);

  const levelStyles: Record<string, string> = {
    info: "text-slate-600",
    success: "text-emerald-600 font-medium",
    warning: "text-amber-600",
    error: "text-red-600 font-medium",
  };

  const levelIcon: Record<string, string> = {
    info: "ℹ️",
    success: "✅",
    warning: "⚠️",
    error: "❌",
  };

  async function launch() {
    setRunning(true);
    setLogs([]);
    setResult(null);

    try {
      const resp = await fetch("/api/admin/pinterest/research", { method: "POST" });
      if (!resp.body) throw new Error("Pas de stream");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith("data:")) continue;
          try {
            const data = JSON.parse(trimmed.slice(5).trim());

            if (data.type === "log") {
              setLogs((prev) => [...prev, { level: data.level, message: data.message }]);
              setTimeout(() => logsEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
            } else if (data.type === "result") {
              setResult(data.data);
            }
          } catch {
            // ignore parse errors
          }
        }
      }
    } catch (err) {
      setLogs((prev) => [
        ...prev,
        { level: "error", message: `Erreur: ${err instanceof Error ? err.message : String(err)}` },
      ]);
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="space-y-4">
      <button
        onClick={launch}
        disabled={running}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-red-600 text-white hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
      >
        {running ? (
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
            Lancer la recherche Pinterest
          </>
        )}
      </button>

      {logs.length > 0 && (
        <div className="bg-slate-900 rounded-lg p-4 max-h-64 overflow-y-auto font-mono text-xs space-y-1">
          {logs.map((log, i) => (
            <div key={i} className={levelStyles[log.level] ?? "text-slate-400"}>
              <span className="mr-2">{levelIcon[log.level] ?? "•"}</span>
              {log.message}
            </div>
          ))}
          <div ref={logsEndRef} />
        </div>
      )}

      {result && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
          {[
            { label: "Boards", value: result.boardsFetched },
            { label: "Keywords", value: result.keywordsAnalyzed },
            { label: "Recommandations", value: result.boardRecommendations },
            { label: "Pins en queue", value: result.contentQueueItems },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="text-2xl font-bold text-emerald-700">{stat.value}</p>
              <p className="text-xs text-emerald-600">{stat.label}</p>
            </div>
          ))}
          {result.summary && (
            <div className="col-span-full text-sm text-emerald-700 italic border-t border-emerald-200 pt-3 mt-1">
              {result.summary}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
