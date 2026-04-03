#!/usr/bin/env tsx
/**
 * seo-image-renamer.ts
 *
 * Agent nocturne de rattrapage SEO pour la médiathèque Vanzon Explorer.
 * Scanne tous les mediaAssets sans alt text (ou alt < 15 chars),
 * analyse chaque image avec Gemini 2.5-flash Vision,
 * et applique alt, title, tags SEO optimisés dans Sanity.
 *
 * Usage: npx tsx scripts/agents/seo-image-renamer.ts [--dry-run]
 *
 * Env requis:
 *   SANITY_API_WRITE_TOKEN
 *   GEMINI_API_KEY
 *   TELEGRAM_BOT_TOKEN (optionnel)
 *   TELEGRAM_CHAT_ID (optionnel)
 */

import * as dotenv from "dotenv";
import * as path from "path";
import { fileURLToPath } from "url";
import { createClient } from "@sanity/client";
import { notifyTelegram } from "../lib/telegram";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, "..", "..", ".env.local") });

const DRY_RUN = process.argv.includes("--dry-run");
const BATCH_SIZE = 5;       // images traitées en parallèle
const DELAY_MS = 800;       // délai entre batches (rate limit Gemini)
const MAX_IMAGES = 200;     // plafond de sécurité par run

const sanity = createClient({
  projectId: "lewexa74",
  dataset: "production",
  apiVersion: "2023-01-01",
  token: process.env.SANITY_API_WRITE_TOKEN,
  useCdn: false,
});

// ── Types ─────────────────────────────────────────────────────────────────────

interface MediaAsset {
  _id: string;
  title: string;
  alt: string;
  tags?: string[];
  url: string;
}

interface GeminiResponse {
  candidates?: Array<{
    content?: { parts?: Array<{ text?: string }> };
  }>;
}

interface SeoMeta {
  alt?: string;
  title?: string;
  tags?: string[];
}

// ── Détection images sans bon SEO ─────────────────────────────────────────────

function needsSeoFix(asset: MediaAsset): boolean {
  const alt = asset.alt ?? "";
  const title = (asset.title ?? "").toLowerCase();

  if (!alt || alt.length < 15) return true;
  if (!title || title.length < 3) return true;

  // Titres génériques sans valeur SEO
  if (/^(img|dsc|photo|image|screenshot|capture|pic|file)[-_\d]/i.test(title)) return true;

  return false;
}

// ── Analyse Gemini ─────────────────────────────────────────────────────────────

async function analyzeWithGemini(imageUrl: string, apiKey: string): Promise<SeoMeta | null> {
  try {
    const imageRes = await fetch(`${imageUrl}?auto=format&fit=max&w=1200&q=85`);
    if (!imageRes.ok) throw new Error(`HTTP ${imageRes.status} pour ${imageUrl}`);

    const contentType = imageRes.headers.get("content-type") ?? "image/webp";
    const buffer = Buffer.from(await imageRes.arrayBuffer());
    const base64 = buffer.toString("base64");

    const prompt = `Tu es expert SEO pour Vanzon Explorer, location de vans aménagés au Pays Basque (France).

Analyse cette photo et réponds UNIQUEMENT avec un JSON valide (pas de markdown) :
{
  "alt": "<texte alternatif SEO en français, 60-150 caractères, décrit précisément ce qu'on voit, inclut vanlife/Pays Basque>",
  "title": "<slug kebab-case, 3-6 mots clés SEO séparés par des tirets, sans extension>",
  "tags": ["<tag1>", "<tag2>", "<tag3>", "<tag4>", "<tag5>"]
}

Règles : 5 à 8 tags en français, mots-clés courts (1-3 mots). Pas de "image de" dans l'alt. Inclure "Vanzon Explorer" si le van est visible.`;

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [
            { inline_data: { mime_type: contentType, data: base64 } },
            { text: prompt },
          ]}],
          generationConfig: { temperature: 0.3, maxOutputTokens: 400 },
        }),
      }
    );

    if (!res.ok) {
      const errBody = await res.text();
      throw new Error(`Gemini ${res.status}: ${errBody}`);
    }

    const data = (await res.json()) as GeminiResponse;
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("Aucun JSON dans la réponse Gemini");

    return JSON.parse(jsonMatch[0]) as SeoMeta;
  } catch (err) {
    console.warn(`  ⚠️  Gemini échoué pour ${imageUrl}:`, err);
    return null;
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`\n🔍 SEO Image Renamer — ${DRY_RUN ? "DRY RUN" : "LIVE"}`);
  console.log("─".repeat(50));

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("❌ GEMINI_API_KEY manquante");
    process.exit(1);
  }

  // Récupérer toutes les images candidates
  const allAssets = await sanity.fetch<MediaAsset[]>(`
    *[_type == "mediaAsset" && defined(image.asset)] {
      _id,
      title,
      "alt": image.alt,
      tags,
      "url": image.asset->url
    } | order(_createdAt desc) [0..${MAX_IMAGES - 1}]
  `);

  const candidates = allAssets.filter(needsSeoFix);
  console.log(`📦 ${allAssets.length} images au total → ${candidates.length} à traiter`);

  if (candidates.length === 0) {
    console.log("✅ Tout est déjà bien renseigné !");
    await notifyTelegram("✅ SEO Image Renamer : rien à traiter, tout est OK.");
    return;
  }

  let fixed = 0;
  let errors = 0;

  // Traitement par batches
  for (let i = 0; i < candidates.length; i += BATCH_SIZE) {
    const batch = candidates.slice(i, i + BATCH_SIZE);
    console.log(`\n[${i + 1}-${Math.min(i + BATCH_SIZE, candidates.length)}/${candidates.length}]`);

    await Promise.all(batch.map(async (asset) => {
      if (!asset.url) {
        console.log(`  ⏭️  ${asset._id} — pas d'URL`);
        return;
      }

      const meta = await analyzeWithGemini(asset.url, apiKey);
      if (!meta) { errors++; return; }

      const altPreview = meta.alt?.slice(0, 60) ?? "";
      console.log(`  ✅ ${asset.title || asset._id} → "${altPreview}..."`);

      if (!DRY_RUN) {
        const patch = sanity.patch(asset._id);
        if (meta.alt) patch.set({ "image.alt": String(meta.alt).slice(0, 200) });
        if (meta.title && (!asset.title || asset.title.length < 5)) {
          patch.set({ title: String(meta.title).replace(/[^a-z0-9-]/g, "-").slice(0, 80) });
        }
        if (meta.tags?.length) patch.set({ tags: meta.tags.slice(0, 8).map(String) });
        await patch.commit();
      }
      fixed++;
    }));

    // Délai entre batches pour respecter les rate limits
    if (i + BATCH_SIZE < candidates.length) {
      await new Promise(r => setTimeout(r, DELAY_MS));
    }
  }

  // Résumé
  console.log("\n─".repeat(50));
  console.log(`🏁 Terminé — ${fixed} corrigées, ${errors} erreurs`);

  const msg = DRY_RUN
    ? `🔍 SEO Image Renamer (dry-run) : ${candidates.length} images à traiter détectées.`
    : `✅ SEO Image Renamer : ${fixed}/${candidates.length} images renommées avec succès. ${errors > 0 ? `⚠️ ${errors} erreurs.` : ""}`;

  await notifyTelegram(msg);
}

main().catch(async (err) => {
  console.error("💥 Erreur fatale:", err);
  await notifyTelegram(`❌ SEO Image Renamer échoué : ${err}`);
  process.exit(1);
});
