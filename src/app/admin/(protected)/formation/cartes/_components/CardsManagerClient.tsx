"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import type { AdminCard } from "../page";

interface Props {
  initialCards: AdminCard[];
}

function emptyForm() {
  return { title: "", description: "", imageFile: null as File | null, imagePreview: "" };
}

export default function CardsManagerClient({ initialCards }: Props) {
  const [cards, setCards] = useState<AdminCard[]>(initialCards);
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState<"create" | "edit" | null>(null);
  const [editTarget, setEditTarget] = useState<AdminCard | null>(null);
  const [form, setForm] = useState(emptyForm());
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  // ── Refresh depuis l'API ────────────────────────────────────────────────────
  async function refresh() {
    const res = await fetch("/api/admin/formation/cards");
    const data = await res.json();
    if (data.cards) setCards(data.cards);
  }

  // ── Ouvrir modal création ───────────────────────────────────────────────────
  function openCreate() {
    setForm(emptyForm());
    setEditTarget(null);
    setError("");
    setModal("create");
  }

  // ── Ouvrir modal édition ────────────────────────────────────────────────────
  function openEdit(card: AdminCard) {
    setForm({
      title: card.title,
      description: card.description || "",
      imageFile: null,
      imagePreview: card.image?.url || "",
    });
    setEditTarget(card);
    setError("");
    setModal("edit");
  }

  // ── Fermer modal ────────────────────────────────────────────────────────────
  function closeModal() {
    setModal(null);
    setForm(emptyForm());
    setEditTarget(null);
    setError("");
  }

  // ── Sélection fichier image ─────────────────────────────────────────────────
  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const preview = URL.createObjectURL(file);
    setForm((f) => ({ ...f, imageFile: file, imagePreview: preview }));
  }

  // ── Soumettre création ──────────────────────────────────────────────────────
  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) { setError("Le titre est obligatoire"); return; }
    setLoading(true);
    setError("");
    const fd = new FormData();
    fd.append("title", form.title.trim());
    fd.append("description", form.description.trim());
    fd.append("sortOrder", String(cards.length));
    if (form.imageFile) fd.append("image", form.imageFile);

    try {
      const res = await fetch("/api/admin/formation/cards", { method: "POST", body: fd });
      const data = await res.json();
      if (!data.success) { setError(data.error || "Erreur"); return; }
      await refresh();
      closeModal();
    } catch {
      setError("Erreur réseau");
    } finally {
      setLoading(false);
    }
  }

  // ── Soumettre édition ───────────────────────────────────────────────────────
  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editTarget || !form.title.trim()) { setError("Le titre est obligatoire"); return; }
    setLoading(true);
    setError("");
    const fd = new FormData();
    fd.append("title", form.title.trim());
    fd.append("description", form.description.trim());
    if (form.imageFile) fd.append("image", form.imageFile);

    try {
      const res = await fetch(`/api/admin/formation/cards/${editTarget._id}`, { method: "PATCH", body: fd });
      const data = await res.json();
      if (!data.success) { setError(data.error || "Erreur"); return; }
      await refresh();
      closeModal();
    } catch {
      setError("Erreur réseau");
    } finally {
      setLoading(false);
    }
  }

  // ── Supprimer ───────────────────────────────────────────────────────────────
  async function handleDelete() {
    if (!deleteId) return;
    setLoading(true);
    try {
      await fetch(`/api/admin/formation/cards/${deleteId}`, { method: "DELETE" });
      await refresh();
    } finally {
      setLoading(false);
      setDeleteId(null);
    }
  }

  // ── Réordonner ──────────────────────────────────────────────────────────────
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

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <>
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

      {/* Liste des cartes */}
      {cards.length === 0 ? (
        <div className="text-center py-20 text-slate-400">
          <div className="text-5xl mb-4">🎓</div>
          <p className="font-medium">Aucune carte pour l&apos;instant</p>
          <p className="text-sm mt-1">Cliquez sur &quot;Ajouter une carte&quot; pour commencer</p>
        </div>
      ) : (
        <div className="space-y-3">
          {cards.map((card, i) => (
            <div
              key={card._id}
              className="flex items-center gap-4 bg-white border border-slate-100 rounded-2xl p-4 shadow-sm"
            >
              {/* Vignette */}
              <div className="w-20 h-14 rounded-xl overflow-hidden bg-amber-50 flex-shrink-0 flex items-center justify-center">
                {card.image?.url ? (
                  <Image
                    src={card.image.url}
                    alt={card.image.alt || card.title}
                    width={80}
                    height={56}
                    className="w-full h-full object-cover"
                    unoptimized
                  />
                ) : (
                  <span className="text-xl opacity-30">🎓</span>
                )}
              </div>

              {/* Infos */}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-900 truncate">{card.title}</p>
                {card.description && (
                  <p className="text-sm text-slate-500 truncate mt-0.5">{card.description}</p>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 flex-shrink-0">
                {/* Monter */}
                <button
                  onClick={() => move(i, "up")}
                  disabled={i === 0}
                  className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-25 disabled:cursor-not-allowed transition-colors"
                  title="Monter"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 15l-6-6-6 6" />
                  </svg>
                </button>
                {/* Descendre */}
                <button
                  onClick={() => move(i, "down")}
                  disabled={i === cards.length - 1}
                  className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-25 disabled:cursor-not-allowed transition-colors"
                  title="Descendre"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </button>
                {/* Éditer */}
                <button
                  onClick={() => openEdit(card)}
                  className="p-2 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                  title="Modifier"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                </button>
                {/* Supprimer */}
                <button
                  onClick={() => setDeleteId(card._id)}
                  className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                  title="Supprimer"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6l-1 14H6L5 6" />
                    <path d="M10 11v6M14 11v6" />
                    <path d="M9 6V4h6v2" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Modal Création / Édition ── */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(15,21,58,0.6)", backdropFilter: "blur(8px)" }}>
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden">
            {/* Header */}
            <div
              className="px-6 py-5"
              style={{ background: "linear-gradient(135deg, #B9945F 0%, #E4D398 100%)" }}
            >
              <h2 className="text-xl font-black text-white">
                {modal === "create" ? "Ajouter une carte" : "Modifier la carte"}
              </h2>
            </div>

            <form onSubmit={modal === "create" ? handleCreate : handleEdit} className="p-6 space-y-4">
              {/* Image */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Image</label>
                <div
                  className="relative flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 cursor-pointer hover:border-amber-300 hover:bg-amber-50/30 transition-colors overflow-hidden"
                  style={{ height: form.imagePreview ? "auto" : "120px" }}
                  onClick={() => fileRef.current?.click()}
                >
                  {form.imagePreview ? (
                    <div className="relative w-full" style={{ aspectRatio: "16/9" }}>
                      <Image
                        src={form.imagePreview}
                        alt="Aperçu"
                        fill
                        className="object-cover"
                        unoptimized
                      />
                      <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                        <span className="text-white text-sm font-semibold">Changer l&apos;image</span>
                      </div>
                    </div>
                  ) : (
                    <>
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="3" width="18" height="18" rx="2" />
                        <circle cx="8.5" cy="8.5" r="1.5" />
                        <path d="M21 15l-5-5L5 21" />
                      </svg>
                      <span className="text-sm text-slate-400">Cliquer pour uploader</span>
                    </>
                  )}
                </div>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
              </div>

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

              {/* Boutons */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 rounded-xl py-2.5 text-sm font-semibold text-white transition-all disabled:opacity-60"
                  style={{ background: "linear-gradient(135deg, #B9945F 0%, #E4D398 100%)" }}
                >
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
              <button
                onClick={() => setDeleteId(null)}
                className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleDelete}
                disabled={loading}
                className="flex-1 rounded-xl bg-red-500 hover:bg-red-600 py-2.5 text-sm font-semibold text-white transition-colors disabled:opacity-60"
              >
                {loading ? "Suppression…" : "Supprimer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
