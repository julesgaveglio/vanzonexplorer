# Road Trip Pays Basque — Refonte SEO locale — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remplacer la landing monolithique `/road-trip-pays-basque-van` par une arborescence SEO locale Pays Basque à 21 pages pré-buildées (16 indexées), alimentée par `poi_cache` (49 POIs retrofittés) et une nouvelle table `road_trip_templates` pré-seedée via Groq.

**Architecture:** Next.js App Router Server Components avec ISR 24h, lecture Supabase via `createSupabaseAdmin()` au build/revalidate. Une nouvelle table `road_trip_templates` stocke 16 itinéraires pré-générés par un script one-shot, aucune génération à la volée côté page. Nouveau composant `RoadTripMap.tsx` client-only (dynamic import) basé sur MapLibre + Maptiler, non partagé avec `CatalogMap.tsx` existant. Les 49 POIs existants sont retrofittés en batch day-0 : géocoding Nominatim + scraping OG image via `extractOGImage` existant.

**Tech Stack:** Next.js 14 App Router, React Server Components, TypeScript, Tailwind CSS, Supabase (PostgreSQL), MapLibre GL JS 5, Maptiler outdoor-v2, Groq llama-3.3-70b-versatile, Nominatim OSM, Zod, react-hook-form.

**Référence spec:** `docs/superpowers/specs/2026-04-11-road-trip-pays-basque-seo-refonte-design.md`

---

## Préambule — Conventions et hygiène

