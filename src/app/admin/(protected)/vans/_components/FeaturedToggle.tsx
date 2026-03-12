"use client";

import { useTransition } from "react";
import { toggleVanFeatured } from "../actions";

export default function FeaturedToggle({ id, featured }: { id: string; featured: boolean }) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      disabled={isPending}
      onClick={() => startTransition(() => toggleVanFeatured(id, featured))}
      title={featured ? "Retirer de la page d'accueil" : "Mettre en avant sur la page d'accueil"}
      className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all disabled:opacity-40 ${
        featured
          ? "bg-amber-50 text-amber-400 hover:bg-amber-100"
          : "bg-slate-50 text-slate-300 hover:bg-slate-100 hover:text-slate-400"
      }`}
    >
      <svg className="w-4 h-4" fill={featured ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
      </svg>
    </button>
  );
}
