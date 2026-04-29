/**
 * search-indexing.ts
 * Service centralisé pour notifier tous les moteurs de recherche
 * après une publication de contenu.
 *
 * Combine : IndexNow (Bing/Yandex/DuckDuckGo) + Google Ping Sitemap
 */

import { pingIndexNow } from "./indexnow";

const SITEMAP_URL = "https://vanzonexplorer.com/sitemap.xml";
const GOOGLE_PING_URL = `https://www.google.com/ping?sitemap=${encodeURIComponent(SITEMAP_URL)}`;

/**
 * Notifie tous les moteurs de recherche qu'une ou plusieurs URLs ont été publiées/modifiées.
 * Non-bloquant : les erreurs sont loguées mais ne remontent pas.
 */
export async function notifySearchEngines(urls: string[]): Promise<void> {
  if (!urls.length) return;

  console.log(`[Search Indexing] Notifying search engines for ${urls.length} URL(s)...`);

  await Promise.allSettled([
    // 1. IndexNow → Bing, Yandex, DuckDuckGo
    pingIndexNow(urls),

    // 2. Google Ping Sitemap → signale à Google que le sitemap a changé
    pingGoogleSitemap(),
  ]);

  console.log(`[Search Indexing] Done — ${urls.length} URL(s) submitted`);
}

async function pingGoogleSitemap(): Promise<void> {
  try {
    const res = await fetch(GOOGLE_PING_URL);
    if (res.ok) {
      console.log("  [Google Ping] ✅ Sitemap ping successful");
    } else {
      console.warn(`  [Google Ping] ⚠️ Status ${res.status}`);
    }
  } catch (err) {
    console.warn(`  [Google Ping] Failed (non-critical):`, err);
  }
}
