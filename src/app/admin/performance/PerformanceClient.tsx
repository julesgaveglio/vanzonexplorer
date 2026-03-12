"use client";

import { useState } from "react";

const BASE = "https://vanzonexplorer.com";

const PAGES = [
  { label: "Homepage", path: "/", category: "Principal" },
  { label: "Location (hub)", path: "/location", category: "Location" },
  { label: "Location Biarritz", path: "/location/biarritz", category: "Location" },
  { label: "Location Hossegor", path: "/location/hossegor", category: "Location" },
  { label: "Location Bayonne", path: "/location/bayonne", category: "Location" },
  { label: "Location Saint-Jean-de-Luz", path: "/location/saint-jean-de-luz", category: "Location" },
  { label: "Location Forêt d'Irati", path: "/location/foret-irati", category: "Location" },
  { label: "Location Week-end", path: "/location/week-end", category: "Location" },
  { label: "Formation", path: "/formation", category: "Principal" },
  { label: "Achat", path: "/achat", category: "Principal" },
  { label: "Club Privé", path: "/club", category: "Principal" },
  { label: "Pays Basque", path: "/pays-basque", category: "Principal" },
  { label: "À propos", path: "/a-propos", category: "Principal" },
];

interface Vital {
  value: string;
  score: number | null;
}

interface Opportunity {
  id: string;
  title: string;
  displayValue: string;
  savingsMs: number;
}

interface Diagnostic {
  id: string;
  title: string;
  score: number | null;
  displayValue: string;
}

interface AuditResult {
  scores: { performance: number; seo: number; accessibility: number; bestPractices: number };
  vitals: { lcp: Vital; cls: Vital; tbt: Vital; fcp: Vital; si: Vital; tti: Vital };
  opportunities: Opportunity[];
  diagnostics: Diagnostic[];
}

type PageState = { status: "idle" } | { status: "loading" } | { status: "done"; mobile: AuditResult; desktop: AuditResult } | { status: "error"; message: string };

function scoreColor(s: number) {
  if (s >= 90) return { ring: "#22C55E", bg: "#F0FDF4", text: "#16A34A" };
  if (s >= 50) return { ring: "#F59E0B", bg: "#FFFBEB", text: "#D97706" };
  return { ring: "#EF4444", bg: "#FEF2F2", text: "#DC2626" };
}

function vitalColor(score: number | null) {
  if (score === null) return "text-slate-400";
  if (score >= 0.9) return "text-green-600";
  if (score >= 0.5) return "text-amber-600";
  return "text-red-500";
}

function ScoreCircle({ score, label }: { score: number; label: string }) {
  const c = scoreColor(score);
  const r = 28;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative w-16 h-16">
        <svg className="absolute inset-0 -rotate-90" viewBox="0 0 72 72">
          <circle cx="36" cy="36" r={r} fill="none" stroke="#E2E8F0" strokeWidth="6" />
          <circle cx="36" cy="36" r={r} fill="none" stroke={c.ring} strokeWidth="6"
            strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-black" style={{ color: c.text }}>{score}</span>
        </div>
      </div>
      <span className="text-xs font-medium text-slate-400 text-center leading-tight">{label}</span>
    </div>
  );
}

function VitalBadge({ label, vital }: { label: string; vital: Vital }) {
  return (
    <div className="flex flex-col items-center bg-slate-50 rounded-xl px-3 py-2 border border-slate-100">
      <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">{label}</span>
      <span className={`text-base font-bold mt-0.5 ${vitalColor(vital.score)}`}>{vital.value}</span>
    </div>
  );
}