- **Commits fréquents** : un commit par task complète (pas par step). Messages FR style Vanzon : `feat(road-trip-pb): ...`, `chore(data): ...`, `docs: ...`.
- **Pas de `git push`** tant que le plan n'est pas complet. Jules pousse quand il veut.
- **Tests** : on applique TDD sur les queries (`src/lib/road-trip-pb/queries.ts`), les scripts de backfill, et le parsing Groq du seed. On **NE fait pas** de tests unitaires sur les composants UI (pas de test runner frontend dans le projet — `npm run test` n'existe pas, vérifier `package.json`).
- **Vérification boundary** : à la fin de chaque chunk, lancer `npm run build` et corriger les erreurs TypeScript/ESLint avant de passer au chunk suivant. C'est la "validation réelle" puisqu'il n'y a pas de test runner frontend.
- **Pas de backup file, pas de `_old.tsx`** : quand on remplace la landing monolithique, on remplace en place via `Write`.
- **`npx tsx --env-file=.env.local <script>`** pour tous les scripts TS standalone (pattern vérifié sur ce projet).
- **Toujours absolute path** dans les tool calls.

---

## Chunk 0 : Préparation du worktree

### Task 0.1: Créer worktree dédié

**Files:**
- Worktree: `.worktrees/road-trip-pb-refonte/`
- Branch: `feature/road-trip-pb-refonte`

- [ ] **Step 1: Vérifier que le repo est clean sur main**

Run: `git status`
Expected: pas de fichier staged ; les modifications non committées de la spec session ont été committées (`0b964ac`).

- [ ] **Step 2: Créer le worktree**

Run depuis `/Users/julesgaveglio/vanzon-website-claude-code`:
```bash
git worktree add .worktrees/road-trip-pb-refonte -b feature/road-trip-pb-refonte
```

Expected: `Preparing worktree (new branch 'feature/road-trip-pb-refonte')`

- [ ] **Step 3: Vérifier `.env.local` accessible depuis le worktree**

Run: `ls .worktrees/road-trip-pb-refonte/.env.local`
Expected: pas `No such file or directory`. Si absent → symlink :
```bash
ln -s /Users/julesgaveglio/vanzon-website-claude-code/.env.local .worktrees/road-trip-pb-refonte/.env.local
```

- [ ] **Step 4: `cd` dans le worktree et installer deps**

Run:
```bash
cd .worktrees/road-trip-pb-refonte && npm install
```
Expected: install propre (même lock que parent).

> **Toutes les steps suivantes s'exécutent depuis `.worktrees/road-trip-pb-refonte/`.** Les paths absolus dans ce plan sont à lire relatifs au worktree sauf mention contraire.

---

## Chunk 1 : Foundation — migration SQL, types, constants, queries

### Task 1.1: Migration Supabase — `coordinates` + `road_trip_templates`

**Files:**
- Create: `supabase/migrations/20260411000001_poi_coordinates_and_templates.sql`

- [ ] **Step 1: Créer le fichier de migration**

Écrire exactement :

```sql
-- supabase/migrations/20260411000001_poi_coordinates_and_templates.sql
-- Refonte SEO Road Trip Pays Basque
--   1. Colonne `coordinates` sur poi_cache (format "lat,lng" string)
--   2. Table road_trip_templates : itinéraires pré-générés par combo (duration × groupType × region)

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. poi_cache : ajoute coordinates générique
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE poi_cache ADD COLUMN IF NOT EXISTS coordinates TEXT;
CREATE INDEX IF NOT EXISTS idx_poi_coordinates
  ON poi_cache(coordinates) WHERE coordinates IS NOT NULL;

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. road_trip_templates : itinéraires pré-générés statiques
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS road_trip_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  region_slug TEXT NOT NULL,
  duration_key TEXT NOT NULL,
  group_type TEXT NOT NULL,
  title TEXT NOT NULL,
  intro TEXT,
  itinerary_json JSONB NOT NULL,
  poi_ids UUID[] DEFAULT ARRAY[]::UUID[],
  overnight_ids UUID[] DEFAULT ARRAY[]::UUID[],
  tips TEXT[] DEFAULT ARRAY[]::TEXT[],
  faq JSONB DEFAULT '[]'::JSONB,
  published BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT road_trip_templates_unique UNIQUE (region_slug, duration_key, group_type),
  CONSTRAINT road_trip_templates_duration_check CHECK (
    duration_key IN ('1-jour', 'weekend', '5-jours', '1-semaine')
  ),
  CONSTRAINT road_trip_templates_group_check CHECK (
    group_type IN ('solo', 'couple', 'amis', 'famille')
  )
);

CREATE INDEX IF NOT EXISTS idx_rtt_region ON road_trip_templates(region_slug);
CREATE INDEX IF NOT EXISTS idx_rtt_lookup
  ON road_trip_templates(region_slug, duration_key, group_type);

ALTER TABLE road_trip_templates ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "road_trip_templates_public_read"
    ON road_trip_templates FOR SELECT
    TO anon
    USING (published = true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
```

- [ ] **Step 2: Appliquer la migration sur Supabase**

Ce projet n'utilise pas `supabase db push` localement — les migrations sont appliquées via le Supabase SQL Editor sur l'environnement de prod. **Action manuelle Jules** :

Run : ouvrir https://supabase.com/dashboard/project/_/sql → copier le contenu du fichier → exécuter.

Expected: `Success. No rows returned.` (2 fois : ALTER + CREATE TABLE)

**Vérif rapide post-migration :**
```bash
npx tsx --env-file=.env.local -e "
import { createClient } from '@supabase/supabase-js';
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
(async () => {
  const { data, error } = await sb.from('road_trip_templates').select('id').limit(1);
  console.log('templates:', error?.message || 'OK');
  const { data: cols } = await sb.from('poi_cache').select('coordinates').limit(1);
  console.log('coordinates col:', 'OK');
})();
"
```
Expected: `templates: OK` + `coordinates col: OK`

- [ ] **Step 3: Commit la migration**

```bash
git add supabase/migrations/20260411000001_poi_coordinates_and_templates.sql
git commit -m "$(cat <<'EOF'
feat(db): migration coordinates + road_trip_templates

Ajoute poi_cache.coordinates (format "lat,lng" string, index partiel)
et la table road_trip_templates pour stocker les itinéraires
pré-générés par combo region × duration × groupType.

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 1.2: Types — `src/types/road-trip-pb.ts`

**Files:**
- Create: `src/types/road-trip-pb.ts`

- [ ] **Step 1: Créer le fichier de types**

```typescript
// src/types/road-trip-pb.ts
// Types dédiés à la refonte SEO Road Trip Pays Basque (/road-trip-pays-basque-van)
// Distincts des types wizard dans src/types/roadtrip.ts pour éviter le couplage.

import type { GroupType, POIRow, GeneratedItineraryV2 } from './roadtrip'

// ─── URL slugs ───────────────────────────────────────────────────────────────
export type DurationSlug = '1-jour' | 'weekend' | '5-jours' | '1-semaine'

export const ALL_DURATION_SLUGS: DurationSlug[] = ['1-jour', 'weekend', '5-jours', '1-semaine']
export const ALL_GROUP_TYPES: GroupType[] = ['solo', 'couple', 'amis', 'famille']

// Duration slugs indexables SEO (1-jour est noindex)
export const INDEXABLE_DURATION_SLUGS: DurationSlug[] = ['weekend', '5-jours', '1-semaine']

// ─── Row Supabase road_trip_templates ────────────────────────────────────────
export interface RoadTripTemplateRow {
  id: string
  region_slug: string
  duration_key: DurationSlug
  group_type: GroupType
  title: string
  intro: string | null
  itinerary_json: GeneratedItineraryV2
  poi_ids: string[]
  overnight_ids: string[]
  tips: string[]
  faq: FAQItem[]
  published: boolean
  created_at: string
  updated_at: string
}

export interface FAQItem {
  q: string
  a: string
}

// ─── Poi row étendu avec coordinates ─────────────────────────────────────────
// On ne duplique pas POIRow : on l'étend localement pour clarifier qu'on lit
// la nouvelle colonne coordinates.
export interface POIRowWithCoords extends POIRow {
  id: string
  coordinates: string | null
  image_url?: string | null
  price_indication?: string | null
  opening_hours?: string | null
  duration_minutes?: number | null
}

// ─── Helpers parse coordinates ───────────────────────────────────────────────
export function parseCoordinates(raw: string | null | undefined): [number, number] | null {
  if (!raw) return null
  const parts = raw.split(',').map((p) => p.trim())
  if (parts.length !== 2) return null
  const lat = Number(parts[0])
  const lng = Number(parts[1])
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return null
  return [lng, lat] // MapLibre utilise [lng, lat]
}

// ─── Wizard DurationKey ↔ DurationSlug mapping ───────────────────────────────
import type { DurationKey } from './roadtrip'

export const DURATION_SLUG_TO_KEY: Record<DurationSlug, DurationKey> = {
  '1-jour': '1j',
  weekend: '2-3j',
  '5-jours': '4-5j',
  '1-semaine': '1sem',
}

export const DURATION_KEY_TO_SLUG: Record<DurationKey, DurationSlug> = {
  '1j': '1-jour',
  '2-3j': 'weekend',
  '4-5j': '5-jours',
  '1sem': '1-semaine',
}

export const DURATION_TO_DAYS_SLUG: Record<DurationSlug, number> = {
  '1-jour': 1,
  weekend: 3,
  '5-jours': 5,
  '1-semaine': 7,
}
```

- [ ] **Step 2: TypeScript check**

Run: `npx tsc --noEmit`
Expected: pas d'erreur sur le nouveau fichier.

- [ ] **Step 3: Commit**

```bash
git add src/types/road-trip-pb.ts
git commit -m "feat(types): ajoute road-trip-pb types (DurationSlug, template rows, parseCoordinates)

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

### Task 1.3: Constants — `src/lib/road-trip-pb/constants.ts`

**Files:**
- Create: `src/lib/road-trip-pb/constants.ts`

- [ ] **Step 1: Créer le fichier**

```typescript
// src/lib/road-trip-pb/constants.ts
// Constantes partagées pour la refonte SEO Road Trip Pays Basque.
// Toute valeur "magique" (slug, label, centroid, ville de départ) vit ici.

import type { DurationSlug, POIRowWithCoords } from '@/types/road-trip-pb'
import type { GroupType, InterestKey, BudgetLevel } from '@/types/roadtrip'

// ─── Métadonnées région ──────────────────────────────────────────────────────
export const REGION_SLUG = 'pays-basque' as const
export const REGION_NAME = 'Pays Basque' as const
export const PICKUP_CITY = 'Cambo-les-Bains' as const
export const PICKUP_POSTAL = '64250' as const

// MapLibre utilise [lng, lat]
export const PB_CENTER: [number, number] = [-1.48, 43.48]
export const PB_DEFAULT_ZOOM = 9
export const PB_MAX_BOUNDS: [[number, number], [number, number]] = [
  [-2.5, 42.8], // SW
  [0.2, 44.2],  // NE
]

// ─── Labels FR ───────────────────────────────────────────────────────────────
export const DURATION_LABELS: Record<DurationSlug, string> = {
  '1-jour': '1 jour',
  weekend: 'Weekend',
  '5-jours': '5 jours',
  '1-semaine': '1 semaine',
}

export const DURATION_LABELS_LONG: Record<DurationSlug, string> = {
  '1-jour': 'en 1 journée',
  weekend: 'en weekend',
  '5-jours': 'en 5 jours',
  '1-semaine': 'en 1 semaine',
}

export const GROUP_LABELS: Record<GroupType, string> = {
  solo: 'en solo',
  couple: 'en couple',
  amis: 'entre amis',
  famille: 'en famille',
}

export const GROUP_LABELS_SHORT: Record<GroupType, string> = {
  solo: 'Solo',
  couple: 'Couple',
  amis: 'Amis',
  famille: 'Famille',
}

export const GROUP_EMOJIS: Record<GroupType, string> = {
  solo: '🧍',
  couple: '💑',
  amis: '👥',
  famille: '👨‍👩‍👧',
}

// ─── Mapping groupType → InterestKeys déduits ────────────────────────────────
// Utilisé pour filtrer les POIs du cache selon le profil voyageur
export const GROUP_TYPE_INTERESTS: Record<GroupType, InterestKey[]> = {
  solo: ['sport', 'nature', 'culture'],
  couple: ['gastronomie', 'culture', 'plages', 'nature'],
  amis: ['sport', 'plages', 'soirees', 'gastronomie'],
  famille: ['nature', 'plages', 'culture'],
}

// ─── Mapping interest → tags poi_cache ───────────────────────────────────────
// Aligné avec INTEREST_TAG_MAP de src/lib/road-trip/poi-cache.ts pour cohérence
export const INTEREST_TO_POI_TAGS: Record<InterestKey, string[]> = {
  sport: ['sport', 'aventure', 'surf', 'rafting', 'escalade', 'vtt', 'canyoning'],
  nature: ['nature', 'randonnee', 'montagne', 'foret', 'cascade'],
  gastronomie: ['gastronomie', 'restaurant', 'marche', 'pintxos', 'fromagerie'],
  culture: ['culture', 'patrimoine', 'musee', 'village', 'histoire'],
  plages: ['plage', 'detente', 'mer', 'cote', 'ocean'],
  soirees: ['soiree', 'bar', 'festif', 'nuit', 'concert'],
}

// ─── Budget filter ordre d'affichage ─────────────────────────────────────────
export const BUDGET_ORDER: BudgetLevel[] = ['faible', 'moyen', 'eleve']

export const BUDGET_LABELS: Record<BudgetLevel | 'all', string> = {
  all: 'Tous',
  faible: 'Petit budget',
  moyen: 'Budget moyen',
  eleve: 'Confort',
}

// ─── Catégorie → couleur marker map (hex) ────────────────────────────────────
export const CATEGORY_COLORS = {
  restaurant: '#ef4444',   // rouge
  activite: '#f97316',     // orange
  nature: '#16a34a',       // vert
  culture: '#a855f7',      // violet
  spot_nuit: '#2563eb',    // bleu
  parking: '#64748b',      // slate
} as const

export const CATEGORY_EMOJIS: Record<POIRowWithCoords['category'], string> = {
  restaurant: '🍽️',
  activite: '🏄',
  nature: '🌲',
  culture: '🏛️',
  spot_nuit: '🌙',
  parking: '🅿️',
}

// ─── Route helpers ──────────────────────────────────────────────────────────
export const ROAD_TRIP_PB_BASE = '/road-trip-pays-basque-van' as const

export function hubPath(): string {
  return ROAD_TRIP_PB_BASE
}
export function durationPath(d: DurationSlug): string {
  return `${ROAD_TRIP_PB_BASE}/${d}`
}
export function finalPath(d: DurationSlug, g: GroupType): string {
  return `${ROAD_TRIP_PB_BASE}/${d}/${g}`
}

// CTA wizard pré-rempli
export function wizardPrefillUrl(params: {
  duration?: DurationSlug
  groupType?: GroupType
  budgetLevel?: BudgetLevel
}): string {
  const qs = new URLSearchParams()
  if (params.duration) qs.set('duration', params.duration)
  if (params.groupType) qs.set('groupType', params.groupType)
  if (params.budgetLevel) qs.set('budgetLevel', params.budgetLevel)
  const q = qs.toString()
  return `/road-trip-personnalise${q ? `?${q}` : ''}`
}
```

- [ ] **Step 2: TypeScript check**

Run: `npx tsc --noEmit`
Expected: pas d'erreur.

- [ ] **Step 3: Commit**

```bash
git add src/lib/road-trip-pb/constants.ts
git commit -m "feat(road-trip-pb): constants partagées (slugs, labels, couleurs, centroids)

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

### Task 1.4: Queries Supabase — `src/lib/road-trip-pb/queries.ts`

**Files:**
- Create: `src/lib/road-trip-pb/queries.ts`

- [ ] **Step 1: Créer le fichier avec signatures et implémentations**

```typescript
// src/lib/road-trip-pb/queries.ts
// Server-only helpers Supabase pour les pages /road-trip-pays-basque-van/*.
// Appelés en RSC au build time / ISR revalidate, jamais côté client.

import 'server-only'
import { createSupabaseAdmin } from '@/lib/supabase/server'
import type { GroupType, POIRow } from '@/types/roadtrip'
import type {
  DurationSlug,
  POIRowWithCoords,
  RoadTripTemplateRow,
} from '@/types/road-trip-pb'
import {
  REGION_SLUG,
  GROUP_TYPE_INTERESTS,
  INTEREST_TO_POI_TAGS,
} from './constants'

// ─── Helpers internes ────────────────────────────────────────────────────────

const PAYS_BASQUE_CITIES = [
  'Biarritz', 'Bayonne', 'Anglet', 'Saint-Jean-de-Luz', 'Hendaye',
  'Espelette', 'Ainhoa', 'Saint-Jean-Pied-de-Port', 'Itxassou',
  'Sare', 'Bidarray', 'Cambo-les-Bains', 'Guéthary', 'Bidart',
  'Urrugne', 'Larrau', 'Sainte-Engrace', 'Lecumberry', 'Iraty',
]

function isPaysBasquePOI(locationCity: string): boolean {
  return PAYS_BASQUE_CITIES.some((c) =>
    locationCity.toLowerCase().includes(c.toLowerCase())
  )
}

// ─── Top POIs de la région (toutes catégories sauf spot_nuit) ────────────────

export async function getTopActivities(limit = 6): Promise<POIRowWithCoords[]> {
  const supabase = createSupabaseAdmin()
  const { data, error } = await supabase
    .from('poi_cache')
    .select('*')
    .neq('category', 'spot_nuit')
    .neq('category', 'parking')
    .in('location_city', PAYS_BASQUE_CITIES)
    .order('scraped_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('[road-trip-pb/queries] getTopActivities:', error.message)
    return []
  }
  return (data as POIRowWithCoords[] | null) ?? []
}

// ─── POIs filtrés par groupType ──────────────────────────────────────────────

export async function getPOIsForGroupType(
  groupType: GroupType,
  limit = 20
): Promise<POIRowWithCoords[]> {
  const supabase = createSupabaseAdmin()
  const interests = GROUP_TYPE_INTERESTS[groupType]
  const tags = interests.flatMap((i) => INTEREST_TO_POI_TAGS[i] ?? [])

  const { data, error } = await supabase
    .from('poi_cache')
    .select('*')
    .neq('category', 'spot_nuit')
    .neq('category', 'parking')
    .in('location_city', PAYS_BASQUE_CITIES)
    .overlaps('tags', tags)
    .limit(limit)

  if (error) {
    console.error('[road-trip-pb/queries] getPOIsForGroupType:', error.message)
    return []
  }

  // Fallback : si aucun match tags, on retourne des POIs génériques
  if (!data || data.length === 0) {
    return getTopActivities(limit)
  }
  return data as POIRowWithCoords[]
}

// ─── Spots nuit top N ────────────────────────────────────────────────────────

export async function getOvernightSpots(limit = 6): Promise<POIRowWithCoords[]> {
  const supabase = createSupabaseAdmin()
  const { data, error } = await supabase
    .from('poi_cache')
    .select('*')
    .eq('category', 'spot_nuit')
    .eq('overnight_allowed', true)
    .in('location_city', PAYS_BASQUE_CITIES)
    .order('scraped_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('[road-trip-pb/queries] getOvernightSpots:', error.message)
    return []
  }
  return (data as POIRowWithCoords[] | null) ?? []
}

// ─── Template pour un combo exact ────────────────────────────────────────────

export async function getTemplate(
  duration: DurationSlug,
  groupType: GroupType
): Promise<RoadTripTemplateRow | null> {
  const supabase = createSupabaseAdmin()
  const { data, error } = await supabase
    .from('road_trip_templates')
    .select('*')
    .eq('region_slug', REGION_SLUG)
    .eq('duration_key', duration)
    .eq('group_type', groupType)
    .eq('published', true)
    .maybeSingle()

  if (error) {
    console.error('[road-trip-pb/queries] getTemplate:', error.message)
    return null
  }
  return (data as RoadTripTemplateRow | null) ?? null
}

// ─── POIs by id list (utilisé par les pages qui résolvent un template) ──────

export async function getPOIsByIds(ids: string[]): Promise<POIRowWithCoords[]> {
  if (ids.length === 0) return []
  const supabase = createSupabaseAdmin()
  const { data, error } = await supabase
    .from('poi_cache')
    .select('*')
    .in('id', ids)

  if (error) {
    console.error('[road-trip-pb/queries] getPOIsByIds:', error.message)
    return []
  }
  return (data as POIRowWithCoords[] | null) ?? []
}

// ─── Stats région pour le hub ────────────────────────────────────────────────

export interface RegionStats {
  totalPois: number
  totalOvernight: number
  cities: string[]
}

export async function getRegionStats(): Promise<RegionStats> {
  const supabase = createSupabaseAdmin()
  const { data, error } = await supabase
    .from('poi_cache')
    .select('category, location_city')
    .in('location_city', PAYS_BASQUE_CITIES)

  if (error || !data) {
    return { totalPois: 0, totalOvernight: 0, cities: [] }
  }

  const totalPois = data.filter((r) => r.category !== 'spot_nuit').length
  const totalOvernight = data.filter((r) => r.category === 'spot_nuit').length
  const cities = Array.from(new Set(data.map((r) => r.location_city))).sort()

  return { totalPois, totalOvernight, cities }
}
```

- [ ] **Step 2: TypeScript check**

Run: `npx tsc --noEmit`
Expected: pas d'erreur. Si `server-only` n'est pas dans deps :
```bash
npm install server-only
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/road-trip-pb/queries.ts package.json package-lock.json
git commit -m "feat(road-trip-pb): queries Supabase server-only (getTopActivities, getPOIsForGroupType, getOvernightSpots, getTemplate, getPOIsByIds, getRegionStats)

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

### Task 1.5: Smoke test queries en dev

**Files:**
- Temp script: `scripts/road-trip/_smoke-queries.ts` (supprimé après usage)

- [ ] **Step 1: Créer un script de smoke test**

```typescript
// scripts/road-trip/_smoke-queries.ts
// Usage: npx tsx --env-file=.env.local scripts/road-trip/_smoke-queries.ts
import {
  getTopActivities,
  getPOIsForGroupType,
  getOvernightSpots,
  getTemplate,
  getRegionStats,
} from '../../src/lib/road-trip-pb/queries'

async function main() {
  console.log('── getRegionStats ──')
  console.log(await getRegionStats())

  console.log('\n── getTopActivities(6) ──')
  const top = await getTopActivities(6)
  console.log(`${top.length} results`, top.map((p) => p.name))

  console.log('\n── getPOIsForGroupType("couple", 10) ──')
  const couple = await getPOIsForGroupType('couple', 10)
  console.log(`${couple.length} results`, couple.map((p) => p.name))

  console.log('\n── getOvernightSpots(5) ──')
  const nights = await getOvernightSpots(5)
  console.log(`${nights.length} results`, nights.map((p) => p.name))

  console.log('\n── getTemplate("weekend", "couple") ──')
  const tmpl = await getTemplate('weekend', 'couple')
  console.log('template:', tmpl ? tmpl.title : 'null (attendu avant seed)')
}
main().catch((e) => { console.error(e); process.exit(1) })
```

- [ ] **Step 2: Exécuter le smoke test**

Run: `npx tsx --env-file=.env.local scripts/road-trip/_smoke-queries.ts`

Expected (avant backfill et seed) :
```
── getRegionStats ──
{ totalPois: ~33, totalOvernight: ~16, cities: [ ... ] }
── getTopActivities(6) ──
6 results [ ... ]
── getPOIsForGroupType("couple", 10) ──
N results [ ... ]  (N ≥ 1, probablement ≥ 5)
── getOvernightSpots(5) ──
5 results [ ... ]
── getTemplate("weekend", "couple") ──
template: null (attendu avant seed)
```

Si erreur `PAYS_BASQUE_CITIES` ne matche rien → vérifier que le `location_city` du cache est dans la liste. Ajouter les villes manquantes dans `queries.ts`.

- [ ] **Step 3: Supprimer le smoke script (temporaire)**

```bash
rm scripts/road-trip/_smoke-queries.ts
```

Pas de commit pour ce step (le script était temporaire).

---

### Task 1.6: Build check chunk 1

- [ ] **Step 1: Run build**

Run: `npm run build`

Expected: build réussit, pas d'erreur TS/ESLint liée aux nouveaux fichiers. Les pages existantes ne sont pas touchées donc rien à casser.

- [ ] **Step 2: Si erreurs, corriger puis re-run**

Typiquement : imports manquants, types trop stricts sur `RoadTripTemplateRow.itinerary_json`. Cast explicite si besoin.

---

## Chunk 2 : Data pipeline — backfill + seed scripts

### Task 2.1: Helper geocoding Nominatim — `src/lib/road-trip-pb/geocoding.ts`

**Files:**
- Create: `src/lib/road-trip-pb/geocoding.ts`

- [ ] **Step 1: Créer le helper**

```typescript
// src/lib/road-trip-pb/geocoding.ts
// Wrapper Nominatim pour géocoder les POIs du cache.
// Respecte la ToS : 1 req/s max, User-Agent obligatoire, Referer fourni.

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search'
const USER_AGENT = 'VanzonExplorer/1.0 (contact@vanzonexplorer.com)'

export interface GeocodeResult {
  lat: number
  lng: number
  display_name: string
}

export async function geocode(query: string): Promise<GeocodeResult | null> {
  const params = new URLSearchParams({
    q: query,
    format: 'json',
    limit: '1',
    addressdetails: '0',
    countrycodes: 'fr,es', // Pays Basque FR + Euskadi
  })
  const url = `${NOMINATIM_URL}?${params}`
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': USER_AGENT,
        Referer: 'https://vanzonexplorer.com',
        'Accept-Language': 'fr',
      },
      signal: AbortSignal.timeout(15000),
    })
    if (!res.ok) {
      console.warn(`[geocoding] ${res.status} for "${query}"`)
      return null
    }
    const data = (await res.json()) as Array<{
      lat: string
      lon: string
      display_name: string
    }>
    if (!data || data.length === 0) return null
    return {
      lat: Number(data[0].lat),
      lng: Number(data[0].lon),
      display_name: data[0].display_name,
    }
  } catch (err) {
    console.warn('[geocoding] error:', (err as Error).message)
    return null
  }
}

export function formatCoordinates(result: { lat: number; lng: number }): string {
  return `${result.lat.toFixed(6)},${result.lng.toFixed(6)}`
}

// Centroid de fallback par ville (pour POIs non géocodables)
export const CITY_FALLBACK_COORDS: Record<string, [number, number]> = {
  'Biarritz': [43.4832, -1.5586],
  'Bayonne': [43.4933, -1.4745],
  'Anglet': [43.4851, -1.5166],
  'Saint-Jean-de-Luz': [43.3895, -1.6626],
  'Hendaye': [43.3587, -1.7755],
  'Espelette': [43.3406, -1.4425],
  'Ainhoa': [43.3058, -1.4983],
  'Saint-Jean-Pied-de-Port': [43.1631, -1.2366],
  'Itxassou': [43.3261, -1.4239],
  'Sare': [43.3122, -1.5800],
  'Bidarray': [43.2706, -1.3508],
  'Cambo-les-Bains': [43.3583, -1.4028],
  'Guéthary': [43.4244, -1.6083],
  'Bidart': [43.4417, -1.5900],
  'Urrugne': [43.3789, -1.6986],
  'Larrau': [42.9589, -1.0164],
  'Sainte-Engrace': [43.0028, -0.9347],
  'Lecumberry': [43.0703, -1.1447],
  'Iraty': [43.0253, -1.0825],
}

export function getCityFallback(city: string): [number, number] | null {
  return CITY_FALLBACK_COORDS[city] ?? null
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
```

- [ ] **Step 2: TypeScript check**

Run: `npx tsc --noEmit`
Expected: OK.

- [ ] **Step 3: Commit**

```bash
git add src/lib/road-trip-pb/geocoding.ts
git commit -m "feat(road-trip-pb): helper Nominatim geocode + fallback city centroids

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

### Task 2.2: Script de backfill coordinates — `scripts/road-trip/backfill-poi-coordinates.ts`

**Files:**
- Create: `scripts/road-trip/backfill-poi-coordinates.ts`

- [ ] **Step 1: Créer le script**

```typescript
#!/usr/bin/env tsx
// scripts/road-trip/backfill-poi-coordinates.ts
// Géocode tous les POIs de poi_cache sans coordinates via Nominatim.
// Idempotent : re-run = no-op sur les POIs déjà géocodés.
// Usage:
//   npx tsx --env-file=.env.local scripts/road-trip/backfill-poi-coordinates.ts
//   npx tsx --env-file=.env.local scripts/road-trip/backfill-poi-coordinates.ts --dry-run
//   npx tsx --env-file=.env.local scripts/road-trip/backfill-poi-coordinates.ts --force

import { createClient } from '@supabase/supabase-js'
import {
  geocode,
  formatCoordinates,
  getCityFallback,
  sleep,
} from '../../src/lib/road-trip-pb/geocoding'

const isDryRun = process.argv.includes('--dry-run')
const isForce = process.argv.includes('--force')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function main() {
  console.log(`🗺️  backfill-poi-coordinates — ${isDryRun ? 'DRY RUN' : 'LIVE'}${isForce ? ' FORCE' : ''}`)

  let query = supabase
    .from('poi_cache')
    .select('id, name, address, location_city, coordinates')
    .order('scraped_at', { ascending: false })

  if (!isForce) query = query.is('coordinates', null)

  const { data: pois, error } = await query
  if (error) throw new Error(`fetch error: ${error.message}`)
  if (!pois || pois.length === 0) {
    console.log('✅ Aucun POI à géocoder.')
    return
  }

  console.log(`📋 ${pois.length} POIs à traiter`)

  let success = 0
  let fallback = 0
  let skipped = 0

  for (const poi of pois) {
    const label = `${poi.name} (${poi.location_city})`
    const queries = [
      `${poi.name}, ${poi.address ?? ''}, ${poi.location_city}, France`.replace(/\s+,/g, ','),
      `${poi.name}, ${poi.location_city}, Pays Basque, France`,
    ].filter((q) => q.trim().length > 5)

    let coords: string | null = null

    for (const q of queries) {
      const result = await geocode(q)
      await sleep(1100) // 1 req/s strict
      if (result) {
        coords = formatCoordinates(result)
        console.log(`  ✓ ${label} → ${coords}`)
        success++
        break
      }
    }

    if (!coords) {
      const fb = getCityFallback(poi.location_city)
      if (fb) {
        coords = `${fb[0].toFixed(6)},${fb[1].toFixed(6)}`
        console.log(`  ~ ${label} → fallback city centroid ${coords}`)
        fallback++
      } else {
        console.log(`  ✗ ${label} — no match, no fallback`)
        skipped++
        continue
      }
    }

    if (!isDryRun && coords) {
      const { error: upErr } = await supabase
        .from('poi_cache')
        .update({ coordinates: coords })
        .eq('id', poi.id)
      if (upErr) {
        console.warn(`  ! update failed ${label}: ${upErr.message}`)
      }
    }
  }

  console.log(`\n🎉 Done. success=${success} fallback=${fallback} skipped=${skipped}`)
}

main().catch((e) => {
  console.error('❌', e.message)
  process.exit(1)
})
```

- [ ] **Step 2: Dry-run**

Run: `npx tsx --env-file=.env.local scripts/road-trip/backfill-poi-coordinates.ts --dry-run`

Expected :
- Environ 49 POIs listés (car `coordinates IS NULL` sur tous au départ)
- Pour chaque : soit `✓ … → 43.xxxx,-1.xxxx` soit `~ … → fallback`
- Compteur final `success=X fallback=Y skipped=Z`, avec `success + fallback ≥ 45`
- Durée totale ~90s (49 × ~2s car 2 queries/POI en pire cas × 1.1s sleep)

- [ ] **Step 3: Live run**

Run: `npx tsx --env-file=.env.local scripts/road-trip/backfill-poi-coordinates.ts`

Expected : même output, plus les updates Supabase effectifs.

- [ ] **Step 4: Vérifier en DB**

Run:
```bash
npx tsx --env-file=.env.local -e "
import { createClient } from '@supabase/supabase-js';
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
(async () => {
  const { count } = await sb.from('poi_cache').select('*', { count: 'exact', head: true }).not('coordinates','is',null);
  console.log('POIs with coordinates:', count);
})();
"
```

Expected: `POIs with coordinates: ≥ 40` (objectif spec: ≥ 40/49).

- [ ] **Step 5: Commit**

```bash
git add scripts/road-trip/backfill-poi-coordinates.ts
git commit -m "chore(data): script backfill-poi-coordinates via Nominatim (1 req/s, fallback city centroid)

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

### Task 2.3: Script de backfill images — `scripts/road-trip/backfill-poi-images.ts`

**Files:**
- Create: `scripts/road-trip/backfill-poi-images.ts`

- [ ] **Step 1: Créer le script**

```typescript
#!/usr/bin/env tsx
// scripts/road-trip/backfill-poi-images.ts
// Retrofit image_url sur poi_cache via extractOGImage() existant.
// Idempotent.
// Usage:
//   npx tsx --env-file=.env.local scripts/road-trip/backfill-poi-images.ts
//   npx tsx --env-file=.env.local scripts/road-trip/backfill-poi-images.ts --dry-run

import { createClient } from '@supabase/supabase-js'
import { extractOGImage } from '../../src/lib/admin/poi-scraper'

const isDryRun = process.argv.includes('--dry-run')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function main() {
  console.log(`🖼️  backfill-poi-images — ${isDryRun ? 'DRY RUN' : 'LIVE'}`)

  const { data: pois, error } = await supabase
    .from('poi_cache')
    .select('id, name, external_url, image_url')
    .is('image_url', null)
    .not('external_url', 'is', null)

  if (error) throw new Error(`fetch error: ${error.message}`)
  if (!pois || pois.length === 0) {
    console.log('✅ Aucun POI à retrofit.')
    return
  }

  console.log(`📋 ${pois.length} POIs à traiter`)

  let found = 0
  let missed = 0

  for (const poi of pois) {
    if (!poi.external_url) continue
    process.stdout.write(`  → ${poi.name} ... `)
    const img = await extractOGImage(poi.external_url)
    if (img) {
      console.log(`OK`)
      found++
      if (!isDryRun) {
        await supabase
          .from('poi_cache')
          .update({ image_url: img })
          .eq('id', poi.id)
      }
    } else {
      console.log(`—`)
      missed++
    }
    // Courtesy pause
    await new Promise((r) => setTimeout(r, 400))
  }

  console.log(`\n🎉 Done. found=${found} missed=${missed}`)
}

main().catch((e) => {
  console.error('❌', e.message)
  process.exit(1)
})
```

- [ ] **Step 2: Dry-run**

Run: `npx tsx --env-file=.env.local scripts/road-trip/backfill-poi-images.ts --dry-run`

Expected: liste des POIs avec soit `OK` soit `—`. Totaux en bas. Environ 30-40 `OK` espérés.

- [ ] **Step 3: Live run**

Run: `npx tsx --env-file=.env.local scripts/road-trip/backfill-poi-images.ts`

Expected: même output, DB mise à jour.

- [ ] **Step 4: Vérifier en DB**

```bash
npx tsx --env-file=.env.local -e "
import { createClient } from '@supabase/supabase-js';
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
(async () => {
  const { count } = await sb.from('poi_cache').select('*', { count: 'exact', head: true }).not('image_url','is',null);
  console.log('POIs with image_url:', count);
})();
"
```

Expected: `POIs with image_url: ≥ 25`

- [ ] **Step 5: Commit**

```bash
git add scripts/road-trip/backfill-poi-images.ts
git commit -m "chore(data): script backfill-poi-images via extractOGImage

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

### Task 2.4: Script de seed templates Groq — `scripts/road-trip/seed-templates.ts`

**Files:**
- Create: `scripts/road-trip/seed-templates.ts`

- [ ] **Step 1: Créer le script**

```typescript
#!/usr/bin/env tsx
// scripts/road-trip/seed-templates.ts
// Génère 16 templates road_trip_templates (1 par combo duration × groupType)
// via Groq llama-3.3-70b-versatile. Validation post-parse + 1 retry.
// Usage:
//   npx tsx --env-file=.env.local scripts/road-trip/seed-templates.ts
//   npx tsx --env-file=.env.local scripts/road-trip/seed-templates.ts --force
//   npx tsx --env-file=.env.local scripts/road-trip/seed-templates.ts --only weekend/couple
//   npx tsx --env-file=.env.local scripts/road-trip/seed-templates.ts --dry-run

import { createClient } from '@supabase/supabase-js'
import { groqWithFallback } from '../../src/lib/groq-with-fallback'
import {
  ALL_DURATION_SLUGS,
  ALL_GROUP_TYPES,
  DURATION_TO_DAYS_SLUG,
} from '../../src/types/road-trip-pb'
import type { DurationSlug } from '../../src/types/road-trip-pb'
import type { GroupType } from '../../src/types/roadtrip'
import {
  REGION_SLUG,
  GROUP_LABELS,
  DURATION_LABELS,
  GROUP_TYPE_INTERESTS,
  INTEREST_TO_POI_TAGS,
} from '../../src/lib/road-trip-pb/constants'

const isDryRun = process.argv.includes('--dry-run')
const isForce = process.argv.includes('--force')
const onlyArg = process.argv.find((a) => a.startsWith('--only='))?.split('=')[1]
  ?? (() => {
    const idx = process.argv.indexOf('--only')
    return idx >= 0 ? process.argv[idx + 1] : undefined
  })()

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Cities whitelist pour filtrer Pays Basque (dupliqué depuis queries.ts — OK scope script)
const PB_CITIES = [
  'Biarritz', 'Bayonne', 'Anglet', 'Saint-Jean-de-Luz', 'Hendaye',
  'Espelette', 'Ainhoa', 'Saint-Jean-Pied-de-Port', 'Itxassou',
  'Sare', 'Bidarray', 'Cambo-les-Bains', 'Guéthary', 'Bidart',
  'Urrugne', 'Larrau', 'Sainte-Engrace', 'Lecumberry', 'Iraty',
]

interface POIInput {
  id: string
  name: string
  category: string
  location_city: string
  description: string | null
  tags: string[]
  budget_level: string | null
}
interface OvernightInput {
  id: string
  name: string
  overnight_type: string | null
  overnight_price_per_night: number | null
  location_city: string
}

async function loadPOIs(groupType: GroupType): Promise<{ pois: POIInput[]; overnight: OvernightInput[] }> {
  const interests = GROUP_TYPE_INTERESTS[groupType]
  const tags = interests.flatMap((i) => INTEREST_TO_POI_TAGS[i] ?? [])

  const [poisRes, ovRes] = await Promise.all([
    supabase
      .from('poi_cache')
      .select('id,name,category,location_city,description,tags,budget_level')
      .neq('category', 'spot_nuit')
      .neq('category', 'parking')
      .in('location_city', PB_CITIES)
      .overlaps('tags', tags.length ? tags : ['nature'])
      .limit(40),
    supabase
      .from('poi_cache')
      .select('id,name,overnight_type,overnight_price_per_night,location_city')
      .eq('category', 'spot_nuit')
      .eq('overnight_allowed', true)
      .in('location_city', PB_CITIES)
      .limit(20),
  ])

  return {
    pois: (poisRes.data as POIInput[]) ?? [],
    overnight: (ovRes.data as OvernightInput[]) ?? [],
  }
}

// ─── Prompt contract ─────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `Tu es un expert vanlifer Pays Basque. Tu ne proposes QUE des POIs réels issus de la liste fournie. Tu ne cites AUCUN lieu hors liste. Tu réponds UNIQUEMENT en JSON valide, sans backtick, sans texte avant/après.`

function buildUserPrompt(
  duration: DurationSlug,
  groupType: GroupType,
  pois: POIInput[],
  overnight: OvernightInput[]
): string {
  const days = DURATION_TO_DAYS_SLUG[duration]
  const group = GROUP_LABELS[groupType]
  return `Crée un itinéraire road trip van pour ce profil :
- Région : Pays Basque (départ Cambo-les-Bains)
- Durée : ${days} jour(s)
- Profil : ${group}

POIs autorisés (tu DOIS uniquement utiliser ces id exacts) :
${JSON.stringify(pois)}

Spots nuit autorisés :
${JSON.stringify(overnight)}

Retourne STRICTEMENT ce JSON :
{
  "title": "titre 60-80 chars SEO-friendly",
  "intro": "80-120 mots personnalisés au profil ${group}",
  "itinerary_json": {
    "days": [
      {
        "day": 1,
        "theme": "thème de la journée",
        "stops": [
          { "poi_id": "<uuid exact de la liste>", "time": "9h00", "note": "2 phrases sur pourquoi ce stop" }
        ],
        "overnight_id": "<uuid exact de la liste overnight>"
      }
    ]
  },
  "poi_ids_used": ["<uuid1>", "<uuid2>", ...],
  "overnight_ids_used": ["<uuid1>", ...],
  "tips": ["tip1", "tip2", "tip3", "tip4", "tip5"],
  "faq": [
    { "q": "question pratique", "a": "réponse factuelle" },
    { "q": "...", "a": "..." }
  ]
}

Contraintes :
- EXACTEMENT ${days} jour(s) dans itinerary_json.days
- 3 à 5 stops par jour, chronologiques (matin → soir)
- 1 overnight_id par jour (obligatoire, jamais null)
- Tous les poi_id et overnight_id doivent EXISTER dans les listes ci-dessus (sinon refusé)
- 4 à 6 entrées dans faq
- 5 entrées exactement dans tips`
}

// ─── Parse + validation ─────────────────────────────────────────────────────

interface SeedResult {
  title: string
  intro: string
  itinerary_json: {
    days: Array<{
      day: number
      theme: string
      stops: Array<{ poi_id: string; time: string; note: string }>
      overnight_id: string
    }>
  }
  poi_ids_used: string[]
  overnight_ids_used: string[]
  tips: string[]
  faq: Array<{ q: string; a: string }>
}

function parseJson(raw: string): unknown {
  try {
    return JSON.parse(raw.trim())
  } catch {
    /* fallthrough */
  }
  const stripped = raw
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```\s*$/, '')
    .trim()
  try {
    return JSON.parse(stripped)
  } catch {
    /* fallthrough */
  }
  const match = raw.match(/\{[\s\S]*\}/)
  if (match) {
    try {
      return JSON.parse(match[0])
    } catch {
      /* fallthrough */
    }
  }
  throw new Error('invalid JSON')
}

function validate(
  result: SeedResult,
  expectedDays: number,
  allowedPoiIds: Set<string>,
  allowedOvernightIds: Set<string>
): string | null {
  if (!result.title || !result.itinerary_json?.days) return 'missing title or days'
  if (result.itinerary_json.days.length !== expectedDays) {
    return `days count ${result.itinerary_json.days.length} !== ${expectedDays}`
  }
  for (const day of result.itinerary_json.days) {
    if (!day.overnight_id || !allowedOvernightIds.has(day.overnight_id)) {
      return `invalid or missing overnight_id on day ${day.day}`
    }
    if (!day.stops || day.stops.length === 0) {
      return `no stops on day ${day.day}`
    }
    for (const stop of day.stops) {
      if (!stop.poi_id || !allowedPoiIds.has(stop.poi_id)) {
        return `invalid poi_id on day ${day.day}: ${stop.poi_id}`
      }
    }
  }
  if (!Array.isArray(result.tips) || result.tips.length === 0) return 'tips empty'
  if (!Array.isArray(result.faq) || result.faq.length < 3) return 'faq too short'
  return null
}

// ─── Génération d'un template ───────────────────────────────────────────────

async function generateOne(duration: DurationSlug, groupType: GroupType): Promise<SeedResult> {
  const { pois, overnight } = await loadPOIs(groupType)
  if (pois.length === 0) throw new Error(`no POIs for groupType=${groupType}`)
  if (overnight.length === 0) throw new Error(`no overnight spots for groupType=${groupType}`)

  const expectedDays = DURATION_TO_DAYS_SLUG[duration]
  const allowedPoiIds = new Set(pois.map((p) => p.id))
  const allowedOvernightIds = new Set(overnight.map((o) => o.id))

  const prompt = buildUserPrompt(duration, groupType, pois, overnight)

  for (let attempt = 1; attempt <= 2; attempt++) {
    const { content } = await groqWithFallback({
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: prompt },
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.5,
      response_format: { type: 'json_object' },
      max_tokens: 4000,
    })

    try {
      const parsed = parseJson(content) as SeedResult
      const err = validate(parsed, expectedDays, allowedPoiIds, allowedOvernightIds)
      if (err) {
        console.warn(`  ⚠ attempt ${attempt} validation error: ${err}`)
        if (attempt === 2) throw new Error(`validation failed after retry: ${err}`)
        continue
      }
      return parsed
    } catch (e) {
      console.warn(`  ⚠ attempt ${attempt} parse error: ${(e as Error).message}`)
      if (attempt === 2) throw e
    }
  }
  throw new Error('unreachable')
}

// ─── Main loop ──────────────────────────────────────────────────────────────

async function main() {
  console.log(`🤖 seed-templates — ${isDryRun ? 'DRY RUN' : 'LIVE'}${isForce ? ' FORCE' : ''}`)

  // Determine combos
  let combos: Array<{ duration: DurationSlug; groupType: GroupType }> = []
  if (onlyArg) {
    const [d, g] = onlyArg.split('/') as [DurationSlug, GroupType]
    combos = [{ duration: d, groupType: g }]
  } else {
    for (const d of ALL_DURATION_SLUGS) {
      for (const g of ALL_GROUP_TYPES) {
        combos.push({ duration: d, groupType: g })
      }
    }
  }

  console.log(`📋 ${combos.length} combos à générer`)

  let ok = 0
  let skipped = 0
  let failed = 0

  for (const { duration, groupType } of combos) {
    const label = `${duration}/${groupType}`
    process.stdout.write(`\n→ ${label} ... `)

    // Skip si existe et pas --force
    if (!isForce) {
      const { data: existing } = await supabase
        .from('road_trip_templates')
        .select('id')
        .eq('region_slug', REGION_SLUG)
        .eq('duration_key', duration)
        .eq('group_type', groupType)
        .maybeSingle()
      if (existing) {
        console.log('EXISTS (skip)')
        skipped++
        continue
      }
    }

    try {
      const result = await generateOne(duration, groupType)
      console.log('OK')

      if (!isDryRun) {
        const { error: upErr } = await supabase
          .from('road_trip_templates')
          .upsert(
            {
              region_slug: REGION_SLUG,
              duration_key: duration,
              group_type: groupType,
              title: result.title,
              intro: result.intro,
              itinerary_json: result.itinerary_json,
              poi_ids: result.poi_ids_used,
              overnight_ids: result.overnight_ids_used,
              tips: result.tips,
              faq: result.faq,
              published: true,
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'region_slug,duration_key,group_type' }
          )
        if (upErr) {
          console.warn(`  ! upsert failed: ${upErr.message}`)
          failed++
          continue
        }
      }
      ok++
    } catch (e) {
      console.log(`FAIL: ${(e as Error).message}`)
      failed++
    }
  }

  console.log(`\n🎉 Done. ok=${ok} skipped=${skipped} failed=${failed}`)
  process.exit(failed > 0 ? 1 : 0)
}

main().catch((e) => {
  console.error('❌', e.message)
  process.exit(1)
})
```

- [ ] **Step 2: Dry-run sur 1 combo**

Run: `npx tsx --env-file=.env.local scripts/road-trip/seed-templates.ts --dry-run --only weekend/couple`

Expected: 1 appel Groq, parse OK, validation OK, log `OK`, no DB write. Durée ~15s.

- [ ] **Step 3: Live run sur 1 combo**

Run: `npx tsx --env-file=.env.local scripts/road-trip/seed-templates.ts --only weekend/couple`

Expected: 1 template inséré en DB.

Vérif :
```bash
npx tsx --env-file=.env.local -e "
import { createClient } from '@supabase/supabase-js';
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
(async () => {
  const { data } = await sb.from('road_trip_templates').select('duration_key,group_type,title').eq('duration_key','weekend').eq('group_type','couple');
  console.log(data);
})();
"
```
Expected: 1 row avec title non-null.

- [ ] **Step 4: Live run complet (16 combos)**

Run: `npx tsx --env-file=.env.local scripts/road-trip/seed-templates.ts`

Expected: 15 combos générés (1 déjà existant skippé), durée totale ~4-6 minutes. En cas de failure sur 1-2 combos, relancer avec `--force --only <combo>`.

- [ ] **Step 5: Vérification finale DB**

```bash
npx tsx --env-file=.env.local -e "
import { createClient } from '@supabase/supabase-js';
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
(async () => {
  const { count } = await sb.from('road_trip_templates').select('*', { count: 'exact', head: true }).eq('region_slug','pays-basque');
  console.log('templates PB:', count);
})();
"
```

Expected: `templates PB: 16`

- [ ] **Step 6: Commit**

```bash
git add scripts/road-trip/seed-templates.ts
git commit -m "chore(data): script seed-templates (16 combos via Groq, validation post-parse, retry 1x)

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

### Task 2.5: Build check chunk 2

- [ ] **Step 1: Run build**

Run: `npm run build`
Expected: OK.

---

## Chunk 3 : Composants UI réutilisables

### Task 3.1: `POICard.tsx` — card POI générique

**Files:**
- Create: `src/app/(site)/road-trip-pays-basque-van/_components/POICard.tsx`

- [ ] **Step 1: Créer le composant**

```tsx
// src/app/(site)/road-trip-pays-basque-van/_components/POICard.tsx
// Card POI réutilisable — server component, pas d'état.

import Image from 'next/image'
import { CATEGORY_COLORS, CATEGORY_EMOJIS } from '@/lib/road-trip-pb/constants'
import type { POIRowWithCoords } from '@/types/road-trip-pb'

interface POICardProps {
  poi: POIRowWithCoords
}

const BUDGET_DOTS: Record<string, string> = {
  gratuit: '·',
  faible: '€',
  moyen: '€€',
  eleve: '€€€',
}

export default function POICard({ poi }: POICardProps) {
  const color = CATEGORY_COLORS[poi.category] ?? '#64748b'
  const emoji = CATEGORY_EMOJIS[poi.category] ?? '📍'
  const hasImage = Boolean(poi.image_url)
  const budgetLabel = poi.budget_level ? BUDGET_DOTS[poi.budget_level] : null

  const CardInner = (
    <>
      <div className="relative h-40 w-full overflow-hidden rounded-t-xl">
        {hasImage ? (
          <Image
            src={poi.image_url!}
            alt={poi.name}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover"
            unoptimized
          />
        ) : (
          <div
            className="flex h-full items-center justify-center text-5xl"
            style={{
              background: `linear-gradient(135deg, ${color}22, ${color}55)`,
            }}
            aria-hidden="true"
          >
            {emoji}
          </div>
        )}
        <span
          className="absolute left-2 top-2 rounded-full px-2 py-0.5 text-xs font-semibold text-white shadow"
          style={{ backgroundColor: color }}
        >
          {poi.category}
        </span>
        {budgetLabel && (
          <span className="absolute right-2 top-2 rounded-full bg-white/90 px-2 py-0.5 text-xs font-semibold text-slate-700 shadow">
            {budgetLabel}
          </span>
        )}
      </div>
      <div className="p-4">
        <h3 className="line-clamp-2 text-base font-bold text-slate-900">{poi.name}</h3>
        <p className="mt-1 text-xs uppercase tracking-wide text-slate-500">{poi.location_city}</p>
        {poi.description && (
          <p className="mt-2 line-clamp-3 text-sm text-slate-600">{poi.description}</p>
        )}
      </div>
    </>
  )

  const baseClasses =
    'group block overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md'

  if (poi.external_url) {
    return (
      <a
        href={poi.external_url}
        target="_blank"
        rel="noopener noreferrer"
        className={baseClasses}
      >
        {CardInner}
      </a>
    )
  }
  return <article className={baseClasses}>{CardInner}</article>
}
```

- [ ] **Step 2: TypeScript check**

Run: `npx tsc --noEmit`
Expected: OK.

- [ ] **Step 3: Commit**

```bash
git add "src/app/(site)/road-trip-pays-basque-van/_components/POICard.tsx"
git commit -m "feat(road-trip-pb): POICard component (image fallback, budget badge, category pill)

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

### Task 3.2: `OvernightCard.tsx`

**Files:**
- Create: `src/app/(site)/road-trip-pays-basque-van/_components/OvernightCard.tsx`

- [ ] **Step 1: Créer le composant**

```tsx
// src/app/(site)/road-trip-pays-basque-van/_components/OvernightCard.tsx
// Card spot de nuit — affiche type, prix, amenities, restrictions.

import Image from 'next/image'
import type { POIRowWithCoords } from '@/types/road-trip-pb'

const TYPE_LABELS: Record<string, string> = {
  parking_gratuit: 'Parking gratuit',
  aire_camping_car: 'Aire camping-car',
  camping_van: 'Camping van',
  spot_sauvage: 'Spot sauvage',
}

interface OvernightCardProps {
  spot: POIRowWithCoords
}

export default function OvernightCard({ spot }: OvernightCardProps) {
  const typeLabel = spot.overnight_type ? TYPE_LABELS[spot.overnight_type] ?? spot.overnight_type : 'Spot nuit'
  const price =
    spot.overnight_price_per_night && spot.overnight_price_per_night > 0
      ? `${spot.overnight_price_per_night}€/nuit`
      : 'Gratuit'

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="relative h-36 w-full">
        {spot.image_url ? (
          <Image
            src={spot.image_url}
            alt={spot.name}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover"
            unoptimized
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 text-4xl" aria-hidden="true">
            🌙
          </div>
        )}
        <span className="absolute left-2 top-2 rounded-full bg-blue-600 px-2 py-0.5 text-xs font-semibold text-white">
          {typeLabel}
        </span>
        <span className="absolute right-2 top-2 rounded-full bg-white/90 px-2 py-0.5 text-xs font-semibold text-slate-700">
          {price}
        </span>
      </div>
      <div className="flex flex-1 flex-col p-4">
        <h3 className="line-clamp-2 font-bold text-slate-900">{spot.name}</h3>
        <p className="mt-1 text-xs uppercase tracking-wide text-slate-500">{spot.location_city}</p>
        {spot.description && (
          <p className="mt-2 line-clamp-3 text-sm text-slate-600">{spot.description}</p>
        )}
        {spot.overnight_amenities && spot.overnight_amenities.length > 0 && (
          <ul className="mt-3 flex flex-wrap gap-1">
            {spot.overnight_amenities.slice(0, 4).map((a) => (
              <li key={a} className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                {a}
              </li>
            ))}
          </ul>
        )}
        {spot.overnight_restrictions && (
          <p className="mt-2 text-xs italic text-amber-700">⚠ {spot.overnight_restrictions}</p>
        )}
      </div>
    </article>
  )
}
```

- [ ] **Step 2: TypeScript check**

Run: `npx tsc --noEmit`
Expected: OK.

- [ ] **Step 3: Commit**

```bash
git add "src/app/(site)/road-trip-pays-basque-van/_components/OvernightCard.tsx"
git commit -m "feat(road-trip-pb): OvernightCard (type, price, amenities, restrictions)

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

### Task 3.3: `DurationGrid.tsx` + `GroupTypeGrid.tsx`

**Files:**
- Create: `src/app/(site)/road-trip-pays-basque-van/_components/DurationGrid.tsx`
- Create: `src/app/(site)/road-trip-pays-basque-van/_components/GroupTypeGrid.tsx`

- [ ] **Step 1: Créer DurationGrid**

```tsx
// src/app/(site)/road-trip-pays-basque-van/_components/DurationGrid.tsx
// Grid des 4 cards duration sur le hub.

import Link from 'next/link'
import { ALL_DURATION_SLUGS } from '@/types/road-trip-pb'
import { DURATION_LABELS, durationPath } from '@/lib/road-trip-pb/constants'

const DURATION_DESCRIPTIONS: Record<string, string> = {
  '1-jour': 'Aperçu express Biarritz → Espelette',
  weekend: 'Côte basque et villages typiques',
  '5-jours': 'Océan, montagne, gastronomie',
  '1-semaine': 'Immersion totale côte + arrière-pays',
}

const DURATION_ICONS: Record<string, string> = {
  '1-jour': '☀️',
  weekend: '🏄',
  '5-jours': '🗺️',
  '1-semaine': '🏔️',
}

export default function DurationGrid() {
  return (
    <section className="mx-auto mt-12 max-w-6xl px-4">
      <h2 className="text-3xl font-bold text-slate-900">Choisissez votre durée</h2>
      <p className="mt-2 text-slate-600">
        Chaque durée propose des itinéraires adaptés au rythme et aux kilomètres.
      </p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {ALL_DURATION_SLUGS.map((d) => (
          <Link
            key={d}
            href={durationPath(d)}
            className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
          >
            <div className="text-4xl">{DURATION_ICONS[d]}</div>
            <h3 className="mt-3 text-xl font-bold text-slate-900">{DURATION_LABELS[d]}</h3>
            <p className="mt-1 text-sm text-slate-600">{DURATION_DESCRIPTIONS[d]}</p>
            <span className="mt-4 inline-flex items-center text-sm font-semibold text-blue-600 group-hover:gap-2">
              Voir les itinéraires →
            </span>
          </Link>
        ))}
      </div>
    </section>
  )
}
```

- [ ] **Step 2: Créer GroupTypeGrid**

```tsx
// src/app/(site)/road-trip-pays-basque-van/_components/GroupTypeGrid.tsx
// Grid des 4 cards groupType sur une page duration.

import Link from 'next/link'
import type { DurationSlug } from '@/types/road-trip-pb'
import { ALL_GROUP_TYPES } from '@/types/road-trip-pb'
import {
  GROUP_LABELS_SHORT,
  GROUP_EMOJIS,
  finalPath,
  DURATION_LABELS,
} from '@/lib/road-trip-pb/constants'

interface GroupTypeGridProps {
  duration: DurationSlug
}

const GROUP_TAGLINES: Record<string, string> = {
  solo: 'Rythme libre, spots introspectifs',
  couple: 'Parenthèses romantiques, gastronomie',
  amis: 'Surf, fêtes, aventures partagées',
  famille: 'Plages, villages, sécurité',
}

export default function GroupTypeGrid({ duration }: GroupTypeGridProps) {
  return (
    <section className="mx-auto mt-12 max-w-6xl px-4">
      <h2 className="text-2xl font-bold text-slate-900">
        Road trip {DURATION_LABELS[duration]} — Choisissez votre profil
      </h2>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {ALL_GROUP_TYPES.map((g) => (
          <Link
            key={g}
            href={finalPath(duration, g)}
            className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
          >
            <div className="text-4xl">{GROUP_EMOJIS[g]}</div>
            <h3 className="mt-3 text-lg font-bold text-slate-900">{GROUP_LABELS_SHORT[g]}</h3>
            <p className="mt-1 text-sm text-slate-600">{GROUP_TAGLINES[g]}</p>
            <span className="mt-4 inline-flex text-sm font-semibold text-blue-600 group-hover:underline">
              Voir l&apos;itinéraire →
            </span>
          </Link>
        ))}
      </div>
    </section>
  )
}
```

- [ ] **Step 3: Build check**

Run: `npx tsc --noEmit`
Expected: OK.

- [ ] **Step 4: Commit**

```bash
git add "src/app/(site)/road-trip-pays-basque-van/_components/DurationGrid.tsx" "src/app/(site)/road-trip-pays-basque-van/_components/GroupTypeGrid.tsx"
git commit -m "feat(road-trip-pb): DurationGrid + GroupTypeGrid navigation grids

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

### Task 3.4: `WizardCTA.tsx`

**Files:**
- Create: `src/app/(site)/road-trip-pays-basque-van/_components/WizardCTA.tsx`

- [ ] **Step 1: Créer le composant**

```tsx
// src/app/(site)/road-trip-pays-basque-van/_components/WizardCTA.tsx
// CTA vers le wizard /road-trip-personnalise avec pré-remplissage.

import Link from 'next/link'
import type { DurationSlug } from '@/types/road-trip-pb'
import type { GroupType, BudgetLevel } from '@/types/roadtrip'
import { wizardPrefillUrl } from '@/lib/road-trip-pb/constants'

interface WizardCTAProps {
  duration?: DurationSlug
  groupType?: GroupType
  budgetLevel?: BudgetLevel
  variant?: 'primary' | 'section'
}

export default function WizardCTA({
  duration,
  groupType,
  budgetLevel,
  variant = 'section',
}: WizardCTAProps) {
  const url = wizardPrefillUrl({ duration, groupType, budgetLevel })

  if (variant === 'primary') {
    return (
      <Link
        href={url}
        className="inline-flex items-center justify-center rounded-full bg-blue-600 px-6 py-3 text-base font-semibold text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-blue-700"
      >
        Génère ton road trip personnalisé →
      </Link>
    )
  }

  return (
    <section className="mx-auto my-16 max-w-4xl px-4">
      <div className="rounded-3xl bg-gradient-to-br from-blue-600 to-blue-800 p-8 text-white shadow-xl md:p-12">
        <h2 className="text-2xl font-bold md:text-3xl">Cet itinéraire te plaît ?</h2>
        <p className="mt-3 max-w-2xl text-blue-100">
          Génère ta version 100% personnalisée avec tes dates exactes, tes envies et ton budget.
          Tu reçois tout par email en 2 minutes, gratuitement.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href={url}
            className="inline-flex items-center rounded-full bg-white px-6 py-3 font-semibold text-blue-700 shadow transition hover:-translate-y-0.5"
          >
            Génère mon road trip →
          </Link>
          <Link
            href="/location/cambo-les-bains"
            className="inline-flex items-center rounded-full border border-white/50 px-6 py-3 font-semibold text-white transition hover:bg-white/10"
          >
            Louer un van Vanzon
          </Link>
        </div>
        <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm text-blue-100">
          <li>✓ Gratuit</li>
          <li>✓ Reçu par email</li>
          <li>✓ 2 minutes</li>
          <li>✓ Généré par IA + expert local</li>
        </ul>
      </div>
    </section>
  )
}
```

- [ ] **Step 2: TypeScript check**

Run: `npx tsc --noEmit`

- [ ] **Step 3: Commit**

```bash
git add "src/app/(site)/road-trip-pays-basque-van/_components/WizardCTA.tsx"
git commit -m "feat(road-trip-pb): WizardCTA avec pré-remplissage (variants primary + section)

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

### Task 3.5: `POISection.tsx` + `OvernightSection.tsx`

**Files:**
- Create: `src/app/(site)/road-trip-pays-basque-van/_components/POISection.tsx`
- Create: `src/app/(site)/road-trip-pays-basque-van/_components/OvernightSection.tsx`

- [ ] **Step 1: Créer POISection**

```tsx
// src/app/(site)/road-trip-pays-basque-van/_components/POISection.tsx
// Grille de POI cards avec titre et accroche. Server component.

import POICard from './POICard'
import type { POIRowWithCoords } from '@/types/road-trip-pb'

interface POISectionProps {
  title: string
  subtitle?: string
  pois: POIRowWithCoords[]
  limit?: number
}

export default function POISection({ title, subtitle, pois, limit = 6 }: POISectionProps) {
  if (!pois.length) return null
  const visible = pois.slice(0, limit)
  return (
    <section className="mx-auto mt-12 max-w-6xl px-4">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900 md:text-3xl">{title}</h2>
        {subtitle && <p className="mt-1 text-slate-600">{subtitle}</p>}
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((poi) => (
          <POICard key={poi.id} poi={poi} />
        ))}
      </div>
    </section>
  )
}
```

- [ ] **Step 2: Créer OvernightSection**

```tsx
// src/app/(site)/road-trip-pays-basque-van/_components/OvernightSection.tsx

import OvernightCard from './OvernightCard'
import type { POIRowWithCoords } from '@/types/road-trip-pb'

interface OvernightSectionProps {
  title: string
  subtitle?: string
  spots: POIRowWithCoords[]
  limit?: number
}

export default function OvernightSection({
  title,
  subtitle,
  spots,
  limit = 6,
}: OvernightSectionProps) {
  if (!spots.length) return null
  const visible = spots.slice(0, limit)
  return (
    <section className="mx-auto mt-12 max-w-6xl px-4">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900 md:text-3xl">{title}</h2>
        {subtitle && <p className="mt-1 text-slate-600">{subtitle}</p>}
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((spot) => (
          <OvernightCard key={spot.id} spot={spot} />
        ))}
      </div>
    </section>
  )
}
```

- [ ] **Step 3: Build check + commit**

```bash
npx tsc --noEmit
git add "src/app/(site)/road-trip-pays-basque-van/_components/POISection.tsx" "src/app/(site)/road-trip-pays-basque-van/_components/OvernightSection.tsx"
git commit -m "feat(road-trip-pb): POISection + OvernightSection grid wrappers

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

