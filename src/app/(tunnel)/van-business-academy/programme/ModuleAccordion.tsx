"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import type { Module } from "./page";

const TAG_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  quiz: { bg: "rgba(168,85,247,0.08)", text: "#A855F7", label: "Quiz" },
  pdf: { bg: "rgba(239,68,68,0.08)", text: "#EF4444", label: "PDF" },
  bonus: { bg: "rgba(16,185,129,0.08)", text: "#10B981", label: "Bonus" },
  outil: { bg: "rgba(245,158,11,0.08)", text: "#F59E0B", label: "Outil" },
  nouveau: { bg: "rgba(185,148,95,0.08)", text: "#B9945F", label: "Nouveau" },
  filmé: { bg: "rgba(16,185,129,0.08)", text: "#10B981", label: "Filmé ✓" },
};

export default function ModuleAccordion({ modules, isBonusSection }: { modules: Module[]; isBonusSection?: boolean }) {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <div className="space-y-3">
      {modules.map((mod) => {
        const isOpen = open === mod.number;
        const modMinutes = mod.estimatedMinutes ?? mod.lessons.reduce((s, l) => s + (l.duration ?? 0), 0);
        const modHours = Math.floor(modMinutes / 60);
        const modRemMin = modMinutes % 60;
        const timeLabel = modHours > 0
          ? `~${modHours}h${modRemMin > 0 ? modRemMin.toString().padStart(2, "0") : ""}`
          : `~${modMinutes} min`;

        return (
          <div
            key={mod.number}
            className="rounded-2xl overflow-hidden bg-white border border-slate-100 shadow-sm transition-shadow hover:shadow-md"
          >
            {/* Header — clickable */}
            <button
              onClick={() => setOpen(isOpen ? null : mod.number)}
              className="w-full text-left p-5 sm:p-6 flex items-start gap-4 cursor-pointer"
            >
              <span className="text-2xl sm:text-3xl flex-shrink-0 mt-0.5">{mod.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "#B9945F" }}>
                    {isBonusSection ? "Bonus" : `Module ${mod.number}`}
                  </span>
                  {mod.badge && (
                    <span
                      className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                      style={{
                        background: mod.badge === "EN TOURNAGE"
                          ? "rgba(245,158,11,0.10)"
                          : mod.badge === "NOUVEAU"
                            ? "rgba(16,185,129,0.10)"
                            : mod.badge === "BONUS"
                              ? "rgba(185,148,95,0.10)"
                              : "rgba(185,148,95,0.10)",
                        color: mod.badge === "EN TOURNAGE"
                          ? "#F59E0B"
                          : mod.badge === "NOUVEAU"
                            ? "#10B981"
                            : "#B9945F",
                      }}
                    >
                      {mod.badge === "EN TOURNAGE" ? "🎥 En tournage" : mod.badge}
                    </span>
                  )}
                </div>
                <h2 className="text-base sm:text-lg font-bold text-slate-900 mt-1">{mod.title}</h2>
                <p className="text-sm text-slate-500 mt-1 leading-relaxed">{mod.description}</p>
                <div className="flex items-center gap-3 mt-2">
                  <span className="text-xs text-slate-400 tabular-nums">{mod.lessons.length} leçons</span>
                  {modMinutes > 0 && (
                    <>
                      <span className="text-slate-200">·</span>
                      <span className="text-xs text-slate-400 tabular-nums">{timeLabel}</span>
                    </>
                  )}
                </div>
              </div>
              <ChevronDown
                className={`w-5 h-5 text-slate-400 flex-shrink-0 mt-2 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
              />
            </button>

            {/* Lessons — collapsible */}
            <div
              className="overflow-hidden transition-all duration-300"
              style={{
                maxHeight: isOpen ? `${mod.lessons.length * 48 + (mod.comingSoon ? 64 : 16)}px` : "0px",
                opacity: isOpen ? 1 : 0,
              }}
            >
              <div className="border-t border-slate-50">
                {/* Coming soon banner */}
                {mod.comingSoon && (
                  <div className="px-5 sm:px-6 py-3 flex items-center gap-2" style={{ background: "rgba(245,158,11,0.04)" }}>
                    <span className="text-xs font-medium" style={{ color: "#F59E0B" }}>
                      🎥 Vidéos en cours de tournage — disponibles très prochainement
                    </span>
                  </div>
                )}

                <div className="divide-y divide-slate-50">
                  {mod.lessons.map((lesson, i) => {
                    const tag = lesson.tag ? TAG_STYLES[lesson.tag] : null;
                    return (
                      <div key={i} className="flex items-center gap-3 px-5 sm:px-6 py-3 hover:bg-slate-50/50 transition-colors">
                        <span className="text-xs text-slate-300 w-5 text-right flex-shrink-0 tabular-nums font-mono">
                          {i + 1}
                        </span>
                        <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: "#D4B88C" }} />
                        <span className={`text-sm flex-1 ${mod.comingSoon && !lesson.tag ? "text-slate-400" : "text-slate-700"}`}>
                          {lesson.title}
                        </span>
                        {lesson.duration && !mod.comingSoon && (
                          <span className="text-[11px] text-slate-300 flex-shrink-0 tabular-nums">
                            {lesson.duration} min
                          </span>
                        )}
                        {tag && (
                          <span
                            className="text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0"
                            style={{ background: tag.bg, color: tag.text }}
                          >
                            {tag.label}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
