/**
 * Test: génère un carrousel Instagram 5 slides avec text overlay
 * puis publie via Meta Graph API
 */

import sharp from "sharp";
import fs from "fs";
import path from "path";

const W = 1080;
const H = 1350;
const OUT_DIR = "/tmp/vanzon-carousel";

// Photos sources
const PHOTOS = [
  "/Users/julesgaveglio/Desktop/Projets/Vanzon 🚐/Photo van 📸/Photo groupe facebook/IMG_1358 4.jpg",
  "/Users/julesgaveglio/Desktop/Projets/Vanzon 🚐/Photo van 📸/Photo groupe facebook/IMG_5099 2 copie 2.jpg",
  "/Users/julesgaveglio/Desktop/Projets/Vanzon 🚐/Photo van 📸/Photo groupe facebook/IMG_6810.JPG",
  "/Users/julesgaveglio/Desktop/Projets/Vanzon 🚐/Photo van 📸/Photo groupe facebook/IMG_6813.JPG",
  "/Users/julesgaveglio/Desktop/Projets/Vanzon 🚐/Photo van 📸/Photo groupe facebook/IMG_6829.JPG",
];

// Slides content
const SLIDES = [
  {
    photo: PHOTOS[0],
    title: "5 choses que personne\nte dit avant d'acheter\nun van aménagé",
    subtitle: "SWIPE →",
    position: "center" as const,
  },
  {
    photo: PHOTOS[1],
    title: "1. Le budget réel\nest 2x plus élevé\nque prévu",
    subtitle: "Achat + aménagement + homologation\n+ assurance + entretien",
    position: "bottom" as const,
  },
  {
    photo: PHOTOS[2],
    title: "2. L'homologation VASP\npeut prendre 3 mois",
    subtitle: "Et sans elle, tu ne peux\npas assurer ton van en camping-car",
    position: "center" as const,
  },
  {
    photo: PHOTOS[3],
    title: "3. Un bon aménagement\nse revend plus cher\nque le van lui-même",
    subtitle: "C'est là que la plus-value se crée",
    position: "center" as const,
  },
  {
    photo: PHOTOS[4],
    title: "Sauvegarde ce post\npour plus tard 🔖",
    subtitle: "@vanzonexplorer\nLocation • Aménagement • Formation",
    position: "center" as const,
  },
];

function createSVGText(
  title: string,
  subtitle: string,
  position: "center" | "bottom"
): Buffer {
  const titleLines = title.split("\n");
  const subtitleLines = subtitle.split("\n");

  const titleFontSize = 58;
  const subtitleFontSize = 28;
  const lineHeight = 1.25;

  const titleBlockHeight = titleLines.length * titleFontSize * lineHeight;
  const subtitleBlockHeight = subtitleLines.length * subtitleFontSize * lineHeight;
  const totalHeight = titleBlockHeight + 30 + subtitleBlockHeight;

  const startY = position === "bottom" ? H - totalHeight - 120 : (H - totalHeight) / 2;

  const titleSVG = titleLines
    .map(
      (line, i) =>
        `<text x="${W / 2}" y="${startY + i * titleFontSize * lineHeight + titleFontSize}" text-anchor="middle" font-family="Inter, Helvetica, Arial, sans-serif" font-size="${titleFontSize}" font-weight="800" fill="white" letter-spacing="-1">${escapeXml(line)}</text>`
    )
    .join("\n");

  const subtitleStartY = startY + titleBlockHeight + 30;
  const subtitleSVG = subtitleLines
    .map(
      (line, i) =>
        `<text x="${W / 2}" y="${subtitleStartY + i * subtitleFontSize * lineHeight + subtitleFontSize}" text-anchor="middle" font-family="Inter, Helvetica, Arial, sans-serif" font-size="${subtitleFontSize}" font-weight="500" fill="rgba(255,255,255,0.85)">${escapeXml(line)}</text>`
    )
    .join("\n");

  const svg = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
    ${titleSVG}
    ${subtitleSVG}
  </svg>`;

  return Buffer.from(svg);
}

function escapeXml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

async function generateSlide(
  slide: (typeof SLIDES)[number],
  index: number
): Promise<string> {
  const outPath = path.join(OUT_DIR, `slide-${index + 1}.jpg`);

  // Resize and crop photo to 1080x1350
  const photo = await sharp(slide.photo)
    .resize(W, H, { fit: "cover", position: "center" })
    .toBuffer();

  // Dark overlay
  const overlay = Buffer.from(
    `<svg width="${W}" height="${H}"><rect width="${W}" height="${H}" fill="rgba(0,0,0,0.45)"/></svg>`
  );

  // Text layer
  const text = createSVGText(slide.title, slide.subtitle, slide.position);

  // Composite
  await sharp(photo)
    .composite([
      { input: overlay, top: 0, left: 0 },
      { input: text, top: 0, left: 0 },
    ])
    .jpeg({ quality: 92 })
    .toFile(outPath);

  console.log(`  ✓ Slide ${index + 1}: ${outPath}`);
  return outPath;
}

async function uploadToSanity(filePath: string): Promise<string> {
  // Upload to Sanity as an image asset → get a public URL
  const projectId = "lewexa74";
  const dataset = "production";
  const token = process.env.SANITY_API_WRITE_TOKEN;

  if (!token) throw new Error("SANITY_API_WRITE_TOKEN required");

  const fileBuffer = fs.readFileSync(filePath);
  const filename = path.basename(filePath);

  const res = await fetch(
    `https://${projectId}.api.sanity.io/v2024-01-01/assets/images/${dataset}?filename=${filename}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "image/jpeg",
      },
      body: fileBuffer,
    }
  );

  const data = (await res.json()) as { document?: { url?: string } };
  const url = data.document?.url;
  if (!url) throw new Error(`Upload failed: ${JSON.stringify(data)}`);
  return url;
}

