"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ChevronDown, CheckCircle2, Circle, Play,
  Clapperboard, Search, Ruler, Hammer, Zap, ClipboardList, Wallet, FileCheck,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

const MODULE_ICONS: Record<number, LucideIcon> = {
  1: Clapperboard,
  2: Search,
  3: Ruler,
  4: Hammer,
  5: Zap,
  6: ClipboardList,
  7: Wallet,
  8: FileCheck,
};

interface Module {
  id: string;
  title: string;
  slug: string;
  order: number;
}

interface Lesson {
  id: string;
  module_id: string;
  title: string;
  slug: string;
  duration_seconds: number | null;
  order: number;
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
    <aside className="w-[340px] flex-shrink-0 bg-white border-r border-slate-100 overflow-y-auto">
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
                  "linear-gradient(135deg, #B9945F 0%, #E4D398 100%)",
              }}
            />
          </div>
          <span className="text-xs text-slate-500 flex-shrink-0">
            {completedCount}/{totalLessons}
          </span>
        </div>
      </div>

      {/* Modules accordion */}
      <div className="py-2">
        {modules.map((mod) => {
          const modLessons = lessons
            .filter((l) => l.module_id === mod.id)
            .sort((a, b) => a.order - b.order);
          const isOpen = openModules.has(mod.id);

          const Icon = MODULE_ICONS[mod.order] ?? Clapperboard;

          return (
            <div key={mod.id}>
              <button
                onClick={() => toggleModule(mod.id)}
                className="w-full flex items-center gap-2.5 px-4 py-3 text-left hover:bg-slate-50 transition-colors"
              >
                <ChevronDown
                  className={`w-4 h-4 text-slate-400 transition-transform flex-shrink-0 ${
                    isOpen ? "" : "-rotate-90"
                  }`}
                />
                <Icon className="w-4 h-4 flex-shrink-0" style={{ color: "#B9945F" }} />
                <span className="text-sm font-medium text-slate-700 flex-1 leading-snug">
                  {mod.title}
                </span>
              </button>

              {isOpen && (
                <div className="pb-1">
                  {modLessons.map((lesson) => {
                    const isCompleted = completedLessonIds.has(lesson.id);
                    const isCurrent = lesson.id === currentLessonId;

                    return (
                      <Link
                        key={lesson.id}
                        href={`/dashboard/vba/${mod.slug}/${lesson.slug}`}
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
                </div>
              )}
            </div>
          );
        })}
      </div>
    </aside>
  );
}
