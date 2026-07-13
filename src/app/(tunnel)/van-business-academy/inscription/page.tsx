import type { Metadata } from "next";
import { Suspense } from "react";
import Image from "next/image";
import OptinForm from "./OptinForm";
import PageViewTracker from "./PageViewTracker";
import VideoThumb from "./VideoThumb";
import DynamicTitle from "./DynamicTitle";

export const metadata: Metadata = {
  title: "Formation Van Business Academy",
  description:
    "Découvre comment créer un business rentable de van aménagé de A à Z, même sans expérience.",
  robots: { index: false, follow: false },
};

export default function OptinPage() {
  return (
    <div
      className="min-h-screen relative overflow-hidden"
      style={{ background: "#0A0A0A" }}
    >
      {/* Gradient glow effect behind content */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full pointer-events-none"
        style={{
          background:
            "radial-gradient(circle, rgba(185,148,95,0.22) 0%, rgba(228,211,152,0.12) 40%, transparent 70%)",
          filter: "blur(80px)",
        }}
      />

      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 py-10">
        <PageViewTracker />

        <div className="w-full max-w-lg mx-auto flex flex-col items-center">
          {/* Headline — dynamic A/B tested */}
          <DynamicTitle />

          {/* Bullet points */}
          <ul className="flex flex-col gap-3 mb-8 w-full">
            {[
              "Sans expérience en bricolage ou en mécanique",
              "En moins de 2h/jour, même si tu pars de zéro",
              "Avec des assurances et des plateformes qui sécurisent tes locations",
            ].map((text) => (
              <li key={text} className="flex items-start gap-3">
                <span
                  className="mt-0.5 text-lg flex-shrink-0"
                  style={{ color: "var(--gold)" }}
                >
                  ✓
                </span>
                <span className="text-white/70 text-sm sm:text-base">
                  {text}
                </span>
              </li>
            ))}
          </ul>

          {/* Video preview — thumbnail + play button → scroll to form */}
          <div className="w-full mb-8 rounded-2xl overflow-hidden relative">
            <div
              className="absolute inset-0 rounded-2xl pointer-events-none z-10"
              style={{ boxShadow: "inset 0 0 30px rgba(0,0,0,0.5)" }}
            />
            <VideoThumb />
          </div>

          {/* Form card — bump effect */}
          <div
            id="optin-form-card"
            className="w-full rounded-2xl p-6 sm:p-8 animate-[bump_0.4s_ease-out]"
            style={{
              background: "rgba(185,148,95,0.06)",
              border: "2px solid rgba(185,148,95,0.4)",
              boxShadow: "0 0 40px rgba(185,148,95,0.15)",
            }}
          >
            <div className="flex flex-col items-center mb-5">
              <span className="text-2xl mb-2">👇</span>
              <p className="text-white font-bold text-base sm:text-lg text-center">
                Réponds à 3 questions rapides pour accéder à la vidéo
              </p>
              <p className="text-white/40 text-xs mt-1">C&apos;est gratuit et ça prend 30 secondes</p>
            </div>

            <Suspense>
              <OptinForm />
            </Suspense>
          </div>

          <div className="mb-10" />

          {/* Trustpilot title */}
          <h2 className="text-xl sm:text-2xl font-bold text-white text-center mb-6">
            Ce qu&apos;ils pensent de nous
          </h2>

          {/* Trustpilot reviews */}
          <div className="w-full flex flex-col gap-5">
            {/* Sylvain */}
            <div
              className="rounded-2xl p-5 sm:p-6"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold"
                    style={{ background: "#00B67A" }}
                  >
                    S
                  </div>
                  <div>
                    <p className="text-white text-sm font-semibold">
                      sylvain delonca
                    </p>
                    <p className="text-white/40 text-xs">FR · 1 avis</p>
                  </div>
                </div>
                <p className="text-white/40 text-xs">2 déc. 2025</p>
              </div>
              <div className="flex gap-0.5 mb-3">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className="w-5 h-5 flex items-center justify-center"
                    style={{ background: "#00B67A" }}
                  >
                    <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 text-white" fill="currentColor">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                  </div>
                ))}
              </div>
              <p className="text-white/90 text-sm font-semibold mb-2">
                Avis Accompagnement Vanzon Explorer
              </p>
              <p className="text-white/60 text-sm leading-relaxed">
                Je tiens à remercier Jules pour sa formation dédiée à
                l&apos;aménagement de van. Depuis longtemps, j&apos;avais le rêve de
                partir explorer les massifs montagneux et plusieurs pays
                d&apos;Europe en van. Mais entre le prix d&apos;un véhicule et le coût
                d&apos;un aménagement professionnel, je savais que je devais
                apprendre à le faire moi-même.
              </p>
              <p className="text-white/60 text-sm leading-relaxed mt-2">
                Aujourd&apos;hui, je suis fier d&apos;avoir commencé mon propre
                aménagement, et je sais déjà que je ressentirai une immense
                gratitude le jour où je me réveillerai dans un van que
                j&apos;aurai construit de mes propres mains.
              </p>
              <p className="text-white/60 text-sm leading-relaxed mt-2 italic">
                Merci Vanzon pour cet accompagnement qui m&apos;a réellement aidé
                à transformer un rêve flou en un projet concret.
              </p>
            </div>

            {/* DA COSTA */}
            <div
              className="rounded-2xl p-5 sm:p-6"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold"
                    style={{ background: "#00B67A" }}
                  >
                    DC
                  </div>
                  <div>
                    <p className="text-white text-sm font-semibold">DA COSTA</p>
                    <p className="text-white/40 text-xs">FR · 2 avis</p>
                  </div>
                </div>
                <p className="text-white/40 text-xs">2 déc. 2025</p>
              </div>
              <div className="flex gap-0.5 mb-3">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className="w-5 h-5 flex items-center justify-center"
                    style={{ background: "#00B67A" }}
                  >
                    <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 text-white" fill="currentColor">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                  </div>
                ))}
              </div>
              <p className="text-white/90 text-sm font-semibold mb-2">
                Formation complète et accompagnement au top !
              </p>
              <p className="text-white/60 text-sm leading-relaxed">
                La structure est hyper intuitive, tout s&apos;emboîte
                parfaitement. J&apos;ai gagné un temps précieux et évité plein de
                tracas grâce aux supports prêts à l&apos;emploi. Les vidéos sont
                super bien faites et l&apos;accompagnement est vraiment
                bienveillant.
              </p>
              <p className="text-white/60 text-sm leading-relaxed mt-2">
                Aujourd&apos;hui, notre van est bien plus qu&apos;un véhicule :
                c&apos;est notre espace à nous, on se retrouve, on voyage, on
                profite... un vrai changement de vie ! Mille mercis !
              </p>
              <div className="mt-3 flex items-center gap-2">
                <span className="text-xs px-2 py-0.5 rounded" style={{ background: "rgba(0,182,122,0.15)", color: "#00B67A" }}>
                  Avis spontané
                </span>
                <span className="text-white/30 text-xs">26 septembre 2025</span>
              </div>
            </div>
          </div>

          {/* Trustpilot 5/5 */}
          <div className="flex flex-col items-center gap-3 mt-10">
            <Image
              src="/images/trustpilot-logo.png"
              alt="Trustpilot"
              width={280}
              height={40}
              unoptimized
              className="opacity-70"
            />
            <span className="text-white/50 text-sm font-medium">5 sur 5</span>
          </div>
        </div>
      </div>
    </div>
  );
}
