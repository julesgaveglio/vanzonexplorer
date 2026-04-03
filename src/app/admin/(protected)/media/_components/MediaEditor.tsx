"use client";

import { useState, useTransition, useRef, useCallback } from "react";
import HotspotCropEditor from "./HotspotCropEditor";
import { updateMediaAsset, deleteMediaAsset } from "../actions";

type MediaItem = {
  _id: string;
  title: string;
  category: string;
  tags?: string[];
  usedIn?: string;
  url: string;
  alt?: string;
  hotspot?: { x: number; y: number; width: number; height: number };
  crop?: { top: number; right: number; bottom: number; left: number };
  width?: number;
  height?: number;
};

interface Props {
  item: MediaItem;
  onClose: () => void;
  onDelete: () => void;
}

const CATEGORIES = [
  { value: "van-yoni", label: "Van Yoni" },
  { value: "van-xalbat", label: "Van Xalbat" },
  { value: "equipe", label: "Equipe" },
  { value: "pays-basque", label: "Pays Basque" },
  { value: "formation", label: "Formation" },
  { value: "divers", label: "Divers" },
];

const URL_FORMATS = [
  { label: "WebP auto (max qual)", suffix: "?auto=format&fit=max&q=82", desc: "Usage general" },
  { label: "Card van (600×450)", suffix: "?w=600&h=450&fit=crop&auto=format&q=80", desc: "VanCard, grilles" },
  { label: "Hero (1400px)", suffix: "?w=1400&auto=format&q=82", desc: "Heros full-width" },
  { label: "Open Graph (1200×630)", suffix: "?w=1200&h=630&fit=crop&auto=format&q=85", desc: "Reseaux sociaux" },
  { label: "Thumb (200×200)", suffix: "?w=200&h=200&fit=crop&auto=format", desc: "Miniatures" },
  { label: "Portrait (400×400)", suffix: "?w=400&h=400&fit=crop&auto=format&q=85", desc: "Temoignages, equipe" },
];

function seoScore(alt?: string, title?: string, tags?: string[]) {
  if (!alt || alt.length < 5) return "red";
  if (!title || title.length < 3) return "yellow";
  if ((tags?.length ?? 0) === 0) return "yellow";
  return "green";
}

const scoreConfig = {
  green: { label: "SEO optimise", color: "text-green-600", bg: "bg-green-50", dot: "bg-green-500" },
  yellow: { label: "SEO partiel", color: "text-amber-600", bg: "bg-amber-50", dot: "bg-amber-400" },
  red: { label: "Alt text manquant !", color: "text-red-600", bg: "bg-red-50", dot: "bg-red-500" },
};

