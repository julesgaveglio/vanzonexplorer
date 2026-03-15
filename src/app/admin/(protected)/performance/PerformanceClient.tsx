"use client";

import { useState, useEffect, useCallback, useRef } from "react";

const BASE = "https://vanzonexplorer.com";
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24h

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

interface Vital { value: string; score: number | null }
interface Opportunity { id: string; title: string; displayValue: string; savingsMs: number }
interface AuditResult {
  scores: { performance: number; seo: number; accessibility: number; bestPractices: number };
  vitals: { lcp: Vital; cls: Vital; tbt: Vital; fcp: Vital; si: Vital; tti: Vital };
  opportunities: Opportunity[];
  diagnostics: { id: string; title: string; score: number | null; displayValue: string }[];
}
interface CachedAudit { timestamp: number; mobile: AuditResult; desktop: AuditResult }

type PageState =
  | { status: "idle" }
  | { status: "cached"; mobile: AuditResult; desktop: AuditResult; cachedAt: number }
  | { status: "loading" }
  | { status: "done"; mobile: AuditResult; desktop: AuditResult; cachedAt: number }
  | { status: "error"; message: string };

// ── Helpers ──────────────────────────────────────────────────────────────────

function cacheKey(path: string) { return `psi_cache_${path}`; }

function loadCache(path: string): CachedAudit | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(cacheKey(path));
    if (!raw) return null;
    const data = JSON.parse(raw) as CachedAudit;
    if (Date.now() - data.timestamp > CACHE_TTL_MS) return null;
    return data;
  } catch { return null; }
}

function saveCache(path: string, mobile: AuditResult, desktop: AuditResult) {
  if (typeof window === "undefined") return;
  try {
    const data: CachedAudit = { timestamp: Date.now(), mobile, desktop };
    localStorage.setItem(cacheKey(path), JSON.stringify(data));
  } catch { /* ignore */ }
}

function clearAllCache() {
  if (typeof window === "undefined") return;
  PAGES.forEach((p) => localStorage.removeItem(cacheKey(p.path)));
}

