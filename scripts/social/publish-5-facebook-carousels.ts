/**
 * Publie 5 carrousels sur la Page Facebook Vanzon Explorer
 * Utilise les photos Sanity + text overlay sharp + Facebook Graph API
 */

import sharp from "sharp";
import fs from "fs";
import path from "path";

require("dotenv").config({ path: ".env.local" });

const W = 1080;
const H = 1080; // Facebook carousels are square
const OUT_DIR = "/tmp/vanzon-fb-carousels";

const PAGE_TOKEN = "EAAVXmHIeffgBRQ9s09EnC8sQnGHPJZBHB0ZCZCKPd24ZCYvRHRpV7H4Sf9T0UrdbMkhLtuURWEW0PyjfOmCzJfy5rjTkGJ9ylzSIvMGlvX1QNBxcSw2NoJ2HXKMSlqMEHYRvAuakKMcaQjozjt4HwbSypd2kSLAxyR1PSuXoopCKeFi3yORSZAZCY5KiIlBsdxmY2i95AfveO1xMBer7EFtZCkCMA3bZAll2Ns5eck1HhjBfZBNImrnj9okcZD";
const PAGE_ID = "610034278871144";
const SANITY_CDN = "https://cdn.sanity.io/images/lewexa74/production";
const SANITY_TOKEN = process.env.SANITY_API_WRITE_TOKEN!;

// ── 5 POST DEFINITIONS ──

