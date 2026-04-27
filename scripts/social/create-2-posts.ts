/**
 * Génère 2 carrousels différents et les envoie sur Telegram pour validation
 */
import sharp from "sharp";
import fs from "fs";
import path from "path";

require("dotenv").config({ path: ".env.local" });

const W = 1080;
const H = 1350;
const OUT_DIR = "/tmp/vanzon-posts";

const SANITY_CDN = "https://cdn.sanity.io/images/lewexa74/production";

// ── POST 1: Éducatif — "Le vrai coût d'un van aménagé" ──
const POST1_SLIDES = [
  {
    image: `${SANITY_CDN}/e9664378c5fdc652c33ae7342dfc52cc4960c8bf-1080x750.png`,
    title: "Le vrai coût\nd'un van aménagé",
    subtitle: "(personne n'en parle) →",
    overlay: 0.5,
  },
  {
    image: `${SANITY_CDN}/2f1f2a6a93df20af09a71176b79f82316d856447-1317x746.png`,
    title: "💰 Le van",
    subtitle: "Fourgon d'occasion : 8 000 — 18 000€\nPlus il est récent, moins tu répares",
    overlay: 0.55,
  },
  {
    image: `${SANITY_CDN}/dda288b52e0d1df82aa8d6ce33fbbf592861d8e7-2000x1500.webp`,
    title: "🔧 L'aménagement",
    subtitle: "Matériaux + outillage : 3 000 — 8 000€\nOu sous-traité : 10 000 — 25 000€",
    overlay: 0.5,
  },
  {
    image: `${SANITY_CDN}/77ab802420c6182c7ff7c3fe84d90df1e26c1d6f-3024x3990.jpg`,
    title: "📋 L'homologation",
    subtitle: "VASP : 600 — 1 200€\nObligatoire pour assurer en camping-car",
    overlay: 0.5,
  },
  {
    image: `${SANITY_CDN}/0dce51f1f42fde5dd51529fe1c61b74221edcb4e-4032x3024.jpg`,
    title: "🔑 Assurance + CT",
    subtitle: "Assurance : 50 — 80€/mois\nContrôle technique : 80€/an",
    overlay: 0.5,
  },
  {
    image: `${SANITY_CDN}/669ae9a5f809c2117b88c4a189919b23b977658d-4032x3024.jpg`,
    title: "📊 Le total réel",
    subtitle: "Budget minimum : 12 000€\nBudget confort : 25 000 — 35 000€\nMais la liberté n'a pas de prix",
    overlay: 0.55,
  },
  {
    image: `${SANITY_CDN}/04d93973d30c5eede51f954d1432a50a5f82ef9b-1080x750.png`,
    title: "Sauvegarde ce post 🔖",
    subtitle: "Tu en auras besoin le jour\noù tu te lances\n\n@vanzonexplorer",
    overlay: 0.5,
  },
];

const POST1_CAPTION = `Le vrai coût d'un van aménagé — sans bullshit 💰🚐

On entend souvent "j'ai aménagé mon van pour 3000€". La réalité ? C'est rarement le cas quand on compte tout.

Voici le budget réel, poste par poste, pour que tu puisses planifier ton projet sans mauvaise surprise.

Sauvegarde ce post pour quand tu te lanceras 🔖

#vanaménagé #vanlife #vanlifefrance #aménagementvan #budgetvan #vanconversion #roadtrip #campervan #fourgonamenage #paysbasque #vanzonexplorer`;

// ── POST 2: Lifestyle — "5 raisons de voyager en van" ──
const POST2_SLIDES = [
  {
    image: `${SANITY_CDN}/d445397965472d300e3dc13d6b1c37503fe8ba25-1920x1080.png`,
    title: "5 raisons de voyager\nen van plutôt\nqu'en hôtel",
    subtitle: "SWIPE →",
    overlay: 0.45,
  },
  {
    image: `${SANITY_CDN}/4ee40c1abb03d029487868808a159216a641e3ad-3829x2872.jpg`,
    title: "1. Tu te réveilles\noù tu veux",
    subtitle: "Forêt, plage, montagne...\nton réveil change chaque matin",
    overlay: 0.45,
  },
  {
    image: `${SANITY_CDN}/7e04357061492ab4193c49d03351310cf245a106-1540x976.png`,
    title: "2. Zéro planning,\nzéro contrainte",
    subtitle: "Pas de check-in, pas de check-out\ntu pars quand tu veux",
    overlay: 0.5,
  },
  {
    image: `${SANITY_CDN}/0ae4827be0c39318cca4f43ff1febb903a3541c1-4032x3024.jpg`,
    title: "3. Ton espace\nà toi, partout",
    subtitle: "Ton lit, ta cuisine, tes affaires\ncomme à la maison, mais en mieux",
    overlay: 0.5,
  },
  {
    image: `${SANITY_CDN}/f93fa16ab46d8934dcc3092a8e86fc80ebce4305-1080x750.png`,
    title: "4. Tu économises\nà chaque voyage",
    subtitle: "Pas d'hôtel, pas de resto obligatoire\n150€/jour en moins facile",
    overlay: 0.5,
  },
  {
    image: `${SANITY_CDN}/76e8c193a229c43dac55fc01d04d98a1a940d26d-4032x3024.jpg`,
    title: "5. Tu vis des moments\nque personne ne vit",
    subtitle: "Le coucher de soleil depuis ton lit\nle café face à l'océan au réveil",
    overlay: 0.5,
  },
  {
    image: `${SANITY_CDN}/ae47ae1075d81e11a69239796e891411bfa0321b-2980x1684.png`,
    title: "Tag quelqu'un avec\nqui tu partirais 👇",
    subtitle: "@vanzonexplorer\nLocation de vans au Pays Basque",
    overlay: 0.5,
  },
];

