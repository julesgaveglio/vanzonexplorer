"use client";

import Image from "next/image";
import Link from "next/link";
import { VANS_LANDING as VANS } from "@/lib/data/vans";
import OtherServices from "@/components/ui/OtherServices";
import RoadTripCTA from "@/components/ui/RoadTripCTA";
import LiquidButton from "@/components/ui/LiquidButton";

export default function AchatLanding() {
  return (
    <div className="min-h-screen" style={{ background: "#F7F6F3" }}>

      {/* ── HERO ── */}
      <section className="pt-20 pb-14 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white border border-slate-200 rounded-full px-4 py-1.5 text-xs font-semibold text-slate-500 shadow-sm mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            2 véhicules disponibles · Cambo-les-Bains (64)
          </div>
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-black text-slate-900 leading-none tracking-tight mb-5">
            Vans aménagés<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#4D5FEC] to-[#4BC3E3]">à vendre</span>
          </h1>
          <p className="text-slate-500 text-lg md:text-xl leading-relaxed max-w-2xl mx-auto mb-3">
            Deux Renault Trafic entièrement aménagés par nos soins, issus de notre flotte de location au Pays Basque. Historique complet, remise en main propre à Cambo-les-Bains.
          </p>
          <p className="text-slate-400 text-sm">Prix ferme · 23 500 € chaque van</p>
        </div>
      </section>

      {/* ── VAN CARDS ── */}
      <section className="pb-20 px-6">
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
          {VANS.map((van) => (
            <Link
              key={van.id}
              href={van.href}
              className="group bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col"
            >
              {/* Image */}
              <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
                <Image
                  src={van.image}
                  alt={`Van ${van.name} aménagé à vendre - Pays Basque`}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/30 to-transparent" />
                <div className="absolute top-3 left-3">
                  <span className="bg-white/95 text-slate-700 text-xs font-bold px-3 py-1.5 rounded-full shadow-sm">
                    {van.tag}
                  </span>
                </div>
                <div className="absolute top-3 right-3">
                  <span className="bg-emerald-500 text-white text-xs font-bold px-3 py-1.5 rounded-full">
                    Disponible
                  </span>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 flex flex-col flex-1">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h2 className="text-2xl font-black text-slate-900 group-hover:text-[#4D5FEC] transition-colors">{van.name}</h2>
                    <p className="text-slate-400 text-sm font-medium">{van.model}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-black text-slate-900">{van.price}</p>
                  </div>
                </div>

                {/* Specs row */}
                <div className="flex gap-3 mb-4 text-xs font-semibold text-slate-500">
                  <span className="bg-slate-50 px-2.5 py-1 rounded-lg">{van.year}</span>
                  <span className="bg-slate-50 px-2.5 py-1 rounded-lg">{van.mileage}</span>
                  <span className="bg-slate-50 px-2.5 py-1 rounded-lg">Diesel</span>
                </div>

                {/* Highlights */}
                <ul className="flex flex-wrap gap-2 mb-5">
                  {van.highlights.map((h) => (
                    <li key={h} className="text-xs font-medium text-slate-600 bg-slate-50 border border-slate-100 px-2.5 py-1 rounded-lg flex items-center gap-1.5">
                      <svg className="w-3 h-3 text-[#4D5FEC] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      {h}
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <div className="mt-auto inline-flex items-center gap-2 text-sm font-bold text-[#4D5FEC] group-hover:gap-3 transition-all">
                  Voir le van en détail
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── TRUST STRIP ── */}
      <section className="px-6 pb-10">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl border border-slate-100 px-6 py-5 flex flex-wrap justify-center gap-6 text-xs font-semibold text-slate-500">
            {[
              { icon: "🔧", label: "Aménagés par nos soins" },
              { icon: "📋", label: "Historique d'entretien complet" },
              { icon: "📍", label: "Remise à Cambo-les-Bains" },
              { icon: "🏄", label: "Flotte de location Pays Basque" },
            ].map((t) => (
              <span key={t.label} className="flex items-center gap-2">
                <span>{t.icon}</span>
                {t.label}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── ACCOMPAGNEMENT ── */}
      <section className="px-6 pb-20">
        <div className="max-w-4xl mx-auto">
          <div className="bg-slate-900 rounded-3xl p-8 md:p-12 flex flex-col md:flex-row gap-8 items-center justify-between">
            <div className="max-w-lg">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">Service accompagnement</p>
              <h2 className="text-2xl md:text-3xl font-black text-white mb-3 leading-tight">
                Vous aimeriez construire votre propre van ?
              </h2>
              <p className="text-slate-400 leading-relaxed text-sm">
                Nous vous accompagnons pour trouver le fourgon qui correspond à votre projet — aménagement de A à Z, homologation et démarches administratives.
              </p>
            </div>
            <div className="flex flex-col gap-3 flex-shrink-0 w-full md:w-auto">
              <LiquidButton href="/formation" variant="gold" size="md">
                Découvrir la formation →
              </LiquidButton>
            </div>
          </div>
        </div>
      </section>

      <RoadTripCTA />
      <OtherServices current="achat" bgColor="#F7F6F3" />
    </div>
  );
}
