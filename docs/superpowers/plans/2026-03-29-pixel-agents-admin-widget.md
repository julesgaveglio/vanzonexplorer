# Pixel Agents Admin Widget — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Intégrer le canvas pixel art de Pixel Agents dans le dashboard admin Next.js sous forme d'un widget compact + modal, visible uniquement en local dev.

**Architecture:** Le build statique du webview pixel-agents est copié dans `public/pixel-agents/`. Un shim JS remplace l'API VS Code par SSE. Deux routes API Next.js gèrent respectivement le streaming d'état complet (SSE, pour l'iframe) et un polling léger de statut (REST, pour le widget). Le widget est un client component ajouté en bas du dashboard.

**Tech Stack:** Next.js 14 App Router, pngjs (décodage PNG), fs/os/path (Node.js), EventSource (SSE), ReactDOM.createPortal, TypeScript

**Spec:** `docs/superpowers/specs/2026-03-29-pixel-agents-admin-widget-design.md`

---

## Chunk 1: Setup — Build copy, shim, dépendances

### Task 1: Installer pngjs et mettre à jour .gitignore

**Files:**
- Modify: `package.json`
- Modify: `.gitignore`

- [ ] **Step 1: Installer pngjs**

```bash
cd /Users/julesgaveglio/vanzon-website-claude-code
npm install pngjs
npm install -D @types/pngjs
```

Expected output : `added N packages` sans erreur.

- [ ] **Step 2: Vérifier que pngjs est dans package.json**

```bash
grep pngjs package.json
```

Expected output : deux lignes — une dans `dependencies`, une dans `devDependencies`.

- [ ] **Step 3: Ajouter public/pixel-agents/ au .gitignore**

Ajouter à la fin de `.gitignore` :

```
# pixel-agents webview build (generated artifact, rebuild with: cp -r ~/pixel-agents/dist/webview/. public/pixel-agents/)
/public/pixel-agents/
```

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json .gitignore
git commit -m "chore: install pngjs, gitignore pixel-agents webview build"
```

---

### Task 2: Copier le build pixel-agents et créer le shim

**Files:**
- Create: `public/pixel-agents/` (depuis `~/pixel-agents/dist/webview/`)
- Create: `public/pixel-agents/vscode-shim.js`
- Modify: `public/pixel-agents/index.html`

- [ ] **Step 1: Copier le build du webview**

```bash
mkdir -p /Users/julesgaveglio/vanzon-website-claude-code/public/pixel-agents
cp -r /Users/julesgaveglio/pixel-agents/dist/webview/. /Users/julesgaveglio/vanzon-website-claude-code/public/pixel-agents/
```

Expected : `public/pixel-agents/index.html` existe.

```bash
ls /Users/julesgaveglio/vanzon-website-claude-code/public/pixel-agents/
```

Expected : `index.html`, `assets/` (dossier).

- [ ] **Step 2: Identifier le bundle principal dans index.html**

```bash
cat /Users/julesgaveglio/vanzon-website-claude-code/public/pixel-agents/index.html
```

Repérer la ligne `<script type="module" src="...">` — c'est avant celle-ci qu'on injecte le shim.

- [ ] **Step 3: Injecter le shim dans index.html**

Trouver la ligne `<script type="module"` et ajouter `<script src="/pixel-agents/vscode-shim.js"></script>` juste avant.

Exemple — si index.html contient :
```html
    <script type="module" crossorigin src="/pixel-agents/assets/index-XXXXXXXX.js"></script>
```

Remplacer par :
```html
    <script src="/pixel-agents/vscode-shim.js"></script>
    <script type="module" crossorigin src="/pixel-agents/assets/index-XXXXXXXX.js"></script>
```

(Utiliser le nom de fichier réel visible dans index.html.)

- [ ] **Step 4: Créer public/pixel-agents/vscode-shim.js**

```js
/**
 * vscode-shim.js — Remplace l'API VS Code par SSE pour l'admin Next.js.
 * Chargé avant le bundle pixel-agents principal.
 */
(function () {
  'use strict';

  // --- 1. Fournir window.acquireVsCodeApi() avant que le bundle ne s'exécute ---
  window.acquireVsCodeApi = function () {
    return {
      postMessage: function () {
        // Messages webview → extension ignorés en mode web
      },
      getState: function () {
        return undefined;
      },
      setState: function () {},
    };
  };

  // --- 2. Connexion SSE (déclenchée par message parent) ---
  var eventSource = null;
  var reconnectDelay = 1000;
  var reconnectTimer = null;

  function connectSSE() {
    if (eventSource) {
      eventSource.close();
    }
    eventSource = new EventSource('/api/admin/pixel-agents/stream');

    eventSource.onmessage = function (event) {
      try {
        var data = JSON.parse(event.data);
        window.dispatchEvent(new MessageEvent('message', { data: event.data }));
      } catch (e) {
        console.warn('[pixel-shim] Failed to parse SSE event:', e);
      }
    };

    eventSource.onopen = function () {
      reconnectDelay = 1000; // reset backoff on successful connection
    };

    eventSource.onerror = function () {
      eventSource.close();
      eventSource = null;
      // Backoff exponentiel : 1s → 2s → 4s → ... → 30s max
      reconnectTimer = setTimeout(function () {
        reconnectDelay = Math.min(reconnectDelay * 2, 30000);
        connectSSE();
      }, reconnectDelay);
    };
  }

  // --- 3. Écouter le trigger du parent (iframe parent envoie { type: 'startPixelAgents' }) ---
  window.addEventListener('message', function (event) {
    if (event.data && event.data.type === 'startPixelAgents') {
      connectSSE();
    }
  });
})();
```

- [ ] **Step 5: Vérifier que la page se charge sans erreur**

Démarrer le dev server si pas déjà actif :
```bash
npm run dev
```

Ouvrir `http://localhost:3000/pixel-agents/index.html` dans le navigateur.
Expected : la page se charge (canvas vide ou fond sombre), pas d'erreur "acquireVsCodeApi is not defined" dans la console.

- [ ] **Step 6: Commit**

```bash
# Note: public/pixel-agents/ est entièrement gitignorée (ajoutée au .gitignore en Task 1).
# Aucun fichier de ce dossier ne peut être commité. On commite uniquement le plan.
git add docs/superpowers/plans/2026-03-29-pixel-agents-admin-widget.md
git commit -m "docs: add pixel-agents admin widget implementation plan"
```

---

## Chunk 2: API Route SSE — Streaming complet

### Task 3: Créer les utilitaires de décodage PNG (copiés de pixel-agents)

**Files:**
- Create: `src/lib/pixel-agents/pngDecoder.ts`
- Create: `src/lib/pixel-agents/types.ts`

Ces fichiers sont des copies des utilitaires purs (sans dépendance VS Code) de `~/pixel-agents/shared/assets/`.

- [ ] **Step 1: Créer src/lib/pixel-agents/types.ts**

```typescript
// Types partagés pour le décodage des sprites pixel-agents

export interface CharacterDirectionSprites {
  down: string[][][];
  up: string[][][];
  right: string[][][];
}

export interface FurnitureAsset {
  id: string;
  name: string;
  label: string;
  category: string;
  file: string;
  width: number;
  height: number;
  footprintW: number;
  footprintH: number;
  isDesk: boolean;
  canPlaceOnWalls?: boolean;
  canPlaceOnSurfaces?: boolean;
  backgroundTiles?: boolean;
  groupId: string;
  orientation?: string;
  state?: string;
  rotationScheme?: string;
}
```

- [ ] **Step 2: Créer src/lib/pixel-agents/pngDecoder.ts**

```typescript
/**
 * Utilitaires de décodage PNG pour pixel-agents.
 * Copiés/adaptés depuis ~/pixel-agents/shared/assets/pngDecoder.ts (pas de dépendance VS Code).
 */

// Constantes pixel-agents
const PNG_ALPHA_THRESHOLD = 10;
const FLOOR_TILE_SIZE = 16;
const WALL_PIECE_WIDTH = 16;
const WALL_PIECE_HEIGHT = 32;
const WALL_BITMASK_COUNT = 16;
const WALL_GRID_COLS = 4;
const CHAR_FRAME_W = 16;
const CHAR_FRAME_H = 32;
const CHAR_FRAMES_PER_ROW = 7;
const CHARACTER_DIRECTIONS = ['down', 'up', 'right'] as const;
const CHAR_COUNT = 6;

import type { CharacterDirectionSprites } from './types';

export { CHAR_COUNT };

function rgbaToHex(r: number, g: number, b: number, a: number): string {
  if (a < PNG_ALPHA_THRESHOLD) return '';
  const rgb = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`.toUpperCase();
  if (a >= 255) return rgb;
  return `${rgb}${a.toString(16).padStart(2, '0').toUpperCase()}`;
}

