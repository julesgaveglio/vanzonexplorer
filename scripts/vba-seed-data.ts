/**
 * Seed VBA data from DataForSEO research — run once:
 *   npx tsx scripts/vba-seed-data.ts
 */

import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

// ─── Helpers ────────────────────────────────────────────────────────────────

function cluster(kw: string): string {
  const k = kw.toLowerCase();
  if (/formation|cours|apprendre|programme|coaching|cpf/.test(k)) return "Formation Van";
  if (/business|rentabilit|revenu|gagner|investir|entrepreneur|cr[eé]er activit|monétis|conciergerie/.test(k)) return "Business Van";
  if (/am[eé]nag|construire|installer|isolation|[eé]lectricit|mobilier|lit|cuisine|panneau solaire|chauffage|kit van/.test(k)) return "Aménagement Van";
  if (/acheter|achat|revendre|occasion|neuf|budget|leasing|financement|prix van/.test(k)) return "Achat Van";
  if (/location|louer|airbnb|yescapa|client|r[eé]servation|tarif location/.test(k)) return "Location Van";
  if (/assurance|homologation|r[eé]glementation|vasp|contr[ôo]le technique|carte grise/.test(k)) return "Réglementation";
  if (/vanlife|vie nomade|voyager|it|destinations|nomad|libert[eé]/.test(k)) return "Vanlife";
  return "Général";
}

function score(vol: number, diff: number, cpc: number): number {
  const maxVol = 49500;
  return Math.round((Math.min(vol, maxVol) / maxVol * 0.4 + (100 - diff) / 100 * 0.4 + Math.min(cpc / 5, 1) * 0.2) * 100);
}

// ─── Keywords ───────────────────────────────────────────────────────────────