const POSTS = [
  {
    name: "Le vrai coût d'un van aménagé",
    caption: `Le vrai coût d'un van aménagé — les chiffres que personne ne montre 💰🚐

On vous donne le budget réel, poste par poste. Pas de bullshit, que du concret.

👉 Swipez pour voir le détail complet

#vanaménagé #vanlife #budgetvan #aménagementvan #vanlifefrance #roadtrip #paysbasque #vanzonexplorer`,
    slides: [
      { image: `${SANITY_CDN}/e9664378c5fdc652c33ae7342dfc52cc4960c8bf-1080x750.png`, title: "Le vrai coût\nd'un van aménagé", subtitle: "Swipez →", overlay: 0.5 },
      { image: `${SANITY_CDN}/2f1f2a6a93df20af09a71176b79f82316d856447-1317x746.png`, title: "Le van", subtitle: "8 000 — 18 000€\nen occasion", overlay: 0.55 },
      { image: `${SANITY_CDN}/dda288b52e0d1df82aa8d6ce33fbbf592861d8e7-2000x1500.webp`, title: "L'aménagement", subtitle: "DIY : 3 000 — 8 000€\nPro : 10 000 — 25 000€", overlay: 0.5 },
      { image: `${SANITY_CDN}/0dce51f1f42fde5dd51529fe1c61b74221edcb4e-4032x3024.jpg`, title: "Homologation\n+ Assurance", subtitle: "VASP : 600 — 1 200€\nAssurance : 50 — 80€/mois", overlay: 0.5 },
      { image: `${SANITY_CDN}/04d93973d30c5eede51f954d1432a50a5f82ef9b-1080x750.png`, title: "Budget total réel\n12 000 — 35 000€", subtitle: "Mais la liberté n'a pas de prix", overlay: 0.5 },
    ],
  },
  {
    name: "5 raisons de voyager en van",
    caption: `5 raisons de voyager en van plutôt qu'en hôtel 🚐✨

La liberté de se réveiller face à l'océan, de changer de spot quand on veut, et de vivre des moments inoubliables.

👉 Taguez quelqu'un avec qui vous partiriez demain

#vanlife #roadtrip #vanlifefrance #voyage #aventure #liberté #paysbasque #vanzonexplorer`,
    slides: [
      { image: `${SANITY_CDN}/d445397965472d300e3dc13d6b1c37503fe8ba25-1920x1080.png`, title: "5 raisons de voyager\nen van", subtitle: "Swipez →", overlay: 0.45 },
      { image: `${SANITY_CDN}/4ee40c1abb03d029487868808a159216a641e3ad-3829x2872.jpg`, title: "Se réveiller\noù on veut", subtitle: "Forêt, plage, montagne...", overlay: 0.45 },
      { image: `${SANITY_CDN}/7e04357061492ab4193c49d03351310cf245a106-1540x976.png`, title: "Zéro planning\nzéro contrainte", subtitle: "On part quand on veut", overlay: 0.5 },
      { image: `${SANITY_CDN}/f93fa16ab46d8934dcc3092a8e86fc80ebce4305-1080x750.png`, title: "150€/jour\nd'économies", subtitle: "Pas d'hôtel, pas de resto", overlay: 0.5 },
      { image: `${SANITY_CDN}/76e8c193a229c43dac55fc01d04d98a1a940d26d-4032x3024.jpg`, title: "Des moments\nque personne ne vit", subtitle: "Le café face à l'océan au réveil", overlay: 0.5 },
    ],
  },
  {
    name: "Checklist essentielle van",
    caption: `La checklist essentielle avant de partir en van 📋🚐

Que vous soyez débutant ou expérimenté, ces éléments sont indispensables pour un road trip réussi.

Enregistrez ce post pour votre prochain départ 🔖

#vanlife #checklist #roadtrip #vanaménagé #vanlifefrance #préparation #camping #paysbasque #vanzonexplorer`,
    slides: [
      { image: `${SANITY_CDN}/660105a28e577c33f642a8fdff528d88925642e3-1080x750.png`, title: "La checklist\navant de partir\nen van", subtitle: "Enregistrez ce post 🔖", overlay: 0.5 },
      { image: `${SANITY_CDN}/0dce51f1f42fde5dd51529fe1c61b74221edcb4e-4032x3024.jpg`, title: "Électricité", subtitle: "Batterie chargée\nPanneau solaire fonctionnel\nLampes + chargeurs", overlay: 0.55 },
      { image: `${SANITY_CDN}/dda288b52e0d1df82aa8d6ce33fbbf592861d8e7-2000x1500.webp`, title: "Cuisine", subtitle: "Réchaud + gaz\nVaisselle + couverts\nGlacière/frigo rempli", overlay: 0.5 },
      { image: `${SANITY_CDN}/669ae9a5f809c2117b88c4a189919b23b977658d-4032x3024.jpg`, title: "Couchage", subtitle: "Draps propres\nOreillers\nCouverture supplémentaire", overlay: 0.5 },
      { image: `${SANITY_CDN}/9da403575f5e7fa290ec4c8a65e1705e0182c95a-2182x1362.png`, title: "Sécurité", subtitle: "Assurance à jour\nTriangle + gilet\nTrousse de secours", overlay: 0.5 },
    ],
  },
  {
    name: "Fourgon vs Camping-car",
    caption: `Fourgon aménagé ou camping-car ? Le comparatif honnête 🤔

Chacun a ses avantages. Voici notre avis après des années sur la route.

Dites-nous en commentaire : Team fourgon ou Team camping-car ? 👇

#vanlife #fourgon #campingcar #comparatif #vanaménagé #vanlifefrance #roadtrip #vanzonexplorer`,
    slides: [
      { image: `${SANITY_CDN}/e9664378c5fdc652c33ae7342dfc52cc4960c8bf-1080x750.png`, title: "Fourgon\nvs\nCamping-car", subtitle: "Le comparatif honnête", overlay: 0.5 },
      { image: `${SANITY_CDN}/ae47ae1075d81e11a69239796e891411bfa0321b-2980x1684.png`, title: "Fourgon", subtitle: "✅ Discret, se gare partout\n✅ Conduite voiture\n✅ Péages moins chers", overlay: 0.55 },
      { image: `${SANITY_CDN}/7e04357061492ab4193c49d03351310cf245a106-1540x976.png`, title: "Camping-car", subtitle: "✅ Plus d'espace de vie\n✅ Douche intégrée\n✅ Soute de rangement", overlay: 0.55 },
      { image: `${SANITY_CDN}/77ab802420c6182c7ff7c3fe84d90df1e26c1d6f-3024x3990.jpg`, title: "Notre verdict", subtitle: "Si vous bougez souvent → Fourgon\nSi vous restez posés → Camping-car", overlay: 0.55 },
      { image: `${SANITY_CDN}/d445397965472d300e3dc13d6b1c37503fe8ba25-1920x1080.png`, title: "Et vous ?\nTeam fourgon\nou camping-car ?", subtitle: "Dites-le en commentaire 👇", overlay: 0.45 },
    ],
  },
  {
    name: "Où dormir en van en France",
    caption: `Où dormir en van en France ? Le guide rapide 📍🚐

Aires gratuites, campings, spots nature... Voici comment trouver les meilleurs endroits pour passer la nuit.

Enregistrez ce post pour votre prochain road trip 🔖

#vanlife #oùdormir #roadtrip #bivouac #camping #vanaménagé #vanlifefrance #park4night #paysbasque #vanzonexplorer`,
    slides: [
      { image: `${SANITY_CDN}/4ee40c1abb03d029487868808a159216a641e3ad-3829x2872.jpg`, title: "Où dormir\nen van\nen France ?", subtitle: "Le guide rapide 📍", overlay: 0.45 },
      { image: `${SANITY_CDN}/0b3f81d08627ba0b4423224029cb5016d0e7ed25-2048x1365.jpg`, title: "Aires de\ncamping-car", subtitle: "Gratuites ou 5-15€/nuit\nEau + vidange souvent inclus", overlay: 0.5 },
      { image: `${SANITY_CDN}/f93fa16ab46d8934dcc3092a8e86fc80ebce4305-1080x750.png`, title: "Campings", subtitle: "15-30€/nuit\nÉlectricité + douches\nIdéal familles", overlay: 0.5 },
      { image: `${SANITY_CDN}/d445397965472d300e3dc13d6b1c37503fe8ba25-1920x1080.png`, title: "Spots nature\n(Park4Night)", subtitle: "Gratuit\nBivouac 1 nuit toléré\nSoyez discrets", overlay: 0.5 },
      { image: `${SANITY_CDN}/9da403575f5e7fa290ec4c8a65e1705e0182c95a-2182x1362.png`, title: "Enregistrez\nce post 🔖", subtitle: "Vous en aurez besoin\n@vanzonexplorer", overlay: 0.5 },
    ],
  },
];

