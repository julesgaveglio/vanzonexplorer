"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { VANS_LANDING as VANS, type VanLandingData } from "@/lib/data/vans";
import LiquidButton from "@/components/ui/LiquidButton";

function ListingCard({ van }: { van: VanLandingData }) {
  const [favorite, setFavorite] = useState(false);
  const [photo, setPhoto] = useState(0);
  const total = van.images.length;

  const changePhoto = (e: React.MouseEvent, delta: number) => {
    e.preventDefault();
    e.stopPropagation();
    setPhoto((p) => (p + delta + total) % total);
  };

  const toggleFavorite = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setFavorite((f) => !f);
  };

  return (
    <Link
      href={van.href}
      className="group bg-white rounded-2xl overflow-hidden border border-slate-200/80 shadow-sm hover:shadow-xl hover:border-slate-300 transition-all duration-300 flex flex-col sm:flex-row"
    >
      {/* Photos */}
      <div className="relative aspect-[4/3] sm:aspect-auto sm:w-[300px] md:w-[340px] shrink-0 overflow-hidden bg-slate-100 sm:self-stretch sm:min-h-[220px]">
        {/* Pile d'images avec fondu — évite le flash blanc au changement de photo */}
        {van.images.map((src, i) => (
          <Image
            key={src}
            src={src}
            alt={
              i === photo
                ? `Van aménagé ${van.model} à vendre — ${van.locationLabel} — photo ${i + 1}`
                : ""
            }
            fill
            className={`object-cover transition-opacity duration-300 ${
              i === photo ? "opacity-100" : "opacity-0"
            }`}
          />
        ))}
        <div className="absolute top-3 left-3">
          <span className="bg-white/95 backdrop-blur-sm text-slate-700 text-xs font-bold px-3 py-1.5 rounded-full shadow-sm">
            {van.tag}
          </span>
        </div>
        <button
          type="button"
          aria-label={favorite ? "Retirer des favoris" : "Ajouter aux favoris"}
          onClick={toggleFavorite}
          className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/95 backdrop-blur-sm shadow-sm flex items-center justify-center transition-transform hover:scale-110"
        >
          <svg
            className={`w-[18px] h-[18px] transition-colors ${favorite ? "text-rose-500" : "text-slate-400"}`}
            viewBox="0 0 24 24"
            fill={favorite ? "currentColor" : "none"}
            stroke="currentColor"
            strokeWidth="2"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
          </svg>
        </button>

        {/* Navigation photos */}
        {total > 1 && (
          <>
            <button
              type="button"
              aria-label="Photo précédente"
              onClick={(e) => changePhoto(e, -1)}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm shadow-sm flex items-center justify-center text-slate-600 hover:bg-white hover:scale-105 transition-all sm:opacity-0 sm:group-hover:opacity-100"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
            </button>
            <button
              type="button"
              aria-label="Photo suivante"
              onClick={(e) => changePhoto(e, 1)}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm shadow-sm flex items-center justify-center text-slate-600 hover:bg-white hover:scale-105 transition-all sm:opacity-0 sm:group-hover:opacity-100"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </button>
            <span className="absolute bottom-2.5 right-2.5 bg-black/55 backdrop-blur-sm text-white text-[11px] font-semibold px-2 py-0.5 rounded-full tabular-nums">
              {photo + 1}/{total}
            </span>
          </>
        )}
      </div>

      {/* Contenu */}
      <div className="flex-1 p-5 md:p-6 flex flex-col min-w-0">
        <h2 className="font-sans text-lg md:text-xl font-bold text-slate-900 leading-snug group-hover:text-[var(--accent)] transition-colors">
          Van aménagé {van.model} — {van.name}
        </h2>

        <p className="font-sans text-2xl font-black text-slate-900 mt-1.5">{van.price}</p>

        {/* Pastilles */}
        <div className="flex flex-wrap items-center gap-2 mt-3">
          <span
            title={
              van.vasp
                ? "Homologué camping-car (carte grise VASP)"
                : "Carte grise d'origine — aménagement non homologué VASP"
            }
            className={`text-xs font-bold px-2.5 py-1 rounded-md border ${
              van.vasp
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : "bg-amber-50 text-amber-700 border-amber-200"
            }`}
          >
            {van.vasp ? "VASP" : "Non VASP"}
          </span>
          <span
            className={`text-xs font-bold px-2.5 py-1 rounded-md border flex items-center gap-1.5 ${
              van.status === "Disponible"
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : "bg-slate-100 text-slate-500 border-slate-200"
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                van.status === "Disponible" ? "bg-emerald-500" : "bg-slate-400"
              }`}
            />
            {van.status}
          </span>
        </div>

        {/* Specs */}
        <p className="text-sm text-slate-500 font-medium mt-3">
          {van.year} · {van.mileage} · {van.energy} · {van.gearbox} · {van.seats} places
        </p>

        {/* Localisation + CTA */}
        <div className="mt-auto pt-4 flex items-end justify-between gap-3">
          <p className="text-sm text-slate-500 font-medium flex items-center gap-1.5 min-w-0">
            <svg className="w-4 h-4 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
            </svg>
            <span className="truncate">{van.locationLabel} · Pays Basque</span>
          </p>
          <span className="inline-flex items-center gap-1.5 text-sm font-bold text-[var(--accent)] group-hover:gap-2.5 transition-all shrink-0">
            Voir l&apos;annonce
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </span>
        </div>
      </div>
    </Link>
  );
}

