"use client";

import { useEffect, useState } from "react";
import { useUser, SignOutButton } from "@clerk/nextjs";
import Image from "next/image";
import Link from "next/link";
import { EQUIPMENT_LABELS } from "@/lib/equipment-labels";
import { parseBookingUrls, serializeBookingUrls } from "@/lib/booking-urls";

/* ─── Types ─────────────────────────────────────────────────────────────── */

interface MarketplaceVan {
  id: string;
  title: string;
  description: string;
  van_brand: string;
  van_model: string;
  van_year: number | null;
  van_type: string;
  seats: number | null;
  sleeps: number;
  transmission: string;
  equipments: string[];
  photos: string[];
  price_per_day: number;
  min_days: number;
  deposit: number | null;
  booking_url: string | null;
  location_city: string;
  location_postal_code: string | null;
  location_address: string | null;
  status: "pending" | "approved" | "rejected";
  created_at: string;
}

/* ─── Constants ─────────────────────────────────────────────────────────── */

const STATUS_CONFIG = {
  pending: { label: "En cours de validation", bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", icon: "⏳" },
  approved: { label: "En ligne", bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", icon: "✓" },
  rejected: { label: "Refusée", bg: "bg-red-50", text: "text-red-700", border: "border-red-200", icon: "✕" },
};

const ALL_EQUIPMENTS = Object.keys(EQUIPMENT_LABELS);

const inputCls =
  "w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400/40 focus:border-blue-400 focus:bg-white transition-all";

/* ─── Component ─────────────────────────────────────────────────────────── */

export default function OwnerDashboardClient() {
  const { user, isLoaded } = useUser();
  const [vans, setVans] = useState<MarketplaceVan[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingVan, setEditingVan] = useState<MarketplaceVan | null>(null);

  useEffect(() => {
    if (!isLoaded || !user) return;
    fetch("/api/marketplace/owner")
      .then((r) => r.json())
      .then((d) => setVans(d.vans ?? []))
      .finally(() => setLoading(false));
  }, [isLoaded, user]);

  if (!isLoaded || loading) {
    return (
      <section className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </section>
    );
  }

  return (
    <section className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-100">
        <div className="max-w-5xl mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image
              src="https://cdn.sanity.io/images/lewexa74/production/1f483103ef15ee3549eab14ba2801d11b32a9055-313x313.png"
              alt="Vanzon Explorer"
              width={36}
              height={36}
              className="rounded-lg"
              unoptimized
            />
            <div>
              <h1 className="text-lg font-bold text-slate-900">Mon espace</h1>
              <p className="text-xs text-slate-400">{user?.emailAddresses?.[0]?.emailAddress}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/proprietaire/inscription"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all"
              style={{ background: "linear-gradient(135deg, #4D5FEC 0%, #3B82F6 100%)" }}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Ajouter un van
            </Link>
            <SignOutButton>
              <button className="px-3 py-2 rounded-xl text-sm text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors">
                Déconnexion
              </button>
            </SignOutButton>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {editingVan ? (
          <VanEditForm
            van={editingVan}
            onCancel={() => setEditingVan(null)}
            onSaved={(updated) => {
              setVans((prev) => prev.map((v) => (v.id === updated.id ? { ...v, ...updated } : v)));
              setEditingVan(null);
            }}
          />
        ) : (
          <>
            {vans.length === 0 ? (
              <EmptyState />
            ) : (
              <div className="space-y-4">
                <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
                  Mes annonces ({vans.length})
                </h2>
                {vans.map((van) => (
                  <VanListItem key={van.id} van={van} onEdit={() => setEditingVan(van)} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}

/* ─── Empty State ───────────────────────────────────────────────────────── */

function EmptyState() {
  return (
    <div className="text-center py-20">
      <div className="text-5xl mb-4">🚐</div>
      <h2 className="text-xl font-bold text-slate-900 mb-2">Aucune annonce pour le moment</h2>
      <p className="text-slate-500 mb-6">Déposez votre première annonce et rejoignez la plateforme Vanzon.</p>
      <Link
        href="/proprietaire/inscription"
        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white transition-all"
        style={{ background: "linear-gradient(135deg, #4D5FEC 0%, #3B82F6 100%)" }}
      >
        Déposer mon van
      </Link>
    </div>
  );
}

/* ─── Van List Item ─────────────────────────────────────────────────────── */

function VanListItem({ van, onEdit }: { van: MarketplaceVan; onEdit: () => void }) {
  const status = STATUS_CONFIG[van.status];

  return (
    <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden hover:shadow-md transition-shadow">
      <div className="flex flex-col sm:flex-row">
        {/* Photo */}
        <div className="sm:w-48 aspect-[4/3] sm:aspect-auto flex-shrink-0 bg-slate-100">
          {van.photos?.[0] ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={van.photos[0]} alt={van.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-4xl text-slate-300">🚐</div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-bold text-slate-900">{van.title}</h3>
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${status.bg} ${status.text} ${status.border} border`}>
                {status.icon} {status.label}
              </span>
            </div>
            <p className="text-sm text-slate-500">
              {van.van_brand} {van.van_model} · {van.location_city} · {van.price_per_day}€/jour
            </p>
          </div>

          <div className="flex items-center justify-between mt-3">
            <p className="text-xs text-slate-400">
              Soumis le {new Date(van.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
            </p>
            <button
              onClick={onEdit}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
              </svg>
              Modifier
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Van Edit Form ─────────────────────────────────────────────────────── */

function VanEditForm({
  van,
  onCancel,
  onSaved,
}: {
  van: MarketplaceVan;
  onCancel: () => void;
  onSaved: (updated: Partial<MarketplaceVan> & { id: string }) => void;
}) {
  const [title, setTitle] = useState(van.title);
  const [description, setDescription] = useState(van.description);
  const [equipments, setEquipments] = useState<string[]>(van.equipments ?? []);
  const [customEquipment, setCustomEquipment] = useState("");
  const [pricePerDay, setPricePerDay] = useState(van.price_per_day);
  const [minDays, setMinDays] = useState(van.min_days);
  const [deposit, setDeposit] = useState(van.deposit ?? 0);
  const [bookingUrls, setBookingUrls] = useState<string[]>(() => {
    const parsed = parseBookingUrls(van.booking_url);
    return parsed.length > 0 ? parsed : [""];
  });
  const [locationCity, setLocationCity] = useState(van.location_city);
  const [locationPostalCode, setLocationPostalCode] = useState(van.location_postal_code ?? "");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  function toggleEquipment(eq: string) {
    setEquipments((prev) => (prev.includes(eq) ? prev.filter((e) => e !== eq) : [...prev, eq]));
  }

  function addCustomEquipment() {
    const trimmed = customEquipment.trim();
    if (!trimmed || equipments.includes(trimmed)) return;
    setEquipments((prev) => [...prev, trimmed]);
    setCustomEquipment("");
  }

  function removeCustomEquipment(eq: string) {
    setEquipments((prev) => prev.filter((e) => e !== eq));
  }

  async function handleSave() {
    setSaving(true);
    setError("");
    setSuccess(false);

    try {
      const res = await fetch("/api/marketplace/owner", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: van.id,
          title,
          description,
          equipments,
          price_per_day: pricePerDay,
          min_days: minDays,
          deposit: deposit || null,
          booking_url: serializeBookingUrls(bookingUrls),
          location_city: locationCity,
          location_postal_code: locationPostalCode || null,
        }),
      });

      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Erreur lors de la sauvegarde");
      }

      setSuccess(true);
      setTimeout(() => {
        onSaved({
          id: van.id,
          title,
          description,
          equipments,
          price_per_day: pricePerDay,
          min_days: minDays,
          deposit: deposit || null,
          booking_url: serializeBookingUrls(bookingUrls),
          location_city: locationCity,
          location_postal_code: locationPostalCode || null,
        });
      }, 800);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setSaving(false);
    }
  }

  // Separate known equipments from custom ones
  const knownEquipments = ALL_EQUIPMENTS;
  const customEquipments = equipments.filter((eq) => !knownEquipments.includes(eq));

  return (
    <div>
      {/* Back button */}
      <button
        onClick={onCancel}
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-blue-600 mb-6 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Retour à mes annonces
      </button>

      <div className="flex items-center gap-3 mb-6">
        <h2 className="text-xl font-bold text-slate-900">Modifier l&apos;annonce</h2>
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_CONFIG[van.status].bg} ${STATUS_CONFIG[van.status].text} border ${STATUS_CONFIG[van.status].border}`}>
          {STATUS_CONFIG[van.status].icon} {STATUS_CONFIG[van.status].label}
        </span>
      </div>

      <div className="space-y-6">
        {/* Titre & Description */}
        <section className="bg-white rounded-2xl border border-slate-100 p-6">
          <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            Annonce
          </h3>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-600 mb-1.5 block">Titre de l&apos;annonce</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className={inputCls}
                maxLength={100}
              />
              <p className="text-xs text-slate-400 mt-1">{title.length}/100 caractères</p>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-600 mb-1.5 block">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className={inputCls + " resize-none"}
                rows={6}
                maxLength={2000}
              />
              <p className="text-xs text-slate-400 mt-1">{description.length}/2000 caractères</p>
            </div>
          </div>
        </section>

        {/* Équipements */}
        <section className="bg-white rounded-2xl border border-slate-100 p-6">
          <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            Équipements
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
            {knownEquipments.map((eq) => (
              <button
                key={eq}
                type="button"
                onClick={() => toggleEquipment(eq)}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-all border ${
                  equipments.includes(eq)
                    ? "bg-blue-50 border-blue-200 text-blue-700"
                    : "bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300"
                }`}
              >
                <span className={`w-4 h-4 rounded-md border-2 flex items-center justify-center flex-shrink-0 ${
                  equipments.includes(eq) ? "bg-blue-500 border-blue-500" : "border-slate-300"
                }`}>
                  {equipments.includes(eq) && (
                    <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </span>
                {EQUIPMENT_LABELS[eq]}
              </button>
            ))}
          </div>

          {/* Custom equipments */}
          {customEquipments.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {customEquipments.map((eq) => (
                <span
                  key={eq}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 border border-purple-200 text-purple-700 rounded-lg text-sm font-medium"
                >
                  {eq}
                  <button
                    type="button"
                    onClick={() => removeCustomEquipment(eq)}
                    className="text-purple-400 hover:text-purple-600"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Add custom equipment */}
          <div className="flex gap-2">
            <input
              type="text"
              value={customEquipment}
              onChange={(e) => setCustomEquipment(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCustomEquipment())}
              placeholder="Ajouter un équipement personnalisé..."
              className={inputCls + " flex-1"}
            />
            <button
              type="button"
              onClick={addCustomEquipment}
              disabled={!customEquipment.trim()}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex-shrink-0"
            >
              Ajouter
            </button>
          </div>
        </section>

        {/* Tarif & Conditions */}
        <section className="bg-white rounded-2xl border border-slate-100 p-6">
          <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            Tarif & Conditions
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-slate-600 mb-1.5 block">Prix / jour</label>
              <div className="relative">
                <input
                  type="number"
                  value={pricePerDay}
                  onChange={(e) => setPricePerDay(Number(e.target.value))}
                  className={inputCls + " pr-8"}
                  min={20}
                  max={500}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">€</span>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-600 mb-1.5 block">Durée minimum</label>
              <div className="relative">
                <input
                  type="number"
                  value={minDays}
                  onChange={(e) => setMinDays(Number(e.target.value))}
                  className={inputCls + " pr-14"}
                  min={1}
                  max={30}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">nuit(s)</span>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-600 mb-1.5 block">Caution</label>
              <div className="relative">
                <input
                  type="number"
                  value={deposit}
                  onChange={(e) => setDeposit(Number(e.target.value))}
                  className={inputCls + " pr-8"}
                  min={0}
                  max={5000}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">€</span>
              </div>
            </div>
          </div>
        </section>

        {/* Liens de réservation */}
        <section className="bg-white rounded-2xl border border-slate-100 p-6">
          <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-purple-500" />
            Liens de réservation
            <span className="text-red-500 text-sm">*</span>
          </h3>
          <p className="text-sm text-slate-500 mb-3">
            Ajoutez tous vos canaux de location (Yescapa, Wikicampers, Leboncoin, site personnel, etc.)
          </p>
          <div className="space-y-2.5">
            {bookingUrls.map((url, index) => (
              <div key={index} className="flex gap-2">
                <input
                  type="url"
                  value={url}
                  onChange={(e) => {
                    const updated = [...bookingUrls];
                    updated[index] = e.target.value;
                    setBookingUrls(updated);
                  }}
                  placeholder={index === 0 ? "https://www.yescapa.fr/campers/..." : "https://www.leboncoin.fr/... ou autre"}
                  className={inputCls + " flex-1"}
                />
                {bookingUrls.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setBookingUrls((prev) => prev.filter((_, i) => i !== index))}
                    className="flex-shrink-0 w-10 h-[46px] rounded-xl border border-slate-200 flex items-center justify-center text-slate-400 hover:text-red-500 hover:border-red-200 hover:bg-red-50 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setBookingUrls((prev) => [...prev, ""])}
            className="mt-2.5 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-[#4D5FEC] bg-blue-50 hover:bg-blue-100 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Ajouter un autre lien
          </button>
        </section>

        {/* Localisation */}
        <section className="bg-white rounded-2xl border border-slate-100 p-6">
          <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-sky-500" />
            Localisation
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-slate-600 mb-1.5 block">Ville</label>
              <input
                type="text"
                value={locationCity}
                onChange={(e) => setLocationCity(e.target.value)}
                className={inputCls}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-600 mb-1.5 block">Code postal</label>
              <input
                type="text"
                value={locationPostalCode}
                onChange={(e) => setLocationPostalCode(e.target.value)}
                className={inputCls}
              />
            </div>
          </div>
        </section>

        {/* Photos (read-only) */}
        {van.photos?.length > 0 && (
          <section className="bg-white rounded-2xl border border-slate-100 p-6">
            <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-pink-500" />
              Photos ({van.photos.length})
            </h3>
            <p className="text-sm text-slate-500 mb-3">
              Pour modifier vos photos, contactez-nous à <a href="mailto:jules@vanzonexplorer.com" className="text-blue-600 hover:underline">jules@vanzonexplorer.com</a>
            </p>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {van.photos.map((url, i) => (
                <div key={url} className="aspect-[4/3] rounded-xl overflow-hidden bg-slate-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Save */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <p className="text-sm text-red-700 font-medium">{error}</p>
          </div>
        )}

        {success && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
            <p className="text-sm text-emerald-700 font-medium">Modifications enregistrées avec succes !</p>
          </div>
        )}

        <div className="flex items-center justify-between pt-2 pb-10">
          <button
            onClick={onCancel}
            className="px-5 py-2.5 rounded-xl text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-60"
            style={{ background: "linear-gradient(135deg, #4D5FEC 0%, #3B82F6 100%)" }}
          >
            {saving ? (
              <>
                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                Enregistrement...
              </>
            ) : (
              "Enregistrer les modifications"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
