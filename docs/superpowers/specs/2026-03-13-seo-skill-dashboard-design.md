# Design Spec — Installation claude-seo + Dashboard SEO étendu
Date : 2026-03-13

---

## Objectif

1. Installer le skill `claude-seo` (AgriciDaniel/claude-seo) globalement dans Claude Code — tâche indépendante, sans lien avec le dashboard
2. Étendre le dashboard admin SEO avec 4 nouvelles sections : SEO Technique, Schema Markup, Visibilité IA, Optimisation Images

**Note :** Les deux parties sont indépendantes. L'installation du skill (Partie 1) n'alimente pas le dashboard (Partie 2).

---

## Partie 1 — Installation du skill claude-seo

### Méthode

Exécuter le script d'installation officiel depuis le repo GitHub :

```bash
git clone --depth 1 https://github.com/AgriciDaniel/claude-seo.git /tmp/claude-seo
bash /tmp/claude-seo/install.sh
```

### Résultat attendu

- Fichiers installés dans `~/.claude/skills/seo/` (12 sous-skills)
- Sous-agents installés dans `~/.claude/agents/`
- Environnement Python 3.10+ avec venv dans `~/.claude/skills/seo/.venv`
- Commandes disponibles : `/seo audit`, `/seo page`, `/seo schema`, `/seo geo`, `/seo programmatic`, `/seo hreflang`, `/seo plan`

### Prérequis

- Python 3.10+
- Git

### Vérification avant exécution

Inspecter le contenu de `install.sh` avant de lancer l'installation pour valider l'absence de commandes destructives.

---

## Partie 2 — Nouvelles sections dashboard

### Prérequis : ajout du guard Clerk sur la route PSI existante

La route `/api/admin/psi/route.ts` n'a pas de guard Clerk. **Avant de créer `technical/route.ts`**, ajouter le guard en tête de la route PSI existante :

```ts
const { userId } = await auth();
if (!userId) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
```

Cela protège à la fois le dashboard performance existant et la nouvelle section TechnicalSeo.

### Prérequis : export du helper `dfsPostRaw`

La fonction `dfsPost` dans `src/lib/dataforseo.ts` :
1. Retourne `tasks?.[0]?.result?.[0]` (unwrappé)
2. Throw immédiatement sur tout status_code ≠ 20000

Pour les routes `ai-visibility` (qui doit intercepter le code 40602) et pour les routes `schema`/`images` (qui peuvent utiliser `dfsPost` normalement), voici comment procéder :

- **`schema/route.ts` et `images/route.ts`** : utiliser `dfsPost` normalement. La réponse retournée est déjà `result[0]`, donc mapper en `response.items[0]` (pas `result[0].items[0]`).
- **`ai-visibility/route.ts`** : ajouter et exporter une fonction `dfsPostRaw<T>()` dans `src/lib/dataforseo.ts` qui retourne le body complet sans unwrapping ni throw sur status_code, permettant de lire `tasks[0].status_code` et de gérer le 40602 manuellement.

```ts
// À ajouter dans src/lib/dataforseo.ts
export async function dfsPostRaw<T = unknown>(
  endpoint: string,
  body: unknown
): Promise<T> {
  const res = await fetch(`${DFS_BASE}${endpoint}`, {
    method: "POST",
    headers: {
      Authorization: getAuthHeader(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    next: { revalidate: 3600 },
  });
  if (!res.ok) throw new Error(`DataForSEO HTTP error ${res.status}`);
  return res.json() as Promise<T>;
}
```

### Architecture globale

**Fichiers à créer :**

