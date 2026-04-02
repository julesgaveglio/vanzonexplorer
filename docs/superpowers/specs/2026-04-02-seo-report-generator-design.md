# Spec : Générateur de Rapport SEO

**Date** : 2026-04-02
**Projet** : Vanzon Explorer — Dashboard Admin
**Route** : `/admin/seo-report`

---

## Contexte & objectif

Outil d'audit SEO **client/agence** : l'admin saisit l'URL d'un site tiers, déclenche une analyse multi-sources, visualise le rapport dans la page, puis télécharge un PDF professionnel à envoyer au client.

Usage cible : audits pour des prospects ou clients (ex. `diemconseiletpatrimoine.com`), pas uniquement pour vanzonexplorer.com.

---

## Architecture retenue : Pipeline séquentiel côté client

5 routes API indépendantes appelées séquentiellement depuis le client. Chaque étape met à jour la progress bar et affiche ses résultats immédiatement. Résilient : une étape qui échoue n'annule pas les autres.

### Pourquoi pas une seule route API ?
Vercel timeout à 60s. 5 sources externes en parallèle (PSI × 2 stratégies, crawl HTML, DataForSEO × 2 endpoints, Groq) dépassent régulièrement cette limite.

---

## Sources de données

| Étape | Route API | Source | Données |
|---|---|---|---|
| 1/5 | `/api/admin/seo-report/pagespeed` | Google PSI API | Scores mobile/desktop, LCP, CLS, INP, FCP, TTFB, opportunités |
| 2/5 | `/api/admin/seo-report/onpage` | Fetch + parse HTML | Title, meta desc, H1-H3, alt manquants, canonical, noindex, JSON-LD |
| 3/5 | `/api/admin/seo-report/authority` | DataForSEO `domain_rank` | Domain Authority, backlinks count, referring domains |
| 4/5 | `/api/admin/seo-report/competitors` | DataForSEO `competitors_domain` | Top 5 concurrents auto-détectés, leurs mots-clés, DA comparé |
| 5/5 | `/api/admin/seo-report/ai-insights` | Groq `llama-3.3-70b` | 5-8 axes d'amélioration priorisés + conclusion sectorielle |
| Save | `/api/admin/seo-report/save` | Supabase | Persistance du rapport complet (jsonb) |

---

## Calcul du score global /100

```
Score global = (PSI SEO score        × 0.30)
             + (PSI Performance score × 0.25)
             + (On-page score         × 0.30)
             + (Authority score norm. × 0.15)
```

### On-page score (sur 100, 8 critères × ~12.5pts)
- Title tag présent
- Title longueur 30-60 caractères
- Meta description présente
- Meta description longueur 120-160 caractères
- H1 unique et présent
- Pas de balise `noindex`
- Canonical tag présent
- JSON-LD schema markup présent
- Images : 0 alt manquant (bonus)

### Authority score
Domain Authority (0-100) directement depuis DataForSEO, normalisé tel quel.

### Statuts visuels
| Seuil | Couleur | Label |
|---|---|---|
| ≥ 80 | Vert `#10B981` | Bon |
| 50–79 | Orange `#F59E0B` | À améliorer |
| < 50 | Rouge `#EF4444` | Critique |

---

## Structure des fichiers

```
src/app/admin/(protected)/seo-report/
  page.tsx                          → Server component (shell + auth)
  SeoReportClient.tsx               → Orchestrateur client — pipeline + état global
  _components/
    UrlInput.tsx                    → Input URL + bouton Générer
    ProgressPipeline.tsx            → Barre de progression 5 étapes avec labels
    ReportPreview.tsx               → Conteneur du rapport (sections dynamiques)
    ReportHistory.tsx               → Tableau des rapports sauvegardés (Supabase)
    sections/
      ScoreGlobal.tsx               → Score /100 + 3 KPI cards
      PerformanceSection.tsx        → Scores PSI mobile/desktop + métriques Core Web Vitals
      OnPageSection.tsx             → Checklist on-page avec statuts
      AuthoritySection.tsx          → DA + backlinks + referring domains
      CompetitorsSection.tsx        → Tableau top 5 concurrents
      AiInsightsSection.tsx         → Axes d'amélioration priorisés + conclusion

src/app/admin/(protected)/seo-report/_pdf/
  SeoReportPDF.tsx                  → Template PDF complet (@react-pdf/renderer)
  PdfDownloadButton.tsx             → Bouton client (PDFDownloadLink)

src/app/api/admin/seo-report/
  pagespeed/route.ts
  onpage/route.ts
  authority/route.ts
  competitors/route.ts
  ai-insights/route.ts
  save/route.ts
```

---

## Table Supabase

```sql
CREATE TABLE seo_reports (
  id           uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  url          text NOT NULL,
  label        text,                        -- nom client optionnel (ex. "Diem Conseil")
  score_global numeric(5,2),                -- ex. 74.35 (décimales possibles dans la formule)
  report_data  jsonb NOT NULL,
  created_at   timestamptz DEFAULT now()
);

CREATE INDEX seo_reports_created_at_idx ON seo_reports (created_at DESC);
CREATE INDEX seo_reports_url_idx ON seo_reports (url);
```

