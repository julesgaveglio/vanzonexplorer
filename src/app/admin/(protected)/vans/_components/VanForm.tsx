"use client";

import { useState, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { upsertVan, deleteVan } from "../actions";
import { extractText } from "../utils";
import MediaPickerModal from "@/components/admin/MediaPickerModal";

interface GalleryItem { _key: string; ref: string; url: string; alt: string; }

interface VanData {
  _id?: string; name?: string; slug?: string;
  offerType?: string[]; status?: string; tagline?: string;
  featured?: boolean; sortOrder?: number;
  mainImageUrl?: string; mainImageRef?: string; mainImageAlt?: string;
  gallery?: GalleryItem[];
  vanType?: string; brand?: string; model?: string;
  year?: number; mileage?: number; capacity?: number; length?: number;
  startingPricePerNight?: number; salePrice?: number;
  externalBookingUrl?: string; externalBookingPlatform?: string; insuranceIncluded?: boolean;
  eq_bed_type?: string; eq_bed_size?: string;
  eq_shower?: boolean; eq_shower_type?: string;
  eq_toilet?: boolean; eq_toilet_type?: string;
  eq_kitchen?: boolean; eq_stove_type?: string;
  eq_fridge?: boolean; eq_fridge_liters?: number; eq_freezer?: boolean;
  eq_heating?: boolean; eq_heating_type?: string;
  eq_solar?: boolean; eq_solar_watts?: number; eq_battery_ah?: number; eq_inverter_220v?: boolean;
  eq_wifi?: boolean; eq_tv?: boolean; eq_usb_ports?: boolean; eq_bluetooth?: boolean;
  eq_outdoor_awning?: boolean; eq_outdoor_chairs?: boolean; eq_outdoor_bbq?: boolean;
  eq_surf_rack?: boolean; eq_bike_rack?: boolean;
  descriptionBlocks?: { text?: string }[];
  highlights?: string[]; rules?: string[];
  seoTitle?: string; seoDescription?: string;
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-4 pb-2 border-b border-slate-100">
      {children}
    </h2>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-semibold text-slate-700">{label}</label>
      {hint && <p className="text-xs text-slate-400">{hint}</p>}
      {children}
    </div>
  );
}

const inputCls = "w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition-all bg-white";
const selectCls = `${inputCls} cursor-pointer`;

function CheckBox({ name, label, defaultChecked }: { name: string; label: string; defaultChecked?: boolean }) {
  return (
    <label className="flex items-center gap-2.5 cursor-pointer group">
      <input type="checkbox" name={name} defaultChecked={defaultChecked}
        className="w-4 h-4 rounded border-slate-300 text-blue-500 accent-blue-500" />
      <span className="text-sm text-slate-700 group-hover:text-slate-900">{label}</span>
    </label>
  );
}

