import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import type { SeoReportData } from "@/types/seo-report";

export async function POST(req: NextRequest) {
  const check = await requireAdmin();
  if (check instanceof NextResponse) return check;

  const report: SeoReportData = await req.json();

  const sb = createSupabaseAdmin();
  const { data, error } = await sb
    .from("seo_reports")
    .insert({
      url: report.url,
      label: report.label ?? null,
      score_global: report.scoreGlobal,
      report_data: report,
    })
    .select("id")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ id: data.id });
}

export async function GET() {
  const check = await requireAdmin();
  if (check instanceof NextResponse) return check;

  const sb = createSupabaseAdmin();
  const { data, error } = await sb
    .from("seo_reports")
    .select("id, url, label, score_global, created_at")
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
