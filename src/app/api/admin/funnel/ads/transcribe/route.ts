import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import Groq from "groq-sdk";

// Allow up to 120s for large video transcription
export const maxDuration = 120;

export async function POST(req: NextRequest) {
  const adminCheck = await requireAdmin();
  if (adminCheck instanceof NextResponse) return adminCheck;

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const campaignId = formData.get("campaign_id") as string | null;

    if (!file) {
      return NextResponse.json({ error: "Fichier requis" }, { status: 400 });
    }

    if (file.size > 50 * 1024 * 1024) {
      return NextResponse.json({ error: "Max 50MB." }, { status: 400 });
    }

    const supabase = createSupabaseAdmin();
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 1. Upload to Supabase Storage
    const ext = file.name.split(".").pop() || "mp4";
    const storageName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("funnel-ads")
      .upload(storageName, buffer, { contentType: file.type || "video/mp4" });

    if (uploadError) {
      console.error("[ads/transcribe] Storage error:", uploadError);
      return NextResponse.json({ error: "Erreur upload storage." }, { status: 500 });
    }

    const { data: urlData } = supabase.storage
      .from("funnel-ads")
      .getPublicUrl(storageName);
    const videoUrl = urlData.publicUrl;

    // 2. Transcribe with Groq Whisper
    let transcript = "";
    try {
      const audioFile = new File([buffer], file.name.replace(/\.mov$/i, ".mp4"), {
        type: file.type === "video/quicktime" ? "video/mp4" : file.type,
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
      console.error("[ads/transcribe] Groq error:", err);
      transcript = "(Transcription échouée)";
    }

    // 3. Auto-detect ad name from filename
    const rawName = file.name.replace(/\.[^.]+$/, "").replace(/[-_]/g, " ");
    const adName = rawName.charAt(0).toUpperCase() + rawName.slice(1);

    // 4. Auto-create the ad in DB if campaign_id provided
    let adId: string | null = null;
    if (campaignId) {
      const { data: ad } = await supabase
        .from("funnel_ads")
        .insert({
          campaign_id: campaignId,
          name: adName,
          hook_type: null,
          video_url: videoUrl,
          transcript,
        })
        .select("id")
        .single();
      adId = ad?.id ?? null;
    }

    return NextResponse.json({ ad_id: adId, name: adName, video_url: videoUrl, transcript });
  } catch (err) {
    console.error("[ads/transcribe] Error:", err);
    return NextResponse.json({ error: "Erreur traitement." }, { status: 500 });
  }
}
