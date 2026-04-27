require('dotenv').config({ path: '.env.local' });

import { createClient } from '@sanity/client';

const client = createClient({
  projectId: 'lewexa74',
  dataset: 'production',
  apiVersion: '2024-01-01',
  token: process.env.SANITY_API_WRITE_TOKEN,
  useCdn: false,
});

// ── Types ──
interface MediaAsset {
  _id: string;
  title: string;
  category: string;
  tags: string[] | null;
  alt: string | null;
  imageUrl: string | null;
}

interface Enrichment {
  category?: string;
  tags?: string[];
  alt?: string;
  socialMood?: string;
}

// ── Helpers ──

function slugToWords(slug: string): string[] {
  return slug
    .replace(/[-_]/g, ' ')
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);
}

function titleContains(title: string, ...keywords: string[]): boolean {
  const lower = title.toLowerCase();
  return keywords.some(k => lower.includes(k));
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// ── Determine enrichment for each asset ──

function determineEnrichment(asset: MediaAsset): Enrichment | null {
  const { title, category, tags, alt } = asset;
  const lowerTitle = title.toLowerCase();
  const hasGoodTags = (tags?.length ?? 0) >= 3;
  const hasGoodAlt = (alt?.length ?? 0) >= 10 && alt !== title.replace(/-/g, ' ');
  const isGoodCategory = category !== 'divers' && category !== 'vans' && category !== 'van-yoni';

  // Skip if already fully enriched
  if (hasGoodTags && hasGoodAlt && isGoodCategory) {
    return null;
  }

  const enrichment: Enrichment = {};

  // ── BRANDING items ──
  if (titleContains(lowerTitle, 'logo', 'icone', 'label', 'nlabel')) {
    enrichment.category = 'branding';
    enrichment.socialMood = 'lifestyle';

    if (titleContains(lowerTitle, 'logo')) {
      enrichment.tags = ['Vanzon Explorer', 'logo', 'branding', 'identité visuelle'];
      enrichment.alt = 'Logo Vanzon Explorer — location van aménagé Pays Basque';
    } else if (titleContains(lowerTitle, 'icone-vba')) {
      enrichment.tags = ['VBA', 'formation', 'icône', 'Van Business Academy'];
      enrichment.alt = 'Icône Van Business Academy — formation Vanzon Explorer';
    } else if (titleContains(lowerTitle, 'label')) {
      enrichment.tags = ['Vanzon Explorer', 'vanlife', 'label', 'branding'];
      enrichment.alt = 'Label Vanlife x Vanzon Explorer — van aménagé';
    }
    return enrichment;
  }

  // ── IMG-68xx / IMG-69xx — van photos ──
  if (/^img[-_]?6[89]\d{2}$/i.test(lowerTitle)) {
    enrichment.category = 'van-interieur';
    enrichment.tags = ['van aménagé', 'intérieur van', 'Vanzon Explorer', 'Pays Basque'];
    enrichment.socialMood = 'cozy';

    if (lowerTitle === 'img-6810' || lowerTitle === 'img-6813') {
      enrichment.alt = 'Intérieur van aménagé bois et rangements — Vanzon Explorer';
    } else if (lowerTitle === 'img-6819') {
      enrichment.alt = 'Vue intérieur van aménagé confort — Vanzon Explorer';
    } else if (lowerTitle === 'img-6826') {
      enrichment.alt = 'Détail aménagement intérieur van bois — Vanzon Explorer';
    } else if (lowerTitle === 'img-6923') {
      enrichment.category = 'van-exterieur';
      enrichment.tags = ['van aménagé', 'extérieur', 'Vanzon Explorer', 'Pays Basque'];
      enrichment.alt = 'Van aménagé Vanzon Explorer vue extérieure';
      enrichment.socialMood = 'adventure';
    } else {
      enrichment.alt = `Photo van aménagé Vanzon Explorer — ${lowerTitle}`;
    }
    return enrichment;
  }

  // ── IMG_0043 (van-yoni) ──
  if (lowerTitle === 'img_0043') {
    enrichment.category = 'van-interieur';
    enrichment.tags = ['van aménagé', 'intérieur van', 'Yoni', 'Pays Basque', 'Vanzon Explorer'];
    enrichment.socialMood = 'cozy';
    // alt already good: "Intérieur Yoni — van aménagé Pays Basque"
    return enrichment;
  }

  // ── WhatsApp images ──
  if (titleContains(lowerTitle, 'whatsapp')) {
    enrichment.category = 'divers';
    enrichment.tags = ['Vanzon Explorer', 'van aménagé', 'photo client'];
    enrichment.alt = 'Photo van aménagé Vanzon Explorer — partage client';
    enrichment.socialMood = 'lifestyle';
    return enrichment;
  }

  // ── Van extérieur ──
  if (titleContains(lowerTitle, 'van-amenage-exterieur', 'van-amenagé-exterieur')) {
    enrichment.category = 'van-exterieur';
    enrichment.tags = tags?.length ? [...new Set([...tags, 'extérieur', 'van aménagé', 'Vanzon Explorer'])] : ['van aménagé', 'extérieur', 'location van', 'Vanzon Explorer', 'Pays Basque'];
    enrichment.socialMood = 'freedom';
    if (!hasGoodAlt) {
      enrichment.alt = 'Van aménagé Vanzon Explorer vue extérieure — location Pays Basque';
    }
    return enrichment;
  }

  // ── Van intérieur + aménagement ──
  if (titleContains(lowerTitle, 'van-amenage-interieur', 'van-amenagé-interieur', 'van-interieur', 'van vu interieur')) {
    const isFabrication = titleContains(lowerTitle, 'fabrication');
    enrichment.category = isFabrication ? 'van-amenagement' : 'van-interieur';
    enrichment.socialMood = isFabrication ? 'craft' : 'cozy';

    const baseTags = ['van aménagé', 'intérieur van', 'Vanzon Explorer'];
    if (titleContains(lowerTitle, 'lit')) baseTags.push('lit');
    if (titleContains(lowerTitle, 'confort')) baseTags.push('confort');
    if (titleContains(lowerTitle, 'cuisine')) baseTags.push('cuisine');
    if (titleContains(lowerTitle, 'mobilier')) baseTags.push('mobilier');
    if (titleContains(lowerTitle, 'fabrication')) baseTags.push('fabrication', 'bois');
    if (titleContains(lowerTitle, 'location')) baseTags.push('location van');
    if (titleContains(lowerTitle, 'pays-basque')) baseTags.push('Pays Basque');
    if (titleContains(lowerTitle, 'road-trip')) baseTags.push('road trip');

    enrichment.tags = [...new Set(baseTags)];

    if (!hasGoodAlt) {
      if (isFabrication) {
        enrichment.alt = 'Fabrication aménagement intérieur van bois — Vanzon Explorer';
      } else if (titleContains(lowerTitle, 'lit')) {
        enrichment.alt = 'Intérieur van aménagé avec lit confortable — Vanzon Explorer';
      } else if (titleContains(lowerTitle, 'mobilier', 'cuisine')) {
        enrichment.alt = 'Mobilier et cuisine intérieur van aménagé — Vanzon Explorer';
      } else if (lowerTitle === 'van vu interieur') {
        enrichment.alt = 'Vue intérieur van aménagé bois — Vanzon Explorer';
      } else {
        enrichment.alt = 'Intérieur van aménagé confort bois — Vanzon Explorer';
      }
    }
    return enrichment;
  }

  // ── Van aménagé + confort/lit (category "vans") ──
  if (category === 'vans') {
    enrichment.category = 'van-interieur';
    enrichment.socialMood = 'cozy';
    if (!hasGoodTags) {
      enrichment.tags = ['van aménagé', 'intérieur van', 'Vanzon Explorer', 'Pays Basque', 'road trip'];
    }
    if (!hasGoodAlt || (alt && alt.length < 10)) {
      enrichment.alt = 'Intérieur van aménagé confort — Vanzon Explorer';
    }
    return enrichment;
  }

  // ── Spot montagne ──
  if (titleContains(lowerTitle, 'montagne')) {
    enrichment.category = 'spot-montagne';
    enrichment.tags = tags?.length ? [...new Set([...tags, 'montagne', 'van aménagé', 'Vanzon Explorer'])] : ['van aménagé', 'montagne', 'road trip', 'nature', 'Vanzon Explorer'];
    enrichment.socialMood = 'adventure';
    if (!hasGoodAlt) {
      enrichment.alt = 'Van aménagé en montagne panoramique — Vanzon Explorer';
    }
    return enrichment;
  }

  // ── Spot forêt / nature ──
  if (titleContains(lowerTitle, 'foret', 'forêt', 'nature')) {
    enrichment.category = 'spot-nature';
    enrichment.tags = tags?.length ? [...new Set([...tags, 'forêt', 'nature', 'van aménagé'])] : ['van aménagé', 'forêt', 'nature', 'vanlife', 'Vanzon Explorer'];
    enrichment.socialMood = 'nature';
    if (!hasGoodAlt) {
      enrichment.alt = 'Van aménagé en forêt — escapade nature Vanzon Explorer';
    }
    return enrichment;
  }

  // ── Spot village / Pays Basque village ──
  if (titleContains(lowerTitle, 'village', 'pays-basque-village')) {
    enrichment.category = 'spot-village';
    enrichment.tags = tags?.length ? [...new Set([...tags, 'village', 'Pays Basque', 'van aménagé'])] : ['Pays Basque', 'village', 'côte basque', 'road trip', 'van aménagé'];
    enrichment.socialMood = 'lifestyle';
    if (!hasGoodAlt) {
      enrichment.alt = 'Village côtier Pays Basque — road trip van aménagé';
    }
    return enrichment;
  }

  // ── Spot océan / plage ──
  if (titleContains(lowerTitle, 'ocean', 'océan', 'plage')) {
    enrichment.category = 'spot-plage';
    enrichment.tags = tags?.length ? [...new Set([...tags, 'océan', 'plage', 'van aménagé', 'Vanzon Explorer'])] : ['van aménagé', 'océan', 'plage', 'road trip', 'Vanzon Explorer'];
    enrichment.socialMood = 'freedom';
    if (!hasGoodAlt) {
      enrichment.alt = 'Van aménagé face à l\'océan — Vanzon Explorer';
    }
    return enrichment;
  }

  // ── Van sur la route ──
  if (titleContains(lowerTitle, 'van-sur-la-route', 'road-trip') && category === 'divers') {
    enrichment.category = 'road-trip';
    enrichment.tags = ['van aménagé', 'road trip', 'route', 'vanlife', 'Vanzon Explorer'];
    enrichment.socialMood = 'adventure';
    if (!hasGoodAlt) {
      enrichment.alt = 'Van aménagé sur la route — road trip vanlife Vanzon Explorer';
    }
    return enrichment;
  }

  // ── Formation ──
  if (titleContains(lowerTitle, 'formation', 'vanzon-formation', 'business-academy')) {
    enrichment.category = 'formation';
    enrichment.socialMood = 'craft';
    if (!hasGoodTags) {
      enrichment.tags = ['formation', 'van aménagé', 'Van Business Academy', 'Vanzon Explorer'];
    }
    if (!hasGoodAlt) {
      enrichment.alt = 'Formation Van Business Academy — Vanzon Explorer';
    }
    return enrichment;
  }

  // ── Tournage vidéo ──
  if (titleContains(lowerTitle, 'tournage')) {
    enrichment.category = 'van-interieur';
    enrichment.socialMood = 'craft';
    if (!hasGoodTags) {
      enrichment.tags = ['van aménagé', 'intérieur van', 'tournage', 'Vanzon Explorer', 'lit van'];
    }
    if (!hasGoodAlt) {
      enrichment.alt = 'Tournage vidéo intérieur van aménagé — Vanzon Explorer';
    }
    return enrichment;
  }

  // ── Road trip articles (category already road-trip) — just ensure socialMood + fix missing alt ──
  if (category === 'road-trip') {
    const needsWork = !hasGoodAlt || !hasGoodTags;
    if (!needsWork && asset.alt) return null; // Skip fully enriched road trips

    enrichment.socialMood = 'adventure';

    // Parse "Spot Name — Region" pattern
    const match = title.match(/^(.+?)\s*—\s*(.+)$/);
    if (match) {
      const [, spotName, region] = match;
      if (!hasGoodAlt) {
        enrichment.alt = `${spotName} en ${region} — road trip van France`;
      }
    }
    return enrichment;
  }

  // ── Formation category items missing tags ──
  if (category === 'formation') {
    enrichment.socialMood = 'craft';
    if (!hasGoodTags) {
      const baseTags = ['formation', 'van aménagé', 'Vanzon Explorer'];
      if (titleContains(lowerTitle, 'electrique', 'électrique', '12v', 'solaire')) baseTags.push('électricité', 'installation');
      if (titleContains(lowerTitle, 'bois', 'meuble', 'fabrication')) baseTags.push('bois', 'fabrication');
      if (titleContains(lowerTitle, 'sketchup', '3d', 'plan')) baseTags.push('plan 3D', 'conception');
      if (titleContains(lowerTitle, 'yescapa', 'location', 'contrat')) baseTags.push('location', 'Yescapa');
      if (titleContains(lowerTitle, 'vasp', 'homologation')) baseTags.push('VASP', 'homologation');
      if (titleContains(lowerTitle, 'materiaux', 'matériaux')) baseTags.push('matériaux', 'isolation');
      if (titleContains(lowerTitle, 'avant', 'après')) baseTags.push('avant/après', 'transformation');
      enrichment.tags = baseTags;
    }
    return enrichment;
  }

  // ── Remaining "divers" items — categorize based on deeper title analysis ──
  if (category === 'divers') {
    // If it's about formation/aménagement
    if (titleContains(lowerTitle, 'amenagement', 'aménagement')) {
      enrichment.category = 'van-amenagement';
      enrichment.tags = tags?.length ? [...new Set([...tags, 'aménagement van', 'Vanzon Explorer'])] : ['van aménagé', 'aménagement', 'bois', 'Vanzon Explorer'];
      enrichment.socialMood = 'craft';
      if (!hasGoodAlt) {
        enrichment.alt = 'Aménagement intérieur van bois — Vanzon Explorer';
      }
      return enrichment;
    }

    // Van with extérieur mentions
    if (titleContains(lowerTitle, 'exterieur', 'extérieur')) {
      enrichment.category = 'van-exterieur';
      enrichment.socialMood = 'freedom';
      if (!hasGoodTags) {
        enrichment.tags = ['van aménagé', 'extérieur', 'Vanzon Explorer', 'Pays Basque'];
      }
      if (!hasGoodAlt) {
        enrichment.alt = 'Van aménagé Vanzon Explorer vue extérieure — Pays Basque';
      }
      return enrichment;
    }

    // Generic van-related
    if (titleContains(lowerTitle, 'van')) {
      enrichment.category = 'van-exterieur';
      enrichment.socialMood = 'adventure';
      if (!hasGoodTags) {
        enrichment.tags = ['van aménagé', 'road trip', 'Vanzon Explorer'];
      }
      if (!hasGoodAlt) {
        enrichment.alt = 'Van aménagé Vanzon Explorer — road trip vanlife';
      }
      return enrichment;
    }

    // Fallback for remaining divers
    enrichment.socialMood = 'lifestyle';
    return enrichment;
  }

  // ── van-yoni / van-xalbat — just add socialMood ──
  if (category === 'van-yoni' || category === 'van-xalbat') {
    enrichment.socialMood = 'cozy';
    if (!hasGoodTags) {
      enrichment.tags = ['van aménagé', category === 'van-yoni' ? 'Yoni' : 'Xalbat', 'Vanzon Explorer', 'Pays Basque'];
    }
    return enrichment;
  }

  return null;
}

// ── Main ──
async function main() {
  console.log('🔍 Fetching all mediaAsset documents from Sanity...');

  const assets: MediaAsset[] = await client.fetch(
    `*[_type == "mediaAsset"]{_id, title, category, tags, "alt": image.alt, "imageUrl": image.asset->url}`
  );

  console.log(`📦 Found ${assets.length} media assets\n`);

  let enriched = 0;
  let skipped = 0;
  let errors = 0;

  // Compute enrichments
  const toProcess: { asset: MediaAsset; enrichment: Enrichment }[] = [];

  for (const asset of assets) {
    const enrichment = determineEnrichment(asset);
    if (!enrichment || Object.keys(enrichment).length === 0) {
      skipped++;
      continue;
    }
    toProcess.push({ asset, enrichment });
  }

  console.log(`📝 ${toProcess.length} assets need enrichment, ${skipped} already good\n`);

  // Process in batches of 5
  const BATCH_SIZE = 5;
  for (let i = 0; i < toProcess.length; i += BATCH_SIZE) {
    const batch = toProcess.slice(i, i + BATCH_SIZE);

    const promises = batch.map(async ({ asset, enrichment }) => {
      try {
        const patch: Record<string, unknown> = {};

        if (enrichment.category) patch.category = enrichment.category;
        if (enrichment.tags) patch.tags = enrichment.tags;
        if (enrichment.alt) patch['image.alt'] = enrichment.alt;
        if (enrichment.socialMood) patch.socialMood = enrichment.socialMood;

        if (Object.keys(patch).length === 0) return;

        await client.patch(asset._id).set(patch).commit();
        enriched++;

        const changes = Object.entries(patch)
          .map(([k, v]) => `${k}=${typeof v === 'string' ? v.substring(0, 40) : JSON.stringify(v)}`)
          .join(' | ');
        console.log(`✅ [${enriched}] "${asset.title}" → ${changes}`);
      } catch (err: unknown) {
        errors++;
        const msg = err instanceof Error ? err.message : String(err);
        console.error(`❌ Error on "${asset.title}": ${msg}`);
      }
    });

    await Promise.all(promises);

    // Small delay between batches to avoid rate limits
    if (i + BATCH_SIZE < toProcess.length) {
      await new Promise(r => setTimeout(r, 300));
    }
  }

  console.log(`\n🏁 Done! Enriched: ${enriched}, Skipped: ${skipped}, Errors: ${errors}`);
}

main().catch(console.error);
