/**
 * pinterest/client.ts — Wrapper Pinterest API v5
 *
 * Gère le rate limiting (2s entre chaque appel) et les erreurs gracieuses.
 * Retourne null sur 403/429 (trial account), throw sur 5xx.
 */

const PINTEREST_API_BASE = "https://api.pinterest.com/v5";

// ── Rate limiting ──────────────────────────────────────────────────────────────

let lastCallTime = 0;

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function rateLimitedFetch(url: string, options?: RequestInit): Promise<Response> {
  const now = Date.now();
  const elapsed = now - lastCallTime;
  if (elapsed < 2000) {
    await sleep(2000 - elapsed);
  }
  lastCallTime = Date.now();

  const token = process.env.PINTEREST_ACCESS_TOKEN;
  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
    ...(options?.headers ?? {}),
  };

  return fetch(url, { ...options, headers });
}

// ── Interfaces ─────────────────────────────────────────────────────────────────

export interface PinterestBoard {
  id: string;
  name: string;
  description?: string;
  pin_count?: number;
  follower_count?: number;
  privacy?: string;
}

export interface PinterestPin {
  id: string;
  title?: string;
  description?: string;
  board_id?: string;
  link?: string;
  save_count?: number;
  media?: {
    media_type?: string;
    images?: Record<string, { url: string; width: number; height: number }>;
  };
}

interface PinterestBoardsResponse {
  items?: PinterestBoard[];
  bookmark?: string;
}

interface PinterestSearchResponse {
  items?: PinterestPin[];
  bookmark?: string;
}

interface PinterestPinsResponse {
  items?: PinterestPin[];
  bookmark?: string;
}

// ── API Functions ──────────────────────────────────────────────────────────────

/**
 * Récupère tous les boards du compte connecté (pagination incluse).
 */
export async function fetchUserBoards(): Promise<PinterestBoard[]> {
  const boards: PinterestBoard[] = [];
  let bookmark: string | undefined;

  do {
    const url = new URL(`${PINTEREST_API_BASE}/boards`);
    url.searchParams.set("page_size", "25");
    if (bookmark) url.searchParams.set("bookmark", bookmark);

    const resp = await rateLimitedFetch(url.toString());

    if (resp.status === 403 || resp.status === 401) {
      console.warn("[Pinterest] Accès refusé (Trial ou token invalide) — fetchUserBoards");
      return boards;
    }
    if (resp.status === 429) {
      console.warn("[Pinterest] Rate limit atteint — pause 30s");
      await sleep(30000);
      continue;
    }
    if (!resp.ok) {
      throw new Error(`[Pinterest] fetchUserBoards error ${resp.status}: ${await resp.text()}`);
    }

    const data: PinterestBoardsResponse = await resp.json();
    if (data.items) boards.push(...data.items);
    bookmark = data.bookmark;
  } while (bookmark);

  return boards;
}

/**
 * Recherche des pins par mot-clé.
 * Retourne null si accès refusé (trial read-only).
 */
export async function searchPins(query: string, maxResults = 25): Promise<PinterestPin[] | null> {
  const url = new URL(`${PINTEREST_API_BASE}/search/pins`);
  url.searchParams.set("query", query);
  url.searchParams.set("page_size", String(Math.min(maxResults, 50)));

  const resp = await rateLimitedFetch(url.toString());

  if (resp.status === 403 || resp.status === 401) {
    console.warn(`[Pinterest] searchPins("${query}") — accès refusé (Trial), retour null`);
    return null;
  }
  if (resp.status === 429) {
    console.warn("[Pinterest] Rate limit atteint sur searchPins");
    return null;
  }
  if (!resp.ok) {
    throw new Error(`[Pinterest] searchPins error ${resp.status}: ${await resp.text()}`);
  }

  const data: PinterestSearchResponse = await resp.json();
  return data.items ?? [];
}

/**
 * Récupère les pins d'un board.
 */
export async function fetchBoardPins(boardId: string, maxPins = 50): Promise<PinterestPin[]> {
  const pins: PinterestPin[] = [];
  let bookmark: string | undefined;

  do {
    const url = new URL(`${PINTEREST_API_BASE}/boards/${boardId}/pins`);
    url.searchParams.set("page_size", "25");
    if (bookmark) url.searchParams.set("bookmark", bookmark);

    const resp = await rateLimitedFetch(url.toString());

    if (resp.status === 403 || resp.status === 401) {
      console.warn(`[Pinterest] fetchBoardPins(${boardId}) — accès refusé`);
      return pins;
    }
    if (resp.status === 429) {
      await sleep(30000);
      continue;
    }
    if (!resp.ok) {
      throw new Error(`[Pinterest] fetchBoardPins error ${resp.status}: ${await resp.text()}`);
    }

    const data: PinterestPinsResponse = await resp.json();
    if (data.items) pins.push(...data.items);
    bookmark = data.bookmark;

    if (pins.length >= maxPins) break;
  } while (bookmark);

  return pins.slice(0, maxPins);
}
