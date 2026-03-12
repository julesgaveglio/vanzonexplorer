import Link from "next/link";
import { getProductsAdmin } from "../actions";
import ProductToggle from "./_components/ProductToggle";

export default async function AdminProduitsPage() {
  const products = await getProductsAdmin().catch(() => []);

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="text-slate-400 text-sm font-medium mb-1">
            <Link href="/admin/club" className="hover:text-slate-600">Club Privé</Link> / Produits
          </p>
          <h1 className="text-3xl font-black text-slate-900">Produits</h1>
          <p className="text-slate-500 mt-1">{products.length} produit{products.length > 1 ? "s" : ""}</p>
        </div>
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

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {products.length === 0 ? (
          <p className="px-6 py-16 text-center text-slate-400">
            Aucun produit. <Link href="/admin/club/produits/nouveau" className="text-emerald-500 hover:underline">Créer le premier →</Link>
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-50">
                  <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-6 py-3">Produit</th>
                  <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-4 py-3">Marque</th>
                  <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-4 py-3">Prix</th>
                  <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-4 py-3">Code</th>
                  <th className="text-center text-xs font-semibold text-slate-400 uppercase tracking-wider px-4 py-3">Actif</th>
                  <th className="text-center text-xs font-semibold text-slate-400 uppercase tracking-wider px-4 py-3">Une</th>
                  <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {products.map((product) => {
                  const brand = typeof product.brand_id === "object" ? product.brand_id as { name: string } : null;
                  const savings = (Number(product.original_price) - Number(product.promo_price)).toFixed(2);
                  return (
                    <tr key={product.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-slate-100 flex-shrink-0 overflow-hidden">
                            {product.main_image_url ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={product.main_image_url} alt={product.name} className="w-full h-full object-cover" />
                            ) : (
                              <span className="w-full h-full flex items-center justify-center text-slate-300 text-lg">📦</span>
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-slate-800">{product.name}</p>
                            <p className="text-xs text-slate-400 truncate max-w-[180px]">{product.description}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-xs text-slate-600 font-medium">{brand?.name ?? "—"}</span>
                      </td>
                      <td className="px-4 py-4">
                        <div>
                          <p className="text-sm font-bold text-violet-600">{Number(product.promo_price).toFixed(2)}€</p>
                          <p className="text-xs text-red-400 line-through">{Number(product.original_price).toFixed(2)}€</p>
                          <p className="text-xs text-emerald-600 font-semibold">-{savings}€</p>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        {product.promo_code ? (
                          <span className="font-mono text-xs bg-violet-50 text-violet-700 px-2 py-1 rounded-lg">
                            {product.promo_code}
                          </span>
                        ) : (
                          <span className="text-slate-300 text-xs">—</span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-center">
                        <ProductToggle id={product.id} field="active" value={product.is_active} />
                      </td>
                      <td className="px-4 py-4 text-center">
                        <ProductToggle id={product.id} field="featured" value={product.is_featured} />
                      </td>
                      <td className="px-4 py-4">
                        <Link
                          href={`/admin/club/produits/${product.id}`}
                          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-emerald-600 transition-colors bg-slate-50 hover:bg-emerald-50 px-3 py-1.5 rounded-lg"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          Modifier
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
