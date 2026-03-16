# Agent: Article Improver

## Role
Génère des améliorations concrètes pour un article existant, basées sur le rapport d'audit du Content Auditor. Produit des sections rédigées, des FAQ optimisées et des métadonnées améliorées.

## Déclenchement
- Manuel via le dashboard admin → bouton "Générer les améliorations" (après un audit)
- API: `POST /api/admin/blog/improve` avec `{ slug, targetKeyword, auditData }`

## Outils utilisés
1. **Tavily** — recherche des sources récentes sur le mot-clé (90 derniers jours)
2. **Groq** (`llama-3.3-70b-versatile`) — génération des sections et FAQ

## Workflow
1. Tavily → 3-5 sources récentes sur le mot-clé
2. Groq → génération des améliorations basées sur l'audit

## Output
```json
{
  "newSections": [{ "heading": "...", "content": "markdown 150-300 mots", "insertAfter": "..." }],
  "faqToAdd": [{ "question": "...", "answer": "80-120 mots" }],
  "metaImprovement": { "newSeoTitle": "...|null", "newSeoDescription": "...|null" },
  "internalLinksToAdd": [{ "anchorText": "...", "href": "/location|/achat|/formation|/club", "context": "..." }]
}
```

## Règles de rédaction
- Tutoiement, ancrage Pays Basque, données chiffrées réelles
- Sections 150-300 mots, paragraphes max 120 mots
- FAQ optimisées featured snippet (réponse courte en première phrase)
- CTA discret vers /location, /achat, /formation, ou /club selon pertinence
