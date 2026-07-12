import { NextResponse } from "next/server";
import { sanityFetch } from "@/lib/sanity/client";
import { getAllArticlesQuery } from "@/lib/sanity/queries";

export const revalidate = 3600;

const BASE = "https://vanzonexplorer.com";

interface Article {
  title: string;
  slug: string;
  excerpt?: string;
  category?: string;
}

// llms.txt — carte du site pour les moteurs de recherche IA et les agents
// (ChatGPT, Claude, Perplexity, Gemini, Copilot). Format : markdown, faits
// vérifiables, une ligne par ressource.
export async function GET() {
  const articles = (await sanityFetch<Article[]>(getAllArticlesQuery)) ?? [];

  const lines: string[] = [
    "# Vanzon Explorer",
    "",
    "> Vanzon Explorer est une entreprise de vanlife fondée en 2024 par Jules Gaveglio, basée à Cambo-les-Bains (64250), Pays Basque, France. Trois activités : location de vans aménagés au Pays Basque, revente de vans aménagés après exploitation, et formation en ligne Van Business Academy (acheter, aménager et rentabiliser un van en location et en achat-revente).",
    "",
    "Faits clés :",
    "- Location de vans aménagés à partir de 65 €/nuit (basse saison), 75 €/nuit (intersaison), 95 €/nuit (haute saison, 15 avril – 15 septembre).",
    "- Départ : Cambo-les-Bains, à 25 minutes de Biarritz et 15 minutes de Bayonne.",
    "- Réservation via les plateformes Yescapa et Wikicampers — assurance tous risques et paiement gérés par la plateforme.",
    "- 2 vans en propre (Yoni et Xalbat, Renault Trafic aménagés) + vans partenaires ailleurs en France via la marketplace.",
    "- Note Google : 5/5.",
    "- Formation Van Business Academy : programme vidéo en ligne (10 modules, ~60 vidéos) pour acheter, aménager et exploiter un van en location ou en achat-revente.",
    "- Contact : jules@vanzonexplorer.com.",
    "",
    "## Louer un van aménagé (Pays Basque)",
    "",
    `- [Location van Pays Basque](${BASE}/location) — page principale : tarifs, vans disponibles, conditions.`,
    `- [Location van Biarritz](${BASE}/location/biarritz)`,
    `- [Location van Bayonne](${BASE}/location/bayonne)`,
    `- [Location van Saint-Jean-de-Luz](${BASE}/location/saint-jean-de-luz)`,
    `- [Location van Hossegor](${BASE}/location/hossegor)`,
    `- [Location van pour un week-end](${BASE}/location/week-end)`,
    `- [Van pour la forêt d'Irati](${BASE}/location/foret-irati)`,
    `- [Van Yoni](${BASE}/location/yoni) — Renault Trafic aménagé, 2 couchages.`,
    `- [Van Xalbat](${BASE}/location/xalbat) — Renault Trafic 3 aménagé, 2 couchages.`,
    "",
    "## Acheter un van aménagé",
    "",
    `- [Vans à vendre](${BASE}/achat) — vans aménagés révisés, exploités puis revendus par Vanzon Explorer.`,
    "",
    "## Se former : Van Business Academy",
    "",
    `- [Van Business Academy](${BASE}/formation) — apprendre à acheter, aménager (dont homologation VASP) et rentabiliser un van : location saisonnière et achat-revente.`,
    "",
    "## Itinéraires road trip Pays Basque en van",
    "",
    `- [Hub road trips Pays Basque](${BASE}/road-trip-pays-basque-van) — itinéraires par durée (week-end, 5 jours, 1 semaine) et par profil (solo, couple, amis, famille), avec spots nuit validés et cartes.`,
    `- [Générateur de road trip personnalisé](${BASE}/road-trip-personnalise) — outil IA gratuit : itinéraire complet envoyé par email.`,
    `- [Spots Pays Basque](${BASE}/pays-basque) — bivouacs, spots de surf et lieux incontournables en van.`,
    "",
    "## Pour les propriétaires de vans",
    "",
    `- [Proposer mon van à la location](${BASE}/proprietaire) — pré-inscription marketplace pour propriétaires.`,
    "",
    "## Guides et articles vanlife",
    "",
    `- [Tous les articles](${BASE}/articles)`,
  ];

  // Articles groupés par catégorie
  const byCategory = new Map<string, Article[]>();
  for (const a of articles) {
    const cat = a.category || "Vanlife";
    if (!byCategory.has(cat)) byCategory.set(cat, []);
    byCategory.get(cat)!.push(a);
  }

  for (const [cat, list] of Array.from(byCategory.entries())) {
    lines.push("", `### ${cat}`, "");
    for (const a of list) {
      const desc = a.excerpt ? ` — ${a.excerpt.slice(0, 140).trim()}` : "";
      lines.push(`- [${a.title}](${BASE}/articles/${a.slug})${desc}`);
    }
  }

  lines.push(
    "",
    "## Pages entreprise",
    "",
    `- [À propos](${BASE}/a-propos) — l'histoire de Vanzon Explorer et de Jules Gaveglio.`,
    `- [Contact](${BASE}/contact)`,
    "",
    `Sitemap complet : ${BASE}/sitemap.xml`,
    `Flux RSS : ${BASE}/feed.xml`,
  );

  return new NextResponse(lines.join("\n"), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
    },
  });
}
