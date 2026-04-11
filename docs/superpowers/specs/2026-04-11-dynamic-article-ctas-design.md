# Dynamic Article CTAs — Design Spec

**Date** : 2026-04-11
**Auteur** : Jules + Claude (brainstorming session)
**Statut** : Design approuvé — en attente du plan d'implémentation

---

## 1. Contexte & Problème

Actuellement, chaque article de blog Vanzon Explorer contient trois types de call-to-action injectés automatiquement :

- **`SectionCTA` in-body** (`src/components/article/SectionCTA.tsx`) : cycleur statique qui injecte alternativement 2 CTAs codés en dur (Location + Achat), **toutes les 2 sections H2**, **sans aucune intelligence** sur le sujet de l'article.
- **`FloatingCTA` mobile** (`src/components/layout/FloatingCTA.tsx`) : déjà semi-dynamique via un mapping `ARTICLE_CATEGORY_CTA[category]` basé sur la `category` Sanity — mais ce mapping est grossier (5 catégories → 5 CTAs).
- **Footer CTA hardcodé** : bloc statique « 🚐 Louer un van au Pays Basque » + « ← Tous les articles » affiché en bas de chaque article, quelle que soit la nature du contenu.
- **`RoadTripCTA`** (`src/components/ui/RoadTripCTA.tsx`) : composant doublon affiché systématiquement en bas de chaque article.

### Problème concret

Un article comme `cosy-vans-location-van-ile-de-france` (backlink exchange avec un partenaire en Île-de-France) reçoit aujourd'hui 3 à 5 CTAs « Louer un van au Pays Basque » — ce qui est incohérent : le lecteur vient d'être présenté à un concurrent francilien, on ne va pas lui pousser un van basque dans la foulée. À l'inverse, un article business type *« Revenus Yescapa : chiffres réels »* devrait pousser la **Van Business Academy**, pas la location.

**L'objectif** : des CTAs qui s'adaptent au sujet de l'article, et **aucun CTA** quand aucun sujet Vanzon n'est pertinent.

### Contraintes

- Le système doit être **extensible** : chaque CTA doit avoir son propre « environnement » (composant isolé) pour que l'évolution future (ex. : ajouter des cartes de vans avec images dans le CTA location) ne demande de toucher qu'un seul fichier.
- L'intelligence doit être **robuste** : auto par défaut, mais avec la possibilité de forcer manuellement un override pour les cas spéciaux.
- Le flux de publication existant (`/api/admin/seo/drafts/[id]/publish`) ne doit pas être bloqué en cas d'échec IA.
- Les ~40 articles déjà publiés doivent pouvoir être rattrapés automatiquement (one-shot).

---

## 2. Décisions de design

### 2.1 Catalogue de CTAs

**5 types** au lancement :

| `type` | Intention | Cible | Composant |
|---|---|---|---|
| `location` | Louer nos vans au Pays Basque | `/location` | `LocationCTA.tsx` |
| `formation` | Rejoindre la Van Business Academy | Calendly (via `CalendlyModal`) | `FormationCTA.tsx` |
| `road-trip` | Générer un itinéraire personnalisé IA | `/road-trip-personnalise` | `RoadTripCTA.tsx` |
| `achat` | Achat / accompagnement van | `/achat` | `AchatCTA.tsx` |
| `none` | Aucun CTA (article hors-sujet) | — | (le dispatcher retourne `null`) |

### 2.2 Méthode de détection : IA + override manuel

- **Par défaut** : le champ `ctaType` d'un nouveau document est à `auto`. À la publication, un appel Groq classe l'article et écrit le résultat dans `ctaResolved`.
- **Override** : l'utilisateur peut choisir manuellement une des 5 valeurs dans l'éditeur de brouillons admin OU directement dans Sanity Studio. Dans ce cas, la classification IA est bypassée.
- **Fallback sûr** : si la classification échoue (rate limit, timeout, JSON invalide), `ctaResolved = "none"`. La publication n'est jamais bloquée pour un échec de classification.

