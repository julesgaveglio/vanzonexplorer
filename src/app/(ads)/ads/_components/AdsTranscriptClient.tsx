"use client";

import { useState, useEffect } from "react";

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

interface TranscriptData {
  version: { id: string; name: string };
  transcript_text: string;
  segments: Segment[];
  retention_buckets: RetentionBucket[];
  total_exits: number;
  hook_suggestions: Edit[];
}

interface VSLVersion {
  id: string;
  name: string;
  is_active: boolean;
}

interface Edit {
  segment_index: number;
  at_time: string;
  type: "replace" | "insert_after";
  hook_type: string;
  original_text: string;
  new_text: string;
  reason: string;
}

interface AnalysisResult {
  analysis: string;
  edits: Edit[];
  model_used: string;
  retention_summary: {
    total_viewers: number;
    drop_zones: number;
    avg_retention: number;
  };
}

/* ── Hook type colors ────────────────────────────────────── */

const HOOK_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  "PATTERN INTERRUPT": { bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200" },
  "OPEN LOOP": { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
  "CURIOSITY GAP": { bg: "bg-cyan-50", text: "text-cyan-700", border: "border-cyan-200" },
  "PROOF DROP": { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
  "DIRECT QUESTION": { bg: "bg-rose-50", text: "text-rose-700", border: "border-rose-200" },
  "REFRAME": { bg: "bg-indigo-50", text: "text-indigo-700", border: "border-indigo-200" },
  "MICRO-COMMITMENT": { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
  "TRANSITION": { bg: "bg-slate-100", text: "text-slate-700", border: "border-slate-200" },
  "TENSION EMOTIONNELLE": { bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200" },
};

function hookStyle(type: string) {
  return HOOK_COLORS[type] ?? { bg: "bg-violet-50", text: "text-violet-700", border: "border-violet-200" };
}

/* ── Component ────────────────────────────────────────────── */

export default function AdsTranscriptClient() {
  const [versions, setVersions] = useState<VSLVersion[]>([]);
  const [selectedVersion, setSelectedVersion] = useState("");
  const [data, setData] = useState<TranscriptData | null>(null);
  const [loading, setLoading] = useState(false);
  const [showEdits, setShowEdits] = useState(false);

  // Upload
  const [showUpload, setShowUpload] = useState(false);
  const [srtInput, setSrtInput] = useState("");
  const [saving, setSaving] = useState(false);

  // AI
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);

  // Fetch versions
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

  // Fetch transcript
  useEffect(() => {
    if (!selectedVersion) return;
    setLoading(true);
    setAnalysis(null);
    setShowEdits(false);
    fetch(`/api/ads/vsl/transcript?versionId=${selectedVersion}`)
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        if (!d.segments?.length && !d.transcript_text) setShowUpload(true);
        else setShowUpload(false);
      })
      .finally(() => setLoading(false));
  }, [selectedVersion]);

  // Save SRT
  async function handleSave() {
    if (!srtInput.trim() || !selectedVersion) return;
    setSaving(true);
    try {
      const isSRT = /\d{2}:\d{2}:\d{2}[,.]\d{3}\s*-->/.test(srtInput);
      await fetch("/api/ads/vsl/transcript", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          versionId: selectedVersion,
          ...(isSRT ? { transcript_srt: srtInput } : { transcript_text: srtInput }),
        }),
      });
      const res = await fetch(`/api/ads/vsl/transcript?versionId=${selectedVersion}`);
      setData(await res.json());
      setShowUpload(false);
      setSrtInput("");
    } finally {
      setSaving(false);
    }
  }

  // AI analysis
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
      if (json.error) { alert(json.error); return; }
      setAnalysis(json);
      setShowEdits(true);
      // Reload transcript (edits saved in DB)
      const res2 = await fetch(`/api/ads/vsl/transcript?versionId=${selectedVersion}`);
      setData(await res2.json());
    } finally {
      setAnalyzing(false);
    }
  }

  // Retention helpers
  const getRetentionAt = (sec: number): number => {
    if (!data) return 100;
    const b = data.retention_buckets.find((b) => sec >= b.start && sec < b.end);
    return b?.cumulative_retention ?? 100;
  };

  const dropZones = (data?.retention_buckets ?? []).filter((b, i, arr) => {
    if (i === 0) return false;
    return arr[i - 1].cumulative_retention - b.cumulative_retention > 8;
  });

  // Build edit map: segment_index → Edit
  const editMap = new Map<number, Edit>();
  const edits = analysis?.edits ?? [];
  for (const e of edits) {
    editMap.set(e.segment_index, e);
  }

  const hasTranscript = data && (data.segments.length > 0 || data.transcript_text);

  // Group segments into paragraphs (~30s each)
  const paragraphs = groupIntoParagraphs(data?.segments ?? [], 30);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* ── Header ──────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Transcript VSL</h1>
          <p className="text-sm text-slate-500 mt-1">
            {data?.segments.length ?? 0} segments &middot; {data?.version?.name ?? ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={selectedVersion}
            onChange={(e) => setSelectedVersion(e.target.value)}
            className="bg-white border border-slate-200 text-sm text-slate-700 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-500/30"
          >
            {versions.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name} {v.is_active ? "(active)" : ""}
              </option>
            ))}
          </select>
          <button
            onClick={() => setShowUpload(!showUpload)}
            className="px-3 py-2 text-sm text-slate-500 hover:text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
          >
            Importer
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* ── Upload panel ────────────────────────────── */}
          {showUpload && (
            <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
              <p className="text-sm font-medium text-slate-700">Coller le transcript (SRT ou texte brut)</p>
              <textarea
                value={srtInput}
                onChange={(e) => setSrtInput(e.target.value)}
                placeholder={`1\n00:00:00,000 --> 00:00:05,000\nSalut, aujourd'hui on va voir...`}
                className="w-full h-48 px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-sm font-mono resize-none focus:outline-none focus:ring-2 focus:ring-violet-500/30 placeholder:text-slate-300"
              />
              <div className="flex justify-end">
                <button
                  onClick={handleSave}
                  disabled={saving || !srtInput.trim()}
                  className="px-4 py-2 bg-violet-600 hover:bg-violet-700 disabled:bg-slate-200 disabled:text-slate-400 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  {saving ? "..." : "Enregistrer"}
                </button>
              </div>
            </div>
          )}

          {hasTranscript && (
            <>
              {/* ── Toolbar ───────────────────────────────── */}
              <div className="flex items-center justify-between bg-white border border-slate-200 rounded-xl px-5 py-3">
                <div className="flex items-center gap-4">
                  {/* Retention mini bar */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400 whitespace-nowrap">Retention</span>
                    <div className="flex h-3 w-48 rounded overflow-hidden gap-px">
                      {(data?.retention_buckets ?? []).map((b, i) => (
                        <div
                          key={i}
                          className={`flex-1 ${retColor(b.cumulative_retention)} relative group`}
                        >
                          <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 hidden group-hover:block bg-slate-900 text-white text-[10px] px-1.5 py-0.5 rounded whitespace-nowrap z-20">
                            {fmt(b.start)} — {b.cumulative_retention}%
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  {dropZones.length > 0 && (
                    <span className="text-xs text-red-500 font-medium">
                      {dropZones.length} drop-off{dropZones.length > 1 ? "s" : ""}
                    </span>
                  )}
                  <span className="text-xs text-slate-400">{data?.total_exits ?? 0} vues</span>
                </div>

                <div className="flex items-center gap-2">
                  {/* Toggle edits */}
                  {edits.length > 0 && (
                    <button
                      onClick={() => setShowEdits(!showEdits)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                        showEdits
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      {showEdits ? `${edits.length} edits visibles` : "Voir les edits"}
                    </button>
                  )}
                  {/* Analyze button */}
                  <button
                    onClick={runAnalysis}
                    disabled={analyzing}
                    className="px-4 py-1.5 bg-violet-600 hover:bg-violet-700 disabled:bg-violet-300 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5"
                  >
                    {analyzing ? (
                      <>
                        <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Analyse...
                      </>
                    ) : (
                      "Analyser avec IA"
                    )}
                  </button>
                </div>
              </div>

              {/* ── AI Analysis summary ───────────────────── */}
              {analysis && (
                <div className="bg-violet-50 border border-violet-200 rounded-xl px-5 py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <p className="text-sm text-violet-800 leading-relaxed">{analysis.analysis}</p>
                    </div>
                    <div className="flex gap-4 flex-shrink-0">
                      <MiniStat label="Edits" value={analysis.edits.length} />
                      <MiniStat label="Drop zones" value={analysis.retention_summary.drop_zones} />
                      <MiniStat label="Ret. moy." value={`${analysis.retention_summary.avg_retention}%`} />
                    </div>
                  </div>
                  {/* Legend */}
                  <div className="flex items-center gap-4 mt-3 pt-3 border-t border-violet-200/50">
                    <span className="text-[11px] text-violet-500">Legende :</span>
                    <span className="text-[11px] text-red-500 line-through">Texte a retirer</span>
                    <span className="text-[11px] text-emerald-700 bg-emerald-100 px-1 rounded">Texte a ajouter</span>
                    <span className="text-[11px] text-blue-600 bg-blue-50 border border-blue-200 px-1.5 rounded">Hook</span>
                  </div>
                </div>
              )}

              {/* ── Transcript body (flowing text) ────────── */}
              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                <div className="max-h-[75vh] overflow-y-auto">
                  {paragraphs.map((para, pi) => {
                    const paraStart = para[0].startSec;
                    const ret = getRetentionAt(paraStart);
                    const isDrop = dropZones.some(
                      (z) => paraStart >= z.start - 10 && paraStart <= z.end + 10
                    );

                    return (
                      <div
                        key={pi}
                        className={`flex border-b border-slate-50 last:border-b-0 ${
                          isDrop ? "bg-red-50/30" : ""
                        }`}
                      >
                        {/* Time + retention gutter */}
                        <div className="flex-shrink-0 w-20 py-4 px-3 border-r border-slate-100 flex flex-col items-center gap-1">
                          <span className="text-[11px] font-mono text-slate-400">
                            {fmt(paraStart)}
                          </span>
                          <div className="flex items-center gap-1">
                            <div className={`w-2 h-2 rounded-full ${retColor(ret)}`} />
                            <span className="text-[10px] text-slate-400">{ret}%</span>
                          </div>
                        </div>

                        {/* Text content */}
                        <div className="flex-1 py-4 px-5">
                          <p className="text-[15px] text-slate-800 leading-[1.8]">
                            {para.map((seg) => {
                              const edit = showEdits ? editMap.get(seg.index) : undefined;

                              if (edit && edit.type === "replace") {
                                return (
                                  <span key={seg.index}>
                                    {/* Red strikethrough */}
                                    <span className="text-red-500 line-through decoration-red-400 bg-red-50 px-0.5 rounded-sm">
                                      {seg.text}
                                    </span>
                                    {" "}
                                    {/* Green replacement */}
                                    <span className="relative inline">
                                      <HookBadge type={edit.hook_type} reason={edit.reason} />
                                      <span className="text-emerald-800 bg-emerald-100/80 px-0.5 rounded-sm">
                                        {edit.new_text}
                                      </span>
                                    </span>
                                    {" "}
                                  </span>
                                );
                              }

                              if (edit && edit.type === "insert_after") {
                                return (
                                  <span key={seg.index}>
                                    <span>{seg.text} </span>
                                    {/* Green insertion */}
                                    <span className="relative inline">
                                      <HookBadge type={edit.hook_type} reason={edit.reason} />
                                      <span className="text-emerald-800 bg-emerald-100/80 px-0.5 rounded-sm">
                                        {edit.new_text}
                                      </span>
                                    </span>
                                    {" "}
                                  </span>
                                );
                              }

                              return <span key={seg.index}>{seg.text} </span>;
                            })}
                          </p>
                        </div>
                      </div>
                    );
                  })}

                  {/* Fallback: plain text if no SRT segments */}
                  {data && data.segments.length === 0 && data.transcript_text && (
                    <div className="p-6">
                      <p className="text-[15px] text-slate-800 leading-[1.8] whitespace-pre-wrap">
                        {data.transcript_text}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}

/* ── Sub-components ──────────────────────────────────────── */

function HookBadge({ type, reason }: { type: string; reason: string }) {
  const style = hookStyle(type);
  const [show, setShow] = useState(false);

  return (
    <span
      className="relative inline-block mr-1 align-middle cursor-help"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      <span className={`inline-flex items-center px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded ${style.bg} ${style.text} border ${style.border}`}>
        {type}
      </span>
      {show && reason && (
        <span className="absolute bottom-full left-0 mb-1 w-64 p-2 bg-slate-900 text-white text-xs rounded-lg shadow-xl z-30 leading-relaxed">
          {reason}
        </span>
      )}
    </span>
  );
}

function MiniStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="text-center">
      <p className="text-lg font-bold text-violet-900">{value}</p>
      <p className="text-[10px] text-violet-500 uppercase tracking-wider">{label}</p>
    </div>
  );
}

/* ── Helpers ──────────────────────────────────────────────── */

function groupIntoParagraphs(segments: Segment[], intervalSec: number): Segment[][] {
  if (segments.length === 0) return [];
  const groups: Segment[][] = [[]];

  for (const seg of segments) {
    const current = groups[groups.length - 1];
    if (current.length === 0) {
      current.push(seg);
    } else {
      const lastSeg = current[0];
      if (seg.startSec - lastSeg.startSec >= intervalSec) {
        groups.push([seg]);
      } else {
        current.push(seg);
      }
    }
  }
  return groups;
}

function retColor(pct: number): string {
  if (pct >= 70) return "bg-emerald-500";
  if (pct >= 50) return "bg-emerald-400";
  if (pct >= 35) return "bg-amber-400";
  if (pct >= 20) return "bg-orange-400";
  return "bg-red-500";
}

function fmt(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.round(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}
