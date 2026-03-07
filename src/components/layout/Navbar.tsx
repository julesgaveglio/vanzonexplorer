"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useUser, UserButton } from "@clerk/nextjs";

const navGroups = [
  {
    label: "Services",
    links: [
      { label: "Location", href: "/location", desc: "Louer un van aménagé", emoji: "🚐" },
      { label: "Achat", href: "/achat", desc: "Acheter un fourgon", emoji: "🔑" },
      { label: "Formation", href: "/formation", desc: "Van Business Academy", emoji: "🎓" },
      { label: "Club Privé", href: "/club", desc: "Réductions & communauté", emoji: "✨" },
    ],
  },
  {
    label: "Explorer",
    links: [
      { label: "Pays Basque", href: "/pays-basque", desc: "Vantrips & spots", emoji: "🏄" },
      { label: "Articles", href: "/articles", desc: "Guides vanlife", emoji: "📖" },
      { label: "À propos", href: "/a-propos", desc: "Notre histoire", emoji: "👋" },
    ],
  },
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

function DesktopDropdown({
  group,
  pathname,
}: {
  group: (typeof navGroups)[0];
  pathname: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isActive = group.links.some((l) => pathname.startsWith(l.href));

  function scheduleClose() {
    closeTimer.current = setTimeout(() => setOpen(false), 120);
  }

  function cancelClose() {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  }

  // Click outside closes immediately
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div
      ref={ref}
      className="relative"
      onMouseEnter={cancelClose}
      onMouseLeave={scheduleClose}
    >
      <button
        onClick={() => setOpen((v) => !v)}
        onMouseEnter={() => { cancelClose(); setOpen(true); }}
        className={`relative flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-150 ${
          isActive
            ? "text-accent-blue bg-blue-50"
            : "text-text-muted hover:text-text-primary hover:bg-slate-50"
        }`}
      >
        {group.label}
        <motion.svg
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.18, ease: "easeInOut" }}
          className="w-3.5 h-3.5 opacity-60"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="2.5"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </motion.svg>
        {isActive && (
          <motion.span
            layoutId="nav-underline"
            className="absolute bottom-0 left-2 right-2 h-0.5 bg-accent-blue rounded-full"
          />
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.12, ease: "easeOut" }}
            className="absolute top-full left-0 z-50 overflow-hidden"
            style={{ marginTop: "6px" }}
          >
            {/* Invisible bridge covers the 6px gap — prevents accidental close */}
            <div className="absolute -top-2 left-0 right-0 h-2" />
            <div className="w-60 rounded-2xl border border-slate-100 bg-white shadow-xl shadow-slate-200/70">
              <ul className="py-2">
                {group.links.map((link) => {
                  const active = pathname.startsWith(link.href);
                  return (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        onClick={() => setOpen(false)}
                        className={`flex items-center gap-3 px-3 py-2.5 mx-1.5 rounded-xl transition-all duration-150 ${
                          active
                            ? "bg-blue-50 text-accent-blue"
                            : "hover:bg-slate-50 text-text-primary"
                        }`}
                      >
                        <div className="min-w-0">
                          <span className="text-sm font-semibold block leading-tight">{link.label}</span>
                          <span className="text-xs text-text-muted leading-tight mt-0.5 block">{link.desc}</span>
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileExpanded, setMobileExpanded] = useState<string | null>(null);
  const pathname = usePathname();
  const { isSignedIn } = useUser();
  const logoSrc = getNavLogo(pathname);

  function toggleMobileGroup(label: string) {
    setMobileExpanded((v) => (v === label ? null : label));
  }

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
    setMobileExpanded(null);
  }, [pathname]);

  return (
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
            {navGroups.map((group) => (
              <li key={group.label}>
                <DesktopDropdown group={group} pathname={pathname} />
              </li>
            ))}
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

          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="lg:hidden flex flex-col gap-1.5 p-2 rounded-lg hover:bg-slate-50 transition-colors active:scale-95"
            aria-label={mobileOpen ? "Fermer le menu" : "Ouvrir le menu"}
          >
            <motion.span
              animate={mobileOpen ? { rotate: 45, y: 6 } : { rotate: 0, y: 0 }}
              transition={{ duration: 0.18 }}
              className="block w-6 h-0.5 bg-slate-700 rounded-full"
            />
            <motion.span
              animate={mobileOpen ? { opacity: 0, scaleX: 0 } : { opacity: 1, scaleX: 1 }}
              transition={{ duration: 0.18 }}
              className="block w-6 h-0.5 bg-slate-700 rounded-full"
            />
            <motion.span
              animate={mobileOpen ? { rotate: -45, y: -6 } : { rotate: 0, y: 0 }}
              transition={{ duration: 0.18 }}
              className="block w-6 h-0.5 bg-slate-700 rounded-full"
            />
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="lg:hidden mx-4 mt-2"
          >
            <div className="glass-card p-3">
              <div className="flex flex-col gap-0.5">
                {navGroups.map((group) => (
                  <div key={group.label}>
                    <button
                      onClick={() => toggleMobileGroup(group.label)}
                      className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-text-primary rounded-xl hover:bg-slate-50 transition-colors"
                    >
                      <span>{group.label}</span>
                      <motion.svg
                        animate={{ rotate: mobileExpanded === group.label ? 180 : 0 }}
                        transition={{ duration: 0.18 }}
                        className="w-4 h-4 text-text-muted"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth="2.5"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </motion.svg>
                    </button>

                    <AnimatePresence>
                      {mobileExpanded === group.label && (
                        <motion.ul
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2, ease: "easeInOut" }}
                          className="overflow-hidden pl-2"
                        >
                          {group.links.map((link) => {
                            const active = pathname.startsWith(link.href);
                            return (
                              <li key={link.href}>
                                <Link
                                  href={link.href}
                                  onClick={() => {
                                    setMobileOpen(false);
                                    setMobileExpanded(null);
                                  }}
                                  className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-colors duration-150 ${
                                    active
                                      ? "text-accent-blue bg-blue-50"
                                      : "text-text-muted hover:text-text-primary hover:bg-slate-50"
                                  }`}
                                >
                                  <div>
                                    <span className="text-sm font-medium block">{link.label}</span>
                                    <span className="text-xs text-text-muted block">{link.desc}</span>
                                  </div>
                                </Link>
                              </li>
                            );
                          })}
                        </motion.ul>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </div>

              <div className="mt-3 px-1 flex flex-col gap-2 border-t border-slate-100 pt-3">
                {isSignedIn ? (
                  <Link
                    href="/dashboard"
                    onClick={() => setMobileOpen(false)}
                    className="block px-4 py-3 text-sm font-medium text-text-muted rounded-xl transition-colors hover:text-text-primary hover:bg-slate-50 text-center"
                  >
                    Mon espace
                  </Link>
                ) : (
                  <>
                    <Link
                      href="/sign-in"
                      onClick={() => setMobileOpen(false)}
                      className="block px-4 py-3 text-sm font-medium text-text-muted rounded-xl transition-colors hover:text-text-primary hover:bg-slate-50 text-center"
                    >
                      Se connecter
                    </Link>
                    <Link
                      href="/sign-up"
                      onClick={() => setMobileOpen(false)}
                      className="btn-primary text-sm w-full text-center block active:scale-95"
                    >
                      S&apos;inscrire
                    </Link>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
