"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

export default function SigmaConfirmationClient() {
  const [firstname, setFirstname] = useState("");

  useEffect(() => {
    try {
      const raw = localStorage.getItem("sigma_funnel");
      if (raw) {
        const data = JSON.parse(raw);
        if (data.firstname) setFirstname(data.firstname);
      }
    } catch {}
  }, []);

  return (
    <div className="max-w-lg mx-auto px-4 py-16">
      {/* Logo */}
      <div className="flex justify-center mb-8">
        <Image
          src="/images/sigma-factory-logo.png"
          alt="Sigma Factory"
          width={160}
          height={48}
          unoptimized
        />
      </div>

      {/* Checkmark */}
      <div className="flex justify-center mb-6">
        <div className="w-14 h-14 rounded-full flex items-center justify-center bg-emerald-500">
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M20 6L9 17l-5-5" />
          </svg>
        </div>
      </div>

      {/* Title */}
      <h1 className="text-2xl sm:text-3xl font-bold text-center leading-tight mb-3 text-slate-900">
        C&apos;est confirme{firstname ? ` ${firstname}` : ""} !
      </h1>
      <p className="text-center text-slate-500 text-base mb-10">
        Ton appel strategique est reserve. Verifie ta boite email pour les details.
      </p>

      {/* What to expect */}
      <div className="rounded-xl p-6 mb-6 border border-slate-200 bg-slate-50">
        <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4">
          Ce qui t&apos;attend
        </h2>
        <div className="space-y-3">
          {[
            "On analyse ta situation financiere et ton profil investisseur",
            "On definit ensemble ta strategie IDRH personnalisee",
            "On voit si l'accompagnement Sigma Factory est fait pour toi",
          ].map((text) => (
            <div key={text} className="flex items-start gap-3">
              <span
                className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center mt-0.5"
                style={{ background: "rgba(185,148,95,0.12)" }}
              >
                <svg
                  width="10"
                  height="10"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#B9945F"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              </span>
              <p className="text-sm text-slate-600 leading-relaxed">{text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* How to prepare */}
      <div className="rounded-xl p-6 border border-slate-200 bg-slate-50">
        <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4">
          Comment te preparer
        </h2>
        <div className="space-y-3">
          {[
            "Note tes questions sur l'investissement immobilier",
            "Pense a ta situation financiere actuelle (revenus, credits en cours)",
            "Reflechis a tes objectifs patrimoniaux a 3-5 ans",
            "Installe-toi dans un endroit calme le jour de l'appel",
          ].map((text) => (
            <div key={text} className="flex items-start gap-3">
              <span
                className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center mt-0.5"
                style={{ background: "rgba(185,148,95,0.12)" }}
              >
                <svg
                  width="10"
                  height="10"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#B9945F"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              </span>
              <p className="text-sm text-slate-600 leading-relaxed">{text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