### 2.3 Stockage : deux champs Sanity

Sur le schéma `article` :

```ts
{
  name: "ctaType",
  title: "Type de CTA (choix)",
  type: "string",
  options: {
    list: [
      { title: "Auto (détection IA)", value: "auto" },
      { title: "Location van Pays Basque", value: "location" },
      { title: "Formation Van Business Academy", value: "formation" },
      { title: "Road trip personnalisé IA", value: "road-trip" },
      { title: "Accompagnement achat van", value: "achat" },
      { title: "Aucun CTA", value: "none" },
    ],
    layout: "dropdown",
  },
  initialValue: "auto",
  description: "Choix humain. 'auto' = l'IA décide au moment de la publication.",
},
{
  name: "ctaResolved",
  title: "CTA résolu (lecture seule)",
  type: "string",
  readOnly: true,
  description: "Valeur effectivement affichée. Copié de ctaType sauf si ctaType = auto (auquel cas rempli par l'IA au publish).",
}
```

**Pourquoi deux champs** :
- `ctaType` conserve l'intention humaine (« je veux laisser l'IA décider »).
- `ctaResolved` est **la seule source de vérité au runtime** pour le front → 1 seul lookup, pas de logique conditionnelle.
- On peut voir dans Studio ce que l'IA a décidé, et corriger en un clic en repassant `ctaType` à une valeur non-`auto`.

### 2.4 Classification Groq

**Nouveau fichier** : `src/lib/article-cta/classify.ts`

```ts
export type CtaType = "location" | "formation" | "road-trip" | "achat" | "none";

export interface ClassifyInput {
  title: string;
  excerpt: string;
  firstParagraphs: string; // ~500 premiers mots extraits du body Portable Text
  category: string;        // catégorie Sanity existante (hint)
}

export interface ClassifyResult {
  type: CtaType;
  confidence: number;  // 0-1, log uniquement
  reasoning: string;   // 1 phrase, log uniquement
}

export async function classifyArticleCTA(input: ClassifyInput): Promise<ClassifyResult>;
```

**Modèle** : `llama-3.3-70b-versatile` via Groq (déjà dans le stack, ~200 ms, < 0,0001 € / appel).

**Prompt système** (reproduit in extenso pour garantir la reproductibilité) :

```
Tu classes un article de blog Vanzon Explorer (van aménagé, Pays Basque) pour
décider quel call-to-action y injecter. Réponds UNIQUEMENT en JSON :
{ "type": "...", "confidence": 0-1, "reasoning": "..." }

Valeurs possibles pour "type" :

- "location"  : l'article donne envie de LOUER un van (road trips, destinations
                Pays Basque, spots, vanlife découverte, week-end en van, surf,
                itinéraires, guides pratiques pour voyageurs qui cherchent à
                louer).

- "formation" : l'article parle de RENTABILISER un van, business, Yescapa,
                revenus, entrepreneuriat, devenir propriétaire loueur, aménager
                pour la location, VASP, homologation, chiffres de rentabilité.

- "road-trip" : l'article est un GUIDE D'ITINÉRAIRE spécifique (ex. "road trip
                au Pays Basque en 7 jours", "itinéraire côte atlantique").
                Lecteur qui cherche à planifier → on propose notre générateur IA.

- "achat"     : l'article parle d'ACHETER un van d'occasion, choisir un modèle,
                inspection mécanique, aménagement DIY (hors business — orienté
                "je veux le mien").

- "none"      : article hors-sujet pour nous (partenariat backlink, actu non
                liée, mention d'une autre marque, article purement informatif
                sans intention commerciale exploitable, contenu sponsorisé).

Règles de priorité (en cas d'ambiguïté) :
1. Si l'article parle DE RENTABILISER / GAGNER DE L'ARGENT avec un van → formation
2. Si c'est un itinéraire précis avec étapes → road-trip
3. Si c'est un guide pour loueurs potentiels → location
4. Si c'est un guide d'achat/aménagement perso → achat
5. Si rien ne colle → none (mieux vaut pas de CTA qu'un CTA bancal)
```

