# Design — Refonte SEO locale Road Trip Pays Basque

**Date** : 2026-04-11
**Auteur** : Jules + Claude
**Status** : Design validé, implémentation à démarrer

---

## 1. Contexte et problème

Le site Vanzon Explorer a 4 routes road-trip en prod qui se chevauchent :

| Route | Rôle actuel | Action |
|---|---|---|
| `/road-trip` | Catalogue Sanity programmatique 15 régions | **Conserver** intact |
| `/road-trip/[regionSlug]` | Pages région du catalogue Sanity | **Conserver** |
| `/road-trip/[regionSlug]/[articleSlug]` | Articles individuels Sanity | **Conserver** |
| `/road-trip-pays-basque-van` | Landing SEO monolithique 645 lignes | **Refondre complètement** |
| `/road-trip-personnalise` | Wizard lead-magnet Groq (SSE) | Modification minimale (searchParams) |

L'objectif est de **remplacer la landing monolithique `/road-trip-pays-basque-van`** par une arborescence SEO locale Pays Basque structurée, qui maximise la surface SEO par dimension d'intent (durée, profil voyageur) tout en s'appuyant sur le cache POI `poi_cache` existant et la stack visuelle MapLibre + Maptiler déjà en prod.

Le catalogue Sanity `/road-trip` et le wizard `/road-trip-personnalise` ne sont **pas touchés** pour éviter tout risque de perte de jus SEO ou de régression fonctionnelle.

---

## 2. Audit data (état au 2026-04-11)

Relevé brut de `poi_cache` :

| Métrique | Valeur |
|---|---|
| Total POIs | 49 |
| Catégories | 16 spot_nuit, 10 activite, 9 nature, 10 restaurant, 4 culture |
| Top villes | Biarritz (14), Bayonne (7), SJDL (4), Anglet (4), Itxassou (3), Espelette (3) |
| POIs avec `image_url` | 0 |
| POIs avec `overnight_coordinates` | 0 |
| `road_trip_requests` status=`sent` région Pays Basque | 2 (couple/moyen, amis/moyen) |

Conséquences :
- La carte MapLibre prévue dans le spec initial ne peut pas fonctionner en l'état : aucun POI n'a de coordonnées.
- 10 des 12 combos groupType × budgetLevel n'ont aucun itinéraire réel à afficher.
- Les cards POI seront sans image par défaut.

D'où la stratégie hybride : **sprint data day-0 (retrofit des 49 POIs existants) puis construction des pages**, densification post-MVP.

---

## 3. Arborescence URL

```
/road-trip-pays-basque-van                              ← hub refondu (remplace la landing 645 lignes)
/road-trip-pays-basque-van/[duration]                   ← 3 pages duration indexées (+ 1 noindex)
/road-trip-pays-basque-van/[duration]/[groupType]       ← 12 pages finales (3 durations × 4 groupTypes)
```

**Total landings SEO indexables : 16** (1 hub + 3 duration indexés + 12 finales).

### 3.1 Dimensions de filtrage

**Retenues dans l'URL** :
- `duration` : `1-jour` (noindex), `weekend`, `5-jours`, `1-semaine`
- `groupType` : `solo`, `couple`, `amis`, `famille`

**Raison du choix** : duration est le dimension #1 en search intent van-life ("road trip pays basque weekend van", "road trip pays basque 1 semaine"). groupType différencie réellement le contenu (rythme, étapes adaptées). budgetLevel est plutôt un signal de qualification que d'intent direct → devient filtre in-page, pas URL.

**Dimensions abandonnées en URL** : `budgetLevel` (filtre in-page client), `interests[]`, `overnightPreference`, `scope`. Toutes restent accessibles via le wizard.

### 3.2 Mapping duration slug ↔ wizard key

| URL slug | Wizard `duration` | Jours | Indexé |
|---|---|---|---|
| `1-jour` | `1j` | 1 | **Non** (`noindex` pour éviter thin content) |
| `weekend` | `2-3j` | 2-3 | Oui |
| `5-jours` | `4-5j` | 4-5 | Oui |
| `1-semaine` | `1sem` | 7 | Oui |

