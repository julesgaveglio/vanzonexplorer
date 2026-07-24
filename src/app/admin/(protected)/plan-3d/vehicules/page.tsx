import fs from "node:fs";
import path from "node:path";
import Link from "next/link";
import { LAYOUT_REFERENCES, LICENSE_LABELS, VEHICLES } from "./catalogue";

export const metadata = { title: "Librairie carrosseries — Plans 3D — Admin Vanzon" };

const sketchfab = (uid: string) => `https://sketchfab.com/3d-models/${uid}`;

/** Un modèle est « en librairie » dès qu'un dossier existe à son slug. */
function isImported(slug: string) {
  const dir = path.join(process.cwd(), "public", "plans-3d", slug);
  return fs.existsSync(dir) && fs.readdirSync(dir).some((f) => /\.(dae|glb|gltf)$/i.test(f));
}

export default function VehiculesPage() {
  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-6xl mx-auto space-y-6">
      <div>
        <Link href="/admin/plan-3d" className="text-xs font-medium text-slate-400 hover:text-slate-600">
          ← Plans 3D
        </Link>
        <h1 className="mt-2 text-2xl font-black text-slate-900">Librairie de carrosseries</h1>
        <p className="mt-2 max-w-3xl text-sm text-slate-600">
          Catalogue des fourgons à charger dans le viewer pour concevoir un
          aménagement dans la coque. Les candidats ci-dessous ont été relevés sur
          Sketchfab (modèles téléchargeables, juillet 2026) avec leur licence ;
          aucun n&apos;est encore importé.
        </p>
      </div>

      {/* Le point qui conditionne tout le reste */}
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
        <h2 className="text-sm font-bold text-amber-900">
          Précision : ce qu&apos;un modèle gratuit peut et ne peut pas donner
        </h2>
        <p className="mt-2 max-w-3xl text-sm text-amber-900/80">
          Ces modèles sont faits pour le rendu, pas pour la métrologie : la
          silhouette est juste, les cotes ne le sont pas forcément. Un fourgon
          modélisé à l&apos;œil se trompe couramment de 5 à 15 cm sur la longueur
          utile — de quoi faire rater une découpe. Il n&apos;existe pas de modèle
          libre garanti au millimètre : les seules sources fiables sont les fiches
          constructeur (ci-dessous) et les scans 3D professionnels, payants et
          limités au Sprinter et au Transit.
        </p>
        <p className="mt-2 max-w-3xl text-sm text-amber-900/80">
          La méthode qui marche : <strong>la coque gratuite pour la forme</strong>{" "}
          (ondulations, passages de roue, arrondis) et{" "}
          <strong>les cotes constructeur pour les mesures</strong>. Le viewer
          affiche l&apos;encombrement en bas à droite — à l&apos;import on compare
          au tableau du véhicule, et on recale l&apos;échelle si l&apos;écart est
          net.
        </p>
      </div>

      {/* Fiches véhicules */}
      <div className="space-y-4">
        {VEHICLES.map((vehicle) => {
          const imported = isImported(vehicle.slug);
          return (
            <div
              key={vehicle.slug}
              className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    {vehicle.brand} {vehicle.model}
                  </h2>
                  <p className="text-xs text-slate-400">
                    {vehicle.variants}
                    {vehicle.twins ? ` · même caisse que ${vehicle.twins}` : ""}
                  </p>
                </div>
                <span
                  className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                    imported
                      ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {imported ? "en librairie" : "pas encore importé"}
                </span>
              </div>

              {vehicle.interior && (
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full min-w-[520px] text-xs tabular-nums">
                    <thead>
                      <tr className="text-left text-slate-400">
                        <th className="py-1 pr-4 font-semibold">Variante</th>
                        <th className="py-1 pr-4 font-semibold">Longueur utile</th>
                        <th className="py-1 pr-4 font-semibold">Largeur</th>
                        <th className="py-1 pr-4 font-semibold">Entre passages</th>
                        <th className="py-1 pr-4 font-semibold">Hauteur</th>
                        <th className="py-1 font-semibold">Seuil</th>
                      </tr>
                    </thead>
                    <tbody className="text-slate-600">
                      {vehicle.interior.map((spec) => (
                        <tr key={spec.variant} className="border-t border-slate-100">
                          <td className="py-1.5 pr-4 font-semibold text-slate-900">{spec.variant}</td>
                          <td className="py-1.5 pr-4">{spec.length} mm</td>
                          <td className="py-1.5 pr-4">{spec.width} mm</td>
                          <td className="py-1.5 pr-4">{spec.betweenArches} mm</td>
                          <td className="py-1.5 pr-4">{spec.height} mm</td>
                          <td className="py-1.5">{spec.sill ? `${spec.sill} mm` : "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {vehicle.interiorSource && (
                    <p className="mt-1 text-[11px] text-slate-400">
                      Source : {vehicle.interiorSource} — à recouper avec la fiche
                      exacte du millésime avant de découper.
                    </p>
                  )}
                </div>
              )}

              {vehicle.candidates.length > 0 ? (
                <ul className="mt-4 space-y-2">
                  {vehicle.candidates.map((candidate) => {
                    const license = LICENSE_LABELS[candidate.license];
                    return (
                      <li key={candidate.uid} className="border-t border-slate-100 pt-2">
                        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 text-sm">
                          <a
                            href={sketchfab(candidate.uid)}
                            target="_blank"
                            rel="noreferrer"
                            className="font-semibold text-slate-800 hover:text-[#8A6A3C] hover:underline"
                          >
                            {candidate.title}
                          </a>
                          <span
                            className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                              license.ok
                                ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                                : "bg-red-50 text-red-700 ring-1 ring-red-200"
                            }`}
                            title={license.usage}
                          >
                            {license.short}
                          </span>
                          {candidate.faces > 0 && (
                            <span className="text-[11px] tabular-nums text-slate-400">
                              {candidate.faces.toLocaleString("fr-FR")} faces
                            </span>
                          )}
                        </div>
                        {candidate.note && (
                          <p className="mt-0.5 text-xs text-slate-500">{candidate.note}</p>
                        )}
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="mt-4 text-sm text-slate-500">Aucun candidat libre trouvé.</p>
              )}

              {vehicle.comment && (
                <p className="mt-3 border-t border-slate-100 pt-3 text-xs text-slate-500">
                  {vehicle.comment}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Aménagements de référence */}
      <div className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
        <h2 className="text-base font-bold text-slate-900">
          Aménagements complets (références d&apos;agencement)
        </h2>
        <p className="mt-1 text-xs text-slate-400">
          Cinq aménagements sur base Ducato L5H2 (4,07 × 1,87 × 1,93 m), publiés
          par vanotherblog en CC BY. Utiles pour montrer des partis pris
          d&apos;agencement, pas pour mesurer.
        </p>
        <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm">
          {LAYOUT_REFERENCES.map((reference) => (
            <li key={reference.uid}>
              <a
                href={sketchfab(reference.uid)}
                target="_blank"
                rel="noreferrer"
                className="text-slate-700 hover:text-[#8A6A3C] hover:underline"
              >
                {reference.title}
              </a>
            </li>
          ))}
        </ul>
      </div>

      {/* Marche à suivre */}
      <div className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
        <h2 className="text-base font-bold text-slate-900">Importer une carrosserie</h2>
        <ol className="mt-3 space-y-1.5 text-sm text-slate-600 list-decimal list-inside">
          <li>
            Compte Sketchfab gratuit obligatoire pour télécharger — sans jeton
            d&apos;API, je ne peux pas le faire à ta place.
          </li>
          <li>Choisir le format glTF, puis dézipper.</li>
          <li>
            Lancer l&apos;import :
            <pre className="mt-1.5 overflow-x-auto rounded-lg bg-slate-900 p-3 text-xs text-slate-100">
{`npx tsx scripts/prepare-plan-3d.ts "~/Downloads/le-dossier" renault-trafic "Renault Trafic L1H1"`}
            </pre>
          </li>
          <li>
            Ouvrir le plan et comparer l&apos;encombrement affiché aux cotes du
            tableau. Écart net = modèle à recaler ou à écarter.
          </li>
        </ol>
        <p className="mt-3 border-t border-slate-100 pt-3 text-xs text-slate-500">
          Licences : les modèles CC BY imposent de citer l&apos;auteur partout où
          le modèle est visible, y compris dans une vidéo de formation. Les CC
          BY-NC sont à écarter d&apos;un usage commercial. Et indépendamment de la
          licence du fichier, un modèle reproduisant un véhicule de marque reste à
          manier avec prudence en diffusion publique.
        </p>
      </div>
    </div>
  );
}