**Parsing** : `JSON.parse` strict, avec validation de `type` contre la liste des 5 valeurs. Toute valeur inconnue → fallback `none`.

**Observabilité** : chaque classification log une ligne `[CTA] <slug>: <type> (<confidence>) — <reasoning>` dans la console (visible en Vercel runtime logs). Pas de notification Telegram (décidé lors du brainstorming).

### 2.5 Intégration au flux de publication

Fichier touché : `src/app/api/admin/seo/drafts/[id]/publish/route.ts`

```ts
// Après récupération du draft, avant la création Sanity :
const draftCtaType = draft.cta_type ?? "auto"; // nouveau champ Supabase
let ctaResolved: CtaType = "none"; // safe fallback

if (draftCtaType === "auto") {
  try {
    const first500 = extractFirst500WordsFromHtml(draft.html_content);
    const result = await classifyArticleCTA({
      title: draft.title,
      excerpt: draft.excerpt ?? "",
      firstParagraphs: first500,
      category: category, // déjà calculé plus haut dans la route
    });
    ctaResolved = result.type;
    console.log(`[CTA] ${slug}: ${result.type} (${result.confidence}) — ${result.reasoning}`);
  } catch (err) {
    console.warn(`[CTA] classification failed for ${slug}: ${(err as Error).message}`);
    // ctaResolved reste "none"
  }
} else {
  ctaResolved = draftCtaType;
}

// Puis dans le document Sanity à créer :
const sanityDoc = {
  _type: "article",
  // ... champs existants
  ctaType: draftCtaType,
  ctaResolved,
};
```

### 2.6 Composants front

**Arborescence** :

```
src/components/article/ctas/
├── types.ts         ← export type CtaType (ré-exporte depuis lib/article-cta/classify.ts)
├── index.tsx        ← <ArticleCTA type={...} /> — dispatcher
├── LocationCTA.tsx
├── FormationCTA.tsx
├── RoadTripCTA.tsx  ← nouveau, remplace src/components/ui/RoadTripCTA.tsx
└── AchatCTA.tsx
```

**Dispatcher** (`index.tsx`) :

```tsx
"use client";
// Note : RoadTripCTA et FormationCTA ont besoin de Client Components
// à cause de CalendlyModal et du wizard, donc le dispatcher est en client.

import LocationCTA from "./LocationCTA";
import FormationCTA from "./FormationCTA";
import RoadTripCTA from "./RoadTripCTA";
import AchatCTA from "./AchatCTA";
import type { CtaType } from "./types";

export function ArticleCTA({ type }: { type: CtaType | null | undefined }) {
  if (!type || type === "none") return null;
  switch (type) {
    case "location":  return <LocationCTA />;
    case "formation": return <FormationCTA />;
    case "road-trip": return <RoadTripCTA />;
    case "achat":     return <AchatCTA />;
    default:          return null;
  }
}

export type { CtaType } from "./types";
```

**Anatomie commune de chaque composant CTA** (démonstration avec `LocationCTA`) :

```tsx
import Link from "next/link";

export default function LocationCTA() {
  return (
    <section
      aria-label="Louer un van au Pays Basque"
      className="article-cta article-cta--location my-12 p-6 rounded-2xl
                 border border-blue-100 bg-gradient-to-br from-blue-50 to-sky-50/50
                 flex flex-col sm:flex-row items-center gap-5"
    >
      <span className="text-4xl flex-shrink-0" aria-hidden>🚐</span>
      <div className="flex-1 text-center sm:text-left">
        <p className="text-xs font-bold uppercase tracking-widest text-blue-600 mb-1">
          Envie de vivre l'expérience ?
        </p>
        <h3 className="text-xl font-bold text-slate-900 mb-1.5">
          Louez Yoni ou Xalbat pour votre prochain road trip
        </h3>
        <p className="text-sm text-slate-600 mb-4">
          Deux vans aménagés au départ de Cambo-les-Bains, à 30 min de Biarritz.
          Dès 65€/nuit en basse saison, assurance et kit surf inclus.
        </p>
        <Link href="/location" className="btn-primary btn-shine inline-flex items-center gap-2 text-sm">
          Voir les vans disponibles →
        </Link>
      </div>
    </section>
  );
}
```