### 3.3 Labels FR

```ts
const DURATION_LABELS = {
  '1-jour': '1 jour',
  'weekend': 'Weekend',
  '5-jours': '5 jours',
  '1-semaine': '1 semaine',
}
const GROUP_LABELS = {
  solo: 'en solo',
  couple: 'en couple',
  amis: 'entre amis',
  famille: 'en famille',
}
```

---

## 4. Strates de données

### 4.1 Migration SQL

Fichier `supabase/migrations/20260411000001_poi_coordinates_and_templates.sql` :

```sql
-- Ajoute une colonne coordinates générique à poi_cache (format "lat,lng")
ALTER TABLE poi_cache ADD COLUMN IF NOT EXISTS coordinates TEXT;
CREATE INDEX IF NOT EXISTS idx_poi_coordinates ON poi_cache(coordinates) WHERE coordinates IS NOT NULL;

-- Nouvelle table pour les templates d'itinéraires pré-générés
CREATE TABLE IF NOT EXISTS road_trip_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  region_slug TEXT NOT NULL,
  duration_key TEXT NOT NULL,       -- '1-jour' | 'weekend' | '5-jours' | '1-semaine'
  group_type TEXT NOT NULL,         -- 'solo' | 'couple' | 'amis' | 'famille'
  title TEXT NOT NULL,
  intro TEXT,
  itinerary_json JSONB NOT NULL,    -- format compatible GeneratedItineraryV2
  poi_ids UUID[] DEFAULT '{}',      -- FK array vers poi_cache
  overnight_ids UUID[] DEFAULT '{}',
  tips TEXT[] DEFAULT '{}',
  faq JSONB DEFAULT '[]',           -- [{q,a}, ...] pour schema FAQPage
  published BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT road_trip_templates_unique UNIQUE (region_slug, duration_key, group_type)
);
CREATE INDEX IF NOT EXISTS idx_rtt_region ON road_trip_templates(region_slug);
CREATE INDEX IF NOT EXISTS idx_rtt_lookup ON road_trip_templates(region_slug, duration_key, group_type);

ALTER TABLE road_trip_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "road_trip_templates_public_read"
  ON road_trip_templates FOR SELECT
  TO anon
  USING (published = true);
```

### 4.2 Sprint data day-0 (scripts one-shot)

**Script 1 — `scripts/road-trip/backfill-poi-coordinates.ts`** :
- Lit tous les POIs `poi_cache` sans `coordinates`
- Pour chaque POI : appelle **Nominatim** (`https://nominatim.openstreetmap.org/search`) avec `q = "{name}, {address}, {location_city}, France"`
- Respecte 1 req/s (User-Agent `VanzonExplorer/1.0 (contact@vanzonexplorer.com)`)
- Upsert `coordinates = "lat,lng"`
- Log des POIs non géocodables (fallback : centroid de `location_city` via table interne de fallback)
- Dry-run `--dry-run`
- Idempotent (relancer sur POIs déjà géocodés = no-op)

**Script 2 — `scripts/road-trip/backfill-poi-images.ts`** :
- Lit tous les POIs `poi_cache` sans `image_url` mais avec `external_url`
- Pour chaque : appelle `extractOGImage(external_url)` depuis `src/lib/admin/poi-scraper.ts`
- Upsert `image_url` si trouvée
- Dry-run `--dry-run`
- Idempotent

**Script 3 — `scripts/road-trip/seed-templates.ts`** :
- Pour chaque combo `(pays-basque × 3 durations indexées × 4 groupTypes = 12)` **et** le 1-jour × 4 = 16 templates
- Lit les POIs pertinents du cache (filtrés par tags/category selon groupType)
- Appelle Groq `llama-3.3-70b-versatile` avec un prompt spécifique : génère title, intro, itinerary_json (format `GeneratedItineraryV2`), tips[], faq[]
- Upsert dans `road_trip_templates` avec `ON CONFLICT (region_slug, duration_key, group_type)`
- Flag `--force` pour régénérer
- Flag `--only <duration>/<groupType>` pour cibler un combo
- Coût total ~$0.05 (16 appels Groq × ~3k tokens)

