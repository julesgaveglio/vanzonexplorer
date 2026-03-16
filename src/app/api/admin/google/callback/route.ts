import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const error = req.nextUrl.searchParams.get("error");

  if (error) {
    return NextResponse.redirect(new URL(`/admin/blog?google_error=${error}`, req.url));
  }

  if (!code) {
    return NextResponse.json({ error: "No code returned" }, { status: 400 });
  }

  const clientId = process.env.GOOGLE_GSC_CLIENT_ID!;
  const clientSecret = process.env.GOOGLE_GSC_CLIENT_SECRET!;
  const reqUrl = new URL(req.url);
  const baseUrl = `${reqUrl.protocol}//${reqUrl.host}`;
  const redirectUri = `${baseUrl}/api/admin/google/callback`;

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
<html><head><title>Erreur OAuth</title><meta charset="utf-8"></head>
<body style="font-family:system-ui,sans-serif;padding:2rem;max-width:600px;margin:0 auto">
<h2 style="color:#dc2626">Erreur OAuth Google</h2>
<pre style="background:#f1f5f9;padding:1rem;border-radius:8px;overflow:auto;font-size:13px">${JSON.stringify(tokens, null, 2)}</pre>
<p style="color:#64748b">Vérifie que le redirect URI <code style="background:#f1f5f9;padding:2px 6px;border-radius:4px">${redirectUri}</code> est bien autorisé dans <a href="https://console.cloud.google.com/apis/credentials" target="_blank">Google Cloud Console</a>.</p>
<a href="/admin/blog" style="display:inline-block;background:#6366f1;color:white;padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:600;margin-top:1rem">← Retour</a>
</body></html>`;
    return new NextResponse(html, { headers: { "Content-Type": "text/html" } });
  }

  const refreshToken = tokens.refresh_token as string;

  const html = `<!DOCTYPE html>
<html><head><title>Google Connecté ✓</title><meta charset="utf-8"></head>
<body style="font-family:system-ui,sans-serif;padding:2rem;max-width:720px;margin:0 auto;background:#f8fafc">
<div style="background:white;border-radius:16px;padding:2rem;border:1px solid #e2e8f0;box-shadow:0 1px 3px rgba(0,0,0,0.1)">
  <h2 style="color:#16a34a;margin-top:0">✓ Google Search Console + GA4 connectés</h2>
  <p style="color:#475569">Copie cette variable dans ton fichier <code style="background:#f1f5f9;padding:2px 6px;border-radius:4px">.env.local</code> :</p>

  <div style="background:#0f172a;border-radius:10px;padding:1.25rem;margin:1rem 0;position:relative">
    <div style="color:#94a3b8;font-size:11px;font-family:monospace;margin-bottom:6px;text-transform:uppercase;letter-spacing:0.05em">.env.local</div>
    <div id="token-line" style="color:#86efac;font-family:monospace;font-size:13px;word-break:break-all">GOOGLE_REFRESH_TOKEN=${refreshToken}</div>
    <button onclick="copyToken()" id="copy-btn"
      style="position:absolute;top:12px;right:12px;background:#1e293b;border:1px solid #334155;color:#94a3b8;padding:6px 12px;border-radius:6px;font-size:12px;cursor:pointer;font-family:system-ui">
      Copier
    </button>
  </div>

  <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:1rem;margin:1rem 0">
    <p style="margin:0;color:#15803d;font-size:14px"><strong>📋 Étapes :</strong></p>
    <ol style="margin:0.5rem 0 0;padding-left:1.5rem;color:#166534;font-size:14px;line-height:1.8">
      <li>Copie la ligne ci-dessus dans <code>.env.local</code></li>
      <li>Supprime ou commente <code>GOOGLE_GSC_REFRESH_TOKEN</code> (remplacé)</li>
      <li>Redémarre le serveur : <code>npm run dev</code></li>
      <li>Retourne sur le dashboard — GSC et GA4 seront connectés</li>
    </ol>
  </div>

  <p style="color:#94a3b8;font-size:12px;margin-bottom:1.5rem">
    Ce token unique couvre les deux scopes : <code>webmasters.readonly</code> + <code>analytics.readonly</code>
  </p>

  <a href="/admin/blog" style="display:inline-block;background:linear-gradient(135deg,#6366f1,#4f46e5);color:white;padding:12px 24px;border-radius:10px;text-decoration:none;font-weight:600;font-size:14px">
    ← Retour au dashboard
  </a>
</div>
<script>
function copyToken() {
  const text = document.getElementById('token-line').textContent;
  navigator.clipboard.writeText(text).then(() => {
    const btn = document.getElementById('copy-btn');
    btn.textContent = '✓ Copié';
    btn.style.color = '#86efac';
    setTimeout(() => { btn.textContent = 'Copier'; btn.style.color = '#94a3b8'; }, 2000);
  });
}
</script>
</body></html>`;

  return new NextResponse(html, { headers: { "Content-Type": "text/html" } });
}
