import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const clientId = process.env.GOOGLE_GSC_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json({ error: "GOOGLE_GSC_CLIENT_ID not configured" }, { status: 500 });
  }

  // Derive base URL from the actual request — works on localhost AND production without env var
  const reqUrl = new URL(req.url);
  const baseUrl = `${reqUrl.protocol}//${reqUrl.host}`;
  const redirectUri = `${baseUrl}/api/admin/google/callback`;

  // Combined scopes: GSC + GA4
  const scopes = [
    "https://www.googleapis.com/auth/webmasters.readonly",
    "https://www.googleapis.com/auth/analytics.readonly",
  ].join(" ");

  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", scopes);
  url.searchParams.set("access_type", "offline");
  url.searchParams.set("prompt", "consent"); // force new refresh_token with all scopes

  return NextResponse.redirect(url.toString());
}
