---
name: verify
description: Recette de vérification runtime pour ce repo (Next.js Vanzon) — lancer l'app et la piloter en headless.
---

# Vérifier une modif dans le site Vanzon

## Lancer

```bash
npm run dev          # port 3000, ~5 s avant de répondre
```

## Piloter en headless

Pas de Playwright dans le repo — l'installer dans le scratchpad de session :

```bash
cd <scratchpad> && npm init -y && npm i playwright && npx playwright install chromium
```

Puis script `.mjs` : `chromium.launch()` + `page.goto("http://localhost:3000/...")`,
screenshots dans le scratchpad. Nécessite `dangerouslyDisableSandbox: true`
(réseau + cache Playwright hors sandbox).

## Pièges

- **Pages /admin et /espace-membre : Clerk bloque tout accès headless**
  (allowlist email). Pour vérifier un composant qui n'y vit que là : monter une
  page temporaire publique `src/app/dev-<nom>-test/page.tsx` qui rend le même
  composant, vérifier, **puis la supprimer** avant de terminer.
- Le bandeau cookies (bas de page) recouvre ~120 px — cliquer plus haut ou
  l'accepter d'abord.
- Ne pas filtrer les textes de page avec des regex lâches type `/cm$/` :
  les boutons d'unités du Van3DViewer donnent des faux positifs ("cmm").
- `npm run build` fait TypeScript + ESLint (~2 min) — le lancer en dernier,
  pas comme preuve de fonctionnement.
- **JAMAIS `npm run build` pendant que `npm run dev` tourne** : ils partagent
  `.next`, le build corrompt le cache du dev (page cassée chez l'utilisateur).
  Toujours arrêter le dev d'abord ; si c'est arrivé : `rm -rf .next` puis
  relancer le dev.
