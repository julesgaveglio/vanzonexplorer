#!/usr/bin/env tsx
/**
 * road-trip-seed-agent.ts
 *
 * Génère des road trips synthétiques pour seeder le pipeline de publication.
 * Crée 45+ requêtes dans road_trip_requests avec status='sent'.
 * Génère également le contenu encyclopédique des 15 régions.
 *
 * Usage:
 *   npx tsx scripts/agents/road-trip-seed-agent.ts
 *   npx tsx scripts/agents/road-trip-seed-agent.ts --dry-run
 */

import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";
import { notifyTelegram } from "../lib/telegram";
import { startRun, finishRun } from "../lib/agent-runs";
import { createCostTracker } from "../lib/ai-costs";

const isDryRun = process.argv.includes("--dry-run");

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ── Données seed ──────────────────────────────────────────────────────────────

const REGIONS = [
  { slug: "pays-basque", name: "Pays Basque", mountain: true },
  { slug: "bretagne", name: "Bretagne", mountain: false },
  { slug: "provence", name: "Provence", mountain: false },
  { slug: "camargue", name: "Camargue", mountain: false },
  { slug: "alsace", name: "Alsace", mountain: false },
  { slug: "dordogne", name: "Dordogne", mountain: false },
  { slug: "corse", name: "Corse", mountain: true },
  { slug: "normandie", name: "Normandie", mountain: false },
  { slug: "ardeche", name: "Ardèche", mountain: false },
  { slug: "pyrenees", name: "Pyrénées", mountain: true },
  { slug: "loire", name: "Val de Loire", mountain: false },
  { slug: "jura", name: "Jura", mountain: true },
  { slug: "vercors", name: "Vercors", mountain: true },
  { slug: "cotentin", name: "Cotentin", mountain: false },
  { slug: "landes", name: "Landes", mountain: false },
];

const COMBINATIONS = [
  { duree: 5, style_voyage: "aventure", profil_voyageur: "couple", periode: "printemps", interets: ["randonnée", "nature", "gastronomie"] },
  { duree: 7, style_voyage: "famille", profil_voyageur: "famille", periode: "été", interets: ["plage", "villages", "activités enfants"] },
  { duree: 3, style_voyage: "romantique", profil_voyageur: "couple", periode: "automne", interets: ["gastronomie", "culture", "marchés"] },
];

// Combos extras pour régions populaires
const EXTRA_COMBOS = [
  { region: "pays-basque", duree: 10, style_voyage: "aventure", profil_voyageur: "solo", periode: "été", interets: ["surf", "randonnée", "gastronomie"] },
  { region: "bretagne", duree: 10, style_voyage: "découverte", profil_voyageur: "amis", periode: "printemps", interets: ["pêche", "culture celtique", "crêpes"] },
  { region: "corse", duree: 10, style_voyage: "aventure", profil_voyageur: "couple", periode: "juin", interets: ["randonnée", "plages", "villages perchés"] },
  { region: "provence", duree: 7, style_voyage: "détente", profil_voyageur: "famille", periode: "juillet", interets: ["lavande", "marchés", "gastronomie"] },
  { region: "ardeche", duree: 4, style_voyage: "aventure", profil_voyageur: "amis", periode: "été", interets: ["kayak", "gorges", "baignade"] },
];

// ── Génération itinéraire minimal pour seed ────────────────────────────────────

function generateMinimalItinerary(regionName: string, duree: number, style: string, interets: string[]): Record<string, unknown> {
  const jours = [];
  for (let i = 1; i <= duree; i++) {
    jours.push({
      numero: i,
      titre: `Jour ${i} — Découverte de ${regionName}`,
      spots: [
        { nom: `${regionName} — Spot ${i}A`, description: `Point d'intérêt incontournable`, type: "nature", lat: 0, lon: 0 },
        { nom: `${regionName} — Spot ${i}B`, description: `Autre lieu remarquable`, type: "village", lat: 0, lon: 0 },
      ],
      camping: { nom: `Camping ${regionName} ${i}`, options: ["électricité", "piscine"] },
      restaurant: { nom: `Restaurant local ${i}`, type: "traditionnel", specialite: "Cuisine régionale" },
    });
  }
  return {
    titre: `Road trip ${duree}j en ${regionName} — ${style}`,
    region: regionName,
    duree,
    style,
    interets,
    jours,
  };
}

