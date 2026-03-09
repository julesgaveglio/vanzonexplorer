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
    "image": van.images[0],
    "url": `${BASE_URL}/achat/${van.id}`,
    "offers": {
      "@type": "Offer",
      "price": parseFloat(van.price.replace(/[^\d]/g, "")),
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
  seoDescription?: string;
};

export type FAQItem = { question: string; answer: string };

export function ArticleJsonLd({
  article,
  faqItems = [],
}: {
  article: ArticleType;
  faqItems?: FAQItem[];
}) {
  const articleUrl = `${BASE_URL}/articles/${article.slug}`;

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": article.title,
    "description": article.seoDescription ?? article.excerpt,
    "datePublished": article.publishedAt,
    "author": {
      "@type": "Organization",
      "name": "Vanzon Explorer",
      "url": BASE_URL,
    },
    "publisher": {
      "@type": "Organization",
      "name": "Vanzon Explorer",
      "logo": {
        "@type": "ImageObject",
        "url": `${BASE_URL}/logo.png`,
      },
    },
    "image": article.coverImage?.url,
    "url": articleUrl,
    "mainEntityOfPage": { "@type": "WebPage", "@id": articleUrl },
    "inLanguage": "fr-FR",
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Accueil", "item": BASE_URL },
      { "@type": "ListItem", "position": 2, "name": "Articles", "item": `${BASE_URL}/articles` },
      { "@type": "ListItem", "position": 3, "name": article.title, "item": articleUrl },
    ],
  };

  const faqSchema =
    faqItems.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          "mainEntity": faqItems.map(({ question, answer }) => ({
            "@type": "Question",
            "name": question,
            "acceptedAnswer": { "@type": "Answer", "text": answer },
          })),
        }
      : null;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      {faqSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
      )}
    </>
  );
}
