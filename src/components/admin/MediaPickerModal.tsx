"use client";

import { useState, useEffect, useCallback } from "react";
import { X, Search, ImageIcon, Loader2 } from "lucide-react";

type MediaItem = {
  _id: string;
  title: string;
  category: string;
  url: string;
  alt?: string;
  width?: number;
  height?: number;
};

interface MediaPickerModalProps {
  onSelect: (url: string, alt: string) => void;
  onClose: () => void;
}

const CATEGORIES = [
  { value: "all", label: "Toutes" },
  { value: "van-yoni", label: "Van Yoni" },
  { value: "van-xalbat", label: "Van Xalbat" },
  { value: "equipe", label: "Équipe" },
  { value: "pays-basque", label: "Pays Basque" },
  { value: "formation", label: "Formation" },
  { value: "divers", label: "Divers" },
];

export default function MediaPickerModal({ onSelect, onClose }: MediaPickerModalProps) {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");

  useEffect(() => {
    fetch("/api/admin/media")
      .then((r) => r.json())
      .then((data) => { setItems(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const filtered = items.filter((item) => {
    const matchCat = category === "all" || item.category === category;
    const matchSearch = !search || item.title?.toLowerCase().includes(search.toLowerCase()) || item.alt?.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const handleSelect = useCallback((item: MediaItem) => {
    onSelect(item.url, item.alt ?? item.title ?? "");
    onClose();
  }, [onSelect, onClose]);

  // Close on backdrop click
  const handleBackdrop = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={handleBackdrop}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-blue-500" />
            <h2 className="font-bold text-slate-900">Médiathèque</h2>
            {!loading && <span className="text-xs text-slate-400 ml-1">({filtered.length} images)</span>}
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-500 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Filters */}
        <div className="flex gap-3 px-6 py-3 border-b border-slate-100 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-blue-400"
              autoFocus
            />
          </div>
          <div className="flex gap-1 flex-wrap">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                onClick={() => setCategory(cat.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  category === cat.value
                    ? "bg-blue-500 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-slate-400">
              <ImageIcon className="w-10 h-10 mb-2 opacity-40" />
              <p className="text-sm">Aucune image trouvée</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
              {filtered.map((item) => (
                <button
                  key={item._id}
                  type="button"
                  onClick={() => handleSelect(item)}
                  className="group relative aspect-square rounded-xl overflow-hidden border-2 border-transparent hover:border-blue-400 focus:outline-none focus:border-blue-500 transition-all"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`${item.url}&w=200&h=200&fit=crop`}
                    alt={item.alt ?? item.title}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-end">
                    <p className="w-full px-2 py-1.5 text-white text-xs font-medium truncate opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-t from-black/60 to-transparent">
                      {item.title}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 text-xs text-slate-400 text-center">
          Toutes les images sont en WebP optimisé depuis Sanity
        </div>
      </div>
    </div>
  );
}
