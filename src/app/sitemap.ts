import type { MetadataRoute } from "next";
import { sanityFetch } from "@/lib/sanity/client";
import { getAllVanSlugsQuery, getAllArticleSlugsQuery } from "@/lib/sanity/queries";
import { VANS } from "@/lib/data/vans";
import { createSupabaseAnon } from "@/lib/supabase/server";
import { slugify } from "@/lib/slugify";

const BASE_URL = "https://vanzonexplorer.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const vanSlugs = await sanityFetch<{ slug: string; updatedAt?: string }[]>(getAllVanSlugsQuery) ?? [];
  const articleSlugs = await sanityFetch<{ slug: string; updatedAt?: string }[]>(getAllArticleSlugsQuery) ?? [];
  // Date dynamique : dernier déploiement ou build
  const now = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${BASE_URL}/location`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${BASE_URL}/location/biarritz`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE_URL}/location/hossegor`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE_URL}/location/bayonne`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE_URL}/location/saint-jean-de-luz`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE_URL}/location/week-end`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE_URL}/location/foret-irati`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE_URL}/formation`, lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: `${BASE_URL}/achat`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    ...VANS.map((v) => ({ url: `${BASE_URL}/achat/${v.id}`, lastModified: now, changeFrequency: "weekly" as const, priority: 0.8 })),
    { url: `${BASE_URL}/club`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE_URL}/pays-basque`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    // Road Trip Pays Basque refonte — 16 URLs indexables (hub + 3 duration + 12 finales)
    { url: `${BASE_URL}/road-trip-pays-basque-van`, lastModified: new Date("2026-04-11"), changeFrequency: "weekly", priority: 0.9 },
    { url: `${BASE_URL}/road-trip-pays-basque-van/weekend`, lastModified: new Date("2026-04-11"), changeFrequency: "weekly", priority: 0.85 },
    { url: `${BASE_URL}/road-trip-pays-basque-van/5-jours`, lastModified: new Date("2026-04-11"), changeFrequency: "weekly", priority: 0.85 },
    { url: `${BASE_URL}/road-trip-pays-basque-van/1-semaine`, lastModified: new Date("2026-04-11"), changeFrequency: "weekly", priority: 0.85 },
    { url: `${BASE_URL}/road-trip-pays-basque-van/weekend/solo`, lastModified: new Date("2026-04-11"), changeFrequency: "weekly", priority: 0.85 },
    { url: `${BASE_URL}/road-trip-pays-basque-van/weekend/couple`, lastModified: new Date("2026-04-11"), changeFrequency: "weekly", priority: 0.85 },
    { url: `${BASE_URL}/road-trip-pays-basque-van/weekend/amis`, lastModified: new Date("2026-04-11"), changeFrequency: "weekly", priority: 0.85 },
    { url: `${BASE_URL}/road-trip-pays-basque-van/weekend/famille`, lastModified: new Date("2026-04-11"), changeFrequency: "weekly", priority: 0.85 },
    { url: `${BASE_URL}/road-trip-pays-basque-van/5-jours/solo`, lastModified: new Date("2026-04-11"), changeFrequency: "weekly", priority: 0.85 },
    { url: `${BASE_URL}/road-trip-pays-basque-van/5-jours/couple`, lastModified: new Date("2026-04-11"), changeFrequency: "weekly", priority: 0.85 },
    { url: `${BASE_URL}/road-trip-pays-basque-van/5-jours/amis`, lastModified: new Date("2026-04-11"), changeFrequency: "weekly", priority: 0.85 },
    { url: `${BASE_URL}/road-trip-pays-basque-van/5-jours/famille`, lastModified: new Date("2026-04-11"), changeFrequency: "weekly", priority: 0.85 },
    { url: `${BASE_URL}/road-trip-pays-basque-van/1-semaine/solo`, lastModified: new Date("2026-04-11"), changeFrequency: "weekly", priority: 0.85 },
    { url: `${BASE_URL}/road-trip-pays-basque-van/1-semaine/couple`, lastModified: new Date("2026-04-11"), changeFrequency: "weekly", priority: 0.85 },
    { url: `${BASE_URL}/road-trip-pays-basque-van/1-semaine/amis`, lastModified: new Date("2026-04-11"), changeFrequency: "weekly", priority: 0.85 },
    { url: `${BASE_URL}/road-trip-pays-basque-van/1-semaine/famille`, lastModified: new Date("2026-04-11"), changeFrequency: "weekly", priority: 0.85 },
    { url: `${BASE_URL}/articles`, lastModified: now, changeFrequency: "weekly", priority: 0.6 },
    { url: `${BASE_URL}/road-trip-personnalise`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE_URL}/proprietaire`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE_URL}/contact`, lastModified: now, changeFrequency: "yearly", priority: 0.5 },
    { url: `${BASE_URL}/a-propos`, lastModified: now, changeFrequency: "yearly", priority: 0.5 },
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

  const { data: marketplaceVans } = await createSupabaseAnon()
    .from("marketplace_vans")
    .select("id, location_city, updated_at")
    .eq("status", "approved");

  const marketplaceVanPages: MetadataRoute.Sitemap = (marketplaceVans ?? []).map((van) => ({
    url: `${BASE_URL}/location/${slugify(van.location_city)}/${van.id}`,
    lastModified: van.updated_at ? new Date(van.updated_at) : new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  return [...staticPages, ...vanPages, ...articlePages, ...marketplaceVanPages];
}
