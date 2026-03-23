# Spec : Agent CMO 360° — Vanzon Explorer

**Date :** 2026-03-23
**Statut :** Approuvé
**Auteur :** Brainstorming Claude Code

---

## Résumé

Création d'un système d'agents "Directeur Marketing 360°" pour Vanzon Explorer. L'agent couvre l'intégralité des leviers marketing (SEO, contenu, réseaux sociaux, email, paid, réputation, concurrence, rétention) adapté au modèle spécifique de Vanzon : PME locale saisonnière, multi-revenue (location + vente + formation + club), cycle de vente long pour les vans aménagés.

Le système fonctionne en deux modes : conversationnel à la demande via `/cmo`, et autonome planifié (hebdo + mensuel). Tout est pilotable depuis un nouveau dashboard `/admin/marketing`.

---

## Architecture

### Fichiers agents

| Fichier | Rôle |
|---|---|
| `agents/cmo.md` | Orchestrateur principal — diagnostic, routing, consolidation |
| `agents/cmo-acquisition.md` | SEO local, Google Business, Yescapa/Goboony, briefs paid ads |
| `agents/cmo-content.md` | Blog, Instagram, TikTok, Pinterest, calendrier éditorial |
| `agents/cmo-retention.md` | Club Privé, email nurturing, tunnel vente van (cycle long) |
| `agents/cmo-reputation.md` | Avis Google, UGC, communauté van life |
| `agents/cmo-intelligence.md` | Veille concurrentielle, pricing, positionnement différentiel |
| `agents/cmo-report.md` | Génération de rapports hebdo/mensuel autonomes |

### Commandes slash

| Commande | Fichier | Usage |
|---|---|---|
| `/cmo [question]` | `.claude/commands/cmo.md` | Entrée principale — routing intelligent |
| `/cmo-weekly` | `.claude/commands/cmo-weekly.md` | Scan opportunités de la semaine |
| `/cmo-monthly` | `.claude/commands/cmo-monthly.md` | Audit 360° complet |

### Scripts automatisés

| Script | Fréquence | Description |
|---|---|---|
| `scripts/agents/cmo-weekly-agent.ts` | Hebdomadaire (lundi matin) | Scan SEO + veille concurrents + 3 actions prioritaires |
| `scripts/agents/cmo-monthly-agent.ts` | Mensuel (1er du mois) | Audit 360° complet, plan d'action ICE-scoré |

**Mécanisme de déclenchement** : GitHub Actions cron (cohérent avec le pattern existant du projet).
- `.github/workflows/cmo-weekly.yml` — schedule `0 7 * * 1` (lundi 7h UTC)
- `.github/workflows/cmo-monthly.yml` — schedule `0 7 1 * *` (1er du mois 7h UTC)

Les scripts CLI sont également déclenchables manuellement depuis le dashboard (`/admin/marketing`) via l'API route.

### Interface admin

- Nouvelle route : `src/app/admin/(protected)/marketing/page.tsx`
- Table Supabase : `cmo_reports` + `cmo_actions`
- API routes :
  - `POST /api/admin/cmo/run` — `{ type: 'weekly' | 'monthly' | 'adhoc', subagent?: string }` → déclenche le script correspondant
  - `POST /api/admin/cmo/ask` — `{ question: string }` → SSE stream, réponse de l'orchestrateur
  - `PATCH /api/admin/cmo/actions/[id]` — `{ status: 'todo' | 'in_progress' | 'done', notes?: string }` → met à jour le statut d'une action

---

## Frameworks intégrés

### AARRR adapté Vanzon

Le modèle AARRR standard est adapté au multi-revenue de Vanzon :

| Étape | Canal principal | Objectif |
|---|---|---|
| **Acquisition** | SEO local, Yescapa, Google Ads | Attirer visiteurs qualifiés au Pays Basque |
| **Activation** | Landing pages, formulaires, devis | Premier contact / réservation / demande |
| **Retention** | Club Privé, newsletter, communauté | Fidéliser et créer des ambassadeurs |
| **Referral** | Programme ambassadeur, avis Google | Recommandations actives |
| **Revenue** | Location + Vente van + Formation + Club | Optimiser chaque stream de revenus |

### ICE Scoring

Chaque recommandation produite par l'agent est scorée :
- **Impact** (1-10) : effet attendu sur le business
- **Confidence** (1-10) : niveau de certitude de l'agent
- **Ease** (1-10) : facilité d'exécution pour une PME

Score final = (I × C × E) / 100 → classement automatique des priorités.

### Health Score (0-100)

Score calculé à chaque rapport mensuel, pondéré par canal :

| Composante | Poids | Source de données |
|---|---|---|
| Acquisition SEO | 25% | GSC : évolution positions + clics vs mois précédent |
| Contenu | 20% | Sanity : articles publiés ce mois vs objectif (4/mois) |
| Rétention | 20% | Supabase : nouveaux membres club + road trip requests |
| Réputation | 20% | Tavily scraping : note Google Business + volume avis |
| Intelligence concurrentielle | 15% | Estimation LLM : Vanzon mieux/pareil/moins bien positionné |

