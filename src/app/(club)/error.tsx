"use client";

import { useEffect } from "react";

export default function ClubError({
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
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <h2 className="font-display text-3xl tracking-display text-earth">Une erreur est survenue</h2>
      <p className="mt-3 text-muted">Quelque chose s&apos;est mal passé.</p>
      <button
        onClick={reset}
        className="mt-6 rounded-full bg-rust px-6 py-3 text-sm font-medium text-cream transition-colors hover:bg-rust-dark"
      >
        Réessayer
      </button>
    </div>
  );
}
