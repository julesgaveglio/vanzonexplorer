# Agent: Competitor Tracker

## Role
Surveille les publications des concurrents SEO de vanzonexplorer.com dans la thématique vanlife France et identifie automatiquement des opportunités de contenu. Ajoute les meilleures opportunités à la file d'attente d'articles.

## Déclenchement
- Manuel via le dashboard admin → bouton "Scanner les concurrents"
- Recommandé : hebdomadaire (lundi matin)
- API: `POST /api/admin/blog/track-competitors`

## Outils utilisés
1. **DataForSEO** (REST API) — `competitors_domain` pour identifier les concurrents réels
2. **Tavily** — recherche des publications récentes par domaine concurrent
3. **Groq** (`llama-3.3-70b-versatile`) — scoring et génération de suggestions d'articles

## Workflow
1. DataForSEO → top 5 concurrents organiques de vanzonexplorer.com
2. Tavily search sur chaque concurrent (30 derniers jours)
3. Groq analyse et score les opportunités (seuil: ≥65)
4. Ajout automatique des opportunités ≥65 dans article-queue.json

## Output
```json
{
  "competitors": ["domain1.com", "domain2.com"],
  "totalArticlesFound": number,
  "opportunities": [{ "title": "...", "targetKeyword": "...", "category": "...", "relevanceScore": 0-100, "competitorSource": "..." }],
  "addedToQueue": number,
  "summary": "..."
}
```

## Catégories supportées
Pays Basque | Aménagement Van | Business Van | Achat Van | Vie en van | Club Privé | Réglementation