`report_data` contient l'intégralité du rapport sérialisé (toutes les sections). Le champ `label` permet de distinguer deux rapports sur le même domaine.

---

## UX Page admin

### État initial
- Input URL centré, placeholder `https://exemple.com`
- Bouton "Générer le rapport" (désactivé si URL invalide)
- Tableau historique des rapports précédents en dessous

### Pendant la génération
- Progress bar avec 5 étapes nommées, icône spinner sur l'étape active, checkmark sur les étapes terminées
- Chaque section du rapport apparaît au fur et à mesure (skeleton → données réelles)
- En cas d'erreur sur une étape : badge "Indisponible" + message, les autres sections continuent

### Rapport complet
- Score global /100 avec jauge colorée
- 3 KPI cards : Performance / On-page / Autorité
- Sections détaillées scrollables
- Bouton "Télécharger PDF" + bouton "Sauvegarder"

---

## Design PDF — Structure

### Page 1 — Couverture
- URL analysée en grand
- Score global /100 avec jauge circulaire colorée
- Date du rapport
- Footer : "Rapport généré par Vanzon Explorer"

### Pages 2-6 — Une page par section
- En-tête : icône + titre de section
- Données en grilles / tableaux
- Pastilles colorées vert/orange/rouge par métrique
- Section IA : liste priorisée avec badges `Fort` / `Moyen` / `Faible`

### Palette PDF
```
Accent  : #4F46E5  (indigo)
Succès  : #10B981  (vert)
Warning : #F59E0B  (orange)
Danger  : #EF4444  (rouge)
Texte   : #1E293B
Fond    : #FFFFFF / #F8FAFC (alternance sections)
```

---

## Variables d'environnement

Toutes déjà présentes dans `.env.local` :
- `GOOGLE_PSI_API_KEY` — PageSpeed Insights (route existante `/api/admin/psi` à réutiliser)
- `DATAFORSEO_LOGIN` + `DATAFORSEO_PASSWORD` — Authority + Concurrents
- `GROQ_API_KEY` — Recommandations IA (llama-3.3-70b)

Aucune nouvelle variable nécessaire.

---

## Dépendances à installer

```bash
npm install @react-pdf/renderer cheerio
npm install --save-dev @types/cheerio
```

`cheerio` est obligatoire pour le parsing HTML on-page (pas de regex — trop fragile pour les attributs multi-lignes, balises imbriquées, entités HTML). `@react-pdf/renderer` est utilisé côté client uniquement.

---

## Contraintes techniques

### Général
- Toutes les routes API sont en **POST** avec body JSON `{ url: string }` — plus propre que GET avec query params pour des URLs arbitraires
- Toutes les routes vérifient `auth()` Clerk (`userId` requis)

### Route onpage
- Validation de l'URL saisie avant tout appel : doit être `https://`, hostname public (pas `localhost`, pas IP privée `10.x`, `192.168.x`, `172.16-31.x`, `169.254.x`) — prévention SSRF
- `fetch()` avec `AbortSignal.timeout(10000)` pour éviter de bloquer sur une URL lente
- Parsing HTML avec `cheerio` (obligatoire, pas de regex)

### Route pagespeed
- Extraire et dupliquer le bloc de parsing PSI de `/api/admin/psi/route.ts` (construction `rawUrl`, extraction scores/vitals/opportunities) dans la nouvelle route POST — ne pas appeler la route existante en proxy
- Appeler PSI deux fois : `strategy=mobile` puis `strategy=desktop`

### Routes DataForSEO (authority + competitors)
- Utiliser **obligatoirement** le helper `dfsPost` de `src/lib/dataforseo.ts` (assure le logging automatique des coûts dans `dataforseo_logs`)
- Le domaine cible est extrait de l'URL saisie : `new URL(inputUrl).hostname`
- Endpoint authority : `/dataforseo_labs/google/domain_rank_overview/live`
- Endpoint competitors : `/dataforseo_labs/google/competitors_domain/live` avec `limit: 5`
- Gérer proprement l'erreur "insufficient funds" DataForSEO (retourner section "Indisponible" sans faire planter le pipeline)

### Route ai-insights
- Modèle Groq : `llama-3.3-70b-versatile`
- Retour JSON **strict** selon ce schéma :
```typescript
{
  secteur: string,                  // secteur d'activité détecté automatiquement
  axes: Array<{
    titre: string,
    priorite: "Fort" | "Moyen" | "Faible",
    description: string,
    impact: string                  // ex. "Peut améliorer le LCP de ~30%"
  }>,
  conclusion: string                // paragraphe de synthèse 3-5 phrases
}
```
- Forcer le JSON avec `response_format: { type: "json_object" }` dans l'appel Groq

### PDF (react-pdf)
- `SeoReportPDF.tsx` et `PdfDownloadButton.tsx` importés avec `dynamic(() => import(...), { ssr: false })` — react-pdf utilise des APIs canvas non disponibles en SSR

### ReportHistory
- Charger les **20 derniers rapports** uniquement (`.limit(20).order('created_at', { ascending: false })`)

---

## Hors scope

- Authentification multi-utilisateurs pour le rapport (usage admin uniquement via Clerk)
- Envoi automatique du PDF par email
- Rapport récurrent/schedulé
- Audit multi-pages (une seule URL par rapport)
