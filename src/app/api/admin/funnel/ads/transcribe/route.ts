import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import Groq from "groq-sdk";

export const maxDuration = 120;

export async function POST(req: NextRequest) {
  const adminCheck = await requireAdmin();
  if (adminCheck instanceof NextResponse) return adminCheck;

  try {
    const { storage_path, public_url, campaign_id, file_name } = await req.json();

    if (!storage_path || !public_url) {
      return NextResponse.json({ error: "storage_path et public_url requis" }, { status: 400 });
    }

    const supabase = createSupabaseAdmin();

    // 1. Download file from Supabase Storage
    const { data: fileData, error: dlError } = await supabase.storage
      .from("funnel-ads")
      .download(storage_path);

    if (dlError || !fileData) {
      console.error("[transcribe] Download error:", dlError);
      return NextResponse.json({ error: "Erreur téléchargement fichier." }, { status: 500 });
    }

    // 2. Transcribe with Groq Whisper
    let transcript = "";
    try {
      const safeName = (file_name || "video.mp4").replace(/\.mov$/i, ".mp4");
      const audioFile = new File([fileData], safeName, {
        type: safeName.endsWith(".mp3") ? "audio/mpeg" : "video/mp4",
      });

      const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
      const result = await groq.audio.transcriptions.create({
        file: audioFile,
        model: "whisper-large-v3",
        language: "fr",
        response_format: "text",
      });
      transcript = typeof result === "string" ? result : JSON.stringify(result);
    } catch (err) {
      console.error("[transcribe] Groq error:", err);
      transcript = "(Transcription echouee)";
    }

    // 3. Auto-name from filename
    const rawName = (file_name || "Ad").replace(/\.[^.]+$/, "").replace(/[-_]/g, " ");
    const adName = rawName.charAt(0).toUpperCase() + rawName.slice(1);

    // 4. Create ad in DB
    let adId: string | null = null;
    if (campaign_id) {
      const { data: ad } = await supabase
        .from("funnel_ads")
        .insert({
          campaign_id,
          name: adName,
          video_url: public_url,
          transcript,
        })
        .select("id")
        .single();
      adId = ad?.id ?? null;
    }

    return NextResponse.json({ ad_id: adId, name: adName, video_url: public_url, transcript });
  } catch (err) {
    console.error("[transcribe] Error:", err);
    return NextResponse.json({ error: "Erreur traitement." }, { status: 500 });
  }
}
