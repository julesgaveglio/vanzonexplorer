import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const adminCheck = await requireAdmin();
  if (adminCheck instanceof NextResponse) return adminCheck;

  const supabase = createSupabaseAdmin();
  const params = req.nextUrl.searchParams;
  const start = params.get("start");
  const end = params.get("end");

  let query = supabase
    .from("vba_funnel_leads")
    .select("*")
    .order("created_at", { ascending: false });

  if (start) query = query.gte("created_at", new Date(start).toISOString());
  if (end) query = query.lte("created_at", new Date(new Date(end).getTime() + 86400000).toISOString());

  const { data } = await query;
  return NextResponse.json({ leads: data ?? [] });
}
