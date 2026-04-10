// src/types/roadtrip.ts
// Types canoniques du nouveau système Road Trip Personnalisé (v2, Pays Basque lead magnet)

// ─── Wizard / formulaire ────────────────────────────────────────────────────
export type VanStatus = 'proprietaire' | 'locataire'
export type GroupType = 'solo' | 'couple' | 'amis' | 'famille'
export type DurationKey = '1j' | '2-3j' | '4-5j' | '1sem'
export type BudgetLevel = 'faible' | 'moyen' | 'eleve'
export type OvernightPreference = 'gratuit' | 'aires_officielles' | 'camping' | 'mix'

export type InterestKey =
  | 'sport'
  | 'nature'
  | 'gastronomie'
  | 'culture'
  | 'plages'
  | 'soirees'

export interface RoadTripFormData {
  firstname: string
  email: string
  groupType: GroupType
  vanStatus: VanStatus
  duration: DurationKey
  interests: InterestKey[]
  budgetLevel: BudgetLevel
  overnightPreference: OvernightPreference
}

// ─── POI cache (lignes Supabase) ─────────────────────────────────────────────
export type POICategory =
  | 'restaurant'
  | 'activite'
  | 'parking'
  | 'culture'
  | 'nature'
  | 'spot_nuit'

export type OvernightType =
  | 'parking_gratuit'
  | 'aire_camping_car'
  | 'camping_van'
  | 'spot_sauvage'

export interface POIRow {
  id?: string
  name: string
  category: POICategory
  subcategory: string | null
  budget_level: 'gratuit' | 'faible' | 'moyen' | 'eleve' | null
  location_city: string
  address: string | null
  google_maps_url: string | null
  external_url: string | null
  rating: number | null
  description: string | null
  tags: string[]

  parking_nearby: boolean
  parking_info: string | null

  overnight_allowed: boolean
  overnight_type: OvernightType | null
  overnight_price_per_night: number | null
  overnight_capacity: string | null
  overnight_amenities: string[]
  overnight_restrictions: string | null
  overnight_coordinates: string | null

  source: string | null
  scraped_at?: string
}

// Payload upsert (champs optionnels pour scraping Tavily/Groq)
export type POIUpsert = Omit<POIRow, 'id' | 'scraped_at'> & {
  tags?: string[]
  overnight_amenities?: string[]
  parking_nearby?: boolean
  overnight_allowed?: boolean
}

// ─── Itinéraire généré (v2, stocké dans itineraire_json) ────────────────────
export interface ItineraryStop {
  time: string // ex: "9h00"
  name: string
  type: 'activite' | 'restaurant' | 'culture' | 'nature' | 'plage' | 'soiree'
  description: string
  address: string
  url: string
  budget_indicatif: string // ex: "gratuit", "5-15€", "20-50€"
}

export interface ItineraryOvernight {
  name: string
  type: OvernightType
  price: string // ex: "gratuit", "8€/nuit"
  address: string
  coordinates: string // "lat,lng"
  google_maps_url: string
  amenities: string[]
  restrictions: string
  tip: string
}

export interface ItineraryDay {
  day: number
  theme: string
  stops: ItineraryStop[]
  overnight: ItineraryOvernight
}

export interface GeneratedItineraryV2 {
  title: string
  intro: string
  days: ItineraryDay[]
  tips_van: string[]
  cta: string
  version: 'v2'
}

// ─── Helpers mapping form → enums legacy ─────────────────────────────────────
export const DURATION_TO_DAYS: Record<DurationKey, number> = {
  '1j': 1,
  '2-3j': 3,
  '4-5j': 5,
  '1sem': 7,
}

export const BUDGET_LEVEL_TO_LEGACY: Record<BudgetLevel, 'economique' | 'confort' | 'premium'> = {
  faible: 'economique',
  moyen: 'confort',
  eleve: 'premium',
}

export const INTEREST_TO_LEGACY: Record<InterestKey, string> = {
  sport: 'sports_aventure',
  nature: 'nature_rando',
  gastronomie: 'gastronomie',
  culture: 'culture_patrimoine',
  plages: 'plages_surf',
  soirees: 'vie_nocturne',
}