export function pngToSpriteData(pngData: { width: number; height: number; data: Buffer }, width: number, height: number): string[][] {
  const sprite: string[][] = [];
  for (let y = 0; y < height; y++) {
    const row: string[] = [];
    for (let x = 0; x < width; x++) {
      const idx = (y * pngData.width + x) * 4;
      row.push(rgbaToHex(pngData.data[idx], pngData.data[idx + 1], pngData.data[idx + 2], pngData.data[idx + 3]));
    }
    sprite.push(row);
  }
  return sprite;
}

export function decodeFloorPng(pngData: { width: number; height: number; data: Buffer }): string[][] {
  return pngToSpriteData(pngData, FLOOR_TILE_SIZE, FLOOR_TILE_SIZE);
}

export function parseWallPng(pngData: { width: number; height: number; data: Buffer }): string[][][] {
  const sprites: string[][][] = [];
  for (let mask = 0; mask < WALL_BITMASK_COUNT; mask++) {
    const ox = (mask % WALL_GRID_COLS) * WALL_PIECE_WIDTH;
    const oy = Math.floor(mask / WALL_GRID_COLS) * WALL_PIECE_HEIGHT;
    const sprite: string[][] = [];
    for (let r = 0; r < WALL_PIECE_HEIGHT; r++) {
      const row: string[] = [];
      for (let c = 0; c < WALL_PIECE_WIDTH; c++) {
        const idx = ((oy + r) * pngData.width + (ox + c)) * 4;
        row.push(rgbaToHex(pngData.data[idx], pngData.data[idx + 1], pngData.data[idx + 2], pngData.data[idx + 3]));
      }
      sprite.push(row);
    }
    sprites.push(sprite);
  }
  return sprites;
}

