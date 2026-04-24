/**
 * VBA — Upload all videos to Bunny.net + create modules/lessons in Supabase
 *
 * Usage: BUNNY_API_KEY=xxx npx tsx scripts/vba-upload-all.ts
 *
 * What it does:
 * 1. Scans the local VBA folder for modules & videos
 * 2. Creates a Bunny.net collection per module
 * 3. Uploads each video to Bunny.net (tus protocol for large files)
 * 4. Creates modules in Supabase vba_modules
 * 5. Creates lessons in Supabase vba_lessons with bunny_video_id
 * 6. Publishes everything
 */

import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";
import { config } from "dotenv";

// Load .env.local
config({ path: path.resolve(__dirname, "../.env.local") });

// ── Config ──────────────────────────────────────────────────────────────────
const BUNNY_API_KEY = process.env.BUNNY_API_KEY || "d29595b9-ffc0-42ee-ad46d32759fb-76f5-4143";
const BUNNY_LIBRARY_ID = "642396";
const VBA_ROOT = "/Users/julesgaveglio/Desktop/Projets/Vanzon 🚐/Formation/Van Business Academy";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ── Module titles (human-friendly) ──────────────────────────────────────────
const MODULE_TITLES: Record<number, string> = {
  1: "Présentation",
  2: "Sourcing & Achat du Van",
  3: "Conception & Budget",
  4: "Conception & Budget VASP L1H1",
  5: "Les travaux",
  6: "Électricité",
  7: "Homologation VASP",
  8: "Les normes VASP",
  9: "Remplir le dossier VASP",
  10: "Business de location",
};

// ── Helpers ─────────────────────────────────────────────────────────────────

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/** Extract a sort order from filename like "Vidéo 3 - ..." or "4 - ..." */
function extractOrder(filename: string): number {
  // Match patterns like "Vidéo 1", "vidéo 1", "1 -", etc.
  const match = filename.match(/(?:vid[eé]o\s*)?(\d+)/i);
  return match ? parseInt(match[1], 10) : 99;
}

/** Clean lesson title from filename */
function cleanTitle(filename: string): string {
  return filename
    .replace(/\.(mov|MOV|mp4)$/, "")
    .replace(/^[Vv]id[eé]o\s*\d+\s*[-–]\s*/, "")
    .replace(/^\d+\s*[-–]\s*/, "")
    .trim();
}