Aucun de ces scripts n'est exécuté à chaque requête utilisateur. Tout est **pré-calculé en batch**.

### 4.3 Pas de regénération à la volée

Les pages lisent **uniquement** `poi_cache` et `road_trip_templates` via queries Supabase SSR. Pas d'appel Groq côté page. Pas de Tavily. Les pages sont déterministes, cacheables ISR 24h.

---

## 5. Architecture code

### 5.1 Fichiers créés

```
src/
  app/(site)/road-trip-pays-basque-van/
    page.tsx                          ← hub (remplace le monolithe 645 lignes)
    [duration]/
      page.tsx                        ← niveau duration
      [groupType]/
        page.tsx                      ← page finale
    _components/
      DurationGrid.tsx                ← 4 cards duration sur le hub
      GroupTypeGrid.tsx               ← 4 cards profils sur page duration
      POISection.tsx                  ← section POIs filtrés (server)
      OvernightSection.tsx            ← section spots nuit (server)
      ItineraryDisplay.tsx            ← timeline jour par jour (server)
      BudgetFilter.tsx                ← CLIENT : tri in-page par budget
      WizardCTA.tsx                   ← CTA pré-rempli vers wizard
      RoadTripMap.tsx                 ← CLIENT, dynamic import, MapLibre
      POICard.tsx                     ← card POI réutilisable
      OvernightCard.tsx               ← card spot nuit
      FAQSection.tsx                  ← FAQ + schema JSON-LD
  lib/road-trip-pb/
    constants.ts                      ← DURATIONS, GROUP_TYPES, labels, slugs
    queries.ts                        ← server helpers Supabase
    metadata.ts                       ← buildMetadata() partagé
    geocoding.ts                      ← helper Nominatim pour les scripts
  types/road-trip-pb.ts               ← types partagés
```

### 5.2 Fichiers modifiés

- `src/app/(site)/road-trip-personnalise/RoadTripWizard.tsx` : lecture `useSearchParams()` pour pré-remplissage depuis `?duration=&groupType=&budgetLevel=`
- `src/app/sitemap.ts` : ajout des 16 URLs (1 hub + 3 duration indexées + 12 finales). L'entrée existante `/road-trip-pays-basque-van` est conservée et mise à jour (priority 0.9, changeFrequency weekly).
- `src/lib/admin/poi-scraper.ts` : export de `extractOGImage` déjà présent, rien à modifier.

### 5.3 Fichiers supprimés

Aucun. Le contenu monolithique de `src/app/(site)/road-trip-pays-basque-van/page.tsx` est **remplacé en place** par le nouveau hub.

---

## 6. Queries Supabase (signatures)

Fichier `src/lib/road-trip-pb/queries.ts` :

```ts
// POIs filtrés par region + groupType, exclut les spot_nuit
getPOIsForGroupType(region: string, groupType: GroupType): Promise<POIRow[]>

// Spots nuit filtrés par region, top N
getOvernightSpotsForRegion(region: string, limit?: number): Promise<POIRow[]>

// Template pré-généré pour un combo exact (null si absent)
getTemplate(region: string, duration: DurationSlug, groupType: GroupType): Promise<RoadTripTemplate | null>

// Stats pour le hub (total POIs, total spots nuit, villes couvertes)
getRegionStats(region: string): Promise<{ totalPois: number; totalOvernight: number; cities: string[] }>

// Top N activités toutes catégories confondues pour le hub
getTopActivities(region: string, limit?: number): Promise<POIRow[]>
```

Toutes ces queries utilisent `createSupabaseAdmin()` (service role, RLS bypass) car elles sont appelées en Server Component au build time (ISR). Aucune donnée sensible exposée : `poi_cache` et `road_trip_templates` ont des policies `public_read`.

---

## 7. Contenu par page

### 7.1 Hub `/road-trip-pays-basque-van`

