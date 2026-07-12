/**
 * indexnow-submit-all.ts
 * Soumet TOUTES les URLs du sitemap à IndexNow (Bing → ChatGPT search).
 * À lancer après une refonte, une reprise d'indexation ou un gros lot de
 * corrections : npx tsx scripts/indexnow-submit-all.ts
 */

import { pingIndexNow } from "../src/lib/indexnow";

async function main() {
  const res = await fetch("https://vanzonexplorer.com/sitemap.xml");
  const xml = await res.text();
  const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  console.log(`${urls.length} URLs trouvées dans le sitemap`);
  await pingIndexNow(urls);
  console.log("Soumission IndexNow terminée");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
