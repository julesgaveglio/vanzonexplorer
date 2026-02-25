// ━━━ Types Sanity — Vanzon Explorer ━━━

export interface SanityImage {
  url: string;
  alt?: string;
}

// ── Van complet (fiche détaillée)
export interface Van {
  _id: string;
  name: string;
  slug: string;
  offerType: ("location" | "achat")[];
  status: "available" | "reserved" | "sold" | "preparing";
  tagline?: string;
  description?: unknown[];
  mainImage: SanityImage;
  gallery?: SanityImage[];
  vanType?: string;
  brand?: string;
  model?: string;
  year?: number;
  mileage?: number;
  capacity?: number;
  length?: number;
  startingPricePerNight?: number;
  salePrice?: number;
  externalBookingUrl?: string;
  externalBookingPlatform?: string;
  insuranceIncluded?: boolean;
  // Équipements — literie
  eq_bed_type?: string;
  eq_bed_size?: string;
  // Équipements — sanitaires
  eq_shower?: boolean;
  eq_shower_type?: string;
  eq_toilet?: boolean;
  eq_toilet_type?: string;
  // Équipements — cuisine
  eq_kitchen?: boolean;
  eq_stove_type?: string;
  eq_fridge?: boolean;
  eq_fridge_liters?: number;
  eq_freezer?: boolean;
  // Équipements — énergie & confort
  eq_heating?: boolean;
  eq_heating_type?: string;
  eq_solar?: boolean;
  eq_solar_watts?: number;
  eq_battery_ah?: number;
  eq_inverter_220v?: boolean;
  // Équipements — connectivité
  eq_wifi?: boolean;
  eq_tv?: boolean;
  eq_usb_ports?: boolean;
  eq_bluetooth?: boolean;
  // Équipements — extérieur & sport
  eq_outdoor_awning?: boolean;
  eq_outdoor_chairs?: boolean;
  eq_outdoor_bbq?: boolean;
  eq_surf_rack?: boolean;
  eq_bike_rack?: boolean;
  // Contenu éditorial
  highlights?: string[];
  rules?: string[];
  // SEO
  seoTitle?: string;
  seoDescription?: string;
  featured?: boolean;
  sortOrder?: number;
}

// ── Van résumé (card catalogue)
export interface VanCard {
  _id: string;
  name: string;
  slug: string;
  offerType: ("location" | "achat")[];
  tagline?: string;
  mainImage: SanityImage;
  vanType?: string;
  capacity?: number;
  startingPricePerNight?: number;
  salePrice?: number;
  externalBookingUrl?: string;
  externalBookingPlatform?: string;
  insuranceIncluded?: boolean;
  featured?: boolean;
  highlights?: string[];
  // Équipements clés pour la card
  eq_shower?: boolean;
  eq_toilet?: boolean;
  eq_kitchen?: boolean;
  eq_wifi?: boolean;
  eq_surf_rack?: boolean;
  eq_outdoor_awning?: boolean;
  eq_bike_rack?: boolean;
}

// ── Témoignage
export interface Testimonial {
  _id: string;
  name: string;
  role?: string;
  content: string;
  rating: number;
  photo?: SanityImage;
  featured?: boolean;
}

// ── Spot Pays Basque
export interface SpotPaysBasque {
  _id: string;
  name: string;
  slug: string;
  category: string;
  description?: unknown[];
  mainImage: SanityImage;
  gallery?: SanityImage[];
  coordinates?: { lat: number; lng: number };
  highlights?: string[];
  seoTitle?: string;
  seoDescription?: string;
}
