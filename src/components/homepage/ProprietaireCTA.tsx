import Link from "next/link";

export default function ProprietaireCTA() {
  return (
    <section className="py-16 bg-slate-50 border-y border-slate-100">
      <div className="max-w-4xl mx-auto px-6 text-center sm:text-left sm:flex sm:items-center sm:justify-between gap-8">
        <div>
          <h2 className="text-2xl font-black text-slate-900 mb-2">
            Propriétaire de van ? Référencez-le gratuitement.
          </h2>
          <p className="text-slate-500 text-base leading-relaxed max-w-xl">
            Votre van, une page dédiée, visible par des milliers de voyageurs.
            0% de commission pendant la phase de lancement.
          </p>
        </div>
        <div className="mt-6 sm:mt-0 flex-shrink-0">
          <Link
            href="/proprietaire"
            className="inline-flex items-center gap-2 btn-primary px-6 py-3 rounded-2xl text-sm font-semibold whitespace-nowrap"
          >
            Référencer mon van →
          </Link>
        </div>
      </div>
    </section>
  );
}
