"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useUser, UserButton } from "@clerk/nextjs";

const navLinks = [
  { label: "Location", href: "/location", desc: "Louer un van aménagé", emoji: "🚐" },
  { label: "Achat", href: "/achat", desc: "Acheter un fourgon", emoji: "🔑" },
  { label: "Formation", href: "/formation", desc: "Van Business Academy", emoji: "🎓" },
  { label: "Club Privé", href: "/club", desc: "Réductions exclusives", emoji: "✨" },
  { label: "Pays Basque", href: "/pays-basque", desc: "Vantrips & spots", emoji: "🏄" },
  { label: "Articles", href: "/articles", desc: "Guides vanlife", emoji: "📖" },
  { label: "À propos", href: "/a-propos", desc: "Notre histoire", emoji: "👋" },
  { label: "Contact", href: "/contact", desc: "Contactez-nous", emoji: "✉️" },
];

const LOGOS: { path: string; src: string }[] = [
  { path: "/formation", src: "https://cdn.sanity.io/images/lewexa74/production/6def39a22812318d764df11a677e5c5260e5a224-1042x417.png" },
  { path: "/club",      src: "https://cdn.sanity.io/images/lewexa74/production/46fde443f104fa1d21287a8aaeb96812096c768a-1042x417.png" },
  { path: "/location",  src: "https://cdn.sanity.io/images/lewexa74/production/9de5b0e768fa1fcc5ea5aa6f41ac816c249af9b0-1042x417.png" },
];
const HOME_LOGO    = "https://cdn.sanity.io/images/lewexa74/production/9de5b0e768fa1fcc5ea5aa6f41ac816c249af9b0-1042x417.png";
const DEFAULT_LOGO = "https://cdn.sanity.io/images/lewexa74/production/9de5b0e768fa1fcc5ea5aa6f41ac816c249af9b0-1042x417.png";

function getNavLogo(pathname: string): string {
  if (pathname === "/") return HOME_LOGO;
  for (const { path, src } of LOGOS) {
    if (pathname.startsWith(path)) return src;
  }
  return DEFAULT_LOGO;
}

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const { isSignedIn } = useUser();
  const logoSrc = getNavLogo(pathname);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
      document.body.style.touchAction = "none";
    } else {
      document.body.style.overflow = "";
      document.body.style.touchAction = "";
    }
    return () => {
      document.body.style.overflow = "";
      document.body.style.touchAction = "";
    };
  }, [mobileOpen]);

  return (
    <>
      {/* Backdrop — covers full screen behind menu, closes on tap */}
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

      <header className="fixed top-0 left-0 right-0 z-50">
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
            <Link href="/" className="flex items-center group">
              <Image
                src={logoSrc}
                alt="Vanzon Explorer"
                width={140}
                height={40}
                className="h-9 w-auto transition-opacity duration-200 group-hover:opacity-75"
                priority
                unoptimized
              />
            </Link>

            <ul className="hidden lg:flex items-center gap-1">
              {navLinks.map((link) => {
                const active = pathname.startsWith(link.href);
                return (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className={`relative flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-all duration-150 ${
                        active
                          ? "text-accent-blue bg-blue-50"
                          : "text-text-muted hover:text-text-primary hover:bg-slate-50"
                      }`}
                    >
                      {link.label}
                      {active && (
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

            <div className="hidden lg:flex items-center gap-2">
              {isSignedIn ? (
                <>
                  <Link
                    href="/dashboard"
                    className="text-sm font-medium text-text-muted hover:text-text-primary transition-colors px-3 py-2 rounded-lg hover:bg-slate-50"
                  >
                    Mon espace
                  </Link>
                  <UserButton />
                </>
              ) : (
                <>
                  <Link
                    href="/sign-in"
                    className="text-sm font-medium text-text-muted hover:text-text-primary transition-colors px-3 py-2 rounded-lg hover:bg-slate-50"
                  >
                    Se connecter
                  </Link>
                  <Link
                    href="/sign-up"
                    className="btn-primary text-sm !py-2.5 !px-5 active:scale-95 transition-transform"
                  >
                    S&apos;inscrire
                  </Link>
                </>
              )}
            </div>

            {/* Hamburger — zone de clic 44×44px minimum (standard iOS/Android) */}
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

        {/* Mobile menu panel */}
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
                {/* Nav links */}
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

                {/* Auth section */}
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
      </header>
    </>
  );
}
