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
    "# Itinéraires road trip en van aménagé en France",
    "",
    "> Vanzon Explorer propose la location et la vente de vans aménagés au Pays Basque.",
    "> Ce fichier liste nos itinéraires road trip publiés pour faciliter leur indexation par les moteurs IA.",
    "",
    "## Road Trips par région",
    "",
  ];

  // Grouper par région
  const byRegion: Record<string, Article[]> = {};
  for (const article of articles) {
    const region = article.regionSlug || "france";
    if (!byRegion[region]) byRegion[region] = [];
    byRegion[region].push(article);
  }

  for (const [, regionArticles] of Object.entries(byRegion)) {
    const regionName = regionArticles[0]?.regionName || regionArticles[0]?.regionSlug || "France";
    lines.push(`### ${regionName}`);
    lines.push("");
    for (const a of regionArticles) {
      const url = `https://vanzonexplorer.com/road-trip/${a.regionSlug}/${a.slug}`;
      lines.push(`- [${a.title}](${url})${a.excerpt ? ` — ${a.excerpt.slice(0, 120)}` : ""}`);
    }
    lines.push("");
  }

  lines.push("## Pages principales");
  lines.push("");
  lines.push("- [Tous les road trips](https://vanzonexplorer.com/road-trip) — Catalogue des itinéraires van en France");
  lines.push("- [Générateur d'itinéraire](https://vanzonexplorer.com/road-trip-personnalise) — Créez votre road trip personnalisé");
  lines.push("- [Location van Pays Basque](https://vanzonexplorer.com/location) — Louez un van aménagé");

  return new NextResponse(lines.join("\n"), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
    },
  });
}