const KEYWORDS = [
  // === PILIER 1 : Formation Van ===
  { keyword: "formation van aménagé",            vol: 210,   diff: 22, cpc: 1.20, intent: "commercial",    comp: "LOW" },
  { keyword: "formation location van aménagé",   vol: 90,    diff: 15, cpc: 1.50, intent: "commercial",    comp: "LOW" },
  { keyword: "formation aménagement van",         vol: 170,   diff: 20, cpc: 0.90, intent: "commercial",    comp: "LOW" },
  { keyword: "formation van aménagé cpf",         vol: 50,    diff: 10, cpc: 0.80, intent: "commercial",    comp: "LOW" },
  { keyword: "van it yourself cpf",              vol: 70,    diff: 8,  cpc: 0.50, intent: "commercial",    comp: "LOW" },
  { keyword: "camp in van formation",            vol: 50,    diff: 5,  cpc: 0.00, intent: "commercial",    comp: "LOW" },
  { keyword: "meikyu formation van",             vol: 320,   diff: 12, cpc: 0.20, intent: "navigational",  comp: "LOW" },
  { keyword: "vanoazo formation",                vol: 140,   diff: 8,  cpc: 0.00, intent: "navigational",  comp: "LOW" },
  { keyword: "amenagetonvan formation",          vol: 90,    diff: 5,  cpc: 0.00, intent: "navigational",  comp: "LOW" },
  { keyword: "formation aménagement camping car", vol: 110,  diff: 18, cpc: 0.80, intent: "commercial",    comp: "LOW" },

  // === PILIER 2 : Business Van / Rentabilité ===
  { keyword: "rentabilité location van aménagé", vol: 260,   diff: 20, cpc: 1.44, intent: "commercial",    comp: "MEDIUM" },
  { keyword: "investir van aménagé",             vol: 170,   diff: 18, cpc: 0.80, intent: "commercial",    comp: "LOW" },
  { keyword: "business van aménagé",             vol: 90,    diff: 15, cpc: 0.90, intent: "commercial",    comp: "LOW" },
  { keyword: "louer son van aménagé",            vol: 140,   diff: 15, cpc: 1.44, intent: "navigational",  comp: "MEDIUM" },
  { keyword: "se lancer location van aménagé",   vol: 110,   diff: 12, cpc: 1.20, intent: "transactional", comp: "LOW" },
  { keyword: "est ce rentable d'acheter un van aménagé", vol: 90, diff: 14, cpc: 0.80, intent: "informational", comp: "LOW" },
  { keyword: "louer son van est-ce rentable",    vol: 90,    diff: 15, cpc: 1.00, intent: "informational", comp: "LOW" },
  { keyword: "conciergerie van aménagé",         vol: 70,    diff: 8,  cpc: 0.50, intent: "commercial",    comp: "LOW" },
  { keyword: "van aménagé rentable",             vol: 110,   diff: 12, cpc: 0.80, intent: "commercial",    comp: "LOW" },
  { keyword: "revenus location van aménagé",     vol: 80,    diff: 10, cpc: 1.00, intent: "commercial",    comp: "LOW" },
  { keyword: "marché location van aménagé",      vol: 70,    diff: 10, cpc: 0.60, intent: "informational", comp: "LOW" },
  { keyword: "créer entreprise location van",    vol: 90,    diff: 16, cpc: 1.20, intent: "commercial",    comp: "LOW" },
  { keyword: "statut juridique location van",    vol: 70,    diff: 10, cpc: 0.80, intent: "informational", comp: "LOW" },
  { keyword: "devenir loueur van aménagé",       vol: 80,    diff: 10, cpc: 0.90, intent: "commercial",    comp: "LOW" },
  { keyword: "gagner argent van aménagé",        vol: 60,    diff: 12, cpc: 0.70, intent: "commercial",    comp: "LOW" },

  // === PILIER 3 : Achat / Revente Van ===
  { keyword: "acheter van pour louer",           vol: 170,   diff: 16, cpc: 1.20, intent: "transactional", comp: "MEDIUM" },
  { keyword: "achat van aménagé",               vol: 1600,  diff: 2,  cpc: 0.51, intent: "transactional", comp: "HIGH" },
  { keyword: "revendre van aménagé",             vol: 90,    diff: 10, cpc: 0.60, intent: "transactional", comp: "LOW" },
  { keyword: "achat revente van aménagé",        vol: 60,    diff: 8,  cpc: 0.80, intent: "transactional", comp: "LOW" },
  { keyword: "leasing van aménagé sans apport",  vol: 90,    diff: 12, cpc: 1.00, intent: "transactional", comp: "LOW" },
  { keyword: "leasing van aménagé prix",         vol: 70,    diff: 10, cpc: 1.20, intent: "transactional", comp: "LOW" },
  { keyword: "van aménagé prix",                vol: 1600,  diff: 3,  cpc: 0.29, intent: "commercial",    comp: "HIGH" },
  { keyword: "quel van acheter pour aménager",   vol: 110,   diff: 14, cpc: 0.50, intent: "commercial",    comp: "LOW" },
  { keyword: "van occasion",                    vol: 6600,  diff: 50, cpc: 0.22, intent: "navigational",  comp: "HIGH" },
  { keyword: "van aménagé occasion",            vol: 18100, diff: 50, cpc: 0.21, intent: "commercial",    comp: "HIGH" },
  { keyword: "fourgon aménagé occasion",        vol: 14800, diff: 50, cpc: 0.22, intent: "commercial",    comp: "HIGH" },
  { keyword: "fourgon aménagé occasion 5000€",  vol: 2400,  diff: 3,  cpc: 0.24, intent: "transactional", comp: "MEDIUM" },
  { keyword: "van aménagé occasion le bon coin", vol: 2400, diff: 50, cpc: 0.17, intent: "transactional", comp: "MEDIUM" },

  // === PILIER 4 : Aménagement Van ===
  { keyword: "van aménagé",                     vol: 49500, diff: 19, cpc: 0.51, intent: "commercial",    comp: "HIGH" },
  { keyword: "fourgon aménagé",                 vol: 22200, diff: 36, cpc: 0.41, intent: "navigational",  comp: "MEDIUM" },
  { keyword: "amenagement van",                 vol: 9900,  diff: 14, cpc: 0.37, intent: "commercial",    comp: "HIGH" },
  { keyword: "amenagement fourgon",             vol: 4400,  diff: 6,  cpc: 0.57, intent: "commercial",    comp: "HIGH" },
  { keyword: "kit aménagement van",             vol: 1900,  diff: 0,  cpc: 0.34, intent: "navigational",  comp: "HIGH" },
  { keyword: "électricité van aménagé",         vol: 320,   diff: 50, cpc: 0.70, intent: "commercial",    comp: "HIGH" },
  { keyword: "isolation van",                   vol: 880,   diff: 25, cpc: 0.45, intent: "commercial",    comp: "MEDIUM" },
  { keyword: "panneau solaire van",             vol: 1000,  diff: 27, cpc: 0.90, intent: "commercial",    comp: "HIGH" },
  { keyword: "chauffage van",                   vol: 1600,  diff: 50, cpc: 0.23, intent: "commercial",    comp: "HIGH" },
  { keyword: "budget aménagement van",          vol: 140,   diff: 10, cpc: 0.50, intent: "informational", comp: "LOW" },
  { keyword: "aménager van soi même",           vol: 210,   diff: 15, cpc: 0.40, intent: "informational", comp: "LOW" },
  { keyword: "van aménagé intérieur",           vol: 1300,  diff: 11, cpc: 0.15, intent: "informational", comp: "LOW" },
  { keyword: "fourgon aménagé 4 couchages",     vol: 1300,  diff: 12, cpc: 0.33, intent: "commercial",    comp: "HIGH" },
  { keyword: "auvent van",                      vol: 1600,  diff: 50, cpc: 0.25, intent: "commercial",    comp: "HIGH" },

  // === PILIER 5 : Location Van ===
  { keyword: "location van aménagé",            vol: 33100, diff: 37, cpc: 1.10, intent: "transactional", comp: "HIGH" },
  { keyword: "location van",                    vol: 18100, diff: 62, cpc: 1.45, intent: "transactional", comp: "HIGH" },
  { keyword: "location fourgon aménagé",        vol: 5400,  diff: 62, cpc: 1.39, intent: "transactional", comp: "MEDIUM" },
  { keyword: "location de van aménagé",         vol: 3600,  diff: 62, cpc: 1.17, intent: "transactional", comp: "HIGH" },
  { keyword: "louer un van",                    vol: 1600,  diff: 62, cpc: 1.21, intent: "transactional", comp: "MEDIUM" },
  { keyword: "louer camping car",               vol: 6600,  diff: 65, cpc: 0.85, intent: "transactional", comp: "MEDIUM" },
  { keyword: "location van entre particuliers", vol: 480,   diff: 40, cpc: 1.20, intent: "transactional", comp: "MEDIUM" },
  { keyword: "yescapa van aménagé",             vol: 320,   diff: 35, cpc: 0.80, intent: "navigational",  comp: "LOW" },

  // === PILIER 6 : Réglementation & Admin ===
  { keyword: "carte grise van aménagé",         vol: 30,    diff: 10, cpc: 0.46, intent: "commercial",    comp: "LOW" },
  { keyword: "homologation van vasp",           vol: 10,    diff: 20, cpc: 0.54, intent: "navigational",  comp: "MEDIUM" },
  { keyword: "vasp carte grise",               vol: 2400,  diff: 0,  cpc: 0.18, intent: "commercial",    comp: "LOW" },
  { keyword: "réglementation van aménagé",      vol: 50,    diff: 12, cpc: 0.30, intent: "navigational",  comp: "LOW" },
  { keyword: "assurance van aménagé",           vol: 90,    diff: 18, cpc: 2.50, intent: "commercial",    comp: "HIGH" },
  { keyword: "assurance van location",          vol: 10,    diff: 30, cpc: 3.39, intent: "commercial",    comp: "HIGH" },

  // === PILIER 7 : Modèles Van ===
  { keyword: "renault master aménagé",          vol: 720,   diff: 50, cpc: 0.53, intent: "commercial",    comp: "MEDIUM" },
  { keyword: "ford transit aménagé",            vol: 880,   diff: 50, cpc: 0.35, intent: "commercial",    comp: "HIGH" },
  { keyword: "peugeot boxer aménagé",           vol: 390,   diff: 50, cpc: 0.63, intent: "commercial",    comp: "HIGH" },
  { keyword: "volkswagen crafter aménagé",      vol: 170,   diff: 50, cpc: 0.53, intent: "commercial",    comp: "MEDIUM" },
  { keyword: "renault trafic aménagé",          vol: 2900,  diff: 18, cpc: 0.42, intent: "commercial",    comp: "HIGH" },
  { keyword: "kangoo aménagé",                  vol: 2900,  diff: 50, cpc: 0.30, intent: "commercial",    comp: "HIGH" },
  { keyword: "van aménagé dacia",               vol: 1300,  diff: 2,  cpc: 1.57, intent: "commercial",    comp: "LOW" },
  { keyword: "sprinter van aménagé",            vol: 50,    diff: 50, cpc: 0.52, intent: "commercial",    comp: "MEDIUM" },
  { keyword: "camion aménagé",                  vol: 8100,  diff: 19, cpc: 0.39, intent: "commercial",    comp: "MEDIUM" },
  { keyword: "van volkswagen",                  vol: 18100, diff: 6,  cpc: 0.40, intent: "navigational",  comp: "HIGH" },
];

