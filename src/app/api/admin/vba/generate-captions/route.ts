import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { createSSEResponse } from "@/lib/sse";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { transcribeVideo, uploadCaptionsToBunny } from "@/lib/vba/transcribe";
import { generateChapters } from "@/lib/vba/generate-chapters";

export async function POST(req: NextRequest) {
  const authResult = await requireAdmin();
  if ("status" in authResult) return authResult;

  const { lessonId } = await req.json();
  if (!lessonId) {
    return new Response(JSON.stringify({ error: "lessonId required" }), {
      status: 400,
    });
  }

  return createSSEResponse(async (send) => {
    const supabase = createSupabaseAdmin();

    // 1. Fetch lesson info
    send({ type: "progress", step: "fetching", message: "Récupération de la leçon..." });
    const { data: lesson, error } = await supabase
      .from("vba_lessons")
      .select("id, bunny_video_id, bunny_library_id, title")
      .eq("id", lessonId)
      .single();

    if (error || !lesson) throw new Error("Leçon introuvable");
    if (!lesson.bunny_video_id) throw new Error("Pas de vidéo Bunny configurée");

    const libraryId =
      lesson.bunny_library_id || process.env.NEXT_PUBLIC_BUNNY_LIBRARY_ID || "";
    if (!libraryId) throw new Error("Library ID Bunny manquant");

    // 2. Transcribe
    send({ type: "progress", step: "transcribing", message: "Transcription en cours (Whisper)..." });
    const result = await transcribeVideo(libraryId, lesson.bunny_video_id);

    // 3. Upload captions to Bunny
    send({ type: "progress", step: "uploading_captions", message: "Upload des sous-titres sur Bunny..." });
    await uploadCaptionsToBunny(libraryId, lesson.bunny_video_id, result.srt);

    // 4. Generate chapters
    send({ type: "progress", step: "generating_chapters", message: "Génération des chapitres IA..." });
    const chapters = await generateChapters(result.fullText, result.segments);

    // 5. Save to Supabase
    send({ type: "progress", step: "saving", message: "Sauvegarde..." });
    const { error: updateError } = await supabase
      .from("vba_lessons")
      .update({
        transcript: result.fullText,
        chapters,
      })
      .eq("id", lessonId);

    if (updateError) throw new Error(`Erreur sauvegarde: ${updateError.message}`);

    send({
      type: "done",
      message: "Sous-titres et chapitres générés !",
      chaptersCount: chapters.length,
    });
  });
}
