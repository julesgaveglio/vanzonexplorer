import { NextResponse } from "next/server";
import { createSupabaseAnon } from "@/lib/supabase/server";

const FALLBACK = {
  id: "fallback",
  bunny_video_id: "b8323ed9-2f4b-4bcc-8313-6ab4835246ee",
  bunny_library_id: "641831",
  name: "VSL2 — Hook V2",
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
