import type { VanData } from "@/lib/data/vans";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL
  ? `${process.env.NEXT_PUBLIC_SITE_URL}/vanzon`
  : "https://vanzonexplorer.com/vanzon";

const schema = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  name: "Vanzon Explorer",
  description: "Location et vente de vans aménagés au Pays Basque",
  url: BASE_URL,
  address: {
    "@type": "PostalAddress",
    addressLocality: "Cambo-les-Bains",
    addressRegion: "Nouvelle-Aquitaine",
    addressCountry: "FR",
  },
  geo: {
    "@type": "GeoCoordinates",
    latitude: 43.3623,
    longitude: -1.3944,
  },
  areaServed: ["Biarritz", "Bayonne", "Hossegor", "Pays Basque"],
  priceRange: "€€",
};

export function LocalBusinessJsonLd() {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export function VanProductJsonLd({ van }: { van: VanData }) {
  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": `${van.name} — ${van.model} aménagé`,
    "description": van.description,
    "offers": {
      "@type": "Offer",
      "price": van.price,
      "priceCurrency": "EUR",
      "availability": "https://schema.org/InStock",
      "seller": { "@type": "Organization", "name": "Vanzon Explorer" }
    }
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
    />
  );
}

type ArticleType = {
  title: string;
  excerpt: string;
  publishedAt: string;
  coverImage?: { url: string } | null;
  slug: string;
};

export function ArticleJsonLd({ article }: { article: ArticleType }) {
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": article.title,
    "description": article.excerpt,
    "datePublished": article.publishedAt,
    "author": { "@type": "Organization", "name": "Vanzon Explorer" },
    "publisher": { "@type": "Organization", "name": "Vanzon Explorer" },
    "image": article.coverImage?.url,
    "url": `${process.env.NEXT_PUBLIC_SITE_URL || "https://vanzonexplorer.com"}/articles/${article.slug}`
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
    />
  );
}
