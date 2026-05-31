import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const check = await requireAdmin();
  if (check instanceof NextResponse) return check;

  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error");

  if (error || !code) {
    return new NextResponse(`<h1>Erreur OAuth</h1><p>${error || "Pas de code"}</p>`, {
      status: 400,
      headers: { "Content-Type": "text/html" },
    });
  }

  const clientId = process.env.GOOGLE_GSC_CLIENT_ID!;
  const clientSecret = process.env.GOOGLE_GSC_CLIENT_SECRET!;
  const redirectUri = `${url.protocol}//${url.host}/api/admin/drive/callback`;

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });

  const tokens = await tokenRes.json();

  if (!tokens.refresh_token) {
    return new NextResponse(
      `<h1>Erreur</h1><pre>${JSON.stringify(tokens, null, 2)}</pre>
       <p>Verifie que le redirect URI <code>${redirectUri}</code> est bien autorise dans Google Cloud Console.</p>`,
      { status: 400, headers: { "Content-Type": "text/html" } }
    );
  }

  return new NextResponse(
    `<html><body style="font-family:sans-serif;max-width:600px;margin:40px auto;padding:20px">
      <h1>✅ Google Drive connecté !</h1>
      <p>Copie ce refresh token et ajoute-le dans le <code>.env</code> de la VM :</p>
      <pre style="background:#f1f5f9;padding:16px;border-radius:8px;word-break:break-all;font-size:14px">${tokens.refresh_token}</pre>
      <p style="color:#64748b;font-size:14px">Variable : <code>GOOGLE_DRIVE_REFRESH_TOKEN</code></p>
    </body></html>`,
    { headers: { "Content-Type": "text/html" } }
  );
}
