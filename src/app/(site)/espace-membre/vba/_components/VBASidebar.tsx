"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, CheckCircle2, Circle, Play, Hourglass } from "lucide-react";

interface Module {
  id: string;
  title: string;
  slug: string;
  order: number;
  section?: string;
}

interface Lesson {
  id: string;
  module_id: string;
  title: string;
  slug: string;
  duration_seconds: number | null;
  order: number;
  bunny_video_id?: string | null;
  description?: string | null;
}

interface SidebarProps {
  modules: Module[];
  lessons: Lesson[];
  completedLessonIds: Set<string>;
  currentLessonId: string;
  currentModuleSlug: string;
  totalLessons: number;
  completedCount: number;
}

function formatDuration(seconds: number | null): string {
  if (!seconds) return "";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function VBASidebar({
  modules,
  lessons,
  completedLessonIds,
  currentLessonId,
  currentModuleSlug,
  totalLessons,
  completedCount,
}: SidebarProps) {
  // Open the current module by default
  const [openModules, setOpenModules] = useState<Set<string>>(() => {
    const currentModule = modules.find((m) => m.slug === currentModuleSlug);
    return new Set(currentModule ? [currentModule.id] : []);
  });

  const toggleModule = (moduleId: string) => {
    setOpenModules((prev) => {
      const next = new Set(prev);
      if (next.has(moduleId)) {
        next.delete(moduleId);
      } else {
        next.add(moduleId);
      }
      return next;
    });
  };

  const progressPercent =
    totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

  return (
    <aside className="w-full lg:w-[340px] flex-shrink-0 bg-white lg:border-r border-slate-100 overflow-y-auto">
      {/* Progression globale */}
      <div className="p-4 border-b border-slate-100">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
          Progression
        </p>
        <div className="flex items-center gap-2 mb-1">
          <div className="flex-1 bg-slate-100 rounded-full h-1.5">
            <div
              className="h-1.5 rounded-full transition-all"
              style={{
                width: `${progressPercent}%`,
                background:
                  "linear-gradient(135deg, var(--gold) 0%, var(--gold-light) 100%)",
              }}
            />
          </div>
          <span className="text-xs text-slate-500 flex-shrink-0">
            {completedCount}/{totalLessons}
          </span>
        </div>
      </div>

      {/* Modules accordion with section headers */}
      <div className="py-2">
        {(() => {
          let lastSection = "";
          return modules.map((mod) => {
            const modLessons = lessons
              .filter((l) => l.module_id === mod.id)
              .sort((a, b) => a.order - b.order);
            const isOpen = openModules.has(mod.id);
            const availableLessons = modLessons.filter((l) => l.bunny_video_id);
            const hasLessons = modLessons.length > 0;
            const moduleNumber = mod.title.match(/Module (\d+)/)?.[1] ?? "";
            const moduleSubtitle = mod.title.replace(/^Module \d+\s*[—–-]\s*/, "");
            const allCompleted = availableLessons.length > 0 && availableLessons.every((l) => completedLessonIds.has(l.id));

            // Section header
            const section = mod.section ?? "vasp";
            let sectionHeader = null;
            if (section !== lastSection) {
              lastSection = section;
              sectionHeader = (
                <div key={`section-${section}`} className="px-4 pt-4 pb-2">
                  <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: section === "vasp" ? "var(--gold)" : "#3B82F6" }}>
                    {section === "vasp" ? "Projet VASP" : "Projet non VASP"}
                  </p>
                </div>
              );
            }

            return (
              <div key={mod.id}>
                {sectionHeader}
                <button
                  onClick={() => hasLessons && toggleModule(mod.id)}
                  className={`w-full flex items-center gap-2.5 px-4 py-3 text-left transition-colors ${hasLessons ? "hover:bg-slate-50/60" : "opacity-50 cursor-default"}`}
                >
                  {hasLessons ? (
                    <ChevronDown
                      className={`w-4 h-4 text-slate-400 transition-transform flex-shrink-0 ${isOpen ? "" : "-rotate-90"}`}
                    />
                  ) : (
                    <Circle className="w-4 h-4 text-slate-200 flex-shrink-0" />
                  )}
                  <div className="flex-1 leading-snug">
                    <span className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                      {moduleNumber ? `Module ${section === "non_vasp" ? mod.order - 20 : mod.order}` : moduleSubtitle}
                      {allCompleted && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 inline-block" />}
                    </span>
                    {moduleNumber && (
                      <span className="text-xs text-slate-500 block">{moduleSubtitle}</span>
                    )}
                    {!hasLessons && (
                      <span className="text-[10px] text-amber-500 font-medium block mt-0.5">Arrive très prochainement</span>
                    )}
                  </div>
                </button>

                {isOpen && hasLessons && (
                  <div className="pb-1">
                    {modLessons.map((lesson) => {
                      const isCompleted = completedLessonIds.has(lesson.id);
                      const isCurrent = lesson.id === currentLessonId;
                      const isQuiz = lesson.description?.startsWith("QUIZ:");
                      const isComingSoon = !lesson.bunny_video_id && !isQuiz;

                      if (isComingSoon) {
                        return (
                          <div
                            key={lesson.id}
                            className="flex items-center gap-2 pl-10 pr-4 py-2 text-sm opacity-40 cursor-default"
                          >
                            <Hourglass className="w-4 h-4 text-amber-400 flex-shrink-0" />
                            <span className="flex-1 leading-snug text-slate-400">{lesson.title}</span>
                            <span className="text-[10px] text-amber-500 font-medium flex-shrink-0">Bientôt disponible</span>
                          </div>
                        );
                      }

                      return (
                        <Link
                          key={lesson.id}
                          href={`/espace-membre/vba/${mod.slug}/${lesson.slug}`}
                          className={`flex items-center gap-2 pl-10 pr-4 py-2 text-sm transition-colors ${
                            isCurrent
                              ? "bg-amber-50 text-slate-900 font-medium"
                              : "text-slate-600 hover:bg-slate-50"
                          }`}
                        >
                          {isCompleted ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                          ) : isCurrent ? (
                            <Play className="w-4 h-4 text-amber-600 flex-shrink-0" />
                          ) : (
                            <Circle className="w-4 h-4 text-slate-300 flex-shrink-0" />
                          )}
                          <span className="flex-1 leading-snug">{lesson.title}</span>
                          {lesson.duration_seconds && (
                            <span className="text-xs text-slate-400 flex-shrink-0">
                              {formatDuration(lesson.duration_seconds)}
                            </span>
                          )}
                        </Link>
                      );
                    })}

                    {/* PDF recap */}
                    <a
                      href={`/vba/pdf/vba-module-${mod.order}-recap.pdf`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 pl-10 pr-4 py-2 text-sm hover:bg-amber-50/40 transition-colors"
                    >
                      <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                        <line x1="12" y1="18" x2="12" y2="12" />
                        <polyline points="9 15 12 18 15 15" />
                      </svg>
                      <span className="flex-1 leading-snug" style={{ color: "var(--gold)" }}>
                        Fiche recap
                      </span>
                      <span className="text-xs text-slate-400 flex-shrink-0">PDF</span>
                    </a>
                  </div>
                )}
              </div>
            );
          });
        })()}
      </div>
    </aside>
  );
}
