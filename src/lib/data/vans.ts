// Single source of truth for van sale data

export interface VanData {
  id: string;
  name: string;
  model: string;
  year: number;
  mileage: string;
  price: string;
  status: string;
  energy: string;
  gearbox: string;
  seats: number;
  ref: string;
  images: string[];
  features: string[];
  /** Curated 4-item list for the landing page card grid */
  highlights: string[];
  description: string;
  whatsapp: string;
}

export const VANS: VanData[] = [
  {
    id: "yoni",
    name: "Yoni",
    model: "Renault Trafic III L2H1",
    year: 2024,
    mileage: "68 000 km",
    price: "25 000 €",
    status: "Disponible",
    energy: "Diesel",
    gearbox: "Manuelle 6V",
    seats: 3,
    ref: "VZN-YONI-01",
    images: [
      "https://cdn.sanity.io/images/lewexa74/production/2e9214211ef5a235dcf2aa639d0feafcc867c88f-1080x750.png",
      "https://cdn.sanity.io/images/lewexa74/production/660105a28e577c33f642a8fdff528d88925642e3-1080x750.png",
      "https://cdn.sanity.io/images/lewexa74/production/f93fa16ab46d8934dcc3092a8e86fc80ebce4305-1080x750.png",
    ],
    features: [
      "Lit fixe 2 personnes + matelas appoint",
      "Cuisine coulissante — réchaud gaz 2 feux",
      "Glacière portative 40L",
      "Toilette sèche intégrée",
      "Isolation laine de mouton",
      "Panneau solaire 100W",
      "Batterie secondaire 100Ah",
      "Prises USB & 220V",
      "Rangements sur-mesure",
    ],
    highlights: ["Lit fixe 2 pers.", "Cuisine coulissante", "Panneau solaire", "100Ah lithium"],
    description:
      "Yoni a été aménagé par nos soins en 2024 — conçu, construit et utilisé dans notre propre flotte de location au Pays Basque. Chaque détail a été pensé pour le confort et la durabilité. Carnet d'entretien complet, historique traçable depuis l'origine, remise en main propre à Cambo-les-Bains.",
    whatsapp:
      "https://wa.me/33618476378?text=Bonjour%20Jules%2C%20je%20suis%20int%C3%A9ress%C3%A9%20par%20l%27achat%20du%20van%20Yoni%20(r%C3%A9f.%20VZN-YONI-01).",
  },
  {
    id: "xalbat",
    name: "Xalbat",
    model: "Renault Trafic III L2H1",
    year: 2025,
    mileage: "54 000 km",
    price: "25 000 €",
    status: "Disponible",
    energy: "Diesel",
    gearbox: "Manuelle 6V",
    seats: 3,
    ref: "VZN-XALBAT-02",
    images: [
      "https://cdn.sanity.io/images/lewexa74/production/e9664378c5fdc652c33ae7342dfc52cc4960c8bf-1080x750.png",
      "https://cdn.sanity.io/images/lewexa74/production/e07cf63507850084bee14fca9a91b4efe5b7d18a-1080x750.png",
      "https://cdn.sanity.io/images/lewexa74/production/04d93973d30c5eede51f954d1432a50a5f82ef9b-1080x750.png",
    ],
    features: [
      "Lit fixe 2 personnes + matelas appoint",
      "Cuisine coulissante — réchaud gaz 2 feux",
      "Glacière portative 40L",
      "Toilette sèche intégrée",
      "Isolation laine de mouton",
      "Panneau solaire 100W",
      "Batterie secondaire 100Ah",
      "Prises USB & 220V",
      "Rangements sur-mesure",
    ],
    highlights: ["Lit fixe 2 pers.", "Cuisine coulissante", "Panneau solaire", "100Ah lithium"],
    description:
      "Xalbat est notre dernier aménagement, réalisé par nos soins en 2025. Le van le plus récent de notre flotte, avec le moins de kilomètres. Construit selon les mêmes standards que nos véhicules de location, avec historique complet depuis l'achat. Disponible à Cambo-les-Bains, remise en main propre.",
    whatsapp:
      "https://wa.me/33618476378?text=Bonjour%20Jules%2C%20je%20suis%20int%C3%A9ress%C3%A9%20par%20l%27achat%20du%20van%20Xalbat%20(r%C3%A9f.%20VZN-XALBAT-02).",
  },
];

// Landing page card grid variant — derived from VANS
export interface VanLandingData {
  id: string;
  name: string;
  model: string;
  year: number;
  mileage: string;
  price: string;
  tag: string;
  image: string;
  highlights: string[];
  href: string;
}

export const VANS_LANDING: VanLandingData[] = VANS.map((v) => ({
  id: v.id,
  name: v.name,
  model: v.model,
  year: v.year,
  mileage: v.mileage,
  price: v.price,
  tag: `Aménagé ${v.year}`,
  image: v.images[0],
  highlights: v.highlights,
  href: `/achat/${v.id}`,
}));
