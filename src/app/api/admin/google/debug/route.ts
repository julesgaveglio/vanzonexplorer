import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const check = await requireAdmin();
  if (check instanceof NextResponse) return check;
  const reqUrl = new URL(req.url);
  const baseUrl = `${reqUrl.protocol}//${reqUrl.host}`;
  const redirectUri = `${baseUrl}/api/admin/google/callback`;

  return NextResponse.json({
    redirectUri,
    reqUrl: req.url,
    host: reqUrl.host,
    protocol: reqUrl.protocol,
    GOOGLE_GSC_CLIENT_ID: process.env.GOOGLE_GSC_CLIENT_ID ? "✅ présent" : "❌ MANQUANT",
    GOOGLE_GSC_CLIENT_SECRET: process.env.GOOGLE_GSC_CLIENT_SECRET ? "✅ présent" : "❌ MANQUANT",
  });
}