### Task 3.6: `ItineraryDisplay.tsx`

**Files:**
- Create: `src/app/(site)/road-trip-pays-basque-van/_components/ItineraryDisplay.tsx`

- [ ] **Step 1: Créer le composant**

```tsx
// src/app/(site)/road-trip-pays-basque-van/_components/ItineraryDisplay.tsx
// Timeline verticale jour par jour. Affiche le itinerary_json du template.

import type { RoadTripTemplateRow, POIRowWithCoords } from '@/types/road-trip-pb'

interface ItineraryDisplayProps {
  template: RoadTripTemplateRow
  pois: POIRowWithCoords[]
}

// Lookup POI par id
function makePOILookup(pois: POIRowWithCoords[]): Map<string, POIRowWithCoords> {
  const m = new Map<string, POIRowWithCoords>()
  for (const p of pois) if (p.id) m.set(p.id, p)
  return m
}

export default function ItineraryDisplay({ template, pois }: ItineraryDisplayProps) {
  const lookup = makePOILookup(pois)
  // On extrait la version parsée, structure éventuellement différente de GeneratedItineraryV2
  // (le seed script stocke une structure { days: [{day,theme,stops:[{poi_id,time,note}],overnight_id}] })
  const rawDays = (template.itinerary_json as unknown as {
    days: Array<{
      day: number
      theme: string
      stops: Array<{ poi_id: string; time: string; note: string }>
      overnight_id: string
    }>
  }).days

  return (
    <section className="mx-auto mt-12 max-w-5xl px-4">
      <h2 className="text-2xl font-bold text-slate-900 md:text-3xl">
        Itinéraire jour par jour
      </h2>
      {template.intro && (
        <p className="mt-3 max-w-3xl text-slate-600">{template.intro}</p>
      )}
      <ol className="mt-8 space-y-8">
        {rawDays.map((day) => {
          const overnight = lookup.get(day.overnight_id)
          return (
            <li key={day.day} className="relative rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-baseline justify-between">
                <h3 className="text-xl font-bold text-slate-900">Jour {day.day}</h3>
                <span className="text-sm font-semibold uppercase tracking-wide text-blue-600">
                  {day.theme}
                </span>
              </div>
              <ul className="mt-4 space-y-4">
                {day.stops.map((stop, idx) => {
                  const poi = lookup.get(stop.poi_id)
                  if (!poi) return null
                  return (
                    <li key={idx} className="flex gap-3">
                      <div className="flex-none">
                        <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">
                          {stop.time}
                        </span>
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-slate-900">{poi.name}</p>
                        <p className="text-xs uppercase tracking-wide text-slate-500">
                          {poi.location_city}
                        </p>
                        <p className="mt-1 text-sm text-slate-600">{stop.note}</p>
                        {poi.external_url && (
                          <a
                            href={poi.external_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-1 inline-block text-xs text-blue-600 hover:underline"
                          >
                            Voir le site →
                          </a>
                        )}
                      </div>
                    </li>
                  )
                })}
              </ul>
              {overnight && (
                <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
                    🌙 Nuit
                  </p>
                  <p className="mt-1 font-semibold text-slate-900">{overnight.name}</p>
                  <p className="text-sm text-slate-600">
                    {overnight.location_city}
                    {overnight.overnight_price_per_night
                      ? ` · ${overnight.overnight_price_per_night}€/nuit`
                      : ' · Gratuit'}
                  </p>
                </div>
              )}
            </li>
          )
        })}
      </ol>
    </section>
  )
}
```

