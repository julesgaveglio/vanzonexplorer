export default function ComparisonSection() {
  return (
    <section className="relative py-20 overflow-hidden bg-white">
      <div className="max-w-5xl mx-auto px-6">
        {/* Badge + Titre */}
        <div className="text-center mb-14">
          <span
            className="inline-block px-4 py-2 rounded-full text-sm font-medium mb-6"
            style={{
              background: "rgba(185,148,95,0.08)",
              border: "1px solid rgba(185,148,95,0.25)",
              color: "#B9945F",
            }}
          >
            💰 Comparatif réel
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900">
            L&apos;investissement avec et sans accompagnement
          </h2>
          <p className="text-slate-400 mt-3 max-w-xl mx-auto">
            Des chiffres réels issus de notre expérience terrain.
          </p>
        </div>

        {/* Deux cartes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
          {/* SANS accompagnement */}
          <div className="rounded-2xl p-6 md:p-8 border border-slate-200 bg-slate-50">
            <div className="flex items-center gap-2 mb-6">
              <span className="text-xl">❌</span>
              <h3 className="text-lg md:text-xl font-bold text-slate-900">
                SANS l&apos;accompagnement
              </h3>
            </div>

            {/* Prix total */}
            <div className="mb-6">
              <span className="inline-block px-4 py-2 rounded-lg text-xl md:text-2xl font-black text-red-700 bg-red-50 border border-red-100">
                23 600 €
              </span>
            </div>

            {/* Détails */}
            <ul className="space-y-3">
              {[
                { value: "13 000 €", label: "Véhicule" },
                { value: "10 600 €", label: "Aménagement" },
                { value: "❌", label: "Pas d'homologation VASP" },
                { value: "8 mois", label: "Temps des travaux" },
                { value: "❌", label: "Pas d'exploitation à la location" },
                { value: "❌", label: "Mauvaise revente" },
              ].map((item) => (
                <li
                  key={item.label}
                  className="flex items-center gap-3 text-slate-600 text-sm md:text-base"
                >
                  <span className="font-bold text-red-500 flex-shrink-0 min-w-[100px]">
                    {item.value}
                  </span>
                  <span className="text-slate-300">→</span>
                  <span>{item.label}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* AVEC accompagnement */}
          <div
            className="rounded-2xl p-6 md:p-8 border shadow-sm"
            style={{ borderColor: "rgba(185,148,95,0.3)", background: "rgba(185,148,95,0.03)" }}
          >
            <div className="flex items-center gap-2 mb-6">
              <span className="text-xl">✅</span>
              <h3 className="text-lg md:text-xl font-bold text-slate-900">
                AVEC l&apos;accompagnement
              </h3>
            </div>

            {/* Prix total */}
            <div className="mb-6">
              <span className="inline-block px-4 py-2 rounded-lg text-xl md:text-2xl font-black text-emerald-700 bg-emerald-50 border border-emerald-100">
                15 000 €
              </span>
            </div>

            {/* Détails */}
            <ul className="space-y-3">
              {[
                { value: "10 000 €", label: "Véhicule négocié" },
                { value: "4 300 €", label: "Aménagement" },
                { value: "700 €", label: "Documents VASP pré-remplis" },
                { value: "3-4 mois", label: "Temps des travaux" },
                { value: "7 000 €/an", label: "Mise en location" },
                { value: "Revente", label: "optimisée" },
                { value: "Compétences", label: "Recommencer le process" },
              ].map((item) => (
                <li
                  key={item.label}
                  className="flex items-center gap-3 text-slate-600 text-sm md:text-base"
                >
                  <span className="font-bold flex-shrink-0 min-w-[100px]" style={{ color: "#16A34A" }}>
                    {item.value}
                  </span>
                  <span className="text-slate-300">→</span>
                  <span>{item.label}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Ligne de synthèse */}
        <div className="mt-10 text-center">
          <p className="text-slate-500 text-sm">
            Économie moyenne constatée :{" "}
            <span className="font-bold" style={{ color: "#B9945F" }}>
              8 600 € + un van qui génère des revenus
            </span>
          </p>
        </div>
      </div>
    </section>
  );
}
