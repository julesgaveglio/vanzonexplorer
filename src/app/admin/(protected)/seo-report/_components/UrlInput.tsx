// src/app/admin/(protected)/seo-report/_components/UrlInput.tsx
"use client";
import { useState } from "react";

interface UrlInputProps {
  onGenerate: (url: string, label: string) => void;
  loading: boolean;
}

export default function UrlInput({ onGenerate, loading }: UrlInputProps) {
  const [url, setUrl] = useState("");
  const [label, setLabel] = useState("");

  const isValid = (() => {
    try {
      const u = new URL(url);
      return u.protocol === "https:";
    } catch {
      return false;
    }
  })();

  return (
    <div className="space-y-3">
      <div className="flex gap-3">
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://exemple.com"
          disabled={loading}
          className="flex-1 px-4 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
          onKeyDown={(e) => e.key === "Enter" && isValid && !loading && onGenerate(url, label)}
        />
        <button
          onClick={() => onGenerate(url, label)}
          disabled={!isValid || loading}
          className="px-5 py-2.5 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? "Analyse en cours…" : "Générer le rapport"}
        </button>
      </div>
      <input
        type="text"
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        placeholder="Nom du client (optionnel — ex: Diem Conseil)"
        disabled={loading}
        className="w-full px-4 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 text-slate-600"
      />
    </div>
  );
}
