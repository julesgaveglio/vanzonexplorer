/**
 * indexnow.ts
 * Ping IndexNow pour accélérer l'indexation des nouvelles pages.
 */

const INDEXNOW_KEY = process.env.INDEXNOW_KEY || "vanzon-indexnow-key-2026";
const SITE_URL = "https://vanzonexplorer.com";

export async function pingIndexNow(urls: string[]): Promise<void> {
  if (!urls.length) return;

  try {
    const body = {
      host: "vanzonexplorer.com",
      key: INDEXNOW_KEY,
      keyLocation: `${SITE_URL}/${INDEXNOW_KEY}.txt`,
      urlList: urls,
    };

    // Ping Google + Bing en parallèle
    await Promise.all([
      fetch(`https://www.bing.com/indexnow`, {
        method: "POST",
        headers: { "Content-Type": "application/json; charset=utf-8" },
        body: JSON.stringify(body),
      }),
      fetch(`https://api.indexnow.org/indexnow`, {
        method: "POST",
        headers: { "Content-Type": "application/json; charset=utf-8" },
        body: JSON.stringify(body),
      }),
    ]);

    console.log(`[IndexNow] Pinged ${urls.length} URL(s)`);
  } catch (err) {
    console.warn("[IndexNow] Ping failed (non-critical):", err);
  }
}