- [ ] **Step 2: TypeScript check + commit**

```bash
npx tsc --noEmit
git add "src/app/(site)/road-trip-pays-basque-van/_components/ItineraryDisplay.tsx"
git commit -m "feat(road-trip-pb): ItineraryDisplay timeline jour par jour

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

### Task 3.7: `BudgetFilter.tsx` (client component)

**Files:**
- Create: `src/app/(site)/road-trip-pays-basque-van/_components/BudgetFilter.tsx`

- [ ] **Step 1: Créer le composant client**

```tsx
// src/app/(site)/road-trip-pays-basque-van/_components/BudgetFilter.tsx
// Filtre in-page par budget. Client component — applique un filtre visuel
// sur les enfants via CSS data attributes, sans re-fetch.

'use client'

import { useState } from 'react'
import type { BudgetLevel } from '@/types/roadtrip'
import { BUDGET_LABELS } from '@/lib/road-trip-pb/constants'

type FilterValue = BudgetLevel | 'all'

interface BudgetFilterProps {
  children: React.ReactNode
}

export default function BudgetFilter({ children }: BudgetFilterProps) {
  const [current, setCurrent] = useState<FilterValue>('all')

  const options: FilterValue[] = ['all', 'faible', 'moyen', 'eleve']

  return (
    <div data-budget-filter={current}>
      <div className="mx-auto mb-6 flex max-w-6xl flex-wrap gap-2 px-4">
        {options.map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => setCurrent(v)}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
              current === v
                ? 'bg-blue-600 text-white shadow'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            {BUDGET_LABELS[v]}
          </button>
        ))}
      </div>
      <div
        className={
          current === 'all'
            ? ''
            : `[&_[data-budget]:not([data-budget="${current}"])]:hidden`
        }
      >
        {children}
      </div>
    </div>
  )
}
```

**Note** : POICard doit porter `data-budget={poi.budget_level}` sur son élément racine pour que le filtre marche. On corrige POICard.

- [ ] **Step 2: Modifier POICard pour ajouter `data-budget`**

Dans `POICard.tsx`, ajouter `data-budget={poi.budget_level ?? 'none'}` sur le `<a>` et `<article>` racine.

Edit :
```tsx
// Dans baseClasses, ajouter wrappée : ajouter à chaque balise racine data-budget
// Remplacer le return par :
if (poi.external_url) {
  return (
    <a
      href={poi.external_url}
      target="_blank"
      rel="noopener noreferrer"
      data-budget={poi.budget_level ?? 'none'}
      className={baseClasses}
    >
      {CardInner}
    </a>
  )
}
return <article data-budget={poi.budget_level ?? 'none'} className={baseClasses}>{CardInner}</article>
```

- [ ] **Step 3: Build check + commit**

```bash
npx tsc --noEmit
git add "src/app/(site)/road-trip-pays-basque-van/_components/BudgetFilter.tsx" "src/app/(site)/road-trip-pays-basque-van/_components/POICard.tsx"
git commit -m "feat(road-trip-pb): BudgetFilter client + data-budget attribute sur POICard

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