export default function VanForm({ van }: { van?: VanData }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Image principale
  const [mainImageUrl, setMainImageUrl] = useState(van?.mainImageUrl || "");
  const [mainImageRef, setMainImageRef] = useState(van?.mainImageRef || "");
  const [mainImageAlt, setMainImageAlt] = useState(van?.mainImageAlt || "");
  const [uploadingMain, setUploadingMain] = useState(false);
  const mainFileRef = useRef<HTMLInputElement>(null);

  // Galerie
  const [gallery, setGallery] = useState<GalleryItem[]>(van?.gallery || []);
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const galleryFileRef = useRef<HTMLInputElement>(null);

  // Suggestions IA
  const [mainImageAiHint, setMainImageAiHint] = useState(false);
  const [galleryAiKeys, setGalleryAiKeys] = useState<Set<string>>(new Set());

  // Media picker
  const [showMediaPicker, setShowMediaPicker] = useState<"main" | "gallery" | null>(null);
  const [mediaRefreshTrigger, setMediaRefreshTrigger] = useState(0);

  // Équipements conditionnels
  const [hasShower, setHasShower] = useState(van?.eq_shower ?? false);
  const [hasToilet, setHasToilet] = useState(van?.eq_toilet ?? false);
  const [hasKitchen, setHasKitchen] = useState(van?.eq_kitchen ?? false);
  const [hasHeating, setHasHeating] = useState(van?.eq_heating ?? false);
  const [hasSolar, setHasSolar] = useState(van?.eq_solar ?? false);
  const [hasFridge, setHasFridge] = useState(van?.eq_fridge ?? false);

  const isNew = !van?._id;

  async function uploadImage(
    file: File,
    opts: { vanName?: string } = {}
  ): Promise<{ ref: string; url: string; aiAlt?: string; aiCaption?: string } | null> {
    const fd = new FormData();
    fd.append("file", file);
    fd.append("title", file.name.replace(/\.[^/.]+$/, ""));
    fd.append("category", "vans");
    fd.append("imageRole", "gallery"); // toutes les photos vans sont en 3:2
    if (opts.vanName) fd.append("vanName", opts.vanName);
    const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
    if (!res.ok) return null;
    const data = await res.json();
    return data.assetId
      ? { ref: data.assetId, url: data.url, aiAlt: data.aiAlt, aiCaption: data.aiCaption }
      : null;
  }

  async function handleMainImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingMain(true);
    // van?.name pour les vans existants ; DOM fallback pour les nouveaux vans non encore sauvegardés
    const vanNameVal = van?.name ?? (document.querySelector<HTMLInputElement>('input[name="name"]'))?.value;
    const result = await uploadImage(file, { vanName: vanNameVal });
    setUploadingMain(false);
    if (result) {
      setMainImageRef(result.ref);
      setMainImageUrl(result.url);
      if (result.aiAlt) {
        setMainImageAlt(prev => prev || result.aiAlt!);
        setMainImageAiHint(true);
      }
      setMediaRefreshTrigger(t => t + 1);
    }
  }

  async function handleGalleryUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploadingGallery(true);
    const vanNameVal = van?.name ?? (document.querySelector<HTMLInputElement>('input[name="name"]'))?.value;
    for (const file of files) {
      const result = await uploadImage(file, { vanName: vanNameVal });
      if (result) {
        const key = `g${Date.now()}${Math.random()}`;
        setGallery(prev => [...prev, {
          _key: key,
          ref: result.ref,
          url: result.url,
          alt: result.aiAlt ?? "",
        }]);
        if (result.aiAlt) {
          setGalleryAiKeys(prev => new Set(prev).add(key));
        }
        setMediaRefreshTrigger(t => t + 1);
      }
    }
    setUploadingGallery(false);
  }

  function removeGalleryItem(key: string) {
    setGallery(prev => prev.filter(g => g._key !== key));
  }

  function updateGalleryAlt(key: string, alt: string) {
    setGallery(prev => prev.map(g => g._key === key ? { ...g, alt } : g));
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    const fd = new FormData(e.currentTarget);
    fd.set("mainImageRef", mainImageRef);
    fd.set("mainImageAlt", mainImageAlt);
    fd.set("galleryJson", JSON.stringify(gallery));

    startTransition(async () => {
      try {
        await upsertVan(fd);
        setSuccess(true);
        setTimeout(() => router.push("/admin/vans"), 1200);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erreur lors de la sauvegarde");
      }
    });
  }

  async function handleDelete() {
    if (!van?._id) return;
    if (!confirmDelete) { setConfirmDelete(true); return; }
    setDeleting(true);
    try {
      await deleteVan(van._id);
      router.push("/admin/vans");
    } catch {
      setError("Erreur lors de la suppression");
      setDeleting(false);
    }
  }

  return (
    <>
    <form onSubmit={handleSubmit} className="space-y-10 pb-20">
      {/* ── IDENTITÉ ── */}
      <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-5">
        <SectionTitle>Identité</SectionTitle>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Field label="Nom du van *">
            <input name="name" defaultValue={van?.name} required className={inputCls} placeholder="Ex : Yoni" />
          </Field>
          <Field label="Slug URL *" hint="Généré automatiquement depuis le nom">
            <input name="slug" defaultValue={van?.slug} required className={inputCls} placeholder="ex-yoni" />
          </Field>
        </div>
        <Field label="Accroche courte" hint="Affichée sous le nom sur les cartes">
          <input name="tagline" defaultValue={van?.tagline} className={inputCls} placeholder="Ex : Le compagnon idéal pour la côte basque" />
        </Field>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <Field label="Type d'offre *">
            <div className="flex flex-col gap-2 pt-1">
              {["location", "achat"].map(t => (
                <label key={t} className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" name="offerType" value={t}
                    defaultChecked={van?.offerType?.includes(t) ?? t === "location"}
                    className="accent-blue-500" />
                  <span className="text-sm font-medium text-slate-700 capitalize">{t}</span>
                </label>
              ))}
            </div>
          </Field>
          <Field label="Statut">
            <select name="status" defaultValue={van?.status || "available"} className={selectCls}>
              <option value="available">✅ Disponible</option>
              <option value="reserved">⏳ Réservé</option>
              <option value="sold">🔴 Vendu</option>
              <option value="preparing">🔧 En préparation</option>
            </select>
          </Field>
          <Field label="Ordre d'affichage">
            <input type="number" name="sortOrder" defaultValue={van?.sortOrder ?? 99} className={inputCls} />
          </Field>
        </div>
        <div className="flex items-center gap-3 pt-1">
          <input type="hidden" name="featured" value="false" />
          <label className="flex items-center gap-2.5 cursor-pointer">
            <input type="checkbox" name="featured" value="true"
              defaultChecked={van?.featured}
              className="w-4 h-4 accent-blue-500" />
            <span className="text-sm font-semibold text-slate-700">Mettre en avant sur la page d&apos;accueil</span>
          </label>
        </div>
        {van?._id && <input type="hidden" name="_id" value={van._id} />}
      </section>

      {/* ── MÉDIAS ── */}
      <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-6">
        <SectionTitle>Photos</SectionTitle>

        {/* Image principale */}
        <div>
          <p className="text-sm font-semibold text-slate-700 mb-3">Image principale *</p>
          <div className="flex items-start gap-4">
            {mainImageUrl ? (
              <div className="relative flex-shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`${mainImageUrl}?w=160&h=120&fit=crop&auto=format`} alt="principale" className="w-40 h-28 object-cover rounded-xl border border-slate-200" />
                <button type="button" onClick={() => { setMainImageUrl(""); setMainImageRef(""); }}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full text-xs flex items-center justify-center hover:bg-red-600">✕</button>
              </div>
            ) : (
              <div onClick={() => mainFileRef.current?.click()}
                className="w-40 h-28 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center gap-2 text-slate-400 cursor-pointer hover:border-blue-300 hover:text-blue-400 transition-colors">
                {uploadingMain ? <span className="text-xs animate-pulse">Upload…</span> : <>
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" /></svg>
                  <span className="text-xs font-medium">Ajouter</span>
                </>}
              </div>
            )}
            <div className="flex-1 space-y-3">
              <input ref={mainFileRef} type="file" accept="image/*" className="hidden" onChange={handleMainImage} />
              <div className="flex gap-2 flex-wrap">
                <button type="button" onClick={() => setShowMediaPicker("main")}
                  className="text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors">
                  📷 Médiathèque
                </button>
                <button type="button" onClick={() => mainFileRef.current?.click()}
                  className="text-xs font-semibold text-slate-600 bg-slate-50 hover:bg-slate-100 px-3 py-1.5 rounded-lg transition-colors">
                  Depuis l&apos;ordi
                </button>
              </div>
              <div className="relative">
                <input
                  value={mainImageAlt}
                  onChange={e => { setMainImageAlt(e.target.value); setMainImageAiHint(false); }}
                  className={inputCls}
                  placeholder="Texte alternatif (description de l'image)"
                />
                {mainImageAiHint && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full font-medium pointer-events-none">
                    ✨ IA
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Galerie */}
        <div>
          <p className="text-sm font-semibold text-slate-700 mb-3">Galerie photos <span className="text-slate-400 font-normal">(optionnel)</span></p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
            {gallery.map(item => (
              <div key={item._key} className="relative group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`${item.url}?w=200&h=150&fit=crop&auto=format`} alt={item.alt} className="w-full aspect-[4/3] object-cover rounded-xl border border-slate-200" />
                {/* Badge IA — disparaît quand l'utilisateur modifie la légende */}
                {galleryAiKeys.has(item._key) && (
                  <span className="absolute top-1 left-1 text-xs bg-violet-600/90 text-white px-1.5 py-0.5 rounded-full font-medium pointer-events-none">
                    ✨ IA
                  </span>
                )}
                <input
                  value={item.alt}
                  onChange={e => {
                    updateGalleryAlt(item._key, e.target.value);
                    setGalleryAiKeys(prev => { const s = new Set(prev); s.delete(item._key); return s; });
                  }}
                  className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs px-2 py-1 rounded-b-xl placeholder-white/60 focus:outline-none"
                  placeholder="Légende..."
                />
                <button type="button" onClick={() => removeGalleryItem(item._key)}
                  className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full text-xs hidden group-hover:flex items-center justify-center hover:bg-red-600">✕</button>
              </div>
            ))}
            <div className="aspect-[4/3] border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center gap-1 text-slate-400">
              {uploadingGallery ? (
                <span className="text-xs animate-pulse">Upload…</span>
              ) : (
                <div className="flex flex-col items-center gap-1.5">
                  <button type="button" onClick={() => setShowMediaPicker("gallery")}
                    className="text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-lg transition-colors">
                    📷 Médiathèque
                  </button>
                  <button type="button" onClick={() => galleryFileRef.current?.click()}
                    className="text-xs text-slate-400 hover:text-slate-600 underline">
                    ou depuis l&apos;ordi
                  </button>
                </div>
              )}
            </div>
          </div>
          <input ref={galleryFileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleGalleryUpload} />
        </div>
      </section>

      {/* ── CARACTÉRISTIQUES ── */}
      <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-5">
        <SectionTitle>Caractéristiques techniques</SectionTitle>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Field label="Type de véhicule">
            <select name="vanType" defaultValue={van?.vanType || ""} className={selectCls}>
              <option value="">— Choisir —</option>
              <option value="fourgon">Fourgon</option>
              <option value="camping-car">Camping-car</option>
              <option value="combi">Combi</option>
              <option value="utilitaire">Utilitaire</option>
            </select>
          </Field>
          <Field label="Marque">
            <input name="brand" defaultValue={van?.brand} className={inputCls} placeholder="Renault, VW…" />
          </Field>
          <Field label="Modèle">
            <input name="model" defaultValue={van?.model} className={inputCls} placeholder="Trafic III…" />
          </Field>
          <Field label="Année">
            <input type="number" name="year" defaultValue={van?.year} className={inputCls} placeholder="2020" />
          </Field>
          <Field label="Kilométrage" hint="Pour les vans à vendre">
            <input type="number" name="mileage" defaultValue={van?.mileage} className={inputCls} placeholder="85000" />
          </Field>
          <Field label="Couchages">
            <input type="number" name="capacity" defaultValue={van?.capacity} className={inputCls} min={1} max={8} placeholder="3" />
          </Field>
          <Field label="Longueur (m)">
            <input type="number" name="length" step="0.1" defaultValue={van?.length} className={inputCls} placeholder="5.4" />
          </Field>
        </div>
      </section>

      {/* ── TARIFICATION ── */}
      <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-5">
        <SectionTitle>Tarification & Réservation</SectionTitle>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Field label="Prix location (€/nuit)" hint="Prix plancher affiché sur le site">
            <input type="number" name="startingPricePerNight" defaultValue={van?.startingPricePerNight} className={inputCls} placeholder="65" />
          </Field>
          <Field label="Prix de vente (€)" hint="Uniquement si le van est à vendre">
            <input type="number" name="salePrice" defaultValue={van?.salePrice} className={inputCls} placeholder="28000" />
          </Field>
          <Field label="URL de réservation" hint="Lien Yescapa, Outdoorsy, etc.">
            <input type="url" name="externalBookingUrl" defaultValue={van?.externalBookingUrl} className={inputCls} placeholder="https://www.yescapa.fr/campers/..." />
          </Field>
          <Field label="Plateforme">
            <select name="externalBookingPlatform" defaultValue={van?.externalBookingPlatform || "Yescapa"} className={selectCls}>
              <option value="Yescapa">Yescapa</option>
              <option value="Outdoorsy">Outdoorsy</option>
              <option value="Privatecar">Privatecar</option>
              <option value="Autre">Autre</option>
            </select>
          </Field>
        </div>
        <div className="flex items-center gap-3">
          <input type="hidden" name="insuranceIncluded" value="false" />
          <label className="flex items-center gap-2.5 cursor-pointer">
            <input type="checkbox" name="insuranceIncluded" value="true"
              defaultChecked={van?.insuranceIncluded ?? true}
              className="w-4 h-4 accent-blue-500" />
            <span className="text-sm font-semibold text-slate-700">Assurance tous risques incluse</span>
          </label>
        </div>
      </section>

      {/* ── ÉQUIPEMENTS ── */}
      <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-6">
        <SectionTitle>Équipements</SectionTitle>

        {/* Literie */}
        <div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">🛏 Literie</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <Field label="Type de lit">
              <select name="eq_bed_type" defaultValue={van?.eq_bed_type || ""} className={selectCls}>
                <option value="">— Choisir —</option>
                <option value="fixed">Lit fixe</option>
                <option value="convertible">Lit convertible</option>
                <option value="bunk">Lits superposés</option>
              </select>
            </Field>
            <Field label="Dimensions">
              <input name="eq_bed_size" defaultValue={van?.eq_bed_size} className={inputCls} placeholder="140×190 cm" />
            </Field>
          </div>
        </div>

        {/* Sanitaires */}
        <div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">🚿 Sanitaires</p>
          <div className="space-y-3">
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input type="checkbox" name="eq_shower" defaultChecked={van?.eq_shower}
                onChange={e => setHasShower(e.target.checked)} className="w-4 h-4 accent-blue-500" />
              <span className="text-sm font-medium text-slate-700">Douche</span>
            </label>
            {hasShower && (
              <div className="ml-7">
                <select name="eq_shower_type" defaultValue={van?.eq_shower_type || ""} className={`${selectCls} max-w-xs`}>
                  <option value="">— Type de douche —</option>
                  <option value="hot">Eau chaude</option>
                  <option value="solar">Solaire</option>
                  <option value="outdoor">Extérieure</option>
                </select>
              </div>
            )}
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input type="checkbox" name="eq_toilet" defaultChecked={van?.eq_toilet}
                onChange={e => setHasToilet(e.target.checked)} className="w-4 h-4 accent-blue-500" />
              <span className="text-sm font-medium text-slate-700">Toilettes</span>
            </label>
            {hasToilet && (
              <div className="ml-7">
                <select name="eq_toilet_type" defaultValue={van?.eq_toilet_type || ""} className={`${selectCls} max-w-xs`}>
                  <option value="">— Type —</option>
                  <option value="chemical">Chimique</option>
                  <option value="cassette">Cassette</option>
                  <option value="compost">Compost / Sèche</option>
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Cuisine */}
        <div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">🍳 Cuisine</p>
          <div className="space-y-3">
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input type="checkbox" name="eq_kitchen" defaultChecked={van?.eq_kitchen}
                onChange={e => setHasKitchen(e.target.checked)} className="w-4 h-4 accent-blue-500" />
              <span className="text-sm font-medium text-slate-700">Cuisine / Réchaud</span>
            </label>
            {hasKitchen && (
              <div className="ml-7">
                <select name="eq_stove_type" defaultValue={van?.eq_stove_type || ""} className={`${selectCls} max-w-xs`}>
                  <option value="">— Type de plaque —</option>
                  <option value="gas">Gaz</option>
                  <option value="induction">Induction</option>
                  <option value="both">Les deux</option>
                </select>
              </div>
            )}
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input type="checkbox" name="eq_fridge" defaultChecked={van?.eq_fridge}
                onChange={e => setHasFridge(e.target.checked)} className="w-4 h-4 accent-blue-500" />
              <span className="text-sm font-medium text-slate-700">Réfrigérateur</span>
            </label>
            {hasFridge && (
              <div className="ml-7">
                <input type="number" name="eq_fridge_liters" defaultValue={van?.eq_fridge_liters}
                  className={`${inputCls} max-w-[120px]`} placeholder="Litres" />
              </div>
            )}
            <CheckBox name="eq_freezer" label="Congélateur" defaultChecked={van?.eq_freezer} />
          </div>
        </div>

        {/* Énergie */}
        <div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">⚡ Énergie & Confort</p>
          <div className="space-y-3">
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input type="checkbox" name="eq_heating" defaultChecked={van?.eq_heating}
                onChange={e => setHasHeating(e.target.checked)} className="w-4 h-4 accent-blue-500" />
              <span className="text-sm font-medium text-slate-700">Chauffage</span>
            </label>
            {hasHeating && (
              <div className="ml-7">
                <select name="eq_heating_type" defaultValue={van?.eq_heating_type || ""} className={`${selectCls} max-w-xs`}>
                  <option value="">— Type —</option>
                  <option value="webasto">Webasto</option>
                  <option value="truma">Truma</option>
                  <option value="clim">Climatisation</option>
                </select>
              </div>
            )}
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input type="checkbox" name="eq_solar" defaultChecked={van?.eq_solar}
                onChange={e => setHasSolar(e.target.checked)} className="w-4 h-4 accent-blue-500" />
              <span className="text-sm font-medium text-slate-700">Panneau solaire</span>
            </label>
            {hasSolar && (
              <div className="ml-7 flex gap-3">
                <input type="number" name="eq_solar_watts" defaultValue={van?.eq_solar_watts}
                  className={`${inputCls} max-w-[120px]`} placeholder="Watts" />
                <input type="number" name="eq_battery_ah" defaultValue={van?.eq_battery_ah}
                  className={`${inputCls} max-w-[140px]`} placeholder="Batterie (Ah)" />
              </div>
            )}
            <CheckBox name="eq_inverter_220v" label="Convertisseur 220V" defaultChecked={van?.eq_inverter_220v} />
          </div>
        </div>

        {/* Connectivité + Extérieur */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">📶 Connectivité</p>
            <div className="space-y-2.5">
              <CheckBox name="eq_wifi" label="Wi-Fi embarqué" defaultChecked={van?.eq_wifi} />
              <CheckBox name="eq_tv" label="Télévision" defaultChecked={van?.eq_tv} />
              <CheckBox name="eq_usb_ports" label="Ports USB" defaultChecked={van?.eq_usb_ports} />
              <CheckBox name="eq_bluetooth" label="Bluetooth" defaultChecked={van?.eq_bluetooth} />
            </div>
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">🏄 Extérieur & Sport</p>
            <div className="space-y-2.5">
              <CheckBox name="eq_outdoor_awning" label="Auvent / Store" defaultChecked={van?.eq_outdoor_awning} />
              <CheckBox name="eq_outdoor_chairs" label="Chaises extérieures" defaultChecked={van?.eq_outdoor_chairs} />
              <CheckBox name="eq_outdoor_bbq" label="Barbecue" defaultChecked={van?.eq_outdoor_bbq} />
              <CheckBox name="eq_surf_rack" label="Porte-surf" defaultChecked={van?.eq_surf_rack} />
              <CheckBox name="eq_bike_rack" label="Porte-vélos" defaultChecked={van?.eq_bike_rack} />
            </div>
          </div>
        </div>
      </section>

      {/* ── CONTENU ── */}
      <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-5">
        <SectionTitle>Description & Contenu</SectionTitle>
        <Field label="Description" hint="Présentez le van en détail. Séparez les paragraphes par une ligne vide.">
          <textarea name="description" rows={6} defaultValue={extractText(van?.descriptionBlocks)}
            className={`${inputCls} resize-y`} placeholder="Décrivez le van : son histoire, son aménagement, ses points forts…" />
        </Field>
        <Field label="Points forts" hint="Un point par ligne — affiché avec ✓ sur la page">
          <textarea name="highlights" rows={5} defaultValue={van?.highlights?.join("\n")}
            className={`${inputCls} resize-y font-mono text-xs`}
            placeholder={"Cuisine coulissante avec réchaud gaz\nLit fixe 2 personnes + couchage supplémentaire\nAssurance incluse via Yescapa"} />
        </Field>
        <Field label="Règles d'utilisation" hint="Une règle par ligne">
          <textarea name="rules" rows={4} defaultValue={van?.rules?.join("\n")}
            className={`${inputCls} resize-y font-mono text-xs`}
            placeholder={"Interdit de fumer dans le van\nRetour avec le plein de carburant"} />
        </Field>
      </section>

      {/* ── SEO ── */}
      <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-5">
        <SectionTitle>SEO</SectionTitle>
        <Field label="Titre SEO" hint="Affiché dans l'onglet navigateur et Google">
          <input name="seoTitle" defaultValue={van?.seoTitle} className={inputCls}
            placeholder="Location van aménagé Yoni — Renault Trafic | Vanzon Explorer" />
        </Field>
        <Field label="Description SEO" hint="Max 160 caractères">
          <textarea name="seoDescription" rows={2} defaultValue={van?.seoDescription}
            className={`${inputCls} resize-none`} maxLength={160}
            placeholder="Louez Yoni, fourgon aménagé au Pays Basque dès 65€/nuit. Assurance incluse, cuisine, couchage 3 personnes." />
        </Field>
      </section>

      {/* ── ACTIONS ── */}
      <div className="flex items-center justify-between pt-2">
        <div className="flex items-center gap-3">
          <button type="submit" disabled={isPending}
            className="inline-flex items-center gap-2 font-bold text-white text-sm px-6 py-3 rounded-xl transition-all disabled:opacity-60"
            style={{ background: "linear-gradient(135deg, #3B82F6 0%, #0EA5E9 100%)", boxShadow: "0 4px 14px rgba(59,130,246,0.35)" }}>
            {isPending ? "Enregistrement…" : isNew ? "✅ Créer le van" : "💾 Enregistrer les modifications"}
          </button>
          <button type="button" onClick={() => router.back()}
            className="text-sm font-medium text-slate-500 hover:text-slate-700 px-4 py-3 rounded-xl hover:bg-slate-50 transition-colors">
            Annuler
          </button>
        </div>

        {!isNew && (
          <button type="button" onClick={handleDelete} disabled={deleting}
            className={`text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors ${
              confirmDelete
                ? "bg-red-500 text-white hover:bg-red-600"
                : "text-red-500 hover:bg-red-50"
            }`}>
            {deleting ? "Suppression…" : confirmDelete ? "⚠️ Confirmer la suppression" : "Supprimer ce van"}
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
          ❌ {error}
        </div>
      )}
      {success && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm px-4 py-3 rounded-xl">
          ✅ Van enregistré — redirection…
        </div>
      )}
    </form>

    {showMediaPicker && (
      <MediaPickerModal
        refreshTrigger={mediaRefreshTrigger}
        onSelect={(url, alt) => {
          if (showMediaPicker === "main") {
            setMainImageUrl(url);
            if (alt && !mainImageAlt) setMainImageAlt(alt);
          } else {
            setGallery((prev) => [
              ...prev,
              { _key: `media-${Date.now()}`, ref: "", url, alt: alt ?? "" },
            ]);
          }
        }}
        onClose={() => setShowMediaPicker(null)}
      />
    )}
    </>
  );
}