// ─── Competitors ────────────────────────────────────────────────────────────

const COMPETITORS = [
  {
    domain: "meikyu.fr",
    name: "Meïkyu (Meïkyu Schmitt)",
    description: "Entrepreneur YouTube (100K+ abonnés) proposant des formations en ligne sur la construction de van aménagé et la création d'une activité de location. Positionné comme le leader du marché francophone sur le business van.",
    strengths: "Notoriété YouTube massive, plusieurs formations (location + construction), contenu vidéo abondant, communauté active",
    weaknesses: "Positionnement diffus (pas exclusivement business van), prix non clairement affichés, pas de coaching individualisé",
    pricing: "Formation à la carte, estimé 200-500€",
    offerings: "Formation construction van, formation location van, vidéos YouTube gratuites, cours en ligne",
    traffic_estimate: 12000,
    domain_authority: 42,
  },
  {
    domain: "vanoazo.com",
    name: "Vanoazo",
    description: "Formation complète en ligne pour aménager son van de A à Z, incluant recherche du véhicule, conception, fabrication et homologation VASP. Format vidéo avec outils téléchargeables.",
    strengths: "Formation très complète et structurée, couvre toute la chaîne valeur, bonne UX",
    weaknesses: "Axé uniquement aménagement physique, ne couvre pas le business model ni la location",
    pricing: "Non communiqué publiquement",
    offerings: "Formation aménagement van complète (vidéos + guides), homologation VASP",
    traffic_estimate: 3500,
    domain_authority: 28,
  },
  {
    domain: "amenagetonvan.com",
    name: "Aménage Ton Van",
    description: "Formation en ligne pour apprendre à aménager son van soi-même, sans passer 6 mois et sans galères. Positionnée comme la formation la plus rapide et pratique.",
    strengths: "Prix clair (890€), promesse forte, bien référencé sur 'formation van aménagé'",
    weaknesses: "Uniquement aménagement, pas de vision business, pas de volet location",
    pricing: "890€",
    offerings: "Formation aménagement van tout-en-un",
    traffic_estimate: 2800,
    domain_authority: 25,
  },
  {
    domain: "reve-en-van.fr",
    name: "Rêve en Van",
    description: "Stage pratique 2 jours pour apprendre à aménager son van, en présentiel. Format physique différenciant, sessions régulières avec places limitées.",
    strengths: "Format présentiel unique, preuve sociale forte (sessions souvent complètes), prix accessible",
    weaknesses: "Format physique seulement = scalabilité limitée, uniquement aménagement technique",
    pricing: "350€ (175€/jour × 2 jours)",
    offerings: "Stage pratique aménagement van 2 jours",
    traffic_estimate: 1800,
    domain_authority: 22,
  },
  {
    domain: "tonfourgon.com",
    name: "Ton Fourgon",
    description: "Formation vidéo aménagement van avec 13 vidéos et 10h de contenu. Couvre électricité, plomberie, gaz, isolation, lambris, douche, lit.",
    strengths: "Contenu pratique détaillé, bon référencement SEO, prix attractif",
    weaknesses: "Pas de mise à jour récente visible, pas de volet business",
    pricing: "Non communiqué",
    offerings: "Formation vidéo aménagement fourgon (13 vidéos, 10h)",
    traffic_estimate: 2200,
    domain_authority: 24,
  },
  {
    domain: "cours.meikyu.fr",
    name: "Meïkyu Cours (plateforme e-learning)",
    description: "Plateforme de cours en ligne de Meïkyu Schmitt. Propose 'Construire son van aménagé' et 'Faire de la location de van aménagé'. Chapitres structurés : business model, statuts/fiscalité, fabrication.",
    strengths: "Seul acteur à proposer business model + fiscalité + fabrication dans une même formation",
    weaknesses: "Sous-domaine peu connu hors audience YouTube, pas de coaching 1:1",
    pricing: "Non communiqué (estimé 200-400€)",
    offerings: "Formation construction van, formation location van (business model + statuts + fabrication)",
    traffic_estimate: 4500,
    domain_authority: 42,
  },
  {
    domain: "fleetee.io",
    name: "Fleetee",
    description: "Logiciel de gestion de flotte pour agences de location van. Produit technologique B2B mais très actif en content marketing sur le business de location van.",
    strengths: "Articles très référencés sur rentabilité location van, crédibilité business, données chiffrées (80€/j particulier, 200€/j agence)",
    weaknesses: "Produit B2B logiciel, pas une formation, pas de coaching",
    pricing: "SaaS (pas de formation)",
    offerings: "Logiciel gestion flotte, guides business location van",
    traffic_estimate: 8000,
    domain_authority: 38,
  },
  {
    domain: "campingcarinvest.com",
    name: "Camping Car Invest",
    description: "Site spécialisé dans l'investissement en camping-car et van aménagé, avec simulations de rentabilité et guides d'achat pour investisseurs.",
    strengths: "Angle investissement unique, simulations chiffrées, audience ciblée investisseurs",
    weaknesses: "Focalisé camping-car classique, peu de contenu spécifique van aménagé, pas de formation",
    pricing: "Contenu gratuit uniquement",
    offerings: "Guides investissement camping-car, calculateurs de rentabilité",
    traffic_estimate: 3200,
    domain_authority: 30,
  },
  {
    domain: "finance-entreprendre.fr",
    name: "Finance-Entreprendre",
    description: "Site généraliste sur l'entrepreneuriat et la finance personnelle. Couvre 'devenir aménageur de van' avec un article récent très bien positionné (mars 2026).",
    strengths: "Bonne autorité SEO générale, article très récent et complet, apparaît en position 3 sur 'business van aménagé formation'",
    weaknesses: "Pas spécialisé van, pas de formation, contenu généraliste",
    pricing: "Contenu gratuit",
    offerings: "Article formation/métier/VASP/réglementation aménageur van",
    traffic_estimate: 15000,
    domain_authority: 45,
  },
  {
    domain: "wikicampers.fr",
    name: "Wikicampers",
    description: "Plateforme de location entre particuliers de camping-cars et vans. Très forte autorité SEO sur tout ce qui touche à la location van. Blog détaillé sur rentabilité.",
    strengths: "Autorité de domaine élevée, position 1 sur 'rentabilité location van', données propriétaires (3000€/an moyenne loueurs)",
    weaknesses: "Plateforme généraliste, pas de formation, concurrent indirect",
    pricing: "Commission sur location (pas de formation)",
    offerings: "Plateforme location entre particuliers, guides loueurs",
    traffic_estimate: 198000,
    domain_authority: 58,
  },
];

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log("🚀 Insertion des keywords VBA...");

  const kwRows = KEYWORDS.map(k => ({
    keyword: k.keyword,
    search_volume: k.vol,
    keyword_difficulty: k.diff,
    cpc: k.cpc,
    intent: k.intent,
    topic_cluster: cluster(k.keyword),
    opportunity_score: score(k.vol, k.diff, k.cpc),
    competition_level: k.comp,
    monthly_searches: {},
    last_checked: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }));

  const { error: kwErr } = await sb
    .from("vba_keywords")
    .upsert(kwRows, { onConflict: "keyword" });

  if (kwErr) {
    console.error("❌ Erreur keywords:", kwErr.message);
  } else {
    console.log(`✅ ${kwRows.length} mots-clés insérés/mis à jour`);
  }

  console.log("\n🚀 Insertion des concurrents VBA...");

  const compRows = COMPETITORS.map(c => ({
    ...c,
    last_analyzed: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    raw_data: {},
  }));

  const { error: compErr } = await sb
    .from("vba_competitors")
    .upsert(compRows, { onConflict: "domain" });

  if (compErr) {
    console.error("❌ Erreur competitors:", compErr.message);
  } else {
    console.log(`✅ ${compRows.length} concurrents insérés/mis à jour`);
  }

  // Stats
  const { count: kwCount } = await sb.from("vba_keywords").select("id", { count: "exact", head: true });
  const { count: compCount } = await sb.from("vba_competitors").select("id", { count: "exact", head: true });

  console.log(`\n📊 État final:`);
  console.log(`   vba_keywords  : ${kwCount} lignes`);
  console.log(`   vba_competitors: ${compCount} lignes`);
  console.log("\n✅ Terminé ! Va sur /admin/formation/keywords et /admin/formation/competitors");
}

main().catch(console.error);
