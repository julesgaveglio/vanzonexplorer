"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { VANS } from "@/lib/data/vans";

function ImageGallery({ images, name }: { images: string[]; name: string }) {
  const [active, setActive] = useState(0);
  return (
    <div className="flex flex-col gap-3">
      <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-slate-100">
        <Image
          src={images[active]}
          alt={`Van ${name}`}
          fill
          className="object-cover transition-all duration-500"
        />
        {/* Compteur photo */}
        <div className="absolute bottom-3 right-3 bg-black/50 backdrop-blur-sm text-white text-xs font-semibold px-2.5 py-1 rounded-full">
          {active + 1} / {images.length}
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {images.map((img, i) => (
          <button
            key={i}
            onClick={() => setActive(i)}
            className={`relative aspect-[4/3] rounded-xl overflow-hidden border-2 transition-all duration-200 ${
              i === active
                ? "border-[#4D5FEC] scale-[1.02]"
                : "border-transparent opacity-55 hover:opacity-85 hover:scale-[1.01]"
            }`}
          >
            <Image src={img} alt={`${name} ${i + 1}`} fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover" />
          </button>
        ))}
      </div>
    </div>
  );
}

function VanListing({ van, reversed }: { van: (typeof VANS)[0]; reversed?: boolean }) {
  return (
    <article className="bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-md transition-shadow duration-300">
      <div className={`grid lg:grid-cols-2 gap-0 ${reversed ? "lg:[&>*:first-child]:order-2" : ""}`}>
        {/* Galerie */}
        <div className="p-6 lg:p-8 bg-slate-50/60">
          <ImageGallery images={van.images} name={van.name} />
        </div>

        {/* Détails */}
        <div className="p-6 lg:p-8 flex flex-col">
          {/* Top row */}
          <div className="flex items-start justify-between mb-5">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  {van.status}
                </span>
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-100">
                  Non VASP
                </span>
              </div>
              <h2 className="text-3xl font-black text-slate-900 leading-none">{van.name}</h2>
              <p className="text-slate-400 text-sm mt-1 font-medium">{van.model}</p>
            </div>
            <span className="text-xs text-slate-300 font-mono font-medium">{van.ref}</span>
          </div>

          {/* Prix */}
          <div className="mb-5 pb-5 border-b border-slate-100">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-1">Prix de vente</p>
            <p className="text-4xl font-black text-slate-900">{van.price}</p>
            <p className="text-xs text-slate-400 mt-1">Prix ferme · remise des clés à Cambo-les-Bains</p>
          </div>

          {/* Specs grid */}
          <div className="grid grid-cols-2 gap-3 mb-5">
            {[
              { label: "Année", value: van.year },
              { label: "Kilométrage", value: van.mileage },
              { label: "Énergie", value: van.energy },
              { label: "Boîte", value: van.gearbox },
              { label: "Places", value: `${van.seats} sièges` },
              { label: "Aménagement", value: `${van.year}` },
            ].map((spec) => (
              <div key={spec.label} className="bg-slate-50 rounded-xl px-3 py-2.5">
                <p className="text-xs text-slate-400 font-medium">{spec.label}</p>
                <p className="text-sm font-bold text-slate-800">{spec.value}</p>
              </div>
            ))}
          </div>

          {/* Description */}
          <p className="text-slate-500 text-sm leading-relaxed mb-5">{van.description}</p>

          {/* Équipements */}
          <div className="mb-6">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3">Équipements inclus</p>
            <ul className="grid grid-cols-1 gap-1.5">
              {van.features.map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm text-slate-600">
                  <svg className="w-4 h-4 flex-shrink-0 text-[#4D5FEC]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  {f}
                </li>
              ))}
            </ul>
          </div>

          {/* CTA */}
          <div className="mt-auto">
            <a
              href={van.whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full inline-flex items-center justify-center gap-2.5 bg-[#25D366] text-white font-bold px-5 py-4 rounded-xl hover:bg-[#20bd5a] transition-colors text-sm"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              Contacter le vendeur
            </a>
          </div>
        </div>
      </div>
    </article>
  );
}

export default function AchatClient({ vanId }: { vanId?: string }) {
  const displayVans = vanId ? VANS.filter((v) => v.id === vanId) : VANS;

  return (
    <div style={{ background: "#F7F6F3", minHeight: "100vh" }}>
      {/* ── HEADER ── */}
      <section className="pt-16 pb-12 px-6">
        <div className="max-w-5xl mx-auto">
          {/* Back link for detail pages */}
          {vanId && (
            <Link href="/achat" className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-[#4D5FEC] transition-colors mb-8 font-medium">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
              </svg>
              Tous les vans à vendre
            </Link>
          )}
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-white border border-slate-200 text-slate-500 shadow-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  {vanId ? "Disponible" : "2 véhicules disponibles"}
                </span>
              </div>
              <h1 className="text-5xl md:text-6xl font-black text-slate-900 leading-none tracking-tight">
                {vanId ? displayVans[0]?.name ?? "Van" : "Vans à vendre"}
              </h1>
              <p className="text-slate-500 text-lg mt-3 max-w-lg leading-relaxed">
                {vanId
                  ? `${displayVans[0]?.model} aménagé par nos soins — issu de notre flotte de location au Pays Basque. Historique complet, remise en main propre à Cambo-les-Bains.`
                  : "Deux vans entièrement aménagés par nos soins, issus de notre propre flotte. Historique complet depuis l'origine. Remise en main propre à Cambo-les-Bains."}
              </p>
            </div>
            <div className="flex gap-3 flex-shrink-0">
              <div className="bg-white rounded-2xl px-5 py-4 text-center border border-slate-100 shadow-sm">
                <p className="text-2xl font-black text-slate-900">25k€</p>
                <p className="text-xs text-slate-400 font-medium">prix ferme</p>
              </div>
              <div className="bg-white rounded-2xl px-5 py-4 text-center border border-slate-100 shadow-sm">
                <p className="text-2xl font-black text-slate-900">64</p>
                <p className="text-xs text-slate-400 font-medium">Pays Basque</p>
              </div>
            </div>
          </div>

          {/* Trust bar */}
          <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-xs font-medium text-slate-400">
            {[
              "✓ Aménagés par nos soins",
              "✓ Historique d'entretien complet",
              "✓ Remise des clés à Cambo-les-Bains",
              "✓ Pays Basque — département 64",
            ].map((t) => (
              <span key={t}>{t}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ── LISTINGS ── */}
      <section className="pb-16 px-6">
        <div className="max-w-5xl mx-auto flex flex-col gap-8">
          {displayVans.map((van, i) => (
            <VanListing key={van.id} van={van} reversed={!vanId && i % 2 === 1} />
          ))}
        </div>
      </section>

      {/* ── ACCOMPAGNEMENT ── */}
      <section className="px-6 pb-20">
        <div className="max-w-5xl mx-auto">
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
              <a
                href="/formation"
                className="inline-flex items-center justify-center gap-2 bg-white text-slate-900 font-bold px-8 py-4 rounded-2xl hover:bg-slate-100 transition-colors text-sm"
              >
                Découvrir la formation
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
