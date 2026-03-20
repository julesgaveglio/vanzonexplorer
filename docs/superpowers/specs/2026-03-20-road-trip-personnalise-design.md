# Road Trip Personnalisé — Design Spec

**Date:** 2026-03-20
**Status:** Approved
**URL cible:** `/road-trip-personnalise`

---

## Objectif

Créer une page de génération d'itinéraire van personnalisé pour capturer des leads (emails) en offrant un road trip sur mesure généré par IA. L'outil cible les vanlifers partout en France, positionne Vanzon Explorer comme référence nationale du road trip en van, et génère des opportunités de location.

---

## Architecture globale

```
Utilisateur → Wizard 4 étapes → API /api/road-trip/generate
                                    ├── Rate limiting (IP + email)
                                    ├── Déduplication email (24h)
                                    ├── Supabase (save + status)
                                    ├── Tavily (scrape spots)
                                    ├── Groq (génère itinéraire JSON)
                                    │     └── Retry si JSON invalide
                                    └── Resend (envoie email HTML)
```

---

## 1. Page `/road-trip-personnalise`

### Route
- Groupe : `(site)` — public, aucune auth requise
- Fichier : `src/app/(site)/road-trip-personnalise/page.tsx`
- Layout : layout `(site)` existant (Navbar + FloatingCTA)

### Structure de la page
1. **Hero section** — titre, accroche SEO, illustration van
2. **Wizard component** — formulaire 4 étapes
3. **Section "Comment ça marche"** — 3 étapes visuelles (Remplis / On génère / Tu reçois)
4. **Section témoignages** (v1 — placeholder texte statique)
5. **CTA secondaire** — lien vers `/location`

### SEO
- `<title>` : `Crée ton road trip en van personnalisé | Vanzon Explorer`
- `<meta description>` : `Génère gratuitement ton itinéraire road trip en van sur mesure. Spots, activités, camping selon tes envies et ta destination en France.`
- Schema.org : `WebApplication` avec `applicationCategory: "TravelApplication"`
- H1 : `Ton road trip en van sur mesure, partout en France`
- Ciblage mots-clés : "road trip van France", "itinéraire van personnalisé", "road trip van [région]"

### Navigation
Ajouter **"Road Trip"** dans `src/components/layout/Navbar.tsx` entre "Pays Basque" et "Articles".

### FloatingCTA
Ajouter le cas `road-trip-personnalise` dans `FloatingCTA.tsx` : afficher un CTA "Générer mon itinéraire" pointant vers `#wizard`. Ne pas utiliser de catégorie article existante — ce cas est déclenché par pathname `/road-trip-personnalise`.

---

## 2. Wizard — Formulaire 4 étapes

Implémenté comme Client Component (`'use client'`) avec `react-hook-form` + Zod, animations Framer Motion entre étapes, barre de progression.

### Constantes partagées (fichier `src/lib/road-trip/constants.ts`)
```typescript
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
```

### Étape 1 — "Ton van trip"
| Champ | Type | Validation |
|-------|------|------------|
| `prenom` | text input | requis, min 2 chars |
| `email` | email input | requis, format email |
| `region` | text input | requis, min 2 chars (ex: "Bretagne", "Alpes") |
| `duree` | select (1 à 14 jours) | requis — `register('duree', { valueAsNumber: true })` |

### Étape 2 — "Tes envies"
| Champ | Type | Options |
|-------|------|---------|
| `interets` | checkboxes multi-sélection | valeurs depuis `INTERETS_OPTIONS` |
| `style_voyage` | radio cards | `lent` / `explorer` / `aventure` |
| `periode` | select mois | valeurs depuis `MOIS_OPTIONS` |

### Étape 3 — "Ton profil"
| Champ | Type | Options |
|-------|------|---------|
| `profil_voyageur` | radio cards avec icônes | `solo` / `couple` / `famille` / `amis` |
| `budget` | radio cards | `economique` / `confort` / `premium` |
| `experience_van` | toggle | `false` = première fois / `true` = habitué |

### Étape 4 — "Confirmation"
- Résumé visuel de la demande (cards recap)
- Bouton CTA : `"Générer mon road trip 🚐"`
- **État succès** : animation + *"Ton road trip arrive dans ta boîte mail !"*
- **État erreur** : message visible `"Une erreur est survenue, réessaie dans quelques instants."` + bouton retry
- **État loading** : spinner + message *"Génération en cours…"* (pas de timeout côté client)

---

## 3. API Route — `/api/road-trip/generate`

**Fichier :** `src/app/api/road-trip/generate/route.ts`
**Méthode :** POST
**Auth :** Publique (pas de Clerk requis)
**Export obligatoire :** `export const maxDuration = 60` (Vercel Pro)

### Rate limiting
Utiliser `@vercel/edge` ou un middleware Vercel Edge sur la route pour limiter à **3 requêtes par IP par heure**. Implémentation via `src/middleware.ts` en ajoutant un matcher sur `/api/road-trip/generate` avec comptage en mémoire Edge (ou Upstash Redis si disponible). Si dépassement : retourner `429` avec `{ success: false, error: "Trop de demandes, réessaie dans une heure." }`.

