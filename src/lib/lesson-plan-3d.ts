import fs from "node:fs";
import path from "node:path";

const PLANS_DIR = path.join(process.cwd(), "public", "plans-3d");
const EXTENSIONS = ["dae", "glb", "gltf"] as const;

/**
 * Plan 3D d'une leçon VBA, rattaché par convention de nom : la leçon
 * « meuble-glaciere » affiche `public/plans-3d/meuble-glaciere/meuble-glaciere.dae`.
 * Déposer le dossier (via `scripts/prepare-plan-3d.ts`) suffit — rien à régler
 * en base ni dans l'admin.
 *
 * @returns le chemin public du modèle, ou null si la leçon n'en a pas.
 */
/**
 * Slugs de leçons qui disposent d'un plan 3D. Sert à la barre latérale : une
 * leçon sans vidéo mais avec un plan reste accessible au lieu d'être affichée
 * « Bientôt disponible ».
 */
export function listLessonPlans(): string[] {
  if (!fs.existsSync(PLANS_DIR)) return [];
  return fs
    .readdirSync(PLANS_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && findLessonPlan(entry.name))
    .map((entry) => entry.name);
}

export function findLessonPlan(lessonSlug: string): string | null {
  if (!/^[a-z0-9-]+$/.test(lessonSlug)) return null;
  for (const extension of EXTENSIONS) {
    const file = `${lessonSlug}.${extension}`;
    if (fs.existsSync(path.join(PLANS_DIR, lessonSlug, file))) {
      return `/plans-3d/${lessonSlug}/${file}`;
    }
  }
  return null;
}
