import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { CheckCircle2, Circle, Play, Lock } from "lucide-react";
import FormationPaywall from "./_components/FormationPaywall";

const MODULE_ICONS: Record<number, string> = {
  7: "/icons/vba-emoji-7.png",
  8: "/icons/vba-emoji-8.png",
  9: "/icons/vba-emoji-9.png",
  10: "/icons/vba-emoji-10.png",
};

const ADMIN_EMAIL = "gavegliojules@gmail.com";

interface VBALesson {
  id: string;
  module_id: string;
  title: string;
  slug: string;
  duration_seconds: number | null;
  order: number;
}

function formatDuration(seconds: number | null): string {
  if (!seconds) return "";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default async function FormationPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const user = await currentUser();
  const email = user?.emailAddresses?.[0]?.emailAddress;
  const supabase = createSupabaseAdmin();

  // Fetch formation
  const { data: formation } = await supabase
    .from("formations")
    .select("id, name, slug, description, price_cents, emoji")
    .eq("slug", slug)
    .eq("is_published", true)
    .single();

  if (!formation) notFound();

  // Check access: admin OR vba_member OR formation_access
  let hasAccess = email === ADMIN_EMAIL;

  if (!hasAccess) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("plan")
      .eq("clerk_id", userId)
      .single();
    if (profile?.plan === "vba_member") hasAccess = true;
  }

  if (!hasAccess) {
    const { data: access } = await supabase
      .from("formation_access")
      .select("id")
      .eq("clerk_id", userId)
      .eq("formation_id", formation.id)
      .single();
    if (access) hasAccess = true;
  }

  if (!hasAccess) {
    return (
      <FormationPaywall
        formationName={formation.name}
        description={formation.description || ""}
        priceCents={formation.price_cents}
        emoji={formation.emoji || "🎓"}
      />
    );
  }

  // Fetch formation modules mapping
  const { data: fmRows } = await supabase
    .from("formation_modules")
    .select("display_order, is_locked, module_id")
    .eq("formation_id", formation.id)
    .order("display_order");

  const moduleIds = (fmRows ?? []).map((fm) => fm.module_id);
  if (moduleIds.length === 0) {
    return (
      <div className="glass-card p-8 text-center">
        <p className="text-slate-500">Aucun module configuré pour cette formation.</p>
      </div>
    );
  }

  // Fetch modules + lessons + progress
  const [modulesRes, lessonsRes, progressRes] = await Promise.all([
    supabase
      .from("vba_modules")
      .select("id, title, slug, description, order")
      .in("id", moduleIds)
      .eq("is_published", true)
      .order("order"),
    supabase
      .from("vba_lessons")
      .select("id, module_id, title, slug, duration_seconds, order")
      .in("module_id", moduleIds)
      .eq("is_published", true)
      .order("order"),
    supabase
      .from("vba_progress")
      .select("lesson_id, completed")
      .eq("user_id", userId),
  ]);

  const modules = modulesRes.data ?? [];
  const lessons = (lessonsRes.data ?? []) as VBALesson[];
  const progress = progressRes.data ?? [];

  // Build formation module map
  const fmMap = new Map(
    (fmRows ?? []).map((fm) => [fm.module_id, fm])
  );

  // Enrich modules with display_order + is_locked
  const enrichedModules = modules
    .map((mod) => {
      const fm = fmMap.get(mod.id);
      return {
        ...mod,
        display_order: fm?.display_order ?? mod.order,
        is_locked: fm?.is_locked ?? false,
      };
    })
    .sort((a, b) => a.display_order - b.display_order);

  const completedSet = new Set(
    progress.filter((p) => p.completed).map((p) => p.lesson_id)
  );

  // Progress counts only unlocked lessons
  const unlockedModuleIds = new Set(
    enrichedModules.filter((m) => !m.is_locked).map((m) => m.id)
  );
  const unlockedLessons = lessons.filter((l) =>
    unlockedModuleIds.has(l.module_id)
  );
  const totalLessons = unlockedLessons.length;
  const completedCount = unlockedLessons.filter((l) =>
    completedSet.has(l.id)
  ).length;
  const progressPercent =
    totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

  return (
    <div className="space-y-4 sm:space-y-8">
      {/* Header + progression */}
      <div className="glass-card p-4 sm:p-6">
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{formation.emoji}</span>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900">
              {formation.name}
            </h2>
          </div>
          <span className="text-xs sm:text-sm text-slate-500">
            {completedCount}/{totalLessons} leçons
          </span>
        </div>
        <div className="w-full bg-slate-200 rounded-full h-2">
          <div
            className="h-2 rounded-full transition-all duration-500"
            style={{
              width: `${progressPercent}%`,
              background:
                "linear-gradient(135deg, #B9945F 0%, #E4D398 100%)",
            }}
          />
        </div>
        <p className="text-xs text-slate-400 mt-2">
          {progressPercent}% complété
        </p>
      </div>

      {/* Liste des modules */}
      <div className="space-y-3 sm:space-y-4">
        {enrichedModules.map((mod) => {
          const modLessons = lessons
            .filter((l) => l.module_id === mod.id)
            .sort((a, b) => a.order - b.order);
          const modCompleted = modLessons.filter((l) =>
            completedSet.has(l.id)
          ).length;
          const firstIncomplete = modLessons.find(
            (l) => !completedSet.has(l.id)
          );
          const iconSrc = MODULE_ICONS[mod.order];

          return (
            <div
              key={mod.id}
              className={`bg-white rounded-2xl border overflow-hidden ${
                mod.is_locked
                  ? "border-slate-200 opacity-75"
                  : "border-slate-100"
              }`}
            >
              {/* Module header */}
              <div className="p-4 sm:p-5 border-b border-slate-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {iconSrc && (
                      <Image
                        src={iconSrc}
                        alt=""
                        width={20}
                        height={20}
                        className="w-5 h-5 flex-shrink-0"
                        unoptimized
                      />
                    )}
                    <div className="leading-snug">
                      <h3 className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-2">
                        Module {mod.display_order}
                        {mod.is_locked && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-500 border border-red-100">
                            <Lock className="w-3 h-3" />
                            Verrouillé
                          </span>
                        )}
                      </h3>
                      <p className="text-slate-500 text-sm">
                        {mod.title.replace(/^Module \d+\s*[—–-]\s*/, "")}
                      </p>
                    </div>
                  </div>
                  {!mod.is_locked && (
                    <span className="text-xs text-slate-400 flex-shrink-0 ml-4">
                      {modCompleted}/{modLessons.length}
                    </span>
                  )}
                </div>
              </div>

              {/* Lessons */}
              <div className="divide-y divide-slate-50">
                {modLessons.map((lesson) => {
                  if (mod.is_locked) {
                    return (
                      <div
                        key={lesson.id}
                        className="flex items-center gap-3 px-4 sm:px-5 py-3 cursor-not-allowed"
                      >
                        <span className="w-5 h-5 flex-shrink-0 flex items-center justify-center text-red-400 font-bold text-sm">
                          ✕
                        </span>
                        <span className="text-sm flex-1 text-slate-400">
                          {lesson.title}
                        </span>
                        {lesson.duration_seconds && (
                          <span className="text-xs text-slate-300">
                            {formatDuration(lesson.duration_seconds)}
                          </span>
                        )}
                      </div>
                    );
                  }

                  const isCompleted = completedSet.has(lesson.id);
                  const isCurrent =
                    !isCompleted && firstIncomplete?.id === lesson.id;

                  return (
                    <Link
                      key={lesson.id}
                      href={`/dashboard/formations/${slug}/${mod.slug}/${lesson.slug}`}
                      className={`flex items-center gap-3 px-4 sm:px-5 py-3 hover:bg-slate-50 transition-colors active:bg-slate-100 ${
                        isCurrent ? "bg-amber-50/50" : ""
                      }`}
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                      ) : isCurrent ? (
                        <Play className="w-5 h-5 text-amber-600 flex-shrink-0" />
                      ) : (
                        <Circle className="w-5 h-5 text-slate-300 flex-shrink-0" />
                      )}
                      <span
                        className={`text-sm flex-1 ${
                          isCompleted
                            ? "text-slate-400"
                            : isCurrent
                              ? "text-slate-900 font-medium"
                              : "text-slate-600"
                        }`}
                      >
                        {lesson.title}
                      </span>
                      {lesson.duration_seconds && (
                        <span className="text-xs text-slate-400">
                          {formatDuration(lesson.duration_seconds)}
                        </span>
                      )}
                    </Link>
                  );
                })}

                {/* Upsell for locked modules */}
                {mod.is_locked && (
                  <div className="px-4 sm:px-5 py-4 bg-slate-50/50">
                    <p className="text-xs text-slate-400 text-center">
                      Disponible dans la{" "}
                      <Link
                        href="/van-business-academy/presentation"
                        className="text-amber-600 font-semibold hover:underline"
                      >
                        Van Business Academy complète
                      </Link>
                    </p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