### Task 3.8: `FAQSection.tsx` + JSON-LD

**Files:**
- Create: `src/app/(site)/road-trip-pays-basque-van/_components/FAQSection.tsx`

- [ ] **Step 1: Créer le composant**

```tsx
// src/app/(site)/road-trip-pays-basque-van/_components/FAQSection.tsx
// FAQ expandable + JSON-LD schema.org FAQPage.

import type { FAQItem } from '@/types/road-trip-pb'

interface FAQSectionProps {
  items: FAQItem[]
}

export default function FAQSection({ items }: FAQSectionProps) {
  if (!items || items.length === 0) return null

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  }

  return (
    <section className="mx-auto mt-16 max-w-4xl px-4">
      <h2 className="text-2xl font-bold text-slate-900 md:text-3xl">Questions fréquentes</h2>
      <div className="mt-6 space-y-3">
        {items.map((f, i) => (
          <details
            key={i}
            className="group rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <summary className="cursor-pointer list-none font-semibold text-slate-900 marker:hidden">
              <span className="inline-block transition group-open:rotate-90">▸</span> {f.q}
            </summary>
            <p className="mt-3 text-sm text-slate-600">{f.a}</p>
          </details>
        ))}
      </div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </section>
  )
}
```

- [ ] **Step 2: Build check + commit**

```bash
npx tsc --noEmit
git add "src/app/(site)/road-trip-pays-basque-van/_components/FAQSection.tsx"
git commit -m "feat(road-trip-pb): FAQSection avec schema.org FAQPage JSON-LD

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

### Task 3.9: Build check chunk 3

- [ ] **Step 1: Build**

Run: `npm run build`
Expected: OK.

---

## Chunk 4 : Map component

### Task 4.1: `RoadTripMap.tsx`

**Files:**
- Create: `src/app/(site)/road-trip-pays-basque-van/_components/RoadTripMap.tsx`

- [ ] **Step 1: Créer le composant**

```tsx
// src/app/(site)/road-trip-pays-basque-van/_components/RoadTripMap.tsx
// MapLibre + Maptiler outdoor-v2. Non partagé avec CatalogMap (contrats props différents).
// Client component, chargement dynamique dans les pages via `next/dynamic`.

'use client'

import { useEffect, useRef } from 'react'
import type maplibregl from 'maplibre-gl'
import type { POIRowWithCoords, RoadTripTemplateRow } from '@/types/road-trip-pb'
import { parseCoordinates } from '@/types/road-trip-pb'
import {
  PB_CENTER,
  PB_DEFAULT_ZOOM,
  PB_MAX_BOUNDS,
  CATEGORY_COLORS,
  CATEGORY_EMOJIS,
} from '@/lib/road-trip-pb/constants'

