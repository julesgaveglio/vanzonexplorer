# Spec — Location Pages Redesign
**Date:** 2026-03-12
**Status:** Approved

## Scope

Amélioration complète des pages `/location` et des 5 sous-pages de destination (Biarritz, Hossegor, Bayonne, Saint-Jean-de-Luz, Week-end).

## 1. Mémoire Claude — Cambo-les-Bains

- Sauvegarder en mémoire projet : le départ des vans Vanzon Explorer est depuis **Cambo-les-Bains (64250)**, pas Bayonne.
- Remplacer toutes les mentions "Départ Bayonne" par "Départ Cambo-les-Bains" dans tous les fichiers de pages location.
- Recalculer les distances depuis Cambo-les-Bains (non Bayonne) :
  - Biarritz : ~25 min
  - Hossegor : ~45 min
  - Bayonne : ~15 min
  - Saint-Jean-de-Luz : ~20 min

## 2. Hero `/location` — Alignement homepage

La section hero doit matcher exactement le hero `src/app/(site)/page.tsx` :

- `className="relative -mt-16 min-h-screen flex items-end overflow-hidden"` (plein écran, full bleed)
- Double gradient : `bg-gradient-to-t from-slate-950/90 via-slate-900/50 to-slate-900/20` + `bg-gradient-to-r from-blue-950/30 via-transparent to-transparent`
- Badge ★ cliquable → lien Google Maps (même que homepage, `place_id:ChIJ7-3ASe0oTyQR6vNHg7YRicA`)
- Rating dynamique via `getGooglePlaceStats()` (même hook que homepage)
- H1 + gradient text bleu existant — texte inchangé
- 2 CTAs existants — inchangés
- Stats grid bottom-right (hidden mobile) : `65€ / nuit`, `2 vans exclusifs`, `4.9★ / 33 avis`
- Flèche animée `animate-bounce` vers `#nos-vans`

## 3. Pexels Integration

### Utilitaire `src/lib/pexels.ts`

```typescript
export async function fetchPexelsPhoto(query: string): Promise<PexelsPhoto | null>
```

- Utilise `PEXELS_API_KEY` depuis `process.env`
- Endpoint : `https://api.pexels.com/v1/search?query=...&per_page=1&orientation=landscape`
- Retourne : `{ url: string, alt: string, photographer: string, photographerUrl: string }`
- Format : `src.large2x` (max 1260px large) — bon rapport qualité/poids
- `revalidate = 86400` sur les pages serveur (cache 24h)
- Fallback : URL Sanity existante si la clé n'est pas configurée

### Variable d'environnement

Ajouter dans `.env.local` :
```
PEXELS_API_KEY=your_key_here
```

### Allocation par sous-page

| Page | Query Pexels |
|------|-------------|
| Biarritz | `biarritz surf atlantic beach` |
| Hossegor | `hossegor surf beach landes` |
| Bayonne | `bayonne basque city france` |
| Saint-Jean-de-Luz | `saint jean de luz harbor village` |
| Week-end | `basque country road trip van` |

- Attribution affichée discrètement en bas de l'image hero : `Photo: [photographer] / Pexels`
- `next/image` avec `unoptimized` (cohérent avec le reste du projet)

## 4. Google Maps iframe

### Placement
- Sur `/location` principale : section dédiée entre "Pourquoi Vanzon" et FAQ
- Sur chaque sous-page : section "Comment venir depuis Cambo-les-Bains"

### Implémentation
```html
<iframe
  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!...Cambo-les-Bains..."
  width="100%"
  height="400"
  style={{ border: 0 }}
  allowFullScreen
  loading="lazy"
  referrerPolicy="no-referrer-when-downgrade"
  title="Localisation Cambo-les-Bains — Vanzon Explorer"
/>
```

- Enveloppé dans `rounded-3xl overflow-hidden shadow-lg`
- Pas de clé API requise (iframe embed public)
- Sur les sous-pages : zoom centré sur Cambo-les-Bains avec note "Point de départ de vos aventures"

## 5. Claude Skill — `agents/find-pexels-photo.md`

Skill qui instruite Claude à :
1. Identifier le contexte de la section (destination, ambiance)
2. Construire une query Pexels en anglais (5-7 mots)
3. Appeler `GET https://api.pexels.com/v1/search?query=...&per_page=5&orientation=landscape`
4. Choisir la photo la plus pertinente (meilleure composition, lumière naturelle, pas de texte dans l'image)
5. Insérer l'URL `src.large2x` + `alt` SEO en français dans le code

## Fichiers impactés

- `src/lib/pexels.ts` — nouveau
- `src/app/(site)/location/page.tsx` — hero redesign + Maps + Cambo
- `src/app/(site)/location/biarritz/page.tsx` — hero Pexels + Cambo + Maps
- `src/app/(site)/location/hossegor/page.tsx` — idem
- `src/app/(site)/location/bayonne/page.tsx` — idem
- `src/app/(site)/location/saint-jean-de-luz/page.tsx` — idem
- `src/app/(site)/location/week-end/page.tsx` — idem
- `.env.local` — ajout `PEXELS_API_KEY`
- `agents/find-pexels-photo.md` — nouveau skill
- Mémoire Claude — nouveau fichier `project_cambo-les-bains.md`
