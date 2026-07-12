/**
 * Script one-shot : ajoute une image de couverture (flamants roses Camargue)
 * à tous les articles road trip de la région "camargue" sans coverImage.
 *
 * Usage : npx tsx scripts/add-cover-camargue.ts
 */

import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { createClient } from "@sanity/client";

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "lewexa74",
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
  apiVersion: "2024-01-01",
  token: process.env.SANITY_API_WRITE_TOKEN,
  useCdn: false,
});

async function main() {
  // 1. Trouver tous les articles Camargue sans image de couverture
  const articles = await sanity.fetch<Array<{ _id: string; title: string; coverImage?: unknown }>>(
    `*[_type == "roadTripArticle" && regionSlug == "camargue"] { _id, title, coverImage }`
  );

  console.log(`Trouvé ${articles.length} article(s) Camargue`);

  const toUpdate = articles.filter((a) => !a.coverImage);
  console.log(`${toUpdate.length} article(s) sans image de couverture`);

  if (toUpdate.length === 0) {
    console.log("Rien à faire.");
    return;
  }

  // 2. Chercher une belle image Pexels de flamants roses en Camargue
  const PEXELS_KEY = process.env.PEXELS_API_KEY;
  if (!PEXELS_KEY) throw new Error("PEXELS_API_KEY manquant dans .env.local");

  const queries = ["Camargue flamants roses", "flamingos Camargue France", "Camargue nature"];
  let photoData: { id: number; photographer: string; src: { large2x: string } } | null = null;
  for (const q of queries) {
    console.log(`Recherche Pexels : "${q}"...`);
    const res = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(q)}&orientation=landscape&per_page=5&size=large`,
      { headers: { Authorization: PEXELS_KEY } }
    );
    if (!res.ok) continue;
    const data = await res.json();
    if (data.photos?.length > 0) {
      photoData = data.photos[0];
      break;
    }
  }

  if (!photoData) throw new Error("Aucune photo trouvée sur Pexels");

  console.log(`Photo sélectionnée : #${photoData.id} par ${photoData.photographer}`);

  // 3. Télécharger et uploader dans Sanity
  const imgRes = await fetch(photoData.src.large2x);
  if (!imgRes.ok) throw new Error("Impossible de télécharger la photo Pexels");
  const arrayBuffer = await imgRes.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const imageAsset = await sanity.assets.upload("image", buffer, {
    filename: `cover-camargue-pexels-${photoData.id}.jpg`,
    contentType: "image/jpeg",
  });
  console.log(`Image uploadée : ${imageAsset._id}`);

  const credit = `Photo by ${photoData.photographer} on Pexels`;

  // 4. Patcher chaque article
  for (const article of toUpdate) {
    await sanity
      .patch(article._id)
      .set({
        coverImage: {
          _type: "image",
          asset: { _type: "reference", _ref: imageAsset._id },
          alt: "Flamants roses en Camargue",
          credit,
        },
      })
      .commit();
    console.log(`✓ Article mis à jour : ${article.title} (${article._id})`);
  }

  console.log("Terminé !");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