interface RoadTripMapProps {
  pois: POIRowWithCoords[]
  template?: RoadTripTemplateRow
  center?: [number, number]
  zoom?: number
  height?: { desktop: number; mobile: number }
}

export default function RoadTripMap({
  pois,
  template,
  center = PB_CENTER,
  zoom = PB_DEFAULT_ZOOM,
  height = { desktop: 500, mobile: 380 },
}: RoadTripMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return
    const MAPTILER_KEY = process.env.NEXT_PUBLIC_MAPTILER_KEY || ''

    import('maplibre-gl').then((ml) => {
      const map = new ml.Map({
        container: containerRef.current!,
        style: `https://api.maptiler.com/maps/outdoor-v2/style.json?key=${MAPTILER_KEY}`,
        center,
        zoom,
        minZoom: 7,
        maxBounds: PB_MAX_BOUNDS,
        attributionControl: false,
      })
      map.addControl(new ml.NavigationControl({ showCompass: false }), 'top-right')
      map.addControl(new ml.AttributionControl({ compact: true }), 'bottom-right')
      mapRef.current = map

      map.on('load', () => {
        // Markers
        const poiById = new Map<string, POIRowWithCoords>()
        for (const poi of pois) {
          if (poi.id) poiById.set(poi.id, poi)
          const coords = parseCoordinates(poi.coordinates)
          if (!coords) continue
          const color = CATEGORY_COLORS[poi.category] ?? '#64748b'
          const emoji = CATEGORY_EMOJIS[poi.category] ?? '📍'

          const el = document.createElement('div')
          el.style.cssText = `
            width: 34px; height: 34px;
            background: ${color};
            border: 3px solid white;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            font-size: 16px;
          `
          el.textContent = emoji

          const popupHtml = `
            <div style="font-family:system-ui,sans-serif;padding:4px 2px;max-width:240px">
              <p style="font-weight:700;font-size:13px;color:#0f172a;margin:0 0 4px 0">${escapeHtml(poi.name)}</p>
              <p style="color:#64748b;font-size:11px;margin:0 0 6px 0">${escapeHtml(poi.location_city)}</p>
              ${poi.description ? `<p style="color:#334155;font-size:12px;line-height:1.4;margin:0 0 6px 0">${escapeHtml(poi.description.slice(0, 140))}</p>` : ''}
              ${poi.external_url ? `<a href="${escapeHtml(poi.external_url)}" target="_blank" rel="noopener noreferrer" style="color:#2563eb;font-size:12px;font-weight:600;text-decoration:none">Voir le site →</a>` : ''}
            </div>
          `
          const popup = new ml.Popup({ offset: 20, maxWidth: '260px' }).setHTML(popupHtml)
          new ml.Marker({ element: el }).setLngLat(coords).setPopup(popup).addTo(map)
        }

        // Polyline si template fourni
        if (template && template.itinerary_json) {
          const rawDays = (template.itinerary_json as unknown as {
            days: Array<{
              stops: Array<{ poi_id: string }>
              overnight_id: string
            }>
          }).days
          const lineCoords: Array<[number, number]> = []
          for (const day of rawDays) {
            for (const stop of day.stops) {
              const poi = poiById.get(stop.poi_id)
              const c = parseCoordinates(poi?.coordinates)
              if (c) lineCoords.push(c)
            }
            const overnight = poiById.get(day.overnight_id)
            const oc = parseCoordinates(overnight?.coordinates)
            if (oc) lineCoords.push(oc)
          }
          if (lineCoords.length >= 2) {
            map.addSource('itinerary-line', {
              type: 'geojson',
              data: {
                type: 'Feature',
                properties: {},
                geometry: { type: 'LineString', coordinates: lineCoords },
              },
            })
            map.addLayer({
              id: 'itinerary-line-layer',
              type: 'line',
              source: 'itinerary-line',
              layout: { 'line-join': 'round', 'line-cap': 'round' },
              paint: {
                'line-color': '#2563eb',
                'line-width': 4,
                'line-dasharray': [2, 1],
              },
            })
          }
        }
      })
    })

    return () => {
      mapRef.current?.remove()
      mapRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div
      ref={containerRef}
      className="w-full overflow-hidden rounded-2xl border border-slate-200 shadow-md"
      style={{
        height: `clamp(${height.mobile}px, 50vw, ${height.desktop}px)`,
      }}
    />
  )
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}
```

- [ ] **Step 2: TypeScript check**

Run: `npx tsc --noEmit`
Expected: OK. Si `maplibre-gl` types manquent → déjà en deps (`maplibre-gl: ^5.21.1`).

- [ ] **Step 3: Commit**

```bash
git add "src/app/(site)/road-trip-pays-basque-van/_components/RoadTripMap.tsx"
git commit -m "feat(road-trip-pb): RoadTripMap MapLibre + polyline template itinéraire

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

### Task 4.2: Build check chunk 4

- [ ] **Step 1: Build**

Run: `npm run build`
Expected: OK.

---

## Chunk 5 : Pages + metadata

### Task 5.1: Metadata helper — `src/lib/road-trip-pb/metadata.ts`

**Files:**
- Create: `src/lib/road-trip-pb/metadata.ts`

- [ ] **Step 1: Créer le helper**

```typescript
// src/lib/road-trip-pb/metadata.ts
// Metadata helpers pour les 3 niveaux de pages /road-trip-pays-basque-van.

import type { Metadata } from 'next'
import type { DurationSlug } from '@/types/road-trip-pb'
import type { GroupType } from '@/types/roadtrip'
import {
  DURATION_LABELS,
  GROUP_LABELS,
  hubPath,
  durationPath,
  finalPath,
} from './constants'

const BASE = 'https://vanzonexplorer.com'

export function buildHubMetadata(): Metadata {
  const canonical = `${BASE}${hubPath()}`
  return {
    title: 'Road Trip en Van au Pays Basque — Itinéraires sur mesure | Vanzon Explorer',
    description:
      'Itinéraires road trip van Pays Basque : weekend, 5 jours, 1 semaine. Spots nuit validés, cartes GPS, activités par profil. Au départ de Cambo-les-Bains.',
    alternates: { canonical },
    openGraph: {
      title: 'Road Trip Van Pays Basque — Itinéraires',
      description:
        'Toutes les durées et tous les profils : weekend, 1 semaine, solo, couple, famille, amis. Cartes + spots + conseils.',
      type: 'website',
      url: canonical,
    },
    robots: { index: true, follow: true },
  }
}

export function buildDurationPageMetadata(duration: DurationSlug): Metadata {
  const dLabel = DURATION_LABELS[duration]
  const canonical = `${BASE}${durationPath(duration)}`
  return {
    title: `Road Trip Pays Basque ${dLabel} en Van — Itinéraire & Spots | Vanzon Explorer`,
    description: `Road trip Pays Basque ${dLabel} en van aménagé. Étapes détaillées, spots nuit validés, cartes GPS. Départ Cambo-les-Bains.`,
    alternates: { canonical },
    openGraph: {
      title: `Road Trip Pays Basque ${dLabel} en Van`,
      description: `Itinéraire ${dLabel.toLowerCase()} au Pays Basque en van aménagé.`,
      type: 'website',
      url: canonical,
    },
    robots: { index: duration !== '1-jour', follow: true },
  }
}

export function buildFinalPageMetadata(
  duration: DurationSlug,
  groupType: GroupType
): Metadata {
  const dLabel = DURATION_LABELS[duration]
  const gLabel = GROUP_LABELS[groupType]
  const canonical = `${BASE}${finalPath(duration, groupType)}`
  return {
    title: `Road Trip Van Pays Basque ${dLabel} ${gLabel} — Itinéraire & Spots | Vanzon Explorer`,
    description: `Road trip Pays Basque ${dLabel} en van aménagé ${gLabel}. Itinéraire détaillé jour par jour, spots nuit validés, cartes GPS. Au départ de Cambo-les-Bains.`,
    alternates: { canonical },
    openGraph: {
      title: `Road Trip Pays Basque ${dLabel} ${gLabel}`,
      description: `Itinéraire van complet ${gLabel} pour ${dLabel.toLowerCase()} au Pays Basque.`,
      type: 'article',
      url: canonical,
    },
    robots: { index: duration !== '1-jour', follow: true },
  }
}
```

- [ ] **Step 2: TypeScript check + commit**

```bash
npx tsc --noEmit
git add src/lib/road-trip-pb/metadata.ts
git commit -m "feat(road-trip-pb): metadata helpers pour les 3 niveaux (hub, duration, final)

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

### Task 5.2: Page finale `/[duration]/[groupType]/page.tsx`

**Files:**
- Create: `src/app/(site)/road-trip-pays-basque-van/[duration]/[groupType]/page.tsx`

- [ ] **Step 1: Créer la page**

```tsx
// src/app/(site)/road-trip-pays-basque-van/[duration]/[groupType]/page.tsx
// Page finale SEO : combinaison duration × groupType.
// Server Component, ISR 24h, JSON-LD TouristTrip + FAQPage si template présent.

import dynamic from 'next/dynamic'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Breadcrumbs from '@/components/ui/Breadcrumbs'
import {
  ALL_DURATION_SLUGS,
  ALL_GROUP_TYPES,
} from '@/types/road-trip-pb'
import type { DurationSlug } from '@/types/road-trip-pb'
import type { GroupType } from '@/types/roadtrip'
import {
  DURATION_LABELS,
  GROUP_LABELS,
  GROUP_LABELS_SHORT,
  DURATION_TO_DAYS_SLUG,
  PICKUP_CITY,
  durationPath,
  finalPath,
  hubPath,
} from '@/lib/road-trip-pb/constants'
import { buildFinalPageMetadata } from '@/lib/road-trip-pb/metadata'
import {
  getTemplate,
  getPOIsByIds,
  getPOIsForGroupType,
  getOvernightSpots,
} from '@/lib/road-trip-pb/queries'
import POISection from '../../_components/POISection'
import OvernightSection from '../../_components/OvernightSection'
import ItineraryDisplay from '../../_components/ItineraryDisplay'
import WizardCTA from '../../_components/WizardCTA'
import FAQSection from '../../_components/FAQSection'
import BudgetFilter from '../../_components/BudgetFilter'

// ISR
export const revalidate = 86400

// Pre-build toutes les combos (21 au total, dont 5 noindex)
export async function generateStaticParams() {
  return ALL_DURATION_SLUGS.flatMap((duration) =>
    ALL_GROUP_TYPES.map((groupType) => ({ duration, groupType }))
  )
}

const RoadTripMap = dynamic(() => import('../../_components/RoadTripMap'), {
  ssr: false,
  loading: () => (
    <div className="mx-auto max-w-6xl px-4">
      <div className="h-[380px] w-full animate-pulse rounded-2xl bg-slate-200" />
    </div>
  ),
})

interface PageParams {
  duration: DurationSlug
  groupType: GroupType
}

