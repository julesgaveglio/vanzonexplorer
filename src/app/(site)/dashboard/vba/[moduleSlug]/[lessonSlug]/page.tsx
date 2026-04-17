import { auth } from "@clerk/nextjs/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { ArrowLeft, ArrowRight, FileText, Image as ImageIcon, ExternalLink } from "lucide-react";
import VBASidebar from "../../_components/VBASidebar";
import MarkCompleteButton from "../../_components/MarkCompleteButton";
import VBAPaywall from "../../_components/VBAPaywall";

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

  // Fetch all data in parallel
  const [modulesRes, lessonsRes, progressRes] = await Promise.all([
    supabase
      .from("vba_modules")
      .select("id, title, slug, description, order")
      .eq("is_published", true)
      .order("order"),
    supabase
      .from("vba_lessons")
      .select("id, module_id, title, slug, bunny_video_id, bunny_library_id, duration_seconds, description, resources, order")
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

  const RESOURCE_ICONS = {
    pdf: FileText,
    image: ImageIcon,
    link: ExternalLink,
  };

  return (
    <div className="flex -mx-6 -my-8 min-h-[calc(100vh-140px)]">
      {/* Sidebar */}
      <VBASidebar
        modules={modules}
        lessons={allLessons}
        completedLessonIds={completedSet}
        currentLessonId={currentLesson.id}
        currentModuleSlug={moduleSlug}
        totalLessons={allLessons.length}
        completedCount={completedSet.size}
      />

      {/* Main content */}
      <div className="flex-1 overflow-y-auto">
        {/* Top bar */}
        <div className="flex items-center gap-3 px-6 py-3 border-b border-slate-100 bg-white">
          <Link
            href="/dashboard/vba"
            className="text-sm text-slate-500 hover:text-slate-700 transition-colors flex items-center gap-1"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour
          </Link>
          <span className="text-slate-300">|</span>
          <span className="text-sm text-slate-400">{currentModule.title}</span>
        </div>

        <div className="p-6 max-w-4xl">
          {/* Video player */}
          {videoId && libraryId ? (
            <div className="mb-6">
              <iframe
                src={`https://iframe.mediadelivery.net/embed/${libraryId}/${videoId}?autoplay=false&loop=false&muted=false&preload=true&responsive=true`}
                allow="accelerometer;gyroscope;autoplay;encrypted-media;picture-in-picture"
                allowFullScreen
                className="w-full aspect-video rounded-xl border border-slate-200"
              />
            </div>
          ) : (
            <div className="w-full aspect-video rounded-xl bg-slate-100 flex items-center justify-center mb-6">
              <p className="text-slate-400 text-sm">
                Vidéo en cours de préparation
              </p>
            </div>
          )}

          {/* Title + mark complete */}
          <div className="flex items-start justify-between gap-4 mb-4">
            <h1 className="text-xl font-bold text-slate-900">
              {currentLesson.title}
            </h1>
            <MarkCompleteButton
              lessonId={currentLesson.id}
              initialCompleted={isCompleted}
            />
          </div>

          {/* Description */}
          {currentLesson.description && (
            <div className="prose prose-sm prose-slate max-w-none mb-6">
              <p className="text-slate-600 whitespace-pre-line">
                {currentLesson.description}
              </p>
            </div>
          )}

          {/* Resources */}
          {resources.length > 0 && (
            <div className="border-t border-slate-100 pt-6 mb-6">
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
                      className="inline-flex items-center gap-2 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 hover:bg-slate-100 hover:border-slate-300 transition-colors"
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
          <div className="flex items-center justify-between border-t border-slate-100 pt-6">
            {prevLesson ? (
              <Link
                href={`/dashboard/vba/${prevLesson.moduleSlug}/${prevLesson.slug}`}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Précédent
              </Link>
            ) : (
              <div />
            )}
            {nextLesson ? (
              <Link
                href={`/dashboard/vba/${nextLesson.moduleSlug}/${nextLesson.slug}`}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white bg-slate-900 hover:bg-slate-700 transition-colors"
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