function AuditPanel({ result, strategy }: { result: AuditResult; strategy: "Mobile" | "Desktop" }) {
  const { scores, vitals, opportunities } = result;
  return (
    <div>
      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">{strategy}</p>
      {/* Score circles */}
      <div className="flex gap-4 flex-wrap mb-4">
        <ScoreCircle score={scores.performance} label="Performance" />
        <ScoreCircle score={scores.seo} label="SEO" />
        <ScoreCircle score={scores.accessibility} label="Accessibilité" />
        <ScoreCircle score={scores.bestPractices} label="Best Practices" />
      </div>
      {/* Core Web Vitals */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <VitalBadge label="LCP" vital={vitals.lcp} />
        <VitalBadge label="CLS" vital={vitals.cls} />
        <VitalBadge label="TBT" vital={vitals.tbt} />
        <VitalBadge label="FCP" vital={vitals.fcp} />
        <VitalBadge label="Speed Index" vital={vitals.si} />
        <VitalBadge label="TTI" vital={vitals.tti} />
      </div>
      {/* Opportunities */}
      {opportunities.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-slate-500 mb-2">Opportunités d&apos;optimisation</p>
          <div className="space-y-1.5">
            {opportunities.map((op) => (
              <div key={op.id} className="flex items-start gap-2 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                <span className="text-amber-500 mt-0.5 flex-shrink-0">⚡</span>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-slate-700 leading-tight">{op.title}</p>
                  {op.displayValue && <p className="text-xs text-amber-700 mt-0.5">{op.displayValue}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function PageCard({ page }: { page: (typeof PAGES)[0] }) {
  const [state, setState] = useState<PageState>({ status: "idle" });
  const [expanded, setExpanded] = useState(false);
  const url = `${BASE}${page.path}`;

  async function runAudit() {
    setState({ status: "loading" });
    setExpanded(true);
    try {
      const [mobileRes, desktopRes] = await Promise.all([
        fetch(`/api/admin/psi?url=${encodeURIComponent(url)}&strategy=mobile`),
        fetch(`/api/admin/psi?url=${encodeURIComponent(url)}&strategy=desktop`),
      ]);
      if (!mobileRes.ok || !desktopRes.ok) {
        const err = await (mobileRes.ok ? desktopRes : mobileRes).json();
        setState({ status: "error", message: err.error ?? "Erreur inconnue" });
        return;
      }
      const [mobile, desktop] = await Promise.all([mobileRes.json(), desktopRes.json()]);
      setState({ status: "done", mobile, desktop });
    } catch (e) {
      setState({ status: "error", message: (e as Error).message });
    }
  }

  const avgScore = state.status === "done"
    ? Math.round((state.mobile.scores.performance + state.desktop.scores.performance) / 2)
    : null;

  const c = avgScore != null ? scoreColor(avgScore) : null;

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-4 px-5 py-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            {c && (
              <span className="text-xs font-black px-2 py-0.5 rounded-full" style={{ background: c.bg, color: c.text }}>
                {avgScore}
              </span>
            )}
            <p className="text-sm font-bold text-slate-800 truncate">{page.label}</p>
          </div>
          <p className="text-xs text-slate-400 font-mono truncate">{page.path}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {state.status === "done" && (
            <button onClick={() => setExpanded(!expanded)}
              className="text-xs font-medium text-slate-400 hover:text-slate-700 bg-slate-50 px-2.5 py-1.5 rounded-lg transition-colors">
              {expanded ? "Réduire" : "Voir"}
            </button>
          )}
          <button onClick={runAudit} disabled={state.status === "loading"}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-white px-3 py-1.5 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: state.status === "loading" ? "#94A3B8" : "linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)" }}>
            {state.status === "loading" ? (
              <>
                <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Audit...
              </>
            ) : (
              <>
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Auditer
              </>
            )}
          </button>
        </div>
      </div>

      {/* Error */}
      {state.status === "error" && (
        <div className="px-5 pb-4">
          {state.message.includes("pagespeedonline") || state.message.includes("disabled") || state.message.includes("has not been used") ? (
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-start gap-3">
              <span className="text-amber-500 text-base flex-shrink-0">⚠️</span>
              <div>
                <p className="text-xs font-bold text-amber-800 mb-1">PageSpeed Insights API non activée</p>
                <p className="text-xs text-amber-700 mb-2">Active l&apos;API dans Google Cloud Console, puis réessaie dans 2 minutes.</p>
                <a
                  href="https://console.developers.google.com/apis/api/pagespeedonline.googleapis.com/overview?project=1032728566510"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-white bg-amber-500 hover:bg-amber-600 px-3 py-1.5 rounded-lg transition-colors"
                >
                  Activer l&apos;API →
                </a>
              </div>
            </div>
          ) : (
            <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-xs text-red-600 font-medium">
              {state.message}
            </div>
          )}
        </div>
      )}

      {/* Results */}
      {state.status === "done" && expanded && (
        <div className="border-t border-slate-50 px-5 py-4 grid grid-cols-1 md:grid-cols-2 gap-6">
          <AuditPanel result={state.mobile} strategy="Mobile" />
          <div className="hidden md:block w-px bg-slate-100" />
          <AuditPanel result={state.desktop} strategy="Desktop" />
        </div>
      )}

      {/* Quick score bars when collapsed */}
      {state.status === "done" && !expanded && (
        <div className="border-t border-slate-50 px-5 py-3 grid grid-cols-4 gap-3">
          {(["performance", "seo", "accessibility", "bestPractices"] as const).map((key) => {
            const mobileScore = state.mobile.scores[key];
            const desktopScore = state.desktop.scores[key];
            const avg = Math.round((mobileScore + desktopScore) / 2);
            const col = scoreColor(avg);
            const labels: Record<string, string> = { performance: "Perfo", seo: "SEO", accessibility: "A11y", bestPractices: "BP" };
            return (
              <div key={key} className="flex flex-col items-center">
                <span className="text-lg font-black" style={{ color: col.text }}>{avg}</span>
                <span className="text-xs text-slate-400">{labels[key]}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function PerformanceClient() {
  const [runningAll, setRunningAll] = useState(false);
  const [auditKey, setAuditKey] = useState(0);

  function handleRunAll() {
    setRunningAll(true);
    setAuditKey((k) => k + 1);
    setTimeout(() => setRunningAll(false), 2000);
  }

  const categories = Array.from(new Set(PAGES.map((p) => p.category)));

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="text-slate-400 text-sm font-medium mb-1">Administration</p>
          <h1 className="text-3xl font-black text-slate-900">Performance & PageSpeed</h1>
          <p className="text-slate-500 mt-1 text-sm">
            Scores Lighthouse mobile + desktop — Core Web Vitals — Opportunités d&apos;optimisation
          </p>
        </div>
        <div className="flex items-center gap-3">
          <a
            href="https://pagespeed.web.dev/?url=https://vanzonexplorer.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-700 bg-white border border-slate-200 px-4 py-2.5 rounded-xl transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            PageSpeed.web.dev
          </a>
          <button
            onClick={handleRunAll}
            disabled={runningAll}
            className="inline-flex items-center gap-2 text-sm font-semibold text-white px-5 py-2.5 rounded-xl transition-all disabled:opacity-60"
            style={{ background: "linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)", boxShadow: "0 4px 14px rgba(99,102,241,0.35)" }}
          >
            <svg className={`w-4 h-4 ${runningAll ? "animate-spin" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Auditer tout le site
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-6 mb-8 bg-white rounded-2xl border border-slate-100 shadow-sm px-6 py-4">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Score</p>
        {[{ label: "Bon (90-100)", color: "#22C55E", bg: "#F0FDF4" }, { label: "À améliorer (50-89)", color: "#F59E0B", bg: "#FFFBEB" }, { label: "Mauvais (0-49)", color: "#EF4444", bg: "#FEF2F2" }].map((item) => (
          <div key={item.label} className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full" style={{ background: item.color }} />
            <span className="text-xs text-slate-500 font-medium">{item.label}</span>
          </div>
        ))}
        <div className="ml-auto text-xs text-slate-400">
          Données issues de l&apos;API Google PageSpeed Insights · Lighthouse v10
        </div>
      </div>

      {/* Pages by category */}
      {categories.map((cat) => {
        const pages = PAGES.filter((p) => p.category === cat);
        return (
          <div key={cat} className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <span className="w-8 h-px bg-slate-200" />
              <span className="text-xs font-semibold uppercase tracking-widest text-slate-400">{cat}</span>
            </div>
            <div className="space-y-3">
              {pages.map((page) => (
                <PageCard key={`${page.path}-${auditKey}`} page={page} />
              ))}
            </div>
          </div>
        );
      })}

      {/* Info banner */}
      <div className="bg-indigo-50 border border-indigo-100 rounded-2xl px-6 py-4 flex items-start gap-4">
        <div className="w-8 h-8 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
          <svg className="w-4 h-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div>
          <p className="text-sm font-semibold text-indigo-900">Clé API utilisée</p>
          <p className="text-xs text-indigo-700 mt-1">
            L&apos;audit utilise la variable <code className="bg-indigo-100 px-1 rounded">GOOGLE_PSI_API_KEY</code> (ou <code className="bg-indigo-100 px-1 rounded">GOOGLE_PLACES_API_KEY</code> par défaut).
            Limite : 400 audits/jour avec clé · 1 audit/100s sans clé.
            Pour une clé dédiée : console.cloud.google.com → activer &quot;PageSpeed Insights API&quot;.
          </p>
        </div>
      </div>
    </div>
  );
}
