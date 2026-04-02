"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useUser, UserButton } from "@clerk/nextjs";

const navLinks = [
  { label: "Location", href: "/location", desc: "Louer un van aménagé", emoji: "🚐" },
  { label: "Achat", href: "/achat", desc: "Acheter un fourgon", emoji: "🔑" },
  { label: "Formation", href: "/formation", desc: "Van Business Academy", emoji: "🎓" },
  { label: "Club Privé", href: "/club", desc: "Réductions exclusives", emoji: "🔮" },
  { label: "Pays Basque", href: "/pays-basque", desc: "Vantrips & spots", emoji: "🏄" },
  { label: "Road Trips", href: "/road-trip", desc: "Itinéraires van en France", emoji: "🗺️" },
  { label: "Articles", href: "/articles", desc: "Guides vanlife", emoji: "📖" },
  { label: "À propos", href: "/a-propos", desc: "Notre histoire", emoji: "👋" },
  { label: "Contact", href: "/contact", desc: "Contactez-nous", emoji: "✉️" },
];

const LOGOS: { path: string; src: string }[] = [
  { path: "/formation", src: "https://cdn.sanity.io/images/lewexa74/production/6def39a22812318d764df11a677e5c5260e5a224-1042x417.png?auto=format&q=82" },
  { path: "/club",      src: "https://cdn.sanity.io/images/lewexa74/production/46fde443f104fa1d21287a8aaeb96812096c768a-1042x417.png?auto=format&q=82" },
  { path: "/location",  src: "https://cdn.sanity.io/images/lewexa74/production/9de5b0e768fa1fcc5ea5aa6f41ac816c249af9b0-1042x417.png?auto=format&q=82" },
];
const HOME_LOGO    = "https://cdn.sanity.io/images/lewexa74/production/9de5b0e768fa1fcc5ea5aa6f41ac816c249af9b0-1042x417.png?auto=format&q=82";
const DEFAULT_LOGO = "https://cdn.sanity.io/images/lewexa74/production/9de5b0e768fa1fcc5ea5aa6f41ac816c249af9b0-1042x417.png?auto=format&q=82";

function getNavLogo(pathname: string): string {
  if (pathname === "/") return HOME_LOGO;
  for (const { path, src } of LOGOS) {
    if (pathname.startsWith(path)) return src;
  }
  return DEFAULT_LOGO;
}

// Burger icon — animates to ✕
function BurgerIcon({ open }: { open: boolean }) {
  return (
    <span className="flex flex-col gap-[5px]">
      <motion.span
        animate={open ? { rotate: 45, y: 7 } : { rotate: 0, y: 0 }}
        transition={{ duration: 0.2, ease: "easeInOut" }}
        className="block w-5 h-0.5 bg-slate-700 rounded-full origin-center"
      />
      <motion.span
        animate={open ? { opacity: 0, scaleX: 0 } : { opacity: 1, scaleX: 1 }}
        transition={{ duration: 0.15 }}
        className="block w-5 h-0.5 bg-slate-700 rounded-full"
      />
      <motion.span
        animate={open ? { rotate: -45, y: -7 } : { rotate: 0, y: 0 }}
        transition={{ duration: 0.2, ease: "easeInOut" }}
        className="block w-5 h-0.5 bg-slate-700 rounded-full origin-center"
      />
    </span>
  );
}