export function decodeCharacterPng(pngData: { width: number; height: number; data: Buffer }): CharacterDirectionSprites {
  const charData: CharacterDirectionSprites = { down: [], up: [], right: [] };
  for (let dirIdx = 0; dirIdx < CHARACTER_DIRECTIONS.length; dirIdx++) {
    const dir = CHARACTER_DIRECTIONS[dirIdx];
    const rowOffsetY = dirIdx * CHAR_FRAME_H;
    const frames: string[][][] = [];
    for (let f = 0; f < CHAR_FRAMES_PER_ROW; f++) {
      const sprite: string[][] = [];
      const frameOffsetX = f * CHAR_FRAME_W;
      for (let y = 0; y < CHAR_FRAME_H; y++) {
        const row: string[] = [];
        for (let x = 0; x < CHAR_FRAME_W; x++) {
          const idx = ((rowOffsetY + y) * pngData.width + (frameOffsetX + x)) * 4;
          row.push(rgbaToHex(pngData.data[idx], pngData.data[idx + 1], pngData.data[idx + 2], pngData.data[idx + 3]));
        }
        sprite.push(row);
      }
      frames.push(sprite);
    }
    charData[dir] = frames;
  }
  return charData;
}
```

- [ ] **Step 3: Vérifier que le fichier compile (TypeScript)**

```bash
npx tsc --noEmit 2>&1 | grep pixel-agents
```

Expected : aucune erreur sur `src/lib/pixel-agents/`.

- [ ] **Step 4: Commit**

```bash
git add src/lib/pixel-agents/
git commit -m "feat(pixel-agents): add PNG decoder utilities"
```

---

### Task 4: Créer l'utilitaire de chargement des assets

**Files:**
- Create: `src/lib/pixel-agents/assetLoader.ts`

- [ ] **Step 1: Créer src/lib/pixel-agents/assetLoader.ts**

```typescript
/**
 * Charge les assets PNG de pixel-agents depuis ~/pixel-agents/dist/assets/
 * et les retourne sous forme de messages prêts à être envoyés via SSE.
 */
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { PNG } from 'pngjs';

import {
  CHAR_COUNT,
  decodeCharacterPng,
  decodeFloorPng,
  parseWallPng,
  pngToSpriteData,
} from './pngDecoder';
import type { CharacterDirectionSprites, FurnitureAsset } from './types';

export const ASSETS_ROOT = path.join(os.homedir(), 'pixel-agents', 'dist', 'assets');

function readPng(filePath: string): { width: number; height: number; data: Buffer } {
  const buffer = fs.readFileSync(filePath);
  return PNG.sync.read(buffer);
}

/** Charge les sprites de sol (floor_0.png, floor_1.png, ...) */
export function loadFloorSprites(): string[][][] {
  const floorsDir = path.join(ASSETS_ROOT, 'floors');
  if (!fs.existsSync(floorsDir)) return [];
  const files = fs.readdirSync(floorsDir)
    .map((f) => { const m = /^floor_(\d+)\.png$/i.exec(f); return m ? { index: parseInt(m[1], 10), f } : null; })
    .filter((x): x is { index: number; f: string } => x !== null)
    .sort((a, b) => a.index - b.index);
  return files.map(({ f }) => decodeFloorPng(readPng(path.join(floorsDir, f))));
}

/** Charge les sprites de mur (wall.png ou wall_0.png, ...) */
export function loadWallSprites(): string[][][][] {
  const wallsDir = path.join(ASSETS_ROOT, 'walls');
  if (!fs.existsSync(wallsDir)) return [];
  const wallFiles = fs.readdirSync(wallsDir).filter((f) => /\.png$/i.test(f));
  return wallFiles.map((f) => parseWallPng(readPng(path.join(wallsDir, f))));
}

