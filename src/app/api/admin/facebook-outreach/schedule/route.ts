// src/app/api/admin/facebook-outreach/schedule/route.ts
import { NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";

export async function GET() {
  const check = await requireAdmin();
  if (check instanceof NextResponse) return check;
  const supabase = createSupabaseAdmin();
  const { data, error } = await supabase
    .from("facebook_outreach_schedule")
    .select("*, facebook_groups(group_name, group_url), facebook_templates(label)")
    .gte("scheduled_for", new Date().toISOString().split("T")[0])
    .order("scheduled_for");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
