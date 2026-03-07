import type { MetadataRoute } from "next";
import { sanityFetch } from "@/lib/sanity/client";
import { getAllVanSlugsQuery, getAllArticleSlugsQuery } from "@/lib/sanity/queries";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://vanzonexplorer.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const vanSlugs = await sanityFetch<{ slug: string }[]>(getAllVanSlugsQuery) ?? [];
  const articleSlugs = await sanityFetch<{ slug: string }[]>(getAllArticleSlugsQuery) ?? [];

  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
    { url: `${BASE_URL}/location`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.9 },
    { url: `${BASE_URL}/location/biarritz`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE_URL}/location/hossegor`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE_URL}/location/bayonne`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE_URL}/location/saint-jean-de-luz`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE_URL}/location/week-end`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE_URL}/formation`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.9 },
    { url: `${BASE_URL}/achat`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE_URL}/achat/yoni`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE_URL}/achat/xalbat`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE_URL}/club`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE_URL}/pays-basque`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE_URL}/road-trip-pays-basque-van`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE_URL}/articles`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.6 },
    { url: `${BASE_URL}/contact`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.5 },
    { url: `${BASE_URL}/a-propos`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.5 },
    { url: `${BASE_URL}/mentions-legales`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.2 },
    { url: `${BASE_URL}/confidentialite`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.2 },
  ];

  const vanPages: MetadataRoute.Sitemap = vanSlugs.map(({ slug }) => ({
    url: `${BASE_URL}/location/${slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const articlePages: MetadataRoute.Sitemap = articleSlugs.map(({ slug }) => ({
    url: `${BASE_URL}/articles/${slug}`,
    lastModified: new Date(),
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  return [...staticPages, ...vanPages, ...articlePages];
}
