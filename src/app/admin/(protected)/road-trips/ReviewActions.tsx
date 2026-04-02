"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface ReviewActionsProps {
  sanityId: string;
  supabaseId: string;
  regionSlug?: string;
  articleSlug?: string;
}

export function ReviewActions({ sanityId, supabaseId, regionSlug, articleSlug }: ReviewActionsProps) {
  const [loading, setLoading] = useState<"publish" | "regenerate" | null>(null);
  const router = useRouter();

  async function handlePublish() {
    setLoading("publish");
    const res = await fetch("/api/admin/road-trip-articles/publish", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sanityId, supabaseId, regionSlug, articleSlug }),
    });
    const data = await res.json();
    setLoading(null);
    if (data.ok) {
      router.refresh();
      if (data.url) window.open(data.url, "_blank");
    } else alert("Erreur publication : " + data.error);
  }

  async function handleRegenerate() {
    if (!confirm("Régénérer cet article ? Le contenu actuel sera supprimé.")) return;
    setLoading("regenerate");
    await fetch("/api/admin/road-trip-articles/regenerate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sanityId, supabaseId }),
    });
    setLoading(null);
    router.refresh();
  }

  return (
    <div className="flex gap-2">
      <button
        onClick={handlePublish}
        disabled={!!loading}
        className="px-3 py-1.5 rounded-lg bg-green-100 text-green-800 text-xs font-semibold hover:bg-green-200 disabled:opacity-50"
      >
        {loading === "publish" ? "..." : "✓ Publier"}
      </button>
      <button
        onClick={handleRegenerate}
        disabled={!!loading}
        className="px-3 py-1.5 rounded-lg bg-orange-100 text-orange-800 text-xs font-semibold hover:bg-orange-200 disabled:opacity-50"
      >
        {loading === "regenerate" ? "..." : "↻ Régénérer"}
      </button>
    </div>
  );
}
