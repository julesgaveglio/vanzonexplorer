"use client";

import { useState, useEffect } from "react";

interface Segment {
  index: number;
  startSec: number;
  endSec: number;
  startLabel: string;
  endLabel: string;
  text: string;
}

interface TranscriptData {
  version: { id: string; name: string };
  transcript_text: string;
  segments: Segment[];
}

interface VSLVersion {
  id: string;
  name: string;
  is_active: boolean;
}

export default function SigmaTranscriptClient() {
  const [versions, setVersions] = useState<VSLVersion[]>([]);
  const [selectedVersion, setSelectedVersion] = useState("");
  const [data, setData] = useState<TranscriptData | null>(null);
  const [loading, setLoading] = useState(false);

  // Upload
  const [showUpload, setShowUpload] = useState(false);
  const [srtInput, setSrtInput] = useState("");
  const [saving, setSaving] = useState(false);

  // Fetch versions
  useEffect(() => {
    fetch("/api/sigma/vsl")
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
    fetch(`/api/sigma/vsl/transcript?versionId=${selectedVersion}`)
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        if (!d.segments?.length && !d.transcript_text) setShowUpload(true);
        else setShowUpload(false);
      })
      .finally(() => setLoading(false));
  }, [selectedVersion]);

  async function handleSave() {
    if (!srtInput.trim() || !selectedVersion) return;
    setSaving(true);
    try {
      const isSRT = /\d{2}:\d{2}:\d{2}[,.]\d{3}\s*-->/.test(srtInput);
      await fetch("/api/sigma/vsl/transcript", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          versionId: selectedVersion,
          ...(isSRT ? { transcript_srt: srtInput } : { transcript_text: srtInput }),
        }),
      });
      const res = await fetch(`/api/sigma/vsl/transcript?versionId=${selectedVersion}`);
      setData(await res.json());
      setShowUpload(false);
      setSrtInput("");
    } finally {
      setSaving(false);
    }
  }

  const hasTranscript = data && (data.segments.length > 0 || data.transcript_text);
  const paragraphs = groupIntoParagraphs(data?.segments ?? [], 30);

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Transcript VSL</h1>
          <p className="text-sm text-slate-500 mt-1">
            {data?.segments.length ?? 0} segments — {data?.version?.name ?? ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={selectedVersion}
            onChange={(e) => setSelectedVersion(e.target.value)}
            className="bg-white border border-slate-200 text-sm text-slate-700 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#B9945F]/30"
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
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#B9945F]" />
        </div>
      ) : (
        <>
          {/* Upload */}
          {showUpload && (
            <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
              <p className="text-sm font-medium text-slate-700">Coller le transcript (SRT ou texte brut)</p>
              <textarea
                value={srtInput}
                onChange={(e) => setSrtInput(e.target.value)}
                placeholder={`1\n00:00:00,000 --> 00:00:05,000\nBonjour, bienvenue...`}
                className="w-full h-48 px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-sm font-mono resize-none focus:outline-none focus:ring-2 focus:ring-[#B9945F]/30 placeholder:text-slate-300"
              />
              <div className="flex justify-end">
                <button
                  onClick={handleSave}
                  disabled={saving || !srtInput.trim()}
                  className="px-4 py-2 bg-[#B9945F] hover:opacity-90 disabled:bg-slate-200 disabled:text-slate-400 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  {saving ? "..." : "Enregistrer"}
                </button>
              </div>
            </div>
          )}

          {hasTranscript && (
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
              <div className="max-h-[70vh] overflow-y-auto">
                {paragraphs.map((para, pi) => {
                  const paraStart = para[0].startSec;
                  return (
                    <div key={pi} className="flex border-b border-slate-50 last:border-b-0">
                      <div className="flex-shrink-0 w-16 py-4 px-2 border-r border-slate-100 flex flex-col items-center">
                        <span className="text-[11px] font-mono text-slate-400">
                          {fmt(paraStart)}
                        </span>
                      </div>
                      <div className="flex-1 py-4 px-5">
                        <div className="text-[15px] text-slate-800 leading-[1.9]">
                          {para.map((seg) => (
                            <span key={seg.index}>{seg.text} </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {data && data.segments.length === 0 && data.transcript_text && (
                  <div className="p-6">
                    <p className="text-[15px] text-slate-800 leading-[1.9] whitespace-pre-wrap">
                      {data.transcript_text}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

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

function fmt(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.round(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}
