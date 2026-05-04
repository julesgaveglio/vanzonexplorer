"use client";

import { useState } from "react";

interface Formation {
  id: string;
  name: string;
  slug: string;
  emoji: string;
  price_cents: number;
  is_published: boolean;
}

interface AccessRow {
  id: string;
  clerk_id: string;
  formation_id: string;
  created_at: string;
}

interface Profile {
  clerk_id: string;
  email: string | null;
  full_name: string | null;
  plan: string | null;
}

interface ProgressRow {
  user_id: string;
  lesson_id: string;
  completed: boolean;
  completed_at: string | null;
}

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
  order: number;
  duration_seconds: number | null;
}

interface FormationModule {
  formation_id: string;
  module_id: string;
  display_order: number;
  is_locked: boolean;
}

interface PromoCode {
  id: string;
  code: string;
  formation_id: string;
  discount_percent: number;
  is_active: boolean;
  uses_count: number;
  max_uses: number | null;
}

interface Props {
  formations: Formation[];
  accessRows: AccessRow[];
  profiles: Profile[];
  vbaMembers: Profile[];
  progress: ProgressRow[];
  modules: Module[];
  lessons: Lesson[];
  formationModules: FormationModule[];
  promoCodes: PromoCode[];
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDuration(seconds: number | null) {
  if (!seconds) return "";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function FormationAccessClient({
  formations,
  accessRows,
  profiles,
  vbaMembers,
  progress,
  modules,
  lessons,
  formationModules,
  promoCodes,
}: Props) {
  const [selectedFormation, setSelectedFormation] = useState<string | null>(null);
  const [expandedUser, setExpandedUser] = useState<string | null>(null);

  const profileMap = new Map(profiles.map((p) => [p.clerk_id, p]));
  for (const m of vbaMembers) {
    if (!profileMap.has(m.clerk_id)) profileMap.set(m.clerk_id, m);
  }

  // Build formation data
  const formationData = formations.map((f) => {
    const users = accessRows
      .filter((a) => a.formation_id === f.id)
      .map((a) => ({
        ...a,
        profile: profileMap.get(a.clerk_id),
      }));
    const codes = promoCodes.filter((c) => c.formation_id === f.id);
    const fModules = formationModules
      .filter((fm) => fm.formation_id === f.id)
      .sort((a, b) => a.display_order - b.display_order);

    return { ...f, users, codes, fModules };
  });

  // VBA members
  const vbaMemberList = vbaMembers.map((m) => ({
    profile: m,
    clerk_id: m.clerk_id,
  }));

  // Get user progress for a specific set of module IDs
  function getUserProgress(userId: string, moduleIds: string[]) {
    const relevantLessons = lessons.filter((l) => moduleIds.includes(l.module_id));
    const userProgress = progress.filter((p) => p.user_id === userId);
    const completedSet = new Set(
      userProgress.filter((p) => p.completed).map((p) => p.lesson_id)
    );

    const total = relevantLessons.length;
    const completed = relevantLessons.filter((l) => completedSet.has(l.id)).length;
    const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

    // Last activity
    const lastActivity = userProgress
      .filter((p) => p.completed && p.completed_at)
      .sort((a, b) => (b.completed_at ?? "").localeCompare(a.completed_at ?? ""))
      [0]?.completed_at;

    return { total, completed, pct, completedSet, lastActivity };
  }

  return (
    <div className="space-y-6">
      {/* VBA Members */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="font-bold text-slate-900">Van Business Academy</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {vbaMemberList.length} membre{vbaMemberList.length > 1 ? "s" : ""}
            </p>
          </div>
        </div>

        {vbaMemberList.length === 0 ? (
          <div className="px-5 py-8 text-center text-sm text-slate-400">
            Aucun membre VBA
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {vbaMemberList.map(({ profile: p, clerk_id }) => {
              const allModuleIds = modules.map((m) => m.id);
              const prog = getUserProgress(clerk_id, allModuleIds);
              const isExpanded = expandedUser === `vba-${clerk_id}`;

              return (
                <div key={clerk_id}>
                  <button
                    onClick={() =>
                      setExpandedUser(isExpanded ? null : `vba-${clerk_id}`)
                    }
                    className="w-full px-5 py-3 flex items-center gap-4 hover:bg-slate-50 transition-colors text-left"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">
                        {p.full_name || "—"}
                      </p>
                      <p className="text-xs text-slate-500 truncate">
                        {p.email || "—"}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <div className="w-24 bg-slate-100 rounded-full h-1.5">
                        <div
                          className="h-1.5 rounded-full bg-emerald-500 transition-all"
                          style={{ width: `${prog.pct}%` }}
                        />
                      </div>
                      <span className="text-xs text-slate-500 w-16 text-right">
                        {prog.completed}/{prog.total}
                      </span>
                    </div>
                  </button>

                  {isExpanded && (
                    <UserProgressDetail
                      modules={modules}
                      lessons={lessons}
                      completedSet={prog.completedSet}
                      lastActivity={prog.lastActivity}
                    />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Formations */}
      {formationData.map((f) => {
        const isSelected = selectedFormation === f.id;
        const unlockedModuleIds = f.fModules
          .filter((fm) => !fm.is_locked)
          .map((fm) => fm.module_id);

        return (
          <div
            key={f.id}
            className="bg-white rounded-2xl border border-slate-200 overflow-hidden"
          >
            <button
              onClick={() =>
                setSelectedFormation(isSelected ? null : f.id)
              }
              className="w-full px-5 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors text-left"
            >
              <div>
                <h2 className="font-bold text-slate-900">{f.name}</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  {f.users.length} utilisateur{f.users.length > 1 ? "s" : ""} ·{" "}
                  {(f.price_cents / 100).toFixed(0)}€
                </p>
              </div>
              <div className="flex items-center gap-3">
                {f.codes.map((c) => (
                  <span
                    key={c.id}
                    className={`text-xs font-mono px-2 py-1 rounded-lg ${
                      c.is_active
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-slate-100 text-slate-400 line-through"
                    }`}
                  >
                    {c.code} ({c.uses_count}
                    {c.max_uses ? `/${c.max_uses}` : ""})
                  </span>
                ))}
                <svg
                  className={`w-4 h-4 text-slate-400 transition-transform ${isSelected ? "rotate-180" : ""}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>
            </button>

            {isSelected && (
              <div className="border-t border-slate-100">
                {f.users.length === 0 ? (
                  <div className="px-5 py-8 text-center text-sm text-slate-400">
                    Aucun utilisateur
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {f.users.map((u) => {
                      const prog = getUserProgress(
                        u.clerk_id,
                        unlockedModuleIds
                      );
                      const isExpanded =
                        expandedUser === `${f.id}-${u.clerk_id}`;

                      return (
                        <div key={u.id}>
                          <button
                            onClick={() =>
                              setExpandedUser(
                                isExpanded
                                  ? null
                                  : `${f.id}-${u.clerk_id}`
                              )
                            }
                            className="w-full px-5 py-3 flex items-center gap-4 hover:bg-slate-50 transition-colors text-left"
                          >
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-slate-900 truncate">
                                {u.profile?.full_name || "—"}
                              </p>
                              <p className="text-xs text-slate-500 truncate">
                                {u.profile?.email || "—"} · inscrit le{" "}
                                {formatDate(u.created_at)}
                              </p>
                            </div>
                            <div className="flex items-center gap-3 flex-shrink-0">
                              <div className="w-24 bg-slate-100 rounded-full h-1.5">
                                <div
                                  className="h-1.5 rounded-full bg-emerald-500 transition-all"
                                  style={{ width: `${prog.pct}%` }}
                                />
                              </div>
                              <span className="text-xs text-slate-500 w-16 text-right">
                                {prog.completed}/{prog.total}
                              </span>
                            </div>
                          </button>

                          {isExpanded && (
                            <UserProgressDetail
                              modules={modules.filter((m) =>
                                unlockedModuleIds.includes(m.id)
                              )}
                              lessons={lessons.filter((l) =>
                                unlockedModuleIds.includes(l.module_id)
                              )}
                              completedSet={prog.completedSet}
                              lastActivity={prog.lastActivity}
                              formationModules={f.fModules}
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ─── User Progress Detail ─────────────────────────────────── */

function UserProgressDetail({
  modules,
  lessons,
  completedSet,
  lastActivity,
  formationModules,
}: {
  modules: Module[];
  lessons: Lesson[];
  completedSet: Set<string>;
  lastActivity: string | null | undefined;
  formationModules?: FormationModule[];
}) {
  // Sort modules by formation display_order if available, else by order
  const fmMap = new Map(
    (formationModules ?? []).map((fm) => [fm.module_id, fm])
  );
  const sortedModules = [...modules].sort((a, b) => {
    const aOrder = fmMap.get(a.id)?.display_order ?? a.order;
    const bOrder = fmMap.get(b.id)?.display_order ?? b.order;
    return aOrder - bOrder;
  });

  return (
    <div className="px-5 py-4 bg-slate-50 border-t border-slate-100">
      {lastActivity && (
        <p className="text-xs text-slate-400 mb-3">
          Dernière activité : {formatDate(lastActivity)}
        </p>
      )}

      <div className="space-y-3">
        {sortedModules.map((mod) => {
          const fm = fmMap.get(mod.id);
          const displayOrder = fm?.display_order ?? mod.order;
          const modLessons = lessons
            .filter((l) => l.module_id === mod.id)
            .sort((a, b) => a.order - b.order);
          const modCompleted = modLessons.filter((l) =>
            completedSet.has(l.id)
          ).length;

          return (
            <div key={mod.id}>
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-xs font-semibold text-slate-700">
                  Module {displayOrder} —{" "}
                  {mod.title.replace(/^Module \d+\s*[—–-]\s*/, "")}
                </p>
                <span className="text-xs text-slate-400">
                  {modCompleted}/{modLessons.length}
                </span>
              </div>
              <div className="flex flex-wrap gap-1">
                {modLessons.map((lesson) => {
                  const done = completedSet.has(lesson.id);
                  return (
                    <div
                      key={lesson.id}
                      title={`${lesson.title}${lesson.duration_seconds ? ` (${formatDuration(lesson.duration_seconds)})` : ""}`}
                      className={`w-7 h-2 rounded-full transition-all ${
                        done ? "bg-emerald-500" : "bg-slate-200"
                      }`}
                    />
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
