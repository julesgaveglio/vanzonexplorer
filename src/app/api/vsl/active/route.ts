import { NextResponse } from "next/server";
import { createSupabaseAnon } from "@/lib/supabase/server";

const FALLBACK = {
  id: "fallback",
  bunny_video_id: "7739a3f1-ad32-4839-ba56-e4dc60a27a47",
  bunny_library_id: "641831",
  name: "VSL1 — Fallback",
};

export const revalidate = 60;

export async function GET() {
  try {
    const sb = createSupabaseAnon();
    const { data } = await sb
      .from("vsl_versions")
      .select("id, bunny_video_id, bunny_library_id, name")
      .eq("is_active", true)
      .single();

    return NextResponse.json(data ?? FALLBACK);
  } catch {
    return NextResponse.json(FALLBACK);
  }
}
