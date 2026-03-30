"use client";

import { useState } from "react";

interface RecentRun {
  id: string;
  agentName: string;
  startedAt: string;
  durationSec: number;
  costEur: number;
  apiCosts: Record<
    string,
    {
      calls?: number;
      searches?: number;
      input_tokens?: number;
      output_tokens?: number;
      cost_eur: number;
    }
  >;
}

interface Props {
  runs: RecentRun[];
}

const AGENT_COLORS: Record<string, { bg: string; text: string }> = {
  "blog-writer":        { bg: "#EEF2FF", text: "#4F46E5" },
  "queue-builder":      { bg: "#D1FAE5", text: "#065F46" },
  "keyword-researcher": { bg: "#FEF3C7", text: "#92400E" },
  "article-optimizer":  { bg: "#FEE2E2", text: "#991B1B" },
};

const DEFAULT_BADGE = { bg: "#F1F5F9", text: "#475569" };

function formatDuration(sec: number): string {
  if (sec >= 60) {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}m ${s}s`;
  }
  return `${sec}s`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function AgentBadge({ name }: { name: string }) {
  const colors = AGENT_COLORS[name] ?? DEFAULT_BADGE;
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold"
      style={{ background: colors.bg, color: colors.text }}
    >
      {name}
    </span>
  );
}

const SERVICES = ["anthropic", "dataforseo", "tavily", "serpapi"] as const;

export default function CostRunsTable({ runs }: Props) {
  const agentNames = Array.from(new Set(runs.map((r) => r.agentName))).sort();
  const [filter, setFilter] = useState<string>("all");

  const filtered = filter === "all" ? runs : runs.filter((r) => r.agentName === filter);

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      {/* Filter bar */}
      <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2 flex-wrap">
        <button
          onClick={() => setFilter("all")}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            filter === "all"
              ? "bg-indigo-50 text-indigo-700"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          Tous les agents
        </button>
        {agentNames.map((name) => (
          <button
            key={name}
            onClick={() => setFilter(name)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filter === name
                ? "bg-indigo-50 text-indigo-700"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {name}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="flex items-center justify-center h-32 text-slate-400 text-sm">
          Aucun run avec des coûts enregistrés
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Date</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Agent</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Durée</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Total €</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Anthropic</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">DataForSEO</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Tavily</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">SerpAPI</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((run) => (
                <tr key={run.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-3 text-slate-600 whitespace-nowrap">{formatDate(run.startedAt)}</td>
                  <td className="px-5 py-3">
                    <AgentBadge name={run.agentName} />
                  </td>
                  <td className="px-5 py-3 text-slate-500">{formatDuration(run.durationSec)}</td>
                  <td className="px-5 py-3 text-right font-semibold text-slate-900">
                    €{run.costEur.toFixed(4)}
                  </td>
                  {SERVICES.map((service) => {
                    const svcData = run.apiCosts[service];
                    return (
                      <td key={service} className="px-5 py-3 text-right text-slate-500">
                        {svcData ? `€${svcData.cost_eur.toFixed(4)}` : "—"}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
