import Link from "next/link";

export default function ClubNotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <h2 className="font-display text-3xl tracking-display text-earth">Page introuvable</h2>
      <p className="mt-3 text-muted">Cette page n&apos;existe pas.</p>
      <Link
        href="/club"
        className="mt-6 rounded-full bg-rust px-6 py-3 text-sm font-medium text-cream transition-colors hover:bg-rust-dark"
      >
        Retour au Club
      </Link>
    </div>
  );
}