/** Charge les sprites des 6 personnages */
export function loadCharacterSprites(): CharacterDirectionSprites[] {
  const charsDir = path.join(ASSETS_ROOT, 'characters');
  const characters: CharacterDirectionSprites[] = [];
  for (let i = 0; i < CHAR_COUNT; i++) {
    const filePath = path.join(charsDir, `char_${i}.png`);
    if (!fs.existsSync(filePath)) break;
    characters.push(decodeCharacterPng(readPng(filePath)));
  }
  return characters;
}

export interface FurnitureAssets {
  catalog: FurnitureAsset[];
  sprites: Record<string, string[][]>;
}

/** Charge les assets furniture depuis assets/furniture/ */
export function loadFurnitureAssets(): FurnitureAssets {
  const furnitureDir = path.join(ASSETS_ROOT, 'furniture');
  if (!fs.existsSync(furnitureDir)) return { catalog: [], sprites: {} };

  const catalog: FurnitureAsset[] = [];
  const sprites: Record<string, string[][]> = {};

  const dirs = fs.readdirSync(furnitureDir, { withFileTypes: true }).filter((e) => e.isDirectory());

  for (const dir of dirs) {
    const itemDir = path.join(furnitureDir, dir.name);
    const manifestPath = path.join(itemDir, 'manifest.json');
    if (!fs.existsSync(manifestPath)) continue;

    try {
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));

      // Traitement simplifié : un asset par dossier (type 'asset') ou groupe (type 'group')
      const processEntry = (entry: {
        id: string; name: string; label?: string; category: string;
        file?: string; width?: number; height?: number;
        footprintW?: number; footprintH?: number;
        canPlaceOnWalls?: boolean; canPlaceOnSurfaces?: boolean;
        backgroundTiles?: boolean; groupId?: string;
        orientation?: string; state?: string; rotationScheme?: string;
      }) => {
        const filename = entry.file ?? `${entry.id}.png`;
        const filePath = path.join(itemDir, filename);
        if (!fs.existsSync(filePath)) return;

        const pngData = readPng(filePath);
        const w = entry.width ?? pngData.width;
        const h = entry.height ?? pngData.height;

        sprites[entry.id] = pngToSpriteData(pngData, w, h);
        catalog.push({
          id: entry.id,
          name: entry.name,
          label: entry.label ?? entry.name,
          category: entry.category ?? manifest.category,
          file: filename,
          width: w,
          height: h,
          footprintW: entry.footprintW ?? 1,
          footprintH: entry.footprintH ?? 1,
          isDesk: (entry.category ?? manifest.category) === 'desks',
          canPlaceOnWalls: entry.canPlaceOnWalls ?? manifest.canPlaceOnWalls,
          canPlaceOnSurfaces: entry.canPlaceOnSurfaces ?? manifest.canPlaceOnSurfaces,
          backgroundTiles: entry.backgroundTiles ?? manifest.backgroundTiles,
          groupId: entry.groupId ?? manifest.id,
          orientation: entry.orientation,
          state: entry.state,
          rotationScheme: entry.rotationScheme,
        });
      };

      if (manifest.type === 'asset') {
        processEntry({ ...manifest, groupId: manifest.id });
      } else if (manifest.type === 'group' && Array.isArray(manifest.items)) {
        for (const item of manifest.items) {
          processEntry({ ...item, category: item.category ?? manifest.category, groupId: manifest.id });
        }
      }
    } catch (e) {
      console.warn(`[pixel-agents assetLoader] Skipping ${dir.name}:`, e);
    }
  }

  return { catalog, sprites };
}

/** Retourne tous les messages d'init à envoyer au webview */
export function buildInitMessages(): object[] {
  const messages: object[] = [];

  const floorSprites = loadFloorSprites();
  if (floorSprites.length > 0) {
    messages.push({ type: 'floorTilesLoaded', sprites: floorSprites });
  }

  const wallSets = loadWallSprites();
  if (wallSets.length > 0) {
    messages.push({ type: 'wallTilesLoaded', sets: wallSets });
  }

  const characters = loadCharacterSprites();
  if (characters.length > 0) {
    messages.push({ type: 'characterSpritesLoaded', characters });
  }

  const { catalog, sprites } = loadFurnitureAssets();
  if (catalog.length > 0) {
    messages.push({ type: 'furnitureAssetsLoaded', catalog, sprites });
  }

  return messages;
}
```

- [ ] **Step 2: Vérifier la compilation TypeScript**

```bash
npx tsc --noEmit 2>&1 | grep -E "pixel-agents|pngjs"
```

Expected : aucune erreur.

- [ ] **Step 3: Tester le chargement des assets manuellement**

Créer un fichier temporaire `scripts/test-pixel-assets.ts` :

```ts
import { buildInitMessages, ASSETS_ROOT } from '../src/lib/pixel-agents/assetLoader'
import { existsSync } from 'fs'

console.log('Assets root:', ASSETS_ROOT)
console.log('Assets exist:', existsSync(ASSETS_ROOT))