### Déduplication email
Avant toute génération, interroger Supabase :
```sql
SELECT id FROM road_trip_requests
WHERE email = $1 AND status = 'sent' AND created_at > now() - interval '24 hours'
LIMIT 1
```
Si résultat : retourner `429` avec `{ success: false, error: "Tu as déjà reçu un road trip aujourd'hui. Réessaie demain !" }`.

### Schéma de validation Zod
```typescript
import { INTERETS_OPTIONS, MOIS_OPTIONS } from '@/lib/road-trip/constants'

const InteretEnum = z.enum(
  INTERETS_OPTIONS.map(o => o.value) as [string, ...string[]]
)

const RoadTripSchema = z.object({
  prenom: z.string().min(2).max(50),
  email: z.string().email(),
  region: z.string().min(2).max(100),
  duree: z.coerce.number().int().min(1).max(14),
  interets: z.array(InteretEnum).min(1).max(7),
  style_voyage: z.enum(['lent', 'explorer', 'aventure']),
  periode: z.enum(MOIS_OPTIONS),
  profil_voyageur: z.enum(['solo', 'couple', 'famille', 'amis']),
  budget: z.enum(['economique', 'confort', 'premium']),
  experience_van: z.boolean(),
})
```

### Réponses API
```typescript
// Succès
{ success: true, message: "Road trip envoyé !" }

// Erreur validation
{ success: false, error: "Données invalides", details: ZodError }  // 400

// Rate limit / déduplication
{ success: false, error: "..." }  // 429

// Erreur serveur
{ success: false, error: "Erreur interne, réessaie dans quelques instants." }  // 500
```

### Pipeline de génération

**Étape 1 — Déduplication** (voir ci-dessus)

**Étape 2 — Sauvegarde Supabase** (`status: 'pending'`)

**Étape 3 — Tavily search**
```
query: "road trip van {region} France spots activités {interets_labels} {periode}"
```
Récupère 5-8 résultats. En cas d'erreur Tavily : continuer avec contexte vide (Groq génère depuis ses connaissances générales).

**Étape 4 — Groq generation**
Modèle : `llama-3.3-70b-versatile`
Demande du JSON strict. En cas de JSON invalide au parsing : **un retry** avec `temperature: 0` et instructions JSON renforcées. Si le second essai échoue : retourner `500` et mettre `status = 'error'` dans Supabase.
Format de sortie :
```typescript
{
  intro: string,
  jours: Array<{
    numero: number,
    titre: string,
    spots: Array<{ nom: string, description: string, type: string }>,
    camping: string,
    tips: string
  }>,
  conseils_pratiques: string[]
}
```

**Étape 5 — Resend email**
En cas d'erreur Resend : mettre `status = 'error'`, retourner `500`.

**Étape 6 — Update Supabase** (`status: 'sent'`, `itineraire_json`, `sent_at`)

---

## 4. Supabase — Table `road_trip_requests`

**Fichier migration :** `supabase/migrations/YYYYMMDD_road_trip_requests.sql`

```sql
CREATE TABLE road_trip_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prenom TEXT NOT NULL,
  email TEXT NOT NULL,
  region TEXT NOT NULL,
  duree INTEGER NOT NULL CHECK (duree BETWEEN 1 AND 14),
  interets TEXT[] NOT NULL,
  style_voyage TEXT NOT NULL,
  periode TEXT NOT NULL,
  profil_voyageur TEXT NOT NULL,
  budget TEXT NOT NULL,
  experience_van BOOLEAN NOT NULL DEFAULT false,
  itineraire_json JSONB,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'error')),
  created_at TIMESTAMPTZ DEFAULT now(),
  sent_at TIMESTAMPTZ
);

-- RLS : lecture publique désactivée, accès admin via service_role uniquement
ALTER TABLE road_trip_requests ENABLE ROW LEVEL SECURITY;

-- Index pour performance
CREATE INDEX idx_road_trip_requests_email ON road_trip_requests(email);
CREATE INDEX idx_road_trip_requests_status ON road_trip_requests(status);
CREATE INDEX idx_road_trip_requests_created_at ON road_trip_requests(created_at DESC);
CREATE INDEX idx_road_trip_requests_email_status ON road_trip_requests(email, status, created_at DESC);
```

---

## 5. Email HTML — Template Resend

