"use client";

import { useState } from "react";

export interface ToolCost {
  name: string;
  costEur: number;
  detail?: string;
}

export interface UnifiedEntry {
  id: string;
  date: string;
  type: "agent" | "road_trip" | "dataforseo";
  label: string;
  costEur: number;
  durationSec: number;
  tools: ToolCost[];
}

const TOOL_CONFIG: Record<string, { bg: string; text: string; dot: string }> = {
  Anthropic:  { bg: "#EEF2FF", text: "#4F46E5", dot: "#6366F1" },
  Gemini:     { bg: "#FFF7ED", text: "#C2410C", dot: "#F97316" },
  Groq:       { bg: "#F0FDF4", text: "#166534", dot: "#22C55E" },
  DataForSEO: { bg: "#FEF3C7", text: "#92400E", dot: "#F59E0B" },
  Tavily:     { bg: "#FAF5FF", text: "#6B21A8", dot: "#A855F7" },
  SerpAPI:    { bg: "#FFF1F2", text: "#9F1239", dot: "#F43F5E" },
};

const DEFAULT_TOOL = { bg: "#F1F5F9", text: "#475569", dot: "#94A3B8" };

const TYPE_CONFIG: Record<string, { bg: string; text: string; active: string; label: string }> = {
  agent:      { bg: "#EEF2FF", text: "#4F46E5", active: "#4F46E5", label: "Agent" },
  road_trip:  { bg: "#D1FAE5", text: "#065F46", active: "#059669", label: "Road Trip" },
  dataforseo: { bg: "#FEF3C7", text: "#92400E", active: "#F59E0B", label: "DataForSEO" },
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
}

function formatCost(v: number) {
  if (v === 0) return "€0";
  if (v < 0.0001) return `€${v.toFixed(6)}`;
  if (v < 0.01) return `€${v.toFixed(4)}`;
  return `€${v.toFixed(4)}`;
}

function formatDuration(sec: number) {
  if (!sec) return null;
  if (sec >= 60) return `${Math.floor(sec / 60)}m ${sec % 60}s`;
  return `${sec}s`;
}

interface Props {
  entries: UnifiedEntry[];
}

export default function UnifiedCostTable({ entries }: Props) {
  const [typeFilter, setTypeFilter] = useState("all");
  const [toolFilter, setToolFilter] = useState("all");
  const [search, setSearch] = useState("");

  const allTools = Array.from(
    new Set(entries.flatMap((e) => e.tools.map((t) => t.name)))
  ).sort();

  let filtered = entries;
  if (typeFilter !== "all") filtered = filtered.filter((e) => e.type === typeFilter);
  if (toolFilter !== "all") filtered = filtered.filter((e) => e.tools.some((t) => t.name === toolFilter));
  if (search.trim()) {
    const q = search.toLowerCase();
    filtered = filtered.filter((e) => e.label.toLowerCase().includes(q));
  }

  const totalFiltered = filtered.reduce((s, e) => s + e.costEur, 0);

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      {/* Filters */}
      <div className="px-5 py-4 border-b border-slate-100 space-y-3">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setTypeFilter("all")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              typeFilter === "all"
                ? "bg-slate-900 text-white"
                : "bg-slate-100 text-slate-500 hover:bg-slate-200"
            }`}
          >
            Tout
          </button>
          {(["agent", "road_trip", "dataforseo"] as const).map((t) => {
            const cfg = TYPE_CONFIG[t];
            const isActive = typeFilter === t;
            return (
              <button
                key={t}
                onClick={() => setTypeFilter(isActive ? "all" : t)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                style={
                  isActive
                    ? { background: cfg.active, color: "white" }
                    : { background: cfg.bg, color: cfg.text }
                }
              >
                {cfg.label}s
              </button>
            );
          })}

          <div className="w-px h-5 bg-slate-200 mx-1" />

          {allTools.map((tool) => {
            const cfg = TOOL_CONFIG[tool] ?? DEFAULT_TOOL;
            const isActive = toolFilter === tool;
            return (
              <button
                key={tool}
                onClick={() => setToolFilter(isActive ? "all" : tool)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                style={
                  isActive
                    ? { background: cfg.dot, color: "white" }
                    : { background: cfg.bg, color: cfg.text }
                }
              >
                {tool}
              </button>
            );
          })}

          <div className="flex-1" />
          <input
            type="text"
            placeholder="Rechercher…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="text-sm px-3 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:border-indigo-300 w-44"
          />
        </div>

        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>
            {filtered.length} entrée{filtered.length !== 1 ? "s" : ""}
          </span>
          <span className="font-semibold text-slate-700">{formatCost(totalFiltered)} affiché</span>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="flex items-center justify-center h-32 text-slate-400 text-sm">
          Aucune dépense pour ces filtres
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Date
                </th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Type
                </th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Opération
                </th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider hidden md:table-cell">
                  Outils utilisés
                </th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Coût
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((entry) => {
                const typeCfg = TYPE_CONFIG[entry.type] ?? TYPE_CONFIG.agent;
                const dur = formatDuration(entry.durationSec);
                return (
                  <tr
                    key={entry.id}
                    className="border-b border-slate-50 hover:bg-slate-50/70 transition-colors"
                  >
                    <td className="px-5 py-3 text-slate-500 whitespace-nowrap text-xs">
                      {formatDate(entry.date)}
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold"
                        style={{ background: typeCfg.bg, color: typeCfg.text }}
                      >
                        {typeCfg.label}
                      </span>
                    </td>
                    <td className="px-5 py-3 max-w-xs">
                      <span className="font-medium text-slate-800">{entry.label}</span>
                      {dur && (
                        <span className="ml-2 text-xs text-slate-400">{dur}</span>
                      )}
                    </td>
                    <td className="px-5 py-3 hidden md:table-cell">
                      <div className="flex items-center gap-1 flex-wrap">
                        {entry.tools.map((tool) => {
                          const cfg = TOOL_CONFIG[tool.name] ?? DEFAULT_TOOL;
                          return (
                            <span
                              key={tool.name}
                              title={tool.detail}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
                              style={{ background: cfg.bg, color: cfg.text }}
                            >
                              <span
                                className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                                style={{ background: cfg.dot }}
                              />
                              {tool.name}
                              {tool.costEur > 0 && (
                                <span className="opacity-60 ml-0.5">
                                  {formatCost(tool.costEur)}
                                </span>
                              )}
                            </span>
                          );
                        })}
                      </div>
                    </td>
                    <td className="px-5 py-3 text-right font-bold text-slate-900 whitespace-nowrap">
                      {formatCost(entry.costEur)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-slate-200 bg-slate-50">
                <td
                  colSpan={4}
                  className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider"
                >
                  Total ({filtered.length} entrée{filtered.length !== 1 ? "s" : ""})
                </td>
                <td className="px-5 py-3 text-right font-black text-slate-900">
                  {formatCost(totalFiltered)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}
