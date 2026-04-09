"use client";

import { useState, useRef } from "react";

interface CmoAction {
  id: string;
  title: string;
  channel: string;
  ice_score: number;
  effort: "low" | "medium" | "high";
  status: "todo" | "in_progress" | "done";
  notes?: string;
  created_at: string;
}

interface CmoReport {
  id: string;
  type: "weekly" | "monthly" | "adhoc";
  period_label: string;
  health_score?: number;
  content: Record<string, unknown>;
  created_at: string;
}

const CHANNEL_LABELS: Record<string, string> = {
  acquisition: "Acquisition",
  content: "Contenu",
  retention: "Rétention",
  reputation: "Réputation",
  intelligence: "Intelligence",
};

const EFFORT_COLORS: Record<string, string> = {
  low: "bg-green-100 text-green-700",
  medium: "bg-yellow-100 text-yellow-700",
  high: "bg-red-100 text-red-700",
};

interface Props {
  latestReport: CmoReport | null;
  topActions: CmoAction[];
  allReports: CmoReport[];
  allActions: CmoAction[];
}

export default function MarketingClient({ latestReport, topActions, allReports, allActions }: Props) {
  const [activeTab, setActiveTab] = useState<"overview" | "reports" | "actions" | "analyze">("overview");
  const [actions, setActions] = useState<CmoAction[]>(allActions);
  const [actionFilter, setActionFilter] = useState<"todo" | "in_progress" | "done">("todo");
  const [question, setQuestion] = useState("");
  const [streamText, setStreamText] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [isRunning, setIsRunning] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  async function updateActionStatus(id: string, status: CmoAction["status"]) {
    await fetch(`/api/admin/cmo/actions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setActions((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)));
  }

  async function runAnalysis(type: "weekly" | "monthly") {
    setIsRunning(type);
    try {
      const res = await fetch("/api/admin/cmo/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, trigger: true }),
      });
      if (res.ok) window.location.reload();
    } finally {
      setIsRunning(null);
    }
  }

  async function askCmo() {
    if (!question.trim() || isStreaming) return;
    setStreamText("");
    setIsStreaming(true);
    abortRef.current = new AbortController();

    try {
      const res = await fetch("/api/admin/cmo/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
        signal: abortRef.current.signal,
      });

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) return;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        const lines = chunk.split("\n").filter((l) => l.startsWith("data: "));
        for (const line of lines) {
          try {
            const data = JSON.parse(line.slice(6)) as { type: string; text?: string };
            if (data.type === "delta" && data.text) {
              setStreamText((prev) => prev + data.text);
            }
          } catch {
            // ignore parse errors on incomplete chunks
          }
        }
      }
    } catch {
      // ignore abort errors
    } finally {
      setIsStreaming(false);
    }
  }

  const filteredActions = actions.filter((a) => a.status === actionFilter);
  const healthScore = latestReport?.health_score;

  const TAB_LABELS = {
    overview: "Vue d'ensemble",
    reports: "Rapports",
    actions: "Actions",
    analyze: "Analyser",
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Marketing CMO</h1>
          <p className="text-sm text-slate-500 mt-0.5">Directeur marketing 360° — Vanzon Explorer</p>
        </div>
        {healthScore != null && (
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-4 py-2.5 shadow-sm">
            <span className="text-3xl font-bold text-blue-600">{healthScore}</span>
            <div>
              <p className="text-xs font-semibold text-slate-700">Score santé</p>
              <p className="text-xs text-slate-400">/100</p>
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl mb-6">
        {(["overview", "reports", "actions", "analyze"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
              activeTab === tab
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {TAB_LABELS[tab]}
          </button>
        ))}
      </div>

      {/* Overview */}
      {activeTab === "overview" && (
        <div className="space-y-4">
          {latestReport ? (
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-semibold text-slate-800">Dernier rapport</h2>
                <span className="text-xs text-slate-400">
                  {latestReport.period_label} —{" "}
                  {latestReport.type === "weekly"
                    ? "Hebdo"
                    : latestReport.type === "monthly"
                    ? "Mensuel"
                    : "Ad hoc"}
                </span>
              </div>
              {typeof latestReport.content.summary === "string" && (
                <p className="text-sm text-slate-600">{latestReport.content.summary}</p>
              )}
            </div>
          ) : (
            <div className="bg-slate-50 border border-dashed border-slate-200 rounded-xl p-8 text-center">
              <p className="text-slate-500 text-sm">Aucun rapport disponible.</p>
              <p className="text-slate-400 text-xs mt-1">
                Lancez une analyse depuis l&apos;onglet &quot;Analyser&quot;.
              </p>
            </div>
          )}

          {topActions.length > 0 && (
            <div>
              <h2 className="font-semibold text-slate-800 mb-2">Priorités cette semaine</h2>
              <div className="space-y-2">
                {topActions.map((action) => (
                  <div
                    key={action.id}
                    className="bg-white border border-slate-200 rounded-lg p-3.5 flex items-center gap-3 shadow-sm"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">{action.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-slate-400">
                          {CHANNEL_LABELS[action.channel] ?? action.channel}
                        </span>
                        <span className="text-xs font-bold text-blue-600">ICE {action.ice_score}</span>
                        <span
                          className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${EFFORT_COLORS[action.effort] ?? ""}`}
                        >
                          {action.effort}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => updateActionStatus(action.id, "done")}
                      className="shrink-0 px-3 py-1.5 text-xs font-medium bg-slate-100 hover:bg-green-50 hover:text-green-700 rounded-lg transition-colors"
                    >
                      Fait ✓
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Reports */}
      {activeTab === "reports" && (
        <div className="space-y-3">
          {allReports.length === 0 ? (
            <p className="text-slate-500 text-sm text-center py-8">Aucun rapport.</p>
          ) : (
            allReports.map((report) => (
              <div key={report.id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-slate-800 text-sm">{report.period_label}</span>
                  <div className="flex items-center gap-2">
                    {report.health_score != null && (
                      <span className="text-xs font-bold text-blue-600">{report.health_score}/100</span>
                    )}
                    <span className="text-xs text-slate-400">
                      {report.type === "weekly"
                        ? "Hebdo"
                        : report.type === "monthly"
                        ? "Mensuel"
                        : "Ad hoc"}
                    </span>
                  </div>
                </div>
                {typeof report.content.summary === "string" && (
                  <p className="text-xs text-slate-600">{report.content.summary}</p>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Actions */}
      {activeTab === "actions" && (
        <div>
          <div className="flex gap-1 mb-4">
            {(["todo", "in_progress", "done"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setActionFilter(s)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                  actionFilter === s
                    ? "bg-blue-100 text-blue-700"
                    : "bg-slate-100 text-slate-500 hover:text-slate-700"
                }`}
              >
                {{ todo: "À faire", in_progress: "En cours", done: "Fait" }[s]} (
                {actions.filter((a) => a.status === s).length})
              </button>
            ))}
          </div>

          {filteredActions.length === 0 ? (
            <p className="text-slate-400 text-sm text-center py-8">Aucune action.</p>
          ) : (
            <div className="space-y-2">
              {filteredActions
                .sort((a, b) => (b.ice_score ?? 0) - (a.ice_score ?? 0))
                .map((action) => (
                  <div
                    key={action.id}
                    className="bg-white border border-slate-200 rounded-lg p-3.5 flex items-center gap-3 shadow-sm"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800">{action.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-slate-400">
                          {CHANNEL_LABELS[action.channel] ?? action.channel}
                        </span>
                        <span className="text-xs font-bold text-blue-600">ICE {action.ice_score}</span>
                        <span
                          className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${EFFORT_COLORS[action.effort] ?? ""}`}
                        >
                          {action.effort}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-1.5 shrink-0">
                      {action.status === "todo" && (
                        <button
                          onClick={() => updateActionStatus(action.id, "in_progress")}
                          className="px-2.5 py-1.5 text-xs font-medium bg-yellow-50 text-yellow-700 hover:bg-yellow-100 rounded-lg transition-colors"
                        >
                          En cours
                        </button>
                      )}
                      {action.status !== "done" && (
                        <button
                          onClick={() => updateActionStatus(action.id, "done")}
                          className="px-2.5 py-1.5 text-xs font-medium bg-green-50 text-green-700 hover:bg-green-100 rounded-lg transition-colors"
                        >
                          Fait ✓
                        </button>
                      )}
                      {action.status === "done" && (
                        <button
                          onClick={() => updateActionStatus(action.id, "todo")}
                          className="px-2.5 py-1.5 text-xs font-medium bg-slate-50 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                          Rouvrir
                        </button>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}

      {/* Analyze */}
      {activeTab === "analyze" && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={() => runAnalysis("weekly")}
              disabled={isRunning !== null}
              className="p-4 bg-white border border-slate-200 rounded-xl text-left hover:border-blue-200 hover:bg-blue-50/30 transition-colors disabled:opacity-50 shadow-sm"
            >
              <p className="font-semibold text-slate-800 text-sm">Rapport hebdo</p>
              <p className="text-xs text-slate-400 mt-0.5">Scan rapide — 3 actions prioritaires</p>
              {isRunning === "weekly" && (
                <p className="text-xs text-blue-600 mt-1 font-medium">Génération en cours...</p>
              )}
            </button>
            <button
              onClick={() => runAnalysis("monthly")}
              disabled={isRunning !== null}
              className="p-4 bg-white border border-slate-200 rounded-xl text-left hover:border-blue-200 hover:bg-blue-50/30 transition-colors disabled:opacity-50 shadow-sm"
            >
              <p className="font-semibold text-slate-800 text-sm">Audit mensuel</p>
              <p className="text-xs text-slate-400 mt-0.5">360° complet — 10-15 actions ICE-scorées</p>
              {isRunning === "monthly" && (
                <p className="text-xs text-blue-600 mt-1 font-medium">Génération en cours...</p>
              )}
            </button>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
            <h3 className="font-semibold text-slate-800 text-sm mb-3">Question libre au CMO</h3>
            <div className="flex gap-2">
              <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && askCmo()}
                placeholder="Ex: comment développer le Club ?"
                className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300"
                disabled={isStreaming}
              />
              <button
                onClick={askCmo}
                disabled={isStreaming || !question.trim()}
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {isStreaming ? "..." : "Analyser"}
              </button>
            </div>

            {streamText && (
              <div className="mt-4 p-3 bg-slate-50 rounded-lg text-sm text-slate-700 whitespace-pre-wrap leading-relaxed max-h-[400px] overflow-y-auto">
                {streamText}
                {isStreaming && (
                  <span className="inline-block w-1.5 h-4 bg-blue-500 animate-pulse ml-0.5 align-middle" />
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
