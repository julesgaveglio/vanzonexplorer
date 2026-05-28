"use client";

import { useState, useEffect, useRef } from "react";

/* ── Types ────────────────────────────────────────────────── */

interface Segment {
  index: number;
  startSec: number;
  endSec: number;
  startLabel: string;
  endLabel: string;
  text: string;
}

interface RetentionBucket {
  start: number;
  end: number;
  exits: number;
  cumulative_retention: number;
}

interface HookSuggestion {
  atSecond: number;
  type: string;
  suggestion: string;
  reason?: string;
  priority?: string;
}

interface TranscriptData {
  version: { id: string; name: string };
  transcript_text: string;
  segments: Segment[];
  retention_buckets: RetentionBucket[];
  total_exits: number;
  hook_suggestions: HookSuggestion[];
}

interface VSLVersion {
  id: string;
  name: string;
  is_active: boolean;
}

interface AnalysisResult {
  analysis: string;
  hooks: HookSuggestion[];
  optimized_script: string;
  model_used: string;
  retention_summary: {
    total_viewers: number;
    drop_zones: number;
    avg_retention: number;
  };
}

/* ── Color helpers ───────────────────────────────────────── */

function retentionColor(pct: number): string {
  if (pct >= 70) return "bg-emerald-500";
  if (pct >= 50) return "bg-emerald-400";
  if (pct >= 35) return "bg-amber-400";
  if (pct >= 20) return "bg-orange-400";
  return "bg-red-500";
}

function retentionBg(pct: number): string {
  if (pct >= 70) return "bg-emerald-50/60";
  if (pct >= 50) return "bg-emerald-50/30";
  if (pct >= 35) return "bg-amber-50/40";
  if (pct >= 20) return "bg-orange-50/40";
  return "bg-red-50/50";
}

function priorityBadge(p?: string) {
  if (p === "high") return "bg-red-100 text-red-700";
  if (p === "medium") return "bg-amber-100 text-amber-700";
  return "bg-slate-100 text-slate-600";
}

const HOOK_ICONS: Record<string, string> = {
  "PATTERN INTERRUPT": "🔄",
  "OPEN LOOP": "🔓",
  "CURIOSITY GAP": "🔍",
  "PROOF DROP": "📊",
  "DIRECT QUESTION": "❓",
  "REFRAME": "🪞",
  "MICRO-COMMITMENT": "✅",
  "TENSION EMOTIONNELLE": "🎭",
};

/* ── Tabs ─────────────────────────────────────────────────── */

type Tab = "transcript" | "optimized" | "upload";

/* ── Component ────────────────────────────────────────────── */

