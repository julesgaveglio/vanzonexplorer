/**
 * Cron: Qonto → Airtable + Supabase sync
 * Runs every 6h — fetches new transactions, classifies with Groq AI,
 * writes to Supabase finance_transactions + Airtable (Finances + Dépenses 💳)
 *
 * Delegates to /api/admin/sync-qonto GET endpoint with CRON_SECRET
 */

import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://vanzonexplorer.com";
    const res = await fetch(
      `${baseUrl}/api/admin/sync-qonto?secret=${encodeURIComponent(process.env.CRON_SECRET || "")}`,
    );

    if (!res.ok) {
      const text = await res.text();
      console.error(`[cron/sync-qonto] Upstream error ${res.status}: ${text}`);
      return NextResponse.json({ error: text }, { status: res.status });
    }

    const result = await res.json();
    console.log("[cron/sync-qonto]", result);
    return NextResponse.json(result);
  } catch (error) {
    console.error("[cron/sync-qonto] Error:", error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