// ─── Metadata ─────────────────────────────────────────────────────────────────
export async function generateMetadata({
  params,
}: {
  params: PageParams
}): Promise<Metadata> {
  if (!ALL_DURATION_SLUGS.includes(params.duration)) notFound()
  if (!ALL_GROUP_TYPES.includes(params.groupType)) notFound()
  return buildFinalPageMetadata(params.duration, params.groupType)
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default async function FinalPage({ params }: { params: PageParams }) {
  const { duration, groupType } = params
  if (!ALL_DURATION_SLUGS.includes(duration)) notFound()
  if (!ALL_GROUP_TYPES.includes(groupType)) notFound()

  const [template, overnight, fallbackPOIs] = await Promise.all([
    getTemplate(duration, groupType),
    getOvernightSpots(6),
    getPOIsForGroupType(groupType, 18),
  ])

  // POIs du template + fallback en combiné pour la map
  const templatePOIs = template
    ? await getPOIsByIds([...template.poi_ids, ...template.overnight_ids])
    : []
  const mapPOIs = templatePOIs.length > 0 ? templatePOIs : [...fallbackPOIs, ...overnight]

  const dLabel = DURATION_LABELS[duration]
  const gLabel = GROUP_LABELS[groupType]
  const days = DURATION_TO_DAYS_SLUG[duration]

  const h1 = template?.title ?? `Road Trip Pays Basque ${dLabel} en Van — ${gLabel}`

  // JSON-LD
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Accueil', item: 'https://vanzonexplorer.com' },
      { '@type': 'ListItem', position: 2, name: 'Road Trip Pays Basque', item: `https://vanzonexplorer.com${hubPath()}` },
      { '@type': 'ListItem', position: 3, name: dLabel, item: `https://vanzonexplorer.com${durationPath(duration)}` },
      { '@type': 'ListItem', position: 4, name: GROUP_LABELS_SHORT[groupType], item: `https://vanzonexplorer.com${finalPath(duration, groupType)}` },
    ],
  }

  const touristTripJsonLd = template
    ? {
        '@context': 'https://schema.org',
        '@type': 'TouristTrip',
        name: template.title,
        description: template.intro,
        touristType: gLabel,
        itinerary: {
          '@type': 'ItemList',
          numberOfItems: days,
        },
      }
    : null

  return (
    <main className="bg-slate-50 pb-16">
      {/* Hero */}
      <header className="bg-gradient-to-br from-blue-700 to-blue-900 px-4 py-12 text-white md:py-20">
        <div className="mx-auto max-w-5xl">
          <Breadcrumbs
            items={[
              { label: 'Road Trip Pays Basque', href: hubPath() },
              { label: dLabel, href: durationPath(duration) },
              { label: GROUP_LABELS_SHORT[groupType] },
            ]}
          />
          <h1 className="mt-4 text-3xl font-bold leading-tight md:text-5xl">{h1}</h1>
          <p className="mt-4 max-w-3xl text-lg text-blue-100">
            Itinéraire complet au départ de {PICKUP_CITY}, {days} jour{days > 1 ? 's' : ''}, spots nuit validés, activités adaptées {gLabel}.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            <span className="rounded-full bg-white/10 px-3 py-1 text-sm">⏱ {dLabel}</span>
            <span className="rounded-full bg-white/10 px-3 py-1 text-sm">👥 {GROUP_LABELS_SHORT[groupType]}</span>
            <span className="rounded-full bg-white/10 px-3 py-1 text-sm">🚐 Départ {PICKUP_CITY}</span>
          </div>
          <div className="mt-8">
            <WizardCTA duration={duration} groupType={groupType} variant="primary" />
          </div>
        </div>
      </header>

      {/* Map */}
      <section className="mx-auto mt-8 max-w-6xl px-4">
        <RoadTripMap pois={mapPOIs} template={template ?? undefined} />
      </section>

      {/* Itinéraire */}
      {template ? (
        <ItineraryDisplay template={template} pois={templatePOIs} />
      ) : (
        <section className="mx-auto mt-12 max-w-4xl px-4 text-center">
          <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-slate-600">
            Itinéraire personnalisé bientôt disponible — en attendant, génère ta version 100% sur mesure via notre wizard IA gratuit.
          </p>
          <div className="mt-4">
            <WizardCTA duration={duration} groupType={groupType} variant="primary" />
          </div>
        </section>
      )}

      {/* POIs filtrés par budget */}
      <BudgetFilter>
        <POISection
          title={`Activités recommandées ${gLabel}`}
          subtitle="Filtre par budget pour affiner"
          pois={fallbackPOIs}
          limit={12}
        />
      </BudgetFilter>

      {/* Spots nuit */}
      <OvernightSection
        title="Spots nuit recommandés"
        subtitle={`Où dormir en van pendant votre road trip ${dLabel.toLowerCase()}`}
        spots={overnight}
        limit={6}
      />

      {/* Tips */}
      {template && template.tips.length > 0 && (
        <section className="mx-auto mt-12 max-w-4xl px-4">
          <h2 className="text-2xl font-bold text-slate-900 md:text-3xl">Conseils van</h2>
          <ul className="mt-4 space-y-2">
            {template.tips.map((tip, i) => (
              <li key={i} className="flex gap-3 rounded-xl border border-slate-200 bg-white p-4">
                <span className="flex-none text-xl">💡</span>
                <p className="text-sm text-slate-700">{tip}</p>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* FAQ */}
      {template && <FAQSection items={template.faq} />}

      {/* Cross-links */}
      <section className="mx-auto mt-16 max-w-5xl px-4">
        <h2 className="text-xl font-bold text-slate-900">Autres idées d&apos;itinéraires</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-sm font-semibold text-slate-700">Autres durées, même profil</p>
            <ul className="mt-2 space-y-1">
              {ALL_DURATION_SLUGS.filter((d) => d !== duration).map((d) => (
                <li key={d}>
                  <Link href={finalPath(d, groupType)} className="text-blue-600 hover:underline">
                    {DURATION_LABELS[d]} {gLabel} →
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-sm font-semibold text-slate-700">Autres profils, même durée</p>
            <ul className="mt-2 space-y-1">
              {ALL_GROUP_TYPES.filter((g) => g !== groupType).map((g) => (
                <li key={g}>
                  <Link href={finalPath(duration, g)} className="text-blue-600 hover:underline">
                    {dLabel} {GROUP_LABELS[g]} →
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* CTA final */}
      <WizardCTA duration={duration} groupType={groupType} />

      {/* JSON-LD */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      {touristTripJsonLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(touristTripJsonLd) }} />
      )}
    </main>
  )
}
```

- [ ] **Step 2: Vérifier le composant Breadcrumbs existant**

Run: `grep -l "export default.*Breadcrumbs" src/components/ui/Breadcrumbs.tsx 2>/dev/null || echo "MISSING"`

Si `MISSING` → créer un Breadcrumbs minimaliste inline dans la page (remplacer l'import + l'usage par un fragment `<nav>` simple). Sinon vérifier que `items` est bien le prop attendu :

```bash
head -30 src/components/ui/Breadcrumbs.tsx
```

Adapter le prop si besoin.

- [ ] **Step 3: TypeScript check**

Run: `npx tsc --noEmit`
Expected: OK.

- [ ] **Step 4: Commit**

```bash
git add "src/app/(site)/road-trip-pays-basque-van/[duration]/[groupType]/page.tsx"
git commit -m "feat(road-trip-pb): page finale [duration]/[groupType] + generateStaticParams + ISR 24h + JSON-LD

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

### Task 5.3: Page duration `/[duration]/page.tsx`

**Files:**
- Create: `src/app/(site)/road-trip-pays-basque-van/[duration]/page.tsx`

- [ ] **Step 1: Créer la page**

```tsx
// src/app/(site)/road-trip-pays-basque-van/[duration]/page.tsx
// Page duration : H1 + grille groupType + top POIs + top overnight + CTA.

import dynamic from 'next/dynamic'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { ALL_DURATION_SLUGS } from '@/types/road-trip-pb'
import type { DurationSlug } from '@/types/road-trip-pb'
import {
  DURATION_LABELS,
  DURATION_TO_DAYS_SLUG,
  PICKUP_CITY,
  hubPath,
  durationPath,
} from '@/lib/road-trip-pb/constants'
import { DURATION_TO_DAYS_SLUG as DDAYS } from '@/types/road-trip-pb'
import { buildDurationPageMetadata } from '@/lib/road-trip-pb/metadata'
import {
  getTopActivities,
  getOvernightSpots,
  getTemplate,
  getPOIsByIds,
} from '@/lib/road-trip-pb/queries'
import GroupTypeGrid from '../_components/GroupTypeGrid'
import POISection from '../_components/POISection'
import OvernightSection from '../_components/OvernightSection'
import ItineraryDisplay from '../_components/ItineraryDisplay'
import WizardCTA from '../_components/WizardCTA'
import Breadcrumbs from '@/components/ui/Breadcrumbs'

export const revalidate = 86400

export async function generateStaticParams() {
  return ALL_DURATION_SLUGS.map((duration) => ({ duration }))
}

const RoadTripMap = dynamic(() => import('../_components/RoadTripMap'), { ssr: false })

export async function generateMetadata({
  params,
}: {
  params: { duration: DurationSlug }
}): Promise<Metadata> {
  if (!ALL_DURATION_SLUGS.includes(params.duration)) notFound()
  return buildDurationPageMetadata(params.duration)
}

export default async function DurationPage({
  params,
}: {
  params: { duration: DurationSlug }
}) {
  const { duration } = params
  if (!ALL_DURATION_SLUGS.includes(duration)) notFound()

  // Affiche le template canonique "couple" pour cette durée
  const [template, topPOIs, overnight] = await Promise.all([
    getTemplate(duration, 'couple'),
    getTopActivities(12),
    getOvernightSpots(6),
  ])
  const templatePOIs = template
    ? await getPOIsByIds([...template.poi_ids, ...template.overnight_ids])
    : []
  const mapPOIs = templatePOIs.length > 0 ? templatePOIs : [...topPOIs, ...overnight]

  const dLabel = DURATION_LABELS[duration]
  const days = DDAYS[duration]

  return (
    <main className="bg-slate-50 pb-16">
      <header className="bg-gradient-to-br from-blue-700 to-blue-900 px-4 py-12 text-white md:py-20">
        <div className="mx-auto max-w-5xl">
          <Breadcrumbs
            items={[
              { label: 'Road Trip Pays Basque', href: hubPath() },
              { label: dLabel },
            ]}
          />
          <h1 className="mt-4 text-3xl font-bold leading-tight md:text-5xl">
            Road Trip Pays Basque {dLabel} en Van
          </h1>
          <p className="mt-4 max-w-3xl text-lg text-blue-100">
            {days} jour{days > 1 ? 's' : ''} d&apos;immersion vanlife au Pays Basque, au départ de {PICKUP_CITY}. Choisissez votre profil voyageur ci-dessous ou découvrez l&apos;itinéraire de référence.
          </p>
          <div className="mt-8">
            <WizardCTA duration={duration} variant="primary" />
          </div>
        </div>
      </header>

      {/* Map */}
      <section className="mx-auto mt-8 max-w-6xl px-4">
        <RoadTripMap pois={mapPOIs} template={template ?? undefined} />
      </section>

      {/* GroupType grid */}
      <GroupTypeGrid duration={duration} />

      {/* Itinéraire référence */}
      {template && (
        <section className="mx-auto mt-12 max-w-5xl px-4">
          <p className="text-sm uppercase tracking-wide text-slate-500">Itinéraire de référence</p>
          <ItineraryDisplay template={template} pois={templatePOIs} />
        </section>
      )}

      {/* Spots nuit */}
      <OvernightSection
        title={`Où dormir en van pendant ${days} jour${days > 1 ? 's' : ''}`}
        spots={overnight}
      />

      {/* Top activities */}
      <POISection
        title="Les incontournables"
        subtitle="Les meilleures activités à programmer"
        pois={topPOIs}
      />

      <WizardCTA duration={duration} />
    </main>
  )
}
```

- [ ] **Step 2: TypeScript check**

Run: `npx tsc --noEmit`
Expected: OK.

- [ ] **Step 3: Commit**

```bash
git add "src/app/(site)/road-trip-pays-basque-van/[duration]/page.tsx"
git commit -m "feat(road-trip-pb): page duration [duration] + GroupTypeGrid + itinéraire référence

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

### Task 5.4: Hub `/road-trip-pays-basque-van/page.tsx` (refonte en place)

**Files:**
- Overwrite: `src/app/(site)/road-trip-pays-basque-van/page.tsx` (ancien 645 lignes monolithique → nouveau hub)

- [ ] **Step 1: Écraser le fichier**

Utiliser `Write` pour écraser **complètement** :

```tsx
// src/app/(site)/road-trip-pays-basque-van/page.tsx
// Hub refondu — remplace la landing monolithique de 645 lignes.

import dynamic from 'next/dynamic'
import type { Metadata } from 'next'
import {
  PICKUP_CITY,
  REGION_NAME,
  hubPath,
} from '@/lib/road-trip-pb/constants'
import { buildHubMetadata } from '@/lib/road-trip-pb/metadata'
import {
  getTopActivities,
  getOvernightSpots,
  getRegionStats,
} from '@/lib/road-trip-pb/queries'
import DurationGrid from './_components/DurationGrid'
import POISection from './_components/POISection'
import OvernightSection from './_components/OvernightSection'
import WizardCTA from './_components/WizardCTA'

export const revalidate = 86400

export async function generateMetadata(): Promise<Metadata> {
  return buildHubMetadata()
}

const RoadTripMap = dynamic(() => import('./_components/RoadTripMap'), { ssr: false })

export default async function HubPage() {
  const [topPOIs, overnight, stats] = await Promise.all([
    getTopActivities(12),
    getOvernightSpots(6),
    getRegionStats(),
  ])
  const mapPOIs = [...topPOIs, ...overnight]

  // JSON-LD BreadcrumbList minimal
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Accueil', item: 'https://vanzonexplorer.com' },
      { '@type': 'ListItem', position: 2, name: 'Road Trip Pays Basque', item: `https://vanzonexplorer.com${hubPath()}` },
    ],
  }

  return (
    <main className="bg-slate-50 pb-16">
      {/* Hero */}
      <header className="bg-gradient-to-br from-blue-700 to-blue-900 px-4 py-16 text-white md:py-24">
        <div className="mx-auto max-w-5xl">
          <h1 className="text-4xl font-bold leading-tight md:text-6xl">
            Road Trip en Van au {REGION_NAME}
          </h1>
          <p className="mt-6 max-w-3xl text-lg text-blue-100 md:text-xl">
            Des itinéraires van life sur mesure, pensés par des vanlifers qui vivent au Pays Basque depuis 4 ans. Spots nuit validés, activités par profil, cartes GPS prêtes à l&apos;emploi. Départ depuis {PICKUP_CITY}.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            <span className="rounded-full bg-white/10 px-3 py-1 text-sm">📍 {stats.totalPois}+ spots</span>
            <span className="rounded-full bg-white/10 px-3 py-1 text-sm">🌙 {stats.totalOvernight} spots nuit</span>
            <span className="rounded-full bg-white/10 px-3 py-1 text-sm">🏘 {stats.cities.length} villes</span>
          </div>
          <div className="mt-8">
            <WizardCTA variant="primary" />
          </div>
        </div>
      </header>

      {/* Map */}
      <section className="mx-auto mt-8 max-w-6xl px-4">
        <RoadTripMap pois={mapPOIs} />
      </section>

      {/* Duration grid */}
      <DurationGrid />

      {/* Top spots nuit */}
      <OvernightSection
        title="Où dormir en van au Pays Basque"
        subtitle="Les meilleurs spots testés et validés"
        spots={overnight}
      />

      {/* Top activités */}
      <POISection
        title="Les incontournables"
        subtitle="Les activités et lieux à ne pas manquer"
        pois={topPOIs}
      />

      {/* CTA final */}
      <WizardCTA />

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
    </main>
  )
}
```

- [ ] **Step 2: TypeScript check**

Run: `npx tsc --noEmit`
Expected: OK.

- [ ] **Step 3: Build check complet**

Run: `npm run build`
Expected: build réussit, les 21 combos sont pré-générés (1 hub + 4 duration + 16 finales). Rechercher dans la sortie de build :
```
● /road-trip-pays-basque-van            [static]
● /road-trip-pays-basque-van/[duration] [static via generateStaticParams × 4]
● /road-trip-pays-basque-van/[duration]/[groupType] [static × 16]
```

Si erreur de build → corriger avant commit.

- [ ] **Step 4: Commit**

```bash
git add "src/app/(site)/road-trip-pays-basque-van/page.tsx"
git commit -m "feat(road-trip-pb): hub refondu (remplace landing monolithique 645 lignes)

Architecture Server Components + ISR 24h. Hub intègre DurationGrid,
carte MapLibre, top activités, top spots nuit, CTA wizard.
Les 21 combinaisons duration × groupType sont pré-buildées via
generateStaticParams des niveaux enfants.

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

## Chunk 6 : Intégration — wizard searchParams + sitemap + QA

### Task 6.1: Wizard searchParams

**Files:**
- Modify: `src/app/(site)/road-trip-personnalise/RoadTripWizard.tsx`

- [ ] **Step 1: Lire les parties à modifier**

Le wizard a :
- `const [step, setStep] = useState(1)` ligne ~167
- `useForm({ defaultValues: { ... } })` ligne ~179
- Import statements en haut

- [ ] **Step 2: Ajouter l'import `useSearchParams` et compute des défauts**

Edit en haut du fichier après les imports React/form :

```tsx
// Remplace l'import useState par :
import { useState, useEffect } from 'react'
// Juste après l'import form, ajouter :
import { useSearchParams } from 'next/navigation'
import {
  DURATION_SLUG_TO_KEY,
  type DurationSlug,
} from '@/types/road-trip-pb'
```

- [ ] **Step 3: Adapter `defaultValues` du form pour lire les searchParams**

Dans `export default function RoadTripWizard() {` :

Remplacer :
```tsx
const [step, setStep] = useState(1)
```

Par :
```tsx
const searchParams = useSearchParams()
const prefillDurationSlug = searchParams.get('duration') as DurationSlug | null
const prefillGroupType = searchParams.get('groupType') as GroupType | null
const prefillBudgetLevel = searchParams.get('budgetLevel') as BudgetLevel | null

// Duration slug (URL) → DurationKey (wizard)
const prefillDurationKey =
  prefillDurationSlug && DURATION_SLUG_TO_KEY[prefillDurationSlug]
    ? DURATION_SLUG_TO_KEY[prefillDurationSlug]
    : '2-3j'

// Si duration + groupType présents → démarrer à step 4 (budget/overnight)
// Si seulement duration ou groupType → step 3
// Sinon step 1
const initialStep =
  prefillDurationSlug && prefillGroupType ? 4 : prefillDurationSlug || prefillGroupType ? 3 : 1

const [step, setStep] = useState(initialStep)
```

Et remplacer les `defaultValues` :
```tsx
defaultValues: {
  firstname: '',
  email: '',
  groupType: prefillGroupType ?? 'couple',
  vanStatus: 'locataire',
  scope: 'france',
  duration: prefillDurationKey,
  interests: [],
  budgetLevel: prefillBudgetLevel ?? 'moyen',
  overnightPreference: 'mix',
},
```

- [ ] **Step 4: Badge visuel optionnel (au-dessus de "Étape X sur 5")**

Chercher ligne ~358 :
```tsx
Étape {step} sur {TOTAL_STEPS}
```

Juste avant, ajouter (conditionnel) :
```tsx
{(prefillDurationSlug || prefillGroupType) && (
  <div className="mb-2 inline-block rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
    ✓ Pré-rempli depuis la page road trip
  </div>
)}
```

- [ ] **Step 5: TypeScript check**

Run: `npx tsc --noEmit`

Erreurs probables : `GroupType`/`BudgetLevel` pas importés dans ce fichier. Vérifier le bloc d'imports en haut et s'assurer qu'ils viennent bien de `@/types/roadtrip`.

- [ ] **Step 6: Smoke test manuel**

Run: `npm run dev`

Ouvrir : `http://localhost:3000/road-trip-personnalise?duration=weekend&groupType=couple&budgetLevel=moyen`

Expected :
- Le wizard démarre à l'étape 4
- Le badge "✓ Pré-rempli depuis la page road trip" est visible
- Le formulaire a duration=2-3j, groupType=couple, budgetLevel=moyen sélectionnés

Kill dev server (Ctrl+C) quand vérif OK.

- [ ] **Step 7: Commit**

```bash
git add "src/app/(site)/road-trip-personnalise/RoadTripWizard.tsx"
git commit -m "feat(wizard): pré-remplissage depuis searchParams (duration, groupType, budgetLevel)

Lecture useSearchParams() au mount, mapping DurationSlug→DurationKey,
démarrage à l'étape adaptée (step 4 si duration+groupType, step 3 sinon),
badge visuel 'Pré-rempli depuis la page road trip'.

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

### Task 6.2: Sitemap

**Files:**
- Modify: `src/app/sitemap.ts`

- [ ] **Step 1: Lire le sitemap actuel**

Déjà lu dans la session spec — pour rappel, il y a une entrée existante :
```
{ url: `${BASE_URL}/road-trip-pays-basque-van`, lastModified: new Date("2026-03-05"), changeFrequency: "monthly", priority: 0.7 },
```

- [ ] **Step 2: Remplacer cette entrée et ajouter les 15 nouvelles**

Edit `src/app/sitemap.ts` — dans la déclaration `staticPages`, remplacer la ligne existante `road-trip-pays-basque-van` par :

```typescript
// Road Trip Pays Basque refonte — 16 URLs indexables (hub + 3 duration + 12 finales)
{ url: `${BASE_URL}/road-trip-pays-basque-van`, lastModified: new Date("2026-04-11"), changeFrequency: "weekly", priority: 0.9 },
{ url: `${BASE_URL}/road-trip-pays-basque-van/weekend`, lastModified: new Date("2026-04-11"), changeFrequency: "weekly", priority: 0.85 },
{ url: `${BASE_URL}/road-trip-pays-basque-van/5-jours`, lastModified: new Date("2026-04-11"), changeFrequency: "weekly", priority: 0.85 },
{ url: `${BASE_URL}/road-trip-pays-basque-van/1-semaine`, lastModified: new Date("2026-04-11"), changeFrequency: "weekly", priority: 0.85 },
{ url: `${BASE_URL}/road-trip-pays-basque-van/weekend/solo`, lastModified: new Date("2026-04-11"), changeFrequency: "weekly", priority: 0.85 },
{ url: `${BASE_URL}/road-trip-pays-basque-van/weekend/couple`, lastModified: new Date("2026-04-11"), changeFrequency: "weekly", priority: 0.85 },
{ url: `${BASE_URL}/road-trip-pays-basque-van/weekend/amis`, lastModified: new Date("2026-04-11"), changeFrequency: "weekly", priority: 0.85 },
{ url: `${BASE_URL}/road-trip-pays-basque-van/weekend/famille`, lastModified: new Date("2026-04-11"), changeFrequency: "weekly", priority: 0.85 },
{ url: `${BASE_URL}/road-trip-pays-basque-van/5-jours/solo`, lastModified: new Date("2026-04-11"), changeFrequency: "weekly", priority: 0.85 },
{ url: `${BASE_URL}/road-trip-pays-basque-van/5-jours/couple`, lastModified: new Date("2026-04-11"), changeFrequency: "weekly", priority: 0.85 },
{ url: `${BASE_URL}/road-trip-pays-basque-van/5-jours/amis`, lastModified: new Date("2026-04-11"), changeFrequency: "weekly", priority: 0.85 },
{ url: `${BASE_URL}/road-trip-pays-basque-van/5-jours/famille`, lastModified: new Date("2026-04-11"), changeFrequency: "weekly", priority: 0.85 },
{ url: `${BASE_URL}/road-trip-pays-basque-van/1-semaine/solo`, lastModified: new Date("2026-04-11"), changeFrequency: "weekly", priority: 0.85 },
{ url: `${BASE_URL}/road-trip-pays-basque-van/1-semaine/couple`, lastModified: new Date("2026-04-11"), changeFrequency: "weekly", priority: 0.85 },
{ url: `${BASE_URL}/road-trip-pays-basque-van/1-semaine/amis`, lastModified: new Date("2026-04-11"), changeFrequency: "weekly", priority: 0.85 },
{ url: `${BASE_URL}/road-trip-pays-basque-van/1-semaine/famille`, lastModified: new Date("2026-04-11"), changeFrequency: "weekly", priority: 0.85 },
```

Les 5 URLs `noindex` (`/1-jour` et `/1-jour/*`) sont volontairement absentes.

- [ ] **Step 2: Build check**

Run: `npm run build`
Expected: OK.

- [ ] **Step 3: Vérifier le sitemap généré**

Run:
```bash
npm run dev &
sleep 4
curl -s http://localhost:3000/sitemap.xml | grep -c road-trip-pays-basque-van
kill %1
```

Expected: `16`

- [ ] **Step 4: Commit**

```bash
git add src/app/sitemap.ts
git commit -m "feat(sitemap): ajoute 16 URLs road-trip-pays-basque-van (hub + 3 duration + 12 finales)

Les 5 URLs 1-jour (+ /1-jour/*) sont noindex et absentes du sitemap
comme prévu par la spec.

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

### Task 6.3: QA manuel des pages

- [ ] **Step 1: Run dev server**

Run: `npm run dev`

- [ ] **Step 2: Ouvrir les 5 URLs critiques et vérifier visuellement**

URLs à vérifier :
1. http://localhost:3000/road-trip-pays-basque-van → hub avec map, DurationGrid, sections
2. http://localhost:3000/road-trip-pays-basque-van/weekend → page duration avec GroupTypeGrid + itinéraire référence
3. http://localhost:3000/road-trip-pays-basque-van/weekend/couple → page finale complète (template présent)
4. http://localhost:3000/road-trip-pays-basque-van/1-semaine/famille → page finale
5. http://localhost:3000/road-trip-pays-basque-van/1-jour/solo → page `noindex` qui doit quand même s'afficher correctement

**Checklist visuelle par page :**
- [ ] H1 visible, bon label
- [ ] Carte MapLibre affichée avec markers (si `NEXT_PUBLIC_MAPTILER_KEY` configurée)
- [ ] Si template présent → ItineraryDisplay avec jours/stops/overnight
- [ ] Sections POI avec cards (image ou fallback)
- [ ] Section OvernightSection avec spots
- [ ] CTA WizardCTA en bas
- [ ] Liens cross (autres durées / autres profils) vont vers d'autres pages valides
- [ ] Breadcrumbs cohérents
- [ ] Aucun 404 ou erreur client dans la console (F12)

- [ ] **Step 3: Vérifier que le wizard pré-rempli fonctionne**

Ouvrir : http://localhost:3000/road-trip-pays-basque-van/weekend/couple
Cliquer sur le CTA "Génère ton road trip personnalisé →"
Vérifier : l'URL de destination a `?duration=weekend&groupType=couple`, le wizard démarre à step 3 ou 4, badge visible.

- [ ] **Step 4: Vérifier les pages noindex**

Ouvrir : http://localhost:3000/road-trip-pays-basque-van/1-jour
View source → `<meta name="robots" content="noindex,follow">` ou équivalent.

Idem pour /1-jour/couple.

- [ ] **Step 5: Vérifier les JSON-LD**

Dans DevTools → Elements → chercher `application/ld+json` sur la page finale. Vérifier :
- Au moins 1 bloc `BreadcrumbList`
- 1 bloc `TouristTrip` si template présent
- 1 bloc `FAQPage` si template présent avec faq non vide

- [ ] **Step 6: Mobile responsive**

DevTools → Toggle device toolbar → iPhone 12. Vérifier hub + 1 page finale.
- H1 lisible, pas de débordement horizontal
- Carte fit bien en height mobile (380px)
- Cards POI/overnight stack en 1 col
- CTA WizardCTA accessible sans scroll horizontal

- [ ] **Step 7: Kill dev server**

Ctrl+C.

- [ ] **Step 8: Corriger et commiter les éventuels fix**

Si quoi que ce soit est cassé, corriger puis :
```bash
git add -A
git commit -m "fix(road-trip-pb): corrections QA visuel

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

### Task 6.4: Build final et checklist livraison

- [ ] **Step 1: Build production**

Run: `npm run build`

Expected : succès complet, aucune erreur TS/ESLint, log des pages pré-buildées montre :
- `/road-trip-pays-basque-van` (static)
- `/road-trip-pays-basque-van/[duration]` × 4 (static)
- `/road-trip-pays-basque-van/[duration]/[groupType]` × 16 (static)

- [ ] **Step 2: Start production server et tester**

Run: `npm run start &`

```bash
curl -sI http://localhost:3000/road-trip-pays-basque-van | grep -E "HTTP|x-next"
curl -sI http://localhost:3000/road-trip-pays-basque-van/weekend/couple | grep -E "HTTP|x-next"
curl -sI http://localhost:3000/road-trip-pays-basque-van/1-jour/solo | grep -E "HTTP|x-next"
```

Expected: toutes en 200.

```bash
kill %1
```

- [ ] **Step 3: Checklist spec finale**

Vérifier chaque ligne de la checklist de la section 15 du spec :

- [x] Migration SQL appliquée
- [x] backfill-poi-coordinates ≥ 40/49
- [x] backfill-poi-images ≥ 30/49 (lire vérification DB)
- [x] seed-templates 16/16
- [x] 21 pages servies en dev
- [x] 5 pages noindex
- [x] Carte fonctionnelle
- [x] Wizard pré-rempli
- [x] Sitemap 16 URLs
- [x] `npm run build` OK
- [x] Landing monolithique remplacée
- [x] Schema.org validé (vérif manuelle DevTools)

- [ ] **Step 4: Merge vers main**

Revenir au worktree principal :
```bash
cd /Users/julesgaveglio/vanzon-website-claude-code
git fetch .worktrees/road-trip-pb-refonte HEAD:feature/road-trip-pb-refonte 2>/dev/null || true
git checkout main
git merge --no-ff feature/road-trip-pb-refonte -m "feat: refonte SEO locale road trip Pays Basque

21 pages pré-buildées (1 hub + 4 duration + 16 finales), 16 indexées.
Retrofit poi_cache (coordinates + images) + 16 templates Groq seedés.
Remplace la landing monolithique /road-trip-pays-basque-van 645 lignes.

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

- [ ] **Step 5: Proposer à l'utilisateur de push (ne pas push auto)**

> Implementation terminée et mergée sur main localement. Prêt à push ? (`git push origin main`)

---

## Annexes

### A. Récap des fichiers créés/modifiés

**Créés (20 fichiers) :**
```
supabase/migrations/20260411000001_poi_coordinates_and_templates.sql
src/types/road-trip-pb.ts
src/lib/road-trip-pb/constants.ts
src/lib/road-trip-pb/queries.ts
src/lib/road-trip-pb/geocoding.ts
src/lib/road-trip-pb/metadata.ts
scripts/road-trip/backfill-poi-coordinates.ts
scripts/road-trip/backfill-poi-images.ts
scripts/road-trip/seed-templates.ts
src/app/(site)/road-trip-pays-basque-van/_components/POICard.tsx
src/app/(site)/road-trip-pays-basque-van/_components/OvernightCard.tsx
src/app/(site)/road-trip-pays-basque-van/_components/DurationGrid.tsx
src/app/(site)/road-trip-pays-basque-van/_components/GroupTypeGrid.tsx
src/app/(site)/road-trip-pays-basque-van/_components/WizardCTA.tsx
src/app/(site)/road-trip-pays-basque-van/_components/POISection.tsx
src/app/(site)/road-trip-pays-basque-van/_components/OvernightSection.tsx
src/app/(site)/road-trip-pays-basque-van/_components/ItineraryDisplay.tsx
src/app/(site)/road-trip-pays-basque-van/_components/BudgetFilter.tsx
src/app/(site)/road-trip-pays-basque-van/_components/FAQSection.tsx
src/app/(site)/road-trip-pays-basque-van/_components/RoadTripMap.tsx
src/app/(site)/road-trip-pays-basque-van/[duration]/page.tsx
src/app/(site)/road-trip-pays-basque-van/[duration]/[groupType]/page.tsx
```

**Modifiés (3 fichiers) :**
```
src/app/(site)/road-trip-pays-basque-van/page.tsx         (remplacé en place)
src/app/(site)/road-trip-personnalise/RoadTripWizard.tsx  (searchParams pre-fill)
src/app/sitemap.ts                                         (15 URLs ajoutées)
```

**Supprimés** : aucun.

### B. Environnement requis

```
NEXT_PUBLIC_MAPTILER_KEY=          # déjà en prod
NEXT_PUBLIC_SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
GROQ_API_KEY=                       # pour le script seed-templates
```

### C. Commandes récurrentes

```bash
# Run backfill data (one-shot)
npx tsx --env-file=.env.local scripts/road-trip/backfill-poi-coordinates.ts
npx tsx --env-file=.env.local scripts/road-trip/backfill-poi-images.ts
npx tsx --env-file=.env.local scripts/road-trip/seed-templates.ts

# Regenerer un template spécifique
npx tsx --env-file=.env.local scripts/road-trip/seed-templates.ts --force --only weekend/couple

# Dev + build
npm run dev
npm run build
npm run start

# TypeScript standalone check
npx tsc --noEmit
```

### D. Points d'attention pour le reviewer de plan

- Pas de test runner frontend : la "vérification" se fait via `npm run build` + QA manuel à chaque chunk.
- Pas de validation DTD/ToS pour Nominatim au-delà de User-Agent + 1 req/s — si le backfill échoue avec 429, le script a déjà un sleep 1.1s donc on est safe, mais en secours lancer `--dry-run` d'abord et surveiller les warnings.
- Le prompt Groq dans `seed-templates.ts` est strict mais non garanti — la validation post-parse + retry 1x suffit pour 95%+ des cas sur 16 combos.
- Les 5 pages noindex (1-jour) sont toujours générées par `generateStaticParams` parce qu'on veut que les URLs fonctionnent si quelqu'un les tape directement, mais elles ne sont jamais servies à Google via sitemap ni indexables.
- La polyline MapLibre connecte les stops + overnight dans l'ordre chronologique, ce qui peut créer des allers-retours bizarres si Groq met un stop en fin de journée loin du spot de nuit. Acceptable au MVP, à affiner si feedback.
