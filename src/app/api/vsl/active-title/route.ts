import { NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/server";

const EXCLUDED_EMAILS = ["gavegliojules@gmail.com", "mateogb.ads@gmail.com", "jules@vanzonexplorer.com"];

export const revalidate = 30; // Cache 30s to avoid hammering DB

export async function GET() {
  try {
    const sb = createSupabaseAdmin();

    // 1. Get the active variant
    const { data: active } = await sb
      .from("title_variants")
      .select("*")
      .eq("is_active", true)
      .single();

    if (!active) {
      // No active variant — return fallback
      return NextResponse.json({
        id: "fallback",
        title: "Donne-moi 13 minutes et je te partage (vraiment) tout le process pour générer 600€/mois de revenu locatif avec un van aménagé",
      });
    }

    // 2. Count unique page_views for this variant
    const { data: viewEvents } = await sb
      .from("funnel_events")
      .select("session_id, email")
      .eq("event", "page_view")
      .not("email", "in", `(${EXCLUDED_EMAILS.join(",")})`)
      .contains("metadata", { title_variant_id: active.id });

    const uniqueViews = new Set(
      (viewEvents ?? []).map((e) => e.email || e.session_id || "anon")
    ).size;

    // 3. If views >= target, rotate to next
    if (uniqueViews >= (active.views_target ?? 150)) {
      // Mark current as completed
      await sb
        .from("title_variants")
        .update({ is_active: false, is_completed: true })
        .eq("id", active.id);

      // Activate next variant (by position)
      const { data: next } = await sb
        .from("title_variants")
        .select("*")
        .eq("is_completed", false)
        .eq("is_active", false)
        .order("position", { ascending: true })
        .limit(1)
        .single();

      if (next) {
        await sb
          .from("title_variants")
          .update({ is_active: true })
          .eq("id", next.id);

        return NextResponse.json({ id: next.id, title: next.title });
      }

      // No more variants to test — keep showing current
      await sb
        .from("title_variants")
        .update({ is_active: true })
        .eq("id", active.id);
    }

    return NextResponse.json({ id: active.id, title: active.title });
  } catch {
    return NextResponse.json({
      id: "fallback",
      title: "Donne-moi 13 minutes et je te partage (vraiment) tout le process pour générer 600€/mois de revenu locatif avec un van aménagé",
    });
  }
}
