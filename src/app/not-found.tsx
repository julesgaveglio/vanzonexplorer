import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: { absolute: "Page introuvable — Vanzon Explorer" },
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <div className="min-h-screen bg-bg-primary flex flex-col items-center justify-center px-6 text-center">
      <p className="text-sm font-semibold uppercase tracking-widest text-text-muted mb-4">
        Erreur 404
      </p>
      <h1 className="text-5xl md:text-7xl font-black text-text-primary mb-4">
        Page introuvable
      </h1>
      <p className="text-lg text-text-secondary max-w-md mb-10">
        Cette page n&apos;existe pas ou a été déplacée. Reprenez la route avec Vanzon Explorer.
      </p>
      <div className="flex flex-col sm:flex-row gap-3">
        <Link
          href="/location"
          className="inline-flex items-center gap-2 rounded-full bg-accent-blue px-7 py-3.5 text-sm font-semibold text-white hover:opacity-90 transition-opacity"
        >
          Louer un van
        </Link>
        <Link
          href="/articles"
          className="inline-flex items-center gap-2 rounded-full border border-border-default px-7 py-3.5 text-sm font-semibold text-text-primary hover:bg-bg-secondary transition-colors"
        >
          Voir les articles
        </Link>
      </div>
    </div>
  );
}
