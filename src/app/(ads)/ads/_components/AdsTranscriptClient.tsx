"use client";

import { useState, useEffect, useMemo, useCallback } from "react";

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
  score_impact?: number;
}

interface ZoneScore {
  zone: string;
  score: number;
  note: string;
}

interface AnalysisResult {
  analysis: string;
  edits: Edit[];
  zone_scores: ZoneScore[];
  model_used: string;
  retention_summary: {
    total_viewers: number;
    drop_zones: number;
    avg_retention: number;
  };
}

/* ── Hook type styles ────────────────────────────────────── */

const HOOK_STYLES: Record<string, { bg: string; text: string; border: string }> = {
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
  return HOOK_STYLES[type] ?? { bg: "bg-violet-50", text: "text-violet-700", border: "border-violet-200" };
}

/* ── Component ────────────────────────────────────────────── */

export default function AdsTranscriptClient() {
  const [versions, setVersions] = useState<VSLVersion[]>([]);
  const [selectedVersion, setSelectedVersion] = useState("");
  const [data, setData] = useState<TranscriptData | null>(null);
  const [loading, setLoading] = useState(false);

  // Upload
  const [showUpload, setShowUpload] = useState(false);
  const [srtInput, setSrtInput] = useState("");
  const [saving, setSaving] = useState(false);

  // AI
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);

  // Applied edits tracking
  const [appliedEdits, setAppliedEdits] = useState<Set<number>>(new Set());

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
    setAppliedEdits(new Set());
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
      setAppliedEdits(new Set());
    } finally {
      setAnalyzing(false);
    }
  }

  // Apply an edit
  const applyEdit = useCallback((segIndex: number) => {
    setAppliedEdits((prev) => new Set(prev).add(segIndex));
  }, []);

  // Build edit map
  const edits = useMemo(() => analysis?.edits ?? [], [analysis]);
  const editMap = useMemo(() => {
    const m = new Map<number, Edit>();
    for (const e of edits) m.set(e.segment_index, e);
    return m;
  }, [edits]);

  // ── Dynamic retention bar scores ──────────────────────────
  // Base: AI zone_scores. Boost applied edits.
  const dynamicScores = useMemo(() => {
    if (!analysis?.zone_scores?.length) {
      // No AI analysis yet → derive from actual retention data
      return (data?.retention_buckets ?? []).map((b) => ({
        zone: `${fmt(b.start)}-${fmt(b.end)}`,
        score: b.cumulative_retention,
        note: `${b.exits} sorties`,
        boosted: false,
      }));
    }

    return analysis.zone_scores.map((zs) => {
      // Check if any applied edit falls in this zone
      const zoneStart = parseZoneStart(zs.zone);
      const zoneEnd = zoneStart + 30;
      const hasAppliedEdit = edits.some(
        (e) => appliedEdits.has(e.segment_index) && data?.segments.some(
          (seg) => seg.index === e.segment_index && seg.startSec >= zoneStart && seg.startSec < zoneEnd
        )
      );
      const boost = hasAppliedEdit ? (edits.find(
        (e) => appliedEdits.has(e.segment_index) && data?.segments.some(
          (seg) => seg.index === e.segment_index && seg.startSec >= zoneStart && seg.startSec < zoneEnd
        )
      )?.score_impact ?? 15) : 0;

      return {
        zone: zs.zone,
        score: Math.min(100, zs.score + boost),
        note: hasAppliedEdit ? `${zs.note} (+${boost} hook applique)` : zs.note,
        boosted: hasAppliedEdit,
      };
    });
  }, [analysis, appliedEdits, data, edits]);

  // Average score
  const avgScore = dynamicScores.length > 0
    ? Math.round(dynamicScores.reduce((s, z) => s + z.score, 0) / dynamicScores.length)
    : 0;

  const hasTranscript = data && (data.segments.length > 0 || data.transcript_text);
  const paragraphs = groupIntoParagraphs(data?.segments ?? [], 30);

  return (
    <div className="max-w-5xl mx-auto space-y-5">
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
          <button
            onClick={runAnalysis}
            disabled={analyzing || !hasTranscript}
            className="px-4 py-2 bg-violet-600 hover:bg-violet-700 disabled:bg-violet-300 text-white text-sm font-semibold rounded-lg transition-colors flex items-center gap-1.5"
          >
            {analyzing ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Analyse...
              </>
            ) : analysis ? "Relancer" : "Analyser IA"}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* ── Upload ──────────────────────────────────── */}
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
              {/* ── Dynamic Retention Bar ─────────────────── */}
              <div className="bg-white border border-slate-200 rounded-xl px-5 py-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <h3 className="text-sm font-semibold text-slate-900">Score de retention</h3>
                    <span className={`text-lg font-bold ${scoreColor(avgScore)}`}>
                      {avgScore}%
                    </span>
                    {appliedEdits.size > 0 && (
                      <span className="text-[11px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full font-medium">
                        {appliedEdits.size} edit{appliedEdits.size > 1 ? "s" : ""} applique{appliedEdits.size > 1 ? "s" : ""}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-[10px] text-slate-400">
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" />Bon</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400" />Moyen</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500" />Faible</span>
                  </div>
                </div>

                {/* Bar */}
                <div className="flex h-6 rounded-lg overflow-hidden gap-[1px]">
                  {dynamicScores.map((z, i) => (
                    <div
                      key={i}
                      className={`flex-1 ${zoneBarColor(z.score)} relative group transition-colors duration-500 ${z.boosted ? "ring-1 ring-emerald-400 ring-inset" : ""}`}
                    >
                      <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover:block bg-slate-900 text-white text-[11px] px-2.5 py-1.5 rounded-lg whitespace-nowrap z-20 shadow-lg">
                        <p className="font-bold">{z.zone} — {z.score}/100</p>
                        <p className="text-slate-300 mt-0.5">{z.note}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Time labels */}
                <div className="flex justify-between mt-1">
                  <span className="text-[10px] text-slate-400">0:00</span>
                  {dynamicScores.length > 0 && (
                    <span className="text-[10px] text-slate-400">
                      {dynamicScores[dynamicScores.length - 1].zone.split("-")[1]}
                    </span>
                  )}
                </div>
              </div>

              {/* ── AI Summary ────────────────────────────── */}
              {analysis && (
                <div className="bg-violet-50/50 border border-violet-200 rounded-xl px-5 py-3">
                  <p className="text-sm text-violet-800 leading-relaxed">{analysis.analysis}</p>
                  <div className="flex items-center gap-4 mt-2 pt-2 border-t border-violet-200/50">
                    <span className="text-[11px] text-slate-400">Legende :</span>
                    <span className="text-[11px] text-red-500 line-through">Retirer</span>
                    <span className="text-[11px] text-emerald-700 bg-emerald-100 px-1 rounded">Ajouter</span>
                    <span className="text-[11px] text-violet-500 ml-auto">{analysis.model_used}</span>
                  </div>
                </div>
              )}

              {/* ── Transcript body ───────────────────────── */}
              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                <div className="max-h-[70vh] overflow-y-auto">
                  {paragraphs.map((para, pi) => {
                    const paraStart = para[0].startSec;

                    // Find zone score for this paragraph
                    const zoneIdx = Math.floor(paraStart / 30);
                    const zoneScore = dynamicScores[zoneIdx]?.score ?? 50;

                    return (
                      <div
                        key={pi}
                        className="flex border-b border-slate-50 last:border-b-0"
                      >
                        {/* Gutter: time + quality indicator */}
                        <div className="flex-shrink-0 w-16 py-4 px-2 border-r border-slate-100 flex flex-col items-center gap-1.5">
                          <span className="text-[11px] font-mono text-slate-400">
                            {fmt(paraStart)}
                          </span>
                          <div
                            className={`w-3 h-3 rounded-full transition-colors duration-500 ${zoneBarColor(zoneScore)}`}
                            title={`Score: ${zoneScore}/100`}
                          />
                        </div>

                        {/* Text */}
                        <div className="flex-1 py-4 px-5">
                          <div className="text-[15px] text-slate-800 leading-[1.9]">
                            {para.map((seg) => {
                              const edit = analysis ? editMap.get(seg.index) : undefined;
                              const isApplied = appliedEdits.has(seg.index);

                              // Applied edit: show only the new text (no red/green)
                              if (edit && isApplied) {
                                if (edit.type === "replace") {
                                  return (
                                    <span key={seg.index}>
                                      <span className="text-slate-800">{edit.new_text}</span>{" "}
                                    </span>
                                  );
                                }
                                return (
                                  <span key={seg.index}>
                                    <span>{seg.text} </span>
                                    <span className="text-slate-800">{edit.new_text} </span>
                                  </span>
                                );
                              }

                              // Pending edit: show red/green + validate button
                              if (edit && edit.type === "replace") {
                                return (
                                  <span key={seg.index} className="relative">
                                    <span className="text-red-500/80 line-through decoration-red-300 bg-red-50/70 px-0.5 rounded-sm">
                                      {seg.text}
                                    </span>
                                    {" "}
                                    <InlineEdit edit={edit} onApply={() => applyEdit(seg.index)} />
                                    {" "}
                                  </span>
                                );
                              }

                              if (edit && edit.type === "insert_after") {
                                return (
                                  <span key={seg.index}>
                                    <span>{seg.text} </span>
                                    <InlineEdit edit={edit} onApply={() => applyEdit(seg.index)} />
                                    {" "}
                                  </span>
                                );
                              }

                              return <span key={seg.index}>{seg.text} </span>;
                            })}
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {/* Fallback plain text */}
                  {data && data.segments.length === 0 && data.transcript_text && (
                    <div className="p-6">
                      <p className="text-[15px] text-slate-800 leading-[1.9] whitespace-pre-wrap">
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

/* ── InlineEdit ──────────────────────────────────────────── */

function InlineEdit({ edit, onApply }: { edit: Edit; onApply: () => void }) {
  const style = hookStyle(edit.hook_type);
  const [showReason, setShowReason] = useState(false);

  return (
    <span className="inline">
      {/* Hook badge */}
      <span
        className={`inline-flex items-center px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded mr-0.5 align-middle cursor-help ${style.bg} ${style.text} border ${style.border}`}
        onMouseEnter={() => setShowReason(true)}
        onMouseLeave={() => setShowReason(false)}
      >
        {edit.hook_type}
        {/* Tooltip */}
        {showReason && edit.reason && (
          <span className="absolute bottom-full left-0 mb-1 w-60 p-2 bg-slate-900 text-white text-xs rounded-lg shadow-xl z-30 leading-relaxed normal-case tracking-normal font-normal">
            {edit.reason}
          </span>
        )}
      </span>
      {/* New text in green */}
      <span className="text-emerald-800 bg-emerald-100/70 px-0.5 rounded-sm">
        {edit.new_text}
      </span>
      {/* Validate button */}
      <button
        onClick={onApply}
        className="inline-flex items-center ml-1 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded transition-colors align-middle"
        title="Appliquer cet edit"
      >
        Valider
      </button>
    </span>
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
      const first = current[0];
      if (seg.startSec - first.startSec >= intervalSec) {
        groups.push([seg]);
      } else {
        current.push(seg);
      }
    }
  }
  return groups;
}

function zoneBarColor(score: number): string {
  if (score >= 80) return "bg-emerald-500";
  if (score >= 65) return "bg-emerald-400";
  if (score >= 50) return "bg-amber-400";
  if (score >= 35) return "bg-orange-400";
  return "bg-red-500";
}

function scoreColor(score: number): string {
  if (score >= 70) return "text-emerald-600";
  if (score >= 50) return "text-amber-600";
  return "text-red-600";
}

function parseZoneStart(zone: string): number {
  const parts = zone.split("-")[0].trim().split(":");
  return parseInt(parts[0]) * 60 + parseInt(parts[1] ?? "0");
}

function fmt(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.round(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}
