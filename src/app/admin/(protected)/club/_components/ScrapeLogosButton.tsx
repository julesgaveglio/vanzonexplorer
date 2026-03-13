"use client";

import { useState } from "react";

export default function ScrapeLogosButton() {
  const [running, setRunning] = useState(false);
  const [logs, setLogs] = useState<Array<{ level: string; message: string }>>([]);
  const [done, setDone] = useState<{ updated: number; total: number } | null>(null);

  async function run() {
    setRunning(true);
    setLogs([]);
    setDone(null);

    const res = await fetch("/api/admin/club/scrape-logos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });

    if (!res.body) { setRunning(false); return; }
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done: streamDone, value } = await reader.read();
      if (streamDone) break;
      buffer += decoder.decode(value, { stream: true });
      const parts = buffer.split("\n\n");
      buffer = parts.pop() || "";
      for (const part of parts) {
        const line = part.replace(/^data: /, "").trim();
        if (!line) continue;
        try {
          const event = JSON.parse(line);
          if (event.type === "log") setLogs(prev => [...prev, { level: event.level, message: event.message }]);
          if (event.type === "done") setDone({ updated: event.updated, total: event.total });
          if (event.type === "error") setLogs(prev => [...prev, { level: "error", message: `❌ ${event.message}` }]);
        } catch { /* ignore */ }
      }
    }
    setRunning(false);
  }

  const levelColor: Record<string, string> = {
    success: "text-emerald-600",
    warning: "text-amber-500",
    error: "text-red-500",
    info: "text-slate-600",
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
          <h2 className="font-bold text-slate-900">Logos marques partenaires</h2>
        </div>
        <button
          onClick={run}
          disabled={running}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-50"
          style={{ background: "linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)", boxShadow: "0 4px 14px rgba(59,130,246,0.35)" }}
        >
          {running ? (
            <>
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              En cours...
            </>
          ) : "🔍 Scraper les logos"}
        </button>
      </div>

      {(logs.length > 0 || done) && (
        <div className="px-6 py-4 max-h-64 overflow-y-auto font-mono text-xs space-y-0.5">
          {logs.map((log, i) => (
            <p key={i} className={levelColor[log.level] || "text-slate-500"}>{log.message}</p>
          ))}
          {done && (
            <p className="mt-2 font-bold text-emerald-600">
              ✅ Terminé — {done.updated}/{done.total} logo(s) mis à jour. Rechargez la page.
            </p>
          )}
        </div>
      )}

      {!running && logs.length === 0 && (
        <p className="px-6 py-5 text-sm text-slate-400">
          Lance le scraping pour récupérer et uploader automatiquement les logos de toutes les marques actives.
        </p>
      )}
    </div>
  );
}
