# Blog Dashboard — Design Document
Date: 2026-03-08

## Objectif

Créer une page `/admin/blog` dans l'espace admin Vanzon Explorer permettant de visualiser en temps réel :
- Les articles publiés et leur performance (structure prête pour GSC + GA4)
- La file d'attente des articles à venir
- Les statuts du pipeline automatisé (blog-writer-agent)

## Source de données

**Unique source :** `scripts/data/article-queue.json` lu via une API route Next.js (`/api/admin/article-queue`).
- Aucune base de données supplémentaire
- Métriques Google (vues, clics, CTR, position) : placeholders `"--"` jusqu'à connexion GSC/GA4

## Architecture

### Route
`/admin/blog` — nouvelle page dans l'admin, ajoutée à la sidebar

### Fichiers à créer
```
src/app/admin/blog/
├── page.tsx                          # Server component — lit la queue
└── _components/
    ├── BlogDashboardClient.tsx       # Client component principal
    ├── KpiBar.tsx                    # 5 cartes KPI
    ├── PublishedArticlesTable.tsx    # Table articles publiés
    ├── ArticleQueueList.tsx          # Liste file d'attente
    └── IntegrationsPanel.tsx        # Bandeaux GSC + GA4

src/app/api/admin/article-queue/
└── route.ts                          # GET — lit article-queue.json

src/app/admin/_components/AdminSidebar.tsx  # Ajout du lien Blog
```

## Design Zones

### Zone 1 — KPI Bar
5 cartes horizontal :
| Métrique | Valeur | Source |
|----------|--------|--------|
| Articles publiés | count(status=published) | queue JSON |
| En file d'attente | count(status=pending) | queue JSON |
| Position SEO moy. | -- | GSC (futur) |
| Visiteurs ce mois | -- | GA4 (futur) |
| Clics totaux | -- | GSC (futur) |

### Zone 2 — Articles publiés (table)
Colonnes :
- Titre (lien vers l'article)
- Catégorie (badge coloré)
- Keyword cible
- Position Google (`--` + badge "GSC non connecté")
- Vues (`--`)
- Clics (`--`)
- CTR (`--`)
- Statut (badge : published / needs-improvement)
- Actions : lien Sanity Studio

### Zone 3 — File d'attente (liste ordonnée)
Par priorité croissante. Chaque item :
- Numéro de priorité
- Titre
- Catégorie (badge)
- Keyword cible
- Statut coloré : `pending` (gris) / `writing` (bleu pulsé) / `needs-improvement` (orange)
- Date estimée (basée sur priorité × 1 article/jour)

### Zone 4 — Intégrations futures
2 cartes côte à côte :
- **Google Search Console** : icône + description + bouton "Connecter" (désactivé)
- **Google Analytics 4** : icône + description + bouton "Connecter" (désactivé)
Badge "Prochainement" sur chaque carte.

## Style

Cohérent avec l'admin existant :
- Background : `#F1F5F9` (slate-100)
- Cards : blanc avec border slate-100, shadow légère
- Badges catégories : mêmes couleurs que ArticlesPageClient.tsx
- Statuts : pending=slate, writing=blue (animate-pulse), published=green, needs-improvement=amber
- Table : headers slate-500, rows alternées blanc/slate-50

## API Route

```typescript
// GET /api/admin/article-queue
// Retourne le contenu de scripts/data/article-queue.json
// Protégée par vérification Clerk (email admin uniquement)
```

## Intégrations futures (slots prêts)

Le composant `PublishedArticlesTable` accepte des props optionnelles :
```typescript
interface GscMetrics {
  position?: number;
  clicks?: number;
  impressions?: number;
  ctr?: number;
}
// Chaque article peut recevoir gscMetrics?: GscMetrics
// Affiche "--" si absent
```

## Non inclus dans cette version
- Drag & drop pour réordonner la queue
- Bouton "Publier maintenant" (trigger workflow GitHub)
- Connexion GSC/GA4 réelle
- Graphiques de performance temporelle
