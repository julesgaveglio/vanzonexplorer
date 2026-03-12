import type { Metadata } from "next";
import ArticlesPageClient from "./_components/ArticlesPageClient";
import { sanityFetch } from "@/lib/sanity/client";
import { getAllArticlesQuery } from "@/lib/sanity/queries";
import type { SanityArticle } from "./types";

export const metadata: Metadata = {
  title: "Guides & Articles Vanlife Pays Basque | Vanzon Explorer",
  description:
    "Itinéraires van, spots bivouac, aménagement fourgon, business de location — tous les guides vanlife du Pays Basque par Vanzon Explorer. Road trips, surf, montagne.",
  keywords: [
    "road trip pays basque van",
    "spots vanlife pays basque",
    "aménagement fourgon",
    "location van yescapa",
    "bivouac pays basque",
    "vanlife france",
  ],
  alternates: {
    canonical: "https://vanzonexplorer.com/articles",
  },
  openGraph: {
    title: "Guides & Articles Vanlife — Pays Basque",
    description: "Itinéraires, spots secrets et conseils pratiques pour explorer le Pays Basque en van aménagé.",
    type: "website",
  },
};

export default async function ArticlesPage() {
  const sanityArticles = await sanityFetch<SanityArticle[]>(getAllArticlesQuery);
  return <ArticlesPageClient sanityArticles={sanityArticles ?? []} />;
}
