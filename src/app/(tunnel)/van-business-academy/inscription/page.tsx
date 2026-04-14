import type { Metadata } from "next";
import Image from "next/image";
import { Suspense } from "react";
import OptinForm from "./OptinForm";

export const metadata: Metadata = {
  title: "Formation Van Business Academy",
  description:
    "Découvrez comment créer un business rentable de van aménagé de A à Z, même sans expérience.",
  robots: { index: false, follow: false },
};

const VAN_PHOTOS = [
  {
    src: "https://cdn.sanity.io/images/lewexa74/production/9da403575f5e7fa290ec4c8a65e1705e0182c95a-2182x1362.png?auto=format&fit=max&q=82",
    alt: "Van aménagé Vanzon — extérieur",
  },
  {
    src: "https://cdn.sanity.io/images/lewexa74/production/0dce51f1f42fde5dd51529fe1c61b74221edcb4e-4032x3024.jpg?auto=format&fit=max&q=82",
    alt: "Van aménagé Vanzon — intérieur cuisine",
  },
  {
    src: "https://cdn.sanity.io/images/lewexa74/production/0ae4827be0c39318cca4f43ff1febb903a3541c1-4032x3024.jpg?auto=format&fit=max&q=82",
    alt: "Van aménagé Vanzon — intérieur espace de vie",
  },
  {
    src: "https://cdn.sanity.io/images/lewexa74/production/95175bcfd8540286b18ec3b7484e23f490bcf5dd-2000x1500.webp?auto=format&fit=max&q=82",
    alt: "Van aménagé Vanzon — vue d'ensemble",
  },
];

// Double the array for seamless infinite scroll
const MARQUEE_PHOTOS = [...VAN_PHOTOS, ...VAN_PHOTOS];

export default function OptinPage() {
  return (
    <div className="flex flex-col items-center min-h-[calc(100vh-80px)] pb-12">
      {/* Marquee photos */}
      <div className="w-full overflow-hidden mb-8">
        <div className="flex animate-scroll-banner gap-4 py-2" style={{ width: "max-content" }}>
          {MARQUEE_PHOTOS.map((photo, i) => (
            <div
              key={i}
              className="flex-shrink-0 rounded-2xl overflow-hidden shadow-md"
              style={{ width: 280, height: 190 }}
            >
              <Image
                src={photo.src}
                alt={photo.alt}
                width={280}
                height={190}
                unoptimized
                className="w-full h-full object-cover"
              />
            </div>
          ))}
        </div>
      </div>

      <div className="w-full max-w-lg px-4">
        {/* Badge */}
        <div className="flex justify-center mb-6">
          <span
            className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider px-4 py-1.5 rounded-full"
            style={{
              background: "rgba(185,148,95,0.10)",
              color: "#B9945F",
              border: "1px solid rgba(185,148,95,0.20)",
            }}
          >
            Van Business Academy
          </span>
        </div>

        {/* Titre */}
        <h1
          className="font-display text-3xl sm:text-4xl text-center leading-tight mb-4"
          style={{ color: "#0F172A" }}
        >
          Découvrez comment créer un business rentable de van aménagé de A à Z
        </h1>

        {/* Sous-titre */}
        <p className="text-center text-slate-500 text-base sm:text-lg mb-8 leading-relaxed">
          La vidéo gratuite qui vous explique exactement comment lancer votre propre activité
          de van aménagé, même sans expérience en mécanique ou en aménagement.
        </p>

        {/* Bénéfices */}
        <div className="space-y-3 mb-8">
          {[
            "Comment acheter, aménager et rentabiliser un van en partant de zéro",
            "La méthode pour générer des revenus récurrents avec la location",
            "Les erreurs qui coûtent des milliers d'euros (et comment les éviter)",
          ].map((item) => (
            <div key={item} className="flex items-start gap-3">
              <span
                className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center mt-0.5"
                style={{ background: "#10B981" }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              </span>
              <p className="text-slate-600 text-sm leading-relaxed">{item}</p>
            </div>
          ))}
        </div>

        {/* Formulaire */}
        <Suspense>
          <OptinForm />
        </Suspense>

        {/* Réassurance */}
        <p className="text-center text-xs text-slate-400 mt-6">
          Vos informations restent confidentielles. Pas de spam, promis.
        </p>
      </div>
    </div>
  );
}

