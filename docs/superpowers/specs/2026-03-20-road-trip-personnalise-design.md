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
                                    ├── Supabase (save + status)
                                    ├── Tavily (scrape spots)
                                    ├── Groq (génère itinéraire)
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
4. **Section témoignages** (optionnel v1 — placeholder)
5. **CTA secondaire** — lien vers `/location`

### SEO
- `<title>` : `Crée ton road trip en van personnalisé | Vanzon Explorer`
- `<meta description>` : `Génère gratuitement ton itinéraire road trip en van sur mesure. Spots, activités, camping selon tes envies et ta destination en France.`
- Schema.org : `WebApplication` avec `applicationCategory: "TravelApplication"`
- H1 : `Ton road trip en van sur mesure, partout en France`
- Ciblage mots-clés : "road trip van France", "itinéraire van personnalisé", "road trip van [région]"

### Navigation
Ajouter **"Road Trip"** dans `src/components/layout/Navbar.tsx` entre "Pays Basque" et "Articles".

---

## 2. Wizard — Formulaire 4 étapes

Implémenté comme Client Component (`'use client'`) avec `react-hook-form` + Zod, animations Framer Motion entre étapes, barre de progression.

### Étape 1 — "Ton van trip"
| Champ | Type | Validation |
|-------|------|------------|
| `prenom` | text input | requis, min 2 chars |
| `email` | email input | requis, format email |
| `region` | text input avec suggestions | requis — libre (ex: "Bretagne", "Alpes", "Côte d'Azur") |
| `duree` | select (1 à 14 jours) | requis |

### Étape 2 — "Tes envies"
| Champ | Type | Options |
|-------|------|---------|
| `interets` | checkboxes multi-sélection | Nature & randonnée, Plages & surf, Culture & patrimoine, Gastronomie locale, Sports & aventure, Bien-être & détente, Vie nocturne & festivals |
| `style_voyage` | radio cards | Rythme lent (2-3 stops), Explorer (max de spots), Aventure (off-road & nature) |
| `periode` | select mois | Janvier → Décembre |

### Étape 3 — "Ton profil"
| Champ | Type | Options |
|-------|------|---------|
| `profil_voyageur` | radio cards avec icônes | Solo 🧍, En couple 💑, Famille 👨‍👩‍👧, Entre amis 👥 |
| `budget` | radio cards | Économique (camping gratuit), Confort (aires équipées), Premium (spots premium) |
| `experience_van` | toggle | Première fois / Habitué |

### Étape 4 — "Confirmation"
- Résumé visuel de la demande (cards recap)
- Bouton CTA : `"Générer mon road trip 🚐"`
- Après soumission : animation de succès + message *"Ton road trip arrive dans ta boîte mail !"*

---

## 3. API Route — `/api/road-trip/generate`

**Fichier :** `src/app/api/road-trip/generate/route.ts`
**Méthode :** POST
**Auth :** Publique (pas de Clerk requis)
**Timeout Vercel :** 60s (Pro plan)

### Schéma de validation Zod
```typescript
const RoadTripSchema = z.object({
  prenom: z.string().min(2),
  email: z.string().email(),
  region: z.string().min(2),
  duree: z.number().int().min(1).max(14),
  interets: z.array(z.string()).min(1),
  style_voyage: z.enum(['lent', 'explorer', 'aventure']),
  periode: z.string(),
  profil_voyageur: z.enum(['solo', 'couple', 'famille', 'amis']),
  budget: z.enum(['economique', 'confort', 'premium']),
  experience_van: z.boolean(),
})
```

### Pipeline de génération

**Étape 1 — Sauvegarde Supabase**
```sql
INSERT INTO road_trip_requests (email, prenom, region, duree, interets, style_voyage, periode, profil_voyageur, budget, experience_van, status)
VALUES (..., 'pending')
RETURNING id
```

**Étape 2 — Tavily search**
Requête : `"road trip van {region} France spots {interets.join(' ')} {periode}"`
Récupère 5-8 résultats avec extraits de contenu sur les spots, activités, aires de camping.

**Étape 3 — Groq generation**
Modèle : `llama-3.3-70b-versatile`
Prompt système : génération d'un itinéraire structuré JSON avec jours, spots géolocalisés, tips van, lieux de camping selon budget.
Format de sortie : JSON structuré (`{ intro, jours: [{jour, titre, spots, camping, tips}], conseils_pratiques }`)

**Étape 4 — Resend email**
Template HTML branded Vanzon Explorer. Voir section Email ci-dessous.
`from: "Vanzon Explorer <roadtrip@vanzonexplorer.com>"`

**Étape 5 — Update Supabase**
```sql
UPDATE road_trip_requests SET status = 'sent', itineraire_json = {...}, sent_at = now()
WHERE id = {id}
```

