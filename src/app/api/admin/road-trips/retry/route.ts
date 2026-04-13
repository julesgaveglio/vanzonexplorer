import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { Resend } from "resend";
import { groqWithFallback } from "@/lib/groq-with-fallback";
import { buildRoadTripEmailV2 } from "@/emails/road-trip-v2";
import {
  getPOIsFromCache,
  scrapePOIsViaTavily,
  scrapeOvernightSpotsViaTavily,
  upsertPOIs,
} from "@/lib/road-trip/poi-cache";
import type {
  GeneratedItineraryV2,
  POIRow,
  InterestKey,
  BudgetLevel,
  OvernightPreference,
  GroupType,
} from "@/types/roadtrip";

export const maxDuration = 60;

// Reverse mappings from stored legacy values
const LEGACY_TO_INTEREST: Record<string, InterestKey> = {
  sports_aventure: "sport",
  nature_rando: "nature",
  gastronomie: "gastronomie",
  culture_patrimoine: "culture",
  plages_surf: "plages",
  vie_nocturne: "soirees",
};

const LEGACY_TO_BUDGET: Record<string, BudgetLevel> = {
  economique: "faible",
  confort: "moyen",
  premium: "eleve",
};

const GROUP_LABELS: Record<GroupType, string> = {
  solo: "voyageur solo",
  couple: "couple",
  amis: "groupe d'amis",
  famille: "famille avec enfants",
};

const BUDGET_LABELS: Record<BudgetLevel, string> = {
  faible: "budget serré (< 30€/pers/jour)",
  moyen: "budget confort (30-80€/pers/jour)",
  eleve: "budget premium (80€+/pers/jour)",
};

const OVERNIGHT_LABELS: Record<OvernightPreference, string> = {
  gratuit: "parkings gratuits & spots sauvages tolérés",
  aires_officielles: "aires camping-car officielles (gratuit ou < 15€/nuit)",
  camping: "campings van-friendly (15-30€/nuit)",
  mix: "mix des options selon les étapes",
};

const SCOPE_INSTRUCTIONS: Record<"france" | "france_espagne", string> = {
  france: `Périmètre : Pays Basque FRANÇAIS uniquement (Labourd, Basse-Navarre, Soule).
Villes/spots autorisés : Biarritz, Bayonne, Anglet, Saint-Jean-de-Luz, Hendaye, Espelette, Ainhoa, Saint-Jean-Pied-de-Port, Itxassou, Sare, La Rhune, Iraty, Gorges de Kakuetta, Larrau, Bidarray, Cambo-les-Bains, etc. N'inclus PAS de spots espagnols.`,
  france_espagne: `Périmètre : Pays Basque FRANÇAIS + ESPAGNOL. L'utilisateur est ouvert à traverser la frontière.
Côté français : Biarritz, Bayonne, Anglet, Saint-Jean-de-Luz, Hendaye, Espelette, Ainhoa, Saint-Jean-Pied-de-Port, Itxassou, Sare, La Rhune, Iraty, etc.
Côté espagnol (Euskadi) : Hondarribia / Fontarrabie, Pasaia, San Sebastián / Donostia, Getaria, Zarautz, Bilbao, Guernica, Bermeo, Lekeitio, Mundaka, etc.
Inclus au moins 1 étape côté espagnol si la durée ≥ 2 jours. Précise la monnaie (€), signale le passage de frontière et rappelle l'assurance van valable en Espagne dans les tips.`,
};

