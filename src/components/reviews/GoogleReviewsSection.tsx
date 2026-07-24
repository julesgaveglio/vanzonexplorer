"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import type { GooglePlaceData } from "@/lib/google-places";

/** Logo « G » officiel de Google (4 couleurs). */
function GoogleG({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden>
      <path fill="#4285F4" d="M45.12 24.5c0-1.56-.14-3.06-.4-4.5H24v8.51h11.84c-.51 2.75-2.06 5.08-4.39 6.64v5.52h7.11c4.16-3.83 6.56-9.47 6.56-16.17z" />
      <path fill="#34A853" d="M24 46c5.94 0 10.92-1.97 14.56-5.33l-7.11-5.52c-1.97 1.32-4.49 2.1-7.45 2.1-5.73 0-10.58-3.87-12.31-9.07H4.34v5.7C7.96 41.07 15.4 46 24 46z" />
      <path fill="#FBBC05" d="M11.69 28.18C11.25 26.86 11 25.45 11 24s.25-2.86.69-4.18v-5.7H4.34C2.85 17.09 2 20.45 2 24s.85 6.91 2.34 9.88l7.35-5.7z" />
      <path fill="#EA4335" d="M24 10.75c3.23 0 6.13 1.11 8.41 3.29l6.31-6.31C34.91 4.18 29.93 2 24 2 15.4 2 7.96 6.93 4.34 14.12l7.35 5.7c1.73-5.2 6.58-9.07 12.31-9.07z" />
    </svg>
  );
}

/** Épingle Google Maps (teardrop bleu Google + point blanc). */
function GoogleMapsPin({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path
        fill="#1A73E8"
        d="M12 2C8.13 2 5 5.13 5 9c0 4.17 4.42 9.92 6.24 12.11.4.48 1.13.48 1.53 0C14.58 18.92 19 13.17 19 9c0-3.87-3.13-7-7-7z"
      />
      <circle cx="12" cy="9" r="2.6" fill="#ffffff" />
    </svg>
  );
}

function Stars({ rating, className = "" }: { rating: number; className?: string }) {
  return (
    <span className={`inline-flex ${className}`} aria-label={`${rating} sur 5`}>
      {[0, 1, 2, 3, 4].map((i) => (
        <svg key={i} viewBox="0 0 20 20" className="h-4 w-4" fill={i < Math.round(rating) ? "#FBBC05" : "#E2E8F0"} aria-hidden>
          <path d="M10 1.6l2.47 5.01 5.53.8-4 3.9.94 5.5L10 14.2l-4.94 2.6.94-5.5-4-3.9 5.53-.8z" />
        </svg>
      ))}
    </span>
  );
}

function Avatar({ name, photoUrl }: { name: string; photoUrl: string | null }) {
  // Certains profils Google (comptes sans photo, avatars par défaut retirés
  // par Google) renvoient une URL qui échoue au chargement : on bascule alors
  // sur les initiales plutôt que de laisser une image cassée.
  const [failed, setFailed] = useState(false);

  if (photoUrl && !failed) {
    return (
      <Image
        src={photoUrl}
        alt={name}
        width={40}
        height={40}
        className="h-10 w-10 shrink-0 rounded-full object-cover"
        unoptimized
        onError={() => setFailed(true)}
      />
    );
  }
  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-800 text-sm font-bold text-white">
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

/** Un avis, avec bouton « Lire la suite » quand le texte est long. */
function ReviewCard({ review }: { review: GooglePlaceData["reviews"][number] }) {
  const [expanded, setExpanded] = useState(false);
  // Au-delà de ~220 caractères le texte dépasse quasi toujours 6 lignes :
  // pas besoin du bouton s'il n'y a rien à couper.
  const isLong = review.text.length > 220;

  return (
    <div className="flex h-full w-[300px] shrink-0 snap-start flex-col rounded-2xl border border-slate-100 bg-white p-6 shadow-sm sm:w-[340px]">
      <div className="mb-4 flex items-center gap-3">
        <Avatar name={review.author} photoUrl={review.photoUrl} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            {review.authorUrl ? (
              <a
                href={review.authorUrl}
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="truncate text-sm font-semibold text-slate-900 hover:underline"
              >
                {review.author}
              </a>
            ) : (
              <span className="truncate text-sm font-semibold text-slate-900">{review.author}</span>
            )}
            <GoogleG className="h-4 w-4 shrink-0" />
          </div>
          {review.relativeTime && <div className="text-xs text-slate-400">{review.relativeTime}</div>}
        </div>
      </div>
      <Stars rating={review.rating} className="mb-3" />
      <p className={`flex-1 text-sm leading-relaxed text-slate-600 ${expanded ? "" : "line-clamp-6"}`}>
        {review.text}
      </p>
      {isLong && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-2 self-start text-xs font-semibold hover:underline"
          style={{ color: "var(--accent)" }}
        >
          {expanded ? "Voir moins" : "Voir tout l'avis"}
        </button>
      )}
    </div>
  );
}

