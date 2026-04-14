"use client";

import { useState, useRef, useCallback } from "react";

const CATEGORIES = [
  { value: "van-yoni", label: "Van Yoni" },
  { value: "van-xalbat", label: "Van Xalbat" },
  { value: "equipe", label: "Equipe" },
  { value: "pays-basque", label: "Pays Basque" },
  { value: "formation", label: "Formation" },
  { value: "divers", label: "Divers" },
];

interface UploadedImage {
  docId: string;
  url: string;
  webpUrl: string;
  title: string;
}

interface Props {
  onUploaded: (images: UploadedImage[]) => void;
}

export default function ImageUploader({ onUploaded }: Props) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploads, setUploads] = useState<{ name: string; progress: "pending" | "done" | "error"; error?: string }[]>([]);
  const [category, setCategory] = useState("divers");
  const [isUploading, setIsUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(
    async (files: FileList | File[]) => {
      const fileArray = Array.from(files).filter((f) => f.type.startsWith("image/"));
      if (!fileArray.length) return;

      setIsUploading(true);
      setUploads(fileArray.map((f) => ({ name: f.name, progress: "pending" })));

      const results: UploadedImage[] = [];

      for (let i = 0; i < fileArray.length; i++) {
        const file = fileArray[i];
        try {
          // Generate clean title from filename
          const title = file.name
            .replace(/\.[^/.]+$/, "")
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-+|-+$/g, "");

          const formData = new FormData();
          formData.append("file", file);
          formData.append("title", title);
          formData.append("alt", title.replace(/-/g, " "));
          formData.append("category", category);

          const res = await fetch("/api/admin/upload", { method: "POST", body: formData });
          if (!res.ok) {
            const errText = await res.text().catch(() => `HTTP ${res.status}`);
            throw new Error(errText);
          }
          const data = await res.json();

          if (data.success) {
            results.push({ docId: data.docId, url: data.url, webpUrl: data.webpUrl, title });
            setUploads((prev) =>
              prev.map((u, idx) => (idx === i ? { ...u, progress: "done" } : u))
            );
          } else {
            setUploads((prev) =>
              prev.map((u, idx) => (idx === i ? { ...u, progress: "error", error: data.error || "Erreur inconnue" } : u))
            );
          }
        } catch (err) {
          const msg = err instanceof Error ? err.message : "Erreur reseau";
          setUploads((prev) =>
            prev.map((u, idx) => (idx === i ? { ...u, progress: "error", error: msg } : u))
          );
        }
      }

      onUploaded(results);
      setIsUploading(false);
      const hasErrors = uploads.some((u) => u.progress === "error");
      setTimeout(() => setUploads([]), hasErrors ? 8000 : 3000);
    },
    [category, onUploaded]
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles]
  );

  return (
    <div className="space-y-3">
      {/* Category picker */}
      <div className="flex items-center gap-3">
        <label className="text-sm font-semibold text-slate-600 flex-shrink-0">Categorie :</label>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="text-sm px-3 py-1.5 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-300 transition-colors"
        >
          {CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className={`relative flex flex-col items-center justify-center gap-3 p-10 rounded-2xl border-2 border-dashed cursor-pointer transition-all duration-200 ${
          isDragging
            ? "border-blue-400 bg-blue-50"
            : "border-slate-200 bg-slate-50/50 hover:border-blue-300 hover:bg-blue-50/30"
        }`}
      >
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${isDragging ? "bg-blue-100" : "bg-white shadow-sm border border-slate-100"}`}>
          <svg className={`w-6 h-6 ${isDragging ? "text-blue-500" : "text-slate-400"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
            <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
        </div>
        <div className="text-center">
          <p className="font-semibold text-slate-700 text-sm">
            {isDragging ? "Deposer les images ici" : "Glisser-deposer vos images"}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            PNG, JPG, WEBP — convertis en WebP automatiquement · Plusieurs fichiers OK
          </p>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
        />
      </div>

      {/* Progress */}
      {uploads.length > 0 && (
        <div className="space-y-2">
          {uploads.map((u, i) => (
            <div key={i} className="flex items-center gap-3 bg-white rounded-xl border border-slate-100 px-4 py-2.5">
              <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                u.progress === "done" ? "bg-green-400" :
                u.progress === "error" ? "bg-red-400" :
                "bg-blue-400 animate-pulse"
              }`} />
              <span className="text-sm text-slate-600 truncate flex-1">{u.name}</span>
              <span className={`text-xs font-medium flex-shrink-0 ${
                u.progress === "done" ? "text-green-500" :
                u.progress === "error" ? "text-red-500" :
                "text-blue-400"
              }`}>
                {u.progress === "done" ? "Upload !" : u.progress === "error" ? (u.error || "Erreur") : "En cours..."}
              </span>
            </div>
          ))}
          {isUploading && (
            <p className="text-xs text-center text-slate-400 animate-pulse">
              Conversion WebP + upload vers Sanity CDN en cours...
            </p>
          )}
        </div>
      )}
    </div>
  );
}
