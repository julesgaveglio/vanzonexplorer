import Link from "next/link";

const footerLinks = {
  offres: [
    { label: "Location de vans", href: "/location" },
    { label: "Achat / Revente", href: "/achat" },
    { label: "Formation vanlife", href: "/formation" },
  ],
  decouvrir: [
    { label: "Pays Basque", href: "/pays-basque" },
    { label: "À propos", href: "/a-propos" },
    { label: "Contact", href: "/contact" },
  ],
};

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-bg-secondary border-t border-border-default mt-24">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {/* ── Marque ── */}
          <div>
            <Link href="/" className="inline-flex items-center gap-1.5">
              <span className="text-2xl font-bold text-slate-900">Vanzon</span>
              <span className="w-1.5 h-1.5 rounded-full bg-accent-blue" />
              <span className="text-text-muted text-sm font-medium">
                Explorer
              </span>
            </Link>
            <p className="text-text-muted text-sm mt-4 max-w-xs leading-relaxed">
              Location de vans aménagés, achat/revente et formation vanlife au
              Pays Basque. Explorez la côte basque en toute liberté.
            </p>
          </div>

          {/* ── Nos offres ── */}
          <div>
            <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4">
              Nos offres
            </h3>
            <ul className="space-y-3">
              {footerLinks.offres.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-text-muted hover:text-accent-blue transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* ── Découvrir ── */}
          <div>
            <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4">
              Découvrir
            </h3>
            <ul className="space-y-3">
              {footerLinks.decouvrir.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-text-muted hover:text-accent-blue transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* ── Barre basse ── */}
        <div className="mt-16 pt-8 border-t border-border-default flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-text-light">
            © {currentYear} Vanzon Explorer · Pays Basque
          </p>
          <div className="flex gap-6">
            <Link
              href="/mentions-legales"
              className="text-xs text-text-light hover:text-text-muted transition-colors"
            >
              Mentions légales
            </Link>
            <Link
              href="/confidentialite"
              className="text-xs text-text-light hover:text-text-muted transition-colors"
            >
              Confidentialité
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