async function publishCarousel(imageUrls: string[]) {
  const PAGE_TOKEN =
    "EAAVXmHIeffgBRQ9s09EnC8sQnGHPJZBHB0ZCZCKPd24ZCYvRHRpV7H4Sf9T0UrdbMkhLtuURWEW0PyjfOmCzJfy5rjTkGJ9ylzSIvMGlvX1QNBxcSw2NoJ2HXKMSlqMEHYRvAuakKMcaQjozjt4HwbSypd2kSLAxyR1PSuXoopCKeFi3yORSZAZCY5KiIlBsdxmY2i95AfveO1xMBer7EFtZCkCMA3bZAll2Ns5eck1HhjBfZBNImrnj9okcZD";
  const IG_ID = "17841473299322850";

  const caption = `5 choses que personne ne te dit avant d'acheter un van aménagé 🚐

On a fait toutes les erreurs pour toi. Voici ce qu'on aurait aimé savoir avant de se lancer.

Sauvegarde ce post, tu en auras besoin 🔖

#vanlife #vanaménagé #vanlifefrance #roadtrip #paysbasque #vanconversion #campervan #libertéenvan #aventure #vanzonexplorer`;

  // Step 1: Create individual media containers
  console.log("\n📤 Upload des slides vers Instagram...");
  const containerIds: string[] = [];

  for (const url of imageUrls) {
    const res = await fetch(
      `https://graph.facebook.com/v25.0/${IG_ID}/media`,
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          image_url: url,
          is_carousel_item: "true",
          access_token: PAGE_TOKEN,
        }),
      }
    );
    const data = (await res.json()) as { id?: string; error?: { message: string } };
    if (!data.id) throw new Error(`Container failed: ${JSON.stringify(data)}`);
    containerIds.push(data.id);
    console.log(`  ✓ Container ${containerIds.length}/${imageUrls.length}: ${data.id}`);
  }

  // Step 2: Create carousel container
  console.log("\n📦 Création du carrousel...");
  const carouselRes = await fetch(
    `https://graph.facebook.com/v25.0/${IG_ID}/media`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        media_type: "CAROUSEL",
        children: containerIds.join(","),
        caption,
        access_token: PAGE_TOKEN,
      }),
    }
  );
  const carouselData = (await carouselRes.json()) as { id?: string; error?: { message: string } };
  if (!carouselData.id) throw new Error(`Carousel failed: ${JSON.stringify(carouselData)}`);
  console.log(`  ✓ Carousel container: ${carouselData.id}`);

  // Step 3: Publish
  console.log("\n🚀 Publication...");
  const pubRes = await fetch(
    `https://graph.facebook.com/v25.0/${IG_ID}/media_publish`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        creation_id: carouselData.id,
        access_token: PAGE_TOKEN,
      }),
    }
  );
  const pubData = (await pubRes.json()) as { id?: string; error?: { message: string } };
  if (!pubData.id) throw new Error(`Publish failed: ${JSON.stringify(pubData)}`);
  console.log(`\n✅ Carrousel publié ! Post ID: ${pubData.id}`);
}

async function main() {
  // Load env
  require("dotenv").config({ path: ".env.local" });

  // Create output dir
  fs.mkdirSync(OUT_DIR, { recursive: true });

  // Generate slides
  console.log("🎨 Génération des slides...");
  const slidePaths: string[] = [];
  for (let i = 0; i < SLIDES.length; i++) {
    const p = await generateSlide(SLIDES[i], i);
    slidePaths.push(p);
  }

  // Upload to Sanity for public URLs
  console.log("\n☁️  Upload vers Sanity...");
  const publicUrls: string[] = [];
  for (const p of slidePaths) {
    const url = await uploadToSanity(p);
    publicUrls.push(url);
    console.log(`  ✓ ${path.basename(p)} → ${url}`);
  }

  // Publish carousel to Instagram
  await publishCarousel(publicUrls);
}

main().catch((err) => {
  console.error("❌ Erreur:", err.message);
  process.exit(1);
});