export default function AdsTranscriptClient() {
  const [versions, setVersions] = useState<VSLVersion[]>([]);
  const [selectedVersion, setSelectedVersion] = useState("");
  const [data, setData] = useState<TranscriptData | null>(null);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<Tab>("transcript");

  // Upload state
  const [srtInput, setSrtInput] = useState("");
  const [saving, setSaving] = useState(false);

  // AI analysis state
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);

  const transcriptRef = useRef<HTMLDivElement>(null);

  // Fetch VSL versions
  useEffect(() => {
    fetch("/api/ads/vsl")
      .then((r) => r.json())
      .then((json) => {
        const v = (json.versions ?? []) as VSLVersion[];
        setVersions(v);
        const active = v.find((x) => x.is_active);
        if (active) setSelectedVersion(active.id);
      });
  }, []);

  // Fetch transcript data when version changes
  useEffect(() => {
    if (!selectedVersion) return;
    setLoading(true);
    setAnalysis(null);
    fetch(`/api/ads/vsl/transcript?versionId=${selectedVersion}`)
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        // Auto-switch to upload tab if no transcript
        if (!d.segments?.length && !d.transcript_text) {
          setTab("upload");
        } else {
          setTab("transcript");
        }
      })
      .finally(() => setLoading(false));
  }, [selectedVersion]);

  // Save SRT transcript
  async function handleSaveSRT() {
    if (!srtInput.trim() || !selectedVersion) return;
    setSaving(true);
    try {
      // Detect if it's SRT (has timestamps) or plain text
      const isSRT = /\d{2}:\d{2}:\d{2}[,.]\d{3}\s*-->/.test(srtInput);
      await fetch("/api/ads/vsl/transcript", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          versionId: selectedVersion,
          ...(isSRT
            ? { transcript_srt: srtInput }
            : { transcript_text: srtInput }),
        }),
      });
      // Reload
      const res = await fetch(`/api/ads/vsl/transcript?versionId=${selectedVersion}`);
      const d = await res.json();
      setData(d);
      setTab("transcript");
      setSrtInput("");
    } finally {
      setSaving(false);
    }
  }

  // Run AI analysis
  async function runAnalysis() {
    if (!selectedVersion) return;
    setAnalyzing(true);
    try {
      const res = await fetch("/api/ads/vsl/transcript/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ versionId: selectedVersion }),
      });
      const json = await res.json();
      if (json.error) {
        alert(json.error);
        return;
      }
      setAnalysis(json);
      // Reload transcript data (hook_suggestions updated in DB)
      const res2 = await fetch(`/api/ads/vsl/transcript?versionId=${selectedVersion}`);
      setData(await res2.json());
      setTab("optimized");
    } finally {
      setAnalyzing(false);
    }
  }

  // Retention at given second
  const getRetentionAt = (sec: number): number => {
    if (!data) return 100;
    const bucket = data.retention_buckets.find((b) => sec >= b.start && sec < b.end);
    return bucket?.cumulative_retention ?? 100;
  };

  // Hooks near a segment
  const getHooksNear = (startSec: number, endSec: number): HookSuggestion[] => {
    if (!data) return [];
    return (data.hook_suggestions ?? []).filter(
      (h) => h.atSecond >= startSec - 15 && h.atSecond <= endSec + 15
    );
  };

  // Drop-off zones
  const dropZones = (data?.retention_buckets ?? []).filter((b, i, arr) => {
    if (i === 0) return false;
    return arr[i - 1].cumulative_retention - b.cumulative_retention > 8;
  });

  const hasTranscript = data && (data.segments.length > 0 || data.transcript_text);

  return (
    <div className="space-y-6">
      {/* ── Header ────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">VSL Transcript</h1>
          <p className="text-sm text-slate-500 mt-1">
            Analyse et optimise tes scripts avec la retention en temps reel
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={selectedVersion}
            onChange={(e) => setSelectedVersion(e.target.value)}
            className="bg-white border border-slate-200 text-sm text-slate-700 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-500/30 shadow-sm"
          >
            {versions.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name} {v.is_active ? "(active)" : ""}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <svg className="animate-spin h-6 w-6 text-violet-500" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none" strokeDasharray="30 70" />
          </svg>
        </div>
      ) : (
        <>
          {/* ── Tab Bar ─────────────────────────────────────── */}
          <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-1 shadow-sm w-fit">
            {([
              { key: "transcript" as Tab, label: "Transcript", disabled: !hasTranscript },
              { key: "optimized" as Tab, label: "Version IA", disabled: !analysis },
              { key: "upload" as Tab, label: "Importer SRT" },
            ]).map((t) => (
              <button
                key={t.key}
                onClick={() => !t.disabled && setTab(t.key)}
                disabled={t.disabled}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                  tab === t.key
                    ? "bg-violet-50 text-violet-700 shadow-sm"
                    : t.disabled
                    ? "text-slate-300 cursor-not-allowed"
                    : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* ── Retention Overview + AI Button ──────────────── */}
          {hasTranscript && tab !== "upload" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Retention bar */}
              <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-slate-900">Retention globale</h3>
                  <span className="text-xs text-slate-400">{data?.total_exits ?? 0} sorties trackees</span>
                </div>
                <div className="flex h-8 rounded-lg overflow-hidden gap-px">
                  {(data?.retention_buckets ?? []).map((b, i) => (
                    <div
                      key={i}
                      className={`flex-1 ${retentionColor(b.cumulative_retention)} transition-all relative group`}
                      title={`${fmt(b.start)}-${fmt(b.end)}: ${b.cumulative_retention}%`}
                    >
                      <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 hidden group-hover:block bg-slate-900 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap z-10">
                        {fmt(b.start)} — {b.cumulative_retention}% ({b.exits} exits)
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-[10px] text-slate-400">0:00</span>
                  <span className="text-[10px] text-slate-400">
                    {fmt((data?.retention_buckets ?? []).at(-1)?.end ?? 0)}
                  </span>
                </div>

                {/* Drop-off alerts */}
                {dropZones.length > 0 && (
                  <div className="mt-4 space-y-1">
                    <p className="text-xs font-semibold text-red-600 mb-1">Zones de drop-off :</p>
                    {dropZones.map((z, i) => (
                      <p key={i} className="text-xs text-red-500">
                        <span className="font-mono font-bold">{fmt(z.start)}</span> — retention {z.cumulative_retention}% ({z.exits} sorties)
                      </p>
                    ))}
                  </div>
                )}
              </div>

              {/* AI Analysis card */}
              <div className="bg-gradient-to-br from-violet-50 to-indigo-50 border border-violet-200 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-violet-900 mb-2">Analyse IA</h3>
                  <p className="text-xs text-violet-600 leading-relaxed">
                    {analysis
                      ? analysis.analysis
                      : "L'IA analyse ton transcript avec les donnees de retention et genere des hooks strategiques pour maximiser l'attention."}
                  </p>
                  {analysis && (
                    <div className="flex gap-3 mt-3">
                      <Stat label="Hooks" value={analysis.hooks.length.toString()} />
                      <Stat label="Drop zones" value={analysis.retention_summary.drop_zones.toString()} />
                      <Stat label="Retention moy." value={`${analysis.retention_summary.avg_retention}%`} />
                    </div>
                  )}
                </div>
                <button
                  onClick={runAnalysis}
                  disabled={analyzing}
                  className="mt-4 w-full py-2.5 px-4 bg-violet-600 hover:bg-violet-700 disabled:bg-violet-300 text-white text-sm font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  {analyzing ? (
                    <>
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none" strokeDasharray="30 70" />
                      </svg>
                      Analyse en cours...
                    </>
                  ) : analysis ? (
                    "Relancer l'analyse"
                  ) : (
                    "Analyser avec l'IA"
                  )}
                </button>
              </div>
            </div>
          )}

          {/* ── Tab: Transcript ─────────────────────────────── */}
          {tab === "transcript" && hasTranscript && (
            <div ref={transcriptRef} className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-900">
                  Transcript — {data?.version.name}
                </h3>
                <span className="text-xs text-slate-400">
                  {data?.segments.length ?? 0} segments
                </span>
              </div>

              {data && data.segments.length > 0 ? (
                <div className="divide-y divide-slate-50 max-h-[700px] overflow-y-auto">
                  {data.segments.map((seg) => {
                    const ret = getRetentionAt(seg.startSec);
                    const hooks = getHooksNear(seg.startSec, seg.endSec);
                    const isDrop = dropZones.some(
                      (z) => seg.startSec >= z.start - 15 && seg.startSec <= z.end + 15
                    );

                    return (
                      <div key={seg.index}>
                        <div className={`flex gap-3 px-5 py-3 ${isDrop ? "bg-red-50/50" : retentionBg(ret)}`}>
                          {/* Timestamp */}
                          <div className="flex-shrink-0 w-14 pt-0.5">
                            <span className="text-[11px] font-mono text-slate-400">
                              {seg.startLabel.slice(3)}
                            </span>
                          </div>
                          {/* Retention dot */}
                          <div className="flex-shrink-0 w-8 flex flex-col items-center pt-1">
                            <div className={`w-2 h-2 rounded-full ${retentionColor(ret)}`} />
                            <span className="text-[9px] text-slate-400 mt-0.5">{ret}%</span>
                          </div>
                          {/* Text */}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-slate-700 leading-relaxed">{seg.text}</p>
                          </div>
                        </div>

                        {/* Hooks inline */}
                        {hooks.map((h, hi) => (
                          <div key={hi} className="flex gap-3 px-5 py-2.5 bg-violet-50 border-l-4 border-violet-400">
                            <div className="flex-shrink-0 w-14">
                              <span className="text-[11px] font-mono text-violet-400">{fmt(h.atSecond)}</span>
                            </div>
                            <div className="flex-shrink-0 w-8 flex items-center justify-center">
                              <span className="text-sm">{HOOK_ICONS[h.type] ?? "⚡"}</span>
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-0.5">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-violet-600">
                                  {h.type}
                                </span>
                                {h.priority && (
                                  <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${priorityBadge(h.priority)}`}>
                                    {h.priority}
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-violet-800 leading-relaxed">{h.suggestion}</p>
                              {h.reason && (
                                <p className="text-[11px] text-violet-500 mt-1 italic">{h.reason}</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-6 max-h-[700px] overflow-y-auto">
                  <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
                    {data?.transcript_text}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ── Tab: Optimized Version ──────────────────────── */}
          {tab === "optimized" && analysis && (
            <div className="space-y-4">
              {/* Hooks summary */}
              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-100">
                  <h3 className="text-sm font-semibold text-slate-900">
                    {analysis.hooks.length} hooks generes
                  </h3>
                </div>
                <div className="divide-y divide-slate-50 max-h-[400px] overflow-y-auto">
                  {analysis.hooks.map((h, i) => (
                    <div key={i} className="flex gap-3 px-5 py-3 hover:bg-slate-50 transition-colors">
                      <div className="flex-shrink-0 w-14 pt-0.5">
                        <span className="text-xs font-mono font-bold text-violet-500">{fmt(h.atSecond)}</span>
                      </div>
                      <div className="flex-shrink-0 w-8 flex items-center justify-center text-lg">
                        {HOOK_ICONS[h.type] ?? "⚡"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-violet-600 bg-violet-50 px-1.5 py-0.5 rounded">
                            {h.type}
                          </span>
                          {h.priority && (
                            <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${priorityBadge(h.priority)}`}>
                              {h.priority}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-slate-800 font-medium">{h.suggestion}</p>
                        {h.reason && (
                          <p className="text-xs text-slate-400 mt-1">{h.reason}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Optimized script */}
              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-900">Script optimise</h3>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(analysis.optimized_script);
                    }}
                    className="text-xs text-violet-600 hover:text-violet-800 font-medium transition-colors"
                  >
                    Copier
                  </button>
                </div>
                <div className="p-5 max-h-[600px] overflow-y-auto">
                  <OptimizedScriptView script={analysis.optimized_script} />
                </div>
              </div>
            </div>
          )}

          {/* ── Tab: Upload SRT ─────────────────────────────── */}
          {tab === "upload" && (
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-900 mb-1">
                  Importer le transcript
                </h3>
                <p className="text-xs text-slate-500">
                  Colle le contenu SRT (avec timestamps) ou le texte brut du script. Le format SRT est recommande pour l&#39;overlay de retention.
                </p>
              </div>

              <textarea
                value={srtInput}
                onChange={(e) => setSrtInput(e.target.value)}
                placeholder={`1\n00:00:00,000 --> 00:00:05,000\nSalut, aujourd'hui on va voir...\n\n2\n00:00:05,000 --> 00:00:10,000\n...comment transformer un van en machine à cash.`}
                className="w-full h-80 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 font-mono leading-relaxed resize-none focus:outline-none focus:ring-2 focus:ring-violet-500/30 placeholder:text-slate-300"
              />

              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-400">
                  {srtInput.length > 0 && (
                    <>
                      {/\d{2}:\d{2}:\d{2}[,.]\d{3}\s*-->/.test(srtInput)
                        ? "Format SRT detecte"
                        : "Texte brut detecte"}
                      {" — "}
                      {srtInput.split("\n").length} lignes
                    </>
                  )}
                </p>
                <button
                  onClick={handleSaveSRT}
                  disabled={saving || !srtInput.trim()}
                  className="px-5 py-2.5 bg-violet-600 hover:bg-violet-700 disabled:bg-slate-200 disabled:text-slate-400 text-white text-sm font-semibold rounded-xl transition-colors"
                >
                  {saving ? "Enregistrement..." : "Enregistrer"}
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* ── Sub-components ──────────────────────────────────────── */

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center">
      <p className="text-lg font-bold text-violet-900">{value}</p>
      <p className="text-[10px] text-violet-500 uppercase tracking-wider">{label}</p>
    </div>
  );
}

function OptimizedScriptView({ script }: { script: string }) {
  // Parse [HOOK: TYPE] markers in the optimized script
  const parts = script.split(/(\[HOOK:\s*[^\]]+\])/g);

  return (
    <div className="space-y-0 text-sm leading-relaxed">
      {parts.map((part, i) => {
        const hookMatch = part.match(/\[HOOK:\s*([^\]]+)\]/);
        if (hookMatch) {
          const type = hookMatch[1].trim();
          return (
            <span
              key={i}
              className="inline-flex items-center gap-1 px-2 py-0.5 mx-0.5 bg-violet-100 text-violet-700 rounded-md text-xs font-semibold"
            >
              {HOOK_ICONS[type] ?? "⚡"} {type}
            </span>
          );
        }
        // Render normal text with line breaks
        return (
          <span key={i} className="text-slate-700 whitespace-pre-wrap">
            {part}
          </span>
        );
      })}
    </div>
  );
}

/* ── Helpers ──────────────────────────────────────────────── */

function fmt(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.round(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}
