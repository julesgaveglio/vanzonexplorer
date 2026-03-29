# Pixel Agents — Widget Admin Dashboard

**Date:** 2026-03-29
**Scope:** Local dev uniquement (masqué en production)

---

## Contexte

Pixel Agents est une extension VS Code/Cursor qui visualise les agents Claude Code comme des personnages pixel art animés dans un bureau. Elle tourne localement en lisant les fichiers JSONL de sessions Claude dans `~/.claude/projects/`.

L'objectif est d'intégrer ce visuel dans l'admin Next.js (`/admin`) sous forme d'un widget compact sur le dashboard principal, qui ouvre une modal plein écran avec le canvas pixel art.

---

## Architecture

### 4 composants

#### 1. `public/pixel-agents/` — Build statique du webview

Copier `~/pixel-agents/dist/webview/` → `public/pixel-agents/` :
```bash
cp -r ~/pixel-agents/dist/webview/. public/pixel-agents/
```

Modifier `public/pixel-agents/index.html` pour injecter :
```html
<script src="/pixel-agents/vscode-shim.js"></script>
```
…immédiatement avant le bundle principal (`<script type="module" src="...">` existant).

**Note :** `public/pixel-agents/` est ajouté à `.gitignore`. C'est un artefact de build à regénérer manuellement après rebuild de pixel-agents.

#### 2. `public/pixel-agents/vscode-shim.js` — Remplacement de l'API VS Code

Le shim est chargé avant le bundle principal. Il :

1. **Définit `window.acquireVsCodeApi()`** retournant `{ postMessage: () => {} }` (les messages webview → extension sont ignorés)

2. **Écoute un message inbound** pour déclencher la connexion SSE :
   ```js
   window.addEventListener('message', (event) => {
     if (event.data?.type === 'startPixelAgents') {
       connectSSE()
     }
   })
   ```

3. **`connectSSE()`** ouvre `EventSource('/api/admin/pixel-agents/stream')` et, pour chaque event SSE, dispatche :
   ```js
   window.dispatchEvent(new MessageEvent('message', { data: JSON.stringify(parsedEvent) }))
   ```

4. **Reconnexion automatique :** sur `EventSource.onerror`, backoff exponentiel (1s → 2s → 4s → max 30s). L'endpoint renvoie toujours la séquence d'init complète à chaque connexion.

#### 3. `/api/admin/pixel-agents/stream/route.ts` — Endpoint SSE

**Localisation :** `src/app/api/admin/pixel-agents/stream/route.ts`

```ts
export const runtime = 'nodejs'
```

**Guard local-only (avant tout import fs) :**
```ts
export async function GET(request: Request) {
  if (process.env.NODE_ENV !== 'development') {
    return new Response(null, { status: 404 })
  }
  // imports dynamiques après le guard
  const fs = await import('fs')
  const os = await import('os')
  const path = await import('path')
  const { PNG } = await import('pngjs')
  // ...
}
```

**Séquence d'initialisation à chaque connexion :**

1. Chemin des assets :
   ```ts
   const assetsRoot = path.join(os.homedir(), 'pixel-agents', 'dist', 'assets')
   ```

2. Décoder les PNG et envoyer les sprites (**volume estimé : ~100–200 KB de données JSON** pour l'ensemble des assets ; la séquence d'init prend typiquement < 500ms). Format des sprites : tableau 2D de strings hex `string[][]` (identique au format de `assetLoader.ts` de pixel-agents). Messages envoyés dans l'ordre :
   - `{ type: 'floorTilesLoaded', sprites: string[][][] }`
   - `{ type: 'wallTilesLoaded', sets: [...] }`
   - `{ type: 'characterSpritesLoaded', characters: [...] }`
   - `{ type: 'furnitureLoaded', catalog: [...] }`

3. Scanner `path.join(os.homedir(), '.claude', 'projects')` pour les JSONL actifs → `{ type: 'agentCreated', id, folderName }` pour chacun

**Watching en continu :**
- `fs.watch` + polling 2s par fichier JSONL
- Debounce 100ms sur les changements
- Parse JSONL ligne par ligne → streame : `agentStatus`, `agentToolStart`, `agentToolDone`, `agentToolsClear`, `agentToolPermission`, `agentToolPermissionClear`, `agentClosed`

