import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
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

    // Groq Whisper accepts: mp3, mp4, mpeg, mpga, m4a, wav, webm
    const allowedTypes = [
      "video/mp4", "video/webm", "video/mpeg",
      "audio/mpeg", "audio/mp3", "audio/mp4", "audio/m4a", "audio/wav", "audio/webm",
    ];
    if (!allowedTypes.includes(file.type) && !file.name.match(/\.(mp4|mp3|m4a|wav|webm|mpeg)$/i)) {
      return NextResponse.json(
        { error: "Format non supporté. Utilise MP4, MP3, WAV ou WebM." },
        { status: 400 }
      );
    }

    // Max 25MB (Groq limit)
    if (file.size > 25 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Fichier trop lourd (max 25MB). Compresse la vidéo avant." },
        { status: 400 }
      );
    }

    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

    const transcription = await groq.audio.transcriptions.create({
      file,
      model: "whisper-large-v3",
      language: "fr",
      response_format: "text",
    });

    return NextResponse.json({ transcript: transcription });
  } catch (err) {
    console.error("[ads/transcribe] Error:", err);
    return NextResponse.json(
      { error: "Erreur lors de la transcription." },
      { status: 500 }
    );
  }
}