Chaque composante est notée 0-100 (données mesurables) ou 0/50/100 (estimation LLM binaire/ternaire). Le health score global = somme pondérée.

Si une source de données est indisponible pour une composante, celle-ci est exclue du calcul et les poids sont renormalisés.

### Seasonal Matrix

L'agent adapte automatiquement ses recommandations selon la saison :

| Saison | Période | Priorités |
|---|---|---|
| **Haute** | 15 avril → 15 septembre | Conversion, disponibilité, avis, upsell |
| **Moyenne** | Mars-avril, sept-oct | Préparation, SEO, contenu long terme |
| **Basse** | Octobre → mars | Lead nurturing vente van, formations, partenariats |

### Cycle de vente long (vente van)

Tunnel spécifique pour les prospects achat van (ticket 40-80k€, cycle 6-18 mois) :
- Phase découverte → contenu éducatif, blog, YouTube
- Phase considération → Club Privé, accompagnement, formations
- Phase décision → témoignages, financement, road trip test

---

## Comportement de l'orchestrateur (`agents/cmo.md`)

### Mode conversationnel

À chaque appel `/cmo [question]`, l'orchestrateur :

1. Identifie le(s) sous-agent(s) pertinent(s)
2. Lance les analyses en parallèle (via Agent tool)
3. Consolide les résultats
4. Produit un output structuré en 4 blocs :
   - **Diagnostic** : situation actuelle
   - **Opportunités** : classées par ICE score
   - **Plan d'action** : étapes concrètes et ordonnées
   - **Actions déclenchables maintenant** : ce que l'agent peut faire directement

### Mode autonome