**Fichier :** `src/emails/road-trip.tsx` (convention Resend, collocated avec les assets email)
**Design :** Branded Vanzon Explorer — fond sombre (#0f172a), accents bleu (#63b3ed), typography Inter.
**Sujet :** `🚐 Ton road trip {duree}j en {region} est prêt, {prenom} !`

**Structure :**
1. Header avec logo Vanzon Explorer
2. Intro personnalisée (prénom + région)
3. Pour chaque jour : titre, 2-3 spots avec description, suggestion camping
4. Section "Conseils pratiques van" (adaptés `experience_van`)
5. Footer CTA : `"Louer un van Vanzon Explorer"` → `https://vanzonexplorer.com/location`
6. **Lien désabonnement RGPD** : `https://vanzonexplorer.com/unsubscribe?email={encodedEmail}` — route simple `/unsubscribe` qui ajoute l'email à une table `email_unsubscribes` dans Supabase et affiche une page de confirmation. L'API `/api/road-trip/generate` vérifie cette table avant d'envoyer.

---

## 6. Admin Dashboard — `/admin/road-trips`

**Fichier :** `src/app/admin/(protected)/road-trips/page.tsx`
**Auth :** Clerk + vérification email admin (pattern existant)
**Data fetching :** Server Component avec `createSupabaseAdmin()`, pagination 50 résultats par page, tri par `created_at DESC`.

### Fonctionnalités
- **Stats** (3 cards en haut) : Total demandes, Envoyés aujourd'hui, Taux de succès
- **Tableau paginé** : colonnes prénom, email, région, durée, profil, budget, status (badge coloré), date
- **Filtres** : par status (pending/sent/error), par région (input texte), par date (date picker)
- **Pagination** : 50 rows/page, paramètre URL `?page=1`
- **Aperçu** : clic sur une ligne → modal avec itinéraire_json formaté (syntaxe JSON highlight)
- **Export CSV** : bouton télécharge les emails + prénoms + régions (pas les itinéraires)

### Intégration nav admin
Ajouter **"Road Trips 🗺️"** dans la sidebar admin existante.

---

## 7. Dépendances & variables d'environnement

### npm install requis
```bash
npm install resend
```

### Variables d'environnement
```env
RESEND_API_KEY=          # Nouveau — créer compte sur resend.com
TAVILY_API_KEY=          # Déjà présent
GROQ_API_KEY=            # Déjà présent
```

Ajouter `RESEND_API_KEY` dans `.env.local` et dans les secrets Vercel.

---

## 8. Stratégie SEO & Marketing

### Court terme (page principale)
- Page `/road-trip-personnalise` optimisée pour "road trip van France"
- Partage sur Instagram/TikTok : démo du formulaire → résultat email
- FloatingCTA sur `/road-trip-personnalise` (voir section 1)

### Moyen terme (contenu)
- Articles blog générés : "Road trip van en Bretagne", "Itinéraire van Alpes 7 jours", etc.
- Ces articles linkent vers le générateur avec `?region=Bretagne` pré-rempli

### Long terme (pages régions)
- Pages statiques `/road-trip-van-bretagne`, `/road-trip-van-provence`, etc.
- Chaque page cible la région + inclut le wizard pré-rempli

---

## 9. Fichiers à créer / modifier

### Nouveaux fichiers
- `src/app/(site)/road-trip-personnalise/page.tsx`
- `src/app/(site)/road-trip-personnalise/RoadTripWizard.tsx`
- `src/app/api/road-trip/generate/route.ts`
- `src/app/(site)/unsubscribe/page.tsx` + `src/app/api/unsubscribe/route.ts`
- `supabase/migrations/YYYYMMDD_email_unsubscribes.sql`
- `src/app/admin/(protected)/road-trips/page.tsx`
- `src/emails/road-trip.tsx`
- `src/lib/road-trip/constants.ts`
- `supabase/migrations/YYYYMMDD_road_trip_requests.sql`

### Fichiers modifiés
- `src/components/layout/Navbar.tsx` — ajouter "Road Trip"
- `src/components/layout/FloatingCTA.tsx` — ajouter cas pathname `/road-trip-personnalise`
- `src/app/admin/(protected)/layout.tsx` (ou sidebar) — ajouter lien "Road Trips"
- `.env.local` — ajouter `RESEND_API_KEY`
- `CLAUDE.md` — documenter la nouvelle feature
- `package.json` — `npm install resend`

---

## 10. Décisions techniques

| Question | Décision | Raison |
|----------|----------|--------|
| Stockage | Supabase | Cohérent avec données structurées existantes |
| Email | Resend | Meilleur DX Next.js, 3k/mois gratuit |
| IA génération | Groq (llama-3.3-70b) | Déjà dans le stack, ultra-rapide |
| Web scraping | Tavily | Déjà dans le stack (prospection) |
| Auth | Publique | Capture d'email = pas besoin de login |
| Processing | Synchrone | Groq < 5s, Tavily < 3s, maxDuration = 60 |
| Rate limiting | Vercel Edge Middleware (in-memory, best-effort) | Natif v1 — pas de garantie cross-région, suffisant pour lead capture |
| Déduplication | Supabase query pre-insert | Simple, fiable, 0 dépendance |
| Groq JSON fail | 1 retry temperature=0 | Évite erreurs silencieuses |
| Email template | `src/emails/` | Convention Resend standard |
| RGPD unsubscribe | Table `email_unsubscribes` + page dédiée | Conformité légale minimale |
