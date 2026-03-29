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

/** Charge le layout par défaut (default-layout-{N}.json) */
export function loadDefaultLayout(): Record<string, unknown> | null {
  const assetsDir = ASSETS_ROOT;
  try {
    // Cherche le fichier versionné le plus récent
    let bestRevision = 0;
    let bestPath: string | null = null;
    for (const file of fs.readdirSync(assetsDir)) {
      const m = /^default-layout-(\d+)\.json$/.exec(file);
      if (m) {
        const rev = parseInt(m[1], 10);
        if (rev > bestRevision) { bestRevision = rev; bestPath = path.join(assetsDir, file); }
      }
    }
    if (!bestPath) {
      const fallback = path.join(assetsDir, 'default-layout.json');
      if (fs.existsSync(fallback)) bestPath = fallback;
    }
    if (!bestPath) return null;
    return JSON.parse(fs.readFileSync(bestPath, 'utf-8')) as Record<string, unknown>;
  } catch {
    return null;
  }
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

  // Layout du bureau (placement des meubles)
  const layout = loadDefaultLayout();
  if (layout) {
    messages.push({ type: 'layoutLoaded', layout });
  }

  // Paramètres requis par le webview pour initialiser correctement
  messages.push({ type: 'settingsLoaded', soundEnabled: false, extensionVersion: '1.2.0', lastSeenVersion: '1.2.0' });

  return messages;
}