// ── Génération contenu encyclopédique région ──────────────────────────────────

async function generateRegionDescription(regionName: string, mountain: boolean, cost: ReturnType<typeof createCostTracker>): Promise<string> {
  const response = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 800,
    messages: [{
      role: "user",
      content: `Écris un contenu encyclopédique de 400-500 mots sur la région "${regionName}" en France, pour un site de van life/road trip.
Inclus : géographie, relief${mountain ? " (montagneux)" : ""}, climat, meilleure saison pour un road trip en van, 3-4 points d'intérêt incontournables, spécialités gastronomiques, et conseils pratiques pour camper en van.
Style : informatif, expert, citable par les moteurs IA. Pas de markdown, juste du texte fluide.`
    }],
  });

  cost.addTokens(response.usage.input_tokens, response.usage.output_tokens, "claude-haiku-4-5-20251001");
  return response.content[0].type === "text" ? response.content[0].text : "";
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const runId = await startRun("road-trip-seed", {});
  const cost = createCostTracker("road-trip-seed");

  console.log(`🌱 Road Trip Seed Agent — ${isDryRun ? "DRY RUN" : "LIVE"}`);

  try {
    let insertedCount = 0;
    let regionUpdatedCount = 0;

    // 1. Générer les 45 requêtes synthétiques
    const rows: Record<string, unknown>[] = [];

    for (const region of REGIONS) {
      for (const combo of COMBINATIONS) {
        rows.push({
          prenom: "Vanzon",
          email: "seed@vanzonexplorer.com",
          region: region.name,
          duree: combo.duree,
          style_voyage: combo.style_voyage,
          profil_voyageur: combo.profil_voyageur,
          periode: combo.periode,
          interets: combo.interets,
          budget: "moyen",
          experience_van: true,
          status: "sent",
          itineraire_json: generateMinimalItinerary(region.name, combo.duree, combo.style_voyage, combo.interets),
          sent_at: new Date().toISOString(),
        });
      }
    }

    // Ajouter les extras
    for (const extra of EXTRA_COMBOS) {
      const regionData = REGIONS.find(r => r.slug === extra.region)!;
      rows.push({
        prenom: "Vanzon",
        email: "seed@vanzonexplorer.com",
        region: regionData.name,
        duree: extra.duree,
        style_voyage: extra.style_voyage,
        profil_voyageur: extra.profil_voyageur,
        periode: extra.periode,
        interets: extra.interets,
        budget: "moyen",
        experience_van: true,
        status: "sent",
        itineraire_json: generateMinimalItinerary(regionData.name, extra.duree, extra.style_voyage, extra.interets),
        sent_at: new Date().toISOString(),
      });
    }

    console.log(`📋 ${rows.length} requêtes à insérer`);

    if (!isDryRun) {
      const { error } = await supabase.from("road_trip_requests").insert(rows);
      if (error) throw new Error(`Insert error: ${error.message}`);
      insertedCount = rows.length;
      console.log(`✅ ${insertedCount} requêtes insérées`);
    }

    // 2. Générer les descriptions régions
    console.log("📝 Génération des descriptions régions...");
    for (const region of REGIONS) {
      console.log(`  → ${region.name}...`);
      const description = await generateRegionDescription(region.name, region.mountain, cost);

      if (!isDryRun) {
        await supabase
          .from("road_trip_regions")
          .update({ description })
          .eq("slug", region.slug);
        regionUpdatedCount++;
      } else {
        console.log(`  [DRY] Description générée (${description.split(" ").length} mots)`);
      }

      // Pause pour éviter rate limits
      await new Promise(r => setTimeout(r, 1000));
    }

    await notifyTelegram(
      `🌱 *Road Trip Seed Agent*\n\n` +
      `${isDryRun ? "⚠️ DRY RUN\n\n" : ""}` +
      `✅ ${insertedCount} requêtes insérées\n` +
      `📝 ${regionUpdatedCount} régions enrichies\n` +
      `💰 Coût : $${cost.getTotalCost().toFixed(4)}`
    );

    await finishRun(runId, "success", { insertedCount, regionUpdatedCount, cost: cost.getTotalCost() });
    console.log("\n🎉 Seed terminé !");

  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("❌ Erreur seed:", message);
    await finishRun(runId, "error", { error: message });
    process.exit(1);
  }
}

main();
