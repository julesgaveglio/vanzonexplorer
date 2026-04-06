"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

const STATUS_CONFIG = {
  pending: { label: "En attente", bg: "bg-amber-100", text: "text-amber-700" },
  approved: { label: "Approuvé", bg: "bg-emerald-100", text: "text-emerald-700" },
  rejected: { label: "Rejeté", bg: "bg-red-100", text: "text-red-700" },
};

const EQUIPMENT_LABELS: Record<string, string> = {
  "frigo": "Réfrigérateur", "plaque-cuisson": "Plaque de cuisson", "evier": "Évier",
  "vaisselle": "Vaisselle", "douche": "Douche", "wc": "WC", "eau-chaude": "Eau chaude",
  "chauffage": "Chauffage", "climatisation": "Climatisation", "moustiquaire": "Moustiquaire",
  "panneau-solaire": "Panneau solaire", "220v": "Prise 220V", "batterie-auxiliaire": "Batterie aux.",
  "store": "Store/Auvent", "porte-velo": "Porte-vélo", "galerie": "Galerie de toit",
  "gps": "GPS", "camera-recul": "Caméra de recul", "regulateur": "Régulateur",
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function MarketplaceDetailClient({ van }: { van: any }) {
  const [notes, setNotes] = useState(van.admin_notes || "");
  const [isPending, startTransition] = useTransition();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const router = useRouter();

  async function updateStatus(status: string) {
    await fetch(`/api/admin/marketplace/${van.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    startTransition(() => router.refresh());
  }

  async function saveNotes() {
    await fetch(`/api/admin/marketplace/${van.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ admin_notes: notes }),
    });
    startTransition(() => router.refresh());
  }

  async function deleteVan() {
    await fetch(`/api/admin/marketplace/${van.id}`, { method: "DELETE" });
    router.push("/admin/marketplace");
  }

  const statusConf = STATUS_CONFIG[van.status as keyof typeof STATUS_CONFIG];

  return (
    <div className="p-8 max-w-4xl">
      <a
        href="/admin/marketplace"
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-blue-600 mb-6 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Retour à la liste
      </a>

      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-black text-slate-900">{van.title}</h1>
            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${statusConf.bg} ${statusConf.text}`}>
              {statusConf.label}
            </span>
          </div>
          <p className="text-slate-500">
            {van.van_brand} {van.van_model} {van.van_year ? `(${van.van_year})` : ""}
            {van.location_city ? (
              <> · <span className="font-medium text-slate-700">📍 {van.location_city}{van.location_postal_code ? ` (${van.location_postal_code})` : ""}</span></>
            ) : null}
            {" · "}Soumis le{" "}
            {new Date(van.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>

        <div className="flex gap-2">
          {van.status !== "approved" && (
            <button
              onClick={() => updateStatus("approved")}
              disabled={isPending}
              className="px-4 py-2 rounded-xl text-sm font-medium text-white transition-all"
              style={{ background: "linear-gradient(135deg, #10B981 0%, #059669 100%)" }}
            >
              Approuver
            </button>
          )}
          {van.status !== "rejected" && (
            <button
              onClick={() => updateStatus("rejected")}
              disabled={isPending}
              className="px-4 py-2 rounded-xl text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 transition-colors"
            >
              Rejeter
            </button>
          )}
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="px-4 py-2 rounded-xl text-sm font-medium text-slate-500 bg-slate-100 hover:bg-slate-200 transition-colors"
          >
            Supprimer
          </button>
        </div>
      </div>

      {showDeleteConfirm && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center justify-between">
          <p className="text-sm text-red-700 font-medium">Supprimer définitivement cette fiche ?</p>
          <div className="flex gap-2">
            <button onClick={() => setShowDeleteConfirm(false)} className="px-3 py-1.5 text-sm text-slate-600 bg-white rounded-lg border">
              Annuler
            </button>
            <button onClick={deleteVan} className="px-3 py-1.5 text-sm text-white bg-red-500 rounded-lg hover:bg-red-600">
              Confirmer
            </button>
          </div>
        </div>
      )}

      <div className="space-y-6">
        {/* Propriétaire */}
        <section className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <h2 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            Propriétaire
          </h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-slate-400">Nom</span>
              <p className="font-medium text-slate-800">{van.owner_first_name} {van.owner_last_name}</p>
            </div>
            <div>
              <span className="text-slate-400">Email</span>
              <p className="font-medium">
                <a href={`mailto:${van.owner_email}`} className="text-blue-600 hover:underline">{van.owner_email}</a>
              </p>
            </div>
            <div>
              <span className="text-slate-400">Téléphone</span>
              <p className="font-medium">
                <a href={`tel:${van.owner_phone}`} className="text-blue-600 hover:underline">{van.owner_phone}</a>
              </p>
            </div>
          </div>
        </section>

        {/* Véhicule */}
        <section className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <h2 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            Véhicule
          </h2>
          <div className="grid grid-cols-3 gap-4 text-sm mb-4">
            <div>
              <span className="text-slate-400">Type</span>
              <p className="font-medium text-slate-800 capitalize">{van.van_type}</p>
            </div>
            <div>
              <span className="text-slate-400">Marque / Modèle</span>
              <p className="font-medium text-slate-800">{van.van_brand} {van.van_model}</p>
            </div>
            {van.van_year && (
              <div>
                <span className="text-slate-400">Année</span>
                <p className="font-medium text-slate-800">{van.van_year}</p>
              </div>
            )}
            {van.seats && (
              <div>
                <span className="text-slate-400">Places assises</span>
                <p className="font-medium text-slate-800">{van.seats}</p>
              </div>
            )}
            <div>
              <span className="text-slate-400">Couchages</span>
              <p className="font-medium text-slate-800">{van.sleeps}</p>
            </div>
            <div>
              <span className="text-slate-400">Boîte</span>
              <p className="font-medium text-slate-800 capitalize">{van.transmission}</p>
            </div>
          </div>

          {van.equipments?.length > 0 && (
            <div>
              <span className="text-slate-400 text-sm">Équipements</span>
              <div className="flex flex-wrap gap-2 mt-2">
                {van.equipments.map((eq: string) => (
                  <span key={eq} className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-medium">
                    {EQUIPMENT_LABELS[eq] || eq}
                  </span>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Photos */}
        <section className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <h2 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-purple-500" />
            Photos ({van.photos?.length || 0})
          </h2>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
            {van.photos?.map((url: string, i: number) => (
              <a key={url} href={url} target="_blank" rel="noopener noreferrer" className="aspect-[4/3] rounded-xl overflow-hidden bg-slate-100 hover:opacity-90 transition-opacity">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
              </a>
            ))}
          </div>
        </section>

        {/* Description */}
        <section className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <h2 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-sky-500" />
            Description
          </h2>
          <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{van.description}</p>
        </section>

        {/* Tarif & Localisation */}
        <section className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <h2 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            Tarif & Localisation
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-slate-400">Prix/jour</span>
              <p className="text-xl font-bold text-slate-900">{van.price_per_day}€</p>
            </div>
            <div>
              <span className="text-slate-400">Durée min</span>
              <p className="font-medium text-slate-800">{van.min_days} nuit{van.min_days > 1 ? "s" : ""}</p>
            </div>
            {van.deposit && (
              <div>
                <span className="text-slate-400">Caution</span>
                <p className="font-medium text-slate-800">{van.deposit}€</p>
              </div>
            )}
            <div>
              <span className="text-slate-400">Ville</span>
              <p className="font-medium text-slate-800">{van.location_city}</p>
            </div>
          </div>
          {van.booking_url && (
            <div className="mt-4 pt-4 border-t border-slate-100">
              <span className="text-slate-400 text-sm">Lien de réservation</span>
              <p>
                <a href={van.booking_url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline break-all">
                  {van.booking_url}
                </a>
              </p>
            </div>
          )}
        </section>

        {/* Notes admin */}
        <section className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <h2 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-slate-400" />
            Notes internes
          </h2>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Notes visibles uniquement par l'admin..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400/50 resize-none"
          />
          <button
            onClick={saveNotes}
            disabled={isPending}
            className="mt-2 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors"
          >
            Sauvegarder les notes
          </button>
        </section>
      </div>
    </div>
  );
}