// ── Image generation ──

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
  const photo = await sharp(imgBuf).resize(W, H, { fit: "cover", position: "center" }).toBuffer();

  const overlayRect = Buffer.from(
    `<svg width="${W}" height="${H}"><rect width="${W}" height="${H}" fill="rgba(0,0,0,${slide.overlay})"/></svg>`
  );

  const titleLines = slide.title.split("\n");
  const subtitleLines = slide.subtitle.split("\n");
  const tSize = 52;
  const sSize = 24;
  const lh = 1.3;
  const totalH = titleLines.length * tSize * lh + 24 + subtitleLines.length * sSize * lh;
  const startY = (H - totalH) / 2;

  const titleSvg = titleLines.map((l, i) =>
    `<text x="${W / 2}" y="${startY + i * tSize * lh + tSize}" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="${tSize}" font-weight="800" fill="white" letter-spacing="-0.5">${escapeXml(l)}</text>`
  ).join("");

  const sY = startY + titleLines.length * tSize * lh + 24;
  const subSvg = subtitleLines.map((l, i) =>
    `<text x="${W / 2}" y="${sY + i * sSize * lh + sSize}" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="${sSize}" font-weight="500" fill="rgba(255,255,255,0.85)">${escapeXml(l)}</text>`
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

// ── Upload to Sanity for public URL ──

async function uploadToSanity(filePath: string): Promise<string> {
  const fileBuffer = fs.readFileSync(filePath);
  const filename = path.basename(filePath);
  const res = await fetch(
    `https://lewexa74.api.sanity.io/v2024-01-01/assets/images/production?filename=${filename}`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${SANITY_TOKEN}`, "Content-Type": "image/jpeg" },
      body: fileBuffer,
    }
  );
  const data = (await res.json()) as { document?: { url?: string } };
  return data.document?.url ?? "";
}

// ── Publish carousel to Facebook ──

async function publishFacebookCarousel(imageUrls: string[], caption: string, postName: string) {
  console.log(`\n📘 Publication Facebook: "${postName}"...`);

  // Upload each image to Facebook and get photo IDs
  const photoIds: string[] = [];
  for (const url of imageUrls) {
    const res = await fetch(
      `https://graph.facebook.com/v25.0/${PAGE_ID}/photos`,
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          url,
          published: "false",
          access_token: PAGE_TOKEN,
        }),
      }
    );
    const data = (await res.json()) as { id?: string; error?: { message: string } };
    if (!data.id) {
      console.error(`  ✗ Photo upload failed: ${JSON.stringify(data)}`);
      return;
    }
    photoIds.push(data.id);
  }
  console.log(`  ✓ ${photoIds.length} photos uploadées`);

  // Create multi-photo post
  const postBody: Record<string, string> = {
    message: caption,
    access_token: PAGE_TOKEN,
  };
  photoIds.forEach((id, i) => {
    postBody[`attached_media[${i}]`] = JSON.stringify({ media_fbid: id });
  });

  const postRes = await fetch(
    `https://graph.facebook.com/v25.0/${PAGE_ID}/feed`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams(postBody),
    }
  );
  const postData = (await postRes.json()) as { id?: string; error?: { message: string } };
  if (postData.id) {
    console.log(`  ✅ Post publié ! ID: ${postData.id}`);
  } else {
    console.error(`  ✗ Publication échouée: ${JSON.stringify(postData)}`);
  }
}

// ── Main ──

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  for (let p = 0; p < POSTS.length; p++) {
    const post = POSTS[p];
    console.log(`\n━━━ Post ${p + 1}/5: "${post.name}" ━━━`);

    // Generate slides
    console.log("🎨 Génération des slides...");
    const slidePaths: string[] = [];
    for (let i = 0; i < post.slides.length; i++) {
      const outPath = path.join(OUT_DIR, `post${p + 1}-slide${i + 1}.jpg`);
      await generateSlide(post.slides[i], outPath);
      slidePaths.push(outPath);
    }
    console.log(`  ✓ ${slidePaths.length} slides`);

    // Upload to Sanity
    console.log("☁️  Upload Sanity...");
    const publicUrls: string[] = [];
    for (const sp of slidePaths) {
      const url = await uploadToSanity(sp);
      publicUrls.push(url);
    }
    console.log(`  ✓ ${publicUrls.length} URLs publiques`);

    // Publish to Facebook
    await publishFacebookCarousel(publicUrls, post.caption, post.name);

    // Small delay between posts
    if (p < POSTS.length - 1) {
      console.log("⏳ Pause 5s...");
      await new Promise((r) => setTimeout(r, 5000));
    }
  }

  console.log("\n\n🎉 5 carrousels Facebook publiés !");
}

main().catch((e) => {
  console.error("❌", e.message);
  process.exit(1);
});
