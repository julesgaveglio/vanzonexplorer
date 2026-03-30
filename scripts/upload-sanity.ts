import { createClient } from '@sanity/client';
import { readFileSync } from 'fs';

const client = createClient({
  projectId: 'lewexa74',
  dataset: 'production',
  token: process.env.SANITY_API_WRITE_TOKEN,
  apiVersion: '2024-01-01',
  useCdn: false,
});

async function main() {
  const buffer = readFileSync('/tmp/bivouac-irati.webp');
  const asset = await client.assets.upload('image', buffer, {
    filename: 'bivouac-altitude-irati.webp',
    contentType: 'image/webp',
  });
  console.log('ASSET_URL:' + asset.url);
}

main();
