---
name: reference_mediatheque
description: Médiathèque Vanzon — route API, format de réponse, schéma Sanity et règle d'intégration
type: reference
---

## Route API
`GET /api/admin/media` — retourne un **tableau direct** `MediaAsset[]` (PAS `{ media: [...] }`)

## Schéma Sanity
Type : `mediaAsset` — champs : `title`, `category`, `image` (avec `alt`, `hotspot`), `_createdAt`

## Composant réutilisable
`src/components/admin/MediaPickerModal.tsx` — modal standard qui consomme cette API :
```ts
setItems(Array.isArray(data) ? data : []);
```

## Règle d'intégration
**Chaque fois qu'un formulaire admin contient un champ image**, connecter la bibliothèque Vanzon via `/api/admin/media`. Le consommateur doit faire `Array.isArray(d) ? d : []` — ne jamais écrire `d.media`.

**Why:** La médiathèque est la source principale d'images du site. Ne pas la connecter force des re-uploads inutiles et des doublons d'assets dans Sanity.

**How to apply:** Toujours utiliser `MediaPickerModal` ou reproduire le même pattern de fetch. Vérifier que le binding est `Array.isArray(data)` et non `data.media`.