**Format SSE :** `data: <JSON>\n\n`

**Nettoyage :** `request.signal.addEventListener('abort', cleanup)`

**Pas de mode lite :** le widget compact utilise un **polling REST simple** (`/api/admin/pixel-agents/status`, retourne JSON avec count + statuts) — pas de SSE. Seule l'iframe utilise l'endpoint SSE complet.

#### 4. Endpoint REST léger pour le widget

**Localisation :** `src/app/api/admin/pixel-agents/status/route.ts`

```ts
export const runtime = 'nodejs'

// GET /api/admin/pixel-agents/status
// Retourne: { agents: Array<{ id: number, status: 'active'|'idle'|'waiting' }> }
```

Lit les JSONL les plus récents (lecture statique, pas de watcher), déduit les statuts, retourne JSON. Le widget poll cet endpoint toutes les 3s quand la modal est fermée.

#### 5. `PixelAgentsWidgetClient.tsx` — Composant client dashboard

**Localisation :** `src/app/admin/_components/PixelAgentsWidgetClient.tsx`

**Un seul fichier, `'use client'`.** Le guard `NODE_ENV` est dans `page.tsx`, pas dans ce composant.

**Comportement :**
- Poll `/api/admin/pixel-agents/status` toutes les 3s → affiche les points de statut
- Clic sur le widget → ouvre modal
- La modal est rendue via `ReactDOM.createPortal(modal, document.body)` (z-index `z-50`, au-dessus du header admin `z-20`)
- Dimensions modal : `90vw × 90vh`, centrée, fond overlay semi-transparent
- Contenu modal : `<iframe src="/pixel-agents/index.html" width="100%" height="100%" />`
- Au chargement de l'iframe (`onLoad` sur l'élément `<iframe>`) :
  ```ts
  iframeRef.current.contentWindow.postMessage(
    { type: 'startPixelAgents' },
    window.location.origin  // origin explicite, jamais '*'
  )
  ```
- **Fermeture de la modal :**
  - Touche `Escape` (listener `document.keydown`)
  - Clic sur l'overlay derrière l'iframe : l'overlay est un `div` absolu couvrant toute la modal avec `pointer-events: auto`, l'iframe est au-dessus (`z-index` relatif), le clic sur l'overlay (en dehors de l'iframe) ferme la modal

---

## Intégration Dashboard

Dans `src/app/admin/(protected)/page.tsx` (Server Component) :

```tsx
const isDev = process.env.NODE_ENV === 'development'
// ...
{isDev && <PixelAgentsWidgetClient />}
```

`PixelAgentsWidgetClient` est importé directement. Pas de Server wrapper intermédiaire — le check se fait dans `page.tsx`.

Placé en bas de page, après les sections vans et témoignages existantes.

---

## Flux de données

**Widget compact (modal fermée) :**
```
GET /api/admin/pixel-agents/status (poll 3s)
  → lecture JSONL statique
  → JSON { agents: [...] }
  → points colorés dans le widget
```

**Modal ouverte :**
```
iframe onLoad → postMessage({ type: 'startPixelAgents' }, origin)
  → vscode-shim.js ouvre EventSource('/api/admin/pixel-agents/stream')
  → init : PNG decode → SSE sprite events → canvas loads assets
  → watch JSONL → SSE agent events → animations temps réel
```

---

## Setup manuel (première installation)

```bash
# 1. Builder pixel-agents (déjà fait)
cd ~/pixel-agents && npm run build

# 2. Copier le build dans public/
cp -r ~/pixel-agents/dist/webview/. public/pixel-agents/

# 3. Ajouter pngjs au projet Next.js
npm install pngjs
npm install -D @types/pngjs
```

Ajouter à `.gitignore` :
```
/public/pixel-agents/
```

---

## Ce qui n'est PAS inclus

- Éditeur de layout pixel-agents
- Lancement de nouveaux terminaux Claude depuis l'admin
- Fonctionnement en production / Vercel (404 explicite)

---

## Dépendances

- `pngjs` + `@types/pngjs` — à installer dans le projet Next.js
- `~/pixel-agents/dist/` — doit exister
