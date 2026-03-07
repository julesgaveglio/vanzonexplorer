"use client";

import { useState, useMemo } from "react";
import ImageUploader from "./ImageUploader";
import MediaEditor from "./MediaEditor";
import MigrationTool from "./MigrationTool";

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

            {/* Category filter */}
            <select
              value={catFilter}
              onChange={(e) => setCatFilter(e.target.value)}
              className="px-3 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-300 transition-colors"
            >
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>

            {/* SEO filter */}
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

            {/* Upload button */}
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
          </div>

          {/* SEO warning */}
          {missingAltCount > 0 && (
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
          {showUploader && (
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
                return (
                  <div
                    key={item._id}
                    onClick={() => setSelectedItem(item)}
                    className="group relative bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
                  >
                    {/* Image */}
                    <div className="relative aspect-[4/3] bg-slate-100 overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={`${item.url}?w=300&h=225&fit=crop&auto=format&q=75`}
                        alt={item.alt ?? item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                      {/* SEO dot */}
                      <div className={`absolute top-2 right-2 w-2.5 h-2.5 rounded-full border-2 border-white shadow ${ok ? "bg-green-400" : "bg-red-400"}`} title={ok ? "SEO OK" : "Alt text manquant"} />
                      {/* Edit overlay */}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-200 flex items-center justify-center">
                        <span className="opacity-0 group-hover:opacity-100 transition-opacity bg-white text-slate-900 text-xs font-bold px-3 py-1.5 rounded-lg">
                          Editer
                        </span>
                      </div>
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
                    return (
                      <tr key={item._id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-9 rounded-lg bg-slate-100 overflow-hidden flex-shrink-0">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={`${item.url}?w=96&h=72&fit=crop&auto=format`} alt="" className="w-full h-full object-cover" loading="lazy" />
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
                          <button
                            onClick={() => setSelectedItem(item)}
                            className="text-xs font-medium text-slate-500 hover:text-blue-600 bg-slate-50 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-all"
                          >
                            Editer
                          </button>
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
      {selectedItem && (
        <MediaEditor
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
          onDelete={handleDelete}
        />
      )}
    </>
  );
}
