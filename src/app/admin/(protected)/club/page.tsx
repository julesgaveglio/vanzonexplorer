import Link from "next/link";
import { getBrandsAdmin, getProductsAdmin } from "./actions";

export default async function AdminClubPage() {
  const [brands, products] = await Promise.all([
    getBrandsAdmin().catch(() => []),
    getProductsAdmin().catch(() => []),
  ]);

  const activeProducts = products.filter((p) => p.is_active);
  const featuredProducts = products.filter((p) => p.is_featured);
  const partnerBrands = brands.filter((b) => b.is_partner);

  const stats = [
    { label: "Marques partenaires", value: partnerBrands.length, href: "/admin/club/marques", color: "#8B5CF6" },
    { label: "Produits actifs", value: activeProducts.length, href: "/admin/club/produits", color: "#10B981" },
    { label: "Produits en une", value: featuredProducts.length, href: "/admin/club/produits", color: "#F59E0B" },
    { label: "Total marques", value: brands.length, href: "/admin/club/marques", color: "#3B82F6" },
  ];

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="text-slate-400 text-sm font-medium mb-1">Administration</p>
          <h1 className="text-3xl font-black text-slate-900">Club Privé</h1>
          <p className="text-slate-500 mt-1">Gérer les marques et deals exclusifs</p>
        </div>
        <div className="flex gap-3">
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
          <Link
            href="/admin/club/produits/nouveau"
            className="inline-flex items-center gap-2 font-semibold text-white text-sm px-5 py-2.5 rounded-xl transition-all"
            style={{ background: "linear-gradient(135deg, #10B981 0%, #059669 100%)", boxShadow: "0 4px 14px rgba(16,185,129,0.35)" }}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Nouveau produit
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((s) => (
          <Link key={s.label} href={s.href} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
            <p className="text-3xl font-black" style={{ color: s.color }}>{s.value}</p>
            <p className="text-sm text-slate-500 mt-1">{s.label}</p>
          </Link>
        ))}
      </div>

      {/* Marques récentes */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="w-2.5 h-2.5 rounded-full bg-violet-500" />
              <h2 className="font-bold text-slate-900">Marques</h2>
            </div>
            <Link href="/admin/club/marques" className="text-xs text-violet-600 hover:underline font-medium">Voir tout →</Link>
          </div>
          <div className="divide-y divide-slate-50">
            {brands.slice(0, 8).map((brand) => (
              <div key={brand.id} className="flex items-center gap-4 px-6 py-3">
                <div className="w-10 h-10 rounded-xl bg-slate-100 flex-shrink-0 overflow-hidden flex items-center justify-center">
                  {brand.logo_png_url?.startsWith("http") ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={brand.logo_png_url} alt={brand.name} className="w-full h-full object-contain" />
                  ) : (
                    <span className="text-xs font-bold text-slate-400">{brand.name[0]}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 truncate">{brand.name}</p>
                  <p className="text-xs text-slate-400">
                    {brand.is_partner ? "Partenaire" : "Marque"} · {brand.status}
                  </p>
                </div>
                <Link href={`/admin/club/marques/${brand.id}`} className="text-xs text-slate-400 hover:text-violet-600 font-medium px-3 py-1.5 rounded-lg hover:bg-violet-50 transition-colors">
                  Modifier
                </Link>
              </div>
            ))}
            {brands.length === 0 && (
              <p className="px-6 py-8 text-center text-slate-400 text-sm">
                Aucune marque — <Link href="/admin/club/marques/nouveau" className="text-violet-500 hover:underline">Ajouter</Link>
              </p>
            )}
          </div>
        </div>

        {/* Produits récents */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <h2 className="font-bold text-slate-900">Produits récents</h2>
            </div>
            <Link href="/admin/club/produits" className="text-xs text-emerald-600 hover:underline font-medium">Voir tout →</Link>
          </div>
          <div className="divide-y divide-slate-50">
            {products.slice(0, 8).map((product) => {
              const brand = typeof product.brand_id === "object" ? product.brand_id as { name: string } : null;
              return (
                <div key={product.id} className="flex items-center gap-4 px-6 py-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 flex-shrink-0 overflow-hidden">
                    {product.main_image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={product.main_image_url} alt={product.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="w-full h-full flex items-center justify-center text-xs font-bold text-slate-400">?</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">{product.name}</p>
                    <p className="text-xs text-slate-400">{brand?.name ?? "—"} · {product.promo_price}€</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {product.is_featured && (
                      <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">UNE</span>
                    )}
                    {!product.is_active && (
                      <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded">INACTIF</span>
                    )}
                    <Link href={`/admin/club/produits/${product.id}`} className="text-xs text-slate-400 hover:text-emerald-600 font-medium px-3 py-1.5 rounded-lg hover:bg-emerald-50 transition-colors">
                      Modifier
                    </Link>
                  </div>
                </div>
              );
            })}
            {products.length === 0 && (
              <p className="px-6 py-8 text-center text-slate-400 text-sm">
                Aucun produit — <Link href="/admin/club/produits/nouveau" className="text-emerald-500 hover:underline">Ajouter</Link>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
