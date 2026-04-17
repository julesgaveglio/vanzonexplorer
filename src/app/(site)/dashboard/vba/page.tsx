import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { CheckCircle2, Circle, Play } from "lucide-react";
import VBAPaywall from "./_components/VBAPaywall";

interface VBAModule {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  order: number;
}

interface VBALesson {
  id: string;
  module_id: string;
  title: string;
  slug: string;
  duration_seconds: number | null;
  order: number;
}

interface VBAProgress {
  lesson_id: string;
  completed: boolean;
}

function formatDuration(seconds: number | null): string {
  if (!seconds) return "";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default async function VBAPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const supabase = createSupabaseAdmin();

  // Check access
  const { data: profile } = await supabase
    .from("profiles")
    .select("plan")
    .eq("clerk_id", userId)
    .single();

  if (profile?.plan !== "vba_member") {
    return <VBAPaywall />;
  }

  // Fetch modules, lessons, progress
  const [modulesRes, lessonsRes, progressRes] = await Promise.all([
    supabase
      .from("vba_modules")
      .select("id, title, slug, description, order")
      .eq("is_published", true)
      .order("order"),
    supabase
      .from("vba_lessons")
      .select("id, module_id, title, slug, duration_seconds, order")
      .eq("is_published", true)
      .order("order"),
    supabase
      .from("vba_progress")
      .select("lesson_id, completed")
      .eq("user_id", userId),
  ]);

  const modules = (modulesRes.data ?? []) as VBAModule[];
  const lessons = (lessonsRes.data ?? []) as VBALesson[];
  const progress = (progressRes.data ?? []) as VBAProgress[];

  const completedSet = new Set(
    progress.filter((p) => p.completed).map((p) => p.lesson_id)
  );
  const totalLessons = lessons.length;
  const completedCount = completedSet.size;
  const progressPercent =
    totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

  return (
    <div className="space-y-8">
      {/* Header + progression globale */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2
            className="text-xl font-bold bg-clip-text text-transparent"
            style={{
              backgroundImage:
                "linear-gradient(135deg, #B9945F 0%, #E4D398 100%)",
            }}
          >
            Van Business Academy
          </h2>
          <span className="text-sm text-slate-500">
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
      {modules.length === 0 ? (
        <div className="glass-card p-10 text-center">
          <p className="text-slate-500">
            Les modules arrivent bientôt ! Vous serez notifié dès la mise en
            ligne.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {modules.map((mod, idx) => {
            const modLessons = lessons
              .filter((l) => l.module_id === mod.id)
              .sort((a, b) => a.order - b.order);
            const modCompleted = modLessons.filter((l) =>
              completedSet.has(l.id)
            ).length;
            const firstIncomplete = modLessons.find(
              (l) => !completedSet.has(l.id)
            );

            return (
              <div key={mod.id} className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
                <div className="p-5 border-b border-slate-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-slate-900">
                        Module {idx + 1} — {mod.title}
                      </h3>
                      {mod.description && (
                        <p className="text-sm text-slate-500 mt-1">
                          {mod.description}
                        </p>
                      )}
                    </div>
                    <span className="text-xs text-slate-400 flex-shrink-0 ml-4">
                      {modCompleted}/{modLessons.length}
                    </span>
                  </div>
                </div>

                <div className="divide-y divide-slate-50">
                  {modLessons.map((lesson) => {
                    const isCompleted = completedSet.has(lesson.id);
                    const isCurrent =
                      !isCompleted && firstIncomplete?.id === lesson.id;

                    return (
                      <Link
                        key={lesson.id}
                        href={`/dashboard/vba/${mod.slug}/${lesson.slug}`}
                        className={`flex items-center gap-3 px-5 py-3 hover:bg-slate-50 transition-colors ${
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
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
