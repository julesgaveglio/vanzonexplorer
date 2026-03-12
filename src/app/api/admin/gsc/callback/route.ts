import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const error = req.nextUrl.searchParams.get("error");

  if (error) {
    return NextResponse.redirect(
      new URL(`/admin/blog?gsc_error=${error}`, req.url)
    );
  }

  if (!code) {
    return NextResponse.json({ error: "No code returned" }, { status: 400 });
  }

  const clientId = process.env.GOOGLE_GSC_CLIENT_ID!;
  const clientSecret = process.env.GOOGLE_GSC_CLIENT_SECRET!;
  const redirectUri = `${process.env.NEXT_PUBLIC_SITE_URL}/api/admin/gsc/callback`;

  // Exchange code for tokens
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

  if (!tokenRes.ok || !tokens.refresh_token) {
    // Show the refresh token in a simple page so the user can copy it
    const html = `<!DOCTYPE html>
<html><head><title>GSC OAuth Error</title></head><body style="font-family:sans-serif;padding:2rem;max-width:600px">
<h2>Erreur OAuth GSC</h2>
<pre style="background:#f1f5f9;padding:1rem;border-radius:8px;overflow:auto">${JSON.stringify(tokens, null, 2)}</pre>
<p>Vérifie que le redirect URI <code>${redirectUri}</code> est bien autorisé dans Google Cloud Console.</p>
</body></html>`;
    return new NextResponse(html, { headers: { "Content-Type": "text/html" } });
  }

  // Display refresh token for the user to copy into .env.local
  const html = `<!DOCTYPE html>
<html><head><title>GSC Connecté ✓</title></head>
<body style="font-family:sans-serif;padding:2rem;max-width:700px;background:#f8fafc">
<div style="background:white;border-radius:16px;padding:2rem;border:1px solid #e2e8f0;box-shadow:0 1px 3px rgba(0,0,0,0.1)">
  <h2 style="color:#16a34a;margin-top:0">✓ Google Search Console connecté</h2>
  <p>Copie ce <strong>refresh_token</strong> et ajoute-le dans ton <code>.env.local</code> :</p>
  <div style="background:#1e293b;color:#86efac;padding:1rem;border-radius:8px;font-family:monospace;font-size:13px;word-break:break-all;margin:1rem 0">
    GOOGLE_GSC_REFRESH_TOKEN=${tokens.refresh_token}
  </div>
  <p style="color:#64748b;font-size:14px">Puis redémarre le serveur avec <code>npm run dev</code>.</p>
  <a href="/admin/blog" style="display:inline-block;background:#6366f1;color:white;padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:600;margin-top:1rem">← Retour au dashboard</a>
</div>
</body></html>`;

  return new NextResponse(html, { headers: { "Content-Type": "text/html" } });
}
