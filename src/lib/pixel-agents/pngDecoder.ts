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
