import type { VanData } from "@/lib/data/vans";

const SITE_URL = "https://vanzonexplorer.com";

export function LocationRentalJsonLd({ destination, url }: { destination: string; url: string }) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: `Location van aménagé — ${destination}`,
    description: `Louez un van aménagé tout équipé pour explorer ${destination} au départ de Cambo-les-Bains. Assurance incluse.`,
    url,
    brand: { "@type": "Brand", name: "Vanzon Explorer" },
    offers: {
      "@type": "AggregateOffer",
      lowPrice: 65,
      highPrice: 95,
      priceCurrency: "EUR",
      offerCount: 3,
      offers: [
        {
          "@type": "Offer",
          name: "Basse saison (15/11–15/02)",
          price: 65,
          priceCurrency: "EUR",
          availability: "https://schema.org/InStock",
          seller: { "@type": "Organization", name: "Vanzon Explorer", url: SITE_URL },
        },
        {
          "@type": "Offer",
          name: "Saison intermédiaire",
          price: 75,
          priceCurrency: "EUR",
          availability: "https://schema.org/InStock",
          seller: { "@type": "Organization", name: "Vanzon Explorer", url: SITE_URL },
        },
        {
          "@type": "Offer",
          name: "Haute saison (15/04–15/09)",
          price: 95,
          priceCurrency: "EUR",
          availability: "https://schema.org/InStock",
          seller: { "@type": "Organization", name: "Vanzon Explorer", url: SITE_URL },
        },
      ],
    },
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

const BASE_URL = "https://vanzonexplorer.com";

const schema = {
  "@context": "https://schema.org",
  "@type": ["LocalBusiness", "CarRental"],
  name: "Vanzon Explorer",
  description: "Location de vans aménagés tout équipés au Pays Basque. Assurance incluse, départ Cambo-les-Bains. Achat, formation vanlife et Club Privé.",
  url: BASE_URL,
  telephone: "+33618476378",
  email: "contact@vanzonexplorer.com",
  image: "https://cdn.sanity.io/images/lewexa74/production/1f483103ef15ee3549eab14ba2801d11b32a9055-313x313.png?auto=format&q=82",
  address: {
    "@type": "PostalAddress",
    streetAddress: "Cambo-les-Bains",
    addressLocality: "Cambo-les-Bains",
    postalCode: "64250",
    addressRegion: "Nouvelle-Aquitaine",
    addressCountry: "FR",
  },
  geo: {
    "@type": "GeoCoordinates",
    latitude: 43.3623,
    longitude: -1.3944,
  },
  areaServed: [
    { "@type": "City", name: "Biarritz" },
    { "@type": "City", name: "Bayonne" },
    { "@type": "City", name: "Hossegor" },
    { "@type": "City", name: "Saint-Jean-de-Luz" },
  ],
  priceRange: "€€",
  currenciesAccepted: "EUR",
  openingHoursSpecification: {
    "@type": "OpeningHoursSpecification",
    dayOfWeek: ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"],
    opens: "08:00",
    closes: "20:00",
  },
  sameAs: [
    "https://www.instagram.com/vanzonexplorer",
    "https://www.youtube.com/@vanzonexplorer",
    "https://www.tiktok.com/@vanzonexplorer",
    "https://www.trustpilot.com/review/vanzonexplorer.com",
  ],
  foundingDate: "2024",
  founder: [
    { "@type": "Person", name: "Jules Gaveglio" },
    { "@type": "Person", name: "Elio Dubernet" },
  ],
};

export function LocalBusinessJsonLd({
  ratingValue,
  reviewCount,
}: {
  ratingValue?: string;
  reviewCount?: number;
}) {
  const fullSchema = {
    ...schema,
    ...(ratingValue && reviewCount
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue,
            reviewCount,
            bestRating: "5",
            worstRating: "1",
          },
        }
      : {}),
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(fullSchema) }}
    />
  );
}

export function WebSiteJsonLd() {
  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Vanzon Explorer",
    url: BASE_URL,
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
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
  updatedAt?: string;
  coverImage?: { url: string } | null;
  slug: string;
  seoDescription?: string;
};

export type FAQItem = { question: string; answer: string };

interface TouristTripJsonLdProps {
  name: string;
  description: string;
  url: string;
  image?: string;
  region: string;
  duration: number; // jours
  touristType?: string;
}

export function TouristTripJsonLd({
  name,
  description,
  url,
  image,
  region,
  duration,
  touristType = "Vanlife",
}: TouristTripJsonLdProps) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "TouristTrip",
    name,
    description,
    url,
    ...(image ? { image } : {}),
    touristType,
    itinerary: {
      "@type": "ItemList",
      name: `Itinéraire ${region} ${duration} jours`,
    },
    provider: {
      "@type": "Organization",
      name: "Vanzon Explorer",
      url: "https://vanzonexplorer.com",
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

interface RoadTripFAQJsonLdProps {
  items: Array<{ question: string; answer: string }>;
}

export function RoadTripFAQJsonLd({ items }: RoadTripFAQJsonLdProps) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map(({ question, answer }) => ({
      "@type": "Question",
      name: question,
      acceptedAnswer: {
        "@type": "Answer",
        text: answer,
      },
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

export function OrganizationJsonLd() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Vanzon Explorer",
    url: "https://vanzonexplorer.com",
    logo: "https://cdn.sanity.io/images/lewexa74/production/9de5b0e768fa1fcc5ea5aa6f41ac816c249af9b0-1042x417.png",
    sameAs: [
      "https://www.instagram.com/vanzonexplorer",
    ],
    description: "Location et vente de vans aménagés au Pays Basque. Spécialistes vanlife.",
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

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
    ...(article.updatedAt ? { "dateModified": article.updatedAt } : {}),
    "author": [
      {
        "@type": "Person",
        "name": "Jules Gaveglio",
        "url": `${BASE_URL}/a-propos`,
        "jobTitle": "Co-fondateur Vanzon Explorer",
      },
      {
        "@type": "Person",
        "name": "Elio Dubernet",
        "url": `${BASE_URL}/a-propos`,
        "jobTitle": "Co-fondateur Vanzon Explorer",
      },
    ],
    "publisher": {
      "@type": "Organization",
      "name": "Vanzon Explorer",
      "url": BASE_URL,
      "logo": {
        "@type": "ImageObject",
        "url": "https://cdn.sanity.io/images/lewexa74/production/1f483103ef15ee3549eab14ba2801d11b32a9055-313x313.png?auto=format&q=82",
        "width": 313,
        "height": 313,
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