export async function POST(req: NextRequest) {
  const adminCheck = await requireAdmin();
  if (adminCheck instanceof NextResponse) return adminCheck;

  const { id } = (await req.json()) as { id?: string };
  if (!id) {
    return NextResponse.json({ error: "id requis" }, { status: 400 });
  }

  const supabase = createSupabaseAdmin();

  // Load the existing record
  const { data: record, error: fetchError } = await supabase
    .from("road_trip_requests")
    .select("*")
    .eq("id", id)
    .single();

  if (fetchError || !record) {
    return NextResponse.json({ error: "Demande introuvable" }, { status: 404 });
  }

  if (record.status !== "error") {
    return NextResponse.json(
      { error: "Seules les demandes en erreur peuvent être renvoyées" },
      { status: 400 }
    );
  }

  // Reconstruct input from stored fields
  const firstname = record.lead_firstname ?? record.prenom;
  const email = record.lead_email ?? record.email;
  const budgetLevel: BudgetLevel =
    (record.budget_level as BudgetLevel) ??
    LEGACY_TO_BUDGET[record.budget] ??
    "moyen";
  const overnightPreference: OvernightPreference =
    (record.overnight_preference as OvernightPreference) ?? "mix";
  const groupType: GroupType =
    (record.group_type as GroupType) ?? "couple";
  const durationDays: number = record.duree ?? 3;
  const scope: "france" | "france_espagne" = "france";

  // Reconstruct interests from legacy values
  const interests: InterestKey[] = (record.interets as string[] ?? [])
    .map((i: string) => LEGACY_TO_INTEREST[i])
    .filter((i): i is InterestKey => !!i);
  if (interests.length === 0) interests.push("nature");

  try {
    // Mark as pending during retry
    await supabase
      .from("road_trip_requests")
      .update({ status: "pending" })
      .eq("id", id);

    // Step 1: Fetch POIs
    const { pois: cachedPOIs, overnightSpots: cachedOvernight } =
      await getPOIsFromCache(interests, overnightPreference, budgetLevel);

    let pois = cachedPOIs;
    let overnightSpots = cachedOvernight;

    if (pois.length < 10) {
      const scraped = await scrapePOIsViaTavily(interests, budgetLevel);
      if (scraped.length > 0) {
        await upsertPOIs(scraped);
        pois = [...cachedPOIs, ...(scraped as unknown as POIRow[])];
      }
    }

    if (overnightSpots.length < 3) {
      const scraped = await scrapeOvernightSpotsViaTavily(overnightPreference);
      if (scraped.length > 0) {
        await upsertPOIs(scraped);
        overnightSpots = [
          ...cachedOvernight,
          ...(scraped as unknown as POIRow[]),
        ];
      }
    }

    if (pois.length === 0) {
      throw new Error("Aucun POI disponible");
    }

    // Step 2: Generate itinerary via Groq
    const groupLabel = GROUP_LABELS[groupType];
    const budgetLabel = BUDGET_LABELS[budgetLevel];
    const overnightLabel = OVERNIGHT_LABELS[overnightPreference];
    const scopeInstruction = SCOPE_INSTRUCTIONS[scope];

    const sortedPois = [...pois].sort((a, b) => {
      const coordsA = (a as unknown as { coordinates?: string }).coordinates;
      const coordsB = (b as unknown as { coordinates?: string }).coordinates;
      if (!coordsA && !coordsB) return 0;
      if (!coordsA) return 1;
      if (!coordsB) return -1;
      const latA = Number(coordsA.split(",")[0]);
      const latB = Number(coordsB.split(",")[0]);
      return latB - latA;
    });

    const poiSummary = sortedPois.slice(0, 30).map((p) => ({
      name: p.name,
      category: p.category,
      subcategory: p.subcategory,
      city: p.location_city,
      address: p.address,
      description: p.description,
      url: p.external_url || p.google_maps_url,
      tags: p.tags,
      budget: p.budget_level,
    }));

    const overnightSummary = overnightSpots.slice(0, 20).map((o) => ({
      name: o.name,
      type: o.overnight_type,
      price: o.overnight_price_per_night,
      city: o.location_city,
      address: o.address,
      coordinates:
        (o as unknown as { coordinates?: string }).coordinates ??
        o.overnight_coordinates,
      maps_url: o.google_maps_url,
      amenities: o.overnight_amenities,
      restrictions: o.overnight_restrictions,
      description: o.description,
      capacity: o.overnight_capacity,
    }));

    const systemPrompt = `Tu es un expert du Pays Basque et un vanlifer expérimenté. Tu crées des itinéraires van RÉALISTES et PRATIQUES. Règles absolues :
- Maximum 1 à 2 activités par jour (pas plus — c'est un road trip, pas un marathon).
- Les étapes doivent suivre un parcours géographique LOGIQUE (pas de zigzag entre la côte et la montagne dans la même journée).
- Le spot de nuit de chaque soir doit être PROCHE de la première activité du lendemain matin (pour dormir sur place et partir tôt).
- Inclus un temps de route estimé entre les étapes principales.
- Adapte le ton et les suggestions au profil voyageur (solo = liberté, couple = romantique, amis = festif, famille = sécurité + enfants).

Réponds UNIQUEMENT avec du JSON valide. Aucun texte avant ou après. Aucun backtick markdown.`;

    const userPrompt = `Crée un road trip van au Pays Basque pour ce profil :
- Voyageur : ${groupLabel} (${firstname})
- Durée : ${durationDays} jour${durationDays > 1 ? "s" : ""}
- Centres d'intérêt : ${interests.join(", ")}
- Budget activités/repas : ${budgetLabel}
- Préférence nuit en van : ${overnightLabel}

${scopeInstruction}

POIs activités disponibles (utilise UNIQUEMENT ceux-ci, avec leurs URLs exactes) :
${JSON.stringify(poiSummary)}

Spots de nuit disponibles (OBLIGATOIRE : 1 spot par nuit, pioche UNIQUEMENT dans cette liste) :
${JSON.stringify(overnightSummary)}

CONTRAINTES STRICTES :
- Exactement ${durationDays} journée${durationDays > 1 ? "s" : ""}.
- Chaque journée = 1 à 2 activités MAX + éventuellement 1 restaurant.
- L'itinéraire suit un parcours géographique cohérent (ex: côte → intérieur ou nord → sud), PAS de zigzag.
- Le spot nuit du soir est le plus PROCHE possible de la première activité du lendemain (dormir sur place pour partir tôt).
- Indique le temps de route entre les étapes principales (ex: "30 min de route").
- Budgets indicatifs RÉALISTES pour chaque stop (basés sur le budget_level des POIs fournis).
- Les noms et URLs viennent des POI réels fournis — NE RIEN INVENTER.
- Adapte les horaires au type d'activité : randonnée → tôt le matin (8h-9h), plage → après-midi, restaurant → midi ou soir.

Retourne STRICTEMENT ce JSON :
{
  "title": "Titre accrocheur du road trip",
  "intro": "2-3 phrases d'introduction adaptée au profil ${groupLabel}. Commence par 'Découvrez avec Vanzon Explorer…' — NE PAS mentionner le prénom du voyageur dans l'intro.",
  "days": [
    {
      "day": 1,
      "theme": "Thème évocateur de la journée",
      "stops": [
        {
          "time": "9h00",
          "name": "Nom du lieu (exactement tel que dans la liste POI)",
          "type": "activite|restaurant|culture|nature|plage|soiree",
          "description": "2-3 phrases pratiques + temps de route depuis l'étape précédente si > 15min",
          "address": "adresse complète",
          "url": "lien externe du POI fourni",
          "budget_indicatif": "gratuit | 5-15€ | 20-50€"
        }
      ],
      "overnight": {
        "name": "Nom du spot de nuit (exactement tel que dans la liste)",
        "type": "parking_gratuit|aire_camping_car|camping_van|spot_sauvage",
        "price": "gratuit | 8€/nuit | 22€/nuit",
        "address": "adresse",
        "coordinates": "lat,lng",
        "google_maps_url": "url",
        "amenities": ["eau potable", "vidange"],
        "restrictions": "ex: 72h max, interdit en août",
        "tip": "astuce pratique (heure d'arrivée, discrétion, proximité activité du lendemain)"
      }
    }
  ],
  "tips_van": [
    "5 conseils pratiques spécifiques au profil ${groupLabel} et au Pays Basque"
  ],
  "cta": "phrase d'appel à l'action pour louer un van Vanzon Explorer"
}`;

    const { content } = await groqWithFallback({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.35,
      response_format: { type: "json_object" },
      max_tokens: 5000,
    });

    // Parse JSON response
    let parsed: Omit<GeneratedItineraryV2, "version">;
    try {
      parsed = JSON.parse(content.trim());
    } catch {
      const match = content.match(/\{[\s\S]*\}/);
      if (!match) throw new Error("JSON invalide dans la réponse Groq");
      parsed = JSON.parse(match[0]);
    }

    const itinerary: GeneratedItineraryV2 = {
      title: parsed.title,
      intro: parsed.intro,
      days: parsed.days,
      tips_van: parsed.tips_van ?? [],
      cta: parsed.cta ?? "Louez un van Vanzon Explorer au Pays Basque",
      version: "v2",
    };

    // Step 3: Send email
    if (!process.env.RESEND_API_KEY) throw new Error("RESEND_API_KEY is not set");
    const resend = new Resend(process.env.RESEND_API_KEY);
    const emailEncoded = encodeURIComponent(email);

    const imageMap: Record<string, string> = {};
    for (const p of [...pois, ...overnightSpots]) {
      const imgUrl = (p as unknown as { image_url?: string }).image_url;
      if (p.name && imgUrl) imageMap[p.name] = imgUrl;
    }

    const { subject, html } = buildRoadTripEmailV2({
      firstname,
      duree: durationDays,
      itinerary,
      emailEncoded,
      imageMap,
    });

    const { error: resendError } = await resend.emails.send({
      from: "Vanzon Explorer <noreply@vanzonexplorer.com>",
      to: email,
      subject,
      html,
    });
    if (resendError) throw new Error(`Resend error: ${JSON.stringify(resendError)}`);

    // Step 4: Update status
    await supabase
      .from("road_trip_requests")
      .update({
        status: "sent",
        itineraire_json: itinerary,
        sent_at: new Date().toISOString(),
      })
      .eq("id", id);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[road-trips/retry]", (err as Error).message);

    // Revert to error status
    await supabase
      .from("road_trip_requests")
      .update({ status: "error" })
      .eq("id", id);

    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 }
    );
  }
}