const POST2_CAPTION = `5 raisons de voyager en van plutôt qu'en hôtel 🚐✨

On a testé les deux. Et franchement, y'a pas match.

Le van c'est la liberté de se réveiller face à l'océan, de changer de spot quand tu veux, et de vivre des moments que t'aurais jamais eu autrement.

Tag la personne avec qui tu partirais demain matin 👇

#vanlife #roadtrip #vanlifefrance #vanaménagé #voyage #aventure #liberté #paysbasque #camping #campervan #vanzonexplorer`;

// ── Génération ──

function escapeXml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/'/g, "&apos;");
}

async function downloadImage(url: string): Promise<Buffer> {
  const res = await fetch(url);
  return Buffer.from(await res.arrayBuffer());
}

async function generateSlide(
  slide: { image: string; title: string; subtitle: string; overlay: number },
  outPath: string
): Promise<void> {
  const imgBuf = await downloadImage(slide.image);

  const photo = await sharp(imgBuf)
    .resize(W, H, { fit: "cover", position: "center" })
    .toBuffer();

  const overlayRect = Buffer.from(
    `<svg width="${W}" height="${H}"><rect width="${W}" height="${H}" fill="rgba(0,0,0,${slide.overlay})"/></svg>`
  );

  const titleLines = slide.title.split("\n");
  const subtitleLines = slide.subtitle.split("\n");
  const tSize = 56;
  const sSize = 26;
  const lh = 1.3;

  const totalH = titleLines.length * tSize * lh + 28 + subtitleLines.length * sSize * lh;
  const startY = (H - totalH) / 2;

  const titleSvg = titleLines.map((l: string, i: number) =>
    `<text x="${W/2}" y="${startY + i * tSize * lh + tSize}" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="${tSize}" font-weight="800" fill="white" letter-spacing="-0.5">${escapeXml(l)}</text>`
  ).join("");

  const sY = startY + titleLines.length * tSize * lh + 28;
  const subSvg = subtitleLines.map((l: string, i: number) =>
    `<text x="${W/2}" y="${sY + i * sSize * lh + sSize}" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="${sSize}" font-weight="500" fill="rgba(255,255,255,0.85)">${escapeXml(l)}</text>`
  ).join("");

  const textLayer = Buffer.from(
    `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">${titleSvg}${subSvg}</svg>`
  );

  await sharp(photo)
    .composite([
      { input: overlayRect, top: 0, left: 0 },
      { input: textLayer, top: 0, left: 0 },
    ])
    .jpeg({ quality: 92 })
    .toFile(outPath);
}

async function sendToTelegram(postName: string, caption: string, slidePaths: string[]) {
  const token = process.env.TELEGRAM_BOT_TOKEN!;
  const chatId = process.env.TELEGRAM_CHAT_ID!;

  // Send caption first
  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text: `📸 <b>${postName}</b>\n\n${caption}`,
      parse_mode: "HTML",
    }),
  });

  // Send slides as photo album (max 10 per group)
  const formData = new FormData();
  const media: { type: string; media: string }[] = [];

  for (let i = 0; i < slidePaths.length; i++) {
    const fileKey = `photo${i}`;
    const fileBuffer = fs.readFileSync(slidePaths[i]);
    formData.append(fileKey, new Blob([fileBuffer], { type: "image/jpeg" }), `slide-${i + 1}.jpg`);
    media.push({ type: "photo", media: `attach://${fileKey}` });
  }

  formData.append("chat_id", chatId);
  formData.append("media", JSON.stringify(media));

  const res = await fetch(`https://api.telegram.org/bot${token}/sendMediaGroup`, {
    method: "POST",
    body: formData,
  });

  const data = await res.json();
  if (!data.ok) console.error("Telegram error:", JSON.stringify(data));
  else console.log(`  ✓ Envoyé sur Telegram (${slidePaths.length} slides)`);
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  // ── Post 1 ──
  console.log("🎨 Post 1 : Le vrai coût d'un van aménagé...");
  const post1Paths: string[] = [];
  for (let i = 0; i < POST1_SLIDES.length; i++) {
    const p = path.join(OUT_DIR, `post1-slide-${i + 1}.jpg`);
    await generateSlide(POST1_SLIDES[i], p);
    post1Paths.push(p);
    console.log(`  ✓ Slide ${i + 1}/${POST1_SLIDES.length}`);
  }

  console.log("📤 Envoi Post 1 sur Telegram...");
  await sendToTelegram("Post 1 — Le vrai coût d'un van aménagé", POST1_CAPTION, post1Paths);

  // ── Post 2 ──
  console.log("\n🎨 Post 2 : 5 raisons de voyager en van...");
  const post2Paths: string[] = [];
  for (let i = 0; i < POST2_SLIDES.length; i++) {
    const p = path.join(OUT_DIR, `post2-slide-${i + 1}.jpg`);
    await generateSlide(POST2_SLIDES[i], p);
    post2Paths.push(p);
    console.log(`  ✓ Slide ${i + 1}/${POST2_SLIDES.length}`);
  }

  console.log("📤 Envoi Post 2 sur Telegram...");
  await sendToTelegram("Post 2 — 5 raisons de voyager en van", POST2_CAPTION, post2Paths);

  console.log("\n✅ Les 2 posts sont sur Telegram ! Vérifie et dis-moi si tu valides.");
}

main().catch((err) => {
  console.error("❌", err.message);
  process.exit(1);
});
