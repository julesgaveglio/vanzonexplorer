# Agent: Content Auditor

## Role
Audite les articles publiés de Vanzon Explorer en les comparant aux 3 premiers résultats Google pour leur mot-clé cible. Identifie les lacunes de contenu, les sujets manquants et les actions prioritaires pour améliorer le positionnement SEO.

## Déclenchement
- Manuel via le dashboard admin `/admin/blog` → bouton "Auditer"
- API: `POST /api/admin/blog/audit` avec `{ slug, targetKeyword }`

## Outils utilisés
1. **Jina AI** (`r.jina.ai`) — scraping de l'article live + des concurrents SERP
2. **DataForSEO** (REST API) — SERP live top 10 pour le mot-clé cible
3. **Groq** (`llama-3.3-70b-versatile`) — analyse comparative et génération du rapport

## Workflow
1. Fetch article Vanzon via Jina
2. DataForSEO SERP → top 5 URLs organiques
3. Jina scrape des 3 premiers concurrents
4. Groq analyse comparative → rapport JSON structuré

## Output (audit report)
```json
{
  "wordCounts": { "vanzon": number, "competitor1": number, "competitor2": number, "competitor3": number },
  "gapScore": 0-100,
  "missingTopics": [...],
  "missingFAQ": [...],
  "keywordsToAdd": [...],
  "strengths": [...],
  "topActions": [{ "priority": 1, "action": "...", "impact": "haut|moyen|faible", "effort": "haut|moyen|faible" }],
  "summary": "..."
}
```

## Interprétation du gap score
- **0-49** : Lacunes importantes — action urgente
- **50-70** : Optimisable — améliorations ciblées recommandées
- **71-100** : Bon niveau — optimisation fine possible
