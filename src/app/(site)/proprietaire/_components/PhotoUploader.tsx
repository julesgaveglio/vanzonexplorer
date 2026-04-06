"use client";

import { useState, useCallback, useRef } from "react";

interface Props {
  photos: string[];
  onPhotosChange: (photos: string[]) => void;
  maxPhotos?: number;
}

export default function PhotoUploader({ photos, onPhotosChange, maxPhotos = 15 }: Props) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const uploadFile = useCallback(async (file: File): Promise<string | null> => {
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/marketplace/upload-photo", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || "Erreur upload");
      }

      const json = await res.json();
      return json.url;
    } catch (err) {
      console.error("Upload error:", err);
      return null;
    }
  }, []);

  const handleFiles = useCallback(async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const remaining = maxPhotos - photos.length;

    if (remaining <= 0) {
      setError(`Maximum ${maxPhotos} photos atteint.`);
      return;
    }

    const toUpload = fileArray.slice(0, remaining);
    setUploading(true);
    setError("");

    const results = await Promise.all(toUpload.map(uploadFile));
    const successUrls = results.filter((url): url is string => url !== null);

    if (successUrls.length < toUpload.length) {
      setError(`${toUpload.length - successUrls.length} photo(s) n'ont pas pu être envoyées.`);
    }

    onPhotosChange([...photos, ...successUrls]);
    setUploading(false);
  }, [photos, onPhotosChange, maxPhotos, uploadFile]);

  const removePhoto = (index: number) => {
    onPhotosChange(photos.filter((_, i) => i !== index));
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  }, [handleFiles]);

  return (
    <div className="space-y-4">
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
          dragOver
            ? "border-blue-400 bg-blue-50"
            : "border-slate-200 hover:border-slate-300 bg-white/50"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          className="hidden"
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
        />
        <div className="text-3xl mb-2">📸</div>
        <p className="text-sm font-medium text-slate-700">
          {uploading ? "Upload en cours..." : "Glissez vos photos ici ou cliquez pour parcourir"}
        </p>
        <p className="text-xs text-slate-400 mt-1">
          JPG, PNG ou WebP — max 5 Mo par photo — {photos.length}/{maxPhotos} photos
        </p>
      </div>

      {error && <p className="text-red-500 text-sm">{error}</p>}

      {photos.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
          {photos.map((url, i) => (
            <div key={url} className="relative group aspect-[4/3] rounded-xl overflow-hidden bg-slate-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                alt={`Photo ${i + 1}`}
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() => removePhoto(i)}
                className="absolute top-1.5 right-1.5 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
              >
                ×
              </button>
              {i === 0 && (
                <span className="absolute bottom-1.5 left-1.5 bg-blue-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                  Principale
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {uploading && (
        <div className="flex items-center gap-2 text-sm text-blue-600">
          <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          Upload en cours...
        </div>
      )}
    </div>
  );
}