| Fichier | Rôle |
|---|---|
| `src/app/api/admin/seo/technical/route.ts` | Proxy vers `/api/admin/psi` avec Clerk guard |
| `src/app/api/admin/seo/schema/route.ts` | DataForSEO `on_page_instant_pages` via `dfsPost`, 1 URL/appel |
| `src/app/api/admin/seo/ai-visibility/route.ts` | DataForSEO `ai_opt_llm_ment_*` via `dfsPostRaw` |
| `src/app/api/admin/seo/images/route.ts` | DataForSEO `on_page_instant_pages` via `dfsPost`, images |
| `src/app/admin/(protected)/seo/components/TechnicalSeo.tsx` | Section SEO Technique |
| `src/app/admin/(protected)/seo/components/SchemaMarkup.tsx` | Section Schema Markup |
| `src/app/admin/(protected)/seo/components/AiVisibility.tsx` | Section Visibilité IA |
| `src/app/admin/(protected)/seo/components/ImageOptimization.tsx` | Section Optimisation Images |

**Fichiers modifiés :**
- `src/lib/dataforseo.ts` — ajout de `dfsPostRaw`
- `src/app/api/admin/psi/route.ts` — ajout du guard Clerk
- `src/app/admin/(protected)/seo/SeoClient.tsx` — ajout Row 6 et Row 7

---

### Section A — SEO Technique (temps réel)

**Source de données :** API PageSpeed Insights — déjà intégrée dans le projet à `/api/admin/psi/route.ts`

**Architecture :** `technical/route.ts` appelle directement l'API PSI (duplication minimale de la logique PSI, avec URL fixe et Clerk guard). Pas de proxy vers la route existante pour éviter des appels internes.

**URL analysée :** `https://vanzonexplorer.com/vanzon`

**Données affichées :**
- Scores Lighthouse : Performance, SEO, Accessibility, Best Practices (0-100)
- Core Web Vitals : LCP, CLS, TBT (valeurs affichées + score coloré)

**Route API (`technical/route.ts`) :**
- URL fixe, pas de query params → `export const revalidate = 3600`
- Guard Clerk `auth()` en tête
- Retourne le même shape que `/api/admin/psi` : `{ scores, vitals, opportunities, diagnostics }`

**Composant `TechnicalSeo.tsx` :**
- `useSWR("/api/admin/seo/technical", fetcher, { refreshInterval: 3600000 })`
- Grid 2x2 des scores Lighthouse avec jauges colorées
- Section Core Web Vitals avec badges verts/orange/rouges

---

### Section B — Schema Markup (temps réel)

**Source de données :** DataForSEO `on_page_instant_pages` via `dfsPost`

**Architecture :** Route avec `?url=` query param. Le composant effectue 5 appels `useSWR` en parallèle (un par page clé).

**Pages analysées :**
- `https://vanzonexplorer.com/vanzon`
- `https://vanzonexplorer.com/vanzon/location`
- `https://vanzonexplorer.com/vanzon/achat`
- `https://vanzonexplorer.com/vanzon/formation`
- `https://vanzonexplorer.com/vanzon/pays-basque`

**Mapping des données :**
- `dfsPost` retourne `tasks[0].result[0]` → la variable de réponse est l'objet page directement
- Structured data : `response.items?.[0]?.meta?.structured_data` (objet dont les clés sont les types de schema présents)
- Schema types à vérifier : `LocalBusiness`, `Product`, `FAQPage`, `BreadcrumbList`, `Article`
- Si `structured_data` est absent/null → aucun schema sur la page

**Route API (`schema/route.ts`) :**
- `GET /api/admin/seo/schema?url=<encoded>`
- Route dynamique (query param) → **`export const revalidate` n'a pas d'effet** → utiliser `next: { revalidate: 3600 }` dans le `fetch()` interne de `dfsPost` (ou passer par `dfsPostRaw` avec ce paramètre)
- En pratique : `dfsPost` utilise déjà `next: { revalidate: 300 }`. Pour 1h, créer un appel `fetch` séparé avec `next: { revalidate: 3600 }` plutôt qu'utiliser `dfsPost`
- Guard Clerk `auth()` en tête

**Composant `SchemaMarkup.tsx` :**
- 5 `useSWR` parallèles avec clés distinctes
- Table : colonnes Page / Schemas détectés / Statut

---

### Section C — Visibilité IA (temps réel)

**Source de données :** DataForSEO `ai_opt_llm_ment_agg_metrics` + `ai_opt_llm_ment_top_pages` via `dfsPostRaw`

