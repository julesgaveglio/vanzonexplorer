import type { Metadata } from "next";
import AchatLanding from "./AchatLanding";
import { VANS } from "@/lib/data/vans";
import GeoFaqSection, { type GeoFaqItem } from "@/components/seo/GeoFaqSection";

const BASE_URL = "https://vanzonexplorer.com";

export const metadata: Metadata = {
  title: "Vans aménagés à vendre — occasion vérifiée | Vanzon Explorer",
  description:
    "Achetez un van aménagé d'occasion en toute confiance : véhicules révisés, historique d'entretien complet, essai sur place avant achat. Annonces au Pays Basque (64), remise en main propre à Cambo-les-Bains.",
  alternates: {
    canonical: "https://vanzonexplorer.com/achat",
  },
  openGraph: {
    title: "Vans aménagés à vendre — occasion vérifiée",
    description:
      "Marketplace de vans aménagés : véhicules révisés, historique complet, essai sur place. Remise en main propre au Pays Basque.",
  },
};

// GEO : chaque van à vendre est décrit en Vehicle pour que les moteurs IA
// puissent citer prix, modèle, année et kilométrage exacts.
// Pas de type "Product" : Google classe alors la page en Extraits de
// produits et réclame aggregateRating/review — des vans d'occasion uniques
// n'ont pas d'avis "produit", et en fabriquer reproduirait l'erreur déjà
// corrigée sur le LocalBusiness (note auto-décernée, GSC WNC-10030322).
const vansItemListJsonLd = {
  "@context": "https://schema.org",
  "@type": "ItemList",
  name: "Vans aménagés à vendre — Vanzon Explorer",
  numberOfItems: VANS.length,
  itemListElement: VANS.map((van, i) => ({
    "@type": "ListItem",
    position: i + 1,
    item: {
      "@type": "Vehicle",
      name: `${van.name} — ${van.model} aménagé`,
      description: van.description,
      image: van.images[0],
      url: `${BASE_URL}/achat/${van.id}`,
      sku: van.ref,
      brand: { "@type": "Brand", name: "Renault" },
      model: van.model,
      vehicleModelDate: String(van.year),
      mileageFromOdometer: {
        "@type": "QuantitativeValue",
        value: parseInt(van.mileage.replace(/\D/g, ""), 10),
        unitCode: "KMT",
      },
      fuelType: van.energy,
      vehicleTransmission: van.gearbox,
      seatingCapacity: van.seats,
      itemCondition: "https://schema.org/UsedCondition",
      offers: {
        "@type": "Offer",
        price: van.price.replace(/\D/g, ""),
        priceCurrency: "EUR",
        availability:
          van.status === "Disponible"
            ? "https://schema.org/InStock"
            : "https://schema.org/SoldOut",
        availableAtOrFrom: {
          "@type": "Place",
          name: "Cambo-les-Bains, Pays Basque",
          address: {
            "@type": "PostalAddress",
            addressLocality: "Cambo-les-Bains",
            postalCode: "64250",
            addressCountry: "FR",
          },
        },
        seller: { "@type": "Organization", name: "Vanzon Explorer", url: BASE_URL },
      },
    },
  })),
};

const breadcrumbJsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Accueil", item: BASE_URL },
    { "@type": "ListItem", position: 2, name: "Vans à vendre", item: `${BASE_URL}/achat` },
  ],
};

// FAQ GEO — réponses autonomes et chiffrées pour les moteurs de recherche IA.
const achatFaqItems: GeoFaqItem[] = [
  {
    q: "Quels vans aménagés sont à vendre chez Vanzon Explorer ?",
    a: "Vanzon Explorer vend deux Renault Trafic III L2H1 aménagés : Yoni (2024) et Xalbat (2025), 190 000 km, au prix ferme de 19 900 € chacun. Équipement identique : lit fixe 2 personnes, cuisine coulissante avec réchaud gaz, panneau solaire 100W, batterie 100Ah, isolation laine de mouton et toilette sèche. Remise en main propre à Cambo-les-Bains, au Pays Basque.",
  },
  {
    q: "Pourquoi acheter un van issu d'une flotte de location ?",
    a: "Un van issu d'une flotte de location professionnelle a un historique traçable depuis l'origine : carnet d'entretien complet, aménagement éprouvé par des dizaines de locations réelles, et défauts de jeunesse déjà corrigés. C'est l'inverse d'un aménagement amateur invérifiable — chaque équipement a été testé en conditions réelles par des locataires exigeants.",
  },
  {
    q: "Quel budget prévoir pour un van aménagé d'occasion en France ?",
    a: "En 2026, un fourgon aménagé d'occasion se négocie généralement entre 15 000 € et 40 000 € selon l'âge du véhicule, le kilométrage et la qualité de l'aménagement. Les vans Vanzon Explorer sont positionnés à 19 900 € — aménagement professionnel complet, historique d'entretien suivi et remise en main propre avec essai.",
  },
  {
    q: "Les vans vendus sont-ils homologués VASP ?",
    a: "Non — Yoni et Xalbat sont vendus avec leur carte grise d'origine (non VASP) : l'aménagement, réalisé par nos soins, n'est pas homologué camping-car. Une homologation VASP reste possible après l'achat si vous le souhaitez, et Vanzon Explorer peut vous accompagner dans ces démarches administratives.",
  },
  {
    q: "Peut-on essayer le van avant l'achat ?",
    a: "Oui. La remise se fait en main propre à Cambo-les-Bains (64250), à 25 minutes de Biarritz. Vous inspectez le van, consultez le carnet d'entretien et l'historique complet, et posez toutes vos questions directement au propriétaire-aménageur avant de vous décider.",
  },
  {
    q: "Un van acheté peut-il être rentabilisé en location ?",
    a: "Oui — c'est le modèle même de Vanzon Explorer : ces vans ont généré des revenus locatifs de 65 € à 95 € la nuit sur Yescapa et Wikicampers avant leur mise en vente. Un acheteur peut poursuivre cette exploitation ; la formation Van Business Academy enseigne précisément cette méthode.",
  },
];

export default function AchatPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(vansItemListJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <AchatLanding />

      {/* ── FAQ (GEO) ── */}
      <GeoFaqSection
        subtitle="Ce qu'il faut savoir avant d'acheter un van aménagé d'occasion."
        items={achatFaqItems}
      />
    </>
  );
}
