import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const adminCheck = await requireAdmin();
  if (adminCheck instanceof NextResponse) return adminCheck;

  const { fileName } = await req.json();
  if (!fileName) return NextResponse.json({ error: "fileName requis" }, { status: 400 });

  const ext = fileName.split(".").pop() || "mp4";
  const storagePath = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const supabase = createSupabaseAdmin();
  const { data, error } = await supabase.storage
    .from("funnel-ads")
    .createSignedUploadUrl(storagePath);

  if (error) {
    console.error("[upload-url] Error:", error);
    return NextResponse.json({ error: "Erreur génération URL" }, { status: 500 });
  }

  const { data: urlData } = supabase.storage.from("funnel-ads").getPublicUrl(storagePath);

  return NextResponse.json({
    uploadUrl: data.signedUrl,
    token: data.token,
    storagePath,
    publicUrl: urlData.publicUrl,
  });
}
