"use client";
import { useEffect, useState } from "react";
import { getScoreColor } from "../_lib/score";

interface HistoryItem {
  id: string;
  url: string;
  label: string | null;
  score_global: number | null;
  created_at: string;
}

// Display-only component — shows history, no report reload
export default function ReportHistory() {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/seo-report/save")
      .then((r) => r.json())
      .then((data) => { setHistory(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-sm text-slate-400">Chargement de l&apos;historique…</div>;
  if (history.length === 0) return <div className="text-sm text-slate-400">Aucun rapport sauvegardé.</div>;

  return (
    <div>
      <h3 className="text-sm font-semibold text-slate-600 mb-3">Rapports précédents</h3>
      <div className="space-y-2">
        {history.map((item) => (
          <div key={item.id} className="flex items-center gap-3 p-3 rounded-lg border border-slate-100 hover:border-slate-200 bg-white transition-colors">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-700 truncate">{item.label ?? item.url}</p>
              {item.label && <p className="text-xs text-slate-400 truncate">{item.url}</p>}
              <p className="text-xs text-slate-400">
                {new Date(item.created_at).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })}
              </p>
            </div>
            {item.score_global !== null && (
              <div className="text-xl font-bold" style={{ color: getScoreColor(item.score_global) }}>
                {Math.round(item.score_global)}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
