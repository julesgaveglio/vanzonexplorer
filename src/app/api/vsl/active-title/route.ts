import { NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/server";

const EXCLUDED_EMAILS = ["gavegliojules@gmail.com", "mateogb.ads@gmail.com", "jules@vanzonexplorer.com"];

const FALLBACK = {
  id: "fallback",
  title: "Donne-moi 13 minutes et je vais te montrer comment acheter un van à 15 000 € et le revendre entre 22 000 € et 27 000 €.",
};

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const sb = createSupabaseAdmin();

    // 1. Get the active variant
    const { data: active } = await sb
      .from("title_variants")
      .select("*")
      .eq("is_active", true)
      .limit(1)
      .maybeSingle();

    if (!active) {
      return NextResponse.json(FALLBACK);
    }

    // 2. Count unique page_views for this variant (cap at views_target + buffer)
    const target = active.views_target ?? 200;
    const PAGE = 1000;
    const allViews: { session_id: string | null; email: string | null }[] = [];
    let offset = 0;
    while (allViews.length < target + 100) {
      const { data } = await sb
        .from("funnel_events")
        .select("session_id, email")
        .eq("event", "page_view")
        .not("email", "in", `(${EXCLUDED_EMAILS.join(",")})`)
        .contains("metadata", { title_variant_id: active.id })
        .range(offset, offset + PAGE - 1);
      if (!data || data.length === 0) break;
      allViews.push(...data);
      if (data.length < PAGE) break;
      offset += PAGE;
    }

    const uniqueViews = new Set(
      allViews.map((e) => e.email || e.session_id || "anon")
    ).size;

    // 3. If views >= target, rotate to next
    if (uniqueViews >= target) {
      await sb
        .from("title_variants")
        .update({ is_active: false, is_completed: true })
        .eq("id", active.id);

      const { data: next } = await sb
        .from("title_variants")
        .select("*")
        .eq("is_completed", false)
        .eq("is_active", false)
        .order("position", { ascending: true })
        .limit(1)
        .maybeSingle();

      if (next) {
        await sb
          .from("title_variants")
          .update({ is_active: true })
          .eq("id", next.id);

        return NextResponse.json({ id: next.id, title: next.title });
      }

      // No more variants — re-activate current
      await sb
        .from("title_variants")
        .update({ is_active: true, is_completed: false })
        .eq("id", active.id);
    }

    return NextResponse.json({ id: active.id, title: active.title });
  } catch (err) {
    console.error("[active-title] Error:", err);
    return NextResponse.json(FALLBACK);
  }
}
