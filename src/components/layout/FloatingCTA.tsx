"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";

type CTAConfig = {
  text: string;
  btnLabel: string;
  href: string;
  btnColor: string;
};

function getCTAConfig(pathname: string): CTAConfig | null {
  if (pathname.startsWith("/formation")) {
    return {
      text: "Formation van life",
      btnLabel: "Réserver un appel",
      href: "/formation#reserver",
      btnColor: "#7c5038",
    };
  }
  if (pathname.startsWith("/club")) {
    return {
      text: "Accès membres exclusif",
      btnLabel: "Rejoindre",
      href: "/club#rejoindre",
      btnColor: "#7C3AED",
    };
  }
  if (pathname.startsWith("/articles")) {
    return null;
  }
  if (
    pathname === "/" ||
    pathname.startsWith("/location") ||
    pathname.startsWith("/pays-basque") ||
    pathname.startsWith("/achat") ||
    pathname.startsWith("/a-propos")
  ) {
    return {
      text: "Partez à l'aventure",
      btnLabel: "Louer un van",
      href: "/location",
      btnColor: "#2563EB",
    };
  }
  return null;
}

export default function FloatingCTA() {
  const [visible, setVisible] = useState(true);
  const pathname = usePathname();

  useEffect(() => {
    const footer = document.querySelector("footer");
    if (!footer) return;

    const observer = new IntersectionObserver(
      ([entry]) => setVisible(!entry.isIntersecting),
      { threshold: 0.1 }
    );
    observer.observe(footer);
    return () => observer.disconnect();
  }, []);

  const config = getCTAConfig(pathname);
  if (!config) return null;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key={pathname}
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="fixed bottom-6 left-4 right-4 z-30 lg:hidden"
        >
          <div
            className="glass-card flex items-center justify-between gap-3 px-4 py-3"
            style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.10)" }}
          >
            <p className="text-sm font-medium text-slate-700 truncate min-w-0">
              {config.text}
            </p>
            <Link
              href={config.href}
              className="text-sm font-semibold px-4 py-2 rounded-full flex-shrink-0 whitespace-nowrap transition-opacity hover:opacity-90"
              style={{ backgroundColor: config.btnColor, color: "#fff" }}
            >
              {config.btnLabel}
            </Link>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
