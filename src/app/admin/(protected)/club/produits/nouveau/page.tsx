import Link from "next/link";
import { getBrandsAdmin, getCategoriesAdmin } from "../../actions";
import ProductForm from "../_components/ProductForm";

export default async function NewProductPage() {
  const [brands, categories] = await Promise.all([
    getBrandsAdmin().catch(() => []),
    getCategoriesAdmin().catch(() => []),
  ]);

  return (
    <div className="p-8 max-w-3xl">
      <p className="text-slate-400 text-sm font-medium mb-1">
        <Link href="/admin/club" className="hover:text-slate-600">Club Privé</Link> /{" "}
        <Link href="/admin/club/produits" className="hover:text-slate-600">Produits</Link> / Nouveau
      </p>
      <h1 className="text-3xl font-black text-slate-900 mb-8">Nouveau produit</h1>
      <ProductForm brands={brands} categories={categories} />
    </div>
  );
}
