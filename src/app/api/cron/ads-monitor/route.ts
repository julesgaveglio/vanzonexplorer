/**
 * Cron: Ads Monitor — daily tunnel health check
 * Runs daily at 20h UTC (22h Paris)
 * Sends Telegram report with metrics + alerts
 */

import { NextResponse } from "next/server";
import { dailyHealthCheck } from "@/lib/ads-monitor";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await dailyHealthCheck();
    return NextResponse.json(result);
  } catch (error) {
    console.error("[cron/ads-monitor] Error:", error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
