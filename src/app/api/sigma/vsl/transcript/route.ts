import { NextRequest, NextResponse } from "next/server";
import { requireSigmaAuth } from "../../_helpers/auth";
import { createSupabaseAdmin } from "@/lib/supabase/server";

// GET — return active VSL version with transcript
export async function GET() {
  const check = await requireSigmaAuth();
  if (check instanceof NextResponse) return check;

  const supabase = createSupabaseAdmin();
  const { data: version } = await supabase
    .from("sigma_vsl_versions")
    .select("id, name, is_active, transcript_srt, transcript_text, created_at")
    .eq("is_active", true)
    .single();

  if (!version) {
    return NextResponse.json({ error: "No active VSL version found" }, { status: 404 });
  }

  return NextResponse.json({ version });
}

// PATCH — update transcript
export async function PATCH(req: NextRequest) {
  const check = await requireSigmaAuth();
  if (check instanceof NextResponse) return check;

  const { versionId, transcript_srt, transcript_text } = await req.json();
  if (!versionId) {
    return NextResponse.json({ error: "versionId required" }, { status: 400 });
  }

  const supabase = createSupabaseAdmin();
  const updates: Record<string, unknown> = {};
  if (transcript_srt !== undefined) updates.transcript_srt = transcript_srt;
  if (transcript_text !== undefined) updates.transcript_text = transcript_text;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  const { error } = await supabase
    .from("sigma_vsl_versions")
    .update(updates)
    .eq("id", versionId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