**Prérequis :** `vanzonexplorer.com` doit être enregistré dans le module AI Visibility DataForSEO. Si ce n'est pas le cas, l'API retourne `status_code: 40602`.

**Gestion du cas non-enregistré :** `dfsPostRaw` ne throw pas — le handler lit `tasks[0].status_code` et retourne `{ available: false, reason: "domain_not_registered" }` si 40602. Le composant affiche un état vide avec message explicatif.

**Données affichées (si disponible) :**
- Score global de visibilité IA (sur 100)
- Mentions par LLM : ChatGPT, Gemini, Perplexity, Claude
- Top 3 pages les plus mentionnées

**Route API (`ai-visibility/route.ts`) :**
- URL fixe → `export const revalidate = 3600`
- Utilise `dfsPostRaw` pour lire le status_code brut
- Guard Clerk `auth()` en tête

**Composant `AiVisibility.tsx` :**
- Si `available: false` → état vide avec message "Domaine non suivi dans DataForSEO AI Visibility"
- Si données → KPI score + grid 4 LLMs + liste top pages
- `refreshInterval: 3600000`

---

### Section D — Optimisation Images (temps réel)

**Source de données :** DataForSEO `on_page_instant_pages` — homepage uniquement

**Mapping des données :**
- `dfsPost` retourne `tasks[0].result[0]` → objet page directement
- Images : `response.items?.[0]?.resources?.filter(r => r.resource_type === "image")`
- Alt manquant : `!r.attributes?.alt || r.attributes.alt === ""`
- Format non-optimisé : `!r.url?.match(/\.(webp|avif)/i)`
- Taille excessive : `r.size > 204800` (> 200KB)

**Route API (`images/route.ts`) :**
- URL fixe (homepage uniquement) → `export const revalidate = 3600`
- Utilise `dfsPost` directement (pas besoin de gestion d'erreur spéciale)
- Guard Clerk `auth()` en tête

**Composant `ImageOptimization.tsx` :**
- Grid 3 KPI cards : sans alt / format non-optimisé / trop lourdes
- Liste des images problématiques avec badge par type de problème
- `refreshInterval: 3600000`

---

### Intégration dans SeoClient.tsx

Ajouter le commentaire `{/* Row 5: Keyword Ideas */}` sur le bloc KeywordIdeas existant (avant `<div className="mb-6">`), puis insérer après sa fermeture `</div>` :

```tsx
{/* Row 6: Technical SEO + Schema Markup */}
<div className="grid lg:grid-cols-2 gap-6 mb-6">
  <TechnicalSeo />
  <SchemaMarkup />
</div>

{/* Row 7: AI Visibility + Image Optimization */}
<div className="grid lg:grid-cols-2 gap-6 mb-6">
  <AiVisibility />
  <ImageOptimization />
</div>
```

---

## Patterns à respecter

- `useSWR` avec `fetcher` pour tous les composants (cohérent avec l'existant)
- `refreshInterval: 3600000` pour les nouvelles sections
- Cache routes : `export const revalidate = 3600` pour les routes à URL fixe (`technical`, `ai-visibility`, `images`). Pour les routes avec query params (`schema`), utiliser un appel `fetch` direct avec `next: { revalidate: 3600 }` — `export const revalidate` n'a pas d'effet sur les routes dynamiques
- Skeleton loaders pendant le chargement
- Design cohérent avec l'existant : cartes blanches, `border border-slate-200 rounded-2xl`
- Routes API : inclure le guard Clerk `auth()` en tête de handler, identique aux routes existantes
- Routes API : retourner `{ error: string }` en cas d'échec
- `dfsPost` retourne déjà `result[0]` — mapper directement en `response.items[0]` (pas `result[0].items[0]`)
- Utiliser `dfsPostRaw` uniquement pour `ai-visibility` (gestion manuelle du status_code)

---

## Ce qui N'est PAS dans le scope

- Modifier les sections existantes du dashboard
- Stocker les résultats en Supabase
- Système d'alertes/notifications SEO
- Export PDF des rapports
- Utiliser les skills claude-seo pour alimenter le dashboard
