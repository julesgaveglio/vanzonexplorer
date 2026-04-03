"use client";

import { useState, useMemo, useTransition } from "react";
import ImageUploader from "./ImageUploader";
import MediaEditor from "./MediaEditor";
import MigrationTool from "./MigrationTool";
import { bulkDeleteMediaAssets } from "../actions";

type MediaItem = {
  _id: string;
  title: string;
  category: string;
  tags?: string[];
  usedIn?: string;
  url: string;
  webpUrl: string;
  alt?: string;
  hotspot?: { x: number; y: number; width: number; height: number };
  crop?: { top: number; right: number; bottom: number; left: number };
  width?: number;
  height?: number;
};

const CATEGORIES = [
  { value: "all", label: "Toutes" },
  { value: "van-yoni", label: "Van Yoni" },
  { value: "van-xalbat", label: "Van Xalbat" },
  { value: "equipe", label: "Equipe" },
  { value: "pays-basque", label: "Pays Basque" },
  { value: "formation", label: "Formation" },
  { value: "divers", label: "Divers" },
];

const SEO_FILTERS = [
  { value: "all", label: "Toutes" },
  { value: "ok", label: "SEO OK" },
  { value: "missing-alt", label: "Alt manquant" },
];

function seoOk(item: MediaItem) {
  return item.alt && item.alt.length >= 10 && item.title && item.title.length >= 3;
}

interface Props {
  initialItems: MediaItem[];
}