export default function Navbar() {
  const [mobileOpen, setMobileOpen]   = useState(false);
  const [desktopOpen, setDesktopOpen] = useState(false);
  const [headerHidden, setHeaderHidden] = useState(false);
  const lastScrollY = useRef(0);
  const pathname  = usePathname();
  const { isSignedIn } = useUser();
  const logoSrc = getNavLogo(pathname);

  // Close menus on route change
  useEffect(() => {
    setMobileOpen(false);
    setDesktopOpen(false);
  }, [pathname]);

  // Hide header on scroll down (mobile only)
  useEffect(() => {
    const handleScroll = () => {
      if (window.innerWidth >= 1024 || mobileOpen) return;
      const currentY = window.scrollY;
      if (currentY > lastScrollY.current && currentY > 80) {
        setHeaderHidden(true);
      } else {
        setHeaderHidden(false);
      }
      lastScrollY.current = currentY;
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [mobileOpen]);

  // Toujours visible quand le menu mobile est ouvert
  useEffect(() => {
    if (mobileOpen) setHeaderHidden(false);
  }, [mobileOpen]);

  // Lock body scroll when any menu is open
  useEffect(() => {
    const locked = mobileOpen || desktopOpen;
    document.body.style.overflow    = locked ? "hidden" : "";
    document.body.style.touchAction = locked ? "none"   : "";
    return () => {
      document.body.style.overflow    = "";
      document.body.style.touchAction = "";
    };
  }, [mobileOpen, desktopOpen]);

  return (
    <>
      {/* ── Mobile backdrop ── */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-[2px] lg:hidden"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      {/* ── Desktop drawer backdrop ── */}
      <AnimatePresence>
        {desktopOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="fixed inset-0 z-40 hidden lg:block bg-slate-900/40 backdrop-blur-[2px]"
            onClick={() => setDesktopOpen(false)}
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      {/* ── Desktop drawer panel ── */}
      <AnimatePresence>
        {desktopOpen && (
          <motion.aside
            initial={{ x: 320, opacity: 0 }}
            animate={{ x: 0,   opacity: 1 }}
            exit={{ x: 320,    opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.32, 0.72, 0, 1] }}
            className="fixed top-0 right-0 bottom-0 z-50 hidden lg:flex flex-col w-80"
            style={{
              background: "rgba(255,255,255,0.98)",
              backdropFilter: "blur(24px) saturate(180%)",
              WebkitBackdropFilter: "blur(24px) saturate(180%)",
              borderLeft: "1px solid rgba(0,0,0,0.07)",
              boxShadow: "-12px 0 40px rgba(0,0,0,0.12)",
            }}
          >
            {/* Drawer header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <Link href="/" onClick={() => setDesktopOpen(false)}>
                <Image
                  src={logoSrc}
                  alt="Vanzon Explorer"
                  width={110}
                  height={32}
                  className="h-8 w-auto"
                />
              </Link>
              <button
                onClick={() => setDesktopOpen(false)}
                className="flex items-center justify-center w-9 h-9 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                aria-label="Fermer le menu"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M2 2l12 12M14 2L2 14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                </svg>
              </button>
            </div>

            {/* Drawer links */}
            <div className="flex-1 overflow-y-auto p-3">
              {navLinks.map((link, i) => {
                const active = pathname.startsWith(link.href);
                return (
                  <motion.div
                    key={link.href}
                    initial={{ opacity: 0, x: 12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03, duration: 0.18 }}
                  >
                    <Link
                      href={link.href}
                      onClick={() => setDesktopOpen(false)}
                      className={`flex items-center px-4 py-3 rounded-xl transition-colors duration-150 ${
                        active
                          ? "text-accent-blue bg-blue-50"
                          : "text-slate-700 hover:text-slate-900 hover:bg-slate-50"
                      }`}
                    >
                      <div>
                        <span className="text-sm font-semibold block">{link.label}</span>
                        <span className="text-xs text-slate-400 block">{link.desc}</span>
                      </div>
                      {active && (
                        <span className="ml-auto w-1.5 h-1.5 rounded-full bg-accent-blue flex-shrink-0" />
                      )}
                    </Link>
                  </motion.div>
                );
              })}
            </div>

            {/* Drawer auth footer */}
            <div className="px-3 pb-4 pt-2 border-t border-slate-100">
              {isSignedIn ? (
                <div className="flex items-center gap-3 px-4 py-3">
                  <UserButton />
                  <Link
                    href="/dashboard"
                    onClick={() => setDesktopOpen(false)}
                    className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
                  >
                    Mon espace
                  </Link>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Link
                    href="/sign-in"
                    onClick={() => setDesktopOpen(false)}
                    className="flex-1 flex items-center justify-center px-4 py-3 text-sm font-medium text-slate-600 rounded-xl hover:bg-slate-50 transition-colors border border-slate-200"
                  >
                    Se connecter
                  </Link>
                  <Link
                    href="/sign-up"
                    onClick={() => setDesktopOpen(false)}
                    className="flex-1 btn-primary text-sm text-center active:scale-95 transition-transform"
                  >
                    S&apos;inscrire
                  </Link>
                </div>
              )}
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      <motion.header
        className="fixed top-0 left-0 right-0 z-50"
        animate={{ y: headerHidden ? "-100%" : 0 }}
        transition={{ duration: 0.28, ease: [0.32, 0.72, 0, 1] }}
      >
        <nav
          className="border-b"
          style={{
            background: "rgba(255, 255, 255, 0.88)",
            backdropFilter: "blur(24px) saturate(200%)",
            WebkitBackdropFilter: "blur(24px) saturate(200%)",
            borderColor: "rgba(0, 0, 0, 0.06)",
            boxShadow: "0 1px 12px rgba(0, 0, 0, 0.04)",
          }}
        >
          <div className="mx-auto max-w-7xl flex items-center justify-between px-6 py-3">
            {/* Logo */}
            <Link href="/" className="flex items-center group">
              <Image
                src={logoSrc}
                alt="Vanzon Explorer"
                width={140}
                height={40}
                className="h-9 w-auto transition-opacity duration-200 group-hover:opacity-75"
                priority
              />
            </Link>

            {/* ── Desktop right side: CTA + Burger ── */}
            <div className="hidden lg:flex items-center gap-3">
              {isSignedIn && (
                <Link
                  href="/dashboard"
                  className="text-sm font-medium text-text-muted hover:text-text-primary transition-colors px-3 py-2 rounded-lg hover:bg-slate-50"
                >
                  Mon espace
                </Link>
              )}
              <button
                onClick={() => setDesktopOpen(!desktopOpen)}
                className="flex items-center justify-center w-11 h-11 rounded-xl border border-slate-200 hover:bg-slate-50 active:bg-slate-100 transition-colors"
                aria-label={desktopOpen ? "Fermer le menu" : "Ouvrir le menu"}
                aria-expanded={desktopOpen}
              >
                <BurgerIcon open={desktopOpen} />
              </button>
            </div>

            {/* ── Mobile hamburger (inchangé) ── */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="lg:hidden flex items-center justify-center w-11 h-11 -mr-1 rounded-xl hover:bg-slate-100 active:bg-slate-200 transition-colors"
              aria-label={mobileOpen ? "Fermer le menu" : "Ouvrir le menu"}
              aria-expanded={mobileOpen}
            >
              <span className="flex flex-col gap-[5px]">
                <motion.span
                  animate={mobileOpen ? { rotate: 45, y: 7 } : { rotate: 0, y: 0 }}
                  transition={{ duration: 0.2, ease: "easeInOut" }}
                  className="block w-6 h-0.5 bg-slate-700 rounded-full origin-center"
                />
                <motion.span
                  animate={mobileOpen ? { opacity: 0, scaleX: 0 } : { opacity: 1, scaleX: 1 }}
                  transition={{ duration: 0.15 }}
                  className="block w-6 h-0.5 bg-slate-700 rounded-full"
                />
                <motion.span
                  animate={mobileOpen ? { rotate: -45, y: -7 } : { rotate: 0, y: 0 }}
                  transition={{ duration: 0.2, ease: "easeInOut" }}
                  className="block w-6 h-0.5 bg-slate-700 rounded-full origin-center"
                />
              </span>
            </button>
          </div>
        </nav>

        {/* ── Mobile menu panel (inchangé) ── */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="lg:hidden mx-3 mt-2"
            >
              <div
                className="rounded-2xl overflow-hidden shadow-xl"
                style={{
                  background: "rgba(255,255,255,0.97)",
                  backdropFilter: "blur(24px)",
                  WebkitBackdropFilter: "blur(24px)",
                  border: "1px solid rgba(0,0,0,0.07)",
                }}
              >
                <div className="p-2">
                  {navLinks.map((link, i) => {
                    const active = pathname.startsWith(link.href);
                    return (
                      <motion.div
                        key={link.href}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.03, duration: 0.15 }}
                      >
                        <Link
                          href={link.href}
                          onClick={() => setMobileOpen(false)}
                          className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors duration-150 ${
                            active
                              ? "text-accent-blue bg-blue-50"
                              : "text-slate-700 hover:text-slate-900 hover:bg-slate-50 active:bg-slate-100"
                          }`}
                        >
                          <span className="text-lg leading-none w-7 text-center flex-shrink-0">
                            {link.emoji}
                          </span>
                          <div>
                            <span className="text-sm font-semibold block">{link.label}</span>
                            <span className="text-xs text-slate-400 block">{link.desc}</span>
                          </div>
                          {active && (
                            <span className="ml-auto w-1.5 h-1.5 rounded-full bg-accent-blue flex-shrink-0" />
                          )}
                        </Link>
                      </motion.div>
                    );
                  })}
                </div>

                <div className="px-2 pb-2 pt-1 border-t border-slate-100">
                  {isSignedIn ? (
                    <Link
                      href="/dashboard"
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-slate-600 rounded-xl hover:bg-slate-50 active:bg-slate-100 transition-colors"
                    >
                      Mon espace
                    </Link>
                  ) : (
                    <div className="flex gap-2">
                      <Link
                        href="/sign-in"
                        onClick={() => setMobileOpen(false)}
                        className="flex-1 flex items-center justify-center px-4 py-3 text-sm font-medium text-slate-600 rounded-xl hover:bg-slate-50 active:bg-slate-100 transition-colors border border-slate-200"
                      >
                        Se connecter
                      </Link>
                      <Link
                        href="/sign-up"
                        onClick={() => setMobileOpen(false)}
                        className="flex-1 btn-primary text-sm text-center block active:scale-95 transition-transform"
                      >
                        S&apos;inscrire
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>
    </>
  );
}
