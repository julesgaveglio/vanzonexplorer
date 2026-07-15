"use client";

import { useState, useEffect } from "react";
import { List, X } from "lucide-react";

// Nav mobile de la formation VBA (caché en desktop, où la sidebar est permanente).
// Deux accès au sommaire pour la découvrabilité :
//   1. une barre sticky en haut du contenu (toujours visible en scrollant)
//   2. une bottom-sheet plein écran qui contient la sidebar complète
export default function VBAMobileDrawer({
  moduleTitle,
  lessonTitle,
  children,
}: {
  moduleTitle?: string;
  lessonTitle?: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  // Bloque le scroll du body quand la bottom-sheet est ouverte
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [open]);

  return (
    <div className="lg:hidden">
      {/* Barre sticky — accès sommaire toujours visible en haut du contenu */}
      <div className="sticky top-0 z-40 flex items-center gap-3 px-4 py-2.5 bg-white/95 backdrop-blur-sm border-b border-slate-100">
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold text-white flex-shrink-0 active:scale-95 transition-transform"
          style={{
            background: "linear-gradient(135deg, var(--gold) 0%, var(--gold-light) 100%)",
          }}
        >
          <List className="w-4 h-4" />
          Sommaire
        </button>
        <div className="min-w-0 leading-tight">
          {moduleTitle && (
            <p className="text-[11px] text-slate-400 truncate">{moduleTitle}</p>
          )}
          {lessonTitle && (
            <p className="text-xs font-medium text-slate-700 truncate">{lessonTitle}</p>
          )}
        </div>
      </div>

      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Bottom sheet — plein largeur */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-[60] bg-white rounded-t-2xl shadow-2xl transition-transform duration-300 ease-out ${
          open ? "translate-y-0" : "translate-y-full pointer-events-none"
        }`}
        style={{ maxHeight: "85vh" }}
      >
        {/* Entête : titre + fermeture */}
        <div className="relative flex items-center justify-center px-5 pt-3 pb-2 border-b border-slate-100">
          <div className="w-10 h-1 rounded-full bg-slate-200" />
          <span className="absolute left-5 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-700">
            Sommaire
          </span>
          <button
            onClick={() => setOpen(false)}
            aria-label="Fermer le sommaire"
            className="absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 active:bg-slate-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Contenu sidebar — un clic sur une leçon ferme la sheet */}
        <div
          className="overflow-y-auto overscroll-contain"
          style={{ maxHeight: "calc(85vh - 49px)" }}
          onClick={(e) => {
            if ((e.target as HTMLElement).closest("a")) {
              setTimeout(() => setOpen(false), 150);
            }
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