export default function AchatLanding() {

  return (
    <div className="min-h-screen" style={{ background: "#F7F6F3" }}>

      {/* ── HEADER MARKETPLACE ── */}
      <section className="bg-white border-b border-slate-200/70 pt-10 pb-8 px-6">
        <div className="max-w-4xl mx-auto">
          {/* Fil d'ariane */}
          <nav aria-label="Fil d'ariane" className="flex items-center gap-1.5 text-xs font-medium text-slate-400 mb-6">
            <Link href="/" className="hover:text-slate-600 transition-colors">Accueil</Link>
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
            <span className="text-slate-600">Vans aménagés à vendre</span>
          </nav>

          <div className="flex flex-wrap items-end justify-between gap-6">
            <div className="max-w-2xl">
              <p className="text-xs font-bold uppercase tracking-widest text-[var(--accent)] mb-2">
                Marketplace Vanzon
              </p>
              <h1 className="font-sans text-3xl md:text-4xl font-black text-slate-900 tracking-tight leading-tight">
                Vans aménagés à vendre
              </h1>
              <p className="text-slate-500 text-base leading-relaxed mt-3">
                Achetez un fourgon aménagé d&apos;occasion en toute confiance : véhicules
                révisés, historique d&apos;entretien complet, aménagement éprouvé en
                conditions réelles et essai sur place avant achat.
              </p>
            </div>
            <div className="hidden md:block text-right pb-1">
              <p className="font-sans text-4xl font-black text-slate-900 leading-none">{VANS.length}</p>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mt-1">
                annonces en ligne
              </p>
            </div>
          </div>

          {/* Garanties */}
          <div className="mt-7 grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              {
                label: "Historique d'entretien complet",
                icon: (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                ),
              },
              {
                label: "Aménagement éprouvé en location",
                icon: (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437l1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008z" />
                ),
              },
              {
                label: "Essai sur place avant achat",
                icon: (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
                ),
              },
              {
                label: "Remise en main propre (64)",
                icon: (
                  <>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                  </>
                ),
              },
            ].map((item) => (
              <div
                key={item.label}
                className="flex items-center gap-2.5 bg-slate-50 border border-slate-100 rounded-xl px-3.5 py-3"
              >
                <svg className="w-4 h-4 text-[var(--accent)] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  {item.icon}
                </svg>
                <span className="text-xs font-semibold text-slate-600 leading-snug">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="pt-10" />

      {/* ── ANNONCES (style marketplace) ── */}
      <section className="pb-20 px-6">
        <div className="max-w-4xl mx-auto">
          {/* Barre résultats */}
          <div className="flex items-center justify-between mb-4 px-1">
            <p className="text-sm font-bold text-slate-900">
              {VANS.length} annonces
            </p>
            <p className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
              </svg>
              Pays Basque · remise en main propre
            </p>
          </div>

          <div className="flex flex-col gap-5">
            {VANS.map((van) => (
              <ListingCard key={van.id} van={van} />
            ))}
          </div>

          {/* Légende VASP */}
          <p className="text-xs text-slate-400 mt-4 px-1">
            Non VASP : le véhicule conserve sa carte grise d&apos;origine, l&apos;aménagement
            n&apos;est pas homologué camping-car. Une homologation VASP reste possible après
            achat (nous vous accompagnons dans les démarches).
          </p>
        </div>
      </section>

      {/* ── ACCOMPAGNEMENT ── */}
      <section className="px-6 pb-20">
        <div className="max-w-4xl mx-auto">
          <div className="bg-slate-900 rounded-3xl p-8 md:p-12 flex flex-col md:flex-row gap-8 items-center justify-between">
            <div className="max-w-lg">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">Service accompagnement</p>
              <h2 className="font-sans text-2xl md:text-3xl font-black text-white mb-3 leading-tight tracking-tight">
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

      {/* ── LIENS UTILES (maillage interne) ── */}
      <section className="px-6 pb-20">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-sans text-lg font-bold text-slate-900 tracking-tight mb-4">
            À découvrir aussi
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              {
                href: "/location",
                overline: "Location",
                title: "Louer un van aménagé au Pays Basque",
                text: "Essayez la vie en van avant d'acheter — nos vans sont disponibles à la location dès 1 jour, au départ de Cambo-les-Bains.",
              },
              {
                href: "/articles",
                overline: "Guides & conseils",
                title: "Bien choisir son van aménagé",
                text: "Guides d'achat, comparatifs de fourgons et conseils d'aménagement rédigés par notre équipe.",
              },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="group bg-white rounded-2xl border border-slate-200/80 p-6 hover:shadow-lg hover:border-slate-300 transition-all duration-300 flex flex-col"
              >
                <p className="text-[11px] font-bold uppercase tracking-widest text-[var(--accent)] mb-2">
                  {item.overline}
                </p>
                <h3 className="font-sans text-lg font-bold text-slate-900 leading-snug group-hover:text-[var(--accent)] transition-colors">
                  {item.title}
                </h3>
                <p className="text-sm text-slate-500 leading-relaxed mt-2 mb-4">{item.text}</p>
                <span className="mt-auto inline-flex items-center gap-1.5 text-sm font-bold text-[var(--accent)] group-hover:gap-2.5 transition-all">
                  Découvrir
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
