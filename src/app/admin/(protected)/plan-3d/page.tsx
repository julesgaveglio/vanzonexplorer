import Van3DViewer from "@/components/vba/Van3DViewer";

export const metadata = { title: "Plans 3D — Prototype — Admin Vanzon" };

export default function Plan3DPrototypePage() {
  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">
          Plans 3D — Prototype viewer
        </h1>
        <p className="mt-2 text-sm text-white/60 max-w-3xl">
          Prototype du visualiseur de plans d&apos;aménagement pour la VBA
          (That Open Engine, licence MIT). Le modèle affiché est une démo aux
          cotes réalistes générée par{" "}
          <code className="text-white/80">scripts/generate-demo-van-glb.ts</code>{" "}
          — remplacez-le par un export SketchUp (Fichier &gt; Exporter &gt;
          Modèle 3D &gt; .glb) pour tester avec un vrai plan.
        </p>
      </div>

      <Van3DViewer
        src="/demo/van-amenagement-demo.glb"
        className="h-[70vh] min-h-[480px]"
      />

      <div className="text-xs text-white/50 space-y-1 max-w-3xl">
        <p>
          <strong className="text-white/70">Mètre</strong> : cliquez 2 points
          (aimanté aux sommets du modèle) — Échap pour annuler.{" "}
          <strong className="text-white/70">Cote d&apos;arête</strong> :
          survolez une arête, sa dimension s&apos;affiche, cliquez pour la
          fixer. Le panneau « Aménagements » isole chaque composant du modèle
          (chaque groupe/composant SketchUp devient une entrée).
        </p>
        <p>
          En production VBA : le fichier .glb sera stocké en privé (Supabase
          Storage) et servi via une route API derrière le gating{" "}
          <code>profiles.plan = &quot;vba_member&quot;</code> — celui-ci est
          public car c&apos;est une démo sans donnée sensible.
        </p>
      </div>
    </div>
  );
}
