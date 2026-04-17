---
name: VBA Competitors & Keyword Strategy
description: Contexte de la veille concurrents et stratégie mots-clés Van Business Academy — tables Supabase, routes API, pages admin
type: project
---

## Tables Supabase créées (2026-04-01)

**vba_competitors** — profils des concurrents formation van en France
- domain, name, description, strengths, weaknesses, pricing, offerings
- traffic_estimate (etv DFS), domain_authority (rank DFS), last_analyzed
- Upsert sur `domain` (onConflict: "domain")

**vba_keywords** — mots-clés stratégiques VBA
- keyword, search_volume, keyword_difficulty, cpc, intent, topic_cluster, opportunity_score
- competition_level, monthly_searches (JSONB), last_checked
- Upsert sur `keyword`

**Why:** Positionner Vanzon Explorer comme premier formateur van aménagé en France (Van Business Academy).

## Routes API

- `GET/POST /api/admin/formation/competitors` — GET: liste DB, POST: SSE pipeline (SERP→Domain overview→Tavily→Groq→upsert)
- `GET/POST /api/admin/formation/keywords` — GET: liste DB, POST: SSE pipeline (keyword_ideas x7 batches→bulk_difficulty→search_intent→upsert)
- `POST /api/admin/formation/queue-articles` — SSE: top 60 keywords→Groq→insert article_queue (added_by: 'vba-keyword-strategy')
- `GET /api/admin/formation/queue-articles/stats` — compteurs article_queue

## Pages admin

- `/admin/formation/competitors` — veille concurrents avec expandable rows (forces/faiblesses)
- `/admin/formation/keywords` — mots-clés filtrables par cluster (Formation Van / Business Van / Aménagement Van / Achat Van / Location Van / Réglementation / Vanlife)
- `/admin/formation/queue` — génération 50 articles SEO avec log SSE

## Clusters thématiques (topic_cluster)

Formation Van / Business Van / Aménagement Van / Achat Van / Location Van / Réglementation / Vanlife / Général

## Prérequis d'exécution

1. Créer les 2 tables SQL dans Supabase (si pas encore fait)
2. Lancer "Rechercher les mots-clés" depuis /admin/formation/keywords
3. Puis "Générer 50 articles" depuis /admin/formation/queue
4. Les articles sont insérés dans article_queue avec added_by = 'vba-keyword-strategy'
