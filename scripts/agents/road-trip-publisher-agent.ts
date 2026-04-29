#!/usr/bin/env tsx
/**
 * road-trip-publisher-agent.ts
 *
 * Transforme les road trips générés (status='sent') en articles SEO Sanity.
 * Pipeline : Supabase → Images → GeoJSON → Gemini 2.5 Flash → Sanity → Notification
 *
 * Usage:
 *   npx tsx scripts/agents/road-trip-publisher-agent.ts
 *
 * Required env vars:
 *   GEMINI_API_KEY
 *   SANITY_API_WRITE_TOKEN
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *   PIXABAY_API_KEY (optional)
 *   SERPAPI_KEY (optional)
 *   TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID (optional)
 */

import fs from "fs";
import path from "path";
import { createClient } from "@sanity/client";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { normalizeRegion, getRegionName } from "../lib/region-normalizer";
import { notifyTelegram } from "../lib/telegram";
import { startRun, finishRun } from "../lib/agent-runs";
import { createCostTracker } from "../lib/ai-costs";
import { fetchSpotImage } from "../lib/image-pipeline";
import { buildGeoJSON, type SpotGeo } from "../lib/geojson-builder";
import { notifySearchEngines } from "../../src/lib/search-indexing";
import { calculateQualityScore } from "../lib/quality-score";
import { slugify } from "../../src/lib/slugify";

// Resolve paths
const PROJECT_ROOT = path.resolve(path.dirname(__filename), "../..");

const SANITY_PROJECT = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "lewexa74";
const SANITY_DATASET = process.env.NEXT_PUBLIC_SANITY_DATASET || "production";

const sanity = createClient({
  projectId: SANITY_PROJECT,
  dataset: SANITY_DATASET,
  apiVersion: "2024-01-01",
  token: process.env.SANITY_API_WRITE_TOKEN,
  useCdn: false,
});

const supabase = createSupabaseClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ── Load prompt ───────────────────────────────────────────────────────────────
function loadPrompt(): string {
  const promptPath = path.join(PROJECT_ROOT, "scripts/agents/prompts/road-trip-publisher.md");
  if (fs.existsSync(promptPath)) return fs.readFileSync(promptPath, "utf-8");
  return "Tu es un expert SEO vanlife. Génère un article road trip structuré en JSON valide.";
}