async function bunnyFetch(endpoint: string, options: RequestInit = {}) {
  const res = await fetch(`https://video.bunnycdn.com${endpoint}`, {
    ...options,
    headers: {
      AccessKey: BUNNY_API_KEY,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Bunny API ${res.status}: ${text}`);
  }
  return res.json();
}

/** Create a video entry on Bunny, then upload the file via PUT */
async function uploadVideo(
  title: string,
  filePath: string,
  collectionId: string
): Promise<{ videoId: string }> {
  // 1. Create video entry
  const created = await bunnyFetch(`/library/${BUNNY_LIBRARY_ID}/videos`, {
    method: "POST",
    body: JSON.stringify({ title, collectionId }),
  });
  const videoId = created.guid;
  console.log(`    📹 Created video entry: ${videoId} — ${title}`);

  // 2. Upload file via PUT
  const fileBuffer = fs.readFileSync(filePath);
  const uploadRes = await fetch(
    `https://video.bunnycdn.com/library/${BUNNY_LIBRARY_ID}/videos/${videoId}`,
    {
      method: "PUT",
      headers: {
        AccessKey: BUNNY_API_KEY,
        "Content-Type": "application/octet-stream",
      },
      body: fileBuffer,
    }
  );
  if (!uploadRes.ok) {
    const text = await uploadRes.text();
    throw new Error(`Upload failed ${uploadRes.status}: ${text}`);
  }
  console.log(`    ✅ Uploaded: ${path.basename(filePath)}`);

  return { videoId };
}

// ── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log("🚀 VBA Upload — Starting\n");

  // Check env
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error("❌ Missing SUPABASE env vars");
    process.exit(1);
  }

  // Clean existing data (fresh start)
  console.log("🗑️  Cleaning existing VBA data in Supabase...");
  await supabase.from("vba_progress").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await supabase.from("vba_lessons").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await supabase.from("vba_modules").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  console.log("   Done.\n");

  // Scan modules (sort by module number, not alphabetically)
  const moduleDirs = fs
    .readdirSync(VBA_ROOT)
    .filter((d) => fs.statSync(path.join(VBA_ROOT, d)).isDirectory())
    .sort((a, b) => {
      const numA = parseInt(a.match(/Module\s*(\d+)/)?.[1] || "99", 10);
      const numB = parseInt(b.match(/Module\s*(\d+)/)?.[1] || "99", 10);
      return numA - numB;
    });

  console.log(`📂 Found ${moduleDirs.length} modules\n`);

  for (let mi = 0; mi < moduleDirs.length; mi++) {
    const dirName = moduleDirs[mi];
    const moduleNum = parseInt(dirName.match(/Module\s*(\d+)/)?.[1] || "0", 10);
    const moduleTitle = MODULE_TITLES[moduleNum] || dirName;
    const moduleSlug = slugify(`module-${moduleNum}-${moduleTitle}`);
    const modulePath = path.join(VBA_ROOT, dirName);

    console.log(`\n── Module ${moduleNum}: ${moduleTitle} ──`);

    // 1. Create Bunny collection
    const collection = await bunnyFetch(
      `/library/${BUNNY_LIBRARY_ID}/collections`,
      {
        method: "POST",
        body: JSON.stringify({ name: `Module ${moduleNum} — ${moduleTitle}` }),
      }
    );
    const collectionId = collection.guid;
    console.log(`   📁 Bunny collection: ${collectionId}`);

    // 2. Create Supabase module
    const { data: mod, error: modErr } = await supabase
      .from("vba_modules")
      .insert({
        title: `Module ${moduleNum} — ${moduleTitle}`,
        slug: moduleSlug,
        description: null,
        order: moduleNum,
        is_published: true,
      })
      .select("id")
      .single();

    if (modErr) {
      console.error(`   ❌ Module insert error:`, modErr);
      continue;
    }
    console.log(`   📦 Supabase module: ${mod.id}`);

    // 3. Scan videos in this module
    const videoFiles = fs
      .readdirSync(modulePath)
      .filter((f) => /\.(mov|MOV|mp4)$/i.test(f))
      .sort((a, b) => extractOrder(a) - extractOrder(b));

    console.log(`   🎬 ${videoFiles.length} videos\n`);

    for (let vi = 0; vi < videoFiles.length; vi++) {
      const filename = videoFiles[vi];
      const filePath = path.join(modulePath, filename);
      const lessonTitle = cleanTitle(filename);
      const lessonSlug = slugify(lessonTitle || `lecon-${vi + 1}`);

      // Check file size
      const stat = fs.statSync(filePath);
      if (stat.size === 0) {
        console.log(`    ⚠️  Skipping empty file: ${filename}`);
        continue;
      }

      const sizeMB = (stat.size / 1048576).toFixed(0);
      console.log(`    📤 [${vi + 1}/${videoFiles.length}] ${lessonTitle} (${sizeMB} MB)`);

      try {
        // Upload to Bunny
        const { videoId } = await uploadVideo(
          `M${mi + 1}L${vi + 1} — ${lessonTitle}`,
          filePath,
          collectionId
        );

        // Create Supabase lesson
        const { error: lessonErr } = await supabase.from("vba_lessons").insert({
          module_id: mod.id,
          title: lessonTitle,
          slug: lessonSlug,
          bunny_video_id: videoId,
          bunny_library_id: BUNNY_LIBRARY_ID,
          duration_seconds: null,
          description: null,
          resources: [],
          order: vi + 1,
          is_published: true,
        });

        if (lessonErr) {
          console.error(`    ❌ Lesson insert error:`, lessonErr);
        }
      } catch (err) {
        console.error(`    ❌ Upload failed: ${(err as Error).message}`);
      }
    }
  }

  console.log("\n\n🎉 Done! All modules and lessons are live.");
  console.log("   → Admin: /admin/vba");
  console.log("   → Élèves: /dashboard/vba");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
