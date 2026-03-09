"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const PREVIEW = `Je tiens à remercier Jules pour sa formation dédiée à l'aménagement de van. Depuis longtemps, j'avais le rêve de partir explorer les massifs montagneux et plusieurs pays d'Europe en van. Mais entre le prix d'un véhicule et le coût d'un aménagement professionnel, je savais que je devais apprendre à le faire moi-même si je voulais concrétiser ce projet qui me tenait profondément à cœur.`;

const REST = [
  `Avant de tomber sur cette formation, j'étais un peu perdu. J'avais regardé plusieurs vidéos sur Internet, mais rien n'était vraiment structuré ni clair. Je ne savais pas par où commencer, comment m'organiser, ni comment éviter les erreurs coûteuses.`,
  `Aujourd'hui, je suis fier d'avoir commencé mon propre aménagement, et je sais déjà que je ressentirai une immense gratitude le jour où je me réveillerai dans un van que j'aurai construit de mes propres mains. Au-delà du voyage lui-même, le fait de créer son espace, de comprendre chaque détail et chaque choix, c'est une fierté indescriptible.`,
  `Merci Vanzon pour cet accompagnement qui m'a réellement aidé à transformer un rêve flou en un projet concret.`,
];

export default function SylvainTestimonial() {
  const [open, setOpen] = useState(false);

  return (
    <div className="max-w-2xl mx-auto">
      <div
        className="relative rounded-2xl px-8 py-8"
        style={{
          background: "rgba(255,255,255,0.85)",
          backdropFilter: "blur(12px)",
          border: "1px solid rgba(185,148,95,0.18)",
          boxShadow: "0 8px 40px rgba(0,0,0,0.07)",
        }}
      >
        {/* Guillemet décoratif */}
        <span
          className="absolute top-5 left-7 text-6xl font-serif leading-none select-none"
          style={{ color: "rgba(185,148,95,0.18)" }}
          aria-hidden
        >
          &ldquo;
        </span>

        {/* Étoiles */}
        <div className="flex gap-0.5 mb-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <span key={i} className="text-amber-400 text-lg">★</span>
          ))}
        </div>

        {/* Texte preview */}
        <p className="text-slate-600 text-sm leading-relaxed italic relative z-10">
          {PREVIEW}
        </p>

        {/* Texte caché */}
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.35, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              <div className="pt-4 space-y-3">
                {REST.map((para, i) => (
                  <p key={i} className="text-slate-600 text-sm leading-relaxed italic">
                    {para}
                  </p>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bouton Lire */}
        <button
          onClick={() => setOpen((v) => !v)}
          className="mt-4 text-xs font-semibold tracking-wide uppercase transition-colors"
          style={{ color: "#B9945F" }}
        >
          {open ? "Réduire ↑" : "Lire la suite ↓"}
        </button>

        {/* Séparateur + auteur */}
        <div className="mt-6 pt-5 border-t flex items-center gap-3" style={{ borderColor: "rgba(185,148,95,0.15)" }}>
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
            style={{ background: "linear-gradient(135deg, #B9945F, #8B6B3D)" }}
          >
            S
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900">Sylvain Delonca</p>
            <p className="text-xs text-slate-400">Élève Van Business Academy</p>
          </div>
        </div>
      </div>
    </div>
  );
}
