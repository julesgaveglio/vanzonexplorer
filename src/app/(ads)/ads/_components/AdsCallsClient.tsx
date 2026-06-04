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

interface TranscriptSegment {
  speaker: string;
  text: string;
  status: "good" | "bad" | "neutral";
  comment?: string;
  suggestion?: string;
}

interface StructuredAnalysis {
  prospect: {
    name: string;
    age: string | null;
    location: string | null;
    situation: string;
    need: string;
    budget: string;
    objections: string[];
    buying_signals: string[];
  };
  score: number;
  score_rationale: string;
  strengths: string[];
  weaknesses: string[];
  improvements: string[];
  next_steps: string[];
  annotated_transcript: TranscriptSegment[];
}

interface ClosingSummary {
  id: string;
  name: string;
  summary: string | null;
  structured_analysis: StructuredAnalysis | null;
  is_audio: boolean;
  created_at: string;
}

const PERIODS = [
  { label: "30j", days: 30 },
  { label: "90j", days: 90 },
] as const;

// ── Score helpers ──

function scoreColor(score: number) {
  if (score <= 3) return { bg: "bg-red-500", text: "text-red-600", ring: "ring-red-200", light: "bg-red-50" };
  if (score <= 6) return { bg: "bg-amber-500", text: "text-amber-600", ring: "ring-amber-200", light: "bg-amber-50" };
  return { bg: "bg-emerald-500", text: "text-emerald-600", ring: "ring-emerald-200", light: "bg-emerald-50" };
}

// ── Sub-components for structured analysis ──

function ScoreBadge({ score }: { score: number }) {
  const c = scoreColor(score);
  return (
    <div className={`flex items-center justify-center w-10 h-10 rounded-full ${c.bg} text-white font-bold text-lg ring-4 ${c.ring}`}>
      {score}
    </div>
  );
}

