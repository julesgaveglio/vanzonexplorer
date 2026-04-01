// scripts/get-gmail-token.ts
// Script one-shot pour obtenir le GMAIL_REFRESH_TOKEN.
// Usage : npx tsx scripts/get-gmail-token.ts
// Pré-requis :
//   1. GOOGLE_GSC_CLIENT_ID et GOOGLE_GSC_CLIENT_SECRET dans .env.local
//   2. http://localhost:3333/callback ajouté dans Google Cloud Console → Credentials → OAuth 2.0

import * as http from "http";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const CLIENT_ID     = process.env.GOOGLE_GSC_CLIENT_ID!;
const CLIENT_SECRET = process.env.GOOGLE_GSC_CLIENT_SECRET!;
const REDIRECT_URI  = "http://localhost:3333/callback";

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error("❌ GOOGLE_GSC_CLIENT_ID ou GOOGLE_GSC_CLIENT_SECRET manquant dans .env.local");
  process.exit(1);
}

const SCOPES = [
  "https://www.googleapis.com/auth/gmail.send",
  "https://www.googleapis.com/auth/gmail.settings.basic",
  "https://www.googleapis.com/auth/gmail.readonly",
].join(" ");

const authUrl =
  `https://accounts.google.com/o/oauth2/v2/auth` +
  `?client_id=${CLIENT_ID}` +
  `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
  `&response_type=code` +
  `&scope=${encodeURIComponent(SCOPES)}` +
  `&access_type=offline` +
  `&prompt=consent`;

console.log("\n🔗 Ouvre cette URL dans ton navigateur :\n");
console.log(authUrl);
console.log("\n⏳ En attente du callback sur http://localhost:3333...\n");

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url!, "http://localhost:3333");
  const code  = url.searchParams.get("code");
  const error = url.searchParams.get("error");

  if (error) {
    console.error(`\n❌ Erreur Google : ${error}`);
    console.error(`   Description : ${url.searchParams.get("error_description") ?? "—"}`);
    if (error === "redirect_uri_mismatch") {
      console.error(`\n   ➜ Ajoute http://localhost:3333/callback dans Google Cloud Console → Credentials → ton OAuth Client → Authorized redirect URIs\n`);
    }
    res.end(`❌ Erreur Google : ${error}. Voir le terminal.`);
    server.close();
    return;
  }

  if (!code) {
    console.log("\n⚠️  Requête reçue sans code ni erreur (probablement favicon). En attente...");
    res.end("En attente du vrai callback...");
    return;
  }

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id:     CLIENT_ID,
      client_secret: CLIENT_SECRET,
      redirect_uri:  REDIRECT_URI,
      grant_type:    "authorization_code",
    }),
  });

  const data = await tokenRes.json() as { refresh_token?: string; error?: string; error_description?: string };

  if (data.refresh_token) {
    console.log("\n✅ GMAIL_REFRESH_TOKEN obtenu !\n");
    console.log("Ajoute cette ligne dans .env.local et dans Vercel :\n");
    console.log(`GMAIL_REFRESH_TOKEN=${data.refresh_token}\n`);
    res.end("✅ Token obtenu ! Tu peux fermer cet onglet et revenir dans le terminal.");
  } else {
    console.error("\n❌ Erreur :", data.error, data.error_description);
    res.end("❌ Erreur, voir le terminal.");
  }

  server.close();
});

server.listen(3333, () => {
  console.log("Serveur en attente sur le port 3333...");
});
