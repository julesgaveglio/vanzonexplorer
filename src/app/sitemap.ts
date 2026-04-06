import type { MetadataRoute } from "next";
import { sanityFetch } from "@/lib/sanity/client";
import { getAllVanSlugsQuery, getAllArticleSlugsQuery, getAllRoadTripArticleSlugsQuery } from "@/lib/sanity/queries";
import { VANS } from "@/lib/data/vans";
import { createSupabaseAnon } from "@/lib/supabase/server";
import { slugify } from "@/lib/slugify";

const BASE_URL = "https://vanzonexplorer.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const vanSlugs = await sanityFetch<{ slug: string; updatedAt?: string }[]>(getAllVanSlugsQuery) ?? [];
  const articleSlugs = await sanityFetch<{ slug: string; updatedAt?: string }[]>(getAllArticleSlugsQuery) ?? [];
  const roadTripSlugs = await sanityFetch<{ regionSlug: string; articleSlug: string; updatedAt?: string }[]>(getAllRoadTripArticleSlugsQuery) ?? [];

  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: new Date("2026-01-01"), changeFrequency: "weekly", priority: 1 },
    { url: `${BASE_URL}/location/`, lastModified: new Date("2026-01-01"), changeFrequency: "weekly", priority: 0.9 },
    { url: `${BASE_URL}/location/biarritz`, lastModified: new Date("2025-06-01"), changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE_URL}/location/hossegor`, lastModified: new Date("2025-06-01"), changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE_URL}/location/bayonne`, lastModified: new Date("2025-06-01"), changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE_URL}/location/saint-jean-de-luz`, lastModified: new Date("2025-06-01"), changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE_URL}/location/week-end`, lastModified: new Date("2025-06-01"), changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE_URL}/location/foret-irati`, lastModified: new Date("2025-06-01"), changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE_URL}/formation`, lastModified: new Date("2026-01-01"), changeFrequency: "monthly", priority: 0.9 },
    { url: `${BASE_URL}/achat`, lastModified: new Date("2025-09-01"), changeFrequency: "weekly", priority: 0.8 },
    ...VANS.map((v) => ({ url: `${BASE_URL}/achat/${v.id}`, lastModified: new Date("2025-09-01"), changeFrequency: "weekly" as const, priority: 0.8 })),
    { url: `${BASE_URL}/club`, lastModified: new Date("2025-06-01"), changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE_URL}/pays-basque`, lastModified: new Date("2025-12-01"), changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE_URL}/road-trip-pays-basque-van`, lastModified: new Date("2026-03-05"), changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE_URL}/articles`, lastModified: new Date("2026-01-01"), changeFrequency: "weekly", priority: 0.6 },
    { url: `${BASE_URL}/road-trip-personnalise`, lastModified: new Date("2026-03-23"), changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE_URL}/contact`, lastModified: new Date("2025-01-01"), changeFrequency: "yearly", priority: 0.5 },
    { url: `${BASE_URL}/a-propos`, lastModified: new Date("2025-06-01"), changeFrequency: "yearly", priority: 0.5 },
  ];

  const vanPages: MetadataRoute.Sitemap = vanSlugs.map(({ slug, updatedAt }) => ({
    url: `${BASE_URL}/location/${slug}`,
    lastModified: updatedAt ? new Date(updatedAt) : new Date(),
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const articlePages: MetadataRoute.Sitemap = articleSlugs.map(({ slug, updatedAt }) => ({
    url: `${BASE_URL}/articles/${slug}`,
    lastModified: updatedAt ? new Date(updatedAt) : new Date(),
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  const roadTripIndexPage: MetadataRoute.Sitemap = [
    { url: `${BASE_URL}/road-trip`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
  ];

  // Only include region pages that actually have articles
  const regionsWithArticles = Array.from(new Set(roadTripSlugs.map((s) => s.regionSlug)));
  const roadTripRegionPages: MetadataRoute.Sitemap = regionsWithArticles.map((regionSlug) => ({
    url: `${BASE_URL}/road-trip/${regionSlug}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  const roadTripArticlePages: MetadataRoute.Sitemap = roadTripSlugs.map(({ regionSlug, articleSlug, updatedAt }) => ({
    url: `${BASE_URL}/road-trip/${regionSlug}/${articleSlug}`,
    lastModified: updatedAt ? new Date(updatedAt) : new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.8,
  }));

  const { data: marketplaceVans } = await createSupabaseAnon()
    .from("marketplace_vans")
    .select("id, location_city, updated_at")
    .eq("status", "approved");

  const marketplaceVanPages: MetadataRoute.Sitemap = (marketplaceVans ?? []).map((van) => ({
    url: `${BASE_URL}/location/${slugify(van.location_city)}/${van.id.slice(0, 8)}`,
    lastModified: van.updated_at ? new Date(van.updated_at) : new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  return [...staticPages, ...vanPages, ...articlePages, ...roadTripIndexPage, ...roadTripRegionPages, ...roadTripArticlePages, ...marketplaceVanPages];
}