**Structure** :
1. Hero H1 "Road Trip en Van au Pays Basque — Itinéraires sur mesure"
2. Intro éditoriale 120 mots (ancrée sur l'expérience Jules 4 ans sur place + base Cambo-les-Bains)
3. Carte MapLibre Pays Basque avec les 49 POIs (markers par catégorie)
4. Grid 4 duration cards → `/[duration]`
5. Section "Où dormir en van au Pays Basque" : top 6 overnight spots (OvernightCard)
6. Section "Les incontournables" : top 6 activités (POICard)
7. CTA central vers `/road-trip-personnalise`
8. Schema.org `TouristTrip` + `BreadcrumbList` + lien `/location/cambo-les-bains`

### 7.2 Page duration `/road-trip-pays-basque-van/[duration]`

**Structure** :
1. Hero H1 "Road Trip Pays Basque [Weekend|5 jours|1 semaine] en Van"
2. Intro 80 mots personnalisée à la durée (rythme, km estimés, temps de conduite)
3. Carte MapLibre filtrée
4. Grid 4 groupType cards → `/[duration]/[groupType]`
5. Section "Itinéraire de référence" : affiche le template `couple/[duration]` comme version canonique
6. Section "Spots nuit recommandés"
7. CTA wizard pré-rempli `?duration=[duration]`
8. Schema.org `TouristTrip` + `BreadcrumbList`

### 7.3 Page finale `/road-trip-pays-basque-van/[duration]/[groupType]`

**Structure** (la plus importante) :

1. **Hero**
   - H1 dynamique : "Road Trip Pays Basque [Weekend|5j|1sem] en Van — [en couple|solo|...]"
   - Sous-titre avec keywords : "Itinéraire complet au départ de Cambo-les-Bains, spots nuit validés, activités [adaptées]"
   - Badges : durée, nombre d'étapes, budget estimé
   - CTA primaire : "Génère ta version perso en 2 minutes →" → wizard pré-rempli

2. **Carte MapLibre interactive**
   - Props : POIs du template + overnight spots du template, géocodés
   - Markers colorés par catégorie
   - Polyline MapLibre reliant les stops du template (si `itinerary_json` présent)
   - Popup clic : nom, description courte, budget, lien externe

3. **Itinéraire jour par jour**
   - Timeline verticale
   - Chaque jour : thème, stops (heure, nom, type, description, adresse, lien), spot nuit du soir
   - Source : `road_trip_templates.itinerary_json`

4. **BudgetFilter (client)**
   - Tabs : Tous | Petit budget | Moyen | Confort
   - Filtre visuel en place, sans changer l'URL

5. **Sections POI par catégorie**
   - Accordion : Activités | Restaurants | Culture | Nature | Spots nuit
   - 4-6 cards max par catégorie

6. **Section "Conseils van"**
   - 5 tips du template

7. **Cross-linking interne**
   - "Autres durées pour ce profil" (3 liens)
   - "Autres profils pour cette durée" (3 liens)
   - "Louer un van depuis Cambo-les-Bains" → `/location/cambo-les-bains`
   - "Voir notre formation VBA" si pertinent

8. **CTA final double action** (sticky sur mobile, section dédiée desktop)
   - Bouton 1 : "Génère ta version 100% perso →" (wizard)
   - Bouton 2 : "Loue un van Vanzon Explorer →" (location)

9. **Schema.org**
   - `TouristTrip` avec `itinerary` structuré
   - `BreadcrumbList`
   - `FAQPage` (4-6 questions depuis le template)

---

## 8. Gestion des cas vides

- **`getPOIsForGroupType()` retourne 0** → fallback sur les POIs génériques `activite` + `nature`. Jamais `notFound()`.
- **`getTemplate()` retourne `null`** → section "Itinéraire personnalisé bientôt disponible" + curation POIs + CTA wizard très visible. Jamais `notFound()`.
- **Nominatim a échoué sur tous les POIs** → map affiche centre Pays Basque (43.48, -1.48) + marker unique "Zone du road trip" + fallback liste cliquable dans le composant map.

---

## 9. Map — composant `RoadTripMap.tsx`

Inspiré du pattern existant `src/app/(site)/road-trip/_components/CatalogMap.tsx` (même Maptiler key, même style).

**Props** :
```ts
{
  pois: POIRow[]           // tous les markers à afficher
  itinerary?: ItineraryV2  // si présent → polyline chronologique
  center?: [lng, lat]      // défaut Pays Basque 43.48,-1.48
  zoom?: number            // défaut 9
  height?: { desktop: number; mobile: number }  // 500/380
}
```

**Comportement** :
- `'use client'`, dynamic import depuis la page
- Style Maptiler `outdoor-v2` avec `NEXT_PUBLIC_MAPTILER_KEY`
- Markers HTML custom colorés par `category` (rouge=restaurant, bleu=spot_nuit, vert=nature, violet=culture, orange=activite)
- Popup clic : HTML inline (nom, city, description 1 phrase, badge budget, lien externe si présent)
- Polyline si `itinerary` fourni : Line layer MapLibre reliant les stops jour par jour
- Clustering désactivé (49 POIs max)
- `maxBounds` Pays Basque pour empêcher zoom out excessif
- Cleanup `map.remove()` au unmount

---

## 10. Wizard — modification minimale

Fichier `src/app/(site)/road-trip-personnalise/RoadTripWizard.tsx` :

- Ajout de `const searchParams = useSearchParams()` au mount
- Lecture de `duration`, `groupType`, `budgetLevel`, `region`
- Si duration présent → state du form pré-rempli + saut à l'étape correspondante
- Badge visuel "✓ Depuis la page road trip" sur les étapes pré-remplies
- Aucun changement à la route `/api/road-trip/generate`

---

## 11. Sitemap

Ajout dans `src/app/sitemap.ts` :

```ts
const ROAD_TRIP_PB_DURATIONS = ['weekend', '5-jours', '1-semaine'] as const
const ROAD_TRIP_PB_GROUPS = ['solo', 'couple', 'amis', 'famille'] as const

// Hub (entrée existante mise à jour)
{ url: `${BASE_URL}/road-trip-pays-basque-van`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.9 }

// 3 pages duration indexées
...ROAD_TRIP_PB_DURATIONS.map(d => ({
  url: `${BASE_URL}/road-trip-pays-basque-van/${d}`,
  lastModified: new Date(),
  changeFrequency: "weekly" as const,
  priority: 0.85,
}))

// 12 pages finales
...ROAD_TRIP_PB_DURATIONS.flatMap(d =>
  ROAD_TRIP_PB_GROUPS.map(g => ({
    url: `${BASE_URL}/road-trip-pays-basque-van/${d}/${g}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.85,
  }))
)
```

La page `/road-trip-pays-basque-van/1-jour` existe (générée par `generateStaticParams`) mais **n'est pas ajoutée au sitemap** et porte `robots: { index: false }`.

---

## 12. Metadata / SEO

Fichier `src/lib/road-trip-pb/metadata.ts` centralise les templates :

```ts
export function buildFinalPageMetadata(duration: DurationSlug, groupType: GroupType): Metadata {
  const dLabel = DURATION_LABELS[duration]
  const gLabel = GROUP_LABELS[groupType]
  const canonical = `https://vanzonexplorer.com/road-trip-pays-basque-van/${duration}/${groupType}`

  return {
    title: `Road Trip Van Pays Basque ${dLabel} ${gLabel} — Itinéraire & Spots | Vanzon Explorer`,
    description: `Road trip Pays Basque ${dLabel} en van aménagé ${gLabel}. Itinéraire détaillé, étapes, spots nuit validés, cartes GPS. Au départ de Cambo-les-Bains.`,
    alternates: { canonical },
    openGraph: { title: ..., description: ..., url: canonical, type: 'article' },
    robots: { index: duration !== '1-jour', follow: true },
  }
}
```

Helpers similaires pour hub et page duration.

---

## 13. ISR

```ts
export const revalidate = 86400 // 24h
export async function generateStaticParams() { ... }
```

- Les 16 combos sont pré-buildés au `next build`
- Revalidation automatique toutes les 24h lit à nouveau Supabase (permet le retrofit `poi_cache` sans redeploy)
- Pas de `force-dynamic`, pas de `force-static`

---

## 14. Ce qui est explicitement hors scope MVP

- Pas de 3e niveau `/[duration]/[groupType]/[budgetLevel]` (budget = filtre in-page)
- Pas de validation manuelle des 49 POIs existants (correction via `/admin/poi` post-lancement)
- Pas de régénération Groq à la volée côté page
- Pas de clustering MapLibre
- Pas de géocoding temps réel (tout batch day-0)
- Pas de touchers à `/road-trip` (catalogue Sanity) ni à `/api/road-trip/generate`
- Pas de suppression de POIs même si approximatifs
- Pas d'A/B testing microcopy au MVP
- Pas de tests unitaires des composants visuels (tests seulement sur `queries.ts` et les scripts de backfill)

---

## 15. Checklist de livraison

Le design est considéré livré quand :

- [ ] Migration SQL appliquée (`coordinates` + `road_trip_templates`)
- [ ] `backfill-poi-coordinates.ts` exécuté (≥ 40/49 POIs géocodés)
- [ ] `backfill-poi-images.ts` exécuté (≥ 30/49 POIs avec image_url)
- [ ] `seed-templates.ts` exécuté (16/16 templates présents)
- [ ] 16 pages servies correctement en dev (`npm run dev`)
- [ ] Carte MapLibre fonctionnelle sur les 16 pages
- [ ] Wizard pré-rempli depuis les URLs de test
- [ ] Sitemap inclut les 16 URLs (14 indexés + 1 hub)
- [ ] `npm run build` passe sans erreur TypeScript/ESLint
- [ ] Landing monolithique supprimée/remplacée (diff git sur le page.tsx principal)
- [ ] Schema.org `TouristTrip`, `BreadcrumbList`, `FAQPage` validés via Rich Results Test

---

## 16. Risques & mitigations

| Risque | Probabilité | Impact | Mitigation |
|---|---|---|---|
| Nominatim rate-limit bloque le backfill | Moyenne | Moyen | 1 req/s strict, retry, fallback centroid ville |
| OG images absentes sur beaucoup d'URLs sources | Élevée | Faible | Fallback gradient + icône catégorie dans POICard |
| Groq hallucine des POIs inexistants dans les templates | Moyenne | Moyen | Contrainte stricte "pioche dans `poi_ids` fournis", même règle que route generate existante |
| Perte de jus SEO sur l'ancienne landing monolithique | Faible | Moyen | URL conservée `/road-trip-pays-basque-van` → in-place, aucune redirection nécessaire |
| Contenu trop similaire entre les 12 pages finales (cannibalisation) | Moyenne | Élevé | Templates distincts par combo, polylines différentes, tips et FAQ uniques |
| MapTiler quota dépassé (free tier 100k tiles/mois) | Faible | Moyen | Surveiller via admin dashboard existant, passer plan payant si besoin |

---

## 17. Plan d'exécution prévu (sera détaillé dans writing-plans)

1. Migration SQL
2. Scripts de backfill (coordinates + images)
3. Script de seed templates
4. Fichiers de constantes et queries
5. Composants UI (POICard, OvernightCard, RoadTripMap, FAQ, etc.)
6. Page finale `/[duration]/[groupType]`
7. Page duration `/[duration]`
8. Hub `/road-trip-pays-basque-van`
9. Modification wizard (searchParams)
10. Sitemap
11. Smoke test : `npm run build` + vérif manuelle des 16 URLs en dev
12. Commit + push

---

## 18. Référence des fichiers existants à lire

- `src/app/api/road-trip/generate/route.ts` — pattern SSE + Groq existant
- `src/lib/road-trip/poi-cache.ts` — helpers cache-first existants
- `src/lib/admin/poi-scraper.ts` — `extractOGImage` réutilisable
- `src/app/(site)/road-trip/_components/CatalogMap.tsx` — pattern MapLibre existant
- `src/app/(site)/road-trip-personnalise/RoadTripWizard.tsx` — wizard à modifier
- `src/types/roadtrip.ts` — types partagés existants
- `supabase/migrations/20260410000001_poi_cache_and_leads.sql` — schema poi_cache actuel

---

**Validé par Jules le 2026-04-11. Prochaine étape : `writing-plans` skill pour transformer en plan d'implémentation.**