const msgs = buildInitMessages()
console.log('Init messages:', msgs.map((m: any) => `${m.type} (${JSON.stringify(m).length} bytes)`))
```

```bash
npx tsx scripts/test-pixel-assets.ts
```

Expected (exemple) :
```
Assets root: /Users/.../pixel-agents/dist/assets
Assets exist: true
Init messages: [
  'floorTilesLoaded (XXX bytes)',
  'wallTilesLoaded (XXX bytes)',
  'characterSpritesLoaded (XXX bytes)',
  'furnitureAssetsLoaded (XXX bytes)'
]
```

Supprimer le fichier de test :
```bash
rm scripts/test-pixel-assets.ts
```

- [ ] **Step 4: Commit**

```bash
git add src/lib/pixel-agents/assetLoader.ts
git commit -m "feat(pixel-agents): add asset loader for SSE init"
```

---

### Task 5: Créer l'utilitaire de parsing JSONL

**Files:**
- Create: `src/lib/pixel-agents/jsonlParser.ts`

- [ ] **Step 1: Créer src/lib/pixel-agents/jsonlParser.ts**

```typescript
/**
 * Parse les fichiers JSONL de sessions Claude Code
 * et retourne les événements pixel-agents correspondants.
 */
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

export interface AgentEvent {
  type: string;
  id: number;
  [key: string]: unknown;
}

/** Trouve les fichiers JSONL actifs dans ~/.claude/projects/ */
export function findActiveJsonlFiles(): Array<{ id: number; filePath: string; projectDir: string; folderName: string }> {
  const claudeProjectsDir = path.join(os.homedir(), '.claude', 'projects');
  if (!fs.existsSync(claudeProjectsDir)) return [];

  const results: Array<{ id: number; filePath: string; projectDir: string; folderName: string }> = [];
  let agentId = 1;

  try {
    const projectDirs = fs.readdirSync(claudeProjectsDir, { withFileTypes: true })
      .filter((e) => e.isDirectory());

    for (const dir of projectDirs) {
      const projectPath = path.join(claudeProjectsDir, dir.name);
      try {
        const jsonlFiles = fs.readdirSync(projectPath)
          .filter((f) => f.endsWith('.jsonl'))
          .map((f) => ({
            file: f,
            mtime: fs.statSync(path.join(projectPath, f)).mtimeMs,
          }))
          .sort((a, b) => b.mtime - a.mtime); // plus récent en premier

        if (jsonlFiles.length > 0) {
          // Décoder le nom du dossier de projet (URL-encoded path)
          const folderName = decodeURIComponent(dir.name.replace(/-/g, '/')).split('/').pop() ?? dir.name;
          results.push({
            id: agentId++,
            filePath: path.join(projectPath, jsonlFiles[0].file),
            projectDir: projectPath,
            folderName,
          });
        }
      } catch {
        // Ignorer les dossiers illisibles
      }
    }
  } catch {
    // Ignorer si ~/.claude/projects n'est pas accessible
  }

  return results;
}