**Conventions partagées** :
- Classe `article-cta` + modifier `article-cta--<type>` sur l'élément racine → hook CSS pour future customisation transversale.
- Balise sémantique `<section>` avec `aria-label` approprié (A11Y).
- Visuel cohérent (border-radius, padding, gap) mais **chaque composant reste 100 % libre** d'évoluer vers un format riche (carrousel de vans, carte, carte embarquée…) sans impacter les autres.
- Chaque composant est **auto-suffisant** : pas de prop, pas de dépendance externe autre que Next.js/Link/CalendlyModal. Plus facile à tester, à isoler, à dupliquer.

**Cas spéciaux** :
- `FormationCTA` wrappe son bouton dans `<CalendlyModal asChild>` (même pattern que `FloatingCTA` existant).
- `RoadTripCTA` pointe vers `/road-trip-personnalise#wizard` avec ancre pour scroll vers le wizard.
- `AchatCTA` pointe vers `/achat` (cible par défaut — modifiable en 1 ligne).

### 2.7 Intégration dans `ArticleDetailPage`

Fichier touché : `src/app/(site)/articles/[slug]/page.tsx`

**Changements** :

1. **Query** : `getArticleBySlugQuery` dans `src/lib/sanity/queries.ts` ajoute `ctaType` et `ctaResolved` à la projection.

2. **Type** : le type `ArticleDoc` local dans `page.tsx` ajoute `ctaType?: string; ctaResolved?: string;`.

3. **Insertion milieu** : remplacer la logique actuelle :
   ```tsx
   {sections.map((section, i) => (
     <div key={i}>
       {renderBlocks(section, portableComponents)}
       {i % 2 === 1 && i < sections.length - 2 && <SectionCTA index={Math.floor(i / 2)} />}
     </div>
   ))}
   ```
   par :
   ```tsx
   const midSectionIdx = Math.max(0, Math.floor(sections.length / 2) - 1);
   // ...
   {sections.map((section, i) => (
     <div key={i}>
       {renderBlocks(section, portableComponents)}
       {i === midSectionIdx && (
         <ArticleCTA type={article.ctaResolved as CtaType | undefined} />
       )}
     </div>
   ))}
   ```

4. **Suppressions** dans `page.tsx` :
   - `import { SectionCTA } from "@/components/article/SectionCTA"` → retiré
   - `import RoadTripCTA from "@/components/ui/RoadTripCTA"` → retiré
   - `<RoadTripCTA />` en bas du `<article>` → retiré
   - Bloc Footer CTA hardcodé (`🚐 Louer un van au Pays Basque` + `Tous les articles`) → remplacé par `<ArticleFooter type={article.ctaResolved} />`.

5. **Fichiers supprimés du filesystem** :
   - `src/components/article/SectionCTA.tsx`
   - `src/components/ui/RoadTripCTA.tsx` (le nouveau vit dans `src/components/article/ctas/RoadTripCTA.tsx`)

### 2.8 Nouveau composant `ArticleFooter`

Fichier : `src/components/article/ArticleFooter.tsx`

```tsx
import Link from "next/link";
import { ArticleCTA } from "./ctas";
import type { CtaType } from "./ctas/types";

export function ArticleFooter({ type }: { type: CtaType | undefined }) {
  const showCTA = type && type !== "none";
  return (
    <div className="mt-12 pt-10 border-t border-slate-100">
      {showCTA && (
        <>
          <p className="text-sm font-semibold text-slate-500 mb-5">
            Envie d'aller plus loin&nbsp;?
          </p>
          <ArticleCTA type={type} />
        </>
      )}
      <Link
        href="/articles"
        className="btn-ghost inline-flex items-center gap-2 text-sm mt-4"
      >
        ← Tous les articles
      </Link>
    </div>
  );
}
```

