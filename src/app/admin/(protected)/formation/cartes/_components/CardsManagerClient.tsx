"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Image from "next/image";
import type { AdminCard } from "../page";


interface MediaAsset {
  _id: string;
  title: string;
  category: string;
  url: string;
  alt?: string;
}

type ImageSource = "library" | "upload";

function emptyForm() {
  return {
    title: "",
    description: "",
    // Source fichier (upload)
    imageFile: null as File | null,
    imagePreview: "",
    // Source bibliothèque
    libraryAssetId: "",
    libraryUrl: "",
    libraryAlt: "",
    // Source active
    imageSource: "library" as ImageSource,
  };
}

// ── Sélecteur image avec deux onglets ─────────────────────────────────────────
function ImagePicker({
  form,
  setForm,
  fileRef,
}: {
  form: ReturnType<typeof emptyForm>;
  setForm: React.Dispatch<React.SetStateAction<ReturnType<typeof emptyForm>>>;
  fileRef: React.RefObject<HTMLInputElement>;
}) {
  const [library, setLibrary] = useState<MediaAsset[]>([]);
  const [libLoading, setLibLoading] = useState(false);
  const [libSearch, setLibSearch] = useState("");
  const [analyzing, setAnalyzing] = useState(false);

  // Charger la médiathèque quand on passe sur l'onglet bibliothèque
  useEffect(() => {
    if (form.imageSource !== "library" || library.length > 0) return;
    setLibLoading(true);
    fetch("/api/admin/media")
      .then((r) => r.json())
      .then((d) => setLibrary(Array.isArray(d) ? d : []))
      .finally(() => setLibLoading(false));
  }, [form.imageSource, library.length]);

  const filtered = library.filter(
    (m) =>
      !libSearch ||
      m.title?.toLowerCase().includes(libSearch.toLowerCase()) ||
      m.category?.toLowerCase().includes(libSearch.toLowerCase())
  );


  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Aperçu immédiat pendant l'analyse
    const preview = URL.createObjectURL(file);
    setForm((f) => ({ ...f, imageFile: file, imagePreview: preview }));
    setAnalyzing(true);

    try {
      const fd = new FormData();
      fd.append("image", file);
      const res = await fetch("/api/admin/formation/cards/analyze-image", {
        method: "POST",
        body: fd,
      });
      const data = await res.json();
      if (data.success) {
        // L'image est maintenant dans la médiathèque — on bascule en mode library
        setForm((f) => ({
          ...f,
          imageSource: "library",
          libraryUrl: data.url,
          libraryAlt: data.alt,
          libraryAssetId: data.assetId,
          imageFile: null,
          imagePreview: "",
        }));
      }
    } catch {
      // Garde le fichier local comme fallback silencieux
    } finally {
      setAnalyzing(false);
      URL.revokeObjectURL(preview);
    }
  }

  function selectFromLibrary(asset: MediaAsset) {
    setForm((f) => ({
      ...f,
      libraryAssetId: asset._id,
      libraryUrl: asset.url,
      libraryAlt: asset.alt || asset.title,
    }));
  }

  return (
    <div>
      <label className="block text-sm font-semibold text-slate-700 mb-2">Image</label>

      {/* Onglets */}
      <div className="flex gap-1 p-1 bg-slate-100 rounded-xl mb-3">
        {(["library", "upload"] as ImageSource[]).map((src) => (
          <button
            key={src}
            type="button"
            onClick={() => setForm((f) => ({ ...f, imageSource: src }))}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              form.imageSource === src
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {src === "library" ? (
              <>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="7" height="7" rx="1" />
                  <rect x="14" y="3" width="7" height="7" rx="1" />
                  <rect x="3" y="14" width="7" height="7" rx="1" />
                  <rect x="14" y="14" width="7" height="7" rx="1" />
                </svg>
                Bibliothèque Vanzon
              </>
            ) : (
              <>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                Depuis l&apos;ordinateur
              </>
            )}
          </button>
        ))}
      </div>

      {/* ── Onglet Bibliothèque ── */}
      {form.imageSource === "library" && (
        <div>
          {/* Aperçu sélection actuelle */}
          {form.libraryUrl && (
            <div className="relative w-full rounded-xl overflow-hidden mb-3 border border-amber-200" style={{ aspectRatio: "16/9" }}>
              <Image src={form.libraryUrl} alt={form.libraryAlt || "Aperçu"} fill className="object-cover" unoptimized />
              <button
                type="button"
                onClick={() => setForm((f) => ({ ...f, libraryAssetId: "", libraryUrl: "", libraryAlt: "" }))}
                className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white rounded-full w-6 h-6 flex items-center justify-center transition-colors"
              >
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}

          {/* Recherche */}
          <input
            type="text"
            placeholder="Rechercher dans la bibliothèque…"
            value={libSearch}
            onChange={(e) => setLibSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-amber-300"
          />

          {/* Grille */}
          <div className="max-h-48 overflow-y-auto rounded-xl border border-slate-100">
            {libLoading ? (
              <div className="flex items-center justify-center py-8 text-slate-400 text-sm gap-2">
                <div className="w-4 h-4 border-2 border-slate-300 border-t-amber-500 rounded-full animate-spin" />
                Chargement…
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex items-center justify-center py-8 text-slate-400 text-sm">
                {library.length === 0 ? "Médiathèque vide" : "Aucun résultat"}
              </div>
            ) : (
              <div className="grid grid-cols-4 gap-1 p-1.5">
                {filtered.map((asset) => (
                  <button
                    key={asset._id}
                    type="button"
                    onClick={() => selectFromLibrary(asset)}
                    className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all hover:opacity-90 ${
                      form.libraryAssetId === asset._id
                        ? "border-amber-400 ring-2 ring-amber-300/50"
                        : "border-transparent"
                    }`}
                    title={asset.title}
                  >
                    <Image src={asset.url} alt={asset.alt || asset.title} fill className="object-cover" unoptimized />
                    {form.libraryAssetId === asset._id && (
                      <div className="absolute inset-0 bg-amber-400/20 flex items-center justify-center">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Onglet Upload ── */}
      {form.imageSource === "upload" && (
        <div>
          {/* État : analyse en cours */}
          {analyzing ? (
            <div
              className="relative flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-amber-200 bg-amber-50/40 overflow-hidden"
              style={{ height: form.imagePreview ? "auto" : "120px" }}
            >
              {form.imagePreview && (
                <div className="relative w-full" style={{ aspectRatio: "16/9" }}>
                  <Image src={form.imagePreview} alt="Analyse en cours" fill className="object-cover opacity-40" unoptimized />
                </div>
              )}
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-slate-200 border-t-amber-500 rounded-full animate-spin" />
                <span className="text-xs font-semibold text-slate-600">Analyse SEO en cours…</span>
                <span className="text-xs text-slate-400">Renommage + médiathèque</span>
              </div>
            </div>
          ) : (
            <div
              className="relative flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 cursor-pointer hover:border-amber-300 hover:bg-amber-50/30 transition-colors overflow-hidden"
              style={{ height: form.imagePreview ? "auto" : "120px" }}
              onClick={() => fileRef.current?.click()}
            >
              {form.imagePreview ? (
                <div className="relative w-full" style={{ aspectRatio: "16/9" }}>
                  <Image src={form.imagePreview} alt="Aperçu" fill className="object-cover" unoptimized />
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                    <span className="text-white text-sm font-semibold">Changer l&apos;image</span>
                  </div>
                </div>
              ) : (
                <>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                  <span className="text-sm text-slate-400">Cliquer pour uploader</span>
                  <span className="text-xs text-slate-300">JPG, PNG, WebP</span>
                </>
              )}
            </div>
          )}
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} disabled={analyzing} />
        </div>
      )}
    </div>
  );
}

// ── Composant principal ────────────────────────────────────────────────────────
export default function CardsManagerClient() {
  const [cards, setCards] = useState<AdminCard[]>([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState<"create" | "edit" | null>(null);
  const [editTarget, setEditTarget] = useState<AdminCard | null>(null);
  const [form, setForm] = useState(emptyForm());
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [toast, setToast] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  function showToast() {
    setToast(true);
    setTimeout(() => setToast(false), 3000);
  }

  const refresh = useCallback(async () => {
    const res = await fetch("/api/admin/formation/cards", { cache: "no-store" });
    const data = await res.json();
    if (data.cards) setCards(data.cards);
  }, []);

  useEffect(() => {
    refresh().finally(() => setPageLoading(false));
  }, [refresh]);

  function openCreate() {
    setForm(emptyForm());
    setEditTarget(null);
    setError("");
    setModal("create");
  }

  function openEdit(card: AdminCard) {
    setForm({
      ...emptyForm(),
      title: card.title,
      description: card.description || "",
      imageSource: "library",
      libraryUrl: card.image?.url || "",
      libraryAlt: card.image?.alt || "",
      libraryAssetId: "",
    });
    setEditTarget(card);
    setError("");
    setModal("edit");
  }

  function closeModal() {
    setModal(null);
    setForm(emptyForm());
    setEditTarget(null);
    setError("");
  }

  // Construire le FormData en tenant compte de la source d'image
  function buildFormData(extraFields: Record<string, string> = {}) {
    const fd = new FormData();
    fd.append("title", form.title.trim());
    fd.append("description", form.description.trim());
    for (const [k, v] of Object.entries(extraFields)) fd.append(k, v);

    if (form.imageSource === "upload" && form.imageFile) {
      fd.append("image", form.imageFile);
    } else if (form.imageSource === "library" && form.libraryUrl) {
      // Passe l'URL de la bibliothèque — l'API route va créer une référence asset Sanity
      fd.append("libraryImageUrl", form.libraryUrl);
      fd.append("libraryImageAlt", form.libraryAlt || form.title);
    }
    return fd;
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) { setError("Le titre est obligatoire"); return; }
    setLoading(true);
    setError("");
    const fd = buildFormData({ sortOrder: String(cards.length) });
    try {
      const res = await fetch("/api/admin/formation/cards", { method: "POST", body: fd });
      const data = await res.json();
      if (!data.success) { setError(data.error || "Erreur"); return; }
      await refresh();
      closeModal();
      showToast();
    } catch {
      setError("Erreur réseau");
    } finally {
      setLoading(false);
    }
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editTarget || !form.title.trim()) { setError("Le titre est obligatoire"); return; }
    setLoading(true);
    setError("");
    const fd = buildFormData();
    try {
      const res = await fetch(`/api/admin/formation/cards/${editTarget._id}`, { method: "PATCH", body: fd });
      const data = await res.json();
      if (!data.success) { setError(data.error || "Erreur"); return; }
      await refresh();
      closeModal();
      showToast();
    } catch {
      setError("Erreur réseau");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!deleteId) return;
    setLoading(true);
    try {
      await fetch(`/api/admin/formation/cards/${deleteId}`, { method: "DELETE" });
      await refresh();
      showToast();
    } finally {
      setLoading(false);
      setDeleteId(null);
    }
  }

  async function move(index: number, direction: "up" | "down") {
    const next = [...cards];
    const target = direction === "up" ? index - 1 : index + 1;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    const reordered = next.map((c, i) => ({ ...c, sortOrder: i }));
    setCards(reordered);
    await fetch("/api/admin/formation/cards/reorder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cards: reordered.map((c) => ({ id: c._id, sortOrder: c.sortOrder })) }),
    });
  }

  return (
    <>
      {/* Toast mis en ligne */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-[100] flex items-center gap-2.5 rounded-2xl bg-slate-900 px-5 py-3.5 shadow-2xl text-white text-sm font-semibold animate-in slide-in-from-bottom-4 fade-in duration-300">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          Mis en ligne ✓
        </div>
      )}

      {/* Bouton ajouter */}
      <div className="mb-6">
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 font-semibold text-white text-sm px-5 py-2.5 rounded-xl transition-all"
          style={{ background: "linear-gradient(135deg, #B9945F 0%, #E4D398 100%)", boxShadow: "0 4px 14px rgba(185,148,95,0.35)" }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Ajouter une carte
        </button>
      </div>

      {/* Liste */}
      {pageLoading ? (
        <div className="flex items-center justify-center py-20 gap-3 text-slate-400">
          <div className="w-5 h-5 border-2 border-slate-200 border-t-amber-500 rounded-full animate-spin" />
          <span className="text-sm font-medium">Chargement des cartes…</span>
        </div>
      ) : cards.length === 0 ? (
        <div className="text-center py-20 text-slate-400">
          <div className="text-5xl mb-4">🎓</div>
          <p className="font-medium">Aucune carte pour l&apos;instant</p>
          <p className="text-sm mt-1">Cliquez sur &quot;Ajouter une carte&quot; pour commencer</p>
        </div>
      ) : (
        <div className="space-y-3">
          {cards.map((card, i) => (
            <div key={card._id} className="flex items-center gap-4 bg-white border border-slate-100 rounded-2xl p-4 shadow-sm">
              <div className="w-20 h-14 rounded-xl overflow-hidden bg-amber-50 flex-shrink-0 flex items-center justify-center">
                {card.image?.url ? (
                  <Image src={card.image.url} alt={card.image.alt || card.title} width={80} height={56} className="w-full h-full object-cover" unoptimized />
                ) : (
                  <span className="text-xl opacity-30">🎓</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-900 truncate">{card.title}</p>
                {card.description && <p className="text-sm text-slate-500 truncate mt-0.5">{card.description}</p>}
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button onClick={() => move(i, "up")} disabled={i === 0} className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-25 disabled:cursor-not-allowed transition-colors" title="Monter">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 15l-6-6-6 6" /></svg>
                </button>
                <button onClick={() => move(i, "down")} disabled={i === cards.length - 1} className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-25 disabled:cursor-not-allowed transition-colors" title="Descendre">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6" /></svg>
                </button>
                <button onClick={() => openEdit(card)} className="p-2 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors" title="Modifier">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                </button>
                <button onClick={() => setDeleteId(card._id)} className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors" title="Supprimer">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4h6v2" /></svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Modal Création / Édition ── */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(15,21,58,0.6)", backdropFilter: "blur(8px)" }}>
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="px-6 py-5 flex-shrink-0" style={{ background: "linear-gradient(135deg, #B9945F 0%, #E4D398 100%)" }}>
              <h2 className="text-xl font-black text-white">
                {modal === "create" ? "Ajouter une carte" : "Modifier la carte"}
              </h2>
            </div>

            <form onSubmit={modal === "create" ? handleCreate : handleEdit} className="p-6 space-y-4 overflow-y-auto">
              {/* Sélecteur image avec deux onglets */}
              <ImagePicker form={form} setForm={setForm} fileRef={fileRef} />

              {/* Titre */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Titre <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="Ex : Aménagement intérieur"
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-300"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Description</label>
                <input
                  type="text"
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Courte description optionnelle"
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-300"
                />
              </div>

              {error && <p className="text-sm text-red-500">{error}</p>}

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={closeModal} className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
                  Annuler
                </button>
                <button type="submit" disabled={loading} className="flex-1 rounded-xl py-2.5 text-sm font-semibold text-white transition-all disabled:opacity-60" style={{ background: "linear-gradient(135deg, #B9945F 0%, #E4D398 100%)" }}>
                  {loading ? "Enregistrement…" : modal === "create" ? "Créer" : "Enregistrer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Confirmation suppression ── */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(15,21,58,0.6)", backdropFilter: "blur(8px)" }}>
          <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl p-6">
            <h2 className="text-lg font-black text-slate-900 mb-2">Supprimer cette carte ?</h2>
            <p className="text-sm text-slate-500 mb-6">Cette action est irréversible.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">Annuler</button>
              <button onClick={handleDelete} disabled={loading} className="flex-1 rounded-xl bg-red-500 hover:bg-red-600 py-2.5 text-sm font-semibold text-white transition-colors disabled:opacity-60">
                {loading ? "Suppression…" : "Supprimer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
