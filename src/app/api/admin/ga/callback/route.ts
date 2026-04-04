import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const check = await requireAdmin();
  if (check instanceof NextResponse) return check;
  const code = req.nextUrl.searchParams.get("code");
  const error = req.nextUrl.searchParams.get("error");

  if (error) {
    return NextResponse.redirect(new URL(`/admin/blog?ga_error=${error}`, req.url));
  }

  if (!code) {
    return NextResponse.json({ error: "No code returned" }, { status: 400 });
  }

  const clientId = process.env.GOOGLE_GSC_CLIENT_ID!;
  const clientSecret = process.env.GOOGLE_GSC_CLIENT_SECRET!;
  const redirectUri = `${process.env.NEXT_PUBLIC_SITE_URL}/api/admin/ga/callback`;

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
    const html = `<!DOCTYPE html>
<html><head><title>GA4 OAuth Error</title></head><body style="font-family:sans-serif;padding:2rem;max-width:600px">
<h2>Erreur OAuth GA4</h2>
<pre style="background:#f1f5f9;padding:1rem;border-radius:8px;overflow:auto">${JSON.stringify(tokens, null, 2)}</pre>
<p>Vérifie que le redirect URI <code>${redirectUri}</code> est bien autorisé dans Google Cloud Console.</p>
</body></html>`;
    return new NextResponse(html, { headers: { "Content-Type": "text/html" } });
  }

  const html = `<!DOCTYPE html>
<html><head><title>GA4 Connecté ✓</title></head>
<body style="font-family:sans-serif;padding:2rem;max-width:700px;background:#f8fafc">
<div style="background:white;border-radius:16px;padding:2rem;border:1px solid #e2e8f0;box-shadow:0 1px 3px rgba(0,0,0,0.1)">
  <h2 style="color:#16a34a;margin-top:0">✓ Google Analytics 4 connecté</h2>
  <p>Copie ce <strong>refresh_token</strong> et ajoute-le dans ton <code>.env.local</code> :</p>
  <div style="background:#1e293b;color:#86efac;padding:1rem;border-radius:8px;font-family:monospace;font-size:13px;word-break:break-all;margin:1rem 0">
    GOOGLE_GA_REFRESH_TOKEN=${tokens.refresh_token}
  </div>
  <p style="color:#64748b;font-size:14px">Puis redémarre le serveur avec <code>npm run dev</code>.</p>
  <a href="/admin/blog" style="display:inline-block;background:#F9AB00;color:white;padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:600;margin-top:1rem">← Retour au dashboard</a>
</div>
</body></html>`;

  return new NextResponse(html, { headers: { "Content-Type": "text/html" } });
}
