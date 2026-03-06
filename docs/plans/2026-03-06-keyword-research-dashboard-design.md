# Design — Page Keyword Research Dashboard

Date: 2026-03-06
Statut: Validé

## Objectif

Créer une page dédiée `/admin/keywords` dans le dashboard admin pour visualiser de manière intuitive l'analyse de mots-clés "location van aménagé Pays Basque" avec données hybrides (statiques + refresh live via DataForSEO).

## Architecture

### Route
- Page : `src/app/admin/keywords/page.tsx`
- Client component : `src/app/admin/keywords/KeywordsClient.tsx`
- Composants : `src/app/admin/keywords/components/`
- API route : `src/app/api/admin/seo/keywords-research/route.ts`
- Données constantes : `src/app/admin/keywords/data/keywords.ts`

### Sidebar
Ajouter une entrée "Mots-Clés" dans `src/app/admin/_components/AdminSidebar.tsx`, entre "SEO Analytics" et "Vans".

## Données

### Source hybride
- **Données de base** : liste curatée ~35 keywords hardcodée dans `keywords.ts` avec métadonnées (catégorie, intention, monthly_searches from analysis)
- **Refresh live** : bouton "Actualiser" → appelle `/api/admin/seo/keywords-research` → DataForSEO `keyword_overview` endpoint sur toute la liste → retourne métriques fraîches
- **Cache** : métriques stockées en `localStorage` avec timestamp, TTL 24h. Au chargement : si cache < 24h → afficher cache, sinon afficher données statiques de base.

### Structure d'un keyword
```ts
interface KeywordData {
  keyword: string;
  category: "quick-win" | "main-target" | "editorial";
  intent: "commercial" | "informational" | "navigational";
  // Statiques (analyse)
  search_volume: number;
  monthly_searches: Record<string, number>; // 12 derniers mois
  competition_level: "LOW" | "MEDIUM" | "HIGH";
  keyword_difficulty: number | null;
  cpc: number;
  trend_yearly: number | null; // % variation annuelle
  // Dynamiques (refresh API)
  last_updated?: string;
}
```

### Liste des 35 keywords curatés
Organisés en 3 catégories :

**Quick Wins** (KD bas, opportunité immédiate) :
- location van aménagé landes (KD=24, 50/mois)
- location camping-car pays basque (KD=33, 50/mois)
- location van anglet (50/mois, +100% annuel)
- location van hossegor (KD=46, 20/mois)
- location van aménagé 64 (KD=6, 20/mois)
- location van bidart (KD=51, 20/mois)
- location van saint jean de luz (20/mois)

**Cibles principales** (volume + intention commerciale directe) :
- location van biarritz (390/mois)
- location van pays basque (210/mois)
- location camping-car bayonne (210/mois)
- location van bayonne (170/mois)
- location van aménagé pays basque (90/mois)
- location van aménagé bayonne (90/mois)
- location camping-car biarritz (90/mois)
- location van landes (90/mois)
- location van anglet (50/mois)
- location van bordeaux (880/mois, concurrence HIGH)
- location camping-car pau (260/mois)
- location van aménagé landes (50/mois)
- location van sud-ouest (50/mois)
- location van aménagé 64 (20/mois)
- location van aménagé dax (20/mois)

**Éditorial** (contenu blog, faible concurrence) :
- road trip pays basque (390/mois, LOW, 2 backlinks avg)
- road trip van pays basque (10/mois, KD=44, LOW)
- van life pays basque (10/mois, LOW)
- location combi vw pays basque (10/mois, LOW)
- camping van pays basque (10/mois, LOW)
- pays basque en van aménagé (10/mois, LOW)
- location camping-car particulier (5400/mois, KD=51) ← national

## Sections UI

### 1. Header
- Titre "Recherche Mots-Clés"
- Sous-titre "Pays Basque · Location Van · France"
- Badge "Dernière MAJ : [timestamp]"
- Bouton "Actualiser" (spinner pendant fetch, désactivé si TTL < 24h non écoulé)

### 2. KPI Bar (4 cartes)
- Total keywords trackés
- Nombre de Quick Wins (KD < 45 ou competition LOW/MEDIUM)
- Volume mensuel total cumulé
- Prochain pic saisonnier (label "Juin-Août ×5")

### 3. Matrice d'Opportunités (scatter plot — Recharts ScatterChart)
- X : search_volume
- Y : keyword_difficulty (axe inversé — bas = facile)
- Taille point : CPC × 20 (valeur commerciale)
- Couleur : category (vert=quick-win, bleu=main-target, violet=editorial)
- Tooltip on hover : keyword, volume, KD, CPC, compétition
- 4 quadrants labellisés avec rectangles transparents :
  - "À éviter" (haut gauche)
  - "Long terme" (haut droit)
  - "Contenu facile" (bas gauche)
  - "JACKPOT 🎯" (bas droit)
- Légende catégories

### 4. Saisonnalité (BarChart — Recharts)
- 12 barres Jan→Déc, volume agrégé de tous les keywords
- Barres Jun-Août colorées en orange/amber, reste en slate
- Annotation "Publiez maintenant pour ranker en été" si mois actuel < juin
- Titre "Tendance saisonnière — volume total"

### 5. Tableau keywords (tabs + table)
- Tabs : Tous | Quick Wins | Cibles | Éditorial
- Colonnes : Mot-clé | Catégorie | Vol./mois | Sparkline 12m | KD | Compétition | CPC | Tendance | Action
- Sparkline : mini LineChart 12 mois (Recharts)
- Badge KD : vert < 30, amber 30-60, rouge > 60
- Badge compétition : LOW=vert, MEDIUM=amber, HIGH=rouge
- Tendance : flèche verte/rouge + % annuel
- Bouton action : "→ Page" (ouvre new tab vers la page concernée du site si elle existe)
- Tri par colonne (volume par défaut)
- Filtre texte search

## API Route `/api/admin/seo/keywords-research`

```
POST /api/admin/seo/keywords-research
Body: {} (pas de body nécessaire, liste définie côté serveur)

Response: { items: KeywordData[], fetched_at: string }
```

Appelle DataForSEO `dataforseo_labs_google_keyword_overview` avec la liste complète des 35 keywords, location France, langue fr. Retourne les métriques enrichies.

## Librairies

- **Recharts** : ScatterChart (matrice), BarChart (saisonnalité), LineChart inline (sparklines)
- Vérifier si recharts est déjà installé, sinon `npm install recharts`

## Non-inclus (YAGNI)

- Pas d'export CSV pour l'instant
- Pas de comparaison concurrents (déjà dans la page SEO)
- Pas de tracking historique des positions
