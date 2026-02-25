"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

const navLinks = [
  { label: "Location", href: "/location" },
  { label: "Achat", href: "/achat" },
  { label: "Formation", href: "/formation" },
  { label: "Pays Basque", href: "/pays-basque" },
  { label: "À propos", href: "/a-propos" },
];

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      {/* ── Barre principale — glass blanc ── */}
      <nav
        className="border-b"
        style={{
          background: "rgba(255, 255, 255, 0.85)",
          backdropFilter: "blur(24px) saturate(200%)",
          WebkitBackdropFilter: "blur(24px) saturate(200%)",
          borderColor: "rgba(0, 0, 0, 0.06)",
          boxShadow: "0 1px 12px rgba(0, 0, 0, 0.04)",
        }}
      >
        <div className="mx-auto max-w-7xl flex items-center justify-between px-6 py-3">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-1.5 group">
            <span className="text-xl font-bold text-slate-900">
              Vanzon
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-accent-blue" />
            <span className="text-text-muted text-sm font-medium hidden sm:inline">
              Explorer
            </span>
          </Link>

          {/* Navigation desktop */}
          <ul className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => {
              const isActive = pathname.startsWith(link.href);
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className={`relative px-4 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
                      isActive
                        ? "text-accent-blue"
                        : "text-text-muted hover:text-text-primary hover:bg-slate-50"
                    }`}
                  >
                    {link.label}
                    {isActive && (
                      <motion.span
                        layoutId="nav-underline"
                        className="absolute bottom-0 left-2 right-2 h-0.5 bg-accent-blue rounded-full"
                      />
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>

          {/* CTA desktop */}
          <div className="hidden lg:block">
            <Link href="/location" className="btn-primary text-sm !py-2.5 !px-5">
              Réserver
            </Link>
          </div>

          {/* Hamburger mobile */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="lg:hidden flex flex-col gap-1.5 p-2"
            aria-label={mobileOpen ? "Fermer le menu" : "Ouvrir le menu"}
          >
            <motion.span
              animate={mobileOpen ? { rotate: 45, y: 6 } : { rotate: 0, y: 0 }}
              className="block w-6 h-0.5 bg-slate-700 rounded-full"
            />
            <motion.span
              animate={mobileOpen ? { opacity: 0 } : { opacity: 1 }}
              className="block w-6 h-0.5 bg-slate-700 rounded-full"
            />
            <motion.span
              animate={mobileOpen ? { rotate: -45, y: -6 } : { rotate: 0, y: 0 }}
              className="block w-6 h-0.5 bg-slate-700 rounded-full"
            />
          </button>
        </div>
      </nav>

      {/* ── Menu mobile ── */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="lg:hidden mx-4 mt-2"
          >
            <div className="glass-card p-4">
              <ul className="flex flex-col gap-1">
                {navLinks.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      onClick={() => setMobileOpen(false)}
                      className="block px-4 py-3 text-sm font-medium text-text-muted rounded-xl transition-colors duration-200 hover:text-text-primary hover:bg-slate-50"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
              <div className="mt-4 px-4">
                <Link
                  href="/location"
                  onClick={() => setMobileOpen(false)}
                  className="btn-primary text-sm w-full text-center block"
                >
                  Réserver un van
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