→ Si `type === "none"` ou absent, on n'affiche **que** le lien « Tous les articles ». Pas de pub forcée.

### 2.9 Unification avec `FloatingCTA` mobile

Fichier touché : `src/components/layout/FloatingCTA.tsx`

**Changements** :

- Le `ArticleCategoryContext` transporte désormais **deux champs** : `category` (existant, conservé pour compat) et `ctaType` (nouveau).
- `ArticleCategorySync` push les deux.
- Dans `FloatingCTA`, le mapping `ARTICLE_CATEGORY_CTA[category]` est **remplacé** par un nouveau mapping `CTA_TYPE_TO_FLOATING[ctaType]` qui couvre les 4 types actifs :
  ```ts
  const CTA_TYPE_TO_FLOATING: Record<Exclude<CtaType, "none">, FloatingConfig> = {
    location:    { btnLabel: "Louer un van au Pays Basque", href: "/location",                ...PALETTE.blue  },
    formation:   { btnLabel: "Réserver un appel",           href: "#", calendly: true,         ...PALETTE.gold  },
    "road-trip": { btnLabel: "Générer mon itinéraire",      href: "/road-trip-personnalise",   ...PALETTE.black },
    achat:       { btnLabel: "Trouver mon van",             href: "/achat",                    ...PALETTE.slate },
  };
  ```
- Si `isArticlePage && ctaType === "none"` → `return null` (pas de FloatingCTA sur article hors-sujet).
- Le fallback `getCTAConfig(pathname)` pour pages non-articles est conservé tel quel.

Fichier touché : `src/lib/contexts/ArticleCategoryContext.tsx`
Fichier touché : `src/app/(site)/articles/[slug]/_components/ArticleCategorySync.tsx`

### 2.10 Override dans l'éditeur admin de brouillons

Fichier touché : `src/app/admin/(protected)/seo/editeur/[id]/_components/ArticleEditorClient.tsx`

Ajouter un bloc **au-dessus** du bouton « Publier » :

```
┌─────────────────────────────────────────────┐
│  Call-to-action in-article                  │
│  ┌─────────────────────────────────────┐    │
│  │  🤖 Auto (détection IA)        ▼    │    │
│  └─────────────────────────────────────┘    │
│  Options : Auto · Location · Formation ·    │
│            Road Trip · Achat · Aucun        │
└─────────────────────────────────────────────┘
```

- Contrôle `<select>` React standard, state local, auto-save via le même mécanisme que `title` / `excerpt` (debouncer existant).
- Sauvegardé dans la colonne `draft_articles.cta_type` (nouvelle — voir migration ci-dessous).
- Lu par la route publish.

**Migration Supabase** : `supabase/migrations/YYYYMMDDHHMMSS_draft_articles_cta_type.sql`

```sql
ALTER TABLE draft_articles
  ADD COLUMN cta_type TEXT DEFAULT 'auto'
    CHECK (cta_type IN ('auto','location','formation','road-trip','achat','none'));
```

### 2.11 Script de rattrapage pour les articles existants

Fichier : `scripts/agents/backfill-article-ctas.ts` (one-shot, pas registré dans `registry.json`)

**Logique** :

```
1. Fetch tous les articles Sanity (query : *[_type == "article" && !defined(ctaType)])
2. Pour chaque article :
   a. Extraire les 500 premiers mots du Portable Text (body)
   b. Appeler classifyArticleCTA(title, excerpt, first500, category)
   c. Patcher Sanity : set({ ctaType: "auto", ctaResolved: result.type })
   d. Log : slug → type (confidence, reasoning)
3. Rate limit : await sleep(1000) entre chaque article (safe pour Groq free tier)
4. Récap final :
   - X articles classés
   - Y en "none"
   - Z échecs
```