/** Parse une ligne JSONL et retourne les événements pixel-agents correspondants */
export function parseJsonlLine(agentId: number, line: string): AgentEvent[] {
  if (!line.trim()) return [];
  const events: AgentEvent[] = [];

  try {
    const record = JSON.parse(line);
    const assistantContent = record.message?.content ?? record.content;

    if (record.type === 'assistant' && Array.isArray(assistantContent)) {
      const hasToolUse = assistantContent.some((b: { type: string }) => b.type === 'tool_use');
      if (hasToolUse) {
        events.push({ type: 'agentStatus', id: agentId, status: 'active' });
        for (const block of assistantContent as Array<{ type: string; id?: string; name?: string; input?: Record<string, unknown> }>) {
          if (block.type === 'tool_use' && block.id) {
            const toolName = block.name ?? '';
            events.push({ type: 'agentToolStart', id: agentId, toolId: block.id, toolName, status: `Using ${toolName}` });
          }
        }
      } else {
        // Texte pur — idle après 5s (simplifié : on envoie idle immédiatement)
        events.push({ type: 'agentStatus', id: agentId, status: 'idle' });
      }
    }

    if (record.type === 'user' && Array.isArray(assistantContent)) {
      for (const block of assistantContent as Array<{ type: string; tool_use_id?: string }>) {
        if (block.type === 'tool_result' && block.tool_use_id) {
          events.push({ type: 'agentToolDone', id: agentId, toolId: block.tool_use_id });
        }
      }
    }

    if (record.type === 'system' && record.subtype === 'turn_duration') {
      events.push({ type: 'agentToolsClear', id: agentId });
      events.push({ type: 'agentStatus', id: agentId, status: 'idle' });
    }
  } catch {
    // Ignorer les lignes JSONL malformées
  }

  return events;
}
```

- [ ] **Step 2: Vérifier la compilation**

```bash
npx tsc --noEmit 2>&1 | grep jsonlParser
```

Expected : aucune erreur.

- [ ] **Step 3: Commit**

```bash
git add src/lib/pixel-agents/jsonlParser.ts
git commit -m "feat(pixel-agents): add JSONL parser for agent state events"
```

---

### Task 6: Créer l'endpoint SSE

**Files:**
- Create: `src/app/api/admin/pixel-agents/stream/route.ts`

- [ ] **Step 1: Créer le dossier et la route**

```bash
mkdir -p /Users/julesgaveglio/vanzon-website-claude-code/src/app/api/admin/pixel-agents/stream
```

- [ ] **Step 2: Créer src/app/api/admin/pixel-agents/stream/route.ts**

```typescript
// import type est effacé à la compilation — safe même avec le guard dynamique ci-dessous
import type { FSWatcher } from 'fs';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  // Guard local-only — avant tout import fs effectif
  if (process.env.NODE_ENV !== 'development') {
    return new Response(null, { status: 404 });
  }

  // Imports dynamiques nommés après le guard (évite le bundling sur Vercel)
  const { statSync, openSync, readSync, closeSync, watch, existsSync } = await import('fs');
  const { buildInitMessages } = await import('@/lib/pixel-agents/assetLoader');
  const { findActiveJsonlFiles, parseJsonlLine } = await import('@/lib/pixel-agents/jsonlParser');

  const encoder = new TextEncoder();
  const abortSignal = request.signal;

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: object) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        } catch {
          // Stream déjà fermé
        }
      };

      // Cleanup registry
      const watchers: FSWatcher[] = [];
      const intervals: ReturnType<typeof setInterval>[] = [];

      const cleanup = () => {
        watchers.forEach((w) => { try { w.close(); } catch {} });
        intervals.forEach((i) => clearInterval(i));
        watchers.length = 0;
        intervals.length = 0;
      };

      abortSignal.addEventListener('abort', () => {
        cleanup();
        try { controller.close(); } catch {}
      });

      // 1. Envoyer les assets (init)
      try {
        const initMessages = buildInitMessages();
        for (const msg of initMessages) {
          send(msg);
        }
      } catch (e) {
        console.warn('[pixel-agents SSE] Failed to load assets:', e);
      }

      // 2. Trouver les sessions JSONL actives et envoyer agentCreated
      const sessions = findActiveJsonlFiles();
      const fileOffsets = new Map<number, number>(); // agentId → bytes lus

      for (const session of sessions) {
        send({ type: 'agentCreated', id: session.id, folderName: session.folderName });

        // Initialiser l'offset à la fin du fichier (on ne relit pas l'historique)
        try {
          const stat = statSync(session.filePath);
          fileOffsets.set(session.id, stat.size);
        } catch {
          fileOffsets.set(session.id, 0);
        }
      }

      // 3. Watcher + polling par session
      for (const session of sessions) {
        const { id, filePath } = session;
        let debounceTimer: ReturnType<typeof setTimeout> | null = null;

        const readNewLines = () => {
          try {
            const stat = statSync(filePath);
            const offset = fileOffsets.get(id) ?? stat.size;
            if (stat.size <= offset) return;

            const buffer = Buffer.alloc(stat.size - offset);
            const fd = openSync(filePath, 'r');
            readSync(fd, buffer, 0, buffer.length, offset);
            closeSync(fd);
            fileOffsets.set(id, stat.size);

            const newContent = buffer.toString('utf-8');
            const lines = newContent.split('\n');
            for (const line of lines) {
              const events = parseJsonlLine(id, line);
              for (const event of events) {
                send(event);
              }
            }
          } catch {
            // Fichier supprimé ou illisible
            send({ type: 'agentClosed', id });
          }
        };

        const debouncedRead = () => {
          if (debounceTimer) clearTimeout(debounceTimer);
          debounceTimer = setTimeout(readNewLines, 100);
        };

        try {
          const watcher = watch(filePath, debouncedRead);
          watchers.push(watcher);
        } catch {
          // fs.watch non supporté sur ce chemin
        }

        // Polling de secours toutes les 2s
        const pollInterval = setInterval(readNewLines, 2000);
        intervals.push(pollInterval);
      }

      // Keepalive toutes les 30s pour éviter la déconnexion
      const keepalive = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(': keepalive\n\n'));
        } catch {
          clearInterval(keepalive);
        }
      }, 30000);
      intervals.push(keepalive);
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
```

- [ ] **Step 3: Vérifier la compilation TypeScript**

```bash
npx tsc --noEmit 2>&1 | grep "pixel-agents/stream"
```

Expected : aucune erreur.

- [ ] **Step 4: Tester l'endpoint manuellement**

Avec le dev server en marche :
```bash
curl -N http://localhost:3000/api/admin/pixel-agents/stream 2>&1 | head -20
```

Expected : flux SSE commençant par des lignes `data: {"type":"floorTilesLoaded",...}` puis `data: {"type":"wallTilesLoaded",...}` etc.

- [ ] **Step 5: Commit**

```bash
git add src/app/api/admin/pixel-agents/stream/route.ts
git commit -m "feat(pixel-agents): add SSE stream endpoint"
```

---

## Chunk 3: API Route Status + Widget Component

### Task 7: Créer l'endpoint REST de statut

**Files:**
- Create: `src/app/api/admin/pixel-agents/status/route.ts`

- [ ] **Step 1: Créer le dossier**

```bash
mkdir -p /Users/julesgaveglio/vanzon-website-claude-code/src/app/api/admin/pixel-agents/status
```

- [ ] **Step 2: Créer src/app/api/admin/pixel-agents/status/route.ts**

```typescript
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  if (process.env.NODE_ENV !== 'development') {
    return new Response(null, { status: 404 });
  }

  const { statSync } = await import('fs');
  const { findActiveJsonlFiles } = await import('@/lib/pixel-agents/jsonlParser');

  const sessions = findActiveJsonlFiles();
  const agents: Array<{ id: number; folderName: string; status: 'active' | 'idle' }> = [];

  for (const session of sessions) {
    // Détecter si actif : le fichier JSONL a été modifié dans les 30 dernières secondes
    let status: 'active' | 'idle' = 'idle';
    try {
      const stat = statSync(session.filePath);
      const ageMs = Date.now() - stat.mtimeMs;
      if (ageMs < 30_000) status = 'active';
    } catch {
      continue; // Fichier disparu
    }
    agents.push({ id: session.id, folderName: session.folderName, status });
  }

  return Response.json({ agents });
}
```

- [ ] **Step 3: Tester l'endpoint**

```bash
curl http://localhost:3000/api/admin/pixel-agents/status
```

Expected :
```json
{"agents":[{"id":1,"folderName":"vanzon-website-claude-code","status":"active"}]}
```
(ou `{"agents":[]}` si aucune session active)

- [ ] **Step 4: Commit**

```bash
git add src/app/api/admin/pixel-agents/status/route.ts
git commit -m "feat(pixel-agents): add status polling endpoint"
```

---

### Task 8: Créer le widget client

**Files:**
- Create: `src/app/admin/_components/PixelAgentsWidgetClient.tsx`

- [ ] **Step 1: Créer src/app/admin/_components/PixelAgentsWidgetClient.tsx**

```tsx
'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom';

