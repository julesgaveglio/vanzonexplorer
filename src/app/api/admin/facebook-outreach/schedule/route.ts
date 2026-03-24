// src/app/api/admin/facebook-outreach/schedule/route.ts
import { NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { auth, currentUser } from "@clerk/nextjs/server";

async function guard() {
  const { userId } = await auth();
  if (!userId) return false;
  const user = await currentUser();
  return user?.emailAddresses?.[0]?.emailAddress === "gavegliojules@gmail.com";
}

export async function GET() {
  if (!(await guard())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const supabase = createSupabaseAdmin();
  const { data, error } = await supabase
    .from("facebook_outreach_schedule")
    .select("*, facebook_groups(group_name, group_url), facebook_templates(label)")
    .gte("scheduled_for", new Date().toISOString().split("T")[0])
    .order("scheduled_for");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
