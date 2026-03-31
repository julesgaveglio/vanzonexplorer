"use client";

import { useEffect, useState } from "react";
import LiquidButton from "@/components/ui/LiquidButton";

export type TOCHeading = {
  id: string;
  text: string;
  level: 2 | 3;
};

export default function ArticleTOC({ headings }: { headings: TOCHeading[] }) {
  const [activeId, setActiveId] = useState<string>("");

  useEffect(() => {
    if (headings.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        }
      },
      { rootMargin: "-80px 0% -65% 0%", threshold: 0 }
    );

    headings.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [headings]);

  if (headings.length === 0) return null;

  return (
    <aside aria-label="Table des matières" className="hidden lg:block sticky top-24 space-y-6">
      <nav>
        <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-4">
          Dans cet article
        </p>
        <ul className="space-y-2 border-l border-slate-100">
          {headings.map(({ id, text, level }) => (
            <li key={id}>
              <a
                href={`#${id}`}
                className={[
                  "block text-sm leading-snug py-0.5 pl-4 border-l-2 -ml-px transition-all duration-150",
                  level === 3 ? "pl-7" : "",
                  activeId === id
                    ? "border-[#4D5FEC] text-[#4D5FEC] font-semibold"
                    : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300",
                ].join(" ")}
              >
                {text}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      {/* Mini CTA card in sidebar */}
      <div className="rounded-2xl border border-slate-100 bg-gradient-to-br from-slate-50 to-blue-50/40 p-5">
        <p className="text-xs font-bold text-slate-500 mb-1">Prêt à partir ?</p>
        <p className="text-xs text-slate-400 mb-4 leading-relaxed">
          Van aménagé disponible dès demain au Pays Basque.
        </p>
        <LiquidButton href="/location" variant="blue" size="sm" fullWidth>
          Voir les vans disponibles
        </LiquidButton>
        <a
          href="/achat"
          className="mt-2.5 block text-center text-xs text-slate-400 hover:text-[#4D5FEC] transition-colors"
        >
          Acheter votre van →
        </a>
      </div>
    </aside>
  );
}
