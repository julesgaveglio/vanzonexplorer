import type { Metadata } from "next";
import { Suspense } from "react";
import Image from "next/image";
import OptinForm from "./OptinForm";

export const metadata: Metadata = {
  title: "Sigma Factory | Strategie IDRH",
  description:
    "La methode qui permet de solder 60 a 100% de son credit immobilier en moins de 12 mois.",
  robots: { index: false, follow: false },
};

export default function SigmaOptinPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="flex flex-col items-center justify-center min-h-screen px-4 py-12">
        <div className="w-full max-w-lg mx-auto flex flex-col items-center">
          {/* Logo */}
          <Image
            src="/images/sigma-factory-logo.png"
            alt="Sigma Factory"
            width={200}
            height={60}
            unoptimized
            className="mb-10"
          />

          {/* Headline */}
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 text-center leading-tight mb-6">
            La methode qui permet de solder{" "}
            <span style={{ color: "#B9945F" }}>60 a 100%</span> de son credit
            immobilier en moins de{" "}
            <span style={{ color: "#B9945F" }}>12 mois</span>
          </h1>

          {/* Objections */}
          <ul className="flex flex-col gap-3 mb-10 w-full">
            {[
              "Sans apport",
              "Meme refuse par ta banque",
              "Meme avec un petit salaire",
              "Sans prendre de risque financier",
            ].map((text) => (
              <li key={text} className="flex items-center gap-3">
                <span
                  className="text-sm flex-shrink-0 font-bold"
                  style={{ color: "#B9945F" }}
                >
                  &#10003;
                </span>
                <span className="text-slate-600 text-sm sm:text-base">
                  {text}
                </span>
              </li>
            ))}
          </ul>

          {/* Form card */}
          <div className="w-full rounded-xl p-6 sm:p-8 border border-slate-200 bg-slate-50">
            <p className="text-slate-900 font-semibold text-base sm:text-lg text-center mb-1">
              Accede a la video de presentation
            </p>
            <p className="text-slate-400 text-xs text-center mb-6">
              C&apos;est gratuit — entre tes informations ci-dessous
            </p>

            <Suspense>
              <OptinForm />
            </Suspense>
          </div>

          {/* Trust badges */}
          <div className="flex items-center justify-center gap-6 mt-8">
            {["SNPI", "AMF", "ORIAS"].map((badge) => (
              <span
                key={badge}
                className="text-xs font-semibold tracking-wider text-slate-300"
              >
                {badge}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
