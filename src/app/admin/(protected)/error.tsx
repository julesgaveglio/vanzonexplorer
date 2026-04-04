"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center bg-[#0f1117]">
      <div className="max-w-md w-full p-8 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm">
        <div className="mb-4 text-red-400 text-4xl">⚠</div>
        <h2 className="text-2xl font-semibold text-white mb-3">
          Erreur Admin
        </h2>
        <p className="text-white/50 text-sm mb-2">
          Une erreur inattendue s&apos;est produite.
        </p>
        {error.message && (
          <p className="text-red-400/70 text-xs font-mono bg-red-400/10 rounded px-3 py-2 mb-6 break-all">
            {error.message}
          </p>
        )}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={reset}
            className="px-5 py-2.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm font-medium transition-colors"
          >
            Réessayer
          </button>
          <Link
            href="/admin"
            className="px-5 py-2.5 rounded-lg border border-white/10 hover:border-white/30 text-white/70 hover:text-white text-sm font-medium transition-colors"
          >
            Tableau de bord
          </Link>
        </div>
      </div>
    </div>
  );
}
