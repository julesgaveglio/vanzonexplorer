"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronDown, CheckCircle2, Circle, Play, Lock } from "lucide-react";

const MODULE_ICONS: Record<number, string> = {
  7: "/icons/vba-emoji-7.png",
  8: "/icons/vba-emoji-8.png",
  9: "/icons/vba-emoji-9.png",
  10: "/icons/vba-emoji-10.png",
};

interface Module {
  id: string;
  title: string;
  slug: string;
  order: number;
  display_order: number;
  is_locked: boolean;
}

interface Lesson {
  id: string;
  module_id: string;
  title: string;
  slug: string;
  duration_seconds: number | null;
  order: number;
}

interface FormationSidebarProps {
  formationSlug: string;
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

export default function FormationSidebar({
  formationSlug,
  modules,
  lessons,
  completedLessonIds,
  currentLessonId,
  currentModuleSlug,
  totalLessons,
  completedCount,
}: FormationSidebarProps) {
  const [openModules, setOpenModules] = useState<Set<string>>(() => {
    const currentModule = modules.find((m) => m.slug === currentModuleSlug);
    return new Set(currentModule ? [currentModule.id] : []);
  });

  const toggleModule = (moduleId: string) => {
    setOpenModules((prev) => {
      const next = new Set(prev);
      if (next.has(moduleId)) next.delete(moduleId);
      else next.add(moduleId);
      return next;
    });
  };

  const progressPercent =
    totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;
  const basePath = `/dashboard/formations/${formationSlug}`;

  return (
    <aside className="w-full lg:w-[340px] flex-shrink-0 bg-white lg:border-r border-slate-100 overflow-y-auto">
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

      <div className="py-2">
        {modules.map((mod) => {
          const modLessons = lessons
            .filter((l) => l.module_id === mod.id)
            .sort((a, b) => a.order - b.order);
          const isOpen = openModules.has(mod.id);
          const iconSrc = MODULE_ICONS[mod.order];

          return (
            <div key={mod.id}>
              <button
                onClick={() => toggleModule(mod.id)}
                className="w-full flex items-center gap-2.5 px-4 py-3 text-left hover:bg-slate-50/60 transition-colors"
              >
                <ChevronDown
                  className={`w-4 h-4 text-slate-400 transition-transform flex-shrink-0 ${isOpen ? "" : "-rotate-90"}`}
                />
                {iconSrc && (
                  <Image
                    src={iconSrc}
                    alt=""
                    width={18}
                    height={18}
                    className="w-[18px] h-[18px] flex-shrink-0"
                    unoptimized
                  />
                )}
                <div className="flex-1 leading-snug">
                  <span className="text-sm font-bold text-slate-800 block">
                    Module {mod.display_order}
                    {mod.is_locked && (
                      <Lock className="w-3 h-3 inline ml-1.5 text-red-400" />
                    )}
                  </span>
                  <span className="text-xs text-slate-500">
                    {mod.title.replace(/^Module \d+\s*[—–-]\s*/, "")}
                  </span>
                </div>
              </button>

              {isOpen && (
                <div className="pb-1">
                  {modLessons.map((lesson) => {
                    if (mod.is_locked) {
                      return (
                        <div
                          key={lesson.id}
                          className="flex items-center gap-2 pl-10 pr-4 py-2 text-sm text-slate-400 cursor-not-allowed"
                        >
                          <span className="w-4 h-4 flex-shrink-0 text-red-400 text-xs font-bold flex items-center justify-center">
                            ✕
                          </span>
                          <span className="flex-1 leading-snug">
                            {lesson.title}
                          </span>
                          {lesson.duration_seconds && (
                            <span className="text-xs text-slate-300 flex-shrink-0">
                              {formatDuration(lesson.duration_seconds)}
                            </span>
                          )}
                        </div>
                      );
                    }

                    const isCompleted = completedLessonIds.has(lesson.id);
                    const isCurrent = lesson.id === currentLessonId;

                    return (
                      <Link
                        key={lesson.id}
                        href={`${basePath}/${mod.slug}/${lesson.slug}`}
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
                        <span className="flex-1 leading-snug">
                          {lesson.title}
                        </span>
                        {lesson.duration_seconds && (
                          <span className="text-xs text-slate-400 flex-shrink-0">
                            {formatDuration(lesson.duration_seconds)}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </aside>
  );
}
