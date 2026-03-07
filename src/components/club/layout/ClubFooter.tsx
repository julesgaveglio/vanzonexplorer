import Link from "next/link";

export default function ClubFooter() {
  return (
    <footer className="border-t border-border bg-white py-12 px-4">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
          <div>
            <p className="font-display text-xl tracking-display text-earth">Club Privé Vanzon</p>
            <p className="mt-1 text-sm text-muted">Les meilleurs deals vanlife, au même endroit.</p>
          </div>
          <nav className="flex flex-wrap items-center gap-6 text-sm text-muted">
            <Link href="/club/deals" className="hover:text-rust transition-colors">Offres</Link>
            <Link href="/club/categories" className="hover:text-rust transition-colors">Catégories</Link>
            <Link href="/club/marques" className="hover:text-rust transition-colors">Marques</Link>
            <Link href="/club/dashboard" className="hover:text-rust transition-colors">Mon espace</Link>
            <Link href="/" className="hover:text-rust transition-colors">Retour au site</Link>
          </nav>
        </div>
        <div className="mt-8 border-t border-border pt-6 text-center text-xs text-muted">
          © {new Date().getFullYear()} Vanzon Explorer · Tous droits réservés
        </div>
      </div>
    </footer>
  );
}
