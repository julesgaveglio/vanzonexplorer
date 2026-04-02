import { NextResponse } from "next/server";
import { sanityFetch } from "@/lib/sanity/client";
import { getAllRoadTripArticlesQuery } from "@/lib/sanity/queries";

interface Article {
  title: string;
  slug: string;
  regionSlug: string;
  regionName: string;
  excerpt?: string;
  duree?: number;
  style?: string;
}

export async function GET() {
  const articles = await sanityFetch<Article[]>(getAllRoadTripArticlesQuery) ?? [];

  const lines: string[] = [
    "# Vanzon Explorer — llms.txt",
    "",
    "> Vanzon Explorer est une plateforme vanlife basée au Pays Basque (Cambo-les-Bains, 64250).",
    "> Services : location de vans aménagés, vente de vans, formation business van (Van Business Academy), club vanlife gratuit, et générateur d'itinéraires road trip personnalisés.",
    "> Ce fichier liste l'ensemble du contenu du site pour faciliter l'indexation par les moteurs IA (Google AI Overviews, ChatGPT, Perplexity, Bing Copilot).",
    "",
    "## Services",
    "",
    "- [Location van Pays Basque](https://vanzonexplorer.com/location) — Location de vans aménagés au départ de Cambo-les-Bains. Vans Yoni et Xalbat disponibles.",
    "- [Achat van aménagé](https://vanzonexplorer.com/achat) — Vente de vans et fourgons aménagés.",
    "- [Formation Van Business Academy](https://vanzonexplorer.com/formation) — Formation pour lancer son business de location de van.",
    "- [Club Vanzon](https://vanzonexplorer.com/club) — Un club vanlife gratuit avec réductions exclusives sur l'équipement van.",
    "",
    "## Générateur de road trip personnalisé",
    "",
    "- [Créer mon road trip](https://vanzonexplorer.com/road-trip-personnalise) — Outil IA gratuit : renseigne ta région, durée, profil et intérêts. Reçois un itinéraire complet par email avec spots GPS, campings et restaurants.",
    "",
    "## Road Trips en France — Tous les itinéraires",
    "",
    "- [Catalogue road trips](https://vanzonexplorer.com/road-trip) — Tous les itinéraires van en France, filtrables par région, durée et style.",
    "",
    "### Road trips par région",
    "",
    "- [Road trips Pays Basque](https://vanzonexplorer.com/road-trip/pays-basque)",
    "- [Road trips Bretagne](https://vanzonexplorer.com/road-trip/bretagne)",
    "- [Road trips Provence](https://vanzonexplorer.com/road-trip/provence)",
    "- [Road trips Camargue](https://vanzonexplorer.com/road-trip/camargue)",
    "- [Road trips Alsace](https://vanzonexplorer.com/road-trip/alsace)",
    "- [Road trips Dordogne](https://vanzonexplorer.com/road-trip/dordogne)",
    "- [Road trips Corse](https://vanzonexplorer.com/road-trip/corse)",
    "- [Road trips Normandie](https://vanzonexplorer.com/road-trip/normandie)",
    "- [Road trips Ardèche](https://vanzonexplorer.com/road-trip/ardeche)",
    "- [Road trips Pyrénées](https://vanzonexplorer.com/road-trip/pyrenees)",
    "- [Road trips Val de Loire](https://vanzonexplorer.com/road-trip/loire)",
    "- [Road trips Jura](https://vanzonexplorer.com/road-trip/jura)",
    "- [Road trips Vercors](https://vanzonexplorer.com/road-trip/vercors)",
    "- [Road trips Cotentin](https://vanzonexplorer.com/road-trip/cotentin)",
    "- [Road trips Landes](https://vanzonexplorer.com/road-trip/landes)",
    "",
    "### Itinéraires publiés",
    "",
  ];

  // Articles dynamiques groupés par région
  const byRegion: Record<string, Article[]> = {};
  for (const article of articles) {
    const region = article.regionSlug || "france";
    if (!byRegion[region]) byRegion[region] = [];
    byRegion[region].push(article);
  }

  for (const [, regionArticles] of Object.entries(byRegion)) {
    const regionName = regionArticles[0]?.regionName || regionArticles[0]?.regionSlug || "France";
    lines.push(`#### ${regionName}`);
    lines.push("");
    for (const a of regionArticles) {
      const url = `https://vanzonexplorer.com/road-trip/${a.regionSlug}/${a.slug}`;
      lines.push(`- [${a.title}](${url})${a.excerpt ? ` — ${a.excerpt.slice(0, 120)}` : ""}`);
    }
    lines.push("");
  }

  lines.push("## Guides vanlife");
  lines.push("");
  lines.push("- [Articles vanlife](https://vanzonexplorer.com/articles) — Guides pratiques, conseils et inspirations pour le van life en France.");
  lines.push("- [Spots Pays Basque](https://vanzonexplorer.com/pays-basque) — Bivouacs, spots de surf et lieux incontournables en van au Pays Basque.");

  return new NextResponse(lines.join("\n"), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
    },
  });
}
