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
