import Link from "next/link";
import Van3DViewer from "@/components/vba/Van3DViewer";

export const metadata = { title: "Plans 3D — Prototype — Admin Vanzon" };

/** Plans de test disponibles dans `public/plans-3d/` (voir le README du dossier). */
const PLANS = [
  {
    slug: "meuble-glaciere",
    label: "Meuble glacière",
    src: "/plans-3d/meuble-glaciere/meuble-glaciere.dae",
    note: "38 × 64 × 52 cm — portière ouvrante (outil Interagir), grilles d'aération.",
  },
  {
    slug: "lit-peigne",
    label: "Lit peigne",
    src: "/plans-3d/lit-peigne/lit-peigne.dae",
    note: "Lit peigne 180 × 120, organisé en 5 étapes de montage.",
  },
  {
    slug: "demo",
    label: "Démo générée",
    src: "/demo/van-amenagement-demo.glb",
    note: "Modèle GLB de démo (scripts/generate-demo-van-glb.ts).",
  },
];

/** Puce de section, reprise des autres pages admin. */
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <span className="h-px w-8 bg-slate-200" />
      <span className="text-xs font-semibold uppercase tracking-widest text-slate-400">
        {children}
      </span>
    </div>
  );
}

export default function Plan3DPrototypePage({
  searchParams,
}: {
  searchParams: { plan?: string };
}) {
  const plan = PLANS.find((p) => p.slug === searchParams.plan) ?? PLANS[0];

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900">Plans 3D — Prototype viewer</h1>
        <p className="mt-2 max-w-3xl text-sm text-slate-600">
          Visualiseur de plans d&apos;aménagement pour la VBA (That Open Engine,
          licence MIT). Il accepte les exports SketchUp en{" "}
          <code className="rounded bg-slate-100 px-1 py-0.5 text-[12px] text-slate-700">.dae</code>{" "}
          (Fichier &gt; Exporter &gt; Modèle 3D &gt; COLLADA) comme en{" "}
          <code className="rounded bg-slate-100 px-1 py-0.5 text-[12px] text-slate-700">.glb</code>{" "}
          — unités et axe Z-UP convertis automatiquement.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {PLANS.map((p) => (
          <a
            key={p.slug}
            href={`/admin/plan-3d?plan=${p.slug}`}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
              p.slug === plan.slug
                ? "bg-gradient-to-br from-[#B9945F] to-[#E4D398] text-slate-900 shadow-sm"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            {p.label}
          </a>
        ))}
        <Link
          href="/admin/plan-3d/lit-peigne"
          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50"
        >
          Fiche lit peigne →
        </Link>
        <Link
          href="/admin/plan-3d/vehicules"
          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50"
        >
          Librairie carrosseries →
        </Link>
      </div>

      <p className="text-xs text-slate-400">{plan.note}</p>

      <Van3DViewer key={plan.slug} src={plan.src} className="h-[70vh] min-h-[480px]" />

      <div className="space-y-4">
        <SectionLabel>Mode d&apos;emploi</SectionLabel>
        <div className="grid gap-3 lg:grid-cols-3">
          {[
            {
              title: "Mesurer",
              body: (
                <>
                  <strong className="text-slate-700">Mètre</strong> : deux clics.
                  L&apos;accroche prend les sommets, les milieux et n&apos;importe
                  quel point d&apos;une arête ; une fois le 1<sup>er</sup> point
                  posé, le repère passe en orange quand le point visé est
                  exactement aligné sur un axe — c&apos;est ainsi qu&apos;on trace
                  une mesure parallèle. Alt pour mesurer librement, Échap pour
                  annuler. <strong className="text-slate-700">Cote</strong> :
                  survolez une arête, cliquez pour la fixer.
                </>
              ),
            },
            {
              title: "Regarder",
              body: (
                <>
                  Les icônes suivantes recentrent la vue, affichent les contours
                  des planches et basculent en{" "}
                  <strong className="text-slate-700">vue éclatée</strong> (le
                  curseur règle l&apos;écartement des pièces), puis le fond
                  clair/sombre et la gomme.{" "}
                  <strong className="text-slate-700">Double-clic</strong> sur une
                  pièce pour y centrer l&apos;orbite : on peut alors zoomer au
                  ras de la matière sans plonger au centre du meuble.
                </>
              ),
            },
            {
              title: "Isoler",
              body: (
                <>
                  Le panneau « Aménagements » reprend la hiérarchie SketchUp sur
                  trois niveaux. Décochez pour masquer, dépliez pour atteindre une
                  planche précise, et l&apos;icône de cible au survol isole le
                  composant et cadre dessus. En bas à droite : encombrement total
                  du modèle.
                </>
              ),
            },
          ].map((card) => (
            <div
              key={card.title}
              className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm"
            >
              <h2 className="text-sm font-bold text-slate-900">{card.title}</h2>
              <p className="mt-1.5 text-xs leading-relaxed text-slate-500">{card.body}</p>
            </div>
          ))}
        </div>
      </div>

      <p className="max-w-3xl text-xs text-slate-400">
        En production VBA : les fichiers seront stockés en privé (Supabase
        Storage) et servis via une route API derrière le gating{" "}
        <code className="rounded bg-slate-100 px-1 py-0.5 text-slate-600">
          profiles.plan = &quot;vba_member&quot;
        </code>{" "}
        — ceux-ci sont publics car ce sont des tests sans donnée sensible.
      </p>
    </div>
  );
}