**Caractéristiques** :
- **Idempotent** : le filtre `!defined(ctaType)` garantit qu'on ne re-traite jamais un article déjà taggé.
- **Exécution manuelle** : `npx tsx scripts/agents/backfill-article-ctas.ts`
- **Exécution post-merge** : **automatique** (décidé au brainstorming) — à lancer une fois immédiatement après le déploiement du code pour rattraper l'historique.

### 2.12 Fichiers modifiés/créés/supprimés (récap)

#### Créés

| Chemin | Rôle |
|---|---|
| `src/lib/article-cta/classify.ts` | Classification Groq + type `CtaType` canonique |
| `src/components/article/ctas/types.ts` | Ré-export `CtaType` pour le front |
| `src/components/article/ctas/index.tsx` | Dispatcher `<ArticleCTA>` |
| `src/components/article/ctas/LocationCTA.tsx` | CTA location |
| `src/components/article/ctas/FormationCTA.tsx` | CTA VBA (Calendly) |
| `src/components/article/ctas/RoadTripCTA.tsx` | CTA générateur road trip IA |
| `src/components/article/ctas/AchatCTA.tsx` | CTA achat van |
| `src/components/article/ArticleFooter.tsx` | Footer dynamique |
| `scripts/agents/backfill-article-ctas.ts` | Script de rattrapage one-shot |
| `supabase/migrations/YYYYMMDDHHMMSS_draft_articles_cta_type.sql` | Ajout colonne |

#### Modifiés

| Chemin | Changement |
|---|---|
| `sanity/schemas/article.ts` | +2 champs `ctaType`, `ctaResolved` |
| `src/lib/sanity/queries.ts` | `getArticleBySlugQuery` ajoute les 2 nouveaux champs |
| `src/lib/contexts/ArticleCategoryContext.tsx` | +`ctaType` dans le Context |
| `src/app/(site)/articles/[slug]/_components/ArticleCategorySync.tsx` | Push `ctaType` |
| `src/app/(site)/articles/[slug]/page.tsx` | Boucle simplifiée + suppression SectionCTA/RoadTripCTA + Footer dynamique |
| `src/components/layout/FloatingCTA.tsx` | Mapping basé sur `ctaType` au lieu de `category` |
| `src/app/admin/(protected)/seo/editeur/[id]/_components/ArticleEditorClient.tsx` | +select CTA + auto-save |
| `src/app/api/admin/seo/drafts/[id]/route.ts` | Lecture/écriture de `cta_type` |
| `src/app/api/admin/seo/drafts/[id]/publish/route.ts` | Appel classification + écriture Sanity |

#### Supprimés

| Chemin | Raison |
|---|---|
| `src/components/article/SectionCTA.tsx` | Remplacé par le système dynamique |
| `src/components/ui/RoadTripCTA.tsx` | Remplacé par `src/components/article/ctas/RoadTripCTA.tsx` |

---

## 3. Scénarios de bout-en-bout

### Scénario A — Nouvel article business (IA → formation)

1. Jules rédige un article « Combien gagne-t-on avec un van sur Yescapa ? » dans `/admin/seo/editeur/[id]`.
2. Le champ `ctaType` de l'éditeur reste sur `auto` (défaut).
3. Il clique « Publier ».
4. La route `publish` lit `cta_type = "auto"` depuis `draft_articles`, appelle `classifyArticleCTA(...)`.
5. Groq répond : `{ type: "formation", confidence: 0.92, reasoning: "Article orienté rentabilité et revenus Yescapa" }`.
6. Le doc Sanity est créé avec `ctaType: "auto", ctaResolved: "formation"`.
7. L'article publie — côté lecteur : un `FormationCTA` (doré, bouton Calendly) apparaît au milieu du corps, un `FormationCTA` apparaît en footer, et le `FloatingCTA` mobile pousse « Réserver un appel ».

### Scénario B — Article backlink Cosy Vans (IA → none)