interface AgentInfo {
  id: number;
  folderName: string;
  status: 'active' | 'idle';
}

export function PixelAgentsWidgetClient() {
  const [agents, setAgents] = useState<AgentInfo[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Poll le statut toutes les 3s quand la modal est fermée
  useEffect(() => {
    if (modalOpen) return;
    const fetchStatus = async () => {
      try {
        const res = await fetch('/api/admin/pixel-agents/status');
        if (res.ok) {
          const data = await res.json();
          setAgents(data.agents ?? []);
        }
      } catch {
        // Silencieux — pas critique
      }
    };
    fetchStatus();
    const interval = setInterval(fetchStatus, 3000);
    return () => clearInterval(interval);
  }, [modalOpen]);

  // Déclencher la connexion SSE dans le shim quand l'iframe est prête
  const handleIframeLoad = useCallback(() => {
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage(
        { type: 'startPixelAgents' },
        window.location.origin
      );
    }
  }, []);

  // Fermer avec Escape
  useEffect(() => {
    if (!modalOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setModalOpen(false);
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [modalOpen]);

  const activeCount = agents.filter((a) => a.status === 'active').length;

  const modal = modalOpen
    ? ReactDOM.createPortal(
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 50,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* Overlay cliquable pour fermer */}
          <div
            onClick={() => setModalOpen(false)}
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(0,0,0,0.7)',
              cursor: 'pointer',
            }}
          />
          {/* Contenu modal au-dessus de l'overlay */}
          <div
            style={{
              position: 'relative',
              width: '90vw',
              height: '90vh',
              zIndex: 1,
              borderRadius: '8px',
              overflow: 'hidden',
              boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
            }}
          >
            <iframe
              ref={iframeRef}
              src="/pixel-agents/index.html"
              onLoad={handleIframeLoad}
              style={{ width: '100%', height: '100%', border: 'none' }}
              title="Pixel Office"
            />
          </div>
        </div>,
        document.body
      )
    : null;

  return (
    <>
      {/* Widget compact */}
      <div
        onClick={() => setModalOpen(true)}
        className="mt-4 flex cursor-pointer items-center gap-3 rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 transition-colors hover:border-blue-500/50 hover:bg-slate-800"
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && setModalOpen(true)}
        aria-label="Ouvrir Pixel Office"
      >
        <span className="text-xl">🏢</span>
        <div className="flex-1">
          <p className="text-sm font-semibold text-blue-400">Pixel Office</p>
          <p className="text-xs text-slate-400">
            {agents.length === 0
              ? 'Aucun agent détecté · cliquer pour voir'
              : `${agents.length} agent${agents.length > 1 ? 's' : ''} · ${activeCount} actif${activeCount > 1 ? 's' : ''} · cliquer pour voir`}
          </p>
        </div>
        {/* Points de statut */}
        <div className="flex gap-1.5">
          {agents.slice(0, 5).map((agent) => (
            <span
              key={agent.id}
              title={`${agent.folderName} (${agent.status})`}
              className={`h-2.5 w-2.5 rounded-full ${
                agent.status === 'active' ? 'bg-green-400' : 'bg-slate-500'
              }`}
            />
          ))}
          {agents.length === 0 && (
            <span className="h-2.5 w-2.5 rounded-full bg-slate-600" />
          )}
        </div>
      </div>

      {modal}
    </>
  );
}
```

- [ ] **Step 2: Vérifier la compilation TypeScript**

```bash
npx tsc --noEmit 2>&1 | grep "PixelAgentsWidgetClient"
```

Expected : aucune erreur.

- [ ] **Step 3: Commit**

```bash
git add src/app/admin/_components/PixelAgentsWidgetClient.tsx
git commit -m "feat(pixel-agents): add PixelAgentsWidgetClient component"
```

---

### Task 9: Intégrer le widget dans le dashboard admin

**Files:**
- Modify: `src/app/admin/(protected)/page.tsx`

- [ ] **Step 1: Lire la fin du fichier page.tsx pour trouver le bon endroit d'insertion**

```bash
tail -40 /Users/julesgaveglio/vanzon-website-claude-code/src/app/admin/\(protected\)/page.tsx
```

Identifier la dernière section du JSX (typiquement la section "External Tools" ou le closing `</main>`).

- [ ] **Step 2: Ajouter l'import et le widget dans page.tsx**

En haut du fichier, ajouter l'import :
```tsx
import { PixelAgentsWidgetClient } from "@/app/admin/_components/PixelAgentsWidgetClient";
```

Dans le JSX, juste avant la balise `</main>` finale (ou après le dernier bloc existant) :
```tsx
{/* Pixel Office — local dev uniquement */}
{process.env.NODE_ENV === 'development' && (
  <div className="mx-auto max-w-7xl px-4 pb-8 sm:px-6 lg:px-8">
    <PixelAgentsWidgetClient />
  </div>
)}
```

- [ ] **Step 3: Vérifier que le build compile sans erreur**

```bash
npm run build 2>&1 | tail -20
```

Expected : `✓ Compiled successfully` (ou équivalent Next.js 14). Aucune erreur TypeScript.

- [ ] **Step 4: Vérifier le rendu dans le navigateur**

Avec le dev server :
```bash
npm run dev
```

Aller sur `http://localhost:3000/admin` (se connecter si nécessaire).
Expected :
- Widget sombre "🏢 Pixel Office" visible en bas du dashboard
- Points de statut affichés
- Clic sur le widget → modal s'ouvre avec l'iframe
- Canvas pixel-agents visible dans la modal (fond sombre, bureau)
- Touche Escape → modal se ferme
- Clic sur l'overlay → modal se ferme

