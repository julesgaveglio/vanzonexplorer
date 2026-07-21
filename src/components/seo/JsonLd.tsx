import type { VanData } from "@/lib/data/vans";

const SITE_URL = "https://vanzonexplorer.com";

// Type "Service" (une location, pas un bien vendu), pas "Product" : Google
// classe sinon la page en Extraits de produits et réclame aggregateRating/
// review. Fabriquer une note reproduirait l'erreur déjà corrigée sur le
// LocalBusiness (note auto-décernée, GSC WNC-10030322).
export function LocationRentalJsonLd({ destination, url }: { destination: string; url: string }) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: `Location van aménagé — ${destination}`,
    description: `Louez un van aménagé tout équipé pour explorer ${destination} au départ de Cambo-les-Bains. Assurance incluse.`,
    url,
    provider: { "@type": "Organization", name: "Vanzon Explorer", url: SITE_URL },
    offers: {
      "@type": "AggregateOffer",
      lowPrice: "65",
      highPrice: "95",
      priceCurrency: "EUR",
      offerCount: "3",
      offers: [
        {
          "@type": "Offer",
          name: "Basse saison (15/11–15/02)",
          price: "65",
          priceCurrency: "EUR",
          availability: "https://schema.org/InStock",
          seller: { "@type": "Organization", name: "Vanzon Explorer", url: SITE_URL },
        },
        {
          "@type": "Offer",
          name: "Saison intermédiaire",
          price: "75",
          priceCurrency: "EUR",
          availability: "https://schema.org/InStock",
          seller: { "@type": "Organization", name: "Vanzon Explorer", url: SITE_URL },
        },
        {
          "@type": "Offer",
          name: "Haute saison (15/04–15/09)",
          price: "95",
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
  "@id": `${BASE_URL}/#organization`,
  name: "Vanzon Explorer",
  description: "Location de vans aménagés tout équipés au Pays Basque. Assurance incluse, départ Cambo-les-Bains. Achat et formation vanlife.",
  slogan: "Rendre accessible à tous le goût de la liberté",
  url: BASE_URL,
  // GEO : les 3 offres = les 3 cibles (louer / acheter / se former)
  makesOffer: [
    {
      "@type": "Offer",
      name: "Location de vans aménagés au Pays Basque",
      description:
        "Vans tout équipés au départ de Cambo-les-Bains, de 65 € à 95 €/nuit selon la saison. Réservation via Yescapa ou Wikicampers, assurance tous risques incluse.",
      url: `${BASE_URL}/location`,
      priceSpecification: {
        "@type": "PriceSpecification",
        minPrice: 65,
        maxPrice: 95,
        priceCurrency: "EUR",
        unitText: "par nuit",
      },
    },
    {
      "@type": "Offer",
      name: "Vente de vans aménagés",
      description:
        "Vans aménagés par Vanzon Explorer, exploités en location puis revendus avec historique complet. Remise en main propre à Cambo-les-Bains.",
      url: `${BASE_URL}/achat`,
    },
    {
      "@type": "Offer",
      name: "Formation Van Business Academy",
      description:
        "Formation en ligne pour acheter, aménager et rentabiliser un van aménagé : location saisonnière et achat-revente.",
      url: `${BASE_URL}/formation`,
    },
  ],
  knowsAbout: [
    "location van aménagé Pays Basque",
    "aménagement de van",
    "homologation VASP",
    "location de van sur Yescapa",
    "achat-revente de vans aménagés",
    "vanlife au Pays Basque",
    "road trip en van",
  ],
  telephone: "+33745553719",
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
  foundingDate: "2024-01-01",
  founder: [
    {
      "@type": "Person",
      name: "Jules Gaveglio",
      jobTitle: "Fondateur",
      url: `${BASE_URL}/a-propos`,
    },
  ],
};

// Pas d'aggregateRating ici : une note "auto-décernée" sur sa propre
// LocalBusiness/Organization est interdite par les règles Google (Review
// snippets), et elle ne correspondait pas au "5/5 sur Google" affiché
// (mismatch markup ↔ contenu visible). Retirée juillet 2026 pour résoudre
// l'erreur GSC "L'avis contient plusieurs notes cumulées" (WNC-10030322).
export function LocalBusinessJsonLd() {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export function WebSiteJsonLd() {
  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Vanzon Explorer",
    url: BASE_URL,
    inLanguage: "fr-FR",
    publisher: { "@id": `${BASE_URL}/#organization` },
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
    />
  );
}

// Type "Vehicle", pas "Product" : Google classe sinon la page en Extraits
// de produits et réclame aggregateRating/review. Un van d'occasion unique
// n'a pas d'avis "produit" à donner sans les fabriquer — ce qui reproduirait
// l'erreur déjà corrigée sur le LocalBusiness (note auto-décernée, GSC
// WNC-10030322). Vehicle reste riche en propriétés pour la citation GEO.
export function VanProductJsonLd({ van }: { van: VanData }) {
  const vehicleSchema = {
    "@context": "https://schema.org",
    "@type": "Vehicle",
    "name": `${van.name} — ${van.model} aménagé`,
    "description": van.description,
    "image": van.images[0],
    "url": `${BASE_URL}/achat/${van.id}`,
    "sku": van.ref,
    "brand": { "@type": "Brand", "name": "Renault" },
    "model": van.model,
    "vehicleModelDate": String(van.year),
    "mileageFromOdometer": {
      "@type": "QuantitativeValue",
      "value": parseInt(van.mileage.replace(/\D/g, ""), 10),
      "unitCode": "KMT",
    },
    "fuelType": van.energy,
    "vehicleTransmission": van.gearbox,
    "seatingCapacity": van.seats,
    "itemCondition": "https://schema.org/UsedCondition",
    "offers": {
      "@type": "Offer",
      "price": van.price.replace(/[^\d]/g, ""),
      "priceCurrency": "EUR",
      "availability":
        van.status === "Disponible"
          ? "https://schema.org/InStock"
          : "https://schema.org/SoldOut",
      "seller": { "@type": "Organization", "name": "Vanzon Explorer", "url": BASE_URL },
    },
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(vehicleSchema) }}
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
        "jobTitle": "Fondateur Vanzon Explorer",
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