1. Jules édite l'article Cosy Vans dans l'éditeur admin.
2. Il laisse `ctaType = auto` (pour tester l'IA).
3. À la publication, Groq répond : `{ type: "none", reasoning: "Article de partenariat backlink présentant une marque concurrente ; aucune intention commerciale Vanzon exploitable" }`.
4. `ctaResolved = "none"`.
5. Côté lecteur : **aucun CTA in-body**, le `ArticleFooter` n'affiche que le lien « Tous les articles », le `FloatingCTA` mobile est caché.

### Scénario C — Override manuel

1. L'IA classe un article en `location` mais Jules pense que `formation` serait mieux.
2. Il ouvre l'éditeur, change le select sur `Formation`, clique « Publier ».
3. `cta_type = "formation"` dans Supabase → la route publish bypasse Groq et écrit direct `ctaType: "formation", ctaResolved: "formation"` sur Sanity.

### Scénario D — Rattrapage de l'historique

1. Après merge du code, Jules (ou l'automatisation post-déploiement) exécute `npx tsx scripts/agents/backfill-article-ctas.ts`.
2. Le script itère sur les ~40 articles publiés sans `ctaType`.
3. Chaque article est classé, patché dans Sanity (rate-limité à 1/s).
4. Après ~40 secondes, tous les articles ont un `ctaType` et un `ctaResolved` cohérent avec leur sujet.

---

## 4. Risques & mitigations

| Risque | Probabilité | Impact | Mitigation |
|---|---|---|---|
| Groq down ou timeout | Faible | Moyen | Fallback silencieux sur `ctaResolved = "none"`. Publication jamais bloquée. Log d'erreur. |
| Groq renvoie un JSON invalide | Faible | Faible | Parser avec try/catch, validation du champ `type` contre l'enum. Fallback `none`. |
| Classification erronée sur un article ambigu | Moyen | Faible | Override manuel disponible dans 2 endroits (éditeur + Studio). Le field `ctaResolved` est visible → détection facile. |
| Modification d'un article existant après publication | Moyen | Faible | `ctaType` persiste, pas de re-classification automatique. Pour reclasser : remettre `ctaType` à `auto` dans Studio, republier. Hook Sanity automatique reporté en V2 (voir section 5). |
| Perte de visibilité sur ce que l'IA a décidé | Faible | Moyen | `ctaResolved` est visible en Studio. Log console à chaque publish. |
| Code duplication entre 5 composants CTA | Faible | Faible | Anatomie commune documentée dans le spec. Si le code diverge trop, introduire un `<CTABase>` en V2. YAGNI pour V1. |
| Backfill qui échoue en cours de route | Faible | Faible | Script idempotent (filtre `!defined(ctaType)`), relançable sans effet de bord. |

---

## 5. Hors scope (V2+)

Ces points sont **intentionnellement repoussés** pour garder la V1 minimale :

- **Cartes de vans avec images** dans `LocationCTA` — le composant est prêt à accueillir cette évolution mais ne l'implémente pas en V1.
- **A/B testing** des messages CTA (variantes aléatoires avec mesure de CTR).
- **Tracking analytics** (events « CTA viewed » / « CTA clicked ») — à brancher quand on aura une lib analytics.
- **Re-classification automatique** quand un article est modifié dans Studio.
- **Hook Sanity webhook** pour classifier à la volée les articles créés directement dans Studio (hors flux `/admin/seo/editeur`).
- **Personnalisation contextuelle** (ex. : afficher un CTA différent selon la saison, le device, le référent) — trop de complexité pour le gain attendu à ce stade.
- **Multi-CTA par article** (ex. : location en milieu + formation en bas). Une seule intention principale par article pour la V1.
- **Notification Telegram au publish avec CTA choisi** — décidé lors du brainstorming : pas besoin.

---

## 6. Validation du design

Design validé par Jules le 2026-04-11 au cours d'une session de brainstorming itérative (cf. historique de conversation Claude Code).

**Prochaine étape** : invocation de `superpowers:writing-plans` pour produire un plan d'implémentation détaillé.
