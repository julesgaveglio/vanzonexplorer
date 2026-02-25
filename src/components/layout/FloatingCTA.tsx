"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

export default function FloatingCTA() {
  const [visible, setVisible] = useState(true);

  // Disparaît quand le footer est visible
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

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="fixed bottom-6 left-4 right-4 z-30 lg:hidden"
        >
          <div
            className="glass-card flex items-center justify-between gap-4 px-5 py-3"
            style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.10)" }}
          >
            <p className="text-sm font-medium text-slate-700 truncate">
              Envie d&apos;aventure ? Découvrez nos vans &rarr;
            </p>
            <Link
              href="/location"
              className="btn-primary text-sm !px-4 !py-2 flex-shrink-0"
            >
              Voir les vans
            </Link>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
