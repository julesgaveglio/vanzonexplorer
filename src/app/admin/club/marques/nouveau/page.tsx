import Link from "next/link";
import BrandForm from "../_components/BrandForm";

export default function NewBrandPage() {
  return (
    <div className="p-8 max-w-3xl">
      <p className="text-slate-400 text-sm font-medium mb-1">
        <Link href="/admin/club" className="hover:text-slate-600">Club Privé</Link> /{" "}
        <Link href="/admin/club/marques" className="hover:text-slate-600">Marques</Link> / Nouvelle
      </p>
      <h1 className="text-3xl font-black text-slate-900 mb-8">Nouvelle marque</h1>
      <BrandForm />
    </div>
  );
}
