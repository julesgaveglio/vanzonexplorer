import Van3DViewer from "@/components/vba/Van3DViewer";

/**
 * Plan 3D interactif sous la vidéo d'une leçon.
 *
 * Le plan est rattaché à la leçon par convention de nom : un dossier
 * `public/plans-3d/<slug de la leçon>/` suffit à le faire apparaître, sans
 * réglage en base ni en admin (voir `findLessonPlan`).
 */
export default function VBALessonPlan3D({ src }: { src: string }) {
  return (
    <section className="mb-4 sm:mb-6">
      <div className="mb-2 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
          Plan 3D interactif
        </h2>
        <p className="text-xs text-slate-400">
          Mesurez, isolez une pièce, ouvrez le meuble ou éclatez-le pour voir
          l&apos;assemblage.
        </p>
      </div>
      <Van3DViewer src={src} className="h-[380px] sm:h-[520px]" />
    </section>
  );
}
