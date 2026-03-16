import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const error = req.nextUrl.searchParams.get("error");

  if (error || !code) {
    return NextResponse.json({ error: error ?? "No code received" }, { status: 400 });
  }

  const clientId = process.env.PINTEREST_APP_ID!;
  const clientSecret = process.env.PINTEREST_APP_SECRET!;
  const redirectUri = `${process.env.NEXT_PUBLIC_SITE_URL}/vanzon/api/pinterest/callback`;

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const res = await fetch("https://api.pinterest.com/v5/oauth/token", {
    method: "POST",
    headers: {
      "Authorization": `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
    }),
  });

  const data = await res.json();

  if (!res.ok) {
    return NextResponse.json({ error: data }, { status: 400 });
  }

  // Display the tokens — copy access_token to .env.local
  return NextResponse.json({
    message: "✅ Copie ces valeurs dans .env.local",
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_in: data.expires_in,
    refresh_token_expires_in: data.refresh_token_expires_in,
    scope: data.scope,
  });
}