export default function MediaLibrary({ initialItems }: Props) {
  const [tab, setTab] = useState<"library" | "migration">("library");
  const [items, setItems] = useState<MediaItem[]>(initialItems);
  const [selectedItem, setSelectedItem] = useState<MediaItem | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [catFilter, setCatFilter] = useState("all");
  const [seoFilter, setSeoFilter] = useState("all");
  const [showUploader, setShowUploader] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Multi-select
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false);
  const [isBulkDeleting, startBulkDelete] = useTransition();

  const filtered = useMemo(() => {
    return items.filter((item) => {
      const matchSearch =
        !searchQuery ||
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.alt?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.tags?.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchCat = catFilter === "all" || item.category === catFilter;
      const matchSeo =
        seoFilter === "all" ||
        (seoFilter === "ok" && seoOk(item)) ||
        (seoFilter === "missing-alt" && !seoOk(item));
      return matchSearch && matchCat && matchSeo;
    });
  }, [items, searchQuery, catFilter, seoFilter]);

  const missingAltCount = items.filter((i) => !seoOk(i)).length;

  function handleUploaded(newImages: { docId: string; url: string; webpUrl: string; title: string }[]) {
    const newItems: MediaItem[] = newImages.map((img) => ({
      _id: img.docId,
      title: img.title,
      category: "divers",
      url: img.url,
      webpUrl: img.webpUrl,
      alt: img.title.replace(/-/g, " "),
    }));
    setItems((prev) => [...newItems, ...prev]);
    setShowUploader(false);
  }

  function handleDelete() {
    if (!selectedItem) return;
    setItems((prev) => prev.filter((i) => i._id !== selectedItem._id));
    setSelectedItem(null);
  }

  // Selection helpers
  function toggleSelect(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map((i) => i._id)));
    }
  }

  function exitSelectMode() {
    setSelectMode(false);
    setSelectedIds(new Set());
    setConfirmBulkDelete(false);
  }

  function handleBulkDelete() {
    if (!selectedIds.size) return;
    const ids = Array.from(selectedIds);
    startBulkDelete(async () => {
      await bulkDeleteMediaAssets(ids);
      setItems((prev) => prev.filter((i) => !selectedIds.has(i._id)));
      exitSelectMode();
    });
  }

  const allFilteredSelected = filtered.length > 0 && filtered.every((i) => selectedIds.has(i._id));

  return (
    <>
      {/* Tab navigation */}
      <div className="flex items-center gap-1 p-1 bg-white rounded-xl border border-slate-100 shadow-sm w-fit mb-6">
        {[
          { key: "library", label: "Mediatheque", count: items.length },
          { key: "migration", label: "Migration iili.io", count: null, badge: true },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key as "library" | "migration")}
            className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
              tab === t.key ? "bg-slate-900 text-white shadow-sm" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {t.label}
            {t.count !== null && (
              <span className={`text-xs px-2 py-0.5 rounded-full ${tab === t.key ? "bg-white/20 text-white" : "bg-slate-100 text-slate-400"}`}>
                {t.count}
              </span>
            )}
            {t.badge && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-600">
                Nouveau
              </span>
            )}
          </button>
        ))}
      </div>

      {tab === "library" ? (
        <div className="space-y-5">
          {/* Toolbar */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher par titre, alt, tag..."
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-300 transition-colors"
              />
            </div>

            {/* Filters */}
            <select
              value={catFilter}
              onChange={(e) => setCatFilter(e.target.value)}
              className="px-3 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-300 transition-colors"
            >
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>

            <select
              value={seoFilter}
              onChange={(e) => setSeoFilter(e.target.value)}
              className="px-3 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-300 transition-colors"
            >
              {SEO_FILTERS.map((f) => (
                <option key={f.value} value={f.value}>{f.label}</option>
              ))}
            </select>

            {/* View toggle */}
            <div className="flex gap-1 bg-white border border-slate-200 rounded-xl p-1">
              {(["grid", "list"] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => setViewMode(v)}
                  className={`p-1.5 rounded-lg transition-all ${viewMode === v ? "bg-slate-900 text-white" : "text-slate-400 hover:text-slate-600"}`}
                >
                  {v === "grid" ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /></svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" /></svg>
                  )}
                </button>
              ))}
            </div>

            {/* Select mode toggle */}
            {!selectMode ? (
              <button
                onClick={() => setSelectMode(true)}
                className="inline-flex items-center gap-2 font-semibold text-slate-600 text-sm px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-all"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Selectionner
              </button>
            ) : (
              <button
                onClick={exitSelectMode}
                className="inline-flex items-center gap-2 font-semibold text-slate-500 text-sm px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-all"
              >
                Annuler
              </button>
            )}

            {/* Upload */}
            {!selectMode && (
              <button
                onClick={() => setShowUploader((v) => !v)}
                className="inline-flex items-center gap-2 font-semibold text-white text-sm px-5 py-2.5 rounded-xl transition-all"
                style={{ background: "linear-gradient(135deg, #3B82F6 0%, #0EA5E9 100%)" }}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                Upload
              </button>
            )}
          </div>

          {/* Selection mode bar */}
          {selectMode && (
            <div className="flex items-center gap-4 bg-slate-900 text-white px-5 py-3 rounded-xl">
              <button
                onClick={toggleSelectAll}
                className="text-sm font-semibold hover:text-blue-300 transition-colors"
              >
                {allFilteredSelected ? "Tout désélectionner" : `Tout sélectionner (${filtered.length})`}
              </button>
              <span className="text-slate-400 text-sm">
                {selectedIds.size} image{selectedIds.size > 1 ? "s" : ""} sélectionnée{selectedIds.size > 1 ? "s" : ""}
              </span>
              <div className="ml-auto flex items-center gap-3">
                {!confirmBulkDelete ? (
                  <button
                    onClick={() => setConfirmBulkDelete(true)}
                    disabled={selectedIds.size === 0}
                    className="inline-flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Supprimer ({selectedIds.size})
                  </button>
                ) : (
                  <div className="flex items-center gap-3">
                    <p className="text-sm text-red-300 font-semibold">
                      Supprimer {selectedIds.size} image{selectedIds.size > 1 ? "s" : ""} de Sanity ?
                    </p>
                    <button
                      onClick={handleBulkDelete}
                      disabled={isBulkDeleting}
                      className="text-sm font-bold px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 disabled:opacity-60 transition-all"
                    >
                      {isBulkDeleting ? "Suppression..." : "Confirmer"}
                    </button>
                    <button
                      onClick={() => setConfirmBulkDelete(false)}
                      className="text-sm text-slate-400 hover:text-white transition-colors"
                    >
                      Annuler
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* SEO warning */}
          {missingAltCount > 0 && !selectMode && (
            <div
              className="flex items-center gap-3 bg-red-50 border border-red-100 rounded-xl px-4 py-3 cursor-pointer hover:bg-red-100/50 transition-colors"
              onClick={() => setSeoFilter("missing-alt")}
            >
              <span className="text-red-500 text-lg">⚠️</span>
              <p className="text-sm text-red-700 font-medium">
                {missingAltCount} image{missingAltCount > 1 ? "s" : ""} sans alt text — impact SEO negatif.{" "}
                <span className="underline">Voir et corriger</span>
              </p>
            </div>
          )}

          {/* Uploader */}
          {showUploader && !selectMode && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              <ImageUploader onUploaded={handleUploaded} />
            </div>
          )}

          {/* Stats */}
          <p className="text-sm text-slate-400">
            {filtered.length} image{filtered.length > 1 ? "s" : ""}
            {filtered.length !== items.length && ` sur ${items.length} total`}
          </p>

          {/* Grid view */}
          {viewMode === "grid" && (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3">
              {filtered.map((item) => {
                const ok = seoOk(item);
                const isSelected = selectedIds.has(item._id);
                return (
                  <div
                    key={item._id}
                    onClick={(e) => {
                      if (selectMode) {
                        toggleSelect(item._id, e);
                      } else {
                        setSelectedItem(item);
                      }
                    }}
                    className={`group relative bg-white rounded-2xl border shadow-sm overflow-hidden cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 ${
                      isSelected ? "border-blue-400 ring-2 ring-blue-300" : "border-slate-100"
                    }`}
                  >
                    {/* Image */}
                    <div className="relative aspect-[4/3] bg-slate-100 overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={`${item.url}?w=400&auto=format&fit=max&q=75`}
                        alt={item.alt ?? item.title}
                        className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />

                      {/* Checkbox (select mode) */}
                      {selectMode && (
                        <div className={`absolute top-2 left-2 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                          isSelected ? "bg-blue-500 border-blue-500" : "bg-white/80 border-slate-300"
                        }`}>
                          {isSelected && (
                            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                      )}

                      {/* SEO dot */}
                      {!selectMode && (
                        <div className={`absolute top-2 right-2 w-2.5 h-2.5 rounded-full border-2 border-white shadow ${ok ? "bg-green-400" : "bg-red-400"}`} title={ok ? "SEO OK" : "Alt text manquant"} />
                      )}

                      {/* Edit overlay */}
                      {!selectMode && (
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-200 flex items-center justify-center">
                          <span className="opacity-0 group-hover:opacity-100 transition-opacity bg-white text-slate-900 text-xs font-bold px-3 py-1.5 rounded-lg">
                            Editer
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Meta */}
                    <div className="px-3 py-2.5">
                      <p className="text-xs font-semibold text-slate-700 truncate">{item.title}</p>
                      {item.alt ? (
                        <p className="text-xs text-slate-400 truncate mt-0.5">{item.alt}</p>
                      ) : (
                        <p className="text-xs text-red-400 mt-0.5">Alt manquant !</p>
                      )}
                    </div>
                  </div>
                );
              })}

              {filtered.length === 0 && (
                <div className="col-span-full py-16 text-center">
                  <p className="text-slate-400 text-sm">Aucune image ne correspond aux filtres.</p>
                </div>
              )}
            </div>
          )}

          {/* List view */}
          {viewMode === "list" && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-50">
                    {selectMode && <th className="px-4 py-3 w-10" />}
                    <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-5 py-3">Image</th>
                    <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-4 py-3">Alt text</th>
                    <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-4 py-3">Categorie</th>
                    <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-4 py-3">SEO</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filtered.map((item) => {
                    const ok = seoOk(item);
                    const isSelected = selectedIds.has(item._id);
                    return (
                      <tr
                        key={item._id}
                        className={`hover:bg-slate-50/60 transition-colors cursor-pointer ${isSelected ? "bg-blue-50" : ""}`}
                        onClick={(e) => selectMode ? toggleSelect(item._id, e) : setSelectedItem(item)}
                      >
                        {selectMode && (
                          <td className="px-4 py-3">
                            <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                              isSelected ? "bg-blue-500 border-blue-500" : "border-slate-300"
                            }`}>
                              {isSelected && (
                                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                            </div>
                          </td>
                        )}
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-9 rounded-lg bg-slate-100 overflow-hidden flex-shrink-0">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={`${item.url}?w=96&auto=format&fit=max`} alt="" className="w-full h-full object-contain" loading="lazy" />
                            </div>
                            <p className="text-sm font-semibold text-slate-700 truncate max-w-[150px]">{item.title}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <p className={`text-xs truncate max-w-[200px] ${item.alt ? "text-slate-500" : "text-red-400 font-medium"}`}>
                            {item.alt || "Manquant"}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs text-slate-500 capitalize">{item.category?.replace("-", " ")}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`w-2 h-2 rounded-full inline-block ${ok ? "bg-green-400" : "bg-red-400"}`} />
                        </td>
                        <td className="px-4 py-3">
                          {!selectMode && (
                            <button
                              onClick={(e) => { e.stopPropagation(); setSelectedItem(item); }}
                              className="text-xs font-medium text-slate-500 hover:text-blue-600 bg-slate-50 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-all"
                            >
                              Editer
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {filtered.length === 0 && (
                <p className="px-5 py-10 text-center text-slate-400 text-sm">Aucune image ne correspond aux filtres.</p>
              )}
            </div>
          )}
        </div>
      ) : (
        <MigrationTool />
      )}

      {/* Editor modal */}
      {selectedItem && !selectMode && (
        <MediaEditor
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
          onDelete={handleDelete}
        />
      )}
    </>
  );
}
