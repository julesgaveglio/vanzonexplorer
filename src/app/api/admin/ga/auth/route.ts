import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";

export async function GET() {
  const check = await requireAdmin();
  if (check instanceof NextResponse) return check;
  const clientId = process.env.GOOGLE_GSC_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json({ error: "GOOGLE_GSC_CLIENT_ID not configured" }, { status: 500 });
  }

  const redirectUri = `${process.env.NEXT_PUBLIC_SITE_URL}/api/admin/ga/callback`;
  // GA4 Data API scope
  const scope = "https://www.googleapis.com/auth/analytics.readonly";

  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", scope);
  url.searchParams.set("access_type", "offline");
  url.searchParams.set("prompt", "consent");

  return NextResponse.redirect(url.toString());
}
