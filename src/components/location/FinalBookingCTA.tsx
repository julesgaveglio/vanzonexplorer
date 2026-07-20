import Link from "next/link";
import type { ReactNode } from "react";

/**
 * CTA final de réservation — carte sombre partagée par /location et les pages
 * ville. Centralise les URLs de réservation plateformes (avant : dupliquées
 * dans chaque page). Même langage visuel que le bloc accompagnement de /achat.
 */
const YESCAPA_URL = "https://www.yescapa.fr/campers/89215";
const WIKICAMPERS_URL =
  "https://www.wikicampers.com/rental/fourgon/cambo-les-bains/renault-vanzon-explorer-trafic-iii/380874";

export default function FinalBookingCTA({
  title,
  subtitle,
  linkHref,
  linkLabel,
}: {
  title: ReactNode;
  subtitle: ReactNode;
  linkHref?: string;
  linkLabel?: string;
}) {
  return (
    <section className="px-6 py-14">
      <div className="max-w-4xl mx-auto">
        <div className="bg-slate-900 rounded-3xl p-8 md:p-12">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div className="max-w-md">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">
                Réservation
              </p>
              <h2 className="font-sans text-2xl md:text-3xl font-black text-white leading-tight tracking-tight">
                {title}
              </h2>
              <p className="text-slate-400 leading-relaxed text-sm mt-3">{subtitle}</p>
            </div>

            <div className="flex flex-col gap-3 shrink-0 w-full md:w-auto">
              <a
                href={YESCAPA_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 bg-white text-slate-900 font-bold px-8 py-3.5 rounded-xl hover:bg-slate-100 transition-colors text-sm"
              >
                Réserver Yoni · Yescapa
              </a>
              <a
                href={WIKICAMPERS_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 border border-white/25 text-white font-bold px-8 py-3.5 rounded-xl hover:bg-white/10 transition-colors text-sm"
              >
                Réserver Xalbat · Wikicampers
              </a>
              {linkHref && linkLabel && (
                <Link
                  href={linkHref}
                  className="text-center text-xs text-slate-500 hover:text-slate-300 underline underline-offset-2 transition-colors mt-1"
                >
                  {linkLabel}
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
