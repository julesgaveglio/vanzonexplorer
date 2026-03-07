export default function ComparisonSection() {
  return (
    <section
      className="relative py-20 overflow-hidden"
      style={{ background: "#0F0A05" }}
    >
      {/* Image de fond subtile */}
      <div
        className="absolute inset-0 opacity-15 bg-cover bg-center"
        style={{
          backgroundImage:
            "url('https://cdn.sanity.io/images/lewexa74/production/28a2c5acbe2ee16169d4ace1ab0522481c43d356-1170x2080.jpg')",
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-[#0F0A05]/80 via-[#0F0A05]/60 to-[#0F0A05]/90" />

      <div className="relative max-w-5xl mx-auto px-6">
        {/* Badge + Titre */}
        <div className="text-center mb-14">
          <span
            className="inline-block px-4 py-2 rounded-full text-sm font-medium mb-6"
            style={{
              background: "rgba(205,167,123,0.15)",
              border: "1px solid rgba(205,167,123,0.35)",
              color: "#CDA77B",
            }}
          >
            💰 Comparatif réel
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-white">
            L&apos;investissement avec et sans accompagnement
          </h2>
          <p className="text-white/50 mt-3 max-w-xl mx-auto">
            Des chiffres réels issus de notre expérience terrain.
          </p>
        </div>

        {/* Deux cartes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
          {/* SANS accompagnement */}
          <div
            className="rounded-2xl p-6 md:p-8 border border-white/10"
            style={{ background: "rgba(255,255,255,0.06)" }}
          >
            <div className="flex items-center gap-2 mb-6">
              <span className="text-xl">❌</span>
              <h3 className="text-lg md:text-xl font-bold text-white">
                SANS l&apos;accompagnement
              </h3>
            </div>

            {/* Prix total */}
            <div className="mb-6">
              <span
                className="inline-block px-4 py-2 rounded-lg text-xl md:text-2xl font-black text-white"
                style={{ background: "rgba(220,38,38,0.25)" }}
              >
                23 626,28 €
              </span>
            </div>

            {/* Détails */}
            <ul className="space-y-3">
              {[
                { value: "12 900 €", label: "Véhicule" },
                { value: "10 726,28 €", label: "Aménagement" },
                { value: "8 mois", label: "Temps des travaux" },
                { value: "❌", label: "Pas d'exploitation à la location" },
                { value: "❌", label: "Mauvaise revente" },
              ].map((item) => (
                <li
                  key={item.label}
                  className="flex items-center gap-3 text-white/80 text-sm md:text-base"
                >
                  <span className="font-bold text-red-400 flex-shrink-0 min-w-[100px]">
                    {item.value}
                  </span>
                  <span className="text-white/40">→</span>
                  <span>{item.label}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* AVEC accompagnement */}
          <div
            className="rounded-2xl p-6 md:p-8 border"
            style={{
              background: "rgba(255,255,255,0.08)",
              borderColor: "rgba(205,167,123,0.3)",
            }}
          >
            <div className="flex items-center gap-2 mb-6">
              <span className="text-xl">✅</span>
              <h3 className="text-lg md:text-xl font-bold text-white">
                AVEC l&apos;accompagnement
              </h3>
            </div>

            {/* Prix total */}
            <div className="mb-6">
              <span
                className="inline-block px-4 py-2 rounded-lg text-xl md:text-2xl font-black text-white"
                style={{ background: "rgba(34,197,94,0.25)" }}
              >
                14 000 €
              </span>
            </div>

            {/* Détails */}
            <ul className="space-y-3">
              {[
                { value: "9 500 €", label: "Véhicule négocié" },
                { value: "4 500 €", label: "Aménagement" },
                { value: "3 mois", label: "Temps des travaux" },
                { value: "7 000 €/an", label: "Mise en location" },
                { value: "Revente", label: "optimisée" },
                { value: "Compétences", label: "Recommencer le process" },
              ].map((item) => (
                <li
                  key={item.label}
                  className="flex items-center gap-3 text-white/80 text-sm md:text-base"
                >
                  <span
                    className="font-bold flex-shrink-0 min-w-[100px]"
                    style={{ color: "#22C55E" }}
                  >
                    {item.value}
                  </span>
                  <span className="text-white/40">→</span>
                  <span>{item.label}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Ligne de synthèse */}
        <div className="mt-10 text-center">
          <p className="text-white/60 text-sm">
            Économie moyenne constatée :{" "}
            <span className="font-bold" style={{ color: "#CDA77B" }}>
              9 626 € + un van qui génère des revenus
            </span>
          </p>
        </div>
      </div>
    </section>
  );
}
