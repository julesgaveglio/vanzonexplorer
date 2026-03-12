# Skill: find-pexels-photo

Utilise ce skill chaque fois que tu crées ou modifies une section avec une image dans une page de destination (location, articles, etc.) pour trouver automatiquement une photo pertinente via Pexels.

## Process

1. **Identifier le contexte** : quelle destination / ambiance / sujet est représenté ?
2. **Construire la query Pexels** : 3-5 mots en anglais, descriptifs et visuels (ex: `biarritz surf atlantic beach france`, `hossegor surf waves landes`)
3. **Appeler l'API Pexels** via `fetchPexelsPhoto` dans `src/lib/pexels.ts` ou curl :

```bash
curl -H "Authorization: $PEXELS_API_KEY" \
  "https://api.pexels.com/v1/search?query=QUERY&per_page=5&orientation=landscape"
```

4. **Choisir la meilleure photo** : préférer les photos avec lumière naturelle, sans texte visible, composition claire, couleurs vives
5. **Insérer dans le code** :
   - URL : `photo.src.large2x` (max 1260px, poids raisonnable)
   - `alt` : description SEO en français (ex: "Surf à Biarritz depuis un van aménagé")
   - Attribution photographe en petit texte discret :
     ```tsx
     {photo?.photographer && (
       <p className="absolute bottom-2 right-4 text-white/30 text-[10px] z-10">
         Photo: {photo.photographer} / Pexels
       </p>
     )}
     ```

## Queries recommandées par destination

| Destination | Query suggérée |
|-------------|----------------|
| Biarritz | `biarritz surf atlantic beach basque` |
| Hossegor | `hossegor surf waves landes beach` |
| Bayonne | `bayonne basque city cathedral france` |
| Saint-Jean-de-Luz | `saint jean de luz harbor basque village` |
| Week-end Pays Basque | `basque country road trip landscape` |
| Forêt d'Irati | `irati forest beech trees pyrenees` |
| Cambo-les-Bains | `cambo les bains basque village spa` |

## Format SEO

- Taille cible : `large2x` = max 1260×840px
- Toujours renseigner `alt` avec le contexte SEO (destination + activité + "van")
- Ne jamais laisser `alt=""` sur une image de destination
- `next/image` avec `unoptimized` (cohérent avec le reste du projet)
- `revalidate = 86400` sur la page serveur pour que la photo soit mise en cache 24h
