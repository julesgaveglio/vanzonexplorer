import { sanityFetch } from "@/lib/sanity/client";
import { groq } from "next-sanity";

const BASE_URL = "https://vanzonexplorer.com";

const recentArticlesQuery = groq`
  *[_type == "article" && defined(slug.current) && count(content) > 0]
  | order(publishedAt desc) [0...50] {
    title,
    "slug": slug.current,
    excerpt,
    category,
    publishedAt,
    "updatedAt": _updatedAt
  }
`;

interface FeedArticle {
  title: string;
  slug: string;
  excerpt: string | null;
  category: string | null;
  publishedAt: string;
  updatedAt: string;
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET() {
  const articles = await sanityFetch<FeedArticle[]>(recentArticlesQuery) ?? [];

  const lastBuildDate = articles[0]?.publishedAt
    ? new Date(articles[0].publishedAt).toUTCString()
    : new Date().toUTCString();

  const items = articles
    .map((a) => {
      const pubDate = a.publishedAt ? new Date(a.publishedAt).toUTCString() : "";
      const description = a.excerpt ? escapeXml(a.excerpt) : "";
      const category = a.category ? `<category>${escapeXml(a.category)}</category>` : "";

      return `    <item>
      <title>${escapeXml(a.title)}</title>
      <link>${BASE_URL}/articles/${a.slug}</link>
      <guid isPermaLink="true">${BASE_URL}/articles/${a.slug}</guid>
      <description>${description}</description>
      ${category}
      <pubDate>${pubDate}</pubDate>
    </item>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Vanzon Explorer — Blog</title>
    <link>${BASE_URL}/articles</link>
    <description>Location de vans aménagés au Pays Basque, road trips, vanlife et business van.</description>
    <language>fr</language>
    <lastBuildDate>${lastBuildDate}</lastBuildDate>
    <atom:link href="${BASE_URL}/feed.xml" rel="self" type="application/rss+xml"/>
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "s-maxage=3600, stale-while-revalidate",
    },
  });
}
