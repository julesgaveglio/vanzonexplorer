import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import Groq from "groq-sdk";

export async function POST(req: NextRequest) {
  const adminCheck = await requireAdmin();
  if (adminCheck instanceof NextResponse) return adminCheck;

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "Fichier requis" }, { status: 400 });
    }

    if (file.size > 50 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Fichier trop lourd (max 50MB)." },
        { status: 400 }
      );
    }

    const supabase = createSupabaseAdmin();

    // 1. Upload to Supabase Storage
    const ext = file.name.split(".").pop() || "mp4";
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { error: uploadError } = await supabase.storage
      .from("funnel-ads")
      .upload(fileName, buffer, { contentType: file.type });

    if (uploadError) {
      console.error("[ads/transcribe] Storage upload error:", uploadError);
      return NextResponse.json({ error: "Erreur upload." }, { status: 500 });
    }

    const { data: urlData } = supabase.storage
      .from("funnel-ads")
      .getPublicUrl(fileName);
    const videoUrl = urlData.publicUrl;

    // 2. Transcribe with Groq Whisper
    let transcript = "";
    try {
      // Re-create a File from buffer for Groq
      const audioFile = new File([buffer], file.name, { type: file.type });

      const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
      const result = await groq.audio.transcriptions.create({
        file: audioFile,
        model: "whisper-large-v3",
        language: "fr",
        response_format: "text",
      });
      transcript = typeof result === "string" ? result : JSON.stringify(result);
    } catch (err) {
      console.error("[ads/transcribe] Groq error:", err);
      transcript = "(Transcription échouée — colle le script manuellement)";
    }

    return NextResponse.json({ video_url: videoUrl, transcript });
  } catch (err) {
    console.error("[ads/transcribe] Error:", err);
    return NextResponse.json(
      { error: "Erreur lors du traitement." },
      { status: 500 }
    );
  }
}
