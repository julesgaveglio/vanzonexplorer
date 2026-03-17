"use client";

import { useState, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { upsertBrand, deleteBrand } from "../../actions";

interface Brand {
  id?: string;
  name?: string;
  slug?: string;
  description?: string;
  website_url?: string;
  logo_url?: string;
  promo_code_global?: string;
  affiliate_url_base?: string;
  is_partner?: boolean;
  status?: string;
  contact_email?: string;
}

export default function BrandForm({ brand }: { brand?: Brand }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [logoUrl, setLogoUrl] = useState(brand?.logo_url || "");
  const [uploading, setUploading] = useState(false);
  const [showGmailModal, setShowGmailModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/admin/club/upload-image", { method: "POST", body: fd });
      const data = await res.json();
      if (data.url) setLogoUrl(data.url);
    } catch {
      alert("Erreur lors de l'upload");
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete() {
    if (!brand?.id) return;
    if (!confirm(`Supprimer la marque "${brand.name}" ? Cette action est irréversible.`)) return;
    setDeleting(true);
    await deleteBrand(brand.id);
    router.push("/admin/club/marques");
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError(null);
    const fd = new FormData(e.currentTarget);
    fd.set("logo_url", logoUrl);
    startTransition(async () => {
      const result = await upsertBrand(fd);
      if (!result.success) {
        setFormError(result.error ?? "Erreur inconnue");
        return;
      }
      router.push("/admin/club/marques");
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {brand?.id && <input type="hidden" name="id" value={brand.id} />}

      {/* Logo */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <h2 className="font-bold text-slate-900 mb-4">Logo de la marque</h2>
        <div className="flex items-center gap-6">
          {/* Preview */}
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="relative w-28 h-28 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 hover:border-violet-400 hover:bg-violet-50 transition-all overflow-hidden flex items-center justify-center group"
          >
            {logoUrl ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={logoUrl} alt="Logo" className="w-full h-full object-contain p-2" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              </>
            ) : (
              <div className="text-center">
                {uploading ? (
                  <div className="w-5 h-5 border-2 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto" />
                ) : (
                  <>
                    <svg className="w-8 h-8 text-slate-300 mx-auto mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                    <p className="text-xs text-slate-400">Logo</p>
                  </>
                )}
              </div>
            )}
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />

          <div className="flex-1">
            <p className="text-sm font-medium text-slate-700 mb-1">
              {logoUrl ? "Logo uploadé ✓" : "Aucun logo"}
            </p>
            <p className="text-xs text-slate-400 mb-3">Cliquer sur le cadre pour uploader. PNG avec fond transparent recommandé.</p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="text-xs font-semibold text-violet-600 hover:text-violet-700 bg-violet-50 hover:bg-violet-100 px-3 py-1.5 rounded-lg transition-colors"
              >
                {uploading ? "Upload en cours…" : logoUrl ? "Changer le logo" : "Uploader un logo"}
              </button>
              {logoUrl && (
                <button
                  type="button"
                  onClick={() => setLogoUrl("")}
                  className="text-xs font-semibold text-red-500 hover:text-red-600 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-colors"
                >
                  Supprimer
                </button>
              )}
            </div>
            {/* URL manuelle */}
            <div className="mt-3">
              <label className="text-xs text-slate-400 mb-1 block">Ou coller une URL directement</label>
              <input
                type="url"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                placeholder="https://..."
                className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-300"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Infos générales */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <h2 className="font-bold text-slate-900 mb-4">Informations</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Nom *</label>
            <input
              name="name"
              defaultValue={brand?.name}
              required
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-300"
              placeholder="ex: Imara"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Slug</label>
            <input
              name="slug"
              defaultValue={brand?.slug}
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-300"
              placeholder="ex: imara (auto-généré si vide)"
            />
          </div>
          <div className="col-span-2">
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Description</label>
            <textarea
              name="description"
              defaultValue={brand?.description}
              rows={2}
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-300 resize-none"
              placeholder="Courte description de la marque"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Site web</label>
            <input
              name="website_url"
              type="url"
              defaultValue={brand?.website_url}
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-300"
              placeholder="https://imara.fr"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Statut</label>
            <select
              name="status"
              defaultValue={brand?.status || "active"}
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-300 bg-white"
            >
              <option value="active">Actif</option>
              <option value="inactive">Inactif</option>
              <option value="coming_soon">Coming soon</option>
            </select>
          </div>
          <div className="col-span-2">
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Email de contact</label>
            <div className="flex gap-2">
              <input
                name="contact_email"
                type="email"
                defaultValue={brand?.contact_email}
                className="flex-1 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-300"
                placeholder="contact@marque.com"
              />
              {brand?.id && (
                <button
                  type="button"
                  onClick={() => setShowGmailModal(true)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border-2 border-violet-300 text-violet-700 hover:bg-violet-50 transition-colors whitespace-nowrap"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4-8 5-8-5V6l8 5 8-5v2z"/>
                  </svg>
                  Contacter via Gmail
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Codes & Affiliation */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <h2 className="font-bold text-slate-900 mb-4">Codes & Affiliation</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Code promo global</label>
            <input
              name="promo_code_global"
              defaultValue={brand?.promo_code_global}
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-300"
              placeholder="ex: VANZON15"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">URL affiliation (base)</label>
            <input
              name="affiliate_url_base"
              type="url"
              defaultValue={brand?.affiliate_url_base}
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-300"
              placeholder="https://..."
            />
          </div>
        </div>
      </div>

      {/* Tags */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <h2 className="font-bold text-slate-900 mb-4">Classification</h2>
        <div className="flex gap-6">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              name="is_partner"
              value="true"
              defaultChecked={brand?.is_partner}
              className="w-4 h-4 rounded text-violet-600 focus:ring-violet-300"
            />
            <div>
              <p className="text-sm font-semibold text-slate-800">Marque partenaire</p>
              <p className="text-xs text-slate-400">Apparaît dans le ticker de logos</p>
            </div>
          </label>
        </div>
      </div>

      {/* Modal Gmail */}
      {showGmailModal && brand?.id && (
        <GmailModal
          brand={brand}
          onClose={() => setShowGmailModal(false)}
        />
      )}

      {/* Erreur */}
      {formError && (
        <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 font-medium">
          ⚠️ {formError}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between">
        {brand?.id ? (
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="text-sm font-semibold text-red-500 hover:text-red-600 hover:bg-red-50 px-4 py-2.5 rounded-xl transition-colors"
          >
            {deleting ? "Suppression…" : "Supprimer la marque"}
          </button>
        ) : <div />}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="text-sm font-semibold text-slate-500 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 px-5 py-2.5 rounded-xl transition-colors"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="text-sm font-semibold text-white px-6 py-2.5 rounded-xl transition-all disabled:opacity-60"
            style={{ background: "linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)", boxShadow: "0 4px 14px rgba(139,92,246,0.35)" }}
          >
            {isPending ? "Enregistrement…" : brand?.id ? "Enregistrer les modifications" : "Créer la marque"}
          </button>
        </div>
      </div>
    </form>
  );
}

// ── Gmail Modal ───────────────────────────────────────────────────

function GmailModal({ brand, onClose }: { brand: Brand; onClose: () => void }) {
  const defaultSubject = `Partenariat Vanzon Explorer × ${brand.name}`;
  const defaultBody = `Bonjour,

Je me permets de vous contacter au sujet d'un potentiel partenariat entre Vanzon Explorer et ${brand.name}.

Vanzon Explorer est une plateforme dédiée aux voyageurs en van aménagé, proposant des bons plans, des équipements sélectionnés et une communauté de passionnés.

Nous serions ravis de mettre en avant vos produits auprès de notre audience et d'explorer ensemble les modalités d'un partenariat (code promo, affiliation, mise en avant éditoriale...).

Seriez-vous disponible pour un échange ?

Cordialement,`;

  const [to, setTo] = useState(brand.contact_email || "");
  const [subject, setSubject] = useState(defaultSubject);
  const [body, setBody] = useState(defaultBody);

  function handleOpen() {
    if (!to.trim()) return;
    const url = `https://mail.google.com/mail/?view=cm&fs=1&tf=1&to=${encodeURIComponent(to)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(url, "_blank");
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-lg font-semibold text-slate-800">
            Contacter — <span className="text-violet-600">{brand.name}</span>
          </h2>
          <button onClick={onClose} aria-label="Fermer" className="text-slate-400 hover:text-slate-600 text-xl font-light leading-none">×</button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">À</label>
            <input
              type="email"
              value={to}
              onChange={e => setTo(e.target.value)}
              placeholder="contact@marque.com"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-300"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Objet</label>
            <input
              type="text"
              value={subject}
              onChange={e => setSubject(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-300"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Corps</label>
            <textarea
              value={body}
              onChange={e => setBody(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-300 resize-y min-h-48"
            />
          </div>
        </div>

        <div className="px-6 py-4 border-t border-slate-100 flex justify-between items-center">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
          >
            Fermer
          </button>
          <button
            type="button"
            onClick={handleOpen}
            disabled={!to.trim()}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            style={{ background: "linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)" }}
          >
            Ouvrir dans Gmail
          </button>
        </div>
      </div>
    </div>
  );
}