function ProspectSection({ prospect }: { prospect: StructuredAnalysis["prospect"] }) {
  return (
    <div className="space-y-4">
      <h4 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">Profil prospect</h4>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <InfoCell label="Nom" value={prospect.name} />
        <InfoCell label="Âge" value={prospect.age ?? "Non mentionné"} />
        <InfoCell label="Localisation" value={prospect.location ?? "Non mentionné"} />
        <InfoCell label="Situation" value={prospect.situation} />
      </div>
      <div className="bg-slate-50 rounded-xl p-4 space-y-3">
        <div>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Besoin</p>
          <p className="text-sm text-slate-800">{prospect.need}</p>
        </div>
        <div>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
            <span>💰</span> Budget
          </p>
          <p className="text-sm text-slate-800 font-medium">{prospect.budget}</p>
        </div>
      </div>
      {prospect.objections.length > 0 && (
        <div>
          <p className="text-xs font-medium text-red-500 uppercase tracking-wider mb-2">Objections</p>
          <ul className="space-y-1">
            {prospect.objections.map((obj, i) => (
              <li key={i} className="text-sm text-red-700 flex items-start gap-2">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
                {obj}
              </li>
            ))}
          </ul>
        </div>
      )}
      {prospect.buying_signals.length > 0 && (
        <div>
          <p className="text-xs font-medium text-emerald-500 uppercase tracking-wider mb-2">Signaux d&apos;achat</p>
          <ul className="space-y-1">
            {prospect.buying_signals.map((sig, i) => (
              <li key={i} className="text-sm text-emerald-700 flex items-start gap-2">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                {sig}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function InfoCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-slate-50 rounded-xl p-3">
      <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-0.5">{label}</p>
      <p className="text-sm text-slate-800">{value}</p>
    </div>
  );
}

function CoachingSection({ analysis }: { analysis: StructuredAnalysis }) {
  const c = scoreColor(analysis.score);
  return (
    <div className="space-y-4">
      <h4 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">Score coaching</h4>
      {/* Score display */}
      <div className={`flex items-center gap-4 ${c.light} rounded-xl p-4`}>
        <div className={`flex items-center justify-center w-16 h-16 rounded-2xl ${c.bg} text-white font-bold text-2xl`}>
          {analysis.score}
        </div>
        <div>
          <p className={`text-lg font-bold ${c.text}`}>{analysis.score}/10</p>
          <p className="text-sm text-slate-600">{analysis.score_rationale}</p>
        </div>
      </div>
      {/* Three columns */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <ListColumn title="Points forts" items={analysis.strengths} color="emerald" />
        <ListColumn title="Faiblesses" items={analysis.weaknesses} color="red" />
        <ListColumn title="Améliorations" items={analysis.improvements} color="amber" />
      </div>
    </div>
  );
}

function ListColumn({ title, items, color }: { title: string; items: string[]; color: "emerald" | "red" | "amber" }) {
  const borderColors = { emerald: "border-l-emerald-400", red: "border-l-red-400", amber: "border-l-amber-400" };
  const dotColors = { emerald: "bg-emerald-400", red: "bg-red-400", amber: "bg-amber-400" };
  const titleColors = { emerald: "text-emerald-700", red: "text-red-700", amber: "text-amber-700" };

  return (
    <div className={`border-l-4 ${borderColors[color]} pl-3 space-y-2`}>
      <p className={`text-xs font-semibold uppercase tracking-wider ${titleColors[color]}`}>{title}</p>
      {items.map((item, i) => (
        <div key={i} className="flex items-start gap-2">
          <span className={`mt-1.5 w-1.5 h-1.5 rounded-full ${dotColors[color]} shrink-0`} />
          <p className="text-sm text-slate-700">{item}</p>
        </div>
      ))}
      {items.length === 0 && <p className="text-sm text-slate-400 italic">Aucun</p>}
    </div>
  );
}

function TranscriptSection({ segments }: { segments: TranscriptSegment[] }) {
  return (
    <div className="space-y-3">
      <h4 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">Transcript annoté</h4>
      <div className="max-h-[600px] overflow-y-auto space-y-2 pr-1">
        {segments.map((seg, i) => {
          const isJules = seg.speaker.toLowerCase() === "jules";
          const bgClass =
            seg.status === "good"
              ? "bg-emerald-50 border-l-emerald-400"
              : seg.status === "bad"
                ? "bg-red-50 border-l-red-400"
                : "bg-white border-l-slate-200";

          return (
            <div key={i} className={`border-l-4 rounded-lg p-3 ${bgClass}`}>
              {/* Header */}
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-xs font-bold uppercase tracking-wider ${isJules ? "text-blue-600" : "text-slate-500"}`}>
                  {seg.speaker}
                </span>
                {seg.status === "good" && (
                  <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
                {seg.status === "bad" && (
                  <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
              </div>
              {/* Text */}
              <p className="text-sm text-slate-700 leading-relaxed">{seg.text}</p>
              {/* Comment */}
              {seg.comment && seg.status !== "neutral" && (
                <p className={`text-xs mt-2 italic ${seg.status === "good" ? "text-emerald-600" : "text-red-600"}`}>
                  {seg.comment}
                </p>
              )}
              {/* Suggestion */}
              {seg.suggestion && seg.status === "bad" && (
                <div className="mt-2 bg-emerald-50 border border-emerald-200 rounded-lg p-2">
                  <p className="text-xs text-emerald-700">
                    <span className="font-semibold">Suggestion :</span> {seg.suggestion}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function NextStepsSection({ steps }: { steps: string[] }) {
  return (
    <div className="space-y-3">
      <h4 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">Actions suivantes</h4>
      <ul className="space-y-2">
        {steps.map((step, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
            <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
            {step}
          </li>
        ))}
      </ul>
    </div>
  );
}

// ── Closing card (accordion) ──

function ClosingCard({
  closing,
  isExpanded,
  onToggle,
  onGenerate,
  isGenerating,
}: {
  closing: ClosingSummary;
  isExpanded: boolean;
  onToggle: () => void;
  onGenerate: () => void;
  isGenerating: boolean;
}) {
  const analysis = closing.structured_analysis;
  const hasAnalysis = !!analysis;
  const hasSummary = !!closing.summary;
  const [activeTab, setActiveTab] = useState<"prospect" | "coaching" | "transcript" | "next">("coaching");

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
      {/* Header — always visible */}
      <div
        className="p-5 flex items-center justify-between cursor-pointer hover:bg-slate-50/50 transition-colors"
        onClick={onToggle}
      >
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-lg shrink-0">{closing.is_audio ? "\uD83C\uDFA4" : "\uD83D\uDCDD"}</span>
          <div className="min-w-0">
            <p className="font-medium text-slate-900 truncate">{closing.name}</p>
            <p className="text-xs text-slate-400">
              {new Date(closing.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}
              {hasAnalysis ? " · Analyse structurée" : hasSummary ? " · Résumé disponible" : " · Non analysé"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {hasAnalysis && <ScoreBadge score={analysis.score} />}
          <button
            onClick={(e) => { e.stopPropagation(); onGenerate(); }}
            disabled={isGenerating}
            className="px-4 py-2 text-sm font-semibold rounded-xl transition-all disabled:opacity-50 whitespace-nowrap"
            style={{
              background: hasAnalysis || hasSummary ? "rgba(16,185,129,0.08)" : "rgba(59,130,246,0.08)",
              color: hasAnalysis || hasSummary ? "#10B981" : "#3B82F6",
              border: hasAnalysis || hasSummary ? "1px solid rgba(16,185,129,0.2)" : "1px solid rgba(59,130,246,0.2)",
            }}
          >
            {isGenerating ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none" strokeDasharray="30 70" />
                </svg>
                Analyse...
              </span>
            ) : hasAnalysis || hasSummary ? (
              "Regénérer"
            ) : (
              "Analyser"
            )}
          </button>
          {/* Chevron */}
          <svg
            className={`w-5 h-5 text-slate-400 transition-transform ${isExpanded ? "rotate-180" : ""}`}
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {/* Expanded content */}
      {isExpanded && (hasAnalysis || hasSummary) && (
        <div className="border-t border-slate-100">
          {hasAnalysis ? (
            <>
              {/* Tabs */}
              <div className="flex border-b border-slate-100 px-5 pt-3 gap-1">
                {([
                  { key: "coaching" as const, label: "Coaching" },
                  { key: "prospect" as const, label: "Prospect" },
                  { key: "transcript" as const, label: "Transcript" },
                  { key: "next" as const, label: "Actions" },
                ]).map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`px-3 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                      activeTab === tab.key
                        ? "bg-slate-50 text-slate-900 border-b-2 border-blue-500"
                        : "text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
              {/* Tab content */}
              <div className="p-5">
                {activeTab === "prospect" && <ProspectSection prospect={analysis.prospect} />}
                {activeTab === "coaching" && <CoachingSection analysis={analysis} />}
                {activeTab === "transcript" && <TranscriptSection segments={analysis.annotated_transcript} />}
                {activeTab === "next" && <NextStepsSection steps={analysis.next_steps} />}
              </div>
            </>
          ) : (
            /* Fallback: old markdown rendering */
            <div className="p-5">
              <div
                className="prose prose-sm prose-slate max-w-none
                  [&_h2]:text-base [&_h2]:font-bold [&_h2]:text-slate-900 [&_h2]:mt-5 [&_h2]:mb-2 [&_h2]:first:mt-0
                  [&_strong]:text-slate-800
                  [&_li]:text-slate-600 [&_li]:leading-relaxed
                  [&_ul]:space-y-1"
                dangerouslySetInnerHTML={{
                  __html: (closing.summary ?? "")
                    .replace(/^## (.+)$/gm, "<h2>$1</h2>")
                    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
                    .replace(/^- (.+)$/gm, "<li>$1</li>")
                    .replace(/(<li>.*<\/li>\n?)+/g, "<ul>$&</ul>")
                    .replace(/\n{2,}/g, "<br/>")
                    .replace(/「(.+?)」|"(.+?)"/g, '<em class="text-amber-700 not-italic">"$1$2"</em>'),
                }}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main component ──

export default function AdsCallsClient() {
  const { buildQS, loading: campLoading } = useCampaign();
  const [calls, setCalls] = useState<Call[]>([]);
  const [period, setPeriod] = useState(90);
  const [loading, setLoading] = useState(true);

  // Closing summaries
  const [closings, setClosings] = useState<ClosingSummary[]>([]);
  const [generating, setGenerating] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

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
        setClosings((prev) =>
          prev.map((c) =>
            c.id === id ? { ...c, summary: `**Erreur** : ${json.error}`, structured_analysis: null } : c
          )
        );
      } else {
        setClosings((prev) =>
          prev.map((c) =>
            c.id === id
              ? { ...c, summary: json.summary, structured_analysis: json.structured_analysis ?? null }
              : c
          )
        );
        setExpandedId(id);
      }
    } catch {
      setClosings((prev) =>
        prev.map((c) =>
          c.id === id
            ? { ...c, summary: "**Erreur** : Impossible de générer l'analyse.", structured_analysis: null }
            : c
        )
      );
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
            <ClosingCard
              key={c.id}
              closing={c}
              isExpanded={expandedId === c.id}
              onToggle={() => setExpandedId(expandedId === c.id ? null : c.id)}
              onGenerate={() => generateSummary(c.id)}
              isGenerating={generating === c.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}
