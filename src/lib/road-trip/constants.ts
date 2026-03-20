// src/lib/road-trip/constants.ts

export const INTERETS_OPTIONS = [
  { value: 'nature_rando', label: 'Nature & randonnée' },
  { value: 'plages_surf', label: 'Plages & surf' },
  { value: 'culture_patrimoine', label: 'Culture & patrimoine' },
  { value: 'gastronomie', label: 'Gastronomie locale' },
  { value: 'sports_aventure', label: 'Sports & aventure' },
  { value: 'bienetre_detente', label: 'Bien-être & détente' },
  { value: 'vie_nocturne', label: 'Vie nocturne & festivals' },
] as const

export type InteretValue = typeof INTERETS_OPTIONS[number]['value']

export const MOIS_OPTIONS = [
  'janvier', 'fevrier', 'mars', 'avril', 'mai', 'juin',
  'juillet', 'aout', 'septembre', 'octobre', 'novembre', 'decembre'
] as const

export type MoisValue = typeof MOIS_OPTIONS[number]

export const STYLE_VOYAGE_OPTIONS = [
  { value: 'lent', label: 'Rythme lent', desc: '2-3 stops max, profondeur' },
  { value: 'explorer', label: 'Explorer', desc: 'Maximum de spots' },
  { value: 'aventure', label: 'Aventure', desc: 'Off-road & nature sauvage' },
] as const

export const PROFIL_VOYAGEUR_OPTIONS = [
  { value: 'solo', label: 'Solo', emoji: '🧍' },
  { value: 'couple', label: 'En couple', emoji: '💑' },
  { value: 'famille', label: 'Famille', emoji: '👨‍👩‍👧' },
  { value: 'amis', label: 'Entre amis', emoji: '👥' },
] as const

export const BUDGET_OPTIONS = [
  { value: 'economique', label: 'Économique', desc: 'Camping gratuit & bivouac' },
  { value: 'confort', label: 'Confort', desc: 'Aires équipées & campings' },
  { value: 'premium', label: 'Premium', desc: 'Spots premium & glamping' },
] as const

export const DUREE_OPTIONS = Array.from({ length: 14 }, (_, i) => i + 1)
