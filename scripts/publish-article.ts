#!/usr/bin/env tsx
/**
 * publish-article.ts
 *
 * CLI script to publish an article to Sanity with an auto-fetched Pexels cover image.
 *
 * Usage:
 *   npx tsx scripts/publish-article.ts \
 *     --title "Mon titre d'article" \
 *     --excerpt "Résumé de l'article..." \
 *     --category "Road Trips" \
 *     --keywords "van pays basque, bivouac" \
 *     --readTime "8 min" \
 *     --tag "Guide complet"
 *
 * Or provide article content as a JSON file:
 *   npx tsx scripts/publish-article.ts --file ./article-data.json
 *
 * Required env vars: PEXELS_API_KEY, SANITY_API_WRITE_TOKEN
 */

import { createClient } from "@sanity/client";
import { searchPexelsPhoto, downloadPexelsPhoto, buildPexelsCredit } from "../src/lib/pexels";

// ── Sanity client (write access) ──────────────────────────────────────────────
const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "lewexa74",
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
  apiVersion: "2024-01-01",
  token: process.env.SANITY_API_WRITE_TOKEN,
  useCdn: false,
});

// ── Parse CLI arguments ────────────────────────────────────────────────────────
function parseArgs(args: string[]): Record<string, string> {
  const result: Record<string, string> = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith("--")) {
      const key = args[i].slice(2);
      const value = args[i + 1] && !args[i + 1].startsWith("--") ? args[++i] : "true";
      result[key] = value;
    }
  }
  return result;
}

// ── Generate slug ──────────────────────────────────────────────────────────────
function toSlug(title: string): string {
  return title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

// ── Estimate read time ─────────────────────────────────────────────────────────
function estimateReadTime(text: string): string {
  const words = text.split(/\s+/).length;
  const minutes = Math.max(1, Math.round(words / 200));
  return `${minutes} min`;
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  const args = parseArgs(process.argv.slice(2));

  let articleData: {
    title: string;
    excerpt: string;
    category: string;
    keywords?: string;
    readTime?: string;
    tag?: string;
    content?: string;
    seoTitle?: string;
    seoDescription?: string;
  };

  if (args.file) {
    const fs = await import("fs/promises");
    const raw = await fs.readFile(args.file, "utf-8");
    articleData = JSON.parse(raw);
  } else {
    if (!args.title || !args.excerpt || !args.category) {
      console.error("Required: --title, --excerpt, --category");
      console.error("Optional: --keywords, --readTime, --tag, --content, --seoTitle, --seoDescription");
      process.exit(1);
    }
    articleData = args as typeof articleData;
  }

  const {
    title,
    excerpt,
    category,
    keywords,
    tag,
    content,
    seoTitle,
    seoDescription,
  } = articleData;

  const slug = toSlug(title);
  const readTime = articleData.readTime || estimateReadTime(excerpt + " " + (content || ""));

  console.log(`\nPublishing article: "${title}"`);
  console.log(`Slug: ${slug}`);
  console.log(`Category: ${category}`);

  // 1. Search Pexels for a cover image
  const searchQuery = keywords || title;
  console.log(`\nSearching Pexels for: "${searchQuery}"...`);
  const photo = await searchPexelsPhoto(searchQuery);

  if (!photo) {
    console.error("No Pexels photo found for the given keywords. Try different keywords.");
    process.exit(1);
  }

  console.log(`Found photo #${photo.id} by ${photo.photographer}`);
  console.log(`Photo URL: ${photo.url}`);

  // 2. Download photo and upload to Sanity
  console.log("\nDownloading photo...");
  const imageBuffer = await downloadPexelsPhoto(photo);

  console.log("Uploading to Sanity...");
  const imageAsset = await sanity.assets.upload("image", imageBuffer, {
    filename: `pexels-${photo.id}.jpg`,
    contentType: "image/jpeg",
  });

  console.log(`Uploaded image asset: ${imageAsset._id}`);

  // 3. Build content blocks if plain text provided
  let contentBlocks = undefined;
  if (content) {
    contentBlocks = content.split("\n\n").filter(Boolean).map((paragraph) => ({
      _type: "block",
      _key: Math.random().toString(36).slice(2),
      style: "normal",
      children: [{ _type: "span", _key: Math.random().toString(36).slice(2), text: paragraph, marks: [] }],
      markDefs: [],
    }));
  }

  // 4. Create Sanity document
  const doc = {
    _type: "article",
    title,
    slug: { _type: "slug", current: slug },
    excerpt,
    category,
    tag: tag || undefined,
    readTime,
    publishedAt: new Date().toISOString(),
    featured: false,
    coverImage: {
      _type: "image",
      asset: { _type: "reference", _ref: imageAsset._id },
      alt: photo.alt || title,
      credit: buildPexelsCredit(photo),
      pexelsId: photo.id,
      pexelsUrl: photo.url,
    },
    ...(contentBlocks ? { content: contentBlocks } : {}),
    ...(seoTitle ? { seoTitle } : {}),
    ...(seoDescription ? { seoDescription } : {}),
  };

  console.log("\nCreating Sanity document...");
  const created = await sanity.create(doc);

  console.log(`\nArticle published successfully!`);
  console.log(`  Sanity ID: ${created._id}`);
  console.log(`  Slug: /articles/${slug}`);
  console.log(`  Cover: Photo by ${photo.photographer} on Pexels`);
  console.log(`\nView in Sanity Studio: https://vanzon.sanity.studio/desk/article`);
}

main().catch((err) => {
  console.error("\nError:", err.message);
  process.exit(1);
});
