// src/app/admin/(protected)/seo-report/_components/ProgressPipeline.tsx
"use client";
import type { PipelineState, PipelineStep } from "@/types/seo-report";

const STEPS: { key: PipelineStep; label: string }[] = [
  { key: "pagespeed",    label: "Performance" },
  { key: "onpage",       label: "On-page" },
  { key: "authority",    label: "Autorité" },
  { key: "competitors",  label: "Concurrents" },
  { key: "ai-insights",  label: "Analyse IA" },
];

interface ProgressPipelineProps {
  state: PipelineState;
}

export default function ProgressPipeline({ state }: ProgressPipelineProps) {
  const doneCount = STEPS.filter((s) => state[s.key] === "done").length;
  const progress = Math.round((doneCount / STEPS.length) * 100);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-indigo-500 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="text-xs text-slate-500 w-10 text-right">{progress}%</span>
      </div>
      <div className="flex gap-2 flex-wrap">
        {STEPS.map((step) => {
          const status = state[step.key];
          return (
            <div
              key={step.key}
              className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border transition-colors ${
                status === "done"    ? "bg-emerald-50 border-emerald-200 text-emerald-700" :
                status === "loading" ? "bg-indigo-50 border-indigo-200 text-indigo-700" :
                status === "error"   ? "bg-red-50 border-red-200 text-red-600" :
                                       "bg-slate-50 border-slate-200 text-slate-400"
              }`}
            >
              {status === "done"    && <span>✓</span>}
              {status === "loading" && <span className="inline-block w-2.5 h-2.5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />}
              {status === "error"   && <span>✗</span>}
              {status === "pending" && <span className="inline-block w-1.5 h-1.5 rounded-full bg-slate-300" />}
              {step.label}
            </div>
          );
        })}
      </div>
    </div>
  );
}
