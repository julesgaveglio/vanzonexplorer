import Link from "next/link";
import { getProductsAdmin } from "../actions";
import ProductsOrderManager from "./_components/ProductsOrderManager";
import { AdminPageHeader } from "@/app/admin/_components/ui";

export default async function AdminProduitsPage() {
  const products = await getProductsAdmin().catch(() => []);

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <AdminPageHeader
        title="Produits"
        subtitle={`${products.length} produit${products.length > 1 ? "s" : ""}`}
        action={
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
        }
      />

      {products.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 px-6 py-16 text-center">
          <p className="text-slate-400">
            Aucun produit. <Link href="/admin/club/produits/nouveau" className="text-emerald-500 hover:underline">Créer le premier →</Link>
          </p>
        </div>
      ) : (
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        <ProductsOrderManager initialProducts={products as any} />
      )}
    </div>
  );
}
