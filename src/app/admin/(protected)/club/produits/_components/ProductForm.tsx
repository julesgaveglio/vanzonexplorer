"use client";

import { useState, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { upsertProduct, deleteProduct } from "../../actions";
import MediaPickerModal from "@/components/admin/MediaPickerModal";

interface Brand { id: string; name: string; slug: string; }
interface Category { id: string; name: string; slug: string; }
interface Product {
  id?: string;
  name?: string;
  slug?: string;
  brand_id?: string | Brand;
  category_id?: string | Category;
  description?: string;
  long_description?: string;
  why_this_deal?: string;
  original_price?: number;
  promo_price?: number;
  promo_code?: string;
  offer_type?: string;
  affiliate_url?: string;
  main_image_url?: string;
  is_featured?: boolean;
  is_active?: boolean;
  priority_score?: number;
  expires_at?: string | null;
}

export default function ProductForm({
  product,
  brands,
  categories,
}: {
  product?: Product;
  brands: Brand[];
  categories: Category[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [imageUrl, setImageUrl] = useState(product?.main_image_url || "");
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [showMediaPicker, setShowMediaPicker] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const brandId = typeof product?.brand_id === "object" ? (product.brand_id as Brand).id : product?.brand_id;
  const categoryId = typeof product?.category_id === "object" ? (product.category_id as Category).id : product?.category_id;

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/admin/club/upload-image", { method: "POST", body: fd });
      const data = await res.json();
      if (data.url) setImageUrl(data.url);
    } catch {
      alert("Erreur lors de l'upload");
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete() {
    if (!product?.id) return;
    if (!confirm(`Supprimer le produit "${product.name}" ?`)) return;
    setDeleting(true);
    await deleteProduct(product.id);
    router.push("/admin/club/produits");
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError(null);
    const fd = new FormData(e.currentTarget);
    fd.set("main_image_url", imageUrl);
    fd.set("is_featured", fd.has("is_featured") ? "true" : "false");
    fd.set("is_active", fd.has("is_active") ? "true" : "false");
    startTransition(async () => {
      const result = await upsertProduct(fd);
      if (!result.success) {
        setFormError(result.error ?? "Erreur inconnue");
        return;
      }
      router.push("/admin/club/produits");
    });
  }

  return (
    <>
    <form onSubmit={handleSubmit} className="space-y-6">
      {product?.id && <input type="hidden" name="id" value={product.id} />}

      {/* Image produit */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <h2 className="font-bold text-slate-900 mb-4">Image du produit</h2>
        <div className="flex items-start gap-6">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="relative w-36 h-28 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 hover:border-emerald-400 hover:bg-emerald-50 transition-all overflow-hidden flex items-center justify-center group flex-shrink-0"
          >
            {imageUrl ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imageUrl} alt="Produit" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              </>
            ) : (
              <div className="text-center">
                {uploading ? (
                  <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
                ) : (
                  <>
                    <svg className="w-8 h-8 text-slate-300 mx-auto mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                    <p className="text-xs text-slate-400">Image</p>
                  </>
                )}
              </div>
            )}
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
          <div className="flex-1">
            <p className="text-sm font-medium text-slate-700 mb-2">{imageUrl ? "Image uploadée ✓" : "Aucune image"}</p>
            <div className="flex gap-2 mb-3 flex-wrap">
              <button type="button" onClick={() => setShowMediaPicker(true)}
                className="text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors">
                📷 Médiathèque
              </button>
              <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
                className="text-xs font-semibold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg transition-colors">
                {uploading ? "Upload…" : "Depuis l'ordi"}
              </button>
              {imageUrl && (
                <button type="button" onClick={() => setImageUrl("")}
                  className="text-xs font-semibold text-red-500 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-colors">
                  Supprimer
                </button>
              )}
            </div>
            <label className="text-xs text-slate-400 mb-1 block">Ou URL directe</label>
            <input type="url" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://..."
              className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-300" />
          </div>
        </div>
      </div>

      {/* Infos générales */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <h2 className="font-bold text-slate-900 mb-4">Informations</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Nom *</label>
            <input name="name" defaultValue={product?.name} required
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
              placeholder="ex: Kit isolation van" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Slug</label>
            <input name="slug" defaultValue={product?.slug}
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
              placeholder="auto-généré si vide" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Marque *</label>
            <select name="brand_id" defaultValue={brandId} required
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-300">
              <option value="">Sélectionner…</option>
              {brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Catégorie</label>
            <select name="category_id" defaultValue={categoryId || ""}
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-300">
              <option value="">— Aucune —</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="col-span-2">
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Description courte</label>
            <input name="description" defaultValue={product?.description}
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
              placeholder="1-2 phrases" />
          </div>
          <div className="col-span-2">
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Pourquoi ce deal ?</label>
            <textarea name="why_this_deal" defaultValue={product?.why_this_deal} rows={2}
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300 resize-none"
              placeholder="Argument clé pour le membre" />
          </div>
        </div>
      </div>

      {/* Prix */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <h2 className="font-bold text-slate-900 mb-4">Prix</h2>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Prix original (€) *</label>
            <input name="original_price" type="number" step="0.01" min="0" defaultValue={product?.original_price} required
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
              placeholder="289.00" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Prix promo (€) *</label>
            <input name="promo_price" type="number" step="0.01" min="0" defaultValue={product?.promo_price} required
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
              placeholder="199.00" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Priorité</label>
            <input name="priority_score" type="number" min="0" defaultValue={product?.priority_score || 0}
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
              placeholder="0" />
          </div>
        </div>
      </div>

      {/* Code & Lien */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <h2 className="font-bold text-slate-900 mb-4">Code & Lien</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Type d&apos;offre</label>
            <select name="offer_type" defaultValue={product?.offer_type || "code_promo"}
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-300">
              <option value="code_promo">Code promo</option>
              <option value="reduction_directe">Réduction directe</option>
              <option value="affiliation">Affiliation</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Code promo</label>
            <input name="promo_code" defaultValue={product?.promo_code || ""}
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-300"
              placeholder="ex: VANZON15" />
          </div>
          <div className="col-span-2">
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">URL affiliation</label>
            <input name="affiliate_url" type="url" defaultValue={product?.affiliate_url || ""}
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
              placeholder="https://..." />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Expire le</label>
            <input name="expires_at" type="date" defaultValue={product?.expires_at ? product.expires_at.split("T")[0] : ""}
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300" />
          </div>
        </div>
      </div>

      {/* Visibilité */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <h2 className="font-bold text-slate-900 mb-4">Visibilité</h2>
        <div className="flex gap-8">
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" name="is_active" value="true" defaultChecked={product?.is_active !== false}
              className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-300" />
            <div>
              <p className="text-sm font-semibold text-slate-800">Produit actif</p>
              <p className="text-xs text-slate-400">Visible dans le catalogue</p>
            </div>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" name="is_featured" value="true" defaultChecked={product?.is_featured}
              className="w-4 h-4 rounded text-amber-500 focus:ring-amber-300" />
            <div>
              <p className="text-sm font-semibold text-slate-800">Produit en une</p>
              <p className="text-xs text-slate-400">Affiché sur la landing Club</p>
            </div>
          </label>
        </div>
      </div>

      {/* Erreur */}
      {formError && (
        <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 font-medium">
          ⚠️ {formError}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between">
        {product?.id ? (
          <button type="button" onClick={handleDelete} disabled={deleting}
            className="text-sm font-semibold text-red-500 hover:text-red-600 hover:bg-red-50 px-4 py-2.5 rounded-xl transition-colors">
            {deleting ? "Suppression…" : "Supprimer le produit"}
          </button>
        ) : <div />}
        <div className="flex gap-3">
          <button type="button" onClick={() => router.back()}
            className="text-sm font-semibold text-slate-500 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 px-5 py-2.5 rounded-xl transition-colors">
            Annuler
          </button>
          <button type="submit" disabled={isPending}
            className="text-sm font-semibold text-white px-6 py-2.5 rounded-xl transition-all disabled:opacity-60"
            style={{ background: "linear-gradient(135deg, #10B981 0%, #059669 100%)", boxShadow: "0 4px 14px rgba(16,185,129,0.35)" }}>
            {isPending ? "Enregistrement…" : product?.id ? "Enregistrer" : "Créer le produit"}
          </button>
        </div>
      </div>
    </form>

    {showMediaPicker && (
      <MediaPickerModal
        onSelect={(url) => setImageUrl(url)}
        onClose={() => setShowMediaPicker(false)}
      />
    )}
    </>
  );
}
