// src/types/poi.ts
// Types canoniques pour le gestionnaire POI admin (/admin/poi)
// Aligné sur le schéma DB réel (pas de catégorie 'plage' séparée — c'est un subcategory de 'nature')

export type POICategory =
  | 'restaurant'
  | 'activite'
  | 'culture'
  | 'nature'
  | 'spot_nuit'
  | 'parking'

export type POIBudgetLevel = 'gratuit' | 'faible' | 'moyen' | 'eleve'

export type OvernightType =
  | 'parking_gratuit'
  | 'aire_camping_car'
  | 'camping_van'
  | 'spot_sauvage'

export interface POICacheRow {
  id: string
  name: string
  category: POICategory
  subcategory: string | null
  budget_level: POIBudgetLevel | null
  location_city: string
  address: string | null
  google_maps_url: string | null
  external_url: string | null
  image_url: string | null
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
  price_indication: string | null
  opening_hours: string | null
  duration_minutes: number | null
  scraped_at: string
  source: string | null
}

export type POIUpdate = Partial<Omit<POICacheRow, 'id' | 'scraped_at'>>

// ─── API payloads ───────────────────────────────────────────────────────────
export interface POIScrapeUrlRequest {
  url: string
}

export interface POIScrapeUrlResponse {
  success: boolean
  poi?: POICacheRow
  error?: string
  duplicate?: boolean
}

export type BulkScrapeCategoryKey =
  | 'sport'
  | 'nature'
  | 'gastronomie_faible'
  | 'gastronomie_moyen'
  | 'gastronomie_eleve'
  | 'culture'
  | 'plages'
  | 'spot_nuit_gratuit'
  | 'spot_nuit_aire'
  | 'spot_nuit_camping'

export interface POIBulkScrapeRequest {
  categories: BulkScrapeCategoryKey[]
}

export type POIBulkScrapingEvent =
  | { type: 'progress'; message: string }
  | { type: 'poi_added'; poi: Pick<POICacheRow, 'name' | 'category' | 'location_city'> }
  | { type: 'duplicate'; name: string }
  | { type: 'error'; message: string }
  | {
      type: 'complete'
      stats: { added: number; duplicates: number; errors: number }
    }

// ─── List filters ───────────────────────────────────────────────────────────
export interface POIListFilters {
  search?: string
  category?: POICategory | 'all'
  budget?: POIBudgetLevel | 'all'
  city?: string | 'all'
  overnight_only?: boolean
  sort?: 'recent' | 'rating' | 'alpha'
  page?: number
  page_size?: number
}

export interface POIListResponse {
  rows: POICacheRow[]
  total: number
  page: number
  page_size: number
  // Stats globales (indépendantes des filtres) pour le panneau gauche
  stats: {
    total: number
    by_category: Record<string, number>
    with_image: number
    without_image: number
    added_this_month: number
  }
  // Villes distinctes pour dropdown filtre
  cities: string[]
}