- [ ] **Step 5: Vérifier que le widget n'apparaît pas en production**

```bash
NODE_ENV=production node -e "console.log(process.env.NODE_ENV === 'development')"
```

Expected : `false`

- [ ] **Step 6: Commit final**

```bash
git add src/app/admin/\(protected\)/page.tsx
git commit -m "feat(pixel-agents): add Pixel Office widget to admin dashboard"
```

---

## Récapitulatif des fichiers créés/modifiés

| Fichier | Action |
|---|---|
| `.gitignore` | Modifié — ajout `/public/pixel-agents/` |
| `package.json` / `package-lock.json` | Modifié — ajout `pngjs`, `@types/pngjs` |
| `public/pixel-agents/` | Créé — build copié (gitignorée) |
| `public/pixel-agents/index.html` | Modifié — injection shim |
| `public/pixel-agents/vscode-shim.js` | Créé — shim VS Code API |
| `src/lib/pixel-agents/types.ts` | Créé — types sprites |
| `src/lib/pixel-agents/pngDecoder.ts` | Créé — décodage PNG |
| `src/lib/pixel-agents/assetLoader.ts` | Créé — chargement assets |
| `src/lib/pixel-agents/jsonlParser.ts` | Créé — parsing JSONL |
| `src/app/api/admin/pixel-agents/stream/route.ts` | Créé — SSE endpoint |
| `src/app/api/admin/pixel-agents/status/route.ts` | Créé — REST status endpoint |
| `src/app/admin/_components/PixelAgentsWidgetClient.tsx` | Créé — widget React |
| `src/app/admin/(protected)/page.tsx` | Modifié — ajout widget |
