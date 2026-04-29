import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { ArrowLeft, ArrowRight, FileText, Image as ImageIcon, ExternalLink } from "lucide-react";

const ADMIN_EMAIL = "gavegliojules@gmail.com";
const VBA_ADMIN_EMAIL = "vanzonexplorer@gmail.com";
import VBASidebar from "../../_components/VBASidebar";
import VBAMobileDrawer from "../../_components/VBAMobileDrawer";
import MarkCompleteButton from "../../_components/MarkCompleteButton";
import VBAPaywall from "../../_components/VBAPaywall";
import VBAQuiz, { type QuizQuestion } from "../../_components/VBAQuiz";
import VBAVideoPlayer from "../../_components/VBAVideoPlayer";
import VBALessonContent from "../../_components/VBALessonContent";

interface Resource {
  type: "pdf" | "image" | "link";
  url: string;
  label: string;
}

export default async function LessonPage({
  params,
}: {
  params: Promise<{ moduleSlug: string; lessonSlug: string }>;
}) {
  const { moduleSlug, lessonSlug } = await params;
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const user = await currentUser();
  const email = user?.emailAddresses?.[0]?.emailAddress;
  const supabase = createSupabaseAdmin();

  // Check access: admin OR vba_admin OR vba_member
  const isVBAAdmin = email === VBA_ADMIN_EMAIL;
  if (email !== ADMIN_EMAIL && !isVBAAdmin) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("plan")
      .eq("clerk_id", userId)
      .single();
    if (profile?.plan !== "vba_member") {
      return <VBAPaywall />;
    }
  }

  // Fetch all data in parallel
  const [modulesRes, lessonsRes, progressRes] = await Promise.all([
    supabase
      .from("vba_modules")
      .select("id, title, slug, description, order")
      .eq("is_published", true)
      .order("order"),
    supabase
      .from("vba_lessons")
      .select("id, module_id, title, slug, bunny_video_id, bunny_library_id, duration_seconds, description, resources, order, chapters, lesson_content")
      .eq("is_published", true)
      .order("order"),
    supabase
      .from("vba_progress")
      .select("lesson_id, completed")
      .eq("user_id", userId),
  ]);

  const modules = modulesRes.data ?? [];
  const allLessons = lessonsRes.data ?? [];
  const progress = progressRes.data ?? [];

  // Find current module + lesson
  const currentModule = modules.find((m) => m.slug === moduleSlug);
  if (!currentModule) notFound();

  const currentLesson = allLessons.find(
    (l) => l.module_id === currentModule.id && l.slug === lessonSlug
  );
  if (!currentLesson) notFound();

  // Build completed set
  const completedSet = new Set(
    progress.filter((p) => p.completed).map((p) => p.lesson_id)
  );
  const isCompleted = completedSet.has(currentLesson.id);

  // Build flat ordered list for prev/next navigation
  const orderedLessons = modules.flatMap((mod) =>
    allLessons
      .filter((l) => l.module_id === mod.id)
      .sort((a, b) => a.order - b.order)
      .map((l) => ({
        ...l,
        moduleSlug: mod.slug,
      }))
  );
  const currentIndex = orderedLessons.findIndex(
    (l) => l.id === currentLesson.id
  );
  const prevLesson = currentIndex > 0 ? orderedLessons[currentIndex - 1] : null;
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
  const chapters = (currentLesson.chapters ?? []) as Array<{ title: string; time: number }>;

  // Detect quiz lesson: description starts with "QUIZ:"
  const isQuiz = currentLesson.description?.startsWith("QUIZ:");
  let quizQuestions: QuizQuestion[] = [];
  if (isQuiz) {
    try {
      quizQuestions = JSON.parse(currentLesson.description!.slice(5));
    } catch { /* invalid JSON — fall through to normal display */ }
  }

  const RESOURCE_ICONS = {
    pdf: FileText,
    image: ImageIcon,
    link: ExternalLink,
  };

  const sidebarProps = {
    modules,
    lessons: allLessons,
    completedLessonIds: completedSet,
    currentLessonId: currentLesson.id,
    currentModuleSlug: moduleSlug,
    totalLessons: allLessons.length,
    completedCount: completedSet.size,
  };

  return (
    <div className="flex -mx-6 -my-8 lg:-mx-6 lg:-my-8 min-h-[calc(100vh-140px)]">
      {/* Desktop sidebar — hidden on mobile */}
      <div className="hidden lg:block">
        <VBASidebar {...sidebarProps} />
      </div>

      {/* Mobile drawer — hidden on desktop */}
      <VBAMobileDrawer>
        <VBASidebar {...sidebarProps} />
      </VBAMobileDrawer>

      {/* Main content */}
      <div className="flex-1 overflow-y-auto min-w-0">
        {/* Top bar */}
        <div className="flex items-center gap-3 px-4 sm:px-6 py-3 border-b border-slate-100 bg-white">
          <Link
            href="/dashboard/vba"
            className="text-sm text-slate-500 hover:text-slate-700 transition-colors flex items-center gap-1"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Retour</span>
          </Link>
          <span className="text-slate-300">|</span>
          <span className="text-sm text-slate-400 truncate">{currentModule.title}</span>
        </div>

        <div className="px-4 sm:px-6 py-4 sm:py-6 max-w-4xl">
          {/* Quiz or Video player */}
          {isQuiz && quizQuestions.length > 0 ? (
            <div className="mb-4 sm:mb-6">
              <VBAQuiz questions={quizQuestions} />
            </div>
          ) : videoId && libraryId ? (
            <VBAVideoPlayer
              libraryId={libraryId}
              videoId={videoId}
              chapters={chapters}
            />
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
            <MarkCompleteButton
              lessonId={currentLesson.id}
              initialCompleted={isCompleted}
            />
          </div>

          {/* Description (hidden for quiz lessons) */}
          {currentLesson.description && !isQuiz && (
            <div className="prose prose-sm prose-slate max-w-none mb-4 sm:mb-6">
              <p className="text-slate-600 whitespace-pre-line">
                {currentLesson.description}
              </p>
            </div>
          )}

          {/* Lesson content — editable by VBA admin */}
          <div className="mb-4 sm:mb-6">
            <VBALessonContent
              lessonId={currentLesson.id}
              initialContent={currentLesson.lesson_content ?? null}
              isAdmin={isVBAAdmin}
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
                href={`/dashboard/vba/${prevLesson.moduleSlug}/${prevLesson.slug}`}
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
                href={`/dashboard/vba/${nextLesson.moduleSlug}/${nextLesson.slug}`}
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
