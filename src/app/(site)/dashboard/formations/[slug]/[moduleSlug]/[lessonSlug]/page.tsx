import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import {
  ArrowLeft,
  ArrowRight,
  FileText,
  Image as ImageIcon,
  ExternalLink,
  Lock,
} from "lucide-react";

import VBAVideoPlayer from "../../../../vba/_components/VBAVideoPlayer";
import VBAMobileDrawer from "../../../../vba/_components/VBAMobileDrawer";
import VBAQuiz, {
  type QuizQuestion,
} from "../../../../vba/_components/VBAQuiz";
import VBALessonContent from "../../../../vba/_components/VBALessonContent";
import FormationSidebar from "../../_components/FormationSidebar";
import FormationPaywall from "../../_components/FormationPaywall";
import FormationMarkCompleteButton from "../../_components/FormationMarkCompleteButton";

interface Resource {
  type: "pdf" | "image" | "link";
  url: string;
  label: string;
}

const ADMIN_EMAIL = "gavegliojules@gmail.com";

export default async function FormationLessonPage({
  params,
}: {
  params: Promise<{ slug: string; moduleSlug: string; lessonSlug: string }>;
}) {
  const { slug, moduleSlug, lessonSlug } = await params;
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

  // Check access
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
        formationSlug={formation.slug}
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
  const fmMap = new Map(
    (fmRows ?? []).map((fm) => [fm.module_id, fm])
  );

  // Fetch all data in parallel
  const [modulesRes, lessonsRes, progressRes] = await Promise.all([
    supabase
      .from("vba_modules")
      .select("id, title, slug, description, order")
      .in("id", moduleIds)
      .eq("is_published", true)
      .order("order"),
    supabase
      .from("vba_lessons")
      .select(
        "id, module_id, title, slug, bunny_video_id, bunny_library_id, duration_seconds, description, resources, order, chapters, lesson_content"
      )
      .in("module_id", moduleIds)
      .eq("is_published", true)
      .order("order"),
    supabase
      .from("vba_progress")
      .select("lesson_id, completed")
      .eq("user_id", userId),
  ]);

  const modules = (modulesRes.data ?? []).map((mod) => {
    const fm = fmMap.get(mod.id);
    return {
      ...mod,
      display_order: fm?.display_order ?? mod.order,
      is_locked: fm?.is_locked ?? false,
    };
  });
  const allLessons = lessonsRes.data ?? [];
  const progress = progressRes.data ?? [];

  // Find current module + lesson
  const currentModule = modules.find((m) => m.slug === moduleSlug);
  if (!currentModule) notFound();

  const currentLesson = allLessons.find(
    (l) => l.module_id === currentModule.id && l.slug === lessonSlug
  );
  if (!currentLesson) notFound();

  // If module is locked, show locked view
  if (currentModule.is_locked) {
    const libraryId =
      currentLesson.bunny_library_id ||
      process.env.NEXT_PUBLIC_BUNNY_LIBRARY_ID ||
      "";
    const videoId = currentLesson.bunny_video_id || "";

    return (
      <div className="space-y-6 max-w-3xl mx-auto">
        {/* Locked video preview */}
        <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-slate-900">
          {videoId && libraryId ? (
            <iframe
              src={`https://iframe.mediadelivery.net/embed/${libraryId}/${videoId}?autoplay=false&loop=false&muted=true&preload=metadata&responsive=true`}
              className="w-full h-full pointer-events-none"
              tabIndex={-1}
            />
          ) : (
            <div className="w-full h-full bg-slate-800" />
          )}
          {/* Lock overlay */}
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex flex-col items-center justify-center gap-3">
            <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center">
              <Lock className="w-8 h-8 text-red-400" />
            </div>
            <p className="text-white font-semibold text-lg">Module verrouillé</p>
            <p className="text-white/60 text-sm text-center max-w-xs">
              Ce module est disponible dans la Van Business Academy complète.
            </p>
            <Link
              href="/van-business-academy/presentation"
              className="mt-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition-all active:scale-95"
              style={{
                background:
                  "linear-gradient(135deg, #B9945F 0%, #E4D398 100%)",
              }}
            >
              Découvrir la formation complète
            </Link>
          </div>
        </div>

        <div className="text-center">
          <Link
            href={`/dashboard/formations/${slug}`}
            className="text-sm text-slate-500 hover:text-slate-700 transition-colors"
          >
            ← Retour à la formation
          </Link>
        </div>
      </div>
    );
  }

  // Build completed set
  const completedSet = new Set(
    progress.filter((p) => p.completed).map((p) => p.lesson_id)
  );
  const isCompleted = completedSet.has(currentLesson.id);

  // Build flat ordered list for prev/next (unlocked modules only)
  const unlockedModules = modules
    .filter((m) => !m.is_locked)
    .sort((a, b) => a.display_order - b.display_order);

  const orderedLessons = unlockedModules.flatMap((mod) =>
    allLessons
      .filter((l) => l.module_id === mod.id)
      .sort((a, b) => a.order - b.order)
      .map((l) => ({ ...l, moduleSlug: mod.slug }))
  );
  const currentIndex = orderedLessons.findIndex(
    (l) => l.id === currentLesson.id
  );
  const prevLesson =
    currentIndex > 0 ? orderedLessons[currentIndex - 1] : null;
  const nextLesson =
    currentIndex < orderedLessons.length - 1
      ? orderedLessons[currentIndex + 1]
      : null;

  // Video embed
  const libraryId =
    currentLesson.bunny_library_id ||
    process.env.NEXT_PUBLIC_BUNNY_LIBRARY_ID ||
    "";
  const videoId = currentLesson.bunny_video_id || "";

  const resources = (currentLesson.resources ?? []) as Resource[];

  // Detect quiz
  const isQuiz = currentLesson.description?.startsWith("QUIZ:");
  let quizQuestions: QuizQuestion[] = [];
  if (isQuiz) {
    try {
      quizQuestions = JSON.parse(currentLesson.description!.slice(5));
    } catch {
      /* invalid JSON */
    }
  }

  const RESOURCE_ICONS = {
    pdf: FileText,
    image: ImageIcon,
    link: ExternalLink,
  };

  // Sidebar data — count only unlocked lessons
  const unlockedModuleIds = new Set(unlockedModules.map((m) => m.id));
  const unlockedLessons = allLessons.filter((l) =>
    unlockedModuleIds.has(l.module_id)
  );

  const sidebarProps = {
    formationSlug: slug,
    modules: modules.sort((a, b) => a.display_order - b.display_order),
    lessons: allLessons,
    completedLessonIds: completedSet,
    currentLessonId: currentLesson.id,
    currentModuleSlug: moduleSlug,
    totalLessons: unlockedLessons.length,
    completedCount: unlockedLessons.filter((l) => completedSet.has(l.id))
      .length,
  };

  const basePath = `/dashboard/formations/${slug}`;

  return (
    <div className="flex -mx-6 -my-8 lg:-mx-6 lg:-my-8 min-h-[calc(100vh-140px)]">
      {/* Desktop sidebar */}
      <div className="hidden lg:block">
        <FormationSidebar {...sidebarProps} />
      </div>

      {/* Mobile drawer */}
      <VBAMobileDrawer>
        <FormationSidebar {...sidebarProps} />
      </VBAMobileDrawer>

      {/* Main content */}
      <div className="flex-1 overflow-y-auto min-w-0">
        {/* Top bar */}
        <div className="flex items-center gap-3 px-4 sm:px-6 py-3 border-b border-slate-100 bg-white">
          <Link
            href={basePath}
            className="text-sm text-slate-500 hover:text-slate-700 transition-colors flex items-center gap-1"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Retour</span>
          </Link>
          <span className="text-slate-300">|</span>
          <span className="text-sm text-slate-400 truncate">
            Module {currentModule.display_order} —{" "}
            {currentModule.title.replace(/^Module \d+\s*[—–-]\s*/, "")}
          </span>
        </div>

        <div className="px-4 sm:px-6 py-4 sm:py-6 max-w-4xl">
          {/* Quiz or Video player */}
          {isQuiz && quizQuestions.length > 0 ? (
            <div className="mb-4 sm:mb-6">
              <VBAQuiz questions={quizQuestions} />
            </div>
          ) : videoId && libraryId ? (
            <VBAVideoPlayer libraryId={libraryId} videoId={videoId} />
          ) : (
            <div className="w-full aspect-video rounded-xl bg-slate-100 flex items-center justify-center mb-4 sm:mb-6">
              <p className="text-slate-400 text-sm">
                Vidéo en cours de préparation
              </p>
            </div>
          )}

          {/* Title + mark complete */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
            <h1 className="text-lg sm:text-xl font-bold text-slate-900">
              {currentLesson.title}
            </h1>
            <FormationMarkCompleteButton
              lessonId={currentLesson.id}
              initialCompleted={isCompleted}
            />
          </div>

          {/* Description */}
          {currentLesson.description && !isQuiz && (
            <div className="prose prose-sm prose-slate max-w-none mb-4 sm:mb-6">
              <p className="text-slate-600 whitespace-pre-line">
                {currentLesson.description}
              </p>
            </div>
          )}

          {/* Lesson content */}
          <div className="mb-4 sm:mb-6">
            <VBALessonContent
              lessonId={currentLesson.id}
              initialContent={currentLesson.lesson_content ?? null}
              isAdmin={false}
            />
          </div>

          {/* Resources */}
          {resources.length > 0 && (
            <div className="border-t border-slate-100 pt-4 sm:pt-6 mb-4 sm:mb-6">
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">
                Ressources
              </h3>
              <div className="flex flex-wrap gap-2">
                {resources.map((resource, i) => {
                  const Icon = RESOURCE_ICONS[resource.type] ?? ExternalLink;
                  return (
                    <a
                      key={i}
                      href={resource.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 hover:bg-slate-100 hover:border-slate-300 transition-colors active:scale-95"
                    >
                      <Icon className="w-4 h-4 text-slate-400" />
                      {resource.label}
                    </a>
                  );
                })}
              </div>
            </div>
          )}

          {/* Prev/Next navigation */}
          <div className="flex items-center justify-between gap-3 border-t border-slate-100 pt-4 sm:pt-6 pb-20 lg:pb-6">
            {prevLesson ? (
              <Link
                href={`${basePath}/${prevLesson.moduleSlug}/${prevLesson.slug}`}
                className="inline-flex items-center gap-2 px-4 py-3 sm:py-2 rounded-xl text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors active:scale-95"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Précédent</span>
                <span className="sm:hidden">Préc.</span>
              </Link>
            ) : (
              <div />
            )}
            {nextLesson ? (
              <Link
                href={`${basePath}/${nextLesson.moduleSlug}/${nextLesson.slug}`}
                className="btn-gold inline-flex items-center gap-2 px-5 py-3 sm:py-2 rounded-xl text-sm font-semibold text-white transition-all active:scale-95"
              >
                Suivant
                <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <div />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
