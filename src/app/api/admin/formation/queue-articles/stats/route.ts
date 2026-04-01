import { createSupabaseAdmin } from "@/lib/supabase/server";

export async function GET() {
  const supabase = createSupabaseAdmin();

  const [totalRes, vbaRes, pendingRes, publishedRes] = await Promise.all([
    supabase.from("article_queue").select("id", { count: "exact", head: true }),
    supabase.from("article_queue").select("id", { count: "exact", head: true }).eq("added_by", "vba-keyword-strategy"),
    supabase.from("article_queue").select("id", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("article_queue").select("id", { count: "exact", head: true }).eq("status", "published"),
  ]);

  return Response.json({
    total: totalRes.count ?? 0,
    vba: vbaRes.count ?? 0,
    pending: pendingRes.count ?? 0,
    published: publishedRes.count ?? 0,
  });
}
