"use server";

import { adminWriteClient, adminReadClient } from "@/lib/sanity/adminClient";
import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import fs from "fs";
import path from "path";
import { groq } from "next-sanity";

async function requireAuth() {
  const { userId } = await auth();
  if (!userId) throw new Error("Non autorise");
}

export type IiliImage = {
  url: string;
  file: string;
  line: number;
  isMigrated?: boolean;
  sanityUrl?: string;
};

// ── Scan all source files for iili.io / freeimage.host URLs
export async function scanExternalImages(): Promise<IiliImage[]> {
  await requireAuth();

  const srcDir = path.join(process.cwd(), "src");
  const found: IiliImage[] = [];
  const PATTERN = /https?:\/\/(iili\.io|freeimage\.host)\/[A-Za-z0-9._-]+/g;

  function scan(dir: string) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory() && !entry.name.startsWith(".")) {
        scan(fullPath);
      } else if (/\.(tsx?|js)$/.test(entry.name)) {
        const content = fs.readFileSync(fullPath, "utf-8");
        const lines = content.split("\n");
        lines.forEach((line, i) => {
          const matches = Array.from(line.matchAll(PATTERN));
          matches.forEach((m) => {
            found.push({
              url: m[0],
              file: fullPath.replace(process.cwd(), "").replace(/\\/g, "/"),
              line: i + 1,
            });
          });
        });
      }
    }
  }

  scan(srcDir);

  // Deduplicate by URL, keep first occurrence
  const seen = new Set<string>();
  const unique = found.filter((f) => {
    if (seen.has(f.url)) return false;
    seen.add(f.url);
    return true;
  });

  // Check which ones are already in Sanity (via usedIn field)
  const migratedQuery = groq`*[_type == "mediaAsset" && defined(usedIn) && usedIn match "Migre depuis:*"] { usedIn }`;
  const migrated = await adminReadClient.fetch<{ usedIn: string }[]>(migratedQuery);
  const migratedUrls = new Set(
    migrated?.map((m) => m.usedIn?.replace("Migre depuis: ", "").trim()) ?? []
  );

  return unique.map((img) => ({
    ...img,
    isMigrated: migratedUrls.has(img.url),
  }));
}

// ── Update mediaAsset metadata
export async function updateMediaAsset(
  id: string,
  data: {
    title?: string;
    alt?: string;
    category?: string;
    tags?: string[];
    usedIn?: string;
    hotspot?: { x: number; y: number; width: number; height: number };
    crop?: { top: number; right: number; bottom: number; left: number };
  }
) {
  await requireAuth();

  const patch = adminWriteClient.patch(id);

  if (data.title !== undefined) patch.set({ title: data.title });
  if (data.alt !== undefined) patch.set({ "image.alt": data.alt });
  if (data.category !== undefined) patch.set({ category: data.category });
  if (data.tags !== undefined) patch.set({ tags: data.tags });
  if (data.usedIn !== undefined) patch.set({ usedIn: data.usedIn });
  if (data.hotspot !== undefined) patch.set({ "image.hotspot": data.hotspot });
  if (data.crop !== undefined) patch.set({ "image.crop": data.crop });

  await patch.commit();
  revalidatePath("/admin/media");
}

// ── Delete a mediaAsset document AND its underlying Sanity image asset
export async function deleteMediaAsset(id: string) {
  await requireAuth();

  // Récupérer la référence à l'asset Sanity avant suppression
  const doc = await adminReadClient.fetch<{ assetRef?: string }>(
    groq`*[_id == $id][0]{ "assetRef": image.asset._ref }`,
    { id }
  );

  await adminWriteClient.delete(id);

  // Supprimer l'asset binaire (best-effort : peut échouer s'il est référencé ailleurs)
  if (doc?.assetRef) {
    try {
      await adminWriteClient.delete(doc.assetRef);
    } catch {
      // Asset encore référencé dans un autre document — on ne bloque pas
    }
  }

  revalidatePath("/admin/media");
}

// ── Suppression groupée de plusieurs mediaAssets + leurs assets binaires
export async function bulkDeleteMediaAssets(ids: string[]) {
  await requireAuth();
  if (!ids.length) return;

  // Récupérer tous les refs d'assets en une seule requête
  const docs = await adminReadClient.fetch<{ _id: string; assetRef?: string }[]>(
    groq`*[_id in $ids]{ _id, "assetRef": image.asset._ref }`,
    { ids }
  );

  // Supprimer les documents en parallèle
  await Promise.all(ids.map((id) => adminWriteClient.delete(id)));

  // Supprimer les assets binaires (best-effort)
  await Promise.allSettled(
    docs.filter((d) => d.assetRef).map((d) => adminWriteClient.delete(d.assetRef!))
  );

  revalidatePath("/admin/media");
}