export default function MediaEditor({ item, onClose, onDelete }: Props) {
  const [title, setTitle] = useState(item.title);
  const [alt, setAlt] = useState(item.alt ?? "");
  const [category, setCategory] = useState(item.category);
  const [tagsInput, setTagsInput] = useState((item.tags ?? []).join(", "));
  const [usedIn, setUsedIn] = useState(item.usedIn ?? "");
  const [hotspot, setHotspot] = useState(item.hotspot ?? { x: 0.5, y: 0.5, width: 0.5, height: 0.5 });
  const [crop, setCrop] = useState(item.crop ?? { top: 0, right: 0, bottom: 0, left: 0 });
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);

  // Replace image state
  const [replaceMode, setReplaceMode] = useState(false);
  const [replacePreview, setReplacePreview] = useState<string | null>(null);
  const [replaceFile, setReplaceFile] = useState<File | null>(null);
  const [isReplacing, setIsReplacing] = useState(false);
  const [replaceDone, setReplaceDone] = useState(false);
  const replaceInputRef = useRef<HTMLInputElement>(null);

  const handleReplaceSelect = useCallback((file: File) => {
    setReplaceFile(file);
    const objectUrl = URL.createObjectURL(file);
    setReplacePreview(objectUrl);
  }, []);

  const handleReplaceConfirm = useCallback(async () => {
    if (!replaceFile) return;
    setIsReplacing(true);

    const formData = new FormData();
    formData.append("file", replaceFile);
    formData.append("docId", item._id);

    try {
      const res = await fetch("/api/admin/replace-asset", { method: "POST", body: formData });
      const data = await res.json();

      if (data.success) {
        // Update local state so the editor reflects the new image immediately
        setCurrentUrl(data.url);
        setHotspot({ x: 0.5, y: 0.5, width: 0.5, height: 0.5 });
        setCrop({ top: 0, right: 0, bottom: 0, left: 0 });
        setReplaceDone(true);
        setReplaceMode(false);
        setReplacePreview(null);
        setReplaceFile(null);
      }
    } finally {
      setIsReplacing(false);
    }
  }, [replaceFile, item._id]);

  // Current image URL (can change after replace)
  const [currentUrl, setCurrentUrl] = useState(item.url);

  async function handleAnalyze() {
    setIsAnalyzing(true);
    setAnalyzeError(null);
    try {
      const res = await fetch("/api/admin/media/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: currentUrl }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error ?? "Erreur inconnue");
      if (data.alt) setAlt(data.alt);
      if (data.title) setTitle(data.title);
      if (data.tags?.length) setTagsInput(data.tags.join(", "));
    } catch (err) {
      setAnalyzeError(err instanceof Error ? err.message : "Erreur analyse IA");
    } finally {
      setIsAnalyzing(false);
    }
  }

  const score = seoScore(alt, title, item.tags);
  const scoreStyle = scoreConfig[score];

  function copyUrl(url: string, key: string) {
    navigator.clipboard.writeText(url);
    setCopiedUrl(key);
    setTimeout(() => setCopiedUrl(null), 2000);
  }

  function handleSave() {
    const tags = tagsInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    startTransition(async () => {
      await updateMediaAsset(item._id, { title, alt, category, tags, usedIn, hotspot, crop });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    });
  }

  function handleDelete() {
    startTransition(async () => {
      await deleteMediaAsset(item._id);
      onDelete();
    });
  }

  return (
    <div className="fixed inset-0 z-[100] flex">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className="relative ml-auto w-full max-w-5xl h-full bg-white shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 flex-shrink-0">
          <div className="flex items-center gap-3">
            <h2 className="font-bold text-slate-900 truncate max-w-xs">{title || "Editeur image"}</h2>
            <span className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg ${scoreStyle.bg} ${scoreStyle.color}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${scoreStyle.dot}`} />
              {scoreStyle.label}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {saved && <span className="text-green-500 text-sm font-semibold animate-fade-in">Sauvegarde !</span>}
            <button
              onClick={handleSave}
              disabled={isPending}
              className="inline-flex items-center gap-2 font-semibold text-white text-sm px-4 py-2 rounded-xl disabled:opacity-50 transition-all"
              style={{ background: "linear-gradient(135deg, #3B82F6 0%, #0EA5E9 100%)" }}
            >
              {isPending ? "..." : "Sauvegarder"}
            </button>
            <button onClick={onClose} className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 hover:bg-slate-200 transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="grid lg:grid-cols-2 gap-0 h-full">

            {/* Colonne gauche — Editeur visuel */}
            <div className="p-6 border-r border-slate-100 bg-slate-50/50">
              <HotspotCropEditor
                imageUrl={currentUrl}
                hotspot={hotspot}
                crop={crop}
                onChange={(hs, cr) => { setHotspot(hs); setCrop(cr); }}
              />

              {/* Dimensions */}
              {(item.width || item.height) && (
                <div className="mt-4 flex items-center gap-2 text-xs text-slate-400">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" /><path strokeLinecap="round" d="M3 9h18M9 21V9" /></svg>
                  {item.width} × {item.height} px
                </div>
              )}

              {/* Replace image */}
              <div className="mt-5">
                {!replaceMode ? (
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setReplaceMode(true)}
                      className="flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-blue-600 px-3 py-2 rounded-xl border border-slate-200 hover:border-blue-200 hover:bg-blue-50 transition-all"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                      </svg>
                      Remplacer l&apos;image
                    </button>
                    {replaceDone && (
                      <span className="flex items-center gap-1.5 text-xs font-semibold text-green-600">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                        Image remplacee en temps reel !
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-blue-700 uppercase tracking-wider">Remplacer l&apos;image</p>
                      <button onClick={() => { setReplaceMode(false); setReplacePreview(null); setReplaceFile(null); }} className="text-xs text-slate-400 hover:text-slate-600 transition-colors">Annuler</button>
                    </div>

                    {/* Drop zone */}
                    <div
                      onClick={() => replaceInputRef.current?.click()}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        const f = e.dataTransfer.files[0];
                        if (f && f.type.startsWith("image/")) handleReplaceSelect(f);
                      }}
                      className="relative border-2 border-dashed border-blue-300 rounded-xl p-5 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-blue-100/50 transition-colors"
                    >
                      <input
                        ref={replaceInputRef}
                        type="file"
                        accept="image/*"
                        className="sr-only"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) handleReplaceSelect(f);
                        }}
                      />
                      <svg className="w-6 h-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                      </svg>
                      <p className="text-xs font-semibold text-blue-600">{replaceFile ? replaceFile.name : "Cliquer ou glisser une image"}</p>
                      <p className="text-xs text-blue-400">JPG, PNG, WebP, HEIC</p>
                    </div>

                    {/* Before / After preview */}
                    {replacePreview && (
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <p className="text-xs font-semibold text-slate-500 text-center">Avant</p>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={currentUrl} alt="Avant" className="w-full aspect-video object-cover rounded-lg border border-slate-200" />
                        </div>
                        <div className="space-y-1.5">
                          <p className="text-xs font-semibold text-blue-600 text-center">Apres</p>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={replacePreview} alt="Apres" className="w-full aspect-video object-cover rounded-lg border-2 border-blue-400" />
                        </div>
                      </div>
                    )}

                    {/* Confirm */}
                    {replaceFile && (
                      <button
                        onClick={handleReplaceConfirm}
                        disabled={isReplacing}
                        className="w-full flex items-center justify-center gap-2 text-sm font-semibold text-white py-2.5 rounded-xl disabled:opacity-60 transition-all"
                        style={{ background: isReplacing ? "#94a3b8" : "linear-gradient(135deg, #3B82F6 0%, #0EA5E9 100%)" }}
                      >
                        {isReplacing ? (
                          <>
                            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" /></svg>
                            Remplacement en cours...
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                            Confirmer le remplacement
                          </>
                        )}
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* URLs formats */}
              <div className="mt-5">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">URLs optimisees (WebP)</p>
                <div className="space-y-2">
                  {URL_FORMATS.map((fmt) => {
                    const url = `${item.url}${fmt.suffix}`;
                    const key = fmt.label;
                    return (
                      <div key={key} className="flex items-center gap-2 group">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-slate-700">{fmt.label}</p>
                          <p className="text-xs text-slate-400 truncate font-mono">{url.length > 60 ? url.substring(0, 60) + "..." : url}</p>
                        </div>
                        <button
                          onClick={() => copyUrl(url, key)}
                          className={`flex-shrink-0 text-xs font-medium px-3 py-1.5 rounded-lg transition-all ${
                            copiedUrl === key
                              ? "bg-green-50 text-green-600"
                              : "bg-slate-100 text-slate-500 hover:bg-blue-50 hover:text-blue-600"
                          }`}
                        >
                          {copiedUrl === key ? "Copie !" : "Copier"}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Colonne droite — Metadonnees SEO */}
            <div className="p-6">
              <div className="flex items-center justify-between mb-5">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Metadonnees SEO</p>
                <button
                  onClick={handleAnalyze}
                  disabled={isAnalyzing}
                  className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-2 rounded-xl border border-violet-200 text-violet-700 bg-violet-50 hover:bg-violet-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {isAnalyzing ? (
                    <>
                      <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                      </svg>
                      Analyse en cours...
                    </>
                  ) : (
                    <>
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                      </svg>
                      Analyser avec l&apos;IA
                    </>
                  )}
                </button>
              </div>
              {analyzeError && (
                <p className="text-xs text-red-500 mb-3 bg-red-50 px-3 py-2 rounded-lg">{analyzeError}</p>
              )}

              <div className="space-y-5">
                {/* Title */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    Nom du fichier <span className="text-red-400">*</span>
                  </label>
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="ex: van-yoni-biarritz-plage"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400 transition-colors"
                  />
                  <p className="text-xs text-slate-400 mt-1">Utilise des tirets, pas d&apos;espaces ni caracteres speciaux</p>
                </div>

                {/* Alt text */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    Texte alternatif (alt) <span className="text-red-400">*</span>
                  </label>
                  <input
                    value={alt}
                    onChange={(e) => setAlt(e.target.value)}
                    placeholder="ex: Van Yoni de Vanzon Explorer stationne face a l'ocean a Biarritz"
                    className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 transition-colors ${
                      alt.length < 5
                        ? "border-red-200 focus:ring-red-200 focus:border-red-400"
                        : "border-slate-200 focus:ring-blue-300 focus:border-blue-400"
                    }`}
                  />
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-xs text-slate-400">Decrit l&apos;image pour Google et les lecteurs d&apos;ecran</p>
                    <span className={`text-xs font-medium ${alt.length < 10 ? "text-red-400" : alt.length < 50 ? "text-amber-500" : "text-green-500"}`}>
                      {alt.length} car.
                    </span>
                  </div>
                </div>

                {/* Category */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Categorie</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400 transition-colors bg-white"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </div>

                {/* Tags */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Tags SEO</label>
                  <input
                    value={tagsInput}
                    onChange={(e) => setTagsInput(e.target.value)}
                    placeholder="van, biarritz, surf, pays-basque"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400 transition-colors"
                  />
                  <p className="text-xs text-slate-400 mt-1">Separes par des virgules</p>
                  {tagsInput && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {tagsInput.split(",").filter((t) => t.trim()).map((tag) => (
                        <span key={tag} className="badge-glass text-xs">{tag.trim()}</span>
                      ))}
                    </div>
                  )}
                </div>

                {/* UsedIn */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Utilisation</label>
                  <input
                    value={usedIn}
                    onChange={(e) => setUsedIn(e.target.value)}
                    placeholder="ex: Hero accueil, Card van Yoni"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400 transition-colors"
                  />
                </div>

                {/* Guide SEO */}
                <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                  <p className="text-xs font-bold text-blue-700 mb-2">Guide alt text SEO</p>
                  <ul className="text-xs text-blue-600 space-y-1">
                    <li>• Inclure le nom du van (Yoni, Xalbat) si pertinent</li>
                    <li>• Mentionner la location (Pays Basque, Biarritz…)</li>
                    <li>• Inclure &quot;Vanzon Explorer&quot; pour le branding</li>
                    <li>• 50-150 caracteres ideal</li>
                    <li>• Pas de &quot;image de&quot; ou &quot;photo de&quot;</li>
                  </ul>
                </div>
              </div>

              {/* Delete */}
              <div className="mt-8 pt-6 border-t border-slate-100">
                {!confirmDelete ? (
                  <button
                    onClick={() => setConfirmDelete(true)}
                    className="text-xs text-red-400 hover:text-red-600 transition-colors"
                  >
                    Supprimer cette image de la mediatheque
                  </button>
                ) : (
                  <div className="flex items-center gap-3">
                    <p className="text-xs text-red-600 font-semibold">Confirmer la suppression ?</p>
                    <button
                      onClick={handleDelete}
                      disabled={isPending}
                      className="text-xs font-semibold bg-red-50 text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50"
                    >
                      Supprimer
                    </button>
                    <button
                      onClick={() => setConfirmDelete(false)}
                      className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      Annuler
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