/**
 * Section d'avis Google réels — connectée à l'API Place Details (voir
 * `getGooglePlaceData`).
 *
 * ⚠️ Plafond Google, pas un réglage de ce composant : l'API Place Details
 * (celle accessible avec une simple clé API) ne renvoie JAMAIS plus de 5 avis,
 * quel que soit le nombre demandé — c'est une limite dure documentée par
 * Google, aucun paramètre ne la lève. Récupérer la totalité des avis (ici 49)
 * demande l'API Google Business Profile, qui exige une connexion OAuth en
 * tant que propriétaire de la fiche (comme les intégrations GSC/Gmail déjà en
 * place dans ce repo) — une pièce distincte, pas une clé API. Cette section
 * affiche donc les 5 vrais avis + la note et le total réels, avec un lien
 * vers la fiche complète pour le reste.
 */
export default function GoogleReviewsSection({ data }: { data: GooglePlaceData }) {
  const reviews = data.reviews;
  const mapsUrl = data.mapsUrl ?? "https://maps.app.goo.gl/NqyLKueJCSzukQei7";
  const scrollerRef = useRef<HTMLDivElement>(null);

  const scrollByCard = (direction: 1 | -1) => {
    scrollerRef.current?.scrollBy({ left: direction * 356, behavior: "smooth" });
  };

  return (
    <section className="py-20" style={{ background: "linear-gradient(160deg, #F8FAFC 0%, #EFF6FF 100%)" }}>
      <div className="mx-auto max-w-6xl px-6">
        {/* En-tête officiel */}
        <div className="mb-10 flex flex-col items-center text-center">
          <span className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-sm">
            <GoogleMapsPin className="h-4 w-4" />
            Avis Google Maps vérifiés
          </span>
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
            <GoogleG className="h-8 w-8" />
            <span className="text-3xl font-black text-slate-900 md:text-4xl">{data.ratingDisplay}</span>
            <Stars rating={data.rating} />
            <span className="text-sm font-medium text-slate-500">{data.reviewCount} avis Google</span>
          </div>
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold transition-colors hover:underline"
            style={{ color: "var(--accent)" }}
          >
            Voir tous les avis sur Google Maps
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </a>
        </div>

        {/* Carrousel d'avis réels — défilement horizontal, flèches gauche/droite */}
        <div className="relative">
          <div
            ref={scrollerRef}
            className="flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-smooth pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {reviews.map((review) => (
              <ReviewCard key={`${review.author}-${review.time}`} review={review} />
            ))}
          </div>

          {reviews.length > 1 && (
            <div className="mt-5 flex justify-center gap-2">
              <button
                type="button"
                onClick={() => scrollByCard(-1)}
                aria-label="Avis précédents"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition-transform hover:scale-105 active:scale-95"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => scrollByCard(1)}
                aria-label="Avis suivants"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition-transform hover:scale-105 active:scale-95"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
