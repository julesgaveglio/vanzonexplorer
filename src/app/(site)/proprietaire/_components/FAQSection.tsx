"use client";

import { useState } from "react";

const FAQ = [
  {
    q: "Est-ce que Vanzon gère les assurances ?",
    a: "Pas pour l'instant. Aujourd'hui, Vanzon redirige vers votre canal de réservation habituel. À terme, nous prévoyons de proposer directement une assurance tous risques couvrant à la fois le véhicule et le locataire lors de chaque réservation.",
  },
  {
    q: "Qui gère les réservations et les locataires ?",
    a: "Vous, entièrement. Vanzon vous amène de la visibilité et redirige les visiteurs vers votre annonce habituelle. La relation avec le locataire reste la vôtre.",
  },
  {
    q: "Mon van est déjà listé sur plusieurs plateformes. Est-ce compatible ?",
    a: "Oui, c'est même l'idée. Vanzon fonctionne en complément de ce que vous avez déjà en place.",
  },
  {
    q: "Combien de temps faut-il pour que ma page soit en ligne ?",
    a: "En général moins de 72h après réception de vos informations.",
  },
];

export default function FAQSection() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <div className="divide-y divide-slate-100">
      {FAQ.map((item, i) => (
        <div key={i}>
          <button
            type="button"
            onClick={() => setOpen(open === i ? null : i)}
            className="w-full flex items-center justify-between py-5 text-left gap-4 group"
          >
            <span className="text-slate-900 font-semibold text-base leading-snug group-hover:text-blue-600 transition-colors">
              {item.q}
            </span>
            <span
              className={`flex-shrink-0 w-6 h-6 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 transition-all ${
                open === i ? "rotate-45 border-blue-400 text-blue-500" : ""
              }`}
            >
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
            </span>
          </button>
          {open === i && (
            <p className="text-slate-500 text-sm leading-relaxed pb-5 pr-10">
              {item.a}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
