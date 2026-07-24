import fs from "node:fs";
import path from "node:path";
import Link from "next/link";
import Van3DViewer from "@/components/vba/Van3DViewer";

export const metadata = { title: "Lit peigne 180 × 120 — Plans 3D — Admin Vanzon" };

const SLUG = "lit-peigne";
const SRC = `/plans-3d/${SLUG}/${SLUG}.dae`;

/**
 * Cible : 24 lattes de 7,5 cm imbriquées → 180 cm hors tout.
 * Relevé sur l'export du 22/07 : 15 lattes de 12 cm (8 mobiles + 7 fixes),
 * dents et vides de 12 cm, pas de 24 cm sur chaque peigne.
 */
const SLAT_COUNT = 24;
const SLAT_PITCH = 7.5;
const TARGET_LENGTH = SLAT_COUNT * SLAT_PITCH;
const TARGET_WIDTH = 120;
/** Pas d'un peigne : une dent + un vide. */
const COMB_PITCH = SLAT_PITCH * 2;

/** 7.5 → « 7,5 » */
const fr = (value: number) => value.toString().replace(".", ",");

export default function LitPeignePage() {
  const modelExists = fs.existsSync(
    path.join(process.cwd(), "public", "plans-3d", SLUG, `${SLUG}.dae`)
  );
  // Les dents mobiles occupent les rangs pairs, les fixes les rangs impairs.
  const mobile = Array.from({ length: SLAT_COUNT / 2 }, (_, i) => i * COMB_PITCH);
  const fixed = mobile.map((x) => x + SLAT_PITCH);

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-6xl mx-auto space-y-6">
      <div>
        <Link href="/admin/plan-3d" className="text-xs font-medium text-slate-400 hover:text-slate-600">
          ← Plans 3D
        </Link>
        <h1 className="mt-2 text-2xl font-black text-slate-900">
          Lit peigne — {TARGET_WIDTH} × {TARGET_LENGTH} cm
        </h1>
        <p className="mt-2 max-w-3xl text-sm text-slate-600">
          Fiche de redimensionnement : {SLAT_COUNT} lattes au pas de{" "}
          {fr(SLAT_PITCH)} cm, soit {TARGET_LENGTH} cm hors tout au lieu de 190,
          largeur inchangée à {TARGET_WIDTH} cm.
        </p>
      </div>

      {modelExists ? (
        <Van3DViewer src={SRC} className="h-[70vh] min-h-[480px]" />
      ) : (
        <div className="rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 p-8">
          <h2 className="text-sm font-bold text-slate-900">
            En attente de l&apos;export SketchUp
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">
            Le fichier <code className="rounded bg-white px-1 py-0.5 text-slate-700">{SRC}</code>{" "}
            n&apos;existe pas encore. Un <code className="rounded bg-white px-1 py-0.5 text-slate-700">.skp</code>{" "}
            ne peut pas être lu directement : toute la géométrie y est dans un
            blob binaire propriétaire. Il faut un export COLLADA du lit seul.
          </p>
          <pre className="mt-4 overflow-x-auto rounded-lg bg-slate-900 p-3 text-xs text-slate-100">
{`npx tsx scripts/prepare-plan-3d.ts "~/Downloads/Lit peigne.dae" ${SLUG} "Lit peigne"`}
          </pre>
        </div>
      )}

      {/* Spécification de redimensionnement */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-bold text-slate-900">Cible</h2>
          <dl className="mt-3 space-y-1.5 text-sm">
            {[
              ["Longueur", `${TARGET_LENGTH} cm (relevé actuel : 180)`],
              ["Largeur", `${TARGET_WIDTH} cm déplié · 80 replié`],
              ["Lattes", `${SLAT_COUNT} de ${fr(SLAT_PITCH)} cm (relevé : 15 de 12)`],
              ["Dents mobiles", `${SLAT_COUNT / 2} — 6 par demi-peigne`],
              ["Dents fixes", `${SLAT_COUNT / 2}`],
              ["Pas d'un peigne", `${fr(COMB_PITCH)} cm (relevé : 24)`],
            ].map(([term, value]) => (
              <div key={term} className="flex justify-between gap-4 border-t border-slate-50 pt-1.5">
                <dt className="text-slate-500">{term}</dt>
                <dd className="text-right font-medium tabular-nums text-slate-900">{value}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-bold text-slate-900">
            Départ de chaque dent (depuis la tête)
          </h2>
          {[
            { label: "Peignes mobiles", values: mobile, tint: "text-[#8A6A3C]" },
            { label: "Peigne fixe", values: fixed, tint: "text-amber-600" },
          ].map((row) => (
            <div key={row.label} className="mt-3">
              <p className={`text-[11px] font-semibold uppercase tracking-wide ${row.tint}`}>
                {row.label} — {row.values.length} dents de {fr(SLAT_PITCH)} cm
              </p>
              <div className="mt-1 grid grid-cols-4 gap-x-3 gap-y-1 text-xs tabular-nums text-slate-600 sm:grid-cols-6">
                {row.values.map((value) => (
                  <span key={value}>{value.toFixed(1).replace(".", ",")}</span>
                ))}
              </div>
            </div>
          ))}
          <p className="mt-3 text-xs text-slate-400">
            Les deux peignes s&apos;imbriquent : dent mobile, dent fixe, dent
            mobile… La dernière dent fixe finit à {TARGET_LENGTH} cm. Demi-peignes
            mobiles à 90 cm, 6 dents chacun.
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
        <h2 className="text-sm font-bold text-amber-900">Écart relevé sur le dernier export</h2>
        <p className="mt-2 text-sm text-amber-900/80">
          Le lit mesure bien 180 cm et toutes les pièces droites sont passées de
          187 à 177 cm. En revanche le peigne a été recoupé en{" "}
          <strong>15 dents de 12 cm</strong> (7 fixes + 8 mobiles, pas de 24 cm),
          et non en 24 dents de 7,5 cm. Les deux tombent sur 180 : à confirmer
          lequel fait foi.
        </p>
        <ul className="mt-3 space-y-1.5 text-sm text-amber-900/80 list-disc list-inside">
          <li>
            Les panneaux de peigne se redécoupent entièrement : les dents occupent
            toute la longueur, il n&apos;y a aucune zone lisse à couper.
          </li>
          <li>
            Le modèle a un jeu de 0 mm entre dent et vide — si le jeu est repris à
            l&apos;atelier, garder le principe.
          </li>
          <li>Le tiroir coulissant (104,6 cm) n&apos;est pas concerné.</li>
        </ul>
      </div>
    </div>
  );
}
