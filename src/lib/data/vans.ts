// Single source of truth for van sale data

export interface VanData {
  id: string;
  name: string;
  model: string;
  /** Année modèle réelle du véhicule (carte grise) */
  year: number;
  /** Année de l'aménagement Vanzon — distincte de l'année modèle */
  conversionYear: number;
  mileage: string;
  price: string;
  status: string;
  energy: string;
  gearbox: string;
  seats: number;
  /** Homologation VASP (carte grise camping-car) — false = carte grise d'origine */
  vasp: boolean;
  /** Lieu de vente (remise en main propre) */
  location: { city: string; dept: string };
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
    conversionYear: 2024,
    mileage: "190 000 km",
    price: "19 900 €",
    status: "Disponible",
    energy: "Diesel",
    gearbox: "Manuelle 6V",
    seats: 3,
    vasp: false,
    location: { city: "Cambo-les-Bains", dept: "64" },
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
      "https://wa.me/33745553719?text=Bonjour%20Jules%2C%20je%20suis%20int%C3%A9ress%C3%A9%20par%20l%27achat%20du%20van%20Yoni%20(r%C3%A9f.%20VZN-YONI-01).",
  },
  {
    id: "xalbat",
    name: "Xalbat",
    model: "Renault Trafic III L2H1",
    year: 2017,
    conversionYear: 2025,
    mileage: "195 000 km",
    price: "19 900 €",
    status: "Disponible",
    energy: "Diesel",
    gearbox: "Manuelle 6V",
    seats: 3,
    vasp: false,
    location: { city: "Cambo-les-Bains", dept: "64" },
    ref: "VZN-XALBAT-02",
    images: [
      "https://cdn.sanity.io/images/lewexa74/production/e9664378c5fdc652c33ae7342dfc52cc4960c8bf-1080x750.png",
      "https://cdn.sanity.io/images/lewexa74/production/e07cf63507850084bee14fca9a91b4efe5b7d18a-1080x750.png",
      "https://cdn.sanity.io/images/lewexa74/production/04d93973d30c5eede51f954d1432a50a5f82ef9b-1080x750.png",
      "/images/vans/xalbat-vente/xalbat-interieur-jour.jpg",
      "/images/vans/xalbat-vente/xalbat-exterieur-coucher-soleil.jpg",
      "/images/vans/xalbat-vente/xalbat-interieur-led-rouge.jpg",
      "/images/vans/xalbat-vente/xalbat-interieur-led-orange.jpg",
      "/images/vans/xalbat-vente/xalbat-coffre-cuisine.jpg",
    ],
    features: [
      "Lit fixe 2 personnes + matelas appoint",
      "Cuisine coulissante — réchaud gaz 2 feux",
      "Glacière portative 40L",
      "Toilette sèche intégrée",
      "Isolation laine de mouton",
      "Panneau solaire 195W",
      "Batterie lithium 100Ah",
      "Prises USB & 220V",
      "Rangements sur-mesure",
    ],
    highlights: ["Lit fixe 2 pers.", "Cuisine coulissante", "Panneau solaire", "100Ah lithium"],
    description:
      "Xalbat est notre deuxième aménagement, réalisé en 2025 avec toute l'expérience acquise sur notre premier van. Conçu, utilisé et entretenu au sein de notre propre flotte de location au Pays Basque, son historique est entièrement traçable et son entretien a toujours été suivi avec rigueur. Contrôle technique valide jusqu'en 2028. Pendant son exploitation en location, Xalbat a reçu d'excellents retours de nos voyageurs (5/5 ⭐). Prêt à partir immédiatement, remise en main propre à Cambo-les-Bains.",
    whatsapp:
      "https://wa.me/33745553719?text=Bonjour%20Jules%2C%20je%20suis%20int%C3%A9ress%C3%A9%20par%20l%27achat%20du%20van%20Xalbat%20(r%C3%A9f.%20VZN-XALBAT-02).",
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
  status: string;
  energy: string;
  gearbox: string;
  seats: number;
  vasp: boolean;
  /** Ex. "Cambo-les-Bains (64)" */
  locationLabel: string;
  tag: string;
  /** Toutes les photos de l'annonce (carrousel sur la page listing) */
  images: string[];
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
  status: v.status,
  energy: v.energy,
  gearbox: v.gearbox,
  seats: v.seats,
  vasp: v.vasp,
  locationLabel: `${v.location.city} (${v.location.dept})`,
  tag: `Aménagé ${v.conversionYear}`,
  images: v.images,
  highlights: v.highlights,
  href: `/achat/${v.id}`,
}));