function timeAgo(ts: number): string {
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 60) return "à l'instant";
  if (diff < 3600) return `il y a ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `il y a ${Math.floor(diff / 3600)}h`;
  return `il y a ${Math.floor(diff / 86400)}j`;
}

function scoreColor(s: number) {
  if (s >= 90) return { ring: "#22C55E", bg: "#DCFCE7", text: "#16A34A" };
  if (s >= 50) return { ring: "#F59E0B", bg: "#FEF3C7", text: "#D97706" };
  return { ring: "#EF4444", bg: "#FEE2E2", text: "#DC2626" };
}

function vitalColor(score: number | null) {
  if (score === null) return "text-slate-400";
  if (score >= 0.9) return "text-green-600";
  if (score >= 0.5) return "text-amber-500";
  return "text-red-500";
}

// ── Sub-components ────────────────────────────────────────────────────────────

function ScoreCircle({ score, label, size = "md" }: { score: number; label: string; size?: "sm" | "md" }) {
  const c = scoreColor(score);
  const dim = size === "sm" ? 48 : 60;
  const r = size === "sm" ? 18 : 22;
  const circ = 2 * Math.PI * r;
  const cx = dim / 2, cy = dim / 2;
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: dim, height: dim }}>
        <svg className="absolute inset-0 -rotate-90" viewBox={`0 0 ${dim} ${dim}`}>
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="#E2E8F0" strokeWidth="5" />
          <circle cx={cx} cy={cy} r={r} fill="none" stroke={c.ring} strokeWidth="5"
            strokeDasharray={`${(score / 100) * circ} ${circ}`} strokeLinecap="round" />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`font-black ${size === "sm" ? "text-xs" : "text-sm"}`} style={{ color: c.text }}>{score}</span>
        </div>
      </div>
      <span className="text-[10px] font-medium text-slate-400 text-center leading-tight">{label}</span>
    </div>
  );
}

function VitalBadge({ label, vital }: { label: string; vital: Vital }) {
  return (
    <div className="flex flex-col items-center bg-slate-50 rounded-xl px-2 py-2 border border-slate-100">
      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{label}</span>
      <span className={`text-sm font-bold mt-0.5 ${vitalColor(vital.score)}`}>{vital.value}</span>
    </div>
  );
}

function AuditPanel({ result, strategy }: { result: AuditResult; strategy: "Mobile" | "Desktop" }) {
  const { scores, vitals, opportunities } = result;
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xs">{strategy === "Mobile" ? "📱" : "🖥️"}</span>
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{strategy}</p>
      </div>
      <div className="flex gap-3 flex-wrap mb-4">
        <ScoreCircle score={scores.performance} label="Perf" size="sm" />
        <ScoreCircle score={scores.seo} label="SEO" size="sm" />
        <ScoreCircle score={scores.accessibility} label="A11y" size="sm" />
        <ScoreCircle score={scores.bestPractices} label="BP" size="sm" />
      </div>
      <div className="grid grid-cols-3 gap-1.5 mb-3">
        <VitalBadge label="LCP" vital={vitals.lcp} />
        <VitalBadge label="CLS" vital={vitals.cls} />
        <VitalBadge label="TBT" vital={vitals.tbt} />
        <VitalBadge label="FCP" vital={vitals.fcp} />
        <VitalBadge label="SI" vital={vitals.si} />
        <VitalBadge label="TTI" vital={vitals.tti} />
      </div>
      {opportunities.length > 0 && (
        <div className="space-y-1.5">
          {opportunities.slice(0, 3).map((op) => (
            <div key={op.id} className="flex items-start gap-2 bg-amber-50 border border-amber-100 rounded-lg px-2.5 py-1.5">
              <span className="text-amber-400 flex-shrink-0 text-xs mt-0.5">⚡</span>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold text-slate-700 leading-tight">{op.title}</p>
                {op.displayValue && <p className="text-[11px] text-amber-700">{op.displayValue}</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── PageCard ──────────────────────────────────────────────────────────────────

function PageCard({ page, autoRun }: { page: (typeof PAGES)[0]; autoRun: boolean }) {
  const [state, setState] = useState<PageState>(() => {
    const cached = loadCache(page.path);
    return cached ? { status: "cached", ...cached, cachedAt: cached.timestamp } : { status: "idle" };
  });
  const [expanded, setExpanded] = useState(false);
  const [tab, setTab] = useState<"mobile" | "desktop">("mobile");
  const hasRunRef = useRef(false);
  const url = `${BASE}${page.path}`;

  const runAudit = useCallback(async () => {
    setState({ status: "loading" });
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
      const cachedAt = Date.now();
      saveCache(page.path, mobile, desktop);
      setState({ status: "done", mobile, desktop, cachedAt });
      setExpanded(false);
    } catch (e) {
      setState({ status: "error", message: (e as Error).message });
    }
  }, [url, page.path]);

  // Auto-run when triggered from parent (staggered via index)
  useEffect(() => {
    if (autoRun && !hasRunRef.current) {
      hasRunRef.current = true;
      runAudit();
    }
    if (!autoRun) hasRunRef.current = false;
  }, [autoRun, runAudit]);

  const result = (state.status === "done" || state.status === "cached") ? state : null;
  const avgPerf = result ? Math.round((result.mobile.scores.performance + result.desktop.scores.performance) / 2) : null;
  const c = avgPerf != null ? scoreColor(avgPerf) : null;
  const isLoading = state.status === "loading";
  const isCached = state.status === "cached";

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3.5">
        {/* Score badge */}
        <div className="flex-shrink-0 w-10 h-10">
          {isLoading ? (
            <div className="w-10 h-10 rounded-full border-2 border-slate-100 flex items-center justify-center">
              <svg className="w-4 h-4 animate-spin text-indigo-400" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            </div>
          ) : avgPerf != null && c ? (
            <div className="relative w-10 h-10">
              <svg className="absolute inset-0 -rotate-90" viewBox="0 0 40 40">
                <circle cx="20" cy="20" r="16" fill="none" stroke="#E2E8F0" strokeWidth="4" />
                <circle cx="20" cy="20" r="16" fill="none" stroke={c.ring} strokeWidth="4"
                  strokeDasharray={`${(avgPerf / 100) * 2 * Math.PI * 16} ${2 * Math.PI * 16}`} strokeLinecap="round" />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-[11px] font-black" style={{ color: c.text }}>{avgPerf}</span>
              </div>
            </div>
          ) : (
            <div className="w-10 h-10 rounded-full bg-slate-50 border border-slate-100" />
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <p className="text-sm font-bold text-slate-800 truncate">{page.label}</p>
            {isCached && (
              <span className="text-[10px] text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded-full border border-slate-100 flex-shrink-0">
                {timeAgo(state.cachedAt)}
              </span>
            )}
          </div>
          {result ? (
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              {(["performance", "seo", "accessibility", "bestPractices"] as const).map((key) => {
                const avg = Math.round((result.mobile.scores[key] + result.desktop.scores[key]) / 2);
                const col = scoreColor(avg);
                const labels: Record<string, string> = { performance: "Perf", seo: "SEO", accessibility: "A11y", bestPractices: "BP" };
                return (
                  <span key={key} className="text-[10px] font-bold px-1.5 py-0.5 rounded-md" style={{ background: col.bg, color: col.text }}>
                    {labels[key]} {avg}
                  </span>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-slate-400 font-mono truncate mt-0.5">{page.path}</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {result && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-colors"
              aria-label={expanded ? "Réduire" : "Voir détails"}
            >
              <svg className={`w-4 h-4 transition-transform ${expanded ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          )}
          <button
            onClick={runAudit}
            disabled={isLoading}
            className="inline-flex items-center gap-1 text-xs font-semibold text-white px-3 py-2 rounded-xl transition-all disabled:opacity-50 active:scale-95"
            style={{ background: isLoading ? "#94A3B8" : "linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)" }}
          >
            {isLoading ? (
              <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            )}
            <span className="hidden sm:inline">{isLoading ? "..." : result ? "Ré-auditer" : "Auditer"}</span>
          </button>
        </div>
      </div>

      {/* Error */}
      {state.status === "error" && (
        <div className="px-4 pb-4">
          <div className="bg-red-50 border border-red-100 rounded-xl px-3 py-2.5 text-xs text-red-600 font-medium">
            {state.message}
          </div>
        </div>
      )}

      {/* Expanded detail */}
      {result && expanded && (
        <div className="border-t border-slate-50">
          {/* Mobile/Desktop tabs */}
          <div className="flex border-b border-slate-50">
            {(["mobile", "desktop"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 py-2.5 text-xs font-semibold transition-colors ${tab === t ? "text-indigo-600 bg-indigo-50/50 border-b-2 border-indigo-500" : "text-slate-400 hover:text-slate-600"}`}
              >
                {t === "mobile" ? "📱 Mobile" : "🖥️ Desktop"}
              </button>
            ))}
          </div>
          <div className="p-4">
            <AuditPanel result={tab === "mobile" ? result.mobile : result.desktop} strategy={tab === "mobile" ? "Mobile" : "Desktop"} />
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function PerformanceClient() {
  const [runningPages, setRunningPages] = useState<Set<string>>(new Set());
  const [auditProgress, setAuditProgress] = useState<{ done: number; total: number } | null>(null);
  const [isRunningAll, setIsRunningAll] = useState(false);

  // Check how many pages have cache
  const [cacheCount, setCacheCount] = useState(0);
  useEffect(() => {
    setCacheCount(PAGES.filter((p) => loadCache(p.path) !== null).length);
  }, []);

  // Run all pages sequentially (2 at a time to avoid rate limits)
  async function handleRunAll() {
    setIsRunningAll(true);
    setAuditProgress({ done: 0, total: PAGES.length });
    clearAllCache();

    const CONCURRENCY = 2;
    let done = 0;

    for (let i = 0; i < PAGES.length; i += CONCURRENCY) {
      const batch = PAGES.slice(i, i + CONCURRENCY);
      setRunningPages(new Set(batch.map((p) => p.path)));
      await Promise.all(
        batch.map(async (page) => {
          const url = `${BASE}${page.path}`;
          try {
            const [mobileRes, desktopRes] = await Promise.all([
              fetch(`/api/admin/psi?url=${encodeURIComponent(url)}&strategy=mobile`),
              fetch(`/api/admin/psi?url=${encodeURIComponent(url)}&strategy=desktop`),
            ]);
            if (mobileRes.ok && desktopRes.ok) {
              const [mobile, desktop] = await Promise.all([mobileRes.json(), desktopRes.json()]);
              saveCache(page.path, mobile, desktop);
            }
          } catch { /* ignore individual failures */ }
          done++;
          setAuditProgress({ done, total: PAGES.length });
        })
      );
      // Small delay between batches to respect rate limits
      if (i + CONCURRENCY < PAGES.length) await new Promise((r) => setTimeout(r, 1500));
    }

    setRunningPages(new Set());
    setIsRunningAll(false);
    setAuditProgress(null);
    setCacheCount(PAGES.length);
    // Force remount of cards
    window.location.reload();
  }

  function handleClearCache() {
    clearAllCache();
    setCacheCount(0);
    window.location.reload();
  }

  const categories = Array.from(new Set(PAGES.map((p) => p.category)));
  const progressPct = auditProgress ? Math.round((auditProgress.done / auditProgress.total) * 100) : 0;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-screen-xl mx-auto">

      {/* Header */}
      <div className="mb-6">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1">Administration</p>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900">Performance & PageSpeed</h1>
        <p className="text-slate-500 mt-1 text-sm">Lighthouse · Core Web Vitals · Mobile + Desktop</p>
      </div>

      {/* Action bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <button
          onClick={handleRunAll}
          disabled={isRunningAll}
          className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 text-sm font-semibold text-white px-5 py-3 rounded-2xl transition-all disabled:opacity-60 active:scale-[0.98]"
          style={{ background: "linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)", boxShadow: "0 4px 14px rgba(99,102,241,0.3)" }}
        >
          <svg className={`w-4 h-4 ${isRunningAll ? "animate-spin" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          {isRunningAll ? `Audit en cours… (${auditProgress?.done}/${auditProgress?.total})` : "Auditer tout le site"}
        </button>

        <div className="flex gap-2 flex-1 sm:flex-none">
          <a
            href="https://pagespeed.web.dev/?url=https://vanzonexplorer.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 text-sm font-medium text-slate-500 bg-white border border-slate-200 px-4 py-3 rounded-2xl hover:bg-slate-50 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            <span className="hidden sm:inline">PageSpeed.web.dev</span>
            <span className="sm:hidden">PSI</span>
          </a>

          {cacheCount > 0 && (
            <button
              onClick={handleClearCache}
              className="inline-flex items-center justify-center gap-1.5 text-xs font-medium text-slate-400 bg-white border border-slate-200 px-3 py-3 rounded-2xl hover:text-red-500 hover:border-red-200 transition-colors"
              title="Vider le cache"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              <span>{cacheCount}/{PAGES.length}</span>
            </button>
          )}
        </div>
      </div>

      {/* Progress bar */}
      {isRunningAll && auditProgress && (
        <div className="mb-6 bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-slate-600">Audit en cours…</p>
            <p className="text-xs font-bold text-indigo-600">{auditProgress.done}/{auditProgress.total} pages</p>
          </div>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <p className="text-xs text-slate-400 mt-2">Les résultats sont mis en cache automatiquement.</p>
        </div>
      )}

      {/* Cache banner */}
      {cacheCount > 0 && !isRunningAll && (
        <div className="mb-5 flex items-center gap-3 bg-emerald-50 border border-emerald-100 rounded-2xl px-4 py-3">
          <span className="text-emerald-500 flex-shrink-0">✓</span>
          <p className="text-xs text-emerald-700 font-medium">
            <span className="font-bold">{cacheCount} page{cacheCount > 1 ? "s" : ""}</span> en cache (derniers résultats — &lt; 24h)
          </p>
        </div>
      )}

      {/* Legend — desktop only */}
      <div className="hidden sm:flex items-center gap-5 mb-6 bg-white rounded-2xl border border-slate-100 shadow-sm px-5 py-3.5">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex-shrink-0">Score</p>
        {[
          { label: "Bon (90+)", color: "#22C55E", bg: "#DCFCE7" },
          { label: "Moyen (50-89)", color: "#F59E0B", bg: "#FEF3C7" },
          { label: "Mauvais (<50)", color: "#EF4444", bg: "#FEE2E2" },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: item.color }} />
            <span className="text-xs text-slate-500">{item.label}</span>
          </div>
        ))}
        <div className="ml-auto text-xs text-slate-400">Google PSI · Lighthouse v13</div>
      </div>

      {/* Pages by category */}
      {categories.map((cat) => {
        const pages = PAGES.filter((p) => p.category === cat);
        return (
          <div key={cat} className="mb-6">
            <div className="flex items-center gap-3 mb-3">
              <span className="w-6 h-px bg-slate-200" />
              <span className="text-xs font-bold uppercase tracking-widest text-slate-400">{cat}</span>
              <span className="text-xs text-slate-300">({pages.length})</span>
            </div>
            <div className="space-y-2">
              {pages.map((page) => (
                <PageCard
                  key={page.path}
                  page={page}
                  autoRun={runningPages.has(page.path)}
                />
              ))}
            </div>
          </div>
        );
      })}

      {/* Info footer */}
      <div className="mt-4 bg-indigo-50 border border-indigo-100 rounded-2xl px-4 py-3.5 flex items-start gap-3">
        <svg className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-xs text-indigo-700">
          Cache local 24h · Résultats mobiles en priorité · Limite API : 400 audits/jour
        </p>
      </div>
    </div>
  );
}