// ── Gemini 2.5 Flash ─────────────────────────────────────────────────────────
async function callGemini(
  prompt: string,
  opts: { json?: boolean; maxTokens?: number } = {}
): Promise<{ text: string; inputTokens: number; outputTokens: number }> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY manquante");

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          maxOutputTokens: opts.maxTokens ?? 8192,
          temperature: 0.5,
          thinkingConfig: { thinkingBudget: 0 },
          ...(opts.json ? { responseMimeType: "application/json" } : {}),
        },
      }),
    }
  );

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gemini API error ${res.status}: ${errText}`);
  }

  const json = await res.json() as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number };
  };

  const text = json.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  if (!text) throw new Error("Gemini returned empty response");

  return {
    text,
    inputTokens: json.usageMetadata?.promptTokenCount ?? 0,
    outputTokens: json.usageMetadata?.candidatesTokenCount ?? 0,
  };
}

// ── Portable Text builder ─────────────────────────────────────────────────────
function textToPortableText(text: string): unknown[] {
  return text.split("\n\n").filter(Boolean).map((para) => ({
    _type: "block",
    _key: Math.random().toString(36).slice(2, 9),
    style: "normal",
    children: [{ _type: "span", _key: Math.random().toString(36).slice(2, 9), text: para.trim(), marks: [] }],
    markDefs: [],
  }));
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  const runId = await startRun("road-trip-publisher", {});
  const cost = createCostTracker("road-trip-publisher");

  try {
    // 1. Récupérer un road trip RÉCENT à traiter (créé dans les dernières 6h)
    //    Les anciens road trips sont ignorés — on ne publie que les nouvelles demandes.
    const targetId = process.argv[2] || null;
    const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString();
    let query = supabase
      .from("road_trip_requests")
      .select("*")
      .eq("status", "sent")
      .is("article_sanity_id", null)
      .gte("created_at", sixHoursAgo)
      .order("created_at", { ascending: false })
      .limit(1);
    if (targetId) query = query.eq("id", targetId) as typeof query;
    const { data: requests, error } = await query;

    if (error) throw new Error(`Supabase query error: ${error.message}`);
    if (!requests || requests.length === 0) {
      console.log("✅ Aucun road trip à traiter.");
      await finishRun(runId, "success", { message: "nothing to process" });
      return;
    }

    const request = requests[0];
    console.log(`🗺️ Traitement road trip #${request.id} — ${request.region}`);

    // 2. Lock : status = article_pending
    await supabase
      .from("road_trip_requests")
      .update({ status: "article_pending" })
      .eq("id", request.id);

    // 3. Normaliser la région
    const regionSlug = normalizeRegion(request.region);
    const regionName = getRegionName(regionSlug);
    console.log(`📍 Région : ${request.region} → ${regionSlug} (${regionName})`);

    // 4. Extraire les spots de l'itinéraire
    const itineraire = request.itineraire_json as Record<string, unknown>;
    const jours = (itineraire?.jours as Array<Record<string, unknown>>) || [];

    // 5. Pipeline images pour chaque spot
    console.log("🖼️ Récupération des images...");
    const joursAvecImages = await Promise.all(
      jours.map(async (jour, jourIdx) => {
        const spots = (jour.spots as Array<Record<string, unknown>>) || [];
        const spotsAvecImages = await Promise.all(
          spots.map(async (spot) => {
            const nomSpot = String(spot.nom || spot.name || "");
            if (!nomSpot) return spot;
            const wikiThumb = (spot.wiki as Record<string, unknown>)?.thumbnail as string | undefined;
            const image = await fetchSpotImage(nomSpot, regionName, String(spot.type || "paysage"), wikiThumb);
            return { ...spot, fetchedImage: image };
          })
        );
        return { ...jour, spots: spotsAvecImages, numero: jourIdx + 1 };
      })
    );

    // 6. Construire GeoJSON
    const spotsGeo: SpotGeo[] = [];
    for (const jour of joursAvecImages) {
      const spots = (jour.spots as Array<Record<string, unknown>>) || [];
      for (const spot of spots) {
        const lat = Number(spot.lat || (spot.coordinates as Record<string, number>)?.lat);
        const lon = Number(spot.lon || spot.lng || (spot.coordinates as Record<string, number>)?.lon);
        if (lat && lon) {
          spotsGeo.push({ nom: String(spot.nom || ""), lat, lon, type: String(spot.type || ""), jour: Number(jour.numero) });
        }
      }
    }
    const geojson = buildGeoJSON(spotsGeo);
    console.log(`🗺️ GeoJSON : ${geojson.features.length} features`);

    // 7. Appel Gemini 2.5 Flash
    console.log("🤖 Génération contenu avec Gemini 2.5 Flash...");
    const systemPrompt = loadPrompt();
    const fullPrompt = `${systemPrompt}

---

Voici les données du road trip à transformer en article SEO :

RÉGION : ${regionName}
DURÉE : ${request.duree} jours
STYLE : ${request.style_voyage}
PROFIL : ${request.profil_voyageur}
PÉRIODE : ${request.periode}
INTÉRÊTS : ${(request.interets || []).join(", ")}

ITINÉRAIRE JSON :
${JSON.stringify(itineraire, null, 2).slice(0, 8000)}

Génère l'article en JSON valide comme spécifié dans les instructions.`;

    const geminiResult = await callGemini(fullPrompt, { json: true, maxTokens: 8192 });

    cost.addGemini(geminiResult.inputTokens, geminiResult.outputTokens, 0, "gemini-2.5-flash");

    let articleData: Record<string, unknown>;
    try {
      const jsonMatch = geminiResult.text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("No JSON found in response");
      articleData = JSON.parse(jsonMatch[0]);
    } catch (err) {
      throw new Error(`Failed to parse Gemini JSON response: ${err}`);
    }

    // 8. Construire le document Sanity
    const articleSlug = String(articleData.articleSlug || slugify(`road-trip-${request.duree}j-${regionSlug}-${request.style_voyage || "van"}`));
    const title = String(articleData.seoTitle || `Road trip ${request.duree}j en ${regionName} en van`);

    // Construire les jours Sanity avec les images
    const sanityJours = joursAvecImages.map((jour, idx) => {
      const jourData = (articleData.joursEnrichis as Record<string, unknown>[])?.[idx] || {};
      const spots = (jour.spots as Array<Record<string, unknown>>) || [];
      const spotsEnrichis = (jourData.spotsEnrichis as Record<string, unknown>[]) || [];

      return {
        _key: Math.random().toString(36).slice(2, 9),
        _type: "jour",
        numero: idx + 1,
        titre: String(jourData.titre || `Jour ${idx + 1}`),
        tips: String(jourData.tips || ""),
        spots: spots.map((spot, sIdx) => {
          const enrichi = spotsEnrichis[sIdx] || {};
          const fetchedImage = spot.fetchedImage as Record<string, unknown> | undefined;
          return {
            _key: Math.random().toString(36).slice(2, 9),
            _type: "spot",
            nom: String(spot.nom || ""),
            description: String(enrichi.descriptionEnrichie || spot.description || ""),
            type: String(enrichi.type || spot.type || "nature"),
            mapsUrl: String(spot.mapsUrl || spot.maps_url || ""),
            wikiExcerpt: String((spot.wiki as Record<string, unknown>)?.excerpt || spot.wikiExcerpt || ""),
            wikiUrl: String((spot.wiki as Record<string, unknown>)?.url || spot.wikiUrl || ""),
            lat: Number(spot.lat || 0),
            lon: Number(spot.lon || spot.lng || 0),
            ...(fetchedImage?.sanityAssetId ? {
              photo: {
                _type: "image",
                asset: { _type: "reference", _ref: String(fetchedImage.sanityAssetId) },
                alt: String(fetchedImage.alt || ""),
                credit: String(fetchedImage.credit || ""),
              }
            } : {}),
          };
        }),
      };
    });

    const sanityDoc = {
      _type: "roadTripArticle",
      title,
      slug: { _type: "slug", current: articleSlug },
      regionSlug,
      regionName,
      seoTitle: String(articleData.seoTitle || title),
      seoDescription: String(articleData.seoDescription || ""),
      chapeau: String(articleData.chapeau || ""),
      excerpt: String(articleData.summary80w || "").slice(0, 200),
      duree: request.duree,
      style: request.style_voyage,
      profil: request.profil_voyageur,
      periode: request.periode,
      interets: request.interets || [],
      intro: textToPortableText(String(articleData.intro || "")),
      jours: sanityJours,
      conseilsPratiques: (articleData.conseilsPratiques as string[]) || [],
      faqItems: ((articleData.faqItems as Array<{ question: string; answer: string }>) || []).map(f => ({
        _key: Math.random().toString(36).slice(2, 9),
        _type: "faqItem",
        question: f.question,
        answer: f.answer,
      })),
      enResume: (articleData.enResume as string[]) || [],
      geojson: JSON.stringify(geojson),
      status: "review",
      sourceRequestId: String(request.id),
    };

    // 9. Calculer quality_score
    const scoreResult = calculateQualityScore({
      title: sanityDoc.title,
      seoTitle: sanityDoc.seoTitle,
      seoDescription: sanityDoc.seoDescription,
      chapeau: sanityDoc.chapeau,
      faqItems: sanityDoc.faqItems,
      jours: sanityDoc.jours as Parameters<typeof calculateQualityScore>[0]["jours"],
      summary_80w: String(articleData.summary80w || ""),
      geojson: sanityDoc.geojson,
    });
    console.log(`📊 Quality score: ${scoreResult.total}/100`);

    // 10. Créer document Sanity
    const createdDoc = await sanity.create(sanityDoc);
    console.log(`✅ Article Sanity créé : ${createdDoc._id}`);

    // 11. Update Supabase
    await supabase
      .from("road_trip_requests")
      .update({
        status: "review",
        article_sanity_id: createdDoc._id,
        article_slug: articleSlug,
        region_slug: regionSlug,
        summary_80w: String(articleData.summary80w || ""),
        geojson: geojson,
        quality_score: scoreResult.total,
      })
      .eq("id", request.id);

    // 12. Incrémenter article_count région
    await supabase.rpc("increment_region_article_count", { region_slug_param: regionSlug })
      .then(() => console.log(`📈 article_count incrémenté pour ${regionSlug}`))
      .catch(() => {
        // RPC may not exist yet, ignore
      });

    // 13. Notification Telegram
    await notifyTelegram(
      `🗺️ *Road Trip Publisher*\n\n` +
      `✅ Article créé : *${title}*\n` +
      `📍 Région : ${regionName}\n` +
      `⏱️ ${request.duree} jours · ${request.style_voyage}\n` +
      `📊 Score qualité : ${scoreResult.total}/100\n` +
      `🔗 Sanity ID : \`${createdDoc._id}\`\n` +
      `💰 Coût : $${cost.toRunResult().costEur.toFixed(4)}`
    );

    await finishRun(runId, "success", {
      sanityId: createdDoc._id,
      articleSlug,
      regionSlug,
      qualityScore: scoreResult.total,
      cost: cost.toRunResult().costEur,
    });

    // 14. Notify search engines (IndexNow + Google Ping)
    await notifySearchEngines([
      `https://vanzonexplorer.com/road-trip/${regionSlug}/${articleSlug}`,
      `https://vanzonexplorer.com/road-trip/${regionSlug}`,
    ]);

    console.log(`\n🎉 Road trip publié avec succès !`);
    console.log(`   Slug : ${articleSlug}`);
    console.log(`   Score : ${scoreResult.total}/100`);
    console.log(`   Coût : $${cost.toRunResult().costEur.toFixed(4)}`);

  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("❌ Erreur agent publisher:", message);
    await notifyTelegram(`❌ *Road Trip Publisher* - Erreur :\n\`${message}\``);
    await finishRun(runId, "error", { error: message });
    process.exit(1);
  }
}

main();
