"use client";

import Image from "next/image";
import { useState } from "react";

interface ActivityCardProps {
  icon: string;
  title: string;
  desc: string;
  imgUrl: string;
}

/**
 * Carte activité avec reveal au hover (desktop) et au tap (mobile).
 * État par défaut : emoji + titre uniquement.
 * Hover/tap : description glisse depuis le bas.
 */
export default function ActivityCard({ icon, title, desc, imgUrl }: ActivityCardProps) {
  const [open, setOpen] = useState(false);

  return (
    <div
      className="relative h-64 overflow-hidden rounded-2xl group cursor-pointer select-none"
      data-open={open}
      onClick={() => setOpen((o) => !o)}
    >
      {/* Image */}
      <Image
        src={imgUrl}
        alt={title}
        fill
        sizes="(max-width: 768px) 100vw, 33vw"
        className="object-cover transition-transform duration-500 group-hover:scale-105 group-data-[open=true]:scale-105"
      />

      {/* Gradient — léger par défaut, intense au reveal */}
      <div className="absolute inset-0 transition-all duration-300 bg-gradient-to-t from-black/65 via-black/10 to-transparent group-hover:from-black/85 group-hover:via-black/30 group-data-[open=true]:from-black/85 group-data-[open=true]:via-black/30" />

      {/* Contenu */}
      <div className="absolute bottom-0 left-0 right-0 p-5">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-2xl leading-none">{icon}</span>
          <h3 className="font-bold text-white text-base leading-tight">{title}</h3>
        </div>

        {/* Description — masquée par défaut, reveal au hover/tap */}
        <p className="text-white/85 text-sm leading-relaxed mt-1.5 transition-all duration-300 ease-out opacity-0 translate-y-2 max-h-0 overflow-hidden group-hover:opacity-100 group-hover:translate-y-0 group-hover:max-h-24 group-data-[open=true]:opacity-100 group-data-[open=true]:translate-y-0 group-data-[open=true]:max-h-24">
          {desc}
        </p>
      </div>
    </div>
  );
}
