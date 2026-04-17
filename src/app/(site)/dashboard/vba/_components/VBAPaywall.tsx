"use client";

import Link from "next/link";
import { GraduationCap } from "lucide-react";

export default function VBAPaywall() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="glass-card max-w-lg w-full p-10 text-center">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6"
          style={{
            background: "linear-gradient(135deg, #B9945F 0%, #E4D398 100%)",
          }}
        >
          <GraduationCap className="w-8 h-8 text-white" />
        </div>

        <h2
          className="text-2xl font-bold mb-3 bg-clip-text text-transparent"
          style={{
            backgroundImage:
              "linear-gradient(135deg, #B9945F 0%, #E4D398 100%)",
          }}
        >
          Van Business Academy
        </h2>

        <p className="text-slate-600 mb-2 text-sm leading-relaxed">
          La formation complète pour lancer et rentabiliser votre activité de
          location de van aménagé. 6 modules, 50+ vidéos, toute notre méthode
          étape par étape.
        </p>
        <p className="text-slate-400 text-xs mb-8">
          Trouver le bon van, l&apos;aménager, fixer vos tarifs, créer votre
          annonce, automatiser la gestion — tout est couvert.
        </p>

        <Link
          href="/formation-van-business"
          className="btn-gold inline-flex items-center gap-2 px-8 py-3 rounded-xl text-sm font-semibold transition-all"
        >
          Accéder à la formation
        </Link>
      </div>
    </div>
  );
}
