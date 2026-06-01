"use client";

import { useState, useEffect } from "react";
import { useCampaign } from "./CampaignContext";

interface Call {
  email: string;
  firstname: string | null;
  booking_started: string | null;
  booking_confirmed: string | null;
  source: string;
  utm_source: string | null;
  utm_campaign: string | null;
}

interface ClosingSummary {
  id: string;
  name: string;
  summary: string | null;
  is_audio: boolean;
  created_at: string;
}

const PERIODS = [
  { label: "30j", days: 30 },
  { label: "90j", days: 90 },
] as const;

export default function AdsCallsClient() {
  const { buildQS, loading: campLoading } = useCampaign();
  const [calls, setCalls] = useState<Call[]>([]);
  const [period, setPeriod] = useState(90);
  const [loading, setLoading] = useState(true);

  // Closing summaries
  const [closings, setClosings] = useState<ClosingSummary[]>([]);
  const [generating, setGenerating] = useState<string | null>(null);

  const fetchClosings = () => {
    fetch("/api/ads/closing-summary")
      .then((r) => r.json())
      .then((json) => setClosings(json.items ?? []))
      .catch(() => {});
  };

  useEffect(() => { fetchClosings(); }, []);

  const generateSummary = async (id: string) => {
    setGenerating(id);
    try {
      const res = await fetch("/api/ads/closing-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const json = await res.json();
      if (json.error) {
        setClosings((prev) => prev.map((c) => c.id === id ? { ...c, summary: `**Erreur** : ${json.error}` } : c));
      } else {
        setClosings((prev) => prev.map((c) => c.id === id ? { ...c, summary: json.summary } : c));
      }
    } catch {
      setClosings((prev) => prev.map((c) => c.id === id ? { ...c, summary: "**Erreur** : Impossible de générer le résumé." } : c));
    } finally {
      setGenerating(null);
    }
  };

  useEffect(() => {
    if (campLoading) return;
    setLoading(true);
    const qs = buildQS();
    fetch(`/api/ads/calls?${qs}`)
      .then((r) => r.json())
      .then((json) => setCalls(json.calls ?? []))
      .finally(() => setLoading(false));
  }, [period, buildQS, campLoading]);

  const confirmed = calls.filter((c) => c.booking_confirmed);
  const pending = calls.filter((c) => !c.booking_confirmed);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Appels</h1>
          <p className="text-sm text-slate-500 mt-1">
            {confirmed.length} confirmé{confirmed.length > 1 ? "s" : ""} ·{" "}
            {pending.length} en attente
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex bg-white rounded-xl border border-slate-200 p-0.5 shadow-sm">
            {PERIODS.map((p) => (
              <button
                key={p.days}
                onClick={() => setPeriod(p.days)}
                className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all ${
                  period === p.days
                    ? "bg-blue-50 text-blue-600 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <p className="text-xs text-slate-500 uppercase tracking-wider font-medium mb-1">
            Total appels
          </p>
          <p className="text-xl sm:text-2xl font-bold text-slate-900">{calls.length}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <p className="text-xs text-slate-500 uppercase tracking-wider font-medium mb-1">
            Confirmés
          </p>
          <p className="text-xl sm:text-2xl font-bold text-emerald-600">
            {confirmed.length}
          </p>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <p className="text-xs text-slate-500 uppercase tracking-wider font-medium mb-1">
            Taux confirmation
          </p>
          <p className="text-xl sm:text-2xl font-bold text-blue-600">
            {calls.length > 0
              ? Math.round((confirmed.length / calls.length) * 100)
              : 0}
            %
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <svg
              className="animate-spin h-6 w-6 text-blue-500"
              viewBox="0 0 24 24"
            >
              <circle
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="3"
                fill="none"
                strokeDasharray="30 70"
              />
            </svg>
          </div>
        ) : calls.length === 0 ? (
          <div className="text-center py-20 text-slate-400 text-sm">
            Aucun appel sur la période
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="text-left text-xs text-slate-500 uppercase tracking-wider px-4 py-3 font-medium">
                    Prénom
                  </th>
                  <th className="text-left text-xs text-slate-500 uppercase tracking-wider px-4 py-3 font-medium">
                    Email
                  </th>
                  <th className="text-left text-xs text-slate-500 uppercase tracking-wider px-4 py-3 font-medium">
                    Statut
                  </th>
                  <th className="text-left text-xs text-slate-500 uppercase tracking-wider px-4 py-3 font-medium hidden sm:table-cell">
                    Source
                  </th>
                  <th className="text-left text-xs text-slate-500 uppercase tracking-wider px-4 py-3 font-medium">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody>
                {calls.map((call, i) => {
                  const date = call.booking_confirmed ?? call.booking_started;
                  const isConfirmed = !!call.booking_confirmed;

                  return (
                    <tr
                      key={i}
                      className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors"
                    >
                      <td className="px-4 py-3 text-slate-900 font-medium">
                        {call.firstname ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-slate-600 text-xs">
                        {call.email}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${
                            isConfirmed
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                              : "bg-amber-50 text-amber-700 border border-amber-100"
                          }`}
                        >
                          {isConfirmed ? "Confirmé" : "Calendly ouvert"}
                        </span>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <span
                          className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${
                            call.source.startsWith("email")
                              ? "bg-purple-50 text-purple-700 border border-purple-100"
                              : call.source.includes("facebook") || call.source.includes("fb")
                                ? "bg-blue-50 text-blue-700 border border-blue-100"
                                : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {call.source}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-400 text-xs">
                        {date
                          ? new Date(date).toLocaleDateString("fr-FR", {
                              day: "numeric",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Closing Summaries ── */}
      {closings.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-slate-900">Résumés closing</h2>

          {closings.map((c) => (
            <div key={c.id} className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="p-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-lg">{c.is_audio ? "🎙️" : "📝"}</span>
                  <div>
                    <p className="font-medium text-slate-900">{c.name}</p>
                    <p className="text-xs text-slate-400">
                      {new Date(c.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}
                      {c.summary ? " · Analyse disponible" : " · Non analysé"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => generateSummary(c.id)}
                  disabled={generating === c.id}
                  className="px-4 py-2 text-sm font-semibold rounded-xl transition-all disabled:opacity-50 whitespace-nowrap"
                  style={{
                    background: c.summary ? "rgba(16,185,129,0.08)" : "rgba(59,130,246,0.08)",
                    color: c.summary ? "#10B981" : "#3B82F6",
                    border: c.summary ? "1px solid rgba(16,185,129,0.2)" : "1px solid rgba(59,130,246,0.2)",
                  }}
                >
                  {generating === c.id ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none" strokeDasharray="30 70" />
                      </svg>
                      Analyse...
                    </span>
                  ) : c.summary ? (
                    "Regénérer"
                  ) : (
                    "Analyser"
                  )}
                </button>
              </div>

              {c.summary && (
                <div className="border-t border-slate-100 p-5">
                  <div
                    className="prose prose-sm prose-slate max-w-none
                      [&_h2]:text-base [&_h2]:font-bold [&_h2]:text-slate-900 [&_h2]:mt-5 [&_h2]:mb-2 [&_h2]:first:mt-0
                      [&_strong]:text-slate-800
                      [&_li]:text-slate-600 [&_li]:leading-relaxed
                      [&_ul]:space-y-1"
                    dangerouslySetInnerHTML={{
                      __html: c.summary
                        .replace(/^## (.+)$/gm, '<h2>$1</h2>')
                        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
                        .replace(/^- (.+)$/gm, '<li>$1</li>')
                        .replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>')
                        .replace(/\n{2,}/g, '<br/>')
                        .replace(/「(.+?)」|"(.+?)"/g, '<em class="text-amber-700 not-italic">"$1$2"</em>'),
                    }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