**Rapport hebdomadaire** (15-20 min d'exécution) :
- Nouvelles opportunités SEO (DataForSEO MCP)
- Mouvements concurrents détectés
- 3 actions prioritaires ICE-scorées pour la semaine
- Stocké en Supabase `cmo_reports` (type = `weekly`)

**Rapport mensuel** (30-45 min d'exécution) :
- Score AARRR du mois (analyse canal par canal)
- Performance SEO vs mois précédent (GSC)
- Analyse concurrentielle complète
- Plan d'action du mois suivant (10-15 actions ICE-scorées)
- Alertes : opportunités à saisir, signaux faibles, risques identifiés
- Stocké en Supabase `cmo_reports` (type = `monthly`)

### Règle d'autonomie

- **Agit seul** : créer des briefs, ajouter des articles en queue, générer des recommandations
- **Demande confirmation** : lancer `/write-article`, modifier des pages, envoyer des emails

---

## Sources de données

| Source | Disponibilité | Usage |
|---|---|---|
| DataForSEO MCP | ✅ connecté | Rankings, SERP, keywords, backlinks, concurrents |
| Google Search Console | ✅ connecté | Impressions, clics, positions, pages performantes |
| Sanity CMS | ✅ connecté | Inventaire contenu, articles publiés, gaps |
| Supabase | ✅ connecté | Membres club, prospects, road trip requests |
| Tavily + WebFetch | ✅ disponible | Veille web, scraping concurrents, avis Yescapa |
| Site live Vanzon | ✅ on_page tools | Audit CRO, maillage interne, meta tags |

Pas de nouvelle intégration requise au lancement.

---

## Dashboard Admin `/admin/marketing`

### Structure des vues

**Vue principale**
- Score santé marketing global (0-100)
- Résumé AARRR du dernier rapport mensuel
- 3 actions prioritaires de la semaine (avec ICE score, bouton "Marquer fait")
- Dernière mise à jour (date du dernier rapport)

**Onglet Rapports**
- Historique rapports (hebdo + mensuel) depuis Supabase
- Lecture rapport complet avec toutes les recommandations
- Filtre par canal

**Onglet Actions**
- Liste filtrée par statut : À faire / En cours / Fait (3 onglets, pas de kanban drag & drop)
- Chaque ligne : titre, canal, ICE score, effort estimé, source (quel sous-agent), boutons "En cours" / "Fait"
- Bouton "Déclencher" pour les actions automatisables (ex. ajouter un article en queue)
- Persistance en Supabase via `PATCH /api/admin/cmo/actions/[id]`
- **Règle de déduplication** : à chaque nouveau rapport, avant d'insérer les actions, le script vérifie si une action avec le même `title` et `channel` existe en statut `done` dans les 30 derniers jours — si oui, elle n'est pas recréée

**Onglet Analyse**
- Boutons : Lancer analyse hebdo / mensuelle / par sous-agent
- Champ texte libre → question au CMO (résultat en streaming SSE)
- Résultat affiché directement dans l'interface

### Schéma Supabase

```sql
create table cmo_reports (
  id uuid primary key default gen_random_uuid(),
  type text not null, -- 'weekly' | 'monthly' | 'adhoc'
  created_at timestamptz default now(),
  period_label text, -- ex: "Semaine 12 - Mars 2026"
  health_score integer, -- 0-100
  content jsonb not null, -- rapport complet structuré
  actions jsonb, -- liste des actions ICE-scorées
  status text default 'active' -- 'active' | 'archived'
);

create table cmo_actions (
  id uuid primary key default gen_random_uuid(),
  report_id uuid references cmo_reports(id),
  created_at timestamptz default now(),
  title text not null,
  channel text, -- 'acquisition' | 'content' | 'retention' | 'reputation' | 'intelligence'
  ice_score integer,
  effort text, -- 'low' | 'medium' | 'high'
  status text default 'todo', -- 'todo' | 'in_progress' | 'done'
  notes text
);
```

---

## Relation avec les agents existants

Le système CMO **délègue** aux agents existants — il ne les remplace pas :

| Agent existant | Appelé par | Mode |
|---|---|---|
| `agents/seo-analyzer.md` | `cmo-acquisition.md` | Délégation via Agent tool pour les audits SEO détaillés |
| `agents/competitor-tracker.md` | `cmo-intelligence.md` | Délégation pour la veille concurrentielle |
| `agents/blog-writer.md` | `cmo-content.md` | Délégation pour la rédaction effective des articles |
| `/write-article` | `cmo-report.md` | Déclenchement soumis à confirmation (règle d'autonomie) |

Les sous-agents CMO jouent un rôle **stratégique** (quoi faire, pourquoi, quand) ; les agents existants jouent un rôle **exécutif** (comment faire).

---

## Spécifications par sous-agent

### `cmo-acquisition.md`
- Audit SEO local (Google Business Profile, citations NAP, schema LocalBusiness) — délègue à `seo-analyzer.md` pour les détails
- Analyse keywords géolocalisés Pays Basque (DataForSEO)
- Monitoring Yescapa/Goboony : prix concurrents, disponibilités, avis
- Briefs campagnes Google Ads / Meta (audiences, copy, budget recommandé)
- Opportunités de backlinks locaux (offices de tourisme, blogs van life)

### `cmo-content.md`
- Calendrier éditorial mensuel (blog + réseaux sociaux)
- Idées de posts Instagram/TikTok basées sur les tendances van life + saison
- Briefs articles SEO (enrichit la `article-queue.json` existante)
- Stratégie Pinterest (épingles visuelles destinations Pays Basque)
- Analyse du contenu existant : gaps, mises à jour nécessaires, cannibalisation

### `cmo-retention.md`
- Analyse cohortes membres Club Privé (Supabase)
- Séquences email nurturing par segment (prospect location / prospect achat / membre club)
- Stratégie onboarding Club Privé (valeur perçue, activation)
- Funnel vente van : mapping des touchpoints, identification des drop-offs
- Programme ambassadeur : structure, incentives, communication

### `cmo-reputation.md`
- Audit avis Google Business (volume, note, réponses)
- Monitoring avis Yescapa/Goboony
- Stratégie UGC : comment inciter les clients à publier du contenu
- Templates de réponse aux avis (positifs + négatifs)
- Veille mentions Vanzon sur les réseaux sociaux et forums van life

### `cmo-intelligence.md`
- Benchmark concurrents directs : Nomads Surfing, Van It Easy, etc. — délègue à `competitor-tracker.md` pour la collecte de données
- Analyse pricing concurrentiel (location + vente)
- Gaps de positionnement : ce que Vanzon fait que les concurrents ne font pas
- Opportunités de différenciation non exploitées
- Veille tendances marché van life France

### `cmo-report.md`
- Agrège les outputs de tous les sous-agents
- Calcule le score AARRR et le health score global
- Génère le rapport structuré (hebdo ou mensuel)
- Stocke en Supabase via l'API admin
- Peut déclencher des alertes si score en baisse

---

## Plan d'implémentation (ordre suggéré)

1. **Table Supabase** `cmo_reports` + `cmo_actions`
2. **Agents markdown** : orchestrateur + 6 sous-agents
3. **Commandes slash** : `/cmo`, `/cmo-weekly`, `/cmo-monthly`
4. **Scripts autonomes** : `cmo-weekly-agent.ts` + `cmo-monthly-agent.ts`
5. **API route** : `src/app/api/admin/cmo/route.ts` (trigger + streaming)
6. **Dashboard admin** : `src/app/admin/(protected)/marketing/page.tsx`

---

## Critères de succès

- `/cmo [question]` produit un plan d'action actionnable en < 2 minutes
- Rapport hebdomadaire tourne sans intervention humaine
- Le dashboard admin affiche le dernier rapport + les actions en temps réel
- Chaque recommandation a un ICE score et un effort estimé
- L'agent adapte ses recommandations à la saison en cours automatiquement
