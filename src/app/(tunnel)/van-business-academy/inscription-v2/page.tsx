import type { Metadata } from "next";
import Image from "next/image";
import { Suspense } from "react";
import OptinFormV2 from "./OptinFormV2";
import PageViewTrackerV2 from "./PageViewTrackerV2";

export const metadata: Metadata = {
  title: "Formation Van Business Academy",
  description:
    "Découvre comment créer un business rentable de van aménagé de A à Z, même sans expérience.",
  robots: { index: false, follow: false },
};

export default function OptinPageV2() {
  return (
    <div className="min-h-[calc(100vh-80px)] flex flex-col">
      <PageViewTrackerV2 />

      {/* ── HERO — tout au-dessus de la ligne de flottaison ── */}
      <section className="flex-1 flex items-center justify-center px-4 py-8 sm:py-12">
        <div className="w-full max-w-5xl mx-auto">
          <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-14">

            {/* Colonne gauche — Copy + Form */}
            <div className="flex-1 max-w-lg w-full">
              {/* Badge */}
              <div className="flex items-center gap-2 mb-5">
                <span
                  className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider px-3 py-1 rounded-full"
                  style={{
                    background: "rgba(185,148,95,0.10)",
                    color: "#B9945F",
                    border: "1px solid rgba(185,148,95,0.20)",
                  }}
                >
                  Video gratuite — 15 min
                </span>
              </div>

              {/* Headline */}
              <h1
                className="font-display text-3xl sm:text-4xl lg:text-[2.6rem] leading-[1.15] mb-4"
                style={{ color: "#0F172A" }}
              >
                Transforme un utilitaire a{" "}
                <span style={{ color: "#B9945F" }}>8 000 EUR</span> en source de
                revenus{" "}
                <span className="underline decoration-[#B9945F] decoration-2 underline-offset-4">
                  recurrents
                </span>
              </h1>

              {/* Sous-titre */}
              <p className="text-slate-500 text-base sm:text-lg mb-6 leading-relaxed">
                La methode complete pour acheter, amenager et mettre en location
                un van — meme{" "}
                <strong className="text-slate-700">
                  sans experience en bricolage
                </strong>
                .
              </p>

              {/* Chiffre-preuve */}
              <div
                className="flex items-center gap-3 mb-7 px-4 py-3 rounded-xl"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(185,148,95,0.08) 0%, rgba(228,211,152,0.08) 100%)",
                  border: "1px solid rgba(185,148,95,0.15)",
                }}
              >
                <span
                  className="text-2xl font-bold"
                  style={{ color: "#B9945F" }}
                >
                  5 575 EUR
                </span>
                <span className="text-sm text-slate-500 leading-tight">
                  generes en 8 mois avec
                  <br />
                  un seul van — chiffres reels
                </span>
              </div>

              {/* Formulaire */}
              <Suspense>
                <OptinFormV2 />
              </Suspense>

              {/* Reassurance */}
              <p className="text-xs text-slate-400 mt-3 text-center lg:text-left">
                Acces immediat — la video est disponible tout de suite apres
                inscription. Pas de spam.
              </p>
            </div>

            {/* Colonne droite — Visual proof */}
            <div className="flex-1 max-w-md w-full hidden lg:block">
              {/* Photo principale du van */}
              <div className="relative rounded-2xl overflow-hidden shadow-xl">
                <Image
                  src="https://cdn.sanity.io/images/lewexa74/production/c70a917e07fc97ffa4fb1fb7b934442a34b909c7-1920x1080.png"
                  alt="Van amenage Vanzon — interieur bois et rangements"
                  width={560}
                  height={315}
                  unoptimized
                  className="w-full h-auto"
                  priority
                />
                {/* Overlay stats */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-5">
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="text-white/70 text-xs uppercase tracking-wider">
                        Cout amenagement
                      </p>
                      <p className="text-white text-lg font-bold">5 430 EUR</p>
                    </div>
                    <div
                      className="w-px h-8"
                      style={{ background: "rgba(255,255,255,0.3)" }}
                    />
                    <div>
                      <p className="text-white/70 text-xs uppercase tracking-wider">
                        Valeur revente
                      </p>
                      <p className="text-white text-lg font-bold">
                        20 000+ EUR
                      </p>
                    </div>
                    <div
                      className="w-px h-8"
                      style={{ background: "rgba(255,255,255,0.3)" }}
                    />
                    <div>
                      <p className="text-white/70 text-xs uppercase tracking-wider">
                        Avis locataires
                      </p>
                      <p className="text-white text-lg font-bold">5/5 ★</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Mini temoignage */}
              <div
                className="mt-4 px-5 py-4 rounded-xl"
                style={{
                  background: "#FAFAFA",
                  border: "1px solid rgba(0,0,0,0.06)",
                }}
              >
                <p className="text-slate-600 text-sm italic leading-relaxed">
                  &ldquo;J&apos;ai commence sans savoir planter un clou.
                  Aujourd&apos;hui j&apos;ai 2 vans en location qui me
                  rapportent chaque mois.&rdquo;
                </p>
                <div className="flex items-center gap-2 mt-3">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                    style={{ background: "#B9945F" }}
                  >
                    J
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">
                      Jules
                    </p>
                    <p className="text-xs text-slate-400">
                      Fondateur Vanzon Explorer
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION 2 — Benefices (pour les scrolleurs) ── */}
      <section
        className="py-10 sm:py-14 px-4"
        style={{ background: "#FAFAFA" }}
      >
        <div className="max-w-3xl mx-auto">
          <h2
            className="text-center font-display text-xl sm:text-2xl mb-8"
            style={{ color: "#0F172A" }}
          >
            Ce que tu vas decouvrir dans cette video
          </h2>

          <div className="grid sm:grid-cols-2 gap-4 sm:gap-5">
            {[
              {
                icon: "🔧",
                title: "Acheter le bon vehicule",
                desc: "Le modele exact, le budget max, et les verifications mecaniques pour eviter les arnaques",
              },
              {
                icon: "📐",
                title: "Amenager sans competence",
                desc: "La methode etape par etape — meme si tu n'as jamais touche un tournevis",
              },
              {
                icon: "💰",
                title: "Rentabiliser avec la location",
                desc: "Les plateformes, les prix, l'assurance — tout est gere pour toi",
              },
              {
                icon: "📈",
                title: "Revendre avec plus-value",
                desc: "Comment un van a 15 000 EUR se revend 25 000 EUR apres 2 ans de location",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="flex gap-4 p-4 bg-white rounded-xl"
                style={{ border: "1px solid rgba(0,0,0,0.06)" }}
              >
                <span className="text-2xl flex-shrink-0">{item.icon}</span>
                <div>
                  <p className="font-semibold text-slate-800 text-sm mb-1">
                    {item.title}
                  </p>
                  <p className="text-slate-500 text-xs leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Mobile photo — visible uniquement sur mobile */}
          <div className="mt-8 lg:hidden">
            <div className="relative rounded-2xl overflow-hidden shadow-lg">
              <Image
                src="https://cdn.sanity.io/images/lewexa74/production/c70a917e07fc97ffa4fb1fb7b934442a34b909c7-1920x1080.png"
                alt="Van amenage Vanzon"
                width={560}
                height={315}
                unoptimized
                className="w-full h-auto"
              />
            </div>
          </div>

          {/* CTA repetition pour mobile */}
          <div className="mt-8 text-center lg:hidden">
            <a
              href="#optin-form-v2"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl text-white font-semibold text-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
              style={{
                background:
                  "linear-gradient(135deg, #B9945F 0%, #E4D398 100%)",
              }}
            >
              Voir la video gratuite →
            </a>
          </div>
        </div>
      </section>

      {/* ── SECTION 3 — Chiffres reels ── */}
      <section className="py-10 sm:py-14 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-6">
            Resultats reels — 1 van, 8 mois
          </p>
          <div className="grid grid-cols-3 gap-4 sm:gap-8">
            <div>
              <p
                className="text-2xl sm:text-3xl font-bold"
                style={{ color: "#B9945F" }}
              >
                12
              </p>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                reservations
              </p>
            </div>
            <div>
              <p
                className="text-2xl sm:text-3xl font-bold"
                style={{ color: "#B9945F" }}
              >
                5 575 EUR
              </p>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                de revenus bruts
              </p>
            </div>
            <div>
              <p
                className="text-2xl sm:text-3xl font-bold"
                style={{ color: "#B9945F" }}
              >
                100%
              </p>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                avis 5 etoiles
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