### Réponse API
```json
{ "success": true, "message": "Road trip envoyé !" }
```

---

## 4. Supabase — Table `road_trip_requests`

```sql
CREATE TABLE road_trip_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prenom TEXT NOT NULL,
  email TEXT NOT NULL,
  region TEXT NOT NULL,
  duree INTEGER NOT NULL,
  interets TEXT[] NOT NULL,
  style_voyage TEXT NOT NULL,
  periode TEXT NOT NULL,
  profil_voyageur TEXT NOT NULL,
  budget TEXT NOT NULL,
  experience_van BOOLEAN NOT NULL DEFAULT false,
  itineraire_json JSONB,
  status TEXT NOT NULL DEFAULT 'pending', -- pending | sent | error
  created_at TIMESTAMPTZ DEFAULT now(),
  sent_at TIMESTAMPTZ
);

-- RLS : lecture publique désactivée, accès admin via service_role uniquement
ALTER TABLE road_trip_requests ENABLE ROW LEVEL SECURITY;
```

---

## 5. Email HTML — Template Resend

**Design :** Branded Vanzon Explorer — fond sombre (#0f172a), accents bleu (#63b3ed), typography Inter.
**Sujet :** `🚐 Ton road trip {duree}j en {region} est prêt, {prenom} !`

**Structure :**
1. Header avec logo Vanzon Explorer
2. Intro personnalisée (prénom + région)
3. Pour chaque jour : titre, 2-3 spots avec description, suggestion camping
4. Section "Conseils pratiques van" (adaptés expérience_van)
5. Footer CTA : `"Louer un van Vanzon Explorer"` → `https://vanzonexplorer.com/location`
6. Lien désabonnement (conformité RGPD)

---

## 6. Admin Dashboard — `/admin/road-trips`

**Fichier :** `src/app/admin/(protected)/road-trips/page.tsx`
**Auth :** Clerk + vérification email admin (pattern existant)

### Fonctionnalités
- **Tableau** : colonnes prénom, email, région, durée, profil, budget, status (badge coloré), date
- **Filtres** : par status (pending/sent/error), par région, par date
- **Stats en haut** : Total demandes, Envoyés aujourd'hui, Taux de succès
- **Aperçu** : clic sur une ligne → modal avec itinéraire_json formaté
- **Export CSV** : bouton pour exporter les emails

### Intégration nav admin
Ajouter "Road Trips" dans la sidebar admin existante avec une icône 🗺️.

---

## 7. Variables d'environnement requises

```env
RESEND_API_KEY=          # Nouveau — Resend pour envoi email
TAVILY_API_KEY=          # Déjà présent (prospection)
GROQ_API_KEY=            # Déjà présent (prospection)
```

---

## 8. Stratégie SEO & Marketing

### Court terme (page principale)
- Page `/road-trip-personnalise` optimisée pour "road trip van France"
- Partage sur Instagram/TikTok : démo du formulaire → résultat email
- CTA dans FloatingCTA sur les pages articles catégorie "road trip"

### Moyen terme (contenu)
- Articles blog générés : "Road trip van en Bretagne", "Itinéraire van Alpes 7 jours", etc.
- Ces articles linkent vers le générateur → SEO long tail + conversion

### Long terme (pages régions)
- Pages statiques `/road-trip-van-bretagne`, `/road-trip-van-provence`, etc.
- Chaque page cible la région + inclut le wizard pré-rempli avec la région

---

## 9. Fichiers à créer / modifier

### Nouveaux fichiers
- `src/app/(site)/road-trip-personnalise/page.tsx` — page principale
- `src/app/(site)/road-trip-personnalise/RoadTripWizard.tsx` — client component wizard
- `src/app/api/road-trip/generate/route.ts` — API génération
- `src/app/admin/(protected)/road-trips/page.tsx` — admin view
- `src/lib/email/road-trip-template.tsx` — template email Resend
- `supabase/migrations/XXXXXX_road_trip_requests.sql` — migration

### Fichiers modifiés
- `src/components/layout/Navbar.tsx` — ajouter "Road Trip" dans le menu
- `src/app/admin/(protected)/layout.tsx` (ou sidebar) — ajouter lien admin

---

## Décisions techniques

| Question | Décision | Raison |
|----------|----------|--------|
| Stockage | Supabase | Cohérent avec données structurées existantes |
| Email | Resend | Meilleur DX Next.js, 3k/mois gratuit |
| IA génération | Groq (llama-3.3-70b) | Déjà dans le stack, ultra-rapide |
| Web scraping | Tavily | Déjà dans le stack (prospection) |
| Auth | Publique | Capture d'email = pas besoin de login |
| Processing | Synchrone | Groq < 5s, Tavily < 3s, total < 15s (Vercel Pro OK) |
