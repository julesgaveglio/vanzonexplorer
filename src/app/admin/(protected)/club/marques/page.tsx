import Link from "next/link";
import { getBrandsAdmin } from "../actions";

export default async function AdminMarquesPage() {
  const brands = await getBrandsAdmin().catch(() => []);

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="text-slate-400 text-sm font-medium mb-1">
            <Link href="/admin/club" className="hover:text-slate-600">Club Privé</Link> / Marques
          </p>
          <h1 className="text-3xl font-black text-slate-900">Marques partenaires</h1>
          <p className="text-slate-500 mt-1">{brands.length} marque{brands.length > 1 ? "s" : ""}</p>
        </div>
        <Link
          href="/admin/club/marques/nouveau"
          className="inline-flex items-center gap-2 font-semibold text-white text-sm px-5 py-2.5 rounded-xl transition-all"
          style={{ background: "linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)", boxShadow: "0 4px 14px rgba(139,92,246,0.35)" }}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Nouvelle marque
        </Link>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {brands.length === 0 ? (
          <p className="px-6 py-16 text-center text-slate-400">
            Aucune marque. <Link href="/admin/club/marques/nouveau" className="text-violet-500 hover:underline">Créer la première →</Link>
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-50">
                  <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-6 py-3">Marque</th>
                  <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-4 py-3">Code promo</th>
                  <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-4 py-3">Statut</th>
                  <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-4 py-3">Tags</th>
                  <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {brands.map((brand) => (
                  <tr key={brand.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-slate-100 flex-shrink-0 overflow-hidden flex items-center justify-center">
                          {brand.logo_url?.startsWith("http") ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={brand.logo_url} alt={brand.name} className="w-full h-full object-contain p-1" />
                          ) : (
                            <span className="text-sm font-bold text-slate-400">{brand.name[0]}</span>
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-800">{brand.name}</p>
                          <p className="text-xs text-slate-400">{brand.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      {brand.promo_code_global ? (
                        <span className="font-mono text-xs bg-violet-50 text-violet-700 px-2 py-1 rounded-lg font-semibold">
                          {brand.promo_code_global}
                        </span>
                      ) : (
                        <span className="text-slate-300 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${
                        brand.status === "active"
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-slate-100 text-slate-500"
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${brand.status === "active" ? "bg-emerald-500" : "bg-slate-400"}`} />
                        {brand.status === "active" ? "Actif" : brand.status}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex gap-1.5">
                        {brand.is_partner && (
                          <span className="text-[10px] font-bold text-violet-600 bg-violet-50 px-1.5 py-0.5 rounded">PARTENAIRE</span>
                        )}
                        {brand.is_trusted && (
                          <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">TRUSTED</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <Link
                        href={`/admin/club/marques/${brand.id}`}
                        className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-violet-600 transition-colors bg-slate-50 hover:bg-violet-50 px-3 py-1.5 rounded-lg"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Modifier
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
