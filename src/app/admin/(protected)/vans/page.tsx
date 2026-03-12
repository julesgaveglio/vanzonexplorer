import { adminReadClient } from "@/lib/sanity/adminClient";
import { groq } from "next-sanity";
import VanStatusSelect from "./_components/VanStatusSelect";
import FeaturedToggle from "./_components/FeaturedToggle";

const allVansQuery = groq`
  *[_type == "van"] | order(sortOrder asc, _updatedAt desc) {
    _id,
    name,
    status,
    offerType,
    featured,
    vanType,
    brand,
    model,
    year,
    startingPricePerNight,
    salePrice,
    "img": mainImage.asset->url,
    _updatedAt
  }
`;

type Van = {
  _id: string;
  name: string;
  status: string;
  offerType: string[];
  featured: boolean;
  vanType?: string;
  brand?: string;
  model?: string;
  year?: number;
  startingPricePerNight?: number;
  salePrice?: number;
  img?: string;
  _updatedAt: string;
};

export default async function AdminVansPage() {
  const vans = await adminReadClient.fetch<Van[]>(allVansQuery);

  const locationVans = vans?.filter((v) => v.offerType?.includes("location")) ?? [];
  const achatVans = vans?.filter((v) => v.offerType?.includes("achat")) ?? [];

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="text-slate-400 text-sm font-medium mb-1">Administration</p>
          <h1 className="text-3xl font-black text-slate-900">Vans</h1>
          <p className="text-slate-500 mt-1">
            {vans?.length ?? 0} van{(vans?.length ?? 0) > 1 ? "s" : ""} dans Sanity
          </p>
        </div>
        <a
          href="/admin/vans/nouveau"
          className="inline-flex items-center gap-2 font-semibold text-white text-sm px-5 py-2.5 rounded-xl transition-all"
          style={{ background: "linear-gradient(135deg, #3B82F6 0%, #0EA5E9 100%)", boxShadow: "0 4px 14px rgba(59,130,246,0.35)" }}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Ajouter un van
        </a>
      </div>

      {/* Section Location */}
      <VanTable title="Location" vans={locationVans} accent="#3B82F6" />

      {/* Section Achat */}
      <div className="mt-8">
        <VanTable title="Achat / Revente" vans={achatVans} accent="#F59E0B" />
      </div>
    </div>
  );
}

function VanTable({ title, vans, accent }: { title: string; vans: Van[]; accent: string }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-50 flex items-center gap-3">
        <span className="w-2.5 h-2.5 rounded-full" style={{ background: accent }} />
        <h2 className="font-bold text-slate-900">{title}</h2>
        <span className="text-xs text-slate-400 font-medium ml-auto">{vans.length} van{vans.length > 1 ? "s" : ""}</span>
      </div>

      {vans.length === 0 ? (
        <p className="px-6 py-10 text-center text-slate-400 text-sm">
          Aucun van dans cette categorie.{" "}
          <a href="/studio/structure/van;new" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
            Ajouter depuis Sanity Studio
          </a>
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-50">
                <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-6 py-3">Van</th>
                <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-4 py-3">Type</th>
                <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-4 py-3">Prix</th>
                <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-4 py-3">Statut</th>
                <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-4 py-3">Une</th>
                <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {vans.map((van) => (
                <tr key={van._id} className="hover:bg-slate-50/60 transition-colors">
                  {/* Van info */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl bg-slate-100 flex-shrink-0 overflow-hidden">
                        {van.img && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={`${van.img}?w=88&h=88&fit=crop&auto=format`}
                            alt={van.name}
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-800">{van.name}</p>
                        <p className="text-xs text-slate-400">
                          {[van.brand, van.model, van.year].filter(Boolean).join(" · ")}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Type */}
                  <td className="px-4 py-4">
                    <span className="text-xs text-slate-500 capitalize">{van.vanType ?? "—"}</span>
                  </td>

                  {/* Prix */}
                  <td className="px-4 py-4">
                    <span className="text-sm font-semibold text-slate-700">
                      {van.offerType?.includes("location")
                        ? van.startingPricePerNight ? `${van.startingPricePerNight}€/nuit` : "—"
                        : van.salePrice ? `${van.salePrice.toLocaleString("fr-FR")}€` : "—"}
                    </span>
                  </td>

                  {/* Statut */}
                  <td className="px-4 py-4">
                    <VanStatusSelect id={van._id} status={van.status} />
                  </td>

                  {/* Featured */}
                  <td className="px-4 py-4">
                    <FeaturedToggle id={van._id} featured={van.featured} />
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-4">
                    <a
                      href={`/admin/vans/${van._id}`}
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-blue-600 transition-colors bg-slate-50 hover:bg-blue-50 px-3 py-1.5 rounded-lg"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Modifier
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
