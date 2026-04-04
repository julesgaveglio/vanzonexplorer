"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function SiteError({
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
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center bg-bg-primary">
      <div className="glass-card max-w-md w-full p-8 rounded-2xl">
        <h2 className="text-3xl font-bold text-text-primary mb-3">
          Une erreur est survenue
        </h2>
        <p className="text-text-primary/60 mb-6">
          Quelque chose s&apos;est mal passé. Veuillez réessayer ou revenir à l&apos;accueil.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={reset}
            className="btn-primary px-6 py-3 rounded-full text-sm font-medium"
          >
            Réessayer
          </button>
          <Link
            href="/"
            className="btn-ghost px-6 py-3 rounded-full text-sm font-medium text-accent-blue border border-accent-blue/30 hover:border-accent-blue/60 transition-colors"
          >
            Retour à l&apos;accueil
          </Link>
        </div>
      </div>
    </div>
  );
}
